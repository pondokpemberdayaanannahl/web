import { categoryCards } from '../components/category-cards.js';
import { galleryImages, photos, photoThumbnail } from '../data/photos.js';
import { escapeHtml, safeUrl } from '../content-format.js';

export function Galeri() {
  return `
    <section class="hero" style="min-height:50vh"><div class="hero-bg" style="background-image:url('${photos.hero.galeri}')"></div><div class="hero-overlay"></div><div class="hero-content"><span class="section-label" style="color:var(--green-300)">GALERI</span><h1>Galeri Foto & Video</h1><p class="hero-subtitle">Dokumentasi kegiatan dan suasana Pesantren An-Nahl.</p></div></section>
    <section class="section"><div class="container"><div class="section-header"><span class="section-label">FOTO KEGIATAN</span><h2 class="section-title">Momen yang Terabadikan</h2></div>${categoryCards('gallery')}<p id="gallery-status" role="status"></p><div class="gallery-grid" id="photo-grid"></div><button id="gallery-more" class="btn btn-secondary" hidden>Muat foto lainnya</button></div></section>
    <section class="section" style="background:var(--green-50)"><div class="container"><div class="section-header"><span class="section-label">VIDEO</span><h2 class="section-title">Video Kegiatan Pesantren</h2></div><p id="video-status" role="status"></p><div class="grid-3" id="video-grid"></div><button id="video-more" class="btn btn-secondary" hidden>Muat video lainnya</button></div></section>
    <dialog id="lightbox" class="lightbox" aria-label="Pratinjau foto"><button class="lightbox-close" aria-label="Tutup foto">&times;</button><img id="lightbox-img" alt="" /><div id="lightbox-caption" class="lightbox-caption"></div></dialog>
  `;
}

// Galeri-specific styles injected once
if (!document.getElementById('galeri-styles')) {
  const style = document.createElement('style');
  style.id = 'galeri-styles';
  style.textContent = `
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-md);
    }
    .gallery-item {
      position: relative;
      border-radius: var(--radius-md);
      overflow: hidden;
      cursor: pointer;
      aspect-ratio: 4/3;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .gallery-item.hidden {
      display: none;
    }
    .gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s var(--ease-out);
    }
    .gallery-item:hover img {
      transform: scale(1.08);
    }
    .gallery-overlay {
      position: absolute;
      inset: 0;
      background: rgba(5, 46, 22, 0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .gallery-overlay span {
      color: white;
      font-size: 14px;
      font-weight: 500;
    }
    .gallery-item:hover .gallery-overlay {
      opacity: 1;
    }

    /* Video card */
    .video-card {
      background: var(--white);
      border: 1px solid var(--neutral-200);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: all 0.35s var(--ease-out);
      box-shadow: var(--shadow-sm);
    }
    .video-card:hover {
      border-color: var(--green-200);
      box-shadow: var(--shadow-lg);
      transform: translateY(-4px);
    }
    .video-thumbnail {
      position: relative;
      aspect-ratio: 16/9;
      cursor: pointer;
      overflow: hidden;
      background: var(--neutral-950);
    }
    .video-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease, opacity 0.4s ease;
      opacity: 0.85;
    }
    .video-thumbnail:hover img {
      transform: scale(1.05);
      opacity: 0.7;
    }
    .video-play-btn {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(5, 46, 22, 0.7);
      border-radius: 50%;
      transition: all 0.3s ease;
      backdrop-filter: blur(4px);
    }
    .video-thumbnail:hover .video-play-btn {
      background: var(--green-800);
      transform: translate(-50%, -50%) scale(1.1);
    }

    /* Lightbox */
    .lightbox {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.92);
      z-index: 2000;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      padding: 40px;
    }
    .lightbox.open { display: flex; }
    .lightbox img {
      max-width: 90vw;
      max-height: 80vh;
      object-fit: contain;
      border-radius: 8px;
    }
    .lightbox-close {
      position: absolute;
      top: 20px;
      right: 30px;
      font-size: 36px;
      color: white;
      background: none;
      border: none;
      cursor: pointer;
      z-index: 2001;
      transition: transform 0.2s ease;
    }
    .lightbox-close:hover {
      transform: scale(1.2);
    }
    .lightbox-caption {
      color: rgba(255,255,255,0.7);
      margin-top: 16px;
      font-size: 15px;
    }

    @media (max-width: 768px) {
      .gallery-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .gallery-grid { grid-template-columns: 1fr; }
    }
  `;
  document.head.appendChild(style);
}


