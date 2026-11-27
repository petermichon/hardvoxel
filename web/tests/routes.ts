import { readdirSync } from "node:fs";
import { join } from "node:path";

const routesDir = join(import.meta.dir, "../src/routes");

/**
 * Indexable static routes derived from the file-based router. Excludes the root
 * layout, the catch-all, the dev-only error preview, and the /deploy redirect.
 */
export function staticRoutes(): string[] {
  return readdirSync(routesDir)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => file.replace(/\.tsx$/, ""))
    .filter(
      (name) =>
        !name.startsWith("__") && name !== "deploy" && name !== "error" && !name.includes("$"),
    )
    .map((name) => (name === "index" ? "/" : `/${name}`));
}
