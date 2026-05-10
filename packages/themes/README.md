# @mdview/themes

mdview 内置主题包：default / github / medium 三个主题 + 扩展共享样式。

## 用法

### 在打包工具里直接 import CSS

```ts
import '@mdview/themes/default.css';
import '@mdview/themes/extensions.css'; // mdv:color / mdv:callout 等的样式
```

### 取主题元数据 / 默认值

```ts
import { BUILT_IN_THEMES, themeDefaults } from '@mdview/themes';

// 主题元数据列表（id / name / description / defaults）
console.log(BUILT_IN_THEMES);

// 给 core.render 的 themeDefaults 选项
render(md, { themeDefaults: themeDefaults('medium') });
```

## 主题文件规范

每个主题包含两个文件：

```
themes/<id>/
  ├── theme.css   # 样式（作用域在 #mdview-output 内）
  └── theme.json  # 元数据 + 默认值
```

CSS 必须只通过 `#mdview-output` 选择器作用域，避免污染宿主页面。
