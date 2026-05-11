---
mdview: 1
title: Authoring mdview Extensions
description: How to write a third-party extension for the mdview engine.
theme: default
toc: true
---

# Authoring mdview Extensions

mdview 的扩展机制就是 **markdown-it plugin** 的薄包装。如果你已经写过 markdown-it 插件，迁移到 mdview 几乎零成本。

## 一句话原理

```ts
import { registerExtension } from '@mdview/core';

registerExtension('myorg:badge', (md) => {
  // md 就是一个标准的 MarkdownIt 实例
  // 你可以用 md.inline.ruler / md.block.ruler / md.renderer.rules 等任何 markdown-it API
});
```

注册后，任何文档只要在 front matter `extensions: [myorg:badge]` 就会启用这个扩展。

## 命名规范

- 内置扩展用 `mdv:*` 前缀（例如 `mdv:color`）—— **保留给官方**
- 第三方推荐用 `<author>:<name>` —— 例如 `acme:badge`、`zhangsan:tooltip`
- ID 区分大小写，建议小写

## 完整示例：自定义"高亮关键词"扩展

源文本：

```markdown
The MUST clauses in RFC 2119 are critical.
```

期望输出：把全大写的 RFC 2119 关键字（MUST / SHOULD / MAY）渲染为 chip 风格。

```ts
import { registerExtension } from '@mdview/core';
import type Token from 'markdown-it/lib/token.mjs';

const KEYWORDS = ['MUST', 'MUST NOT', 'SHOULD', 'SHOULD NOT', 'MAY'];
const KW_RE = new RegExp(`\\b(${KEYWORDS.join('|')})\\b`, 'g');

registerExtension('rfc:keywords', (md) => {
  md.core.ruler.after('inline', 'rfc-keywords', (state) => {
    for (const block of state.tokens) {
      if (block.type !== 'inline' || !block.children) continue;
      const out: Token[] = [];
      for (const tok of block.children) {
        if (tok.type !== 'text') {
          out.push(tok);
          continue;
        }
        // 文本切片
        const parts = tok.content.split(KW_RE);
        if (parts.length === 1) {
          out.push(tok);
          continue;
        }
        for (let i = 0; i < parts.length; i++) {
          if (i % 2 === 1) {
            const open = new state.Token('html_inline', '', 0);
            open.content = `<span class="rfc-kw">${parts[i]}</span>`;
            out.push(open);
          } else if (parts[i]) {
            const t = new state.Token('text', '', 0);
            t.content = parts[i] ?? '';
            out.push(t);
          }
        }
      }
      block.children = out;
    }
  });
});
```

样式由消费者侧 CSS 提供：

```css
.rfc-kw {
  display: inline-block;
  padding: 0 0.4em;
  border-radius: 3px;
  background: rgba(207, 34, 46, 0.12);
  color: #cf222e;
  font-weight: 600;
}
```

## 启用顺序

`render()` 调用时按 `extensions` 数组的顺序应用扩展。如果两个扩展在同一阶段（比如都改 inline ruler），先注册的先跑。如果你的扩展依赖另一个扩展先跑，请明确文档化。

## 兼容承诺

mdview 保证：

- **未识别的扩展 ID 不会报错**——只是静默忽略。这样旧文档开了某个扩展但当前环境没装，不会爆炸
- **内置 mdv:\* 扩展输出 HTML 结构稳定**——破坏性变更走 mdview 协议大版本（v2）
- **第三方扩展自行负责兼容性**——你升级时请遵循 semver

## 上传到 npm

推荐发布命名 `mdview-ext-<name>`，例如 `mdview-ext-rfc-keywords`。包内默认导出一个调用 `registerExtension` 的副作用模块即可。

```jsonc
// package.json
{
  "name": "mdview-ext-rfc-keywords",
  "type": "module",
  "main": "./dist/index.js",
  "exports": "./dist/index.js",
  "peerDependencies": {
    "@mdview/core": "^0.1.0 || ^1.0.0",
  },
}
```

用户在使用方一行 `import 'mdview-ext-rfc-keywords'` 即可在全局注册表里挂上扩展。
