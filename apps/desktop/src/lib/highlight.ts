// 代码块语法高亮 —— 异步增强 mdview/core 渲染出来的 <pre><code class="language-X"> 块
// 用 shiki（VS Code 同款），单文档首次渲染会有几十毫秒预热，之后接近瞬时
import type { Highlighter, BundledLanguage, BundledTheme } from 'shiki';

/** 主题 ID（暗 / 亮）—— 默认双主题打包，让 mediaQuery 自动切 */
const THEMES: BundledTheme[] = ['github-light', 'github-dark'];

/** 预加载的常用语言 —— 命中率最高，避免运行时拉 grammar */
const PRELOAD_LANGS: BundledLanguage[] = [
  'javascript',
  'typescript',
  'tsx',
  'jsx',
  'json',
  'yaml',
  'markdown',
  'bash',
  'shell',
  'rust',
  'python',
  'go',
  'java',
  'css',
  'html',
  'sql',
];

/** 单例 highlighter —— 同一会话只创建一次 */
let _hl: Promise<Highlighter> | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (_hl) return _hl;
  _hl = (async () => {
    const shiki = await import('shiki');
    return shiki.createHighlighter({
      themes: THEMES,
      langs: PRELOAD_LANGS,
    });
  })();
  return _hl;
}

/** 匹配 markdown-it 输出的代码块：<pre><code class="language-XX">...</code></pre> */
const CODE_BLOCK_RE =
  /<pre><code class="language-([A-Za-z0-9_+-]+)">([\s\S]*?)<\/code><\/pre>/g;

/**
 * 把 HTML 中所有有语言标识的代码块用 shiki 重新渲染。
 * 找不到语言的块原样保留。
 */
export async function highlightHtml(html: string): Promise<string> {
  if (!CODE_BLOCK_RE.test(html)) return html;
  CODE_BLOCK_RE.lastIndex = 0;

  const matches = [...html.matchAll(CODE_BLOCK_RE)];
  if (matches.length === 0) return html;

  const hl = await getHighlighter();
  const loadedLangs = new Set(hl.getLoadedLanguages());

  const replacements = await Promise.all(
    matches.map(async (m) => {
      const lang = m[1]!;
      const code = decodeHtml(m[2]!).replace(/\n$/, '');
      try {
        if (!loadedLangs.has(lang as BundledLanguage)) {
          // 尝试动态加载未预热语言；失败就回退原样
          try {
            await hl.loadLanguage(lang as BundledLanguage);
            loadedLangs.add(lang as BundledLanguage);
          } catch {
            return null;
          }
        }
        const highlighted = hl.codeToHtml(code, {
          lang,
          themes: { light: 'github-light', dark: 'github-dark' },
          defaultColor: false,
        });
        return { match: m[0], replacement: highlighted };
      } catch {
        return null;
      }
    }),
  );

  let result = html;
  for (const r of replacements) {
    if (!r) continue;
    // 简单字符串替换 —— matches 由原始 html 切出，唯一性由 lastIndex 推进保证
    result = result.replace(r.match, () => r.replacement);
  }
  return result;
}

/** 把 HTML 实体解码回原文（主要给 markdown-it 默认 escape 的代码块用） */
function decodeHtml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}
