// SSR 友好的 sanitize —— isomorphic-dompurify 在 Node / Workers 环境都能跑
// 与 desktop 的 sanitize 配置保持一致，确保两端渲染产物视觉相同
import DOMPurify from 'isomorphic-dompurify';

export function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel', 'style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}
