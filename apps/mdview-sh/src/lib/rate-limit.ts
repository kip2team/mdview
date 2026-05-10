// 极简 IP 限流 —— 用 KV 滑动窗口，每分钟最多 N 次
// 不是工业级方案，只做"防止恶意刷"的兜底；想要更精确建议接 Cloudflare Rate Limiting 规则
export interface RateLimitConfig {
  /** 时间窗口长度，毫秒 */
  windowMs: number;
  /** 窗口内允许的最大请求数 */
  max: number;
  /** KV namespace 引用 */
  kv?: KVNamespace;
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!config.kv) {
    // 没绑 KV 时直接放过 —— 避免本地 dev 误伤
    return { allowed: true, remaining: config.max, resetAt: Date.now() + config.windowMs };
  }
  const key = `rl:${identifier}`;
  const raw = await config.kv.get(key);
  const now = Date.now();
  let entry: { count: number; resetAt: number };
  if (!raw) {
    entry = { count: 0, resetAt: now + config.windowMs };
  } else {
    try {
      entry = JSON.parse(raw) as { count: number; resetAt: number };
      if (entry.resetAt < now) {
        entry = { count: 0, resetAt: now + config.windowMs };
      }
    } catch {
      entry = { count: 0, resetAt: now + config.windowMs };
    }
  }
  entry.count++;
  await config.kv.put(key, JSON.stringify(entry), {
    expirationTtl: Math.ceil((entry.resetAt - now) / 1000) + 5,
  });
  return {
    allowed: entry.count <= config.max,
    remaining: Math.max(0, config.max - entry.count),
    resetAt: entry.resetAt,
  };
}
