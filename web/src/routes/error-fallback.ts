import { createFileRoute } from "@tanstack/react-router";

import { renderErrorPage } from "@/lib/error-page";

/**
 * Development-only preview of the catastrophic SSR fallback, the raw HTML page
 * returned when the app itself cannot render. In production it behaves like an
 * unknown path.
 */
export const Route = createFileRoute("/error-fallback")({
  server: {
    handlers: {
      GET: () => {
        if (!import.meta.env.DEV) {
          return new Response("Not found", { status: 404 });
        }

        return new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      },
    },
  },
});
