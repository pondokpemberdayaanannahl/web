# Mengelola isi website melalui akun pondok

## Yang disiapkan pada pembaruan ini

- Warna utama Ruang Pengurus mengikuti contoh pengguna: **#166534**.
  Sidebar, login, tombol, editor, dan galeri memakai palet hijau yang senada.
- Login tidak ditampilkan di navigasi, footer, atau logo. Logo menuju Beranda.
  Ketik `/login.html` atau `/admin.html` langsung pada domain website. Hostinger
  juga menerima `/admin` dan `/login` melalui `.htaccess`. Halaman login dan
  panel menggunakan berkas HTML serta JavaScript terpisah. Akses memerlukan
  akun pengurus aktif; akun dummy hanya tersedia dalam pengembangan.
- Logo terbaru dari `an-nahl.png` dipasang pada navigasi, footer, login,
  aktivasi akun, sidebar, kartu postingan, dan ikon browser. Berkas asli
  dipertahankan utuh pada `public/brand/an-nahl.png`; tampil proporsional
  dengan latar transparan tanpa kotak tambahan.
- Ringkasan pengurus memiliki kotak buat postingan dan tindakan cepat berita,
  foto, video, serta edit website. Daftar berita menjadi kartu berisi sampul,
  judul, kategori, tanggal, status, dan tindakan Lihat/Edit/Hapus. Hapus berita memindahkannya ke Arsip agar dapat
  dipulihkan. Foto unggahan dan video memiliki Edit/Hapus; Foto folder adalah
  koleksi aset sumber dan tidak dihapus lewat browser.
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
- Panel memeriksa sesi sebelum menampilkan konten. Pengunjung diarahkan ke
  login, dan keluar akun mengembalikan pengguna ke halaman login. Website
  publik tidak menyediakan tombol pintas menuju panel.
- Tautan Instagram, Facebook, dan YouTube yang diberikan pengguna sudah
  dipasang di footer dan halaman Kontak. Ikon Twitter tanpa tujuan dihapus.
- Halaman publik dimuat sesuai kebutuhan. Editor dan katalog foto tidak ikut
  dimuat oleh pengunjung. Konten terbit dibaca satu kali saat website dibuka;
  kegagalan layanan mempertahankan isi bawaan dan tidak mengosongkan halaman.

## Status

Migrasi `202610270003_site_content.sql` sudah diterapkan pada proyek Supabase
**an-nahl** pada 27 Oktober 2026 setelah persetujuan pengguna. Dua tabel yang
sebelumnya belum ada kini tersedia; pemeriksaan API isi website berhasil
HTTP 200 dan riwayat tetap tidak dapat dibaca publik (HTTP 401). Migrasi tidak
menerbitkan konten halaman atau mengubah berita/galeri yang sudah ada.

Pembaruan navigasi, kategori, popup pembayaran, login terpisah, warna, dan logo ada di proyek lokal serta paket sumber. Tidak ada
push ke repository produksi yang dilakukan oleh agen. Salin paket ke repository
`web` dan push melalui alur pengguna untuk menerbitkan perubahan tampilan.

Pemeriksaan browser lokal dilakukan dengan izin pengguna dan akun demo: desktop
1280 piksel, ponsel 390 dan 320 piksel. Alur ubah judul, pilih foto pondok, simpan
draft, pratinjau, dan terbitkan demo berhasil. Tombol akun yang sempat menumpuk
dengan menu pada 320 piksel sudah diperbaiki. Halaman publik, navigasi program/
pendaftaran, isian formulir, dan tiga ikon sosial diperiksa. Tidak ada kiriman
Google nyata atau penyimpanan CMS pada Supabase produksi yang diuji.

## Pemasangan sekali

1. Backup website dan database yang ada.
2. Pada proyek **an-nahl**, migrasi isi website sudah aktif. Untuk proyek baru,
   jalankan `supabase/migrations/202610270003_site_content.sql`. Migrasi ini membutuhkan
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

