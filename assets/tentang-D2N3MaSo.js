import{x as e}from"./site-content-BKWZVrCp.js";import{r as t}from"./photos-BW6EAMCN.js";var n=[{id:`founder`,name:`KH. Mahfudz Noor Fawwaz`,role:`Pengasuh Pesantren`,initials:`MNF`,image:`/images/leadership/kh-mahfudz-noor-fawwaz.png`},{id:`agus-thoha-noor-fawwaz`,name:`Abah Agus Thoha Noor Fawwaz, S.Pd., M.M.`,role:`Pengurus / tokoh pimpinan keluarga besar pesantren`,initials:`AT`,image:`/images/leadership/abah-agus-thoha-noor-fawwaz-white.png`},{id:`rahmat-abu-bakar`,name:`Rahmat Abu Bakar`,role:`Pembina / pengasuh umum pesantren`,initials:`RAB`,image:`/images/leadership/rahmat-abu-bakar.jpg`}];function r(){return`
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${t.hero.tentang}')"></div>
      <div class="hero-overlay"></div>
      <div class="hero-pattern"></div>
      <div class="hero-content">
        <span class="section-label" style="color: var(--green-300)">TENTANG KAMI</span>
        <h1 style="font-size: 44px">Mengenal Lebih Dekat Pesantren An-Nahl</h1>
      </div>
    </section>

    <!-- Visi & Misi -->
    <section class="section" style="background: var(--neutral-50)">
      <div class="container">
        <div class="about-content">
          <div class="about-text">
            <span class="section-label reveal">VISI & MISI</span>
            <h2 class="reveal reveal-delay-1">Mencetak Generasi Qur'ani yang Mandiri dan Berdaya</h2>
            <p class="reveal reveal-delay-2">
              Visi kami adalah menjadi pesantren terdepan dalam mencetak generasi penghafal Al-Qur'an yang berkarakter, berilmu, dan mampu memberdayakan ummat melalui pendidikan holistik.
            </p>
            <div class="checklist reveal reveal-delay-3" style="margin-top: var(--space-lg)">
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Menyelenggarakan pendidikan tahfidz yang berkualitas dan bersanad</span>
              </div>
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Memadukan kurikulum nasional dengan pendidikan keislaman</span>
              </div>
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Membentuk karakter santri yang mandiri dan bertanggung jawab</span>
              </div>
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Melatih keterampilan hidup untuk kemandirian ekonomi</span>
              </div>
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Mendorong santri untuk aktif berdakwah dan berkontribusi sosial</span>
              </div>
            </div>
          </div>
          <div class="about-image reveal">
            <img src="${t.tentang.visi}" alt="Visi Misi Pesantren" loading="lazy" />
          </div>
        </div>
      </div>
    </section>

    <!-- Sejarah -->
    <section class="section" style="background: var(--green-50)">
      <div class="container">
        <div class="section-header">
          <span class="section-label reveal">SEJARAH</span>
          <h2 class="section-title reveal reveal-delay-1">Perjalanan Kami Sejak 2011</h2>
        </div>
        <div style="max-width: 800px; margin: 0 auto">
          <p class="reveal" style="color: var(--neutral-700); margin-bottom: var(--space-lg); text-align: center">
            Pondok Pesantren Pemberdayaan Ummat An-Nahl didirikan pada tahun 2011 dengan visi sederhana namun kuat: mencetak generasi muda Muslim yang tidak hanya menghafal Al-Qur'an, tetapi juga mampu menjadi agen perubahan di masyarakat.
          </p>
          <p class="reveal reveal-delay-1" style="color: var(--neutral-700); margin-bottom: var(--space-lg); text-align: center">
            Bermula dari sebuah musholla kecil dengan hanya 15 santri, saat ini An-Nahl telah berkembang menjadi lembaga pendidikan dengan lebih dari 500 santri, fasilitas modern, dan jaringan alumni yang tersebar di seluruh Indonesia.
          </p>
          <p class="reveal reveal-delay-2" style="color: var(--neutral-700); text-align: center">
            Nama "An-Nahl" diambil dari Surah An-Nahl (lebah) yang melambangkan kerja keras, kebermanfaatan, dan kebersamaan — nilai-nilai yang menjadi fondasi pesantren ini.
          </p>
        </div>
      </div>
    </section>

    <!-- Profil Pengasuh dan Pengurus -->
    <section id="pimpinan-pesantren" class="section" style="background: var(--neutral-50)">
      <div class="container leadership-grid">
        <div class="section-header">
          <span class="section-label reveal">PENGASUH & PENGURUS</span>
          <h2 class="section-title reveal reveal-delay-1">Profil Pimpinan Pesantren</h2>
        </div>
        ${n.map((t,n)=>`<article class="leadership-card reveal reveal-delay-${n+1}" aria-labelledby="leadership-${e(t.id)}">
          <div class="leadership-portrait">
            ${t.image?`<img data-fixed-photo="${e(t.id)}" src="${e(t.image)}" alt="${e(t.name)}" width="160" height="160" loading="lazy" decoding="async" />`:`<div class="leadership-photo-placeholder" role="img" aria-label="Foto ${e(t.name)} belum tersedia" data-content-ignore><span aria-hidden="true">${e(t.initials)}</span><small aria-hidden="true">Foto segera hadir</small></div>`}
          </div>
          <h3 id="leadership-${e(t.id)}" class="leadership-name">${e(t.name)}</h3>
          <p class="leadership-role">${e(t.role)}</p>
        </article>`).join(``)}
      </div>
    </section>

    <!-- Nilai-Nilai -->
    <section class="section" style="background: var(--green-50)">
      <div class="container">
        <div class="section-header">
          <span class="section-label reveal">NILAI INTI</span>
          <h2 class="section-title reveal reveal-delay-1">Fondasi yang Kami Pegang Teguh</h2>
        </div>
        <div class="grid-4">
          <div class="card reveal" style="text-align:center">
            <div class="card-icon" style="margin: 0 auto var(--space-lg)">
              <i data-lucide="book-open" style="width:28px;height:28px"></i>
            </div>
            <h3 class="card-title">Ilmu</h3>
            <p class="card-text">Menuntut ilmu adalah kewajiban. Kami menanamkan semangat belajar sepanjang hayat.</p>
          </div>
          <div class="card reveal reveal-delay-1" style="text-align:center">
            <div class="card-icon" style="margin: 0 auto var(--space-lg)">
              <i data-lucide="heart" style="width:28px;height:28px"></i>
            </div>
            <h3 class="card-title">Akhlak</h3>
            <p class="card-text">Karakter mulia adalah buah dari pendidikan yang benar dan lingkungan yang baik.</p>
          </div>
          <div class="card reveal reveal-delay-2" style="text-align:center">
            <div class="card-icon" style="margin: 0 auto var(--space-lg)">
              <i data-lucide="handshake" style="width:28px;height:28px"></i>
            </div>
            <h3 class="card-title">Kemandirian</h3>
            <p class="card-text">Santri dibekali keterampilan agar mampu mandiri dan berdaya di masyarakat.</p>
          </div>
          <div class="card reveal reveal-delay-3" style="text-align:center">
            <div class="card-icon" style="margin: 0 auto var(--space-lg)">
              <i data-lucide="globe" style="width:28px;height:28px"></i>
            </div>
            <h3 class="card-title">Dakwah</h3>
            <p class="card-text">Setiap santri adalah dai. Kami mendorong kontribusi nyata untuk ummat.</p>
          </div>
        </div>
      </div>
    </section>
  `}export{r as Tentang};