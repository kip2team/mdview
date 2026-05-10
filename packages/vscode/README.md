# mdview · VS Code

VS Code 中 markdown 文件的更美渲染。复用 `@mdview/core` 引擎，与桌面端 / Web 端 / 浏览器扩展共用同一套主题与扩展。

## 命令

- `mdview: Open Preview`
- `mdview: Open Preview to the Side`

## 配置

```json
{
  "mdview.theme": "medium",
  "mdview.extensions": ["mdv:color", "mdv:callout", "mdv:math"]
}
```

## 本地开发

```bash
pnpm --filter mdview build
```

随后：

1. VS Code 打开 `packages/vscode/` 目录
2. F5 启动 Extension Host
3. 在 host 窗口里打开任意 `.md` 文件，运行 `mdview: Open Preview to the Side`
