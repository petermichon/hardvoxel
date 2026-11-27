import { features } from "@/content/landing";

export function Features({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" }) {
  const SectionHeading = headingLevel;
  const CardHeading = headingLevel === "h1" ? "h2" : "h3";

  return (
    <section className="border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <SectionHeading className="display text-5xl md:text-6xl lg:text-7xl">
              Small surface.
              <br />
              Clear jobs.
            </SectionHeading>
          </div>
          <p className="max-w-sm text-muted-foreground">
            Hardvoxel does three things: read a config, pull an image, and run it on your Docker
            host. Everything else is yours.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="matte-card flex flex-col p-8">
                <div className="flex items-start gap-3">
                  <Icon size={20} strokeWidth={1.5} className="mt-1.5 shrink-0 opacity-60" />
                  <CardHeading className="display text-3xl">{feature.title}</CardHeading>
                </div>
                <p className="mt-3 text-sm opacity-80">{feature.desc}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
