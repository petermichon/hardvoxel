import { createFileRoute } from "@tanstack/react-router";

import { PageShell } from "@/components/landing/PageShell";
import { project } from "@/content/project";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/legal")({
  head: () =>
    pageHead({
      title: "Legal and trademarks | Hardvoxel",
      description:
        "Docker trademark attribution, copyright notice, third-party marks, and contact details for Hardvoxel. Read the legal notice that applies to this site.",
      path: "/legal",
    }),
  component: LegalPage,
});

function LegalPage() {
  return (
    <PageShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <h1 className="display text-5xl md:text-7xl">Legal.</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Trademark attribution, copyright, and how to reach us.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <h2 className="display text-3xl">Trademarks</h2>
          <div className="mt-6 space-y-4 text-sm text-muted-foreground">
            <p>
              Docker and the Docker logo are trademarks or registered trademarks of Docker, Inc. in
              the United States and/or other countries. Hardvoxel is not affiliated with, endorsed
              by, or sponsored by Docker, Inc.
            </p>
            <p>
              Other product names, logos, and brands mentioned on this site are the property of
              their respective owners and are used for identification purposes only. Their use does
              not imply any affiliation with or endorsement by those owners.
            </p>
          </div>

          <h2 className="display mt-16 text-3xl">Copyright</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            © {new Date().getFullYear()} Hardvoxel.
          </p>

          <h2 className="display mt-16 text-3xl">Publisher</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            Hardvoxel is a personal, non-commercial open-source project.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Under Article 1-1 II of the LCEN, the publisher&apos;s identification details have been
            communicated to the host and are not published here. The host may disclose them to a
            judicial authority.
          </p>

          <h2 className="display mt-16 text-3xl">Host</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            {project.host.name}, {project.host.address}. {project.host.phone}.
          </p>

          <h2 className="display mt-16 text-3xl">Contact</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            Questions about this notice:{" "}
            <a
              href={`mailto:${project.email}`}
              className="font-medium text-foreground hover:opacity-60"
            >
              {project.email}
            </a>
            .
          </p>
        </div>
      </section>
    </PageShell>
  );
}
