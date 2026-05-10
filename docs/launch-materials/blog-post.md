---
mdview: 1
title: "Introducing mdview: Markdown, beautifully rendered everywhere"
description: A reader-first home for Markdown — desktop, web, browser extensions, IDE plugins, CLI, and MCP — all from one engine.
theme: medium
font: charter
fontSize: 19px
maxWidth: 720px
toc: true
readingTime: true
---

# Introducing mdview

I built a Markdown reader. Here's why, and what makes it different.

## The problem

Markdown is the universal text format. Every developer writes it. Every doc site uses it. But when it comes to **reading** Markdown, the experience splits into two camps:

- **Editors** (Typora, Obsidian) treat Markdown as something you write. Great for authoring, but heavyweight when you just want to read a `.md` file someone sent you.
- **Source views** (VS Code, GitHub raw) treat Markdown as plain text. Functional, but ugly.

There's a third category that barely exists: tools designed for **reading** Markdown — beautifully, frictionlessly, on every surface where Markdown shows up.

## What mdview does

Open any `.md` file. See it rendered like Medium. Pick a theme. Done.

```
$ mdview README.md         # CLI
```

Or double-click in Finder. Or paste a URL into mdview.sh. Or install the browser extension to take over GitHub raw pages. Or use the VS Code extension. Or hand a `.mdv.html` file to a non-technical friend who just opens it in their browser.

**One Markdown file, every surface, identical look.**

## Three things that make it different

### 1. Engine-first

Everything is built on `@mdview/core`, a pure-TypeScript Markdown engine. Desktop, web, browser ext, VS Code, CLI, MCP — all six surfaces import the same engine. Themes work identically across all of them. Extensions register once, render everywhere.

This is the difference between "Markdown reader" and "Markdown reading platform."

### 2. Metadata as stage direction

YAML front matter in mdview isn't just attributes — it's the author's voice for how the document should *look*:

```yaml
---
title: My article
theme: medium
font: charter
toc: true
extensions: [mdv:callout, mdv:math]
brand:
  primary: '#0969da'
---
```

Hand this `.md` to anyone, on any surface, and they see your intended presentation. No "open in Typora to view properly" disclaimers.

### 3. The .mdv.html format

When you export from mdview, you get an HTML file. But unlike most exports, the body is still **valid Markdown**:

```html
<script type="text/x-mdview" id="mdview-source">
# My document

This is the original markdown.
</script>
```

The browser shows it as a beautifully rendered page. A text editor shows you the original Markdown source. Want to change a paragraph? Edit it. Refresh the browser. Done.

This is HTML you can edit like a `.md` file. There's nothing else like it.

## Try it

```bash
npm create mdview-doc my-article
cd my-article
npm install
npm run preview
```

Or visit [mdview.sh](https://mdview.sh) and paste a Markdown URL.

## What's next

mdview hits its first usable release today. The roadmap is on [GitHub](https://github.com/mdview-sh/mdview/blob/main/ROADMAP.md). Big upcoming items: theme marketplace, AI-powered reading enhancements, JetBrains plugin.

If "a beautiful place to read Markdown" sounds useful to you, install the desktop app or visit mdview.sh. If you want to contribute, the codebase is MIT and the engine is small enough to read in an afternoon.

Markdown deserves a reader. mdview is that reader.

---

*[GitHub](https://github.com/mdview-sh/mdview) · [Docs](https://mdview.sh/docs) · [.mdv.html spec](https://mdview.sh/docs/02-Format-Spec)*
