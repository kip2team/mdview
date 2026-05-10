// Astro × Cloudflare Workers Assets 适配
//
// @astrojs/cloudflare 把 Worker 代码放在 dist/_worker.js/，把路由元数据放在 dist/_routes.json。
// 两者都不是用户可见的静态资源，但 wrangler 默认会把整个 dist/ 当静态资源上传。
// 加 .assetsignore 让 wrangler 跳过这两个，避免 server 代码被公开 +  Worker 重复上传。
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const distDir = resolve(import.meta.dirname, '..', 'dist');
const ignoreFile = resolve(distDir, '.assetsignore');

const ignored = ['_worker.js', '_routes.json', ''].join('\n');

await writeFile(ignoreFile, ignored, 'utf8');
console.log('[mdview-sh] wrote dist/.assetsignore');
