# mdview Roadmap

> 公开版本路线图。详细的产品规划见 [docs/01-PRD-and-Plan.md](./docs/01-PRD-and-Plan.md)。

## ✅ Released / Scaffolded

### Engine

- `@mdview/core` —— Markdown 解析 / 渲染 / 元数据合并 / 标题树
- `@mdview/themes` —— 三个内置主题（default / github / medium）+ 扩展共享样式
- `@mdview/format` —— `.mdv.html` 三形态序列化与互转
- `@mdview/cli` —— `mdview render / export / convert` 命令行
- `@mdview/engine-browser` —— 部署到 cdn.mdview.sh 的浏览器自启动包

### Extensions

- `mdv:color` —— `#rgb / #rrggbb / #rrggbbaa` 色块预览
- `mdv:callout` —— Obsidian 风格 `> [!warning]` 提示块
- `mdv:math` —— `$inline$` / `$$block$$` 占位 + 客户端 KaTeX hydrate
- `mdv:mermaid` —— ` ```mermaid ` 占位 + 客户端 mermaid hydrate
- **Plugin SDK** —— 第三方可 `registerExtension(id, factory)`

### Surfaces

- 桌面端（Tauri 2 + Vite + React）—— 三态视图（Read / Split / Source）、主题切换、TOC、最近文件、欢迎页、拖拽、shiki 代码高亮、`.mdv.html` 导出对话框
- mdview.sh（Astro + Cloudflare Workers）—— URL 预览、短链、OG 卡片、文档站
- 浏览器扩展（Chrome / Edge MV3 骨架）—— 接管 raw GitHub README
- VS Code 扩展骨架 —— 替换默认 markdown preview
- `@mdview/mcp` —— 给 Claude / 其他 AI 暴露渲染工具
- mdview-beautifier Skill —— 让 Claude 输出带元数据的 .md
- `@mdview/importer` —— Typora / Obsidian 主题转 mdview

### Engineering

- pnpm monorepo
- ESLint + prettier + tsc 全 workspace 检查
- GitHub Actions CI（typecheck / test / build / lint）
- changesets 版本管理 + 发布工作流
- CDN 资源构建脚本（`pnpm cdn:build`）

## 🔜 Next up

- 浏览器扩展 Firefox 兼容 + Chrome Web Store 上架
- VS Code 扩展打磨 + Marketplace 上架
- cdn.mdview.sh 实际部署（占位 URL → 真实 CDN）
- mdview.sh 主域名启用
- 更多内置扩展：`mdv:kbd` / `mdv:badge` / `mdv:progress`
- desktop 性能优化：大文件（>1 MB）流式渲染
- desktop 文件系统级 QuickLook（macOS）
- AI 增强阅读：摘要 / 翻译 / 智能 TOC

## 🧪 Exploring

- **Live Preview 模式（Obsidian 风格）**：编辑与渲染合一，光标离开行时隐藏 markdown 标记符号。基于 CodeMirror 6 Decoration API。预估 2-3 周专注开发。当前 mdview 阅读器优先定位与编辑器红海竞争错位，等用户需求明确再启动
- 主题市场（用户上传 / 浏览 / 付费）
- 团队空间 / 私有 URL（带 token 拉私有 GitHub）
- 文档级评论 / 反应（giscus 集成）
- iOS / Android 阅读器（PWA 优先）
- JetBrains 插件
- 内嵌 chart.js / d3 块级渲染

## 🚫 Won't do

- 多人实时协作编辑（避开 HackMD / Notion 红海）
- 笔记 / 知识管理系统（避开 Obsidian / Notion）
- 自有图床 / 媒体托管（运维负担大，复用 GitHub / Cloudinary 即可）

## 时间线

mdview 由社区 / 单人独立开发，**不承诺时间表**。每个里程碑完成后会发 release。

如果你想知道某个具体功能什么时候做：

- 看本页"Next up"里有没有 → 已在路线
- 没有的话开个 [GitHub issue](https://github.com/mdview-sh/mdview/issues/new) 讨论

## 贡献

每个包都有自己的 README，详见 [getting-started](./docs/getting-started.md) 和 [plugin-authoring](./docs/plugin-authoring.md)。

PR 欢迎，特别是：

- 新主题（参考 `packages/themes/src/themes/`）
- 第三方扩展（用 `registerExtension` API）
- bug fix
- 文档改进
