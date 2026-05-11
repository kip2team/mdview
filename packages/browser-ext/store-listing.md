# Store listing — Chrome Web Store / Firefox Add-ons

提交扩展时直接复制这里的字段。

## Name

mdview - Beautiful Markdown

## Short description (132 char Chrome / 132 Firefox)

Render raw Markdown URLs (GitHub raw, gist, any .md) as a beautiful, theme-able document. No setup, no editor, just read.

## Full description

Stop reading raw Markdown. mdview takes over `.md` URLs in your browser and renders them like a polished document — Medium-style typography, proper code highlighting, callouts, and dark-mode support out of the box.

What it does:

• Auto-renders any `.md` page (raw.githubusercontent.com, gist, \*.md URLs)
• 6 built-in themes — Default, GitHub, Medium, Dark, Solarized, Sepia
• Syntax-highlighted code blocks (shiki)
• Live KaTeX math + Mermaid diagrams
• Callouts, color swatches, kbd shortcuts, badges, sub/superscript
• Toggle source / rendered view from the toolbar
• Theme persists across pages and devices (storage.sync)

What it does NOT do:

• Track you. No analytics, no third-party requests outside of fetching the markdown URL itself.
• Modify content. mdview only re-renders what's already in the page.
• Require a server / account. Everything happens locally in your browser.

mdview is open source (MIT) and part of a wider ecosystem — desktop app, web preview at mdview.sh, VS Code extension, CLI, MCP server. Same engine on every surface.

## Categories

- Primary: Productivity
- Secondary: Developer tools

## Permissions justification

- **storage** — to persist your theme choice across devices via storage.sync
- **host_permissions** for `raw.githubusercontent.com / gist.githubusercontent.com / *.md / *.markdown` — required to inject the rendering script into raw Markdown pages on those domains. mdview does not access any other domain.

## Privacy policy

> mdview does not collect, store, transmit, or share any personal data.
>
> The extension reads the textual content of pages it renders (raw Markdown URLs). All rendering is performed locally inside your browser. No data leaves your device.
>
> Theme preferences are stored via Chrome's built-in `storage.sync`, which syncs between your devices using your Google account — not via any mdview server.
>
> Source code: https://github.com/kip2team/mdview

Public privacy policy URL (for store listing): https://mdview.sh/privacy

## Screenshots needed (1280x800 each, 5 total)

1. Hero — a complex `.md` rendered in the Medium theme with mermaid + math
2. Theme switcher dropdown showing all 6 themes
3. Same page in Dark theme (system dark mode)
4. Source toggle showing the original markdown
5. Demo of Solarized + callout blocks

## Promo tile (440x280, optional)

mdview wordmark + "Beautiful Markdown anywhere" tagline.

## Single purpose

> mdview's single purpose is to enhance the reading experience of Markdown pages by rendering them with consistent typography and themes.

## Notes for Firefox Add-ons reviewers

- manifest_version: 3
- browser_specific_settings.gecko set with id `mdview@kip2.com`, strict_min_version 115.0
- The content script does not eval / make remote calls beyond reading `pre.textContent` of the same page
- DOMPurify is bundled inline (no external script load)

## Notes for Chrome Web Store reviewers

- The extension is fully self-contained (no remote script loading) per Manifest V3 requirements
- `host_permissions` are scoped to raw markdown URLs only (not all sites)
