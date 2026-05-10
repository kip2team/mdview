// mdv:sub-sup —— ^x^ 上标 / ~x~ 下标
// 例：
//   E = mc^2^      → E = mc<sup>2</sup>
//   H~2~O          → H<sub>2</sub>O
// 注意：~~strikethrough~~ 由 GFM 处理（双 ~），我们的 ~x~ 是单 ~
import type MarkdownIt from 'markdown-it';

export function subSupExtension(md: MarkdownIt): void {
  // 上标 ^...^
  md.inline.ruler.after('emphasis', 'mdv-sup', (state, silent) => {
    return parseDelimited(state, silent, 0x5e /* ^ */, 'sup');
  });
  // 下标 ~...~（单字符，不和 GFM ~~strikethrough~~ 冲突）
  md.inline.ruler.after('emphasis', 'mdv-sub', (state, silent) => {
    return parseDelimited(state, silent, 0x7e /* ~ */, 'sub');
  });
}

/** 通用单字符 delimiter 行内解析：找 ch...ch 包围的非空白内容 */
function parseDelimited(
  state: import('markdown-it').StateInline,
  silent: boolean,
  ch: number,
  tag: 'sup' | 'sub',
): boolean {
  const start = state.pos;
  if (state.src.charCodeAt(start) !== ch) return false;
  // ~~ 是 strikethrough，避开
  if (ch === 0x7e && state.src.charCodeAt(start + 1) === 0x7e) return false;
  // 后紧跟空白 → 不是 delimiter 起点
  const next = state.src.charCodeAt(start + 1);
  if (isWhitespace(next) || isNaN(next)) return false;

  // 找闭合
  let pos = start + 1;
  while (pos < state.posMax) {
    const c = state.src.charCodeAt(pos);
    if (c === 0x5c /* \ */) {
      pos += 2;
      continue;
    }
    if (c === ch) {
      // 闭合前不能是空白
      const prev = state.src.charCodeAt(pos - 1);
      if (!isWhitespace(prev)) break;
    }
    if (c === 0x0a /* \n */) return false; // 跨行不算
    pos++;
  }
  if (pos >= state.posMax) return false;
  if (state.src.charCodeAt(pos) !== ch) return false;
  if (pos === start + 1) return false;

  if (!silent) {
    const content = state.src.slice(start + 1, pos);
    const open = state.push(`${tag}_open`, tag, 1);
    open.markup = String.fromCharCode(ch);
    const text = state.push('text', '', 0);
    text.content = content;
    const close = state.push(`${tag}_close`, tag, -1);
    close.markup = String.fromCharCode(ch);
  }
  state.pos = pos + 1;
  return true;
}

function isWhitespace(c: number): boolean {
  return c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d;
}
