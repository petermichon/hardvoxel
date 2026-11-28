#!/usr/bin/env node
const major = Number(process.versions.node.split(".")[0]);

if (!process.versions.bun && major < 24) {
  console.error("hardvoxel-daemon: Node.js 24 or newer is required (node:sqlite)");
  process.exit(1);
}

const { main } = await import("../src/daemon/main.js");

main(process.argv.slice(2)).catch((error) => {
  console.error(`hardvoxel-daemon: ${error.message}`);
  process.exit(1);
});
