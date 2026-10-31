import fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from 'file:///C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
import { training } from './training-content.mjs';
process.env.RUNTIME_NODE_MODULES = 'C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const buildDir=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(buildDir,'../../..');
const SKILL_DIR='C:/Users/kamik/.codex/plugins/cache/openai-primary-runtime/presentations/26.1026.10807/skills/presentations';
const RUNTIME_PYTHON='C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const out=path.join(root,'output/presentations');
const renderDir=path.join(buildDir,'training-renders');
await fs.mkdir(out,{recursive:true}); await fs.mkdir(renderDir,{recursive:true});
const dimensions=JSON.parse(await fs.readFile(path.join(buildDir,'image-dimensions.json'),'utf8'));
const deck=Presentation.create({slideSize:{width:1280,height:720}});
const C={green:'#166534',dark:'#143D28',ink:'#253E30',muted:'#52665A',white:'#FFFFFF'};
const FONT='Arial';
function text(s,content,x,y,w,h,size=28,color=C.ink,bold=false){
  const sh=s.shapes.add({geometry:'textbox',name:content.slice(0,65),position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
  sh.text=content; sh.text.style={typeface:FONT,fontSize:size,color,bold,verticalAlignment:'top',alignment:'left',wrap:'square',insets:0};
  return sh;
}
function slide(index,dark=false){
  const s=deck.slides.add(); s.background.fill=dark?C.green:C.white;
  if(index)text(s,training[index].title,64,48,1152,108,46,C.dark,true);
  text(s,String(index+1).padStart(2,'0')+' / 10',1130,672,90,24,18,dark?'#D6E6D2':C.muted);
  const d=training[index];
  s.speakerNotes.text=`SLIDE ${index+1}: ${d.title}\nDURASI: ${d.time} menit\n\nUCAPKAN\n${d.say}\n\nDEMO / CARA MENYAMPAIKAN\n${d.demo.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\nTANYAKAN\n${d.ask}\n\nJAWABAN / ARAHAN\n${d.answer}\n\nTRANSISI\n${d.transition}\n\nSUMBER\nPanduan_Pengguna_An-Nahl_2026-10-30.pdf, ${d.source}. Screenshot lokal 30 Oktober 2026; panel pengurus menggunakan data demo. Naskah pelatihan disusun 31 Oktober 2026.`;
  return s;
}
async function image(s,name,x,y,maxW,maxH,crop=null){
  const logo=name==='an-nahl';
  const bytes=await fs.readFile(logo?path.join(root,'public/brand/an-nahl.png'):path.join(root,'output/pdf/screenshots',name+'.png'));
  const m=dimensions[name]; const [x0,y0,x1,y1]=crop||[0,0,m.width,m.height];
  const scale=Math.min(maxW/(x1-x0),maxH/(y1-y0));
  s.images.add({blob:bytes,contentType:m.format==='jpeg'?'image/jpeg':'image/png',alt:name==='an-nahl'?'Logo asli An-Nahl':name+' — contoh tampilan dari manual',fit:'cover',crop:{left:x0/m.width,top:y0/m.height,right:(m.width-x1)/m.width,bottom:(m.height-y1)/m.height},position:{left:x,top:y,width:(x1-x0)*scale,height:(y1-y0)*scale},geometry:'rect'});
}
function block(s,title,body,y,w=580){text(s,title,64,y,w,44,30,C.green,true);text(s,body,64,y+51,w,105,28);}
function footer(s,content){text(s,content,64,613,1152,51,23,C.muted);}
{
 const s=slide(0,true); await image(s,'an-nahl',64,42,210,114);
 text(s,'Kelola Website An-Nahl',64,220,1152,100,65,C.white,true);
 text(s,'Pelatihan untuk tim admin',66,334,1100,65,39,C.white);
 text(s,'Perbarui informasi • Bagikan kegiatan\nTindak lanjuti kiriman',66,433,1100,112,31,'#E0EDDC');
 text(s,'10 slide • ±40 menit termasuk demo dan latihan',66,610,1100,40,25,'#D6E6D2');
}
{
 const s=slide(1);
 block(s,'Penulis','Menyiapkan dan mengedit\ndraft berita miliknya.',185,420);
 block(s,'Admin','Meninjau, menerbitkan, dan\nmengelola konten serta kiriman.',374,420);
 await image(s,'15-ringkasan-admin',535,182,680,375,[5,82,1900,1024]);
 footer(s,'Ringkasan adalah titik awal. Pilih tugas melalui menu di sebelah kiri.');
}
{
 const s=slide(2);
 text(s,'1  Buka /login.html pada domain website',64,190,700,84,31,C.green,true);
 text(s,'2  Masukkan email dan password',64,300,700,75,31);
 text(s,'3  Cek nama, peran, dan mode kerja',64,410,700,85,31);
 text(s,'Latihan memakai demo jika tersedia.\nDi produksi, berita latihan tetap draft.',64,526,710,86,28,C.green,true);
 await image(s,'14-login',840,180,375,420,[1195,325,1600,790]);
}
{
 const s=slide(3);
 block(s,'1  Isi judul, kategori, dan cerita','Jelaskan kegiatan, waktu, tempat,\ndan orang yang terlibat.',183,690);
 block(s,'2  Tambahkan foto → Pratinjau','Baca ulang dan perbaiki sebelum disimpan.',345,690);
 block(s,'3  Simpan draft atau terbitkan','Draft belum tampil. Admin menerbitkan.',493,690);
 await image(s,'16-editor-berita',817,166,398,461,[610,126,1295,982]);
 footer(s,'Setelah terbit, muat ulang halaman publik dan cek hasilnya.');
}
{
 const s=slide(4);
 block(s,'Foto unggahan','Tambah foto → isi judul dan kategori\n→ pilih foto → Simpan foto.',190,650);
 block(s,'Video','Tempel tautan YouTube yang valid,\nlalu Simpan video.',365,650);
 text(s,'Cek pilihan sebelum menyimpan.\nGaleri tidak memakai tahap draft.',64,541,650,84,28,C.green,true);
 await image(s,'22-editor-foto',815,171,400,448,[620,180,1300,930]);
}
{
 const s=slide(5);
 text(s,'Isi website → pilih halaman\n→ Edit bagian',64,187,460,95,31,C.green,true);
 text(s,'Selesai mengedit → Simpan draft\n→ Pratinjau desktop dan ponsel\n→ Terbitkan perubahan',64,327,460,165,29);
 text(s,'Contoh: program, biaya, kontak,\nrekening, dan QRIS resmi.',64,526,460,96,28);
 await image(s,'25-cms-bagian',550,210,665,356,[380,270,1765,1010]);
 text(s,'Setiap halaman diterbitkan masing-masing.',550,588,665,66,25,C.green,true);
}
{
 const s=slide(6);
 const cols=[
  {x:64,title:'Pesan kontak',lines:'Pesan masuk di panel\n\nBaca → hubungi pengirim\n→ simpan status',note:'Status selesai tidak otomatis\nmengirim balasan.'},
  {x:461,title:'Pendaftaran',lines:'Rekap pendaftaran\n→ Google Sheets\n\nPeriksa data dan lampiran,\nlalu hubungi wali.',note:'Gunakan akun Google\nyang sudah diberi akses.'},
  {x:858,title:'Donasi',lines:'Rekap donasi\n→ Google Sheets\n\nCocokkan konfirmasi\ndengan dana yang masuk.',note:'Ekspor Excel tersedia\nuntuk salinan rekap.'}
 ];
 for(const c of cols){text(s,c.title,c.x,192,355,52,33,C.green,true);text(s,c.lines,c.x,267,355,240,28);text(s,c.note,c.x,545,355,88,25,C.muted);}
}
{
 const s=slide(7);
 block(s,'Akun pengurus','Atur peran dan status aktif.\nAkun baru dibantu pengelola teknis.',180,540);
 block(s,'Berita terhapus','Arsip → Pulihkan ke draft\n→ cek → terbitkan lagi.',365,540);
 await image(s,'32-akun-pengurus',642,205,573,270,[590,380,1333,730]);
 text(s,'Isi halaman: pulihkan riwayat sebagai draft.\nGaleri tidak memiliki Arsip.',642,510,573,108,27,C.green,true);
 footer(s,'Akses Google Sheets/Drive diatur terpisah dari akses website.');
}
{
 const s=slide(8);
 text(s,'“Latihan: Kegiatan Tahfidz Pagi”',64,178,1152,60,38,C.green,true);
 text(s,'1  Pilih kategori Keagamaan dan tulis dua paragraf',64,282,1152,65,31);
 text(s,'2  Tambahkan foto jika ada → buka Pratinjau',64,375,1152,65,31);
 text(s,'3  Simpan draft → temukan lagi → minta teman mengecek',64,468,1152,85,31);
 text(s,'7 menit • Gunakan data contoh. Terbitkan latihan hanya di demo.',64,602,1152,55,25,C.muted);
}
{
 const s=slide(9);
 text(s,'Periksa kiriman → Perbarui → Simpan → Cek publik',64,181,1152,100,37,C.green,true);
 text(s,'Cek nama, tanggal, foto, dan tautan sebelum terbit.',64,320,1152,62,31);
 text(s,'Sepakati penulis, peninjau, dan penanggung jawab rekap.',64,414,1152,85,31);
 text(s,'Simpan pekerjaan dan keluar dari akun setelah selesai.',64,517,1152,70,31);
 footer(s,'Jika ada kendala, catat menu dan pesan yang muncul. Gunakan manual PDF.');
}

const guideHeader=`# Panduan Membawakan Pelatihan Admin Website An-Nahl\n\nDisusun 31 Oktober 2026, berdasarkan manual dan screenshot 30 Oktober 2026. Materi berfokus pada tim calon admin. Durasi yang disarankan **40 menit**, termasuk demo dan latihan; tambah waktu terpisah jika tanya jawab meluas.\n\n## Cara memakai paket ini\n\nBuka **Pelatihan_Admin_Website_An-Nahl_10_Slide.pptx**. Naskah per slide juga tersedia di **Notes / Catatan** PowerPoint. Gunakan Presenter View bila tersedia, dan tampilkan hanya jendela slide kepada peserta. Bacalah naskah sebagai panduan; sampaikan dengan kata-kata sendiri dan lihat peserta saat menjelaskan.\n\n## Sebelum peserta datang\n\n- Siapkan website publik dan alamat login pada dua tab. Periksa akun latihan, peran, serta ketersediaan demo. Mode demo tidak selalu tersedia di produksi; mintalah pengelola menyiapkannya terlebih dahulu.\n- Siapkan satu foto kegiatan yang boleh dipakai dan teks contoh dua paragraf. Pastikan koneksi serta tampilan proyektor terbaca.\n- Jika tidak ada demo, contoh berita di produksi cukup disimpan sebagai draft. Gunakan screenshot untuk simulasi penerbitan, galeri, dan perubahan halaman.\n- Pakai contoh data. Tutup tab yang memuat data pribadi; jangan menampilkan password, daftar pendaftar, bukti donasi, atau informasi akun pribadi di proyektor.\n- Sepakati kontak pengelola, pembagian tugas, dan aturan penerbitan yang akan diberitahukan kepada tim. Nama, alamat domain, dan kontak tidak diisi otomatis dalam materi ini.\n\n## Gaya penyampaian\n\nGunakan pola **jelaskan tujuan → tunjukkan satu langkah → minta peserta mencoba → cek hasil**. Sebutkan nama tombol sebelum mengklik. Berhenti sejenak sesudah klik agar peserta mengikuti. Hindari membaca semua teks slide. Pakai pertanyaan singkat di bawah untuk memeriksa pemahaman, bukan sekadar bertanya “sudah paham?”. Bila internet bermasalah, lanjutkan dengan screenshot lalu jelaskan bahwa penyimpanan belum dibuktikan di layanan produksi.\n\n## Alokasi waktu\n\n| Slide | Materi | Menit |\n| --- | --- | ---: |\n${training.map((d,i)=>`| ${i+1} | ${d.title} | ${d.time} |`).join('\n')}\n| | **Total** | **${training.reduce((a,d)=>a+d.time,0)}** |\n\n`;
const guide=guideHeader+training.map((d,i)=>`## Slide ${i+1} — ${d.title} (${d.time} menit)\n\n### Kalimat yang dapat disampaikan\n\n${d.say.split('\n\n').map(p=>'> '+p).join('\n\n')}\n\n### Demo dan cara membawakan\n\n${d.demo.map((x,j)=>`${j+1}. ${x}`).join('\n')}\n\n**Pertanyaan untuk peserta:** ${d.ask}\n\n**Jawaban atau arahan:** ${d.answer}\n\n**Transisi:** “${d.transition}”\n\n*Sumber fungsi: Panduan_Pengguna_An-Nahl_2026-10-30.pdf, ${d.source}.*\n\n`).join('')+`## Ukuran keberhasilan sesi\n\nPeserta dapat menunjukkan draft beritanya, menjelaskan beda draft dan terbit, menemukan lokasi pengelolaan halaman serta rekap, dan menyebutkan siapa yang meninjau konten sebelum diterbitkan. Jika ada yang belum bisa, dampingi satu contoh lagi sebelum mulai bertugas.\n\n## Jawaban singkat untuk pertanyaan umum\n\n- **Menu tidak sama?** Cek peran dan status akun; Penulis memiliki akses lebih terbatas.\n- **Lupa password atau undangan kedaluwarsa?** Hubungi pengelola untuk bantuan akun/tautan terbaru.\n- **Draft tidak muncul di publik?** Itu sesuai fungsinya. Admin perlu meninjau lalu menerbitkannya.\n- **Sudah terbit tetapi tampilan belum berubah?** Muat ulang halaman publik dan pastikan halaman yang benar telah diterbitkan.\n- **Gagal menyimpan karena versi berubah?** Pertahankan teks penting, buka versi terbaru, lalu koordinasikan perubahan dengan pengurus lain.\n- **Tidak bisa membuka Sheets/Drive?** Izin Google harus diberikan terpisah; login website saja tidak memberi akses Google.\n- **Formulir belum siap menerima kiriman?** Periksa lagi setelah pengaturan diperbaiki dan hubungi pengelola. Cek rekap yang sudah ada; indikator ini tidak membuktikan semua kiriman hilang.\n- **Foto/video terhapus?** Galeri tidak memiliki Arsip. Berita memiliki pemulihan ke draft; riwayat halaman juga dipulihkan sebagai draft.\n- **Perlu Salin foto lama?** Itu pekerjaan pemeliharaan oleh Admin setelah penghubung Drive siap. Koordinasikan dengan pengelola; tidak perlu dijalankan saat latihan dasar.\n\n## Catatan cakupan\n\nMateri ini menjelaskan fungsi berdasarkan manual lokal, bukan laporan kesiapan layanan produksi saat pelatihan berlangsung. Screenshot admin menggunakan mode demo. Manual PDF tetap menjadi rujukan untuk langkah lengkap, batas berkas, riwayat, pemeliharaan foto lama, dan pemecahan masalah.\n`;
await fs.writeFile(path.join(out,'Naskah_Pemateri_Pelatihan_Admin_An-Nahl.md'),guide,'utf8');
for(const [i,s] of deck.slides.items.entries()){
 const blob=await deck.export({slide:s,format:'png',scale:1});
 await fs.writeFile(path.join(renderDir,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await blob.arrayBuffer()));
}
const candidatePath=path.join(buildDir,'training-candidate.pptx');
await (await PresentationFile.exportPptx(deck)).save(candidatePath);
const {finalizePresentation}=await import(pathToFileURL(path.join(SKILL_DIR,'container_tools/artifact_tool_utils.mjs')).href);
const originalLink=fs.link.bind(fs);
fs.link=async(source,destination)=>{try{return await originalLink(source,destination);}catch(e){if(process.platform!=='win32'||e.code!=='EPERM')throw e;return fs.copyFile(source,destination,fsConstants.COPYFILE_EXCL);}};
const finalPath=path.join(out,'Pelatihan_Admin_Website_An-Nahl_10_Slide.pptx');
const result=await finalizePresentation({workspaceDir:root,candidatePath,finalPath,pythonExecutable:RUNTIME_PYTHON,
integrityValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_layout_geometry.py'),
layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],explicitTotalSlideCount:10,requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],
fontPolicy:{basis:'design',families:[FONT]},verifyArtifactToolImport:true,receiptPath:path.join(buildDir,'training-validation.json')});
console.log(JSON.stringify({finalPath,slideCount:10,minutes:training.reduce((a,d)=>a+d.time,0),passed:result.presentationLayout.exitCode===0,sha256:result.finalSha256}));
