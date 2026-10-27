# Integrasi editorial dan formulir An-Nahl

## Kondisi checkout ini

Login dummy `admin / 123` hanya tersedia pada Vite development. Data demo disimpan di `sessionStorage`, tidak dikirim ke Supabase, dan tidak tampil di website publik. Teks autosave disimpan terpisah di `localStorage` per akun, lingkungan, dan ID berita. Foto pilihan harus dipilih kembali setelah reload.

Pada 26 Oktober 2026, konfigurasi proyek Supabase `an-nahl` sudah tersambung dan migrasi `202610260001_editorial.sql` berhasil diterapkan pada `main / Production` setelah persetujuan pengguna. Sebelum penerapan, keenam tabel aplikasi, policy terkait, bucket foto, dan akun Auth masih kosong. Snapshot objek yang terdampak disimpan lokal dalam `.backend-backups/` (bukan dump seluruh database).

Tujuh pemeriksaan API anonim lulus. Skenario SQL pada `supabase/tests/editorial_rls.sql` juga lulus untuk privasi anonim, kepemilikan draft penulis, penerbitan/arsip/pemulihan oleh admin, riwayat, kotak masuk, dan akun nonaktif. Semua akun dan data fixture di-rollback; pengujian ini tidak menggantikan pengujian login GoTrue dan unggahan browser dengan akun manusia.

Akun pengurus pertama sudah diundang dan diberi peran admin aktif. Penerima perlu membuka email undangan dan menentukan password sendiri. Site URL sementara adalah `http://127.0.0.1:5173/admin.html`, sesuai lingkungan lokal yang disetujui. Ganti dengan domain HTTPS website saat deployment. Halaman aktivasi/recovery tersedia di panel admin; tautan yang masuk lewat beranda diteruskan ke halaman admin sebelum sesi diproses SDK.

Mode dummy dinonaktifkan pada `.env` lokal setelah aktivasi backend. Flag dapat diaktifkan kembali untuk pengembangan terisolasi; build produksi tetap mengabaikan akun dummy. Pengujian interaktif pada ponsel, unggahan Storage dengan akun asli, dan proteksi spam/rate limiting untuk trafik publik masih harus diselesaikan sebelum rilis publik.

## Pembaruan pengelola website — 27 Oktober 2026

Akun pondok telah berhasil login di domain produksi menurut konfirmasi pengguna.
Frontend hasil build dipasang oleh pengguna melalui repository `pondokpemberdayaanannahl/web`,
cabang hasil build `hostinger`. Menu Isi website, kartu postingan, editor bagian,
draft/terbit, riwayat, dan pintasan edit publik disiapkan lokal pada pembaruan
berikutnya. Migrasi `202610270003_site_content.sql` belum diterapkan ke Supabase.
Lihat [PENGELOLAAN_WEBSITE.md](./PENGELOLAAN_WEBSITE.md) untuk pemasangan dan batasnya.
Penerima pendaftaran/donasi di domain diperiksa dan masih membalas 503 karena
konfigurasi privat belum terbaca; jangan menyatakan penghubung Google aktif.

## Urutan aktivasi

1. Gunakan proyek staging milik tim dan buat backup database/policies yang ada.
2. Periksa `supabase/migrations/202610260001_editorial.sql` terhadap skema yang sudah ada. Migrasi menambah kolom editorial, riwayat, daftar pengurus, kotak masuk, serta bucket foto. Policy pada enam tabel aplikasi diganti dengan aturan eksplisit; policy di tabel lain tidak diubah. Bucket foto menjadi publik dan dibatasi 2 MB per file.
3. Jalankan migrasi melalui Supabase SQL Editor atau workflow migrasi tim. Tidak ada kode browser yang menjalankannya.
4. Buat/undang akun pengurus melalui Supabase Auth. Inisialisasi admin pertama melalui SQL Editor dengan email akun yang benar:

   ```sql
   insert into public.pengurus (id, display_name, role, active)
   select id, 'Admin Pondok', 'admin', true
   from auth.users where email = 'GANTI_EMAIL_ADMIN_TIM'
   on conflict (id) do update set role = 'admin', active = true;
   ```

   Untuk penulis, gunakan `role = 'editor'`. Pengurus tidak bisa mendaftar sendiri dari website. Panel Kelola Akun mengubah peran/status akun yang sudah dicatat di tabel pengurus; pembuatan akun Auth tetap melalui admin proyek. Penurunan peran/penonaktifan akun sendiri ditolak.

