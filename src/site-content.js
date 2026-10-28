// Only plain text and explicitly supported attributes can be changed. The page
// structure, forms, event handlers, and executable HTML always come from source.
export const SITE_PAGES = [
  { id: 'beranda', title: 'Beranda', path: '/', description: 'Sampul, pengenalan, program, angka pondok, dan ajakan.' },
  { id: 'tentang', title: 'Tentang pondok', path: '/tentang', description: 'Visi misi, sejarah, pengasuh, dan nilai pondok.' },
  { id: 'program', title: 'Program pendidikan', path: '/program', description: 'Program unggulan, keterampilan, dan jadwal kegiatan.' },
  { id: 'pendaftaran', title: 'Informasi pendaftaran', path: '/pendaftaran', description: 'Alur, persyaratan, biaya, dan pertanyaan umum.' },
  { id: 'donasi', title: 'Informasi donasi', path: '/donasi', description: 'Program bantuan, rekening, dan informasi pembayaran.' },
  { id: 'kontak', title: 'Kontak & lokasi', path: '/kontak', description: 'Alamat, nomor telepon, email, media sosial, dan peta.' },
  { id: 'berita', title: 'Halaman berita', path: '/berita', description: 'Judul dan pengantar halaman. Postingannya ada di menu Berita.' },
  { id: 'galeri', title: 'Halaman galeri', path: '/galeri', description: 'Judul dan pengantar halaman. Foto dan video ada di menu Galeri.' },
  { id: 'global', title: 'Menu, footer & WhatsApp', path: '/', description: 'Identitas, kontak di kaki halaman, tautan sosial, dan tombol WhatsApp.' },
];
export const blankSiteContent = () => ({ version: 1, values: {}, hidden: [] });
const excluded = 'script,style,form,dialog,button,input,textarea,select,option,[aria-hidden="true"],.sr-only,#news-grid,#beranda-news-grid,#photo-grid,#video-grid,#video-status,#gallery-status,#news-status,.news-filters,.gallery-filters,#lightbox,#article-modal';
const hash = text => { let result = 2166136261; for (const c of text) result = Math.imul(result ^ c.charCodeAt(0), 16777619); return (result >>> 0).toString(36); };

