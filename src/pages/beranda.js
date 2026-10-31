// ═══════════════════════════════════════════
// BERANDA — Homepage
// ═══════════════════════════════════════════

import { photos } from '../data/photos.js';
import { programPesantren, programUnggulan } from '../data/pondok.js';
import { supabase } from '../supabase.js';
import { escapeHtml, formatTanggal, ringkasan } from './berita.js';
import { initHomeStories } from '../home-stories.js';

export function Beranda() {
  return `
    <!-- HERO -->
    <section class="hero hero-left" id="hero">
      <div class="hero-bg" style="background-image: url('${photos.hero.beranda}')"></div>
      <div class="hero-overlay" style="background: linear-gradient(105deg, rgba(5,46,22,0.92) 0%, rgba(5,46,22,0.75) 40%, rgba(5,46,22,0.15) 75%, transparent 100%)"></div>
      <div class="hero-pattern"></div>
      <div class="hero-content" style="text-align:left;align-items:flex-start;max-width:620px">
        <div class="hero-arabic">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
        <h1>Membentuk Generasi Qur'ani yang Berdaya & Berakhlak</h1>
        <p class="hero-subtitle">
          Pondok Pesantren Pemberdayaan Ummat An-Nahl mendidik santri dengan kurikulum terpadu menghafal Al-Qur'an, menguasai ilmu, dan siap memberdayakan ummat.
        </p>
        <div class="btn-group">
          <a href="#/pendaftaran" class="btn btn-white">Daftar Sekarang</a>
          <a href="#/program" class="btn btn-outline-white">Program Kami →</a>
        </div>
      </div>
      <div class="hero-scroll">
        <i data-lucide="chevron-down" style="width:28px;height:28px"></i>
      </div>
    </section>

    <!-- TENTANG SINGKAT -->
    <section class="section" id="about" style="background: var(--neutral-50)">
      <div class="container">
        <div class="about-content">
          <div class="about-text">
            <span class="section-label reveal">TENTANG KAMI</span>
            <h2 class="reveal reveal-delay-1">Mendidik dengan Kasih, Memberdayakan dengan Ilmu</h2>
            <p class="reveal reveal-delay-2">
              Pondok Pesantren Pemberdayaan Ummat An-Nahl hadir sebagai lembaga pendidikan Islam yang memadukan nilai-nilai salaf dengan pendekatan modern. Kami percaya bahwa setiap santri memiliki potensi untuk menjadi pemimpin ummat yang berilmu, berakhlak mulia, dan mandiri.
            </p>
            <div class="checklist reveal reveal-delay-3">
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Kurikulum terpadu: Al-Qur'an, akademik, dan keterampilan</span>
              </div>
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Pengajar berpengalaman dan berdedikasi</span>
              </div>
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Lingkungan Islami yang kondusif dan aman</span>
              </div>
            </div>
            <div style="margin-top: var(--space-xl)" class="reveal reveal-delay-4">
              <a href="#/tentang" class="btn btn-secondary">Selengkapnya tentang kami →</a>
            </div>
          </div>
          <div class="about-image reveal">
            <img src="${photos.about}" 
                 alt="Pondok Pesantren An-Nahl" loading="lazy" />
          </div>
        </div>
      </div>
    </section>

    <!-- CERITA KAMI: newest published articles, photos and videos -->
    <section class="section home-stories" id="stories" data-content-key="home-stories">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title reveal">Cerita kami</h2>
          <p class="section-subtitle reveal reveal-delay-1">Kabar, foto, dan video terbaru dari keseharian pondok.</p>
        </div>
        <p id="home-stories-status" class="category-status" role="status">Memuat cerita…</p>
        <div class="stories-grid" id="home-stories-grid"></div>
        <div class="stories-more"><a href="#/berita" class="btn btn-secondary">Lihat semua berita →</a><a href="#/galeri" class="btn btn-secondary">Jelajahi galeri →</a></div>
      </div>
      <dialog id="story-dialog" class="story-dialog" aria-labelledby="story-dialog-title">
        <div class="story-dialog-heading"><h2 id="story-dialog-title"></h2><button type="button" data-story-close aria-label="Tutup cerita">×</button></div>
        <div id="story-dialog-body"></div>
      </dialog>
    </section>

    <!-- PROGRAM UNGGULAN -->
    <section class="section" id="programs" style="background: var(--green-50)">
      <div class="container">
        <div class="section-header">
          <span class="section-label reveal">PROGRAM KAMI</span>
          <h2 class="section-title reveal reveal-delay-1">Program Pesantren</h2>
          <p class="section-subtitle reveal reveal-delay-2">Empat program pendidikan yang mendampingi proses belajar dan pembinaan santri.</p>
        </div>
        <div class="grid-4 pondok-program-grid">
          ${programPesantren.map((program,i) => `<article class="card reveal reveal-delay-${i}"><div class="card-icon"><i data-lucide="${program.icon}" style="width:28px;height:28px"></i></div><h3 class="card-title">${program.title}</h3><p class="card-text">${program.description}</p><a href="#/program" class="card-link">Pelajari lebih lanjut <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a></article>`).join('')}
        </div>
        <div style="text-align:center; margin-top: var(--space-2xl)" class="reveal">
          <a href="#/program" class="btn btn-secondary">Lihat Semua Program →</a>
        </div>
      </div>
    </section>

    <section class="section" id="featured-programs" data-content-key="home-featured-programs" style="background:var(--neutral-50)">
      <div class="container">
        <div class="section-header"><span class="section-label reveal">PROGRAM UNGGULAN</span><h2 class="section-title reveal reveal-delay-1">Ilmu, Bahasa, dan Keterampilan</h2></div>
        <div class="grid-4 pondok-program-grid">
          ${programUnggulan.map((program,i) => `<article class="card reveal reveal-delay-${i}"><div class="card-icon"><i data-lucide="${program.icon}" style="width:28px;height:28px"></i></div><h3 class="card-title">${program.title}</h3><p class="card-text">${program.description}</p></article>`).join('')}
        </div>
      </div>
    </section>

    <!-- STATISTIK -->
    <section class="stats" id="stats">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item reveal">
            <div class="stat-number" data-counter="500" data-suffix="+">0</div>
            <div class="stat-label">Santri Aktif</div>
          </div>
          <div class="stat-item reveal reveal-delay-1">
            <div class="stat-number" data-counter="30" data-suffix="+">0</div>
            <div class="stat-label">Pengajar Profesional</div>
          </div>
          <div class="stat-item reveal reveal-delay-2">
            <div class="stat-number" data-counter="15" data-suffix="+">0</div>
            <div class="stat-label">Tahun Pengalaman</div>
          </div>
          <div class="stat-item reveal reveal-delay-3">
            <div class="stat-number" data-counter="98" data-suffix="%">0</div>
            <div class="stat-label">Lulusan Melanjutkan</div>
          </div>
        </div>
      </div>
    </section>

    <!-- BERITA & KEGIATAN -->
    <section class="section" id="news" style="background: var(--neutral-50)">
      <div class="container">
        <div class="section-header">
          <span class="section-label reveal">BERITA & KEGIATAN</span>
          <h2 class="section-title reveal reveal-delay-1">Kabar Terbaru dari Pesantren An-Nahl</h2>
          <p class="section-subtitle reveal reveal-delay-2">Ikuti perkembangan kegiatan dan pencapaian santri kami.</p>
        </div>
          <div class="grid-3" id="beranda-news-grid">
          <p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Memuat berita...</p>
        </div>
        <div style="text-align:center; margin-top: var(--space-2xl)" class="reveal">
          <a href="#/berita" class="btn btn-secondary">Lihat Semua Berita →</a>
        </div>
      </div>
    </section>

    <!-- CTA DONASI -->
    <section class="cta-donasi" id="cta-donation">
      <div class="container">
        <div class="cta-donasi-content">
          <p class="hadits reveal">"Sedekah tidak akan mengurangi harta." — HR. Muslim</p>
          <h2 class="reveal reveal-delay-1">Bantu Wujudkan Mimpi Para Santri</h2>
          <p class="reveal reveal-delay-2">Donasi Anda membantu santri dhuafa mendapatkan akses pendidikan berkualitas, fasilitas yang layak, dan masa depan yang lebih cerah. Setiap kontribusi, sekecil apa pun, sangat berarti.</p>
          <div class="reveal reveal-delay-3">
            <a href="#/donasi" class="btn btn-white">Donasi Sekarang</a>
          </div>
        </div>
      </div>
    </section>
  `;
}

