import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { staticRoutes } from "./routes";

describe("sitemap", () => {
  test("lists every indexable route exactly once", () => {
    const expected = staticRoutes().sort();

    const sitemap = readFileSync(join(import.meta.dir, "../public/sitemap.xml"), "utf8");
    const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((match) => match[1].replace("https://hardvoxel.com", ""))
      .sort();

    expect(urls).toEqual(expected);
  });
});
