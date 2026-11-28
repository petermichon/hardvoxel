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

describe("v1 config fields", () => {
  const v1 = {
    version: 1,
    project: "my-app",
    services: {
      web: {
        image: "nginx:1.27-alpine",
        domain: "app.example.com",
        port: 80,
        env: { APP_ENV: "production" },
        secrets: ["db_password"],
        env_from_secrets: { DB_PASSWORD: "db_password" },
        healthcheck: {
          path: "/health",
          interval: 5,
          timeout: 3,
          retries: 3,
          start_period: 10,
        },
        resources: { cpus: 0.5, memory: "256m" },
        strategy: "rolling",
        uid: 1000,
        gid: 1000,
      },
    },
  };

  test("accepts the v1 fields", () => {
    const config = parseConfig(JSON.stringify(v1));
    expect(config.version).toBe(1);
    expect(config.services.web.domain).toBe("app.example.com");
    expect(config.services.web.port).toBe(80);
    expect(config.services.web.secrets).toEqual(["db_password"]);
    expect(config.services.web.env_from_secrets).toEqual({ DB_PASSWORD: "db_password" });
    expect(config.services.web.healthcheck).toEqual({
      path: "/health",
      port: null,
      interval: 5,
      timeout: 3,
      retries: 3,
      start_period: 10,
    });
    expect(config.services.web.resources).toEqual({ cpus: 0.5, memory: "256m" });
    expect(config.services.web.strategy).toBe("rolling");
    expect(config.services.web.uid).toBe(1000);
    expect(config.services.web.gid).toBe(1000);
  });

  test("defaults strategy to recreate when a volume is present", () => {
    const config = parseConfig(
      JSON.stringify({
        project: "my-app",
        services: { db: { image: "postgres:17", volumes: ["data:/data"] } },
      }),
    );
    expect(config.services.db.strategy).toBe("recreate");
  });

  test("defaults strategy to rolling without volumes", () => {
    const config = parseConfig(
      JSON.stringify({
        project: "my-app",
        services: { web: { image: "nginx:1.27-alpine" } },
      }),
    );
    expect(config.services.web.strategy).toBe("rolling");
  });

  test("rejects a domain without a container port", () => {
    const config = {
      project: "my-app",
      services: { web: { image: "nginx", domain: "app.example.com" } },
    };
    expect(() => parseConfig(JSON.stringify(config))).toThrow(/port is required/);
  });

  test("rejects published ports alongside a domain", () => {
    const config = {
      project: "my-app",
      services: {
        web: { image: "nginx", domain: "app.example.com", port: 80, ports: ["8080:80"] },
      },
    };
    expect(() => parseConfig(JSON.stringify(config))).toThrow(/ports cannot be used with domain/);
  });

  test("rejects an invalid domain", () => {
    const config = {
      project: "my-app",
      services: { web: { image: "nginx", domain: "App Example", port: 80 } },
    };
    expect(() => parseConfig(JSON.stringify(config))).toThrow(/lowercase hostname/);
  });

  test("rejects duplicate secrets", () => {
    const config = {
      project: "my-app",
      services: { web: { image: "nginx", secrets: ["db_password", "db_password"] } },
    };
    expect(() => parseConfig(JSON.stringify(config))).toThrow(/duplicate secret/);
  });

  test("rejects an env secret that is not listed", () => {
    const config = {
      project: "my-app",
      services: {
        web: {
          image: "nginx",
          secrets: ["db_password"],
          env_from_secrets: { DB_PASSWORD: "other_password" },
        },
      },
    };
    expect(() => parseConfig(JSON.stringify(config))).toThrow(/not in secrets/);
  });

  test("rejects an env value defined in both places", () => {
    const config = {
      project: "my-app",
      services: {
        web: {
          image: "nginx",
          env: { DB_PASSWORD: "plain" },
          secrets: ["db_password"],
          env_from_secrets: { DB_PASSWORD: "db_password" },
        },
      },
    };
    expect(() => parseConfig(JSON.stringify(config))).toThrow(/both env and env_from_secrets/);
  });

  test("rejects an invalid healthcheck path", () => {
    const config = {
      project: "my-app",
      services: { web: { image: "nginx", healthcheck: { path: "health" } } },
    };
    expect(() => parseConfig(JSON.stringify(config))).toThrow(/path must be a path/);
  });

  test("rejects invalid resources", () => {
    const config = {
      project: "my-app",
      services: { web: { image: "nginx", resources: { memory: "lots" } } },
    };
    expect(() => parseConfig(JSON.stringify(config))).toThrow(/memory must look like/);
  });

  test("rejects unknown service fields", () => {
    const config = {
      project: "my-app",
      services: { web: { image: "nginx", portz: 80 } },
    };
    expect(() => parseConfig(JSON.stringify(config))).toThrow(/not supported/);
  });

  test("rejects an unsupported config version", () => {
    const config = { version: 2, project: "my-app", services: { web: { image: "nginx" } } };
    expect(() => parseConfig(JSON.stringify(config))).toThrow(/version must be 1/);
  });

  test("rejects unknown top-level fields", () => {
    const config = {
      project: "my-app",
      services: { web: { image: "nginx" } },
      extra: true,
    };
    expect(() => parseConfig(JSON.stringify(config))).toThrow(/config.extra is not supported/);
  });
  test("accepts named volumes in daemon mode", () => {
    const config = parseConfig(
      JSON.stringify({
        project: "my-app",
        services: { db: { image: "postgres:17", volumes: ["data:/data"] } },
      }),
      "test",
      { mode: "daemon" },
    );
    expect(config.services.db.volumes).toEqual(["data:/data"]);
  });

  test("rejects bind mounts in daemon mode", () => {
    expect(() =>
      parseConfig(
        JSON.stringify({
          project: "my-app",
          services: { db: { image: "postgres:17", volumes: ["./data:/data"] } },
        }),
        "test",
        { mode: "daemon" },
      ),
    ).toThrow(/named volume/);
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
