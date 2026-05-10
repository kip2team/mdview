# @mdview/format

`.mdv.html` 自渲染格式的序列化与解析。三种形态（Minimal / Progressive / Standalone）共用同一个核心载荷（`<script type="text/x-mdview">` 内的 markdown）。

## 用法

```ts
import { toMdvHtml, fromMdvHtml, convertForm } from '@mdview/format';

// 生成 progressive 形态
const html = toMdvHtml(markdown, {
  form: 'progressive',
  engine: { url: 'https://cdn.mdview.sh/r/v1.js' },
  theme: { id: 'medium', url: 'https://cdn.mdview.sh/themes/medium.css' },
  prerenderedHtml: rendered.html, // 来自 @mdview/core
});

// 反向解析
const { source, title, theme } = fromMdvHtml(html);

// 形态间互转（保持 markdown 源不变）
const minimal = convertForm(html, 'minimal');
```

详见 [docs/02-Format-Spec.md](../../docs/02-Format-Spec.md)。
