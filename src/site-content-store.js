import { SITE_PAGES, blankSiteContent, validateSiteDocument } from './site-content.js';

const ids = new Set(SITE_PAGES.map(page => page.id));
export function createSiteContentStore(client, { role = 'editor', storage = null } = {}) {
  const assertAdmin = () => { if (role !== 'admin') throw new Error('Hanya admin pondok yang dapat mengubah isi website.'); };
  const demoKey = 'annahl-demo-site-content-v1';
  const readDemo = () => JSON.parse(storage.getItem(demoKey) || '{}');
  const check = result => {
    if (result.error) {
      if (['42P01', 'PGRST205', 'PGRST202'].includes(result.error.code)) throw new Error('Pengelola halaman belum diaktifkan. Hubungi admin proyek untuk menyiapkannya.');
      if (result.error.code === '40001') throw new Error('Halaman telah diubah pengurus lain. Teks Anda tetap ada; muat versi terbaru sebelum menerbitkan.');
      throw new Error('Perubahan belum berhasil disimpan. Periksa koneksi atau akses akun.');
    }
    return result.data;
  };
  return {
    async load(id) {
      assertAdmin(); if (!ids.has(id)) throw new Error('Halaman tidak dikenal.');
      const rows = storage ? Object.values(readDemo()[id] || {}) : check(await client.from('site_content').select('page_id,state,content,revision,updated_at').eq('page_id', id));
      return { draft: rows.find(row => row.state === 'draft') || null, published: rows.find(row => row.state === 'published') || null };
    },
    async save(id, content, versions, publish = false) {
      assertAdmin(); if (!ids.has(id)) throw new Error('Halaman tidak dikenal.'); validateSiteDocument(content);
      let result;
      if (storage) {
        const all = readDemo(), existing = all[id] || {};
        if ((existing.draft?.revision || 0) !== versions.draft || (existing.published?.revision || 0) !== versions.published) throw new Error('Halaman telah diubah. Muat versi terbaru terlebih dahulu.');
        const row = state => ({ page_id: id, state, content: structuredClone(content), revision: (existing[state]?.revision || 0) + 1, updated_at: new Date().toISOString() });
        all[id] = { draft: row('draft'), ...(existing.published ? { published: existing.published } : {}), ...(publish ? { published: row('published') } : {}) };
        storage.setItem(demoKey, JSON.stringify(all)); result = all[id];
      } else result = check(await client.rpc('save_site_content', { p_page_id: id, p_content: content, p_draft_revision: versions.draft, p_published_revision: versions.published, p_publish: publish }));
      if (!result?.draft || result.draft.page_id !== id || result.draft.state !== 'draft' || result.draft.revision !== versions.draft + 1 || (publish && (result.published?.page_id !== id || result.published.state !== 'published' || result.published.revision !== versions.published + 1))) throw new Error('Penyimpanan belum mendapat tanda terima yang sesuai.');
      return result;
    },
    async history(id) {
      assertAdmin();
      return storage ? [] : check(await client.from('site_content_history').select('id,content,created_at').eq('page_id', id).order('created_at', { ascending: false }).limit(8));
    },
  };
}

export async function readPublishedSiteContent(client) {
  if (!client) return {};
  const { data, error } = await client.from('site_content').select('page_id,content').eq('state', 'published');
  if (error || !Array.isArray(data)) return {};
  return Object.fromEntries(data.filter(row => ids.has(row.page_id)).map(row => [row.page_id, row.content]));
}
