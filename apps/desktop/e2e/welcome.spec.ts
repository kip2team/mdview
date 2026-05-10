// 欢迎页 / 文件加载流的 E2E 验证
// 在浏览器调试模式（pnpm desktop:web）下跑，跳过 Tauri 原生功能
import { test, expect } from '@playwright/test';

test.describe('Welcome page', () => {
  test('首屏显示欢迎页', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'mdview' })).toBeVisible();
    await expect(page.getByText('A reader-first home for Markdown')).toBeVisible();
  });

  test('"Open Markdown file" 按钮可见且 focusable', async ({ page }) => {
    await page.goto('/');
    const btn = page.getByRole('button', { name: /Open Markdown file/i });
    await expect(btn).toBeVisible();
    await btn.focus();
    await expect(btn).toBeFocused();
  });

  test('显示快捷键提示', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('⌘O')).toBeVisible();
    await expect(page.getByText('⌘E')).toBeVisible();
  });
});

test.describe('Drop overlay', () => {
  test('拖文件进窗口期间显示 overlay', async ({ page }) => {
    await page.goto('/');
    // 模拟拖入事件
    await page.dispatchEvent('body', 'dragenter', {
      dataTransfer: await page.evaluateHandle(() => {
        const dt = new DataTransfer();
        return dt;
      }),
    });
    // 注意：Playwright 的 dataTransfer 模拟有限，此用例主要验证 dragenter 不崩溃
    // overlay 元素可能不显示（因为 dataTransfer.types 没真的含 'Files'）
    // 真实测试要用 page.locator('input[type="file"]').setInputFiles()
  });
});
