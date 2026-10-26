 // ═══════════════════════════════════════════
// NAVBAR Component
// ═══════════════════════════════════════════

export function Navbar() {
  return `
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
  `;
}

export function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const drawer = document.getElementById('mobile-drawer');
  const overlay = document.getElementById('drawer-overlay');

  // Scroll effect
  const onScroll = () => {
    if (window.scrollY > 80) {
      navbar.classList.remove('transparent');
      navbar.classList.add('solid');
    } else {
      navbar.classList.add('transparent');
      navbar.classList.remove('solid');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger toggle
  const setDrawer = (open, restoreFocus = true) => {
    hamburger.classList.toggle('open', open);
    drawer.classList.toggle('open', open);
    overlay.classList.toggle('open', open);
    drawer.inert = !open;
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) drawer.querySelector('a').focus();
    else if (restoreFocus) hamburger.focus();
  };

  hamburger.addEventListener('click', () => setDrawer(!drawer.classList.contains('open')));
  overlay.addEventListener('click', () => setDrawer(false));
  document.addEventListener('keydown', (event) => {
    if (!drawer.classList.contains('open')) return;
    if (event.key === 'Escape') setDrawer(false);
    if (event.key === 'Tab') {
      const links = [...drawer.querySelectorAll('a')];
      const stops = [hamburger, ...links];
      const index = stops.indexOf(document.activeElement);
      event.preventDefault();
      stops[(index + (event.shiftKey ? -1 : 1) + stops.length) % stops.length].focus();
    }
  });
  window.matchMedia('(min-width: 1101px)').addEventListener('change', (event) => {
    if (event.matches && drawer.classList.contains('open')) setDrawer(false, false);
  });

  // Close drawer on link click
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (drawer.classList.contains('open')) setDrawer(false, false);
    });
  });
}
