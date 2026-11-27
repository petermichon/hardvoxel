import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";

import { footerColumns, type FooterHref } from "@/content/landing";
import { Logo } from "./Logo";

function isMailto(href: FooterHref): href is `mailto:${string}` {
  return href.startsWith("mailto:");
}

const footerLinkClass = "inline-flex items-center gap-2 font-medium hover:opacity-60";

export function Footer() {
  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-4">
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Open-source, self-hosted container hosting. Your servers, your config.
            </p>
          </div>
          {footerColumns.map((column) => (
            <div
              key={column.title}
              className={column.title === "Project" ? "col-span-2 md:col-span-1" : undefined}
            >
              <div className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {column.title}
              </div>
              <ul
                className={
                  column.title === "Project"
                    ? "mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:block md:space-y-2"
                    : "mt-4 space-y-2 text-sm"
                }
              >
                {column.links.map((link) => (
                  <li key={link.label}>
                    {isMailto(link.href) ? (
                      <a href={link.href} className={footerLinkClass}>
                        <Mail size={14} strokeWidth={1.5} aria-hidden />
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className={footerLinkClass}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 font-mono text-xs font-medium tracking-normal text-muted-foreground md:flex-row md:items-center">
          <span>© {new Date().getFullYear()} Hardvoxel</span>
          <Link to="/legal" className="font-medium text-foreground hover:opacity-60">
            Legal
          </Link>
        </div>
      </div>
    </footer>
  );
}
