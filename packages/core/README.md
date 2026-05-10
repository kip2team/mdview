# @mdview/core

mdview 渲染引擎核心。把 Markdown 解析为 HTML 片段 + 元数据 + 标题树，零运行时副作用，跨端可用。

## 用法

```ts
import { render } from '@mdview/core';

const { html, meta, headings } = render('# Hello\n\n**world**');
// html: '<h1 id="hello">Hello</h1>\n<p><strong>world</strong></p>\n'
// meta.title: 'Hello'
// headings: [{ level: 1, id: 'hello', text: 'Hello' }]
```

## 元数据合并优先级

```
options.override > front matter > options.themeDefaults > 内置默认
```

```ts
render(md, {
  themeDefaults: { theme: 'medium', maxWidth: '720px' }, // 主题贡献
  override: { theme: 'dark' }, // URL 参数等高优先级源
});
```

## 内置扩展

通过 `meta.extensions` 或 `options.extensions` 启用：

| ID | 描述 |
|---|---|
| `mdv:color` | `#ff6b35` 自动渲染为色块预览 |
| `mdv:callout` | `> [!warning] 标题` Obsidian 风格提示块 |
| `mdv:math` | `$inline$` / `$$block$$` 占位标记，由消费者侧 hydrate KaTeX |
| `mdv:mermaid` | ` ```mermaid ... ``` ` 占位标记，由消费者侧 hydrate mermaid |

## 进一步阅读

- [Format spec](../../docs/02-Format-Spec.md)
- [PRD](../../docs/01-PRD-and-Plan.md)
