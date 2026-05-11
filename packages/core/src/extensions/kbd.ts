// mdv:kbd —— 把 [[Cmd+K]] 形式的快捷键文本渲染成 <kbd> 序列
// 例：源 "按 [[Cmd+K]] 唤出命令面板"
//     渲染 → "按 <kbd>Cmd</kbd>+<kbd>K</kbd> 唤出命令面板"
//
// 支持的分隔符：
//   "+" → 同时按（"Cmd+K"）—— 显示为 <kbd>+<kbd>
//   " " → 顺序按（"g g"）—— 显示为 <kbd>then<kbd>
import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';

// 匹配 [[xxx]]，xxx 内只允许字母数字、+、-、_、空格、特殊符号 ↑↓→←⌘⌥⇧⌃⏎⌫⎋
const KBD_RE = /\[\[([\w +\-_↑↓→←⌘⌥⇧⌃⏎⌫⎋⇥]+)\]\]/g;

export function kbdExtension(md: MarkdownIt): void {
  md.core.ruler.after('inline', 'mdv-kbd', (state) => {
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
  KBD_RE.lastIndex = 0;
  while ((m = KBD_RE.exec(text)) !== null) {
    if (m.index > last) {
      out.push(makeText(state, text.slice(last, m.index)));
    }
    out.push(...buildKbdTokens(state, m[1]!));
    last = m.index + m[0].length;
  }
  if (last === 0) return [makeText(state, text)];
  if (last < text.length) out.push(makeText(state, text.slice(last)));
  return out;
}

/** 把 "Cmd+K" 拆成 [<kbd>Cmd</kbd>, "+", <kbd>K</kbd>] 的 token 序列 */
function buildKbdTokens(state: { Token: typeof Token }, raw: string): Token[] {
  const trimmed = raw.trim();
  // 同时按用 "+"，顺序按用空格
  const isSequential = !trimmed.includes('+') && trimmed.includes(' ');
  const sep = isSequential ? ' ' : '+';
  const parts = trimmed
    .split(sep)
    .map((s) => s.trim())
    .filter(Boolean);

  const out: Token[] = [];
  parts.forEach((p, i) => {
    if (i > 0) {
      const sepTok = new state.Token('html_inline', '', 0);
      sepTok.content = isSequential
        ? '<span class="mdv-kbd-then">then</span>'
        : '<span class="mdv-kbd-plus">+</span>';
      out.push(sepTok);
    }
    const open = new state.Token('html_inline', '', 0);
    open.content = '<kbd class="mdv-kbd">';
    const txt = new state.Token('text', '', 0);
    txt.content = p;
    const close = new state.Token('html_inline', '', 0);
    close.content = '</kbd>';
    out.push(open, txt, close);
  });
  return out;
}

function makeText(state: { Token: typeof Token }, content: string): Token {
  const t = new state.Token('text', '', 0);
  t.content = content;
  return t;
}
