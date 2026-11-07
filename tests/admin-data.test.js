import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoStore, createSupabaseStore, listNewsPosts, validateImage, youtubeId } from '../src/admin-data.js';

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

test('failed news insert keeps the uploaded photo available for retry in Drive', async () => {
  let uploads=0;
  const client = {
    from() { return { insert() { return this; }, select() { return this; }, single: async () => ({ error: { message: 'Not authorized' } }) }; },
  };
  const media={upload:async()=>{uploads++;return{full:'/api/media-image.php?full',thumbnail:'/api/media-image.php?thumb'};}};
  await assert.rejects(createSupabaseStore(client,{media}).put('berita', news(), new File(['image'], 'pic.png', { type: 'image/png' })), /Not authorized/);
  assert.equal(uploads,1);
});

test('news list includes existing gallery videos, keeps source identities, and respects every filter', async () => {
  const session = storage();
  const row = (id, judul, day, values = {}) => ({ id, judul, kategori: 'Kegiatan', dibuat_pada: `2026-11-0${day}T00:00:00.000Z`, ...values });
  session.setItem('annahl-demo-content-v1', JSON.stringify({
    berita: [row('same-id', 'Cerita santri', 5, { status: 'published' }), row('youtube-news', 'Video santri', 7, { status: 'published', youtube_id: 'M7lc1UVf-VE' }), row('draft', 'Video draft', 6, { status: 'draft', youtube_id: 'M7lc1UVf-VE' }), row('archived', 'Video arsip', 4, { status: 'draft', deleted_at: '2026-11-07', youtube_id: 'M7lc1UVf-VE' })],
    galeri_video: [row('same-id', 'Video galeri santri', 6, { youtube_id: 'aqz-KE-bpKQ' })], galeri_foto: [],
  }));
  const store = createDemoStore(session);
  const all = await listNewsPosts(store);
  assert.equal(all.count, 4);
  assert.deepEqual(all.data.map(item => [item.id, item.contentType]), [['youtube-news', 'berita'], ['draft', 'berita'], ['same-id', 'video'], ['same-id', 'berita']]);
  assert.equal((await listNewsPosts(store, { mediaKind: 'video' })).count, 3);
  assert.equal((await listNewsPosts(store, { mediaKind: 'photo' })).count, 1);
  assert.deepEqual((await listNewsPosts(store, { status: 'draft', mediaKind: 'video' })).data.map(item => item.id), ['draft']);
  assert.deepEqual((await listNewsPosts(store, { status: 'trash', mediaKind: 'video' })).data.map(item => item.id), ['archived']);
  assert.equal((await listNewsPosts(store, { status: 'published', mediaKind: 'video' })).count, 2);
  const legacy = await listNewsPosts(store, { search: 'GALERI SANTRI', category: 'Kegiatan' });
  assert.deepEqual(legacy.data.map(item => item.contentType), ['video']);
  assert.equal((await listNewsPosts(store, { category: 'Akademik' })).count, 0);
  const original = await store.get('video', legacy.data[0].id);
  await store.put('video', { judul: 'Video galeri diedit', youtube_id: 'M7lc1UVf-VE' }, null, original);
  assert.equal((await store.get('berita', 'same-id')).judul, 'Cerita santri');
  assert.equal((await listNewsPosts(store, { search: 'diedit' })).count, 1);
  await store.remove('video', await store.get('video', original.id));
  assert.equal((await listNewsPosts(store, { search: 'diedit' })).count, 0);
  assert.equal((await store.get('berita', 'same-id')).judul, 'Cerita santri');
});

test('mixed news pagination stays ordered and complete beyond one backend response', async () => {
  const session = storage();
  const state = { berita: [], galeri_video: [], galeri_foto: [] };
  for (let i = 0; i < 510; i++) {
    state.berita.push({ id: `news-${i}`, judul: `Cerita ${i}`, status: 'published', kategori: 'Kegiatan', dibuat_pada: new Date(Date.UTC(2026, 0, 1, 0, i * 2)).toISOString() });
    if (i < 51) state.galeri_video.push({ id: `video-${i}`, judul: `Video ${i}`, kategori: 'Kegiatan', youtube_id: 'aqz-KE-bpKQ', dibuat_pada: new Date(Date.UTC(2026, 0, 1, 0, i * 20 + 1)).toISOString() });
  }
  session.setItem('annahl-demo-content-v1', JSON.stringify(state));
  const store = createDemoStore(session);
  const expected = [...state.berita.map(row => ({ ...row, contentType: 'berita' })), ...state.galeri_video.map(row => ({ ...row, contentType: 'video' }))].sort((a, b) => b.dibuat_pada.localeCompare(a.dibuat_pada));
  for (const page of [1, 2, 21, 28, 29]) {
    const result = await listNewsPosts(store, { page, limit: 20 });
    assert.equal(result.count, 561);
    assert.deepEqual(result.data.map(row => `${row.contentType}:${row.id}`), expected.slice((page - 1) * 20, page * 20).map(row => `${row.contentType}:${row.id}`));
  }
});

test('live news type filters apply on the server and a failed video read is reported', async () => {
  for (const mediaKind of ['video', 'photo']) {
    const calls = [];
    const query = { then(resolve) { resolve({ data: [], count: 0 }); } };
    for (const method of ['select', 'order', 'eq', 'range', 'is', 'not']) query[method] = (...args) => { calls.push([method, ...args]); return query; };
    const store = createSupabaseStore({ from() { return query; } });
    await store.list('berita', { mediaKind });
    assert.ok(calls.some(call => JSON.stringify(call) === JSON.stringify(mediaKind === 'video' ? ['not', 'youtube_id', 'is', null] : ['is', 'youtube_id', null])));
  }
  await assert.rejects(listNewsPosts({ async list(type) { if (type === 'video') throw new Error('Video belum dapat dimuat'); return { data: [], count: 0 }; } }), /Video belum dapat dimuat/);
});
