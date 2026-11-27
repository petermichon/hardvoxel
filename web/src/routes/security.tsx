import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/landing/PageShell";
import { project } from "@/content/project";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/security")({
  head: () =>
    pageHead({
      title: "Security | Hardvoxel",
      description:
        "How Hardvoxel's self-hosted CLI touches Docker, what you control, and how to report a vulnerability.",
      path: "/security",
    }),
  component: SecurityPage,
});

function SecurityPage() {
  return (
    <PageShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <h1 className="display text-5xl md:text-7xl">Security.</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Hardvoxel is a local CLI. It runs Docker commands on the host where you invoke it and
            does not expose a network service of its own.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <h2 className="display text-3xl">What the CLI touches</h2>
          <div className="mt-6 space-y-5 text-sm text-muted-foreground">
            <p>
              It reads <code className="font-mono text-foreground">hardvoxel.json</code>, validates
              it, and calls the Docker CLI to pull images and run containers.
            </p>
            <p>
              It does not run a daemon, open a port, store credentials, or send data to a Hardvoxel
              server.
            </p>
          </div>

          <h2 className="display mt-16 text-3xl">What you control</h2>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li>Which images run and where they come from.</li>
            <li>Ports, environment variables, volumes, and restart policy.</li>
            <li>The Docker daemon, the host, and the network.</li>
            <li>Secrets, backups, and updates.</li>
          </ul>

          <h2 className="display mt-16 text-3xl">Docker is your boundary</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            Container isolation, image trust, and host hardening are Docker and operating-system
            concerns. Run the CLI with the same care you give any process that can talk to the
            Docker socket.
          </p>

          <h2 className="display mt-16 text-3xl">Report a vulnerability</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            Do not open a public issue. Email{" "}
            <a
              href={`mailto:${project.email}`}
              className="font-medium text-foreground hover:opacity-60"
            >
              {project.email}
            </a>{" "}
            with a description, the affected commit, and a minimal reproduction if possible.
          </p>

          <h2 className="display mt-16 text-3xl">No warranty</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            The software is provided as is, without warranty. See the repository licence for the
            full disclaimer.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
