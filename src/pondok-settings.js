import { escapeHtml } from './content-format.js';
import { demoSettings, registrationDefaults } from './registration-period.js';

export const defaultLevels = [
  { title: 'SD', description: 'Jenjang pendidikan dasar.' },
  { title: 'SMP', description: 'Untuk lulusan SD atau MI.' },
  { title: 'SMA', description: 'Untuk lulusan SMP atau MTs.' },
];
export const blankSettings = () => ({ levels: structuredClone(defaultLevels), opens_on: null, closes_on: null, tiktok: '', registration: registrationDefaults(), revision: 1 });
export const settingsColumns = '*';

export async function readPondokSettings(client) {
  const local = demoSettings();
  if (local) return local;
  if (!client) return null;
  const { data, error } = await client.from('pondok_settings').select(settingsColumns).eq('id', 1).single();
  return error ? null : data;
}

export function tiktokHandle(value = '') {
  const raw = value.trim();
  if (!raw) return '';
  const match = raw.match(/^(?:https:\/\/(?:www\.)?tiktok\.com\/@|@)?([a-z0-9._]{2,24})\/?(?:\?[^\s#]*)?$/i);
  if (!match) throw new Error('Isi username TikTok atau tautan profil seperti https://www.tiktok.com/@namaakun.');
  return match[1];
}

export function tiktokUrl(handle) {
  return typeof handle === 'string' && /^[a-z0-9._]{2,24}$/i.test(handle) ? `https://www.tiktok.com/@${handle}` : '';
}

function levelIllustration(title) {
  const name = String(title).toUpperCase();
  if (/\b(?:SMA|SMK|MA)\b|ALIYAH|MENENGAH ATAS/.test(name)) return 'sma';
  if (/\b(?:SD|MI)\b|IBTIDAIYAH|DASAR/.test(name)) return 'sd';
  return 'smp';
}

export function jenjangCards(levels = defaultLevels, choose = false, { illustrated = false } = {}) {
  const showIllustrations = illustrated && !choose;
  return levels.length ? `<div class="jenjang-grid${showIllustrations ? ' jenjang-grid-illustrated' : ''}">${levels.map(({ title, description }) => {
    if (showIllustrations) {
      const illustration = `/images/education/jenjang-${levelIllustration(title)}-v1`;
      return `<article class="jenjang-card jenjang-card-illustrated"><div class="jenjang-visual"><img src="${illustration}-1200.webp" srcset="${illustration}-600.webp 600w, ${illustration}-1200.webp 1200w" sizes="(max-width: 767px) calc(100vw - 48px), (max-width: 1248px) calc((100vw - 92px) / 3), 384px" width="1200" height="800" alt="Ilustrasi suasana belajar santri putra jenjang ${escapeHtml(title)}" loading="lazy" decoding="async"></div><div class="jenjang-card-body"><h3>${escapeHtml(title)}</h3>${description ? `<p>${escapeHtml(description)}</p>` : ''}<a class="jenjang-register-link" href="#/pendaftaran" aria-label="Informasi pendaftaran jenjang ${escapeHtml(title)}">Info pendaftaran <span aria-hidden="true">↗</span></a></div></article>`;
    }
    const body = `<span class="jenjang-copy"><strong>${escapeHtml(title)}</strong>${description ? `<small>${escapeHtml(description)}</small>` : ''}</span>`;
    return choose ? `<label class="jenjang-card"><input type="radio" name="jenjang" value="${escapeHtml(title)}" required>${body}</label>` : `<article class="jenjang-card">${body}</article>`;
  }).join('')}</div>` : '<p>Informasi jenjang belum tersedia. Silakan hubungi pengurus.</p>';
}
