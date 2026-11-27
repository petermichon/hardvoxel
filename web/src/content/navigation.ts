/** Every static page that appears in the site navigation. */
export type NavHref =
  | "/"
  | "/features"
  | "/docs"
  | "/about"
  | "/security"
  | "/legal"
  | "/privacy"
  | "/terms";

export type NavLink = { label: string; to: NavHref };

export type NavSectionId = "product" | "project";

export type NavSection = {
  id: NavSectionId;
  title: string;
  links: NavLink[];
};

/**
 * Single source of truth for navigation. `web/tests/nav.test.ts` checks that
 * every link points at a real static route.
 */
export const navSections: Record<NavSectionId, NavSection> = {
  product: {
    id: "product",
    title: "Product",
    links: [
      { label: "Overview", to: "/" },
      { label: "Features", to: "/features" },
      { label: "Docs", to: "/docs" },
    ],
  },
  project: {
    id: "project",
    title: "Project",
    links: [
      { label: "About", to: "/about" },
      { label: "Security", to: "/security" },
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
      { label: "Legal", to: "/legal" },
    ],
  },
};

/** Sections in the desktop Explore panel, left to right. */
export const exploreNav: NavSectionId[] = ["product", "project"];

/** Mobile sheet order. */
export const mobileNavOrder: NavSectionId[] = ["product", "project"];
