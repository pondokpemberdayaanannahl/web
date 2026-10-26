import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as data from '../src/admin-data.js';
import * as format from '../src/content-format.js';
import * as editor from '../src/editor-tools.js';

const html = fs.readFileSync(new URL('../admin.html', import.meta.url), 'utf8');
const source = fs.readFileSync(new URL('../src/admin.js', import.meta.url), 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));

// A small DOM fixture exercises controller state without a browser dependency.
function fixture(dev = true, restored = false) {
  const elements = new Map();
  function element(id) {
    const classes = new Set();
    return { id, value: '', textContent: '', innerHTML: '', hidden: false, disabled: false, files: [], elements: [], dataset: {}, listeners: {}, classList: { toggle(name, active) { active ? classes.add(name) : classes.delete(name); } },
      addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); },
      setAttribute() {}, removeAttribute() {}, replaceChildren() { this.innerHTML = ''; }, focus() {},
      reset() { for (const field of ['judul', 'isi', 'video-link', 'gambar']) { elements.get(field).value = ''; elements.get(field).files = []; } },
      reportValidity() { return true; }, showModal() { this.open = true; }, close() { this.open = false; this.listeners.close?.forEach(callback => callback()); },
    };
  }
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) { assert.ok(!elements.has(id), `Duplicate ID: ${id}`); elements.set(id, element(id)); }
  const $ = id => { assert.ok(elements.has(id), `Missing HTML element: ${id}`); return elements.get(id); };
  const saved = new Map(restored ? [['annahl-dummy-user', 'admin']] : []);
  const session = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value), removeItem: key => saved.delete(key) };
  const nav = [...html.matchAll(/class="nav-item[^"]*" data-panel="([^"]+)"/g)].map(([, panel]) => ({ ...element(panel), dataset: { panel } }));
  const context = {
    ...data, ...format, ...editor, createDemoStore: () => data.createDemoStore(session),
    env: { DEV: dev, VITE_DUMMY_LOGIN_ENABLED: 'true', VITE_DUMMY_USERNAME: 'admin', VITE_DUMMY_PASSWORD: '123', VITE_SUPABASE_ANON_KEY: 'local-preview-only' },
    document: { getElementById: $, querySelectorAll: () => nav },
    sessionStorage: session, localStorage: session, location: { origin: 'http://localhost:5173' }, window: { addEventListener() {} },
    setTimeout: (callback, ms) => { const timer = setTimeout(callback, ms); timer.unref(); return timer; }, clearTimeout, URL, console, confirm: () => true,
  };
  vm.runInNewContext(source.replace(/^import .*;\r?$/gm, '').replaceAll('import.meta.env', 'env'), context);
  return { $, saved, async fire(id, type, event = {}) { for (const callback of $(id).listeners[type] || []) await callback({ preventDefault() {}, ...event }); await tick(); },
    async click(button) { for (const callback of $('dashboard-view').listeners.click) await callback({ target: { closest: () => button } }); await tick(); },
  };
}

test('all controller selectors refer to actual HTML IDs', () => {
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  for (const [, id] of source.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.has(id), `Missing ${id}`);
});

test('dummy login, create, preview escaping, filter, edit, delete, and logout', async () => {
  const ui = fixture();
  ui.$('email').value = 'admin'; ui.$('password').value = 'wrong';
  await ui.fire('login-form', 'submit');
  assert.match(ui.$('login-error').textContent, /belum sesuai/);
  ui.$('password').value = '123';
  await ui.fire('login-form', 'submit');
  assert.equal(ui.$('dashboard-view').hidden, false);
  assert.equal(ui.$('demo-notice').hidden, false);
  assert.equal(ui.$('stat-news').textContent, 3);
  assert.ok(!ui.$('recent-news').innerHTML.includes('<img'), 'Missing covers must not request /null or /undefined');
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

test('production mode rejects dummy credentials even with stored demo session', async () => {
  const ui = fixture(false, true);
  ui.$('email').value = 'admin'; ui.$('password').value = '123';
  await ui.fire('login-form', 'submit');
  assert.match(ui.$('login-error').textContent, /belum sesuai/);
  assert.equal(ui.$('login-view').hidden, false);
  assert.equal(ui.$('login-btn').disabled, false);
});