5. Isi `.env` lokal dengan URL proyek dan **public anon/publishable key**, lalu restart Vite:

   ```dotenv
   VITE_SUPABASE_URL=https://PROYEK.supabase.co
   VITE_SUPABASE_ANON_KEY=PUBLIC_KEY_PROYEK
   VITE_DUMMY_LOGIN_ENABLED=false
   ```

   Jangan memasukkan service-role key ke variabel `VITE_*`. `.env` sudah diabaikan Git.
6. Aktifkan rilis frontend dan migrasi dalam satu rollout. Frontend kini membaca kolom `status`, `deleted_at`, `thumbnail_url`, dan `caption`; jika migrasi belum diterapkan, permintaan akan gagal secara terlihat, tanpa beralih ke data lama yang bisa membocorkan draft.

## Perilaku dan hak akses

- Publik hanya membaca berita `published` tanpa `deleted_at`. Berita draft dan arsip tidak masuk daftar publik.
- Penulis aktif hanya membuat/mengubah draft miliknya. Admin menerbitkan berita, mengarsipkan, memulihkan, mengelola galeri dan akun, serta membaca kotak masuk.
- Arsip berita bersifat lunak; pemulihan menghasilkan draft agar tidak langsung terbit. Riwayat merekam snapshot, aktor, tindakan, dan waktu melalui trigger database. Tombol Gunakan Versi Ini memulihkan **teks** ke editor; foto saat ini dipertahankan dan perubahan masih harus disimpan.
- Penyimpanan perubahan berita membandingkan `updated_at` yang dibuka pengurus. Jika versi di server sudah berubah, editor menolak menimpa dan mempertahankan teks lokal.
- Cover berita lama dipertahankan untuk referensi riwayat. Belum ada purge otomatis atau penghapusan permanen berita.
- Bucket cover/galeri publik. Jangan mengunggah foto rahasia ke draft. Penulis dapat membersihkan unggahan miliknya yang gagal tersimpan dan belum dirujuk berita/riwayat. Penggantian file dilakukan dengan nama acak baru, tanpa overwrite.
- Foto JPG/PNG/WebP diproses di browser: sisi panjang maksimal 1600 px, thumbnail 480 px, hasil unggahan maksimal 2 MB. GIF dan browser tanpa `createImageBitmap` memakai file asli maksimal 2 MB. Tidak ada library pemrosesan gambar tambahan.
- Foto statis yang dirujuk website sudah dibuatkan versi JPEG 1600 px dan thumbnail 480 px dalam `public/media`. Manifest berada di `src/data/photo-manifest.json`; sumber asli tidak diubah. Setelah menambah/mengganti referensi foto, jalankan `scripts/optimize-photos.ps1` pada Windows lalu commit hasil dan manifest. Jangan memakai ukuran berkas gzip JavaScript sebagai ukuran total halaman bergambar.
- Galeri publik membaca Supabase dengan pagination. Foto statis hanya digunakan ketika backend belum dikonfigurasi; video contoh yang tidak terkait pondok sudah dihapus.
- Galeri admin memiliki tab **Foto folder** untuk seluruh 149 foto lokal, **Foto unggahan** untuk Supabase, dan **Video**. Tab lokal menyediakan pencarian nama/kegiatan, filter folder, pengurutan, 24 foto per halaman, dan pratinjau dengan navigasi keyboard. Seluruh 24 HEIC memiliki pratinjau JPEG; satu MP4 tidak dihitung sebagai foto. Melihat katalog tidak otomatis menerbitkan isinya ke galeri publik.
- Pesan kontak memakai `form_submissions` dengan izin publik insert saja. Pendaftaran dan konfirmasi donasi dalam kode baru memakai penghubung PHP Hostinger untuk langsung menyimpan di Google Sheets dan Drive akun pondok, tanpa fallback Supabase. Pesan sukses menunggu tanda terima ID yang sesuai. Konfirmasi donasi bukan verifikasi pembayaran dan tidak memproses transfer.
- Sheet rekap sudah privat. Kode Google/PHP dan lampiran sudah disiapkan serta diuji lokal; penerapan Google dan Hostinger **belum aktif**. Izin akun hosting dan izin Google untuk penyimpanan baru masih diperlukan. Migrasi `202610260002_google_forms_boundary.sql` disiapkan (belum diterapkan) untuk membatasi insert Supabase menjadi kontak saja tanpa menghapus data. Rancangan sinkronisasi lama dipindahkan ke `integrations/google-sheets/legacy/` dan tidak dijalankan. Lihat [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md).
- Migrasi editorial pertama tidak mencakup CMS program. Pembaruan `202610270003_site_content.sql` menambahkan Isi website untuk informasi program dan halaman lain setelah diterapkan.

