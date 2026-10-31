import fs from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Presentation, PresentationFile } from 'file:///C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs';
process.env.RUNTIME_NODE_MODULES = 'C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';

const buildDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(buildDir, '../../..');
const shots = path.join(root, 'output/pdf/screenshots');
const SKILL_DIR = 'C:/Users/kamik/.codex/plugins/cache/openai-primary-runtime/presentations/26.1026.10807/skills/presentations';
const RUNTIME_PYTHON = 'C:/Users/kamik/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const C = { green:'#166534', dark:'#143D28', ink:'#253E30', muted:'#52665A', light:'#F2F7EE', white:'#FFFFFF' };
const FONT = 'Arial';
const imageDimensions=JSON.parse(await fs.readFile(path.join(buildDir,'image-dimensions.json'),'utf8'));
let current = 0;

function text(s, content, x, y, w, h, size=28, color=C.ink, bold=false) {
  const shape = s.shapes.add({geometry:'textbox', name:content.slice(0,60), position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
  shape.text = content;
  shape.text.style = {typeface:FONT,fontSize:size,color,bold,verticalAlignment:'top',alignment:'left',wrap:'square',insets:0};
  return shape;
}
function slide(title, dark=false) {
  const s = presentation.slides.add(); ++current;
  s.background.fill=dark?C.green:C.white;
  if(title)text(s,title,64,48,1152,108,46,dark?C.white:C.dark,true);
  text(s,String(current).padStart(2,'0')+' / 10',1130,672,90,24,18,dark?'#D6E6D2':C.muted);
  return s;
}
async function image(s, filename, x,y,maxW,maxH,crop=null,alt='') {
  const full=filename.startsWith('logo:')?path.join(root,'public/brand/an-nahl.png'):path.join(shots,filename+'.png');
  const bytes=await fs.readFile(full);
  const meta=imageDimensions[filename.startsWith('logo:')?'an-nahl':filename];
  const iw=meta.width,ih=meta.height;
  const [x0,y0,x1,y1]=crop || [0,0,iw,ih];
  const scale=Math.min(maxW/(x1-x0),maxH/(y1-y0));
  const width=(x1-x0)*scale,height=(y1-y0)*scale;
  s.images.add({blob:bytes,contentType:meta.format==='jpeg'?'image/jpeg':'image/png',alt:alt||filename,fit:'cover',crop:{left:x0/iw,top:y0/ih,right:(iw-x1)/iw,bottom:(ih-y1)/ih},position:{left:x,top:y,width,height},geometry:'rect'});
  return {width,height};
}
function notes(s, part, script) {
  s.speakerNotes.text=script+'\n\nSumber: Panduan_Pengguna_An-Nahl_2026-10-30.pdf, '+part+'. Screenshot diambil dari proyek lokal tanggal 30 Oktober 2026. Tampilan pengurus memakai mode demo; data produksi tidak ditampilkan.';
}
function section(s,title,body,y,w=570){text(s,title,64,y,w,43,30,C.green,true);text(s,body,64,y+48,w,90,27);}

// 1 - Cover: use the original logo, with editable foreground text.
{
  const s=slide(null,true);
  await image(s,'logo:',64,50,210,114,null,'Logo asli An-Nahl');
  text(s,'Website An-Nahl',64,232,1130,100,72,C.white,true);
  text(s,'Panduan singkat penggunaan',66,345,1080,65,38,C.white);
  text(s,'Untuk pengunjung dan pengurus pondok',66,450,1000,60,29,'#E0EDDC');
  text(s,'Berdasarkan manual 30 Oktober 2026',66,617,900,32,22,'#D6E6D2');
  notes(s,'pengantar dan bagian 1-2','Website ini membantu orang mengenal pondok, mendaftar, berdonasi, dan menghubungi pengurus. Pengurus memakai ruang khusus untuk memperbarui informasi dan menangani kiriman. Presentasi ini merangkum cara pakai; langkah rinci tetap tersedia di manual PDF.');
}
// 2 - Public pages.
{
  const s=slide('Fitur untuk pengunjung');
  text(s,'Bisa digunakan tanpa login',64,153,1150,48,30,C.green,true);
  text(s,'Kenali pondok\nBeranda, Tentang, Program',64,255,450,112,30);
  text(s,'Ikuti kegiatan\nBerita dan Galeri',64,395,450,110,30);
  text(s,'Daftar, berdonasi,\natau hubungi pengurus',64,535,450,100,30);
  await image(s,'01-beranda',545,226,670,420,[5,82,1904,976],'Beranda dan menu utama website');
  notes(s,'bagian 2-3','Tunjukkan menu atas pada screenshot. Beranda memberi ringkasan, Tentang menjelaskan profil, dan Program berisi pilihan pendidikan. Berita serta Galeri memperlihatkan kegiatan. Pendaftaran, Donasi, dan Kontak membantu pengunjung mengambil langkah berikutnya. Di ponsel, menu dibuka lewat ikon tiga garis.');
}
// 3 - Registration.
{
  const s=slide('Daftar santri baru');
  text(s,'1  Buka Pendaftaran',64,194,500,55,31,C.green,true);
  text(s,'2  Isi data santri dan wali',64,285,500,88,31);
  text(s,'3  Pilih program dan lampiran',64,386,500,90,31);
  text(s,'4  Kirim, lalu tunggu hasilnya',64,491,500,90,31);
  await image(s,'05-pendaftaran-data',640,180,570,407,[590,475,1320,1010],'Bagian isian data calon santri');
  text(s,'Lampiran opsional: maks. 3 berkas, 2 MB per berkas, 5 MB total',64,615,1120,42,23,C.muted);
  notes(s,'bagian 4','Minta peserta memastikan nama, tanggal lahir, asal sekolah, program, alamat, dan nomor WhatsApp wali sudah benar. Lampiran menerima JPG, PNG, WebP, PDF, DOCX, XLSX, atau PPTX. Setelah klik Kirim Pendaftaran, tunggu pemberitahuan. Pengiriman berhasil belum berarti calon santri diterima. Jika gagal, periksa pesan dan coba kembali dari halaman yang sama; tidak ada pelacakan pendaftaran mandiri.');
}
// 4 - Reading news and media.
{
  const s=slide('Berita dan galeri');
  text(s,'Berita',64,190,420,50,34,C.green,true);
  text(s,'Pilih kategori, lalu buka artikel\nuntuk membaca kabar lengkap.',64,247,460,140,29);
  text(s,'Galeri',64,416,420,50,34,C.green,true);
  text(s,'Klik foto untuk memperbesar.\nPutar video kegiatan dari YouTube.',64,475,460,140,29);
  await image(s,'08-galeri-publik',550,230,665,355,[370,410,1540,956],'Kategori dan foto pada Galeri publik');
  notes(s,'bagian 5-6','Berita dapat difilter menurut Akademik, Keagamaan, Sosial, dan Pengumuman. Foto memiliki kategori tersendiri. Klik foto untuk memperbesar lalu tutup dengan tanda silang atau Esc. Tombol muat lainnya muncul jika masih ada hasil. Filter foto tidak menyaring video, dan pemutaran video memerlukan koneksi YouTube.');
}
// 5 - Donation + contact, with a cropped form and no transfer numbers.
{
  const s=slide('Donasi dan kontak');
  section(s,'Donasi','Pilih program dan metode bayar.\nSetelah membayar, kirim konfirmasi\nbeserta bukti jika ada.',190,680);
  text(s,'Konfirmasi tetap diperiksa pengurus',64,385,680,65,27,C.green,true);
  section(s,'Kontak','Gunakan telepon, WhatsApp, email,\nformulir pesan, atau peta lokasi.',478,680);
  await image(s,'12-donasi-konfirmasi',850,166,365,450,[645,160,1260,926],'Formulir konfirmasi donasi');
  notes(s,'bagian 7-8','Metode donasi meliputi transfer bank, e-wallet, dan QRIS jika kode resmi tersedia. Pembayaran dilakukan lewat aplikasi bank atau e-wallet; website berisi petunjuk dan konfirmasi. Notifikasi diterima belum membuktikan dana telah masuk. Jika konfirmasi gagal, jangan membayar ulang hanya karena formulir gagal. Kontak juga menyediakan media sosial. Formulir pesan bukan chat langsung; balasan ditindaklanjuti lewat kontak pengirim.');
}
// 6 - Permissions + login.
{
  const s=slide('Akses pengunjung dan pengurus');
  section(s,'Pengunjung','Baca informasi dan gunakan formulir.',184,660);
  section(s,'Penulis','Buat dan edit draft berita miliknya.',322,660);
  section(s,'Admin','Terbitkan konten, kelola rekap dan akun.',460,660);
  await image(s,'14-login',840,180,375,420,[1195,325,1600,790],'Form login Ruang Pengurus');
  text(s,'Pengurus masuk melalui /login.html',64,619,1120,38,25,C.green,true);
  notes(s,'bagian 2 dan 9','Akun produksi menggunakan email pengurus aktif. Login tidak ada di navigasi publik; buka /login.html langsung. Aktivasi melalui tautan undangan memakai password baru minimal 10 karakter. Jika lupa password atau undangan kedaluwarsa, hubungi pengelola. Admin mengatur peran dan status aktif pengurus lain. Izin akun website berbeda dari izin Google Sheets atau Drive.');
}
// 7 - Editorial workflow.
{
  const s=slide('Buat dan terbitkan berita');
  section(s,'1  Tulis berita','Isi judul, kategori, cerita, dan foto.',187,610);
  section(s,'2  Lihat Pratinjau','Cek tulisan dan foto sebelum disimpan.',325,610);
  section(s,'3  Simpan atau terbitkan','Draft belum tampil. Admin menerbitkan.',463,610);
  await image(s,'16-editor-berita',817,166,398,461,[610,126,1295,982],'Editor berita berisi tulisan latihan');
  text(s,'Berita yang dihapus masuk Arsip dan dapat dipulihkan ke draft.',64,621,1150,34,23,C.muted);
  notes(s,'bagian 10-13','Contoh pada layar adalah mode demo. Penulis menyiapkan draft miliknya; Admin meninjau dan menerbitkan. Gunakan pencarian, filter kategori, dan status untuk menemukan berita. Salinan browser membantu memulihkan teks, tetapi foto baru perlu dipilih ulang. Berita yang diarsipkan kembali sebagai draft. Riwayat dapat memuat kembali teks versi lama; foto saat ini tetap dipakai.');
}
// 8 - Website and media management.
{
  const s=slide('Kelola foto dan isi website');
  text(s,'Galeri',64,195,470,48,33,C.green,true);
  text(s,'Tambah foto dari perangkat\natau Drive. Untuk video,\ngunakan tautan YouTube.',64,252,470,160,29);
  text(s,'Isi website',64,446,470,48,33,C.green,true);
  text(s,'Edit bagian → simpan draft\n→ cek pratinjau → terbitkan.',64,505,470,110,29);
  await image(s,'25-cms-bagian',550,210,665,356,[380,270,1765,1010],'Editor halaman dengan kontrol draft, pratinjau, dan penerbitan');
  text(s,'Pratinjau tersedia untuk desktop dan ponsel',550,582,665,65,25,C.green,true);
  notes(s,'bagian 14-18','Admin mengelola foto dan video serta sembilan pilihan halaman, termasuk identitas/footer/WhatsApp. QRIS resmi dipasang melalui Informasi donasi. Bagian tertentu dapat disembunyikan lalu dipulihkan; perubahan baru tampil setelah diterbitkan. Foto sumber maksimal 12 MB dan dioptimalkan; format interaktif JPG, PNG, WebP, GIF. Foto folder tidak dihapus lewat browser. Postingan galeri yang dihapus tidak memiliki Arsip. Riwayat halaman dapat dipulihkan sebagai draft. Jika versi berubah karena diedit pengurus lain, tinjau versi terbaru sebelum menyimpan.');
}
// 9 - Inboxes, recap and member access.
{
  const s=slide('Pesan, rekap, dan akun pengurus');
  section(s,'Pesan masuk','Baca pesan, tindak lanjuti,\nlalu ubah statusnya.',180,530);
  section(s,'Rekap pendaftaran dan donasi','Buka Google Sheets yang diizinkan.\nCocokkan bukti donasi dengan transfer.',360,530);
  text(s,'Rekap donasi dapat diunduh\nsebagai Excel (.xlsx).',64,559,530,85,26,C.green,true);
  await image(s,'32-akun-pengurus',642,222,573,270,[590,380,1333,730],'Contoh pengaturan peran dan status aktif akun demo');
  text(s,'Akun pengurus',642,519,573,48,31,C.green,true);
  text(s,'Admin mengatur peran dan status aktif.\nHak akses Google diatur terpisah.',642,576,573,80,26);
  notes(s,'bagian 19-23','Pesan kontak dibaca di panel website dan memiliki status baru, diproses, atau selesai. Pendaftaran dan konfirmasi donasi dikelola di Google Sheets akun pondok. Periksa isian dan lampiran sebelum menindaklanjuti. Ekspor Excel merupakan rekap kerja, bukan laporan keuangan yang sudah diaudit, dan dapat berisi tab pendaftaran serta donasi. Akun baru disiapkan pengelola teknis. Screenshot akun memakai data demo.');
}
// 10 - Operational close, no redundant thank-you slide.
{
  const s=slide('Sebelum selesai');
  text(s,'1   Cek teks, foto, dan informasi penting',64,195,1150,70,34);
  text(s,'2   Simpan draft atau terbitkan sesuai kebutuhan',64,295,1150,70,34);
  text(s,'3   Buka ulang halaman publik untuk mengecek hasil',64,395,1150,70,34);
  text(s,'4   Keluar dari akun di perangkat bersama',64,495,1150,70,34);
  text(s,'Butuh langkah lebih detail? Gunakan manual PDF.',64,610,1130,50,28,C.green,true);
  notes(s,'bagian 24-27','Jika ada kendala, baca pesan yang muncul, periksa koneksi, lalu gunakan tabel pemecahan masalah pada manual. Jangan menganggap draft sudah tampil di publik. Keberhasilan demo tidak membuktikan penyimpanan produksi. Untuk bantuan, catat menu, waktu, tindakan terakhir, dan pesan kendala tanpa membagikan password atau data pribadi pendaftar.');
}

await fs.mkdir(path.join(buildDir,'renders'),{recursive:true});
for(const [i,s] of presentation.slides.items.entries()) {
  const blob=await presentation.export({slide:s,format:'png',scale:1});
  await fs.writeFile(path.join(buildDir,'renders',`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await blob.arrayBuffer()));
}
const candidatePath=path.join(buildDir,'candidate.pptx');
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);
const { finalizePresentation }=await import(pathToFileURL(path.join(SKILL_DIR,'container_tools/artifact_tool_utils.mjs')).href);
const finalPath=path.join(root,'output/presentations/Presentasi_Website_An-Nahl_10_Slide.pptx');
// This workspace filesystem rejects hard links. Keep exclusive publication and
// the finalizer's byte-hash verification while using a regular copy on Windows.
const originalLink = fs.link.bind(fs);
fs.link = async (source, destination) => {
  try { return await originalLink(source, destination); }
  catch (error) {
    if (process.platform !== 'win32' || error.code !== 'EPERM') throw error;
    return fs.copyFile(source, destination, fsConstants.COPYFILE_EXCL);
  }
};
const result=await finalizePresentation({workspaceDir:root,candidatePath,finalPath,pythonExecutable:RUNTIME_PYTHON,
  integrityValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_package_integrity.py'),
  layoutValidatorPath:path.join(SKILL_DIR,'container_tools/inspect_presentation_layout_geometry.py'),
  layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],
  explicitTotalSlideCount:10,requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],
  fontPolicy:{basis:'design',families:[FONT]},verifyArtifactToolImport:true,
  receiptPath:path.join(buildDir,'validation.json')});
console.log(JSON.stringify({finalPath,slides:presentation.slides.items.length,result}));
