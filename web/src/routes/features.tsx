import { createFileRoute } from "@tanstack/react-router";

import { CTA } from "@/components/landing/CTA";
import { Features } from "@/components/landing/Features";
import { PageShell } from "@/components/landing/PageShell";
import { featureFaqSchema } from "@/content/features";
import { articleSchema, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/features")({
  head: () => ({
    ...pageHead({
      title: "Features | Hardvoxel",
      description:
        "An open-source CLI for prebuilt OCI images: one JSON config, one command, and your own Docker host.",
      path: "/features",
      image: "/og-features.jpg",
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(featureFaqSchema),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          articleSchema({
            headline: "Hardvoxel features",
            description:
              "Open source, prebuilt images, one small config, and no cluster to operate.",
            path: "/features",
          }),
        ),
      },
    ],
  }),
  component: FeaturesPage,
});

function FeaturesPage() {
  return (
    <PageShell>
      <Features headingLevel="h1" />
      <CTA />
    </PageShell>
  );
}
