# Getting Started

本文档面向首次在本机启动 mdview 开发环境的人（包括未来的你自己）。

## 1. 安装系统依赖

### Node.js + pnpm（必装）

```bash
# 任选其一
brew install node pnpm                  # macOS / Homebrew
corepack enable && corepack prepare pnpm@9 --activate
npm i -g pnpm
```

确认版本：

```bash
node --version   # v20+
pnpm --version   # 9+
```

### Rust + Tauri 系统依赖（仅桌面端）

如果你想运行或打包桌面端应用：

```bash
# 安装 Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
rustc --version

# Tauri 2 系统级依赖（macOS）
xcode-select --install
```

Linux / Windows 用户参考 https://tauri.app/start/prerequisites/。

## 2. 拉代码 + 装依赖

```bash
git clone git@github.com:mdview-sh/mdview.git
cd mdview
pnpm install
```

## 3. 跑核心包测试

```bash
pnpm --filter @mdview/core test
pnpm --filter @mdview/format test
```

通过即说明渲染与序列化两条主路径正常。

## 4. 用 CLI 渲染一份 markdown

```bash
# 先 build 一次（CLI 依赖 core / themes / format 的编译产物）
pnpm build

# 创建一个示例
echo '# Hello mdview\n\n一段 **粗体** 文本.' > /tmp/hello.md

# 渲染到 stdout
pnpm cli -- render /tmp/hello.md

# 导出 progressive 形态的 .mdv.html
pnpm cli -- export /tmp/hello.md --form progressive --theme medium

# 导出三种形态
pnpm cli -- export /tmp/hello.md --form all
```

打开生成的 `*.mdv.html` 文件，浏览器即可看到渲染效果。

## 5. 跑桌面端

### 仅前端（不装 Rust 也能调试 UI）

```bash
pnpm --filter @mdview/desktop run dev
# 浏览器访问 http://localhost:1420
```

### 完整 Tauri 桌面端

```bash
pnpm desktop:dev
```

第一次启动会下载并编译 Rust 依赖，可能需要数分钟。

打开后默认显示欢迎页，可：

- 按 `⌘O` / `Ctrl+O` 选择 `.md` 文件
- 拖一个 `.md` 文件到窗口里
- 双击系统中的 `.md` 文件（需先打包并安装 mdview，参见下一节）

### 打包桌面端发行版

```bash
pnpm --filter @mdview/desktop run tauri:build
```

产物会在 `apps/desktop/src-tauri/target/release/bundle/` 下。

## 6. 项目结构速查

请参见根目录 `README.md`。

## 7. 常见问题

**`pnpm install` 报 ETARGET / 找不到包**：先 `pnpm store prune && pnpm install`。

**`pnpm tauri:dev` 第一次很慢**：Rust crate 编译预热，没办法加速。后续增量编译会快一个数量级。

**修改 core 后桌面端没生效**：core 是 TS 源码 + tsc 输出，桌面端引用的是 `dist/`。在另一终端 `pnpm --filter @mdview/core run dev` 让它持续 watch 编译。

**没有图标的 Tauri 报错**：在 `apps/desktop/src-tauri/icons/` 占位即可。要打正式包时执行 `pnpm tauri icon path/to/logo.png` 自动生成完整套件。
