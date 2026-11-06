import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const runtime = 'C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const { chromium } = require(runtime);
const { expect } = require(runtime + '/test.js');
const origin = 'http://127.0.0.1:5173';
const output = 'tmp/pengurus-refresh';
await mkdir(output, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
try {
  for (const width of [1440, 768, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/login.html');
    await expect(page.getByRole('heading', { name: 'Selamat datang.' })).toBeVisible();
    const fonts = await page.evaluate(async () => {
      const [body, title] = await Promise.all([
        document.fonts.load('400 16px "DM Sans"'),
        document.fonts.load('650 36px "Lora"'),
      ]);
      return [...body, ...title].map(font => [font.family, font.status]);
    });
    assert.deepEqual(fonts, [['DM Sans', 'loaded'], ['Lora', 'loaded']]);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `${output}/login-${width}.png`, fullPage: true });
    await page.locator('#username').fill('admin');
    await page.locator('#password').fill('salah');
    await page.locator('#login-btn').click();
    await expect(page.locator('#login-error')).toContainText('belum sesuai');
    await page.locator('#password-toggle').click();
    await expect(page.locator('#password')).toHaveAttribute('type', 'text');
    await page.locator('#password-toggle').click();
    await page.locator('#password').fill('123');
    await page.locator('#login-btn').click();
    await expect(page.locator('#overview-title')).toHaveText('Selamat datang, admin.');
    await expect(page.locator('.recent-post')).toHaveCount(3);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `${output}/panel-${width}.png` });

    await page.locator('[data-panel="berita"]').click();
    await expect(page.locator('#daftar-berita .post-card')).toHaveCount(3);
    if (width <= 850) {
      await page.evaluate(() => window.scrollTo(0, 500));
      await expect(page.locator('#jump-to-menu')).toBeInViewport();
      await page.locator('#jump-to-menu').click();
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await expect(page.locator('[data-panel="berita"]')).toBeFocused();
    }
    await page.locator('[data-action="new-extracurricular"]').click();
    await page.locator('#gambar').setInputFiles('public/brand/an-nahl.png');
    await expect(page.locator('#editor-message')).toHaveText('Foto siap dipakai.');
    await expect(page.locator('#editor-message')).toBeInViewport();
    await page.locator('#judul').fill('Cerita santri hari ini');
    await page.locator('#isi').fill('Hari ini santri belajar bersama.');
    await page.locator('#preview-btn').click();
    await expect(page.locator('#preview-title')).toHaveText('Cerita santri hari ini');
    await page.locator('#preview-close').click();
    await expect(page.locator('#isi')).toHaveValue('Hari ini santri belajar bersama.');
    await page.locator('#draft-btn').click();
    await expect(page.locator('#editor-dialog')).toBeHidden();
    await page.locator('#news-status').selectOption('draft');
    await expect(page.locator('#daftar-berita .post-card h3')).toHaveText('Cerita santri hari ini');
    assert.deepEqual(errors, [], `Browser errors at ${width}px`);
    await context.close();
    console.log(`PASS ${width}px: local fonts, login, navigation, photo feedback, preview, draft.`);
  }
} finally {
  await browser.close();
}
