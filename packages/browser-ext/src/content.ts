// Content script —— 在匹配的 raw .md 页面注入 mdview 渲染
// 触发时机：document_end，此时 <pre>{markdown 源}</pre> 已就绪
import DOMPurify from 'dompurify';
import { render } from '@mdview/core';

const STORAGE_KEY = 'mdview:theme';

(async function takeOver() {
  // 只在内容是 markdown（response 是 text/plain 或 url 以 .md 结尾）的页面接管
  const url = window.location.href;
  if (!isLikelyMarkdownPage(url)) return;

  // GitHub raw 把整个 markdown 包在 <pre> 里
  const pre = document.querySelector('body > pre');
  if (!pre) return;
  const markdown = pre.textContent ?? '';
  if (markdown.trim().length === 0) return;

  const themeId = (await readTheme()) ?? 'default';

  // 渲染
  let html: string;
  try {
    const result = render(markdown, {});
    html = DOMPurify.sanitize(result.html, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target', 'rel', 'style'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
    });
    if (result.meta.title) document.title = result.meta.title;
  } catch (err) {
    console.error('[mdview ext] render failed:', err);
    return;
  }

  // 替换页面内容
  document.body.innerHTML = `<main id="mdview-output">${html}</main>
    <div id="mdview-ext-toolbar">
      <button id="mdview-ext-toggle" type="button" title="Show original">Source</button>
    </div>`;
  document.body.dataset.mdviewTheme = themeId;

  // 工具栏交互
  const toggleBtn = document.getElementById('mdview-ext-toggle');
  let showingSource = false;
  const main = document.getElementById('mdview-output');
  toggleBtn?.addEventListener('click', () => {
    showingSource = !showingSource;
    if (!main) return;
    if (showingSource) {
      main.dataset.originalHtml = main.innerHTML;
      main.innerHTML = `<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace;">${escapeHtml(markdown)}</pre>`;
      toggleBtn.textContent = 'Rendered';
    } else {
      main.innerHTML = main.dataset.originalHtml ?? '';
      toggleBtn.textContent = 'Source';
    }
  });
})();

function isLikelyMarkdownPage(url: string): boolean {
  if (/raw\.githubusercontent\.com/.test(url)) return true;
  if (/gist\.githubusercontent\.com/.test(url)) return true;
  if (/\.(md|markdown)(\?|#|$)/i.test(url)) return true;
  return false;
}

async function readTheme(): Promise<string | null> {
  // Firefox 暴露 `browser`（promise-based），Chrome 暴露 `chrome`（callback-based）
  // 用 callback 形式包成 promise，两边都能跑
  const api =
    (globalThis as unknown as { browser?: typeof chrome }).browser ??
    (typeof chrome !== 'undefined' ? chrome : undefined);
  if (!api?.storage) return null;
  return new Promise<string | null>((resolve) => {
    try {
      api.storage.sync.get(STORAGE_KEY, (data: Record<string, unknown>) => {
        resolve((data[STORAGE_KEY] as string) ?? null);
      });
    } catch {
      resolve(null);
    }
  });
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
