# AGENTS.md

Instructions for AI agents and humans working in this repository.

## Read first

- `README.md`
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `DESIGN.md`
- `CONTRIBUTING.md`
- `SECURITY.md`

## Commands

```bash
bun install
bun test
bun run check
bun run lint
bun run build
bun run format:check
```

## Layout

- `web/` — TanStack Start site. Routes in `web/src/routes`, copy and data in `web/src/content`.
- `packages/cli/` — plain Node.js ESM CLI. Config validation in `packages/cli/src/config.js`.
- `web/tests/` and `packages/cli/test/` — tests.

## Rules

- Keep the dependency footprint small. Do not add a dependency without a concrete need.
- The CLI is plain Node.js ESM. Do not introduce a build step for it.
- The config schema lives in `packages/cli/src/config.js`. Update the docs when it changes.
- Docs are the `/docs` route in `web/src/routes/docs.tsx` and the Markdown mirrors in
  `web/src/content/markdown/pages.ts`. Keep them in sync with the CLI.
- Do not add pricing, plans, company details, personal addresses, or a hosted-service CTA.
- Do not add analytics, trackers, or email capture without an explicit decision.
- Do not commit secrets. Use `.env.example` for names only.
- Never edit generated output: `web/src/routeTree.gen.ts`, `web/dist/`, `web/public/sitemap.xml`
  unless the change is intended and the tests are updated.

## Definition of done

- `bun test` passes.
- `bun run check` passes.
- `bun run lint` passes.
- `bun run build` passes.
- Docs updated for any CLI or config change.
- No generated files edited by hand.
