export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Server error | Hardvoxel</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="robots" content="noindex, nofollow" />
    <script>
      (function () {
        try {
          var theme = localStorage.getItem("theme");
          var root = document.documentElement;
          if (
            theme === "dark" ||
            (theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches)
          ) {
            root.classList.add("dark");
          } else if (theme === "light") {
            root.classList.add("light");
          }
        } catch (error) {}
      })();
    </script>
    <style>
      :root {
        color-scheme: light dark;
        --font-display: "Space Grotesk Variable", ui-sans-serif, system-ui, -apple-system,
          "Segoe UI", sans-serif;
        --font-mono: "JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace;
        --radius: 0.5rem;
        --background: oklch(0.965 0.003 85);
        --foreground: oklch(0.18 0 0);
        --card: oklch(0.985 0.002 85);
        --muted: oklch(0.94 0.003 85);
        --muted-foreground: oklch(0.45 0 0);
        --border: oklch(0.86 0.003 85);
        --ring: oklch(0.55 0 0);
        --studio-light: rgb(0 0 0 / 0.04);
        --cube-base: #000000;
        --cube-top: #121212;
        --cube-left: #080808;
        --cube-right: #000000;
      }
      @media (prefers-color-scheme: dark) {
        :root:not(.light) {
          --background: oklch(0.11 0 0);
          --foreground: oklch(0.965 0.002 85);
          --card: oklch(0.16 0 0);
          --muted: oklch(0.2 0 0);
          --muted-foreground: oklch(0.7 0 0);
          --border: oklch(1 0 0 / 10%);
          --ring: oklch(0.6 0 0);
          --studio-light: rgb(255 255 255 / 0.04);
          --cube-base: #e8e8e8;
          --cube-top: #ffffff;
          --cube-left: #f8f8f8;
          --cube-right: #e8e8e8;
        }
      }
      :root.dark {
        --background: oklch(0.11 0 0);
        --foreground: oklch(0.965 0.002 85);
        --card: oklch(0.16 0 0);
        --muted: oklch(0.2 0 0);
        --muted-foreground: oklch(0.7 0 0);
        --border: oklch(1 0 0 / 10%);
        --ring: oklch(0.6 0 0);
        --studio-light: rgb(255 255 255 / 0.04);
        --cube-base: #e8e8e8;
        --cube-top: #ffffff;
        --cube-left: #f8f8f8;
        --cube-right: #e8e8e8;
      }
      * { box-sizing: border-box; }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        padding: 1.5rem;
        background-color: var(--background);
        background-image: radial-gradient(ellipse at 50% 0%, var(--studio-light), transparent 65%);
        color: var(--foreground);
        font-family: var(--font-display);
        -webkit-font-smoothing: antialiased;
      }
      body::after {
        content: "";
        position: fixed;
        inset: 0;
        z-index: 60;
        pointer-events: none;
        opacity: 0.035;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        background-size: 180px 180px;
      }
      :root.dark body::after {
        opacity: 0.022;
        filter: invert(1);
      }
      @media (prefers-color-scheme: dark) {
        :root:not(.light) body::after {
          opacity: 0.022;
          filter: invert(1);
        }
      }
      main {
        position: relative;
        width: 100%;
        max-width: 32rem;
        text-align: center;
      }
      .brand {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: inherit;
        text-decoration: none;
      }
      .brand:focus-visible,
      .btn:focus-visible,
      .help a:focus-visible {
        outline: 2px solid var(--ring);
        outline-offset: 2px;
      }
      .brand svg {
        filter: drop-shadow(0 1px 3px rgb(0 0 0 / 0.28));
      }
      :root.dark .brand svg {
        filter: drop-shadow(0 1px 4px rgb(255 255 255 / 0.28));
      }
      @media (prefers-color-scheme: dark) {
        :root:not(.light) .brand svg {
          filter: drop-shadow(0 1px 4px rgb(255 255 255 / 0.28));
        }
      }
      .wordmark {
        font-size: 1.125rem;
        font-weight: 600;
        letter-spacing: -0.025em;
      }
      .eyebrow {
        margin: 2.5rem 0 0;
        font-family: var(--font-mono);
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--muted-foreground);
      }
      h1 {
        margin: 1rem 0 0;
        font-size: clamp(2.25rem, 4vw, 3rem);
        font-weight: 500;
        line-height: 0.95;
        letter-spacing: -0.04em;
      }
      .alert {
        margin: 1rem auto 0;
        max-width: 28rem;
        font-size: 0.875rem;
        line-height: 1.55;
        color: var(--muted-foreground);
      }
      @media (min-width: 768px) {
        .alert { font-size: 1rem; }
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.75rem;
        margin-top: 2rem;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 3rem;
        padding: 0 1.5rem;
        border: 1px solid transparent;
        border-radius: var(--radius);
        font-family: var(--font-display);
        font-size: 0.9375rem;
        font-weight: 500;
        line-height: 1;
        text-decoration: none;
        white-space: nowrap;
        cursor: pointer;
        box-shadow: 0 1px 2px rgb(0 0 0 / 6%), 0 8px 20px rgb(0 0 0 / 4%);
        transition:
          background-color 160ms ease,
          transform 160ms ease,
          box-shadow 160ms ease;
      }
      .btn:hover { transform: translateY(-1px); }
      .btn:active { transform: translateY(0); }
      .btn-primary {
        background: var(--foreground);
        color: var(--background);
      }
      .btn-primary:hover { background: color-mix(in oklch, var(--foreground) 88%, var(--background)); }
      .btn-secondary {
        background: var(--card);
        color: var(--foreground);
        border-color: var(--border);
      }
      .btn-secondary:hover { background: var(--muted); }
      .help {
        margin: 2.5rem 0 0;
        font-size: 0.75rem;
        color: var(--muted-foreground);
      }
      .help a {
        font-weight: 500;
        color: var(--foreground);
        text-decoration: none;
      }
      .help a:hover { opacity: 0.6; }
      @media (prefers-reduced-motion: reduce) {
        .btn { transition: none; }
        .btn:hover, .btn:active { transform: none; }
      }
    </style>
  </head>
  <body>
    <main>
      <a class="brand" href="/" aria-label="Hardvoxel home">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true" shape-rendering="geometricPrecision">
          <path d="M5 9.449147L16 3.098294L27 9.449147L27 22.150853L16 28.501706L5 22.150853Z" fill="var(--cube-base)" />
          <path d="M16 3.098294L27 9.449147L16 15.8L5 9.449147Z" fill="var(--cube-top)" />
          <path d="M5 9.449147L16 15.8L16 28.501706L5 22.150853Z" fill="var(--cube-left)" />
          <path d="M16 15.8L27 9.449147L27 22.150853L16 28.501706Z" fill="var(--cube-right)" />
        </svg>
        <span class="wordmark">Hardvoxel</span>
      </a>
      <p class="eyebrow">Server error</p>
      <h1>The site didn't load.</h1>
      <p class="alert" role="alert">
        Hardvoxel couldn't render this page at all. The problem is on our side, not in your
        browser. Reload the site to try again.
      </p>
      <div class="actions">
        <button class="btn btn-primary" type="button" onclick="location.reload()">Reload site</button>
        <a class="btn btn-secondary" href="/">Go home</a>
      </div>
      <p class="help">
        If this keeps happening, email
        <a href="mailto:hello@hardvoxel.com">hello@hardvoxel.com</a>.
      </p>
    </main>
  </body>
</html>`;
}
