const kinds = new Set(['pendaftaran', 'kontak', 'donasi']);

export async function sendSubmission(kind, payload, requestId, client) {
  if (!kinds.has(kind)) throw new Error('Jenis formulir tidak dikenal.');
  if (!payload.nama?.trim() || payload.nama.trim().length < 2) throw new Error('Nama minimal dua karakter.');
  if (kind === 'pendaftaran' && (!/^\+?[\d\s()-]{8,24}$/.test(payload.noWA || '') || !payload.namaWali?.trim())) throw new Error('Periksa nama wali dan nomor WhatsApp.');
  if (kind === 'kontak' && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email || '') || !payload.pesan?.trim())) throw new Error('Periksa email dan isi pesan.');
  if (kind === 'donasi' && !/^[1-9]\d{0,11}$/.test(payload.jumlah || '')) throw new Error('Isi jumlah donasi dengan nominal yang valid.');
  if (new TextEncoder().encode(JSON.stringify(payload)).length > 14000) throw new Error('Isian terlalu panjang. Mohon ringkas pesan atau alamat.');
  if (!client) throw new Error('Layanan formulir belum tersedia. Silakan hubungi pengurus melalui WhatsApp.');
  const { error } = await client.from('form_submissions').insert({ id: requestId, kind, payload });
  // The same random ID is reused after network failures, avoiding duplicate entries.
  if (error && error.code !== '23505') throw new Error('Belum berhasil mengirim. Periksa koneksi lalu coba lagi, atau hubungi pengurus.');
}

export function bindSubmission(form, kind, collect, successMessage) {
  if (!form) return;
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
    const previous = button.textContent;
    busy = true; button.disabled = true; button.textContent = 'Mengirim…'; notification.textContent = '';
    try {
      const { supabase } = await import('./supabase.js');
      await sendSubmission(kind, values, requestId, supabase);
      notification.textContent = successMessage; notification.dataset.state = 'success';
      form.reset(); requestId = null; payloadKey = '';
    } catch (error) { notification.textContent = error.message; notification.dataset.state = 'error'; }
    finally { busy = false; button.disabled = false; button.textContent = previous; }
  });
}
