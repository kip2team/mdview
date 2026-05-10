# mdview Skills

为 Claude（与 Claude Agent SDK / Cowork / Claude Code）提供的能力包。每个目录是一个 Skill。

## 现有 skills

| 名称 | 用途 |
|---|---|
| [mdview-beautifier](./mdview-beautifier/SKILL.md) | 让 Claude 在产出 Markdown 时自动加 mdview 元数据 + 扩展，并能调用 mdview MCP 一键导出 .mdv.html |

## 安装到 Claude

把整个 `mdview-beautifier/` 目录放到 Claude 的 skills 位置（视客户端而定，常见位置：`~/.claude/skills/` 或项目内 `.claude/skills/`）。配合 `@mdview/mcp` 一起用效果最好。
