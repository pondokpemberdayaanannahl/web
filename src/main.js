// ═══════════════════════════════════════════
// MAIN — Entry Point
// Website Pondok Pesantren An-Nahl
// ═══════════════════════════════════════════

import './styles/index.css';
import './styles/components.css';
import './styles/pages.css';

import { Router } from './router.js';
import { Navbar, initNavbar } from './components/navbar.js';
import { Footer } from './components/footer.js';
import { Beranda } from './pages/beranda.js';
import { Tentang } from './pages/tentang.js';
import { Program } from './pages/program.js';
import { Pendaftaran } from './pages/pendaftaran.js';
import { Berita } from './pages/berita.js';
import { Galeri } from './pages/galeri.js';
import { Donasi } from './pages/donasi.js';
import { Kontak } from './pages/kontak.js';
import { WhatsAppButton } from './components/whatsapp.js';

// ── App Shell ──
const app = document.getElementById('app');
app.innerHTML = `
  ${Navbar()}
  <main id="page-content" style="transition: opacity 0.3s ease, transform 0.3s ease;"></main>
  ${Footer()}
  ${WhatsAppButton()}
`;

// ── Initialize Navbar ──
initNavbar();

// ── Setup Router ──
const routes = [
  { path: '/', component: Beranda },
  { path: '/tentang', component: Tentang },
  { path: '/program', component: Program },
  { path: '/pendaftaran', component: Pendaftaran },
  { path: '/berita', component: Berita },
  { path: '/galeri', component: Galeri },
  { path: '/donasi', component: Donasi },
  { path: '/kontak', component: Kontak },
];

const router = new Router(routes);
router.init();

// ── Initialize Lucide Icons ──
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
