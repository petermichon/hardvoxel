import { describe, expect, test } from "bun:test";

import { acceptsHtml, acceptsMarkdown, withHtmlAccept } from "../src/lib/accept";

describe("accept negotiation", () => {
  test("detects markdown requests", () => {
    expect(acceptsMarkdown("text/markdown")).toBe(true);
    expect(acceptsMarkdown("text/markdown;q=1, text/html;q=0.9")).toBe(true);
    expect(acceptsMarkdown("text/html,application/xhtml+xml,*/*;q=0.8")).toBe(false);
  });

  test("treats html, xhtml, wildcard, and missing headers as html", () => {
    expect(acceptsHtml("")).toBe(true);
    expect(acceptsHtml("text/html,application/xhtml+xml,application/xml;q=0.9")).toBe(true);
    expect(acceptsHtml("application/xhtml+xml")).toBe(true);
    expect(acceptsHtml("*/*")).toBe(true);
  });

  test("rejects json, plain text, and markdown-only requests", () => {
    expect(acceptsHtml("application/json")).toBe(false);
    expect(acceptsHtml("text/plain")).toBe(false);
    expect(acceptsHtml("text/markdown")).toBe(false);
  });

  test("rewrites the accept header without changing the request target", () => {
    const request = new Request("https://hardvoxel.com/docs", {
      method: "GET",
      headers: { accept: "application/json", "x-test": "1" },
    });
    const rewritten = withHtmlAccept(request);

    expect(rewritten.url).toBe(request.url);
    expect(rewritten.method).toBe("GET");
    expect(rewritten.headers.get("accept")).toBe("text/html,application/xhtml+xml");
    expect(rewritten.headers.get("x-test")).toBe("1");
  });
});
