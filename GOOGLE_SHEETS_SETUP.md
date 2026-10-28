# Formulir langsung ke Google Sheets dan Drive akun pondok

Pendaftaran dan konfirmasi donasi memakai alur **website → PHP Hostinger → Google**. Isian dicatat di [Rekap daftar dan Donasi](https://docs.google.com/spreadsheets/d/1GJJDb0AEv4a3yugzQpv2hMhU1ke9g_zIbsNGQMNlmg8/edit). Lampiran asli disimpan di folder privat Drive milik `pondokpemberdayaanannahl@gmail.com`; Sheet mencantumkan tautan foldernya. Penyimpanan menggunakan kuota Google akun pondok.

Supabase tetap melayani berita, galeri editorial, akun pengurus, dan kontak. Pendaftaran/donasi baru tidak dikirim ke Supabase. Panel admin membuka rekap Google. Tidak ada sinkronisasi lima menit atau basis data formulir tambahan di hosting.

## Status penerapan

- Pada 27 Oktober 2026, pengguna menyelesaikan izin Google, menjalankan penyiapan dan pemeriksaan folder privat, lalu menerbitkan penerima sebagai Web app. Pengaturan privat kemudian dipasang di Hostinger atas permintaan pengguna.
- Sheet dan dua tab sudah disiapkan; akses umumnya **Restricted / Private only to me**. Sheet1 asli dipertahankan.
- Kode penerima Google, penghubung PHP, formulir lampiran, dan konfigurasi privat sudah disiapkan lokal. Build serta uji PHP/HTTP lokal lulus. Google pada uji HTTP masih berupa server tiruan.
- Penerima Google sudah diterbitkan. Pemeriksaan yang dijalankan pengguna menyatakan dua tab siap dan folder Drive hanya dapat diakses pemilik.
- **Pengaturan lokal dan Hostinger sudah aktif: kedua endpoint formulir membalas HTTP 200 dengan token tersedia.** File Hostinger berada di `annahl-private/forms-config.php`, sejajar dengan `public_html`; alamat publik file tersebut membalas HTTP 404.
- Kecocokan kunci penghubung diperiksa menggunakan jenis permintaan yang sengaja tidak didukung dan ditolak sebelum ada penulisan Sheet atau unggahan Drive. Tanda tangan salah menghasilkan `denied`, sedangkan tanda tangan sah mencapai validasi dan menghasilkan `invalid`.
- **Penyimpanan kiriman lengkap dan lampiran ke Google belum diuji.** Pemeriksaan kesiapan dan tanda tangan tidak membuktikan keberhasilan penulisan baris atau unggahan sesungguhnya.
- Rancangan lama berada di `integrations/google-sheets/legacy/`, bukan daftar migrasi aktif. Migrasi sinkronisasi lama tidak pernah diterapkan dan trigger berkala tidak pernah dipasang.

## Lampiran dan pengiriman

Maksimal **3 berkas, 2 MB per berkas, 5 MB total**. Format: JPG/JPEG, PNG, WebP, PDF, DOCX, XLSX, PPTX. Server memeriksa isi berkas. Paket Office terenkripsi atau dengan makro, arsip biasa, executable, HTML, dan SVG tidak diterima.

Formulir menampilkan nama/ukuran lampiran, pilihan mengosongkan, proses pengiriman, dan hasil yang jelas. Isian dipertahankan saat gagal. Pesan sukses hanya muncul setelah Google mengonfirmasi ID kiriman yang sama. Retry tanpa mengubah isian dari halaman yang sama memakai ID dan hash yang sama; reload halaman tidak menjamin ID sebelumnya tetap dipakai.

Konfirmasi donasi mencatat laporan donatur dan bukti untuk diperiksa. Tidak memindahkan uang atau memverifikasi transfer bank. Ubah status tindak lanjut di Sheet. Kolom catatan tambahan di sebelah kanan tetap boleh digunakan.

Tidak ada isian/lampiran di localStorage atau sessionStorage. PHP memprosesnya di memori dan meneruskan melalui HTTPS. Hosting hanya menyimpan konfigurasi privat dan penghitung percobaan (hash IP, jumlah, kedaluwarsa), tanpa isi formulir atau file. Penghitung kedaluwarsa dibersihkan ketika kelompok tersebut digunakan kembali.

Penerima Google memeriksa tanda tangan, waktu, ID, batas file, hash isi, serta pemilik/izin folder dan file. Akses di luar pemilik membuat proses ditolak. Tidak ada pembuatan link publik untuk lampiran. Permintaan tanpa tanda tangan yang sah tidak dapat membaca atau menulis data.

Jika upload sebagian berhasil tetapi penulisan Sheet gagal, berkas privat tetap ada untuk dilanjutkan saat retry tanpa menggandakan. Pengurus dapat meninjau folder tidak lengkap. Tidak ada purge permanen otomatis.

## Penempatan di Hostinger

```text
domain-folder/
  annahl-private/                 # di luar public_html
    forms-config.php             # URL deployment dan kunci privat
    rate-limits/                 # metadata pembatasan percobaan saja
  public_html/
    index.html
    admin.html
    assets/
    media/
    api/forms.php
    api/forms-core.php
```

Gunakan website PHP/HTML Hostinger dengan pengelola file, bukan hanya Website Builder. Dibutuhkan PHP 8.1+ dan cURL; tidak memerlukan MySQL atau Node.js di hosting. Verifikasi paket/konfigurasi hPanel sebelum pemasangan. HTTPS domain harus aktif dan batas badan permintaan PHP setidaknya 8 MB.

## Aktivasi Google

1. Masuk sebagai pemilik `pondokpemberdayaanannahl@gmail.com`. Buka Sheet → Extensions → Apps Script.
2. Pasang `integrations/google-sheets/Code.gs` dan `appsscript.json`. Manifest mengaktifkan advanced Drive API v3.
3. Pertahankan `ANNAHL_SPREADSHEET_ID` dan `ANNAHL_SHEETS_SECRET` yang sudah diisi. Properti URL/public key Supabase lama tidak dipakai penerima baru. Jangan menaruh kunci di Sheet, `VITE_*`, Git, atau chat.
4. Tinjau izin Google: scope **spreadsheets** diperlukan untuk membuka rekap dari penerima web, serta **drive.file** untuk file yang dibuat/digunakan penghubung. Izin spreadsheet yang ditampilkan Google lebih luas daripada satu Sheet; kode membatasi ID tujuan pada rekap pondok. Rancangan lama memakai currentonly, sehingga izin baru harus ditinjau pemilik. Tidak ada izin trigger berkala pada manifest baru.
5. Setelah pemilik menyetujui akses, jalankan `setupGoogleForms`. Fungsi memeriksa kolom, membuat folder Drive privat dengan pemilik yang benar, serta menyisipkan **Lampiran (Drive)**, **Hash Kiriman**, dan **Folder Berkas**. Dua kolom internal disembunyikan. Kolom catatan digeser, tidak ditimpa; Sheet1 tidak diubah.
6. Jalankan `checkGoogleFormsSetup`. `onOpen` hanya membuat menu saat Sheet dibuka.
7. Deploy → New deployment → Web app. Jalankan sebagai **Me / akun pondok**, dengan endpoint yang dapat dijangkau hosting. Tanda tangan server tetap diwajibkan; URL publik tidak memberikan akses ke isi Sheet/Drive. Tinjau penerapan sebelum publikasi.
8. Simpan URL rilis berakhiran `/exec`, bukan `/dev`. PHP hanya mengikuti pengalihan hasil HTTPS ke `script.googleusercontent.com` dan tidak meneruskan badan formulir pada pengambilan hasil.

Pemilik menyetujui izin Google dan menyelesaikan verifikasi akun secara langsung. Kunci baru juga harus dimasukkan pengguna sesuai aturan browser.

## Konfigurasi dan paket rilis

```text
npm run forms:prepare -- https://script.google.com/macros/s/DEPLOYMENT_ID/exec
npm run build
```

Persiapan membaca kunci yang sudah disimpan lokal tanpa mencetaknya. Hasil:

- `annahl-private/forms-config.php`: konfigurasi lokal, diabaikan Git dan diblokir Vite.
- `.backend-backups/google-forms/hostinger-private/forms-config.php`: konfigurasi domain; wajib di luar public_html.
- `.backend-backups/google-forms/deployment.json`: catatan tujuan tanpa kunci.

Tanpa URL deployment, formulir menolak kiriman dengan pesan belum siap. Jangan menggantinya dengan sukses palsu atau fallback Supabase.

Setelah build, buat paket publik pada Windows:

```powershell
.\scripts\package-hostinger.ps1
```

Paket `.backend-backups/google-forms/hostinger-public.zip` berisi build publik yang diperiksa agar tidak memuat kunci/config privat. Konfigurasi privat disiapkan terpisah. Simpan backup file hosting yang akan diganti; jangan menghapus berkas lain di hosting.

Migrasi `supabase/migrations/202610260002_google_forms_boundary.sql` disiapkan untuk membatasi insert Supabase menjadi **kontak** saja. Tidak menghapus data yang sudah ada dan tidak mengubah berita/akun. Koordinasikan dengan rilis formulir. Migrasi ini **belum diterapkan**.

## Pengujian

```text
npm test
npm run test:forms-php
npm run test:forms-http
npm run test:google-boundary
npm run build
```

Uji HTTP memakai PHP sungguhan dan server Google tiruan pada loopback. Memeriksa tanda tangan, byte file, tanda terima sesuai ID, retry, origin/token/honeypot, pengalihan yang ditolak, dan tidak tersimpannya isi di penghitung hosting. Uji batas Supabase memakai PGlite yang dipasang terpisah di `.backend-backups/sql-test-runtime`.

Pengembangan lokal memakai dua proses: `npm run forms:dev` dan `npm run dev -- --host 127.0.0.1 --port 5173`. Vite meneruskan endpoint formulir ke PHP port 5174. Folder privat diblokir dari server pengembangan.

Setelah aktivasi, uji nyata dengan pendaftaran dan donasi rekaan, foto/PDF, retry, kepemilikan/akses Drive, serta respons dari domain publik. Bersihkan hanya fixture yang disetujui. Jangan menyatakan layanan aktif sebelum uji nyata selesai.

Referensi: [Google web apps](https://developers.google.com/apps-script/guides/web#permissions), [Advanced Drive](https://developers.google.com/apps-script/advanced/drive), [Content Service](https://developers.google.com/apps-script/guides/content), [PHP Hostinger](https://www.hostinger.com/support/1575755-how-to-change-the-php-version-of-your-hostinger-hosting-plan/).

## Pemeriksaan domain — 27 Oktober 2026

Konfigurasi privat sudah dipasang di luar `public_html`. Penerima
`/api/forms.php` pada domain dan lokal membalas HTTP 200 dengan token tersedia.
Penerima Google dapat diakses dan kunci penghubung sesuai. File privat tidak
dapat diakses dari alamat publik (HTTP 404). Pemeriksaan tidak menulis data
pendaftar, donasi, atau lampiran. Uji penyimpanan kiriman lengkap masih diperlukan.
