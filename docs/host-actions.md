# Host Actions

需要 King 在本机执行的事项汇总。沙盒里做不了或验证不了的全列在这里。

> 状态：**alpha 开发完成**。下面是发布前还要做的本机操作。

> **📖 一键发布 / npm registry 逻辑 / 故障排查 → 看 [release.md](./release.md)。**
> 这份文档是高层次 checklist，发布动作的细节、命令、坑都在 release.md 里写完了。

## 0. 工程基础（一次性，已完成）

- [x] 清理沙盒残留 `.git`，重新 init
- [x] 注册 GitHub remote `git@github.com-my:kip2team/mdview.git`
- [x] 把 commit author 全部改为 `king@kip2.com`
- [x] 装系统依赖（Node 20+、pnpm 9+、Rust toolchain、Xcode CLT）

## 1. 日常开发流程

```bash
cd /Users/king/work/workspace-kip2/mdview

# 装依赖
pnpm install

# 跑测试
pnpm -r run test

# 跑 benchmark
pnpm --filter @mdview/core run bench

# 跑桌面端（前端调试，不需要 Rust）
pnpm desktop:web

# 跑桌面端（完整 Tauri，需要 Rust）
pnpm desktop:dev

# 跑 Web 端（mdview.sh）
pnpm --filter @mdview/mdview-sh run dev

# 全包构建
pnpm build

# 跑 e2e
pnpm --filter @mdview/desktop run test:e2e
```

## 2. Push 流程

我（沙箱）能 commit，但 push 需要本机：

```bash
git push origin main
```

如果想让我直连 push，配 PAT：

```bash
# 生成 fine-grained PAT，只勾 kip2team/mdview repo, Contents: read+write
# 存到 ~/.git-credentials
echo "https://kip2team:<PAT>@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials
git config --global credential.helper store
# 把 mdview 的 remote 从 SSH 改为 HTTPS
git -C /Users/king/work/workspace-kip2/mdview remote set-url origin https://github.com/kip2team/mdview.git
```

## 3. 占名 / 注册（发布前必须）

- [ ] 注册域名 `mdview.sh`（Porkbun / Namecheap）
- [ ] （建议）注册 `mdview.md` 防御
- [ ] 注册 GitHub org（已用 `kip2team`）/ npm scope `@mdview`：
  ```bash
  npm org create mdview
  ```
- [ ] 占住 npm 包名：先 `npm view @mdview/core` 看是否被占；目前应可用
- [ ] 社交账号：Twitter / X `@mdview_sh`、ProductHunt 账号
- [ ] Chrome Web Store / VS Code Marketplace publisher 账号

## 4. CDN 部署（cdn.mdview.sh，走 Cloudflare Pages）

选 Pages 而非 R2 —— 原因：免费、不需要绑卡，对静态资源完全够用。

```bash
# 一次性：创建 Pages 项目
wrangler pages project create mdview-cdn --production-branch main

# 一键 build + deploy
pnpm cdn:deploy
# 等价于：pnpm cdn:build + wrangler pages deploy cdn-dist --project-name mdview-cdn --branch main

# 首次部署后在 Cloudflare dashboard 绑域名：
#   Pages → mdview-cdn → Custom Domains → Add → cdn.mdview.sh
```

`scripts/build-cdn.js` 会同时生成 `cdn-dist/_headers`，里面定义了：

- `/r/v1.<hash>.js` 永久缓存
- `/r/v1.js` 1 小时缓存（滚动版本）
- `/themes/*` `/ext/*` 1 天缓存
- `/manifest.json` 5 分钟缓存
- `/*` `Access-Control-Allow-Origin: *`（CORS 全开，允许任何站点引用 CDN 资源）

## 5. mdview.sh Web 端部署

```bash
cd apps/mdview-sh

# 创建 KV namespace
wrangler kv namespace create SHORTLINKS
wrangler kv namespace create RATE_KV
# 把返回的 id 写到 wrangler.toml 替换 REPLACE_WITH_REAL_*

# 部署
pnpm build
wrangler deploy
```

