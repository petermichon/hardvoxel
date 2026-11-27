import { dockerOutput, runDocker } from "./docker.js";

/**
 * @param {string} project
 * @param {string} service
 */
export function containerName(project, service) {
  return `${project}-${service}`;
}

/**
 * Build the docker run arguments for one service.
 * @param {string} project
 * @param {string} serviceName
 * @param {{ image: string, ports: string[], env: Record<string, string>, volumes: string[], restart: string }} service
 */
export function buildRunArgs(project, serviceName, service) {
  const name = containerName(project, serviceName);
  const args = [
    "run",
    "-d",
    "--name",
    name,
    "--label",
    `hardvoxel.project=${project}`,
    "--label",
    `hardvoxel.service=${serviceName}`,
    "--restart",
    service.restart,
  ];

  for (const port of service.ports) args.push("-p", port);
  for (const [key, value] of Object.entries(service.env)) args.push("-e", `${key}=${value}`);
  for (const volume of service.volumes) args.push("-v", volume);

  args.push(service.image);
  return args;
}

/**
 * @param {{ project: string, services: Record<string, any> }} config
 */
export function up(config) {
  for (const [name, service] of Object.entries(config.services)) {
    console.log(`→ pulling ${service.image}`);
    runDocker(["pull", service.image]);

    console.log(`→ starting ${containerName(config.project, name)}`);
    runDocker(["rm", "-f", containerName(config.project, name)], { allowFailure: true });
    runDocker(buildRunArgs(config.project, name, service));
  }
  console.log("done");
}

/**
 * @param {{ project: string }} config
 */
export function down(config) {
  const ids = dockerOutput(["ps", "-aq", "--filter", `label=hardvoxel.project=${config.project}`]);

  if (!ids) {
    console.log(`no containers for ${config.project}`);
    return;
  }

  runDocker(["rm", "-f", ...ids.split("\n")]);
  console.log(`removed ${ids.split("\n").length} container(s)`);
}

/**
 * @param {{ project: string }} config
 */
export function status(config) {
  runDocker([
    "ps",
    "-a",
    "--filter",
    `label=hardvoxel.project=${config.project}`,
    "--format",
    "table {{.Names}}\t{{.Status}}\t{{.Image}}",
  ]);
}

/**
 * @param {{ project: string, services: Record<string, any> }} config
 * @param {string | undefined} serviceName
 */
export function logs(config, serviceName) {
  if (!serviceName) {
    const names = Object.keys(config.services);
    throw new Error(`choose a service: ${names.join(", ")}`);
  }
  if (!config.services[serviceName]) {
    throw new Error(
      `unknown service "${serviceName}"; available: ${Object.keys(config.services).join(", ")}`,
    );
  }
  runDocker(["logs", "-f", containerName(config.project, serviceName)]);
}
