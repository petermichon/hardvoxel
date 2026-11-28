import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createDaemon } from "../src/daemon/server.js";

const spec = {
  version: 1,
  project: "my-app",
  services: {
    web: {
      image: "nginx:1.27-alpine",
      domain: "app.example.com",
      port: 80,
    },
  },
};

let dir;
let daemon;
let deployCalls;

function fakeDeployer() {
  return {
    async deploy(...args) {
      deployCalls.push(args);
    },
  };
}

function unixRequest(socketPath, method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? null : JSON.stringify(body);
    const headers = {};
    if (payload) {
      headers["content-type"] = "application/json";
      headers["content-length"] = Buffer.byteLength(payload);
    }

    const req = request({ socketPath, path, method, headers }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        resolve({ status: res.statusCode, body: text ? JSON.parse(text) : null });
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function apiRequest(port, method, path, options = {}) {
  const headers = {};
  if (options.body !== undefined) headers["content-type"] = "application/json";
  if (options.token) headers.authorization = `Bearer ${options.token}`;

  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function createToken(scopes = ["deploy", "read"]) {
  const response = await unixRequest(daemon.adminSocket, "POST", "/v1/admin/tokens", {
    name: "test",
    scopes,
  });
  expect(response.status).toBe(201);
  return response.body.token;
}

beforeEach(async () => {
  dir = mkdtempSync(join(tmpdir(), "hardvoxel-daemon-"));
  deployCalls = [];
  daemon = await createDaemon({
    statePath: join(dir, "state.db"),
    adminSocket: join(dir, "admin.sock"),
    apiHost: "127.0.0.1",
    apiPort: 0,
    deployer: fakeDeployer(),
  });
  await daemon.start();
});

afterEach(async () => {
  if (daemon) await daemon.close();
  if (dir) rmSync(dir, { recursive: true, force: true });
  daemon = undefined;
  dir = undefined;
});

describe("daemon skeleton", () => {
  test("serves health without a token", async () => {
    const response = await apiRequest(daemon.apiPort(), "GET", "/v1/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  test("rejects apply without a token", async () => {
    const response = await apiRequest(daemon.apiPort(), "POST", "/v1/projects/my-app/apply", {
      body: spec,
    });
    expect(response.status).toBe(401);
  });

  test("applies a spec and records a deployment", async () => {
    const token = await createToken();

    const applied = await apiRequest(daemon.apiPort(), "POST", "/v1/projects/my-app/apply", {
      token,
      body: spec,
    });
    expect(applied.status).toBe(202);
    expect(applied.body.project).toBe("my-app");
    expect(applied.body.status).toBe("pending");
    expect(applied.body.deployment_id).toBeString();
    expect(deployCalls).toHaveLength(1);
    expect(deployCalls[0][0]).toBe("my-app");

    const project = await apiRequest(daemon.apiPort(), "GET", "/v1/projects/my-app", { token });
    expect(project.status).toBe(200);
    expect(project.body.project).toBe("my-app");
    expect(project.body.spec.services.web.image).toBe("nginx:1.27-alpine");

    const deployment = await apiRequest(
      daemon.apiPort(),
      "GET",
      `/v1/deployments/${applied.body.deployment_id}`,
      { token },
    );
    expect(deployment.status).toBe(200);
    expect(deployment.body.status).toBe("pending");
    expect(deployment.body.spec.project).toBe("my-app");
  });

  test("rejects apply with a read-only token", async () => {
    const token = await createToken(["read"]);
    const response = await apiRequest(daemon.apiPort(), "POST", "/v1/projects/my-app/apply", {
      token,
      body: spec,
    });
    expect(response.status).toBe(403);
  });

  test("rejects an invalid spec", async () => {
    const token = await createToken();
    const response = await apiRequest(daemon.apiPort(), "POST", "/v1/projects/my-app/apply", {
      token,
      body: { project: "my-app", services: {} },
    });
    expect(response.status).toBe(400);
  });

  test("rejects a spec for a different project", async () => {
    const token = await createToken();
    const response = await apiRequest(daemon.apiPort(), "POST", "/v1/projects/my-app/apply", {
      token,
      body: { ...spec, project: "other-app" },
    });
    expect(response.status).toBe(400);
  });

  test("rejects an unknown token", async () => {
    const response = await apiRequest(daemon.apiPort(), "GET", "/v1/projects/my-app", {
      token: "hv_0000000000000000_nope",
    });
    expect(response.status).toBe(401);
  });

  test("lists and revokes tokens over the admin socket", async () => {
    const token = await createToken();

    const listed = await unixRequest(daemon.adminSocket, "GET", "/v1/admin/tokens");
    expect(listed.status).toBe(200);
    expect(listed.body.tokens).toHaveLength(1);
    expect(listed.body.tokens[0].name).toBe("test");

    const revoked = await unixRequest(
      daemon.adminSocket,
      "DELETE",
      `/v1/admin/tokens/${listed.body.tokens[0].id}`,
    );
    expect(revoked.status).toBe(200);

    const after = await apiRequest(daemon.apiPort(), "GET", "/v1/projects/my-app", { token });
    expect(after.status).toBe(401);
  });

  test("keeps the applied spec across a restart", async () => {
    const token = await createToken();
    const applied = await apiRequest(daemon.apiPort(), "POST", "/v1/projects/my-app/apply", {
      token,
      body: spec,
    });
    expect(applied.status).toBe(202);

    await daemon.close();
    daemon = await createDaemon({
      statePath: join(dir, "state.db"),
      adminSocket: join(dir, "admin.sock"),
      apiHost: "127.0.0.1",
      apiPort: 0,
      deployer: fakeDeployer(),
    });
    await daemon.start();

    const project = await apiRequest(daemon.apiPort(), "GET", "/v1/projects/my-app", { token });
    expect(project.status).toBe(200);
    expect(project.body.spec.services.web.image).toBe("nginx:1.27-alpine");
  });
});
