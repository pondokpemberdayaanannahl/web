# Mengelola isi website melalui akun pondok

## Yang disiapkan pada pembaruan ini

- Ringkasan pengurus memiliki kotak buat postingan dan tindakan cepat berita,
  foto, video, serta edit website. Daftar berita menjadi kartu berisi sampul,
  judul, kategori, tanggal, status, dan tindakan lihat/edit/arsip.
- Menu **Isi website** mencakup beranda, tentang pondok, program, informasi
  pendaftaran, informasi donasi, kontak/lokasi, pengantar berita/galeri, serta
  menu/footer/WhatsApp. Setiap bagian tampil sebagai kartu.
- Admin bisa mengubah judul, teks, foto, tautan, rekening yang ditampilkan,
  biaya, jadwal, angka statistik, dan tautan sematan peta. Bagian informasi
  tertentu dapat disembunyikan tanpa menghapusnya. Struktur menu dan formulir
  tetap berasal dari kode agar isian dan pengiriman formulir tidak rusak.
- Foto dapat dipilih dari 149 dokumentasi lokal atau diunggah baru. Unggahan
  dioptimalkan sebelum dikirim. Foto lama dipertahankan untuk riwayat halaman.
- Ada draft, salinan teks lokal, pratinjau desktop/ponsel, penerbitan,
  pemeriksaan perubahan bersamaan, serta pemulihan riwayat sebagai draft.
- Pengurus admin yang membuka website publik akan melihat **Edit halaman ini**.
  Penulis biasa tetap mengelola draft berita sesuai hak akses sebelumnya.
- Tautan Instagram, Facebook, dan YouTube yang diberikan pengguna sudah
  dipasang di footer dan halaman Kontak. Ikon Twitter tanpa tujuan dihapus.
- Halaman publik dimuat sesuai kebutuhan. Editor dan katalog foto tidak ikut
  dimuat oleh pengunjung. Konten terbit dibaca satu kali saat website dibuka;
  kegagalan layanan mempertahankan isi bawaan dan tidak mengosongkan halaman.

## Status

Kode dan migrasi sudah disiapkan di proyek lokal. Tidak ada push ke repository
produksi atau penerapan migrasi Supabase yang dilakukan oleh agen untuk
pembaruan ini. Setelah memasang pembaruan, jalankan migrasi di bawah agar
menu Isi website bisa menyimpan perubahan. Berita/galeri yang sudah ada tidak
dipindahkan atau dihapus. Tanpa migrasi, website tetap memakai isi awal dan
pengelola halaman akan menjelaskan bahwa layanan belum diaktifkan.

Pemeriksaan browser lokal dilakukan dengan izin pengguna dan akun demo: desktop
1280 piksel, ponsel 390 dan 320 piksel. Alur ubah judul, pilih foto pondok, simpan
draft, pratinjau, dan terbitkan demo berhasil. Tombol akun yang sempat menumpuk
dengan menu pada 320 piksel sudah diperbaiki. Halaman publik, navigasi program/
pendaftaran, isian formulir, dan tiga ikon sosial diperiksa. Tidak ada kiriman
Google nyata atau penyimpanan CMS pada Supabase produksi yang diuji.

## Pemasangan sekali

1. Backup website dan database yang ada.
2. Buka proyek Supabase **an-nahl**, lalu SQL Editor. Jalankan isi
   `supabase/migrations/202610270003_site_content.sql`. Migrasi ini membutuhkan
   migrasi editorial pertama yang sudah terpasang. Tidak perlu menjalankan
   ulang migrasi pertama atau mengaktifkan migrasi Google untuk langkah ini.
3. Salin pembaruan proyek ke repository `pondokpemberdayaanannahl/web` seperti
   alur biasa. Pastikan `package.json`, `package-lock.json`, seluruh file
   `src/site-*.js`, stylesheet baru, `src/public-editor-shortcut.js`, perubahan
   halaman/admin, dan pengujian ikut tersalin. Paket pembaruan disediakan
   terpisah tanpa `.env` atau konfigurasi privat Google.
4. Push ke `main`, tunggu **Build untuk Hostinger** berhasil. Hostinger tetap
   mengambil cabang `hostinger` ke `public_html`.
5. Masuk dengan akun pondok. Pilih Isi website → Beranda → Edit bagian.
   Ubah teks uji, pilih Simpan draft, dan pastikan website publik masih sama.
   Terbitkan setelah ditinjau, muat ulang website, lalu pastikan perubahan
   muncul. Gunakan riwayat untuk memulihkan teks semula sebagai draft dan
   terbitkan lagi. Jangan membuat data uji pada konten nyata tanpa menandainya.

