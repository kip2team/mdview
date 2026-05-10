#!/usr/bin/env node
// mdview CLI 入口
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, basename, extname } from 'node:path';
import { cac } from 'cac';
import { render } from '@mdview/core';
import { themeDefaults } from '@mdview/themes';
import { toMdvHtml, convertForm, type MdvForm } from '@mdview/format';

const cli = cac('mdview');

// ── render: md → html 片段（不含外壳） ────────────────────────────
cli
  .command('render <file>', '把一个 markdown 渲染为 HTML 片段，输出到 stdout 或文件')
  .option('-o, --out <path>', '输出文件路径（默认 stdout）')
  .option('--theme <id>', '主题 ID（影响 themeDefaults，不影响 HTML 片段本身）', {
    default: 'default',
  })
  .action(async (file: string, options: { out?: string; theme: string }) => {
    const md = await readFile(resolve(file), 'utf8');
    const { html } = render(md, { themeDefaults: themeDefaults(options.theme) });
    if (options.out) {
      await writeFile(resolve(options.out), html, 'utf8');
      console.log(`✓ wrote ${options.out}`);
    } else {
      process.stdout.write(html);
    }
  });

// ── export: md → .mdv.html ─────────────────────────────────────────
cli
  .command('export <file>', '把 markdown 导出为 .mdv.html')
  .option('--form <form>', 'minimal | progressive | standalone | all（默认 progressive）', {
    default: 'progressive',
  })
  .option('--theme <id>', '主题 ID', { default: 'default' })
  .option('--engine <url>', '引擎 URL（CDN）', {
    default: 'https://cdn.mdview.sh/r/v1.js',
  })
  .option('--theme-url <url>', '主题 URL（CDN）')
  .option('-o, --out <path>', '输出路径（默认放在源文件同目录，并自动追加 .mdv.html）')
  .action(
    async (
      file: string,
      options: {
        form: string;
        theme: string;
        engine: string;
        themeUrl?: string;
        out?: string;
      },
    ) => {
      const md = await readFile(resolve(file), 'utf8');
      const themeUrl =
        options.themeUrl ?? `https://cdn.mdview.sh/themes/${options.theme}.css`;

      const forms: MdvForm[] =
        options.form === 'all'
          ? ['minimal', 'progressive', 'standalone']
          : [options.form as MdvForm];

      for (const f of forms) {
        // 仅 progressive 形态需要 prerendered
        const prerendered =
          f === 'progressive'
            ? render(md, { themeDefaults: themeDefaults(options.theme) }).html
            : undefined;

        const html = toMdvHtml(md, {
          form: f,
          engine: { url: options.engine },
          theme: { id: options.theme, url: themeUrl },
          prerenderedHtml: prerendered,
        });

        const outPath =
          options.out && forms.length === 1
            ? resolve(options.out)
            : suggestOutPath(file, f, forms.length > 1);
        await writeFile(outPath, html, 'utf8');
        console.log(`✓ ${f.padEnd(11)} → ${outPath}`);
      }
    },
  );

// ── convert: 形态间互转 ────────────────────────────────────────────
cli
  .command('convert <file>', '把现有的 .mdv.html 转为另一形态')
  .option('--to <form>', 'minimal | progressive | standalone（必填）')
  .option('-o, --out <path>', '输出路径（默认覆盖原文件）')
  .action(async (file: string, options: { to?: string; out?: string }) => {
    if (!options.to) {
      console.error('error: --to is required');
      process.exit(1);
    }
    const html = await readFile(resolve(file), 'utf8');
    const out = convertForm(html, options.to as MdvForm);
    const outPath = resolve(options.out ?? file);
    await writeFile(outPath, out, 'utf8');
    console.log(`✓ converted to ${options.to} → ${outPath}`);
  });

// ── serve: 本地浏览器预览 + watch ──────────────────────────────
cli
  .command('serve <file>', '起一个本地服务渲染 markdown，文件改动自动刷新')
  .option('--port <port>', '端口', { default: 3030 })
  .option('--theme <id>', '主题 ID', { default: 'default' })
  .option('--no-watch', '不启用文件监听')
  .action(async (file: string, options: { port: number; theme: string; watch: boolean }) => {
    const { startServer } = await import('./serve.js');
    await startServer({
      file: resolve(file),
      port: Number(options.port),
      theme: options.theme,
      watch: options.watch !== false,
    });
  });

cli.help();
cli.version('0.0.1');
cli.parse();

// ── 工具函数 ────────────────────────────────────────────────────────

/**
 * 推荐输出路径：
 *   foo.md  --form progressive (单形态) → foo.mdv.html
 *   foo.md  --form all                  → foo.minimal.mdv.html / foo.progressive.mdv.html / foo.standalone.mdv.html
 */
function suggestOutPath(input: string, form: MdvForm, multi: boolean): string {
  const dir = resolve(input, '..');
  const base = basename(input, extname(input));
  const suffix = multi ? `.${form}.mdv.html` : '.mdv.html';
  return resolve(dir, base + suffix);
}
