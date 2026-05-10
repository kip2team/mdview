// VS Code 扩展打包：esbuild 把 extension.ts 打成 CommonJS 单文件
// 同时把主题 CSS 复制到 dist/styles 供 webview 内联读取
import { build, context } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
import { argv } from 'node:process';
import { resolve } from 'node:path';

const isWatch = argv.includes('--watch');
const SRC = resolve('./src');
const OUT = resolve('./dist');

await mkdir(resolve(OUT, 'styles/themes'), { recursive: true });

const themesSrc = resolve('../../packages/themes/src');
await Promise.all([
  copyFile(resolve(themesSrc, 'extensions.css'), resolve(OUT, 'styles/extensions.css')),
  copyFile(resolve(themesSrc, 'themes/default.css'), resolve(OUT, 'styles/themes/default.css')),
  copyFile(resolve(themesSrc, 'themes/github.css'), resolve(OUT, 'styles/themes/github.css')),
  copyFile(resolve(themesSrc, 'themes/medium.css'), resolve(OUT, 'styles/themes/medium.css')),
]);

const opts = {
  entryPoints: [resolve(SRC, 'extension.ts')],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  outfile: resolve(OUT, 'extension.js'),
  external: ['vscode'],
  minify: !isWatch,
  sourcemap: 'linked',
};

if (isWatch) {
  const ctx = await context(opts);
  await ctx.watch();
  console.log('[vscode] watching…');
} else {
  await build(opts);
  console.log('[vscode] built → packages/vscode/dist/extension.js');
}
