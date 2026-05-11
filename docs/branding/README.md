# mdview · Branding assets

最小可用品牌素材（占位）。正式发布前应替换为设计师产出的完整套件。

| 文件            | 用途                                               |
| --------------- | -------------------------------------------------- |
| `logo.svg`      | 主 logo（256×256，含背景）。用作应用图标、社交头像 |
| `logo-mark.svg` | 透明 logo（仅符号），用作 favicon / inline 装饰    |

## 应用图标生成

桌面端 Tauri 需要 `.png / .ico / .icns` 多尺寸。可以用 Tauri 自带工具：

```bash
pnpm --filter @mdview/desktop run tauri icon docs/branding/logo.svg
# 自动生成所有尺寸到 apps/desktop/src-tauri/icons/
```

浏览器扩展也需要 `icon-16.png / icon-48.png / icon-128.png` 三个尺寸，可以用任何位图工具从 logo.svg 导出。
