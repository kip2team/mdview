import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri 期望的开发端口默认 1420，HMR 走 1421
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: '0.0.0.0',
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 1421,
    },
  },
  // 兼容 Tauri 的环境变量约定
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: 'es2022',
    minify: 'esbuild',
    sourcemap: true,
  },
});
