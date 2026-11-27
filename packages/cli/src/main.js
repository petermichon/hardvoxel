import { loadConfig } from "./config.js";
import { down, logs, status, up } from "./commands.js";

const HELP = `hardvoxel — deploy prebuilt OCI images to your own Docker host

Usage:
  hardvoxel <command> [options]

Commands:
  up                 Pull and start every service
  down               Remove the project's containers
  status             Show the project's containers
  logs <service>     Follow one service's logs
  help               Show this message

Options:
  -c, --config <file>  Config file (default: hardvoxel.json)
  -h, --help           Show this message

The config is JSON:

  {
    "project": "my-app",
    "services": {
      "web": {
        "image": "nginx:1.27-alpine",
        "ports": ["8080:80"]
      }
    }
  }
`;

function parseArgs(args) {
  let configFile = "hardvoxel.json";
  const positional = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "-c" || arg === "--config") {
      configFile = args[index + 1];
      if (!configFile) throw new Error(`${arg} needs a file path`);
      index += 1;
    } else if (arg.startsWith("--config=")) {
      configFile = arg.slice("--config=".length);
      if (!configFile) throw new Error("--config needs a file path");
    } else if (arg === "-h" || arg === "--help") {
      positional.push("help");
    } else {
      positional.push(arg);
    }
  }

  return { configFile, positional };
}

export async function main(argv) {
  const { configFile, positional } = parseArgs(argv);
  const [command, ...rest] = positional;

  if (!command || command === "help") {
    console.log(HELP);
    return;
  }

  const config = loadConfig(process.cwd(), configFile);

  switch (command) {
    case "up":
      up(config);
      return;
    case "down":
      down(config);
      return;
    case "status":
      status(config);
      return;
    case "logs":
      logs(config, rest[0]);
      return;
    default:
      throw new Error(`unknown command "${command}". Run "hardvoxel help".`);
  }
}
