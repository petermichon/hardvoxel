import { Link } from "@tanstack/react-router";
import { ArrowRight, Github } from "lucide-react";

import { LogoMark } from "@/components/landing/LogoMark";

export function Hero() {
  return (
    <section className="studio-light relative overflow-hidden border-b border-border">
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 pt-20 pb-24 md:grid-cols-12 md:pt-28 md:pb-32">
        <div className="md:col-span-7">
          <h1 className="display text-[clamp(3rem,9vw,7.5rem)]">
            Container hosting
            <br />
            for your own
            <br />
            <span className="italic font-light">cloud.</span>
          </h1>
          <p className="mt-8 max-w-xl text-base text-muted-foreground md:text-lg">
            Open-source and self-hosted. Run prebuilt images on your own Docker host with one small
            config. Multi-server capacity pooling is on the roadmap.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/docs" className="btn btn-primary btn-md">
              Read the docs
              <ArrowRight size={16} strokeWidth={1.5} />
            </Link>
            <a
              href="https://github.com/petermichon/hardvoxel"
              className="btn btn-secondary btn-md"
              target="_blank"
              rel="noreferrer"
            >
              <Github size={16} strokeWidth={1.5} />
              View source
            </a>
          </div>
          <div className="mt-12 grid max-w-md grid-cols-3 gap-6 font-mono text-[13px] font-medium tracking-wide text-muted-foreground">
            <div>
              <div className="display text-3xl text-foreground">1</div>Docker host
            </div>
            <div>
              <div className="display text-3xl text-foreground">0</div>control planes
            </div>
            <div>
              <div className="display text-3xl text-foreground">100%</div>open source
            </div>
          </div>
        </div>
        <div className="relative md:col-span-5">
          <div className="relative mx-auto aspect-square w-full max-w-lg">
            <LogoMark variant="display" className="h-full w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
