import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as images from '../src/data/photos.js';
import * as format from '../src/content-format.js';
import * as pondok from '../src/data/pondok.js';
import { categoryCards } from '../src/components/category-cards.js';
import { socialIcon } from '../src/components/social-icon.js';

test('every public form collector is bound to real uniquely identified fields', () => {
  for (const [file, component, initializer, kind] of [
    ['pendaftaran', 'Pendaftaran', 'initPendaftaran', 'pendaftaran'],
    ['kontak', 'Kontak', 'initKontak', 'kontak'],
    ['donasi', 'Donasi', 'initDonasi', 'donasi'],
  ]) {
    const source = fs.readFileSync(new URL(`../src/pages/${file}.js`, import.meta.url), 'utf8');
    const nodes = new Map(); let collected;
    const context = { ...images, ...pondok, socialIcon, initDonationPayment() {}, window: {}, document: { getElementById(id) { assert.ok(nodes.has(id), `Missing ${id} in ${file}`); return nodes.get(id); } }, bindSubmission(form, actualKind, collect) { assert.equal(actualKind, kind); collected = collect(); } };
    vm.runInNewContext(source.replace(/^import .*;\r?$/gm, '').replaceAll('export function', 'function'), context);
    const markup = context[component]();
    for (const [, id] of markup.matchAll(/\bid="([^"]+)"/g)) { assert.ok(!nodes.has(id)); nodes.set(id, { value: id === 'donor-amount' ? 'Rp 500.000' : 'Contoh uji' }); }
    context.window[initializer]();
    assert.equal(collected.nama, 'Contoh uji');
    if (kind === 'pendaftaran') { assert.equal(collected.jenisKelamin, 'Contoh uji'); assert.equal(collected.program, 'Contoh uji'); }
    if (kind === 'donasi') assert.equal(collected.jumlah, '500000');
    assert.ok(!markup.includes("onclick=\"alert("));
  }
});

function gallery(client) {
  const source = fs.readFileSync(new URL('../src/pages/galeri.js', import.meta.url), 'utf8');
  const nodes = new Map();
  const makeNode = () => ({ isConnected: true, hidden: false, disabled: false, textContent: '', innerHTML: '', listeners: {}, dataset: {}, attrs: {}, style: {},
    classList: { add() {}, remove() {} }, addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); },
    setAttribute(key, value) { this.attrs[key] = value; }, removeAttribute() {}, replaceChildren() { this.innerHTML = ''; },
    insertAdjacentHTML(position, html) { this.innerHTML += html; }, showModal() {}, close() {},
  });
  nodes.set('galeri-styles', makeNode());
  const close = makeNode();
  const filters = ['Semua', 'Ibadah'].map(filter => ({ ...makeNode(), dataset: { filter } }));
  const context = { ...images, ...format, categoryCards, window: {}, getSupabase: async () => ({ supabase: client }), document: { body: { style: {} }, getElementById: id => nodes.get(id) || null, querySelectorAll: () => filters } };
  vm.runInNewContext(source.replace(/^import .*;\r?$/gm, '').replace('export function Galeri', 'function Galeri').replace("await import('../supabase.js')", 'await getSupabase()'), context);
  const markup = context.Galeri();
  for (const [, id] of markup.matchAll(/\bid="([^"]+)"/g)) nodes.set(id, makeNode());
  nodes.get('lightbox').querySelector = () => close;
  return { nodes, filters, context };
}

test('unconfigured gallery uses optimized static photos and no unrelated example videos', async () => {
  const fixture = gallery(null);
  await fixture.context.window.initGalleryFilter();
  assert.match(fixture.nodes.get('photo-grid').innerHTML, /-480\.jpg/);
  assert.equal(fixture.nodes.get('video-grid').innerHTML, '');
  assert.match(fixture.nodes.get('video-status').textContent, /belum tersedia/);
});

test('configured gallery reads backend metadata, escapes captions, and filters server-side', async () => {
  const requests = [];
  const client = { from(table) {
    const request = { table }; requests.push(request);
    const query = { select() { return this; }, order() { return this; }, eq(column, value) { request.filter = [column, value]; return this; }, async range(first, last) { request.range = [first, last]; return table === 'galeri_foto' ? { data: [{ judul: '<unsafe>', caption: '" onclick="bad()', gambar_url: 'https://example.org/full.jpg', thumbnail_url: 'https://example.org/thumb.jpg' }], count: 1 } : { data: [], count: 0 }; } };
    return query;
  } };
  const fixture = gallery(client);
  await fixture.context.window.initGalleryFilter();
  const markup = fixture.nodes.get('photo-grid').innerHTML;
  assert.ok(markup.includes('https://example.org/thumb.jpg'));
  assert.ok(markup.includes('&lt;unsafe&gt;'));
  assert.ok(!markup.includes('data-caption="" onclick='));
  assert.deepEqual(requests[0].range, [0, 11]);
  fixture.filters[1].listeners.click[0]();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(requests.at(-1).filter, ['kategori', 'Ibadah']);
});
