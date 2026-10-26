// Local setup only. Generates private PHP configuration without printing secrets.
import { readFileSync,writeFileSync,mkdirSync,existsSync,copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
const owner='pondokpemberdayaanannahl@gmail.com', sheet='1GJJDb0AEv4a3yugzQpv2hMhU1ke9g_zIbsNGQMNlmg8';
const source=JSON.parse(readFileSync('.backend-backups/sheets-sync/script-properties.json','utf8'));
if(source.ANNAHL_SPREADSHEET_ID!==sheet || !/^[a-f0-9]{64}$/.test(source.ANNAHL_SHEETS_SECRET||'')) throw new Error('Konfigurasi Google pondok belum valid.');
const folder=resolve('.backend-backups/google-forms');mkdirSync(folder,{recursive:true});
const metadataFile=resolve(folder,'deployment.json');
const previous=existsSync(metadataFile)?JSON.parse(readFileSync(metadataFile,'utf8')):{};
const url=process.argv[2]||previous.appsScriptUrl||'';
if(url&&!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url)) throw new Error('Gunakan URL deployment Google berakhiran /exec.');
const origins=['https://pondokpesantrenpemberdayaanummatannahl.com','https://www.pondokpesantrenpemberdayaanummatannahl.com'];
const quote=value=>"'"+value.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+"'";
function configuration(allowedOrigins) {
  const json=JSON.stringify({apps_script_url:url,shared_secret:source.ANNAHL_SHEETS_SECRET,allowed_origins:allowedOrigins,submissions_per_hour:30});
  return `<?php\n// Private configuration. Keep OUTSIDE public_html.\n$settings = json_decode(${quote(json)}, true, 512, JSON_THROW_ON_ERROR);\n$settings['rate_limit_directory'] = __DIR__ . '/rate-limits';\nreturn $settings;\n`;
}
const privateHost=resolve(folder,'hostinger-private');mkdirSync(privateHost,{recursive:true});
writeFileSync(resolve(privateHost,'forms-config.php'),configuration(origins));
mkdirSync('annahl-private',{recursive:true});
writeFileSync('annahl-private/forms-config.php',configuration(['http://127.0.0.1:5173','http://localhost:5173','http://127.0.0.1:4173','http://localhost:4173']));
writeFileSync(metadataFile,JSON.stringify({owner,spreadsheetId:sheet,appsScriptUrl:url,configured:!!url,remoteDeploymentVerified:false},null,2)+'\n');
copyFileSync('integrations/hostinger/forms-config.example.php',resolve(folder,'forms-config.example.php'));
console.log('Konfigurasi lokal dan konfigurasi privat Hostinger disiapkan. Kunci tidak dicetak.');
console.log(url?'URL deployment sudah diisi; koneksi langsung masih perlu diuji.':'URL deployment belum diisi; formulir tetap menolak kiriman sampai Google diaktifkan.');
