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

// 把原始 RGBA buffer trim 掉透明边距,padToSquare 时再补成正方形(用于 favicon/icon),
// 然后 resize 到目标尺寸。这样目标画布里「内容占比」是满的,几乎无内边距。
//
// 注意:sharp 0.33 内部 pipeline 把 resize 排在 extend 之前,不论链式调用顺序,
// 所以这里必须把 extend 结果先序列化到 buffer,再重新加载做 resize。
async function emit(buf, info, outPath, { resize, padToSquare = false } = {}) {
  await mkdir(dirname(outPath), { recursive: true });
  // 1) trim 透明边距
  const trimmed = await sharp(buf, { raw: info })
    .trim({ threshold: 10 })
    .png()
    .toBuffer({ resolveWithObject: true });

  let workingBuf = trimmed.data;

  // 2) 如果需要正方形输出,把短边补透明使其变成正方形 —— 单独一个 pass,落盘后再继续
  if (padToSquare) {
    const { width, height } = trimmed.info;
    const size = Math.max(width, height);
    const padLeft = Math.floor((size - width) / 2);
    const padRight = size - width - padLeft;
    const padTop = Math.floor((size - height) / 2);
    const padBottom = size - height - padTop;
    if (padLeft || padRight || padTop || padBottom) {
      workingBuf = await sharp(workingBuf)
        .extend({
          left: padLeft,
          right: padRight,
          top: padTop,
          bottom: padBottom,
          background: TRANSPARENT_BG,
        })
        .png()
        .toBuffer();
    }
  }

  // 3) resize 到目标(独立 pipeline)
  let final = sharp(workingBuf);
  if (resize) final = final.resize(resize);
  await final.png({ compressionLevel: 9 }).toFile(outPath);
  console.log(`  → ${outPath}`);
}

const TRANSPARENT_BG = { r: 0, g: 0, b: 0, alpha: 0 };

async function main() {
  console.log('Processing icon (logo.png)...');
  const icon = await whiteToTransparent(join(root, 'docs/logo/logo.png'));

  // mdview.sh: web logo + 2x retina(icon 需正方形画布)
  const iconSquare = { padToSquare: true };
  await emit(icon.buf, icon.info, join(root, 'apps/mdview-sh/public/logo.png'),
    { ...iconSquare, resize: { width: 256, height: 256 } });
  await emit(icon.buf, icon.info, join(root, 'apps/mdview-sh/public/logo@2x.png'),
    { ...iconSquare, resize: { width: 512, height: 512 } });

  // Tauri icon source(1024×1024)
  await emit(icon.buf, icon.info, join(root, 'apps/desktop/src-tauri/icons/source.png'),
    { ...iconSquare, resize: { width: 1024, height: 1024 } });

  // Desktop frontend (Welcome) public 资源
  await emit(icon.buf, icon.info, join(root, 'apps/desktop/public/logo.png'),
    { ...iconSquare, resize: { width: 256, height: 256 } });
  await emit(icon.buf, icon.info, join(root, 'apps/desktop/public/logo@2x.png'),
    { ...iconSquare, resize: { width: 512, height: 512 } });

  console.log('Processing wordmark (logo-wordmark.png)...');
  const wm = await whiteToTransparent(join(root, 'docs/logo/logo-wordmark.png'));
  // wordmark 保持原宽高比,只指定宽度
  await emit(wm.buf, wm.info, join(root, 'apps/mdview-sh/public/logo-wordmark.png'),
    { resize: { width: 800 } });
  await emit(wm.buf, wm.info, join(root, 'apps/mdview-sh/public/logo-wordmark@2x.png'),
    { resize: { width: 1600 } });

  // 暗色模式版本:文字直接刷成纯白,蓝点保留色相但提亮 —— 在深背景上对比度最大
  console.log('Processing wordmark (dark-mode variant)...');
  const wmDark = Buffer.from(wm.buf);
  for (let i = 0; i < wmDark.length; i += 4) {
    const alpha = wmDark[i + 3];
    if (alpha === 0) continue; // 透明像素跳过
    const r = wmDark[i];
    const g = wmDark[i + 1];
    const b = wmDark[i + 2];
    const minRGB = Math.min(r, g, b);
    const maxRGB = Math.max(r, g, b);
    const sat = maxRGB - minRGB;
    if (sat < 35) {
      // 接近灰度(主文字):直接刷成纯白
      wmDark[i] = 255;
      wmDark[i + 1] = 255;
      wmDark[i + 2] = 255;
    } else {
      // 有彩色(i 的蓝点):保持原 H/S,把亮度提到 0.72,饱和度略增
      // 用「把最亮通道顶到 ~230,其它通道按比例缩」的简单实现
      const scale = maxRGB > 0 ? 230 / maxRGB : 1;
      wmDark[i] = Math.min(255, Math.round(r * scale));
      wmDark[i + 1] = Math.min(255, Math.round(g * scale));
      wmDark[i + 2] = Math.min(255, Math.round(b * scale));
    }
  }
  await emit(wmDark, wm.info, join(root, 'apps/mdview-sh/public/logo-wordmark-dark.png'),
    { resize: { width: 800 } });
  await emit(wmDark, wm.info, join(root, 'apps/mdview-sh/public/logo-wordmark-dark@2x.png'),
    { resize: { width: 1600 } });

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
