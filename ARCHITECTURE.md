# Architecture

Status: **v1 target.** The current alpha CLI is the foundation. The daemon, state, and embedded
ingress described here are not shipped yet.

## Product contract

Hardvoxel turns a dedicated Linux server into a single-host container platform.

It owns:

- ports 80 and 443;
- the container runtime integration (Docker Engine or Podman);
- domains, routes, and TLS;
- the HTTPS control plane and its authentication;
- deployment state and health;
- the deploy lifecycle: pull, start unrouted, health-check, route, drain, stop.

It expects a dedicated server. In v1 it does not share ports 80/443 with an existing proxy.

Normal operations use HTTPS with a bearer token. SSH is reserved for system administration and
recovery. A dedicated control-plane hostname is required.

Hardvoxel is the ingress. A CDN or load balancer may sit in front of it, but Hardvoxel does not run
alongside or configure another reverse proxy. There is no supported bring-your-own-proxy mode.

Hardvoxel is not a hosted service. There is no pricing, paid plan, or support commitment.

## Object model

- **Server** — one Linux host running the daemon and Caddy.
- **Project** — one app, defined by one `hardvoxel.json`. The unit of apply, rollback, and destroy.
- **Service** — one container in v1. A project has one or more.
- **Deployment** — one applied version of a project: an immutable record of the spec, image
  digests, and result.
- **Token** — a scoped bearer credential for the HTTPS API (`deploy` or `read`). Admin operations
  use the local socket.
- **Secret** — a named, project-scoped value stored outside the spec. Containers reference names,
  never values.

A project is not a user account, repository, or organisation. One server can host multiple
projects, routed by domain.

## Planes

```text
operator CLI ── HTTPS + token ──> Caddy ──> daemon API (loopback)
operator SSH ──> hardvoxel admin ──> daemon admin socket
app users    ── HTTPS ─────────> Caddy ──> app containers

daemon
  ├── state (SQLite)
  ├── reconciler
  ├── runtime adapter  → Docker / Podman
  └── ingress adapter  → Caddy (managed, 80/443)
```

### CLI

- Thin client. It does not need direct access to the Docker socket.
- Uses HTTPS with a bearer token for normal operations.
- Reads `hardvoxel.json`, sends the spec to the daemon, and renders deployment progress.
- Supports `--json` for scripts. The API is the stable interface, not CLI output.
- `hardvoxel admin ...` runs over SSH against the local admin socket.
- Keeps `up`, `down`, `status`, and `logs`, and adds `rollback`.
- The current direct-to-Docker path remains a development fallback until the daemon is ready.

### Daemon

- One process, started by systemd.
- Owns the Docker/Podman socket.
- Stores the last applied spec, deployment history, token hashes, and audit records in SQLite.
- Listens on `127.0.0.1:8787` for the Caddy-proxied HTTPS API.
- Listens on `/run/hardvoxel/admin.sock` for local admin commands, authenticated by peer
  credentials.
- Exposes a high-level, spec-oriented API for the CLI, scripts, and a future UI.
- Reconciles on boot and after crashes: containers, routes, and certificates converge to the
  stored state.

### State and source of truth

- SQLite at `/var/lib/hardvoxel/state.db` is the **runtime** source of truth: last applied spec,
  deployment history, health, certificate records, token hashes, and audit records.
- `hardvoxel.json` is the **authoring** source of truth. It lives in the project repository.
- The rule: the file says what you want; the daemon says what is running. `apply` makes them match.
- V1 has no user accounts. Tokens are the only control-plane credentials; plaintext tokens are
  never stored.
- `apply` is a full reconcile. Services removed from the file are stopped; volumes are preserved.
  Destructive removals require `--prune`.
- `rollback` creates a new deployment from an older snapshot and makes it current. The next `apply`
  creates a new deployment from the file and moves forward. There is no separate pin or override.
- If daemon state is lost, the file re-applies the spec; secret values come from backup; container
  labels and Caddy config aid reconstruction.
