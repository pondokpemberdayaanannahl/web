import{a as e,n as t}from"./pondok-DvaK_7TO.js";import{r as n}from"./photos-BW6EAMCN.js";import{t as r}from"./form-submission-Dtxuh8WK.js";function i(){r(document.getElementById(`registration-form`),`pendaftaran`,()=>({nama:document.getElementById(`reg-nama`).value.trim(),tempatLahir:document.getElementById(`reg-tempat-lahir`).value.trim(),tanggalLahir:document.getElementById(`reg-tanggal-lahir`).value,jenisKelamin:document.getElementById(`reg-jenis-kelamin`).value,asalSekolah:document.getElementById(`reg-asal-sekolah`).value.trim(),program:document.getElementById(`reg-program`).value,namaWali:document.getElementById(`reg-nama-wali`).value.trim(),noWA:document.getElementById(`reg-no-wa`).value.trim(),email:document.getElementById(`reg-email`).value.trim(),alamat:document.getElementById(`reg-alamat`).value.trim()}),`Pendaftaran diterima. Pengurus akan menghubungi Anda melalui kontak yang dicantumkan.`)}window.initPendaftaran=i;function a(){return`
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${n.hero.pendaftaran}')"></div>
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
        <div class="grid-4">
          ${[{num:`01`,icon:`file-text`,title:`Isi Formulir`,desc:`Lengkapi formulir pendaftaran online di bawah ini dengan data yang benar.`},{num:`02`,icon:`upload`,title:`Siapkan Dokumen`,desc:`Siapkan dokumen persyaratan untuk diserahkan saat verifikasi.`},{num:`03`,icon:`clipboard-check`,title:`Seleksi`,desc:`Tim kami akan meninjau berkas dan menjadwalkan tes seleksi.`},{num:`04`,icon:`check-circle`,title:`Diterima`,desc:`Santri yang lolos seleksi akan menerima surat penerimaan resmi.`}].map((e,t)=>`
            <div class="card reveal reveal-delay-${t}" style="text-align:center; position:relative">
              <div style="font-family:var(--font-heading);font-size:48px;font-weight:700;color:var(--green-100);position:absolute;top:16px;right:24px">${e.num}</div>
              <div class="card-icon" style="margin:0 auto var(--space-lg)">
                <i data-lucide="${e.icon}" style="width:28px;height:28px"></i>
              </div>
              <h3 class="card-title">${e.title}</h3>
              <p class="card-text">${e.desc}</p>
            </div>
          `).join(``)}
        </div>
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
                  <a href="https://wa.me/${t.whatsapp}" class="card-link" target="_blank" rel="noopener noreferrer">Hubungi pengurus: ${t.phone}</a>
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
          <form id="registration-form">
            <div style="background:var(--green-50);padding:var(--space-md) var(--space-lg);border-radius:var(--radius-md);margin-bottom:var(--space-xl);border-left:4px solid var(--green-600)">
              <strong style="color:var(--green-800)">Data Calon Santri</strong>
            </div>
            
            <div class="form-group">
              <label class="form-label">Nama Lengkap *</label>
              <input type="text" id="reg-nama" class="form-input" placeholder="Masukkan nama lengkap calon santri" required />
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-lg)">
              <div class="form-group">
                <label class="form-label">Tempat Lahir *</label>
                <input type="text" id="reg-tempat-lahir" class="form-input" placeholder="Kota kelahiran" required />
              </div>
              <div class="form-group">
                <label class="form-label">Tanggal Lahir *</label>
                <input type="date" id="reg-tanggal-lahir" class="form-input" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Jenis Kelamin *</label>
              <select id="reg-jenis-kelamin" class="form-select" required>
                <option value="">Pilih jenis kelamin</option>
                <option>Laki-laki</option>
                <option>Perempuan</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Asal Sekolah *</label>
              <input type="text" id="reg-asal-sekolah" class="form-input" placeholder="Nama sekolah asal" required />
            </div>
            <div class="form-group">
              <label class="form-label">Program yang Diminati *</label>
              <select id="reg-program" class="form-select" required>
                <option value="">Pilih program</option>
                ${e.map(e=>`<option>${e.title}</option>`).join(``)}
              </select>
            </div>

            <div style="background:var(--green-50);padding:var(--space-md) var(--space-lg);border-radius:var(--radius-md);margin: var(--space-xl) 0;border-left:4px solid var(--green-600)">
              <strong style="color:var(--green-800)">Data Orang Tua / Wali</strong>
            </div>

            <div class="form-group">
              <label class="form-label">Nama Orang Tua / Wali *</label>
              <input type="text" id="reg-nama-wali" class="form-input" placeholder="Nama lengkap orang tua/wali" required />
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-lg)">
              <div class="form-group">
                <label class="form-label">No. WhatsApp *</label>
                <input type="tel" id="reg-no-wa" class="form-input" placeholder="08xx-xxxx-xxxx" required />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="reg-email" class="form-input" placeholder="email@contoh.com" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Alamat Lengkap *</label>
              <textarea id="reg-alamat" class="form-textarea" placeholder="Alamat lengkap tempat tinggal" style="min-height:100px" required></textarea>
            </div>

            <div class="form-group attachment-box">
              <label class="form-label" for="reg-files">Dokumen pendukung <span>(opsional)</span></label>
              <p id="reg-files-help" class="attachment-help">Foto, PDF, DOCX, XLSX, atau PPTX. Pilih hingga 3 berkas, maksimal 2 MB per berkas dan 5 MB total.</p>
              <input id="reg-files" data-form-files type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.xlsx,.pptx" aria-describedby="reg-files-help reg-files-feedback" />
              <ul data-file-list class="attachment-list"></ul>
              <p id="reg-files-feedback" data-file-feedback class="attachment-feedback" aria-live="polite"></p>
              <button type="button" data-clear-files class="attachment-clear" hidden>Kosongkan lampiran</button>
              <p class="attachment-privacy">Isian dan lampiran diterima melalui akun Google pondok. Berkas hanya dapat dibuka oleh pengurus yang memiliki akses.</p>
            </div>
            <div class="form-trap" aria-hidden="true"><label for="reg-website">Website<input id="reg-website" data-website type="text" tabindex="-1" autocomplete="off" /></label></div>
            <!-- Notifikasi -->
            <p id="reg-notif" class="submission-status" role="status"></p>

            <div style="margin-top: var(--space-xl)">
              <button type="submit" id="reg-submit-btn" class="btn btn-primary" style="width:100%">
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
          ${[[`Apakah pesantren menerima santri putra dan putri?`,`Ya, Pesantren An-Nahl menerima santri putra dan putri dengan asrama terpisah dan pengajar sesuai gender.`],[`Apa saja program pesantren?`,`Program Tahfidz Quran, Pendidikan Madrasah Muhadloroh, Pendidikan Formal (SMP/SMA), dan Tarbiyah Akhlak Islamiyah. Hubungi pengurus untuk informasi jenjang dan durasi pendidikan.`],[`Apakah tersedia beasiswa?`,`Ya, tersedia beasiswa penuh dan parsial untuk santri berprestasi dan dari keluarga kurang mampu. Hubungi kami untuk informasi lebih lanjut.`],[`Bolehkah orang tua berkunjung?`,`Orang tua dapat berkunjung setiap hari Ahad dan hari libur. Jadwal kunjungan akan diinformasikan lebih lanjut.`],[`Apakah santri boleh membawa HP?`,`Penggunaan gadget diatur oleh pesantren. Santri tidak diperkenankan membawa HP pribadi selama kegiatan belajar.`]].map(([e,t],n)=>`
            <div class="card reveal" style="padding:var(--space-lg)">
              <h3 style="font-size:17px;margin-bottom:var(--space-sm);color:var(--green-900)">${e}</h3>
              <p style="font-size:15px;color:var(--neutral-700);line-height:1.65">${t}</p>
            </div>
          `).join(``)}
        </div>
      </div>
    </section>
  `}export{a as Pendaftaran,i as initPendaftaran};