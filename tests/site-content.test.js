import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';
import { SITE_PAGES, blankSiteContent, createContentCatalog, renderSiteContent, normalizeSiteDocument, validateSiteDocument, contentUrl } from '../src/site-content.js';
import { createSiteContentStore, readPublishedSiteContent } from '../src/site-content-store.js';
import * as images from '../src/data/photos.js';
import * as formatting from '../src/content-format.js';
import { socialIcon } from '../src/components/social-icon.js';
import { categoryCards } from '../src/components/category-cards.js';

const document = () => parseHTML('<html><head></head><body></body></html>').document;
const source = '<section class="hero"><div style="background-image:url(\'/media/cover.jpg\')"></div><h1>Judul utama</h1></section><section><h2>Tentang pondok</h2><p>Kalimat <strong>bermakna</strong> untuk keluarga.</p><img src="/media/about.jpg" alt="Kegiatan santri"><a href="https://example.org">Hubungi</a><div data-counter="500" data-suffix="+">0</div></section><section><h2>Pendaftaran</h2><form><label for="nama">Nama</label><input id="nama" required><button>Kirim</button></form></section>';

test('content catalog covers the real public pages while excluding form controls and dynamic posts', () => {
  const names = { beranda:'Beranda',tentang:'Tentang',program:'Program',pendaftaran:'Pendaftaran',donasi:'Donasi',kontak:'Kontak',berita:'Berita',galeri:'Galeri' };
  for (const [id, name] of Object.entries(names)) {
    const doc = document();
    const context = { ...images, ...formatting, socialIcon, categoryCards, document: doc, window: {}, supabase: null, bindSubmission() {} };
    const code = readFileSync(new URL(`../src/pages/${id}.js`, import.meta.url), 'utf8').replace(/^import .*;\r?$/gm, '').replaceAll('export ', '');
    vm.runInNewContext(code, context);
    const html = context[name]();
    const catalog = createContentCatalog(html, doc);
    assert.ok(catalog.blocks.length >= 1, id);
    assert.ok(catalog.fields.length >= 3 && catalog.fields.length <= 600, `${id}: ${catalog.fields.length}`);
    assert.equal(new Set(catalog.fields.map(field => field.id)).size, catalog.fields.length, id);
    for (const field of catalog.fields) assert.match(field.id, /^[a-z0-9:-]{1,180}$/);
    assert.ok(catalog.fields.every(field => !field.label.includes('Password')), id);
    assert.deepEqual(createContentCatalog(html, doc).fields.map(field => field.id), catalog.fields.map(field => field.id));
    assert.equal(renderSiteContent(html, null, doc), html, 'Missing CMS data must retain the exact original markup');
  }
});

test('text edits remain literal, supported images/links/numbers update, and hidden sections cannot remove forms', () => {
  const doc = document(), catalog = createContentCatalog(source, doc), content = blankSiteContent();
  const heading = catalog.fields.find(field => field.value === 'Judul utama');
  const image = catalog.fields.find(field => field.kind === 'image' && field.value === '/media/about.jpg');
  const number = catalog.fields.find(field => field.kind === 'number');
  const suffix = catalog.fields.find(field => field.kind === 'suffix');
  content.values[heading.id] = '<img src=x onerror=alert(1)> Pondok';
  content.values[image.id] = 'https://example.org/new.jpg';
  content.values[number.id] = '750'; content.values[suffix.id] = '%';
  content.hidden = [catalog.blocks[0].id, catalog.blocks[2].id];
  const html = renderSiteContent(source, content, doc);
  assert.match(html, /&lt;img/); assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /https:\/\/example.org\/new.jpg/);
  assert.match(html, /data-counter="750"/); assert.match(html, /750%/);
  assert.match(html, /<strong>bermakna<\/strong>/);
  assert.match(html, /<form>/); assert.match(html, /class="hero"/);
  content.hidden = [catalog.blocks[1].id];
  const hidden = renderSiteContent(source, content, doc);
  assert.doesNotMatch(hidden, /<h2>Tentang pondok/); assert.match(hidden, /<form>/);
});