- Secret values live in project-scoped `0600` files, not in the spec or SQLite. See
  [Secrets](#secrets).
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

| Method | Path | Scope | Purpose |
| --- | --- | --- | --- |
| `POST` | `/v1/projects/{project}/apply` | `deploy` | Apply a spec; returns a deployment id (`202`). |
| `GET` | `/v1/projects/{project}` | `read` | Desired vs running state, health, and routes. |
| `GET` | `/v1/projects/{project}/deployments` | `read` | Deployment history. |
| `GET` | `/v1/deployments/{id}` | `read` | Deployment progress and result. |
| `GET` | `/v1/deployments/{id}/events` | `read` | Progress stream. |
| `POST` | `/v1/projects/{project}/rollback` | `deploy` | Create a new current deployment from an older snapshot. |
| `POST` | `/v1/projects/{project}/stop` | `deploy` | Stop containers, keep state. |
| `DELETE` | `/v1/projects/{project}` | `deploy` | Destroy containers and networks; volumes require local admin. |
| `GET` | `/v1/projects/{project}/logs` | `read` | Container and proxy logs. |
| `GET` | `/v1/health` | public | Minimal status. |

- All endpoints except `/v1/health` require `Authorization: Bearer hv_...`.
- Token management and audit are not on HTTPS. They run over SSH against the local admin socket.
- The control plane is root-equivalent. Treat every token as a high-trust credential.
- The local admin socket uses peer credentials and is not exposed over HTTPS.
- `apply` is idempotent and serialized per project. It returns `202`; validation errors return
  `400`; runtime failures are recorded on the deployment while the old version keeps serving.
- There are no CRUD endpoints for domains, environment variables, or individual services. Those
  are part of the spec.
- Scripts and CI are clients of this API. They run on the client, not inside the daemon.
- The CLI is the reference client and may compose read-modify-write operations for UX.
- Low-level admin or debug endpoints, if any, are separate and unsupported.

## Authentication

The HTTPS API uses opaque bearer tokens. V1 has no user accounts or sessions.

### Scopes

- `deploy` — apply, rollback, stop, destroy containers and networks, logs, status.
- `read` — status, deployments, logs.

Admin operations are not on the HTTPS API. They run over SSH against the local admin socket:
token create/list/revoke/rotate, audit, upgrade, and volume deletion.

There is no `admin` API scope. Following OWASP's management-endpoint guidance, the management
surface stays off the public internet.

`deploy` is still high-trust: it can run arbitrary containers. The real boundary is container
isolation, which is future work. A deploy token cannot create tokens or delete volumes through the
API.

### Token format

```text
hv_<id>_<secret>
```

- 256-bit random secret.
- SHA-256 hash at rest; constant-time comparison.
- Name, scopes, created, last used, expires, revoked.
- Shown once. Never logged, never accepted in a URL.

### Lifecycle

- Expire by default after 90 days.
- `--no-expiry` is explicit and warns.
- `hardvoxel admin token rotate` creates a replacement before revoking the old token.
- Revocation is immediate.
- `hardvoxel admin token list` shows names, scopes, last used, and expiry.

### Bootstrap and storage

- The installer ends with `hardvoxel admin token create --name laptop`.
- `hardvoxel login` prompts for the token with hidden input and stores it `0600`.
- `--token` on the command line is avoided; CI uses a secret or environment variable.
- The CLI stores the server URL and token in `~/.config/hardvoxel/config.json`.

### Abuse controls

- Failed authentication is rate-limited.
- Authentication failures, token changes, deployments, and volume deletion are audited.
- Audit and token metadata are readable only over the local admin socket.

## Secrets

Secret values are files, not database rows. The public API only sees names.

### Storage

- `/var/lib/hardvoxel/secrets/<project>/<name>`: mode `0600`, owner `root:hardvoxel`.
- SQLite stores metadata only: name, created, and updated. Usage is derived from the spec.
- Values never appear in the spec, state database, logs, `status` output, or deployment snapshots.
- Secrets are project-scoped. A service cannot reference another project's secret.

### Delivery

File mounts are the default:

```json
{
  "services": {
    "db": {
      "image": "postgres:17",
      "secrets": ["db_password"]
    }
  }
}
```

Inside the container, the file appears at `/run/secrets/db_password`. Images that support `_FILE`
variables, such as Postgres, can consume it directly.

At deploy time the daemon:

1. reads the master secret;
2. creates a per-container copy under `/var/lib/hardvoxel/run/<container>/<name>`;
3. sets mode `0400` and ownership to the service's `uid`/`gid` (default `0:0`);
4. mounts the copy read-only at `/run/secrets/<name>`;
5. removes the copy with the container.

This lets a non-root container read its own secret without exposing the master file.

`env_from_secrets` is an explicit compatibility mode. Environment secrets are visible in
`docker inspect` and must be requested deliberately.

### Management

- Local admin over SSH only: `hardvoxel secret set/list/rm`.
- `set` prompts with hidden input; there is no `--value` flag. Automation uses stdin.
- `list` shows names, timestamps, and usage, never values.
- A missing secret fails the deploy before the old version is touched.
- Secret names may appear in audit logs; values never do.

### Rotation and rollback

- `secret set` replaces the value atomically.
- Existing containers keep the old value until they are redeployed.
- V1 has no secret versioning. Rollback restores the container spec and secret references, and
  resolves the current values. This is documented, Kubernetes-style behavior.

### Encryption at rest

- The host should use full-disk encryption (LUKS). The installer makes a best-effort check and warns
  if it cannot detect it.
- Do not add app-level encryption with a key on the same disk. It is not a boundary against root.
- `hardvoxel backup --include-secrets` must warn and must not produce an unencrypted archive by
  default.

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
- It terminates TLS for the control-plane hostname and proxies it to the daemon on loopback.
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

`rollback` deploys an older snapshot as a new current deployment, using the same health-gated
sequence.

## Deployments and rollback

Every `apply` creates an immutable deployment: the spec, image digests, non-secret environment,
secret names, routes, resources, health checks, and result.

`rollback` creates a new deployment from an older snapshot and makes it current. The next `apply`
creates a new deployment from the file and moves forward. There is no separate pin or override mode.

Snapshots do not include volumes, database contents, migrations, external services, or secret
values. Those remain the operator's responsibility.

Retention: keep the last 10 deployments or 30 days, whichever is longer. If a required image digest
is no longer available, fail before changing the running version.

## Process model

- `hardvoxel-daemon.service` runs the daemon.
- `hardvoxel-caddy.service` runs Caddy from a bootstrap config that exposes the admin socket and
  the static control-plane route, then resumes its last saved config after a restart.
- Caddy autosaves the active config under `/var/lib/hardvoxel/caddy`; the service sets
  `XDG_CONFIG_HOME` so the path is stable.
- Caddy runs one HTTP server with two route sets: a static control-plane route for the API hostname,
  and an app route set managed by the daemon.
- The daemon replaces only the app route set through Caddy's config API, targeted by `@id`; it never
  rewrites the control-plane route.
- The control-plane route is in the bootstrap config, so a bad app deploy cannot lock the operator
  out.
- The daemon does not rewrite a Caddyfile and reload by signal.
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
- Caddy routes by host: the control-plane hostname goes to the daemon, app hostnames go to project
  containers.
- The control-plane hostname must be separate from every app hostname.
- Routes target the stable service alias and the container port, never a published host port.
- App containers cannot reach the admin socket.
- The route is re-applied on every deploy, so a recreated container's address is picked up.
- If the runtime changes a container's address outside a deploy, Caddy's dynamic upstream
  resolution or a reconcile pass corrects it.

## TLS

- Automatic HTTPS per host with HTTP-01 in v1.
- Caddy issues a certificate for the control-plane hostname the same way.
- The control-plane hostname must resolve to the server before HTTPS works.
- DNS-01 for wildcard certificates comes later and needs a Caddy build with the DNS provider
  module.
- On-demand TLS with an authorization endpoint in the daemon comes later, for customer domains.
- Certificates and ACME state live in `/var/lib/hardvoxel/caddy`.
- HTTP redirects to HTTPS by default.

## Security

- Public surface: SSH, 80, and 443. Application ports are not published by default.
- The control plane is public on 443 with bearer-token auth. It is root-equivalent; treat every
  token as a root credential.
- Tokens are high-entropy, hashed at rest, scoped, expiring, revocable, and shown once. Plaintext is
  never logged.
- The HTTPS API exposes only `deploy` and `read` scopes. Token management and audit are local-only.
- A `deploy` token is high-trust: it can run arbitrary containers. Container isolation is future
  work; API scopes do not change that.
- V1 has no user accounts, passwords, or sessions.
- SSH is the break-glass path for install, upgrade, token recovery, and host-level work. It
  inherits the host's SSH authentication, including MFA if configured.
- A leaked `deploy` token cannot mint new tokens, read the audit log, or delete volumes through the
  API.
- The control-plane hostname is separate from every app hostname.
- Caddy's admin endpoint binds to a Unix socket owned by root and the `hardvoxel` group.
- The daemon admin socket uses peer credentials; only root and the `hardvoxel` group can use it.
- Caddy never receives the Docker socket. Only the daemon does.
- The CLI runs unprivileged and talks to the daemon over HTTPS or the admin socket.
- The daemon has the effective privileges of the Docker socket. This is documented, not hidden.
- Failed authentication is rate-limited and audited. Deployments and token changes are audited.
- The access log configuration excludes `Authorization` headers.
- Port conflicts on 80/443 fail before any container is changed.
- State files and certificates are `0600`/`0700` where possible.
- Secret values live in `0600` files outside SQLite. Containers receive read-only per-container
  copies owned by their runtime UID/GID.
- `env_from_secrets` is an explicit compatibility mode; env secrets are visible in `docker inspect`.
- The installer warns when full-disk encryption is not detected. App-level encryption with a local
  key is not a v1 claim.
- Secret values are never returned by the CLI or API, and never logged.
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
- Rolling back volumes, databases, migrations, or external services.
- A hosted service, paid support, or an SLA.
- A browser UI in v1.
- User accounts, passwords, or sessions in v1.
- A public signup or multi-tenant control plane.
- A hosted DNS or wildcard-certificate service.
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
| Control model | CLI + daemon + HTTPS API | The CLI should not need root; normal operations use the API. |
| Control plane | HTTPS via Caddy | Normal operations over 443 with bearer-token auth. |
| Admin access | SSH + local socket | Break-glass only; no network listener. |
| Authentication | Bearer tokens, `deploy` / `read` | No UI; admin stays local. |
| Token management | Local admin socket only | OWASP management-endpoint guidance; smaller public surface. |
| Token format | `hv_<id>_<secret>`, SHA-256 | Opaque, revocable, scannable, shown once. |
| Token lifetime | 90 days by default | Expiry, rotation, and revocation are built in. |
| Secret storage | `0600` files outside SQLite | DB copies and backups do not leak values. |
| Secret delivery | Read-only file mounts by default | Avoids env leakage; env fallback is explicit. |
| Secret management | Local admin socket only | Same management-surface rule as tokens. |
| Secret encryption | Host disk encryption | A key on the same disk is not a root boundary. |
| Browser UI | Not in v1 | CLI and API first. |
| Control-plane hostname | Required | TLS and routing; separate from app hosts. |
| State | SQLite | Single host, embedded, no database server. |
| Runtime | Docker / Podman | Existing ecosystem and images; containerd alone is not a user-facing runtime. |
| Target host | Dedicated server | Owning 80/443 is the contract; there is no shared-edge mode. |
| External ingress | Not supported | One stack and one support surface; the adapter is internal, not a plugin API. |
| Tenancy | Multiple projects per instance, single operator | Use the whole server without multi-user complexity. |
| Source of truth | File for authoring; SQLite for runtime | Git review and CI stay authoritative; the daemon can reconcile after reboot. |
| Rollback model | New deployment from a snapshot | Append-only history; no pin or override state. |
| API level | High-level, spec-oriented | Clients express outcomes; the daemon owns the deploy sequence. |
| Scripts | Client-side API clients | No scripting runtime or sandbox inside the daemon. |
| Object model | Server → projects → services → deployments | One app per project; one container per service in v1. |

## Open questions

- Whether v1 ships a shell installer, distro packages, or both.
- Whether the daemon API is a documented, stable contract in v1 or private to the CLI.
- Secret versioning for exact rollback reproduction.
- Whether `hardvoxel backup --include-secrets` emits an encrypted archive or delegates encryption
  to the operator.
- How much of the existing `hardvoxel.json` schema survives the move to daemon-managed state.
- Rootless runtime support. Rootful Docker is the v1 assumption.
- Backup and restore of named volumes.
- Rate-limit and audit-retention policy.
- How to constrain `deploy` tokens further with container isolation.
