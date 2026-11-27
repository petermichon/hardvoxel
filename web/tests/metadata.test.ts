import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const routesDir = join(import.meta.dir, "../src/routes");
const excluded = new Set(["__root.tsx", "$.tsx", "deploy.tsx", "error.tsx"]);

const routeFiles = readdirSync(routesDir)
  .filter((file) => file.endsWith(".tsx") && !excluded.has(file))
  .sort();

describe("route metadata", () => {
  for (const file of routeFiles) {
    test(`${file} uses the shared page metadata`, () => {
      const source = readFileSync(join(routesDir, file), "utf8");
      expect(source).toContain("pageHead");
    });
  }
});