test('unsafe attributes, fabricated selectors, invalid numbers, and oversized documents cannot alter public markup', () => {
  const doc = document(), catalog = createContentCatalog(source, doc);
  for (const kind of ['image','link']) {
    const content = blankSiteContent(), field = catalog.fields.find(item => item.kind === kind);
    content.values[field.id] = 'javascript:alert(1)';
    assert.throws(() => normalizeSiteDocument(content, catalog), /valid/);
    assert.equal(renderSiteContent(source, content, doc), source);
  }
  assert.equal(contentUrl('https://example.org/a.jpg";color:red', 'image'), '');
  assert.equal(contentUrl('//evil.example/a.jpg', 'image'), '');
  assert.equal(contentUrl('https://evil.example/map', 'map'), '');
  assert.equal(contentUrl('mailto:pondok@example.org'), 'mailto:pondok@example.org');
  const fabricated = blankSiteContent(); fabricated.values['body:onclick'] = 'bad()';
  assert.deepEqual(normalizeSiteDocument(fabricated, catalog), blankSiteContent());
  const number = catalog.fields.find(field => field.kind === 'number');
  fabricated.values[number.id] = 'NaN'; assert.throws(() => normalizeSiteDocument(fabricated, catalog), /Angka/);
  assert.throws(() => validateSiteDocument({ version:1,values:{ x:'x'.repeat(8001) },hidden:[] }));
  assert.throws(() => validateSiteDocument({ version:1,values:{},hidden:[],html:'<script>' }));
});

const storage = () => { const values = new Map(); return { getItem:key => values.get(key) ?? null, setItem:(key,value) => values.set(key,value) }; };
test('page drafts and publications persist separately; competing edits and non-admin writes are refused', async () => {
  const memory = storage(), admin = createSiteContentStore(null, { role:'admin',storage:memory });
  const content = { version:1,values:{ title:'Judul pertama' },hidden:[] };
  let state = await admin.save('beranda', content, { draft:0,published:0 });
  assert.equal(state.draft.revision, 1); assert.equal(state.published, undefined);
  state = await admin.save('beranda', content, { draft:1,published:0 }, true);
  const changed = { ...content, values:{ title:'Draft baru' } };
  state = await admin.save('beranda', changed, { draft:2,published:1 });
  assert.equal(state.draft.content.values.title, 'Draft baru');
  assert.equal(state.published.content.values.title, 'Judul pertama');
  await assert.rejects(admin.save('beranda', content, { draft:2,published:1 }, true), /diubah/);
  const reader = createSiteContentStore(null, { role:'editor',storage:memory });
  await assert.rejects(reader.save('beranda', content, { draft:0,published:0 }), /Hanya admin/);
  assert.equal((await admin.load('beranda')).published.content.values.title, 'Judul pertama');
});

test('server errors and incomplete acknowledgements never claim a page was saved', async () => {
  const content = blankSiteContent(), versions = { draft:0,published:0 };
  for (const result of [{ error:{ code:'40001' } },{ error:{ code:'PGRST202' } },{ data:{} },{ data:{ draft:{ page_id:'tentang',state:'draft',revision:1 } } }]) {
    const store = createSiteContentStore({ rpc:async () => result }, { role:'admin' });
    await assert.rejects(store.save('beranda', content, versions, true));
  }
  let requested;
  const publicClient = { from(table) { requested = { table }; return { select(fields) { requested.fields=fields; return this; }, async eq(key,value) { requested.filter=[key,value]; return { data:[{page_id:'beranda',content}],error:null }; } }; } };
  assert.deepEqual(await readPublishedSiteContent(publicClient), { beranda:content });
  assert.deepEqual(requested.filter, ['state','published']);
  assert.deepEqual(await readPublishedSiteContent(null), {});
  assert.equal(SITE_PAGES.length, 9);
});
