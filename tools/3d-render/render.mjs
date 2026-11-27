import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(root, "out");
fs.mkdirSync(outDir, { recursive: true });

// playwright-core does not download a browser. Point CHROME_PATH at any
// Chromium/Chrome binary, or install one with `bunx playwright install chromium`.
const executablePath = process.env.CHROME_PATH;
const presets = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["heroClose"];

const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  headless: true,
  args: [
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
    "--ignore-gpu-blocklist",
    "--enable-webgl",
  ],
});

const page = await browser.newPage({
  viewport: { width: 900, height: 900 },
  deviceScaleFactor: 2,
});

page.on("console", (message) => {
  if (message.type() === "error") console.error("PAGE", message.text());
});
page.on("pageerror", (error) => console.error("PAGEERROR", error.message));

for (const preset of presets) {
  await page.goto(`http://localhost:5180/?preset=${preset}&size=680`, {
    waitUntil: "networkidle",
  });
  await page.waitForFunction(() => window.__renderReady === true, {
    timeout: 20000,
  });
  const canvas = page.locator("canvas");
  const file = path.join(outDir, `${preset}.png`);
  await canvas.screenshot({ path: file });
  console.log("rendered", file);
}

await browser.close();
