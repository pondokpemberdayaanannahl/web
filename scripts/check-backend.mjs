// Read-only anonymous checks. Does not apply migrations or submit form data.
import fs from 'node:fs';

const config = { ...process.env };
for (const file of ['.env', '.env.local']) {
  if (!fs.existsSync(file)) continue;
  for (const match of fs.readFileSync(file, 'utf8').matchAll(/^\s*([A-Za-z_][\w]*)\s*=\s*(.*)$/gm)) {
    config[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}
const url = config.VITE_SUPABASE_URL, key = config.VITE_SUPABASE_ANON_KEY;
if (!url || !key || key === 'local-preview-only' || /127\.0\.0\.1|PROYEK/.test(url)) {
  console.error('BELUM TERHUBUNG: isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env. Tidak ada permintaan yang dikirim.');
  process.exitCode = 2;
} else {
  const base = new URL(url);
  if (base.protocol !== 'https:') throw new Error('Gunakan URL HTTPS proyek Supabase.');
  const headers = { apikey: key };
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
  const checks = [
    ['Skema berita', 'berita?select=id,status,deleted_at,thumbnail_url,caption,updated_at&limit=0', 'schema'],
    ['Skema galeri', 'galeri_foto?select=id,thumbnail_url,caption&limit=0', 'schema'],
    ['Skema isi website', 'site_content?select=page_id,state,content,revision,updated_at&limit=0', 'schema'],
    ['Draft tidak terbaca publik', 'berita?select=id&status=eq.draft&limit=1', 'empty'],
    ['Arsip tidak terbaca publik', 'berita?select=id&deleted_at=not.is.null&limit=1', 'empty'],
    ['Profil pengurus private', 'pengurus?select=id&limit=1', 'private'],
    ['Riwayat berita private', 'berita_history?select=id&limit=1', 'private'],
    ['Riwayat halaman private', 'site_content_history?select=id&limit=1', 'private'],
    ['Kotak masuk private', 'form_submissions?select=id&limit=1', 'private'],
  ];
  let failed = false;
  for (const [label, path, expected] of checks) {
    try {
      const response = await fetch(new URL(`/rest/v1/${path}`, base), { headers, signal: AbortSignal.timeout(12000) });
      const body = await response.json();
      const empty = response.ok && Array.isArray(body) && body.length === 0;
      const pass = expected === 'schema' ? response.ok : expected === 'private' ? empty || [401, 403].includes(response.status) : empty;
      console.log(`${pass ? 'PASS' : 'FAIL'} ${label} (HTTP ${response.status})`);
      if (!pass) failed = true;
    } catch { console.log(`FAIL ${label}: koneksi gagal atau timeout`); failed = true; }
  }
  console.log('Pemeriksaan ini tidak menguji hak tulis admin/penulis atau penerimaan formulir. Lanjutkan skenario staging pada BACKEND_SETUP.md.');
  process.exitCode = failed ? 1 : 0;
}
