# @mdview/mcp

MCP（Model Context Protocol）server，把 mdview 的渲染能力暴露给 Claude Desktop / 其他 MCP 客户端。

## 工具

| Tool | 用途 |
|---|---|
| `render` | markdown → html + meta + headings |
| `export_mdv_html` | 生成 .mdv.html 单文件（minimal / progressive / standalone） |
| `convert_form` | 在三种 .mdv.html 形态间互转 |
| `list_themes` | 列出内置主题 |

## 安装与连接 Claude Desktop

```bash
pnpm --filter @mdview/mcp build
```

在 Claude Desktop 配置（macOS：`~/Library/Application Support/Claude/claude_desktop_config.json`）：

```json
{
  "mcpServers": {
    "mdview": {
      "command": "node",
      "args": ["/absolute/path/to/mdview/packages/mcp/dist/server.js"]
    }
  }
}
```

重启 Claude Desktop 后，就能让 Claude 直接调用 mdview 渲染。

## 例子

让 Claude 写一份带 mdview 元数据的报告，然后导出成 progressive 形态：

> "Generate a Markdown report on quarterly sales with `theme: medium`, then export it as a `.mdv.html` Progressive file I can share."

Claude 会先调用 `render` 生成内容预览，再调用 `export_mdv_html` 拿到最终文件。
