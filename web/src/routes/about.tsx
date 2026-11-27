import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Boxes, Code2, Container, Globe, Minus, Plus } from "lucide-react";

import { CTA } from "@/components/landing/CTA";
import { PageShell } from "@/components/landing/PageShell";
import { project } from "@/content/project";
import { pageHead } from "@/lib/seo";

const aboutFaq = [
  {
    question: "What is Hardvoxel?",
    answer:
      "Hardvoxel is an open-source CLI for running prebuilt OCI images on your own Docker host. It reads one config, pulls the image, and starts the container.",
  },
  {
    question: "Is it a hosting service?",
    answer:
      "No. There is no managed cloud, account, or paid plan on this site. The CLI runs on a host you control.",
  },
  {
    question: "Is Hardvoxel a PaaS?",
    answer:
      "No. There is no build pipeline, no Git integration, and no managed database. Hardvoxel runs prebuilt container images.",
  },
  {
    question: "Who is behind Hardvoxel?",
    answer: `Hardvoxel is a personal, non-commercial open-source project. For anything specific, email ${project.email}.`,
  },
];

const aboutFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: aboutFaq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export const Route = createFileRoute("/about")({
  head: () => ({
    ...pageHead({
      title: "About Hardvoxel | Open-source container deploys",
      description:
        "Hardvoxel is a personal, non-commercial open-source project for running prebuilt Docker images on your own host, without a cluster.",
      path: "/about",
    }),
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(aboutFaqSchema),
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell>
      <section className="studio-light relative overflow-hidden border-b border-border">
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-20 md:pt-28 md:pb-24">
          <h1 className="display max-w-4xl text-[clamp(3rem,8vw,6.5rem)]">
            One job:
            <br />
            <span className="italic font-light">deploy prebuilt images.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-base text-muted-foreground md:text-lg">
            Hardvoxel is an open-source CLI for running prebuilt OCI images on a Docker host you
            control. One config, one command, no cluster to operate.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href="/docs" className="btn btn-primary btn-md">
              Read the docs
              <ArrowRight size={16} strokeWidth={1.5} />
            </a>
            <a
              href="https://github.com/petermichon/hardvoxel"
              className="btn btn-secondary btn-md"
              target="_blank"
              rel="noreferrer"
            >
              View source
            </a>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="display text-5xl md:text-7xl">What it does.</h2>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            <article className="matte-card p-8">
              <Container size={20} strokeWidth={1.5} className="opacity-60" />
              <h3 className="display mt-6 text-3xl">Pull.</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Point Hardvoxel at a prebuilt image in Docker Hub, GHCR, or any OCI registry.
              </p>
            </article>
            <article className="matte-card p-8">
              <Boxes size={20} strokeWidth={1.5} className="opacity-60" />
              <h3 className="display mt-6 text-3xl">Run.</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Start containers with ports, environment, volumes, and a restart policy from one
                small config.
              </p>
            </article>
            <article className="matte-card p-8">
              <Globe size={20} strokeWidth={1.5} className="opacity-60" />
              <h3 className="display mt-6 text-3xl">Serve.</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Publish a port and put your own reverse proxy in front. Hardvoxel stays out of the
                network path.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-24 md:grid-cols-12 md:py-32">
          <div className="md:col-span-5">
            <h2 className="display text-5xl md:text-7xl">Principles.</h2>
            <p className="mt-6 max-w-md text-muted-foreground">
              A small tool is easier to trust and easier to keep working.
            </p>
          </div>
          <div className="md:col-span-7">
            <ul className="space-y-5 text-sm">
              <li className="flex items-start gap-3 border-b border-border pb-5">
                <Code2 size={16} strokeWidth={2} className="mt-0.5 shrink-0 opacity-60" />
                <span>Open source. Read it, run it, change it.</span>
              </li>
              <li className="flex items-start gap-3 border-b border-border pb-5">
                <Container size={16} strokeWidth={2} className="mt-0.5 shrink-0 opacity-60" />
                <span>Prebuilt images only. No build pipeline.</span>
              </li>
              <li className="flex items-start gap-3">
                <Minus size={16} strokeWidth={2} className="mt-0.5 shrink-0 opacity-60" />
                <span>No control plane, no cluster, no hosted service.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-24 md:grid-cols-12 md:py-32">
          <div className="md:col-span-5">
            <h2 className="display text-5xl md:text-7xl">Project.</h2>
            <p className="mt-6 max-w-md text-muted-foreground">
              Hardvoxel is a personal, non-commercial open-source project. The publisher&apos;s
              identification details are on file with the host.
            </p>
          </div>
          <div className="md:col-span-7">
            <dl className="matte-card space-y-4 p-6 font-mono text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-4">
                <dt className="text-muted-foreground">Project</dt>
                <dd>{project.name}</dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-4">
                <dt className="text-muted-foreground">Status</dt>
                <dd>Alpha, open source</dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-4">
                <dt className="text-muted-foreground">Host</dt>
                <dd className="text-right">
                  {project.host.name}, {project.host.address}
                </dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <dt className="text-muted-foreground">Contact</dt>
                <dd>
                  <a
                    href={`mailto:${project.email}`}
                    className="font-medium text-foreground hover:opacity-60"
                  >
                    {project.email}
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section id="roadmap" className="border-b border-border">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-24 md:grid-cols-12 md:py-32">
          <div className="md:col-span-5">
            <h2 className="display text-5xl md:text-7xl">Roadmap.</h2>
            <p className="mt-6 max-w-md text-muted-foreground">
              The current release runs containers on one Docker host. The larger goal is a simple
              capacity layer across servers.
            </p>
          </div>
          <div className="md:col-span-7">
            <ul className="space-y-5 text-sm">
              <li className="border-b border-border pb-5">
                <span className="font-medium text-foreground">Now.</span> Single-host CLI: one JSON
                config, up, down, status, and logs.
              </li>
              <li className="border-b border-border pb-5">
                <span className="font-medium text-foreground">Next.</span> Init command, health
                checks, start order, named networks, and reverse-proxy examples.
              </li>
              <li>
                <span className="font-medium text-foreground">Later.</span> Multi-server capacity
                pooling: one pool of memory, CPU, and storage across servers.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-24 md:py-32">
          <h2 className="display text-5xl md:text-7xl">Questions.</h2>
          <div className="mt-12">
            {aboutFaq.map((item) => (
              <details key={item.question} className="group border-t border-border py-6">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6">
                  <h3 className="text-lg font-medium">{item.question}</h3>
                  <Plus
                    size={18}
                    strokeWidth={1.5}
                    className="mt-1 shrink-0 opacity-60 transition-transform group-open:rotate-45"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CTA />
    </PageShell>
  );
}
