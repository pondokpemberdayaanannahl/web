import { escapeHtml } from './content-format.js';
import { blankSettings, readPondokSettings, tiktokHandle } from './pondok-settings.js';

const key = 'annahl-demo-settings-v1';

export async function mountPondokSettings({ host, client, demo, notify }) {
  const $ = selector => host.querySelector(selector);
  const load = async () => demo ? JSON.parse(sessionStorage.getItem(key) || 'null') || blankSettings() : await readPondokSettings(client);
  const form = $('form'), list = $('[data-level-list]'), add = $('[data-add-level]');
  const tiktok = $('[name="tiktok"]');
  const message = $('[data-settings-message]'), retry = $('[data-settings-retry]');
  let settings, busy = false, serial = 0;
  const sync = () => {
    add.disabled = list.children.length >= 20;
  };
  function addLevel(level = {}) {
    const index = ++serial;
    list.insertAdjacentHTML('beforeend', `<div class="settings-level"><div><label for="level-${index}">Nama jenjang</label><input id="level-${index}" data-level-title required minlength="2" maxlength="60" placeholder="Contoh: SMP" value="${escapeHtml(level.title || '')}"></div><div><label for="level-info-${index}">Deskripsi singkat</label><input id="level-info-${index}" data-level-description maxlength="160" placeholder="Contoh: Untuk lulusan SD atau MI" value="${escapeHtml(level.description || '')}"></div><button type="button" class="row-action danger" data-remove-level>Hapus</button></div>`);
    sync();
    return list.lastElementChild.querySelector('[data-level-title]');
  }
  async function refresh() {
    retry.hidden = true; form.hidden = true; message.textContent = 'Memuat pengaturan…';
    try {
      settings = await load();
      if (!settings) throw new Error('Pengaturan belum bisa dimuat. Hubungi pengelola teknis jika masalah berlanjut.');
      tiktok.value = settings.tiktok || '';
      list.replaceChildren(); settings.levels.forEach(addLevel);
      sync(); form.hidden = false; message.textContent = '';
    } catch (error) { message.textContent = error.message; retry.hidden = false; }
  }
  retry.addEventListener('click', refresh);
  add.addEventListener('click', () => addLevel().focus());
  list.addEventListener('click', event => {
    const row = event.target.closest('[data-remove-level]')?.closest('.settings-level');
    if (!row) return;
    const next = row.nextElementSibling || row.previousElementSibling;
    row.remove(); sync(); (next?.querySelector('[data-level-title]') || add).focus();
  });
  form.addEventListener('input', sync);
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (busy || !settings) return;
    const fieldset = form.querySelector('fieldset');
    try {
      const levels = [...list.children].map(row => ({
        title: row.querySelector('[data-level-title]').value.trim(),
        description: row.querySelector('[data-level-description]').value.trim(),
      }));
      if (levels.some(item => item.title.length < 2) || new Set(levels.map(item => item.title.toLocaleLowerCase('id'))).size !== levels.length) throw new Error('Isi nama jenjang yang berbeda, minimal dua karakter.');
      if (settings.opens_on && !levels.length) throw new Error('Penerimaan yang terjadwal membutuhkan minimal satu jenjang.');
      const values = { ...settings, levels, tiktok: tiktokHandle(tiktok.value) };
      busy = true; fieldset.disabled = true; message.textContent = 'Menyimpan pengaturan…';
      if (demo) {
        settings = { ...values, revision: settings.revision + 1 };
        sessionStorage.setItem(key, JSON.stringify(settings));
      } else {
        const { data, error } = await client.rpc('save_pondok_settings', { p_revision: settings.revision, p_opens_on: values.opens_on, p_closes_on: values.closes_on, p_levels: values.levels, p_tiktok: values.tiktok });
        if (error?.code === '40001') {
          retry.hidden = false;
          throw new Error('Pengaturan sudah diubah pengurus lain. Salin perubahan Anda sebelum memuat ulang.');
        }
        if (error || data?.revision !== settings.revision + 1) throw new Error('Pengaturan belum berhasil disimpan. Periksa koneksi dan akses Anda.');
        settings = data;
      }
      tiktok.value = settings.tiktok;
      const confirmation = demo ? 'Pengaturan tersimpan di demo.' : 'Pengaturan berhasil diperbarui di website.';
      message.textContent = confirmation; retry.hidden = true; notify(confirmation);
    } catch (error) { message.textContent = error.message; }
    finally { busy = false; fieldset.disabled = false; }
  });
  await refresh();
  return { refresh };
}
