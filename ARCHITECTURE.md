# Architecture

Status: **v1 target.** The current alpha CLI is the foundation. The daemon, state, and embedded
ingress described here are not shipped yet.

## Product contract

Hardvoxel turns a dedicated Linux server into a single-host container platform.

It owns:

- ports 80 and 443;
- the container runtime integration (Docker Engine or Podman);
- domains, routes, and TLS;
- deployment state and health;
- the deploy lifecycle: pull, start unrouted, health-check, route, drain, stop.

It expects a dedicated server. In v1 it does not share ports 80/443 with an existing proxy.

Hardvoxel is not a hosted service. There is no pricing, paid plan, or support commitment.

## Planes

```text
hardvoxel CLI (unprivileged)
        │  HTTP over a Unix socket
        ▼
hardvoxel daemon
        ├── state (SQLite)
        ├── reconciler
        ├── runtime adapter  → Docker / Podman
        └── ingress adapter  → Caddy (managed, 80/443)
```

### CLI

- Thin client. It does not need direct access to the Docker socket.
- Talks to the daemon over `/run/hardvoxel/hardvoxel.sock`.
- Keeps the existing `up`, `down`, `status`, and `logs` shapes, and adds `rollback`.
- The current direct-to-Docker path remains as a development fallback until the daemon is ready.

### Daemon

- One process, started by systemd.
- Owns the Docker/Podman socket.
- Stores desired state in SQLite.
- Exposes a small local HTTP API for the CLI.
- Reconciles on boot and after crashes: containers, routes, and certificates converge to the
  stored state.

### State

- SQLite at `/var/lib/hardvoxel/state.db`.
- Projects, services, deployments, routes, and certificate records.
- No PostgreSQL. A single-host platform does not need a database server.
- The state file contains environment variables and is treated as sensitive (`0600`).

### Runtime adapter

- Docker Engine first, Podman compatible through `HARDVOXEL_DOCKER`.
- One Docker network per project. Caddy is attached to each project network it serves.
- Containers get stable aliases such as `hv-<project>-<service>`.
- HTTP services do not publish host ports. Only Caddy publishes 80/443.
- Non-HTTP services may publish ports explicitly; the default bind is `127.0.0.1`.
- Health is checked directly over the project network, or through the image's Docker
  `HEALTHCHECK` when one exists.

### Ingress adapter

The ingress boundary stays small:

```text
apply(routes)        replace the route set atomically
add(route)           activate one host/path
remove(route)        stop routing, then drain
health()             proxy and upstream status
certificates()       certificate state for a host
```

The default implementation is Caddy. External ingress can be added later as a separate mode
without rewriting the deploy engine.

## Why Caddy

Caddy is the data plane, not the product. Hardvoxel owns the route model and the deploy
semantics; Caddy terminates HTTP and TLS.

- Its admin API is read-write. `POST /load` replaces the whole config atomically, blocks until the
  reload completes, and restores the previous config if the new one fails.
- It speaks JSON natively, so routes are generated from Hardvoxel's model instead of templated
  into a Caddyfile.
- Automatic HTTPS, HTTP-to-HTTPS redirects, HTTP/3, access logs, metrics, and upstream status are
  built in.
- It does not need the Docker socket. The daemon drives it over a permissioned Unix socket.
- It is a single static binary, which keeps the appliance small.

Traefik was considered and rejected as the primary data plane. Its API is read-only, its dynamic
configuration is provider-driven, and container labels are immutable. That makes health-gated
activation and draining awkward. It remains a reasonable external-ingress target later.

We do not write our own proxy. HTTP parsing, TLS, HTTP/2, HTTP/3, and connection draining are
solved problems; the differentiator is the deploy lifecycle around them.

## Deploy lifecycle

```text
validate config
      │
      ▼
pull image
      │
      ▼
create container on the project network (not routed)
      │
      ▼
wait for health
      │
      ├── unhealthy → remove it, keep the old version serving, report failure
      ▼
apply the new route atomically through the Caddy admin API
      │
      ▼
verify the route
      │
      ▼
remove the old route
      │
      ▼
drain in-flight requests
      │
      ▼
stop and remove the old container
      │
      ▼
record the deployment
```

