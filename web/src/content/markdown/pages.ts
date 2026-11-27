export const pageMarkdown: Record<string, string> = {
  "/": `# Hardvoxel

Hardvoxel is an open-source CLI for deploying prebuilt OCI images to your own Docker host. One JSON config, one command, no control plane.

## What it does

- Reads a hardvoxel.json file.
- Pulls the image you specify.
- Runs the container with ports, environment variables, volumes, and a restart policy.
- Stops and inspects the project's containers with down, status, and logs.

## What it is not

- Not a hosted service or a paid plan.
- Not a build pipeline. You build and push the image.
- Not Kubernetes or a cluster control plane.
- Not a reverse proxy. It does not terminate TLS.

## Links

- Docs: https://hardvoxel.com/docs
- Features: https://hardvoxel.com/features
`,

  "/docs": `# Docs

Hardvoxel is alpha. Run it from source and keep the Docker host you already have.

## Requirements

- Node.js 22 or newer
- Docker Engine
- git

## Quickstart

~~~sh
git clone https://github.com/petermichon/hardvoxel.git
cd hardvoxel
bun install
~~~

Create hardvoxel.json:

~~~json
{
  "project": "hello",
  "services": {
    "web": {
      "image": "nginx:1.27-alpine",
      "ports": ["8080:80"]
    }
  }
}
~~~

Start it:

~~~sh
node packages/cli/bin/hardvoxel.js up
~~~

Open http://localhost:8080.

## Commands

- up: pull and start every service.
- down: remove the project's containers.
- status: show the project's containers.
- logs <service>: follow one service's logs.
- help: show the command list.

## Current limit

The CLI targets one Docker host. Multi-server capacity pooling is on the roadmap, not in the current release.

## Links

- Features: https://hardvoxel.com/features
- About: https://hardvoxel.com/about
`,

  "/features": `# Features

Hardvoxel is small on purpose.

- Open source: read it, run it, change it.
- Prebuilt images: pull from Docker Hub, GHCR, or any OCI registry.
- One config: image, ports, environment, volumes, and restart policy in hardvoxel.json.
- No cluster: the CLI talks to a local Docker Engine.

It does not build images, manage a cluster, terminate TLS, or host your workload.

## Links

- Docs: https://hardvoxel.com/docs
- About: https://hardvoxel.com/about
`,

  "/about": `# About Hardvoxel

Hardvoxel is a personal, non-commercial open-source project for running prebuilt OCI images on a Docker host you control.

## What it does

It reads a config, pulls the image, and starts the container. There is no build step, no hosted service, and no control plane.

## Project

- Status: alpha, open source
- Email: hello@hardvoxel.com
- Hosting provider: OVH SAS, Roubaix, France

The publisher's identification details are on file with the host under Article 1-1 II of the LCEN.

## Roadmap

- Now: single-host CLI with one JSON config.
- Next: init, health checks, start order, and networks.
- Later: multi-server capacity pooling across machines.

## Links

- Docs: https://hardvoxel.com/docs
- Security: https://hardvoxel.com/security
`,

  "/security": `# Security

Hardvoxel is a local CLI. It runs Docker commands on the host where you invoke it and does not expose a network service.

## What the CLI touches

It reads hardvoxel.json, validates it, and calls the Docker CLI to pull images and run containers. It does not run a daemon, open a port, store credentials, or send data to a Hardvoxel server.

## What you control

- Images and registries
- Ports, environment variables, volumes, and restart policy
- The Docker daemon and the host
- Secrets, backups, and updates

## Report a vulnerability

Do not open a public issue. Email hello@hardvoxel.com with a description, the affected commit, and a reproduction if possible.

## Links

- Docs: https://hardvoxel.com/docs
- Legal: https://hardvoxel.com/legal
`,

  "/legal": `# Legal

Hardvoxel is a personal, non-commercial open-source project.

## Publisher

Under Article 1-1 II of the LCEN, the publisher's identification details have been communicated to the host and are not published on the site. The host may disclose them to a judicial authority.

## Host

OVH SAS, 2 rue Kellermann, 59100 Roubaix, France. +33 9 72 10 10 07.

## Contact

hello@hardvoxel.com

## Links

- Privacy: https://hardvoxel.com/privacy
- Terms: https://hardvoxel.com/terms
`,

  "/privacy": `# Privacy

This site is documentation for an open-source project. It does not have accounts, a newsletter, advertising, or tracking cookies.

## Controller

The publisher is the data controller. Contact hello@hardvoxel.com.

## Server logs

The host may process the IP address, request headers, timestamp, and requested URL for security and availability. Legal basis: legitimate interest. Retention: up to 30 days.

## Your rights

You can request access, correction, erasure, restriction, or objection, and request portability where it applies. Email hello@hardvoxel.com. You can also complain to the CNIL.

## Links

- Legal: https://hardvoxel.com/legal
- Terms: https://hardvoxel.com/terms
`,

  "/terms": `# Terms

This site documents an open-source project. It does not sell a product or provide a hosted service.

## Licence

The software is open source. Your use of the software is governed by its licence, not by this page.

## No warranty

The documentation and software are provided as is, without warranty of any kind. See the repository licence for the full disclaimer.

## Links

- Legal: https://hardvoxel.com/legal
- Privacy: https://hardvoxel.com/privacy
`,
};
