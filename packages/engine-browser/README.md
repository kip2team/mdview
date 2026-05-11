# @mdview/engine-browser

部署到 `cdn.mdview.sh/r/v1.js` 的浏览器端自启动引擎。

任意 `.mdv.html`（minimal / progressive 形态）只要 `<script src="https://cdn.mdview.sh/r/v1.js">`，加载后就会自动：

1. 找到 `#mdview-source`，读取里面的 markdown
2. 调用 `@mdview/core.render` 渲染
3. DOMPurify 清洗后写入 `#mdview-output`

## 构建

```bash
pnpm --filter @mdview/engine-browser build
# 输出：packages/engine-browser/dist/v1.js
```

打出来的是单文件 IIFE，可以直接上传到任意静态资源服务（CDN、R2、S3）。

## 部署

打出来的 `dist/v1.js` 是单文件 IIFE,直接上传到任意 CDN / 静态资源服务即可。
官方公开镜像位于 `https://cdn.mdview.sh/r/v1.js`,由本仓库根目录的脚本部署到 Cloudflare Pages:

```bash
# 从仓库根目录
pnpm cdn:build       # 同时打包 v1.js / themes / extensions, 输出到 cdn-dist/
pnpm cdn:deploy      # build + wrangler pages deploy cdn-dist
```
