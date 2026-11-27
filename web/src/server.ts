import "./lib/error-capture";

import { acceptsHtml, acceptsMarkdown, withHtmlAccept } from "./lib/accept";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { markdownForPath } from "./lib/markdown";
import { SITE_URL } from "./lib/seo";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

function withVaryAccept(response: Response, pathname: string): Response {
  if (!markdownForPath(pathname)) return response;

  const headers = new Headers(response.headers);
  const vary = headers.get("vary");
  if (!vary) headers.set("vary", "Accept");
  else if (!/\baccept\b/i.test(vary)) headers.set("vary", `${vary}, Accept`);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function markdownResponse(pathname: string, markdown: string, head: boolean): Response {
  return new Response(head ? null : markdown, {
    status: 200,
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      vary: "Accept",
      link: `<${SITE_URL}${pathname}>; rel="canonical"`,
    },
  });
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const pathname = new URL(request.url).pathname;
    const accept = request.headers.get("accept") ?? "";
    const isRead = request.method === "GET" || request.method === "HEAD";
    const isAssetPath = /\.[a-z0-9]+$/i.test(pathname);

    if (isRead && !isAssetPath && acceptsMarkdown(accept)) {
      // Keep negotiated Markdown on the same canonical URL the HTML route uses.
      const canonicalPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
      const markdown = markdownForPath(canonicalPath);
      if (markdown) return markdownResponse(canonicalPath, markdown, request.method === "HEAD");
      request = withHtmlAccept(request);
    } else if (isRead && !isAssetPath && !acceptsHtml(accept)) {
      // The SSR handler rejects non-HTML Accept headers. Serve the HTML page
      // instead of failing clients that ask for JSON or plain text.
      request = withHtmlAccept(request);
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return withVaryAccept(await normalizeCatastrophicSsrResponse(response), pathname);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
