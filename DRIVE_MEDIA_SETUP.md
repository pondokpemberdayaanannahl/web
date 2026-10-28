# Foto website di Google Drive pondok

Foto asli berada di **An-Nahl - Perpustakaan Foto Website**, milik
`pondokpemberdayaanannahl@gmail.com`. Folder pendaftaran dan bukti donasi
tetap terpisah. Folder Drive tidak dibagikan ke publik.

Website menampilkan versi ringan melalui penghubung PHP Hostinger. Pratinjau
disimpan sementara di folder privat hosting agar tidak selalu mengambil ulang
gambar dari Google. Tautan gambar versi website dapat dibuka oleh pemegang
tautannya. Penghubung tidak menyediakan unduh foto asli untuk pengunjung.

Judul, isi, kategori, dan tautan foto postingan tetap memakai database Supabase.
Unggahan foto baru dari berita, galeri, dan Isi website disimpan ke Drive.
Jika Drive belum siap, unggahan ditolak dengan pesan yang jelas.

## Cara memakai

1. Masuk sebagai pengurus melalui `/admin`.
2. Pada editor berita/foto, klik **Ambil dari Drive**, cari nama, lalu pilih foto.
3. Unggah foto baru melalui pilihan berkas seperti biasa. Foto asli, versi
   website, dan thumbnail dikirim ke Drive sebelum postingan disimpan.
4. Pada menu Galeri, **Foto Drive** membuka perpustakaan yang sama. Pilihan
   foto dapat dipakai untuk menyiapkan postingan galeri baru.
5. Pada Isi website, setiap isian gambar juga menyediakan **Ambil dari Drive**.
6. **Salin foto lama** menyalin sampul berita/foto galeri yang masih mengarah
   ke Supabase, lalu memperbarui tautan postingan. File lama dipertahankan
   untuk riwayat. Jalankan dari akun admin asli setelah penghubung aktif.

Mode demo menampilkan foto lokal dan tidak mengirim data ke Google.

## Aktivasi penghubung Google

1. Pada proyek Apps Script **Rekap An-Nahl**, simpan `Code.gs` sebagai
   `Kode.gs`, tambahkan `Media.gs`, dan gunakan manifest `appsscript.json`
   dari folder `integrations/google-sheets/`.
2. Manifest menambahkan izin `script.external_request` untuk mengambil
   gambar dari Google Drive API. Izin `drive.file` tetap dipakai untuk file
   yang dibuat aplikasi. Pemilik akun perlu menyetujui perubahan izin Google.
3. Jalankan `setupWebsiteMedia`. Folder khusus foto website akan dibuat
   dan diperiksa kepemilikannya. Folder formulir tidak diubah.
4. Perbarui deployment web app yang sudah ada ke versi baru. URL `/exec`
   tetap menggunakan konfigurasi yang sudah disimpan pada hosting.
5. Periksa koneksi dengan `node scripts/import-drive-photos.mjs --status`.

Pemilik sudah menyetujui izin tambahan pada 28 Oktober 2026. Penghubung
versi 4 telah aktif pada URL deployment lama. Penyalinan 149 foto sumber
sudah selesai dan seluruhnya telah dicocokkan dengan daftar Drive. Ada satu
foto identik pada dua folder sumber, sehingga Drive berisi 148 foto unik.
Tidak ada foto sumber yang dihapus. Laporan pemeriksaan ada di
`.backend-backups/drive-media/cloud-verification.json`.
Pembacaan thumbnail melalui penghubung lokal berhasil dengan hash yang
cocok dengan sumbernya. Pembaruan tampilan dan konfigurasi privat Hostinger
masih perlu dipasang melalui dua paket yang disiapkan.

## Menyalin 149 foto proyek

Jalankan dari folder utama proyek:

```powershell
node scripts/import-drive-photos.mjs
node scripts/import-drive-photos.mjs --setup
node scripts/import-drive-photos.mjs --upload --limit=10
node scripts/import-drive-photos.mjs --upload --concurrency=2
node scripts/import-drive-photos.mjs --verify-all
```

Perintah tanpa argumen hanya memeriksa jumlah dan ukuran. Total sumber
149 foto adalah 575.094.625 byte; bersama versi website dan thumbnail
624.822.653 byte, sekitar 625 MB. Pastikan ruang Drive mencukupi.

Laporan per foto ada di `.backend-backups/drive-media/import-report.json`.
Jalankan ulang perintah upload untuk melanjutkan foto yang belum selesai.
Identitas foto berasal dari hash isinya; pengiriman ulang tidak menggandakan
foto yang sudah lengkap. Sumber lokal tetap dipertahankan.

Foto HEIC proyek disimpan utuh sebagai arsip asli dan memakai JPG yang sudah
disiapkan untuk tampilan browser. Upload interaktif mendukung JPG, PNG,
WebP, dan GIF sesuai batas editor. Pemilih menampilkan 12 foto per halaman. Pencarian kegiatan serta dua halaman daftar Drive sudah
diperiksa langsung: 12 foto per halaman tanpa tumpang tindih.

## Konfigurasi privat Hostinger

```powershell
node scripts/prepare-drive-media.mjs
```

File lokal disiapkan pada `annahl-private/media-config.php`; salinan Hostinger
ada di `.backend-backups/drive-media/hostinger-private/media-config.php`.
Letakkan salinan Hostinger **di luar `public_html`**, berdampingan dengan
`forms-config.php` yang sudah ada. Konfigurasi ini tidak masuk repository.

Pertahankan `media_signing_key` yang sudah dihasilkan dan backup file privat.
Kunci ini menjaga tautan foto tetap berlaku ketika konfigurasi formulir
diganti. Jangan membuat ulang atau memasukkan kunci ke `VITE_*`.

Paket source menyediakan `api/media.php`, `api/media-image.php`, dan
`api/media-core.php` pada build. Push source ke repository `web` untuk
mengikuti alur build cabang `hostinger` yang sudah ada.

## Pemeriksaan

- Tes receiver: tanda tangan, batas waktu, penyimpanan bertahap, pengiriman
  ulang, pemisahan folder, dan penolakan akses publik ke foto asli.
- Tes client: sesi wajib, tanda terima cocok, serta pemakaian ulang foto Drive.
- `php tests/media-php.php`: ID, tautan gambar, hash, dan penolakan bukan gambar.
- Pengujian demo tidak membuktikan foto nyata sudah tersimpan. Periksa
  laporan impor serta folder Drive sebelum menyatakan migrasi selesai.

Google membatasi waktu eksekusi dan pemanggilan layanan. Pengiriman dilakukan
per berkas agar bisa dilanjutkan bila terputus. Rujukan:
[kuota Apps Script](https://developers.google.com/apps-script/guides/services/quotas),
[unduh file Drive](https://developers.google.com/workspace/drive/api/guides/manage-downloads).

Pada PHP Windows yang belum memiliki bundel CA, jalankan
`scripts/prepare-local-tls.ps1`, lalu `node scripts/prepare-drive-media.mjs`.
Ini memakai sertifikat publik yang sudah dipercaya Windows. Verifikasi TLS
tetap aktif; konfigurasi Hostinger memakai sertifikat sistem hosting.
