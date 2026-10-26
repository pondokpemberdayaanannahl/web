import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoStore, createSupabaseStore, validateImage, youtubeId } from '../src/admin-data.js';

function storage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
const news = (judul = 'Cerita santri') => ({ judul, kategori: 'Akademik', isi: 'Isi cerita.' });

test('demo CRUD updates counts, supports filters and survives tab reload', async () => {
  const session = storage();
  const store = createDemoStore(session);
  const initial = await store.counts();
  const row = await store.put('berita', news());
  assert.equal((await store.counts()).berita, initial.berita + 1);
  assert.equal((await store.list('berita', { search: 'CERITA SANTRI', category: 'Akademik' })).count, 1);
  await store.put('berita', news('Judul diperbarui'), null, row);
  const restored = createDemoStore(session);
  assert.equal((await restored.get('berita', row.id)).judul, 'Judul diperbarui');
  await restored.remove('berita', row);
  assert.equal((await restored.counts()).berita, initial.berita);
  const archived = await restored.get('berita', row.id);
  assert.ok(archived.deleted_at);
  assert.equal((await restored.list('berita', { status: 'trash' })).count, 1);
  await restored.restore(archived);
  assert.equal((await restored.get('berita', row.id)).status, 'draft');
  assert.equal((await restored.list('berita', { status: 'trash' })).count, 0);
});

test('demo pagination returns at most eight distinct rows per page', async () => {
  const store = createDemoStore(storage());
  for (let i = 0; i < 14; i++) await store.put('video', { judul: `Video ${i}`, kategori: 'Kegiatan', youtube_id: 'M7lc1UVf-VE' });
  const first = await store.list('video');
  const second = await store.list('video', { page: 2 });
  assert.equal(first.data.length, 8);
  assert.equal(second.data.length, 6);
  assert.equal(new Set([...first.data, ...second.data].map(row => row.id)).size, 14);
});

test('image binaries are not persisted and are released when a demo ends', async () => {
  const session = storage();
  const store = createDemoStore(session);
  const file = new File(['image'], 'image.png', { type: 'image/png' });
  const row = await store.put('foto', { judul: 'Foto santri', kategori: 'Ibadah' }, file);
  assert.match(row.gambar_url, /^blob:/);
  assert.equal((await createDemoStore(session).get('foto', row.id)).gambar_url, null);
  store.dispose();
  await assert.rejects(fetch(row.gambar_url));
});

test('demo write failure rolls back content and counts', async () => {
  const session = storage();
  const store = createDemoStore(session);
  const before = await store.counts();
  session.setItem = () => { throw new Error('quota'); };
  await assert.rejects(store.put('berita', news()), /penuh/);
  assert.deepEqual(await store.counts(), before);
  const row = (await store.list('berita')).data[0];
  await assert.rejects(store.remove('berita', row));
  assert.deepEqual(await store.counts(), before);
});

test('image validation rejects unsupported formats and oversized uploads', () => {
  assert.doesNotThrow(() => validateImage(null));
  assert.doesNotThrow(() => validateImage({ type: 'image/webp', size: 2048 }));
  assert.throws(() => validateImage({ type: 'image/svg+xml', size: 10 }), /Pilih foto/);
  assert.throws(() => validateImage({ type: 'image/png', size: 2 * 1024 * 1024 + 1 }), /2 MB/);
});

test('YouTube parser supports common formats and rejects lookalike hosts', () => {
  const id = 'M7lc1UVf-VE';
  for (const input of [id, `https://youtu.be/${id}?t=4`, `https://www.youtube.com/watch?v=${id}`, `https://m.youtube.com/shorts/${id}`]) assert.equal(youtubeId(input), id);
  for (const input of [`https://youtube.com.evil.test/watch?v=${id}`, `https://evilyoutu.be/${id}`, `javascript:${id}`, 'not a video']) assert.equal(youtubeId(input), null);
});

test('live lists request paginated metadata without article bodies', async () => {
  const calls = [];
  const query = { then(resolve) { resolve({ data: [], count: 0 }); } };
  for (const method of ['select', 'order', 'eq', 'ilike', 'range', 'is', 'not']) query[method] = (...args) => { calls.push([method, ...args]); return query; };
  const client = { from(table) { assert.equal(table, 'berita'); return query; } };
  await createSupabaseStore(client).list('berita', { page: 2, search: '100%', category: 'Sosial' });
  assert.deepEqual(calls.find(call => call[0] === 'range'), ['range', 8, 15]);
  assert.ok(!calls.find(call => call[0] === 'select')[1].split(',').includes('isi'));
  assert.deepEqual(calls.find(call => call[0] === 'ilike'), ['ilike', 'judul', '%100\\%%']);
});

test('failed live insert cleans up the newly uploaded photo', async () => {
  const removed = [];
  const client = {
    storage: { from() { return { upload: async () => ({}), getPublicUrl: path => ({ data: { publicUrl: `https://storage.example/${path}` } }), remove: async paths => { removed.push(...paths); return {}; } }; } },
    from() { return { insert() { return this; }, select() { return this; }, single: async () => ({ error: { message: 'Not authorized' } }) }; },
  };
  await assert.rejects(createSupabaseStore(client).put('berita', news(), new File(['image'], 'pic.png', { type: 'image/png' })), /Not authorized/);
  assert.equal(removed.length, 1);
  assert.match(removed[0], /\.png$/);
});
