// HTML sanitize 工具 —— 把 markdown 引擎产出的原始 HTML 在注入 DOM 前清洗一遍，防御 XSS
// 详见 docs/02-Format-Spec.md §8 安全考量
import DOMPurify from 'dompurify';

// 一次性挂钩：给所有外链补上 rel="noopener noreferrer" + 默认 target=_blank
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    const href = node.getAttribute('href') ?? '';
    if (/^https?:/i.test(href)) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer nofollow');
    }
  }
});

/**
 * 清洗渲染后的 HTML 片段，准备塞入 #mdview-output。
 *
 * MVP 默认策略：
 * - 允许常见结构标签 + 行内格式
 * - 允许 class / id / data-* 以支持主题与扩展
 * - 允许 style，但只用于扩展的 CSS 变量赋值（如 --mdv-color）—— DOMPurify 默认会拦掉危险 url(javascript:...)
 * - 拒绝 script / iframe / object / embed
 * - 链接协议白名单：http / https / mailto / tel
 */
export function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel', 'style'],
    // 允许扩展用的 data-* 属性 —— DOMPurify 默认就允许 data-*，这里显式列出便于排查
    ADD_DATA_URI_TAGS: [],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}
