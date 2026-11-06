// ═══════════════════════════════════════════
// PENDAFTARAN — Registration Page
// ═══════════════════════════════════════════

import { photos } from '../data/photos.js';
import { ATTACHMENT_HELP, bindGoogleSubmission, getRegistrationStatus } from '../google-forms.js';
import { pondokContact } from '../data/pondok.js';
import { jenjangCards } from '../pondok-settings.js';

export function initPendaftaran() {
  const form = document.getElementById('registration-form');
  if (!form) return;
  const status = document.getElementById('registration-period');
  const receipt = document.getElementById('registration-receipt');
  const levels = form.querySelector('[data-jenjang]');
  const steps = [...form.querySelectorAll('[data-registration-step]')];
  const indicators = [...form.querySelectorAll('[data-registration-indicator]')];
  const progress = form.querySelector('progress');
  const next = form.querySelector('[data-registration-next]');
  const back = form.querySelector('[data-registration-back]');
  const submit = form.querySelector('[type="submit"]');
  const retry = document.getElementById('registration-retry');
  const format = date => new Date(`${date}T00:00:00+07:00`).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Jakarta' });
  let step = 0, state = '', revision = null, timer, done = false, refreshing = false, disposed = false;

  function showStep(index, focus = false) {
    step = index;
    steps.forEach((panel, i) => { panel.hidden = i !== step; });
    indicators.forEach((indicator, i) => {
      indicator.dataset.complete = String(i < step);
      if (i === step) indicator.setAttribute('aria-current', 'step');
      else indicator.removeAttribute('aria-current');
    });
    progress.value = step + 1;
    back.hidden = step === 0;
    next.hidden = step === steps.length - 1;
    submit.hidden = !next.hidden;
    if (focus) steps[step].querySelector('legend').focus();
  }
  function validateStep(index) {
    const invalid = [...steps[index].querySelectorAll('input,select,textarea')].find(field => !field.checkValidity());
    if (!invalid) return true;
    if (step !== index) showStep(index);
    invalid.reportValidity();
    return false;
  }
  function advance() { if (state === 'open' && step < steps.length - 1 && validateStep(step)) showStep(step + 1, true); }
  async function refresh() {
    if (disposed || done || refreshing) return;
    clearTimeout(timer);
    refreshing = true;
    try {
      const info = await getRegistrationStatus();
      if (disposed || done) return;
      state = info.state;
      if (revision !== info.revision) {
        const selected = levels.querySelector(':checked')?.value;
        levels.innerHTML = jenjangCards(info.levels, true);
        const previous = [...levels.querySelectorAll('input')].find(input => input.value === selected);
        if (previous) previous.checked = true;
        else if (step > 0) showStep(0);
        revision = info.revision;
      }
      const period = info.opens_on && info.closes_on ? ` Periode: ${format(info.opens_on)} – ${format(info.closes_on)} (WIB).` : '';
      status.textContent = {
        open: 'Pendaftaran sedang dibuka.',
        upcoming: 'Pendaftaran belum dibuka.',
        closed: 'Pendaftaran sudah ditutup.',
        unscheduled: 'Jadwal pendaftaran belum diumumkan.',
      }[state] + period;
      status.dataset.state = state;
      form.hidden = state !== 'open';
      retry.hidden = true;
      const changeAt = state === 'open' ? info.closesAt : state === 'upcoming' ? info.opensAt : null;
      const remaining = changeAt ? Math.max(50, (changeAt - info.serverTime) * 1000) : Infinity;
      timer = setTimeout(() => {
        if (remaining <= 60000 && state === 'open') {
          state = 'checking'; form.hidden = true; status.textContent = 'Memeriksa jadwal pendaftaran…';
        }
        refresh();
      }, Math.min(remaining, 60000));
    } catch {
      if (disposed || done) return;
      state = ''; form.hidden = true; retry.hidden = false;
      status.dataset.state = 'unavailable';
      status.textContent = 'Jadwal belum dapat dimuat. Coba lagi atau hubungi pengurus.';
      timer = setTimeout(refresh, 60000);
    } finally { refreshing = false; }
  }
  next.addEventListener('click', advance);
  back.addEventListener('click', () => showStep(step - 1, true));
  retry.addEventListener('click', refresh);
  const resumed = () => { if (document.visibilityState === 'visible') refresh(); };
  document.addEventListener('visibilitychange', resumed);
  showStep(0);
  bindGoogleSubmission(form, 'pendaftaran', () => ({
    nama: document.getElementById('reg-nama').value.trim(), tempatLahir: document.getElementById('reg-tempat-lahir').value.trim(), tanggalLahir: document.getElementById('reg-tanggal-lahir').value,
    jenisKelamin: document.getElementById('reg-jenis-kelamin').value, asalSekolah: document.getElementById('reg-asal-sekolah').value.trim(), jenjang: levels.querySelector(':checked').value,
    namaWali: document.getElementById('reg-nama-wali').value.trim(), noWA: document.getElementById('reg-no-wa').value.trim(), email: document.getElementById('reg-email').value.trim(), alamat: document.getElementById('reg-alamat').value.trim()
  }), '', {
    canSubmit() {
      if (state !== 'open' || done) return false;
      if (step < steps.length - 1) { advance(); return false; }
      return steps.every((_, index) => validateStep(index));
    },
    onSuccess() {
      done = true; clearTimeout(timer); form.hidden = true;
      receipt.hidden = false;
      receipt.textContent = 'Pendaftaran diterima. Pengurus akan menghubungi Anda melalui kontak yang dicantumkan.';
      receipt.focus();
    },
    onError(error) { if (error.status === 409 || error.status === 422) refresh(); },
  });
  refresh();
  return () => { disposed = true; clearTimeout(timer); document.removeEventListener('visibilitychange', resumed); };
}
window.initPendaftaran = initPendaftaran;

