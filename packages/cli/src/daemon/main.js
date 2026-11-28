import { createDaemon } from "./server.js";

const HELP = `hardvoxel-daemon — Hardvoxel control plane

Usage:
  hardvoxel-daemon [options]

Options:
  --state <path>          SQLite state file (default: /var/lib/hardvoxel/state.db)
  --api <host:port>       Loopback API for Caddy (default: 127.0.0.1:8787)
  --admin-socket <path>   Local admin socket (default: /run/hardvoxel/admin.sock)
  -h, --help              Show this message
`;

function needValue(argv, index, flag) {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new Error(`${flag} needs a value`);
  return value;
}

function parseApi(value) {
  const index = value.lastIndexOf(":");
  if (index < 0) throw new Error("--api must look like 127.0.0.1:8787");

  const host = value.slice(0, index) || "127.0.0.1";
  const port = Number(value.slice(index + 1));
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("--api port must be between 0 and 65535");
  }

  return { host, port };
}

export function parseArgs(argv) {
  const options = {
    statePath: "/var/lib/hardvoxel/state.db",
    apiHost: "127.0.0.1",
    apiPort: 8787,
    adminSocket: "/run/hardvoxel/admin.sock",
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "-h" || arg === "--help") {
      options.help = true;
    } else if (arg === "--state") {
      options.statePath = needValue(argv, ++index, arg);
    } else if (arg.startsWith("--state=")) {
      options.statePath = arg.slice("--state=".length);
    } else if (arg === "--api") {
      const api = parseApi(needValue(argv, ++index, arg));
      options.apiHost = api.host;
      options.apiPort = api.port;
    } else if (arg.startsWith("--api=")) {
      const api = parseApi(arg.slice("--api=".length));
      options.apiHost = api.host;
      options.apiPort = api.port;
    } else if (arg === "--admin-socket") {
      options.adminSocket = needValue(argv, ++index, arg);
    } else if (arg.startsWith("--admin-socket=")) {
      options.adminSocket = arg.slice("--admin-socket=".length);
    } else {
      throw new Error(`unknown option "${arg}". Run "hardvoxel-daemon --help".`);
    }
  }

  if (!options.statePath) throw new Error("--state cannot be empty");
  if (!options.adminSocket) throw new Error("--admin-socket cannot be empty");

  return options;
}

export async function main(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(HELP);
    return;
  }

  const daemon = await createDaemon(options);
  await daemon.start();

  const address = daemon.apiServer.address();
  console.log(`hardvoxel-daemon listening on http://${address.address}:${address.port}`);
  console.log(`admin socket: ${daemon.adminSocket}`);

  let stopping = false;
  const shutdown = async (signal) => {
    if (stopping) return;
    stopping = true;
    console.log(`hardvoxel-daemon: received ${signal}, shutting down`);
    try {
      await daemon.close();
      process.exit(0);
    } catch (error) {
      console.error(`hardvoxel-daemon: shutdown failed: ${error.message}`);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
