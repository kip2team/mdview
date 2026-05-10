// mdv:badge —— ![[badge:文本|颜色]] 渲染为内联徽章
// 例：
//   ![[badge:passing|green]]  → 绿底白字 passing 徽章
//   ![[badge:v1.0|blue]]
//   ![[badge:custom|#ff6b35]] → 自定义 hex 颜色
import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';

const BADGE_RE = /!\[\[badge:([^|\]]+)(?:\|([^\]]+))?\]\]/g;

const NAMED_COLORS: Record<string, string> = {
  green: '#1a7f37',
  red: '#cf222e',
  blue: '#0969da',
  gray: '#6e7781',
  grey: '#6e7781',
  orange: '#bc4c00',
  yellow: '#bf8700',
  purple: '#8250df',
  pink: '#bf3989',
};

export function badgeExtension(md: MarkdownIt): void {
  md.core.ruler.after('inline', 'mdv-badge', (state) => {
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
  BADGE_RE.lastIndex = 0;
  while ((m = BADGE_RE.exec(text)) !== null) {
    if (m.index > last) {
      out.push(makeText(state, text.slice(last, m.index)));
    }
    const label = m[1]!.trim();
    const color = resolveColor(m[2]?.trim() ?? 'gray');
    const html = state.Token.prototype ? null : null;
    const tok = new state.Token('html_inline', '', 0);
    tok.content = renderBadge(label, color);
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
  return NAMED_COLORS.gray!;
}

function renderBadge(label: string, color: string): string {
  return (
    `<span class="mdv-badge" data-mdv-badge style="--mdv-badge-bg:${escapeAttr(color)}">` +
    `${escapeHtml(label)}` +
    `</span>`
  );
}

function makeText(state: { Token: typeof Token }, content: string): Token {
  const t = new state.Token('text', '', 0);
  t.content = content;
  return t;
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
