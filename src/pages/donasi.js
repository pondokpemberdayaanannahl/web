import { initDonationPayment } from '../donation-payment.js';
// ═══════════════════════════════════════════
// DONASI — Donation Page
// ═══════════════════════════════════════════

import { photos } from '../data/photos.js';
import { bindSubmission } from '../form-submission.js';

export function Donasi() {
  return `
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${photos.hero.donasi}')"></div>
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
          ${[
            { icon: 'graduation-cap', title: 'Beasiswa Santri Dhuafa', desc: 'Bantu santri dari keluarga kurang mampu untuk tetap bisa menempuh pendidikan di pesantren.', target: 'Rp 150.000.000', progress: 72 },
            { icon: 'building', title: 'Pembangunan Fasilitas', desc: 'Dukungan untuk pembangunan asrama baru, perpustakaan, dan laboratorium yang lebih layak.', target: 'Rp 500.000.000', progress: 45 },
            { icon: 'heart', title: 'Operasional Pesantren', desc: 'Donasi untuk kebutuhan operasional harian pesantren, termasuk makan, listrik, dan gaji pengajar.', target: 'Rp 200.000.000', progress: 60 },
          ].map((p, i) => `
            <div class="card reveal reveal-delay-${i}" style="text-align:center">
              <div class="card-icon" style="margin:0 auto var(--space-lg)">
                <i data-lucide="${p.icon}" style="width:28px;height:28px"></i>
              </div>
              <h3 class="card-title">${p.title}</h3>
              <p class="card-text">${p.desc}</p>
              <div style="margin-bottom:var(--space-md)">
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
                  <span style="color:var(--green-700);font-weight:600">${p.progress}% terkumpul</span>
                  <span style="color:var(--neutral-500)">Target: ${p.target}</span>
                </div>
                <div style="height:8px;background:var(--neutral-200);border-radius:100px;overflow:hidden">
                  <div style="height:100%;width:${p.progress}%;background:linear-gradient(90deg,var(--green-600),var(--green-400));border-radius:100px;transition:width 1.5s ease"></div>
                </div>
              </div>
              <button class="btn btn-primary donation-program-button" type="button" data-donate-program="${p.title}">Donasi sekarang <span aria-hidden="true">→</span></button>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- Payment details remain editable through Isi website → Donasi. -->
    <section class="section payment-choices" style="background:var(--green-50)">
      <div class="container"><div class="section-header"><span class="section-label">CARA BERDONASI</span><h2 class="section-title">Metode Pembayaran</h2><p class="section-subtitle">Pilih program di atas, lalu buka petunjuk pembayaran yang sesuai.</p></div>
        <div class="payment-choice-grid">
          <button type="button" class="payment-choice" data-open-payment="bank"><i data-lucide="landmark"></i><span><strong>Transfer bank</strong><small>Lihat rekening tujuan</small></span><span aria-hidden="true">↗</span></button>
          <button type="button" class="payment-choice" data-open-payment="wallet"><i data-lucide="smartphone"></i><span><strong>E-Wallet</strong><small>GoPay, OVO, dan DANA</small></span><span aria-hidden="true">↗</span></button>
          <button type="button" class="payment-choice" data-open-payment="qris"><i data-lucide="qr-code"></i><span><strong>QRIS</strong><small>Buka kode pembayaran</small></span><span aria-hidden="true">↗</span></button>
        </div>
        <div hidden id="payment-source">
          <div data-payment-panel="bank" hidden><h3>Transfer Bank</h3><p>Bank Syariah Indonesia (BSI)</p><p class="payment-number" id="payment-bank-number">7182 8374 92</p><p>a.n. Yayasan An-Nahl</p><button type="button" class="btn btn-secondary" data-copy-payment="payment-bank-number">Salin rekening</button></div>
          <div data-payment-panel="wallet" hidden><h3>E-Wallet</h3><p>GoPay / OVO / DANA</p><p class="payment-number" id="payment-wallet-number">0812-3456-7890</p><p>a.n. Yayasan An-Nahl</p><button type="button" class="btn btn-secondary" data-copy-payment="payment-wallet-number">Salin nomor</button><p class="payment-note">Pilih nama e-wallet yang Anda gunakan pada formulir konfirmasi.</p></div>
          <div data-payment-panel="qris" hidden><h3>Bayar dengan QRIS</h3><p>Pindai kode QRIS resmi pondok melalui aplikasi bank atau e-wallet Anda.</p><img id="donation-qris" class="payment-qris" alt="QRIS resmi donasi An-Nahl" hidden /><p id="qris-unavailable" class="payment-unavailable">Kode QRIS belum tersedia. Silakan gunakan transfer bank atau e-wallet.</p></div>
        </div>
      </div>
    </section>
    <dialog id="payment-dialog" class="payment-dialog" aria-labelledby="payment-title">
      <div class="payment-dialog-header"><div><span class="section-label">BERBAGI KEBAIKAN</span><h2 id="payment-title">Cara berdonasi</h2></div><button type="button" id="payment-close" class="payment-close" aria-label="Tutup pembayaran">×</button></div>
      <div class="payment-dialog-body"><p class="payment-program-label">Program pilihan</p><p id="payment-program" class="payment-program"></p><div class="payment-tabs" role="group" aria-label="Metode pembayaran"><button type="button" data-payment-method="bank" aria-pressed="true">Transfer bank</button><button type="button" data-payment-method="wallet" aria-pressed="false">E-Wallet</button><button type="button" data-payment-method="qris" aria-pressed="false">QRIS</button></div><div id="payment-panels"></div><p id="payment-copy-status" class="payment-note" role="status"></p></div>
      <div class="payment-dialog-footer"><p>Sudah melakukan pembayaran? Kirim bukti untuk diperiksa pengurus.</p><button type="button" class="btn btn-primary" id="payment-confirm">Lanjut konfirmasi donasi →</button></div>
    </dialog>

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

  `;
}

window.initDonasi = function() {
  initDonationPayment();
  bindSubmission(document.getElementById('donation-form'), 'donasi', () => ({ nama: document.getElementById('donor-name').value.trim(), jumlah: document.getElementById('donor-amount').value.replace(/\D/g, ''), metode: document.getElementById('donor-method').value, program: document.getElementById('donor-program').value, pesan: document.getElementById('donor-message').value.trim() }), 'Konfirmasi diterima untuk diperiksa pengurus. Pesan ini belum merupakan verifikasi pembayaran.');
};
