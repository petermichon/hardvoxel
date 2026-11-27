import { createFileRoute } from "@tanstack/react-router";

import { CTA } from "@/components/landing/CTA";
import { DeploySection } from "@/components/landing/DeploySection";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { HomeFaq, HomeSteps } from "@/components/landing/HomeSections";
import { PageShell } from "@/components/landing/PageShell";
import { Ticker } from "@/components/landing/Ticker";
import { homeFaqSchema } from "@/content/home";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    ...pageHead({
      title: "Container hosting for your own cloud | Hardvoxel",
      description:
        "Open-source, self-hosted container hosting. Run prebuilt OCI images on your own Docker host with one small config. Multi-server pooling is on the roadmap.",
      path: "/",
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(homeFaqSchema),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PageShell>
      <Hero />
      <Ticker />
      <Features />
      <HomeSteps />
      <DeploySection />
      <HomeFaq />
      <CTA />
    </PageShell>
  );
}
