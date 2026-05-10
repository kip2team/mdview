# Host Actions

需要 King 在本机执行的事项汇总。沙盒里做不了或验证不了的，全列在这里，按时间线追加。每条都标记完成后由 King 划掉即可。

## 一次性

### A-1 · 清理沙盒残留的 .git，重建本地仓库

工作区挂载层不允许沙盒删除 `.git`，请在本机执行：

```bash
cd /Users/king/work/workspace-kip2/mdview
rm -rf .git
git init -b main
git config user.email "pridesky@gmail.com"
git config user.name "King"
git add -A
git commit -m "chore: initial commit — engine / themes / format / cli / desktop scaffolding"
```

### A-2 · 安装系统依赖

```bash
# Node 20+ / pnpm 9+
brew install node pnpm
# 或
corepack enable && corepack prepare pnpm@9 --activate

# Rust + Tauri 系统依赖（仅桌面端需要）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
xcode-select --install
```

### A-3 · 装项目依赖 + 跑测试

```bash
cd /Users/king/work/workspace-kip2/mdview
pnpm install
pnpm --filter @mdview/core test
pnpm --filter @mdview/format test
pnpm build
```

### A-4 · 跑桌面端

```bash
# 仅前端（不需要 Rust）
pnpm --filter @mdview/desktop run dev
# → http://localhost:1420

# 完整 Tauri 桌面端
pnpm desktop:dev
```

## 域名 / 占名（决策日志见 docs/01-PRD-and-Plan.md §11.4）

### B-1 · 域名注册

去 Porkbun 或 Namecheap 抢注：

- [ ] `mdview.sh`（必抢，主域名）
- [ ] `mdview.md`（强烈建议，做品牌防御）

### B-2 · GitHub / npm 占名

- [ ] GitHub org `mdview`（如已被占用，退到 `mdview-sh`）
- [ ] npm scope `@mdview`：`npm org create mdview`
- [ ] npm 包名 `mdview`（保留作为 CLI 入口）

### B-3 · 社交账号占位

- [ ] Twitter / X：`@mdview` 或 `@mdview_sh`
- [ ] ProductHunt 账号
- [ ] （可选）微信公众号

## 后续累积区

> 后续每次开发会话有新的 host action 都追加到下面，按时间顺序。

## CDN / 部署

### C-1 · 部署 cdn.mdview.sh

`packages/engine-browser` 与 `packages/themes` 的产物要上传到 `cdn.mdview.sh`，路径见 docs/01-PRD-and-Plan §11.2.5。

```bash
pnpm --filter @mdview/engine-browser build
pnpm --filter @mdview/themes build
# 上传 packages/engine-browser/dist/v1.js → cdn.mdview.sh/r/v1.js
# 上传 packages/themes/src/themes/*.css → cdn.mdview.sh/themes/<id>.css
# 上传 packages/themes/src/extensions.css → cdn.mdview.sh/ext/extensions.css
```

推荐方案：Cloudflare R2 + Workers 路由。

### C-2 · 部署 mdview.sh

```bash
cd apps/mdview-sh
# 创建两个 KV namespace
wrangler kv namespace create SHORTLINKS
wrangler kv namespace create RATE_KV
# 把返回的 id 填到 wrangler.toml 里替换 REPLACE_WITH_REAL_KV_ID
pnpm build
wrangler deploy
```

### C-3 · 浏览器扩展上架

```bash
pnpm --filter @mdview/browser-ext build
# 把 packages/browser-ext/dist 打包成 zip
zip -r mdview-ext.zip packages/browser-ext/dist
# 上传到 Chrome Web Store / Firefox Add-ons
```

### C-4 · VS Code 扩展发布

```bash
pnpm --filter mdview build
cd packages/vscode
pnpm package           # 生成 mdview-0.0.1.vsix
vsce publish           # 需要 publisher 账号
```

### C-5 · MCP server 接入 Claude Desktop

```bash
pnpm --filter @mdview/mcp build
# 在 Claude Desktop 配置文件添加 server，路径见 packages/mcp/README.md
```

---

### （会话 2026-05-09 累积）

#### V-1 · 跑扩展单测验证

`mdv:color` / `mdv:callout` 扩展已实现 + 写好 vitest 单测（`packages/core/src/extensions/extensions.test.ts`），沙盒里 pnpm install 因挂载权限受限装不动 node_modules。请本机 `pnpm install` 之后跑：

```bash
cd /Users/king/work/workspace-kip2/mdview
pnpm --filter @mdview/core test
# 期望：8 个 mdv:color test + 8 个 mdv:callout test 全绿
```

#### V-2 · 桌面端体验自测

`pnpm --filter @mdview/desktop run dev` 后访问 http://localhost:1420 自测：

- 顶部右上角能看到工具栏（半透明 hover 显形）
- 点 🎨 按钮能弹出主题菜单，选 medium / github 立即生效
- 主题选择跨刷新保留（localStorage）
- 拖一个含 `> [!warning] X` 与 `#ff6b35` 的 .md（front matter 里写 `extensions: [mdv:callout, mdv:color]`）应该看到 callout 块和色块预览
- ⌘E 打开导出对话框，选 Standalone 形态 → 浏览器下载 `.mdv.html`（dev 模式）；用浏览器打开应能离线渲染
- ⌘O 打开任意带代码块的 .md（` ```ts ... ``` `），首屏看到原始 pre/code，约 50–200ms 后自动升级为 shiki 高亮（明暗主题随系统）

#### V-3 · 导出形态对照检查

```bash
pnpm cli -- export some.md --form all --theme medium
# 预期产出三个文件：
#   some.minimal.mdv.html    （CDN 上线后才能渲染）
#   some.progressive.mdv.html （直接打开就能看，CDN 上线后可热升级）
#   some.standalone.mdv.html  （直接打开就能看，无任何远程依赖）
```

浏览器打开 progressive / standalone 应该能直接看到内容；minimal 在 CDN 部署前会是空白页，这是预期行为。

#### V-4 · 新增功能整体冒烟（追加于会话 2026-05-09）

新接入的能力 / 包：

- **TOC 侧栏**：在前置加 `toc: true` 的 .md 上验证，1280px+ 宽度才显示
- **欢迎页 + 拖拽 overlay**：启动时无文件应进欢迎页；拖文件进窗口期间显示 overlay
- **最近文件**：打开过的文件应在欢迎页 Recent 区
- **math 扩展**：`extensions: [mdv:math]` + 文档含 `$x^2$` 应显示 KaTeX
- **mermaid 扩展**：`extensions: [mdv:mermaid]` + ` ```mermaid graph TD; A-->B ``` ` 应显示图
- **浏览器扩展**：`pnpm --filter @mdview/browser-ext build` 后 chrome://extensions 加载 dist/，访问 raw.githubusercontent.com 上的 .md 应自动接管
- **VS Code 扩展**：`pnpm --filter mdview build` 后 F5 进 host，运行 `mdview: Open Preview to the Side`
- **MCP server**：`pnpm --filter @mdview/mcp build`，连到 Claude Desktop 后能调用 render / export_mdv_html / convert_form / list_themes
- **Typora 主题导入器**：`npx mdview-import typora <some.css> --id test`，验证 ./mdview-themes/test/{theme.css, theme.json} 生成
- **文档站**：`mdview.sh/docs` 应能渲染 docs/ 下所有 .md（用 mdview 自渲染）
- **changeset**：`pnpm changeset` 能正常运行
