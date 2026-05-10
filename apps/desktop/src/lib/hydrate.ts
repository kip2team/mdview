// 扩展 hydrate —— 把 mdview/core 输出的占位标记升级为真正的渲染产物
// 设计：异步、按需 import；带 cancel 信号防止 race；DOM 存活检查避免写入已断连节点
//
// 当前支持：
//   .mdv-math[data-mdv-math]    → KaTeX
//   .mdv-mermaid[data-mdv-mermaid] → Mermaid

/** 取消信号 —— 调用方持有 ref，hydrate 在每个写入点检查 */
export type CancelToken = { cancelled: boolean };

/** mermaid 渲染时给临时 div 生成的全局 id —— 单调递增防止冲突 */
let mermaidIdCounter = 0;

/** 在指定容器内 hydrate 所有扩展产物 */
export async function hydrateExtensions(
  root: HTMLElement,
  token: CancelToken = { cancelled: false },
): Promise<void> {
  await Promise.all([hydrateMath(root, token), hydrateMermaid(root, token)]);
}

async function hydrateMath(root: HTMLElement, token: CancelToken): Promise<void> {
  // 同 mermaid：选择器不强求 data 属性，textContent 也能取
  const nodes = root.querySelectorAll<HTMLElement>('.mdv-math:not([data-mdv-hydrated])');
  if (nodes.length === 0) return;
  let katex: typeof import('katex').default;
  try {
    katex = (await import('katex')).default;
    await import('katex/dist/katex.min.css');
  } catch (err) {
    console.warn('[mdview] failed to load KaTeX:', err);
    return;
  }
  if (token.cancelled) return;

  for (const node of Array.from(nodes)) {
    if (token.cancelled) return;
    if (!document.contains(node)) continue;
    if (node.dataset.mdvHydrated) continue;
    // 行内 math 的公式直接在节点 textContent；块级在内层 <pre> 里。两种都覆盖
    const formula =
      node.dataset.mdvMath ??
      node.querySelector('pre')?.textContent ??
      node.textContent ??
      '';
    if (!formula.trim()) continue;
    const isBlock = node.classList.contains('mdv-math-block');
    try {
      node.innerHTML = katex.renderToString(formula, {
        displayMode: isBlock,
        throwOnError: false,
      });
      node.dataset.mdvHydrated = '1';
    } catch (err) {
      console.warn('[mdview] KaTeX render error:', err);
    }
  }
}

async function hydrateMermaid(root: HTMLElement, token: CancelToken): Promise<void> {
  // 选择器不依赖 data-mdv-mermaid 属性 —— 它会被 DOMPurify mXSS 策略剥掉（`-->` 等会触发）。
  // 改从 fallback <pre> 的 textContent 读源码，浏览器自动解码 entity，拿到的就是原文。
  const nodes = root.querySelectorAll<HTMLElement>('.mdv-mermaid:not([data-mdv-hydrated])');
  console.log(`[mdview hydrate] mermaid: ${nodes.length} unhydrated block(s) found`);
  if (nodes.length === 0) return;

  const t0 = performance.now();
  let mermaid: typeof import('mermaid').default;
  try {
    mermaid = (await import('mermaid')).default;
    console.log(
      `[mdview hydrate] mermaid library loaded in ${(performance.now() - t0).toFixed(0)}ms`,
    );
  } catch (err) {
    console.error('[mdview hydrate] failed to load mermaid:', err);
    return;
  }
  if (token.cancelled) {
    console.log('[mdview hydrate] cancelled before mermaid init');
    return;
  }

  mermaid.initialize({
    startOnLoad: false,
    theme: detectMermaidTheme(),
    securityLevel: 'loose',
  });

  // 并行渲染所有图，比串行快几倍
  await Promise.all(
    Array.from(nodes).map(async (node, idx) => {
      if (token.cancelled) return;
      if (!document.contains(node)) return;
      if (node.dataset.mdvHydrated) return;
      // 优先从 data 属性取（CDN 引擎兜底场景）；属性被剥时 fallback pre 是真理源
      const fallback = node.querySelector<HTMLElement>('.mdv-mermaid-fallback');
      const source = node.dataset.mdvMermaid ?? fallback?.textContent ?? '';
      if (!source.trim()) {
        console.warn(`[mdview hydrate] mermaid #${idx} no source found, skip`);
        return;
      }
      const id = `mdv-mermaid-${++mermaidIdCounter}`;
      const preview = source.split('\n', 1)[0]?.slice(0, 60) ?? '';
      console.log(`[mdview hydrate] mermaid #${idx} rendering: "${preview}…"`);
      try {
        const { svg } = await mermaid.render(id, source);
        if (token.cancelled) return;
        if (!document.contains(node)) return;
        node.innerHTML = svg;
        node.dataset.mdvHydrated = '1';
        console.log(`[mdview hydrate] mermaid #${idx} ✓`);
      } catch (err) {
        console.error(`[mdview hydrate] mermaid #${idx} FAILED:`, err);
        const errFallback = node.querySelector('.mdv-mermaid-fallback');
        if (errFallback) errFallback.classList.add('mdv-mermaid-error');
      }
    }),
  );
}

function detectMermaidTheme(): 'default' | 'dark' {
  if (typeof window === 'undefined') return 'default';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default';
}
