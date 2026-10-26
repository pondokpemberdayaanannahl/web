// ═══════════════════════════════════════════
// BERITA — News / Blog Page (SEO-Ready)
// ═══════════════════════════════════════════

import { photos } from '../data/photos.js';
import { supabase } from '../supabase.js';
import { renderBody, plainText, safeUrl } from '../content-format.js';

// Data berita dari database (diisi saat halaman dibuka)
let articles = [];

export function escapeHtml(teks) {
  return String(teks ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatTanggal(iso) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Ubah teks biasa dari admin menjadi paragraf HTML
function isiKeHtml(isi) {
  return renderBody(isi);
}

// Ringkasan otomatis dari awal isi berita
export function ringkasan(isi, maks = 150) {
  const bersih = plainText(isi);
  return bersih.length > maks ? bersih.slice(0, maks).trimEnd() + '…' : bersih;
}

// Ubah baris database ke bentuk yang dipakai kartu dan modal
function ubahKeArtikel(b) {
  return {
    slug: b.id,
    category: escapeHtml(b.kategori),
    title: escapeHtml(b.judul),
    date: formatTanggal(b.dibuat_pada),
    img: escapeHtml(safeUrl(b.gambar_url) || photos.hero.berita),
    thumbnail: escapeHtml(safeUrl(b.thumbnail_url) || safeUrl(b.gambar_url) || photos.hero.berita),
    caption: escapeHtml(b.caption || ''),
    excerpt: escapeHtml(ringkasan(b.isi)),
    content: isiKeHtml(b.isi),
  };
}

function kartuBerita(a) {
  return `
    <article class="news-card" data-category="${a.category}" data-slug="${a.slug}">
      <div class="news-card-img">
        <img src="${a.thumbnail}" alt="${a.title}" loading="lazy" />
      </div>
      <div class="news-card-body">
        <span class="badge">${a.category}</span>
        <h3 class="news-card-title">${a.title}</h3>
        <div class="news-card-date">${a.date}</div>
        <p class="news-card-excerpt">${a.excerpt}</p>
        <a href="#" class="card-link" onclick="event.preventDefault();showArticle('${a.slug}')">Baca selengkapnya <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a>
      </div>
    </article>
  `;
}

export function Berita() {
  return `
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${photos.hero.berita}')"></div>
      <div class="hero-overlay"></div>
      <div class="hero-pattern"></div>
      <div class="hero-content">
        <span class="section-label" style="color: var(--green-300)">BERITA & KEGIATAN</span>
        <h1 style="font-size: 44px">Kabar Terbaru</h1>
        <p class="hero-subtitle">Ikuti perkembangan kegiatan dan pencapaian santri Pesantren An-Nahl.</p>
      </div>
    </section>

    <!-- Articles Grid -->
    <section class="section" style="background: var(--neutral-50)">
      <div class="container">
        <!-- Filter -->
        <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;justify-content:center;margin-bottom:var(--space-2xl)" class="reveal">
          ${['Semua', 'Akademik', 'Keagamaan', 'Sosial', 'Pengumuman'].map((cat, i) => `
            <button class="badge news-filter" data-filter="${cat}" style="cursor:pointer;border:none;font-size:14px;padding:8px 20px;${i === 0 ? 'background:var(--green-800);color:var(--white)' : ''}">${cat}</button>
          `).join('')}
        </div>

        <div class="grid-3" id="news-grid">
          <p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Memuat berita...</p>
        </div>
      </div>
    </section>

    <!-- Article Detail Modal -->
    <div id="article-modal" class="article-modal" onclick="if(event.target===this)closeArticle()">
      <div class="article-modal-content">
        <button class="article-modal-close" onclick="closeArticle()">&times;</button>
        <div id="article-modal-body"></div>
      </div>
    </div>
  `;
}

// Article detail modal styles
if (!document.getElementById('berita-styles')) {
  const style = document.createElement('style');
  style.id = 'berita-styles';
  style.textContent = `
    .article-modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 2000;
      align-items: flex-start;
      justify-content: center;
      overflow-y: auto;
      padding: 40px 20px;
      backdrop-filter: blur(4px);
    }
    .article-modal.open { display: flex; }
    .article-modal-content {
      background: var(--white);
      border-radius: var(--radius-lg);
      max-width: 800px;
      width: 100%;
      position: relative;
      margin-top: 40px;
      margin-bottom: 40px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.2);
      animation: slideUp 0.4s var(--ease-out);
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .article-modal-close {
      position: absolute;
      top: 16px;
      right: 20px;
      font-size: 32px;
      color: var(--neutral-500);
      background: none;
      border: none;
      cursor: pointer;
      z-index: 10;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;
    }
    .article-modal-close:hover {
      background: var(--neutral-100);
      color: var(--neutral-950);
    }
    .article-detail-cover {
      width: 100%;
      aspect-ratio: 16/9;
      object-fit: cover;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }
    .article-detail-body {
      padding: 40px;
    }
    .article-detail-body h2 {
      font-size: 28px;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    .article-detail-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .article-detail-body h3 {
      margin-top: 28px;
      margin-bottom: 12px;
      font-size: 20px;
      color: var(--green-900);
    }
    .article-detail-body p {
      color: var(--neutral-700);
      line-height: 1.8;
      margin-bottom: 16px;
      font-size: 16px;
    }
    .article-detail-body ul {
      color: var(--neutral-700);
      line-height: 1.8;
      font-size: 16px;
    }
    .article-related {
      border-top: 1px solid var(--neutral-200);
      padding: 24px 40px;
    }
    .news-card[data-hidden="true"] { display: none; }
    @media (max-width: 768px) {
      .article-detail-body { padding: 24px; }
      .article-detail-body h2 { font-size: 22px; }
      .article-modal { padding: 20px 12px; }
      .article-modal-content { margin-top: 20px; }
      .article-related { padding: 20px 24px; }
    }
  `;
  document.head.appendChild(style);
}

// Open article detail
window.showArticle = function(slug) {
  const article = articles.find(a => a.slug === slug);
  if (!article) return;

  const relatedArticles = articles.filter(a => a.slug !== slug && a.category === article.category).slice(0, 2);

  const modal = document.getElementById('article-modal');
  document.getElementById('article-modal-body').innerHTML = `
    <img src="${article.img}" alt="${article.title}" class="article-detail-cover" />
    <div class="article-detail-body">
      <span class="badge">${article.category}</span>
      <h2>${article.title}</h2>
      <div class="article-detail-meta">
        <span style="font-size:14px;color:var(--neutral-500)">${article.date}</span>
      </div>
      ${article.caption ? `<p class="photo-caption">${article.caption}</p>` : ''}
      ${article.content}
    </div>
    ${relatedArticles.length ? `
      <div class="article-related">
        <h3 style="font-size:16px;margin-bottom:16px;color:var(--neutral-950)">Artikel Terkait</h3>
        ${relatedArticles.map(r => `
          <a href="#" onclick="event.preventDefault();showArticle('${r.slug}')" style="display:flex;gap:12px;align-items:center;padding:8px 0;text-decoration:none;border-bottom:1px solid var(--neutral-100)">
            <img src="${r.img}" alt="${r.title}" style="width:60px;height:45px;object-fit:cover;border-radius:6px" loading="lazy" />
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--neutral-950);line-height:1.3">${r.title}</div>
              <div style="font-size:12px;color:var(--neutral-500)">${r.date}</div>
            </div>
          </a>
        `).join('')}
      </div>
    ` : ''}
  `;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeArticle = function() {
  const modal = document.getElementById('article-modal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
};

// News filter
// Ambil berita dari database + aktifkan filter kategori
window.initNewsFilter = async function() {
  if (!supabase) {
    const grid = document.getElementById('news-grid');
    if (grid) grid.innerHTML = '<p>Berita pesantren akan tersedia setelah layanan terhubung.</p>';
    return;
  }
  // Filter kategori (kartu dicari saat tombol diklik, jadi aman walau kartu datang belakangan)
  const filters = document.querySelectorAll('.news-filter');
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(b => { b.style.background = ''; b.style.color = ''; });
      btn.style.background = 'var(--green-800)';
      btn.style.color = 'var(--white)';

      const filter = btn.dataset.filter;
      document.querySelectorAll('.news-card[data-category]').forEach(card => {
        card.dataset.hidden = (filter !== 'Semua' && card.dataset.category !== filter) ? 'true' : 'false';
      });
    });
  });

  // Ambil data dari Supabase
  const { data, error } = await supabase
    .from('berita')
    .select('*')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('dibuat_pada', { ascending: false });

  // Kalau pengunjung sudah pindah halaman, hentikan
  const grid = document.getElementById('news-grid');
  if (!grid) return;

  if (error) {
    console.error(error);
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Gagal memuat berita. Silakan coba lagi nanti.</p>';
    return;
  }

  articles = data.map(ubahKeArtikel);

  if (articles.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Belum ada berita.</p>';
    return;
  }

  grid.innerHTML = articles.map(kartuBerita).join('');
  if (window.lucide) window.lucide.createIcons();
};
