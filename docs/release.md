# Release Guide

mdview 的多端发布手册 —— 一次配置、长期一键发布。

---

## TL;DR（已配置过的人直接看这里）

```bash
# 1. 写一条 changeset（描述本次哪些包改了什么）
pnpm changeset

# 2. 把 changeset 转成版本号 bump + CHANGELOG
pnpm changeset:version

# 3. 提交 + 一键发布全线
git add -A && git commit -m "chore: release"
pnpm release:all
```

`release:all` 会自动跑：飞行检查 → 全量 build → mdview.sh → cdn.mdview.sh → npm publish → push tags。任一环节失败立即停止并打印回滚命令。

---

## 发布的是什么、发到哪里

| Surface              | 内容                              | 平台                       | 一键命令              |
| -------------------- | --------------------------------- | -------------------------- | --------------------- |
| **mdview.sh**        | Astro Worker（在线渲染、首页）    | Cloudflare Workers         | `pnpm release:web`    |
| **cdn.mdview.sh**    | engine-browser + themes（IIFE）   | Cloudflare Pages           | `pnpm release:cdn`    |
| **npm 包**           | 8 个 `@mdview/*` 包               | registry.npmjs.org         | `pnpm release:npm`    |
| **桌面端**           | Tauri `.dmg` / `.exe`             | GitHub Releases            | `pnpm desktop:build`  |
| **浏览器扩展**       | Chrome / Firefox / Edge           | 各自 store                 | 见下文                |
| **VS Code 插件**     | `.vsix`                           | VS Code Marketplace        | 见下文                |

---

## 一次性配置（每台机器 / 每个新成员各做一次）

### 1. npm —— 这里有坑，仔细看

mdview 必须发到 **官方 registry**（`registry.npmjs.org`）。如果你之前为了加速换过 cnpm / 淘宝镜像，会出现：

- `npm login` 报 `Public registration is not allowed`（cnpm 不允许从客户端注册 / 登录）
- `npm publish` 报 404（包不在镜像 registry 里）
- `npm whoami` 报 401（你登录的是镜像，不是官方）

**正确做法（推荐：scope 级别覆盖，不影响其他项目的镜像加速）：**

```bash
# 仅 @mdview scope 走官方
npm config set @mdview:registry https://registry.npmjs.org

# 验证
npm config get @mdview:registry
# → https://registry.npmjs.org
```

如果你不在乎全局镜像加速，也可以把全局 registry 直接切回官方：

```bash
npm config set registry https://registry.npmjs.org
```

#### 1.1 登录 + 处理 2FA

普通 `npm login` 会跳浏览器走 OAuth，登录成功后本地拿到 web token。但发布到带 `publishConfig.access=public` 的包时，npm 强制要求 2FA OTP，而 CI / 脚本场景没法交互输入 OTP。

**解决：用 Granular Access Token（粒度访问令牌）**

1. 浏览器打开 https://www.npmjs.com/settings/<你的用户名>/tokens
2. 选 **Granular Access Tokens** → **Generate New Token**
3. 关键勾选项：
   - Permissions：**Read and write**
   - Packages：选 `@mdview/*`（或 All packages，取决于你想要的范围）
   - **Bypass two-factor authentication when publishing**：✅ 勾上
   - 有效期：建议 90 天，到期再生成新的
4. 复制生成的 `npm_xxxxxxxx`，写入 `~/.npmrc`：

```ini
//registry.npmjs.org/:_authToken=npm_xxxxxxxx
@mdview:registry=https://registry.npmjs.org
```

5. 验证：

```bash
npm whoami --registry=https://registry.npmjs.org
# → 你的用户名
```

> ⚠️ 不要把 `_authToken` 提交到仓库。`~/.npmrc` 是机器级配置。

#### 1.2 包必须有 `publishConfig.access: public`

scoped 包默认是 private，发 public 包必须显式声明。所有 `@mdview/*` 都已经在 `package.json` 里加了：

```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

`pnpm release:check` 会自动校验这一项，缺失会报错。

#### 1.3 changeset 怎么用

```bash
# 创建一条 changeset：交互式选哪些包变了 + bump 类型 + 描述
pnpm changeset

# 把所有 changeset 合并成版本号 + CHANGELOG.md（删除已用的 changeset 文件）
pnpm changeset:version

