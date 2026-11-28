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

- [ ] Daemon with an HTTPS API, a local admin socket, and SQLite state.
- [ ] Bearer-token auth: `hv_` tokens, `deploy`/`read` scopes, SHA-256 hashes, expiry, rotation,
      revocation, rate limiting, and an audit log.
- [ ] Token management and audit over the local admin socket.
- [ ] Embedded Caddy ingress: app hostnames, automatic TLS, atomic route changes.
- [ ] Static control-plane hostname and route, separate from app hostnames.
- [ ] Runtime adapter for Docker and Podman.
- [ ] Health-gated deploys with draining and rollback.
- [ ] CLI over HTTPS with `hardvoxel login`, plus `hardvoxel admin` over SSH.
- [ ] `up`, `down`, `status`, `logs`, and `rollback`.
- [ ] Installer and systemd units.
- [ ] Migration from the alpha `hardvoxel.json` workflow.
- [ ] Docs and the first tagged release.

## v1.x

- [ ] Optional browser UI.
- [ ] Container isolation hardening for deploy tokens.
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
