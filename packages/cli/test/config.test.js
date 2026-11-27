import { describe, expect, test } from "bun:test";

import { buildRunArgs, containerName } from "../src/commands.js";
import { parseConfig } from "../src/config.js";

const valid = {
  project: "my-app",
  services: {
    web: {
      image: "nginx:1.27-alpine",
      ports: ["8080:80"],
      env: { NODE_ENV: "production", DEBUG: false },
      volumes: ["./data:/data"],
    },
  },
};

describe("parseConfig", () => {
  test("accepts a valid config and applies defaults", () => {
    const config = parseConfig(JSON.stringify(valid));
    expect(config.project).toBe("my-app");
    expect(config.services.web.restart).toBe("unless-stopped");
    expect(config.services.web.env).toEqual({ NODE_ENV: "production", DEBUG: "false" });
  });

  test("rejects invalid JSON", () => {
    expect(() => parseConfig("{")).toThrow(/invalid JSON/);
  });

  test("rejects a bad project name", () => {
    expect(() => parseConfig(JSON.stringify({ ...valid, project: "My App" }))).toThrow(
      /project must match/,
    );
  });

  test("rejects an empty service list", () => {
    expect(() => parseConfig(JSON.stringify({ project: "my-app", services: {} }))).toThrow(
      /at least one service/,
    );
  });

  test("rejects a service without an image", () => {
    const config = { project: "my-app", services: { web: {} } };
    expect(() => parseConfig(JSON.stringify(config))).toThrow(/image is required/);
  });

  test("rejects an invalid port", () => {
    const config = {
      project: "my-app",
      services: { web: { image: "nginx", ports: ["80"] } },
    };
    expect(() => parseConfig(JSON.stringify(config))).toThrow(/must look like/);
  });

  test("rejects an unsupported restart policy", () => {
    const config = {
      project: "my-app",
      services: { web: { image: "nginx", restart: "sometimes" } },
    };
    expect(() => parseConfig(JSON.stringify(config))).toThrow(/restart must be one of/);
  });
});

describe("containerName", () => {
  test("combines project and service", () => {
    expect(containerName("my-app", "web")).toBe("my-app-web");
  });
});

describe("buildRunArgs", () => {
  test("builds deterministic docker arguments", () => {
    const config = parseConfig(JSON.stringify(valid));
    expect(buildRunArgs(config.project, "web", config.services.web)).toEqual([
      "run",
      "-d",
      "--name",
      "my-app-web",
      "--label",
      "hardvoxel.project=my-app",
      "--label",
      "hardvoxel.service=web",
      "--restart",
      "unless-stopped",
      "-p",
      "8080:80",
      "-e",
      "NODE_ENV=production",
      "-e",
      "DEBUG=false",
      "-v",
      "./data:/data",
      "nginx:1.27-alpine",
    ]);
  });
});
