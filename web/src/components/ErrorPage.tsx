import { useEffect, useRef } from "react";

import { SITE_NOINDEX } from "@/lib/seo";
import { Logo } from "./landing/Logo";

export function ErrorPage({ onRetry }: { onRetry: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      headingRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <title>This page didn't load | Hardvoxel</title>
      {SITE_NOINDEX ? null : <meta name="robots" content="noindex, nofollow" />}
      <meta
        name="description"
        content="This page didn't load. The rest of the site is still running."
      />
      <main className="studio-light relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16">
        <div className="relative w-full max-w-lg text-center">
          <div className="flex justify-center">
            <Logo />
          </div>
          <p className="mt-10 font-mono text-xs font-semibold tracking-widest uppercase text-muted-foreground">
            Page error
          </p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="display mt-4 text-4xl focus:outline-none md:text-5xl"
          >
            This page didn't load.
          </h1>
          <p role="alert" className="mt-4 text-sm text-muted-foreground md:text-base">
            The rest of Hardvoxel is still running. This page hit a problem while loading. Try
            again, or head back home.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={onRetry} className="btn btn-primary btn-md">
              Try again
            </button>
            <a href="/" className="btn btn-secondary btn-md">
              Go home
            </a>
          </div>
          <p className="mt-10 text-xs text-muted-foreground">
            If this keeps happening, email{" "}
            <a
              href="mailto:hello@hardvoxel.com"
              className="font-medium text-foreground hover:opacity-60"
            >
              hello@hardvoxel.com
            </a>
            .
          </p>
        </div>
      </main>
    </>
  );
}
