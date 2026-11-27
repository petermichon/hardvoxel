import { tickerItems } from "@/content/landing";

export function Ticker() {
  return (
    <section className="border-b border-border bg-foreground py-5 text-background dark:bg-secondary dark:text-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-center gap-3 px-6 md:flex-row md:items-center md:gap-6">
        <span className="shrink-0 font-mono text-xs font-semibold uppercase tracking-widest opacity-50">
          Works with
        </span>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-sm font-semibold uppercase tracking-widest">
          {tickerItems.map((item, index) => (
            <li key={item} className={index >= 6 ? "max-sm:hidden" : undefined}>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
