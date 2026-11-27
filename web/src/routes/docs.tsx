import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/landing/PageShell";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/docs")({
  head: () =>
    pageHead({
      title: "Docs | Hardvoxel",
      description:
        "Run Hardvoxel from source, write a hardvoxel.json config, and deploy prebuilt OCI images to your own Docker host.",
      path: "/docs",
    }),
  component: DocsPage,
});

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-secondary p-5 font-mono text-[13px] leading-relaxed">
      {children}
    </pre>
  );
}

function DocsPage() {
  return (
    <PageShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <h1 className="display text-5xl md:text-7xl">Docs.</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Hardvoxel is alpha. Run it from source, point it at a prebuilt image, and keep the host
            you already have.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <h2 className="display text-3xl">Requirements</h2>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li>Node.js 22 or newer</li>
            <li>Docker Engine, running locally</li>
            <li>git</li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Podman works too: set{" "}
            <code className="font-mono text-foreground">HARDVOXEL_DOCKER=podman</code>.
          </p>

          <h2 className="display mt-16 text-3xl">Quickstart</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            Clone the repository and install the workspace:
          </p>
          <CodeBlock>{`git clone https://github.com/petermichon/hardvoxel.git
cd hardvoxel
bun install`}</CodeBlock>

          <p className="mt-6 text-sm text-muted-foreground">
            Create a <code className="font-mono text-foreground">hardvoxel.json</code> next to where
            you run the command:
          </p>
          <CodeBlock>{`{
  "project": "hello",
  "services": {
    "web": {
      "image": "nginx:1.27-alpine",
      "ports": ["8080:80"]
    }
  }
}`}</CodeBlock>

          <p className="mt-6 text-sm text-muted-foreground">Start it:</p>
          <CodeBlock>{`node packages/cli/bin/hardvoxel.js up`}</CodeBlock>
          <p className="mt-4 text-sm text-muted-foreground">
            Open <span className="font-mono text-foreground">http://localhost:8080</span>.
          </p>

          <h2 className="display mt-16 text-3xl">Commands</h2>
          <dl className="mt-6 space-y-3 text-sm text-muted-foreground">
            {[
              ["up", "Pull and start every service."],
              ["down", "Remove the project's containers."],
              ["status", "Show the project's containers."],
              ["logs <service>", "Follow one service's logs."],
              ["help", "Show the command list."],
            ].map(([command, description]) => (
              <div
                key={command}
                className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3 last:border-b-0"
              >
                <dt className="font-mono text-xs font-medium text-foreground">{command}</dt>
                <dd className="text-right">{description}</dd>
              </div>
            ))}
          </dl>

          <h2 className="display mt-16 text-3xl">Configuration</h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  {["Field", "Required", "Rules"].map((heading) => (
                    <th
                      key={heading}
                      className="py-3 pr-6 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ["project", "Yes", "Lowercase letters, digits, and dashes."],
                  ["services", "Yes", "At least one service."],
                  ["image", "Yes", "Any image reference Docker can pull."],
                  ["ports", "No", 'Strings like "8080:80".'],
                  ["env", "No", "Object of string, number, or boolean values."],
                  ["volumes", "No", 'Strings like "./data:/data".'],
                  ["restart", "No", "Docker restart policy; defaults to unless-stopped."],
                ].map(([field, required, rules]) => (
                  <tr key={field} className="border-b border-border">
                    <td className="py-3 pr-6 font-mono text-xs text-foreground">{field}</td>
                    <td className="py-3 pr-6">{required}</td>
                    <td className="py-3">{rules}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="display mt-16 text-3xl">What it does not do</h2>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li>No builds. You build and push the image.</li>
            <li>No Compose files, networks, dependencies, or health checks.</li>
            <li>No domains or TLS. Put a reverse proxy in front if you need them.</li>
            <li>No hosted service. The CLI runs on your host.</li>
            <li>No multi-server pooling yet. The current CLI targets one Docker host.</li>
          </ul>

          <h2 className="display mt-16 text-3xl">Roadmap</h2>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li>Now: single-host CLI with one config.</li>
            <li>Next: init, health checks, start order, and networks.</li>
            <li>Later: multi-server capacity pooling across machines.</li>
          </ul>

          <p className="mt-12 text-sm text-muted-foreground">
            See also{" "}
            <a href="/features" className="font-medium text-foreground hover:opacity-60">
              features
            </a>{" "}
            and{" "}
            <a href="/about" className="font-medium text-foreground hover:opacity-60">
              about the project
            </a>
            .
          </p>
        </div>
      </section>
    </PageShell>
  );
}
