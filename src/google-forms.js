export const GOOGLE_FORM_ENDPOINT = '/api/forms.php';
export const RECAP_URL = 'https://docs.google.com/spreadsheets/d/1GJJDb0AEv4a3yugzQpv2hMhU1ke9g_zIbsNGQMNlmg8/edit';
const extensions = /\.(jpe?g|png|webp|pdf|docx|xlsx|pptx)$/i;
export const ATTACHMENT_HELP = 'Foto, PDF, DOCX, XLSX, atau PPTX. Maksimal 3 berkas, 10 MB per berkas dan 15 MB total.';
export const REGISTRATION_FILE_LIMIT = 8;
export const REGISTRATION_ATTACHMENT_HELP = `JPG, PNG, WebP, atau PDF. Maksimal ${REGISTRATION_FILE_LIMIT} berkas, 10 MB per berkas dan 15 MB total. Lampiran boleh dilengkapi sesuai dokumen yang sudah tersedia.`;

export function validateAttachments(files, { maxFiles = 3 } = {}) {
  if (files.length > maxFiles) throw new Error(`Pilih paling banyak ${maxFiles} berkas.`);
  let total = 0;
  for (const file of files) {
    if (!extensions.test(file.name) || file.name.length > 180) throw new Error('Gunakan JPG, PNG, WebP, PDF, DOCX, XLSX, atau PPTX.');
    if (!file.size || file.size > 10 * 1024 * 1024) throw new Error('Ukuran setiap berkas harus antara 1 byte dan 10 MB.');
    total += file.size;
  }
  if (total > 15 * 1024 * 1024) throw new Error('Total lampiran maksimal 15 MB.');
}

function attachmentName(name, label = '') {
  name = name.replace(/[\/\\\x00-\x1f\x7f]/g, '_');
  const prefix = label ? `${label.replace(/[\/\\\x00-\x1f\x7f]/g, ' ').trim()} - ` : '';
  const dot = name.lastIndexOf('.'), extension = name.slice(dot), stem = name.slice(0, dot);
  const encoder = new TextEncoder();
  let shortened = '';
  for (const char of stem) {
    if (encoder.encode(prefix + shortened + char + extension).length > 180) break;
    shortened += char;
  }
  return prefix + shortened + extension;
}

export async function encodeAttachments(files, { maxFiles = 3, labels = [] } = {}) {
  validateAttachments(files, { maxFiles });
  return Promise.all(files.map(async (file, index) => {
    const buffer = await file.arrayBuffer(), bytes = new Uint8Array(buffer);
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 16384) binary += String.fromCharCode(...bytes.subarray(offset, offset + 16384));
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', buffer));
    return { name: attachmentName(file.name, labels[index]), bytes: file.size, data: btoa(binary), sha256: [...digest].map(value => value.toString(16).padStart(2, '0')).join('') };
  }));
}

async function readResponse(response) {
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Layanan formulir belum tersambung. Silakan hubungi pengurus.');
  const value = await response.json();
  if (!response.ok || value.ok !== true) {
    const error = new Error(typeof value.message === 'string' ? value.message : 'Belum berhasil menyimpan. Coba lagi atau hubungi pengurus.');
    error.status = response.status; throw error;
  }
  return value;
}

export async function getGoogleFormToken(transport = fetch) {
  const response = await transport(GOOGLE_FORM_ENDPOINT, { credentials: 'same-origin', redirect: 'error', cache: 'no-store', headers: { 'X-Annahl-Form': '1' } });
  const result = await readResponse(response);
  if (typeof result.token !== 'string' || result.token.length > 200) throw new Error('Sesi formulir belum tersedia. Muat ulang halaman.');
  return result.token;
}

export async function getRegistrationStatus(transport = fetch) {
  const response = await transport(`${GOOGLE_FORM_ENDPOINT}?kind=pendaftaran`, { credentials: 'same-origin', redirect: 'error', cache: 'no-store', headers: { 'X-Annahl-Form': '1' }, signal: AbortSignal.timeout(12000) });
  const { registration } = await readResponse(response);
  if (!Array.isArray(registration?.levels) || !['open','closed','upcoming','unscheduled','preparing'].includes(registration.state)) throw new Error('Jadwal belum tersedia.');
  return registration;
}

export async function sendGoogleSubmission(kind, payload, id, files, token, website = '', transport = fetch) {
  if (!['pendaftaran', 'donasi'].includes(kind)) throw new Error('Jenis formulir tidak tersedia.');
  if (!payload.nama?.trim() || payload.nama.trim().length < 2) throw new Error('Isi nama minimal dua karakter.');
  if (kind === 'donasi' && !/^[1-9]\d{0,11}$/.test(payload.jumlah || '')) throw new Error('Isi nominal donasi dengan angka yang valid.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const response = await transport(GOOGLE_FORM_ENDPOINT, { method: 'POST', credentials: 'same-origin', redirect: 'error',
      headers: { 'Content-Type': 'application/json', 'X-Annahl-Form': '1' }, signal: controller.signal,
      body: JSON.stringify({ id, kind, payload, files, token, website }) });
    const receipt = await readResponse(response);
    if (receipt.id !== id || receipt.kind !== kind) throw new Error('Belum menerima tanda terima yang sesuai. Coba kirim lagi.');
    return receipt;
  } finally { clearTimeout(timer); }
}