Pada pemeriksaan awal 27 Oktober 2026, endpoint domain `/api/forms.php`
masih membalas HTTP 503 karena konfigurasi privat belum terbaca. Setelah
pengaturan dipasang di Hostinger, endpoint lokal dan domain membalas HTTP
**200** dengan token tersedia. Kunci penghubung sesuai dengan penerima Google.

File website dari GitHub memang tidak membawa konfigurasi privat tersebut.
Pertahankan `annahl-private/forms-config.php` di luar `public_html` ketika
memperbarui website. Pengujian koneksi tidak menulis data pendaftar atau
lampiran; penyimpanan kiriman lengkap ke Google masih perlu diuji.

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
Penerima Google dan konfigurasi Hostinger sudah aktif. Uji penyimpanan kiriman
lengkap beserta lampiran belum dilakukan.

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

## Pembaruan 28 Oktober 2026

- Kontak menampilkan Telepon dengan tautan `tel:` dan WhatsApp dengan tombol
  Chat via WhatsApp pada baris tersendiri.
- Kategori berita dan galeri memakai empat kartu bergambar dengan thumbnail
  pondok yang sudah dioptimalkan. Pilihan kategori tetap berlaku jika diklik
  sebelum berita selesai dimuat.
- Pilih Donasi sekarang pada program untuk membuka popup transfer bank,
  e-wallet, atau QRIS. Program dan metode terisi pada formulir konfirmasi.
  Petunjuk rekening hanya muncul di popup, dan tersedia tombol salin nomor.
- Gambar QRIS resmi belum disediakan. Unggah melalui Isi website → Informasi
  donasi → bagian Metode Pembayaran → Gambar QRIS resmi, lalu terbitkan.
  Sistem menampilkan keterangan belum tersedia selama foto belum terpasang.
- Unduh laporan dihapus dari halaman publik. Admin membuka Rekap donasi →
  Unduh laporan rekap (.xlsx). File ini adalah rekap kerja dari Google Sheets
  yang berisi tab pendaftaran dan konfirmasi donasi, bukan laporan keuangan
  yang sudah diaudit. Google tetap memeriksa hak akses akun pemilik Sheet.
- Isian pendaftaran/donasi diedit atau dihapus melalui Google Sheets agar
  tetap berada di penyimpanan akun pondok.
- Bagian informasi pada Isi website memiliki Edit dan Hapus/Pulihkan. Hapus
  berlaku setelah Terbitkan perubahan; sampul, formulir, dan petunjuk pembayaran
  inti tetap dipertahankan untuk menjaga fungsi halaman.
- Build menyediakan index.html, login.html, admin.html, dan .htaccess. Tautan
  undangan lama ke admin.html diteruskan ke login beserta data aktivasinya.
  Konfigurasi Supabase yang sudah dipakai tetap dapat digunakan.

Pemeriksaan terbaru: popup, pilihan program/metode, kategori bergambar, kanal
telepon/WhatsApp, login demo, pemisahan halaman, dan logout diuji di browser
lokal. Lebar 320 piksel diperiksa tanpa gulir horizontal. Tidak ada kiriman
Google atau perubahan konten Supabase produksi pada pengujian ini. Unduh
Sheet privat masih mengikuti sesi Google pengguna dan tidak diuji dengan
mengunduh data pendaftar.

## Memilih foto dari Drive

Editor berita/foto serta Isi website menyediakan Ambil dari Drive. Menu
Galeri memiliki Foto Drive untuk menelusuri perpustakaan akun pondok.
Unggahan baru menyimpan foto asli, versi website, dan thumbnail ke Drive.
Menghapus postingan mempertahankan arsip foto karena dapat dipakai postingan
lain. Berkas asli proyek tidak dihapus setelah dicadangkan ke Drive.

Pemasangan penghubung foto pada Hostinger memerlukan media-config.php di
folder privat yang sama dengan forms-config.php. Ikuti DRIVE_MEDIA_SETUP.md.