const imageCard = row => {
  const full = safeUrl(row.gambar_url || row.src), thumb = safeUrl(row.thumbnail_url || photoThumbnail(full));
  if (!full || !thumb) return '';
  const title = row.judul || row.alt || 'Foto kegiatan';
  return `<button type="button" class="gallery-item" data-full="${escapeHtml(full)}" data-caption="${escapeHtml(row.caption || title)}" aria-label="Buka foto ${escapeHtml(title)}"><img src="${escapeHtml(thumb)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async" /><span class="gallery-overlay"><span>${escapeHtml(title)}</span></span></button>`;
};
const videoCard = row => {
  if (!/^[\w-]{11}$/.test(row.youtube_id || '')) return '';
  return `<article class="video-card"><button type="button" class="video-thumbnail" data-video="${row.youtube_id}" data-title="${escapeHtml(row.judul)}" aria-label="Putar ${escapeHtml(row.judul)}"><img src="https://img.youtube.com/vi/${row.youtube_id}/mqdefault.jpg" alt="" loading="lazy" /><span class="video-play-btn" aria-hidden="true">▶</span></button><div style="padding:24px"><span class="badge">${escapeHtml(row.kategori)}</span><h3>${escapeHtml(row.judul)}</h3></div></article>`;
};
window.openLightbox = function(src, alt) {
  const dialog = document.getElementById('lightbox');
  if (!dialog || !safeUrl(src)) return;
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox-img').alt = alt;
  document.getElementById('lightbox-caption').textContent = alt;
  dialog.classList.add('open'); dialog.showModal(); document.body.style.overflow = 'hidden';
};
window.closeLightbox = function() {
  const dialog = document.getElementById('lightbox');
  if (!dialog) return;
  dialog.close(); dialog.classList.remove('open'); document.body.style.overflow = '';
  document.getElementById('lightbox-img').removeAttribute('src');
};
window.initGalleryFilter = async function() {
  const grid = document.getElementById('photo-grid'), videoGrid = document.getElementById('video-grid');
  if (!grid || !videoGrid) return;
  let category = 'Semua', photoOffset = 0, videoOffset = 0, request = 0;
  const status = document.getElementById('gallery-status'), videoStatus = document.getElementById('video-status');
  const more = document.getElementById('gallery-more'), videoMore = document.getElementById('video-more');
  const { supabase } = await import('../supabase.js');
  if (!grid.isConnected) return;
  async function loadPhotos(reset = false) {
    const current = ++request;
    if (reset) { photoOffset = 0; grid.replaceChildren(); }
    status.textContent = 'Memuat foto…'; more.disabled = true;
    try {
      let rows, count;
      if (!supabase) {
        const filtered = galleryImages.filter(row => category === 'Semua' || row.category === category);
        rows = filtered.slice(photoOffset, photoOffset + 12); count = filtered.length;
      } else {
        let query = supabase.from('galeri_foto').select('id,judul,kategori,gambar_url,thumbnail_url,caption', { count: 'exact' }).order('dibuat_pada', { ascending: false }).order('id');
        if (category !== 'Semua') query = query.eq('kategori', category);
        const result = await query.range(photoOffset, photoOffset + 11);
        if (result.error) throw result.error;
        rows = result.data; count = result.count || 0;
      }
      if (!grid.isConnected || current !== request) return;
      grid.insertAdjacentHTML('beforeend', rows.map(imageCard).join(''));
      photoOffset += rows.length; more.hidden = photoOffset >= count;
      status.textContent = count ? '' : 'Belum ada foto pada kategori ini.';
    } catch { if (grid.isConnected && current === request) { status.textContent = 'Foto belum dapat dimuat. Klik muat foto untuk mencoba lagi.'; more.hidden = false; } }
    finally { if (current === request) more.disabled = false; }
  }
  async function loadVideos() {
    if (videoMore.disabled) return;
    videoMore.disabled = true; videoStatus.textContent = 'Memuat video…';
    try {
      if (!supabase) { videoStatus.textContent = 'Video kegiatan belum tersedia.'; return; }
      const { data, count, error } = await supabase.from('galeri_video').select('id,judul,kategori,youtube_id', { count: 'exact' }).order('dibuat_pada', { ascending: false }).order('id').range(videoOffset, videoOffset + 5);
      if (error) throw error;
      if (!videoGrid.isConnected) return;
      videoGrid.insertAdjacentHTML('beforeend', data.map(videoCard).join(''));
      videoOffset += data.length; videoMore.hidden = videoOffset >= count;
      videoStatus.textContent = count ? '' : 'Video kegiatan belum tersedia.';
    } catch { if (videoGrid.isConnected) { videoStatus.textContent = 'Video belum dapat dimuat. Klik muat video untuk mencoba lagi.'; videoMore.hidden = false; } }
    finally { videoMore.disabled = false; }
  }
  document.querySelectorAll('.gallery-filter').forEach(button => button.addEventListener('click', () => {
    category = button.dataset.filter;
    document.querySelectorAll('.gallery-filter').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    loadPhotos(true);
  }));
  more.addEventListener('click', () => loadPhotos()); videoMore.addEventListener('click', loadVideos);
  grid.addEventListener('click', event => { const button = event.target.closest('[data-full]'); if (button) window.openLightbox(button.dataset.full, button.dataset.caption); });
  const dialog = document.getElementById('lightbox');
  dialog.querySelector('button').addEventListener('click', window.closeLightbox);
  dialog.addEventListener('cancel', event => { event.preventDefault(); window.closeLightbox(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) window.closeLightbox(); });
  videoGrid.addEventListener('click', event => {
    const button = event.target.closest('[data-video]'); if (!button) return;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${button.dataset.video}?autoplay=1`;
    iframe.title = button.dataset.title; iframe.allow = 'autoplay; encrypted-media; fullscreen'; iframe.allowFullscreen = true;
    iframe.style.cssText = 'width:100%;aspect-ratio:16/9;border:0;display:block';
    button.replaceWith(iframe);
  });
  await Promise.all([loadPhotos(true), loadVideos()]);
};
