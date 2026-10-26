import { bindGoogleSubmission } from './google-forms.js';
const kinds = new Set(['kontak']);

export async function sendSubmission(kind, payload, requestId, client) {
  if (!kinds.has(kind)) throw new Error('Pendaftaran dan donasi disimpan melalui Google.');
  if (!payload.nama?.trim() || payload.nama.trim().length < 2) throw new Error('Nama minimal dua karakter.');
  if (kind === 'kontak' && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email || '') || !payload.pesan?.trim())) throw new Error('Periksa email dan isi pesan.');
  if (new TextEncoder().encode(JSON.stringify(payload)).length > 14000) throw new Error('Isian terlalu panjang. Mohon ringkas pesan atau alamat.');
  if (!client) throw new Error('Layanan formulir belum tersedia. Silakan hubungi pengurus melalui WhatsApp.');
  const { error } = await client.from('form_submissions').insert({ id: requestId, kind, payload });
  // The same random ID is reused after network failures, avoiding duplicate entries.
  if (error && error.code !== '23505') throw new Error('Belum berhasil mengirim. Periksa koneksi lalu coba lagi, atau hubungi pengurus.');
}

export function bindSubmission(form, kind, collect, successMessage) {
  if (!form) return;
  if (['pendaftaran', 'donasi'].includes(kind)) return bindGoogleSubmission(form, kind, collect, successMessage);
  const button = form.querySelector('[type="submit"]');
  let notification = form.querySelector('[role="status"]');
  if (!notification) {
    notification = document.createElement('p'); notification.setAttribute('role', 'status'); notification.className = 'submission-status';
    form.appendChild(notification);
  }
  let busy = false, requestId = null, payloadKey = '';
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy) return;
    const values = collect();
    const signature = JSON.stringify(values);
    if (signature !== payloadKey) { requestId = crypto.randomUUID(); payloadKey = signature; }
    const previous = button.innerHTML;
    const controls = [...form.elements].map(control => [control, control.disabled]);
    controls.forEach(([control]) => { control.disabled = true; });
    busy = true; button.disabled = true; button.textContent = 'Mengirim…'; notification.textContent = '';
    try {
      const { supabase } = await import('./supabase.js');
      await sendSubmission(kind, values, requestId, supabase);
      notification.textContent = successMessage; notification.dataset.state = 'success';
      form.reset(); requestId = null; payloadKey = '';
    } catch (error) { notification.textContent = error.message; notification.dataset.state = 'error'; }
    finally { busy = false; controls.forEach(([control, disabled]) => { control.disabled = disabled; }); button.disabled = false; button.innerHTML = previous; }
  });
}
