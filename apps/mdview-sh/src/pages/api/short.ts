// POST /api/short
// body: { url: string, theme?: string }
// → 200 { slug, shortUrl } | 400 { error } | 429 { error }
import type { APIRoute } from 'astro';
import { createShortLink, type CfBindings } from '../../lib/storage';
import { checkRateLimit } from '../../lib/rate-limit';

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const env = (locals as { runtime?: { env?: CfBindings & { RATE_KV?: KVNamespace } } }).runtime
    ?.env;

  // 限流：每 IP 每分钟最多 10 次
  const rl = await checkRateLimit(clientAddress ?? 'anon', {
    windowMs: 60_000,
    max: 10,
    kv: env?.RATE_KV ?? env?.SHORTLINKS,
  });
  if (!rl.allowed) {
    return jsonResponse(
      { error: 'Too many requests', resetAt: rl.resetAt },
      { status: 429, headers: { 'X-RateLimit-Reset': String(rl.resetAt) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return jsonResponse({ error: 'Body must be an object' }, { status: 400 });
  }
  const { url, theme } = body as { url?: unknown; theme?: unknown };
  if (typeof url !== 'string' || url.length === 0) {
    return jsonResponse({ error: 'Missing url' }, { status: 400 });
  }
  if (url.length > 2048) {
    return jsonResponse({ error: 'URL too long' }, { status: 400 });
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return jsonResponse({ error: 'Only http/https URLs are supported' }, { status: 400 });
    }
  } catch {
    return jsonResponse({ error: 'Invalid URL' }, { status: 400 });
  }

  const result = await createShortLink(
    env ?? {},
    url,
    typeof theme === 'string' ? theme : undefined,
  );
  if ('error' in result) {
    return jsonResponse({ error: result.error }, { status: 500 });
  }
  const origin = new URL(request.url).origin;
  return jsonResponse({
    slug: result.slug,
    shortUrl: `${origin}/s/${result.slug}`,
    record: result.record,
  });
};

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(body), { ...init, headers });
}
