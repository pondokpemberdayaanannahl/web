import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as data from '../src/admin-data.js';
import * as format from '../src/content-format.js';
import * as editor from '../src/editor-tools.js';
import * as library from '../src/photo-library.js';
import * as authFlow from '../src/auth-flow.js';
import { RECAP_URL } from '../src/google-forms.js';

const html = fs.readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
const sessionCode = fs.readFileSync(new URL('../src/admin-session.js', import.meta.url), 'utf8').replace(/export /g, '').replaceAll('import.meta.env','env');
const source = fs.readFileSync(new URL('../src/admin.js', import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));
const libraryData = JSON.parse(fs.readFileSync(new URL('../src/data/photo-library.json', import.meta.url), 'utf8')).photos;

// A small DOM fixture exercises controller state without a browser dependency.
function fixture(dev = true, restored = false) {
  const elements = new Map();
  function element(id) {
    const classes = new Set();
    return { id, value: '', textContent: '', innerHTML: '', hidden: false, disabled: false, files: [], elements: [], dataset: {}, listeners: {}, classList: { toggle(name, active) { active ? classes.add(name) : classes.delete(name); } },
      addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); },
      setAttribute() {}, removeAttribute() {}, replaceChildren() { this.innerHTML = ''; }, focus() {},
      reset() { for (const field of ['judul', 'isi', 'video-link', 'gambar', 'image-caption']) { elements.get(field).value = ''; elements.get(field).files = []; } },
      reportValidity() { return true; }, showModal() { this.open = true; }, close() { this.open = false; this.listeners.close?.forEach(callback => callback()); },
    };
  }
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) { assert.ok(!elements.has(id), `Duplicate ID: ${id}`); elements.set(id, element(id)); }
  const $ = id => { assert.ok(elements.has(id), `Missing HTML element: ${id}`); return elements.get(id); };
  const saved = new Map(restored ? [['annahl-dummy-user', 'admin']] : []);
  const session = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value), removeItem: key => saved.delete(key) };
  const nav = [...html.matchAll(/class="nav-item[^"]*" data-panel="([^"]+)"/g)].map(([, panel]) => ({ ...element(panel), dataset: { panel } }));
  const context = {
    ...data, ...format, ...editor, ...library, ...authFlow, RECAP_URL, loadPhotoLibrary: async () => libraryData, createDemoStore: () => data.createDemoStore(session),
    env: { DEV: dev, VITE_DUMMY_LOGIN_ENABLED: 'true', VITE_DUMMY_USERNAME: 'admin', VITE_DUMMY_PASSWORD: '123', VITE_SUPABASE_ANON_KEY: 'local-preview-only' },
    document: { getElementById: $, querySelectorAll: () => nav },
    sessionStorage: session, localStorage: session, location: { origin: 'http://localhost:5173', href: 'http://localhost:5173/admin.html', search: '', hash: '', replace(value) { context.redirected = value; } }, window: { addEventListener() {} },
    setTimeout: (callback, ms) => { const timer = setTimeout(callback, ms); timer.unref(); return timer; }, clearTimeout, URL, console, confirm: () => true,
  };
  vm.runInNewContext(sessionCode, context);
  vm.runInNewContext(source.replace(/^import .*;\r?$/gm, '').replaceAll('import.meta.env', 'env'), context);
  return { $, saved, context, async fire(id, type, event = {}) { for (const callback of $(id).listeners[type] || []) await callback({ preventDefault() {}, ...event }); await tick(); },
    async click(button) { for (const callback of $('dashboard-view').listeners.click) await callback({ target: { closest: () => button } }); await tick(); },
  };
}

test('all controller selectors refer to actual HTML IDs', () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  for (const [, id] of source.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.has(id), `Missing ${id}`);
});

