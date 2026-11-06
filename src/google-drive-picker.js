import { createDriveMedia } from './drive-media.js';
import { optimizeImage } from './editor-tools.js';

export const GOOGLE_DRIVE_READ_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const maxBytes = 12 * 1024 * 1024;
const env = import.meta.env || {};
export const googlePickerConfig = {
  clientId: env.VITE_GOOGLE_PICKER_CLIENT_ID || '',
  apiKey: env.VITE_GOOGLE_PICKER_API_KEY || '',
  appId: env.VITE_GOOGLE_PICKER_APP_ID || '',
};
export const googlePickerConfigured = () => Object.values(googlePickerConfig).every(Boolean);
let scriptsReady;
let accessToken = '';
let expiresAt = 0;

function loadScript(src, ready) {
  if (ready()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timer = setTimeout(() => fail(), 15000);
    const fail = () => {
      clearTimeout(timer);
      script.remove();
      reject(new Error('Google Drive belum dapat dimuat. Periksa koneksi lalu coba lagi.'));
    };
    script.src = src;
    script.async = true;
    script.onerror = fail;
    script.onload = () => { clearTimeout(timer); ready() ? resolve() : fail(); };
    document.head.append(script);
  });
}

function prepareGooglePicker() {
  if (!scriptsReady) scriptsReady = Promise.all([
    loadScript('https://apis.google.com/js/api.js', () => !!window.gapi),
    loadScript('https://accounts.google.com/gsi/client', () => !!window.google?.accounts?.oauth2),
  ]).then(() => new Promise((resolve, reject) => {
    window.gapi.load('picker', {
      callback: resolve,
      onerror: () => reject(new Error('Pemilih foto Google belum dapat dimuat.')),
      timeout: 15000,
      ontimeout: () => reject(new Error('Google Drive terlalu lama merespons. Coba lagi.')),
    });
  })).catch(error => { scriptsReady = null; throw error; });
  return scriptsReady;
}

export function buildGooglePhotoPicker(google, token, config, callback) {
  const view = new google.picker.DocsView(google.picker.ViewId.DOCS_IMAGES)
    .setMode(google.picker.DocsViewMode.GRID)
    .setIncludeFolders(false)
    .setSelectFolderEnabled(false)
    .setMimeTypes(imageTypes.join(','));
  return new google.picker.PickerBuilder()
    .setAppId(config.appId)
    .setDeveloperKey(config.apiKey)
    .setOAuthToken(token)
    .setOrigin(window.location.origin)
    .setLocale('id')
    .setTitle('Pilih foto dari Google Drive')
    .setSize(Math.min(960, window.innerWidth - 20), Math.min(640, window.innerHeight - 24))
    .addView(view)
    .setCallback(callback)
    .build();
}

async function selectedDocument(token, config) {
  const suspended = [...document.querySelectorAll('dialog[open]')];
  const focused = document.activeElement;
  let picker;
  try {
    for (const dialog of suspended.reverse()) {
      dialog.dataset.drivePickerSuspended = 'true';
      await new Promise(resolve => {
        dialog.addEventListener('close', resolve, { once: true });
        dialog.close();
      });
    }
    return await new Promise((resolve, reject) => {
      picker = buildGooglePhotoPicker(window.google, token, config, result => {
        if (result.action === window.google.picker.Action.CANCEL) resolve(null);
        if (result.action === window.google.picker.Action.PICKED) {
          const photo = result.docs?.[0];
          if (!photo || typeof photo.id !== 'string') reject(new Error('Foto yang dipilih belum sesuai.'));
          else resolve(photo);
        }
        if (result.action === 'error') reject(new Error('Google Drive belum dapat dibuka. Coba hubungkan kembali.'));
      });
      picker.setVisible(true);
    });
  } finally {
    picker?.dispose();
    for (const dialog of suspended.reverse()) {
      delete dialog.dataset.drivePickerSuspended;
      if (dialog.isConnected) dialog.showModal();
    }
    if (focused?.isConnected) focused.focus({ preventScroll: true });
  }
}

