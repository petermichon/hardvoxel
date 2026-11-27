# Hardvoxel

Hardvoxel is an open-source CLI for deploying prebuilt OCI images to your own Docker host.

It is **not** a hosted service. There is no pricing, paid plan, or support commitment.

Status: **alpha**. The current release targets one Docker host. Turning one or more servers into
a single capacity pool is on the [roadmap](ROADMAP.md).

## What it does

- Reads a `hardvoxel.json` file.
- Pulls the images you specify.
- Runs the containers with ports, environment variables, volumes, and a restart policy.
- Gives you `up`, `down`, `status`, and `logs`.

It is a small wrapper around the Docker CLI. It does not build images, manage a cluster,
provision servers, or terminate TLS.

## Requirements

- Node.js 22 or newer
- Docker Engine, running locally
- Bun for the workspace scripts

Podman works for local development: `HARDVOXEL_DOCKER=podman node packages/cli/bin/hardvoxel.js up`.

## Quickstart

```bash
git clone https://github.com/petermichon/hardvoxel.git
cd hardvoxel
bun install
```

Create a `hardvoxel.json` next to where you run the command:

```json
{
  "project": "my-app",
  "services": {
    "web": {
      "image": "nginx:1.27-alpine",
      "ports": ["8080:80"],
      "restart": "unless-stopped"
    }
  }
}
```

Then:

```bash
node packages/cli/bin/hardvoxel.js up
```

Open <http://localhost:8080>.

## Documentation

- Site: <https://hardvoxel.com>
- Docs: <https://hardvoxel.com/docs>

## Development

```bash
bun install
bun run dev          # site
bun test             # site + CLI tests
bun run check        # site typecheck
bun run lint
bun run build
bun run format:check
```

## Layout

```text
web/                 # TanStack Start site
packages/cli/        # the hardvoxel CLI
package.json         # workspace root
```

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md). By contributing, you agree to the Developer Certificate
of Origin in [DCO](DCO).

## Licence

Apache-2.0. See [LICENSE](LICENSE).
