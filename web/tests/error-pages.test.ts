import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { renderErrorPage } from "../src/lib/error-page";

describe("server fallback page", () => {
  const html = renderErrorPage();

  test("uses the shared design shell and server-error copy", () => {
    expect(html).toContain("Server error");
    expect(html).toContain("The site didn't load.");
    expect(html).toContain("Reload site");
    expect(html).toContain("Hardvoxel");
    expect(html).toContain("--cube-base");
    expect(html).toContain("hello@hardvoxel.com");
  });

  test("follows the stored theme and system preference", () => {
    expect(html).toContain('localStorage.getItem("theme")');
    expect(html).toContain("prefers-color-scheme: dark");
    expect(html).toContain(":root.dark");
    expect(html).toContain(":root:not(.light)");
  });

  test("is self-contained", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).not.toContain("<script src=");
    expect(html).not.toContain("stylesheet");
  });
});

describe("app error page", () => {
  const source = readFileSync(join(import.meta.dir, "../src/components/ErrorPage.tsx"), "utf8");

  test("labels the scope as a page error", () => {
    expect(source).toContain("Page error");
    expect(source).toContain("This page didn't load.");
    expect(source).toContain("The rest of Hardvoxel is still running.");
  });

  test("does not use server-error copy", () => {
    expect(source).not.toContain("Server error");
    expect(source).not.toContain("The site didn't load.");
  });
});
