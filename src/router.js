// ═══════════════════════════════════════════
// ROUTER — Hash-based SPA Router
// ═══════════════════════════════════════════

export class Router {
  constructor(routes) {
    this.routes = routes;
    this.currentPage = null;
    this.renderTimer = null;
    this.renderSequence = 0;
    this.observers = [];
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  init() {
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const route = this.routes.find(r => r.path === hash) || this.routes.find(r => r.path === '/');
    
    if (route && route !== this.currentPage) {
      this.currentPage = route;
      this.render(route);
    }
  }

  render(route) {
    const sequence = ++this.renderSequence;
    const app = document.getElementById('page-content');
    if (!app) return;

    const firstRender = !app.children.length;
    clearTimeout(this.renderTimer);
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    if (window.closeArticle) window.closeArticle();
    if (window.closeLightbox) window.closeLightbox();
    document.getElementById('payment-dialog')?.close();
    // Cancel a pending transition when visitors navigate quickly.
    app.style.opacity = '0';
    app.style.transform = 'translateY(10px)';
    
    this.renderTimer = setTimeout(async () => {
      let markup;
      try { markup = await route.component(); }
      catch {
        if (sequence !== this.renderSequence) return;
        app.innerHTML = '<section class="section"><div class="container"><h1>Halaman belum dapat dibuka.</h1><p>Periksa koneksi internet lalu coba lagi.</p><button class="btn btn-primary" id="route-retry">Coba lagi</button></div></section>';
        app.style.opacity = '1'; app.style.transform = 'none';
        document.getElementById('route-retry')?.addEventListener('click', () => this.render(route));
        return;
      }
      if (sequence !== this.renderSequence) return;
      app.innerHTML = markup;
      window.scrollTo({ top: 0, behavior: 'instant' });
      const heading = app.querySelector('h1');
      if (heading && !firstRender) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
      
      // Fade in
      requestAnimationFrame(() => {
        app.style.opacity = '1';
        app.style.transform = 'translateY(0)';
      });

      // Re-init features
      if (window.lucide) window.lucide.createIcons();
      this.initScrollReveal();
      this.initCounters();
      this.updateActiveLink(route.path);

      // Page-specific inits
      if (route.path === '/galeri' && window.initGalleryFilter) {
        window.initGalleryFilter();
      }
      if (route.path === '/berita' && window.initNewsFilter) {
        window.initNewsFilter();
      }
      if (route.path === '/' && window.initBerandaNews) {
        window.initBerandaNews();
      }
      if (route.path === '/pendaftaran') window.initPendaftaran?.();
      if (route.path === '/kontak') window.initKontak?.();
      if (route.path === '/donasi') window.initDonasi?.();
      // Close any open modals
      if (window.closeArticle) window.closeArticle();
      if (window.closeLightbox) window.closeLightbox();

      // Update page title for SEO
      const titles = {
        '/': 'Pondok Pesantren Pemberdayaan Ummat An-Nahl — Membentuk Generasi Qur\'ani',
        '/tentang': 'Tentang Kami — Pesantren An-Nahl',
        '/program': 'Program Pendidikan — Pesantren An-Nahl',
        '/pendaftaran': 'Pendaftaran Santri Baru — Pesantren An-Nahl',
        '/berita': 'Berita & Kegiatan — Pesantren An-Nahl',
        '/galeri': 'Galeri Foto & Video — Pesantren An-Nahl',
        '/donasi': 'Donasi — Pesantren An-Nahl',
        '/kontak': 'Hubungi Kami — Pesantren An-Nahl',
      };
      document.title = titles[route.path] || titles['/'];
    }, firstRender || this.reducedMotion.matches ? 0 : 160);
  }

  initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;

    reveals.forEach(el => {
      if (el.matches('.about-image')) el.classList.add('reveal-slide');
    });
    if (this.reducedMotion.matches || !('IntersectionObserver' in window)) {
      reveals.forEach(el => el.classList.add('revealed'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06 });

    this.observers.push(observer);
    reveals.forEach(el => observer.observe(el));
  }

  initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;
    if (this.reducedMotion.matches || !('IntersectionObserver' in window)) {
      counters.forEach(el => { el.textContent = el.dataset.counter + (el.dataset.suffix || ''); });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.counter);
          const suffix = el.dataset.suffix || '';
          this.animateCounter(el, target, suffix);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    this.observers.push(observer);
    counters.forEach(el => observer.observe(el));
  }

  animateCounter(el, target, suffix) {
    const duration = 2000;
    const start = performance.now();
    
    const update = (now) => {
      if (!el.isConnected) return;
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      el.textContent = current + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    
    requestAnimationFrame(update);
  }

  updateActiveLink(path) {
    document.querySelectorAll('.navbar-link').forEach(link => {
      const active = link.getAttribute('href') === '#' + path;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  navigate(path) {
    window.location.hash = path;
  }
}