# 实际发布到 npm（release:npm 内部会调）
pnpm changeset publish
```

`changeset publish` 会按依赖顺序逐个 publish，遇到 `workspace:*` 自动替换成实际版本号。

---

### 2. Cloudflare（mdview.sh + cdn.mdview.sh）

```bash
# 装 wrangler
pnpm add -wD wrangler

# 登录（浏览器 OAuth）
wrangler login

# 验证
wrangler whoami
```

**mdview.sh（Workers）**

域名 `mdview.sh` 已经购买并托管在 Cloudflare DNS。`apps/mdview-sh/wrangler.toml` 里配好了 routes：

```toml
routes = [
  { pattern = "mdview.sh", custom_domain = true },
  { pattern = "www.mdview.sh", custom_domain = true }
]
```

需要两个 KV namespace（短链 + 限流计数）：

```bash
cd apps/mdview-sh
wrangler kv namespace create SHORTLINKS
wrangler kv namespace create RATE_KV

# 把返回的 id 填回 apps/mdview-sh/wrangler.toml 对应 [[kv_namespaces]] 段的 id 字段
```

`pnpm release:check` 会自动校验 wrangler.toml 里没有遗留的 `REPLACE_WITH_REAL_*` 占位符。

**cdn.mdview.sh（Pages）**

不需要 R2（R2 要绑卡）。我们用 Cloudflare Pages：

1. Cloudflare 控制台 → Workers & Pages → Create → Pages → Connect to Git（或 Direct upload）
2. 项目名固定：`mdview-cdn`（`pnpm cdn:deploy` 写死了这个名字）
3. Custom domain：`cdn.mdview.sh`，DNS 自动配 CNAME

`scripts/build-cdn.js` 会生成：

- `cdn-dist/<version>/engine.iife.js`
- `cdn-dist/<version>/themes/*.css`
- `cdn-dist/manifest.json`（latest 指针）
- `cdn-dist/_headers`（CORS + 长缓存）

---

### 3. git

```bash
git remote -v
# 必须有 origin → git@github.com:kip2team/mdview.git

# changeset 会打 tag（每个被发布的包都有 @mdview/<name>@x.y.z）
# release:all 末尾会自动 push tags
```

---

## 日常发布流程

```bash
# 1. 在 main 分支
git checkout main && git pull

# 2. 写一条 changeset
pnpm changeset
#   ? Which packages would you like to include?
#     ✓ @mdview/core
#     ✓ @mdview/themes
#   ? Which packages should have a major bump?
#   ? Which packages should have a minor bump?
#   ? Which packages should have a patch bump?
#   ? Please enter a summary for this change:
#     fix: callout border color in dark theme

# 3. 把 changeset 转成实际的版本号 bump
pnpm changeset:version
# 这会改 packages/*/package.json 里的 version、生成 CHANGELOG.md、
# 删掉 .changeset 下用过的 md 文件

# 4. 看 diff、提交
git diff
git add -A && git commit -m "chore: release"

# 5. 一键发布
pnpm release:all
```

如果不想全发布，可以分别跑：

```bash
pnpm release:check       # 飞行检查（永远先跑）
pnpm release:web         # 只发 mdview.sh
pnpm release:cdn         # 只发 cdn.mdview.sh
pnpm release:npm         # 只发 npm 包
```

---

## 飞行检查（pre-flight）

`pnpm release:check` 会在 5 秒内检查：

- ✓ npm 登录在 registry.npmjs.org
- ✓ @mdview scope 走的是官方 registry
- ✓ ~/.npmrc 里有 granular token
- ✓ wrangler 已安装且已登录
- ✓ apps/mdview-sh/wrangler.toml 没有 `REPLACE_WITH_REAL_*` 占位符
- ✓ 当前在 main 分支
- ✓ 没有 uncommitted changes（warning）
- ✓ 8 个发布的包都有 `publishConfig.access: public`

任何 ✗ 都会打印精确的修复命令。

---

## 桌面端（Tauri）

```bash
# 一次性
rustup default stable
cargo install tauri-cli

# 本地构建（产物在 apps/desktop/src-tauri/target/release/bundle/）
pnpm desktop:build

