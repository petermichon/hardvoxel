import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Github, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { exploreNav, mobileNavOrder, navSections } from "@/content/navigation";
import { Logo } from "./Logo";

const navLinkClass =
  "py-2 text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-foreground";

const mobileLinkClass =
  "block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:text-foreground";

const sectionLinkClass =
  "block py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-foreground";

const panelClass =
  "absolute inset-x-0 top-full z-50 border-b border-border bg-background shadow-[0_24px_48px_-24px_rgba(0,0,0,0.22)]";

export function Nav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const exploreButtonRef = useRef<HTMLButtonElement>(null);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setExploreOpen(false);
    setMobileOpen(false);
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (headerRef.current?.contains(event.target as Node)) return;
      setExploreOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setExploreOpen(false);
      exploreButtonRef.current?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
        <Logo />

        <nav
          className="hidden items-center gap-6 text-[15px] font-medium lg:flex lg:gap-8"
          aria-label="Primary"
        >
          <button
            ref={exploreButtonRef}
            type="button"
            aria-expanded={exploreOpen}
            aria-controls="explore-menu"
            onClick={() => setExploreOpen((open) => !open)}
            className={`${navLinkClass} inline-flex cursor-pointer items-center gap-1.5 aria-expanded:text-foreground`}
          >
            Explore
            <ChevronDown
              size={16}
              strokeWidth={1.5}
              aria-hidden
              className={`transition-transform duration-150 ${exploreOpen ? "rotate-180" : ""}`}
            />
          </button>

          <Link to="/docs" className={navLinkClass}>
            Docs
          </Link>

          <a
            href="https://github.com/petermichon/hardvoxel"
            className={`${navLinkClass} inline-flex items-center gap-1.5`}
            target="_blank"
            rel="noreferrer"
          >
            <Github size={16} strokeWidth={1.5} aria-hidden />
            GitHub
          </a>

          <div
            id="explore-menu"
            className={`${panelClass} ${exploreOpen ? "animate-in fade-in-0 slide-in-from-top-1 duration-150 motion-reduce:animate-none" : "hidden"}`}
          >
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-6 py-8">
              {exploreNav.map((id) => (
                <div key={id}>
                  <div className="text-base font-semibold tracking-[-0.01em] text-foreground">
                    {navSections[id].title}
                  </div>
                  <ul className="mt-3">
                    {navSections[id].links.map((link) => (
                      <li key={link.label}>
                        <Link
                          to={link.to}
                          className={sectionLinkClass}
                          onClick={() => setExploreOpen(false)}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <details
            ref={detailsRef}
            className="lg:hidden"
            onToggle={(event) => setMobileOpen(event.currentTarget.open)}
          >
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-accent [&::-webkit-details-marker]:hidden">
              {mobileOpen ? (
                <X size={18} strokeWidth={1.5} aria-hidden />
              ) : (
                <Menu size={18} strokeWidth={1.5} aria-hidden />
              )}
              <span className="sr-only">{mobileOpen ? "Close menu" : "Menu"}</span>
            </summary>
            <div className="fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto overscroll-contain border-t border-border bg-background lg:hidden">
              <nav aria-label="Mobile" className="mx-auto max-w-7xl px-4 pt-6 pb-10 sm:px-6">
                {mobileNavOrder.map((id) => (
                  <section
                    key={id}
                    className="border-b border-border py-5 first:pt-0 last:border-b-0"
                  >
                    <div className="text-base font-semibold tracking-[-0.01em] text-foreground">
                      {navSections[id].title}
                    </div>
                    <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-0.5">
                      {navSections[id].links.map((link) => (
                        <li key={link.label}>
                          <Link
                            to={link.to}
                            className={mobileLinkClass}
                            onClick={() => {
                              if (detailsRef.current) detailsRef.current.open = false;
                            }}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm font-medium text-muted-foreground">Theme</span>
                  <ThemeToggle />
                </div>
              </nav>
            </div>
          </details>

          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          <Link to="/docs" className="btn btn-primary btn-sm">
            <span className="sm:hidden">Docs</span>
            <span className="hidden sm:inline">Read the docs</span>
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </header>
  );
}
