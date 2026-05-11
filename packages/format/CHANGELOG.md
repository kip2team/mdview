# @mdview/format

## 0.1.0

### Minor Changes

- d48d07d: Initial public release of the mdview engine and surrounding packages.

  **`@mdview/core`** — Markdown rendering engine
  - markdown-it based parser with browser-friendly YAML front matter (no Buffer dependency)
  - Heading-tree extraction with stable slug ids (Unicode-aware)
  - Metadata schema v0.1: theme / font / toc / extensions / brand / colorScheme / og fields
  - Plugin SDK: `registerExtension(id, factory)` for third-party extensions
  - 8 built-in extensions: `mdv:color`, `mdv:callout`, `mdv:math`, `mdv:mermaid`, `mdv:kbd`, `mdv:details`, `mdv:sub-sup`, `mdv:badge`
  - Metadata merging: URL params > front matter > theme defaults > engine defaults

  **`@mdview/themes`** — Built-in themes
  - `default` / `github` / `medium` themes, all CSS-variable driven
  - Light + dark via `prefers-color-scheme` AND `[data-color-scheme]` override (author force light/dark)
  - `extensions.css` shared styling for color / callout / math / mermaid / kbd / details / badge
  - `print.css` for clean PDF / print output

  **`@mdview/format`** — `.mdv.html` self-rendering format
  - Three forms: `minimal` (CDN-only) / `progressive` (prerendered + CDN engine) / `standalone` (offline, inlined CSS)
  - `toMdvHtml(markdown, options)` and `fromMdvHtml(html)` round-trippable
  - `convertForm(html, to)` switches forms while preserving the embedded markdown source
  - SRI integrity hashes supported on pinned engine versions

  **`@mdview/cli`** — Command-line tool
  - `mdview render <file>` — markdown → HTML body
  - `mdview export <file> --form <form>` — markdown → .mdv.html
  - `mdview convert <file> --to <form>` — convert between .mdv.html forms
  - Both `mdview` and `mdv` short alias bin entries

  **`@mdview/engine-browser`** — Browser bootstrap engine
  - Self-bootstrapping IIFE for `https://cdn.mdview.sh/r/v1.js`
  - Finds `#mdview-source`, renders, sanitizes (DOMPurify), injects into `#mdview-output`
  - Single file output via esbuild

  **`@mdview/importer`** — Theme importers
  - `importTyporaTheme(css, opts)` — Typora `.css` themes → mdview themes
  - `importObsidianTheme(css, opts)` — Obsidian themes → mdview themes
  - `mdview-import` CLI bin
  - Selector remapping (e.g. `#write` → `#mdview-output`) plus drop-rules for editor-only selectors

  **`@mdview/mcp`** — Model Context Protocol server
  - stdio transport
  - Tools: `render`, `export_mdv_html`, `convert_form`, `list_themes`
  - Drop-in for Claude Desktop's `mcpServers` config

  See [ROADMAP.md](https://github.com/kip2team/mdview/blob/main/ROADMAP.md) for what's next.

### Patch Changes

- Updated dependencies [d48d07d]
  - @mdview/core@0.1.0
