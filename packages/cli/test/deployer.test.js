import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createDeployer } from "../src/daemon/deployer.js";
import { containerName } from "../src/daemon/runtime.js";
import { StateStore } from "../src/daemon/state.js";

const spec = {
  version: 1,
  project: "my-app",
  services: {
    web: {
      image: "nginx:1.27-alpine",
      domain: "app.example.com",
      port: 80,
    },
  },
};

let dir;
let state;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "hardvoxel-deployer-"));
  state = new StateStore(join(dir, "state.db"));
});

afterEach(() => {
  state.close();
  rmSync(dir, { recursive: true, force: true });
});

function fakeRuntime({ containers = [], ip = "10.0.0.2" } = {}) {
  const events = [];

  return {
    events,
    async ensureNetwork(project) {
      events.push(["ensureNetwork", project]);
    },
    async pull(image) {
      events.push(["pull", image]);
    },
    async imageDigest(image) {
      events.push(["imageDigest", image]);
      return `sha256:${image}`;
    },
    async create(container) {
      events.push(["create", container]);
      return `id-${container.name}`;
    },
    async start(id) {
      events.push(["start", id]);
    },
    async stop(id) {
      events.push(["stop", id]);
    },
    async remove(id) {
      events.push(["remove", id]);
    },
    async inspect(id) {
      events.push(["inspect", id]);
      return {
        Id: id,
        State: { Running: true },
        NetworkSettings: { Networks: { "hv-my-app": { IPAddress: ip } } },
      };
    },
    async listContainers(project) {
      events.push(["listContainers", project]);
      return containers;
    },
  };
}

function fakeIngress() {
  const events = [];
  return {
    events,
    async setRoutes(routes) {
      events.push(["routes", routes]);
    },
  };
}

function makeDeployer(runtime, ingress, healthCheck = async () => {}) {
  return createDeployer({
    state,
    runtime,
    ingress,
    secretRoot: join(dir, "secrets"),
    secretRunRoot: join(dir, "run"),
    healthCheck,
    logger: { warn: () => {} },
  });
}

describe("deployer", () => {
  test("deploys a service, routes it, and removes the old container", async () => {
    const old = {
      Id: "old-id",
      Name: "/hv-my-app-web-old",
      Config: { Labels: { "hardvoxel.service": "web" } },
    };
    const runtime = fakeRuntime({ containers: [old] });
    const ingress = fakeIngress();
    const deployer = makeDeployer(runtime, ingress);

    const { id } = state.applyProject("my-app", spec);
    await deployer.deploy("my-app", spec, id);

    const deployment = state.getDeployment(id);
    expect(deployment.status).toBe("succeeded");
    expect(deployment.image_digests).toEqual({ web: "sha256:nginx:1.27-alpine" });

    expect(ingress.events).toEqual([
      ["routes", [{ host: "app.example.com", upstream: "10.0.0.2:80" }]],
    ]);

    expect(runtime.events.map(([name]) => name)).toEqual([
      "ensureNetwork",
      "listContainers",
      "pull",
      "imageDigest",
      "create",
      "start",
      "inspect",
      "remove",
    ]);
    expect(runtime.events.at(-1)).toEqual(["remove", "old-id"]);

    const create = runtime.events.find(([name]) => name === "create")[1];
    expect(create.labels["hardvoxel.project"]).toBe("my-app");
    expect(create.labels["hardvoxel.service"]).toBe("web");
    expect(create.aliases).toEqual(["hv-my-app-web"]);
  });

  test("removes the new container and keeps the old one when health fails", async () => {
    const old = {
      Id: "old-id",
      Name: "/hv-my-app-web-old",
      Config: { Labels: { "hardvoxel.service": "web" } },
    };
    const runtime = fakeRuntime({ containers: [old] });
    const deployer = makeDeployer(runtime, null, async () => {
      throw new Error("unhealthy");
    });

    const { id } = state.applyProject("my-app", spec);
    await expect(deployer.deploy("my-app", spec, id)).rejects.toThrow("unhealthy");

    const deployment = state.getDeployment(id);
    expect(deployment.status).toBe("failed");
    expect(deployment.error).toContain("unhealthy");

    const removed = runtime.events.filter(([name]) => name === "remove");
    expect(removed).toHaveLength(1);
    expect(removed[0][1]).not.toBe("old-id");
  });

  test("stops the old container first for recreate and restarts it on failure", async () => {
    const old = {
      Id: "old-id",
      Name: "/hv-my-app-web-old",
      Config: { Labels: { "hardvoxel.service": "web" } },
    };
    const runtime = fakeRuntime({ containers: [old] });
    const recreateSpec = {
      ...spec,
      services: {
        web: {
          ...spec.services.web,
          volumes: ["data:/data"],
          strategy: "recreate",
        },
      },
    };
    const deployer = makeDeployer(runtime, null, async () => {
      throw new Error("unhealthy");
    });

    const { id } = state.applyProject("my-app", recreateSpec);
    await expect(deployer.deploy("my-app", recreateSpec, id)).rejects.toThrow("unhealthy");

    const names = runtime.events.map(([name]) => name);
    expect(names.indexOf("stop")).toBeLessThan(names.indexOf("create"));
    expect(runtime.events).toContainEqual(["start", "old-id"]);
    expect(state.getDeployment(id).status).toBe("failed");
  });

  test("fails before creating a container when a secret is missing", async () => {
    const secretSpec = {
      ...spec,
      services: {
        web: { ...spec.services.web, secrets: ["db_password"] },
      },
    };
    const runtime = fakeRuntime();
    const deployer = makeDeployer(runtime, null);

    const { id } = state.applyProject("my-app", secretSpec);
    await expect(deployer.deploy("my-app", secretSpec, id)).rejects.toThrow(/db_password/);

    expect(state.getDeployment(id).status).toBe("failed");
    expect(runtime.events.some(([name]) => name === "create")).toBe(false);
    expect(existsSync(join(dir, "run", containerName("my-app", "web", id)))).toBe(false);
  });

  test("injects env secrets and mounts secret files", async () => {
    const secretDir = join(dir, "secrets", "my-app");
    mkdirSync(secretDir, { recursive: true });
    writeFileSync(join(secretDir, "db_password"), "s3cret");

    const secretSpec = {
      ...spec,
      services: {
        web: {
          ...spec.services.web,
          secrets: ["db_password"],
          env_from_secrets: { DB_PASSWORD: "db_password" },
        },
      },
    };
    const runtime = fakeRuntime();
    const deployer = makeDeployer(runtime, null);

    const { id } = state.applyProject("my-app", secretSpec);
    await deployer.deploy("my-app", secretSpec, id);

    const create = runtime.events.find(([name]) => name === "create")[1];
    expect(create.env.DB_PASSWORD).toBe("s3cret");
    expect(create.mounts).toHaveLength(1);
    expect(create.mounts[0].target).toBe("/run/secrets/db_password");
    expect(create.mounts[0].source.endsWith("db_password")).toBe(true);
  });
});
