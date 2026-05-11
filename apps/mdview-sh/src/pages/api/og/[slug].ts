// GET /api/og/{slug} —— 短链的 OG 卡片图（1200x630）
// MVP：返回一张纯 SVG 占位图（标题 + 域名）。后续接入 satori/resvg 做真正的截屏卡。
import type { APIRoute } from 'astro';
import { getShortLink, type CfBindings } from '../../../lib/storage';

export const GET: APIRoute = async ({ params, locals }) => {
  const slug = params.slug;
  if (!slug) {
    return new Response('Missing slug', { status: 400 });
  }
  const env = (locals as { runtime?: { env?: CfBindings } }).runtime?.env ?? {};
  const record = await getShortLink(env, slug);

  const title = record ? safeForSvg(deriveTitle(record.url)) : 'mdview';
  const subtitle = record ? safeForSvg(record.url.replace(/^https?:\/\//, '')) : 'mdview.sh';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0d1117"/>
  <rect x="0" y="0" width="8" height="630" fill="#0969da"/>
  <text x="80" y="190" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="32" fill="#9198a1" font-weight="500">mdview.sh</text>
  <text x="80" y="350" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="68" fill="#e6edf3" font-weight="700">${title}</text>
  <text x="80" y="460" font-family="ui-monospace, SFMono-Regular, monospace" font-size="22" fill="#7d8590">${subtitle}</text>
  <text x="80" y="560" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="20" fill="#9198a1">Read this Markdown beautifully on mdview.sh</text>
</svg>`;

  return new Response(svg, {
    headers: {
      'content-type': 'image/svg+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};

function deriveTitle(url: string): string {
  try {
    const u = new URL(url);
    const seg = u.pathname.split('/').filter(Boolean).pop() ?? u.hostname;
    return seg.replace(/\.(md|markdown)$/i, '');
  } catch {
    return 'Untitled';
  }
}

function safeForSvg(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 80);
}
