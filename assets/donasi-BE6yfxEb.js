import{r as e}from"./photos-BW6EAMCN.js";import{t}from"./form-submission-Dtxuh8WK.js";function n(){return`
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${e.hero.donasi}')"></div>
      <div class="hero-overlay"></div>
      <div class="hero-pattern"></div>
      <div class="hero-content">
        <div class="hero-arabic">وَأَنفِقُوا فِي سَبِيلِ اللَّهِ</div>
        <h1 style="font-size: 44px">Donasi untuk Masa Depan Santri</h1>
        <p class="hero-subtitle">Kontribusi Anda membantu santri dhuafa mendapat pendidikan berkualitas.</p>
      </div>
    </section>

    <!-- Program Donasi -->
    <section class="section" style="background: var(--neutral-50)">
      <div class="container">
        <div class="section-header">
          <span class="section-label reveal">PROGRAM DONASI</span>
          <h2 class="section-title reveal reveal-delay-1">Pilih Program yang Ingin Anda Dukung</h2>
        </div>
        <div class="grid-3">
          ${[{icon:`graduation-cap`,title:`Beasiswa Santri Dhuafa`,desc:`Bantu santri dari keluarga kurang mampu untuk tetap bisa menempuh pendidikan di pesantren.`,target:`Rp 150.000.000`,progress:72},{icon:`building`,title:`Pembangunan Fasilitas`,desc:`Dukungan untuk pembangunan asrama baru, perpustakaan, dan laboratorium yang lebih layak.`,target:`Rp 500.000.000`,progress:45},{icon:`heart`,title:`Operasional Pesantren`,desc:`Donasi untuk kebutuhan operasional harian pesantren, termasuk makan, listrik, dan gaji pengajar.`,target:`Rp 200.000.000`,progress:60}].map((e,t)=>`
            <div class="card reveal reveal-delay-${t}" style="text-align:center">
              <div class="card-icon" style="margin:0 auto var(--space-lg)">
                <i data-lucide="${e.icon}" style="width:28px;height:28px"></i>
              </div>
              <h3 class="card-title">${e.title}</h3>
              <p class="card-text">${e.desc}</p>
              <div style="margin-bottom:var(--space-md)">
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
                  <span style="color:var(--green-700);font-weight:600">${e.progress}% terkumpul</span>
                  <span style="color:var(--neutral-500)">Target: ${e.target}</span>
                </div>
                <div style="height:8px;background:var(--neutral-200);border-radius:100px;overflow:hidden">
                  <div style="height:100%;width:${e.progress}%;background:linear-gradient(90deg,var(--green-600),var(--green-400));border-radius:100px;transition:width 1.5s ease"></div>
                </div>
              </div>
            </div>
          `).join(``)}
        </div>
      </div>
    </section>

    <!-- Metode Pembayaran -->
    <section class="section" style="background: var(--green-50)">
      <div class="container">
        <div class="section-header">
          <span class="section-label reveal">CARA BERDONASI</span>
          <h2 class="section-title reveal reveal-delay-1">Metode Pembayaran</h2>
        </div>
        <div class="grid-3">
          <div class="card reveal" style="text-align:center">
            <div class="card-icon" style="margin:0 auto var(--space-lg)">
              <i data-lucide="landmark" style="width:28px;height:28px"></i>
            </div>
            <h3 class="card-title">Transfer Bank</h3>
            <div style="margin-top:var(--space-md);font-size:15px;color:var(--neutral-700)">
              <p><strong>Bank Syariah Indonesia (BSI)</strong></p>
              <p style="font-size:20px;font-weight:700;color:var(--green-800);margin:8px 0;letter-spacing:1px">7182 8374 92</p>
              <p>a.n. Yayasan An-Nahl</p>
            </div>
          </div>
          <div class="card reveal reveal-delay-1" style="text-align:center">
            <div class="card-icon" style="margin:0 auto var(--space-lg)">
              <i data-lucide="smartphone" style="width:28px;height:28px"></i>
            </div>
            <h3 class="card-title">E-Wallet</h3>
            <div style="margin-top:var(--space-md);font-size:15px;color:var(--neutral-700)">
              <p><strong>GoPay / OVO / DANA</strong></p>
              <p style="font-size:20px;font-weight:700;color:var(--green-800);margin:8px 0;letter-spacing:1px">0812-3456-7890</p>
              <p>a.n. Yayasan An-Nahl</p>
            </div>
          </div>
          <div class="card reveal reveal-delay-2" style="text-align:center">
            <div class="card-icon" style="margin:0 auto var(--space-lg)">
              <i data-lucide="qr-code" style="width:28px;height:28px"></i>
            </div>
            <h3 class="card-title">QRIS</h3>
            <div style="margin-top:var(--space-md);font-size:15px;color:var(--neutral-700)">
              <p>Scan QR code di bawah ini menggunakan aplikasi e-wallet atau m-banking Anda.</p>
              <div style="width:140px;height:140px;background:var(--neutral-100);border-radius:var(--radius-md);margin:16px auto;display:flex;align-items:center;justify-content:center;color:var(--neutral-500)">
                <i data-lucide="qr-code" style="width:60px;height:60px"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Form Konfirmasi -->
    <section class="section" style="background: var(--neutral-50)">
      <div class="container">
        <div class="section-header">
          <span class="section-label reveal">KONFIRMASI</span>
          <h2 class="section-title reveal reveal-delay-1">Konfirmasi Donasi</h2>
          <p class="section-subtitle reveal reveal-delay-2">Setelah melakukan transfer, mohon konfirmasi agar kami dapat mencatat donasi Anda.</p>
        </div>
        <div style="max-width:600px;margin:0 auto" class="reveal">
          <form id="donation-form">
            <div class="form-group">
              <label class="form-label">Nama Donatur *</label>
              <input id="donor-name" type="text" class="form-input" placeholder="Nama lengkap atau 'Hamba Allah'" required />
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-lg)">
              <div class="form-group">
                <label class="form-label">Jumlah Donasi *</label>
                <input id="donor-amount" type="text" inputmode="numeric" class="form-input" placeholder="Rp 500.000" required />
              </div>
              <div class="form-group">
                <label class="form-label">Metode Pembayaran *</label>
                <select id="donor-method" class="form-select" required>
                  <option value="">Pilih metode</option>
                  <option>Transfer Bank BSI</option>
                  <option>GoPay</option>
                  <option>OVO</option>
                  <option>DANA</option>
                  <option>QRIS</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Program Donasi</label>
              <select id="donor-program" class="form-select">
                <option value="">Pilih program (opsional)</option>
                <option>Beasiswa Santri Dhuafa</option>
                <option>Pembangunan Fasilitas</option>
                <option>Operasional Pesantren</option>
                <option>Donasi Umum</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Pesan / Doa (Opsional)</label>
              <textarea id="donor-message" class="form-textarea" placeholder="Tuliskan pesan atau doa Anda..." style="min-height:100px"></textarea>
            </div>
            <div class="form-group attachment-box">
              <label class="form-label" for="donor-files">Bukti transfer <span>(opsional)</span></label>
              <p id="donor-files-help" class="attachment-help">Foto, PDF, DOCX, XLSX, atau PPTX. Maksimal 3 berkas, 2 MB per berkas dan 5 MB total.</p>
              <input id="donor-files" data-form-files type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.xlsx,.pptx" aria-describedby="donor-files-help donor-files-feedback" />
              <ul data-file-list class="attachment-list"></ul>
              <p id="donor-files-feedback" data-file-feedback class="attachment-feedback" aria-live="polite"></p>
              <button type="button" data-clear-files class="attachment-clear" hidden>Kosongkan lampiran</button>
              <p class="attachment-privacy">Bukti tersimpan di akun Google pondok untuk diperiksa pengurus. Konfirmasi ini belum merupakan verifikasi pembayaran.</p>
            </div>
            <div class="form-trap" aria-hidden="true"><label for="donor-website">Website<input id="donor-website" data-website type="text" tabindex="-1" autocomplete="off" /></label></div>
            <p class="submission-status" role="status"></p>
            <button type="submit" class="btn btn-primary" style="width:100%">
              <i data-lucide="heart" style="width:18px;height:18px"></i>
              Konfirmasi Donasi
            </button>
          </form>
        </div>
      </div>
    </section>

    <!-- Transparansi -->
    <section class="cta-donasi">
      <div class="container">
        <div class="cta-donasi-content">
          <span class="section-label reveal" style="color:var(--green-300)">TRANSPARANSI</span>
          <h2 class="reveal reveal-delay-1">Laporan Donasi Terbuka</h2>
          <p class="reveal reveal-delay-2">Kami berkomitmen untuk transparan dalam pengelolaan donasi. Laporan penggunaan dana dipublikasikan secara berkala dan dapat diakses oleh seluruh donatur.</p>
          <div class="reveal reveal-delay-3">
            <a href="#" class="btn btn-white">
              <i data-lucide="file-text" style="width:18px;height:18px"></i>
              Unduh Laporan 2025
            </a>
          </div>
        </div>
      </div>
    </section>
  `}window.initDonasi=function(){t(document.getElementById(`donation-form`),`donasi`,()=>({nama:document.getElementById(`donor-name`).value.trim(),jumlah:document.getElementById(`donor-amount`).value.replace(/\D/g,``),metode:document.getElementById(`donor-method`).value,program:document.getElementById(`donor-program`).value,pesan:document.getElementById(`donor-message`).value.trim()}),`Konfirmasi diterima untuk diperiksa pengurus. Pesan ini belum merupakan verifikasi pembayaran.`)};export{n as Donasi};