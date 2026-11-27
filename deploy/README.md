# Deploying Hardvoxel

The site is a TanStack Start server, built into a small Node container.
# The app has no published ports; it joins the shared "edge" network and Caddy
# proxies to hardvoxel-web:3000.

## Build

```bash
docker compose -f deploy/compose.yaml up -d --build
```

Check it from inside the edge network:

```bash
docker run --rm --network edge curlimages/curl \
  -fsS http://hardvoxel-web:3000/ | head
docker compose -f deploy/compose.yaml logs -f hardvoxel-web
```

## Requirements on the host

- Docker Engine and Compose v2.
- The external `edge` network:
  ```bash
  docker network create --subnet 172.20.0.0/16 edge
  ```
- Public DNS for `hardvoxel.com` and `www.hardvoxel.com` pointing at this host.
- A Caddy site block in the `edge` repository:
  ```caddyfile
  hardvoxel.com {
      encode zstd gzip
      import security_headers
      import logging hardvoxel
      reverse_proxy hardvoxel-web:3000
  }

  www.hardvoxel.com {
      import security_headers
      redir https://hardvoxel.com{uri} permanent
  }
  ```

## Update

```bash
git pull --ff-only
docker compose -f deploy/compose.yaml up -d --build
```

## Rollback

Check out the previous commit and rebuild:

```bash
git checkout <previous-sha>
docker compose -f deploy/compose.yaml up -d --build
```

## Notes

- The container runs as the unprivileged `node` user.
- `web/server.mjs` serves the built client assets and the TanStack SSR handler
  through `srvx`.
- No ports are published to the host. Only Caddy owns `:80`/`:443`.
