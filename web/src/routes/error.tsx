import { createFileRoute, notFound } from "@tanstack/react-router";

import { ErrorPage } from "@/components/ErrorPage";

// Temporary route for previewing the error page in development.
// In a production build it behaves like any other unknown path (404).
export const Route = createFileRoute("/error")({
  beforeLoad: () => {
    if (!import.meta.env.DEV) {
      throw notFound();
    }
  },
  component: ErrorPreviewPage,
});

function ErrorPreviewPage() {
  return (
    <>
      <ErrorPage onRetry={() => window.location.reload()} />
      <a
        href="/error-fallback"
        className="fixed right-4 bottom-4 z-50 rounded-full border border-border bg-background px-4 py-2 font-mono text-xs font-medium tracking-wide text-muted-foreground shadow-sm transition-colors hover:text-foreground"
      >
        Server fallback
      </a>
    </>
  );
}
