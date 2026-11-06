import { escapeHtml as esc } from './content-format.js';
import { blankSettings, readPondokSettings } from './pondok-settings.js';
import { RECAP_URL } from './google-forms.js';
import { DEMO_SETTINGS_KEY, dateLabel, registrationDefaults, registrationTimelineHtml, todayWib, validateRegistration } from './registration-period.js';

export async function prepareRegistrationSheet(client, year, transport = fetch) {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.access_token) throw new Error('Masuk kembali sebagai admin untuk menyiapkan rekap.');
  const response = await transport('/api/registration.php', {
    method: 'POST', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(100000),
    headers: { 'Content-Type': 'application/json', 'X-Annahl-Registration': '1', Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify({ year }),
  });
  let reply;
  try { reply = await response.json(); } catch { throw new Error('Penghubung rekap belum tersedia. Hubungi pengelola website.'); }
  if (!response.ok || reply.ok !== true) throw new Error(reply.message || 'Rekap belum selesai disiapkan. Coba lagi.');
  const result = reply.settings;
  if (result?.registration?.year !== year || result.registration.recap_ready !== true || !Number.isInteger(result.registration.recap_sheet_id) || result.registration.recap_sheet_id < 0) throw new Error('Google belum mengonfirmasi tab rekap yang sesuai. Coba lagi.');
  return result;
}

