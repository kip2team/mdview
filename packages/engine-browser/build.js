// 用 esbuild 把 bootstrap.ts + 所有依赖打成一个 IIFE 单文件
// 输出物即将上传到 cdn.mdview.sh/r/v1.js，必须自给自足、无外部 import
import { build, context } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { argv } from 'node:process';

const isWatch = argv.includes('--watch');

await mkdir('./dist', { recursive: true });

const baseOptions = {
  entryPoints: ['src/bootstrap.ts'],
  bundle: true,
  format: 'iife',
  globalName: '__mdviewBoot',
  target: ['es2020', 'chrome90', 'firefox88', 'safari14'],
  outfile: 'dist/v1.js',
  minify: true,
  sourcemap: 'linked',
  metafile: true,
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  // 让 markdown-it 能识别 typeof window/document 而不去找 Node API
  platform: 'browser',
};

if (isWatch) {
  const ctx = await context(baseOptions);
  await ctx.watch();
  console.log('[engine-browser] watching…');
} else {
  const result = await build(baseOptions);
  const outFiles = Object.entries(result.metafile.outputs).map(
    ([f, info]) => `${f}: ${(info.bytes / 1024).toFixed(1)} KB`,
  );
  console.log('[engine-browser] built\n  ' + outFiles.join('\n  '));
}
