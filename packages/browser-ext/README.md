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

## Firefox

manifest 已加 `browser_specific_settings.gecko`，content / popup 代码用了 `browser ?? chrome` 兜底，理论支持 Firefox 115+（MV3）。但因 Firefox 对 `host_permissions` 与 `content_scripts` 的处理略有差异，**首次安装需手动到 about:addons 给 mdview 授予对应主机的权限**。

## 已知限制（MVP）

- 主题切换通过 popup 选，但当前 popup CSS 不会下发到正在打开的 tab；切换后下次访问生效
- 暂未做 ESM module worker（Firefox 对 import.meta 处理与 Chrome 略有差异）