export async function importPickedPhoto(fileId, token, media, fetcher = fetch, onProgress = () => {}) {
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(fileId)) throw new Error('Identitas foto Google Drive tidak valid.');
  onProgress('Menyiapkan foto yang dipilih…');
  const existing = await media.resolve(fileId);
  if (existing) return existing;

  // The user's short-lived Google token is sent only to the Google Drive API.
  const base = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(fileId);
  const options = {
    headers: { Authorization: 'Bearer ' + token },
    redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(90000),
  };
  const infoResponse = await fetcher(base + '?fields=id,name,mimeType,size&supportsAllDrives=true', options);
  if (!infoResponse.ok) throw new Error('Foto belum dapat dibaca. Hubungkan akun Google lalu pilih kembali.');
  const info = await infoResponse.json();
  if (info.id !== fileId || !imageTypes.includes(info.mimeType) || typeof info.name !== 'string') throw new Error('Pilih foto JPG, PNG, WebP, atau GIF.');
  if (!Number.isSafeInteger(Number(info.size)) || Number(info.size) < 1 || Number(info.size) > maxBytes) throw new Error('Pilih foto maksimal 12 MB.');
  const response = await fetcher(base + '?alt=media&supportsAllDrives=true', options);
  if (!response.ok || !response.body) throw new Error('Foto belum selesai diambil dari Google Drive. Coba lagi.');
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error('Pilih foto maksimal 12 MB.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (total !== Number(info.size)) throw new Error('Foto berubah saat diambil. Pilih kembali foto dari Drive.');
  const name = info.name.replace(/[/\\\x00-\x1f]/g, '_').slice(-180);
  const original = new File(chunks, name, { type: info.mimeType });
  const image = await optimizeImage(original);
  onProgress('Menyiapkan foto untuk postingan…');
  return media.upload({ file: image.file, thumbnail: image.thumbnail, original, onProgress });
}

export async function selectNativeDrivePhoto(client) {
  const media = createDriveMedia(client);
  const dialog = document.createElement('dialog');
  dialog.className = 'google-drive-connect';
  dialog.setAttribute('aria-labelledby', 'google-drive-connect-title');
  dialog.innerHTML = '<div class="dialog-header"><h2 id="google-drive-connect-title">Pilih foto dari Google Drive</h2><button type="button" class="icon-button" data-google-close aria-label="Tutup">×</button></div><div class="google-drive-connect-body"><p>Gunakan akun Google yang memiliki akses ke foto kegiatan pondok. Pilih foto melalui tampilan gambar di Google Drive.</p><p data-google-status role="status">Menyiapkan Google Drive…</p><button type="button" class="button" data-google-open disabled>Buka Google Drive</button></div>';
  document.body.append(dialog);
  dialog.showModal();
  const button = dialog.querySelector('[data-google-open]');
  const status = dialog.querySelector('[data-google-status]');
  const close = dialog.querySelector('[data-google-close]');
  let finished = false, busy = false, resolveResult;
  const result = new Promise(resolve => { resolveResult = resolve; });
  const finish = photo => {
    if (finished) return;
    finished = true;
    dialog.close();
    dialog.remove();
    resolveResult(photo);
  };
  const fail = error => {
    accessToken = '';
    expiresAt = 0;
    busy = false; button.disabled = false; close.disabled = false;
    status.textContent = error.message || 'Google Drive belum dapat dibuka. Coba lagi.';
  };
  const choose = async () => {
    busy = true; button.disabled = true; close.disabled = true;
    try {
      const picked = await selectedDocument(accessToken, googlePickerConfig);
      if (!picked) return finish(null);
      const photo = await importPickedPhoto(picked.id, accessToken, media, fetch, message => { status.textContent = message; });
      finish(photo);
    } catch (error) { fail(error); }
  };
  dialog.addEventListener('cancel', event => { event.preventDefault(); if (!busy) finish(null); });
  close.addEventListener('click', () => { if (!busy) finish(null); });
  try {
    await prepareGooglePicker();
    if (finished) return result;
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: googlePickerConfig.clientId,
      scope: GOOGLE_DRIVE_READ_SCOPE,
      include_granted_scopes: false,
      callback: response => {
        if (finished) return;
        if (response.error || !response.access_token ||
            !window.google.accounts.oauth2.hasGrantedAllScopes(response, GOOGLE_DRIVE_READ_SCOPE)) {
          fail(new Error('Izinkan akses baca Google Drive untuk menampilkan foto.'));
          return;
        }
        accessToken = response.access_token;
        expiresAt = Date.now() + (Number(response.expires_in) || 3600) * 1000;
        choose();
      },
      error_callback: error => {
        if (finished) return;
        if (error.type === 'popup_closed') finish(null);
        else fail(new Error('Popup Google belum terbuka. Izinkan popup lalu coba lagi.'));
      },
    });
    button.disabled = false;
    status.textContent = 'Buka Google Drive, lalu pilih foto yang ingin dipakai.';
    button.addEventListener('click', () => {
      if (busy || finished) return;
      if (accessToken && expiresAt > Date.now() + 60000) { choose(); return; }
      busy = true; button.disabled = true; close.disabled = true;
      try { tokenClient.requestAccessToken({ prompt: '' }); }
      catch { fail(new Error('Popup Google belum terbuka. Izinkan popup lalu coba lagi.')); }
    });
    if (accessToken && expiresAt > Date.now() + 60000) choose();
  } catch (error) {
    status.textContent = error.message;
    button.hidden = true;
  }
  return result;
}
