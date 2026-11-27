/** True when the client explicitly asks for a Markdown representation. */
export function acceptsMarkdown(accept: string): boolean {
  return accept.toLowerCase().includes("text/markdown");
}

/**
 * True when the client can accept the normal HTML page. The SSR handler rejects
 * requests that ask for a non-HTML type, so anything else is rewritten first.
 */
export function acceptsHtml(accept: string): boolean {
  const value = accept.toLowerCase();
  return (
    value === "" ||
    value.includes("text/html") ||
    value.includes("application/xhtml+xml") ||
    value.includes("*/*")
  );
}

/** Clone a GET/HEAD request with an HTML Accept header. */
export function withHtmlAccept(request: Request): Request {
  const headers = new Headers(request.headers);
  headers.set("accept", "text/html,application/xhtml+xml");
  return new Request(request.url, {
    method: request.method,
    headers,
    redirect: request.redirect,
  });
}