The old version serves until the new one is healthy and routed. A bad image never takes the
application down.

`rollback` re-activates the previous deployment's image and route using the same sequence.

## Process model

- `hardvoxel-daemon.service` runs the daemon.
- `hardvoxel-caddy.service` runs Caddy from a minimal bootstrap config that only exposes the
  admin socket, then resumes its last saved config after a restart.
- Caddy autosaves the active config under `/var/lib/hardvoxel/caddy`; the service sets
  `XDG_CONFIG_HOME` so the path is stable.
- The daemon applies routes with `POST /load`; it does not rewrite a Caddyfile and reload by
  signal.
- If the daemon crashes, Caddy keeps serving the last config and containers keep running.
- If Caddy crashes, systemd restarts it and it resumes the last working config.
- On boot, the daemon reconciles containers and routes against SQLite.

Caddy is a separate process, not a library inside the daemon. Ingress should not depend on the
daemon's lifetime.

## Networking

```text
:80/:443
   │
   ▼
 Caddy
   │  project network
   ▼
 app container :3000
```

- Caddy joins each project network with `docker network connect` when the project is created and
  leaves it when the project is removed.
- Routes target the stable service alias and the container port, never a published host port.
- The route is re-applied on every deploy, so a recreated container's address is picked up.
- If the runtime changes a container's address outside a deploy, Caddy's dynamic upstream
  resolution or a reconcile pass corrects it.

## TLS

- Automatic HTTPS per host with HTTP-01 in v1.
- DNS-01 for wildcard certificates comes later and needs a Caddy build with the DNS provider
  module.
- On-demand TLS with an authorization endpoint in the daemon comes later, for customer domains.
- Certificates and ACME state live in `/var/lib/hardvoxel/caddy`.
- HTTP redirects to HTTPS by default.

## Security

- Public surface: SSH, 80, and 443. Application ports are not published by default.
- Caddy's admin endpoint binds to a Unix socket owned by root and the `hardvoxel` group.
- Caddy never receives the Docker socket. Only the daemon does.
- The CLI runs unprivileged and talks to the daemon socket.
- The daemon has the effective privileges of the Docker socket. This is documented, not hidden.
- Port conflicts on 80/443 fail before any container is changed.
- State files and certificates are `0600`/`0700` where possible.
- Secrets at rest are plaintext in v1, protected by file permissions. Encryption at rest is a
  follow-up, not a v1 claim.
- The installer pins the Caddy version and verifies its checksum.

## Multi-server path

The v1 appliance is one server. The pool extends the same model:

- a control plane with the same desired-state API;
- an agent per server running the same runtime and ingress adapters;
- a scheduler that places containers by capacity;
- a global entry point in front of per-node Caddy instances.

Per-node ingress stays local. The global layer is a routing and health problem, not a reason to
replace the node proxy. Shared storage across machines is not promised.

## Non-goals for v1

- Building images or running a CI pipeline.
- Git integration.
- Kubernetes.
- Multi-server scheduling.
- A hosted service, paid support, or an SLA.
- A web UI.
- External ingress as the default mode. It is a later, explicit mode.

## Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Ingress ownership | Embedded | Deploy semantics, TLS, and observability require control of the proxy. |
| Data plane | Caddy | Read-write atomic admin API; TLS and HTTP/3 built in; no Docker socket. |
| Own proxy | No | Undifferentiated and high-risk; the deploy lifecycle is the product. |
| Control model | CLI + daemon | The CLI should not need root or the Docker socket; the daemon reconciles. |
| State | SQLite | Single host, embedded, no database server. |
| Runtime | Docker / Podman | Existing ecosystem and images; containerd alone is not a user-facing runtime. |
| Target host | Dedicated server | Owning 80/443 is the contract; shared-edge mode is a later adapter. |

## Open questions

- Whether v1 ships a shell installer, distro packages, or both.
- Whether external ingress lands in v1.x as `--ingress external` or waits for demand.
- How much of the existing `hardvoxel.json` schema survives the move to daemon-managed state.
- Rootless runtime support. Rootful Docker is the v1 assumption.
- Backup and restore of named volumes.
