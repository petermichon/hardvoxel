import { describe, expect, test } from "bun:test";

import {
  buildCreateArgs,
  containerName,
  createRuntime,
  networkAlias,
  networkName,
} from "../src/daemon/runtime.js";

describe("container naming", () => {
  test("uses a stable network and alias with a deployment suffix", () => {
    expect(networkName("my-app")).toBe("hv-my-app");
    expect(networkAlias("my-app", "web")).toBe("hv-my-app-web");
    expect(containerName("my-app", "web", "12345678-aaaa-bbbb-cccc-ddddeeeeffff")).toBe(
      "hv-my-app-web-12345678",
    );
  });
});

describe("buildCreateArgs", () => {
  test("builds deterministic docker arguments", () => {
    const args = buildCreateArgs({
      name: "hv-my-app-web-12345678",
      image: "nginx:1.27-alpine",
      network: "hv-my-app",
      aliases: ["hv-my-app-web"],
      labels: {
        "hardvoxel.project": "my-app",
        "hardvoxel.service": "web",
      },
      env: { APP_ENV: "production" },
      volumes: ["data:/data"],
      ports: ["127.0.0.1:8080:80"],
      restart: "unless-stopped",
      resources: { cpus: 0.5, memory: "256m" },
      mounts: [{ source: "/tmp/secret", target: "/run/secrets/db_password" }],
    });

    expect(args).toEqual([
      "create",
      "--name",
      "hv-my-app-web-12345678",
      "--label",
      "hardvoxel.project=my-app",
      "--label",
      "hardvoxel.service=web",
      "--network",
      "hv-my-app",
      "--network-alias",
      "hv-my-app-web",
      "--restart",
      "unless-stopped",
      "--env",
      "APP_ENV=production",
      "--volume",
      "data:/data",
      "--publish",
      "127.0.0.1:8080:80",
      "--cpus",
      "0.5",
      "--memory",
      "256m",
      "--mount",
      "type=bind,source=/tmp/secret,target=/run/secrets/db_password,readonly",
      "nginx:1.27-alpine",
    ]);
  });
});

function fakeExec(handler) {
  return (_command, args, _options, callback) => {
    try {
      const result = handler(args);
      callback(null, result?.stdout ?? "", result?.stderr ?? "");
    } catch (error) {
      callback(error, "", error.stderr ?? "");
    }
  };
}

describe("createRuntime", () => {
  test("pulls an image through the selected CLI", async () => {
    const calls = [];
    const runtime = createRuntime({
      command: "podman",
      execFileImpl: fakeExec((args) => {
        calls.push(args);
        return { stdout: "" };
      }),
    });

    await runtime.pull("nginx:1.27-alpine");
    expect(calls).toEqual([["pull", "nginx:1.27-alpine"]]);
  });

  test("creates a network when it does not exist", async () => {
    const calls = [];
    const runtime = createRuntime({
      command: "docker",
      execFileImpl: fakeExec((args) => {
        calls.push(args);
        if (args[0] === "network" && args[1] === "inspect") {
          const error = new Error("Command failed");
          error.code = 1;
          error.stderr = "Error: No such network: hv-my-app";
          throw error;
        }
        return { stdout: "" };
      }),
    });

    await runtime.ensureNetwork("my-app");
    expect(calls).toEqual([
      ["network", "inspect", "hv-my-app"],
      ["network", "create", "--label", "hardvoxel.project=my-app", "hv-my-app"],
    ]);
  });

  test("creates a network after a Podman not-found error", async () => {
    const calls = [];
    const runtime = createRuntime({
      command: "podman",
      execFileImpl: fakeExec((args) => {
        calls.push(args);
        if (args[0] === "network" && args[1] === "inspect") {
          const error = new Error("Command failed");
          error.code = 1;
          error.stderr =
            "Error: network hv-my-app: unable to find network with name or ID hv-my-app: network not found";
          throw error;
        }
        return { stdout: "" };
      }),
    });

    await runtime.ensureNetwork("my-app");
    expect(calls).toEqual([
      ["network", "inspect", "hv-my-app"],
      ["network", "create", "--label", "hardvoxel.project=my-app", "hv-my-app"],
    ]);
  });

  test("lists and inspects project containers", async () => {
    const calls = [];
    const runtime = createRuntime({
      command: "docker",
      execFileImpl: fakeExec((args) => {
        calls.push(args);
        if (args[0] === "ps") return { stdout: "id1\nid2\n" };
        if (args[0] === "inspect") return { stdout: JSON.stringify([{ Id: "id1" }, { Id: "id2" }]) };
        return { stdout: "" };
      }),
    });

    const containers = await runtime.listContainers("my-app");
    expect(containers).toEqual([{ Id: "id1" }, { Id: "id2" }]);
    expect(calls).toEqual([
      ["ps", "-aq", "--filter", "label=hardvoxel.project=my-app"],
      ["inspect", "id1", "id2"],
    ]);
  });

  test("maps a missing container to a not_found error", async () => {
    const runtime = createRuntime({
      command: "docker",
      execFileImpl: fakeExec(() => {
        const error = new Error("Command failed");
        error.code = 1;
        error.stderr = "Error: No such container: missing";
        throw error;
      }),
    });

    await expect(runtime.inspect("missing")).rejects.toMatchObject({ code: "not_found" });
  });
});
