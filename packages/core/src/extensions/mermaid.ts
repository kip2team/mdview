// mdv:mermaid —— 把 ` ```mermaid ... ``` ` 围栏代码块替换为占位 div + data-mdv-mermaid 源
// 同 math 扩展：core 不引入 mermaid 重型依赖；hydrate 由消费者按需做
import type MarkdownIt from 'markdown-it';

export function mermaidExtension(md: MarkdownIt): void {
  // 用 fence 渲染规则覆写：当 info 字符串以 mermaid 开头时输出占位
  const origFence =
    md.renderer.rules.fence ??
    ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx]!;
    const info = (token.info ?? '').trim().toLowerCase();
    if (info === 'mermaid') {
      const source = token.content;
      return (
        `<div class="mdv-mermaid" data-mdv-mermaid="${escapeAttr(source)}">` +
        `<pre class="mdv-mermaid-fallback">${escapeHtml(source)}</pre>` +
        `</div>\n`
      );
    }
    return origFence(tokens, idx, options, env, self);
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
