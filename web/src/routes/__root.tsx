import {
  Outlet,
  Link,
  createRootRoute,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { type ReactNode } from "react";
import spaceGroteskLatin from "@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2?url";
import jetBrainsMonoLatin from "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url";

import { PageShell } from "../components/landing/PageShell";
import { ErrorPage } from "../components/ErrorPage";
import { ThemeProvider } from "../components/ThemeProvider";
import { project } from "../content/project";
import {
  DEFAULT_OG_IMAGE,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  SITE_NAME,
  SITE_NOINDEX,
  SITE_URL,
} from "../lib/seo";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <>
      <title>Page not found | Hardvoxel</title>
      {SITE_NOINDEX ? null : <meta name="robots" content="noindex, nofollow" />}
      <meta
        name="description"
        content="The page you are looking for does not exist or has been moved."
      />
      <meta property="og:title" content="Page not found | Hardvoxel" />
      <meta
        property="og:description"
        content="The page you are looking for does not exist or has been moved."
      />
      <meta name="twitter:title" content="Page not found | Hardvoxel" />
      <meta
        name="twitter:description"
        content="The page you are looking for does not exist or has been moved."
      />
      <PageShell>
        <section className="studio-light relative overflow-hidden border-b border-border">
          <div className="relative mx-auto flex min-h-[60vh] max-w-7xl flex-col items-start justify-center px-6 py-24 md:py-32">
            <p className="font-mono text-xs font-semibold tracking-widest uppercase text-muted-foreground">
              404
            </p>
            <h1 className="display mt-6 text-[clamp(3rem,8vw,6.5rem)]">
              Page not
              <br />
              <span className="italic font-light">found.</span>
            </h1>
            <p className="mt-8 max-w-xl text-base text-muted-foreground md:text-lg">
              The page you're looking for doesn't exist or has been moved. Try the homepage, or read
              the docs.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/" className="btn btn-primary btn-md">
                Go home
              </Link>
              <Link to="/docs" className="btn btn-secondary btn-md">
                Read the docs
              </Link>
            </div>
          </div>
        </section>
      </PageShell>
    </>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <ErrorPage
      onRetry={() => {
        router.invalidate();
        reset();
      }}
    />
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      ...(SITE_NOINDEX ? [{ name: "robots", content: "noindex, nofollow" }] : []),
      { name: "author", content: SITE_NAME },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:type", content: "website" },
      { property: "og:image", content: DEFAULT_OG_IMAGE },
      { property: "og:image:width", content: String(OG_IMAGE_WIDTH) },
      { property: "og:image:height", content: String(OG_IMAGE_HEIGHT) },
      { property: "og:image:alt", content: "Hardvoxel self-hosted container hosting" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: DEFAULT_OG_IMAGE },
      { name: "twitter:image:alt", content: "Hardvoxel self-hosted container hosting" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": `${SITE_URL}/#organization`,
              name: SITE_NAME,
              url: SITE_URL,
              logo: `${SITE_URL}/favicon.svg`,
              description:
                "An open-source project for running prebuilt Docker images from any OCI registry.",
              email: project.email,
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "technical",
                email: project.email,
                availableLanguage: ["English", "French"],
              },
            },
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              name: SITE_NAME,
              url: SITE_URL,
              publisher: { "@id": `${SITE_URL}/#organization` },
            },
          ],
        }),
      },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      {
        rel: "preload",
        href: spaceGroteskLatin,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: jetBrainsMonoLatin,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const fouc = `(function(){try{var t=localStorage.getItem('theme');var d=document.documentElement;if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches)){d.classList.add('dark')}}catch(e){}})();`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: fouc }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <ThemeProvider>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </ThemeProvider>
  );
}
