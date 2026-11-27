import { spawnSync } from "node:child_process";

/** The container CLI. Docker by default; set HARDVOXEL_DOCKER=podman for Podman. */
export const DOCKER = process.env.HARDVOXEL_DOCKER || "docker";

/**
 * Run the container CLI and inherit stdio.
 * @param {string[]} args
 * @param {{ allowFailure?: boolean }} [options]
 */
export function runDocker(args, options = {}) {
  const result = spawnSync(DOCKER, args, { stdio: "inherit" });
  if (result.error) {
    throw new Error(`could not run ${DOCKER}: ${result.error.message}`);
  }
  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`${DOCKER} ${args[0]} failed with exit code ${result.status}`);
  }
  return result;
}

/**
 * Run docker and capture stdout.
 * @param {string[]} args
 */
export function dockerOutput(args) {
  const result = spawnSync(DOCKER, args, { encoding: "utf8" });
  if (result.error) {
    throw new Error(`could not run ${DOCKER}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${DOCKER} ${args[0]} failed: ${(result.stderr || "").trim()}`);
  }
  return (result.stdout || "").trim();
}