## Verifikasi staging sebelum rilis

1. Pengunjung anonim: tidak dapat membaca draft, arsip, riwayat, profil, atau kiriman formulir; dapat membaca berita terbit/galeri dan mengirim formulir valid. Insert dengan status selain `baru` harus ditolak.
2. Penulis A/B: A tidak dapat mengubah draft B, menerbitkan berita, mengubah akun, atau membaca kotak masuk. Uji juga melalui request API langsung, bukan hanya tombol UI.
3. Admin: tambah/edit/terbit/arsip/pulihkan berita; perubahan tercatat di riwayat. Coba pemulihan teks dan terbitkan ulang. Pastikan penonaktifan pengurus memblokir operasi berikutnya pada database.
4. Uji unggah foto, thumbnail, cleanup ketika insert gagal, format salah, file di atas batas, serta ukuran hasil di ponsel. Draft teks tetap private walaupun URL cover publik.
5. Kirim pendaftaran, pesan, dan konfirmasi donasi dengan data uji; cek bahwa hanya admin bisa membacanya dan mengubah status. Uji jaringan putus/retry dan periksa tidak ada duplikasi ID.
6. Uji di browser desktop dan ponsel: dialog/fokus keyboard, autosave setelah reload, pencarian cepat, filter draft/arsip, dan pagination galeri.

Endpoint formulir publik memerlukan mitigasi spam/rate limiting sesuai lingkungan hosting sebelum dipromosikan untuk trafik publik. Tidak ada klaim bahwa pengujian unit lokal menggantikan pengujian RLS atau beban pada staging.

Referensi: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) dan [Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control).

## Pengujian lokal

```text
npm test
npm run build
npm run backend:check
```

Tes memakai penyimpanan dan respons API tiruan. Tidak mengirim data ke Supabase atau menjalankan migrasi.

`backend:check` berbeda: perintah ini menggunakan URL/public key dari `.env` untuk pemeriksaan API anonim secara read-only. Tidak mencetak kunci, tidak menjalankan migrasi, dan tidak mengirim formulir. Hasil lulus bukan pengganti pengujian akun admin/penulis pada staging.

## Memperbarui seluruh katalog foto

Setelah menambah atau mengganti foto dalam `picture/`, jalankan generator lalu build ulang. Generator tidak mengubah atau menghapus foto asli.

Persiapan sekali pada Windows:

```powershell
python -m venv .photo-tools-venv
.\.photo-tools-venv\Scripts\python.exe -m pip install -r scripts/requirements-photos.txt
```

Kemudian:

```text
npm run photos:library
npm run build
```

Python dapat ditentukan melalui environment `PHOTO_PYTHON`. Decoder HEIC hanya dipakai saat membuat aset dan tidak dikirim ke browser. Manifest `src/data/photo-library.json` dimuat ketika tab Foto folder dibuka, bukan saat login. Simpan manifest dan aset `public/media` ke Git bersama perubahan foto; direktori alat/venv diabaikan Git. Pembersihan aset lama tidak dilakukan otomatis.
