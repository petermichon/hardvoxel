# TODO

## v1 platform

- [ ] Daemon skeleton: HTTPS API on loopback, admin socket, SQLite state, systemd unit.
- [ ] Token auth: hashed tokens, scopes, revocation, rate limiting, audit log.
- [ ] Control-plane Caddy block: dedicated hostname, TLS, static route.
- [ ] Runtime adapter: Docker/Podman, per-project network, stable aliases, health checks.
- [ ] Caddy supervisor: bootstrap config, admin Unix socket, resume on boot, certificate storage.
- [ ] Ingress adapter: app server block only; never rewrite the control-plane block.
- [ ] Deploy pipeline: pull, start unrouted, health-check, route, verify, drain, stop.
- [ ] Port-conflict detection for 80/443 before any change.
- [ ] CLI over HTTPS with token storage; `hardvoxel admin` over SSH.
- [ ] `rollback` from deployment history.
- [ ] Installer and systemd units.
- [ ] Tests: unit, Caddy config rendering, auth, and an integration pass with Podman.
- [ ] Update the site and docs to describe the daemon, HTTPS control plane, and embedded ingress.

## v1.x

- [ ] Optional browser UI.
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
