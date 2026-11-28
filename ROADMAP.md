# Roadmap

Hardvoxel is an open-source project. This roadmap covers the software and community only.

No hosted service is offered by this project. There is no pricing, paid plan, or support
commitment.

Hardvoxel is currently a one-person project. Decisions are made in the open in GitHub issues
and discussions.

## Current state

The alpha CLI can pull and run prebuilt images on one Docker host. It is the foundation, not the
v1 product.

The target architecture is in [ARCHITECTURE.md](ARCHITECTURE.md): a single-server appliance with a
local daemon and an embedded Caddy ingress.

## v1: single-server platform

- [ ] Daemon behind Caddy with an HTTPS API, a local admin socket, and SQLite state.
- [x] Bearer-token creation, hashing, `deploy`/`read` scopes, expiry, revocation, and auth.
- [ ] Token rotation, rate limiting, and an audit log.
- [x] Token management over the local admin socket.
- [x] Caddy ingress adapter for app routes.
- [ ] Caddy supervisor, bootstrap config, automatic TLS, and static control-plane route.
- [x] Runtime adapter for Docker and Podman.
- [ ] Project-scoped secret files with metadata, values kept out of the spec and SQLite.
- [x] Read-only secret mounts with per-container UID/GID; explicit environment fallback.
- [ ] `hardvoxel secret set/list/rm` over SSH admin.
- [x] Secret validation before deploy.
- [x] Health-gated rolling and recreate deploys.
- [ ] Request draining, route verification, and rollback.
- [ ] CLI over HTTPS with `hardvoxel login`, plus `hardvoxel admin` over SSH.
- [ ] `up`, `down`, `status`, `logs`, and `rollback`.
- [ ] Installer and systemd units.
- [ ] Migration from the alpha `hardvoxel.json` workflow.
- [ ] Docs and the first tagged release.

## v1.x

- [ ] Optional browser UI.
- [ ] Engine API runtime adapter if events, performance, or remote engines justify it.
- [ ] Container isolation hardening for deploy tokens.
- [ ] Secret versioning for exact rollback.
- [ ] Encrypted backup archive for secrets.
- [ ] `secret rotate --restart`.
- [ ] `hardvoxel init` to generate a starter config.
- [ ] Machine-readable JSON output for `status`.
- [ ] Environment management.
- [ ] Named-volume backup and restore.
- [ ] Access logs and metrics in the CLI.
- [ ] Preview deployments.
- [ ] Versioned docs.

## v2: capacity pool

- [ ] An agent on each server.
- [ ] A control plane and scheduler across machines.
- [ ] One pool of memory, CPU, and storage.
- [ ] Global ingress in front of per-node proxies.
- [ ] Failure handling and rescheduling.

## Not in scope

- Building images or a build pipeline.
- Managing a Kubernetes cluster.
- A hosted service, paid support, or an SLA.
- Running alongside or configuring another reverse proxy. Hardvoxel is the ingress.
- A hosted DNS or wildcard-certificate service.
