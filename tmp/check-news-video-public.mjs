import assert from 'node:assert/strict';
import { writeFile, mkdir } from 'node:fs/promises';
import { loadEnv } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseStore, listNewsPosts } from '../src/admin-data.js';

const env = loadEnv('production', process.cwd(), 'VITE_SUPABASE_');
assert.equal(new URL(env.VITE_SUPABASE_URL).hostname, 'cbzvezwdbinbzwsqqlcz.supabase.co');
const client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const store = createSupabaseStore(client);
const results = await Promise.allSettled([
  store.list('berita', { status: 'published', limit: 200 }),
  store.list('video', { limit: 200 }),
  listNewsPosts(store, { status: 'published', limit: 200 }),
  listNewsPosts(store, { status: 'published', mediaKind: 'video', limit: 200 }),
]);
for (const result of results) if (result.status === 'rejected') throw result.reason;
const [news, gallery, all, videos] = results.map(result => result.value);
assert.equal(all.count, news.count + gallery.count);
assert.equal(videos.count, news.data.filter(row => row.youtube_id).length + gallery.count);
for (const row of gallery.data) {
  assert.ok(all.data.some(post => post.contentType === 'video' && post.id === row.id));
  assert.ok(videos.data.some(post => post.contentType === 'video' && post.id === row.id));
}
assert.ok(all.data.every(row => row.contentType === 'video' || row.status === 'published'));
const result = { publicReadOnly: true, publishedNews: news.count, galleryVideos: gallery.count, combinedPosts: all.count, videosInNewsList: videos.count, galleryVideosKeepOriginalIdentity: true, productionWrites: false };
await mkdir('tmp/news-video-crud', { recursive: true });
await writeFile('tmp/news-video-crud/public-live-results.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
