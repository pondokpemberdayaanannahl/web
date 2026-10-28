import { PAGE_SIZE, createDemoStore, createSupabaseStore, validateImage, youtubeId } from './admin-data.js';
import { renderBody, safeUrl } from './content-format.js';
import { draftKey, saveDraft, readDraft, optimizeImage } from './editor-tools.js';
import { loadPhotoLibrary, filterPhotoLibrary, LIBRARY_PAGE_SIZE } from './photo-library.js';
import { readAuthFlow } from './auth-flow.js';
import { demoEnabled, demoUser, backendConfigured, getClient, authorizedUser, loginPath } from './admin-session.js';
import { RECAP_URL, getGoogleFormToken } from './google-forms.js';
import './styles/admin-content.css';

const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const safeImage = value => {
  if (!value || typeof value !== 'string') return '';
  try { const url = new URL(value, location.origin); return ['https:', 'http:', 'blob:'].includes(url.protocol) ? escape(url.href) : ''; } catch { return ''; }
};
const formatDate = value => new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' });
let store, isDemo = false, currentPanel = 'overview', mediaType = 'foto';
let newsPage = 1, mediaPage = 1, newsCount = 0, mediaCount = 0;
let newsRequest = 0, mediaRequest = 0, summaryRequest = 0;
let editorType = 'berita', editedRow = null, dirty = false, saving = false, previewUrl = null;
let searchTimer, toastTimer;
let currentUser = '', currentUserId = '', currentRole = 'editor';
let draftTimer, activeDraftKey = '', draftStored = false, imageProcessing = false, imageSequence = 0, processedImage = null;
let historyRows = [], historyTarget = null;
let inboxPage = 1, inboxCount = 0, inboxRequest = 0;
let libraryRows = [], filteredLibrary = [], libraryImageIndex = -1, librarySearchTimer;
let websiteManager = null, websiteManagerLoading = null, requestedSitePage = null;
const labels = { overview: 'Ringkasan', berita: 'Postingan berita', galeri: 'Galeri', halaman: 'Isi website', pendaftaran: 'Pendaftaran', program: 'Program', donasi: 'Donasi', kontak: 'Pesan masuk' };
const categories = { berita: ['Akademik', 'Keagamaan', 'Sosial', 'Pengumuman'], foto: ['Akademik', 'Ibadah', 'Acara', 'Fasilitas'], video: ['Profil', 'Acara', 'Kegiatan'] };

