# 3D render experiment

Archived exploration of realistic matte 3D container renders. It is **not used by
the live site**. The site uses the sharp black/white cube mark from
`web/src/components/landing/LogoMark.tsx`.

Kept in the repo as a reference and as a possible future direction for hero or
campaign art.

## Run

```bash
cd tools/3d-render
bun install
bun run dev
```

Then render one or more presets in another terminal:

```bash
CHROME_PATH=/path/to/chrome bun run render
CHROME_PATH=/path/to/chrome node render.mjs heroClose heroDark hero
```

Presets live in `src/main.js` (`hero`, `heroDark`, `heroClose`, `registry`,
`isolation`, `pair`). Output PNGs are written to `out/`.

`playwright-core` needs an existing Chromium/Chrome binary. Set `CHROME_PATH`,
or install one with `bunx playwright install chromium`.

## Reference

`out/hero-close.webp` is the selected single-container study: dark matte body,
corrugation, vent grille, door hardware, concrete floor, and studio lighting.