# 产物示例：
#   macOS: mdview_0.0.1_aarch64.dmg / mdview_0.0.1_x64.dmg
#   Windows: mdview_0.0.1_x64-setup.exe
#   Linux: mdview_0.0.1_amd64.deb / .AppImage
```

发布到 GitHub Releases（用 GitHub Actions 自动跨平台构建更优，本地手工只能出当前平台产物）：

```bash
gh release create v0.0.1 \
  apps/desktop/src-tauri/target/release/bundle/dmg/*.dmg \
  --title "mdview 0.0.1" \
  --notes-from-tag
```

> macOS 公证（notarization）需要 Apple Developer 账号 + `xcrun notarytool` 配置。这一步等首次正式发布时再做。

---

## 浏览器扩展（待实现）

- Chrome Web Store：开发者注册费 $5，单次提交，审核 1-7 天
- Firefox Add-ons：免费，AMO 提交
- Edge Add-ons：免费

---

## VS Code 插件（待实现）

```bash
npm i -g @vscode/vsce
cd packages/vscode-mdview
vsce package    # 出 .vsix
vsce publish    # 需要先 vsce login <publisher>
```

---

## 故障排查

### `npm login` 报 "Public registration is not allowed"

你当前 registry 指向 cnpm/淘宝镜像。运行：

```bash
npm config get registry
# 如果不是 https://registry.npmjs.org/
npm config set @mdview:registry https://registry.npmjs.org
```

### `npm publish` 报 403 OTP required

你用的是普通 web token，没绕过 2FA。换成 Granular Access Token 并勾上 "Bypass 2FA"，写到 ~/.npmrc：

```ini
//registry.npmjs.org/:_authToken=npm_xxxxxxxx
```

### `npm publish` 报 404 Not Found

scope 没声明 access：检查 `package.json` 是否有

```json
"publishConfig": { "access": "public" }
```

### `npm profile get` 在 changeset publish 时报 403

granular token 范围不够（profile 是用户级、token 是 package 级）—— 这是 changeset 的兼容性问题，**不影响实际发布**，可以忽略。如果想消除：把 token 升级到 Classic Automation Token，但失去 "Bypass 2FA" 的便利。

### wrangler deploy 报 KV id 未配置

跑 `wrangler kv namespace create CACHE`，把返回的 id 填进 `apps/mdview-sh/wrangler.toml`。

### Cloudflare Pages 报 `_worker.js/` is not a valid asset path

`apps/mdview-sh/scripts/post-build.js` 会自动写 `dist/.assetsignore`。如果你手工跑了 build 但跳过了 post-build，重跑 `pnpm web:build`。

### isomorphic-dompurify 在 Workers 上 500

我们已经换成 sanitize-html（jsdom 跑不了 V8 isolates）。如果你看到这个错，是依赖装错了，重新 `pnpm install`。

### `gray-matter` is not defined / Buffer is not defined

我们已经把 gray-matter 换成 `packages/core/src/front-matter.ts` 的自定义 yaml 解析器。如果你看到这个错，是 dist 缓存旧了，跑 `pnpm clean && pnpm build`。

---

## Registry 逻辑深入（按用户要求重点解释）

npm 客户端有 **三个层级** 的 registry 配置，优先级从高到低：

1. **Scope-level**：`@mdview:registry=https://registry.npmjs.org` —— 仅对 `@mdview/*` 生效
2. **Project-level**：仓库根目录 `.npmrc`（我们没用，避免污染团队成员）
3. **User-level**：`~/.npmrc`（你的全局配置，比如换了淘宝镜像）
4. **Builtin default**：`https://registry.npmjs.org/`

`npm publish` 选择 registry 的逻辑：

```
if 包名以 @scope/ 开头 and 有 @scope:registry 配置:
    用 @scope:registry
elif 项目根有 .npmrc 配 registry:
    用项目级
elif ~/.npmrc 配 registry:
    用用户级
else:
    用默认 https://registry.npmjs.org
```

我们让 mdview **走 scope 覆盖**，因为：

- 用户可能仍想用淘宝镜像加速 `npm install`，全局换 registry 太粗暴
- scope 覆盖只对 `@mdview/*` 生效，不影响其他依赖
- changeset publish 一个个发包，每个都重新读配置，不会缓存出错

Granular Token 写在 `//registry.npmjs.org/:_authToken=` 这一行，是 **registry-scoped**：只对这个 registry 的请求带这个 token。所以即使你 `~/.npmrc` 里同时有别的 registry 的 token，发 mdview 时只会带 npmjs.org 的那个，不会泄露。

**为什么不写仓库级 `.npmrc`？**

如果把 token 写到仓库 `.npmrc` 然后被 commit 了，token 就泄露了。即使 gitignore 也容易出错。`~/.npmrc` 是机器级、用户级、永远不会被仓库带走。
