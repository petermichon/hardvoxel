import { createFileRoute, Link } from "@tanstack/react-router";

import { PageShell } from "@/components/landing/PageShell";
import { project } from "@/content/project";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead({
      title: "Website terms of use | Hardvoxel",
      description:
        "The terms for using the Hardvoxel website: acceptable use, intellectual property, disclaimers, and how changes are handled. No paid service terms yet.",
      path: "/terms",
    }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PageShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <h1 className="display text-5xl md:text-7xl">Terms.</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            The terms that apply to this website.
          </p>
          <p className="mt-4 font-mono text-xs font-medium tracking-wide text-muted-foreground">
            Last updated: 7 November 2026
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <h2 className="display text-3xl">Using this site</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            By using this website, you accept these terms. If you do not accept them, do not use the
            site.
          </p>

          <h2 className="display mt-16 text-3xl">What this site is</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            This site documents Hardvoxel, an open-source project. The software is alpha, so
            features and the config format may change. Browsing the site does not create a service
            agreement, and no hosted service is offered.
          </p>

          <h2 className="display mt-16 text-3xl">Acceptable use</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            You may read and share the public content. You may not use the site to break the law,
            attempt to disrupt it, probe it for vulnerabilities without permission, or interfere
            with other visitors.
          </p>

          <h2 className="display mt-16 text-3xl">Intellectual property</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            The site content, design, and Hardvoxel brand are owned by Hardvoxel or used with
            permission. Third-party names and marks belong to their owners; see the{" "}
            <Link to="/legal" className="font-medium text-foreground hover:opacity-60">
              legal notice
            </Link>
            .
          </p>

          <h2 className="display mt-16 text-3xl">No warranty</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            The site is provided for information only. We try to keep it accurate, but we do not
            warrant that the content is complete, current, or error-free, or that the site will be
            available without interruption.
          </p>

          <h2 className="display mt-16 text-3xl">Liability</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            To the extent permitted by law, Hardvoxel is not liable for indirect or consequential
            loss arising from use of this website. Nothing in these terms limits liability that
            cannot be limited under applicable law.
          </p>

          <h2 className="display mt-16 text-3xl">Changes</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            We may update these terms as the site and product change. The date at the top shows the
            current version. Continued use of the site after a change means you accept the updated
            terms.
          </p>

          <h2 className="display mt-16 text-3xl">Law and contact</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            These terms are governed by French law, without prejudice to mandatory consumer
            protections. The site is operated as a personal, non-commercial open-source project.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Questions:{" "}
            <a
              href={`mailto:${project.email}`}
              className="font-medium text-foreground hover:opacity-60"
            >
              {project.email}
            </a>
            .
          </p>

          <p className="mt-10 text-sm text-muted-foreground">
            See also our{" "}
            <Link to="/privacy" className="font-medium text-foreground hover:opacity-60">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </section>
    </PageShell>
  );
}
