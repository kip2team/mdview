// mdv:callout —— 兼容 Obsidian 的 callout 语法：
//   > [!warning] 标题
//   > 正文 ...
// 转成 <aside class="mdv-callout mdv-callout-warning"><div class="mdv-callout-title">...</div>...</aside>
import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token.mjs';

const HEADER_RE = /^\[!([A-Za-z][\w-]*)\]\s*(.*)$/;

/** 已知类型 —— 用于决定标题缺省值首字母大写显示；未知类型仍渲染但作为通用类 */
const KNOWN_TYPES = new Set([
  'note',
  'tip',
  'success',
  'info',
  'warning',
  'danger',
  'caution',
  'important',
  'question',
  'quote',
  'example',
]);

export function calloutExtension(md: MarkdownIt): void {
  // 1. 在 inline 阶段后扫描所有 blockquote_open，识别 callout 头并改写 token 流
  md.core.ruler.after('inline', 'mdv-callout-detect', (state) => {
    const tokens = state.tokens;
    for (let i = 0; i < tokens.length; i++) {
      const open = tokens[i];
      if (!open || open.type !== 'blockquote_open') continue;

      const para = tokens[i + 1];
      const inline = tokens[i + 2];
      if (!para || para.type !== 'paragraph_open') continue;
      if (!inline || inline.type !== 'inline') continue;

      // 只看第一行
      const firstNewline = inline.content.indexOf('\n');
      const firstLine =
        firstNewline === -1 ? inline.content : inline.content.slice(0, firstNewline);
      const m = firstLine.match(HEADER_RE);
      if (!m) continue;

      const type = m[1]!.toLowerCase();
      const title = m[2]!.trim() || capitalize(type);

      // 找到匹配的 blockquote_close
      let depth = 1;
      let closeIdx = -1;
      for (let j = i + 1; j < tokens.length; j++) {
        const t = tokens[j]!;
        if (t.type === 'blockquote_open') depth++;
        else if (t.type === 'blockquote_close') {
          depth--;
          if (depth === 0) {
            closeIdx = j;
            break;
          }
        }
      }
      if (closeIdx < 0) continue;

      // 标记 open / close token，渲染器据此输出自定义 HTML
      open.attrSet('data-mdv-callout', type);
      open.attrSet('data-mdv-callout-title', title);
      open.attrSet('data-mdv-callout-known', KNOWN_TYPES.has(type) ? '1' : '0');
      tokens[closeIdx]!.attrSet('data-mdv-callout', type);

      // 把首行的 [!type] 标题从 inline 内容里剥掉
      const rest = firstNewline === -1 ? '' : inline.content.slice(firstNewline + 1);
      if (rest.trim().length === 0) {
        // 没有正文 —— 移除 paragraph_open / inline / paragraph_close 三个 token
        tokens.splice(i + 1, 3);
      } else {
        // 重新解析剩余 markdown 内容，更新 inline.children
        inline.content = rest;
        const reparsed = md.parseInline(rest, state.env);
        const replacement = reparsed[0]?.children;
        if (replacement) inline.children = replacement;
      }
    }
  });

  // 2. 渲染：blockquote_open / blockquote_close 被 callout 标记时输出 <aside>
  const origOpen =
    md.renderer.rules.blockquote_open ??
    ((tokens, idx, opts, _env, self) => self.renderToken(tokens, idx, opts));
  md.renderer.rules.blockquote_open = (tokens, idx, opts, env, self) => {
    const tok = tokens[idx];
    const type = tok?.attrGet('data-mdv-callout');
    if (type) {
      const title = tok!.attrGet('data-mdv-callout-title') ?? capitalize(type);
      const safeType = sanitizeClassFragment(type);
      return (
        `<aside class="mdv-callout mdv-callout-${escapeAttr(safeType)}" data-mdv-callout="${escapeAttr(safeType)}">` +
        `<div class="mdv-callout-title">${escapeHtml(title)}</div>\n`
      );
    }
    return origOpen(tokens, idx, opts, env, self);
  };

  const origClose =
    md.renderer.rules.blockquote_close ??
    ((tokens, idx, opts, _env, self) => self.renderToken(tokens, idx, opts));
  md.renderer.rules.blockquote_close = (tokens, idx, opts, env, self) => {
    const tok = tokens[idx];
    if (tok?.attrGet('data-mdv-callout')) {
      return '</aside>\n';
    }
    return origClose(tokens, idx, opts, env, self);
  };

  // 引用 Token 类型避免 TS 警告（markdown-it 的 Token 在某些 type 配置下被推断为 unused import）
  void (null as Token | null);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** class 片段只允许 [A-Za-z0-9_-]，防止 callout type 被注入恶意字符 */
function sanitizeClassFragment(s: string): string {
  return s.replace(/[^A-Za-z0-9_-]/g, '');
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
