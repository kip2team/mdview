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

// 强制保留 data-mdv-* 属性 —— DOMPurify 默认会对含 `<`、`>`、`-->`、`[]` 等
// 看起来像 HTML 标记的 data 属性值做 mXSS 拦截，把整个 attribute 剥掉
// （flowchart / sequenceDiagram 源码就触发这个），导致 hydrate 拿不到源
DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
  if (data.attrName.startsWith('data-mdv-')) {
    data.keepAttr = true;
    // 同时把 forceKeepAttr 标志置 true，绕过后续值校验
    data.forceKeepAttr = true;
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
    // html + svg + svgFilters：mermaid 输出的 SVG 含 <foreignObject> / filter 等节点，
    // 仅用 html profile 会被剥掉，导致 sequenceDiagram 等图缺失内容
    USE_PROFILES: { html: true, svg: true, svgFilters: true },
    ADD_ATTR: ['target', 'rel', 'style'],
    ADD_DATA_URI_TAGS: [],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}
