import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const NAME_RE = /^[a-z0-9][a-z0-9-]{0,62}$/;
const SECRET_RE = /^[a-z0-9][a-z0-9_-]{0,62}$/;
const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const PORT_RE = /^(\d{1,5}):(\d{1,5})(?:\/(?:tcp|udp))?$/;
const MEMORY_RE = /^\d+(?:\.\d+)?[kmg]?$/i;
const ENV_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const RESTART_POLICIES = new Set(["no", "always", "unless-stopped", "on-failure"]);
const STRATEGIES = new Set(["rolling", "recreate"]);

const TOP_LEVEL_KEYS = new Set(["version", "project", "services"]);
const SERVICE_KEYS = new Set([
  "image",
  "ports",
  "domain",
  "port",
  "env",
  "secrets",
  "env_from_secrets",
  "volumes",
  "restart",
  "healthcheck",
  "resources",
  "strategy",
  "uid",
  "gid",
]);
const HEALTHCHECK_KEYS = new Set(["path", "port", "interval", "timeout", "retries", "start_period"]);
const RESOURCE_KEYS = new Set(["cpus", "memory"]);

function fail(source, message) {
  throw new Error(`${source}: ${message}`);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertObject(value, source, label) {
  if (!isObject(value)) fail(source, `${label} must be an object`);
}

function assertKnownKeys(value, allowed, source, label) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(source, `${label}.${key} is not supported`);
  }
}

function assertName(value, source, label) {
  if (typeof value !== "string" || !NAME_RE.test(value)) {
    fail(source, `${label} must match ${NAME_RE}`);
  }
}

function parseVersion(value, source) {
  if (value === undefined) return 1;
  if (value !== 1) fail(source, "version must be 1");
  return 1;
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

function parsePorts(value, source, label) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail(source, `${label} must be an array of "host:container" strings`);
  return value.map((port, index) => parsePort(port, source, `${label}[${index}]`));
}

function parseEnv(value, source, label) {
  if (value === undefined) return {};
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail(source, `${label} must be an object of string values`);
  }
  const env = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!ENV_RE.test(key)) {
      fail(source, `${label}.${key} is not a valid environment variable name`);
    }
    if (!["string", "number", "boolean"].includes(typeof raw)) {
      fail(source, `${label}.${key} must be a string, number, or boolean`);
    }
    env[key] = String(raw);
  }
  return env;
}

function parseSecretNames(value, source, label) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail(source, `${label} must be an array of secret names`);
  const seen = new Set();
  return value.map((secret, index) => {
    if (typeof secret !== "string" || !SECRET_RE.test(secret)) {
      fail(source, `${label}[${index}] must match ${SECRET_RE}`);
    }
    if (seen.has(secret)) fail(source, `${label} contains duplicate secret "${secret}"`);
    seen.add(secret);
    return secret;
  });
}

function parseEnvFromSecrets(value, source, label) {
  if (value === undefined) return {};
  assertObject(value, source, label);
  const result = {};
  for (const [key, secret] of Object.entries(value)) {
    if (!ENV_RE.test(key)) {
      fail(source, `${label}.${key} is not a valid environment variable name`);
    }
    if (typeof secret !== "string" || !SECRET_RE.test(secret)) {
      fail(source, `${label}.${key} must be a secret name matching ${SECRET_RE}`);
    }
    result[key] = secret;
  }
  return result;
}

function parseDomain(value, source, label) {
  if (value === undefined) return null;
  if (typeof value !== "string" || !DOMAIN_RE.test(value)) {
    fail(source, `${label} must be a lowercase hostname such as "app.example.com"`);
  }
  return value;
}

function parseContainerPort(value, source, label) {
  if (value === undefined) return null;
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    fail(source, `${label} must be an integer between 1 and 65535`);
  }
  return value;
}

function parseVolumes(value, source, label, options = {}) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    fail(source, `${label} must be an array of "source:target" strings`);
  }
  return value.map((volume, index) => {
    if (typeof volume !== "string" || !volume.includes(":")) {
      fail(source, `${label}[${index}] must look like "data:/data"`);
    }
    if (options.namedOnly && !/^[a-z0-9][a-z0-9_-]{0,62}:\/[^\s:]+$/.test(volume)) {
      fail(source, `${label}[${index}] must be a named volume like "data:/data"`);
    }
    return volume;
  });
}

function parseUid(value, source, label) {
  if (value === undefined) return 0;
  if (!Number.isInteger(value) || value < 0) {
    fail(source, `${label} must be a non-negative integer`);
  }
  return value;
}

function parseStrategy(value, source, label, volumeCount) {
  if (value === undefined) return volumeCount > 0 ? "recreate" : "rolling";
  if (!STRATEGIES.has(value)) {
    fail(source, `${label} must be one of ${[...STRATEGIES].join(", ")}`);
  }
  return value;
}

