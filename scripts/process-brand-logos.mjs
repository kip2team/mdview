#!/usr/bin/env node
// 把 docs/logo/*.png 的白底抠成透明,并生成多端用的尺寸
// 一次性脚本 —— 跑完产物提交进仓库,源图(docs/logo)保留作设计源
//
// 用法: node scripts/process-brand-logos.mjs

import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// 从 pnpm store 里解析 sharp(根目录没有直接 deps,只能走 store)
const require = createRequire(import.meta.url);
const sharpEntry = require.resolve('sharp', {
  paths: [
    join(root, 'node_modules/.pnpm/sharp@0.33.5/node_modules'),
    join(root, 'node_modules'),
  ],
});
const sharp = (await import(sharpEntry)).default;

// 白底像素 → 透明
// 采用「亮度 + 饱和度」启发式,处理抗锯齿边缘
async function whiteToTransparent(inputPath) {
  const img = sharp(inputPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    const minRGB = Math.min(r, g, b);
    const maxRGB = Math.max(r, g, b);
    const sat = maxRGB - minRGB;
    if (minRGB >= 248 && sat <= 10) {
      // 纯白:完全透明
      out[i + 3] = 0;
    } else if (minRGB >= 220 && sat <= 25) {
      // 边缘抗锯齿:把灰度白渐变映射成 alpha 渐变
      const alpha = Math.round(((255 - minRGB) / 35) * 255);
      out[i + 3] = Math.max(0, Math.min(255, alpha));
    }
  }
  return { buf: out, info };
}

async function emit(buf, info, outPath, resizeOpts) {
  await mkdir(dirname(outPath), { recursive: true });
  let pipeline = sharp(buf, { raw: info });
  if (resizeOpts) pipeline = pipeline.resize(resizeOpts);
  await pipeline.png({ compressionLevel: 9 }).toFile(outPath);
  console.log(`  → ${outPath}`);
}

const TRANSPARENT_BG = { r: 0, g: 0, b: 0, alpha: 0 };

async function main() {
  console.log('Processing icon (logo.png)...');
  const icon = await whiteToTransparent(join(root, 'docs/logo/logo.png'));

  // mdview.sh: web logo + 2x retina
  await emit(icon.buf, icon.info, join(root, 'apps/mdview-sh/public/logo.png'),
    { width: 256, height: 256, fit: 'contain', background: TRANSPARENT_BG });
  await emit(icon.buf, icon.info, join(root, 'apps/mdview-sh/public/logo@2x.png'),
    { width: 512, height: 512, fit: 'contain', background: TRANSPARENT_BG });

  // Tauri icon source(1024×1024,后续可用 `tauri icon` 生成系统全套图标)
  await emit(icon.buf, icon.info, join(root, 'apps/desktop/src-tauri/icons/source.png'),
    { width: 1024, height: 1024, fit: 'contain', background: TRANSPARENT_BG });

  // Desktop frontend (Welcome) public 资源
  await emit(icon.buf, icon.info, join(root, 'apps/desktop/public/logo.png'),
    { width: 256, height: 256, fit: 'contain', background: TRANSPARENT_BG });
  await emit(icon.buf, icon.info, join(root, 'apps/desktop/public/logo@2x.png'),
    { width: 512, height: 512, fit: 'contain', background: TRANSPARENT_BG });

  console.log('Processing wordmark (logo-wordmark.png)...');
  const wm = await whiteToTransparent(join(root, 'docs/logo/logo-wordmark.png'));
  await emit(wm.buf, wm.info, join(root, 'apps/mdview-sh/public/logo-wordmark.png'),
    { width: 800, fit: 'contain', background: TRANSPARENT_BG });
  await emit(wm.buf, wm.info, join(root, 'apps/mdview-sh/public/logo-wordmark@2x.png'),
    { width: 1600, fit: 'contain', background: TRANSPARENT_BG });

  // 暗色模式版本:把深色字反相成浅色,蓝色点保留 ——
  // 算法:对每个非透明像素,亮度反相 (255-min),保持原色相
  console.log('Processing wordmark (dark-mode variant)...');
  const wmDark = Buffer.from(wm.buf);
  for (let i = 0; i < wmDark.length; i += 4) {
    if (wmDark[i + 3] === 0) continue; // 透明像素跳过
    const r = wmDark[i];
    const g = wmDark[i + 1];
    const b = wmDark[i + 2];
    const minRGB = Math.min(r, g, b);
    const maxRGB = Math.max(r, g, b);
    const sat = maxRGB - minRGB;
    if (sat < 30) {
      // 接近灰度(主文字):反相到接近白
      wmDark[i] = 255 - r + (sat < 10 ? 0 : 0);
      wmDark[i + 1] = 255 - g;
      wmDark[i + 2] = 255 - b;
    } else {
      // 有彩色(i 的蓝点):提亮但保色相
      const lum = (r + g + b) / 3;
      const targetLum = 255 - lum;
      const factor = lum > 0 ? targetLum / lum : 1;
      wmDark[i] = Math.min(255, Math.round(r * factor));
      wmDark[i + 1] = Math.min(255, Math.round(g * factor));
      wmDark[i + 2] = Math.min(255, Math.round(b * factor));
    }
  }
  await emit(wmDark, wm.info, join(root, 'apps/mdview-sh/public/logo-wordmark-dark.png'),
    { width: 800, fit: 'contain', background: TRANSPARENT_BG });
  await emit(wmDark, wm.info, join(root, 'apps/mdview-sh/public/logo-wordmark-dark@2x.png'),
    { width: 1600, fit: 'contain', background: TRANSPARENT_BG });

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
