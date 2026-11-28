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

- [ ] Daemon with a local API and SQLite state.
- [ ] Runtime adapter for Docker and Podman.
- [ ] Embedded Caddy ingress: domains, automatic TLS, atomic route changes.
- [ ] Health-gated deploys with draining and rollback.
- [ ] `up`, `down`, `status`, `logs`, and `rollback`.
- [ ] Installer and systemd units.
- [ ] Migration from the alpha `hardvoxel.json` workflow.
- [ ] Docs and the first tagged release.

## v1.x

- [ ] `hardvoxel init` to generate a starter config.
- [ ] Machine-readable JSON output for `status`.
- [ ] Environment management.
- [ ] Named-volume backup and restore.
- [ ] Access logs and metrics in the CLI.
- [ ] External ingress mode: use an existing Caddy or Traefik instead of the embedded one.
- [ ] Preview deployments.
- [ ] Versioned docs.

## v2: capacity pool

- [ ] An agent on each server.
- [ ] A control plane and scheduler across machines.
- [ ] One pool of memory, CPU, and storage.
- [ ] Global ingress in front of per-node proxies.
- [ ] Failure handling and rescheduling.
- [ ] Optional web UI.

## Not in scope

- Building images or a build pipeline.
- Managing a Kubernetes cluster.
- A hosted service, paid support, or an SLA.
