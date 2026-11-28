export class IngressError extends Error {
  constructor(message) {
    super(message);
    this.name = "IngressError";
  }
}

export function buildAppRoute(routes, routeId = "hardvoxel-apps") {
  return {
    "@id": routeId,
    handle: [
      {
        handler: "subroute",
        routes: routes.map((route) => ({
          match: [{ host: [route.host] }],
          handle: [
            {
              handler: "reverse_proxy",
              upstreams: [{ dial: route.upstream }],
            },
          ],
        })),
      },
    ],
  };
}

export function createCaddyIngress(options = {}) {
  const adminUrl = (options.adminUrl ?? "http://127.0.0.1:2019").replace(/\/$/, "");
  const routeId = options.routeId ?? "hardvoxel-apps";
  const fetchImpl = options.fetchImpl ?? fetch;

  async function setRoutes(routes) {
    const response = await fetchImpl(`${adminUrl}/id/${encodeURIComponent(routeId)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(buildAppRoute(routes, routeId)),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new IngressError(
        `Caddy rejected the route update (${response.status}): ${text || "no response body"}`,
      );
    }
  }

  return { setRoutes };
}
