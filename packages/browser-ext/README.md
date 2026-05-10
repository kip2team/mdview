# @mdview/browser-ext

mdview 浏览器扩展（Chrome / Edge / Firefox MV3）。在 `raw.githubusercontent.com` / `gist.githubusercontent.com` / 任意 `*.md` URL 上自动接管渲染。

## 构建

```bash
pnpm --filter @mdview/browser-ext build
# 输出：packages/browser-ext/dist/
```

## 本地试用

1. 打开 `chrome://extensions`
2. 打开"开发者模式"
3. "加载已解压的扩展程序" → 选 `packages/browser-ext/dist`
4. 访问任意 raw `.md` 链接（例如 https://raw.githubusercontent.com/microsoft/vscode/main/README.md）

## 已知限制（MVP）

- 主题切换通过 popup 选，但当前 popup CSS 不会下发到内容脚本（只在切换后下次访问生效）
- 暂未支持 Firefox（manifest v3 浏览器对 host_permissions 有差异）
