---
mdview: 1
title: mdview
description: A reader-first home for Markdown. One engine, every surface.
theme: medium
font: charter
fontSize: 18px
maxWidth: 720px
toc: true
toc.position: right
readingTime: true
extensions:
  - mdv:callout
  - mdv:color
  - mdv:kbd
  - mdv:badge
brand:
  primary: '#0969da'
  accent: '#ff6b35'
---

# mdview

> ![[badge:status:alpha|orange]] ![[badge:license:MIT|green]] ![[badge:engine:30KB|blue]]
>
> Engine-first Markdown rendering / reading / sharing across desktop, web, plugins, CLI and MCP.

## What

mdview is a reader-first home for Markdown. Same engine on every surface, identical look:

- **Desktop** (Tauri 2 + Vite + React) — three view modes, theme switching, ⌘K command palette, export `.mdv.html`
- **Web** ([mdview.sh](https://mdview.sh)) — paste any `.md` URL, get a beautiful preview, generate short links
- **Browser extension** — auto-render raw GitHub / gist `.md` pages
- **VS Code extension** — replace default Markdown preview
- **CLI** — `mdview render` / `export` / `convert` / `serve --watch`
- **MCP server** — let Claude render and export Markdown beautifully

> [!tip] One Markdown, every surface
> Write Markdown once. mdview makes it look beautiful everywhere it shows up.

## Differentiators

> [!info] Engine-first
> All surfaces consume `@mdview/core` (~30KB gzipped, pure TypeScript). New surface = thin shell. Themes / extensions register once, work everywhere.

> [!info] Self-rendering HTML — `.mdv.html`
> Exports look like normal HTML in browsers but the body is still Markdown wrapped in `<script type="text/x-mdview">`. Open in a text editor — it's still `.md`. Hand to a non-technical friend — they just open in a browser.

> [!info] Metadata as stage direction
> YAML front matter doesn't just carry attributes — it specifies how the document should look (theme, fonts, toc, extensions, brand colors). Hand a `.md` to anyone, they see your intended presentation.

## Try it in 30 seconds

```bash
# Web — paste any markdown URL
open https://mdview.sh

# Desktop — download a pre-built dmg from
#   https://github.com/kip2team/mdview/releases/latest
# First launch (mdview is not yet Apple-notarized):
#   xattr -dr com.apple.quarantine /Applications/mdview.app
# (or build from source: pnpm install && pnpm desktop:dev — needs Rust + Tauri prereqs)

# CLI
npm install -g @mdview/cli
mdview render README.md > readme.html
mdview serve README.md --theme medium

# Scaffold a doc project
npm create mdview-doc my-article
```

## Documentation

| Doc | Use |
| --- | --- |
| [PRD & Plan](./docs/01-PRD-and-Plan.md) | Vision, architecture, decisions |
| [`.mdv.html` Format Spec](./docs/02-Format-Spec.md) | The self-rendering HTML protocol |
| [Feature Backlog](./docs/03-Feature-Backlog.md) | Full feature catalog with priorities |
| [Plugin authoring](./docs/plugin-authoring.md) | Write your own `mdv:*` extensions |
| [Cookbook](./docs/cookbook/README.md) | Real-world templates |
| [Roadmap](./ROADMAP.md) | Public roadmap |

## Repository

```
packages/
  core/                 # @mdview/core — engine
  themes/               # @mdview/themes — built-in themes
  format/               # @mdview/format — .mdv.html serializer
  cli/                  # @mdview/cli — command line
  engine-browser/       # @mdview/engine-browser — CDN bootstrap
  importer/             # @mdview/importer — Typora / Obsidian
  mcp/                  # @mdview/mcp — Claude / AI integration
  browser-ext/          # @mdview/browser-ext — Chrome / Firefox MV3
  vscode/               # mdview — VS Code extension
  create-mdview-doc/    # npm create mdview-doc

apps/
  desktop/              # Tauri 2 desktop reader
  mdview-sh/            # mdview.sh — Astro on Cloudflare Workers
```

## Status

> [!warning] Alpha
> mdview is pre-1.0 and APIs may shift. Most surfaces work end-to-end; rough edges remain. See [ROADMAP.md](./ROADMAP.md).

## Contributing

PRs welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md). Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). Security: [SECURITY.md](./SECURITY.md).

Most useful contribution at this stage: **try mdview, find a bug, file an issue with a reproducer.**

## License

[MIT](./LICENSE) — built by people who think Markdown deserves a reader.

> Press [[⌘K]] in the desktop app for everything.
