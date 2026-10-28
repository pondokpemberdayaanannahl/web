import { createDriveMedia } from './drive-media.js';
export const PAGE_SIZE = 8;
const tables = { berita: 'berita', foto: 'galeri_foto', video: 'galeri_video' };
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function validateImage(file) {
  if (!file) return;
  if (!imageTypes.has(file.type)) throw new Error('Pilih foto JPG, PNG, WebP, atau GIF.');
  if (file.size > 2 * 1024 * 1024) throw new Error('Ukuran foto maksimal 2 MB.');
}

export function youtubeId(input) {
  const text = input.trim();
  if (/^[\w-]{11}$/.test(text)) return text;
  try {
    const url = new URL(text);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
    let id;
    if (host === 'youtu.be') id = url.pathname.split('/')[1];
    else if (host === 'youtube.com') id = url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})(?:\/|$)/)?.[1];
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}

// Metadata stays in this tab. Binary files stay in memory, never in Web Storage.
export function createDemoStore(storage = sessionStorage) {
  const key = 'annahl-demo-content-v1';
  const examples = ['Kegiatan tahfidz pagi bersama santri', 'Belajar dan bertumbuh di An-Nahl', 'Silaturahmi keluarga besar pesantren'];
  let state;
  try { state = JSON.parse(storage.getItem(key)); } catch { /* Start with clean demo data. */ }
  if (!state || !Object.values(tables).every(table => Array.isArray(state[table]))) {
    state = { berita: examples.map((judul, i) => ({ id: `contoh-${i}`, judul, kategori: ['Keagamaan', 'Akademik', 'Sosial'][i], isi: 'Ini adalah contoh berita untuk mencoba ruang pengurus An-Nahl.\n\nAnda dapat mengedit, melihat pratinjau, atau menghapus cerita ini. Data demo tidak diterbitkan ke website publik.', gambar_url: null, dibuat_pada: new Date(Date.now() - i * 86400000).toISOString() })), galeri_foto: [], galeri_video: [] };
  }
  const blobs = new Set();
  state.history ||= [];
  state.members ||= [{ id: 'demo-admin', display_name: 'Admin demo', role: 'admin', active: true }, { id: 'demo-editor', display_name: 'Penulis demo', role: 'editor', active: true }];
  state.submissions ||= [];
  state.berita.forEach(row => { row.status ||= 'published'; });
  const save = () => storage.setItem(key, JSON.stringify(state, (name, value) => ['gambar_url', 'thumbnail_url'].includes(name) && String(value).startsWith('blob:') ? null : value));
  const rows = type => {
    if (!tables[type]) throw new Error('Jenis konten tidak dikenali.');
    return state[tables[type]];
  };
  return {
    async list(type, { search = '', category = '', status = '', page = 1, limit = PAGE_SIZE } = {}) {
      const filtered = rows(type).filter(row => (type !== 'berita' || (status === 'trash' ? row.deleted_at : !row.deleted_at && (!status || row.status === status))) && (!category || row.kategori === category) && row.judul.toLocaleLowerCase('id').includes(search.toLocaleLowerCase('id'))).sort((a, b) => b.dibuat_pada.localeCompare(a.dibuat_pada));
      return { data: filtered.slice((page - 1) * limit, page * limit), count: filtered.length };
    },
    async counts() { return Object.fromEntries(Object.keys(tables).map(type => [type, rows(type).filter(row => type !== 'berita' || !row.deleted_at && row.status === 'published').length])); },
    async get(type, id) {
      const row = rows(type).find(row => row.id === id);
      if (!row) throw new Error('Konten sudah tidak tersedia.');
      return { ...row };
    },
    async put(type, values, file, existing, { thumbnail, drivePhoto } = {}) {
      validateImage(file);
      const next = { ...existing, ...values, id: existing?.id || crypto.randomUUID(), dibuat_pada: existing?.dibuat_pada || new Date().toISOString(), updated_at: new Date().toISOString() };
      if (type === 'berita') next.status ||= 'published';
      if (type !== 'video') {
        next.gambar_url = existing?.gambar_url || null;
        if (file) { next.gambar_url = URL.createObjectURL(file); blobs.add(next.gambar_url); }
        if (thumbnail) { next.thumbnail_url = URL.createObjectURL(thumbnail); blobs.add(next.thumbnail_url); }
        else if (file) next.thumbnail_url = null;
        if (drivePhoto) { next.gambar_url = drivePhoto.full; next.thumbnail_url = drivePhoto.thumbnail; }
      }
      const list = rows(type);
      const index = list.findIndex(row => row.id === next.id);
      const previous = index >= 0 ? list[index] : null;
      if (index >= 0) list[index] = next;
      else list.unshift(next);
      try { save(); } catch {
        if (previous) list[index] = previous; else list.shift();
        if (file) { URL.revokeObjectURL(next.gambar_url); blobs.delete(next.gambar_url); }
        if (thumbnail) { URL.revokeObjectURL(next.thumbnail_url); blobs.delete(next.thumbnail_url); }
        throw new Error('Penyimpanan demo penuh. Hapus beberapa konten lalu coba lagi.');
      }
      if (type === 'berita') {
        state.history.unshift({ news_id: next.id, action: previous ? 'update' : 'create', actor_name: 'Admin demo', dibuat_pada: next.updated_at, snapshot: { ...next } });
        state.history = state.history.slice(0, 200);
        try { save(); } catch { state.history.shift(); /* Keep future content writes usable when history storage is full. */ }
      }
      return next;
    },
    async remove(type, row) {
      if (type === 'berita') { await this.put(type, { deleted_at: new Date().toISOString() }, null, row); return; }
      const previous = rows(type);
      state[tables[type]] = previous.filter(item => item.id !== row.id);
      try { save(); } catch { state[tables[type]] = previous; throw new Error('Gagal menyimpan perubahan demo.'); }
      if (blobs.has(row.gambar_url)) { URL.revokeObjectURL(row.gambar_url); blobs.delete(row.gambar_url); }
    },
    async restore(row) { return this.put('berita', { deleted_at: null, status: 'draft' }, null, row); },
    async history(id) { return state.history.filter(item => item.news_id === id).slice(0, 20); },
    async members() { return state.members.map(row => ({ ...row })); },
    async submissions(kind, page = 1) {
      const filtered = state.submissions.filter(row => row.kind === kind);
      return { data: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), count: filtered.length };
    },
    async updateSubmission(id, status) {
      const row = state.submissions.find(item => item.id === id);
      if (!row || !['baru', 'diproses', 'selesai'].includes(status)) throw new Error('Status tidak valid.');
      const old = row.status; row.status = status;
      try { save(); } catch (error) { row.status = old; throw error; }
    },
    async updateMember(id, values) {
      const row = state.members.find(item => item.id === id);
      if (!row || !['admin', 'editor'].includes(values.role)) throw new Error('Akun atau peran tidak valid.');
      if (row.id === 'demo-admin' && (values.role !== 'admin' || !values.active)) throw new Error('Akun sendiri tidak dapat dinonaktifkan atau diturunkan perannya.');
      const previous = { ...row };
      Object.assign(row, values);
      try { save(); } catch (error) { Object.assign(row, previous); throw error; }
    },
    dispose() { blobs.forEach(url => URL.revokeObjectURL(url)); blobs.clear(); },
  };
}