## Cara memakai

1. Pilih halaman pada menu **Isi website**.
2. Klik **Edit bagian** pada kartu yang ingin diperbarui.
3. Isi teks atau pilih foto, lalu klik **Selesai mengedit**.
4. Pilih **Pratinjau** untuk meninjau tampilan desktop atau ponsel. Pratinjau
   tidak menjalankan formulir; foto baru yang belum disimpan belum tampil.
5. Pilih **Simpan draft** jika belum selesai. Pilih **Terbitkan perubahan**
   jika sudah siap. Muat ulang website publik untuk melihat versi terbaru.

Salinan lokal hanya menyimpan teks dan tautan. Berkas foto baru tetap berada
di memori sampai disimpan. Jika halaman dimuat ulang sebelum penyimpanan,
foto perlu dipilih kembali. Riwayat penerbitan hanya dapat dibaca admin aktif.
Jika pengurus lain mengubah halaman yang sama, penyimpanan ditolak sampai
versi terbaru ditinjau; teks di editor tetap tersedia.

Kunci bidang dikaitkan dengan struktur dan isi bawaan sumber halaman. Bila
pengembang mengganti struktur/template atau teks bawaan pada kode, tinjau
ulang halaman terkait: bidang yang sudah tidak cocok diabaikan agar perubahan
lama tidak diterapkan ke tempat yang salah. Untuk perubahan isi sehari-hari,
gunakan Isi website agar tidak perlu push kode.

## Pendaftaran yang belum masuk

Pada pemeriksaan langsung 27 Oktober 2026, endpoint domain
`/api/forms.php` membalas HTTP **503** dengan pesan **Formulir sedang
disiapkan. Silakan hubungi pengurus melalui WhatsApp.** Pemeriksaan hanya
mengambil status; tidak mengirim data pendaftar.

Ini menunjukkan konfigurasi privat penerima belum tersedia/lengkap. File
website yang diambil dari GitHub memang tidak membawa konfigurasi tersebut.
Menambah tabel Supabase atau push ulang frontend tidak mengaktifkan penghubung.

Ada tabel lama `form_submissions` pada migrasi Supabase, tetapi alur baru
pendaftaran dan konfirmasi donasi memakai Google Sheets serta Drive akun
pondok. Isi formulir dikirim hanya setelah penerima siap dan dinyatakan
berhasil hanya setelah mendapat tanda terima yang sesuai. Panel pengurus
sekarang memeriksa ketersediaan penerima dan menampilkan kegagalan tersebut.
Token penerima tersedia belum membuktikan bahwa kiriman sudah masuk Google;
tetap lakukan uji kirim setelah pemasangan lengkap.

Untuk mengaktifkannya diperlukan:

1. Pasang dan beri izin pada kode Apps Script baru sebagai akun pondok,
   jalankan `setupGoogleForms`, lalu `checkGoogleFormsSetup`.
2. Deploy sebagai Web app dan ambil URL yang berakhir `/exec`.
3. Isi URL tersebut dalam konfigurasi privat, dengan kunci yang sama seperti
   properti Apps Script. Pasang pada `annahl-private/forms-config.php`,
   **sejajar dengan public_html**, bukan di dalamnya atau di GitHub.
4. Uji data rekaan dengan foto/PDF, pastikan baris dan tautan berkas benar,
   lalu bersihkan hanya data uji. Jangan menyatakan integrasi aktif sebelum
   pengiriman Google sesungguhnya berhasil.

Panduan rinci ada di [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md).
Aktivasi akun Google/Hostinger belum dilakukan dalam pembaruan ini.

## Pemeriksaan pengembangan

```sh
npm test
npm run build
npm run hostinger:check
```

Uji PostgreSQL lokal tambahan pada workspace yang memiliki runtime PGlite:

```sh
npm run test:site-db
npm run test:private-config
```

Migrasi CMS memakai kebijakan baris dan fungsi penyimpanan yang memeriksa
admin aktif di server. Pengunjung hanya membaca versi terbit. Penulis biasa
tidak bisa membaca draft halaman atau memanggil penerbitan CMS. Teks tidak
dianggap HTML; tautan/foto divalidasi dan pratinjau dibatasi melalui iframe.
Lihat [Row Level Security Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).
