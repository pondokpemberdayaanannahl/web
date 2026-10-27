// ═══════════════════════════════════════════
// MAIN — Entry Point
// Website Pondok Pesantren An-Nahl
// ═══════════════════════════════════════════

import './styles/index.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/editor-shortcut.css';

import { Router } from './router.js';
import { Navbar, initNavbar } from './components/navbar.js';
import { Footer } from './components/footer.js';
import { WhatsAppButton } from './components/whatsapp.js';
import { supabase } from './supabase.js';
import { renderSiteContent } from './site-content.js';
import { readPublishedSiteContent } from './site-content-store.js';
import { initEditorShortcut } from './public-editor-shortcut.js';

// ── App Shell ──
const app = document.getElementById('app');
app.innerHTML = `${Navbar()}<main class="site-loading" role="status">Menyiapkan halaman…</main>${Footer()}`;
async function mountSite() {
let timer;
const content = await Promise.race([
  readPublishedSiteContent(supabase).catch(() => ({})),
  new Promise(resolve => { timer = setTimeout(() => resolve({}), 1800); }),
]);
clearTimeout(timer);
const shell = renderSiteContent(`${Navbar()}${Footer()}${WhatsAppButton()}`, content.global);
app.innerHTML = shell.replace(/<footer\b/, '<main id="page-content" style="transition: opacity 0.3s ease, transform 0.3s ease;"></main><footer');

// ── Initialize Navbar ──
initNavbar();

// ── Setup Router ──
const lazy = (id, load, name) => async () => renderSiteContent((await load())[name](), content[id]);
const routes = [
  { path: '/', component: lazy('beranda', () => import('./pages/beranda.js'), 'Beranda') },
  { path: '/tentang', component: lazy('tentang', () => import('./pages/tentang.js'), 'Tentang') },
  { path: '/program', component: lazy('program', () => import('./pages/program.js'), 'Program') },
  { path: '/pendaftaran', component: lazy('pendaftaran', () => import('./pages/pendaftaran.js'), 'Pendaftaran') },
  { path: '/berita', component: lazy('berita', () => import('./pages/berita.js'), 'Berita') },
  { path: '/galeri', component: lazy('galeri', () => import('./pages/galeri.js'), 'Galeri') },
  { path: '/donasi', component: lazy('donasi', () => import('./pages/donasi.js'), 'Donasi') },
  { path: '/kontak', component: lazy('kontak', () => import('./pages/kontak.js'), 'Kontak') },
];
const router = new Router(routes);
router.init();
initEditorShortcut(supabase);
}
mountSite();

// ── Initialize Lucide Icons ──
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
