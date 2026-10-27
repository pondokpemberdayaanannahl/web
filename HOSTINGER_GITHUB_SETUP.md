# Website Hostinger yang mengambil file dari GitHub

## Penyebab halaman putih

Domain saat diperiksa pada 27 Oktober 2026 masih memanggil
`/src/bootstrap.js` dari `index.html`. Itu adalah halaman pengembangan Vite.
Pada pemasangan PHP/HTML dengan Git, Hostinger menyalin isi cabang ke
`public_html`. Proyek ini perlu menjalankan `npm run build` sebelum file
hasilnya bisa ditayangkan.

Direktori root `public_html` pada hPanel adalah **tujuan di hosting**.
Mengubahnya menjadi `public_html/dist` tidak menjalankan build atau memilih
isi `dist` dari repository.

## Perbaikan dengan GitHub

Alur pada `.github/workflows/hostinger.yml`:

1. Pengelola tetap melakukan push sumber ke cabang `main`.
2. GitHub Actions memasang dependensi, menguji, dan menjalankan build.
3. Jika semua berhasil, hanya isi `dist` diterbitkan ke cabang `hostinger`.
4. Hostinger mengambil cabang `hostinger` ke `public_html`.

Cabang hasil build akan berisi `index.html`, `admin.html`, `assets/`,
`media/`, dan `api/`, termasuk penghubung PHP. Konfigurasi Google privat
tetap di luar `public_html` dan tidak masuk Git. Jika build gagal, hasil
rilis sebelumnya tetap tersedia. Tidak perlu FTP password untuk rancangan
ini; penulisan cabang memakai token bawaan repository GitHub.

Pengguna menyetujui penyiapan workflow pada 27 Oktober 2026. File workflow
sudah disiapkan lokal dengan izin `contents: write` untuk memperbarui cabang
hasil build. Belum ada push, eksekusi Actions pada repository produksi, atau
perubahan akun hosting. Workflow aktif setelah pengelola menyalin dan push
file ini beserta perubahan website ke repository produksi.

## Penyiapan sekali

1. Repository produksi yang dikonfirmasi pengguna adalah
   [pondokpemberdayaanannahl/web](https://github.com/pondokpemberdayaanannahl/web).
   Remote proyek lokal tetap `fathifathan/ponpes-an-nahl-website`; pengguna
   memindahkan perubahan ke repository produksi seperti alur sebelumnya.
2. Pada GitHub repository `web`, buka Settings → Secrets and variables →
   Actions → Variables. Tambahkan dua **repository variables**:
   `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`. Isi dengan nilai yang
   sama seperti `.env` lokal. Gunakan anon/public atau publishable key,
   bukan service-role/secret key. Jangan memasukkan kunci Google ke VITE.
3. Salin seluruh perubahan website seperti biasa, termasuk folder tersembunyi
   `.github/workflows`, `scripts/check-hostinger-build.mjs`, `package.json`,
   `package-lock.json`, `vite.config.js`, semua modul sumber baru, dan
   `public/media`. Jangan salin `.env`, `node_modules`, `dist`,
   `.backend-backups`, atau `annahl-private` ke Git. Push ke `main`.
4. Buka Actions → **Build untuk Hostinger**. Tunggu sampai berhasil dan
   cabang `hostinger` muncul. Jika perlu, pilih Run workflow pada `main`.
   Aturan organisasi/repository yang menolak token menulis cabang perlu
   disesuaikan pengelola; workflow tidak melewati branch protection.
5. Backup website yang ada. Pada hPanel → Tingkat lanjut/Advanced → Git
   atau Penempatan/Deployments, pilih cabang **hostinger** pada koneksi
   repository, pertahankan direktori tujuan **public_html**, lalu lakukan
   Deploy/Redeploy. Jika opsi pengubahan cabang tidak tersedia, gunakan
   alur pengubahan/koneksi repository yang disediakan panel setelah backup.
6. Pastikan Deploy otomatis aktif untuk cabang `hostinger`. Push berikutnya
   tetap dilakukan ke `main`; GitHub menyiapkan hasilnya pada `hostinger`.
   Jangan mengedit cabang hasil build secara manual. Riwayatnya diperbarui
   tanpa force push. Jika auto deploy belum berjalan, gunakan Redeploy.

Tidak perlu FTP password atau token Hostinger. Workflow menggunakan Node.js
24 di GitHub, bukan pada hosting; penghubung formulir PHP tetap ikut rilis.
Workflow hanya menerima push ke `main` atau pemicu manual dari `main`.
Build/pemeriksaan yang gagal tidak memperbarui cabang rilis. Rilis dari
push yang sudah tertinggal dilewati. Izin token hanya untuk repository yang
sama, bukan untuk memasang atau mengaktifkan koneksi Hostinger.

Aktivasi penghubung Google untuk formulir dilakukan terpisah sesuai
[GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md). Konfigurasi privat tetap
di luar `public_html`. URL aktivasi akun Supabase perlu disesuaikan ke domain
produksi oleh pengelola setelah website produksi berhasil diverifikasi.

## Pemeriksaan setelah pemasangan

View Page Source pada domain harus memanggil `/assets/main-....js`, bukan
`/src/bootstrap.js`. File JavaScript itu harus tersedia, bukan 404. Periksa
halaman publik serta admin pada domain yang sebenarnya; build lokal atau
status workflow berhasil belum membuktikan deployment Hostinger berhasil.

Pemeriksaan lokal sebelum memindahkan perubahan:

```sh
npm test
npm run build
npm run hostinger:check
```

Referensi: [Git deployment PHP/HTML Hostinger](https://www.hostinger.com/support/1583302-how-to-deploy-a-git-repository-in-hostinger/),
[penulisan commit dengan token bawaan GitHub](https://github.com/actions/checkout#push-a-commit-using-the-built-in-token).
