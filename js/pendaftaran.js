/**
 * Pondok Pesantren Pemberdayaan Ummat An-Nahl
 * Form Pendaftaran Santri Baru (PSB) Logic
 */

// Konfigurasi Nomor WhatsApp Panitia PSB (Ubah sesuai nomor resmi)
const CONFIG = {
  ADMIN_WA: '6281398908980', // Format: 628xxx (tanpa + atau 0)
  TAHUN_AJARAN: '2025/2026',
  STORAGE_KEY: 'annahl_psb_draft_v1',
  REG_PREFIX: 'AN-25'
};

let currentStep = 1;
const totalSteps = 4;

document.addEventListener('DOMContentLoaded', () => {
  initFormWizard();
  restoreDraft();
  initAutoSave();
});

/* 1. Multi-step Form Wizard */
function initFormWizard() {
  const nextBtns = document.querySelectorAll('.btn-next-step');
  const prevBtns = document.querySelectorAll('.btn-prev-step');
  const regForm = document.getElementById('registrationForm');

  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        goToStep(currentStep + 1);
      }
    });
  });

  prevBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      goToStep(currentStep - 1);
    });
  });

  if (regForm) {
    regForm.addEventListener('submit', handleFormSubmit);
  }
}

function goToStep(step) {
  if (step < 1 || step > totalSteps) return;

  // Update step cards visibility
  document.querySelectorAll('.form-step').forEach(el => {
    el.classList.remove('active');
  });
  const targetStepEl = document.getElementById(`step-${step}`);
  if (targetStepEl) {
    targetStepEl.classList.add('active');
  }

  // Update stepper navigation badges
  document.querySelectorAll('.step-indicator').forEach(ind => {
    const indStep = parseInt(ind.getAttribute('data-step'), 10);
    ind.classList.remove('active', 'completed');
    if (indStep === step) {
      ind.classList.add('active');
    } else if (indStep < step) {
      ind.classList.add('completed');
    }
  });

  currentStep = step;

  // If entering confirmation step (step 4), populate summary
  if (step === 4) {
    populateSummary();
  }

  // Scroll to form top smoothly
  const container = document.querySelector('.reg-container');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* 2. Validation per step */
function validateStep(step) {
  const currentStepEl = document.getElementById(`step-${step}`);
  if (!currentStepEl) return true;

  const requiredInputs = currentStepEl.querySelectorAll('[required]');
  let isValid = true;
  let firstInvalidEl = null;

  requiredInputs.forEach(input => {
    // Check radio group
    if (input.type === 'radio') {
      const radioGroup = currentStepEl.querySelectorAll(`input[name="${input.name}"]`);
      const isChecked = Array.from(radioGroup).some(r => r.checked);
      if (!isChecked) {
        isValid = false;
        if (!firstInvalidEl) firstInvalidEl = input;
      }
    } else if (!input.value.trim()) {
      isValid = false;
      input.classList.add('input-error');
      if (!firstInvalidEl) firstInvalidEl = input;
    } else {
      input.classList.remove('input-error');
    }
  });

  if (!isValid) {
    alert('Mohon lengkapi semua kolom bertanda bintang (*) sebelum melanjutkan.');
    if (firstInvalidEl) {
      firstInvalidEl.focus();
    }
  }

  return isValid;
}

/* 3. Generate summary on Step 4 */
function populateSummary() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '-';
  };

  const getRadioVal = (name) => {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '-';
  };

  const summary = {
    jenjang: getRadioVal('jenjang'),
    namaSantri: getVal('nama_santri'),
    nik: getVal('nik_santri'),
    nisn: getVal('nisn_santri') || 'Belum ada',
    jenisKelamin: getRadioVal('jenis_kelamin'),
    ttl: `${getVal('tempat_lahir')}, ${getVal('tanggal_lahir')}`,
    asalSekolah: getVal('asal_sekolah'),
    hafalan: getVal('hafalan_terakhir') || '0 Juz',
    namaWali: getVal('nama_wali'),
    hubunganWali: getVal('hubungan_wali'),
    waWali: getVal('wa_wali'),
    pekerjaanWali: getVal('pekerjaan_wali'),
    alamat: getVal('alamat_lengkap')
  };

  // Render to DOM summary box
  const summaryContainer = document.getElementById('summaryDetails');
  if (!summaryContainer) return;

  summaryContainer.innerHTML = `
    <div class="summary-row">
      <span class="summary-label">Program Pilihan</span>
      <span class="summary-value" style="color:var(--primary-700); font-weight:800;">${escapeHtml(summary.jenjang)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Nama Calon Santri</span>
      <span class="summary-value">${escapeHtml(summary.namaSantri)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Jenis Kelamin</span>
      <span class="summary-value">${escapeHtml(summary.jenisKelamin)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Tempat, Tgl Lahir</span>
      <span class="summary-value">${escapeHtml(summary.ttl)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Asal Sekolah</span>
      <span class="summary-value">${escapeHtml(summary.asalSekolah)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Target / Riwayat Hafalan</span>
      <span class="summary-value">${escapeHtml(summary.hafalan)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Nama Orang Tua / Wali</span>
      <span class="summary-value">${escapeHtml(summary.namaWali)} (${escapeHtml(summary.hubunganWali)})</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">WhatsApp Wali Santri</span>
      <span class="summary-value">${escapeHtml(summary.waWali)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">Alamat Domisili</span>
      <span class="summary-value">${escapeHtml(summary.alamat)}</span>
    </div>
  `;
}

