import { readFileSync } from "node:fs";
import { chmodSync, mkdirSync, unlinkSync } from "node:fs";
import { createServer } from "node:http";
import { dirname } from "node:path";

import { createHandler } from "./handler.js";
import { StateStore } from "./state.js";

const pkg = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);

export const VERSION = pkg.version;

function listen(server, target, host) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };

    server.once("error", onError);
    server.once("listening", onListening);

    if (host) server.listen(target, host);
    else server.listen(target);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    if (!server.listening) return resolve();
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

export async function createDaemon(options = {}) {
  const statePath = options.statePath ?? "/var/lib/hardvoxel/state.db";
  const apiHost = options.apiHost ?? "127.0.0.1";
  const apiPort = options.apiPort ?? 8787;
  const adminSocket = options.adminSocket ?? "/run/hardvoxel/admin.sock";
  const version = options.version ?? VERSION;

  const state = new StateStore(statePath);
  const apiServer = createServer(createHandler({ state, version, admin: false }));
  const adminServer = createServer(createHandler({ state, version, admin: true }));

  let closed = false;

  async function start() {
    try {
      await listen(apiServer, apiPort, apiHost);

      mkdirSync(dirname(adminSocket), { recursive: true, mode: 0o750 });
      try {
        unlinkSync(adminSocket);
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }

      await listen(adminServer, adminSocket);
      chmodSync(adminSocket, 0o660);
    } catch (error) {
      await close();
      throw error;
    }
  }

  async function close() {
    if (closed) return;
    closed = true;

    await Promise.all([closeServer(apiServer), closeServer(adminServer)]);

    try {
      unlinkSync(adminSocket);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }

    state.close();
  }

  return {
    state,
    apiServer,
    adminServer,
    adminSocket,
    start,
    close,
    apiPort: () => {
      const address = apiServer.address();
      return address && typeof address === "object" ? address.port : null;
    },
  };
}
