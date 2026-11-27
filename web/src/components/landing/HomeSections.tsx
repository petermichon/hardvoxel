import { Link } from "@tanstack/react-router";
import { ArrowRight, Plus } from "lucide-react";

import { homeFaq } from "@/content/home";

const steps = [
  {
    title: "Write a config",
    desc: "Describe the image, ports, environment, and volumes in one hardvoxel.json file.",
  },
  {
    title: "Run one command",
    desc: "Hardvoxel pulls the image and starts the container on the Docker host you control.",
  },
  {
    title: "Keep the host",
    desc: "There is no control plane to operate. The CLI exits; Docker keeps the container running.",
  },
];

export function HomeSteps() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 className="display text-5xl md:text-6xl lg:text-7xl">
              From config
              <br />
              to container.
            </h2>
          </div>
          <p className="max-w-sm text-muted-foreground">
            Build and push the image in your own pipeline. Hardvoxel handles the local deploy, then
            gets out of the way.
          </p>
        </div>
        <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="matte-card p-8">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border font-mono text-xs font-semibold">
                {index + 1}
              </span>
              <h3 className="display mt-6 text-3xl">{step.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{step.desc}</p>
            </li>
          ))}
        </ol>
        <Link to="/docs" className="btn btn-secondary btn-md mt-10">
          Read the docs
          <ArrowRight size={16} strokeWidth={1.5} />
        </Link>
      </div>
    </section>
  );
}

export function HomeFaq() {
  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-4xl px-6 py-24 md:py-32">
        <h2 className="display text-5xl md:text-6xl lg:text-7xl">Questions.</h2>
        <div className="mt-12">
          {homeFaq.map((item) => (
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
        <nav
          aria-label="Related reading"
          className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-6 text-sm"
        >
          <Link to="/features" className="font-medium text-foreground hover:opacity-60">
            Features
          </Link>
          <Link to="/docs" className="font-medium text-foreground hover:opacity-60">
            Docs
          </Link>
        </nav>
      </div>
    </section>
  );
}
