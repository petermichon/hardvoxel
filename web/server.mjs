import { serve } from "srvx/node";
import { staticMiddleware } from "srvx/static";

import handler from "./dist/server/server.js";

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOST ?? "0.0.0.0";

serve({
  port,
  hostname,
  middleware: [
    staticMiddleware({
      dir: new URL("./dist/client", import.meta.url).pathname,
      maxAge: 3600,
    }),
  ],
  fetch: handler.fetch,
});
