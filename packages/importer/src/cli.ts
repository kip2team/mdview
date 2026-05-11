#!/usr/bin/env node
// mdview-import —— 把外部主题转换成 mdview 主题
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, basename, dirname } from 'node:path';
import { cac } from 'cac';
import { importTyporaTheme } from './typora.js';
import { importObsidianTheme } from './obsidian.js';

const cli = cac('mdview-import');

cli
  .command('typora <css-file>', '把 Typora 的 .css 主题转成 mdview 主题')
  .option('--id <id>', '主题 ID（用于 #{id}.css 文件名）')
  .option('--name <name>', '主题显示名')
  .option('--author <author>', '主题作者')
  .option('-o, --out <dir>', '输出目录（默认 ./mdview-themes/<id>/）')
  .action(
    async (
      cssFile: string,
      options: { id?: string; name?: string; author?: string; out?: string },
    ) => {
      const cssText = await readFile(resolve(cssFile), 'utf8');
      const id =
        options.id ??
        basename(cssFile, '.css')
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-');
      const result = importTyporaTheme(cssText, {
        id,
        name: options.name,
        author: options.author,
      });

      const outDir = options.out ?? resolve('./mdview-themes', id);
      await mkdir(dirname(outDir), { recursive: true });
      await mkdir(outDir, { recursive: true });
      await writeFile(resolve(outDir, 'theme.css'), result.css, 'utf8');
      await writeFile(resolve(outDir, 'theme.json'), JSON.stringify(result.meta, null, 2), 'utf8');

      console.log(`✓ wrote ${outDir}/theme.css`);
      console.log(`✓ wrote ${outDir}/theme.json`);
      if (result.warnings.length > 0) {
        console.warn(`\nWarnings (${result.warnings.length}):`);
        for (const w of result.warnings.slice(0, 20)) console.warn('  - ' + w);
        if (result.warnings.length > 20) {
          console.warn(`  …and ${result.warnings.length - 20} more`);
        }
      }
    },
  );

cli
  .command('obsidian <css-file>', '把 Obsidian 的 .css 主题转成 mdview 主题')
  .option('--id <id>', '主题 ID')
  .option('--name <name>', '主题显示名')
  .option('--author <author>', '主题作者')
  .option('-o, --out <dir>', '输出目录（默认 ./mdview-themes/<id>/）')
  .action(
    async (
      cssFile: string,
      options: { id?: string; name?: string; author?: string; out?: string },
    ) => {
      const cssText = await readFile(resolve(cssFile), 'utf8');
      const id =
        options.id ??
        basename(cssFile, '.css')
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-');
      const result = importObsidianTheme(cssText, {
        id,
        name: options.name,
        author: options.author,
      });

      const outDir = options.out ?? resolve('./mdview-themes', id);
      await mkdir(dirname(outDir), { recursive: true });
      await mkdir(outDir, { recursive: true });
      await writeFile(resolve(outDir, 'theme.css'), result.css, 'utf8');
      await writeFile(resolve(outDir, 'theme.json'), JSON.stringify(result.meta, null, 2), 'utf8');

      console.log(`✓ wrote ${outDir}/theme.css`);
      console.log(`✓ wrote ${outDir}/theme.json`);
      if (result.warnings.length > 0) {
        console.warn(`\nWarnings (${result.warnings.length}):`);
        for (const w of result.warnings.slice(0, 20)) console.warn('  - ' + w);
      }
    },
  );

cli.help();
cli.version('0.0.1');
cli.parse();
