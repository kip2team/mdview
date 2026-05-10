# mdview

Engine-first Markdown rendering / reading / sharing across desktop, web, plugins, CLI and MCP.

> mdview is a reader-first home for Markdown. Open a `.md` file, get a Medium-class reading experience. Share a `.md` URL, get a beautiful preview link. Same engine, every surface.

## Status

This repository is in **Phase 0 / 1**. The engine, themes, format, and CLI packages have a working skeleton; the desktop app scaffolding is in place and runs once Rust + Tauri CLI are installed locally.

See `docs/01-PRD-and-Plan.md` for the full plan.

## Repository layout

```
mdview/
├── docs/                      # Product & format documents
│   ├── 01-PRD-and-Plan.md     # Vision, architecture, roadmap, naming
│   ├── 02-Format-Spec.md      # .mdv.html spec, metadata schema
│   └── 03-Feature-Backlog.md  # Categorised feature backlog
├── packages/
│   ├── core/                  # @mdview/core — markdown → HTML engine
│   ├── themes/                # @mdview/themes — built-in themes
│   ├── format/                # @mdview/format — .mdv.html serializer
│   └── cli/                   # @mdview/cli — render / export / convert
├── apps/
│   └── desktop/               # Tauri 2 + Vite + React desktop reader
└── (future)
    ├── apps/mdview-sh/        # Astro web app at mdview.sh
    ├── packages/browser-ext/  # Chrome / Firefox extension
    ├── packages/vscode/       # VS Code extension
    └── packages/mcp/          # MCP server
```

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)
- For desktop development:
  - Rust ≥ 1.77 (`curl https://sh.rustup.rs -sSf | sh`)
  - Tauri 2 system requirements: https://tauri.app/start/prerequisites/

## Get started

Install dependencies:

```bash
pnpm install
```

Build all packages:

```bash
pnpm build
```

Run tests:

```bash
pnpm test
```

### Try the CLI

```bash
# Render a markdown file's body HTML to stdout
pnpm cli -- render path/to/foo.md

# Export to .mdv.html (Progressive form by default)
pnpm cli -- export path/to/foo.md --form progressive --theme medium

# Export all three forms at once
pnpm cli -- export path/to/foo.md --form all --theme github

# Convert between forms
pnpm cli -- convert foo.mdv.html --to standalone -o foo.standalone.mdv.html
```

### Run the desktop app

Once Rust + the Tauri CLI prerequisites are installed:

```bash
pnpm desktop:dev
# under the hood: pnpm --filter @mdview/desktop run tauri dev
```

The first run will fetch a lot of Rust crates and will take a while; subsequent runs are fast.

You can also run only the front-end (no Rust required) for UI iteration:

```bash
pnpm --filter @mdview/desktop run dev
# open http://localhost:1420
```

## Documentation

- [Product Plan](./docs/01-PRD-and-Plan.md)
- [.mdv.html Format Spec](./docs/02-Format-Spec.md)
- [Feature Backlog](./docs/03-Feature-Backlog.md)
- [Getting Started for Contributors](./docs/getting-started.md)

## License

[MIT](./LICENSE)
