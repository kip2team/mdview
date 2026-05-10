// 客户端 hydrate KaTeX / mermaid —— 在 mdview-sh 任意带 #mdview-output 的页面上挂一次
// 直接在 effect 里跑 hydrate，不渲染任何东西
import { useEffect } from 'react';

export function HydrateExtensions(): null {
  useEffect(() => {
    const root = document.getElementById('mdview-output');
    if (!root) return;
    void hydrate(root);
  }, []);
  return null;
}

async function hydrate(root: HTMLElement): Promise<void> {
  await Promise.all([hydrateMath(root), hydrateMermaid(root)]);
}

async function hydrateMath(root: HTMLElement): Promise<void> {
  // 选择器不依赖 data-mdv-math —— DOMPurify mXSS 会剥含特殊字符的 data 属性
  const nodes = root.querySelectorAll<HTMLElement>('.mdv-math:not([data-mdv-hydrated])');
  if (nodes.length === 0) return;
  try {
    const katex = (await import('katex')).default;
    await import('katex/dist/katex.min.css');
    nodes.forEach((node) => {
      const formula =
        node.dataset.mdvMath ??
        node.querySelector('pre')?.textContent ??
        node.textContent ??
        '';
      if (!formula.trim()) return;
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
  const nodes = root.querySelectorAll<HTMLElement>('.mdv-mermaid:not([data-mdv-hydrated])');
  if (nodes.length === 0) return;
  try {
    const mermaid = (await import('mermaid')).default;
    mermaid.initialize({
      startOnLoad: false,
      theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default',
      securityLevel: 'loose',
    });
    let i = 0;
    for (const node of Array.from(nodes)) {
      const fallback = node.querySelector<HTMLElement>('.mdv-mermaid-fallback');
      const source = node.dataset.mdvMermaid ?? fallback?.textContent ?? '';
      if (!source.trim()) continue;
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