test('large post covers use HD images while small media tiles use thumbnails', async () => {
  const ui = fixture(true, true); await tick();
  const row = { id: 'photo-quality', judul: 'Foto kegiatan', kategori: 'Akademik', status: 'published', dibuat_pada: '2026-10-28', gambar_url: '/media/photo-1600.jpg', thumbnail_url: '/media/photo-480.jpg' };
  for (const compact of [false, true]) {
    const markup = ui.context.newsRow(row, compact);
    assert.match(markup, /src="http:\/\/localhost:5173\/media\/photo-1600.jpg"[^>]+class="post-cover"/);
    assert.doesNotMatch(markup, /photo-480.jpg/);
  }
  assert.match(ui.context.mediaCard(row), /src="http:\/\/localhost:5173\/media\/photo-480.jpg"/);
  assert.match(ui.context.newsRow({ ...row, gambar_url: null }), /photo-480.jpg/);
  assert.match(ui.context.mediaCard({ ...row, thumbnail_url: null }), /photo-1600.jpg/);
});

test('authenticated demo creates, previews, filters, edits, deletes, and logs out', async () => {
  const ui = fixture(true, true); await tick();
  assert.equal(ui.$('dashboard-view').hidden, false);
  assert.equal(ui.$('demo-notice').hidden, false);
  assert.equal(ui.$('stat-news').textContent, 3);
  assert.doesNotMatch(ui.$('recent-news').innerHTML, /<img\b[^>]*\bsrc=["']\/?(?:null|undefined)(?:["'?])/i, 'Missing covers must not request /null or /undefined');
  assert.doesNotMatch(ui.$('recent-news').innerHTML, /class="post-cover"/, 'A post without a cover may still display the pondok logo');
  await ui.click({ dataset: { action: 'new-news' } });
  assert.equal(ui.$('editor-dialog').open, true);
  ui.$('judul').value = '<script>Judul aman</script>'; ui.$('isi').value = '<img onerror=alert(1)> Cerita baru'; ui.$('kategori').value = 'Akademik';
  await ui.fire('editor-form', 'input');
  await ui.fire('preview-btn', 'click');
  assert.ok(ui.$('preview-content').innerHTML.includes('&lt;script&gt;'));
  assert.ok(!ui.$('preview-content').innerHTML.includes('<script>'));
  await ui.fire('preview-close', 'click');
  await ui.fire('editor-form', 'submit');
  assert.equal(ui.$('editor-dialog').open, false);
  assert.equal(ui.$('stat-news').textContent, 4);
  await ui.click({ dataset: { go: 'berita' } });
  assert.equal(ui.$('panel-berita').hidden, false);
  ui.$('news-search').value = 'Judul aman';
  await ui.fire('news-filter', 'change');
  assert.match(ui.$('news-page-info').textContent, /1 konten/);
  const state = JSON.parse(ui.saved.get('annahl-demo-content-v1'));
  const created = state.berita.find(row => row.judul.includes('Judul aman'));
  await ui.click({ dataset: { edit: created.id, type: 'berita' } });
  assert.equal(ui.$('judul').value, created.judul);
  ui.$('judul').value = 'Judul aman diperbarui';
  await ui.fire('editor-form', 'submit');
  assert.match(ui.$('daftar-berita').innerHTML, /diperbarui/);
  await ui.click({ dataset: { delete: created.id, type: 'berita' } });
  assert.equal(ui.$('stat-news').textContent, 3);
  await ui.fire('logout-btn', 'click');
  assert.equal(ui.$('dashboard-view').hidden, true);
  assert.equal(ui.saved.has('annahl-dummy-user'), false);
});

test('restores local session, switches gallery tabs, and shows honest upcoming states', async () => {
  const ui = fixture(true, true);
  await tick();
  assert.equal(ui.$('user-name').textContent, 'admin');
  await ui.click({ dataset: { go: 'galeri', kind: 'video' } });
  assert.equal(ui.$('add-media').textContent, '＋ Tambah video');
  assert.match(ui.$('media-list').innerHTML, /Belum ada video/);
  await ui.click({ dataset: { panel: 'pendaftaran' } });
  assert.equal(ui.$('panel-upcoming').hidden, false);
  assert.equal(ui.$('submission-surface').hidden, false);
  assert.match(ui.$('submission-list').innerHTML, /tidak menerima kiriman/);
});

test('admin guard redirects visitors and rejects production demo sessions', async () => {
  for (const ui of [fixture(), fixture(false, true)]) {
    await tick();
    assert.equal(ui.context.redirected, '/login.html');
    assert.equal(ui.$('dashboard-view').innerHTML, '');
  }
});

test('autosave recovers editor text and server draft/archive/restore workflow stays unpublished', async () => {
  const ui = fixture(true, true); await tick();
  await ui.click({ dataset: { action: 'new-news' } });
  ui.$('judul').value = 'Draft yang dipulihkan'; ui.$('isi').value = 'Belum selesai'; ui.$('kategori').value = 'Sosial';
  await ui.fire('editor-form', 'input');
  await ui.fire('editor-close', 'click');
  await ui.click({ dataset: { action: 'new-news' } });
  assert.equal(ui.$('judul').value, 'Draft yang dipulihkan');
  assert.equal(ui.$('isi').value, 'Belum selesai');
  await ui.fire('draft-btn', 'click');
  let state = JSON.parse(ui.saved.get('annahl-demo-content-v1'));
  let draft = state.berita.find(row => row.judul === 'Draft yang dipulihkan');
  assert.equal(draft.status, 'draft');
  assert.equal(ui.$('stat-news').textContent, 3);
  await ui.click({ dataset: { go: 'berita' } });
  await ui.click({ dataset: { delete: draft.id, type: 'berita' } });
  ui.$('news-status').value = 'trash'; await ui.fire('news-status', 'change');
  assert.match(ui.$('daftar-berita').innerHTML, /Pulihkan ke draft/);
  await ui.click({ dataset: { restore: draft.id, type: 'berita' } });
  state = JSON.parse(ui.saved.get('annahl-demo-content-v1'));
  draft = state.berita.find(row => row.id === draft.id);
  assert.equal(draft.status, 'draft'); assert.equal(draft.deleted_at, null);
  assert.equal(ui.$('stat-news').textContent, 3);
});

test('local gallery shows every photo through pagination, folder filters and keyboard preview', async () => {
  const ui = fixture(true, true); await tick();
  await ui.click({ dataset: { panel: 'galeri' } });
  assert.equal(ui.$('library-tools').hidden, false);
  assert.equal(ui.$('media-count').textContent, `149 dari ${libraryData.length} foto folder`);
  assert.equal((ui.$('media-list').innerHTML.match(/class="media-card local-photo-card"/g) || []).length, 24);
  await ui.fire('media-next', 'click');
  assert.match(ui.$('media-page-info').textContent, /Halaman 2/);
  const folder = libraryData.find(row => row.format === 'HEIC').folder;
  ui.$('library-folder').value = folder;
  await ui.fire('library-folder', 'change');
  const filtered = library.filterPhotoLibrary(libraryData, '', folder);
  assert.equal(ui.$('media-count').textContent, `${filtered.length} dari ${libraryData.length} foto folder`);
  await ui.click({ dataset: { localPhoto: filtered[0].id } });
  assert.equal(ui.$('library-dialog').open, true);
  assert.equal(ui.$('library-preview-image').src, filtered[0].full);
  await ui.fire('library-dialog', 'keydown', { key: 'ArrowRight' });
  assert.equal(ui.$('library-preview-image').src, filtered[1].full);
  await ui.fire('library-close', 'click');
  assert.equal(ui.$('library-dialog').open, false);
  await ui.fire('library-reset', 'click');
  assert.equal(ui.$('media-count').textContent, `${libraryData.length} dari ${libraryData.length} foto folder`);
  await ui.fire('tab-foto', 'click');
  assert.equal(ui.$('library-tools').hidden, true);
  assert.match(ui.$('media-list').innerHTML, /Belum ada foto/);
});
