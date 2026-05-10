// 服务端拉取目标 URL 的 markdown —— 给 /preview 路由用
// 关键约束（URL 预览防滥用）：
// - 协议白名单：仅 http/https
// - 大小上限：1 MB
// - 超时：5 秒
// - Content-Type 校验：要求 text/markdown / text/plain，否则拒绝
const MAX_BYTES = 1024 * 1024;
const TIMEOUT_MS = 5000;
const ALLOWED_CONTENT_TYPES = [
  'text/markdown',
  'text/plain',
  'text/x-markdown',
  'application/octet-stream', // GitHub raw 用这个
];

export interface FetchResult {
  ok: true;
  markdown: string;
  url: string;
  contentType: string;
}
export interface FetchError {
  ok: false;
  error: string;
}

export async function fetchMarkdownFromUrl(rawUrl: string): Promise<FetchResult | FetchError> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, error: 'Invalid URL' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: `Unsupported protocol: ${url.protocol}` };
  }
  // 防御 SSRF —— 拒绝明显的私网 / loopback host（精细判断要在 Worker 层做）
  if (isPrivateHost(url.hostname)) {
    return { ok: false, error: 'Private network URLs are not allowed' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'mdview.sh/0.1 (+https://mdview.sh)',
        Accept: 'text/markdown, text/plain;q=0.9, */*;q=0.5',
      },
    });
    if (!res.ok) {
      return { ok: false, error: `Upstream returned ${res.status}` };
    }
    const contentType = (res.headers.get('content-type') ?? '').toLowerCase();
    const isAllowed = ALLOWED_CONTENT_TYPES.some((t) => contentType.startsWith(t));
    const isMdExt = /\.(md|markdown)$/i.test(url.pathname);
    if (!isAllowed && !isMdExt) {
      return { ok: false, error: `Refusing content-type: ${contentType || '(none)'}` };
    }

    const sizeHeader = res.headers.get('content-length');
    if (sizeHeader && parseInt(sizeHeader, 10) > MAX_BYTES) {
      return { ok: false, error: 'File too large (>1 MB)' };
    }

    // 流式读，超过上限即中止
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return { ok: false, error: 'File too large (>1 MB)' };
    }
    const markdown = new TextDecoder('utf-8').decode(buf);
    return { ok: true, markdown, url: url.toString(), contentType };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    return { ok: false, error: reason };
  } finally {
    clearTimeout(timer);
  }
}

/** 粗判私网 / loopback —— 实际生产应该在 Cloudflare Worker 层用 cf-connecting-ip 等做更严的校验 */
function isPrivateHost(hostname: string): boolean {
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.local')
  ) {
    return true;
  }
  // 10.0.0.0/8、172.16.0.0/12、192.168.0.0/16
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)) return true;
  return false;
}
