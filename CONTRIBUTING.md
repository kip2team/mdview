# Contributing to mdview

Thanks for considering a contribution! mdview is a single-author project at the moment, so the most useful contributions are: bug reports, themes, third-party extensions, and translations.

## Quick start

```bash
# Prerequisites: Node 20+, pnpm 9+, Rust (only if you touch the Tauri desktop)
git clone git@github.com:kip2team/mdview.git
cd mdview
pnpm install
pnpm -r run build
pnpm test
```

## Repo layout

```
packages/        # @mdview/* npm packages (engine, themes, format, cli, ...)
apps/            # Desktop (Tauri), Web (Astro)
docs/            # PRD, format spec, cookbook, roadmap, launch materials
.changeset/      # Pending releases
.github/         # CI, issue / PR templates
```

## Branching

- `main` — release-ready, protected
- Feature branches → PR → merge to `main`
- For npm-package changes, **add a changeset**:

  ```bash
  pnpm changeset
  ```

## What's a "good" contribution?

### High-value (we'll prioritize merging)

- **Bug reports with a reproducer** — a minimal `.md` file that triggers the bug, plus what you saw vs expected
- **New themes** in `packages/themes/src/themes/<id>/{theme.css, theme.json}` — single CSS file, follows the existing CSS-variable pattern
- **Third-party extensions** as standalone npm packages — see `docs/plugin-authoring.md`. We'll happily list them in the official extension index.
- **i18n** for desktop UI strings — `apps/desktop/src/i18n/` already has `en.json` + `zh-CN.json`, add a new locale by copying one and translating
- **Doc fixes / typos** — these go through review fast

### Medium-value

- New built-in extensions — please open an issue first to discuss scope
- Performance improvements with benchmarks (`pnpm --filter @mdview/core run bench`)
- A11y improvements (we welcome these — please describe what's broken and how the fix helps)

### Out of scope

Per the PRD (`docs/01-PRD-and-Plan.md`):

- Real-time multi-user collaboration (avoid HackMD / Notion overlap)
- Knowledge management features (avoid Obsidian / Notion overlap)
- Self-hosted media library / image hosting (use external services)

If your idea is in this list and you're sure it should be in mdview — open a discussion first.

## Style

- TypeScript strict, ESLint + prettier configured
- Test coverage expected for new core features (`pnpm --filter @mdview/core test`)
- Front matter / metadata changes need a corresponding update to `docs/02-Format-Spec.md`
- Public API changes need a changeset and a `docs/01-PRD-and-Plan.md` decision log entry

## Code of conduct

Be kind. See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## License

MIT. By contributing, you agree your contributions are licensed under MIT.

## Thanks

Most useful one-line contribution: **try mdview, find a bug, file an issue with a reproducer**. That moves the project forward more than anything else.
