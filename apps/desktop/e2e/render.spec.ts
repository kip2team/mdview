// 渲染管线的 E2E：通过模拟拖文件进窗口让 markdown 加载，然后断言渲染产物
import { test, expect } from '@playwright/test';

const SAMPLE_MD = `---
title: E2E Sample
extensions: [mdv:callout, mdv:color]
---

# E2E Sample

A paragraph with #ff6b35 color.

> [!warning] Heads up
> This is a warning callout.

\`\`\`ts
const x: number = 42;
\`\`\`
`;

test.describe('Rendering pipeline', () => {
  test('drop a markdown blob and see rendered output', async ({ page }) => {
    await page.goto('/');

    // 通过编程方式设置 markdown（绕开真实 file drop 的复杂性）
    // App 暴露的入口：直接构造一个 File 触发 drop handler
    await page.evaluate(async (md) => {
      const file = new File([md], 'sample.md', { type: 'text/markdown' });
      const dt = new DataTransfer();
      dt.items.add(file);
      window.dispatchEvent(
        new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dt,
        }),
      );
    }, SAMPLE_MD);

    // 渲染应包含标题、callout、color
    const output = page.locator('#mdview-output');
    await expect(output).toBeVisible();
    await expect(output.getByRole('heading', { name: 'E2E Sample' })).toBeVisible();
    await expect(output.locator('.mdv-callout')).toContainText('Heads up');
    await expect(output.locator('.mdv-color')).toContainText('#ff6b35');
  });

  test('toolbar 出现且能切主题', async ({ page }) => {
    await page.goto('/');
    // 先加载文件让 toolbar 显现
    await page.evaluate(async (md) => {
      const file = new File([md], 'sample.md', { type: 'text/markdown' });
      const dt = new DataTransfer();
      dt.items.add(file);
      window.dispatchEvent(
        new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }),
      );
    }, SAMPLE_MD);

    // 主题切换器存在
    const themeBtn = page.getByRole('button', { name: /Switch theme/i });
    await expect(themeBtn).toBeVisible();
    await themeBtn.click();
    // 菜单展开
    await expect(page.getByRole('listbox', { name: /Theme options/i })).toBeVisible();
    // 选 Medium
    await page.getByRole('option', { name: /Medium/i }).click();
    // <link> href 应切到 medium 主题
    await expect(page.locator('link[data-mdview-theme="medium"]')).toHaveCount(1);
  });

  test('⌘\\\\ 切换三态视图', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async (md) => {
      const file = new File([md], 'sample.md', { type: 'text/markdown' });
      const dt = new DataTransfer();
      dt.items.add(file);
      window.dispatchEvent(
        new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }),
      );
    }, SAMPLE_MD);

    // 默认 read 模式
    await expect(page.locator('.mdv-stage.mdv-mode-read')).toBeVisible();
    // ⌘\ → split
    await page.keyboard.press('Meta+Backslash');
    await expect(page.locator('.mdv-stage.mdv-mode-split')).toBeVisible();
    // 再 ⌘\ → source
    await page.keyboard.press('Meta+Backslash');
    await expect(page.locator('.mdv-stage.mdv-mode-source')).toBeVisible();
  });
});