/* 4. Form Submission Handler */
function handleFormSubmit(e) {
  e.preventDefault();

  if (!validateStep(4)) return;

  const agreeTerms = document.getElementById('agree_terms');
  if (agreeTerms && !agreeTerms.checked) {
    alert('Mohon centang pernyataan persetujuan kebenaran data.');
    return;
  }

  // Generate Unique Registration ID
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const regId = `${CONFIG.REG_PREFIX}-${randomNum}`;
  const regDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Collect Data
  const formData = collectFormData();
  formData.regId = regId;
  formData.regDate = regDate;

  // Save to completed storage
  localStorage.setItem('annahl_psb_completed', JSON.stringify(formData));
  // Clear draft
  localStorage.removeItem(CONFIG.STORAGE_KEY);

  // Show Success Card & Slip
  showSuccessState(formData);
}

function collectFormData() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '-';
  };
  const getRadioVal = (name) => {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '-';
  };

  return {
    jenjang: getRadioVal('jenjang'),
    namaSantri: getVal('nama_santri'),
    nik: getVal('nik_santri'),
    nisn: getVal('nisn_santri') || '-',
    jenisKelamin: getRadioVal('jenis_kelamin'),
    tempatLahir: getVal('tempat_lahir'),
    tanggalLahir: getVal('tanggal_lahir'),
    anakKe: getVal('anak_ke') || '1',
    saudara: getVal('dari_saudara') || '1',
    asalSekolah: getVal('asal_sekolah'),
    hafalan: getVal('hafalan_terakhir') || '0 Juz',
    namaWali: getVal('nama_wali'),
    hubunganWali: getVal('hubungan_wali'),
    pekerjaanWali: getVal('pekerjaan_wali'),
    waWali: getVal('wa_wali'),
    alamat: getVal('alamat_lengkap'),
    catatan: getVal('catatan_khusus') || '-'
  };
}

/* 5. Render Success State & Print Card */
function showSuccessState(data) {
  const regForm = document.getElementById('registrationForm');
  const stepper = document.querySelector('.stepper-header');
  const successBox = document.getElementById('registrationSuccess');

  if (regForm) regForm.style.display = 'none';
  if (stepper) stepper.style.display = 'none';

  if (successBox) {
    successBox.style.display = 'block';

    // Set numbers
    const regNumEl = document.getElementById('displayRegNumber');
    if (regNumEl) regNumEl.textContent = data.regId;

    // Populate Printable Slip
    populatePrintableSlip(data);

    // Setup WhatsApp Button
    const waBtn = document.getElementById('btnSendWhatsapp');
    if (waBtn) {
      const waMessage = formatWhatsAppMessage(data);
      const waUrl = `https://wa.me/${CONFIG.ADMIN_WA}?text=${encodeURIComponent(waMessage)}`;
      waBtn.href = waUrl;
    }
  }

  // Scroll to top of box
  window.scrollTo({ top: 100, behavior: 'smooth' });
}

