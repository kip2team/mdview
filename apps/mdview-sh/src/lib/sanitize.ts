// Cloudflare Workers 友好的 sanitize —— 用 sanitize-html（纯 JS、无 DOM 依赖）
//
// 为什么不是 isomorphic-dompurify：
// 它底层依赖 jsdom（浏览器外环境时），需要完整 Node DOM API。Cloudflare Workers
// 的 V8 isolate + nodejs_compat 提供的 polyfill 不够，启动时 jsdom 会报错让 Worker 5xx。
//
// sanitize-html 是纯字符串解析 + 白名单过滤，无 DOM 依赖，在 Workers 完美工作。
import sanitizeHtml from 'sanitize-html';

const SVG_TAGS = [
  'svg',
  'g',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'text',
  'tspan',
  'textPath',
  'mask',
  'clipPath',
  'defs',
  'use',
  'symbol',
  'foreignObject',
  'marker',
  'pattern',
  'linearGradient',
  'radialGradient',
  'stop',
  'filter',
  'feGaussianBlur',
  'feOffset',
  'feMerge',
  'feMergeNode',
  'feFlood',
  'feComposite',
];

const SVG_ATTRS = [
  'viewBox',
  'preserveAspectRatio',
  'xmlns',
  'xmlns:xlink',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-opacity',
  'fill-opacity',
  'opacity',
  'transform',
  'transform-origin',
  'd',
  'cx',
  'cy',
  'r',
  'rx',
  'ry',
  'x',
  'y',
  'x1',
  'y1',
  'x2',
  'y2',
  'width',
  'height',
  'points',
  'text-anchor',
  'dominant-baseline',
  'font-size',
  'font-family',
  'font-weight',
  'dx',
  'dy',
  'dur',
  'begin',
  'end',
  'offset',
  'stop-color',
  'stop-opacity',
  'gradientTransform',
  'gradientUnits',
  'spreadMethod',
];

export function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'h1',
      'h2',
      'aside',
      'figure',
      'figcaption',
      'kbd',
      'sub',
      'sup',
      'details',
      'summary',
      'main',
      ...SVG_TAGS,
    ],
    allowedAttributes: {
      // 全标签共享：class / id / style / data-* / aria-* / role / title
      // sanitize-html 支持 data-* 通配符
      '*': ['class', 'id', 'style', 'data-*', 'aria-*', 'role', 'title'],
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      // SVG 元素允许常见绘图属性（mermaid 输出会用到）
      ...Object.fromEntries(SVG_TAGS.map((tag) => [tag, SVG_ATTRS])),
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel', 'ftp', 'data'],
    allowedSchemesAppliedToAttributes: ['href', 'src', 'cite'],
    disallowedTagsMode: 'discard',
    transformTags: {
      a: (tagName, attribs) => {
        // 外链补 rel
        const href = attribs.href ?? '';
        if (/^https?:/i.test(href)) {
          return {
            tagName,
            attribs: {
              ...attribs,
              target: '_blank',
              rel: 'noopener noreferrer nofollow',
            },
          };
        }
        return { tagName, attribs };
      },
    },
  });
}
