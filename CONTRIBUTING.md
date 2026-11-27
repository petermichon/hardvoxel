# Contributing

Hardvoxel is a one-person project. Keep changes small, tested, and easy to review.

## Setup

```bash
bun install
bun test
bun run check
bun run build
```

## What to work on

- Check [ROADMAP.md](ROADMAP.md) and open issues first.
- Open an issue before a large change.
- Keep dependencies to a minimum. Explain any new dependency in the pull request.

## Pull requests

- One logical change per pull request.
- Add or update tests for behaviour changes.
- Update the `/docs` route in `web/src/routes/docs.tsx` and `web/src/content/markdown/pages.ts`
  when the CLI or config changes.
- Run `bun test`, `bun run check`, `bun run lint`, and `bun run build`.
- Keep the diff focused; avoid unrelated formatting.

## Developer Certificate of Origin

Sign off every commit:

```text
Signed-off-by: Your Name <you@example.com>
```

Use `git commit -s`. The full text is in [DCO](DCO). Do not add a commit without a sign-off.

## Conduct

Be civil. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Security

Do not open a public issue for a vulnerability. See [SECURITY.md](SECURITY.md).
