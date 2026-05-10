// 浏览器端 mdview 引擎启动脚本
// 部署后路径：https://cdn.mdview.sh/r/v1.js
//
// 行为：
// 1. DOM ready 后查找 #mdview-source（约定标识，见 02-Format-Spec §3）
// 2. 取出原始 markdown，调用 @mdview/core.render
// 3. DOMPurify 清洗后写入 #mdview-output
// 4. 若 #mdview-output 已有内容（progressive 形态），先 diff，仅在源码不同步时才覆盖
import DOMPurify from 'dompurify';
import { render, MDVIEW_OUTPUT_ID, MDVIEW_SOURCE_ID } from '@mdview/core';

declare global {
  interface Window {
    /** 调试用 —— 暴露 render API 给 console 实验 */
    mdview?: {
      render: typeof render;
      version: string;
    };
  }
}

const VERSION = '0.0.1';

function boot(): void {
  const source = document.getElementById(MDVIEW_SOURCE_ID);
  const output = document.getElementById(MDVIEW_OUTPUT_ID);
  if (!source || !output) {
    // 不是 .mdv.html，静默退出（便于把 v1.js 不小心引到普通页面时不报错）
    return;
  }

  const markdown = source.textContent ?? '';
  if (markdown.trim().length === 0) return;

  try {
    const result = render(markdown, {});
    const safeHtml = DOMPurify.sanitize(result.html, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target', 'rel', 'style'],
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
    });

    // progressive 形态下 #mdview-output 已含预渲染 HTML，仅当 markdown 在 source 和 output 之间
    // 不同步时（用户编辑了 source 但未重新生成）才覆盖。MVP 先简单粗暴覆盖。
    output.innerHTML = safeHtml;

    // 把 metadata 标题同步到 <title>（如果文档没自带 title 标签）
    if (result.meta.title && !document.title) {
      document.title = result.meta.title;
    }

    // 给所有外链补 rel
    output.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
      const href = a.getAttribute('href') ?? '';
      if (/^https?:/i.test(href)) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer nofollow');
      }
    });
  } catch (err) {
    console.error('[mdview engine] render failed:', err);
  }

  // 暴露给 window.mdview 便于调试
  window.mdview = { render, version: VERSION };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
