function e(){return`
    <nav class="navbar transparent" id="navbar">
      <div class="navbar-inner">
        <a href="#/" class="navbar-logo" aria-label="An-Nahl — Beranda">
          <span class="navbar-logo-mark" aria-hidden="true"><img src="/brand/an-nahl.png" alt="" class="navbar-logo-img" width="678" height="366" decoding="async" /></span>
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
      <a href="#/pendaftaran" class="btn btn-primary" style="margin-top: 16px">Daftar Sekarang</a>
    </div>
  `}function t(){let e=document.getElementById(`navbar`),t=document.getElementById(`hamburger`),n=document.getElementById(`mobile-drawer`),r=document.getElementById(`drawer-overlay`),i=()=>{window.scrollY>80?(e.classList.remove(`transparent`),e.classList.add(`solid`)):(e.classList.add(`transparent`),e.classList.remove(`solid`))};window.addEventListener(`scroll`,i,{passive:!0}),i();let a=(e,i=!0)=>{t.classList.toggle(`open`,e),n.classList.toggle(`open`,e),r.classList.toggle(`open`,e),n.inert=!e,t.setAttribute(`aria-expanded`,String(e)),t.setAttribute(`aria-label`,e?`Tutup menu`:`Buka menu`),document.body.style.overflow=e?`hidden`:``,e?n.querySelector(`a`).focus():i&&t.focus()};t.addEventListener(`click`,()=>a(!n.classList.contains(`open`))),r.addEventListener(`click`,()=>a(!1)),document.addEventListener(`keydown`,e=>{if(n.classList.contains(`open`)&&(e.key===`Escape`&&a(!1),e.key===`Tab`)){let r=[...n.querySelectorAll(`a`)],i=[t,...r],a=i.indexOf(document.activeElement);e.preventDefault(),i[(a+(e.shiftKey?-1:1)+i.length)%i.length].focus()}}),window.matchMedia(`(min-width: 1101px)`).addEventListener(`change`,e=>{e.matches&&n.classList.contains(`open`)&&a(!1,!1)}),n.querySelectorAll(`a`).forEach(e=>{e.addEventListener(`click`,()=>{n.classList.contains(`open`)&&a(!1,!1)})})}export{e as Navbar,t as initNavbar};