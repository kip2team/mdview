import { defineConfig, devices } from '@playwright/test';

// E2E 跑前端模式（vite dev），不依赖 Tauri / Rust
// CI 上 base URL 通过环境变量覆盖，便于先 build 后 preview
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // 同一份 dev server，避免端口竞争
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',

  use: {
    baseURL: process.env.MDVIEW_E2E_URL ?? 'http://localhost:1420',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 自动起 vite dev —— playwright 跑完自动停
  webServer: process.env.CI
    ? undefined
    : {
        command: 'pnpm run dev',
        url: 'http://localhost:1420',
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
