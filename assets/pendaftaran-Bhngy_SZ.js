import{c as e,d as t,l as n,n as r}from"./pondok-settings-PoRC5ax-.js";import{a as i,r as a,t as o}from"./google-forms-IYVzDQs2.js";import{n as s}from"./pondok-DvaK_7TO.js";import{r as c}from"./photos-BW6EAMCN.js";function l(){let o=document.getElementById(`registration-form`);if(!o)return;let s=document.getElementById(`registration-period`),c=document.getElementById(`registration-receipt`),l=o.querySelector(`[data-jenjang]`),u=[...o.querySelectorAll(`[data-registration-step]`)],d=[...o.querySelectorAll(`[data-registration-indicator]`)],f=o.querySelector(`progress`),p=o.querySelector(`[data-registration-next]`),m=o.querySelector(`[data-registration-back]`),h=o.querySelector(`[type="submit"]`),g=document.getElementById(`registration-retry`),_=document.getElementById(`registration-timeline`),v=null,y=e=>new Date(`${e}T00:00:00+07:00`).toLocaleDateString(`id-ID`,{day:`numeric`,month:`long`,year:`numeric`,timeZone:`Asia/Jakarta`}),b=0,x=``,S=null,C,w=!1,T=!1,E=!1;function D(e,t=!1){b=e,u.forEach((e,t)=>{e.hidden=t!==b}),d.forEach((e,t)=>{e.dataset.complete=String(t<b),t===b?e.setAttribute(`aria-current`,`step`):e.removeAttribute(`aria-current`)}),f.value=b+1,m.hidden=b===0,p.hidden=b===u.length-1,h.hidden=!p.hidden,t&&u[b].querySelector(`legend`).focus()}function O(e){let t=[...u[e].querySelectorAll(`input,select,textarea`)].find(e=>!e.checkValidity());return!t||(b!==e&&D(e),t.reportValidity(),!1)}function k(){x===`open`&&b<u.length-1&&O(b)&&D(b+1,!0)}async function A(){if(!(E||w||T)){clearTimeout(C),T=!0;try{let a=n(),c=a?e(a):await i();if(E||w)return;if(x=c.state,v=c.registration?.year||null,_.innerHTML=t(c),S!==c.revision){let e=l.querySelector(`:checked`)?.value;l.innerHTML=r(c.levels,!0);let t=[...l.querySelectorAll(`input`)].find(t=>t.value===e);t?t.checked=!0:b>0&&D(0),S=c.revision}let u=c.opens_on&&c.closes_on?` Periode: ${y(c.opens_on)} – ${y(c.closes_on)} (WIB).`:``;s.textContent={open:`Pendaftaran sedang dibuka.`,upcoming:`Pendaftaran belum dibuka.`,closed:`Pendaftaran sudah ditutup.`,unscheduled:`Jadwal pendaftaran belum diumumkan.`,preparing:`Pengurus sedang menyiapkan rekap penerimaan. Pendaftaran akan tersedia setelah rekap siap.`}[x]+u,s.dataset.state=x,o.hidden=x!==`open`,g.hidden=!0;let d=x===`open`?c.closesAt:x===`upcoming`?c.opensAt:null,f=d?Math.max(50,(d-c.serverTime)*1e3):1/0;C=setTimeout(()=>{f<=6e4&&x===`open`&&(x=`checking`,o.hidden=!0,s.textContent=`Memeriksa jadwal pendaftaran…`),A()},Math.min(f,6e4))}catch{if(E||w)return;x=``,o.hidden=!0,g.hidden=!1,s.dataset.state=`unavailable`,s.textContent=`Jadwal belum dapat dimuat. Coba lagi atau hubungi pengurus.`,C=setTimeout(A,6e4)}finally{T=!1}}}p.addEventListener(`click`,k),m.addEventListener(`click`,()=>D(b-1,!0)),g.addEventListener(`click`,A);let j=()=>{document.visibilityState===`visible`&&A()};return document.addEventListener(`visibilitychange`,j),D(0),a(o,`pendaftaran`,()=>({registrationYear:String(v||``),nama:document.getElementById(`reg-nama`).value.trim(),tempatLahir:document.getElementById(`reg-tempat-lahir`).value.trim(),tanggalLahir:document.getElementById(`reg-tanggal-lahir`).value,jenisKelamin:document.getElementById(`reg-jenis-kelamin`).value,asalSekolah:document.getElementById(`reg-asal-sekolah`).value.trim(),jenjang:l.querySelector(`:checked`).value,namaWali:document.getElementById(`reg-nama-wali`).value.trim(),noWA:document.getElementById(`reg-no-wa`).value.trim(),email:document.getElementById(`reg-email`).value.trim(),alamat:document.getElementById(`reg-alamat`).value.trim()}),``,{canSubmit(){return x!==`open`||w?!1:b<u.length-1?(k(),!1):u.every((e,t)=>O(t))?!n()||(o.querySelector(`.submission-status`).textContent=`Ini pratinjau demo. Isian belum dikirim ke Google Sheets.`,!1):!1},onSuccess(){w=!0,clearTimeout(C),o.hidden=!0,c.hidden=!1,c.textContent=`Pendaftaran diterima. Pengurus akan menghubungi Anda melalui kontak yang dicantumkan.`,c.focus()},onError(e){(e.status===409||e.status===422)&&A()}}),A(),()=>{E=!0,clearTimeout(C),document.removeEventListener(`visibilitychange`,j)}}window.initPendaftaran=l;function u(e={}){return`
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${c.hero.pendaftaran}')"></div>
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
        <div id="registration-timeline" data-content-ignore>${t(e)}</div>
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
            <a href="https://wa.me/${s.whatsapp}" target="_blank" rel="noopener noreferrer">Tanya pengurus</a>
          </div>
          <p id="registration-receipt" class="submission-status" data-state="success" role="status" tabindex="-1" hidden></p>
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
            <div class="form-group attachment-box">
              <label class="form-label" for="reg-files">Dokumen pendukung <span>(opsional)</span></label>
              <p id="reg-files-help" class="attachment-help">${o}</p>
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
          ${[[`Siapa yang dapat mendaftar?`,`Penerimaan saat ini dibuka untuk calon santri putra sesuai jenjang yang tersedia.`],[`Bagaimana cara memilih jenjang?`,`Pilih jenjang yang tersedia pada tahap pertama formulir. Jika masih ragu, hubungi pengurus melalui WhatsApp.`],[`Apakah ada biaya pendaftaran atau pendidikan?`,`Tidak ada biaya pendaftaran maupun biaya pendidikan. Penerimaan ini melalui program beasiswa pesantren.`],[`Bolehkah orang tua berkunjung?`,`Orang tua dapat berkunjung setiap hari Ahad dan hari libur. Jadwal kunjungan akan diinformasikan lebih lanjut.`],[`Apakah santri boleh membawa HP?`,`Penggunaan gadget diatur oleh pesantren. Santri tidak diperkenankan membawa HP pribadi selama kegiatan belajar.`]].map(([e,t],n)=>`
            <div class="card reveal" style="padding:var(--space-lg)">
              <h3 style="font-size:17px;margin-bottom:var(--space-sm);color:var(--green-900)">${e}</h3>
              <p style="font-size:15px;color:var(--neutral-700);line-height:1.65">${t}</p>
            </div>
          `).join(``)}
        </div>
      </div>
    </section>
  `}export{u as Pendaftaran,l as initPendaftaran};