export function contentUrl(value, kind = 'link') {
  if (typeof value !== 'string' || /[<>\\\r\n]/.test(value) || (kind !== 'link' && /["']/.test(value)) || value.length > 2048) return '';
  const text = value.trim();
  if (kind === 'link' && (text === '#' || text.startsWith('#/'))) return text;
  if (text.startsWith('/') && !text.startsWith('//') && !text.includes('..')) return text;
  try {
    const url = new URL(text);
    if (kind === 'link' && ['mailto:', 'tel:'].includes(url.protocol)) return text;
    if (url.protocol !== 'https:' || url.username || url.password) return '';
    if (kind === 'map' && !['www.google.com', 'maps.google.com', 'www.google.co.id', 'www.openstreetmap.org'].includes(url.hostname)) return '';
    return text;
  } catch { return ''; }
}

export function validateSiteDocument(content) {
  if (!content || content.version !== 1 || !content.values || Object.prototype.toString.call(content.values) !== '[object Object]' || !Array.isArray(content.hidden)) throw new Error('Format isi halaman belum sesuai.');
  if (Object.keys(content).some(key => !['version', 'values', 'hidden'].includes(key)) || Object.keys(content.values).length > 600 || content.hidden.length > 40) throw new Error('Isi halaman terlalu besar.');
  for (const [key, value] of Object.entries(content.values)) {
    if (!/^[a-z0-9:-]{1,180}$/.test(key) || typeof value !== 'string' || value.length > 8000) throw new Error('Ada isian halaman yang belum sesuai.');
  }
  if (content.hidden.some(key => !/^b-[a-z0-9]+$/.test(key))) throw new Error('Bagian halaman belum sesuai.');
  if (new TextEncoder().encode(JSON.stringify(content)).length > 96000) throw new Error('Isi halaman terlalu besar.');
  return content;
}

export function createContentCatalog(html, doc = document) {
  const template = doc.createElement('template'); template.innerHTML = html;
  const root = template.content;
  const sections = [...root.children].filter(node => !['STYLE', 'SCRIPT'].includes(node.tagName));
  const blocks = [], fields = [];
  sections.forEach((section, index) => {
    const heading = section.querySelector('h2,h1,.footer-brand-name,.navbar-brand-name,.section-label');
    const title = heading?.textContent.trim() || (section.tagName === 'NAV' ? 'Menu utama' : section.classList.contains('whatsapp-float') ? 'Tombol WhatsApp' : 'Bagian website');
    const block = { id: `b-${hash(`${index}:${title}`)}`, title, fields: [], cover: '', element: section, hideable: section.tagName === 'SECTION' && !section.classList.contains('hero') && !section.classList.contains('payment-choices') && !section.querySelector('form') };
    const path = element => { const parts = []; for (let node = element; node && node !== section; node = node.parentElement) parts.unshift([...node.parentElement.children].indexOf(node)); return parts.join('-') || '0'; };
    const add = (element, kind, value, label, apply, textIndex = '') => {
      const field = { id: `${block.id}:${path(element)}:${kind}:${textIndex}:${hash(value)}`.replace(/--/g, '-'), kind, value, label, apply };
      block.fields.push(field); fields.push(field);
    };
    for (const element of [section, ...section.querySelectorAll('*')]) {
      if (element.closest(excluded)) continue;
      if (element.hasAttribute('data-counter')) {
        add(element, 'number', element.dataset.counter, 'Angka statistik', value => { element.dataset.counter = value; element.textContent = value + (element.dataset.suffix || ''); });
        add(element, 'suffix', element.dataset.suffix || '', 'Akhiran angka (+ atau %)', value => { element.dataset.suffix = value; element.textContent = element.dataset.counter + value; });
        continue;
      }
      for (const [textIndex, node] of [...element.childNodes].entries()) {
        if (node.nodeType !== 3 || !node.textContent.trim()) continue;
        const value = node.textContent.trim();
        const kind = /^H[1-6]$/.test(element.tagName) ? 'heading' : 'text';
        const label = kind === 'heading' ? 'Judul' : element.tagName === 'A' ? 'Teks tombol / tautan' : element.classList.contains('section-label') ? 'Label bagian' : 'Teks';
        add(element, kind, value, label, text => { node.textContent = text; if (text.includes('\n')) element.style.whiteSpace = 'pre-line'; }, textIndex);
      }
      if (element.tagName === 'IMG') {
        const src = element.getAttribute('src') || ''; if (!block.cover) block.cover = src;
        add(element, 'image', src, element.id === 'donation-qris' ? 'Gambar QRIS resmi' : 'Foto', value => { element.setAttribute('src', value); element.removeAttribute('srcset'); });
        add(element, 'text', element.getAttribute('alt') || '', 'Keterangan foto', value => element.setAttribute('alt', value));
      }
      const background = element.style.backgroundImage?.match(/^url\(["']?(.*?)["']?\)$/)?.[1];
      if (background) {
        if (!block.cover) block.cover = background;
        add(element, 'image', background, 'Foto latar', value => { element.style.backgroundImage = `url("${value}")`; });
      }
      if (element.tagName === 'A' && !element.hasAttribute('onclick') && !element.getAttribute('href')?.startsWith('/admin.html') && !element.classList.contains('navbar-link') && !element.classList.contains('footer-link')) {
        add(element, 'link', element.getAttribute('href') || '#', element.getAttribute('aria-label') || 'Tujuan tautan', value => element.setAttribute('href', value));
      }
      if (element.tagName === 'IFRAME') add(element, 'map', element.getAttribute('src') || '', 'Tautan sematan peta', value => element.setAttribute('src', value));
    }
    if (block.fields.length) blocks.push(block);
  });
  return { template, blocks, fields, html: () => { const wrapper = doc.createElement('div'); wrapper.append(root.cloneNode(true)); return wrapper.innerHTML; } };
}

export function normalizeSiteDocument(content, catalog) {
  validateSiteDocument(content);
  const values = {};
  for (const field of catalog.fields) {
    const value = content.values[field.id];
    if (value === undefined || value === field.value) continue;
    if (['image', 'link', 'map'].includes(field.kind) && !contentUrl(value, field.kind)) throw new Error(`${field.label}: gunakan tautan yang valid dan aman.`);
    if (field.kind === 'number' && !/^\d{1,7}$/.test(value)) throw new Error('Angka statistik harus antara 0 dan 9999999.');
    if (field.kind === 'suffix' && value.length > 6) throw new Error('Akhiran angka maksimal 6 karakter.');
    values[field.id] = value;
  }
  return { version: 1, values, hidden: [...new Set(content.hidden)].filter(id => catalog.blocks.some(block => block.id === id && block.hideable)) };
}

export function renderSiteContent(html, content, doc = document) {
  if (!content) return html;
  try {
    const catalog = createContentCatalog(html, doc);
    const safe = normalizeSiteDocument(content, catalog);
    for (const field of catalog.fields) if (safe.values[field.id] !== undefined) field.apply(safe.values[field.id]);
    // Hidden sections are removed before forms, observers, or page scripts start.
    for (const id of safe.hidden) {
      const block = catalog.blocks.find(block => block.id === id);
      block.element?.remove();
    }
    return catalog.html();
  } catch { return html; }
}
