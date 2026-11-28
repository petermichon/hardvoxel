import { expect, test } from "bun:test";
import { createServer } from "node:http";

import { waitForHealth } from "../src/daemon/deployer.js";

test("uses the published loopback port for health checks", async () => {
  const server = createServer((req, res) => {
    res.writeHead(req.url === "/health" ? 200 : 404);
    res.end("ok");
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;

  try {
    const runtime = {
      async inspect() {
        return {
          State: { Running: true },
          NetworkSettings: {
            Networks: { "hv-my-app": { IPAddress: "10.0.0.2" } },
            Ports: { "80/tcp": [{ HostIp: "127.0.0.1", HostPort: String(port) }] },
          },
        };
      },
    };

    await waitForHealth({
      runtime,
      id: "id",
      service: {
        port: 80,
        healthcheck: {
          path: "/health",
          port: null,
          interval: 1,
          timeout: 1,
          retries: 1,
          start_period: 0,
        },
      },
      network: "hv-my-app",
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
