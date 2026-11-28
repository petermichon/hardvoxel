import { execFile } from "node:child_process";

export class RuntimeError extends Error {
  constructor(code, message, stderr = "") {
    super(message);
    this.name = "RuntimeError";
    this.code = code;
    this.stderr = stderr;
  }
}

export function networkName(project) {
  return `hv-${project}`;
}

export function networkAlias(project, service) {
  return `hv-${project}-${service}`;
}

export function containerName(project, service, deploymentId) {
  const short = deploymentId.replace(/-/g, "").slice(0, 8);
  return `hv-${project}-${service}-${short}`;
}

export function buildCreateArgs(container) {
  const {
    name,
    image,
    network,
    aliases = [],
    labels = {},
    env = {},
    volumes = [],
    ports = [],
    restart = "unless-stopped",
    resources,
    mounts = [],
  } = container;

  if (!name || !image || !network) {
    throw new RuntimeError("failed", "container name, image, and network are required");
  }

  const args = ["create", "--name", name];

  for (const [key, value] of Object.entries(labels)) {
    args.push("--label", `${key}=${value}`);
  }

  args.push("--network", network);
  for (const alias of aliases) args.push("--network-alias", alias);
  args.push("--restart", restart);

  for (const [key, value] of Object.entries(env)) {
    args.push("--env", `${key}=${value}`);
  }
  for (const volume of volumes) args.push("--volume", volume);
  for (const port of ports) args.push("--publish", port);

  if (resources?.cpus !== undefined) args.push("--cpus", String(resources.cpus));
  if (resources?.memory !== undefined) args.push("--memory", resources.memory);

  for (const mount of mounts) {
    const options = ["type=bind", `source=${mount.source}`, `target=${mount.target}`];
    if (mount.readOnly !== false) options.push("readonly");
    args.push("--mount", options.join(","));
  }

  args.push(image);
  return args;
}

function toRuntimeError(command, args, error, stderr) {
  const text = `${stderr || ""}\n${error?.message || ""}`.trim();
  const lower = text.toLowerCase();

  let code = "failed";
  if (error?.code === "ENOENT") code = "unavailable";
  else if (
    /no such (container|network|image|object)|unable to find (container|network|image)|(container|network|image).*not found/.test(
      lower,
    )
  ) {
    code = "not_found";
  } else if (/already (exists|in use)|conflict/.test(lower)) code = "conflict";
  else if (/unauthorized|denied|authentication required|login required/.test(lower)) code = "auth";
  else if (/cannot connect to the docker daemon|is the docker daemon running|connection refused/.test(lower)) {
    code = "unavailable";
  }

  return new RuntimeError(
    code,
    `${command} ${args[0]} failed: ${text || "unknown error"}`,
    stderr || "",
  );
}

export function createRuntime(options = {}) {
  const command = options.command ?? process.env.HARDVOXEL_DOCKER ?? "docker";
  const execFileImpl = options.execFileImpl ?? execFile;

  function run(args) {
    return new Promise((resolve, reject) => {
      execFileImpl(
        command,
        args,
        { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
        (error, stdout, stderr) => {
          if (error) {
            reject(toRuntimeError(command, args, error, stderr));
            return;
          }
          resolve({ stdout: stdout ?? "", stderr: stderr ?? "" });
        },
      );
    });
  }

  async function pull(image) {
    await run(["pull", image]);
  }

  async function ensureNetwork(project) {
    const name = networkName(project);
    try {
      await run(["network", "inspect", name]);
      return;
    } catch (error) {
      if (!(error instanceof RuntimeError) || error.code !== "not_found") throw error;
    }
    await run(["network", "create", "--label", `hardvoxel.project=${project}`, name]);
  }

  async function create(container) {
    const { stdout } = await run(buildCreateArgs(container));
    const id = stdout.trim();
    if (!id) throw new RuntimeError("failed", "docker create returned no container id");
    return id;
  }

  async function start(id) {
    await run(["start", id]);
  }

  async function stop(id) {
    try {
      await run(["stop", id]);
    } catch (error) {
      if (!(error instanceof RuntimeError) || error.code !== "not_found") throw error;
    }
  }

  async function remove(id) {
    try {
      await run(["rm", "-f", id]);
    } catch (error) {
      if (!(error instanceof RuntimeError) || error.code !== "not_found") throw error;
    }
  }

  async function inspect(id) {
    const { stdout } = await run(["inspect", id]);
    let parsed;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      throw new RuntimeError("failed", "docker inspect returned invalid JSON");
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new RuntimeError("not_found", `container ${id} was not found`);
    }
    return parsed[0];
  }

  async function listContainers(project) {
    const { stdout } = await run([
      "ps",
      "-aq",
      "--filter",
      `label=hardvoxel.project=${project}`,
    ]);
    const ids = stdout
      .split(/\r?\n/)
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length === 0) return [];

    const { stdout: json } = await run(["inspect", ...ids]);
    return JSON.parse(json);
  }

  async function imageDigest(image) {
    const { stdout } = await run(["image", "inspect", image]);
    const parsed = JSON.parse(stdout);
    const info = parsed[0];
    return info?.RepoDigests?.[0] ?? info?.Id ?? null;
  }

  return {
    command,
    pull,
    ensureNetwork,
    create,
    start,
    stop,
    remove,
    inspect,
    listContainers,
    imageDigest,
  };
}
