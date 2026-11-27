# Roadmap

Hardvoxel is an open-source project. This roadmap covers the software and community only.

No hosted service is offered by this project. There is no pricing, paid plan, or support
commitment.

Hardvoxel is currently a one-person project. Decisions are made in the open in GitHub issues
and discussions.

## Current limit

The CLI targets **one Docker host**. Multi-server capacity pooling is planned, not shipped.

## Now

- [x] CLI MVP: `up`, `down`, `status`, `logs`.
- [x] `hardvoxel.json` schema and validation.
- [x] Examples: nginx, Postgres, a small web app.
- [x] Docs site.
- [ ] First tagged release.

## Next

- [ ] `hardvoxel init` to generate a starter config.
- [ ] Health checks and dependency start order.
- [ ] Named networks and an optional reverse-proxy example.
- [ ] Machine-readable JSON output for `status`.
- [ ] Versioned docs.

## Later

- [ ] Multi-server capacity pooling: one pool of memory, CPU, and storage across machines.
- [ ] An agent per server, a scheduler, and failure handling.
- [ ] Optional self-hosted control plane and web UI.

## Not in scope

- Building images or a build pipeline.
- Managing a Kubernetes cluster.
- A hosted service, paid support, or an SLA.
