import fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath,pathToFileURL } from 'node:url';
import { FileBlob,PresentationFile } from 'file:///C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
const base=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(base,'../../..');
const runtime='C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies';
process.env.RUNTIME_NODE_MODULES=runtime+'/node/node_modules';
const SKILL_DIR='C:/Users/kamik/.codex/plugins/cache/openai-primary-runtime/presentations/26.1026.10807/skills/presentations';
const source=path.join(root,'output/presentations/Pelatihan_Admin_Website_An-Nahl_10_Slide.pptx');
const deck=await PresentationFile.importPptx(await FileBlob.load(source));
const C={green:'#103D30',deep:'#0B3026',cream:'#F6F2E9',ink:'#17382C',muted:'#64756A',gold:'#B38B4F',lightGold:'#E6C58B',white:'#FFFFFF',pale:'#D5E1D7'};
const FONT='Arial';
const renders=path.join(base,'redesign-renders'); await fs.mkdir(renders,{recursive:true});
const notesBefore=deck.slides.items.map(s=>s.speakerNotes.text);
// Reuse imported slides, editable text objects, screenshots, and speaker notes.
const pools=new Map();
for(const s of deck.slides.items){
  pools.set(s,{shapes:[...s.shapes.items],next:0});
  for(const sh of s.shapes.items)sh.text='';
}
function tx(s,t,x,y,w,h,size=28,color=C.ink,bold=false){
  const pool=pools.get(s);
  const sh=pool.shapes[pool.next++]||s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
  sh.position={left:x,top:y,width:w,height:h}; sh.fill='none';sh.line={fill:'none',width:0};sh.name=t.slice(0,60);sh.text=t;
  sh.text.style={typeface:FONT,fontSize:size,color,bold,alignment:'left',verticalAlignment:'top',wrap:'square',insets:0};
  return sh;
}
function page(i,dark=false){const s=deck.slides.items[i];s.background.fill=dark?C.deep:C.cream;tx(s,String(i+1).padStart(2,'0')+' / 10',1138,672,90,26,18,dark?C.pale:C.muted);return s;}
function head(s,kicker,title,dark=false){tx(s,kicker,56,38,1100,30,19,dark?C.lightGold:C.gold,true);tx(s,title,56,85,1168,105,54,dark?C.white:C.ink,true);}
function step(s,n,title,body,x,y,w,dark=false){tx(s,n,x,y,52,48,36,dark?C.lightGold:C.gold,true);tx(s,title,x+70,y+1,w-70,48,30,dark?C.white:C.ink,true);if(body)tx(s,body,x+70,y+51,w-70,90,26,dark?C.pale:C.muted);}
function cropImage(im,box,crop,iw=1920,ih=1032){
 const [a,b,c,d]=crop; const scale=Math.min(box.w/(c-a),box.h/(d-b));
 im.position={left:box.x,top:box.y,width:(c-a)*scale,height:(d-b)*scale};im.fit='cover';im.crop={left:a/iw,top:b/ih,right:(iw-c)/iw,bottom:(ih-d)/ih};im.geometry='rect';
}
async function photo(s,file,box,alt){s.images.add({blob:await fs.readFile(path.join(root,file)),contentType:'image/jpeg',alt,fit:'cover',position:{left:box.x,top:box.y,width:box.w,height:box.h},geometry:'rect'});}
// 01 — Minimal photographic cover.
{
 const s=page(0,true);const logo=s.images.items[0];logo.position={left:56,top:35,width:196,height:106};
 await photo(s,'public/media/78c6f97a9f7e7c1c-1600.jpg',{x:734,y:0,w:546,h:720},'Foto asli kegiatan pondok, sumber foto Beranda website An-Nahl');
 tx(s,'PELATIHAN TIM ADMIN',58,208,620,32,20,C.lightGold,true);
 tx(s,'Kelola website\nAn-Nahl',52,266,650,196,76,C.white,true);
 tx(s,'Bagikan kegiatan.\nJaga informasi tetap terbaru.',58,494,610,94,31,C.pale);
 tx(s,'10 slide  /  ±40 menit  /  Demo & latihan',58,651,640,38,23,C.pale);
 s.speakerNotes.text+='\n\nFoto sampul asli: public/media/78c6f97a9f7e7c1c-1600.jpg, dirujuk src/data/photos.js sebagai foto Beranda.';
}
// 02 — Interface-led overview with a compact role comparison.
{
 const s=page(1);head(s,'RUANG KERJA','Kenali panel pengurus');
 cropImage(s.images.items[0],{x:56,y:217,w:790,h:405},[5,82,1900,1024]);
 tx(s,'Penulis',888,222,335,50,34,C.ink,true);
 tx(s,'Menyiapkan dan mengedit\ndraft berita miliknya.',888,284,335,100,27,C.muted);
 tx(s,'Admin',888,422,335,50,34,C.ink,true);
 tx(s,'Meninjau, menerbitkan,\ndan mengelola kiriman.',888,484,335,100,27,C.muted);
 tx(s,'Mulai dari Ringkasan, lalu pilih tugas di menu kiri.',56,633,1050,40,25,C.muted);
}
// 03 — Dark slide makes the login screenshot and steps prominent.
{
 const s=page(2,true);head(s,'AKSES AKUN','Masuk dan mulai bekerja',true);
 step(s,'01','Buka /login.html','Tambahkan pada domain website.',56,220,680,true);
 step(s,'02','Masukkan email dan password','Gunakan akun pengurus yang diberikan.',56,352,680,true);
 step(s,'03','Periksa nama dan peran','Pastikan mode demo atau produksi.',56,484,680,true);
 cropImage(s.images.items[0],{x:820,y:203,w:404,h:454},[1195,325,1600,790]);
 tx(s,'Latihan di produksi cukup disimpan sebagai draft.',56,634,710,42,24,C.lightGold);
}
// 04 — Large editor, clear three-step hierarchy.
{
 const s=page(3);head(s,'KONTEN / BERITA','Berita kegiatan');
 step(s,'01','Tulis cerita yang jelas','Isi judul, kategori, kegiatan, waktu,\ntempat, dan orang yang terlibat.',56,220,650);
 step(s,'02','Tambahkan foto → Pratinjau','Baca ulang sebelum disimpan.',56,365,650);
 step(s,'03','Simpan draft atau terbitkan','Draft belum tampil. Admin menerbitkan.',56,497,650);
 cropImage(s.images.items[0],{x:765,y:174,w:459,h:489},[610,126,1295,982]);
 tx(s,'Setelah terbit, cek kembali halaman publik.',56,645,680,34,23,C.muted);
}
// 05 — Reverse layout: the photo editor anchors the left.
{
 const s=page(4);head(s,'KONTEN / GALERI','Foto dan video kegiatan');
 cropImage(s.images.items[0],{x:56,y:196,w:406,h:447},[620,180,1300,930]);
 tx(s,'Foto unggahan',538,213,685,52,36,C.ink,true);
 tx(s,'Tambah foto → judul & kategori\n→ pilih foto → Simpan foto',538,280,685,112,31,C.muted);
 tx(s,'Video',538,428,685,52,36,C.ink,true);
 tx(s,'Tautan YouTube → Simpan video',538,495,685,60,31,C.muted);
 tx(s,'Galeri langsung disimpan, tanpa tahap draft.',538,605,685,62,26,C.gold,true);
}
// 06 — Wide screenshot with the publishing sequence alongside.
{
 const s=page(5,true);head(s,'ISI WEBSITE','Perbarui informasi halaman',true);
 cropImage(s.images.items[0],{x:56,y:215,w:818,h:430},[380,270,1765,1010]);
 tx(s,'01  Pilih halaman',914,218,310,48,28,C.lightGold,true);
 tx(s,'02  Edit bagian',914,293,310,48,28,C.white,true);
 tx(s,'03  Simpan draft\n      & Pratinjau',914,368,310,88,28,C.white,true);
 tx(s,'04  Terbitkan\n      perubahan',914,483,310,88,28,C.white,true);
 tx(s,'Cek desktop dan ponsel.\nTerbitkan tiap halaman.',914,602,310,65,24,C.pale);
 tx(s,'Program, biaya, kontak, rekening, dan QRIS resmi.',56,653,810,32,23,C.pale);
}
// 07 — Editorial columns, without simulated interface cards.
{
 const s=page(6);head(s,'KIRIMAN PENGUNJUNG','Pesan dan rekap');
 const items=[
  [56,'01','Pesan kontak','Baca di Pesan masuk.\nHubungi pengirim,\nlalu simpan status.','Status tidak otomatis\nmengirim balasan.'],
  [458,'02','Pendaftaran','Buka Google Sheets.\nCek data dan lampiran,\nlalu hubungi wali.','Gunakan akun Google\nyang diberi akses.'],
  [860,'03','Donasi','Buka Google Sheets.\nCocokkan konfirmasi\ndengan dana masuk.','Ekspor Excel tersedia\nuntuk salinan rekap.']
 ];
 for(const [x,n,title,body,note]of items){tx(s,n,x,195,345,115,91,C.gold,true);tx(s,title,x,336,345,54,34,C.ink,true);tx(s,body,x,410,345,135,28,C.ink);tx(s,note,x,589,345,74,24,C.muted);}
}
// 08 — Account settings above, recovery guidance below.
{
 const s=page(7);head(s,'AKUN & PEMULIHAN','Akses dan riwayat');
 tx(s,'Peran dan status aktif',56,211,530,55,34,C.ink,true);
 tx(s,'Admin mengatur akses pengurus lain.\nAkun baru dibantu pengelola teknis.\nIzin Google diatur terpisah.',56,283,530,155,28,C.muted);
 cropImage(s.images.items[0],{x:650,y:210,w:574,h:270},[590,380,1333,730]);
 tx(s,'Berita terhapus',56,537,355,48,29,C.ink,true);tx(s,'Arsip → pulihkan ke draft\n→ cek → terbitkan lagi',56,594,355,78,25,C.muted);
 tx(s,'Isi halaman',458,537,355,48,29,C.ink,true);tx(s,'Pulihkan riwayat\nsebagai draft, lalu tinjau.',458,594,355,78,25,C.muted);
 tx(s,'Foto dan video',860,537,355,48,29,C.ink,true);tx(s,'Galeri tidak memiliki Arsip.\nPeriksa sebelum menghapus.',860,594,355,78,25,C.muted);
}
// 09 — Workshop moment with an original activity photograph.
{
 const s=page(8,true);
 await photo(s,'public/media/efc3c76e6e6f427e-1600.jpg',{x:785,y:0,w:495,h:720},'Foto asli program Quran pondok, sumber foto halaman Program An-Nahl');
 tx(s,'SEKARANG GILIRAN KALIAN',56,45,685,34,20,C.lightGold,true);
 tx(s,'Latihan\nberita kegiatan',52,111,700,160,62,C.white,true);
 tx(s,'7',54,294,110,121,108,C.lightGold,true);tx(s,'menit',171,359,420,50,33,C.pale);
 tx(s,'“Latihan: Kegiatan Tahfidz Pagi”',56,446,685,55,31,C.white,true);
 tx(s,'Tulis 2 paragraf → foto jika ada → Pratinjau\nSimpan draft → minta teman mengecek',56,518,685,108,28,C.pale);
 tx(s,'Kategori Keagamaan. Terbitkan latihan hanya di demo.',56,651,695,44,22,C.lightGold);
 s.speakerNotes.text+='\n\nFoto latihan asli: public/media/efc3c76e6e6f427e-1600.jpg, dirujuk src/data/photos.js sebagai foto Program.';
}
// 10 — A concise close built around the team's working routine.
{
 const s=page(9,true);head(s,'KEBIASAAN KERJA TIM','Siap mengelola bersama',true);
 const flow=[['01','Periksa'],['02','Perbarui'],['03','Simpan'],['04','Cek publik']];
 for(const [i,[n,t]]of flow.entries()){const x=56+i*301;tx(s,n,x,238,280,110,78,C.lightGold,true);tx(s,t,x,361,280,72,38,C.white,true);}
 tx(s,'Cek nama, tanggal, foto, dan tautan sebelum terbit.\nSepakati penulis, peninjau, dan penanggung jawab rekap.',56,492,1168,108,29,C.pale);
 tx(s,'Simpan pekerjaan. Keluar dari akun. Gunakan manual saat perlu.',56,633,1100,42,25,C.lightGold);
}
// Confirm no presenter notes were lost when restyling the imported deck.
if(deck.slides.items.length!==10)throw new Error('Expected ten slides');
for(const[i,s]of deck.slides.items.entries())if(!s.speakerNotes.text.includes(notesBefore[i]))throw new Error('Speaker notes were altered');
const candidatePath=path.join(base,'redesign-candidate.pptx');
await(await PresentationFile.exportPptx(deck)).save(candidatePath);
// Render the exported file, not just the in-memory editing state.
const exported=await PresentationFile.importPptx(await FileBlob.load(candidatePath));
for(const[i,s]of exported.slides.items.entries()){
 const blob=await exported.export({slide:s,format:'png',scale:1});await fs.writeFile(path.join(renders,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await blob.arrayBuffer()));
}
const{finalizePresentation}=await import(pathToFileURL(path.join(SKILL_DIR,'container_tools/artifact_tool_utils.mjs')).href);
const originalLink=fs.link.bind(fs);
fs.link=async(a,b)=>{try{return await originalLink(a,b);}catch(e){if(process.platform!=='win32'||e.code!=='EPERM')throw e;return fs.copyFile(a,b,fsConstants.COPYFILE_EXCL);}};
const finalPath=path.join(root,'output/presentations/Pelatihan_Admin_An-Nahl_Desain_Baru.pptx');
const result=await finalizePresentation({workspaceDir:root,candidatePath,finalPath,pythonExecutable:runtime+'/python/python.exe',
 integrityValidatorPath:SKILL_DIR+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:SKILL_DIR+'/container_tools/inspect_presentation_layout_geometry.py',
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],explicitTotalSlideCount:10,
 requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'design',families:[FONT]},verifyArtifactToolImport:true,
 receiptPath:path.join(base,'redesign-validation.json')});
console.log(JSON.stringify({finalPath,sha256:result.finalSha256,slides:10,notesPreserved:true}));
