import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
const env = Object.fromEntries(readFileSync('.env','utf8').split(/\r?\n/).filter(line=>/^[A-Z_]+=/.test(line)).map(line=>{ const at=line.indexOf('='); return [line.slice(0,at),line.slice(at+1).trim().replace(/^(['"])(.*)\1$/,'$2')]; }));
if (!/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(env.VITE_SUPABASE_URL || '') || !env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY.startsWith('sb_secret_')) throw Error('Isi konfigurasi publik Supabase di .env. Jangan gunakan service-role key.');
if (env.VITE_SUPABASE_ANON_KEY.split('.').length===3 && JSON.parse(Buffer.from(env.VITE_SUPABASE_ANON_KEY.split('.')[1],'base64url')).role!=='anon') throw Error('Gunakan public anon key, bukan service-role key.');
mkdirSync('.backend-backups/drive-media',{recursive:true});
const signingPath='.backend-backups/drive-media/signing-key.json';
const signingKey=existsSync(signingPath)?JSON.parse(readFileSync(signingPath,'utf8')).key:randomBytes(32).toString('hex');
if (!/^[a-f0-9]{64}$/.test(signingKey || '')) throw Error('Kunci tautan foto lokal tidak valid. Pulihkan backup konfigurasi, jangan membuat ulang sembarangan.');
if(!existsSync(signingPath))writeFileSync(signingPath,JSON.stringify({key:signingKey})+'\n');
const quote = value => "'"+value.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+"'";
const source = `<?php\n// Private server configuration: outside public_html. Preserve the photo signing key.\n$settings = require __DIR__ . '/forms-config.php';\n$settings['supabase_url'] = ${quote(env.VITE_SUPABASE_URL)};\n$settings['supabase_anon_key'] = ${quote(env.VITE_SUPABASE_ANON_KEY)};\n$settings['media_signing_key'] = ${quote(signingKey)};\n$settings['media_cache_directory'] = __DIR__ . '/media-cache';\nreturn $settings;\n`;
for (const folder of ['annahl-private','.backend-backups/drive-media/hostinger-private']) {
  mkdirSync(folder,{recursive:true});
  const local = folder==='annahl-private' && process.platform==='win32' ? source.replace('return $settings;',"if (is_file(__DIR__ . '/local-ca.pem')) $settings['curl_ca_file'] = __DIR__ . '/local-ca.pem';\nreturn $settings;") : source;
  writeFileSync(`${folder}/media-config.php`,local);
}
console.log('Konfigurasi foto lokal dan Hostinger disiapkan di folder privat. Tidak ada nilai kunci yang ditampilkan.');
