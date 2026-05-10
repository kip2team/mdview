// mdv:progress —— [==70%==] 或 [==70%==|color] 渲染为进度条
// 例：
//   [==70%==]              → 70% 蓝色进度条
//   [==90%==|green]        → 90% 绿色
//   [==45%==|#ff6b35]      → 自定义 hex
import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';

const PROGRESS_RE = /\[==(\d{1,3})%==(?:\|([^\]]+))?\]/g;
const NAMED_COLORS: Record<string, string> = {
  blue: '#0969da',
  green: '#1a7f37',
  red: '#cf222e',
  orange: '#bc4c00',
  yellow: '#bf8700',
  gray: '#6e7781',
  grey: '#6e7781',
};

export function progressExtension(md: MarkdownIt): void {
  md.core.ruler.after('inline', 'mdv-progress', (state) => {
    for (const blockToken of state.tokens) {
      if (blockToken.type !== 'inline' || !blockToken.children) continue;
      const newChildren: Token[] = [];
      for (const tok of blockToken.children) {
        if (tok.type !== 'text') {
          newChildren.push(tok);
          continue;
        }
        const split = splitText(tok.content, state);
        if (split.length === 1 && split[0]!.type === 'text') {
          newChildren.push(tok);
        } else {
          newChildren.push(...split);
        }
      }
      blockToken.children = newChildren;
    }
  });
}

function splitText(text: string, state: { Token: typeof Token }): Token[] {
  const out: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  PROGRESS_RE.lastIndex = 0;
  while ((m = PROGRESS_RE.exec(text)) !== null) {
    if (m.index > last) {
      out.push(makeText(state, text.slice(last, m.index)));
    }
    const pct = Math.max(0, Math.min(100, parseInt(m[1]!, 10)));
    const colorSpec = m[2]?.trim() ?? 'blue';
    const color = resolveColor(colorSpec);
    const tok = new state.Token('html_inline', '', 0);
    tok.content = renderProgress(pct, color);
    out.push(tok);
    last = m.index + m[0].length;
  }
  if (last === 0) return [makeText(state, text)];
  if (last < text.length) out.push(makeText(state, text.slice(last)));
  return out;
}

function resolveColor(spec: string): string {
  if (NAMED_COLORS[spec.toLowerCase()]) return NAMED_COLORS[spec.toLowerCase()]!;
  if (/^#[0-9a-fA-F]{3,8}$/.test(spec)) return spec;
  return NAMED_COLORS.blue!;
}

function renderProgress(pct: number, color: string): string {
  return (
    `<span class="mdv-progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" style="--mdv-progress-fill:${escapeAttr(color)}">` +
    `<span class="mdv-progress-bar" style="width:${pct}%"></span>` +
    `<span class="mdv-progress-label">${pct}%</span>` +
    `</span>`
  );
}

function makeText(state: { Token: typeof Token }, content: string): Token {
  const t = new state.Token('text', '', 0);
  t.content = content;
  return t;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
