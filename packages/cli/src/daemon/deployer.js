import {
  chmodSync,
  chownSync,
  copyFileSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { join } from "node:path";

import { containerName, networkAlias, networkName } from "./runtime.js";

export class DeployError extends Error {
  constructor(message) {
    super(message);
    this.name = "DeployError";
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripContainerName(name) {
  return String(name ?? "").replace(/^\//, "");
}

function secretPath(root, project, name) {
  return join(root, project, name);
}

function readSecret(root, project, name) {
  try {
    return readFileSync(secretPath(root, project, name), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new DeployError(`secret "${name}" was not found for project "${project}"`);
    }
    throw error;
  }
}

function prepareSecretMounts({ secretRoot, secretRunRoot, project, service, name }) {
  const mounts = [];

  for (const secret of service.secrets ?? []) {
    const source = secretPath(secretRoot, project, secret);
    let info;
    try {
      info = statSync(source);
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new DeployError(`secret "${secret}" was not found for project "${project}"`);
      }
      throw error;
    }
    if (!info.isFile()) throw new DeployError(`secret "${secret}" is not a file`);

    const directory = join(secretRunRoot, name);
    const copy = join(directory, secret);
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    copyFileSync(source, copy);
    chmodSync(copy, 0o400);

    if (process.getuid?.() === 0) {
      chownSync(copy, service.uid ?? 0, service.gid ?? 0);
    }

    mounts.push({ source: copy, target: `/run/secrets/${secret}`, readOnly: true });
  }

  return mounts;
}

function readEnvSecrets({ secretRoot, project, service }) {
  const env = {};
  for (const [key, secret] of Object.entries(service.env_from_secrets ?? {})) {
    env[key] = readSecret(secretRoot, project, secret);
  }
  return env;
}

function cleanupSecretCopies(secretRunRoot, name) {
  if (!name) return;
  rmSync(join(secretRunRoot, name), { recursive: true, force: true });
}

function containerIp(info, network) {
  const networks = info?.NetworkSettings?.Networks ?? {};
  const entry = networks[network] ?? Object.values(networks)[0];
  return entry?.IPAddress || null;
}

function publishedPort(info, containerPort) {
  const bindings = info?.NetworkSettings?.Ports?.[`${containerPort}/tcp`];
  if (!Array.isArray(bindings) || bindings.length === 0) return null;
  return bindings.find((binding) => binding.HostPort)?.HostPort ?? null;
}

export async function waitForHealth({ runtime, id, service, network }) {
  const info = await runtime.inspect(id);
  const health = service.healthcheck;

  if (health) {
    const port = health.port ?? service.port ?? 80;
    const timeoutMs = health.timeout * 1000;
    const intervalMs = health.interval * 1000;
    const deadline =
      Date.now() + (health.start_period + health.interval * (health.retries + 1)) * 1000;

    let lastError = null;

    while (Date.now() < deadline) {
      const current = await runtime.inspect(id);
      if (current.State?.Running === false || current.State?.Status === "exited") {
        throw new DeployError("container exited before becoming healthy");
      }

      const ip = containerIp(current, network);
      const hostPort = publishedPort(current, port);
      if (ip || hostPort) {
        const host = ip?.includes(":") ? `[${ip}]` : ip;
        const target = hostPort ? `127.0.0.1:${hostPort}` : `${host}:${port}`;
        const url = `http://${target}${health.path}`;
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
          if (response.status >= 200 && response.status < 400) return;
          lastError = new Error(`health check returned ${response.status}`);
        } catch (error) {
          lastError = error;
        }
      }

      await delay(intervalMs);
    }

    throw new DeployError(
      `health check timed out for ${health.path}${lastError ? `: ${lastError.message}` : ""}`,
    );
  }

  if (info.State?.Health?.Status) {
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      const current = await runtime.inspect(id);
      const status = current.State?.Health?.Status;
      if (status === "healthy") return;
      if (status === "unhealthy") {
        throw new DeployError("container health check reported unhealthy");
      }
      await delay(1000);
    }
    throw new DeployError("container health check timed out");
  }

  await delay(1000);
  const current = await runtime.inspect(id);
  if (current.State?.Running !== true) throw new DeployError("container is not running");
}

export function createDeployer(options) {
  const {
    state,
    runtime,
    ingress = null,
    secretRoot = "/var/lib/hardvoxel/secrets",
    secretRunRoot = "/var/lib/hardvoxel/run/secrets",
    healthCheck = waitForHealth,
    logger = console,
  } = options;

  if (!state || !runtime) throw new Error("state and runtime are required");

  const queues = new Map();

  function enqueue(project, task) {
    const previous = queues.get(project) ?? Promise.resolve();
    const run = previous.catch(() => {}).then(task);
    const tail = run
      .then(
        () => undefined,
        () => undefined,
      )
      .finally(() => {
        if (queues.get(project) === tail) queues.delete(project);
      });
    queues.set(project, tail);
    return run;
  }

  async function deploy(project, spec, deploymentId) {
    return enqueue(project, async () => {
      state.updateDeployment(deploymentId, "running");

      const prepared = [];
      const digests = {};
      const stopped = [];
      let existing = [];
      let currentName = null;

      try {
        await runtime.ensureNetwork(project);
        existing = await runtime.listContainers(project);

        for (const [serviceName, service] of Object.entries(spec.services)) {
          await runtime.pull(service.image);
          const digest = await runtime.imageDigest(service.image);
          if (digest) digests[serviceName] = digest;

          const strategy =
            service.strategy ?? ((service.volumes?.length ?? 0) > 0 ? "recreate" : "rolling");

          if (strategy === "recreate") {
            const oldForService = existing.filter(
              (container) =>
                container.Config?.Labels?.["hardvoxel.service"] === serviceName,
            );
            for (const old of oldForService) {
              if (old.State?.Running === false) continue;
              await runtime.stop(old.Id);
              stopped.push(old);
            }
          }

          const name = containerName(project, serviceName, deploymentId);
          currentName = name;
          const mounts = prepareSecretMounts({
            secretRoot,
            secretRunRoot,
            project,
            service,
            name,
          });
          const env = {
            ...service.env,
            ...readEnvSecrets({ secretRoot, project, service }),
          };

          const id = await runtime.create({
            name,
            image: service.image,
            network: networkName(project),
            aliases: [networkAlias(project, serviceName)],
            labels: {
              "hardvoxel.project": project,
              "hardvoxel.service": serviceName,
              "hardvoxel.deployment": deploymentId,
            },
            env,
            volumes: service.volumes ?? [],
            ports: [
              ...(service.ports ?? []),
              ...(service.healthcheck
                ? [`127.0.0.1::${service.healthcheck.port ?? service.port ?? 80}`]
                : []),
            ],
            restart: service.restart ?? "unless-stopped",
            resources: service.resources ?? null,
            mounts,
          });

          prepared.push({ id, name, serviceName });
          currentName = null;
          await runtime.start(id);
          await healthCheck({
            runtime,
            id,
            service,
            network: networkName(project),
            logger,
          });
        }

        state.setDeploymentDigests(deploymentId, digests);

        if (ingress) {
          const routes = [];
          for (const item of prepared) {
            const service = spec.services[item.serviceName];
            if (!service.domain) continue;

            const info = await runtime.inspect(item.id);
            const ip = containerIp(info, networkName(project));
            if (!ip) throw new DeployError(`no container IP found for ${item.name}`);
            routes.push({ host: service.domain, upstream: `${ip}:${service.port}` });
          }
          await ingress.setRoutes(routes);
        }

        for (const old of existing) {
          if (prepared.some((item) => item.id === old.Id)) continue;
          try {
            await runtime.remove(old.Id);
            cleanupSecretCopies(secretRunRoot, stripContainerName(old.Name));
          } catch (error) {
            logger.warn(`could not remove old container ${old.Id}: ${error.message}`);
          }
        }

        state.updateDeployment(deploymentId, "succeeded");
      } catch (error) {
        for (const item of prepared) {
          try {
            await runtime.remove(item.id);
          } catch {
            // Keep the original deployment error.
          }
          cleanupSecretCopies(secretRunRoot, item.name);
        }
        if (currentName) cleanupSecretCopies(secretRunRoot, currentName);

        for (const old of stopped) {
          try {
            await runtime.start(old.Id);
          } catch {
            // Best-effort recovery; the deployment is already failed.
          }
        }

        state.updateDeployment(deploymentId, "failed", error.message);
        throw error;
      }
    });
  }

  return { deploy };
}
