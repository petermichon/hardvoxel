import { createFileRoute, notFound } from "@tanstack/react-router";

// Catch-all for unknown paths. The root notFoundComponent renders the page and
// supplies its metadata; throwing notFound keeps the response a real 404.
export const Route = createFileRoute("/$")({
  beforeLoad: () => {
    throw notFound();
  },
});
