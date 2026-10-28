import { photos, galleryImages, photoThumbnail } from '../data/photos.js';

export function categoryCards(type) {
  const news = { Akademik: photos.program.formal, Keagamaan: photos.program.tahfidz, Sosial: photos.berita.baktiSosial, Pengumuman: photos.berita.pendaftaran };
  const images = type === 'news' ? news : Object.fromEntries(['Akademik','Ibadah','Acara','Fasilitas'].map(category => [category, galleryImages.find(image => image.category === category).src]));
  return `<div class="category-filters ${type === 'news' ? 'news-filters' : 'gallery-filters'}" role="group" aria-label="Kategori ${type === 'news' ? 'berita' : 'foto'}">
    <button class="category-all ${type}-filter" data-filter="Semua" aria-pressed="true">Semua ${type === 'news' ? 'berita' : 'foto'} <span aria-hidden="true">↗</span></button>
    <div class="category-card-grid">${Object.entries(images).map(([label, src]) => `<button class="category-card ${type}-filter" data-filter="${label}" aria-pressed="false"><img src="${photoThumbnail(src)}" alt="" width="480" height="320" loading="lazy" decoding="async" /><span>${label}</span><span class="category-check" aria-hidden="true">✓</span></button>`).join('')}</div>
  </div>`;
}
