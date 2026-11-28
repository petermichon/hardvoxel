import { createTokenRecord, hasScope, parseBearerToken, verifyToken } from "./auth.js";
import { validateConfig } from "../config.js";

const MAX_BODY_BYTES = 1024 * 1024;
const ALLOWED_SCOPES = new Set(["deploy", "read"]);

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...extraHeaders,
  });
  res.end(payload);
}

async function readJson(req) {
  let size = 0;
  const chunks = [];

  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new HttpError(413, "request body is too large");
    }
    chunks.push(chunk);
  }

  if (size === 0) throw new HttpError(400, "request body is required");

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "request body must be valid JSON");
  }
}

function requireToken(req, state, scope) {
  const token = parseBearerToken(req.headers.authorization);
  if (!token) throw new HttpError(401, "missing bearer token");

  const record = state.findToken(token.id);
  if (!record || !verifyToken(record, token.secret)) {
    throw new HttpError(401, "invalid token");
  }

  if (scope && !hasScope(record, scope)) {
    throw new HttpError(403, `token lacks the ${scope} scope`);
  }

  state.touchToken(record.id);
  return record;
}

function decodePart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new HttpError(400, "invalid URL encoding");
  }
}

async function handleAdmin(req, res, parts, state) {
  if (req.method === "POST" && parts.join("/") === "v1/admin/tokens") {
    const body = await readJson(req);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new HttpError(400, "request body must be a JSON object");
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 64) {
      throw new HttpError(400, "name is required and must be at most 64 characters");
    }

    const rawScopes = body.scopes ?? ["deploy", "read"];
    if (!Array.isArray(rawScopes) || rawScopes.length === 0) {
      throw new HttpError(400, "scopes must be a non-empty array");
    }
    for (const scope of rawScopes) {
      if (typeof scope !== "string" || !ALLOWED_SCOPES.has(scope)) {
        throw new HttpError(400, "scopes may only contain deploy and read");
      }
    }
    const scopes = [...new Set(rawScopes)];

    const expiresInDays = body.expires_in_days === undefined ? 90 : body.expires_in_days;
    if (
      expiresInDays !== null &&
      (!Number.isInteger(expiresInDays) || expiresInDays < 1)
    ) {
      throw new HttpError(400, "expires_in_days must be a positive integer or null");
    }

    const record = createTokenRecord({ name, scopes, expiresInDays });
    state.createToken(record);

    return sendJson(res, 201, {
      id: record.id,
      token: record.token,
      name: record.name,
      scopes: record.scopes,
      expires_at: record.expiresAt,
    });
  }

  if (req.method === "GET" && parts.join("/") === "v1/admin/tokens") {
    return sendJson(res, 200, { tokens: state.listTokens() });
  }

  if (
    req.method === "DELETE" &&
    parts.length === 4 &&
    parts[0] === "v1" &&
    parts[1] === "admin" &&
    parts[2] === "tokens"
  ) {
    const id = decodePart(parts[3]);
    if (!/^[a-f0-9]{16}$/.test(id)) throw new HttpError(400, "invalid token id");
    if (!state.findToken(id)) throw new HttpError(404, "token not found");
    state.revokeToken(id);
    return sendJson(res, 200, { revoked: true });
  }

  throw new HttpError(404, "not found");
}

async function handleApi(req, res, parts, state, deployer) {
  if (
    req.method === "POST" &&
    parts.length === 4 &&
    parts[0] === "v1" &&
    parts[1] === "projects" &&
    parts[3] === "apply"
  ) {
    requireToken(req, state, "deploy");
    const project = decodePart(parts[2]);
    const body = await readJson(req);

    let spec;
    try {
      spec = validateConfig(body, "request body", { mode: "daemon" });
    } catch (error) {
      throw new HttpError(400, error.message);
    }

    if (spec.project !== project) {
      throw new HttpError(
        400,
        `spec project "${spec.project}" does not match path project "${project}"`,
      );
    }

    const deployment = state.applyProject(project, spec);

    if (!deployer) throw new HttpError(500, "deployer is not configured");
    Promise.resolve()
      .then(() => deployer.deploy(project, spec, deployment.id))
      .catch((error) => {
        console.error(`hardvoxel-daemon: deployment ${deployment.id} failed: ${error.message}`);
      });

    return sendJson(res, 202, {
      deployment_id: deployment.id,
      project,
      status: deployment.status,
    });
  }

  if (req.method === "GET" && parts.length === 3 && parts[0] === "v1" && parts[1] === "projects") {
    requireToken(req, state, "read");
    const project = decodePart(parts[2]);
    const record = state.getProject(project);
    if (!record) throw new HttpError(404, "project not found");
    return sendJson(res, 200, record);
  }

  if (
    req.method === "GET" &&
    parts.length === 4 &&
    parts[0] === "v1" &&
    parts[1] === "projects" &&
    parts[3] === "deployments"
  ) {
    requireToken(req, state, "read");
    const project = decodePart(parts[2]);
    return sendJson(res, 200, { deployments: state.listDeployments(project) });
  }

  if (req.method === "GET" && parts.length === 3 && parts[0] === "v1" && parts[1] === "deployments") {
    requireToken(req, state, "read");
    const id = decodePart(parts[2]);
    const deployment = state.getDeployment(id);
    if (!deployment) throw new HttpError(404, "deployment not found");
    return sendJson(res, 200, deployment);
  }

  if (req.method === "POST" && parts.length === 4 && parts[0] === "v1" && parts[1] === "projects") {
    const action = parts[3];
    if (action === "rollback" || action === "stop") {
      requireToken(req, state, "deploy");
      throw new HttpError(501, `${action} is not implemented in this build`);
    }
  }

  if (req.method === "DELETE" && parts.length === 3 && parts[0] === "v1" && parts[1] === "projects") {
    requireToken(req, state, "deploy");
    throw new HttpError(501, "destroy is not implemented in this build");
  }

  if (
    req.method === "GET" &&
    parts.length === 4 &&
    parts[0] === "v1" &&
    parts[1] === "projects" &&
    parts[3] === "logs"
  ) {
    requireToken(req, state, "read");
    throw new HttpError(501, "logs are not implemented in this build");
  }

  throw new HttpError(404, "not found");
}

export function createHandler({ state, version, admin = false, deployer }) {
  return async function handler(req, res) {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      const parts = url.pathname.split("/").filter(Boolean);

      if (
        req.method === "GET" &&
        parts.length === 2 &&
        parts[0] === "v1" &&
        parts[1] === "health"
      ) {
        return sendJson(res, 200, { status: "ok", version });
      }

      if (admin) return await handleAdmin(req, res, parts, state);
      return await handleApi(req, res, parts, state, deployer);
    } catch (error) {
      if (error instanceof HttpError) {
        const headers = error.status === 401 ? { "www-authenticate": "Bearer" } : {};
        return sendJson(res, error.status, { error: error.message }, headers);
      }

      console.error("hardvoxel-daemon:", error);
      return sendJson(res, 500, { error: "internal error" });
    }
  };
}