export function Pendaftaran() {
  return `
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${photos.hero.pendaftaran}')"></div>
      <div class="hero-overlay"></div>
      <div class="hero-pattern"></div>
      <div class="hero-content">
        <span class="section-label" style="color: var(--green-300)">PENDAFTARAN</span>
        <h1 style="font-size: 44px">Pendaftaran Santri Baru</h1>
        <p class="hero-subtitle">Tahun Ajaran 2026/2027 — Kuota Terbatas</p>
      </div>
    </section>

    <!-- Alur Pendaftaran -->
    <section class="section" style="background: var(--neutral-50)">
      <div class="container">
        <div class="section-header">
          <span class="section-label reveal">ALUR PENDAFTARAN</span>
          <h2 class="section-title reveal reveal-delay-1">Langkah Mudah untuk Bergabung</h2>
        </div>
        <ol class="registration-flow reveal" role="list" aria-label="Urutan alur pendaftaran">
          ${[
            { num: '01', title: 'Isi Formulir', desc: 'Pilih jenjang dan lengkapi data calon santri serta wali.' },
            { num: '02', title: 'Kirim Berkas', desc: 'Lampirkan dokumen pendukung bila sudah siap.' },
            { num: '03', title: 'Seleksi', desc: 'Tim kami akan meninjau berkas dan menjadwalkan tes seleksi.' },
            { num: '04', title: 'Diterima', desc: 'Santri yang lolos seleksi akan menerima surat penerimaan resmi.' },
          ].map(step => `
            <li>
              <span class="registration-flow-marker" aria-hidden="true">${step.num}</span>
              <h3>${step.title}</h3>
              <p>${step.desc}</p>
            </li>
          `).join('')}
        </ol>
      </div>
    </section>

    <!-- Persyaratan -->
    <section class="section" style="background: var(--green-50)">
      <div class="container">
        <div class="grid-2 registration-details">
          <div>
            <span class="section-label reveal">PERSYARATAN</span>
            <h2 class="reveal reveal-delay-1" style="margin-bottom: var(--space-lg)">Syarat Pendaftaran</h2>
            <div class="checklist reveal reveal-delay-2">
              <div class="checklist-item"><i data-lucide="circle-check" class="checklist-icon"></i><span>Beragama Islam</span></div>
              <div class="checklist-item"><i data-lucide="circle-check" class="checklist-icon"></i><span>Lulusan SD/MI atau SMP/MTs (sesuai jenjang)</span></div>
              <div class="checklist-item"><i data-lucide="circle-check" class="checklist-icon"></i><span>Sehat jasmani dan rohani</span></div>
              <div class="checklist-item"><i data-lucide="circle-check" class="checklist-icon"></i><span>Mendapat izin orang tua/wali</span></div>
              <div class="checklist-item"><i data-lucide="circle-check" class="checklist-icon"></i><span>Bersedia mengikuti seluruh program pesantren</span></div>
              <div class="checklist-item"><i data-lucide="circle-check" class="checklist-icon"></i><span>Fotokopi rapor terakhir</span></div>
              <div class="checklist-item"><i data-lucide="circle-check" class="checklist-icon"></i><span>Pas foto 3×4 (4 lembar)</span></div>
              <div class="checklist-item"><i data-lucide="circle-check" class="checklist-icon"></i><span>Fotokopi KK dan akta kelahiran</span></div>
            </div>
          </div>
          <div class="reveal">
            <div class="card registration-fees" style="background: var(--white)">
              <div class="registration-fees-body" style="text-align:center; padding: var(--space-lg)">
                <span class="section-label">BIAYA PENDIDIKAN</span>
                <h3 style="font-family:var(--font-heading);font-size:28px;margin: var(--space-md) 0">Tahun Ajaran 2026/2027</h3>
                <div style="margin: var(--space-xl) 0">
                  <div style="display:flex;justify-content:space-between;padding:var(--space-md) 0;border-bottom:1px solid var(--neutral-200)">
                    <span style="color:var(--neutral-700)">Biaya Pendaftaran</span>
                    <strong>Rp 350.000</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding:var(--space-md) 0;border-bottom:1px solid var(--neutral-200)">
                    <span style="color:var(--neutral-700)">Infaq Pembangunan</span>
                    <strong>Rp 5.000.000</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding:var(--space-md) 0;border-bottom:1px solid var(--neutral-200)">
                    <span style="color:var(--neutral-700)">SPP / Bulan</span>
                    <strong>Rp 1.200.000</strong>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding:var(--space-md) 0">
                    <span style="color:var(--neutral-700)">Seragam & Kitab</span>
                    <strong>Rp 1.500.000</strong>
                  </div>
                </div>
                <p style="font-size:13px;color:var(--neutral-500)">* Tersedia program beasiswa untuk santri berprestasi dan dhuafa</p>
                <div class="registration-bank" aria-labelledby="registration-bank-title">
                  <h4 id="registration-bank-title">Rekening biaya pendaftaran</h4>
                  <dl><div><dt>Bank</dt><dd>Bank Pondok (contoh)</dd></div><div><dt>Nomor rekening</dt><dd class="registration-account">0000 0000 0000</dd></div><div><dt>Atas nama</dt><dd>Pondok Pesantren An-Nahl</dd></div></dl>
                  <p class="registration-bank-note">Rekening dummy untuk contoh tampilan. Jangan melakukan transfer ke nomor ini. Hubungi pengurus untuk informasi pembayaran yang berlaku.</p>
                  <a href="https://wa.me/${pondokContact.whatsapp}" class="card-link" target="_blank" rel="noopener noreferrer">Hubungi pengurus: ${pondokContact.phone}</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Formulir -->
    <section class="section" style="background: var(--neutral-50)">
      <div class="container">
        <div class="section-header">
          <span class="section-label reveal">FORMULIR</span>
          <h2 class="section-title reveal reveal-delay-1">Formulir Pendaftaran Online</h2>
          <p class="section-subtitle reveal reveal-delay-2">Lengkapi data berikut dengan benar. Tim kami akan menghubungi Anda dalam 3 hari kerja.</p>
        </div>
        <div style="max-width: 700px; margin: 0 auto" class="reveal">
          <div class="registration-period-box" data-content-ignore>
            <p id="registration-period" role="status">Memeriksa jadwal pendaftaran…</p>
            <button id="registration-retry" type="button" class="btn btn-secondary" hidden>Coba lagi</button>
            <a href="https://wa.me/${pondokContact.whatsapp}" target="_blank" rel="noopener noreferrer">Tanya pengurus</a>
          </div>
          <p id="registration-receipt" class="submission-status" data-state="success" role="status" tabindex="-1" hidden></p>
          <form id="registration-form" hidden novalidate>
            <ol class="registration-indicators" aria-label="Tahap pengisian">${['Calon santri','Orang tua / wali','Lampiran'].map(label => `<li data-registration-indicator>${label}</li>`).join('')}</ol>
            <progress max="3" value="1" aria-label="Progres pengisian pendaftaran"></progress>
            <fieldset data-registration-step>
            <legend tabindex="-1">Data Calon Santri</legend>
            <fieldset class="form-group registration-choices"><legend>Pilih jenjang *</legend><div data-jenjang></div></fieldset>
            
            <div class="form-group">
              <label class="form-label" for="reg-nama">Nama Lengkap *</label>
              <input type="text" id="reg-nama" class="form-input" placeholder="Masukkan nama lengkap calon santri" minlength="2" required />
            </div>
            <div class="registration-field-grid">
              <div class="form-group">
                <label class="form-label" for="reg-tempat-lahir">Tempat Lahir *</label>
                <input type="text" id="reg-tempat-lahir" class="form-input" placeholder="Kota kelahiran" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="reg-tanggal-lahir">Tanggal Lahir *</label>
                <input type="date" id="reg-tanggal-lahir" class="form-input" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-jenis-kelamin">Jenis Kelamin *</label>
              <select id="reg-jenis-kelamin" class="form-select" required>
                <option value="">Pilih jenis kelamin</option>
                <option>Laki-laki</option>
                <option>Perempuan</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-asal-sekolah">Asal Sekolah *</label>
              <input type="text" id="reg-asal-sekolah" class="form-input" placeholder="Nama sekolah asal" required />
            </div>
            </fieldset>
            <fieldset data-registration-step hidden>
            <legend tabindex="-1">Data Orang Tua / Wali</legend>

            <div class="form-group">
              <label class="form-label" for="reg-nama-wali">Nama Orang Tua / Wali *</label>
              <input type="text" id="reg-nama-wali" class="form-input" placeholder="Nama lengkap orang tua/wali" required />
            </div>
            <div class="registration-field-grid">
              <div class="form-group">
                <label class="form-label" for="reg-no-wa">No. WhatsApp *</label>
                <input type="tel" id="reg-no-wa" class="form-input" placeholder="08xx-xxxx-xxxx" required />
              </div>
              <div class="form-group">
                <label class="form-label" for="reg-email">Email</label>
                <input type="email" id="reg-email" class="form-input" placeholder="email@contoh.com" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="reg-alamat">Alamat Lengkap *</label>
              <textarea id="reg-alamat" class="form-textarea" placeholder="Alamat lengkap tempat tinggal" style="min-height:100px" required></textarea>
            </div>

            </fieldset>
            <fieldset data-registration-step hidden>
            <legend tabindex="-1">Periksa dan Kirim</legend>
            <p class="attachment-help">Pastikan data calon santri dan wali sudah benar. Gunakan tombol Kembali untuk memperbaiki isian.</p>
            <div class="form-group attachment-box">
              <label class="form-label" for="reg-files">Dokumen pendukung <span>(opsional)</span></label>
              <p id="reg-files-help" class="attachment-help">${ATTACHMENT_HELP}</p>
              <input id="reg-files" data-form-files type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.xlsx,.pptx" aria-describedby="reg-files-help reg-files-feedback" />
              <ul data-file-list class="attachment-list"></ul>
              <p id="reg-files-feedback" data-file-feedback class="attachment-feedback" aria-live="polite"></p>
              <button type="button" data-clear-files class="attachment-clear" hidden>Kosongkan lampiran</button>
              <p class="attachment-privacy">Isian dan lampiran diterima melalui akun Google pondok. Berkas hanya dapat dibuka oleh pengurus yang memiliki akses.</p>
            </div>
            </fieldset>
            <div class="form-trap" aria-hidden="true"><label for="reg-website">Website<input id="reg-website" data-website type="text" tabindex="-1" autocomplete="off" /></label></div>
            <!-- Notifikasi -->
            <p id="reg-notif" class="submission-status" role="status"></p>

            <div class="registration-actions">
              <button type="button" class="btn btn-secondary" data-registration-back hidden>Kembali</button>
              <button type="button" class="btn btn-primary" data-registration-next>Lanjut</button>
              <button type="submit" id="reg-submit-btn" class="btn btn-primary" hidden>
                <i data-lucide="send" style="width:18px;height:18px"></i>
                Kirim Pendaftaran
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="section" style="background: var(--green-50)">
      <div class="container">
        <div class="section-header">
          <span class="section-label reveal">FAQ</span>
          <h2 class="section-title reveal reveal-delay-1">Pertanyaan yang Sering Diajukan</h2>
        </div>
        <div style="max-width: 700px; margin: 0 auto; display:flex;flex-direction:column;gap:var(--space-md)">
          ${[
            ['Apakah pesantren menerima santri putra dan putri?', 'Ya, Pesantren An-Nahl menerima santri putra dan putri dengan asrama terpisah dan pengajar sesuai gender.'],
            ['Bagaimana cara memilih jenjang?', 'Pilih jenjang yang tersedia pada tahap pertama formulir. Jika masih ragu, hubungi pengurus melalui WhatsApp.'],
            ['Apakah tersedia beasiswa?', 'Ya, tersedia beasiswa penuh dan parsial untuk santri berprestasi dan dari keluarga kurang mampu. Hubungi kami untuk informasi lebih lanjut.'],
            ['Bolehkah orang tua berkunjung?', 'Orang tua dapat berkunjung setiap hari Ahad dan hari libur. Jadwal kunjungan akan diinformasikan lebih lanjut.'],
            ['Apakah santri boleh membawa HP?', 'Penggunaan gadget diatur oleh pesantren. Santri tidak diperkenankan membawa HP pribadi selama kegiatan belajar.'],
          ].map(([q, a], i) => `
            <div class="card reveal" style="padding:var(--space-lg)">
              <h3 style="font-size:17px;margin-bottom:var(--space-sm);color:var(--green-900)">${q}</h3>
              <p style="font-size:15px;color:var(--neutral-700);line-height:1.65">${a}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}