function toast(message, error = false) {
  clearTimeout(toastTimer);
  $('toast').textContent = message;
  $('toast').className = `toast${error ? ' error' : ''}`;
  $('toast').hidden = false;
  toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4500);
}
function empty(title, description, action = '') {
  return `<div class="empty-state"><span aria-hidden="true">◇</span><h3>${escape(title)}</h3><p>${escape(description)}</p>${action}</div>`;
}
function loading(id) { $(id).innerHTML = empty('Memuat konten…', 'Sebentar, cerita sedang disiapkan.'); }
function failure(id) { $(id).innerHTML = empty('Konten belum dapat dimuat.', 'Periksa koneksi lalu coba lagi.', '<button class="button secondary compact" data-action="refresh">Coba lagi</button>'); }
function cover(row, className = 'row-cover') {
  const src = safeImage(row.thumbnail_url || row.gambar_url);
  return src ? `<img src="${src}" alt="" class="${className}" loading="lazy" decoding="async" />` : `<span class="${className} cover-placeholder" aria-hidden="true">N</span>`;
}
function newsRow(row, compact = false) {
  const id = escape(row.id);
  const canEdit = currentRole === 'admin' || row.author_id === currentUserId && row.status === 'draft';
  const status = row.deleted_at ? 'Diarsipkan' : row.status === 'draft' ? 'Draft' : 'Terbit';
  const actions = row.deleted_at
    ? currentRole === 'admin' ? `<button class="row-action" data-restore="${id}" data-type="berita">Pulihkan ke draft</button>` : ''
    : `${canEdit ? `<button class="row-action" data-edit="${id}" data-type="berita" aria-label="Edit ${escape(row.judul)}">Edit</button>` : ''}<button class="row-action" data-history="${id}" data-type="berita">Riwayat</button>${currentRole === 'admin' ? `<button class="row-action danger" data-delete="${id}" data-type="berita">Hapus</button>` : ''}`;
  return `<article class="post-card${compact ? ' post-card-compact' : ''}"><header class="post-card-header"><span class="post-avatar" aria-hidden="true"><img src="/brand/an-nahl.png" alt="" width="678" height="366" decoding="async" /></span><div><strong>Postingan An-Nahl</strong><time>${formatDate(row.updated_at || row.dibuat_pada)}</time></div><span class="status-label">${status}</span></header>${row.gambar_url || row.thumbnail_url ? cover(row, 'post-cover') : ''}<div class="post-card-body"><span class="category">${escape(row.kategori)}</span><h3>${escape(row.judul)}</h3>${row.caption ? `<p>${escape(row.caption)}</p>` : ''}${isDemo ? '<small>Contoh di ruang demo</small>' : ''}</div><footer class="post-card-actions"><button class="row-action" data-view="${id}" data-type="berita">Lihat postingan</button>${actions}</footer></article>`;
}
function mediaCard(row) {
  // YouTube thumbnails are loaded only when the video tab is opened.
  const thumbnail = /^[\w-]{11}$/.test(row.youtube_id || '') ? `https://img.youtube.com/vi/${row.youtube_id}/mqdefault.jpg` : null;
  const image = mediaType === 'video' ? { ...row, gambar_url: thumbnail } : row;
  return `<div class="media-card">${cover(image, 'media-cover')}<div class="media-info"><span class="category">${escape(row.kategori)}</span><h3>${escape(row.judul)}</h3><div class="row-actions"><button class="row-action" data-edit="${escape(row.id)}" data-type="${mediaType}" aria-label="Edit ${escape(row.judul)}">Edit</button><button class="row-action danger" data-delete="${escape(row.id)}" data-type="${mediaType}" aria-label="Hapus ${escape(row.judul)}">Hapus</button></div></div></div>`;
}
function pagination(prefix, page, count, pageSize = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  $(`${prefix}-page-info`).textContent = count ? `Halaman ${page} dari ${pages} · ${count} konten` : 'Belum ada konten';
  $(`${prefix}-prev`).disabled = page <= 1;
  $(`${prefix}-next`).disabled = page >= pages;
}
async function loadSummary() {
  if (!store) return;
  const source = store, request = ++summaryRequest;
  loading('recent-news');
  const [counts, recent] = await Promise.allSettled([source.counts(), source.list('berita', { limit: 4, status: 'published' })]);
  if (store !== source || request !== summaryRequest) return;
  if (counts.status === 'fulfilled') {
    $('stat-news').textContent = counts.value.berita;
    $('stat-photos').textContent = counts.value.foto;
    $('stat-videos').textContent = counts.value.video;
    $('nav-news-count').textContent = counts.value.berita;
  } else {
    for (const id of ['stat-news', 'stat-photos', 'stat-videos']) $(id).textContent = '—';
    toast('Ringkasan belum dapat dimuat. Coba muat ulang.', true);
  }
  if (recent.status === 'fulfilled') $('recent-news').innerHTML = recent.value.data.map(row => newsRow(row, true)).join('') || empty('Cerita pertama menanti.', 'Mulai bagikan kabar baik dari pesantren.', '<button class="button compact" data-action="new-news">Tulis berita</button>');
  else failure('recent-news');
}
async function loadNews() {
  if (!store) return;
  const source = store, request = ++newsRequest;
  $('news-prev').disabled = $('news-next').disabled = true;
  loading('daftar-berita');
  try {
    const result = await source.list('berita', { search: $('news-search').value.trim(), category: $('news-filter').value, status: $('news-status').value, page: newsPage });
    if (source !== store || request !== newsRequest) return;
    newsCount = result.count || 0;
    if (newsPage > 1 && !result.data.length) { newsPage = Math.max(1, Math.ceil(newsCount / PAGE_SIZE)); return loadNews(); }
    $('daftar-berita').innerHTML = result.data.map(row => newsRow(row)).join('') || empty('Belum ada cerita di sini.', 'Coba kata kunci lain atau buat berita baru.', '<button class="button compact" data-action="new-news">Tulis berita</button>');
    pagination('news', newsPage, newsCount);
  } catch { if (source === store && request === newsRequest) { failure('daftar-berita'); $('news-page-info').textContent = 'Gagal memuat'; } }
}
async function loadMedia() {
  if (!store) return;
  const source = store, type = mediaType, request = ++mediaRequest;
  $('media-prev').disabled = $('media-next').disabled = true;
  loading('media-list');
  try {
    if (type === 'library') {
      libraryRows = await loadPhotoLibrary();
      if (source !== store || request !== mediaRequest) return;
      const folder = $('library-folder').value;
      $('library-folder').innerHTML = '<option value="">Semua folder</option>' + [...new Set(libraryRows.map(row => row.folder))].sort((a, b) => a.localeCompare(b, 'id')).map(value => `<option value="${escape(value)}">${escape(value)}</option>`).join('');
      $('library-folder').value = folder;
      filteredLibrary = filterPhotoLibrary(libraryRows, $('library-search').value, folder, $('library-sort').value || 'folder');
      mediaCount = filteredLibrary.length;
      mediaPage = Math.min(mediaPage, Math.max(1, Math.ceil(mediaCount / LIBRARY_PAGE_SIZE)));
      $('media-count').textContent = `${mediaCount} dari ${libraryRows.length} foto folder`;
      const page = filteredLibrary.slice((mediaPage - 1) * LIBRARY_PAGE_SIZE, mediaPage * LIBRARY_PAGE_SIZE);
      $('media-list').innerHTML = page.length ? `<div class="media-grid library-grid">${page.map(localPhotoCard).join('')}</div>` : empty('Foto belum ditemukan.', 'Coba nama kegiatan lain atau reset filter folder.');
      pagination('media', mediaPage, mediaCount, LIBRARY_PAGE_SIZE);
      return;
    }
    const result = await source.list(type, { page: mediaPage });
    if (source !== store || request !== mediaRequest) return;
    mediaCount = result.count || 0;
    if (mediaPage > 1 && !result.data.length) { mediaPage = Math.max(1, Math.ceil(mediaCount / PAGE_SIZE)); return loadMedia(); }
    $('media-count').textContent = `${mediaCount} ${type}`;
    $('media-list').innerHTML = result.data.length ? `<div class="media-grid">${result.data.map(mediaCard).join('')}</div>` : empty(`Belum ada ${type}.`, `Tambahkan dokumentasi ${type} kegiatan pesantren.`, '<button class="button compact" data-action="new-media">Tambah dokumentasi</button>');
    pagination('media', mediaPage, mediaCount);
  } catch { if (source === store && request === mediaRequest) { failure('media-list'); $('media-page-info').textContent = 'Gagal memuat'; } }
}
function setMedia(type) {
  mediaType = type;
  mediaPage = 1;
  for (const kind of ['library', 'foto', 'video']) { $(`tab-${kind}`).classList.toggle('selected', type === kind); $(`tab-${kind}`).setAttribute('aria-pressed', String(type === kind)); }
  $('library-tools').hidden = type !== 'library';
  $('add-media').textContent = type === 'library' ? '＋ Unggah foto' : `＋ Tambah ${type}`;
}
function navigate(panel, focus = true) {
  if (panel === 'program') { requestedSitePage = 'program'; panel = 'halaman'; }
  if (!store || !labels[panel]) return;
  if (currentPanel === 'halaman' && panel !== 'halaman' && websiteManager?.dirty && !confirm('Ada perubahan halaman yang belum diterbitkan. Pindah menu? Teks tetap tersimpan di perangkat ini.')) return;
  if (currentPanel !== panel) inboxPage = 1;
  currentPanel = panel;
  document.querySelectorAll('#admin-nav [data-panel]').forEach(button => {
    const active = button.dataset.panel === panel;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  });
  for (const id of ['overview', 'berita', 'galeri', 'halaman', 'upcoming']) $(`panel-${id}`).hidden = id !== (['overview', 'berita', 'galeri', 'halaman'].includes(panel) ? panel : 'upcoming');
  $('breadcrumb-current').textContent = labels[panel];
  $('submission-surface').hidden = true;
  $('upcoming-card').hidden = false;
  document.title = `${labels[panel]} — Ruang Pengurus An-Nahl`;
  if (panel === 'overview') loadSummary();
  else if (panel === 'berita') loadNews();
  else if (panel === 'galeri') loadMedia();
  else if (panel === 'halaman') loadWebsiteManager();
  else {
    $('upcoming-title').textContent = labels[panel];
    if (['pendaftaran', 'kontak', 'donasi'].includes(panel) && currentRole === 'admin') { $('upcoming-card').hidden = true; $('submission-surface').hidden = false; loadInbox(); }
    else $('upcoming-description').textContent = panel === 'program' ? 'Informasi program masih dikelola melalui halaman website.' : 'Kotak masuk berisi data pribadi dan hanya dapat dibuka oleh admin pondok.';
  }
  if (focus) $('workspace-main').focus({ preventScroll: true });
}
async function loadWebsiteManager() {
  if (currentRole !== 'admin') { $('website-manager').innerHTML = empty('Khusus admin pondok.', 'Penulis dapat menyiapkan postingan melalui menu Berita.'); return; }
  if (websiteManager) { if (requestedSitePage) { const page = requestedSitePage; requestedSitePage = null; websiteManager.open(page); } return; }
  if (websiteManagerLoading) return;
  const source = store;
  loading('website-manager');
  websiteManagerLoading = (async () => {
    try {
      const [{ mountWebsiteManager }, client] = await Promise.all([import('./site-content-admin.js'), isDemo ? Promise.resolve(null) : getClient()]);
      if (store !== source) return;
      websiteManager = mountWebsiteManager({ host: $('website-manager'), client, demo: isDemo, userId: currentUserId, role: currentRole, notify: toast });
      if (requestedSitePage) { const page = requestedSitePage; requestedSitePage = null; await websiteManager.open(page); }
    } catch { if (store === source) $('website-manager').innerHTML = empty('Editor halaman belum dapat dibuka.', 'Muat ulang halaman atau periksa koneksi internet.'); }
    finally { websiteManagerLoading = null; }
  })();
  await websiteManagerLoading;
}
function openDashboard(user, demo) {
  websiteManager?.dispose(); websiteManager = null;
  store?.dispose();
  isDemo = demo;
  currentUserId = demo ? 'demo-admin' : user.id;
  currentUser = demo ? demoUser : user.id;
  currentRole = demo ? 'admin' : user.profile.role;
  store = demo ? createDemoStore() : createSupabaseStore(user.client, { userId: currentUserId, role: currentRole });
  const name = demo ? demoUser : user.profile.display_name || user.email?.split('@')[0] || 'Pengurus';
  $('user-name').textContent = name;
  $('user-avatar').textContent = name.slice(0, 1).toUpperCase();
  $('user-email').textContent = demo ? 'Akun demo lokal' : user.email;
  $('overview-title').textContent = `Selamat datang, ${name}.`;
  $('connection-badge').textContent = demo ? 'Mode demo · Admin' : currentRole === 'admin' ? 'Admin' : 'Penulis';
  $('accounts-open').hidden = currentRole !== 'admin';
  $('dashboard-view').dataset.role = currentRole;
  $('add-media').hidden = currentRole !== 'admin';
  $('demo-notice').hidden = !demo;
  $('today').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });
  $('session-status').hidden = true;
  $('dashboard-view').hidden = false;
  newsPage = mediaPage = 1;
  $('news-search').value = $('news-filter').value = $('news-status').value = '';
  setMedia('library');
  navigate('overview');
  try {
    const page = new URL(location.href || location.origin).searchParams.get('page');
    if (page && currentRole === 'admin' && ['beranda','tentang','program','pendaftaran','donasi','kontak','berita','galeri','global'].includes(page)) { requestedSitePage = page; navigate('halaman'); }
  } catch { /* An invalid optional deep link does not block the dashboard. */ }
}
$('logout-btn').addEventListener('click', async () => {
  if (websiteManager?.dirty && !confirm('Keluar dengan perubahan halaman yang belum diterbitkan? Salinan teks tetap tersimpan di perangkat ini.')) return;
  $('logout-btn').disabled = true;
  try {
    if (!isDemo) { const { error } = await (await getClient()).auth.signOut(); if (error) throw error; }
    sessionStorage.removeItem('annahl-dummy-user');
    clearTimeout(draftTimer);
    websiteManager?.dispose(); websiteManager = null; requestedSitePage = null;
    store?.dispose(); store = null;
    ++newsRequest; ++mediaRequest; ++summaryRequest;
    for (const id of ['recent-news', 'daftar-berita', 'media-list']) $(id).replaceChildren();
    $('dashboard-view').hidden = true;
    location.replace('/login.html');
  } catch { toast('Belum berhasil keluar. Coba lagi.', true); }
  finally { $('logout-btn').disabled = false; }
});
function resetPreview() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  $('image-preview').removeAttribute('src');
  $('image-preview').hidden = true;
}
function updateCounters() {
  $('title-count').textContent = `${$('judul').value.length}/180`;
  $('word-count').textContent = `${$('isi').value.trim().split(/\s+/).filter(Boolean).length} kata`;
}
function openEditor(type = 'berita', row = null) {
  editorType = type; editedRow = row; dirty = false;
  $('editor-form').reset(); resetPreview();
  processedImage = null; imageProcessing = false; ++imageSequence;
  $('save-btn').disabled = $('draft-btn').disabled = false;
  activeDraftKey = type === 'berita' ? draftKey(currentUser, isDemo, row?.id) : '';
  draftStored = false; $('autosave-status').textContent = '';
  $('editor-message').textContent = '';
  $('editor-title').textContent = `${row ? 'Edit' : type === 'berita' ? 'Tulis' : 'Tambah'} ${type}`;
  $('save-btn').textContent = type === 'berita' ? currentRole === 'admin' ? 'Terbitkan berita' : 'Simpan draft' : `Simpan ${type}`;
  $('draft-btn').hidden = type !== 'berita' || currentRole !== 'admin';
  $('caption-field').hidden = type === 'video';
  $('kategori').innerHTML = categories[type].map(category => `<option>${category}</option>`).join('');
  $('body-field').hidden = type !== 'berita';
  $('isi').disabled = type !== 'berita'; $('isi').required = type === 'berita';
  $('image-field').hidden = type === 'video'; $('gambar').disabled = type === 'video';
  $('gambar').required = type === 'foto' && !row;
  $('photo-optional').textContent = type === 'foto' ? '(wajib)' : '(opsional)';
  $('video-field').hidden = type !== 'video'; $('video-link').disabled = type !== 'video'; $('video-link').required = type === 'video';
  $('preview-btn').hidden = type !== 'berita';
  $('existing-image-note').hidden = !row?.gambar_url;
  if (row) {
    $('judul').value = row.judul; $('kategori').value = row.kategori;
    $('isi').value = row.isi || ''; $('video-link').value = row.youtube_id ? `https://youtu.be/${row.youtube_id}` : '';
    $('image-caption').value = row.caption || '';
    const src = safeImage(row.gambar_url);
    if (src) { $('image-preview').src = row.gambar_url; $('image-preview').hidden = false; }
  }
  if (activeDraftKey) {
    const draft = readDraft(localStorage, activeDraftKey);
    if (draft && (!row?.updated_at || Date.parse(draft.savedAt) > Date.parse(row.updated_at)) && confirm('Ada tulisan yang tersimpan otomatis di browser. Pulihkan teksnya? Foto perlu dipilih kembali.')) {
      $('judul').value = draft.judul; $('isi').value = draft.isi;
      if (categories.berita.includes(draft.kategori)) $('kategori').value = draft.kategori;
      $('image-caption').value = draft.caption || '';
      dirty = true; draftStored = true;
      $('autosave-status').textContent = 'Teks dipulihkan dari browser. Foto unggahan perlu dipilih kembali.';
    }
  }
  updateCounters();
  $('editor-dialog').showModal();
}
function closeEditor() {
  if (saving) return;
  if (dirty && editorType === 'berita') persistDraft();
  if (dirty && !confirm(draftStored ? 'Tutup editor? Teks tersimpan otomatis, tetapi foto belum tersimpan.' : 'Tutup editor? Perubahan yang belum disimpan akan hilang.')) return;
  $('editor-dialog').close();
}
$('editor-dialog').addEventListener('cancel', event => { event.preventDefault(); closeEditor(); });
$('editor-dialog').addEventListener('close', () => { clearTimeout(draftTimer); ++imageSequence; dirty = false; resetPreview(); processedImage = null; });
$('editor-close').addEventListener('click', closeEditor);
$('editor-cancel').addEventListener('click', closeEditor);
function persistDraft() {
  clearTimeout(draftTimer);
  if (!activeDraftKey || !dirty || saving) return;
  try {
    saveDraft(localStorage, activeDraftKey, { judul: $('judul').value, isi: $('isi').value, kategori: $('kategori').value, caption: $('image-caption').value });
    draftStored = true;
    $('autosave-status').textContent = 'Teks tersimpan di browser · foto belum tersimpan';
  } catch { draftStored = false; $('autosave-status').textContent = 'Autosave gagal. Simpan draft sebelum menutup halaman.'; }
}
$('editor-form').addEventListener('input', () => { dirty = true; draftStored = false; updateCounters(); clearTimeout(draftTimer); draftTimer = setTimeout(persistDraft, 650); });
$('gambar').addEventListener('change', async () => {
  dirty = true; resetPreview(); $('editor-message').textContent = '';
  const file = $('gambar').files[0];
  const sequence = ++imageSequence;
  processedImage = null;
  if (!file) return;
  imageProcessing = true; $('save-btn').disabled = $('draft-btn').disabled = true;
  $('editor-message').textContent = 'Mengoptimalkan foto…';
  try {
    const result = await optimizeImage(file);
    if (sequence !== imageSequence) return;
    processedImage = result;
    previewUrl = URL.createObjectURL(result.file); $('image-preview').src = previewUrl; $('image-preview').hidden = false;
    $('editor-message').textContent = result.note;
  } catch (error) { if (sequence === imageSequence) { $('editor-message').textContent = error.message; $('gambar').value = ''; } }
  finally { if (sequence === imageSequence) { imageProcessing = false; $('save-btn').disabled = $('draft-btn').disabled = false; } }
});
$('preview-btn').addEventListener('click', () => {
  const image = safeImage(previewUrl || editedRow?.gambar_url);
  $('preview-content').innerHTML = `${image ? `<figure><img src="${image}" alt="Pratinjau foto berita" /><figcaption>${escape($('image-caption').value)}</figcaption></figure>` : ''}<span class="category">${escape($('kategori').value)}</span><h1 id="preview-title">${escape($('judul').value.trim() || 'Judul berita Anda')}</h1>${renderBody($('isi').value)}`;
  $('preview-dialog').showModal();
});
$('preview-close').addEventListener('click', () => $('preview-dialog').close());
$('preview-content').addEventListener('click', event => {
  const button = event.target.closest('[data-revision]');
  if (!button || currentRole !== 'admin') return;
  const revision = historyRows[Number(button.dataset.revision)];
  if (!revision || !historyTarget) return;
  $('preview-dialog').close();
  openEditor('berita', historyTarget);
  $('judul').value = revision.snapshot.judul || '';
  $('isi').value = revision.snapshot.isi || '';
  $('kategori').value = revision.snapshot.kategori || categories.berita[0];
  $('image-caption').value = revision.snapshot.caption || '';
  dirty = true; updateCounters(); persistDraft();
  $('editor-message').textContent = 'Teks versi lama dimuat. Periksa lalu simpan sebagai draft atau terbitkan; foto saat ini tetap dipakai.';
});
$('editor-form').addEventListener('click', event => {
  const button = event.target.closest('[data-format]');
  if (!button) return;
  const field = $('isi'), start = field.selectionStart, end = field.selectionEnd;
  let text = field.value.slice(start, end), replacement;
  if (button.dataset.format === 'bold') replacement = `**${text || 'teks tebal'}**`;
  if (button.dataset.format === 'link') {
    const url = prompt('Masukkan tautan (https://…)', 'https://');
    if (!url) return;
    if (!safeUrl(url) || !/^https?:\/\//.test(url)) { $('editor-message').textContent = 'Gunakan tautan http atau https yang valid.'; return; }
    replacement = `[${text || 'teks tautan'}](${url})`;
  }
  if (button.dataset.format === 'heading' || button.dataset.format === 'list') {
    const lineStart = field.value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const lineEnd = field.value.indexOf('\n', end);
    const until = lineEnd < 0 ? field.value.length : lineEnd;
    const prefix = button.dataset.format === 'heading' ? '## ' : '- ';
    field.setSelectionRange(lineStart, until);
    text = field.value.slice(lineStart, until) || (prefix === '## ' ? 'Subjudul' : 'Item daftar');
    replacement = text.split('\n').map(line => prefix + line).join('\n');
  }
  if (replacement === undefined) return;
  field.setRangeText(replacement, field.selectionStart, field.selectionEnd, 'end');
  field.focus(); dirty = true; draftStored = false; updateCounters();
  clearTimeout(draftTimer); draftTimer = setTimeout(persistDraft, 650);
});
async function loadMembers() {
  if (!store || currentRole !== 'admin') return;
  const source = store;
  loading('accounts-list');
  try {
    const members = await source.members();
    if (source !== store) return;
    $('accounts-list').innerHTML = members.map(member => `<div class="content-row member-row"><div class="row-info"><h3>${escape(member.display_name || 'Pengurus')}</h3><p class="muted">${member.id === currentUserId ? 'Akun Anda' : escape(member.id)}</p></div><label class="sr-only" for="member-role-${escape(member.id)}">Peran ${escape(member.display_name)}</label><select id="member-role-${escape(member.id)}" ${member.id === currentUserId ? 'disabled' : ''}><option value="editor" ${member.role === 'editor' ? 'selected' : ''}>Penulis</option><option value="admin" ${member.role === 'admin' ? 'selected' : ''}>Admin</option></select><label class="member-active"><input id="member-active-${escape(member.id)}" type="checkbox" ${member.active ? 'checked' : ''} ${member.id === currentUserId ? 'disabled' : ''} /> Aktif</label>${member.id === currentUserId ? '' : `<button type="button" class="button secondary compact" data-member-save="${escape(member.id)}">Simpan</button>`}</div>`).join('');
  } catch { $('accounts-list').innerHTML = empty('Akun belum dapat dimuat.', 'Periksa koneksi dan pastikan migrasi database sudah diterapkan.'); }
}
$('accounts-open').addEventListener('click', () => { if (currentRole !== 'admin') return; $('accounts-dialog').showModal(); loadMembers(); });
$('accounts-close').addEventListener('click', () => $('accounts-dialog').close());
$('accounts-list').addEventListener('click', async event => {
  const button = event.target.closest('[data-member-save]');
  if (!button || currentRole !== 'admin') return;
  const id = button.dataset.memberSave;
  const values = { role: $(`member-role-${id}`).value, active: $(`member-active-${id}`).checked };
  if (!confirm('Simpan perubahan hak akses akun ini?')) return;
  button.disabled = true;
  try { await store.updateMember(id, values); toast('Hak akses diperbarui.'); loadMembers(); }
  catch (error) { toast(error.message, true); }
  finally { button.disabled = false; }
});
async function submitContent(event, status = 'published') {
  event.preventDefault();
  if (saving || imageProcessing || !store) return;
  $('editor-message').textContent = '';
  const values = { judul: $('judul').value.trim(), kategori: $('kategori').value };
  if (!values.judul) { $('editor-message').textContent = 'Judul belum diisi.'; return; }
  if (editorType === 'berita') { values.isi = $('isi').value.trim(); if (!values.isi && currentRole === 'admin' && status === 'published') { $('editor-message').textContent = 'Tuliskan isi berita sebelum menerbitkan.'; return; } }
  if (editorType !== 'video') values.caption = $('image-caption').value.trim();
  if (editorType === 'berita') values.status = currentRole === 'admin' ? status : 'draft';
  if (editorType === 'video') { values.youtube_id = youtubeId($('video-link').value); if (!values.youtube_id) { $('editor-message').textContent = 'Gunakan link YouTube yang valid.'; return; } }
  const button = $('save-btn'), previousText = button.textContent;
  if (editorType === 'berita') persistDraft();
  saving = true; button.disabled = true; button.textContent = 'Menyimpan…';
  const source = store;
  const controls = [...$('editor-form').elements].map(control => [control, control.disabled]);
  controls.forEach(([control]) => { control.disabled = true; });
  try {
    await source.put(editorType, values, processedImage?.file || $('gambar').files[0], editedRow, { thumbnail: processedImage?.thumbnail });
    clearTimeout(draftTimer);
    if (activeDraftKey) { try { localStorage.removeItem(activeDraftKey); } catch { /* Saved server content remains authoritative. */ } }
    dirty = false; $('editor-dialog').close();
    toast(isDemo ? 'Tersimpan di ruang demo. Tidak diterbitkan ke website.' : 'Konten berhasil disimpan.');
    if (currentPanel === 'overview') loadSummary();
    else { loadSummary(); if (currentPanel === 'berita') loadNews(); if (currentPanel === 'galeri') loadMedia(); }
  } catch (error) { $('editor-message').textContent = `Gagal menyimpan. ${error.message}`; }
  finally {
    saving = false;
    controls.forEach(([control, disabled]) => { control.disabled = disabled; });
    button.disabled = false;
    button.textContent = previousText;
  }
}
$('editor-form').addEventListener('submit', event => submitContent(event));
$('draft-btn').addEventListener('click', async event => {
  const required = $('isi').required; $('isi').required = false;
  try { if ($('editor-form').reportValidity()) await submitContent(event, 'draft'); }
  finally { $('isi').required = required; }
});
// Delegated actions keep listener count constant even as content changes.
$('dashboard-view').addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button || !store) return;
  if (button.dataset.panel) return navigate(button.dataset.panel);
  if (button.dataset.go) { if (button.dataset.kind) setMedia(button.dataset.kind); return navigate(button.dataset.go); }
  if (button.dataset.action === 'new-news') return openEditor('berita');
  if (['new-photo', 'new-video'].includes(button.dataset.action)) { if (currentRole === 'admin') { setMedia(button.dataset.action === 'new-photo' ? 'foto' : 'video'); navigate('galeri'); openEditor(mediaType); } return; }
  if (button.dataset.localPhoto) { showLibraryImage(button.dataset.localPhoto); return; }
  if (button.dataset.action === 'new-media' || button.id === 'add-media') { if (currentRole === 'admin') openEditor(mediaType === 'library' ? 'foto' : mediaType); return; }
  if (button.dataset.action === 'refresh') return navigate(currentPanel, false);
  const id = button.dataset.edit || button.dataset.delete || button.dataset.restore || button.dataset.history || button.dataset.view;
  if (!id) return;
  if (button.dataset.type !== 'berita' && currentRole !== 'admin') return;
  const source = store;
  button.disabled = true;
  try {
    const row = await source.get(button.dataset.type, id);
    if (source !== store) return;
    if (button.dataset.edit) openEditor(button.dataset.type, row);
    else if (button.dataset.view) {
      $('preview-content').innerHTML = `${row.gambar_url ? `<img src="${safeImage(row.gambar_url)}" alt="${escape(row.caption || row.judul)}" />` : ''}<h1 id="preview-title">${escape(row.judul)}</h1><p class="muted">${escape(row.kategori)} · ${formatDate(row.dibuat_pada)}</p>${renderBody(row.isi)}`;
      $('preview-dialog').showModal();
    }
    else if (button.dataset.history) {
      historyTarget = row; historyRows = await source.history(id);
      $('preview-content').innerHTML = `<h1 id="preview-title">Riwayat berita</h1>${historyRows.map((item, index) => `<div class="history-row"><strong>${escape(item.snapshot.judul)}</strong><p>${escape(item.actor_name || 'Pengurus')} · ${formatDate(item.dibuat_pada)} · ${escape(item.action)}</p>${currentRole === 'admin' ? `<button type="button" class="button secondary" data-revision="${index}">Gunakan versi ini</button>` : ''}</div>`).join('') || '<p>Belum ada riwayat perubahan.</p>'}`;
      $('preview-dialog').showModal();
    }
    else if (button.dataset.restore) {
      await source.restore(row); toast('Berita dipulihkan sebagai draft.'); loadSummary(); loadNews();
    }
    else if (confirm(button.dataset.type === 'berita' ? `Hapus “${row.judul}” dari website? Berita dipindahkan ke Arsip dan dapat dipulihkan.` : `Hapus “${row.judul}”? Tindakan ini tidak bisa dibatalkan.`)) {
      await source.remove(button.dataset.type, row);
      toast('Konten berhasil dihapus.');
      loadSummary(); if (currentPanel === 'berita') loadNews(); if (currentPanel === 'galeri') loadMedia();
    }
  } catch (error) { toast(`Tidak dapat memproses konten. ${error.message}`, true); }
  finally { button.disabled = false; }
});
$('news-search').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { newsPage = 1; loadNews(); }, 250); });
$('news-filter').addEventListener('change', () => { newsPage = 1; loadNews(); });
$('news-status').addEventListener('change', () => { newsPage = 1; loadNews(); });
async function loadInbox() {
  if (!store || currentRole !== 'admin') return;
  const source = store, kind = currentPanel, request = ++inboxRequest;
  if (!['pendaftaran', 'kontak', 'donasi'].includes(kind)) return;
  if (!isDemo && ['pendaftaran', 'donasi'].includes(kind)) {
    $('inbox-prev').disabled = $('inbox-next').disabled = true;
    $('inbox-page-info').textContent = 'Rekap dikelola melalui Google Sheets';
    loading('submission-list');
    let available = false, reason = '';
    try { await getGoogleFormToken(); available = true; } catch (error) { reason = error.message; }
    if (source !== store || request !== inboxRequest) return;
    $('submission-list').innerHTML = `<div class="google-recap"><span class="eyebrow">REKAP PONDOK</span><h2>${kind === 'pendaftaran' ? 'Pendaftaran santri' : 'Konfirmasi donasi'}</h2><div class="form-readiness ${available ? 'ready' : 'not-ready'}" role="status"><strong>${available ? 'Penerima formulir tersedia' : 'Formulir belum siap menerima kiriman'}</strong><p>${available ? 'Periksa satu kiriman uji di rekap untuk memastikan isian dan lampirannya sudah masuk.' : escape(reason || 'Penghubung penyimpanan belum tersambung. Kiriman baru belum dapat disimpan.')}</p><button class="text-link" data-action="refresh">Periksa lagi</button></div><p>Rekap disediakan di Google Sheets akun pondok. Lampiran kiriman yang berhasil disimpan dapat dibuka melalui tautan pada rekap.</p><a class="button" href="${RECAP_URL}" target="_blank" rel="noopener noreferrer">Edit / hapus rekap di Google Sheets ↗</a>${kind === 'donasi' ? `<a class="button secondary recap-download" href="${RECAP_URL.replace(/\/edit$/, '/export?format=xlsx')}" target="_blank" rel="noopener noreferrer">Unduh laporan rekap (.xlsx) ↓</a>` : ''}<small>${kind === 'donasi' ? 'File Excel berisi rekap pendaftaran dan donasi. Akses unduh tetap memerlukan izin akun Google pondok. ' : ''}Masuk dengan akun pondok yang memiliki akses. ${kind === 'donasi' ? 'Pengurus tetap perlu mencocokkan bukti dengan transfer yang diterima.' : 'Gunakan rekap untuk mencatat tindak lanjut pendaftaran.'}</small></div>`;
    return;
  }
  loading('submission-list'); $('inbox-prev').disabled = $('inbox-next').disabled = true;
  try {
    const { data, count } = await source.submissions(kind, inboxPage);
    if (source !== store || currentPanel !== kind || request !== inboxRequest) return;
    inboxCount = count;
    $('submission-list').innerHTML = data.map(row => `<div class="inbox-row"><div class="surface-heading"><div><h3>${escape(row.payload.nama)}</h3><p class="muted">${formatDate(row.dibuat_pada)} · ${escape(row.status)}</p></div><div><label for="submission-${escape(row.id)}" class="sr-only">Status ${escape(row.payload.nama)}</label><select id="submission-${escape(row.id)}">${['baru', 'diproses', 'selesai'].map(status => `<option ${row.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select><button class="button secondary compact" data-submission="${escape(row.id)}">Simpan status</button></div></div><details><summary>Lihat isian</summary><dl>${Object.entries(row.payload).map(([key, value]) => `<dt>${escape(key)}</dt><dd>${escape(value)}</dd>`).join('')}</dl></details></div>`).join('') || empty('Belum ada kiriman.', isDemo ? 'Mode demo tidak menerima kiriman website publik.' : 'Kiriman formulir website akan muncul di sini.');
    pagination('inbox', inboxPage, count);
  } catch { if (request === inboxRequest) { failure('submission-list'); $('inbox-page-info').textContent = 'Gagal memuat'; } }
}
$('submission-list').addEventListener('click', async event => {
  const button = event.target.closest('[data-submission]');
  if (!button || currentRole !== 'admin' || !store) return;
  const id = button.dataset.submission;
  button.disabled = true;
  try { await store.updateSubmission(id, $(`submission-${id}`).value); toast('Status kiriman diperbarui.'); loadInbox(); }
  catch (error) { toast(error.message, true); }
  finally { button.disabled = false; }
});
$('inbox-prev').addEventListener('click', () => { if (inboxPage > 1) { inboxPage--; loadInbox(); } });
$('inbox-next').addEventListener('click', () => { if (inboxPage * PAGE_SIZE < inboxCount) { inboxPage++; loadInbox(); } });
for (const type of ['library', 'foto', 'video']) $(`tab-${type}`).addEventListener('click', () => { setMedia(type); loadMedia(); });
$('news-prev').addEventListener('click', () => { if (newsPage > 1) { newsPage--; loadNews(); } });
$('news-next').addEventListener('click', () => { if (newsPage * PAGE_SIZE < newsCount) { newsPage++; loadNews(); } });
$('media-prev').addEventListener('click', () => { if (mediaPage > 1) { mediaPage--; loadMedia(); } });
$('media-next').addEventListener('click', () => { if (mediaPage * (mediaType === 'library' ? LIBRARY_PAGE_SIZE : PAGE_SIZE) < mediaCount) { mediaPage++; loadMedia(); } });
function formatBytes(bytes) { return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`; }
function localPhotoCard(row) {
  return `<article class="media-card local-photo-card"><button class="local-photo-open" data-local-photo="${escape(row.id)}" aria-label="Lihat ${escape(row.filename)}"><img class="media-cover" src="${safeImage(row.thumbnail)}" alt="${escape(row.folder)}" loading="lazy" decoding="async" /><span class="local-photo-zoom" aria-hidden="true">Lihat foto ↗</span></button><div class="media-info"><span class="category">${escape(row.format)}${['HEIC', 'HEIF'].includes(row.format) ? ' · pratinjau JPG' : ''}</span><h3 title="${escape(row.filename)}">${escape(row.filename)}</h3><p class="local-photo-folder" title="${escape(row.path)}">${escape(row.folder)}</p><span class="local-photo-size">Asli ${formatBytes(row.bytes)}</span></div></article>`;
}
function showLibraryImage(id) {
  const index = filteredLibrary.findIndex(row => row.id === id);
  if (index < 0) return;
  libraryImageIndex = index;
  const row = filteredLibrary[index];
  $('library-preview-title').textContent = row.filename;
  $('library-preview-image').src = row.full;
  $('library-preview-image').alt = `${row.folder} — ${row.filename}`;
  $('library-preview-folder').textContent = row.folder;
  $('library-preview-meta').textContent = `${row.format} · Asli ${formatBytes(row.bytes)} · Pratinjau dioptimalkan`;
  $('library-image-position').textContent = `${index + 1} / ${filteredLibrary.length}`;
  $('library-image-prev').disabled = index === 0;
  $('library-image-next').disabled = index === filteredLibrary.length - 1;
  if (!$('library-dialog').open) $('library-dialog').showModal();
}
$('library-close').addEventListener('click', () => $('library-dialog').close());
$('library-dialog').addEventListener('close', () => { $('library-preview-image').removeAttribute('src'); });
$('library-dialog').addEventListener('keydown', event => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  const next = filteredLibrary[libraryImageIndex + (event.key === 'ArrowLeft' ? -1 : 1)];
  if (next) showLibraryImage(next.id);
});
$('library-image-prev').addEventListener('click', () => { const row = filteredLibrary[libraryImageIndex - 1]; if (row) showLibraryImage(row.id); });
$('library-image-next').addEventListener('click', () => { const row = filteredLibrary[libraryImageIndex + 1]; if (row) showLibraryImage(row.id); });
function refreshLibrary() { mediaPage = 1; if (mediaType === 'library') loadMedia(); }
$('library-search').addEventListener('input', () => { clearTimeout(librarySearchTimer); librarySearchTimer = setTimeout(refreshLibrary, 180); });
$('library-folder').addEventListener('change', refreshLibrary);
$('library-sort').addEventListener('change', refreshLibrary);
$('library-reset').addEventListener('click', () => { $('library-search').value = $('library-folder').value = ''; $('library-sort').value = 'folder'; refreshLibrary(); });
window.addEventListener('beforeunload', event => { if (dirty) { persistDraft(); event.preventDefault(); event.returnValue = ''; } });

async function restoreSession() {
  const flow = readAuthFlow(location.href);
  if (flow.kind || flow.error) { location.replace(loginPath({ preserveAuth: true })); return; }
  try {
    if (demoEnabled && demoUser && sessionStorage.getItem('annahl-dummy-user') === demoUser) { openDashboard({}, true); return; }
    if (!backendConfigured) { location.replace(loginPath()); return; }
    const client = await getClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data.session) { location.replace(loginPath()); return; }
    if (sessionStorage.getItem('annahl-password-setup') === data.session.user.id) { location.replace(loginPath()); return; }
    openDashboard(await authorizedUser(client, data.session.user), false);
    client.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') { $('dashboard-view').hidden = true; store?.dispose(); store = null; location.replace(loginPath()); }
    });
  } catch { location.replace(loginPath({ message: 'session' })); }
}
restoreSession();
