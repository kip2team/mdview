import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// SSR + Cloudflare 适配 —— URL 预览需要服务端 fetch + render，所以走 SSR
// 静态首页 / 关于页等可以 prerender
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  integrations: [react()],
  server: {
    port: 4321,
  },
  vite: {
    ssr: {
      // monorepo workspace 包默认会被 Vite 当作 external，这里强制让 Astro/Vite 走源码
      noExternal: ['@mdview/core', '@mdview/format', '@mdview/themes'],
    },
  },
});
