import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";

import { cliExample } from "@/content/landing";

export function DeploySection() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyCommand() {
    const command = `${cliExample.install}\n${cliExample.deploy}`;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="border-b border-border bg-foreground text-background dark:bg-secondary dark:text-foreground">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-6 py-24 md:grid-cols-2 md:py-32">
        <div>
          <h2 className="display text-5xl md:text-6xl lg:text-7xl">
            Config in.
            <br />
            Container out.
            <br />
            Running.
          </h2>
          <p className="mt-6 max-w-md opacity-70">
            Hardvoxel reads the config, pulls the exact image, and starts the container on your
            Docker host. No build pipeline, no cluster, no hosted service.
          </p>
          <Link to="/docs" className="btn btn-on-dark btn-md mt-10">
            Read the docs
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </div>
        <div className="min-w-0 overflow-hidden rounded-xl border border-white/15 bg-white/5 md:self-center">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-widest opacity-50">
              Example output
            </span>
            <button
              type="button"
              onClick={copyCommand}
              className="inline-flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 font-mono text-xs font-medium opacity-70 transition-opacity hover:opacity-100"
            >
              {copied ? (
                <Check size={14} strokeWidth={2} aria-hidden />
              ) : (
                <Copy size={14} strokeWidth={1.5} aria-hidden />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
            <span aria-live="polite" className="sr-only">
              {copied ? "Command copied" : ""}
            </span>
          </div>
          <div className="min-w-0 space-y-5 p-5 font-mono text-[13px] leading-relaxed sm:p-6">
            <div className="space-y-1">
              <div className="break-all">
                <span className="opacity-50">$ </span>
                {cliExample.install}
              </div>
              <div>
                <span className="opacity-50">$ </span>
                cd hardvoxel
              </div>
              <div className="break-all">
                <span className="opacity-50">$ </span>
                {cliExample.deploy}
              </div>
            </div>
            <div className="space-y-2 text-[12px] sm:text-[13px]">
              {cliExample.steps.map((step) => (
                <div key={step.label} className="flex items-baseline gap-3">
                  <span className="opacity-50">-</span>
                  <span>{step.label}</span>
                  <span aria-hidden className="flex-1 border-b border-dotted border-current/20" />
                  <span>{step.status}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 border-t border-white/10 pt-5 text-[12px] sm:text-[13px]">
              <div className="opacity-70">✓ live at</div>
              <div className="break-all">{cliExample.url}</div>
              <div className="pt-1 opacity-60">{cliExample.meta}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
