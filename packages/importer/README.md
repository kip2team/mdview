# @mdview/importer

Typora（与未来：Obsidian）主题导入器。把外部主题的 CSS 转成 mdview 主题。

## 用法（CLI）

```bash
pnpm --filter @mdview/importer build

# 用 npx 跑（也可以 pnpm exec）
npx mdview-import typora ./Lapis.css --id lapis --name Lapis --author author-name
# 输出：./mdview-themes/lapis/{theme.css, theme.json}
```

## 用法（API）

```ts
import { importTyporaTheme } from '@mdview/importer';
import { readFile } from 'node:fs/promises';

const css = await readFile('Lapis.css', 'utf8');
const { css: mdviewCss, meta, warnings } = importTyporaTheme(css, {
  id: 'lapis',
  name: 'Lapis',
});
```

## 已知限制

- 不能 100% 自动 —— 高度定制的 Typora 主题（依赖 CodeMirror 类、TOC 边栏等）会丢一部分规则
- 注释中的 `#write` 等字符串会被一并替换（无副作用，但视觉上别扭）
- Obsidian 主题转换器尚未实现（路线图里）
