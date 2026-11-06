import { galleryImages, photoThumbnail } from './data/photos.js';
import { contentUrl } from './site-content.js';

export const GALLERY_DEMO_KEY = 'annahl-demo-gallery-albums-v1';
export const GALLERY_CATEGORIES = ['Akademik', 'Ibadah', 'Acara', 'Fasilitas', 'Ekskul'];
export const ALBUM_PAGE_SIZE = 12;
export const MAX_ALBUM_PHOTOS = 100;
export function galleryDemoStorage() {
  try { return import.meta.env?.DEV && import.meta.env.VITE_DUMMY_LOGIN_ENABLED==='true' && sessionStorage.getItem('annahl-dummy-user') ? sessionStorage : null; } catch { return null; }
}
const summaryColumns = 'id,judul,kategori,deskripsi,tanggal,status,sampul_url,sampul_thumbnail,photo_count,revision,deleted_at,dibuat_pada,updated_at';
const descriptions = {
  Akademik: 'Kegiatan belajar, pendidikan formal, dan pengembangan pengetahuan santri.',
  Ibadah: 'Momen belajar Al-Quran, ibadah, dan pembinaan keislaman di pondok.',
  Acara: 'Kebersamaan santri, kegiatan pondok, dan silaturahmi keluarga besar An-Nahl.',
  Fasilitas: 'Suasana pondok, keterampilan, dan kegiatan pemberdayaan santri.',
};
export function defaultGalleryAlbums() {
  return GALLERY_CATEGORIES.filter(category => galleryImages.some(photo => photo.category === category)).map((kategori, index) => {
    const photos = galleryImages.filter(photo => photo.category === kategori).map((photo, at) => ({ id:`awal-${index + 1}-${at + 1}`, judul:photo.alt, caption:photo.alt, gambar_url:photo.src, thumbnail_url:photoThumbnail(photo.src) }));
    return albumSummary({ id:`a11a0000-0000-4000-8000-${String(index + 1).padStart(12,'0')}`, judul:`${kategori} di An-Nahl`, kategori, deskripsi:descriptions[kategori], tanggal:null, photos, sampul_id:photos[0].id, status:'published', revision:1, deleted_at:null, dibuat_pada:'2026-11-06T00:00:00Z', updated_at:'2026-11-06T00:00:00Z' });
  });
}
export function normalizeGalleryAlbum(input) {
  const text = (value, max, label, required = false) => {
    if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error(`Periksa ${label}.`);
    return value.trim();
  };
  const judul = text(input.judul,140,'judul album',true), kategori = text(input.kategori,60,'kategori',true);
  if (!GALLERY_CATEGORIES.includes(kategori)) throw new Error('Pilih kategori album yang tersedia.');
  const deskripsi = text(input.deskripsi || '',4000,'cerita album');
  const tanggal = input.tanggal || null;
  if (tanggal && (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal) || Number.isNaN(Date.parse(tanggal)) || new Date(tanggal).toISOString().slice(0,10) !== tanggal)) throw new Error('Periksa tanggal kegiatan.');
  const status = input.status || 'draft';
  if (!['draft','published'].includes(status)) throw new Error('Status album tidak sesuai.');
  if (!Array.isArray(input.photos) || input.photos.length > MAX_ALBUM_PHOTOS) throw new Error(`Satu album maksimal ${MAX_ALBUM_PHOTOS} foto.`);
  if (status === 'published' && !input.photos.length) throw new Error('Tambahkan minimal satu foto sebelum menerbitkan album.');
  const ids = new Set(), urls = new Set();
  const photos = input.photos.map(photo => {
    if (typeof photo.id !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(photo.id) || ids.has(photo.id)) throw new Error('Ada foto ganda di album.');
    const gambar_url = contentUrl(photo.gambar_url,'image'), thumbnail_url = contentUrl(photo.thumbnail_url || photo.gambar_url,'image');
    if (!gambar_url || !thumbnail_url || urls.has(gambar_url)) throw new Error('Foto tidak valid atau sudah ditambahkan ke album.');
    ids.add(photo.id);urls.add(gambar_url);
    return {id:photo.id,judul:text(photo.judul || '',140,'judul foto'),caption:text(photo.caption || '',800,'keterangan foto'),gambar_url,thumbnail_url};
  });
  const sampul_id = input.sampul_id || photos[0]?.id || null;
  if (sampul_id && !ids.has(sampul_id)) throw new Error('Pilih foto sampul dari album ini.');
  return {judul,kategori,deskripsi,tanggal,status,photos,sampul_id};
}
export function albumSummary(album) {
  const cover = album.photos?.find(photo => photo.id === album.sampul_id) || album.photos?.[0];
  return {...album,photo_count:album.photos?.length ?? album.photo_count ?? 0,sampul_url:cover?.gambar_url || album.sampul_url || '',sampul_thumbnail:cover?.thumbnail_url || album.sampul_thumbnail || cover?.gambar_url || ''};
}
export function createGalleryAlbumStore(client, {storage=null,role='admin',publicOnly=false} = {}) {
  const read = () => {
    if (!storage) return defaultGalleryAlbums();
    const raw = storage.getItem(GALLERY_DEMO_KEY);
    if (raw === null) return defaultGalleryAlbums();
    const rows = JSON.parse(raw);
    if (!Array.isArray(rows)) throw new Error('Album demo belum dapat dibaca.');
    return rows;
  };
  const check = result => {
    if (result.error) {
      const error = new Error(['42P01','PGRST205','PGRST202'].includes(result.error.code) ? 'Pengelola album belum diaktifkan di server.' : result.error.code === '40001' ? 'Album sudah diubah pengurus lain. Muat versi terbaru sebelum menyimpan.' : 'Album belum berhasil disimpan atau dimuat. Periksa koneksi dan akses akun.');
      error.code=result.error.code;throw error;
    }
    return result.data;
  };
  const admin = () => { if (role !== 'admin' || publicOnly) throw new Error('Hanya admin yang dapat mengelola album.'); };
  return {
    async list({search='',category='',status='',page=1,limit=ALBUM_PAGE_SIZE}={}) {
      if (storage || !client) {
        const rows=read().filter(row=>(status==='trash' ? row.deleted_at : !row.deleted_at && (!status || row.status===status)) && (!publicOnly || row.status==='published' && !row.deleted_at) && (!category || row.kategori===category) && row.judul.toLocaleLowerCase('id').includes(search.toLocaleLowerCase('id'))).sort((a,b)=>b.dibuat_pada.localeCompare(a.dibuat_pada)||a.id.localeCompare(b.id));
        return {data:rows.slice((page-1)*limit,page*limit).map(albumSummary),count:rows.length};
      }
      let query=client.from('galeri_album').select(summaryColumns,{count:'exact'}).order('dibuat_pada',{ascending:false}).order('id');
      query=status==='trash' ? query.not('deleted_at','is',null) : query.is('deleted_at',null);
      if (publicOnly || status && status!=='trash') query=query.eq('status',publicOnly ? 'published' : status);
      if (category) query=query.eq('kategori',category);
      if (search) query=query.ilike('judul',`%${search.replace(/[\\%_]/g,'\\$&')}%`);
      const result=await query.range((page-1)*limit,page*limit-1);check(result);
      const data=result.data || [],minimum=(page-1)*limit+data.length;
      return {data,count:Math.max(result.count ?? minimum+(data.length===limit ? 1 : 0),minimum)};
    },
    async get(id) {
      if (storage || !client) {
        const row=read().find(album=>album.id===id && (!publicOnly || !album.deleted_at && album.status==='published'));
        if (!row) throw new Error('Album sudah tidak tersedia.');return structuredClone(row);
      }
      let query=client.from('galeri_album').select('*').eq('id',id);
      if (publicOnly) query=query.eq('status','published').is('deleted_at',null);
      return check(await query.single());
    },
    async save(input,existing=null) {
      admin();const values=normalizeGalleryAlbum(input),id=existing?.id || crypto.randomUUID(),revision=existing?.revision || 0;
      let saved;
      if (storage) {
        const rows=read(),at=rows.findIndex(album=>album.id===id);
        if ((at<0 ? 0 : rows[at].revision)!==revision) throw new Error('Album sudah berubah. Muat versi terbaru.');
        saved=albumSummary({...existing,...values,id,revision:revision+1,deleted_at:null,dibuat_pada:existing?.dibuat_pada || new Date().toISOString(),updated_at:new Date().toISOString()});
        if (at<0) rows.unshift(saved);else rows[at]=saved;
        storage.setItem(GALLERY_DEMO_KEY,JSON.stringify(rows));
      } else saved=check(await client.rpc('save_gallery_album',{p_id:id,p_revision:revision,p_album:values}));
      if (!saved || saved.id!==id || saved.revision!==revision+1) throw new Error('Penyimpanan album belum mendapat konfirmasi yang sesuai.');
      return saved;
    },
    async archive(existing,archived=true) {
      admin();let saved;
      if (storage) {
        const rows=read(),at=rows.findIndex(album=>album.id===existing.id);
        if (at<0 || rows[at].revision!==existing.revision) throw new Error('Album sudah berubah. Muat versi terbaru.');
        saved={...rows[at],status:archived ? rows[at].status : 'draft',deleted_at:archived ? new Date().toISOString() : null,revision:existing.revision+1,updated_at:new Date().toISOString()};rows[at]=saved;
        storage.setItem(GALLERY_DEMO_KEY,JSON.stringify(rows));
      } else saved=check(await client.rpc('archive_gallery_album',{p_id:existing.id,p_revision:existing.revision,p_archived:archived}));
      if (!saved || saved.id!==existing.id || saved.revision!==existing.revision+1) throw new Error('Perubahan album belum dikonfirmasi.');return saved;
    },
  };
}
