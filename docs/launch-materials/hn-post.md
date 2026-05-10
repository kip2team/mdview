# Hacker News submission

## Title (60 char限制内的几个版本)

1. `Show HN: mdview – A reader-first home for Markdown` (49 chars)
2. `Show HN: A Markdown reader that works the same on every surface` (62 chars — 略长)
3. `Show HN: Mdview – beautiful Markdown rendering for desktop, web, IDE` (66 chars — 太长)

**推荐 #1**：短，能塞下"Show HN"前缀，"reader-first" 是钩子。

## URL

https://mdview.sh

## 第一条评论（OP 自己发，HN 习惯）

Hi HN — I'm the author. mdview started as frustration: I wanted something that does for **reading** Markdown what Markdown editors do for writing it.

Some specifics:

- **Engine-first architecture**. `@mdview/core` is ~30KB gzipped, pure TypeScript, zero runtime dependencies beyond markdown-it. Desktop (Tauri 2), Web (Astro on Cloudflare), browser extension (MV3), VS Code extension, CLI, and MCP server all import the same engine. New surface = thin shell.

- **The .mdv.html format**. Exports are HTML files where the body is still valid Markdown wrapped in `<script type="text/x-mdview">`. Browsers render them as full pages. Text editors edit them as Markdown. No "export-only" lock-in.

- **Metadata as stage direction**. YAML front matter doesn't just describe the document — it specifies how it should be rendered (theme, fonts, extensions, brand color). All viewers respect it. Means "send a .md file" actually transmits intended presentation.

- **Three view modes** on desktop: pure read (no chrome), split (CodeMirror editor + live preview, scroll-synced), and source-only. ⌘\\ cycles them.

The whole thing is MIT. AMA about the architecture — particularly the trade-offs of building a single engine across 6 deployment targets.

## 我个人作为 author 的备注

发帖时机：周二 / 周三 上午 8-10 ET 最佳。
头帖之后 30 分钟内自己回 1-2 条解释性评论，能显著提升排名。
不要回怼批评——HN 群体记仇。
如果触达 #1，准备好 Cloudflare Worker 容量被打爆——前期可以临时把 mdview.sh 移到 fly.io 或自己的 VPS 兜底。
