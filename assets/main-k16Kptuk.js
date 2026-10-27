import{t as e}from"./supabase-DTXc74uv.js";import{t}from"./preload-helper-rov5CBGT.js";import{a as n,i as r,n as i,o as a,r as o}from"./google-forms-C7uogBrb.js";var s=class{constructor(e){this.routes=e,this.currentPage=null,this.renderTimer=null,this.observers=[],this.reducedMotion=window.matchMedia(`(prefers-reduced-motion: reduce)`),window.addEventListener(`hashchange`,()=>this.handleRoute())}init(){this.handleRoute()}handleRoute(){let e=window.location.hash.slice(1)||`/`,t=this.routes.find(t=>t.path===e)||this.routes.find(e=>e.path===`/`);t&&t!==this.currentPage&&(this.currentPage=t,this.render(t))}render(e){let t=document.getElementById(`page-content`);if(!t)return;let n=!t.children.length;clearTimeout(this.renderTimer),this.observers.forEach(e=>e.disconnect()),this.observers=[],window.closeArticle&&window.closeArticle(),window.closeLightbox&&window.closeLightbox(),t.style.opacity=`0`,t.style.transform=`translateY(10px)`,this.renderTimer=setTimeout(()=>{t.innerHTML=e.component(),window.scrollTo({top:0,behavior:`instant`});let r=t.querySelector(`h1`);r&&!n&&(r.tabIndex=-1,r.focus({preventScroll:!0})),requestAnimationFrame(()=>{t.style.opacity=`1`,t.style.transform=`translateY(0)`}),window.lucide&&window.lucide.createIcons(),this.initScrollReveal(),this.initCounters(),this.updateActiveLink(e.path),e.path===`/galeri`&&window.initGalleryFilter&&window.initGalleryFilter(),e.path===`/berita`&&window.initNewsFilter&&window.initNewsFilter(),e.path===`/`&&window.initBerandaNews&&window.initBerandaNews(),e.path===`/pendaftaran`&&window.initPendaftaran?.(),e.path===`/kontak`&&window.initKontak?.(),e.path===`/donasi`&&window.initDonasi?.(),window.closeArticle&&window.closeArticle(),window.closeLightbox&&window.closeLightbox();let i={"/":`Pondok Pesantren Pemberdayaan Ummat An-Nahl — Membentuk Generasi Qur'ani`,"/tentang":`Tentang Kami — Pesantren An-Nahl`,"/program":`Program Pendidikan — Pesantren An-Nahl`,"/pendaftaran":`Pendaftaran Santri Baru — Pesantren An-Nahl`,"/berita":`Berita & Kegiatan — Pesantren An-Nahl`,"/galeri":`Galeri Foto & Video — Pesantren An-Nahl`,"/donasi":`Donasi — Pesantren An-Nahl`,"/kontak":`Hubungi Kami — Pesantren An-Nahl`};document.title=i[e.path]||i[`/`]},n||this.reducedMotion.matches?0:160)}initScrollReveal(){let e=document.querySelectorAll(`.reveal`);if(!e.length)return;if(e.forEach(e=>{e.matches(`.about-image`)&&e.classList.add(`reveal-slide`)}),this.reducedMotion.matches||!(`IntersectionObserver`in window)){e.forEach(e=>e.classList.add(`revealed`));return}let t=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&(e.target.classList.add(`revealed`),t.unobserve(e.target))})},{threshold:.06});this.observers.push(t),e.forEach(e=>t.observe(e))}initCounters(){let e=document.querySelectorAll(`[data-counter]`);if(!e.length)return;if(this.reducedMotion.matches||!(`IntersectionObserver`in window)){e.forEach(e=>{e.textContent=e.dataset.counter+(e.dataset.suffix||``)});return}let t=new IntersectionObserver(e=>{e.forEach(e=>{if(e.isIntersecting){let n=e.target,r=parseInt(n.dataset.counter),i=n.dataset.suffix||``;this.animateCounter(n,r,i),t.unobserve(n)}})},{threshold:.5});this.observers.push(t),e.forEach(e=>t.observe(e))}animateCounter(e,t,n){let r=performance.now(),i=a=>{if(!e.isConnected)return;let o=a-r,s=Math.min(o/2e3,1),c=1-(1-s)**3;e.textContent=Math.round(c*t)+n,s<1&&requestAnimationFrame(i)};requestAnimationFrame(i)}updateActiveLink(e){document.querySelectorAll(`.navbar-link`).forEach(t=>{let n=t.getAttribute(`href`)===`#`+e;t.classList.toggle(`active`,n),n?t.setAttribute(`aria-current`,`page`):t.removeAttribute(`aria-current`)})}navigate(e){window.location.hash=e}};function c(){return`
    <nav class="navbar transparent" id="navbar">
      <div class="navbar-inner">
        <a href="#/" class="navbar-logo">
          <img src="/favicon.svg" alt="Logo An-Nahl" class="navbar-logo-img" />
          <span class="navbar-logo-text"></span>
        </a>

        <div class="navbar-menu">
          <a href="#/" class="navbar-link active">Beranda</a>
          <a href="#/tentang" class="navbar-link">Tentang</a>
          <a href="#/program" class="navbar-link">Program</a>
          <a href="#/pendaftaran" class="navbar-link">Pendaftaran</a>
          <a href="#/berita" class="navbar-link">Berita</a>
          <a href="#/galeri" class="navbar-link">Galeri</a>
          <a href="#/donasi" class="navbar-link">Donasi</a>
          <a href="#/kontak" class="navbar-link">Kontak</a>
          <a href="/admin.html" class="navbar-link">Login</a>
        </div>

        <div class="navbar-cta">
          <a href="#/pendaftaran" class="btn btn-primary">Daftar Sekarang</a>
        </div>

        <button class="navbar-hamburger" id="hamburger" aria-label="Buka menu" aria-controls="mobile-drawer" aria-expanded="false">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>

    <div class="mobile-drawer-overlay" id="drawer-overlay"></div>
    <div class="mobile-drawer" id="mobile-drawer" aria-label="Navigasi mobile" inert>
      <a href="#/" class="navbar-link active">Beranda</a>
      <a href="#/tentang" class="navbar-link">Tentang</a>
      <a href="#/program" class="navbar-link">Program</a>
      <a href="#/pendaftaran" class="navbar-link">Pendaftaran</a>
      <a href="#/berita" class="navbar-link">Berita</a>
      <a href="#/galeri" class="navbar-link">Galeri</a>
      <a href="#/donasi" class="navbar-link">Donasi</a>
      <a href="#/kontak" class="navbar-link">Kontak</a>
      <a href="/admin.html" class="navbar-link">Login</a>
      <a href="#/pendaftaran" class="btn btn-primary" style="margin-top: 16px">Daftar Sekarang</a>
    </div>
  `}function l(){let e=document.getElementById(`navbar`),t=document.getElementById(`hamburger`),n=document.getElementById(`mobile-drawer`),r=document.getElementById(`drawer-overlay`),i=()=>{window.scrollY>80?(e.classList.remove(`transparent`),e.classList.add(`solid`)):(e.classList.add(`transparent`),e.classList.remove(`solid`))};window.addEventListener(`scroll`,i,{passive:!0}),i();let a=(e,i=!0)=>{t.classList.toggle(`open`,e),n.classList.toggle(`open`,e),r.classList.toggle(`open`,e),n.inert=!e,t.setAttribute(`aria-expanded`,String(e)),t.setAttribute(`aria-label`,e?`Tutup menu`:`Buka menu`),document.body.style.overflow=e?`hidden`:``,e?n.querySelector(`a`).focus():i&&t.focus()};t.addEventListener(`click`,()=>a(!n.classList.contains(`open`))),r.addEventListener(`click`,()=>a(!1)),document.addEventListener(`keydown`,e=>{if(n.classList.contains(`open`)&&(e.key===`Escape`&&a(!1),e.key===`Tab`)){let r=[t,...[...n.querySelectorAll(`a`)]],i=r.indexOf(document.activeElement);e.preventDefault(),r[(i+(e.shiftKey?-1:1)+r.length)%r.length].focus()}}),window.matchMedia(`(min-width: 1101px)`).addEventListener(`change`,e=>{e.matches&&n.classList.contains(`open`)&&a(!1,!1)}),n.querySelectorAll(`a`).forEach(e=>{e.addEventListener(`click`,()=>{n.classList.contains(`open`)&&a(!1,!1)})})}function u(){return`
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <!-- Brand -->
          <div class="footer-col">
            <div class="footer-brand-name">An-Nahl</div>
            <p class="footer-brand-desc">
              Pondok Pesantren Pemberdayaan Ummat An-Nahl. Mendidik generasi Qur'ani yang berilmu, berakhlak mulia, dan siap memberdayakan ummat.
            </p>
          </div>

          <!-- Navigation -->
          <div class="footer-col">
            <div class="footer-heading">Navigasi</div>
            <div class="footer-links">
              <a href="#/" class="footer-link">Beranda</a>
              <a href="#/tentang" class="footer-link">Tentang Kami</a>
              <a href="#/program" class="footer-link">Program</a>
              <a href="#/pendaftaran" class="footer-link">Pendaftaran</a>
              <a href="#/berita" class="footer-link">Berita</a>
              <a href="#/galeri" class="footer-link">Galeri</a>
              <a href="#/donasi" class="footer-link">Donasi</a>
              <a href="#/kontak" class="footer-link">Kontak</a>
            </div>
          </div>

          <!-- Contact -->
          <div class="footer-col">
            <div class="footer-heading">Kontak</div>
            <div class="footer-contact-item">
              <i data-lucide="map-pin" style="width:16px;height:16px"></i>
              <span>Jl. Pesantren Raya No. 1,<br>Desa Suka Maju, Kab. Bandung,<br>Jawa Barat 40375</span>
            </div>
            <div class="footer-contact-item">
              <i data-lucide="phone" style="width:16px;height:16px"></i>
              <span>0812-3456-7890</span>
            </div>
            <div class="footer-contact-item">
              <i data-lucide="mail" style="width:16px;height:16px"></i>
              <span>info@annahl.id</span>
            </div>
          </div>

          <!-- Social -->
          <div class="footer-col">
            <div class="footer-heading">Ikuti Kami</div>
            <div class="footer-social">
              <a href="#" class="footer-social-link" aria-label="Instagram">
                <i data-lucide="instagram" style="width:18px;height:18px"></i>
              </a>
              <a href="#" class="footer-social-link" aria-label="Facebook">
                <i data-lucide="facebook" style="width:18px;height:18px"></i>
              </a>
              <a href="#" class="footer-social-link" aria-label="YouTube">
                <i data-lucide="youtube" style="width:18px;height:18px"></i>
              </a>
              <a href="#" class="footer-social-link" aria-label="Twitter">
                <i data-lucide="twitter" style="width:18px;height:18px"></i>
              </a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p class="footer-copyright">© 2026 Pondok Pesantren Pemberdayaan Ummat An-Nahl. Hak cipta dilindungi undang-undang.</p>
        </div>
      </div>
    </footer>
  `}var d={"EKSKUL-20260724T124802Z-1-001/EKSKUL/Futsal/20260206_174403.jpg":{thumbnail:`/media/e40a89e55509450e-480.jpg`,full:`/media/e40a89e55509450e-1600.jpg`},"EKSKUL-20260724T124802Z-1-001/EKSKUL/Hadroh/20260502_190015.jpg":{thumbnail:`/media/49eea1039a995176-480.jpg`,full:`/media/49eea1039a995176-1600.jpg`},"EKSKUL-20260724T124802Z-1-001/EKSKUL/Marawis/20260514_162707.jpg":{thumbnail:`/media/456075adda03109a-480.jpg`,full:`/media/456075adda03109a-1600.jpg`},"EKSKUL-20260724T124802Z-1-001/EKSKUL/Melukis/20260513_094541.jpg":{thumbnail:`/media/4197b641b03d67eb-480.jpg`,full:`/media/4197b641b03d67eb-1600.jpg`},"EKSKUL-20260724T124802Z-1-001/EKSKUL/Silat/20260502_065839.jpg":{thumbnail:`/media/fa7b9aa57d5964c5-480.jpg`,full:`/media/fa7b9aa57d5964c5-1600.jpg`},"Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260108_172045.jpg":{thumbnail:`/media/a680d0e066884fad-480.jpg`,full:`/media/a680d0e066884fad-1600.jpg`},"Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260111_215510.jpg":{thumbnail:`/media/051f4aa1da0427a0-480.jpg`,full:`/media/051f4aa1da0427a0-1600.jpg`},"Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260119_211522.jpg":{thumbnail:`/media/ffab06cb303c68e0-480.jpg`,full:`/media/ffab06cb303c68e0-1600.jpg`},"Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260208_172900.jpg":{thumbnail:`/media/be8644844d4004c7-480.jpg`,full:`/media/be8644844d4004c7-1600.jpg`},"Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260208_172922.jpg":{thumbnail:`/media/78c6f97a9f7e7c1c-480.jpg`,full:`/media/78c6f97a9f7e7c1c-1600.jpg`},"Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260512_115312.jpg":{thumbnail:`/media/7eac4064f8c6e48c-480.jpg`,full:`/media/7eac4064f8c6e48c-1600.jpg`},"Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Al kahfi day/20260515_054817.jpg":{thumbnail:`/media/2cd307bea604c6c8-480.jpg`,full:`/media/2cd307bea604c6c8-1600.jpg`},"Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Al kahfi day/20260515_054836.jpg":{thumbnail:`/media/ddcd5876bd6267d4-480.jpg`,full:`/media/ddcd5876bd6267d4-1600.jpg`},"Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Al kahfi day/20260515_054906.jpg":{thumbnail:`/media/538d5a620ab25c0c-480.jpg`,full:`/media/538d5a620ab25c0c-1600.jpg`},"Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Al kahfi day/20260515_054956.jpg":{thumbnail:`/media/b058a7cde9981172-480.jpg`,full:`/media/b058a7cde9981172-1600.jpg`},"Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Bersih-bersih/VideoCapture_20260509-195550.jpg":{thumbnail:`/media/4ece44d094f1e401-480.jpg`,full:`/media/4ece44d094f1e401-1600.jpg`},"Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Makan/20260304_175452.jpg":{thumbnail:`/media/e3f9681fd9367ad2-480.jpg`,full:`/media/e3f9681fd9367ad2-1600.jpg`},"Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Senam/IMG-20260417-WA0006.jpg":{thumbnail:`/media/eb32df4a9aaeca00-480.jpg`,full:`/media/eb32df4a9aaeca00-1600.jpg`},"Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Sholat jama_ah/20260508_203515.jpg":{thumbnail:`/media/baaf70d490575d88-480.jpg`,full:`/media/baaf70d490575d88-1600.jpg`},"Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Sholat jama_ah/20260508_204228.jpg":{thumbnail:`/media/9634122673f25478-480.jpg`,full:`/media/9634122673f25478-1600.jpg`},"KEGIATAN Sekolah formal -20260724T124804Z-1-001/KEGIATAN Sekolah formal/VideoCapture_20260509-195518.jpg":{thumbnail:`/media/4d848c0f407bee53-480.jpg`,full:`/media/4d848c0f407bee53-1600.jpg`},"KEGIATAN Sekolah formal -20260724T124804Z-1-001/KEGIATAN Sekolah formal/VideoCapture_20260509-195534.jpg":{thumbnail:`/media/f4da428fe8cad2cd-480.jpg`,full:`/media/f4da428fe8cad2cd-1600.jpg`},"KEGIATAN Sekolah formal -20260724T124804Z-1-001/KEGIATAN Sekolah formal/VideoCapture_20260509-195559.jpg":{thumbnail:`/media/9b266b7d12d5b84a-480.jpg`,full:`/media/9b266b7d12d5b84a-1600.jpg`},"Moment-Moment hiburan santri-20260724T124805Z-1-001/Moment-Moment hiburan santri/20260429_092133.jpg":{thumbnail:`/media/323d8624d1b4133c-480.jpg`,full:`/media/323d8624d1b4133c-1600.jpg`},"Moment-Moment tamu-20260724T124807Z-1-001/Moment-Moment tamu/20260429_085350.jpg":{thumbnail:`/media/58da2b1ea3571f5d-480.jpg`,full:`/media/58da2b1ea3571f5d-1600.jpg`},"Moment-Moment tamu-20260724T124807Z-1-001/Moment-Moment tamu/20260429_110144.jpg":{thumbnail:`/media/4ec9866ecfd47ceb-480.jpg`,full:`/media/4ec9866ecfd47ceb-1600.jpg`},"Muhadloroh -20260724T124809Z-1-001/Muhadloroh/Kelas/20260503_205739.jpg":{thumbnail:`/media/bca780cfb9beabf2-480.jpg`,full:`/media/bca780cfb9beabf2-1600.jpg`},"Muhadloroh -20260724T124809Z-1-001/Muhadloroh/Khitobiyyah/Salinan 20251018_210225.jpg":{thumbnail:`/media/66dfe62926b3100a-480.jpg`,full:`/media/66dfe62926b3100a-1600.jpg`},"Muhadloroh -20260724T124809Z-1-001/Muhadloroh/Khitobiyyah/Salinan 20251018_212802.jpg":{thumbnail:`/media/8face00105d25c27-480.jpg`,full:`/media/8face00105d25c27-1600.jpg`},"Peternakan An-Nahl -20260724T124811Z-1-001/Peternakan An-Nahl/Bebek/20260514_123237.jpg":{thumbnail:`/media/d43a6be1d8122dac-480.jpg`,full:`/media/d43a6be1d8122dac-1600.jpg`},"Peternakan An-Nahl -20260724T124811Z-1-001/Peternakan An-Nahl/Kambing/20260514_104628.jpg":{thumbnail:`/media/99e0e7e19549dd16-480.jpg`,full:`/media/99e0e7e19549dd16-1600.jpg`},"Peternakan An-Nahl -20260724T124811Z-1-001/Peternakan An-Nahl/Perikanan/20260514_123525.jpg":{thumbnail:`/media/cc2944b26c71d48a-480.jpg`,full:`/media/cc2944b26c71d48a-1600.jpg`},"PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260430_124929.jpg":{thumbnail:`/media/04ed71c8b4d6a8db-480.jpg`,full:`/media/04ed71c8b4d6a8db-1600.jpg`},"PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260430_125028.jpg":{thumbnail:`/media/e91d4ab7e5bf6bf1-480.jpg`,full:`/media/e91d4ab7e5bf6bf1-1600.jpg`},"PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260430_125314.jpg":{thumbnail:`/media/7b0c0a79f01eaf4b-480.jpg`,full:`/media/7b0c0a79f01eaf4b-1600.jpg`},"PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260504_055128.jpg":{thumbnail:`/media/d8b077647258587d-480.jpg`,full:`/media/d8b077647258587d-1600.jpg`},"PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260504_055627.jpg":{thumbnail:`/media/bba2a17e11edff95-480.jpg`,full:`/media/bba2a17e11edff95-1600.jpg`},"PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260504_060403.jpg":{thumbnail:`/media/ed2597543b8cace6-480.jpg`,full:`/media/ed2597543b8cace6-1600.jpg`},"PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260504_060515.jpg":{thumbnail:`/media/70394e677cd38ae6-480.jpg`,full:`/media/70394e677cd38ae6-1600.jpg`},"Program bahasa arab -20260724T124815Z-1-001/Program bahasa arab/20260508_080021.jpg":{thumbnail:`/media/0af171a83b40dbfb-480.jpg`,full:`/media/0af171a83b40dbfb-1600.jpg`},"Program Qur'an -20260724T124816Z-1-001/Program Qur_an/20260515_061438.jpg":{thumbnail:`/media/efc3c76e6e6f427e-480.jpg`,full:`/media/efc3c76e6e6f427e-1600.jpg`},"Program Qur'an -20260724T124816Z-1-001/Program Qur_an/20260515_061540.jpg":{thumbnail:`/media/465988c9238eb65c-480.jpg`,full:`/media/465988c9238eb65c-1600.jpg`},"Program Qur'an -20260724T124816Z-1-001/Program Qur_an/20260515_061638.jpg":{thumbnail:`/media/742b91be4e86e3ba-480.jpg`,full:`/media/742b91be4e86e3ba-1600.jpg`},"Program Qur'an -20260724T124816Z-1-001/Program Qur_an/VideoCapture_20260515-062014.jpg":{thumbnail:`/media/4ac5acef3ea13bae-480.jpg`,full:`/media/4ac5acef3ea13bae-1600.jpg`}},f=new Map(Object.values(d).map(e=>[e.full,e.thumbnail]));function p(e){return d[e]?.full||`/picture/`+e.split(`/`).map(encodeURIComponent).join(`/`)}function m(e){return f.get(e)||e}var h={hero:{beranda:p(`Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260208_172922.jpg`),tentang:p(`Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260108_172045.jpg`),program:p(`Program Qur'an -20260724T124816Z-1-001/Program Qur_an/20260515_061438.jpg`),berita:p(`Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Al kahfi day/20260515_054906.jpg`),galeri:p(`Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260512_115312.jpg`),kontak:p(`Moment-Moment tamu-20260724T124807Z-1-001/Moment-Moment tamu/20260429_110144.jpg`),donasi:p(`PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260504_055128.jpg`),pendaftaran:p(`PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260430_125314.jpg`)},about:p(`Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260111_215510.jpg`),program:{tahfidz:p(`Program Qur'an -20260724T124816Z-1-001/Program Qur_an/20260515_061540.jpg`),formal:p(`KEGIATAN Sekolah formal -20260724T124804Z-1-001/KEGIATAN Sekolah formal/VideoCapture_20260509-195534.jpg`),pemberdayaan:p(`PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260504_060403.jpg`)},tentang:{visi:p(`Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260208_172900.jpg`),pengasuh:p(`Muhadloroh -20260724T124809Z-1-001/Muhadloroh/Khitobiyyah/Salinan 20251018_210225.jpg`)},beranda:{news1:p(`Program Qur'an -20260724T124816Z-1-001/Program Qur_an/20260515_061638.jpg`),news2:p(`Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Al kahfi day/20260515_054956.jpg`),news3:p(`PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260430_124929.jpg`)},berita:{wisuda:p(`Program Qur'an -20260724T124816Z-1-001/Program Qur_an/VideoCapture_20260515-062014.jpg`),israMiraj:p(`Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Al kahfi day/20260515_054836.jpg`),pendaftaran:p(`PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260504_055627.jpg`),baktiSosial:p(`PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260504_060515.jpg`),olimpiade:p(`KEGIATAN Sekolah formal -20260724T124804Z-1-001/KEGIATAN Sekolah formal/VideoCapture_20260509-195559.jpg`),khataman:p(`Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Sholat jama_ah/20260508_204228.jpg`)}},g=[{src:p(`Program Qur'an -20260724T124816Z-1-001/Program Qur_an/20260515_061438.jpg`),alt:`Program Tahfidz Al-Quran`,category:`Ibadah`},{src:p(`Program bahasa arab -20260724T124815Z-1-001/Program bahasa arab/20260508_080021.jpg`),alt:`Program Bahasa Arab`,category:`Akademik`},{src:p(`KEGIATAN Sekolah formal -20260724T124804Z-1-001/KEGIATAN Sekolah formal/VideoCapture_20260509-195518.jpg`),alt:`Kegiatan Sekolah Formal`,category:`Akademik`},{src:p(`Muhadloroh -20260724T124809Z-1-001/Muhadloroh/Kelas/20260503_205739.jpg`),alt:`Kelas Muhadloroh`,category:`Akademik`},{src:p(`Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Sholat jama_ah/20260508_203515.jpg`),alt:`Sholat Jamaah`,category:`Ibadah`},{src:p(`Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Al kahfi day/20260515_054817.jpg`),alt:`Al Kahfi Day`,category:`Ibadah`},{src:p(`EKSKUL-20260724T124802Z-1-001/EKSKUL/Hadroh/20260502_190015.jpg`),alt:`Ekstrakurikuler Hadroh`,category:`Ibadah`},{src:p(`EKSKUL-20260724T124802Z-1-001/EKSKUL/Marawis/20260514_162707.jpg`),alt:`Ekstrakurikuler Marawis`,category:`Ibadah`},{src:p(`Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Acara pondok/20260119_211522.jpg`),alt:`Acara Pondok`,category:`Acara`},{src:p(`PPDA & PPDU-20260724T124814Z-1-001/PPDA & PPDU/20260430_125028.jpg`),alt:`Program PPDA & PPDU`,category:`Acara`},{src:p(`Moment-Moment tamu-20260724T124807Z-1-001/Moment-Moment tamu/20260429_085350.jpg`),alt:`Kunjungan Tamu`,category:`Acara`},{src:p(`Muhadloroh -20260724T124809Z-1-001/Muhadloroh/Khitobiyyah/Salinan 20251018_212802.jpg`),alt:`Khitobiyyah Santri`,category:`Acara`},{src:p(`Peternakan An-Nahl -20260724T124811Z-1-001/Peternakan An-Nahl/Kambing/20260514_104628.jpg`),alt:`Peternakan Kambing`,category:`Fasilitas`},{src:p(`Peternakan An-Nahl -20260724T124811Z-1-001/Peternakan An-Nahl/Perikanan/20260514_123525.jpg`),alt:`Peternakan Perikanan`,category:`Fasilitas`},{src:p(`Peternakan An-Nahl -20260724T124811Z-1-001/Peternakan An-Nahl/Bebek/20260514_123237.jpg`),alt:`Peternakan Bebek`,category:`Fasilitas`},{src:p(`EKSKUL-20260724T124802Z-1-001/EKSKUL/Futsal/20260206_174403.jpg`),alt:`Ekstrakurikuler Futsal`,category:`Fasilitas`},{src:p(`EKSKUL-20260724T124802Z-1-001/EKSKUL/Silat/20260502_065839.jpg`),alt:`Ekstrakurikuler Pencak Silat`,category:`Fasilitas`},{src:p(`EKSKUL-20260724T124802Z-1-001/EKSKUL/Melukis/20260513_094541.jpg`),alt:`Ekstrakurikuler Melukis`,category:`Fasilitas`},{src:p(`Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Makan/20260304_175452.jpg`),alt:`Makan Bersama Santri`,category:`Fasilitas`},{src:p(`Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Senam/IMG-20260417-WA0006.jpg`),alt:`Senam Pagi Santri`,category:`Fasilitas`},{src:p(`Moment-Moment hiburan santri-20260724T124805Z-1-001/Moment-Moment hiburan santri/20260429_092133.jpg`),alt:`Hiburan Santri`,category:`Acara`},{src:p(`Kegiatan santri-20260724T124803Z-1-001/Kegiatan santri/Bersih-bersih/VideoCapture_20260509-195550.jpg`),alt:`Gotong Royong Bersih-bersih`,category:`Acara`}],_=[];function v(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function y(e){return new Date(e).toLocaleDateString(`id-ID`,{day:`numeric`,month:`long`,year:`numeric`})}function b(e){return n(e)}function x(e,t=150){let n=r(e);return n.length>t?n.slice(0,t).trimEnd()+`…`:n}function S(e){return{slug:String(e.id),category:v(e.kategori),title:v(e.judul),date:y(e.dibuat_pada),img:v(a(e.gambar_url)||h.hero.berita),thumbnail:v(a(e.thumbnail_url)||a(e.gambar_url)||h.hero.berita),caption:v(e.caption||``),excerpt:v(x(e.isi)),content:b(e.isi)}}function C(e){return`
    <article class="news-card" data-category="${e.category}" data-slug="${e.slug}">
      <div class="news-card-img">
        <img src="${e.thumbnail}" alt="${e.title}" loading="lazy" />
      </div>
      <div class="news-card-body">
        <span class="badge">${e.category}</span>
        <h3 class="news-card-title">${e.title}</h3>
        <div class="news-card-date">${e.date}</div>
        <p class="news-card-excerpt">${e.excerpt}</p>
        <a href="#" class="card-link" onclick="event.preventDefault();showArticle('${e.slug}')">Baca selengkapnya <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a>
      </div>
    </article>
  `}function w(){return`
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${h.hero.berita}')"></div>
      <div class="hero-overlay"></div>
      <div class="hero-pattern"></div>
      <div class="hero-content">
        <span class="section-label" style="color: var(--green-300)">BERITA & KEGIATAN</span>
        <h1 style="font-size: 44px">Kabar Terbaru</h1>
        <p class="hero-subtitle">Ikuti perkembangan kegiatan dan pencapaian santri Pesantren An-Nahl.</p>
      </div>
    </section>

    <!-- Articles Grid -->
    <section class="section" style="background: var(--neutral-50)">
      <div class="container">
        <!-- Filter -->
        <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap;justify-content:center;margin-bottom:var(--space-2xl)" class="reveal">
          ${[`Semua`,`Akademik`,`Keagamaan`,`Sosial`,`Pengumuman`].map((e,t)=>`
            <button class="badge news-filter" data-filter="${e}" style="cursor:pointer;border:none;font-size:14px;padding:8px 20px;${t===0?`background:var(--green-800);color:var(--white)`:``}">${e}</button>
          `).join(``)}
        </div>

        <div class="grid-3" id="news-grid">
          <p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Memuat berita...</p>
        </div>
      </div>
    </section>

    <!-- Article Detail Modal -->
    <div id="article-modal" class="article-modal" onclick="if(event.target===this)closeArticle()">
      <div class="article-modal-content">
        <button class="article-modal-close" onclick="closeArticle()">&times;</button>
        <div id="article-modal-body"></div>
      </div>
    </div>
  `}if(!document.getElementById(`berita-styles`)){let e=document.createElement(`style`);e.id=`berita-styles`,e.textContent=`
    .article-modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 2000;
      align-items: flex-start;
      justify-content: center;
      overflow-y: auto;
      padding: 40px 20px;
      backdrop-filter: blur(4px);
    }
    .article-modal.open { display: flex; }
    .article-modal-content {
      background: var(--white);
      border-radius: var(--radius-lg);
      max-width: 800px;
      width: 100%;
      position: relative;
      margin-top: 40px;
      margin-bottom: 40px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.2);
      animation: slideUp 0.4s var(--ease-out);
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .article-modal-close {
      position: absolute;
      top: 16px;
      right: 20px;
      font-size: 32px;
      color: var(--neutral-500);
      background: none;
      border: none;
      cursor: pointer;
      z-index: 10;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;
    }
    .article-modal-close:hover {
      background: var(--neutral-100);
      color: var(--neutral-950);
    }
    .article-detail-cover {
      width: 100%;
      aspect-ratio: 16/9;
      object-fit: cover;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }
    .article-detail-body {
      padding: 40px;
    }
    .article-detail-body h2 {
      font-size: 28px;
      margin-bottom: 8px;
      line-height: 1.3;
    }
    .article-detail-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }
    .article-detail-body h3 {
      margin-top: 28px;
      margin-bottom: 12px;
      font-size: 20px;
      color: var(--green-900);
    }
    .article-detail-body p {
      color: var(--neutral-700);
      line-height: 1.8;
      margin-bottom: 16px;
      font-size: 16px;
    }
    .article-detail-body ul {
      color: var(--neutral-700);
      line-height: 1.8;
      font-size: 16px;
    }
    .article-related {
      border-top: 1px solid var(--neutral-200);
      padding: 24px 40px;
    }
    .news-card[data-hidden="true"] { display: none; }
    @media (max-width: 768px) {
      .article-detail-body { padding: 24px; }
      .article-detail-body h2 { font-size: 22px; }
      .article-modal { padding: 20px 12px; }
      .article-modal-content { margin-top: 20px; }
      .article-related { padding: 20px 24px; }
    }
  `,document.head.appendChild(e)}window.showArticle=function(e){let t=_.find(t=>t.slug===e);if(!t)return;let n=_.filter(n=>n.slug!==e&&n.category===t.category).slice(0,2),r=document.getElementById(`article-modal`);document.getElementById(`article-modal-body`).innerHTML=`
    <img src="${t.img}" alt="${t.title}" class="article-detail-cover" />
    <div class="article-detail-body">
      <span class="badge">${t.category}</span>
      <h2>${t.title}</h2>
      <div class="article-detail-meta">
        <span style="font-size:14px;color:var(--neutral-500)">${t.date}</span>
      </div>
      ${t.caption?`<p class="photo-caption">${t.caption}</p>`:``}
      ${t.content}
    </div>
    ${n.length?`
      <div class="article-related">
        <h3 style="font-size:16px;margin-bottom:16px;color:var(--neutral-950)">Artikel Terkait</h3>
        ${n.map(e=>`
          <a href="#" onclick="event.preventDefault();showArticle('${e.slug}')" style="display:flex;gap:12px;align-items:center;padding:8px 0;text-decoration:none;border-bottom:1px solid var(--neutral-100)">
            <img src="${e.img}" alt="${e.title}" style="width:60px;height:45px;object-fit:cover;border-radius:6px" loading="lazy" />
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--neutral-950);line-height:1.3">${e.title}</div>
              <div style="font-size:12px;color:var(--neutral-500)">${e.date}</div>
            </div>
          </a>
        `).join(``)}
      </div>
    `:``}
  `,r.classList.add(`open`),document.body.style.overflow=`hidden`},window.closeArticle=function(){let e=document.getElementById(`article-modal`);e&&(e.classList.remove(`open`),document.body.style.overflow=``)},window.initNewsFilter=async function(){if(!e){let e=document.getElementById(`news-grid`);e&&(e.innerHTML=`<p>Berita pesantren akan tersedia setelah layanan terhubung.</p>`);return}let t=document.querySelectorAll(`.news-filter`);t.forEach(e=>{e.addEventListener(`click`,()=>{t.forEach(e=>{e.style.background=``,e.style.color=``}),e.style.background=`var(--green-800)`,e.style.color=`var(--white)`;let n=e.dataset.filter;document.querySelectorAll(`.news-card[data-category]`).forEach(e=>{e.dataset.hidden=n!==`Semua`&&e.dataset.category!==n?`true`:`false`})})});let{data:n,error:r}=await e.from(`berita`).select(`*`).eq(`status`,`published`).is(`deleted_at`,null).order(`dibuat_pada`,{ascending:!1}),i=document.getElementById(`news-grid`);if(i){if(r){console.error(r),i.innerHTML=`<p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Gagal memuat berita. Silakan coba lagi nanti.</p>`;return}if(_=n.map(S),_.length===0){i.innerHTML=`<p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Belum ada berita.</p>`;return}i.innerHTML=_.map(C).join(``),window.lucide&&window.lucide.createIcons()}};function T(){return`
    <!-- HERO -->
    <section class="hero hero-left" id="hero">
      <div class="hero-bg" style="background-image: url('${h.hero.beranda}')"></div>
      <div class="hero-overlay" style="background: linear-gradient(105deg, rgba(5,46,22,0.92) 0%, rgba(5,46,22,0.75) 40%, rgba(5,46,22,0.15) 75%, transparent 100%)"></div>
      <div class="hero-pattern"></div>
      <div class="hero-content" style="text-align:left;align-items:flex-start;max-width:620px">
        <div class="hero-arabic">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>
        <h1>Membentuk Generasi Qur'ani yang Berdaya & Berakhlak</h1>
        <p class="hero-subtitle">
          Pondok Pesantren Pemberdayaan Ummat An-Nahl mendidik santri dengan kurikulum terpadu menghafal Al-Qur'an, menguasai ilmu, dan siap memberdayakan ummat.
        </p>
        <div class="btn-group">
          <a href="#/pendaftaran" class="btn btn-white">Daftar Sekarang</a>
          <a href="#/program" class="btn btn-outline-white">Program Kami →</a>
        </div>
      </div>
      <div class="hero-scroll">
        <i data-lucide="chevron-down" style="width:28px;height:28px"></i>
      </div>
    </section>

    <!-- TENTANG SINGKAT -->
    <section class="section" id="about" style="background: var(--neutral-50)">
      <div class="container">
        <div class="about-content">
          <div class="about-text">
            <span class="section-label reveal">TENTANG KAMI</span>
            <h2 class="reveal reveal-delay-1">Mendidik dengan Kasih, Memberdayakan dengan Ilmu</h2>
            <p class="reveal reveal-delay-2">
              Pondok Pesantren Pemberdayaan Ummat An-Nahl hadir sebagai lembaga pendidikan Islam yang memadukan nilai-nilai salaf dengan pendekatan modern. Kami percaya bahwa setiap santri memiliki potensi untuk menjadi pemimpin ummat yang berilmu, berakhlak mulia, dan mandiri.
            </p>
            <div class="checklist reveal reveal-delay-3">
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Kurikulum terpadu: Al-Qur'an, akademik, dan keterampilan</span>
              </div>
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Pengajar berpengalaman dan berdedikasi</span>
              </div>
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Lingkungan Islami yang kondusif dan aman</span>
              </div>
            </div>
            <div style="margin-top: var(--space-xl)" class="reveal reveal-delay-4">
              <a href="#/tentang" class="btn btn-secondary">Selengkapnya tentang kami →</a>
            </div>
          </div>
          <div class="about-image reveal">
            <img src="${h.about}" 
                 alt="Pondok Pesantren An-Nahl" loading="lazy" />
          </div>
        </div>
      </div>
    </section>

    <!-- PROGRAM UNGGULAN -->
    <section class="section" id="programs" style="background: var(--green-50)">
      <div class="container">
        <div class="section-header">
          <span class="section-label reveal">PROGRAM KAMI</span>
          <h2 class="section-title reveal reveal-delay-1">Kurikulum Terpadu untuk Generasi Unggul</h2>
          <p class="section-subtitle reveal reveal-delay-2">Empat pilar pendidikan yang membentuk santri berilmu, berakhlak, dan berdaya.</p>
        </div>
        <div class="grid-4">
          <div class="card reveal">
            <div class="card-icon">
              <i data-lucide="book-open" style="width:28px;height:28px"></i>
            </div>
            <h3 class="card-title">Tahfidz Al-Qur'an</h3>
            <p class="card-text">Program hafalan 30 juz dengan metode talaqqi dan muraja'ah intensif, dibimbing oleh hafidz bersertifikat.</p>
            <a href="#/program" class="card-link">Pelajari lebih lanjut <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a>
          </div>
          <div class="card reveal reveal-delay-1">
            <div class="card-icon">
              <i data-lucide="graduation-cap" style="width:28px;height:28px"></i>
            </div>
            <h3 class="card-title">Pendidikan Formal</h3>
            <p class="card-text">Kurikulum nasional terakreditasi dipadukan pelajaran keislaman untuk jenjang akademik lebih tinggi.</p>
            <a href="#/program" class="card-link">Pelajari lebih lanjut <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a>
          </div>
          <div class="card reveal reveal-delay-2">
            <div class="card-icon">
              <i data-lucide="users" style="width:28px;height:28px"></i>
            </div>
            <h3 class="card-title">Pemberdayaan Ummat</h3>
            <p class="card-text">Melatih santri aktif berdakwah dan berkontribusi sosial di masyarakat sekitar pesantren.</p>
            <a href="#/program" class="card-link">Pelajari lebih lanjut <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a>
          </div>
          <div class="card reveal reveal-delay-3">
            <div class="card-icon">
              <i data-lucide="wrench" style="width:28px;height:28px"></i>
            </div>
            <h3 class="card-title">Keterampilan Hidup</h3>
            <p class="card-text">Pelatihan kewirausahaan, pertanian, dan teknologi agar santri mandiri secara ekonomi.</p>
            <a href="#/program" class="card-link">Pelajari lebih lanjut <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a>
          </div>
        </div>
        <div style="text-align:center; margin-top: var(--space-2xl)" class="reveal">
          <a href="#/program" class="btn btn-secondary">Lihat Semua Program →</a>
        </div>
      </div>
    </section>

    <!-- STATISTIK -->
    <section class="stats" id="stats">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item reveal">
            <div class="stat-number" data-counter="500" data-suffix="+">0</div>
            <div class="stat-label">Santri Aktif</div>
          </div>
          <div class="stat-item reveal reveal-delay-1">
            <div class="stat-number" data-counter="30" data-suffix="+">0</div>
            <div class="stat-label">Pengajar Profesional</div>
          </div>
          <div class="stat-item reveal reveal-delay-2">
            <div class="stat-number" data-counter="15" data-suffix="+">0</div>
            <div class="stat-label">Tahun Pengalaman</div>
          </div>
          <div class="stat-item reveal reveal-delay-3">
            <div class="stat-number" data-counter="98" data-suffix="%">0</div>
            <div class="stat-label">Lulusan Melanjutkan</div>
          </div>
        </div>
      </div>
    </section>

    <!-- BERITA & KEGIATAN -->
    <section class="section" id="news" style="background: var(--neutral-50)">
      <div class="container">
        <div class="section-header">
          <span class="section-label reveal">BERITA & KEGIATAN</span>
          <h2 class="section-title reveal reveal-delay-1">Kabar Terbaru dari Pesantren An-Nahl</h2>
          <p class="section-subtitle reveal reveal-delay-2">Ikuti perkembangan kegiatan dan pencapaian santri kami.</p>
        </div>
          <div class="grid-3" id="beranda-news-grid">
          <p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Memuat berita...</p>
        </div>
        <div style="text-align:center; margin-top: var(--space-2xl)" class="reveal">
          <a href="#/berita" class="btn btn-secondary">Lihat Semua Berita →</a>
        </div>
      </div>
    </section>

    <!-- CTA DONASI -->
    <section class="cta-donasi" id="cta-donation">
      <div class="container">
        <div class="cta-donasi-content">
          <p class="hadits reveal">"Sedekah tidak akan mengurangi harta." — HR. Muslim</p>
          <h2 class="reveal reveal-delay-1">Bantu Wujudkan Mimpi Para Santri</h2>
          <p class="reveal reveal-delay-2">Donasi Anda membantu santri dhuafa mendapatkan akses pendidikan berkualitas, fasilitas yang layak, dan masa depan yang lebih cerah. Setiap kontribusi, sekecil apa pun, sangat berarti.</p>
          <div class="reveal reveal-delay-3">
            <a href="#/donasi" class="btn btn-white">Donasi Sekarang</a>
          </div>
        </div>
      </div>
    </section>
  `}window.initBerandaNews=async function(){if(!e){let e=document.getElementById(`beranda-news-grid`);e&&(e.innerHTML=`<p>Berita pesantren akan tersedia setelah layanan terhubung.</p>`);return}let{data:t,error:n}=await e.from(`berita`).select(`*`).eq(`status`,`published`).is(`deleted_at`,null).order(`dibuat_pada`,{ascending:!1}).limit(3),r=document.getElementById(`beranda-news-grid`);if(r){if(n){console.error(n),r.innerHTML=`<p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Gagal memuat berita.</p>`;return}if(t.length===0){r.innerHTML=`<p style="grid-column:1/-1;text-align:center;color:var(--neutral-500)">Belum ada berita.</p>`;return}r.innerHTML=t.map(e=>`
    <div class="news-card">
      <div class="news-card-img">
        <img src="${v(e.thumbnail_url||e.gambar_url||h.hero.berita)}" alt="${v(e.judul)}" loading="lazy" />
      </div>
      <div class="news-card-body">
        <span class="badge">${v(e.kategori)}</span>
        <h3 class="news-card-title">${v(e.judul)}</h3>
        <div class="news-card-date">${y(e.dibuat_pada)}</div>
        <p class="news-card-excerpt">${v(x(e.isi))}</p>
        <a href="#/berita" class="card-link">Baca selengkapnya <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a>
      </div>
    </div>
  `).join(``),window.lucide&&window.lucide.createIcons()}};function E(){return`
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${h.hero.tentang}')"></div>
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
            <img src="${h.tentang.visi}" alt="Visi Misi Pesantren" loading="lazy" />
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
            Pondok Pesantren Pemberdayaan Ummat An-Nahl didirikan pada tahun 2011 oleh KH. Muhammad Ridwan dengan visi sederhana namun kuat: mencetak generasi muda Muslim yang tidak hanya menghafal Al-Qur'an, tetapi juga mampu menjadi agen perubahan di masyarakat.
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

    <!-- Profil Pengasuh -->
    <section class="section" style="background: var(--neutral-50)">
      <div class="container">
        <div class="section-header">
          <span class="section-label reveal">PENGASUH</span>
          <h2 class="section-title reveal reveal-delay-1">Profil Pimpinan Pesantren</h2>
        </div>
        <div style="max-width: 600px; margin: 0 auto; text-align: center" class="reveal reveal-delay-2">
          <div style="width: 160px; height: 160px; border-radius: 50%; overflow: hidden; margin: 0 auto var(--space-lg); box-shadow: var(--shadow-lg)">
            <img src="${h.tentang.pengasuh}" alt="KH. Muhammad Ridwan" style="width:100%; height:100%; object-fit:cover" loading="lazy" />
          </div>
          <h3 style="font-family: var(--font-heading); font-size: 28px; margin-bottom: var(--space-sm)">KH. Muhammad Ridwan, Lc., M.A.</h3>
          <span class="badge" style="margin-bottom: var(--space-lg)">Pengasuh & Pendiri</span>
          <p style="color: var(--neutral-700)">
            Lulusan Universitas Al-Azhar, Kairo. Hafidz 30 juz bersanad. Berpengalaman lebih dari 20 tahun dalam pendidikan Islam dan pemberdayaan masyarakat. Aktif sebagai dai dan motivator pendidikan Islam di tingkat nasional.
          </p>
        </div>
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
  `}function D(){return`
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${h.hero.program}')"></div>
      <div class="hero-overlay"></div>
      <div class="hero-pattern"></div>
      <div class="hero-content">
        <span class="section-label" style="color: var(--green-300)">PROGRAM</span>
        <h1 style="font-size: 44px">Program Pendidikan Unggulan</h1>
        <p class="hero-subtitle">Kurikulum terpadu yang memadukan pendidikan agama, akademik, dan keterampilan hidup.</p>
      </div>
    </section>

    <!-- Program Tahfidz -->
    <section class="section" style="background: var(--neutral-50)">
      <div class="container">
        <div class="about-content">
          <div class="about-text">
            <span class="section-label reveal">PROGRAM UTAMA</span>
            <h2 class="reveal reveal-delay-1">Tahfidz Al-Qur'an</h2>
            <p class="reveal reveal-delay-2">
              Program unggulan pesantren An-Nahl yang membimbing santri untuk menghafal Al-Qur'an 30 juz dengan metode talaqqi langsung dari ustadz hafidz bersanad. Setiap santri mendapat bimbingan personal sesuai kemampuan dan kecepatan hafalannya.
            </p>
            <div class="checklist reveal reveal-delay-3" style="margin-top: var(--space-lg)">
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Target hafalan 30 juz dalam 3 tahun</span>
              </div>
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Metode talaqqi dan muraja'ah intensif</span>
              </div>
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Pengajar hafidz bersertifikat dan bersanad</span>
              </div>
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Wisuda tahfidz tahunan dengan sanad keilmuan</span>
              </div>
            </div>
          </div>
          <div class="about-image reveal">
            <img src="${h.program.tahfidz}" alt="Program Tahfidz" loading="lazy" />
          </div>
        </div>
      </div>
    </section>

    <!-- Program Formal -->
    <section class="section" style="background: var(--green-50)">
      <div class="container">
        <div class="about-content">
          <div class="about-image reveal" style="order:-1">
            <img src="${h.program.formal}" alt="Pendidikan Formal" loading="lazy" />
          </div>
          <div class="about-text">
            <span class="section-label reveal">PENDIDIKAN FORMAL</span>
            <h2 class="reveal reveal-delay-1">Kurikulum Nasional Terakreditasi</h2>
            <p class="reveal reveal-delay-2">
              Santri menempuh pendidikan formal setara SMP dan SMA dengan kurikulum nasional yang diperkaya dengan mata pelajaran keislaman. Lulusan kami siap melanjutkan ke perguruan tinggi negeri maupun timur tengah.
            </p>
            <div class="checklist reveal reveal-delay-3" style="margin-top: var(--space-lg)">
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Setara SMP & SMA terakreditasi A</span>
              </div>
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Bimbingan masuk PTN dan beasiswa luar negeri</span>
              </div>
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Laboratorium sains dan perpustakaan lengkap</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Program Pemberdayaan -->
    <section class="section" style="background: var(--neutral-50)">
      <div class="container">
        <div class="about-content">
          <div class="about-text">
            <span class="section-label reveal">PEMBERDAYAAN UMMAT</span>
            <h2 class="reveal reveal-delay-1">Dakwah & Kontribusi Sosial</h2>
            <p class="reveal reveal-delay-2">
              Sesuai nama "An-Nahl" (lebah) yang selalu memberi manfaat, program ini melatih santri untuk aktif berdakwah, mengajar di masyarakat, dan menjalankan program sosial.
            </p>
            <div class="checklist reveal reveal-delay-3" style="margin-top: var(--space-lg)">
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Pengajaran Al-Qur'an di desa-desa binaan</span>
              </div>
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Bakti sosial dan santunan rutin</span>
              </div>
              <div class="checklist-item">
                <i data-lucide="circle-check" class="checklist-icon"></i>
                <span>Pelatihan public speaking dan kepemimpinan</span>
              </div>
            </div>
          </div>
          <div class="about-image reveal">
            <img src="${h.program.pemberdayaan}" alt="Pemberdayaan Ummat" loading="lazy" />
          </div>
        </div>
      </div>
    </section>

    <!-- Keterampilan & Ekskul -->
    <section class="section" style="background: var(--green-50)">
      <div class="container">
        <div class="section-header">
          <span class="section-label reveal">KETERAMPILAN & EKSTRAKURIKULER</span>
          <h2 class="section-title reveal reveal-delay-1">Bekal untuk Masa Depan</h2>
          <p class="section-subtitle reveal reveal-delay-2">Berbagai keterampilan yang mempersiapkan santri menjadi pribadi mandiri.</p>
        </div>
        <div class="grid-4">
          <div class="card reveal" style="text-align:center">
            <div class="card-icon" style="margin:0 auto var(--space-lg)"><i data-lucide="laptop" style="width:28px;height:28px"></i></div>
            <h3 class="card-title">Teknologi</h3>
            <p class="card-text">Pelatihan komputer, coding dasar, dan literasi digital.</p>
          </div>
          <div class="card reveal reveal-delay-1" style="text-align:center">
            <div class="card-icon" style="margin:0 auto var(--space-lg)"><i data-lucide="sprout" style="width:28px;height:28px"></i></div>
            <h3 class="card-title">Pertanian</h3>
            <p class="card-text">Budidaya tanaman organik dan peternakan mandiri.</p>
          </div>
          <div class="card reveal reveal-delay-2" style="text-align:center">
            <div class="card-icon" style="margin:0 auto var(--space-lg)"><i data-lucide="store" style="width:28px;height:28px"></i></div>
            <h3 class="card-title">Kewirausahaan</h3>
            <p class="card-text">Praktik bisnis, manajemen koperasi, dan pemasaran.</p>
          </div>
          <div class="card reveal reveal-delay-3" style="text-align:center">
            <div class="card-icon" style="margin:0 auto var(--space-lg)"><i data-lucide="swords" style="width:28px;height:28px"></i></div>
            <h3 class="card-title">Olahraga</h3>
            <p class="card-text">Pencak silat, panahan, renang, dan futsal.</p>
          </div>
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
            ${[[`04:00 - 05:00`,`Tahajjud & Sholat Subuh Berjamaah`],[`05:00 - 06:30`,`Setoran Hafalan (Talaqqi)`],[`06:30 - 07:00`,`Sarapan & Persiapan`],[`07:00 - 12:00`,`Kegiatan Belajar Mengajar Formal`],[`12:00 - 13:30`,`Sholat Dzuhur & Istirahat`],[`13:30 - 15:00`,`Muraja'ah & Kajian Kitab`],[`15:00 - 16:30`,`Sholat Ashar & Ekstrakurikuler`],[`16:30 - 17:30`,`Olahraga & Aktivitas Bebas`],[`17:30 - 18:30`,`Sholat Maghrib & Tadarus`],[`18:30 - 19:30`,`Sholat Isya & Makan Malam`],[`19:30 - 21:00`,`Belajar Mandiri & Muraja'ah`],[`21:00`,`Istirahat / Tidur`]].map(([e,t])=>`
              <div style="display:flex;gap:var(--space-lg);align-items:center;padding:var(--space-md) var(--space-lg);background:var(--white);border-radius:var(--radius-md);border:1px solid var(--neutral-200)">
                <span style="font-weight:600;color:var(--green-800);white-space:nowrap;font-size:14px;min-width:120px">${e}</span>
                <span style="color:var(--neutral-700);font-size:15px">${t}</span>
              </div>
            `).join(``)}
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
  `}var O=new Set([`kontak`]);async function k(e,t,n,r){if(!O.has(e))throw Error(`Pendaftaran dan donasi disimpan melalui Google.`);if(!t.nama?.trim()||t.nama.trim().length<2)throw Error(`Nama minimal dua karakter.`);if(e===`kontak`&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t.email||``)||!t.pesan?.trim()))throw Error(`Periksa email dan isi pesan.`);if(new TextEncoder().encode(JSON.stringify(t)).length>14e3)throw Error(`Isian terlalu panjang. Mohon ringkas pesan atau alamat.`);if(!r)throw Error(`Layanan formulir belum tersedia. Silakan hubungi pengurus melalui WhatsApp.`);let{error:i}=await r.from(`form_submissions`).insert({id:n,kind:e,payload:t});if(i&&i.code!==`23505`)throw Error(`Belum berhasil mengirim. Periksa koneksi lalu coba lagi, atau hubungi pengurus.`)}function A(e,n,r,a){if(!e)return;if([`pendaftaran`,`donasi`].includes(n))return i(e,n,r,a);let o=e.querySelector(`[type="submit"]`),s=e.querySelector(`[role="status"]`);s||(s=document.createElement(`p`),s.setAttribute(`role`,`status`),s.className=`submission-status`,e.appendChild(s));let c=!1,l=null,u=``;e.addEventListener(`submit`,async i=>{if(i.preventDefault(),c)return;let d=r(),f=JSON.stringify(d);f!==u&&(l=crypto.randomUUID(),u=f);let p=o.innerHTML,m=[...e.elements].map(e=>[e,e.disabled]);m.forEach(([e])=>{e.disabled=!0}),c=!0,o.disabled=!0,o.textContent=`Mengirim…`,s.textContent=``;try{let{supabase:r}=await t(async()=>{let{supabase:e}=await import(`./supabase-DTXc74uv.js`).then(e=>e.n);return{supabase:e}},[]);await k(n,d,l,r),s.textContent=a,s.dataset.state=`success`,e.reset(),l=null,u=``}catch(e){s.textContent=e.message,s.dataset.state=`error`}finally{c=!1,m.forEach(([e,t])=>{e.disabled=t}),o.disabled=!1,o.innerHTML=p}})}function j(){A(document.getElementById(`registration-form`),`pendaftaran`,()=>({nama:document.getElementById(`reg-nama`).value.trim(),tempatLahir:document.getElementById(`reg-tempat-lahir`).value.trim(),tanggalLahir:document.getElementById(`reg-tanggal-lahir`).value,jenisKelamin:document.getElementById(`reg-jenis-kelamin`).value,asalSekolah:document.getElementById(`reg-asal-sekolah`).value.trim(),program:document.getElementById(`reg-program`).value,namaWali:document.getElementById(`reg-nama-wali`).value.trim(),noWA:document.getElementById(`reg-no-wa`).value.trim(),email:document.getElementById(`reg-email`).value.trim(),alamat:document.getElementById(`reg-alamat`).value.trim()}),`Pendaftaran diterima. Pengurus akan menghubungi Anda melalui kontak yang dicantumkan.`)}window.initPendaftaran=j;function M(){return`
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${h.hero.pendaftaran}')"></div>
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
        <div class="grid-2">
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
            <div class="card" style="background: var(--white)">
              <div style="text-align:center; padding: var(--space-lg)">
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
                <option>Tahfidz Al-Qur'an</option>
                <option>Pendidikan Formal + Tahfidz</option>
                <option>Pemberdayaan Ummat</option>
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
          ${[[`Apakah pesantren menerima santri putra dan putri?`,`Ya, Pesantren An-Nahl menerima santri putra dan putri dengan asrama terpisah dan pengajar sesuai gender.`],[`Berapa lama durasi pendidikan?`,`Program Tahfidz murni 3 tahun, Program Formal + Tahfidz 6 tahun (setara SMP-SMA).`],[`Apakah tersedia beasiswa?`,`Ya, tersedia beasiswa penuh dan parsial untuk santri berprestasi dan dari keluarga kurang mampu. Hubungi kami untuk informasi lebih lanjut.`],[`Bolehkah orang tua berkunjung?`,`Orang tua dapat berkunjung setiap hari Ahad dan hari libur. Jadwal kunjungan akan diinformasikan lebih lanjut.`],[`Apakah santri boleh membawa HP?`,`Penggunaan gadget diatur oleh pesantren. Santri tidak diperkenankan membawa HP pribadi selama kegiatan belajar.`]].map(([e,t],n)=>`
            <div class="card reveal" style="padding:var(--space-lg)">
              <h3 style="font-size:17px;margin-bottom:var(--space-sm);color:var(--green-900)">${e}</h3>
              <p style="font-size:15px;color:var(--neutral-700);line-height:1.65">${t}</p>
            </div>
          `).join(``)}
        </div>
      </div>
    </section>
  `}function N(){return`
    <section class="hero" style="min-height:50vh"><div class="hero-bg" style="background-image:url('${h.hero.galeri}')"></div><div class="hero-overlay"></div><div class="hero-content"><span class="section-label" style="color:var(--green-300)">GALERI</span><h1>Galeri Foto & Video</h1><p class="hero-subtitle">Dokumentasi kegiatan dan suasana Pesantren An-Nahl.</p></div></section>
    <section class="section"><div class="container"><div class="section-header"><span class="section-label">FOTO KEGIATAN</span><h2 class="section-title">Momen yang Terabadikan</h2></div><div class="gallery-filters" role="group" aria-label="Kategori foto">${[`Semua`,`Akademik`,`Ibadah`,`Acara`,`Fasilitas`].map((e,t)=>`<button class="badge gallery-filter" data-filter="${e}" aria-pressed="${t===0}">${e}</button>`).join(``)}</div><p id="gallery-status" role="status"></p><div class="gallery-grid" id="photo-grid"></div><button id="gallery-more" class="btn btn-secondary" hidden>Muat foto lainnya</button></div></section>
    <section class="section" style="background:var(--green-50)"><div class="container"><div class="section-header"><span class="section-label">VIDEO</span><h2 class="section-title">Video Kegiatan Pesantren</h2></div><p id="video-status" role="status"></p><div class="grid-3" id="video-grid"></div><button id="video-more" class="btn btn-secondary" hidden>Muat video lainnya</button></div></section>
    <dialog id="lightbox" class="lightbox" aria-label="Pratinjau foto"><button class="lightbox-close" aria-label="Tutup foto">&times;</button><img id="lightbox-img" alt="" /><div id="lightbox-caption" class="lightbox-caption"></div></dialog>
  `}if(!document.getElementById(`galeri-styles`)){let e=document.createElement(`style`);e.id=`galeri-styles`,e.textContent=`
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-md);
    }
    .gallery-item {
      position: relative;
      border-radius: var(--radius-md);
      overflow: hidden;
      cursor: pointer;
      aspect-ratio: 4/3;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .gallery-item.hidden {
      display: none;
    }
    .gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s var(--ease-out);
    }
    .gallery-item:hover img {
      transform: scale(1.08);
    }
    .gallery-overlay {
      position: absolute;
      inset: 0;
      background: rgba(5, 46, 22, 0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .gallery-overlay span {
      color: white;
      font-size: 14px;
      font-weight: 500;
    }
    .gallery-item:hover .gallery-overlay {
      opacity: 1;
    }

    /* Video card */
    .video-card {
      background: var(--white);
      border: 1px solid var(--neutral-200);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: all 0.35s var(--ease-out);
      box-shadow: var(--shadow-sm);
    }
    .video-card:hover {
      border-color: var(--green-200);
      box-shadow: var(--shadow-lg);
      transform: translateY(-4px);
    }
    .video-thumbnail {
      position: relative;
      aspect-ratio: 16/9;
      cursor: pointer;
      overflow: hidden;
      background: var(--neutral-950);
    }
    .video-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease, opacity 0.4s ease;
      opacity: 0.85;
    }
    .video-thumbnail:hover img {
      transform: scale(1.05);
      opacity: 0.7;
    }
    .video-play-btn {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(5, 46, 22, 0.7);
      border-radius: 50%;
      transition: all 0.3s ease;
      backdrop-filter: blur(4px);
    }
    .video-thumbnail:hover .video-play-btn {
      background: var(--green-800);
      transform: translate(-50%, -50%) scale(1.1);
    }

    /* Lightbox */
    .lightbox {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.92);
      z-index: 2000;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      padding: 40px;
    }
    .lightbox.open { display: flex; }
    .lightbox img {
      max-width: 90vw;
      max-height: 80vh;
      object-fit: contain;
      border-radius: 8px;
    }
    .lightbox-close {
      position: absolute;
      top: 20px;
      right: 30px;
      font-size: 36px;
      color: white;
      background: none;
      border: none;
      cursor: pointer;
      z-index: 2001;
      transition: transform 0.2s ease;
    }
    .lightbox-close:hover {
      transform: scale(1.2);
    }
    .lightbox-caption {
      color: rgba(255,255,255,0.7);
      margin-top: 16px;
      font-size: 15px;
    }

    @media (max-width: 768px) {
      .gallery-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .gallery-grid { grid-template-columns: 1fr; }
    }
  `,document.head.appendChild(e)}var P=e=>{let t=a(e.gambar_url||e.src),n=a(e.thumbnail_url||m(t));if(!t||!n)return``;let r=e.judul||e.alt||`Foto kegiatan`;return`<button type="button" class="gallery-item" data-full="${o(t)}" data-caption="${o(e.caption||r)}" aria-label="Buka foto ${o(r)}"><img src="${o(n)}" alt="${o(r)}" loading="lazy" decoding="async" /><span class="gallery-overlay"><span>${o(r)}</span></span></button>`},F=e=>/^[\w-]{11}$/.test(e.youtube_id||``)?`<article class="video-card"><button type="button" class="video-thumbnail" data-video="${e.youtube_id}" data-title="${o(e.judul)}" aria-label="Putar ${o(e.judul)}"><img src="https://img.youtube.com/vi/${e.youtube_id}/mqdefault.jpg" alt="" loading="lazy" /><span class="video-play-btn" aria-hidden="true">▶</span></button><div style="padding:24px"><span class="badge">${o(e.kategori)}</span><h3>${o(e.judul)}</h3></div></article>`:``;window.openLightbox=function(e,t){let n=document.getElementById(`lightbox`);!n||!a(e)||(document.getElementById(`lightbox-img`).src=e,document.getElementById(`lightbox-img`).alt=t,document.getElementById(`lightbox-caption`).textContent=t,n.classList.add(`open`),n.showModal(),document.body.style.overflow=`hidden`)},window.closeLightbox=function(){let e=document.getElementById(`lightbox`);e&&(e.close(),e.classList.remove(`open`),document.body.style.overflow=``,document.getElementById(`lightbox-img`).removeAttribute(`src`))},window.initGalleryFilter=async function(){let e=document.getElementById(`photo-grid`),n=document.getElementById(`video-grid`);if(!e||!n)return;let r=`Semua`,i=0,a=0,o=0,s=document.getElementById(`gallery-status`),c=document.getElementById(`video-status`),l=document.getElementById(`gallery-more`),u=document.getElementById(`video-more`),{supabase:d}=await t(async()=>{let{supabase:e}=await import(`./supabase-DTXc74uv.js`).then(e=>e.n);return{supabase:e}},[]);if(!e.isConnected)return;async function f(t=!1){let n=++o;t&&(i=0,e.replaceChildren()),s.textContent=`Memuat foto…`,l.disabled=!0;try{let t,a;if(d){let e=d.from(`galeri_foto`).select(`id,judul,kategori,gambar_url,thumbnail_url,caption`,{count:`exact`}).order(`dibuat_pada`,{ascending:!1}).order(`id`);r!==`Semua`&&(e=e.eq(`kategori`,r));let n=await e.range(i,i+11);if(n.error)throw n.error;t=n.data,a=n.count||0}else{let e=g.filter(e=>r===`Semua`||e.category===r);t=e.slice(i,i+12),a=e.length}if(!e.isConnected||n!==o)return;e.insertAdjacentHTML(`beforeend`,t.map(P).join(``)),i+=t.length,l.hidden=i>=a,s.textContent=a?``:`Belum ada foto pada kategori ini.`}catch{e.isConnected&&n===o&&(s.textContent=`Foto belum dapat dimuat. Klik muat foto untuk mencoba lagi.`,l.hidden=!1)}finally{n===o&&(l.disabled=!1)}}async function p(){if(!u.disabled){u.disabled=!0,c.textContent=`Memuat video…`;try{if(!d){c.textContent=`Video kegiatan belum tersedia.`;return}let{data:e,count:t,error:r}=await d.from(`galeri_video`).select(`id,judul,kategori,youtube_id`,{count:`exact`}).order(`dibuat_pada`,{ascending:!1}).order(`id`).range(a,a+5);if(r)throw r;if(!n.isConnected)return;n.insertAdjacentHTML(`beforeend`,e.map(F).join(``)),a+=e.length,u.hidden=a>=t,c.textContent=t?``:`Video kegiatan belum tersedia.`}catch{n.isConnected&&(c.textContent=`Video belum dapat dimuat. Klik muat video untuk mencoba lagi.`,u.hidden=!1)}finally{u.disabled=!1}}}document.querySelectorAll(`.gallery-filter`).forEach(e=>e.addEventListener(`click`,()=>{r=e.dataset.filter,document.querySelectorAll(`.gallery-filter`).forEach(t=>t.setAttribute(`aria-pressed`,String(t===e))),f(!0)})),l.addEventListener(`click`,()=>f()),u.addEventListener(`click`,p),e.addEventListener(`click`,e=>{let t=e.target.closest(`[data-full]`);t&&window.openLightbox(t.dataset.full,t.dataset.caption)});let m=document.getElementById(`lightbox`);m.querySelector(`button`).addEventListener(`click`,window.closeLightbox),m.addEventListener(`cancel`,e=>{e.preventDefault(),window.closeLightbox()}),m.addEventListener(`click`,e=>{e.target===m&&window.closeLightbox()}),n.addEventListener(`click`,e=>{let t=e.target.closest(`[data-video]`);if(!t)return;let n=document.createElement(`iframe`);n.src=`https://www.youtube-nocookie.com/embed/${t.dataset.video}?autoplay=1`,n.title=t.dataset.title,n.allow=`autoplay; encrypted-media; fullscreen`,n.allowFullscreen=!0,n.style.cssText=`width:100%;aspect-ratio:16/9;border:0;display:block`,t.replaceWith(n)}),await Promise.all([f(!0),p()])};function I(){return`
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${h.hero.donasi}')"></div>
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
  `}window.initDonasi=function(){A(document.getElementById(`donation-form`),`donasi`,()=>({nama:document.getElementById(`donor-name`).value.trim(),jumlah:document.getElementById(`donor-amount`).value.replace(/\D/g,``),metode:document.getElementById(`donor-method`).value,program:document.getElementById(`donor-program`).value,pesan:document.getElementById(`donor-message`).value.trim()}),`Konfirmasi diterima untuk diperiksa pengurus. Pesan ini belum merupakan verifikasi pembayaran.`)};function L(){return`
    <!-- Page Header -->
    <section class="hero" style="min-height: 50vh">
      <div class="hero-bg" style="background-image: url('${h.hero.kontak}')"></div>
      <div class="hero-overlay"></div>
      <div class="hero-pattern"></div>
      <div class="hero-content">
        <span class="section-label" style="color: var(--green-300)">KONTAK</span>
        <h1 style="font-size: 44px">Hubungi Kami</h1>
        <p class="hero-subtitle">Kami siap menjawab pertanyaan Anda seputar pesantren, pendaftaran, dan program.</p>
      </div>
    </section>

    <!-- Contact Info + Form -->
    <section class="section" style="background: var(--neutral-50)">
      <div class="container">
        <div class="grid-2">
          <!-- Contact Info -->
          <div>
            <span class="section-label reveal">INFORMASI KONTAK</span>
            <h2 class="reveal reveal-delay-1" style="margin-bottom: var(--space-xl)">Jangan Ragu untuk Bertanya</h2>
            
            <div style="display:flex;flex-direction:column;gap:var(--space-lg)" class="reveal reveal-delay-2">
              <div style="display:flex;gap:var(--space-md);align-items:flex-start">
                <div class="card-icon" style="flex-shrink:0">
                  <i data-lucide="map-pin" style="width:22px;height:22px"></i>
                </div>
                <div>
                  <strong style="display:block;margin-bottom:4px">Alamat</strong>
                  <span style="color:var(--neutral-700);font-size:15px">Jl. Pesantren Raya No. 1, Desa Suka Maju, Kecamatan Ciwidey, Kabupaten Bandung, Jawa Barat 40375</span>
                </div>
              </div>
              <div style="display:flex;gap:var(--space-md);align-items:flex-start">
                <div class="card-icon" style="flex-shrink:0">
                  <i data-lucide="phone" style="width:22px;height:22px"></i>
                </div>
                <div>
                  <strong style="display:block;margin-bottom:4px">Telepon / WhatsApp</strong>
                  <span style="color:var(--neutral-700);font-size:15px">0812-3456-7890</span>
                  <a href="https://wa.me/6281234567890?text=Assalamu'alaikum%2C%20saya%20ingin%20bertanya%20tentang%20Pesantren%20An-Nahl." target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;margin-top:8px;padding:8px 16px;background:#25D366;color:white;border-radius:var(--radius-sm);font-size:13px;font-weight:500;text-decoration:none;transition:all 0.3s ease">
                    <svg viewBox="0 0 32 32" width="16" height="16" fill="white"><path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.914 15.914 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.31 22.606c-.39 1.1-1.932 2.014-3.164 2.28-.844.178-1.944.32-5.652-1.214-4.746-1.962-7.8-6.78-8.034-7.094-.226-.314-1.886-2.512-1.886-4.792 0-2.28 1.194-3.402 1.618-3.868.39-.428 1.028-.624 1.64-.624.198 0 .376.01.536.018.47.02.706.048 1.016.788.388.926 1.332 3.248 1.448 3.484.118.236.234.546.078.86-.148.32-.278.52-.518.796-.236.278-.496.62-.708.832-.236.236-.482.492-.208.964.276.47 1.226 2.022 2.632 3.274 1.81 1.612 3.334 2.112 3.806 2.348.47.236.748.198 1.024-.118.278-.32 1.194-1.388 1.512-1.866.314-.47.632-.394 1.064-.236.434.156 2.756 1.3 3.226 1.536.47.236.788.354.904.548.118.198.118 1.1-.272 2.198z"/></svg>
                    Chat via WhatsApp
                  </a>
                </div>
              </div>
              <div style="display:flex;gap:var(--space-md);align-items:flex-start">
                <div class="card-icon" style="flex-shrink:0">
                  <i data-lucide="mail" style="width:22px;height:22px"></i>
                </div>
                <div>
                  <strong style="display:block;margin-bottom:4px">Email</strong>
                  <span style="color:var(--neutral-700);font-size:15px">info@annahl.id</span>
                </div>
              </div>
              <div style="display:flex;gap:var(--space-md);align-items:flex-start">
                <div class="card-icon" style="flex-shrink:0">
                  <i data-lucide="clock" style="width:22px;height:22px"></i>
                </div>
                <div>
                  <strong style="display:block;margin-bottom:4px">Jam Operasional</strong>
                  <span style="color:var(--neutral-700);font-size:15px">Senin – Jumat: 08:00 – 16:00 WIB<br>Sabtu: 08:00 – 12:00 WIB</span>
                </div>
              </div>
            </div>

            <!-- Social -->
            <div style="margin-top:var(--space-xl)" class="reveal reveal-delay-3">
              <strong style="display:block;margin-bottom:var(--space-md)">Media Sosial</strong>
              <div style="display:flex;gap:var(--space-sm)">
                <a href="#" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-sm);background:var(--green-50);color:var(--green-700);transition:all 0.3s ease" onmouseover="this.style.background='var(--green-800)';this.style.color='white'" onmouseout="this.style.background='var(--green-50)';this.style.color='var(--green-700)'">
                  <i data-lucide="instagram" style="width:20px;height:20px"></i>
                </a>
                <a href="#" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-sm);background:var(--green-50);color:var(--green-700);transition:all 0.3s ease" onmouseover="this.style.background='var(--green-800)';this.style.color='white'" onmouseout="this.style.background='var(--green-50)';this.style.color='var(--green-700)'">
                  <i data-lucide="facebook" style="width:20px;height:20px"></i>
                </a>
                <a href="#" style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:var(--radius-sm);background:var(--green-50);color:var(--green-700);transition:all 0.3s ease" onmouseover="this.style.background='var(--green-800)';this.style.color='white'" onmouseout="this.style.background='var(--green-50)';this.style.color='var(--green-700)'">
                  <i data-lucide="youtube" style="width:20px;height:20px"></i>
                </a>
              </div>
            </div>
          </div>

          <!-- Contact Form -->
          <div class="reveal">
            <div class="card" style="padding:var(--space-xl)">
              <h3 style="margin-bottom:var(--space-lg)">Kirim Pesan</h3>
              <form id="contact-form">
                <div class="form-group">
                  <label class="form-label">Nama Lengkap *</label>
                  <input id="contact-name" type="text" class="form-input" placeholder="Nama Anda" required />
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md)">
                  <div class="form-group">
                    <label class="form-label">Email *</label>
                    <input id="contact-email" type="email" class="form-input" placeholder="email@contoh.com" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">No. Telepon</label>
                    <input id="contact-phone" type="tel" class="form-input" placeholder="08xx-xxxx-xxxx" />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Subjek *</label>
                  <select id="contact-subject" class="form-select" required>
                    <option value="">Pilih topik</option>
                    <option>Informasi Pendaftaran</option>
                    <option>Informasi Program</option>
                    <option>Kunjungan / Silaturahmi</option>
                    <option>Donasi</option>
                    <option>Lainnya</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Pesan *</label>
                  <textarea id="contact-message" class="form-textarea" placeholder="Tuliskan pesan atau pertanyaan Anda..." required></textarea>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%">
                  <i data-lucide="send" style="width:18px;height:18px"></i>
                  Kirim Pesan
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Google Maps -->
    <section style="background:var(--green-50);padding:var(--space-3xl) 0">
      <div class="container">
        <div class="section-header">
          <span class="section-label reveal">LOKASI</span>
          <h2 class="section-title reveal reveal-delay-1">Temukan Kami</h2>
        </div>
        <div class="reveal reveal-delay-2" style="border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-lg);height:400px">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63376.420862!2d107.4935!3d-7.0389!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e68e8e0b1e3c7e7%3A0x301576d14fed290!2sBandung%2C+Jawa+Barat!5e0!3m2!1sen!2sid!4v1640000000000" 
            width="100%" 
            height="100%" 
            style="border:0" 
            allowfullscreen="" 
            loading="lazy" 
            referrerpolicy="no-referrer-when-downgrade">
          </iframe>
        </div>
      </div>
    </section>
  `}window.initKontak=function(){A(document.getElementById(`contact-form`),`kontak`,()=>({nama:document.getElementById(`contact-name`).value.trim(),email:document.getElementById(`contact-email`).value.trim(),telepon:document.getElementById(`contact-phone`).value.trim(),subjek:document.getElementById(`contact-subject`).value,pesan:document.getElementById(`contact-message`).value.trim()}),`Pesan diterima. Pengurus akan merespons melalui kontak yang Anda cantumkan.`)};function R(){return`
    <a href="https://wa.me/6285772821484?text=Assalamu'alaikum%2C%20saya%20ingin%20bertanya%20tentang%20Pesantren%20An-Nahl." target="_blank" rel="noopener noreferrer" class="wa-float" id="wa-float" aria-label="Chat WhatsApp">
      <svg viewBox="0 0 32 32" width="28" height="28" fill="white">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.914 15.914 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.31 22.606c-.39 1.1-1.932 2.014-3.164 2.28-.844.178-1.944.32-5.652-1.214-4.746-1.962-7.8-6.78-8.034-7.094-.226-.314-1.886-2.512-1.886-4.792 0-2.28 1.194-3.402 1.618-3.868.39-.428 1.028-.624 1.64-.624.198 0 .376.01.536.018.47.02.706.048 1.016.788.388.926 1.332 3.248 1.448 3.484.118.236.234.546.078.86-.148.32-.278.52-.518.796-.236.278-.496.62-.708.832-.236.236-.482.492-.208.964.276.47 1.226 2.022 2.632 3.274 1.81 1.612 3.334 2.112 3.806 2.348.47.236.748.198 1.024-.118.278-.32 1.194-1.388 1.512-1.866.314-.47.632-.394 1.064-.236.434.156 2.756 1.3 3.226 1.536.47.236.788.354.904.548.118.198.118 1.1-.272 2.198z"/>
      </svg>
      <span class="wa-float-label">Chat Kami</span>
    </a>
    <style>
      .wa-float {
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 900;
        display: flex;
        align-items: center;
        gap: 10px;
        background: #25D366;
        color: white;
        padding: 14px 22px 14px 16px;
        border-radius: 100px;
        box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4);
        text-decoration: none;
        transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: var(--font-body);
      }
      .wa-float:hover {
        transform: translateY(-3px) scale(1.03);
        box-shadow: 0 8px 28px rgba(37, 211, 102, 0.5);
        color: white;
      }
      .wa-float:active {
        transform: translateY(0) scale(0.98);
      }
      .wa-float-label {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.2px;
        white-space: nowrap;
      }
      /* Pulse animation */
      .wa-float::before {
        content: '';
        position: absolute;
        inset: -4px;
        border-radius: 100px;
        background: #25D366;
        opacity: 0;
        z-index: -1;
        animation: waPulse 2.5s ease-in-out infinite;
      }
      @keyframes waPulse {
        0%, 100% { opacity: 0; transform: scale(1); }
        50% { opacity: 0.15; transform: scale(1.12); }
      }
      /* Mobile: icon only */
      @media (max-width: 768px) {
        .wa-float {
          padding: 16px;
          bottom: 20px;
          right: 20px;
        }
        .wa-float-label { display: none; }
      }
    </style>
  `}var z=document.getElementById(`app`);z.innerHTML=`
  ${c()}
  <main id="page-content" style="transition: opacity 0.3s ease, transform 0.3s ease;"></main>
  ${u()}
  ${R()}
`,l(),new s([{path:`/`,component:T},{path:`/tentang`,component:E},{path:`/program`,component:D},{path:`/pendaftaran`,component:M},{path:`/berita`,component:w},{path:`/galeri`,component:N},{path:`/donasi`,component:I},{path:`/kontak`,component:L}]).init(),document.addEventListener(`DOMContentLoaded`,()=>{window.lucide&&window.lucide.createIcons()});