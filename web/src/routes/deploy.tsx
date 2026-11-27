import { createFileRoute, redirect } from "@tanstack/react-router";

// The deploy page was merged into docs. Keep the old URL working for inbound links.
export const Route = createFileRoute("/deploy")({
  beforeLoad: () => {
    throw redirect({ to: "/docs", statusCode: 301, replace: true });
  },
});
