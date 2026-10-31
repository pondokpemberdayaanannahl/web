import { escapeHtml as esc, plainText, renderBody, safeUrl } from './content-format.js';
import { photos } from './data/photos.js';

const labels = { berita: 'Berita', foto: 'Foto', video: 'Video' };
const dateLabel = value => Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
const excerpt = value => { const text = plainText(value); return text.length > 120 ? text.slice(0,120).trimEnd() + '…' : text; };

export async function loadLatestStories(client) {
  if (!client) return { items: [], unavailable: true };
  const sources = [
    ['berita', 'berita', 'id,judul,kategori,isi,gambar_url,thumbnail_url,caption,dibuat_pada,status,deleted_at'],
    ['foto', 'galeri_foto', 'id,judul,kategori,gambar_url,thumbnail_url,caption,dibuat_pada'],
    ['video', 'galeri_video', 'id,judul,kategori,youtube_id,dibuat_pada'],
  ];
  const results = await Promise.allSettled(sources.map(async ([kind, table, fields]) => {
    let query = client.from(table).select(fields);
    if (kind === 'berita') query = query.eq('status', 'published').is('deleted_at', null);
    const { data, error } = await query.order('dibuat_pada', { ascending: false }).limit(4);
    if (error) throw error;
    return (data || []).filter(row => row.id && (kind !== 'video' || /^[\w-]{11}$/.test(row.youtube_id || '')))
      .map(row => ({ ...row, kind, key: `${kind}:${row.id}` }));
  }));
  const items = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
  items.sort((a,b) => (Date.parse(b.dibuat_pada) || 0) - (Date.parse(a.dibuat_pada) || 0) || a.key.localeCompare(b.key));
  return { items: items.slice(0,4), unavailable: results.some(result => result.status === 'rejected') };
}

function imageFor(row) {
  if (row.kind === 'video') return `https://img.youtube.com/vi/${row.youtube_id}/hqdefault.jpg`;
  // These are large public cards, so preserve the full-resolution rendition.
  return safeUrl(row.gambar_url) || safeUrl(row.thumbnail_url) || photos.hero.berita;
}

export function storyCard(row) {
  const title = row.judul || 'Cerita dari An-Nahl';
  const action = row.kind === 'video' ? 'Tonton video' : row.kind === 'foto' ? 'Lihat foto' : 'Baca cerita';
  return `<article class="news-card story-card"><button class="story-cover" type="button" data-story="${esc(row.key)}" aria-label="${action}: ${esc(title)}"><img src="${esc(imageFor(row))}" alt="${esc(title)}" loading="lazy" decoding="async" />${row.kind === 'video' ? '<span class="story-play" aria-hidden="true">▶</span>' : ''}</button><div class="news-card-body"><span class="badge">${labels[row.kind]}</span><h3 class="news-card-title">${esc(title)}</h3><time class="news-card-date" datetime="${esc(row.dibuat_pada || '')}">${dateLabel(row.dibuat_pada)}</time><p class="news-card-excerpt">${esc(excerpt(row.kind === 'berita' ? row.isi : row.caption || row.kategori || 'Kegiatan dan keseharian di pondok.'))}</p><button type="button" class="card-link story-link" data-story="${esc(row.key)}">${action} <span aria-hidden="true">→</span></button></div></article>`;
}

export async function initHomeStories(client) {
  const grid = document.getElementById('home-stories-grid'), status = document.getElementById('home-stories-status');
  const dialog = document.getElementById('story-dialog');
  if (!grid || !status || !dialog) return;
  const { items, unavailable } = await loadLatestStories(client);
  if (!grid.isConnected) return;
  grid.innerHTML = items.map(storyCard).join('');
  status.textContent = unavailable ? items.length ? 'Sebagian cerita belum dapat dimuat. Silakan coba lagi nanti.' : 'Cerita pondok belum dapat dimuat. Silakan coba lagi nanti.' : items.length ? '' : 'Belum ada cerita yang diterbitkan.';
  const body = document.getElementById('story-dialog-body');
  let previousOverflow = '';
  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-story]');
    const row = items.find(item => item.key === button?.dataset.story); if (!row) return;
    document.getElementById('story-dialog-title').textContent = row.judul || 'Cerita dari An-Nahl';
    body.innerHTML = row.kind === 'video'
      ? `<iframe class="story-video" src="https://www.youtube-nocookie.com/embed/${row.youtube_id}" title="${esc(row.judul)}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`
      : `<img class="story-detail-image" src="${esc(imageFor(row))}" alt="${esc(row.caption || row.judul)}" />${row.caption ? `<p class="story-caption">${esc(row.caption)}</p>` : ''}${row.kind === 'berita' ? `<div class="story-prose">${renderBody(row.isi)}</div>` : ''}`;
    previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; dialog.showModal();
  });
  dialog.querySelector('[data-story-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { body.innerHTML = ''; document.body.style.overflow = previousOverflow; });
}