export function bindGoogleSubmission(form, kind, collect, successMessage, { canSubmit, onSuccess, onError, transport = fetch } = {}) {
  const document = form.ownerDocument;
  const button = form.querySelector('[type="submit"]');
  const notification = form.querySelector('.submission-status[role="status"]') || form.querySelector('[role="status"]');
  const maxFiles = kind === 'pendaftaran' ? REGISTRATION_FILE_LIMIT : 3;
  const summary = form.querySelector('[data-attachments-summary]');
  const fileFields = [...form.querySelectorAll('[data-form-files]')].map(input => {
    const group = input.closest('[data-file-group]') || form;
    return { input, list: group.querySelector('[data-file-list]'), feedback: group.querySelector('[data-file-feedback]'), clear: group.querySelector('[data-clear-files]') };
  });
  const selectedFiles = () => fileFields.flatMap(({ input }) => [...input.files].map((file, index, files) => ({ file, label: input.dataset.fileLabel ? input.dataset.fileLabel + (files.length > 1 ? ` ${index + 1}` : '') : '' })));
  let busy = false, id = '', lastSignature = '', token = '', tokenTime = 0;
  // Warm up the session without storing any form fields or files in browser storage.
  let tokenPromise = getGoogleFormToken(transport).then(value => { token = value; tokenTime = Date.now(); return value; }).catch(() => null);

  function showFiles() {
    let valid = true;
    for (const { input, list, feedback, clear } of fileFields) {
      list?.replaceChildren(); if (feedback) feedback.textContent = '';
      input.setCustomValidity('');
      const files = [...input.files]; if (clear) clear.hidden = !files.length;
      try {
        validateAttachments(files, { maxFiles });
        if (!input.hasAttribute('multiple') && files.length > 1) throw new Error('Pilih satu berkas untuk dokumen ini.');
        const accepted = (input.getAttribute('accept') || '').toLowerCase().split(',').filter(Boolean);
        if (accepted.length && files.some(file => !accepted.some(ext => file.name.toLowerCase().endsWith(ext.trim())))) throw new Error(input.dataset.fileLabel === 'Pas foto' ? 'Gunakan JPG, PNG, atau WebP untuk pas foto.' : 'Gunakan foto JPG, PNG, WebP, atau PDF untuk dokumen ini.');
      } catch (error) {
        valid = false; input.setCustomValidity(error.message); if (feedback) feedback.textContent = error.message;
      }
      for (const file of files) {
        const item = document.createElement('li'), name = document.createElement('span'), size = document.createElement('small');
        name.textContent = file.name; size.textContent = `${Math.ceil(file.size / 1024)} KB`;
        item.append(name, size); list?.append(item);
      }
    }
    const entries = selectedFiles();
    if (summary) summary.textContent = entries.length ? `${entries.length} berkas dipilih · ${Math.ceil(entries.reduce((sum, { file }) => sum + file.size, 0) / 1024)} KB dari 15 MB` : 'Belum ada dokumen dipilih.';
    try { validateAttachments(entries.map(({ file }) => file), { maxFiles }); }
    catch (error) {
      valid = false;
      const field = fileFields.find(({ input }) => input.files.length);
      field?.input.setCustomValidity(error.message);
      if (field?.feedback) field.feedback.textContent = error.message;
      if (summary) summary.textContent = error.message;
    }
    return valid;
  }
  for (const field of fileFields) {
    field.input.addEventListener('change', showFiles);
    field.clear?.addEventListener('click', () => { field.input.value = ''; showFiles(); field.input.focus(); });
  }
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (busy || !showFiles() || (canSubmit && !canSubmit())) return;
    const previous = button.innerHTML, controls = [...form.elements].map(control => [control, control.disabled]);
    busy = true; controls.forEach(([control]) => { control.disabled = true; }); button.textContent = 'Menyiapkan kiriman…'; notification.textContent = '';
    try {
      const values = collect(), entries = selectedFiles();
      const files = await encodeAttachments(entries.map(({ file }) => file), { maxFiles, labels: entries.map(({ label }) => label) });
      const signature = JSON.stringify({ values, files: files.map(({ name, sha256 }) => ({ name, sha256 })) });
      if (signature !== lastSignature) { id = crypto.randomUUID(); lastSignature = signature; }
      await tokenPromise;
      if (!token || Date.now() - tokenTime > 3000000) { token = await getGoogleFormToken(transport); tokenTime = Date.now(); }
      button.textContent = files.length ? 'Menyimpan isian dan lampiran…' : 'Menyimpan isian…';
      const receipt = await sendGoogleSubmission(kind, values, id, files, token, form.querySelector('[data-website]')?.value || '', transport);
      notification.dataset.state = 'success'; notification.textContent = successMessage;
      form.reset(); showFiles(); id = ''; lastSignature = '';
      onSuccess?.(receipt);
    } catch (error) {
      if (error.status === 403) { token = ''; tokenPromise = Promise.resolve(null); }
      notification.dataset.state = 'error';
      notification.textContent = error.name === 'AbortError' ? 'Belum menerima konfirmasi penyimpanan. Isian tetap ada; silakan kirim lagi.' : error.message || 'Belum berhasil mengirim. Isian tetap ada; coba lagi.';
      onError?.(error);
    } finally { busy = false; controls.forEach(([control, disabled]) => { control.disabled = disabled; }); button.innerHTML = previous; }
  });
}
