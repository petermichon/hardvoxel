import { createHash, randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
  name TEXT PRIMARY KEY,
  spec_json TEXT NOT NULL,
  spec_hash TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deployments (
  id TEXT PRIMARY KEY,
  project TEXT NOT NULL,
  spec_json TEXT NOT NULL,
  image_digests_json TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  finished_at TEXT,
  error TEXT
);

CREATE INDEX IF NOT EXISTS deployments_project_created
  ON deployments(project, created_at DESC);

CREATE TABLE IF NOT EXISTS tokens (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hash TEXT NOT NULL,
  scopes TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  expires_at TEXT,
  revoked_at TEXT
);
`;

function hashSpec(spec) {
  return createHash("sha256").update(JSON.stringify(spec)).digest("hex");
}

export class StateStore {
  constructor(path) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.db = new DatabaseSync(path);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA busy_timeout = 5000;");
    this.db.exec(SCHEMA);

    const columns = this.db.prepare("PRAGMA table_info(deployments)").all();
    if (!columns.some((column) => column.name === "image_digests_json")) {
      this.db.exec("ALTER TABLE deployments ADD COLUMN image_digests_json TEXT");
    }

    this.db
      .prepare("INSERT OR IGNORE INTO meta (key, value) VALUES (?, ?)")
      .run("schema_version", "1");
  }

  close() {
    this.db.close();
  }

  applyProject(project, spec) {
    const now = new Date().toISOString();
    const id = randomUUID();
    const specJson = JSON.stringify(spec);

    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db
        .prepare(
          `INSERT INTO projects (name, spec_json, spec_hash, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(name) DO UPDATE SET
             spec_json = excluded.spec_json,
             spec_hash = excluded.spec_hash,
             updated_at = excluded.updated_at`,
        )
        .run(project, specJson, hashSpec(spec), now);

      this.db
        .prepare(
          `INSERT INTO deployments (id, project, spec_json, status, created_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run(id, project, specJson, "pending", now);

      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }

    return { id, project, status: "pending", created_at: now };
  }

  getProject(project) {
    const row = this.db
      .prepare("SELECT name, spec_json, spec_hash, updated_at FROM projects WHERE name = ?")
      .get(project);
    if (!row) return null;
    return {
      project: row.name,
      spec: JSON.parse(row.spec_json),
      spec_hash: row.spec_hash,
      updated_at: row.updated_at,
    };
  }

  getDeployment(id) {
    const row = this.db
      .prepare(
        `SELECT id, project, spec_json, image_digests_json, status, created_at, finished_at, error
         FROM deployments WHERE id = ?`,
      )
      .get(id);
    if (!row) return null;
    return {
      id: row.id,
      project: row.project,
      spec: JSON.parse(row.spec_json),
      image_digests: row.image_digests_json ? JSON.parse(row.image_digests_json) : null,
      status: row.status,
      created_at: row.created_at,
      finished_at: row.finished_at,
      error: row.error,
    };
  }

  listDeployments(project) {
    return this.db
      .prepare(
        `SELECT id, project, image_digests_json, status, created_at, finished_at, error
         FROM deployments WHERE project = ? ORDER BY created_at DESC`,
      )
      .all(project)
      .map((row) => ({
        id: row.id,
        project: row.project,
        image_digests: row.image_digests_json ? JSON.parse(row.image_digests_json) : null,
        status: row.status,
        created_at: row.created_at,
        finished_at: row.finished_at,
        error: row.error,
      }));
  }

  updateDeployment(id, status, error = null) {
    const finishedAt = status === "succeeded" || status === "failed"
      ? new Date().toISOString()
      : null;
    this.db
      .prepare("UPDATE deployments SET status = ?, error = ?, finished_at = ? WHERE id = ?")
      .run(status, error, finishedAt, id);
  }

  setDeploymentDigests(id, digests) {
    this.db
      .prepare("UPDATE deployments SET image_digests_json = ? WHERE id = ?")
      .run(JSON.stringify(digests), id);
  }

  markInterruptedDeployments() {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `UPDATE deployments
         SET status = 'failed', error = ?, finished_at = ?
         WHERE status IN ('pending', 'running')`,
      )
      .run("daemon restarted before the deployment finished", now);
  }

  createToken(record) {
    this.db
      .prepare(
        `INSERT INTO tokens (id, name, hash, scopes, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        record.id,
        record.name,
        record.hash,
        JSON.stringify(record.scopes),
        record.createdAt,
        record.expiresAt,
      );
  }

  findToken(id) {
    const row = this.db.prepare("SELECT * FROM tokens WHERE id = ?").get(id);
    return row ?? null;
  }

  touchToken(id) {
    this.db
      .prepare("UPDATE tokens SET last_used_at = ? WHERE id = ?")
      .run(new Date().toISOString(), id);
  }

  listTokens() {
    return this.db
      .prepare(
        `SELECT id, name, scopes, created_at, last_used_at, expires_at, revoked_at
         FROM tokens ORDER BY created_at DESC`,
      )
      .all()
      .map((row) => ({
        id: row.id,
        name: row.name,
        scopes: JSON.parse(row.scopes),
        created_at: row.created_at,
        last_used_at: row.last_used_at,
        expires_at: row.expires_at,
        revoked_at: row.revoked_at,
      }));
  }

  revokeToken(id) {
    this.db
      .prepare("UPDATE tokens SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL")
      .run(new Date().toISOString(), id);
  }
}
