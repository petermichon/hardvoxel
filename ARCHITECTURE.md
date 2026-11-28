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

Hardvoxel is the ingress. A CDN or load balancer may sit in front of it, but Hardvoxel does not run
alongside or configure another reverse proxy. There is no supported bring-your-own-proxy mode.

Hardvoxel is not a hosted service. There is no pricing, paid plan, or support commitment.

## Object model

- **Server** — one Linux host running the daemon and Caddy.
- **Project** — one app, defined by one `hardvoxel.json`. The unit of apply, rollback, and destroy.
- **Service** — one container in v1. A project has one or more.
- **Deployment** — one applied version of a project: an immutable record of the spec, image
  digests, and result.

A project is not a user account, repository, or organisation. One server can host multiple
projects, routed by domain.

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
- Reads `hardvoxel.json`, sends the spec to the daemon, and renders deployment progress.
- Supports `--json` for scripts. The API is the stable interface, not CLI output.
- Keeps `up`, `down`, `status`, and `logs`, and adds `rollback`.
- The current direct-to-Docker path remains a development fallback until the daemon is ready.

### Daemon

- One process, started by systemd.
- Owns the Docker/Podman socket.
- Stores the last applied spec and deployment history in SQLite.
- Exposes a high-level, spec-oriented local HTTP API for the CLI, scripts, and a future UI.
- Reconciles on boot and after crashes: containers, routes, and certificates converge to the
  stored state.

### State and source of truth

- SQLite at `/var/lib/hardvoxel/state.db` is the **runtime** source of truth: last applied spec,
  deployment history, health, and certificate records.
- `hardvoxel.json` is the **authoring** source of truth. It lives in the project repository.
- The rule: the file says what you want; the daemon says what is running. `apply` makes them match.
- `apply` is a full reconcile. Services removed from the file are stopped; volumes are preserved.
  Destructive removals require `--prune`.
- `rollback` activates an older deployment. The v1 default is a runtime override until the next
  `apply`; making it persistent is an open question.
- If daemon state is lost, the file re-applies the spec; secret values come from backup; container
  labels and Caddy config aid reconstruction.
- Secret values do not belong in the spec. Storage is an open question.
- No PostgreSQL. A single-host platform does not need a database server.

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

The implementation is Caddy. The interface is an internal seam: it keeps Caddy's config format out
of the domain model and allows the data plane to be replaced without rewriting the deploy engine.
It is not a public plugin API, and there is no supported external-ingress mode.

## Daemon API

The public API is high-level and spec-oriented. It represents user outcomes, not implementation
steps. Clients do not create containers, networks, or routes directly.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/v1/projects/{project}/apply` | Apply a spec; returns a deployment id (`202`). |
| `GET` | `/v1/projects/{project}` | Desired vs running state, health, and routes. |
| `GET` | `/v1/projects/{project}/deployments` | Deployment history. |
| `GET` | `/v1/deployments/{id}` | Deployment progress and result. |
| `GET` | `/v1/deployments/{id}/events` | Progress stream. |
| `POST` | `/v1/projects/{project}/rollback` | Activate an older deployment. |
| `POST` | `/v1/projects/{project}/stop` | Stop containers, keep state. |
| `DELETE` | `/v1/projects/{project}` | Destroy; volumes only with an explicit flag. |
| `GET` | `/v1/projects/{project}/logs` | Container and proxy logs. |

- `apply` is idempotent and serialized per project. It returns `202`; validation errors return
  `400`; runtime failures are recorded on the deployment while the old version keeps serving.
- There are no CRUD endpoints for domains, environment variables, or individual services. Those
  are part of the spec.
- Scripts and CI are clients of this API. They run on the client, not inside the daemon.
- The CLI is the reference client and may compose read-modify-write operations for UX.
- Low-level admin or debug endpoints, if any, are separate and unsupported.

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
activation and draining awkward. It is not a supported alternative.

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
- Secret storage is an open question. Values are never returned by the CLI or API, and files are
  permissioned.
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
- External ingress integration, or running alongside another reverse proxy. The ingress adapter is
  internal.
- A public CRUD API for individual resources. The API is spec-oriented.
- A sequence-of-calls configuration format. The file is declarative.
- Executing user scripts inside the daemon. Scripts are clients.
- A custom configuration language. JSON is for data; scripts are for logic.

## Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Ingress ownership | Embedded | Deploy semantics, TLS, and observability require control of the proxy. |
| Data plane | Caddy | Read-write atomic admin API; TLS and HTTP/3 built in; no Docker socket. |
| Own proxy | No | Undifferentiated and high-risk; the deploy lifecycle is the product. |
| Control model | CLI + daemon | The CLI should not need root or the Docker socket; the daemon reconciles. |
| State | SQLite | Single host, embedded, no database server. |
| Runtime | Docker / Podman | Existing ecosystem and images; containerd alone is not a user-facing runtime. |
| Target host | Dedicated server | Owning 80/443 is the contract; there is no shared-edge mode. |
| External ingress | Not supported | One stack and one support surface; the adapter is internal, not a plugin API. |
| Tenancy | Multiple projects per instance, single operator | Use the whole server without multi-user complexity. |
| Source of truth | File for authoring; SQLite for runtime | Git review and CI stay authoritative; the daemon can reconcile after reboot. |
| API level | High-level, spec-oriented | Clients express outcomes; the daemon owns the deploy sequence. |
| Scripts | Client-side API clients | No scripting runtime or sandbox inside the daemon. |
| Object model | Server → projects → services → deployments | One app per project; one container per service in v1. |

## Open questions

- Whether v1 ships a shell installer, distro packages, or both.
- Remote CLI transport: an SSH tunnel to the local socket, or an authenticated HTTPS daemon API.
- Whether the daemon API is a documented, stable contract in v1 or private to the CLI.
- Whether `rollback` is a one-off runtime override or persists until the next `apply`.
- Secrets at rest: separate `0600` environment files, encrypted state, or Docker secrets.
- How much of the existing `hardvoxel.json` schema survives the move to daemon-managed state.
- Rootless runtime support. Rootful Docker is the v1 assumption.
- Backup and restore of named volumes.
