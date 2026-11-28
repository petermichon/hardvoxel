import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const TOKEN_RE = /^hv_([a-f0-9]{16})_([A-Za-z0-9_-]+)$/;
const DEFAULT_EXPIRY_DAYS = 90;

export function hashToken(secret) {
  return createHash("sha256").update(secret).digest("hex");
}

export function createTokenRecord({ name, scopes, expiresInDays = DEFAULT_EXPIRY_DAYS }) {
  const id = randomBytes(8).toString("hex");
  const secret = randomBytes(32).toString("base64url");
  const token = `hv_${id}_${secret}`;
  const createdAt = new Date();

  let expiresAt = null;
  if (expiresInDays !== null) {
    expiresAt = new Date(createdAt.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
  }

  return {
    id,
    token,
    hash: hashToken(secret),
    name,
    scopes,
    createdAt: createdAt.toISOString(),
    expiresAt,
  };
}

export function parseBearerToken(header) {
  if (typeof header !== "string") return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return null;

  const token = match[1].trim();
  const tokenMatch = TOKEN_RE.exec(token);
  if (!tokenMatch) return null;

  return { id: tokenMatch[1], secret: tokenMatch[2] };
}

export function verifyToken(record, secret) {
  if (!record || record.revoked_at) return false;
  if (record.expires_at && Date.parse(record.expires_at) <= Date.now()) return false;

  const expected = Buffer.from(record.hash, "hex");
  const actual = Buffer.from(hashToken(secret), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function hasScope(record, scope) {
  try {
    const scopes = JSON.parse(record.scopes);
    return Array.isArray(scopes) && scopes.includes(scope);
  } catch {
    return false;
  }
}
