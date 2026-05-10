// mdv:color —— 把 #rgb / #rrggbb / #rrggbbaa 形式的色值在文本中渲染成带色块预览的 span
// 示例: "我喜欢 #ff6b35 这个橙色" → "我喜欢 [🟧 #ff6b35] 这个橙色"
import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';

/** 匹配 #rgb / #rrggbb / #rrggbbaa（前后必须是非字母数字边界） */
const HEX_RE = /(^|[^A-Za-z0-9_#])(#[0-9A-Fa-f]{3,8})(?=$|[^A-Za-z0-9_])/g;

/** 哪些十六进制长度被视为有效颜色 */
const VALID_LENGTHS = new Set([3, 4, 6, 8]);

/**
 * markdown-it 扩展函数：在 inline 阶段之后，遍历所有 text token，
 * 把里面的 hex 颜色字面量切成 [text, html_inline(open), text, html_inline(close), text...] 的 token 序列。
 */
export function colorExtension(md: MarkdownIt): void {
  md.core.ruler.after('inline', 'mdv-color', (state) => {
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
          // 这段文本里没有 hex，原样保留
          newChildren.push(tok);
        } else {
          newChildren.push(...split);
        }
      }
      blockToken.children = newChildren;
    }
  });
}

/** 把一段纯文本拆成 token 序列：text 段 + html_inline 包裹的色块 */
function splitText(text: string, state: { Token: typeof Token }): Token[] {
  const out: Token[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  HEX_RE.lastIndex = 0;
  while ((m = HEX_RE.exec(text)) !== null) {
    const fullMatch = m[0];
    const prefix = m[1] ?? '';
    const hex = m[2]!;
    const hexHexLen = hex.length - 1;
    if (!VALID_LENGTHS.has(hexHexLen)) continue;

    // hex 在原文中的实际起点
    const hexStart = m.index + prefix.length;
    const hexEnd = hexStart + hex.length;

    // hex 之前的部分（含前缀字符）— 走原文本 token
    if (hexStart > lastIndex) {
      out.push(makeText(state, text.slice(lastIndex, hexStart)));
    }

    // 色块 = open tag + text + close tag
    out.push(makeHtmlInline(state, openSpan(hex)));
    out.push(makeText(state, hex));
    out.push(makeHtmlInline(state, '</span>'));

    lastIndex = hexEnd;
    // 修正 RegExp lastIndex —— prefix 占的字符不能让正则跳过去导致下一个匹配漏掉
    HEX_RE.lastIndex = hexEnd;
  }
  if (lastIndex === 0) {
    return [makeText(state, text)];
  }
  if (lastIndex < text.length) {
    out.push(makeText(state, text.slice(lastIndex)));
  }
  return out;
}

function openSpan(hex: string): string {
  // 用 CSS 自定义属性传颜色 —— 主题侧的 .mdv-color-swatch 用 var(--mdv-swatch) 着色
  // 同时保留 data 属性供 JS 接住（取色器、复制色值等后续功能）
  const attr = escapeAttr(hex);
  return `<span class="mdv-color" data-mdv-color="${attr}" style="--mdv-swatch:${attr}"><span class="mdv-color-swatch" aria-hidden="true"></span>`;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function makeText(state: { Token: typeof Token }, content: string): Token {
  const t = new state.Token('text', '', 0);
  t.content = content;
  return t;
}

function makeHtmlInline(state: { Token: typeof Token }, content: string): Token {
  const t = new state.Token('html_inline', '', 0);
  t.content = content;
  return t;
}
