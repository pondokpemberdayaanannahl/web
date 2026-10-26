# Rekap pendaftaran dan konfirmasi donasi di Google Sheets

Permintaan terbaru adalah menyimpan **pendaftaran** dan **konfirmasi donasi** langsung di Google Sheets, dengan lampiran foto/dokumen di Google Drive akun pemilik Sheet. Jalur langsung ini **belum diimplementasikan atau diaktifkan**; informasi hosting masih diperlukan agar formulir website tetap dapat digunakan. Supabase tetap dipakai untuk berita dan akun pengurus. Kode formulir yang ada saat ini masih memakai Supabase sampai penggantinya selesai dan diuji.

## Status saat ini

Spreadsheet tujuan: [Rekap daftar dan Donasi](https://docs.google.com/spreadsheets/d/1GJJDb0AEv4a3yugzQpv2hMhU1ke9g_zIbsNGQMNlmg8/edit), milik `pondokpemberdayaanannahl@gmail.com`. Dua tab telah disiapkan; judul kolom dibungkus, diberi filter, dan dibekukan pada baris pertama. Akses umum sudah diubah menjadi **Restricted / Private only to me** dari akun pemilik. Tab awal Sheet1 tetap dipertahankan.

Kode rancangan sinkronisasi sebelumnya sudah dipasang sebagai project **Rekap An-Nahl** yang terikat ke spreadsheet. Manifest dan properti telah disimpan; kunci baru dimasukkan sendiri oleh pengguna. `checkAnNahlSetup` berhasil dalam eksekusi Google sungguhan: konfigurasi valid dan kedua tab ditemukan. `onOpen` kini melewati pemanggilan manual tanpa event Sheet; pemeriksaan koneksi tidak bergantung pada UI menu.

**Migrasi `202610260002_sheets_sync.sql` belum diterapkan dan jadwal lima menit belum diaktifkan.** Pengguna belum menyetujui aktivasi rancangan itu dan memilih membahas penyimpanan langsung ke Google. Dua data uji hanya disiapkan lokal, belum dikirim. Belum ada folder Drive lampiran atau fitur unggahan pada formulir pendaftaran/donasi. Bagian berikut menyimpan dokumentasi rancangan sinkronisasi sebelumnya untuk referensi; jangan jalankan aktivasinya untuk rencana Google saja.

Akun pondok sudah login di browser Codex. Plugin Google Drive belum terhubung; penyuntingan Sheet yang sudah ada dilakukan melalui browser. Pengujian lokal layanan tiruan dan PostgreSQL sementara (PGlite) sudah lulus; hasil tersebut tidak membuktikan pengiriman formulir atau unggahan lampiran secara langsung.

## Rancangan sinkronisasi sebelumnya (nonaktif)

1. Formulir website menyimpan kiriman di `public.form_submissions` seperti sebelumnya. Keberhasilan formulir tidak menunggu Google.
2. Trigger database memasukkan pendaftaran/donasi baru dan perubahan status ke antrean privat. Data lama ikut diantrekan saat migrasi.
3. Google Apps Script mengambil maksimal 50 kiriman per batch, setiap sekitar lima menit, lalu memperbarui dua tab berdasarkan ID kiriman. Jadwal berjalan pada akun Google, sehingga komputer pengurus tidak perlu menyala. Waktunya mengikuti layanan trigger Google dan bukan jaminan pengiriman tepat waktu.
4. Kiriman ditandai tersalin setelah penulisan Google Sheets di-flush. Jika jaringan terputus, antrean tetap ada. Percobaan ulang memakai ID yang sama sehingga tidak menambah baris ganda.
5. Perubahan status yang terjadi selama penyalinan memiliki revisi baru dan tetap menunggu giliran berikutnya.

Salinan bersifat satu arah: Supabase ke Sheets. Ubah status di panel admin website. Isian yang diedit pada kolom sumber di Sheets tidak dikirim kembali ke website dan dapat tertimpa pembaruan berikutnya. Kolom tambahan di sebelah kanan, misalnya **Catatan Pengurus**, tidak diubah oleh script. Jangan mengubah judul/urutan kolom sumber atau ID kiriman.

Nominal donasi adalah jumlah yang **dikonfirmasi pengunjung**, bukan transaksi bank terverifikasi. Status `selesai` juga tidak membuktikan uang sudah masuk. Pengurus tetap mencocokkan transfer secara terpisah.

## Referensi aktivasi rancangan sebelumnya (jangan dijalankan untuk rencana baru)

1. Pastikan [backend utama](./BACKEND_SETUP.md) sudah aktif. Tinjau dan terapkan `supabase/migrations/202610260002_sheets_sync.sql` pada proyek yang benar. Migrasi menambah dua tabel privat, satu trigger antrean, dan dua RPC dengan kunci khusus. Tidak mengubah policy baca formulir publik. Integrasi tetap nonaktif sampai kuncinya diatur.
2. Siapkan spreadsheet tujuan dengan dua tab dan judul kolom **baris pertama** berikut. Tab lain boleh tetap ada.

   **Pendaftaran** (A:M):

   ```text
   ID Kiriman | Diterima | Status | Nama Santri | Tempat Lahir | Tanggal Lahir | Jenis Kelamin | Asal Sekolah | Program | Nama Wali | WhatsApp | Email | Alamat
   ```

   **Konfirmasi Donasi** (A:H):

   ```text
   ID Kiriman | Diterima | Status Pemeriksaan | Nama Donatur | Nominal Dikonfirmasi (Rp) | Metode | Program | Pesan
   ```

   Bekukan baris pertama, aktifkan filter, dan gunakan lebar kolom yang mudah dibaca. Untuk spreadsheet baru melalui Codex, buat/verifikasi template lokal kemudian impor sebagai Google Sheets melalui Google Drive. Penghubung tidak membuat spreadsheet atau tab secara diam-diam.
3. Dari folder proyek, jalankan dengan tautan spreadsheet yang benar:

   ```text
   npm run sheets:prepare -- https://docs.google.com/spreadsheets/d/ID_SPREADSHEET/edit
   ```

   Perintah membaca URL/public key dari `.env`, menghasilkan kunci acak 256-bit, dan menyimpan berkas pribadi di `.backend-backups/sheets-sync/`. Folder ini diabaikan Git dan tidak termasuk build website. Perintah tidak menghubungi Supabase/Google dan tidak mencetak kunci. Pengulangan pada tujuan sama memakai kunci yang sama; perpindahan spreadsheet ditolak agar tidak mengonsumsi antrean ke tujuan lain secara tidak sengaja.
4. Di spreadsheet tujuan, buka **Extensions → Apps Script**. Pasang isi `integrations/google-sheets/Code.gs` dan manifest `appsscript.json` yang menyetel zona waktu Jakarta. Script terikat pada file ini dan memakai izin `spreadsheets.currentonly`, bukan izin semua spreadsheet dalam akun. Salinan script yang terikat pada spreadsheet lain menolak mengambil antrean sebelum menghubungi Supabase.
5. Di **Project Settings → Script properties**, isi empat properti dari berkas lokal `script-properties.json`: `ANNAHL_SUPABASE_URL`, `ANNAHL_SUPABASE_PUBLIC_KEY`, `ANNAHL_SHEETS_SECRET`, dan `ANNAHL_SPREADSHEET_ID`. Jangan menaruh kunci penghubung pada `VITE_*`, kode browser, sel spreadsheet, Git, atau chat. Hanya gunakan public anon/publishable key; tidak memerlukan service-role key.
6. Tinjau/jalankan berkas lokal `enable-sync.sql` di SQL Editor proyek yang sama. Database hanya menyimpan hash kunci. Langkah ini memberi penghubung kemampuan membaca pendaftaran/donasi dan mengakui penyalinannya.
7. Dari akun Google pengelola, jalankan `checkAnNahlSetup` dan setujui akses Google yang dibutuhkan. Fungsi ini hanya memeriksa konfigurasi dan kedua tab; tidak mengambil data atau memasang jadwal. Jangan menjalankan `onOpen` untuk pemeriksaan: fungsi tersebut hanya membuat menu saat file Sheet dibuka. Setelah pemeriksaan dan aktivasi Supabase selesai, jalankan `installAnNahlSync` untuk mencoba penyalinan dan memasang satu trigger lima menit. Tidak perlu deployment web app dan tidak ada endpoint Google terbuka untuk pengunjung.
8. Uji dengan data rekaan: satu pendaftaran dan satu konfirmasi donasi. Pastikan kedua baris tampil, nominal berupa angka dan nomor WhatsApp tetap utuh. Ubah status dari panel admin dan periksa baris yang sama diperbarui. Uji pengulangan sebelum menyatakan koneksi aktif.

Pemilik akun Google perlu menyetujui akses pada langkah 7. Jangan mengirim password atau kunci pribadi lewat chat. Editor project Apps Script dapat membaca properti script; batasi akses edit pada pengurus yang berwenang.

## Pemeriksaan dan pemulihan

- Menu **An-Nahl → Salin data terbaru** menjalankan penyalinan manual; **Hentikan salin otomatis** menghapus trigger milik penghubung ini saja.
- Periksa **Executions** untuk kegagalan. Script properties `ANNAHL_LAST_SYNC_AT`, `ANNAHL_LAST_SYNC_COUNT`, dan `ANNAHL_LAST_SYNC_ERROR` menyimpan hasil terakhir, tanpa isi formulir atau kunci.
- Antrean tidak dibersihkan ketika gagal. Script berhenti sebelum mengakui data jika tab hilang, judul kolom berubah, ID ganda terdeteksi, atau penulisan gagal.
- Pembatasan waktu/kuota Google dapat menunda penyalinan; setiap run dibatasi lima batch dan sekitar empat menit. Pendaftaran tetap tersimpan di Supabase.
- Jika kunci bocor, nonaktifkan ekspor terlebih dahulu melalui SQL Editor:

  ```sql
  update private.sheets_sync_settings set enabled = false where singleton;
  ```

  Lalu ganti kunci beserta hash-nya di kedua sisi. Jangan mengubah public key proyek hanya untuk mengganti kunci penghubung ini.
- Jika baris rekap pernah dihapus dan ingin menyalin ulang seluruh data, jalankan dari SQL Editor setelah memastikan spreadsheet tujuan benar:

  ```sql
  update private.sheets_sync_queue set synced_revision = 0;
  ```

  ID tetap dipakai untuk memperbarui baris yang sudah ada. Penghapusan permanen pada database tidak otomatis menghapus salinan Sheets; retensi salinan harus dikelola pengurus.

## Pengujian pengembangan

```text
npm test
npm run build
```

Tes Apps Script menggunakan tiruan API Google dan tidak mengirim data. Untuk uji SQL nyata secara lokal, pasang mesin uji terpisah (tidak masuk aplikasi/hosting):

```text
npm install --prefix .backend-backups/sql-test-runtime --no-save --package-lock=false --ignore-scripts @electric-sql/pglite
npm run test:sheets-db
```

Uji tersebut memakai skema formulir asli, menjalankan migrasi Sheets pada database sementara, lalu menguji kunci salah, batas bidang, trigger dari role anonim, retry, perubahan status serentak, dan sakelar nonaktif. Semua fixture di-rollback. Untuk staging Supabase, skenario yang sama tersedia di `supabase/tests/sheets_sync.sql`; tinjau sebelum menjalankannya. Hasil lokal tidak menggantikan uji akun Google sebenarnya.

Referensi: [Google time-driven triggers](https://developers.google.com/apps-script/guides/triggers/installable#time-driven_triggers), [Script properties](https://developers.google.com/apps-script/guides/properties), [UrlFetchApp](https://developers.google.com/apps-script/reference/url-fetch/url-fetch-app), dan [Supabase database functions](https://supabase.com/docs/guides/database/functions).
