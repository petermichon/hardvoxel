import { pageMarkdown } from "@/content/markdown/pages";

/**
 * Markdown representation of a page, served at the same URL when a request
 * sends `Accept: text/markdown`. Returns null when no mirror exists.
 */
export function markdownForPath(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return pageMarkdown[path] ?? null;
}
