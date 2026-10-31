// ═══════════════════════════════════════════
// PROGRAM — Programs Page
// ═══════════════════════════════════════════

import { photos } from '../data/photos.js';
import { programPesantren, programUnggulan, ekstrakurikuler } from '../data/pondok.js';

export function Program() {
  return `
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${photos.hero.program}')"></div>
      <div class="hero-overlay"></div>
      <div class="hero-pattern"></div>
      <div class="hero-content">
        <span class="section-label" style="color: var(--green-300)">PROGRAM</span>
        <h1 style="font-size: 44px">Program Pesantren</h1>
        <p class="hero-subtitle">Kurikulum terpadu yang memadukan pendidikan agama, akademik, dan keterampilan hidup.</p>
      </div>
    </section>

    <!-- Program Pesantren -->
    <section class="section" id="program-pesantren" style="background:var(--neutral-50)">
      <div class="container">
        <div class="section-header"><span class="section-label reveal">PROGRAM PESANTREN</span><h2 class="section-title reveal reveal-delay-1">Empat Program Pesantren</h2><p class="section-subtitle reveal reveal-delay-2">Pendidikan Al-Qur’an, madrasah, sekolah formal, dan pembinaan akhlak.</p></div>
        <div class="grid-2 pondok-program-grid">
          ${programPesantren.map((program,i) => `<article class="card reveal reveal-delay-${i}"><div class="card-icon"><i data-lucide="${program.icon}" style="width:28px;height:28px"></i></div><h3 class="card-title">${program.title}</h3><p class="card-text">${program.description}</p></article>`).join('')}
        </div>
      </div>
    </section>

    <!-- Program Unggulan -->
    <section class="section" id="program-unggulan" style="background:var(--green-50)">
      <div class="container">
        <div class="section-header"><span class="section-label reveal">PROGRAM UNGGULAN</span><h2 class="section-title reveal reveal-delay-1">Ilmu, Bahasa, dan Keterampilan</h2><p class="section-subtitle reveal reveal-delay-2">Empat program unggulan yang melengkapi pendidikan santri.</p></div>
        <div class="grid-4 pondok-program-grid">
          ${programUnggulan.map((program,i) => `<article class="card reveal reveal-delay-${i}"><div class="card-icon"><i data-lucide="${program.icon}" style="width:28px;height:28px"></i></div><h3 class="card-title">${program.title}</h3><p class="card-text">${program.description}</p></article>`).join('')}
        </div>
      </div>
    </section>

    <!-- Pembinaan Santri -->
    <section class="section" style="background:var(--neutral-50)">
      <div class="container"><div class="about-content">
        <div class="about-text"><span class="section-label reveal">PEMBINAAN SANTRI</span><h2 class="reveal reveal-delay-1">Tarbiyah Akhlak Islamiyah</h2><p class="reveal reveal-delay-2">Pembinaan akhlak menjadi bagian dari pendidikan pesantren, bersama tahfidz, madrasah muhadloroh, dan pendidikan formal SMP/SMA.</p><p class="reveal reveal-delay-3">Santri juga dapat mengembangkan minat dan keterampilan melalui kegiatan ekstrakurikuler pesantren.</p></div>
        <div class="about-image reveal"><img src="${photos.program.pemberdayaan}" alt="Kegiatan santri An-Nahl" loading="lazy" /></div>
      </div></div>
    </section>

    <!-- Ekstrakurikuler -->
    <section class="section" id="ekstrakurikuler" style="background:var(--green-50)">
      <div class="container">
        <div class="section-header"><span class="section-label reveal">EKSTRAKURIKULER</span><h2 class="section-title reveal reveal-delay-1">Ruang untuk Minat dan Bakat</h2><p class="section-subtitle reveal reveal-delay-2">Pilihan kegiatan untuk mengembangkan kemampuan, kreativitas, dan kemandirian santri.</p></div>
        <div class="grid-3 pondok-extracurricular-grid">
          ${ekstrakurikuler.map((activity,i) => `<article class="card extracurricular-card reveal reveal-delay-${i%4}"><div class="card-icon"><i data-lucide="${activity.icon}" style="width:24px;height:24px"></i></div><h3 class="card-title">${activity.title}</h3></article>`).join('')}
        </div>
      </div>
    </section>

    <!-- Jadwal Kegiatan -->
    <section class="section" style="background: var(--neutral-50)">
      <div class="container">
        <div class="section-header">
          <span class="section-label reveal">JADWAL HARIAN</span>
          <h2 class="section-title reveal reveal-delay-1">Kegiatan Santri Sehari-hari</h2>
        </div>
        <div style="max-width: 700px; margin: 0 auto" class="reveal reveal-delay-2">
          <div style="display:flex;flex-direction:column;gap:12px">
            ${[
              ['04:00 - 05:00', 'Tahajjud & Sholat Subuh Berjamaah'],
              ['05:00 - 06:30', 'Setoran Hafalan (Talaqqi)'],
              ['06:30 - 07:00', 'Sarapan & Persiapan'],
              ['07:00 - 12:00', 'Kegiatan Belajar Mengajar Formal'],
              ['12:00 - 13:30', 'Sholat Dzuhur & Istirahat'],
              ['13:30 - 15:00', 'Muraja\'ah & Kajian Kitab'],
              ['15:00 - 16:30', 'Sholat Ashar & Ekstrakurikuler'],
              ['16:30 - 17:30', 'Olahraga & Aktivitas Bebas'],
              ['17:30 - 18:30', 'Sholat Maghrib & Tadarus'],
              ['18:30 - 19:30', 'Sholat Isya & Makan Malam'],
              ['19:30 - 21:00', 'Belajar Mandiri & Muraja\'ah'],
              ['21:00', 'Istirahat / Tidur'],
            ].map(([time, activity]) => `
              <div style="display:flex;gap:var(--space-lg);align-items:center;padding:var(--space-md) var(--space-lg);background:var(--white);border-radius:var(--radius-md);border:1px solid var(--neutral-200)">
                <span style="font-weight:600;color:var(--green-800);white-space:nowrap;font-size:14px;min-width:120px">${time}</span>
                <span style="color:var(--neutral-700);font-size:15px">${activity}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-donasi">
      <div class="container">
        <div class="cta-donasi-content">
          <h2 class="reveal">Tertarik Bergabung?</h2>
          <p class="reveal reveal-delay-1">Jadilah bagian dari keluarga besar Pesantren An-Nahl. Daftarkan putra-putri Anda sekarang.</p>
          <div class="reveal reveal-delay-2">
            <a href="#/pendaftaran" class="btn btn-white">Daftar Sekarang</a>
          </div>
        </div>
      </div>
    </section>
  `;
}
