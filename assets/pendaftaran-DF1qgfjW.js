import{g as e,h as t,l as n,v as r}from"./site-content-BkEmymUy.js";import{i,o as a,r as o}from"./google-forms-B3BErs2H.js";import{r as s}from"./photos-BW6EAMCN.js";import{n as c}from"./pondok-ByAc9hJX.js";var l=[{id:`kk`,label:`Kartu Keluarga`,hint:`Foto atau pindai Kartu Keluarga yang terbaca jelas.`},{id:`akta`,label:`Akta kelahiran`,hint:`Foto atau pindai akta kelahiran calon santri.`},{id:`rapor`,label:`Rapor terakhir`,hint:`Boleh beberapa foto halaman rapor, atau satu PDF.`,multiple:!0},{id:`pasfoto`,label:`Pas foto`,hint:`Foto calon santri untuk kebutuhan pas foto 3×4.`,images:!0},{id:`ijazah`,label:`Ijazah atau SKL`,hint:`Lampirkan jika sudah tersedia dan sesuai jenjang yang dipilih.`}];function u(){let o=document.getElementById(`registration-form`);if(!o)return;let s=document.getElementById(`registration-period`),c=document.getElementById(`registration-receipt`),l=document.getElementById(`registration-success`),u=o.querySelector(`[data-jenjang]`),d=[...o.querySelectorAll(`[data-registration-step]`)],f=[...o.querySelectorAll(`[data-registration-indicator]`)],p=o.querySelector(`progress`),m=o.querySelector(`[data-registration-next]`),h=o.querySelector(`[data-registration-back]`),g=o.querySelector(`[type="submit"]`),_=document.getElementById(`registration-retry`),v=document.getElementById(`registration-timeline`),y=null,b=e=>new Date(`${e}T00:00:00+07:00`).toLocaleDateString(`id-ID`,{day:`numeric`,month:`long`,year:`numeric`,timeZone:`Asia/Jakarta`}),x=0,S=``,C=null,w,T=!1,E=!1,D=!1;function O(e,t=!1){x=e,d.forEach((e,t)=>{e.hidden=t!==x}),f.forEach((e,t)=>{e.dataset.complete=String(t<x),t===x?e.setAttribute(`aria-current`,`step`):e.removeAttribute(`aria-current`)}),p.value=x+1,h.hidden=x===0,m.hidden=x===d.length-1,g.hidden=!m.hidden,t&&d[x].querySelector(`legend`).focus()}function k(e){let t=[...d[e].querySelectorAll(`input,select,textarea`)].find(e=>!e.checkValidity());return!t||(x!==e&&O(e),t.reportValidity(),!1)}function A(){S===`open`&&x<d.length-1&&k(x)&&O(x+1,!0)}async function j(){if(!(D||T||E)){clearTimeout(w),E=!0;try{let i=e(),c=i?t(i):await a();if(D||T)return;if(S=c.state,y=c.registration?.year||null,v.innerHTML=r(c),C!==c.revision){let e=u.querySelector(`:checked`)?.value;u.innerHTML=n(c.levels,!0);let t=[...u.querySelectorAll(`input`)].find(t=>t.value===e);t?t.checked=!0:x>0&&O(0),C=c.revision}let l=c.opens_on&&c.closes_on?` Periode: ${b(c.opens_on)} – ${b(c.closes_on)} (WIB).`:``;s.textContent={open:`Pendaftaran sedang dibuka.`,upcoming:`Pendaftaran belum dibuka.`,closed:`Pendaftaran sudah ditutup.`,unscheduled:`Jadwal pendaftaran belum diumumkan.`,preparing:`Pengurus sedang menyiapkan rekap penerimaan. Pendaftaran akan tersedia setelah rekap siap.`}[S]+l,s.dataset.state=S,o.hidden=S!==`open`,_.hidden=!0;let d=S===`open`?c.closesAt:S===`upcoming`?c.opensAt:null,f=d?Math.max(50,(d-c.serverTime)*1e3):1/0;w=setTimeout(()=>{f<=6e4&&S===`open`&&(S=`checking`,o.hidden=!0,s.textContent=`Memeriksa jadwal pendaftaran…`),j()},Math.min(f,6e4))}catch{if(D||T)return;S=``,o.hidden=!0,_.hidden=!1,s.dataset.state=`unavailable`,s.textContent=`Jadwal belum dapat dimuat. Coba lagi atau hubungi pengurus.`,w=setTimeout(j,6e4)}finally{E=!1}}}m.addEventListener(`click`,A),h.addEventListener(`click`,()=>O(x-1,!0)),_.addEventListener(`click`,j),l.querySelectorAll(`[data-registration-success-close]`).forEach(e=>e.addEventListener(`click`,()=>l.close())),l.addEventListener(`close`,()=>c.focus());let M=()=>{document.visibilityState===`visible`&&j()};return document.addEventListener(`visibilitychange`,M),O(0),i(o,`pendaftaran`,()=>({registrationYear:String(y||``),nama:document.getElementById(`reg-nama`).value.trim(),tempatLahir:document.getElementById(`reg-tempat-lahir`).value.trim(),tanggalLahir:document.getElementById(`reg-tanggal-lahir`).value,jenisKelamin:document.getElementById(`reg-jenis-kelamin`).value,asalSekolah:document.getElementById(`reg-asal-sekolah`).value.trim(),jenjang:u.querySelector(`:checked`).value,namaWali:document.getElementById(`reg-nama-wali`).value.trim(),noWA:document.getElementById(`reg-no-wa`).value.trim(),email:document.getElementById(`reg-email`).value.trim(),alamat:document.getElementById(`reg-alamat`).value.trim()}),``,{canSubmit(){return S!==`open`||T?!1:x<d.length-1?(A(),!1):d.every((e,t)=>k(t))?!e()||(o.querySelector(`.submission-status`).textContent=`Ini pratinjau demo. Isian belum dikirim ke Google Sheets.`,!1):!1},onSuccess(e){D||(T=!0,clearTimeout(w),o.hidden=!0,c.hidden=!1,document.querySelectorAll(`[data-registration-reference]`).forEach(t=>{t.textContent=e.id}),typeof l.showModal==`function`?l.showModal():c.focus())},onError(e){(e.status===409||e.status===422)&&j()}}),j(),()=>{D=!0,clearTimeout(w),document.removeEventListener(`visibilitychange`,M)}}window.initPendaftaran=u;function d(e={}){return`
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${s.hero.pendaftaran}')"></div>
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
        <div id="registration-timeline" data-content-ignore>${r(e)}</div>
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
            <a href="https://wa.me/${c.whatsapp}" target="_blank" rel="noopener noreferrer">Tanya pengurus</a>
          </div>
          <div id="registration-receipt" class="registration-receipt" role="status" tabindex="-1" hidden><span class="registration-success-mark" aria-hidden="true">✓</span><h3>Formulir pendaftaran berhasil diisi</h3><p>Data pendaftaran Anda sudah tersimpan. Pengurus akan menghubungi Anda melalui kontak yang dicantumkan untuk tahap selanjutnya.</p><p class="registration-reference">Kode pengiriman <code data-registration-reference></code></p></div>
          <dialog id="registration-success" class="registration-success-dialog" aria-labelledby="registration-success-title" aria-describedby="registration-success-description"><span class="registration-success-mark" aria-hidden="true">✓</span><span class="registration-success-kicker">PENDAFTARAN TERKIRIM</span><h2 id="registration-success-title">Formulir pendaftaran berhasil diisi</h2><p id="registration-success-description">Data Anda sudah tersimpan. Pengurus akan menghubungi Anda melalui nomor WhatsApp yang dicantumkan untuk tahap selanjutnya.</p><p class="registration-reference">Kode pengiriman <code data-registration-reference></code></p><button type="button" class="btn btn-primary" data-registration-success-close>Oke, mengerti</button></dialog>
          <form id="registration-form" hidden novalidate>
            <ol class="registration-indicators" aria-label="Tahap pengisian">${[`Calon santri`,`Orang tua / wali`,`Lampiran`].map(e=>`<li data-registration-indicator>${e}</li>`).join(``)}</ol>
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
            <div class="registration-documents"><h3>Lengkapi dokumen pendukung</h3><p class="attachment-help">${o}</p><div class="registration-document-grid">${l.map(({id:e,label:t,hint:n,multiple:r,images:i})=>`<div class="registration-document attachment-box" data-file-group><label class="form-label" for="reg-${e}-files">${t} <span>(opsional)</span></label><p id="reg-${e}-help" class="attachment-help">${n}</p><input id="reg-${e}-files" data-form-files data-file-label="${t}" type="file" ${r?`multiple`:``} accept=".jpg,.jpeg,.png,.webp${i?``:`,.pdf`}" aria-describedby="reg-${e}-help reg-${e}-feedback"><ul data-file-list class="attachment-list"></ul><p id="reg-${e}-feedback" data-file-feedback class="attachment-feedback" aria-live="polite"></p><button type="button" data-clear-files class="attachment-clear" aria-label="Kosongkan lampiran ${t}" hidden>Kosongkan lampiran</button></div>`).join(``)}</div><p data-attachments-summary class="registration-attachments-summary" role="status">Belum ada dokumen dipilih.</p><p class="attachment-privacy">Isian dan lampiran diterima melalui akun Google pondok. Berkas hanya dapat dibuka oleh pengurus yang memiliki akses.</p></div>
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
          ${[[`Siapa yang dapat mendaftar?`,`Penerimaan saat ini dibuka untuk calon santri putra sesuai jenjang yang tersedia.`],[`Bagaimana cara memilih jenjang?`,`Pilih jenjang yang tersedia pada tahap pertama formulir. Jika masih ragu, hubungi pengurus melalui WhatsApp.`],[`Apakah ada biaya pendaftaran atau pendidikan?`,`Tidak ada biaya pendaftaran maupun biaya pendidikan. Penerimaan ini melalui program beasiswa pesantren.`],[`Bolehkah orang tua berkunjung?`,`Orang tua dapat berkunjung setiap hari Ahad dan hari libur. Jadwal kunjungan akan diinformasikan lebih lanjut.`],[`Apakah santri boleh membawa HP?`,`Penggunaan gadget diatur oleh pesantren. Santri tidak diperkenankan membawa HP pribadi selama kegiatan belajar.`]].map(([e,t],n)=>`
            <div class="card reveal" style="padding:var(--space-lg)">
              <h3 style="font-size:17px;margin-bottom:var(--space-sm);color:var(--green-900)">${e}</h3>
              <p style="font-size:15px;color:var(--neutral-700);line-height:1.65">${t}</p>
            </div>
          `).join(``)}
        </div>
      </div>
    </section>
  `}export{d as Pendaftaran,u as initPendaftaran};