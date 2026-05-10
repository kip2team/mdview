# Launch Materials

发布日要用的素材集中在这里。

| 文件 | 用途 |
|---|---|
| [blog-post.md](./blog-post.md) | 博客主推文，可以放 mdview.sh / 个人博客 |
| [hn-post.md](./hn-post.md) | Hacker News 提交标题 + 第一条评论 |
| [twitter-thread.md](./twitter-thread.md) | X / Twitter 5 条推文串 |

## 发布日检查清单

按时间顺序：

### T-7 天

- [ ] 抢注 mdview.sh 域名（如还没）
- [ ] 占住 GitHub org `mdview-sh` 和 npm scope `@mdview`
- [ ] 部署 cdn.mdview.sh（engine + themes 静态资源）
- [ ] 部署 mdview.sh 主站到 Cloudflare Workers
- [ ] 桌面端首版 release：`pnpm desktop:build` → 上传到 GitHub Releases
- [ ] 浏览器扩展提交 Chrome Web Store 审核（4-7 天通过）
- [ ] VS Code 扩展提交 Marketplace 审核（1-3 天）

### T-1 天

- [ ] 写一条社交媒体预告（"shipping tomorrow…"）
- [ ] 准备 GIF：录制 demo.md 在桌面端 Read → Split → Source 切换
- [ ] 准备 hero screenshot：浅色主题下渲染好的 demo.md
- [ ] 在所有 launch material 里把 release tag、版本号、安装命令更新到最新

### T-0 day（推荐周二上午 ET）

- 09:00 ET 发布 [blog-post.md](./blog-post.md) 到 mdview.sh/blog（如有）
- 09:30 ET 发推 thread（[twitter-thread.md](./twitter-thread.md)）
- 10:00 ET 提交 HN（[hn-post.md](./hn-post.md)）
- 10:15 ET 在 HN 自己的帖子下发解释性评论
- 持续监控：流量峰值 / Cloudflare 错误率 / 评论区负面

### T+1 天

- [ ] 整理用户反馈到 GitHub issues
- [ ] 写一条"thanks + we're listening" 的回应推文
- [ ] 处理 critical bug（如有）— 走 hotfix 流程

## 已知风险

| 风险 | 缓解 |
|---|---|
| HN 流量打爆 mdview.sh | Cloudflare Workers 自动 scale，但 KV 写有限制；准备好 read-only 降级模式 |
| 用户找渠道不便 | 顶部 nav 全有：CLI / desktop / web / extension 安装入口齐全 |
| Demo .md 渲染失败被截图传播 | 发布前用 Playwright 在 Chrome / Safari / Firefox 各跑一次 demo.md，确保所有扩展正常 hydrate |
| 项目过早暴露 = 半成品口碑 | 路线图明确写"alpha"，期望管理 |