export async function mountRegistrationManager({ host, client, demo = false, notify = () => {} }) {
  host.innerHTML = `<div class="page-heading"><div><span class="eyebrow">PENERIMAAN SANTRI PUTRA</span><h1>Pendaftaran</h1><p class="muted">Kelola penerimaan beasiswa, jadwal seleksi, dan rekap tahunan.</p></div><button type="button" class="button" data-admission-action="new">＋ Buka penerimaan baru</button></div><p data-admission-status role="status"></p><div data-admission-summary></div><dialog class="admission-dialog" aria-labelledby="admission-dialog-title"><form data-admission-form><div class="dialog-header"><div><span class="eyebrow">JADWAL PENERIMAAN</span><h2 id="admission-dialog-title">Atur penerimaan</h2></div><button type="button" class="icon-button" data-admission-action="close" aria-label="Tutup pengaturan penerimaan">×</button></div><fieldset><div class="admission-dialog-body"><p class="admission-policy-note">Khusus santri putra melalui program beasiswa. Tidak ada biaya pendaftaran maupun pendidikan.</p><div class="admission-year-field"><label for="admission-year">Tahun penerimaan</label><input id="admission-year" name="year" type="number" min="2000" max="2099" step="1" required><p class="muted" data-admission-sheet-name>Nama tab rekap mengikuti tahun penerimaan.</p></div><h3>1. Pendaftaran</h3><div class="settings-dates"><div><label for="admission-opens">Tanggal buka pendaftaran</label><input id="admission-opens" name="opens_on" type="date" min="2000-01-01" max="2099-12-31" required></div><div><label for="admission-closes">Tanggal tutup pendaftaran</label><input id="admission-closes" name="closes_on" type="date" min="2000-01-01" max="2099-12-31" required></div></div><p class="muted">Hari terakhir berlaku sampai pukul 23.59 WIB. Formulir otomatis ditutup setelah periode berakhir.</p><h3>2. Seleksi</h3><div class="settings-dates"><div><label for="admission-selection-opens">Mulai seleksi</label><input id="admission-selection-opens" name="selection_opens_on" type="date" min="2000-01-01" max="2099-12-31"></div><div><label for="admission-selection-closes">Selesai seleksi</label><input id="admission-selection-closes" name="selection_closes_on" type="date" min="2000-01-01" max="2099-12-31"></div></div><h3>3. Pengumuman</h3><label for="admission-announcement">Tanggal pengumuman hasil</label><input id="admission-announcement" name="announcement_on" type="date" min="2000-01-01" max="2099-12-31"><p class="muted">Jadwal seleksi dan pengumuman boleh menyusul. Keduanya dapat diedit kembali.</p><label for="admission-information">Informasi tambahan untuk calon santri</label><textarea id="admission-information" name="information" rows="4" maxlength="1600" placeholder="Contoh: informasi berkas atau pelaksanaan seleksi."></textarea></div><div class="dialog-footer"><p class="form-message" data-admission-message role="status"></p><button type="button" class="button secondary" data-admission-action="close">Batal</button><button type="submit" class="button">Simpan jadwal</button></div></fieldset></form></dialog>`;
  const $ = selector => host.querySelector(selector), summary = $('[data-admission-summary]'), status = $('[data-admission-status]');
  const dialog = $('dialog'), form = $('[data-admission-form]'), fieldset = form.querySelector('fieldset'), message = $('[data-admission-message]');
  const input = name => form.querySelector(`[name="${name}"]`);
  let settings, busy = false, dirty = false;
  const load = () => demo ? JSON.parse(sessionStorage.getItem(DEMO_SETTINGS_KEY) || 'null') || blankSettings() : readPondokSettings(client);
  function render() {
    const details = { ...registrationDefaults(), ...settings.registration };
    const year = details.year;
    const recap = details.recap_ready && Number.isInteger(details.recap_sheet_id) ? `${RECAP_URL}#gid=${details.recap_sheet_id}` : RECAP_URL;
    summary.innerHTML = `${registrationTimelineHtml(settings)}<div class="admission-admin-grid"><section class="surface settings-card"><h2>${year ? `Penerimaan ${year}` : 'Mulai penerimaan pertama'}</h2><p class="muted">${year ? `${dateLabel(settings.opens_on)} – ${dateLabel(settings.closes_on)}. Jadwal dapat dikoreksi kapan saja.` : 'Isi tahun dan jadwal penerimaan untuk menyiapkan formulir serta tab rekap.'}</p><div class="admission-admin-actions">${year ? '<button type="button" class="button" data-admission-action="edit">Ubah jadwal</button>' : '<button type="button" class="button" data-admission-action="new">Atur penerimaan</button>'}<button type="button" class="button secondary" data-admission-action="refresh">Muat ulang</button></div></section><section class="surface settings-card"><h2>${year ? `Pendaftaran ${year}` : 'Rekap tahunan'}</h2><p class="muted">${demo ? 'Mode demo: perubahan hanya tersimpan di browser. Tidak ada tab Google Sheets yang dibuat.' : details.recap_ready ? 'Tab rekap periode ini sudah siap. Perubahan tanggal tetap memakai tab yang sama.' : year ? 'Jadwal sudah disimpan. Formulir menunggu konfirmasi tab rekap sebelum menerima kiriman.' : 'Tab baru otomatis disiapkan berdasarkan tahun, misalnya Pendaftaran 2027.'}</p><div class="admission-admin-actions">${year && !details.recap_ready && !demo ? '<button type="button" class="button" data-admission-action="prepare">Siapkan rekap</button>' : ''}<a class="button secondary" href="${esc(recap)}" target="_blank" rel="noopener noreferrer">Buka Google Sheets ↗</a></div></section></div><p class="admission-management-note">Pilihan SD, SMP, SMA, atau jenjang lainnya dikelola melalui menu <button type="button" class="text-link" data-go="pengaturan">Pengaturan</button>.</p>`;
  }
  async function refresh() {
    if (busy) return;
    status.textContent = 'Memuat penerimaan…';
    try { settings = await load(); if (!settings) throw Error('Pengaturan belum dapat dimuat. Periksa koneksi lalu coba lagi.'); render(); status.textContent = ''; }
    catch (error) { status.textContent = error.message; summary.innerHTML = '<button type="button" class="button secondary" data-admission-action="refresh">Coba lagi</button>'; }
  }
  function close() { if (!busy && (!dirty || confirm('Tutup pengaturan? Perubahan jadwal belum disimpan.'))) dialog.close(); }
  function open(create) {
    if (busy || !settings) return;
    const details = { ...registrationDefaults(), ...settings.registration };
    form.reset(); message.textContent = ''; dirty = false;
    input('year').value = create ? (details.year ? details.year + 1 : Number(todayWib().slice(0,4)) + 1) : details.year;
    input('year').readOnly = !create;
    for (const name of ['opens_on','closes_on','selection_opens_on','selection_closes_on','announcement_on','information']) input(name).value = create ? '' : (settings[name] ?? details[name] ?? '');
    $('#admission-dialog-title').textContent = create ? 'Buka penerimaan baru' : `Ubah penerimaan ${details.year}`;
    updateName(); dialog.showModal(); dialog.scrollTop = 0; input('year').focus();
  }
  function updateName() { $('[data-admission-sheet-name]').textContent = `Tab rekap: Pendaftaran ${input('year').value || 'tahun'}. Mengedit tanggal tidak membuat tab lain.`; }
  async function prepare() {
    settings = await prepareRegistrationSheet(client, settings.registration.year);
    render();
  }
  host.addEventListener('click', async event => {
    const action = event.target.closest('[data-admission-action]')?.dataset.admissionAction;
    if (!action || busy) return;
    if (action === 'new' || action === 'edit') return open(action === 'new');
    if (action === 'close') return close();
    if (action === 'refresh') return refresh();
    if (action === 'prepare') {
      busy = true; status.textContent = 'Menyiapkan tab rekap…';
      try { await prepare(); status.textContent = 'Tab rekap siap digunakan.'; notify(status.textContent); }
      catch (error) { status.textContent = error.message; }
      finally { busy = false; }
    }
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  form.addEventListener('input', () => { dirty = true; updateName(); });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (busy || !settings || !form.reportValidity()) return;
    try {
      const values = Object.fromEntries(['year','opens_on','closes_on','selection_opens_on','selection_closes_on','announcement_on','information'].map(name => [name,input(name).value]));
      const details = validateRegistration(values);
      if (!settings.levels.length) throw Error('Tambahkan minimal satu jenjang di menu Pengaturan terlebih dahulu.');
      busy = true; fieldset.disabled = true; message.textContent = 'Menyimpan jadwal dan menyiapkan rekap…';
      if (demo) {
        settings = { ...settings, opens_on:values.opens_on, closes_on:values.closes_on, registration:{...details,recap_ready:true,recap_sheet_id:null},revision:settings.revision+1 };
        sessionStorage.setItem(DEMO_SETTINGS_KEY,JSON.stringify(settings));
      } else {
        const { data, error } = await client.rpc('save_registration_period',{p_revision:settings.revision,p_opens_on:values.opens_on,p_closes_on:values.closes_on,p_registration:details});
        if (error?.code === '40001') throw Error('Pengurus lain sudah memperbarui pengaturan. Salin isian Anda, tutup popup, lalu muat ulang jadwal.');
        if (error || data?.revision !== settings.revision+1) throw Error('Jadwal belum berhasil disimpan. Periksa akses admin dan pengaktifan fitur penerimaan.');
        settings = data; render();
        if (!settings.registration.recap_ready) await prepare();
      }
      render(); dirty = false; dialog.close();
      status.textContent = demo ? 'Jadwal tersimpan di demo. Tab Google Sheets belum dibuat.' : 'Jadwal tersimpan dan tab rekap penerimaan siap.';
      notify(status.textContent);
    } catch (error) { message.textContent = error.message; }
    finally { busy = false; fieldset.disabled = false; }
  });
  await refresh();
  return { refresh };
}
