// mdv:details —— ::: details 标题  / ... / ::: 折叠块语法
// 例：
//   ::: details Click to expand
//   Hidden content
//   :::
// 渲染为 <details><summary>...</summary>...</details>
import type MarkdownIt from 'markdown-it';
import type StateBlock from 'markdown-it/lib/rules_block/state_block.mjs';

const FENCE_OPEN = /^:::\s+details(?:\s+(.*))?\s*$/;
const FENCE_CLOSE = /^:::\s*$/;

export function detailsExtension(md: MarkdownIt): void {
  md.block.ruler.before('fence', 'mdv-details', (state, startLine, endLine, silent) => {
    return parseDetails(state, startLine, endLine, silent);
  });

  md.renderer.rules.mdv_details_open = (tokens, idx) => {
    const tok = tokens[idx]!;
    const summary = tok.attrGet('summary') ?? 'Details';
    return (
      `<details class="mdv-details">` +
      `<summary class="mdv-details-summary">${escapeHtml(summary)}</summary>\n`
    );
  };
  md.renderer.rules.mdv_details_close = () => `</details>\n`;
}

function parseDetails(
  state: StateBlock,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  const startPos = state.bMarks[startLine]! + state.tShift[startLine]!;
  const startMax = state.eMarks[startLine]!;
  const startLineText = state.src.slice(startPos, startMax);
  const openMatch = startLineText.match(FENCE_OPEN);
  if (!openMatch) return false;
  if (silent) return true;

  const summary = (openMatch[1] ?? '').trim() || 'Details';

  // 找闭合 ":::"
  let nextLine = startLine + 1;
  let foundClose = false;
  while (nextLine < endLine) {
    const linePos = state.bMarks[nextLine]! + state.tShift[nextLine]!;
    const lineMax = state.eMarks[nextLine]!;
    const lineText = state.src.slice(linePos, lineMax);
    if (FENCE_CLOSE.test(lineText)) {
      foundClose = true;
      break;
    }
    nextLine++;
  }
  if (!foundClose) return false;

  // open token
  const oldParentType = state.parentType;
  const oldLineMax = state.lineMax;
  state.parentType = 'reference' as never;

  const openTok = state.push('mdv_details_open', 'details', 1);
  openTok.markup = ':::';
  openTok.block = true;
  openTok.attrSet('summary', summary);
  openTok.map = [startLine, nextLine];

  // 让 markdown-it 把中间行作为子内容继续解析
  state.line = startLine + 1;
  state.lineMax = nextLine;
  // @ts-expect-error md.block is internal but used in markdown-it plugins
  state.md.block.tokenize(state, startLine + 1, nextLine);
  state.lineMax = oldLineMax;
  state.parentType = oldParentType;

  const closeTok = state.push('mdv_details_close', 'details', -1);
  closeTok.markup = ':::';
  closeTok.block = true;

  state.line = nextLine + 1;
  return true;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