## 6. 桌面端发布

```bash
pnpm --filter @mdview/desktop exec tauri icon docs/branding/logo.svg
pnpm --filter @mdview/desktop run tauri:build
# 产物：apps/desktop/src-tauri/target/release/bundle/

# macOS notarization（需 Apple Developer ID）
# 详见 https://tauri.app/v2/distribute/macos/

# 发布到 GitHub Releases
gh release create v0.1.0 \
  apps/desktop/src-tauri/target/release/bundle/dmg/*.dmg \
  apps/desktop/src-tauri/target/release/bundle/macos/*.app.tar.gz \
  --title "mdview 0.1.0 alpha" \
  --notes-file ROADMAP.md
```

## 7. 浏览器扩展上架

```bash
pnpm --filter @mdview/browser-ext build
# 打包 zip（Chrome / Firefox 两个 store 都要）
cd packages/browser-ext
zip -r ../../mdview-ext-chrome.zip dist
```

提交时素材直接复制 `packages/browser-ext/store-listing.md`。

## 8. VS Code 扩展上架

```bash
pnpm --filter mdview build
cd packages/vscode
pnpm package          # 生成 mdview-0.0.1.vsix
vsce publish          # 需 publisher 已配置
```

## 9. npm 包发布

```bash
# 发布前确认所有 changeset 已就位
pnpm changeset version  # 应用 changeset → 生成新版本号 + CHANGELOG
pnpm install            # 更新 lockfile
git add -A
git commit -m "chore: release packages"
git push

# CI 上的 release workflow 应自动跑
# 或手动：
pnpm changeset publish
```

需要 `NPM_TOKEN` secret 已经在 GitHub repo 配好。

## 10. MCP server 接入 Claude Desktop

```bash
pnpm --filter @mdview/mcp build
```

`~/Library/Application Support/Claude/claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "mdview": {
      "command": "node",
      "args": ["/Users/king/work/workspace-kip2/mdview/packages/mcp/dist/server.js"]
    }
  }
}
```

重启 Claude Desktop 后就能用 render / export_mdv_html / convert_form / list_themes / extract_text。

## 11. 发布日 checklist

按时间顺序：

### T-7 天

- [ ] 抢注 mdview.sh 域名
- [ ] 占 GitHub / npm / 社交账号
- [ ] 部署 cdn.mdview.sh
- [ ] 部署 mdview.sh
- [ ] 发布桌面端首版到 GitHub Releases
- [ ] 浏览器扩展提交 Chrome Web Store 审核（4-7 天）
- [ ] VS Code 扩展提交 Marketplace（1-3 天）

### T-1 天

- [ ] 录 demo GIF / 截图
- [ ] 把 release tag、版本号、安装命令更新到所有 launch material
- [ ] 给 mdview.sh 跑一次 demo.md 全特性烟雾测试

### T-0 day（推荐周二上午 ET）

- 09:00 ET 发布 [blog post](./launch-materials/blog-post.md) 到 mdview.sh/blog
- 09:30 ET 发推 thread（[twitter-thread.md](./launch-materials/twitter-thread.md)）
- 10:00 ET 提交 HN（[hn-post.md](./launch-materials/hn-post.md)）
- 10:15 ET 在 HN 帖子下发解释性评论
- 持续监控：流量峰值 / Cloudflare 错误率 / 评论区负面

### T+1 天

- [ ] 整理用户反馈到 GitHub issues
- [ ] 写一条"thanks + we're listening" 推文
- [ ] 处理 critical bug（如有）— 走 hotfix 流程

## 12. 已知遗留 / 后续

| 项 | 状态 | 优先级 |
|---|---|---|
| 桌面端 Tauri 应用图标（占位 SVG → PNG） | 未做 | 发布前 |
| Cloudflare KV 实际创建 + binding | 未做 | 发布前 |
| 真实 SRI hash 替换 placeholder | 未做 | CDN 上线后 |
| Firefox Add-ons 审核 | 未做 | T+0 |
| docs.mdview.sh 子域绑定 | 未做 | T+1 周内 |
