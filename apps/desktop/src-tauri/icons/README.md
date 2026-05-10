# 图标占位

Tauri 在 `bundle.icon` 配置里要求至少一组图标文件。MVP 阶段未上正式 logo，先用 `pnpm tauri icon path/to/512.png` 自动生成完整套件即可。

需要的文件：

- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns`（macOS）
- `icon.ico`（Windows）

设计规范见 https://tauri.app/v2/concept/icons
