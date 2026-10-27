import { SITE_PAGES } from './site-content.js';

const modules = { beranda: 'Beranda', tentang: 'Tentang', program: 'Program', pendaftaran: 'Pendaftaran', donasi: 'Donasi', kontak: 'Kontak', berita: 'Berita', galeri: 'Galeri' };
const imports = {
  beranda: () => import('./pages/beranda.js'), tentang: () => import('./pages/tentang.js'), program: () => import('./pages/program.js'),
  pendaftaran: () => import('./pages/pendaftaran.js'), donasi: () => import('./pages/donasi.js'), kontak: () => import('./pages/kontak.js'),
  berita: () => import('./pages/berita.js'), galeri: () => import('./pages/galeri.js'),
};
export async function pageTemplate(id) {
  if (!SITE_PAGES.some(page => page.id === id)) throw new Error('Halaman tidak dikenal.');
  if (id === 'global') {
    const [{ Navbar }, { Footer }, { WhatsAppButton }] = await Promise.all([import('./components/navbar.js'), import('./components/footer.js'), import('./components/whatsapp.js')]);
    return `${Navbar()}${Footer()}${WhatsAppButton()}`;
  }
  const module = await imports[id]();
  return module[modules[id]]();
}
