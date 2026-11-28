# TODO

## Done

- [x] Config schema v1: domains, container ports, secrets, healthchecks, resources, strategies.
- [x] Daemon skeleton: loopback API, admin socket, SQLite state, systemd unit.
- [x] Bearer token creation, listing, revocation, hashing, scopes, expiry, and auth.
- [x] `GET /v1/health`, `POST apply`, project and deployment read endpoints.

## v1 platform

- [ ] Token rotation, expiry warnings, rate limiting, and audit log.
- [ ] Admin volume deletion and audit views.
- [ ] Control-plane Caddy block: dedicated hostname, TLS, static route.
- [ ] Runtime adapter interface and CLI implementation (`execFile`, JSON outputs); map common
      errors into a small taxonomy.
- [ ] Runtime integration: Docker/Podman, per-project network, stable aliases, health checks.
- [ ] Normalize published ports to `127.0.0.1` unless the config sets a host IP.
- [ ] Secret store: `0600` project files, metadata in SQLite, no values in the spec or database.
- [ ] Secret delivery: per-container `0400` copies, service `uid`/`gid`, read-only mounts; env fallback.
- [ ] `hardvoxel secret set/list/rm` over SSH admin; hidden prompt and stdin.
- [ ] Validate referenced secrets before deploy; fail without touching the old version.
- [ ] Audit secret set/rm by name; never log values.
- [ ] Installer warns if full-disk encryption is not detected.
- [ ] Caddy supervisor: bootstrap config, admin Unix socket, resume on boot, certificate storage.
- [ ] Ingress adapter: app route set only; never rewrite the control-plane route.
- [ ] Deploy pipeline: pull, start unrouted, health-check, route, verify, drain, stop.
- [ ] Port-conflict detection for 80/443 before any change.
- [ ] CLI over HTTPS with `hardvoxel login` (hidden prompt, `0600`); `hardvoxel admin` over SSH.
- [ ] Deployment snapshots and rollback: a new current deployment from an older snapshot, with
      10-deployment / 30-day retention.
- [ ] Installer and systemd units.
- [ ] Tests: unit, Caddy config rendering, auth scopes, expiry, revocation, secret permissions,
      missing secrets, env fallback, rotation, rollback creates a new deployment, and an integration
      pass with Podman.
- [ ] Update the site and docs to describe the daemon, HTTPS control plane, and embedded ingress.
- [ ] Document that `deploy` tokens are high-trust; container isolation is future work.

## v1.x

- [ ] Optional browser UI.
- [ ] Container isolation hardening for deploy tokens.
- [ ] Secret versioning for exact rollback.
- [ ] Encrypted backup archive for secrets.
- [ ] `secret rotate --restart`.
- [ ] `hardvoxel init`.
- [ ] Machine-readable JSON output for `status`.
- [ ] Environment management.
- [ ] Named-volume backup and restore.
- [ ] Access logs and metrics in the CLI.
- [ ] Preview deployments.
- [ ] Versioned docs.
- [ ] Dependency updates and release automation.

## Scalability

- [ ] Multi-server capacity pooling: agent, scheduler, state, networking, volumes.
- [ ] Global ingress and per-node routing.
- [ ] Failure handling and rescheduling.

## SEO launch (after v1)

- [ ] Remove the temporary `X-Robots-Tag: noindex` from `edge/sites/hardvoxel.caddyfile`; redeploy edge.
- [ ] Keep `noindex` on the 404 and error pages; verify they still emit it.
- [ ] Submit `sitemap.xml` to Google Search Console and Bing.
- [ ] Request indexing for `/` and `/docs`.
- [ ] Add inbound links and launch posts.

## Skip unless triggered

- [ ] Newsletter or email list. Use GitHub Releases/RSS.
- [ ] Discord or Matrix. GitHub Discussions is enough.
- [ ] Ads, affiliate links, or paid plans.
- [ ] i18n until there is demand.
- [ ] Hosted `*.hardvoxel.app` DNS/TLS service. Separate project; not a v1 dependency.
