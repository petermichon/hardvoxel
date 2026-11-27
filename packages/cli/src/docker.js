import { spawnSync } from "node:child_process";

/**
 * Run docker and inherit stdio.
 * @param {string[]} args
 * @param {{ allowFailure?: boolean }} [options]
 */
export function runDocker(args, options = {}) {
  const result = spawnSync("docker", args, { stdio: "inherit" });
  if (result.error) {
    throw new Error(`could not run docker: ${result.error.message}`);
  }
  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(`docker ${args[0]} failed with exit code ${result.status}`);
  }
  return result;
}

/**
 * Run docker and capture stdout.
 * @param {string[]} args
 */
export function dockerOutput(args) {
  const result = spawnSync("docker", args, { encoding: "utf8" });
  if (result.error) {
    throw new Error(`could not run docker: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`docker ${args[0]} failed: ${(result.stderr || "").trim()}`);
  }
  return (result.stdout || "").trim();
}
