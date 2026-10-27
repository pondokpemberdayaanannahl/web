import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';

function fail(message) { throw new Error(message); }

if (process.argv.includes('--env')) {
  const { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key } = process.env;
  if (!url || !key) fail('Isi repository Variables VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sebelum build.');
  if (new URL(url).protocol !== 'https:') fail('URL Supabase produksi harus memakai HTTPS.');
  if (key.startsWith('sb_secret_')) fail('Gunakan public/publishable key Supabase, bukan secret key.');
  if (key.split('.').length === 3) {
    let payload;
    try { payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()); }
    catch { fail('Format public key Supabase tidak valid.'); }
    if (payload.role !== 'anon') fail('JWT Supabase untuk website harus memiliki role anon.');
  } else if (!key.startsWith('sb_publishable_')) {
    fail('Gunakan anon key atau publishable key Supabase yang valid.');
  }
  console.log('Konfigurasi publik Supabase tersedia. Nilai kunci tidak ditampilkan.');
} else {
  const root = resolve(process.argv[2] || 'dist');
  let count = 0;
  async function inspect(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) fail('Build publik tidak boleh memuat symlink.');
      if (/^(?:\.env(?:\..*)?|\.git|annahl-private|\.backend-backups|node_modules|src|forms-config\.php|script-properties\.json)$/.test(entry.name)) {
        fail(`Berkas sumber/privat tidak boleh masuk rilis: ${entry.name}`);
      }
      const path = resolve(folder, entry.name);
      if (entry.isDirectory()) await inspect(path);
      else count++;
    }
  }
  await inspect(root);
  for (const name of ['index.html', 'admin.html', 'api/forms.php', 'api/forms-core.php']) {
    if (!(await stat(resolve(root, name))).isFile()) fail(`Build belum lengkap: ${name}`);
  }
  for (const name of ['index.html', 'admin.html']) {
    const html = await readFile(resolve(root, name), 'utf8');
    const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(match => match[1]);
    if (!scripts.some(path => path.startsWith('/assets/'))) fail(`${name} masih belum memakai JavaScript hasil build.`);
    if (scripts.some(path => path.startsWith('/src/'))) fail(`${name} masih memakai file pengembangan.`);
    const assets = [...html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g)].map(match => match[1]);
    for (const asset of assets) {
      const path = resolve(root, asset.slice(1));
      if (relative(root, path).startsWith(`..${sep}`) || !(await stat(path)).isFile()) fail(`Aset rilis tidak ditemukan: ${asset}`);
    }
  }
  console.log(`${count} berkas siap untuk Hostinger. Halaman publik dan admin memakai hasil build.`);
}
