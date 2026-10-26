export function draftKey(user, demo, id = 'new') {
  return `annahl-draft-v1:${demo ? 'demo' : 'live'}:${encodeURIComponent(user)}:${encodeURIComponent(id)}`;
}

export function saveDraft(storage, key, values) {
  storage.setItem(key, JSON.stringify({ ...values, savedAt: new Date().toISOString() }));
}

export function readDraft(storage, key) {
  try {
    const draft = JSON.parse(storage.getItem(key));
    return draft && typeof draft.judul === 'string' && typeof draft.isi === 'string' && typeof draft.kategori === 'string' ? draft : null;
  } catch { return null; }
}

export function fitDimensions(width, height, edge) {
  if (width <= 0 || height <= 0 || width * height > 40000000) throw new Error('Dimensi foto terlalu besar atau tidak valid.');
  const scale = Math.min(1, edge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export async function optimizeImage(file) {
  if (!file) return null;
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) throw new Error('Pilih foto JPG, PNG, WebP, atau GIF.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Foto sumber maksimal 12 MB.');
  if (file.type === 'image/gif' || typeof createImageBitmap === 'undefined') {
    if (file.size > 2 * 1024 * 1024) throw new Error('Gunakan foto di bawah 2 MB pada format atau browser ini.');
    return { file, thumbnail: null, note: 'Foto siap diunggah.' };
  }
  const bitmap = await createImageBitmap(file);
  try {
    const encode = async edge => {
      const dimensions = fitDimensions(bitmap.width, bitmap.height, edge);
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width; canvas.height = dimensions.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Browser belum dapat mengoptimalkan foto.');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .82));
      canvas.width = canvas.height = 0;
      if (!blob) throw new Error('Foto gagal diproses. Coba foto lain.');
      const extension = blob.type === 'image/webp' ? 'webp' : 'png';
      return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.${extension}`, { type: blob.type });
    };
    const optimized = await encode(1600);
    const result = optimized.size < file.size ? optimized : file;
    if (result.size > 2 * 1024 * 1024) throw new Error('Foto masih di atas 2 MB setelah dikompres. Gunakan foto yang lebih kecil.');
    const thumbnail = await encode(480);
    return { file: result, thumbnail, note: `${Math.round(file.size / 1024)} KB → ${Math.round(result.size / 1024)} KB · thumbnail disiapkan` };
  } finally { bitmap.close(); }
}
