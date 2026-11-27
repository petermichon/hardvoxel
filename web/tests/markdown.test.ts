import { describe, expect, test } from "bun:test";

import { pageMarkdown } from "../src/content/markdown/pages";
import { markdownForPath } from "../src/lib/markdown";

describe("markdown negotiation", () => {
  test("serves a markdown mirror for every mapped page", () => {
    for (const [path, markdown] of Object.entries(pageMarkdown)) {
      expect(markdown.startsWith("# "), `${path} should start with an H1`).toBe(true);
      expect(markdown).toContain("https://hardvoxel.com");
    }
  });

  test("covers core routes", () => {
    for (const path of [
      "/",
      "/docs",
      "/features",
      "/about",
      "/security",
      "/legal",
      "/privacy",
      "/terms",
    ]) {
      expect(markdownForPath(path), path).toContain("# ");
    }
  });

  test("ignores unknown paths and trailing slashes", () => {
    expect(markdownForPath("/does-not-exist")).toBeNull();
    expect(markdownForPath("/docs/")).toBe(markdownForPath("/docs"));
  });

  test("every markdown page carries related links", () => {
    for (const [path, markdown] of Object.entries(pageMarkdown)) {
      expect(markdown, path).toContain("## Links");
      const links = markdown.match(/https:\/\/hardvoxel\.com/g) ?? [];
      expect(links.length, path).toBeGreaterThanOrEqual(2);
    }
  });
});