function formatWhatsAppMessage(data) {
  return `*PENDAFTARAN SANTRI BARU (PSB)*
*PONDOK PESANTREN PEMBERDAYAAN UMMAT AN-NAHL*
Tahun Ajaran: ${CONFIG.TAHUN_AJARAN}

*Nomor Registrasi:* ${data.regId}
*Tanggal:* ${data.regDate}
----------------------------------------
*DATA CALON SANTRI*
- *Program Pilihan:* ${data.jenjang}
- *Nama Lengkap:* ${data.namaSantri}
- *Jenis Kelamin:* ${data.jenisKelamin}
- *TTL:* ${data.tempatLahir}, ${data.tanggalLahir}
- *NIK:* ${data.nik}
- *NISN:* ${data.nisn}
- *Asal Sekolah:* ${data.asalSekolah}
- *Hafalan Awal:* ${data.hafalan}

*DATA ORANG TUA / WALI*
- *Nama Wali:* ${data.namaWali} (${data.hubunganWali})
- *No. WhatsApp:* ${data.waWali}
- *Pekerjaan:* ${data.pekerjaanWali}
- *Alamat:* ${data.alamat}

*Catatan/Keterangan:* ${data.catatan}
----------------------------------------
_Assalamu'alaikum Warahmatullahi Wabarakatuh._
Saya telah mengisi formulir online PSB An-Nahl. Mohon konfirmasi penerimaan data dan petunjuk tes seleksi selanjutnya. Terima kasih.`;
}

