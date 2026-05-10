// 扩展 hydrate —— 把 mdview/core 输出的占位标记升级为真正的渲染产物
// 设计：异步、按需 import，找不到目标节点就退出（不影响主渲染）
//
// 当前支持：
//   .mdv-math[data-mdv-math]    → KaTeX
//   .mdv-mermaid[data-mdv-mermaid] → Mermaid

/** 在指定容器内 hydrate 所有扩展产物。等待全部完成后 resolve */
export async function hydrateExtensions(root: HTMLElement): Promise<void> {
  await Promise.all([hydrateMath(root), hydrateMermaid(root)]);
}

async function hydrateMath(root: HTMLElement): Promise<void> {
  const nodes = root.querySelectorAll<HTMLElement>('.mdv-math[data-mdv-math]');
  if (nodes.length === 0) return;
  try {
    const katex = (await import('katex')).default;
    await import('katex/dist/katex.min.css');
    nodes.forEach((node) => {
      const formula = node.dataset.mdvMath ?? '';
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
    });
  } catch (err) {
    console.warn('[mdview] failed to load KaTeX:', err);
  }
}

async function hydrateMermaid(root: HTMLElement): Promise<void> {
  const nodes = root.querySelectorAll<HTMLElement>('.mdv-mermaid[data-mdv-mermaid]');
  if (nodes.length === 0) return;
  try {
    const mermaid = (await import('mermaid')).default;
    mermaid.initialize({ startOnLoad: false, theme: detectMermaidTheme() });
    let i = 0;
    for (const node of nodes) {
      const source = node.dataset.mdvMermaid ?? '';
      try {
        const id = `mdv-mermaid-${Date.now()}-${i++}`;
        const { svg } = await mermaid.render(id, source);
        node.innerHTML = svg;
        node.dataset.mdvHydrated = '1';
      } catch (err) {
        console.warn('[mdview] mermaid render error:', err);
      }
    }
  } catch (err) {
    console.warn('[mdview] failed to load mermaid:', err);
  }
}

function detectMermaidTheme(): 'default' | 'dark' {
  if (typeof window === 'undefined') return 'default';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default';
}
