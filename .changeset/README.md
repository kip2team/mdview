# Changesets

`@changesets/cli` 管理 npm 包版本和 CHANGELOG。

## 工作流

1. 改完代码，跑：

   ```bash
   pnpm changeset
   ```

   选择哪些包受影响、bump 类型（patch / minor / major），写一行变更说明。

2. 提交生成的 `.changeset/*.md` 文件，连同业务代码一起进 PR。

3. PR 合并到 `main` 后，CI 会自动开 / 更新一个 "Version Packages" PR，把所有 changeset 合并成版本号 bump + CHANGELOG。Maintainer 合并后即发布。

## 为什么有些包被 ignore

`apps/desktop`、`apps/mdview-sh`、`packages/browser-ext`、`packages/cli` 这些是「应用层」，不发到 npm，所以 ignore。它们的发布走另外的渠道（GitHub Release / Cloudflare Pages / Chrome Web Store / npm cli 单独发）。

修这些包不需要 changeset；只有改 `@mdview/core` / `@mdview/themes` / `@mdview/format` / `@mdview/importer` / `@mdview/mcp` / `@mdview/engine-browser` 时才需要。
