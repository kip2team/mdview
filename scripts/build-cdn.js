#!/usr/bin/env node
// 把 CDN 该有的资源整理到 cdn-dist/，附 _headers（Cloudflare Pages 缓存策略）
//
// 目录布局严格按 docs/01-PRD-and-Plan §11.2.5：
//   cdn-dist/
//     r/
//       v1.js                      # 滚动主版本（latest）
//       v1.min.js                  # 同上压缩版（v1.js 自身已 minify，这里只是别名复制）
//       v1.<sha>.js                # 内容寻址 pinned 版本
//     themes/
//       default.css ... sepia.css
//     ext/
//       extensions.css
//     manifest.json                # SRI hash 索引
//     _headers                     # Cloudflare Pages 缓存 + CORS 配置
import { mkdir, copyFile, readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, 'cdn-dist');

async function main() {
  await mkdir(resolve(OUT, 'r'), { recursive: true });
  await mkdir(resolve(OUT, 'themes'), { recursive: true });
  await mkdir(resolve(OUT, 'ext'), { recursive: true });

  // 1. engine —— 必须先跑过 pnpm --filter @mdview/engine-browser build
  const enginePath = resolve(ROOT, 'packages/engine-browser/dist/v1.js');
  if (!existsSync(enginePath)) {
    fail(
      `Missing ${enginePath}. Run: pnpm --filter @mdview/engine-browser build first.`,
    );
  }
  const engineContent = await readFile(enginePath);
  const engineHash = sha384(engineContent).slice(0, 16);
  const pinnedName = `v1.${engineHash}.js`;

  await writeFile(resolve(OUT, 'r/v1.js'), engineContent);
  await writeFile(resolve(OUT, 'r/v1.min.js'), engineContent);
  await writeFile(resolve(OUT, `r/${pinnedName}`), engineContent);

  // 2. 主题 CSS
  const themesDir = resolve(ROOT, 'packages/themes/src/themes');
  const themeFiles = (await readdir(themesDir)).filter((f) => f.endsWith('.css'));
  const themeIntegrities = {};
  for (const f of themeFiles) {
    const src = resolve(themesDir, f);
    const dst = resolve(OUT, 'themes', f);
    const content = await readFile(src);
    await copyFile(src, dst);
    themeIntegrities[f] = `sha384-${sha384Base64(content)}`;
  }

  // 3. 扩展 CSS
  const extSrc = resolve(ROOT, 'packages/themes/src/extensions.css');
  if (existsSync(extSrc)) {
    await copyFile(extSrc, resolve(OUT, 'ext/extensions.css'));
  }
  const printSrc = resolve(ROOT, 'packages/themes/src/print.css');
  if (existsSync(printSrc)) {
    await copyFile(printSrc, resolve(OUT, 'ext/print.css'));
  }

  // 4. integrity 清单 —— 给前端写 <link integrity=...> 时用
  const manifest = {
    generatedAt: new Date().toISOString(),
    engine: {
      latest: 'r/v1.js',
      pinned: `r/${pinnedName}`,
      integrity: `sha384-${sha384Base64(engineContent)}`,
    },
    themes: themeIntegrities,
  };
  await writeFile(resolve(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));

  // 5. _headers —— Cloudflare Pages 用来配缓存 + CORS
  // 见 https://developers.cloudflare.com/pages/configuration/headers/
  const headers = [
    '/*',
    '  Access-Control-Allow-Origin: *',
    '  X-Content-Type-Options: nosniff',
    '',
    // 内容寻址 pinned 文件 —— 永久缓存（hash 变就是新文件）
    '/r/v1.*.js',
    '  Cache-Control: public, max-age=31536000, immutable',
    '',
    // 滚动版本 —— 短缓存，让升级 1 小时内传播
    '/r/v1.js',
    '  Cache-Control: public, max-age=3600',
    '',
    '/r/v1.min.js',
    '  Cache-Control: public, max-age=3600',
    '',
    // 主题与扩展 CSS 不常变，1 天缓存
    '/themes/*',
    '  Cache-Control: public, max-age=86400',
    '',
    '/ext/*',
    '  Cache-Control: public, max-age=86400',
    '',
    // manifest 短缓存（5 分钟），便于查看最新 SRI 哈希
    '/manifest.json',
    '  Cache-Control: public, max-age=300',
    '',
  ].join('\n');
  await writeFile(resolve(OUT, '_headers'), headers);

  console.log('CDN bundle ready:');
  console.log('  ', resolve(OUT));
  console.log('Engine:    ', `r/v1.js + r/${pinnedName}`);
  console.log('Themes:    ', themeFiles.join(', '));
  console.log('Integrity: ', manifest.engine.integrity.slice(0, 60) + '…');
  console.log('\nDeploy: pnpm cdn:deploy (uses Cloudflare Pages)');
}

function sha384(buf) {
  return createHash('sha384').update(buf).digest('hex');
}
function sha384Base64(buf) {
  return createHash('sha384').update(buf).digest('base64');
}
function fail(msg) {
  console.error('error:', msg);
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
