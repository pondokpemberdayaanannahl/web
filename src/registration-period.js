import { escapeHtml as esc } from './content-format.js';

export const DEMO_SETTINGS_KEY = 'annahl-demo-settings-v1';
export const registrationDefaults = () => ({ year: null, selection_opens_on: null, selection_closes_on: null, announcement_on: null, information: '', recap_ready: false, recap_sheet_id: null });
export const todayWib = (time = Date.now()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(time));
export function dateLabel(date) {
  return date ? new Date(`${date}T00:00:00+07:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }) : 'Belum dijadwalkan';
}
export function demoSettings() {
  if (!import.meta.env?.DEV || import.meta.env.VITE_DUMMY_LOGIN_ENABLED !== 'true' || typeof sessionStorage === 'undefined' || !sessionStorage.getItem('annahl-dummy-user')) return null;
  try { return JSON.parse(sessionStorage.getItem(DEMO_SETTINGS_KEY) || 'null'); } catch { return null; }
}
export function validateRegistration(values) {
  const year = Number(values.year);
  const validDate = value => !value || (/^20\d{2}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value);
  if (!Number.isInteger(year) || year < 2000 || year > 2099) throw new Error('Isi tahun penerimaan antara 2000 dan 2099.');
  const dates = ['opens_on', 'closes_on', 'selection_opens_on', 'selection_closes_on', 'announcement_on'];
  if (dates.some(key => !validDate(values[key]))) throw new Error('Periksa kembali tanggal yang diisi.');
  if (!values.opens_on || !values.closes_on || values.opens_on > values.closes_on) throw new Error('Isi tanggal buka dan tutup pendaftaran dengan urutan yang benar.');
  if (!!values.selection_opens_on !== !!values.selection_closes_on || (values.selection_opens_on && (values.selection_opens_on > values.selection_closes_on || values.selection_opens_on <= values.closes_on))) throw new Error('Isi kedua tanggal seleksi. Seleksi dimulai setelah pendaftaran ditutup.');
  if (values.announcement_on && values.announcement_on <= (values.selection_closes_on || values.closes_on)) throw new Error('Pengumuman dijadwalkan setelah pendaftaran dan seleksi selesai.');
  if (typeof values.information !== 'string' || values.information.length > 1600) throw new Error('Informasi tambahan maksimal 1.600 karakter.');
  return { year, selection_opens_on: values.selection_opens_on || null, selection_closes_on: values.selection_closes_on || null, announcement_on: values.announcement_on || null, information: values.information.trim() };
}
export function demoRegistrationStatus(settings, now = Date.now()) {
  const opensAt = settings.opens_on ? Date.parse(`${settings.opens_on}T00:00:00+07:00`) / 1000 : null;
  const closesAt = settings.closes_on ? Date.parse(`${settings.closes_on}T00:00:00+07:00`) / 1000 + 86400 : null;
  const registration = { ...registrationDefaults(), ...settings.registration };
  const state = !opensAt || !closesAt || !registration.year || !settings.levels.length ? 'unscheduled' : !registration.recap_ready ? 'preparing' : now / 1000 < opensAt ? 'upcoming' : now / 1000 >= closesAt ? 'closed' : 'open';
  return { ...settings, registration, state, opensAt, closesAt, serverTime: Math.floor(now / 1000), demo: true };
}
export function registrationTimeline(settings, now = settings.serverTime ? settings.serverTime * 1000 : Date.now()) {
  const detail = { ...registrationDefaults(), ...settings.registration }, today = todayWib(now);
  const stages = [
    { title: 'Pendaftaran', start: settings.opens_on, end: settings.closes_on, description: 'Pilih jenjang, isi formulir, dan kirim berkas calon santri putra.' },
    { title: 'Seleksi', start: detail.selection_opens_on, end: detail.selection_closes_on, description: 'Pengurus meninjau berkas dan melaksanakan seleksi calon santri.' },
    { title: 'Pengumuman', start: detail.announcement_on, end: detail.announcement_on, description: 'Ikuti informasi hasil seleksi yang disampaikan pengurus.' },
  ].map(stage => ({ ...stage, state: !stage.start ? 'unscheduled' : today < stage.start ? 'upcoming' : today > stage.end ? 'complete' : 'current' }));
  const value = stages.reduce((sum, stage) => sum + (['complete', 'current'].includes(stage.state) ? 1 : 0), 0);
  const current = stages.find(stage => stage.state === 'current');
  const headline = current ? `Tahap ${current.title.toLowerCase()} sedang berlangsung` : value === 3 ? 'Seluruh tahap terjadwal telah selesai' : value ? 'Menunggu tahap berikutnya' : settings.opens_on ? 'Pendaftaran akan dibuka' : 'Jadwal penerimaan belum diumumkan';
  return { stages, value, headline };
}
export function registrationTimelineHtml(settings = {}) {
  const detail = { ...registrationDefaults(), ...settings.registration }, timeline = registrationTimeline(settings);
  const states = { current: 'Sedang berlangsung', complete: 'Selesai', upcoming: 'Akan datang', unscheduled: 'Menunggu jadwal' };
  return `<div class="admission-timeline"><div class="admission-timeline-heading"><div><span class="admission-kicker">${detail.year ? `PENERIMAAN ${detail.year}` : 'JADWAL PENERIMAAN'}</span><h3>${esc(timeline.headline)}</h3></div><span class="admission-policy">Santri putra · Beasiswa</span></div><progress max="3" value="${timeline.value}" aria-label="Progres jadwal penerimaan" aria-valuetext="${esc(timeline.headline)}"></progress><ol class="admission-stages">${timeline.stages.map((stage, index) => `<li data-stage-state="${stage.state}"${stage.state === 'current' ? ' aria-current="step"' : ''}><span class="admission-stage-number" aria-hidden="true">${stage.state === 'complete' ? '✓' : `0${index + 1}`}</span><div><span class="admission-stage-state">${states[stage.state]}</span><h4>${stage.title}</h4><p class="admission-stage-date">${esc(stage.start ? dateLabel(stage.start) + (stage.end !== stage.start ? ' – ' + dateLabel(stage.end) : '') : 'Tanggal menyusul')}</p><p>${stage.description}</p></div></li>`).join('')}</ol><p class="admission-timeline-note">Jadwal ini menunjukkan tahap penerimaan pondok. Hasil seleksi setiap calon santri disampaikan oleh pengurus.</p>${detail.information ? `<div class="admission-information"><strong>Informasi dari pengurus</strong><p>${esc(detail.information)}</p></div>` : ''}</div>`;
}
