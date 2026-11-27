import { createFileRoute, Link } from "@tanstack/react-router";

import { PageShell } from "@/components/landing/PageShell";
import { project } from "@/content/project";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead({
      title: "Privacy policy | Hardvoxel",
      description:
        "How Hardvoxel handles personal data: emails you send, standard server logs, and the theme preference stored in your browser. No analytics or ad cookies.",
      path: "/privacy",
    }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PageShell>
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
          <h1 className="display text-5xl md:text-7xl">Privacy.</h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            How Hardvoxel handles personal data on this website.
          </p>
          <p className="mt-4 font-mono text-xs font-medium tracking-wide text-muted-foreground">
            Last updated: 7 November 2026
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
          <h2 className="display text-3xl">Who we are</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            The publisher of this site is the data controller for the limited processing described
            here. Hardvoxel is a personal, non-commercial open-source project. For privacy
            questions, contact{" "}
            <a
              href={`mailto:${project.email}`}
              className="font-medium text-foreground hover:opacity-60"
            >
              {project.email}
            </a>
            .
          </p>

          <h2 className="display mt-16 text-3xl">What we collect</h2>
          <div className="mt-6 space-y-5 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Messages you send us.</span> If you
              email us, we receive your email address, the content of your message, and any details
              you choose to include. We use this to reply and to handle the request.
            </p>
            <p>
              <span className="font-medium text-foreground">Standard server logs.</span> When the
              site is served, the hosting infrastructure may process technical data such as IP
              address, browser user agent, requested URL, and timestamp. This is used for security,
              reliability, and troubleshooting.
            </p>
            <p>
              <span className="font-medium text-foreground">Theme preference.</span> The light or
              dark choice is stored in your browser&apos;s local storage. It stays on your device
              and is not sent to us.
            </p>
          </div>

          <h2 className="display mt-16 text-3xl">What we do not collect</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            This website does not use analytics, advertising cookies, tracking pixels, or
            third-party font requests. There are no user accounts yet, so we do not collect account
            or billing data.
          </p>

          <h2 className="display mt-16 text-3xl">Why we process it</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            We process emails to respond to you and, where relevant, to take steps before entering
            into an agreement. We process server logs on the basis of our legitimate interest in
            keeping the site secure and available.
          </p>

          <h2 className="display mt-16 text-3xl">How long we keep it</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            Emails are kept for as long as needed to handle your request and meet legal obligations.
            Server logs are kept only as long as needed for security and troubleshooting. The theme
            preference stays in your browser until you clear it.
          </p>

          <h2 className="display mt-16 text-3xl">Your rights</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            Under the GDPR, you can request access to your personal data, correction, erasure,
            restriction, or objection to processing, and you can request portability where it
            applies. Email{" "}
            <a
              href="mailto:hello@hardvoxel.com"
              className="font-medium text-foreground hover:opacity-60"
            >
              hello@hardvoxel.com
            </a>
            . You also have the right to complain to your local supervisory authority; in France,
            that is the CNIL.
          </p>

          <h2 className="display mt-16 text-3xl">Changes</h2>
          <p className="mt-6 text-sm text-muted-foreground">
            This policy will be revised when the product opens to customers and when payment,
            accounts, or analytics are introduced. The date at the top shows the current version.
          </p>

          <p className="mt-10 text-sm text-muted-foreground">
            See also our{" "}
            <Link to="/terms" className="font-medium text-foreground hover:opacity-60">
              website terms
            </Link>{" "}
            and{" "}
            <Link to="/legal" className="font-medium text-foreground hover:opacity-60">
              legal notice
            </Link>
            .
          </p>
        </div>
      </section>
    </PageShell>
  );
}