export function createSupabaseStore(client, { userId, role = 'editor', media = null } = {}) {
  let library = media;
  const check = result => { if (result.error) throw new Error(result.error.message); return result; };
  return {
    async list(type, { search = '', category = '', status = '', page = 1, limit = PAGE_SIZE } = {}) {
      const fields = type === 'video' ? 'id,judul,kategori,youtube_id,dibuat_pada' : `id,judul,kategori,gambar_url,thumbnail_url,caption,dibuat_pada${type === 'berita' ? ',status,deleted_at,updated_at,author_id' : ''}`;
      let query = client.from(tables[type]).select(fields, { count: 'exact' }).order('dibuat_pada', { ascending: false }).order('id');
      if (type === 'berita') {
        query = status === 'trash' ? query.not('deleted_at', 'is', null) : query.is('deleted_at', null);
        if (status && status !== 'trash') query = query.eq('status', status);
      }
      if (category) query = query.eq('kategori', category);
      if (search) query = query.ilike('judul', `%${search.replace(/[\\%_]/g, '\\$&')}%`);
      return check(await query.range((page - 1) * limit, page * limit - 1));
    },
    async counts() {
      const entries = await Promise.all(Object.entries(tables).map(async ([type, table]) => {
        let query = client.from(table).select('id', { count: 'exact', head: true });
        if (type === 'berita') query = query.eq('status', 'published').is('deleted_at', null);
        return [type, check(await query).count];
      }));
      return Object.fromEntries(entries);
    },
    async get(type, id) { return check(await client.from(tables[type]).select('*').eq('id', id).single()).data; },
    async put(type, values, file, existing, { thumbnail, original, drivePhoto, onProgress } = {}) {
      validateImage(file);
      validateImage(thumbnail);
      if (type !== 'berita' && role !== 'admin') throw new Error('Hanya admin yang dapat mengelola galeri.');
      const payload = { ...values };
      if (type === 'berita') {
        if (role !== 'admin' && (payload.status === 'published' || existing?.status === 'published')) throw new Error('Seorang admin harus menerbitkan berita ini.');
        if (!existing) payload.author_id = userId;
        payload.status ||= existing?.status || 'draft';
      }
      if (type !== 'video') {
        payload.gambar_url = existing?.gambar_url || null;
        payload.thumbnail_url = existing?.thumbnail_url || null;
        const photo = drivePhoto || (file ? await (library ||= createDriveMedia(client)).upload({file,original:original || file,thumbnail:thumbnail || file,onProgress}) : null);
        if (photo) { payload.gambar_url = photo.full; payload.thumbnail_url = photo.thumbnail; }
      }
        let query = existing ? client.from(tables[type]).update(payload).eq('id', existing.id) : client.from(tables[type]).insert(payload);
        if (existing?.updated_at && type === 'berita') query = query.eq('updated_at', existing.updated_at);
        const result = await query.select('id').single();
        if (result.error?.code === 'PGRST116' && existing) throw new Error('Berita telah berubah atau akses diperbarui. Teks Anda tetap ada di editor; buka versi terbaru sebelum menimpa.');
        check(result);
      // Library originals survive post changes/deletion: other posts may reuse them.
    },
    async remove(type, row) {
      if (role !== 'admin') throw new Error('Hanya admin yang dapat menghapus konten.');
      if (type === 'berita') {
        if (role !== 'admin') throw new Error('Hanya admin dapat mengarsipkan berita.');
        check(await client.from('berita').update({ deleted_at: new Date().toISOString() }).eq('id', row.id).select('id').single());
        return;
      }
      check(await client.from(tables[type]).delete().eq('id', row.id).select('id').single());
    },
    async restore(row) {
      if (role !== 'admin') throw new Error('Hanya admin dapat memulihkan berita.');
      check(await client.from('berita').update({ deleted_at: null, status: 'draft' }).eq('id', row.id).select('id').single());
    },
    async history(id) { return check(await client.from('berita_history').select('action,actor_name,dibuat_pada,snapshot').eq('news_id', String(id)).order('dibuat_pada', { ascending: false }).limit(20)).data; },
    async members() { return check(await client.from('pengurus').select('id,display_name,role,active').order('display_name')).data; },
    async submissions(kind, page = 1) {
      return check(await client.from('form_submissions').select('id,kind,payload,status,dibuat_pada', { count: 'exact' }).eq('kind', kind).order('dibuat_pada', { ascending: false }).order('id').range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1));
    },
    async updateSubmission(id, status) {
      if (role !== 'admin' || !['baru', 'diproses', 'selesai'].includes(status)) throw new Error('Perubahan tidak diizinkan.');
      check(await client.from('form_submissions').update({ status }).eq('id', id).select('id').single());
    },
    async updateMember(id, values) {
      if (role !== 'admin' || id === userId) throw new Error('Perubahan akun ini tidak diizinkan.');
      check(await client.from('pengurus').update(values).eq('id', id).select('id').single());
    },
    dispose() {},
  };
}
