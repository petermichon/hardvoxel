import { describe, expect, test } from "bun:test";

import { buildAppRoute, createCaddyIngress } from "../src/daemon/ingress.js";

describe("buildAppRoute", () => {
  test("builds a host route set for Caddy", () => {
    expect(
      buildAppRoute([{ host: "app.example.com", upstream: "10.0.0.2:80" }], "hardvoxel-apps"),
    ).toEqual({
      "@id": "hardvoxel-apps",
      handle: [
        {
          handler: "subroute",
          routes: [
            {
              match: [{ host: ["app.example.com"] }],
              handle: [
                {
                  handler: "reverse_proxy",
                  upstreams: [{ dial: "10.0.0.2:80" }],
                },
              ],
            },
          ],
        },
      ],
    });
  });
});

describe("createCaddyIngress", () => {
  test("posts the app route set to the Caddy admin API", async () => {
    const calls = [];
    const ingress = createCaddyIngress({
      adminUrl: "http://caddy:2019/",
      routeId: "hardvoxel-apps",
      fetchImpl: async (url, options) => {
        calls.push({ url, options });
        return { ok: true, status: 200, text: async () => "" };
      },
    });

    await ingress.setRoutes([{ host: "app.example.com", upstream: "10.0.0.2:80" }]);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("http://caddy:2019/id/hardvoxel-apps");
    expect(calls[0].options.method).toBe("POST");
    expect(JSON.parse(calls[0].options.body)).toEqual(
      buildAppRoute([{ host: "app.example.com", upstream: "10.0.0.2:80" }], "hardvoxel-apps"),
    );
  });

  test("rejects a non-success response", async () => {
    const ingress = createCaddyIngress({
      fetchImpl: async () => ({ ok: false, status: 500, text: async () => "boom" }),
    });

    await expect(ingress.setRoutes([])).rejects.toThrow(/500/);
  });
});
