import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from '../node_modules/vite/dist/node/index.js';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { expect } = require('C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/test.js');
const expectedNames = ['KH. Mahfudz Noor Fawwaz', 'Abah Agus Thoha Noor Fawwaz, S.Pd., M.M.', 'Rahmat Abu Bakar'];
const expectedRoles = ['Pengasuh Pesantren', 'Pengurus / tokoh pimpinan keluarga besar pesantren', 'Pembina / pengasuh umum pesantren'];
const output = 'tmp/leadership-browser';
await mkdir(output, { recursive: true });
const vite = process.env.QA_BASE_URL ? null : await createServer({ configFile: 'vite.config.js', logLevel: 'silent', server: { host: '127.0.0.1', port: 0, open: false } });
if (vite) await vite.listen();
const origin = process.env.QA_BASE_URL || `http://127.0.0.1:${vite.httpServer.address().port}`;
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const results = [];
try {
  for (const width of [1366, 768, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [], failedImages = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.request().resourceType() === 'image' && response.status() >= 400) failedImages.push(response.url()); });
    await page.route('https://*.supabase.co/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await page.goto(origin + '/#/tentang');
    const section = page.locator('#pimpinan-pesantren');
    await expect(section.locator('.leadership-name')).toHaveText(expectedNames);
    await expect(section.locator('.leadership-role')).toHaveText(expectedRoles);
    await expect(section.locator('.leadership-photo-placeholder')).toHaveCount(0);
    await expect(section.locator('img')).toHaveCount(3);
    const portrait = section.getByRole('img', { name: expectedNames[0], exact: true });
    await expect(portrait).toHaveAttribute('src', '/images/leadership/kh-mahfudz-noor-fawwaz.png');
    const agusPortrait = section.getByRole('img', { name: expectedNames[1], exact: true });
    await expect(agusPortrait).toHaveAttribute('src', '/images/leadership/abah-agus-thoha-noor-fawwaz-white.png');
    const rahmatPortrait = section.getByRole('img', { name: expectedNames[2], exact: true });
    await expect(rahmatPortrait).toHaveAttribute('src', '/images/leadership/rahmat-abu-bakar.jpg');
    for (let index = 0; index < 3; index++) {
      const card = section.locator('.leadership-card').nth(index);
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible();
      await expect(card).toHaveCSS('opacity', '1');
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px horizontal overflow`);
    const grid = await section.locator('.leadership-grid').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    assert.equal(grid, width > 900 ? 3 : 1);
    assert.deepEqual(errors, []);
    assert.deepEqual(failedImages, []);
    assert.equal(await portrait.evaluate(image => image.complete && image.naturalWidth === 260 && image.naturalHeight === 298), true);
    assert.equal(await agusPortrait.evaluate(image => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0), true);
    assert.equal(await rahmatPortrait.evaluate(image => image.complete && image.naturalWidth === 447 && image.naturalHeight === 447), true);
    await section.screenshot({ path: `${output}/profiles-${width}.png` });
    results.push({ width, profiles: 3, columns: grid, suppliedPortraits: 3, photoPlaceholders: 0, noHorizontalOverflow: true, pageErrors: errors, failedImages });
    await context.close();
  }
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally { await browser.close(); if (vite) await vite.close(); }
