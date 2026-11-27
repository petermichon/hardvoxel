# Hardvoxel design direction

> **Matte monochrome soft-industrial futurism, with soft-voxel geometry.**

Shorthand: **matte monochrome soft-voxel**.

## Principles

- **Matte over glossy.** No chrome, neon, glassmorphism, or specular highlights. Use flat fills,
  soft shadows, and subtle grain.
- **Monochrome.** Work in neutral tones. Hierarchy comes from luminance, spacing, typography, and
  depth — not color.
- **Soft-industrial.** Precise, engineered, quiet. Think matte plastic and machined surfaces, not
  cyberpunk.
- **Soft-voxel.** The cube is the brand mark and structural motif. Use it in the logo and imagery;
  do not turn every control into a literal block.
- **Minimal.** Every element should inform, guide, or support an action. Remove decoration that
  carries no information.

## Surfaces and tokens

All values live in `web/src/styles.css`.

- **Background:** warm off-white in light mode; near-black neutral in dark mode.
- **Cards:** slightly lighter than the page in light mode; slightly lighter neutral in dark mode.
- **Borders:** 1px low-contrast hairlines. Avoid hard black outlines.
- **Radii:** 8px controls, 12px panels, 16px cards. Structural sections stay square.
- **Grain:** fixed, very low-opacity noise overlay. It is texture, not decoration.
- **Shadows:** soft and diffuse. No hard offset “brutalist” shadows.
- **Hero/CTA background:** `studio-light` radial light plus grain. Do not add blueprint grids.

## Cube mark

- The cube mark is the only voxel imagery. Build it as **transparent, programmatic SVG** from
  `web/src/components/landing/cube.ts`; do not use raster renders or blend modes.
- Every face comes from the same isometric projection of the 8 cube corners. Keep the silhouette
  sharp; do not round or bevel it.
- Use only the logo's black or white face sets: a bright top, mid-tone left face, and darker right
  face. Do not introduce gray, colored, or textured faces.
- Scale the mark without redrawing it. At display size, use the softer halo variant rather than a
  rectangular drop shadow.
- If scene art returns, derive it from the same projection and keep the composition sparse. Do not
  turn every control into a literal voxel block.

## Typography

- Display: **Space Grotesk**, tight tracking, medium weight.
- Labels and technical copy: **JetBrains Mono**, uppercase, wide tracking.
- Keep body copy plain and readable. Do not set long copy in mono.

## Icons

- Use **Lucide** for all interface icons.
- Sizes: 18px theme toggle, 16px in buttons, 20px for feature/plan marks, 14px for checks and
  footer details.
- Replace text arrows (`→`) with `ArrowRight`.
- Theme toggle uses both `Sun` and `Moon` in SSR, with CSS selecting the visible one:
  `dark:hidden` / `hidden dark:block`.

## Motion

- 120–180ms, ease-out.
- Small, mechanical movements: lift on hover, settle on press.
- No bounce, spring, parallax, or continuous motion unless it communicates state.
- Respect `prefers-reduced-motion`.

## Voice and content

- **Container** is the user-facing noun. “Voxel” only appears in the brand and product names
  (Voxel-1, Voxel-2, Voxel-4).
- Every plan is a **resource pool**: RAM, CPU, storage, and bandwidth. Containers are limited by
  the pool, not by a fixed count.
- State **hard minimums** and **best-effort burst** precisely. Do not imply literal bare
  metal.
- If you mention bandwidth, distinguish a monthly transfer allowance from a guaranteed throughput
  rate.
- No decorative section labels (`// 001 — Platform`), fake sequence numbers (`01 →`), or taglines
  that add no information.
- Keep claims concrete. Prefer “pull a prebuilt image” over “build your app.”

## Do not

- Add blueprint, isometric, or dot grids as page backgrounds.
- Round the cube logo.
- Use emoji as UI icons.
- Introduce color accents; the palette is monochrome.
- Use heavy borders, hard shadows, or glossy gradients.
- Call containers “voxels” in interface copy.
