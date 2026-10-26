import test from 'node:test';
import assert from 'node:assert/strict';
import { renderBody, plainText, safeUrl } from '../src/content-format.js';
import { draftKey, saveDraft, readDraft, fitDimensions, optimizeImage } from '../src/editor-tools.js';
import { createDemoStore, createSupabaseStore } from '../src/admin-data.js';
import { sendSubmission } from '../src/form-submission.js';

const storage = () => { const data = new Map(); return { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }; };

test('limited formatting renders headings, bold, lists and safe links', () => {
  const result = renderBody('## Kabar santri\n\n**Alhamdulillah**\n\n- Satu\n- Dua\n\n[Baca](https://example.org)');
  for (const fragment of ['<h3>Kabar santri</h3>', '<strong>Alhamdulillah</strong>', '<ul><li>Satu</li><li>Dua</li></ul>', 'href="https://example.org"']) assert.ok(result.includes(fragment));
  assert.equal(plainText('## Kabar\n\n**baik** [baca](https://example.org)'), 'Kabar baik baca');
});

test('formatting never executes raw HTML or unsafe link protocols', () => {
  const result = renderBody('<img src=x onerror=alert(1)>\n\n[x](javascript:alert(1))\n\n[a](https://example.org/?q="onclick=x)');
  assert.ok(!result.includes('<img'));
  assert.ok(!result.includes('href="javascript:'));
  assert.ok(result.includes('&lt;img'));
  for (const url of ['javascript:alert(1)', 'data:text/html,x', 'java\tscript:alert(1)', null, '//bad.test']) assert.equal(safeUrl(url), '');
});

test('autosave separates users, records and demo/live contexts and handles corrupted data', () => {
  const session = storage();
  const key = draftKey('admin', true);
  saveDraft(session, key, { judul: 'Draft lokal', isi: '**Cerita**', kategori: 'Sosial', caption: 'Santri' });
  assert.equal(readDraft(session, key).judul, 'Draft lokal');
  assert.equal(readDraft(session, draftKey('admin', false)), null);
  assert.equal(readDraft(session, draftKey('penulis', true)), null);
  assert.equal(readDraft(session, draftKey('admin', true, 'news-id')), null);
  session.setItem(key, '{broken'); assert.equal(readDraft(session, key), null);
  session.setItem(key, '{"judul":42}'); assert.equal(readDraft(session, key), null);
});

test('dimension calculation preserves ratios without upscaling', () => {
  assert.deepEqual(fitDimensions(4000, 2000, 1600), { width: 1600, height: 800 });
  assert.deepEqual(fitDimensions(2000, 4000, 480), { width: 240, height: 480 });
  assert.deepEqual(fitDimensions(320, 240, 1600), { width: 320, height: 240 });
  assert.throws(() => fitDimensions(20000, 20000, 480));
});

test('image optimization enforces dimensions even when source is smaller in bytes', async () => {
  const previousBitmap = globalThis.createImageBitmap, previousDocument = globalThis.document;
  const dimensions = []; let closed = false;
  globalThis.createImageBitmap = async () => ({ width: 4000, height: 2000, close() { closed = true; } });
  globalThis.document = { createElement() { return { width: 0, height: 0, getContext: () => ({ drawImage() {} }), toBlob(callback) { dimensions.push([this.width, this.height]); callback(new Blob(['larger than the original'], { type: 'image/webp' })); } }; } };
  try {
    const result = await optimizeImage(new File(['x'], 'test.jpg', { type: 'image/jpeg' }));
    assert.equal(result.file.type, 'image/webp');
    assert.deepEqual(dimensions, [[1600, 800], [480, 240]]);
    assert.equal(closed, true);
  } finally { globalThis.createImageBitmap = previousBitmap; globalThis.document = previousDocument; }
});

test('drafts and archives are excluded from published counts; restore retains content and history', async () => {
  const store = createDemoStore(storage());
  const row = await store.put('berita', { judul: 'Draft uji', isi: 'Teks penting', kategori: 'Sosial', status: 'draft' });
  assert.equal((await store.counts()).berita, 3);
  await store.put('berita', { ...row, status: 'published' }, null, row);
  assert.equal((await store.counts()).berita, 4);
  await store.remove('berita', await store.get('berita', row.id));
  assert.equal((await store.counts()).berita, 3);
  assert.equal((await store.list('berita', { status: 'trash' })).count, 1);
  await store.restore(await store.get('berita', row.id));
  const restored = await store.get('berita', row.id);
  assert.equal(restored.status, 'draft'); assert.equal(restored.isi, 'Teks penting');
  assert.ok((await store.history(row.id)).length >= 4);
});

test('editor adapter refuses publishing, gallery writes, archive and role edits before API calls', async () => {
  const client = { from() { throw new Error('Unexpected network access'); } };
  const editor = createSupabaseStore(client, { userId: 'writer', role: 'editor' });
  await assert.rejects(editor.put('berita', { status: 'published' }), /admin/);
  await assert.rejects(editor.put('foto', {}), /admin/);
  await assert.rejects(editor.remove('berita', { id: 'id' }), /admin/);
  await assert.rejects(editor.updateMember('someone', { role: 'admin' }), /diizinkan/);
});

test('form sender confirms only acknowledged inserts and reuses request ID on retry', async () => {
  const calls = [];
  const client = { from(table) { assert.equal(table, 'form_submissions'); return { insert: async values => { calls.push(values); return { error: calls.length === 1 ? { code: 'FETCH_ERROR' } : { code: '23505' } }; } }; } };
  const payload = { nama: 'Nama Uji', email: 'uji@example.org', pesan: 'Pesan uji' };
  await assert.rejects(sendSubmission('kontak', payload, 'same-id', client), /Belum berhasil/);
  await sendSubmission('kontak', payload, 'same-id', client);
  assert.equal(calls[0].id, calls[1].id);
});

test('unconfigured or invalid form submissions never claim success', async () => {
  await assert.rejects(sendSubmission('kontak', { nama: 'Nama', email: 'invalid', pesan: 'Halo' }, 'id'), /email/);
  const forbiddenClient = { from() { throw new Error('A Google form must never reach Supabase'); } };
  await assert.rejects(sendSubmission('donasi', { nama: 'Nama', jumlah: '100' }, 'id', forbiddenClient), /Google/);
  await assert.rejects(sendSubmission('pendaftaran', { nama: 'Nama', namaWali: 'Wali', noWA: '081234567890' }, 'id', forbiddenClient), /Google/);
  await assert.rejects(sendSubmission('kontak', { nama: 'Nama', email: 'uji@example.org', pesan: 'Halo' }, 'id', null), /belum tersedia/);
});

test('editing uses the opened timestamp and rejects stale server versions', async () => {
  const filters = [];
  const query = { update() { return this; }, eq(...args) { filters.push(args); return this; }, select() { return this; }, single: async () => ({ error: { code: 'PGRST116' } }) };
  const store = createSupabaseStore({ from: () => query }, { userId: 'admin', role: 'admin' });
  await assert.rejects(store.put('berita', { judul: 'Updated', status: 'draft' }, null, { id: 'news', updated_at: '2026-10-26T00:00:00Z' }), /tetap ada di editor/);
  assert.deepEqual(filters, [['id', 'news'], ['updated_at', '2026-10-26T00:00:00Z']]);
});
