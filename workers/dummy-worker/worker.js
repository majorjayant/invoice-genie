/**
 * Dummy (Invoice Genie) Reverse Proxy Worker (for jayantarora.in)
 *
 * Modeled after moondesk-worker. Intercepts jayantarora.in/dummy* and routes:
 * - /dummy/*  → Invoice Genie Cloudflare Pages (invoice-genie.pages.dev)
 *
 * All other jayantarora.in/* traffic is untouched (passes to Cloudflare Pages).
 */

const PAGES_HOST = 'invoice-genie.pages.dev';
const SUBPATH = '/dummy';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // LEAKPROOF: Only handle requests starting with /dummy
    if (!url.pathname.startsWith(SUBPATH)) {
      return fetch(request); // Passthrough to primary domain site
    }

    // Redirect /dummy to /dummy/ to resolve relative paths correctly
    if (url.pathname === SUBPATH) {
      url.pathname = SUBPATH + '/';
      return Response.redirect(url.toString(), 301);
    }

    // ── /dummy/* → Invoice Genie Pages ──────────────────────────────
    let targetPath = url.pathname.replace(SUBPATH, '');
    if (targetPath === '' || targetPath === '/') targetPath = '/app.html';

    const targetUrl = new URL(targetPath, `https://${PAGES_HOST}`);
    targetUrl.search = url.search;

    const newHeaders = new Headers(request.headers);
    newHeaders.set('Host', PAGES_HOST);
    newHeaders.set('X-Forwarded-Host', url.hostname);

    const proxyRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      redirect: 'follow',
    });

    try {
      let response = await fetch(proxyRequest);

      const responseHeaders = new Headers(response.headers);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (err) {
      return new Response(`Invoice Genie Proxy Error: ${err.message}`, { status: 502 });
    }
  },
};
