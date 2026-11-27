const FALLBACK_SITE_URL = "https://hardvoxel.com";

/**
 * Canonical production URL. Override with VITE_SITE_URL if the site moves to
 * a different host. Staging deployments should keep the production URL and
 * set VITE_NOINDEX=true instead.
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL?.trim() || FALLBACK_SITE_URL).replace(
  /\/$/,
  "",
);
export const SITE_NAME = "Hardvoxel";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og.jpg`;
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const CONTENT_UPDATED_ISO = "2026-11-07";
export const CONTENT_UPDATED_LABEL = "7 November 2026";

/** Set VITE_NOINDEX=true on staging or preview deployments. */
export const SITE_NOINDEX = import.meta.env.VITE_NOINDEX === "true";

type PageHeadInput = {
  title: string;
  description: string;
  /** Absolute path on the site, including the leading slash. */
  path: string;
  /** Absolute URL for the social card. Defaults to the sitewide image. */
  image?: string;
  imageAlt?: string;
};

/**
 * Shared metadata for a page: title, description, social tags, and canonical URL.
 * Route-level head content overrides the sitewide defaults in `__root.tsx`.
 */
export function pageHead({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  imageAlt,
}: PageHeadInput) {
  const url = `${SITE_URL}${path}`;
  const alt = imageAlt ?? title;
  const imageUrl = image
    ? image.startsWith("/")
      ? `${SITE_URL}${image}`
      : image
    : DEFAULT_OG_IMAGE;

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:image", content: imageUrl },
      { property: "og:image:width", content: String(OG_IMAGE_WIDTH) },
      { property: "og:image:height", content: String(OG_IMAGE_HEIGHT) },
      { property: "og:image:alt", content: alt },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: imageUrl },
      { name: "twitter:image:alt", content: alt },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

type BreadcrumbItem = {
  name: string;
  /** Absolute path on the site, including the leading slash. */
  path: string;
};

/** BreadcrumbList JSON-LD for a page's visible breadcrumb trail. */
export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

type ArticleInput = {
  headline: string;
  description: string;
  /** Absolute path on the site, including the leading slash. */
  path: string;
  dateModified?: string;
  datePublished?: string;
  /** Official sources the page references. */
  citation?: string[];
};

/** TechArticle JSON-LD for guides, comparisons, and documentation. */
export function articleSchema({
  headline,
  description,
  path,
  dateModified = CONTENT_UPDATED_ISO,
  datePublished = dateModified,
  citation,
}: ArticleInput) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline,
    description,
    datePublished,
    dateModified,
    inLanguage: "en",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}${path}`,
    },
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
    },
    ...(citation?.length ? { citation } : {}),
  };
}

type HowToInput = {
  name: string;
  description: string;
  /** Absolute path on the site, including the leading slash. */
  path: string;
  steps: { name: string; text: string }[];
};

/** HowTo JSON-LD for step-based setup guides. */
export function howToSchema({ name, description, path, steps }: HowToInput) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    inLanguage: "en",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}${path}`,
    },
    step: steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  };
}
