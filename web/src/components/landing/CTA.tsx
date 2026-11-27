import { Link } from "@tanstack/react-router";
import { ArrowRight, Github } from "lucide-react";

export function CTA() {
  return (
    <section className="studio-light relative overflow-hidden border-b border-border">
      <div className="relative mx-auto max-w-7xl px-6 py-28 text-center md:py-40">
        <h2 className="display mx-auto max-w-4xl text-5xl md:text-7xl lg:text-8xl">
          Ship your next project <span className="italic font-light">without the cluster.</span>
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
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
      </div>
    </section>
  );
}
