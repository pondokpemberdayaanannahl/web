// Copies originals and existing optimized renditions. Never deletes source files.
import { readFileSync, writeFileSync, mkdirSync, existsSync, realpathSync, statSync, renameSync } from 'node:fs';
import { resolve, sep, basename, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { createDriveBridge } from './drive-request.mjs';
import { photoAssetId } from '../src/drive-media.js';
const args = new Set(process.argv.slice(2));
const root = realpathSync('.');
const rows = JSON.parse(readFileSync('src/data/photo-library.json','utf8')).photos;
const pathWithin = path => { const full=realpathSync(resolve(root,path)); if (!full.startsWith(root+sep)) throw Error('Foto harus berada di folder proyek.'); return full; };
const targets = rows.map(row=>({...row,original:pathWithin('picture/'+row.path),fullPath:pathWithin('public'+row.full),thumbnailPath:pathWithin('public'+row.thumbnail)}));
const bytes = targets.reduce((sum,row)=>sum+statSync(row.original).size+statSync(row.fullPath).size+statSync(row.thumbnailPath).size,0);
if (!args.has('--upload') && !args.has('--setup') && !args.has('--status') && !args.has('--verify-image') && !args.has('--verify-all')) {
  console.log(JSON.stringify({photos:targets.length,originalBytes:targets.reduce((s,row)=>s+statSync(row.original).size,0),totalBytes:bytes,mode:'dry-run',sourceFilesRemoved:0},null,2));
  process.exit(0);
}
const properties = JSON.parse(readFileSync('.backend-backups/sheets-sync/script-properties.json','utf8'));
const endpoint = JSON.parse(readFileSync('.backend-backups/google-forms/deployment.json','utf8')).appsScriptUrl;
const secret = properties.ANNAHL_SHEETS_SECRET;
if (!/^[a-f0-9]{64}$/.test(secret || '') || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint || '')) throw Error('Konfigurasi penghubung Google belum tersedia.');
const request=createDriveBridge({endpoint,secret,onRetry:({attempt,reason})=>console.log(`Mencoba ulang sambungan Google (${attempt}/5): ${reason}`)});
if(args.has('--setup')) { const reply=await request('setup'); console.log('Folder foto website siap: '+reply.folderUrl); process.exit(0); }
const ready=await request('status');
if(args.has('--status')) { console.log(JSON.stringify({ready:ready.ready,folderUrl:ready.folderUrl})); process.exit(0); }
if(args.has('--verify-image')) {
  const report=JSON.parse(readFileSync('.backend-backups/drive-media/import-report.json','utf8')),photo=Object.values(report.photos)[0];
  const image=await request('image',{assetId:photo.assetId,variant:'thumbnail'}),buffer=Buffer.from(image.data,'base64');
  console.log(JSON.stringify({ok:true,mime:image.mime,bytes:buffer.length,hashMatches:createHash('sha256').update(buffer).digest('hex')===image.sha256}));process.exit(0);
}
if(args.has('--verify-all')) {
  const report=JSON.parse(readFileSync('.backend-backups/drive-media/import-report.json','utf8')),remote=new Map();let cursor='',pages=0;
  do {const page=await request('list',{cursor});for(const photo of page.photos)remote.set(photo.id,photo);cursor=page.cursor;if(++pages>100)throw Error('Perpustakaan melebihi batas pemeriksaan.');}while(cursor);
  const copied=Object.values(report.photos),missing=copied.filter(photo=>!remote.has(photo.assetId));
  const result={sourcePhotos:targets.length,confirmedSourcePhotos:copied.length,uniqueDrivePhotos:remote.size,allPresent:copied.length===targets.length && !missing.length,missing:missing.map(photo=>photo.path),folderUrl:ready.folderUrl};
  writeFileSync('.backend-backups/drive-media/cloud-verification.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));if(!result.allPresent)process.exitCode=1;process.exit();
}
const output=resolve('.backend-backups/drive-media');mkdirSync(output,{recursive:true});
const reportPath=resolve(output,'import-report.json');
const report=existsSync(reportPath)?JSON.parse(readFileSync(reportPath,'utf8')):{version:1,owner:'pondokpemberdayaanannahl@gmail.com',photos:{}};
const limitArg=[...args].find(arg=>arg.startsWith('--limit='));const limit=limitArg?Number(limitArg.slice(8)):Infinity;
if (!(limit>0)) throw Error('Batas batch tidak valid.');
let copied=0;
const pending=targets.map((row,index)=>({row,index})).filter(({row})=>!report.photos[row.id]?.complete).slice(0,limit);
async function copyPhoto({row,index}) {
  let assetId,receipt;
  for(const [variant,path] of [['original',row.original],['full',row.fullPath],['thumbnail',row.thumbnailPath]]) {
    const buffer=readFileSync(path),sha256=createHash('sha256').update(buffer).digest('hex');
    if(variant==='original')assetId=photoAssetId(sha256);
    const ext=extname(path).toLowerCase();const mime={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.heic':'image/heic','.heif':'image/heif','.webp':'image/webp'}[ext];
    if(!mime)throw Error('Format foto tidak didukung: '+row.filename);
    const part={name:basename(path),mime,bytes:buffer.length,sha256,data:buffer.toString('base64')};
    receipt=await request('upload',{assetId,variant,name:row.filename,folder:row.folder,file:part});
    if(receipt.asset?.id!==assetId || receipt.sha256!==sha256 || receipt.variant!==variant)throw Error('Tanda terima foto tidak cocok. Pengiriman dihentikan.');
    if(variant==='original' && receipt.asset.complete)break;
  }
  if(!receipt.asset.complete)throw Error('Tiga versi foto belum dikonfirmasi.');
  report.photos[row.id]={path:row.path,assetId,complete:true,copiedAt:new Date().toISOString(),originalUrl:receipt.asset.originalUrl};
  report.completed=Object.keys(report.photos).length;report.total=targets.length;report.folderUrl=ready.folderUrl;
  writeFileSync(reportPath+'.tmp',JSON.stringify(report,null,2)+'\n');renameSync(reportPath+'.tmp',reportPath);copied++;
  console.log(`[${index+1}/${targets.length}] Tersimpan di Drive: ${row.filename}`);
}
const concurrencyArg=[...args].find(arg=>arg.startsWith('--concurrency='));
const concurrency=concurrencyArg?Number(concurrencyArg.split('=')[1]):1;
if(!Number.isInteger(concurrency)||concurrency<1||concurrency>2)throw Error('Gunakan concurrency 1 atau 2.');
let offset=0,failure=null;
await Promise.all(Array.from({length:concurrency},async()=>{while(offset<pending.length && !failure){const item=pending[offset++];try{await copyPhoto(item);}catch(error){failure=error;}}}));
if(failure)throw failure;
console.log(`Selesai batch: ${report.completed || 0}/${targets.length} foto. Berkas sumber tidak dihapus.`);
