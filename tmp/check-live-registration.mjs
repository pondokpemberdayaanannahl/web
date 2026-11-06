import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
const folder = '.backend-backups/registration-error-20261106';
await mkdir(folder, { recursive: true });
let previous;
try { previous = JSON.parse(await readFile(`${folder}/synthetic-record.json`, 'utf8')); } catch {}
const origin = 'https://pondokpesantrenpemberdayaanummatannahl.com';
const endpoint = `${origin}/api/forms.php`;
const headers = { 'X-Annahl-Form': '1', Origin: origin };
const initial = await fetch(`${endpoint}?kind=pendaftaran`, { headers, signal: AbortSignal.timeout(25000) });
const status = await initial.json();
if (!initial.ok || status.registration?.state !== 'open') throw new Error('Active registration period is unavailable; no submission sent.');
const year = status.registration.registration.year;
if (previous && previous.payload.registrationYear !== String(year)) throw new Error('Period changed; no submission sent.');
const record = previous || { id: randomUUID(), kind: 'pendaftaran', payload: {
  nama: 'UJI SISTEM - ABAIKAN', tempatLahir: 'DATA UJI', tanggalLahir: '2014-01-01',
  jenisKelamin: 'Laki-laki', asalSekolah: 'SEKOLAH UJI SISTEM', jenjang: status.registration.levels[0].title,
  namaWali: 'WALI UJI SISTEM', noWA: '000000000000', email: '', alamat: 'DATA UJI SISTEM - BUKAN PENDAFTAR NYATA',
  registrationYear: String(year),
}, files: [] };
await writeFile(`${folder}/synthetic-record.json`, JSON.stringify(record, null, 2));
const cookies = initial.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
const response = await fetch(endpoint, { method: 'POST', headers: { ...headers, Cookie: cookies, 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...record, token: status.token, website: '' }), signal: AbortSignal.timeout(90000) });
const receipt = await response.json();
const result = { status: response.status, ok: receipt.ok, message: receipt.message, receiptMatches: receipt.id === record.id && receipt.kind === record.kind, year, id: record.id, attachments: 0 };
await writeFile(`${folder}/public-result.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
