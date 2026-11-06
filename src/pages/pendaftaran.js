// ═══════════════════════════════════════════
// PENDAFTARAN — Registration Page
// ═══════════════════════════════════════════

import { photos } from '../data/photos.js';
import { ATTACHMENT_HELP, bindGoogleSubmission, getRegistrationStatus } from '../google-forms.js';
import { pondokContact } from '../data/pondok.js';
import { jenjangCards } from '../pondok-settings.js';
import { demoSettings, demoRegistrationStatus, registrationTimelineHtml } from '../registration-period.js';

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
  const timeline = document.getElementById('registration-timeline');
  let currentYear = null;
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
      const local = demoSettings();
      const info = local ? demoRegistrationStatus(local) : await getRegistrationStatus();
      if (disposed || done) return;
      state = info.state;
      currentYear = info.registration?.year || null;
      timeline.innerHTML = registrationTimelineHtml(info);
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
        preparing: 'Pengurus sedang menyiapkan rekap penerimaan. Pendaftaran akan tersedia setelah rekap siap.',
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
    registrationYear: String(currentYear || ''), nama: document.getElementById('reg-nama').value.trim(), tempatLahir: document.getElementById('reg-tempat-lahir').value.trim(), tanggalLahir: document.getElementById('reg-tanggal-lahir').value,
    jenisKelamin: document.getElementById('reg-jenis-kelamin').value, asalSekolah: document.getElementById('reg-asal-sekolah').value.trim(), jenjang: levels.querySelector(':checked').value,
    namaWali: document.getElementById('reg-nama-wali').value.trim(), noWA: document.getElementById('reg-no-wa').value.trim(), email: document.getElementById('reg-email').value.trim(), alamat: document.getElementById('reg-alamat').value.trim()
  }), '', {
    canSubmit() {
      if (state !== 'open' || done) return false;
      if (step < steps.length - 1) { advance(); return false; }
      if (!steps.every((_, index) => validateStep(index))) return false;
      if (demoSettings()) { form.querySelector('.submission-status').textContent = 'Ini pratinjau demo. Isian belum dikirim ke Google Sheets.'; return false; }
      return true;
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

export function Pendaftaran(settings = {}) {
  return `
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${photos.hero.pendaftaran}')"></div>
      <div class="hero-overlay"></div>
      <div class="hero-pattern"></div>
      <div class="hero-content">
        <span class="section-label" style="color: var(--green-300)">PENDAFTARAN</span>
        <h1 style="font-size: 44px">Pendaftaran Santri Putra</h1>
        <p class="hero-subtitle">Program Beasiswa Pesantren An-Nahl</p>
      </div>
    </section>

    <!-- Alur Pendaftaran -->
    <section class="section" style="background: var(--neutral-50)">
      <div class="container">
        <div class="section-header">
          <span class="section-label reveal">ALUR PENDAFTARAN</span>
          <h2 class="section-title reveal reveal-delay-1">Ikuti Tahap Penerimaan Santri</h2>
        </div>
        <div id="registration-timeline" data-content-ignore>${registrationTimelineHtml(settings)}</div>
      </div>
    </section>

    <!-- Persyaratan -->
    <section class="section" style="background: var(--green-50)">
      <div class="container admission-requirements">
        <div class="section-header">
          <span class="section-label reveal">PERSYARATAN</span>
          <h2 class="reveal reveal-delay-1">Syarat Pendaftaran Santri Putra</h2>
          <p class="section-subtitle reveal">Siapkan persyaratan berikut sebelum mengisi formulir.</p>
        </div>
        <div class="checklist admission-requirements-list reveal">
          <div class="checklist-item"><i data-lucide="circle-check" class="checklist-icon"></i><span>Calon santri putra</span></div>
          <div class="checklist-item"><i data-lucide="circle-check" class="checklist-icon"></i><span>Beragama Islam</span></div>
          <div class="checklist-item"><i data-lucide="circle-check" class="checklist-icon"></i><span>Memenuhi persyaratan jenjang yang dipilih</span></div>
          <div class="checklist-item"><i data-lucide="circle-check" class="checklist-icon"></i><span>Sehat jasmani dan rohani</span></div>
          <div class="checklist-item"><i data-lucide="circle-check" class="checklist-icon"></i><span>Mendapat izin orang tua atau wali</span></div>
          <div class="checklist-item"><i data-lucide="circle-check" class="checklist-icon"></i><span>Bersedia mengikuti kegiatan pendidikan pesantren</span></div>
          <div class="checklist-item"><i data-lucide="circle-check" class="checklist-icon"></i><span>Fotokopi rapor terakhir sesuai jenjang</span></div>
          <div class="checklist-item"><i data-lucide="circle-check" class="checklist-icon"></i><span>Pas foto 3×4 (4 lembar)</span></div>
          <div class="checklist-item"><i data-lucide="circle-check" class="checklist-icon"></i><span>Fotokopi KK dan akta kelahiran</span></div>
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
              <input id="reg-jenis-kelamin" class="form-input" value="Laki-laki" readonly aria-describedby="reg-putra-note" /><small id="reg-putra-note">Penerimaan saat ini untuk santri putra.</small>
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
            ['Siapa yang dapat mendaftar?', 'Penerimaan saat ini dibuka untuk calon santri putra sesuai jenjang yang tersedia.'],
            ['Bagaimana cara memilih jenjang?', 'Pilih jenjang yang tersedia pada tahap pertama formulir. Jika masih ragu, hubungi pengurus melalui WhatsApp.'],
            ['Apakah ada biaya pendaftaran atau pendidikan?', 'Tidak ada biaya pendaftaran maupun biaya pendidikan. Penerimaan ini melalui program beasiswa pesantren.'],
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
