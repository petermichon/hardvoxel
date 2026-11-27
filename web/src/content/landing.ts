import { Code2, Container, FileJson, type LucideIcon } from "lucide-react";

export const tickerItems = [
  "DOCKER",
  "OCI",
  "GHCR",
  "DOCKER HUB",
  "NODE",
  "PYTHON",
  "GO",
  "RUST",
  "POSTGRES",
  "REDIS",
  "NGINX",
  "CADDY",
];

export const cliExample = {
  install: "git clone https://github.com/petermichon/hardvoxel.git",
  deploy: "node packages/cli/bin/hardvoxel.js up",
  steps: [
    { label: "pulling image", status: "done" },
    { label: "starting container", status: "done" },
    { label: "done", status: "ok" },
  ],
  url: "http://localhost:8080",
  meta: "1 container running",
} as const;

export const cliCommands = `$ ${cliExample.install}
$ cd hardvoxel
$ ${cliExample.deploy}
  - pulling image............. done
  - starting container........ done
  - done

  ✓ live at  ${cliExample.url}
     ${cliExample.meta}`;

export type LandingFeature = {
  title: string;
  desc: string;
  icon: LucideIcon;
};

export const features: LandingFeature[] = [
  {
    title: "Open source",
    desc: "The CLI and config format are open. Read the code, run it locally, and change what you need.",
    icon: Code2,
  },
  {
    title: "Prebuilt images",
    desc: "Point Hardvoxel at an image in Docker Hub, GHCR, or any OCI registry. No build pipeline, no Git integration.",
    icon: Container,
  },
  {
    title: "One small config",
    desc: "A single hardvoxel.json describes the image, ports, environment, and volumes. One command starts it.",
    icon: FileJson,
  },
];

export type FooterHref =
  | "/"
  | "/features"
  | "/docs"
  | "/about"
  | "/security"
  | "/privacy"
  | "/terms"
  | `mailto:${string}`;

export type FooterColumn = {
  title: string;
  links: { label: string; href: FooterHref }[];
};

export const footerColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Docs", href: "/docs" },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "About", href: "/about" },
      { label: "Security", href: "/security" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Contact", href: "mailto:hello@hardvoxel.com" },
    ],
  },
];
