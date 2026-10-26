// Generate private setup files; never print credentials or embed them in the website.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';

const raw = process.argv[2] || '';
const sheetId = raw.match(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([\w-]{20,})(?:\/|$)/)?.[1] || (/^[\w-]{20,}$/.test(raw) ? raw : '');
if (!sheetId) throw new Error('Tambahkan tautan Google Sheets: npm run sheets:prepare -- https://docs.google.com/spreadsheets/d/ID/edit');

const env = { ...process.env };
for (const file of ['.env', '.env.local']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
const url = (env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const key = env.VITE_SUPABASE_ANON_KEY || '';
let publicKey = /^sb_publishable_/.test(key);
try { publicKey ||= JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role === 'anon'; } catch { /* Not a legacy JWT. */ }
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) || !publicKey) throw new Error('Isi URL Supabase dan public key yang valid pada .env. Jangan gunakan service-role key.');

const folder = resolve('.backend-backups', 'sheets-sync');
mkdirSync(folder, { recursive: true });
const configFile = resolve(folder, 'script-properties.json');
const previous = existsSync(configFile) ? JSON.parse(readFileSync(configFile, 'utf8')) : null;
if (previous && (previous.ANNAHL_SPREADSHEET_ID !== sheetId || previous.ANNAHL_SUPABASE_URL !== url)) {
  throw new Error('Konfigurasi tujuan berbeda sudah ada. Simpan backup dan tentukan perpindahan tujuan sebelum menggantinya.');
}
const secret = previous?.ANNAHL_SHEETS_SECRET || randomBytes(32).toString('hex');
if (!/^[a-f0-9]{64}$/.test(secret)) throw new Error('Secret tersimpan tidak valid.');
const properties = { ANNAHL_SUPABASE_URL: url, ANNAHL_SUPABASE_PUBLIC_KEY: key, ANNAHL_SHEETS_SECRET: secret, ANNAHL_SPREADSHEET_ID: sheetId };
writeFileSync(configFile, JSON.stringify(properties, null, 2) + '\n');
const digest = createHash('sha256').update(secret).digest('hex');
writeFileSync(resolve(folder, 'enable-sync.sql'), `-- Apply only after reviewing 202610260002_sheets_sync.sql.\nbegin;\nupdate private.sheets_sync_settings set secret_hash = decode('${digest}', 'hex'), enabled = true where singleton;\ncommit;\n`);
console.log('Berkas konfigurasi pribadi disiapkan di .backend-backups/sheets-sync/.');
console.log('Belum ada perubahan pada Supabase atau Google Sheets. Jangan unggah folder tersebut ke hosting atau Git.');
