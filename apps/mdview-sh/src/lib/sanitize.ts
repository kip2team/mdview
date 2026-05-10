// SSR 友好的 sanitize —— isomorphic-dompurify 在 Node / Workers 环境都能跑
// 与 desktop 的 sanitize 配置保持一致，确保两端渲染产物视觉相同
import DOMPurify from 'isomorphic-dompurify';

// 强制保留 data-mdv-* 属性 —— DOMPurify 默认会对含 `<`、`>`、`-->`、`[]` 等
// 看起来像 HTML 标记的 data 属性值做 mXSS 拦截，flowchart / sequenceDiagram 源码就会触发
DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
  if (data.attrName.startsWith('data-mdv-')) {
    data.keepAttr = true;
    data.forceKeepAttr = true;
  }
});

export function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    // html + svg + svgFilters：mermaid 等扩展可能产出 SVG 节点
    USE_PROFILES: { html: true, svg: true, svgFilters: true },
    ADD_ATTR: ['target', 'rel', 'style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}