function populatePrintableSlip(data) {
  const slipContainer = document.getElementById('printableSlipContent');
  if (!slipContainer) return;

  slipContainer.innerHTML = `
    <div style="text-align: center; border-bottom: 2px solid #083D2F; padding-bottom: 12px; margin-bottom: 20px;">
      <h2 style="font-size: 1.4rem; color: #083D2F; margin: 0; text-transform: uppercase;">Pondok Pesantren Pemberdayaan Ummat An-Nahl</h2>
      <p style="font-size: 0.85rem; color: #475569; margin: 4px 0 0;">KARTU BUKTI PENDAFTARAN SANTRI BARU (PSB) - T.A ${CONFIG.TAHUN_AJARAN}</p>
    </div>

    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 0.9rem;">
      <div><strong>NO. REGISTRASI:</strong> <span style="font-size: 1.1rem; color: #083D2F; font-weight: 800;">${data.regId}</span></div>
      <div><strong>TANGGAL DAFTAR:</strong> ${data.regDate}</div>
    </div>

    <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem; margin-bottom: 20px;">
      <tr>
        <td style="padding: 6px; width: 35%; border: 1px solid #CBD5E1; background: #F8FAFC;"><strong>Program Jenjang</strong></td>
        <td style="padding: 6px; border: 1px solid #CBD5E1; font-weight: bold; color: #083D2F;">${escapeHtml(data.jenjang)}</td>
      </tr>
      <tr>
        <td style="padding: 6px; border: 1px solid #CBD5E1; background: #F8FAFC;"><strong>Nama Lengkap Santri</strong></td>
        <td style="padding: 6px; border: 1px solid #CBD5E1;">${escapeHtml(data.namaSantri)}</td>
      </tr>
      <tr>
        <td style="padding: 6px; border: 1px solid #CBD5E1; background: #F8FAFC;"><strong>Jenis Kelamin</strong></td>
        <td style="padding: 6px; border: 1px solid #CBD5E1;">${escapeHtml(data.jenisKelamin)}</td>
      </tr>
      <tr>
        <td style="padding: 6px; border: 1px solid #CBD5E1; background: #F8FAFC;"><strong>Tempat, Tgl Lahir</strong></td>
        <td style="padding: 6px; border: 1px solid #CBD5E1;">${escapeHtml(data.tempatLahir)}, ${escapeHtml(data.tanggalLahir)}</td>
      </tr>
      <tr>
        <td style="padding: 6px; border: 1px solid #CBD5E1; background: #F8FAFC;"><strong>Asal Sekolah</strong></td>
        <td style="padding: 6px; border: 1px solid #CBD5E1;">${escapeHtml(data.asalSekolah)}</td>
      </tr>
      <tr>
        <td style="padding: 6px; border: 1px solid #CBD5E1; background: #F8FAFC;"><strong>Nama Orang Tua / Wali</strong></td>
        <td style="padding: 6px; border: 1px solid #CBD5E1;">${escapeHtml(data.namaWali)} (${escapeHtml(data.hubunganWali)})</td>
      </tr>
      <tr>
        <td style="padding: 6px; border: 1px solid #CBD5E1; background: #F8FAFC;"><strong>WhatsApp Wali</strong></td>
        <td style="padding: 6px; border: 1px solid #CBD5E1;">${escapeHtml(data.waWali)}</td>
      </tr>
      <tr>
        <td style="padding: 6px; border: 1px solid #CBD5E1; background: #F8FAFC;"><strong>Alamat Lengkap</strong></td>
        <td style="padding: 6px; border: 1px solid #CBD5E1;">${escapeHtml(data.alamat)}</td>
      </tr>
    </table>

    <div style="background: #F1F5F9; border-left: 4px solid #D8AA30; padding: 10px; font-size: 0.8rem; margin-bottom: 25px;">
      <strong>Petunjuk Penting:</strong>
      <ol style="margin-left: 20px; margin-top: 4px;">
        <li>Simpan atau cetak kartu ini sebagai tanda bukti pendaftaran online yang sah.</li>
        <li>Kirim konfirmasi ke WhatsApp Panitia PSB untuk mendapatkan jadwal tes seleksi tahfidz & wawancara.</li>
        <li>Bawa kartu ini beserta fotokopi KK, Akta Kelahiran, dan Raport saat hadir di pondok.</li>
      </ol>
    </div>

    <div style="display: flex; justify-content: space-between; text-align: center; margin-top: 30px; font-size: 0.85rem;">
      <div>
        <p>Orang Tua / Wali Santri</p>
        <div style="height: 50px;"></div>
        <p>( ${escapeHtml(data.namaWali)} )</p>
      </div>
      <div>
        <p>Panitia PSB Ponpes An-Nahl</p>
        <div style="height: 50px;"></div>
        <p>( ____________________ )</p>
      </div>
    </div>
  `;
}

/* 6. Auto Save Draft to LocalStorage */
function initAutoSave() {
  const form = document.getElementById('registrationForm');
  if (!form) return;

  form.addEventListener('input', () => {
    const draft = {};
    const inputs = form.querySelectorAll('input:not([type="radio"]), select, textarea');
    inputs.forEach(input => {
      if (input.name) {
        draft[input.name] = input.value;
      }
    });

    const radioInputs = form.querySelectorAll('input[type="radio"]:checked');
    radioInputs.forEach(radio => {
      draft[radio.name] = radio.value;
    });

    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(draft));
  });
}

function restoreDraft() {
  try {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!saved) return;
    const draft = JSON.parse(saved);

    Object.keys(draft).forEach(key => {
      const field = document.querySelector(`[name="${key}"]`);
      if (field) {
        if (field.type === 'radio') {
          const radioToSelect = document.querySelector(`input[name="${key}"][value="${draft[key]}"]`);
          if (radioToSelect) radioToSelect.checked = true;
        } else {
          field.value = draft[key];
        }
      }
    });
  } catch (err) {
    console.warn('Failed restoring draft:', err);
  }
}

// Utility: XSS escape
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function (m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}
