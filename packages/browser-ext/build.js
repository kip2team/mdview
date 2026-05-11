// 浏览器扩展打包：把 content.ts / popup.ts 各打成单文件，复制 manifest 与 HTML
import { build, context } from 'esbuild';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { argv } from 'node:process';
import { resolve } from 'node:path';

const isWatch = argv.includes('--watch');
const SRC = resolve('./src');
const OUT = resolve('./dist');

await mkdir(OUT, { recursive: true });
await mkdir(resolve(OUT, 'styles'), { recursive: true });
await mkdir(resolve(OUT, 'icons'), { recursive: true });

// 复制静态资源
await Promise.all([
  copyFile(resolve(SRC, 'manifest.json'), resolve(OUT, 'manifest.json')),
  copyFile(resolve(SRC, 'popup.html'), resolve(OUT, 'popup.html')),
  copyFile(resolve(SRC, 'options.html'), resolve(OUT, 'options.html')),
]);

// 复制扩展 + 默认主题 CSS（来自 @mdview/themes）
const themesPkg = resolve('../../packages/themes/src');
await copyFile(resolve(themesPkg, 'extensions.css'), resolve(OUT, 'styles/extensions.css'));
await copyFile(resolve(themesPkg, 'themes/default.css'), resolve(OUT, 'styles/default-theme.css'));

// 占位图标 —— 实际发布前需要替换
const placeholderIcon = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="22" fill="#0969da"/>
  <text x="64" y="86" text-anchor="middle" font-family="-apple-system" font-size="60" font-weight="700" fill="#ffffff">M</text>
</svg>`;
await writeFile(resolve(OUT, 'icons/icon.svg'), placeholderIcon);

// 打包脚本
const bundleOptions = (entry, outName) => ({
  entryPoints: [resolve(SRC, entry)],
  bundle: true,
  format: 'iife',
  target: ['es2020', 'chrome102', 'firefox105'],
  outfile: resolve(OUT, outName),
  minify: true,
  sourcemap: 'linked',
  platform: 'browser',
  define: { 'process.env.NODE_ENV': '"production"' },
});

if (isWatch) {
  const ctx1 = await context(bundleOptions('content.ts', 'content.js'));
  const ctx2 = await context(bundleOptions('popup.ts', 'popup.js'));
  await Promise.all([ctx1.watch(), ctx2.watch()]);
  console.log('[browser-ext] watching…');
} else {
  await Promise.all([
    build(bundleOptions('content.ts', 'content.js')),
    build(bundleOptions('popup.ts', 'popup.js')),
  ]);
  console.log('[browser-ext] built → packages/browser-ext/dist/');
  console.log('  load unpacked from chrome://extensions to test');
}
