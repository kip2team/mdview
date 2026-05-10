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

## 部署到 cdn.mdview.sh

详见 `docs/host-actions.md` 中关于 CDN 部署的章节（待添加）。
