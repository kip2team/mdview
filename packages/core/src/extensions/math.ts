// mdv:math —— 识别 $inline$ 与 $$block$$ 数学公式，emit 占位标记
// 关键设计：core 只产出语义标记（class + data-mdv-math），KaTeX 重活留给消费者按需 hydrate
// （桌面端 / Web / 浏览器引擎可以各自决定何时 import katex）
import type MarkdownIt from 'markdown-it';
import type StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs';
import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs';

export function mathExtension(md: MarkdownIt): void {
  // ── 行内：$...$ ───────────────────────────────────
  md.inline.ruler.after('escape', 'mdv-math-inline', (state, silent) => {
    return mathInline(state, silent);
  });

  // ── 块级：$$...$$ ─────────────────────────────────
  md.block.ruler.after('blockquote', 'mdv-math-block', (state, startLine, endLine, silent) => {
    return mathBlock(state, startLine, endLine, silent);
  });

  // ── 渲染规则 ─────────────────────────────────────
  md.renderer.rules.mdv_math_inline = (tokens, idx) => {
    const token = tokens[idx]!;
    const formula = token.content;
    return `<span class="mdv-math mdv-math-inline" data-mdv-math="${escapeAttr(
      formula,
    )}">${escapeHtml(formula)}</span>`;
  };
  md.renderer.rules.mdv_math_block = (tokens, idx) => {
    const token = tokens[idx]!;
    const formula = token.content;
    return `<div class="mdv-math mdv-math-block" data-mdv-math="${escapeAttr(
      formula,
    )}"><pre>${escapeHtml(formula)}</pre></div>\n`;
  };
}

/** 行内 $...$ —— 启发式：$ 后必须紧跟非空白字符，闭合 $ 前也必须是非空白字符（避免误吞 "$5 and $10"） */
function mathInline(state: StateInline, silent: boolean): boolean {
  const start = state.pos;
  if (state.src.charCodeAt(start) !== 0x24 /* $ */) return false;
  // 前一字符也得不是 $（否则是 $$ 块的开头）
  if (start > 0 && state.src.charCodeAt(start - 1) === 0x24) return false;
  // 后一字符是 $ → 是 $$，留给块规则处理
  if (state.src.charCodeAt(start + 1) === 0x24) return false;
  // $ 后紧跟空白 → 不是公式
  const next = state.src.charCodeAt(start + 1);
  if (isWhitespace(next) || isNaN(next)) return false;

  // 找匹配的闭合 $
  let pos = start + 1;
  while (pos < state.posMax) {
    const ch = state.src.charCodeAt(pos);
    if (ch === 0x5c /* \ */) {
      pos += 2;
      continue;
    }
    if (ch === 0x24) {
      const prev = state.src.charCodeAt(pos - 1);
      if (!isWhitespace(prev)) break;
    }
    pos++;
  }
  if (pos >= state.posMax) return false;
  if (state.src.charCodeAt(pos) !== 0x24) return false;
  if (pos === start + 1) return false; // 空公式

  if (!silent) {
    const formula = state.src.slice(start + 1, pos);
    const token = state.push('mdv_math_inline', '', 0);
    token.content = formula;
    token.markup = '$';
  }
  state.pos = pos + 1;
  return true;
}

/** 块级 $$...$$ —— 第一行必须以 $$ 开始；闭合 $$ 可以与开始同行（$$x=1$$）或后续行 */
function mathBlock(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  const startPos = state.bMarks[startLine]! + state.tShift[startLine]!;
  const startMax = state.eMarks[startLine]!;
  if (startPos + 2 > startMax) return false;
  if (state.src.slice(startPos, startPos + 2) !== '$$') return false;
  if (silent) return true;

  let firstLineRest = state.src.slice(startPos + 2, startMax);
  let lastLineContent = '';
  let foundClosing = false;
  let lineCursor = startLine;

  // 同行就闭合：$$x=1$$
  const trimmedFirst = firstLineRest.trimEnd();
  if (trimmedFirst.endsWith('$$') && trimmedFirst.length > 2) {
    firstLineRest = trimmedFirst.slice(0, -2);
    foundClosing = true;
  } else {
    // 多行：往下找 $$ 闭合
    while (lineCursor < endLine - 1) {
      lineCursor++;
      const linePos = state.bMarks[lineCursor]! + state.tShift[lineCursor]!;
      const lineMax = state.eMarks[lineCursor]!;
      const line = state.src.slice(linePos, lineMax).trimEnd();
      const closeIdx = line.lastIndexOf('$$');
      if (closeIdx >= 0 && (line.length === 2 || closeIdx === line.length - 2)) {
        lastLineContent = line.slice(0, closeIdx);
        foundClosing = true;
        break;
      }
    }
  }
  if (!foundClosing) return false;

  // 拼公式内容
  const middle: string[] = [];
  if (firstLineRest.length > 0) middle.push(firstLineRest);
  for (let l = startLine + 1; l < lineCursor; l++) {
    const lp = state.bMarks[l]! + state.tShift[l]!;
    const lm = state.eMarks[l]!;
    middle.push(state.src.slice(lp, lm));
  }
  if (lineCursor > startLine && lastLineContent) middle.push(lastLineContent);
  const formula = middle.join('\n').trim();

  state.line = lineCursor + 1;
  const token = state.push('mdv_math_block', '', 0);
  token.block = true;
  token.content = formula;
  token.markup = '$$';
  token.map = [startLine, state.line];
  return true;
}

function isWhitespace(ch: number): boolean {
  return ch === 0x20 || ch === 0x09 || ch === 0x0a || ch === 0x0d;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
// 同 mermaid.ts 注释：必须 escape `<>`，否则 DOMPurify 会把 data 属性整体剥掉
function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
