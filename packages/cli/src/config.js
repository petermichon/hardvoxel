import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const NAME_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;
const PORT_RE = /^(\d{1,5}):(\d{1,5})(?:\/(?:tcp|udp))?$/;
const RESTART_POLICIES = new Set(["no", "always", "unless-stopped", "on-failure"]);

function fail(source, message) {
  throw new Error(`${source}: ${message}`);
}

function assertName(value, source, label) {
  if (typeof value !== "string" || !NAME_RE.test(value)) {
    fail(source, `${label} must match ${NAME_RE}`);
  }
}

function parsePort(value, source, label) {
  if (typeof value !== "string") {
    fail(source, `${label} must be a string like "8080:80"`);
  }
  const match = PORT_RE.exec(value);
  if (!match) {
    fail(source, `${label} must look like "8080:80"`);
  }
  const host = Number(match[1]);
  const container = Number(match[2]);
  if (host < 1 || host > 65535 || container < 1 || container > 65535) {
    fail(source, `${label} port must be between 1 and 65535`);
  }
  return value;
}

function parseEnv(value, source, label) {
  if (value === undefined) return {};
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(source, `${label} must be an object of string values`);
  }
  const env = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      fail(source, `${label}.${key} is not a valid environment variable name`);
    }
    if (!["string", "number", "boolean"].includes(typeof raw)) {
      fail(source, `${label}.${key} must be a string, number, or boolean`);
    }
    env[key] = String(raw);
  }
  return env;
}

function parseVolumes(value, source, label) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    fail(source, `${label} must be an array of "source:target" strings`);
  }
  return value.map((volume, index) => {
    if (typeof volume !== "string" || !volume.includes(":")) {
      fail(source, `${label}[${index}] must look like "./data:/data"`);
    }
    return volume;
  });
}

function parseService(raw, source, name) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    fail(source, `services.${name} must be an object`);
  }

  if (typeof raw.image !== "string" || raw.image.trim() === "") {
    fail(source, `services.${name}.image is required`);
  }

  const ports = raw.ports ?? [];
  if (!Array.isArray(ports)) {
    fail(source, `services.${name}.ports must be an array`);
  }

  const restart = raw.restart ?? "unless-stopped";
  if (!RESTART_POLICIES.has(restart)) {
    fail(source, `services.${name}.restart must be one of ${[...RESTART_POLICIES].join(", ")}`);
  }

  return {
    image: raw.image,
    ports: ports.map((port, index) => parsePort(port, source, `services.${name}.ports[${index}]`)),
    env: parseEnv(raw.env, source, `services.${name}.env`),
    volumes: parseVolumes(raw.volumes, source, `services.${name}.volumes`),
    restart,
  };
}

/**
 * Parse and validate a hardvoxel.json document.
 * @param {string} text
 * @param {string} [source]
 */
export function parseConfig(text, source = "hardvoxel.json") {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(source, `invalid JSON: ${error.message}`);
  }

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    fail(source, "config must be a JSON object");
  }

  assertName(raw.project, source, "project");

  if (raw.services === null || typeof raw.services !== "object" || Array.isArray(raw.services)) {
    fail(source, "services must be an object");
  }

  const names = Object.keys(raw.services);
  if (names.length === 0) {
    fail(source, "services must contain at least one service");
  }

  const services = {};
  for (const name of names) {
    assertName(name, source, `service name "${name}"`);
    services[name] = parseService(raw.services[name], source, name);
  }

  return { project: raw.project, services };
}

/**
 * Load and validate a config file.
 * @param {string} cwd
 * @param {string} [file]
 */
export function loadConfig(cwd, file = "hardvoxel.json") {
  const path = resolve(cwd, file);
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error(`config not found: ${path}`);
    }
    throw error;
  }
  return parseConfig(text, path);
}
