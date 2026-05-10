// Cloudflare KV 上的短链存储
// 数据模型：
//   slug -> { url, theme?, createdAt, lastAccessedAt, hits }
// KV 容量充足，不需要 R2，等需要缓存渲染产物时再上 R2
export interface ShortLinkRecord {
  url: string;
  theme?: string;
  createdAt: number;
  lastAccessedAt: number;
  hits: number;
}

/** Astro 把 Cloudflare 绑定挂在 Astro.locals.runtime.env */
export interface CfBindings {
  /** KV namespace —— wrangler.toml 里需要创建并 binding 为 SHORTLINKS */
  SHORTLINKS?: KVNamespace;
}

const SLUG_LENGTH = 6;
const SLUG_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 天未访问自动过期

export function generateSlug(): string {
  let s = '';
  const buf = new Uint8Array(SLUG_LENGTH);
  crypto.getRandomValues(buf);
  for (let i = 0; i < SLUG_LENGTH; i++) {
    s += SLUG_ALPHABET[buf[i]! % SLUG_ALPHABET.length];
  }
  return s;
}

export async function createShortLink(
  bindings: CfBindings,
  url: string,
  theme: string | undefined,
): Promise<{ slug: string; record: ShortLinkRecord } | { error: string }> {
  if (!bindings.SHORTLINKS) {
    return { error: 'KV namespace SHORTLINKS not bound' };
  }
  // 重试 5 次以避免 slug 碰撞（实际碰撞概率极低）
  for (let i = 0; i < 5; i++) {
    const slug = generateSlug();
    const existing = await bindings.SHORTLINKS.get(slug);
    if (existing) continue;
    const record: ShortLinkRecord = {
      url,
      theme,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      hits: 0,
    };
    await bindings.SHORTLINKS.put(slug, JSON.stringify(record), {
      expirationTtl: TTL_SECONDS,
    });
    return { slug, record };
  }
  return { error: 'failed to allocate slug after 5 retries' };
}

export async function getShortLink(
  bindings: CfBindings,
  slug: string,
): Promise<ShortLinkRecord | null> {
  if (!bindings.SHORTLINKS) return null;
  const raw = await bindings.SHORTLINKS.get(slug);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ShortLinkRecord;
    // 后台续期 lastAccessed —— 不阻塞响应
    void bindings.SHORTLINKS.put(
      slug,
      JSON.stringify({
        ...parsed,
        lastAccessedAt: Date.now(),
        hits: parsed.hits + 1,
      }),
      { expirationTtl: TTL_SECONDS },
    );
    return parsed;
  } catch {
    return null;
  }
}

/** Cloudflare 全局类型 —— Astro 没自动给 KV 类型时用这个兜底 */
declare global {
  interface KVNamespace {
    get(key: string): Promise<string | null>;
    put(
      key: string,
      value: string,
      options?: { expirationTtl?: number },
    ): Promise<void>;
    delete(key: string): Promise<void>;
  }
}
