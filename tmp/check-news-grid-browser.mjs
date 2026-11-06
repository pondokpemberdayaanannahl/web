import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from '../node_modules/vite/dist/node/index.js';
const require = createRequire(import.meta.url);
const runtime = 'C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const { chromium } = require(runtime), { expect } = require(runtime + '/test.js');
process.env.VITE_DUMMY_LOGIN_ENABLED = 'true';
process.env.VITE_DUMMY_USERNAME = 'admin';
process.env.VITE_DUMMY_PASSWORD = '123';
const photos = JSON.parse(await readFile('src/data/photo-library.json', 'utf8')).photos;
const titles = ['Kegiatan tahfidz pagi bersama santri', 'Belajar dan bertumbuh di An-Nahl', 'Silaturahmi keluarga besar pesantren', 'Belajar merawat ternak bersama tim ekskul', 'Cerita santri: berbagi pengalaman dan semangat belajar setiap hari di pesantren'];
const state = { berita: Array.from({ length: 25 }, (_, i) => ({
  id: `grid-${i}`, judul: `${titles[i % titles.length]} ${i + 1}`,
  kategori: ['Keagamaan', 'Akademik', 'Sosial', 'Ekskul', 'Pengumuman'][i % 5],
  status: i % 7 === 0 ? 'draft' : 'published',
  caption: i % 3 ? 'Kegiatan santri untuk belajar, berkarya, dan saling mendukung bersama keluarga besar pesantren An-Nahl.' : '',
  isi: 'Berita contoh untuk pemeriksaan lokal. Tidak dipublikasikan.',
  gambar_url: i === 5 ? null : photos[i % 3].full,
  thumbnail_url: i === 5 ? null : photos[i % 3].thumbnail,
  dibuat_pada: new Date(Date.UTC(2026, 10, 6 - i)).toISOString(),
})), galeri_foto: [], galeri_video: [] };
const output = 'tmp/news-grid-browser';
await mkdir(output, { recursive: true });
const vite = await createServer({ configFile: 'vite.config.js', logLevel: 'silent', server: { host: '127.0.0.1', port: 0, open: false } });
await vite.listen();
const base = `http://127.0.0.1:${vite.httpServer.address().port}`;
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const results = [];
try {
  for (const width of [1900, 1440, 1100, 768, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    await context.addInitScript(data => {
      sessionStorage.setItem('annahl-dummy-user', 'admin');
      sessionStorage.setItem('annahl-demo-content-v1', JSON.stringify(data));
    }, state);
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://*.supabase.co/**', route => route.fulfill({ json: [] }));
    await page.goto(base + '/admin.html');
    await page.locator('#admin-nav [data-panel="berita"]').click();
    const list = page.locator('#daftar-berita'), cards = list.locator('.post-card');
    await expect(cards).toHaveCount(20);
    await expect(page.locator('#news-page-info')).toHaveText('Halaman 1 dari 2 · 25 konten');
    await page.evaluate(() => document.fonts.ready);
    const layout = await list.evaluate(element => ({
      columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
      rows: new Set([...element.children].map(card => Math.round(card.getBoundingClientRect().top))).size,
      scrollHeight: element.scrollHeight, height: element.clientHeight,
      cardWidth: element.firstElementChild.getBoundingClientRect().width,
      cardHeight: element.firstElementChild.getBoundingClientRect().height,
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    assert.equal(layout.columns, width > 1200 ? 4 : width > 1000 ? 3 : width > 620 ? 2 : 1);
    if (layout.columns === 4) assert.equal(layout.rows, 5);
    assert.equal(layout.overflow, false);
    assert.ok(layout.scrollHeight > layout.height);
    await page.screenshot({ path: `${output}/grid-${width}.png`, fullPage: true });
    console.log(JSON.stringify({ width, ...layout }));
    assert.ok(layout.cardHeight < 440);
    await list.focus();
    await page.keyboard.press('End');
    await expect.poll(() => list.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
    await page.locator('#news-next').click();
    await expect(cards).toHaveCount(5);
    await expect(page.locator('#news-page-info')).toHaveText('Halaman 2 dari 2 · 25 konten');
    assert.equal(await list.evaluate(element => element.scrollTop), 0);
    await expect(page.locator('#news-next')).toBeDisabled();
    await page.locator('#news-prev').click();
    await expect(cards).toHaveCount(20);
    await list.locator('[data-view]').first().click();
    await expect(page.locator('#preview-dialog')).toBeVisible();
    await page.locator('#preview-close').click();
    await list.locator('[data-edit]').first().click();
    await expect(page.locator('#editor-dialog')).toBeVisible();
    await page.locator('#editor-close').click();
    await page.locator('#news-filter').selectOption('Ekskul');
    await expect(cards).toHaveCount(5);
    await expect(page.locator('#news-page-info')).toHaveText('Halaman 1 dari 1 · 5 konten');
    await page.locator('#news-search').fill('tidak-ada-berita-ini');
    await expect(cards).toHaveCount(0);
    await expect(list.getByRole('heading', { name: 'Belum ada cerita di sini.' })).toBeVisible();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    results.push({ width, ...layout, pagination: true, keyboardScroll: true, preview: true, edit: true, filters: true });
    await context.close();
    console.log(`PASS ${width}px: ${layout.columns} columns, 20/page, scroll, pagination, preview, edit, filters.`);
  }
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
} finally { await browser.close(); await vite.close(); }