function parseHealthcheck(value, source, label) {
  if (value === undefined) return null;
  assertObject(value, source, label);
  assertKnownKeys(value, HEALTHCHECK_KEYS, source, label);

  if (typeof value.path !== "string" || !value.path.startsWith("/")) {
    fail(source, `${label}.path must be a path starting with "/"`);
  }

  const port = parseContainerPort(value.port, source, `${label}.port`);
  const interval = parsePositiveInteger(value.interval ?? 5, source, `${label}.interval`);
  const timeout = parsePositiveInteger(value.timeout ?? 3, source, `${label}.timeout`);
  const retries = parsePositiveInteger(value.retries ?? 3, source, `${label}.retries`);
  const startPeriod = parsePositiveInteger(
    value.start_period ?? 0,
    source,
    `${label}.start_period`,
    { allowZero: true },
  );

  return {
    path: value.path,
    port,
    interval,
    timeout,
    retries,
    start_period: startPeriod,
  };
}

function parsePositiveInteger(value, source, label, options = {}) {
  const minimum = options.allowZero ? 0 : 1;
  if (!Number.isInteger(value) || value < minimum) {
    fail(source, `${label} must be an integer >= ${minimum}`);
  }
  return value;
}

function parseResources(value, source, label) {
  if (value === undefined) return null;
  assertObject(value, source, label);
  assertKnownKeys(value, RESOURCE_KEYS, source, label);

  const resources = {};
  if (value.cpus !== undefined) {
    if (typeof value.cpus !== "number" || !Number.isFinite(value.cpus) || value.cpus <= 0) {
      fail(source, `${label}.cpus must be a positive number`);
    }
    resources.cpus = value.cpus;
  }
  if (value.memory !== undefined) {
    if (typeof value.memory !== "string" || !MEMORY_RE.test(value.memory)) {
      fail(source, `${label}.memory must look like "256m" or "1g"`);
    }
    resources.memory = value.memory;
  }
  if (Object.keys(resources).length === 0) {
    fail(source, `${label} must set cpus or memory`);
  }
  return resources;
}

function parseService(raw, source, name, options = {}) {
  const label = `services.${name}`;
  assertObject(raw, source, label);
  assertKnownKeys(raw, SERVICE_KEYS, source, label);

  if (typeof raw.image !== "string" || raw.image.trim() === "") {
    fail(source, `${label}.image is required`);
  }

  const ports = parsePorts(raw.ports, source, `${label}.ports`);
  const domain = parseDomain(raw.domain, source, `${label}.domain`);
  const port = parseContainerPort(raw.port, source, `${label}.port`);

  if (domain && port === null) {
    fail(source, `${label}.port is required when domain is set`);
  }
  if (domain && ports.length > 0) {
    fail(source, `${label}.ports cannot be used with domain; Caddy owns 80/443`);
  }

  const env = parseEnv(raw.env, source, `${label}.env`);
  const secrets = parseSecretNames(raw.secrets, source, `${label}.secrets`);
  const envFromSecrets = parseEnvFromSecrets(
    raw.env_from_secrets,
    source,
    `${label}.env_from_secrets`,
  );

  for (const [key, secret] of Object.entries(envFromSecrets)) {
    if (key in env) {
      fail(source, `${label}.${key} is defined in both env and env_from_secrets`);
    }
    if (!secrets.includes(secret)) {
      fail(source, `${label}.env_from_secrets.${key} references "${secret}" but it is not in secrets`);
    }
  }

  const volumes = parseVolumes(raw.volumes, source, `${label}.volumes`, {
    namedOnly: options.mode === "daemon",
  });

  const restart = raw.restart ?? "unless-stopped";
  if (!RESTART_POLICIES.has(restart)) {
    fail(source, `${label}.restart must be one of ${[...RESTART_POLICIES].join(", ")}`);
  }

  return {
    image: raw.image,
    ports,
    domain,
    port,
    env,
    secrets,
    env_from_secrets: envFromSecrets,
    volumes,
    restart,
    healthcheck: parseHealthcheck(raw.healthcheck, source, `${label}.healthcheck`),
    resources: parseResources(raw.resources, source, `${label}.resources`),
    strategy: parseStrategy(raw.strategy, source, `${label}.strategy`, volumes.length),
    uid: parseUid(raw.uid, source, `${label}.uid`),
    gid: parseUid(raw.gid, source, `${label}.gid`),
  };
}

/**
 * Validate an already-parsed config object.
 * @param {unknown} raw
 * @param {string} [source]
 */
export function validateConfig(raw, source = "hardvoxel.json", options = {}) {
  assertObject(raw, source, "config");
  assertKnownKeys(raw, TOP_LEVEL_KEYS, source, "config");

  const version = parseVersion(raw.version, source);
  assertName(raw.project, source, "project");

  assertObject(raw.services, source, "services");
  const names = Object.keys(raw.services);
  if (names.length === 0) {
    fail(source, "services must contain at least one service");
  }

  const services = {};
  for (const name of names) {
    assertName(name, source, `service name "${name}"`);
    services[name] = parseService(raw.services[name], source, name, options);
  }

  return { version, project: raw.project, services };
}

/**
 * Parse and validate a hardvoxel.json document.
 * @param {string} text
 * @param {string} [source]
 */
export function parseConfig(text, source = "hardvoxel.json", options = {}) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(source, `invalid JSON: ${error.message}`);
  }
  return validateConfig(raw, source, options);
}

/**
 * Load and validate a config file.
 * @param {string} cwd
 * @param {string} [file]
 */
export function loadConfig(cwd, file = "hardvoxel.json", options = {}) {
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
  return parseConfig(text, path, options);
}
