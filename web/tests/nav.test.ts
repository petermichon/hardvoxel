import { describe, expect, test } from "bun:test";

import { exploreNav, mobileNavOrder, navSections } from "../src/content/navigation";
import { staticRoutes } from "./routes";

function navHrefs(): string[] {
  return Object.values(navSections).flatMap((section) => section.links.map((link) => link.to));
}

describe("navigation", () => {
  const expected = [...staticRoutes()].sort();

  test("links every indexable page exactly once", () => {
    const hrefs = navHrefs();
    expect(hrefs.length).toBe(new Set(hrefs).size);
    expect([...hrefs].sort()).toEqual(expected);
  });

  test("places every section in the desktop menu and the mobile sheet", () => {
    const ids = Object.keys(navSections).sort();
    expect([...exploreNav].sort()).toEqual(ids);
    expect([...mobileNavOrder].sort()).toEqual(ids);
  });
});