// Ambil 3 berita terbaru dari database untuk Beranda
window.initBerandaNews = async function() {
  await Promise.all([initHomeStories(supabase), loadHomeNews()]);
};
async function loadHomeNews() {
  if (!supabase) {
    const grid = document.getElementById('beranda-news-grid');
    if (grid) grid.innerHTML = '<p>Berita pesantren akan tersedia setelah layanan terhubung.</p>';
    return;
  }
  const { data, error } = await supabase
    .from('berita')
    .select('*')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('dibuat_pada', { ascending: false })
    .limit(3);

  // Kalau pengunjung sudah pindah halaman, hentikan
  const grid = document.getElementById('beranda-news-grid');
  if (!grid) return;

  if (error) {
    console.error(error);
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Gagal memuat berita.</p>';
    return;
  }

  if (data.length === 0) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Belum ada berita.</p>';
    return;
  }

  grid.innerHTML = data.map(b => `
    <div class="news-card">
      <div class="news-card-img">
        <img src="${escapeHtml(b.thumbnail_url || b.gambar_url || photos.hero.berita)}" alt="${escapeHtml(b.judul)}" loading="lazy" />
      </div>
      <div class="news-card-body">
        <span class="badge">${escapeHtml(b.kategori)}</span>
        <h3 class="news-card-title">${escapeHtml(b.judul)}</h3>
        <div class="news-card-date">${formatTanggal(b.dibuat_pada)}</div>
        <p class="news-card-excerpt">${escapeHtml(ringkasan(b.isi))}</p>
        <a href="#/berita" class="card-link">Baca selengkapnya <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}
