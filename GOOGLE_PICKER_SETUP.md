# Popup pemilih foto Google Drive

Klik **Dari Drive** pada editor untuk memilih foto lewat Google Picker resmi.
Tampilan awal berupa grid thumbnail dengan filter JPG, PNG, WebP, dan GIF.
Akun Google yang dipilih perlu memiliki akses ke foto kegiatan.

Status penyiapan **5 November 2026**: proyek **An-Nahl Website Media** dengan
ID `annahl-website-media-2026` sudah dibuat di akun pondok. **Google Drive API**
sudah aktif. Formulir identitas aplikasi **An-Nahl Website** sudah diisi dengan
email pondok dan audience **External**, yang mulai dalam mode Testing.
Formulir tersebut belum dikirim karena tahap akhir meminta persetujuan
Google API Services User Data Policy. Aktivasi Google Picker API juga menunggu
persetujuan ketentuan Google API. API key dan OAuth Client ID belum dibuat.

Ketiga nilai publik belum dipasang pada build. Sementara nilainya belum
tersedia, tombol tetap membuka galeri foto pondok yang sudah ada. Mode demo
memakai foto lokal. Gunakan proyek di atas saat melanjutkan langkah berikut.

## 1. Siapkan satu proyek Google Cloud

Masuk ke Google Cloud Console memakai akun pengelola pondok. Gunakan satu
proyek untuk semua nilai di bawah. Catat **Project number**, yaitu nomor proyek
berupa angka. Aktifkan **Google Picker API** dan **Google Drive API** melalui
**APIs & Services → Library**.

## 2. Atur layar persetujuan Google

Di **Google Auth Platform**, isi identitas aplikasi dan pilih audience yang
sesuai akun pondok. Pada **Data Access**, tambahkan izin
`https://www.googleapis.com/auth/drive.readonly`.

Izin ini memberi aplikasi akses baca Drive akun yang menyetujuinya, termasuk
metadata dan isi file. Kode website hanya mengambil foto yang dipilih melalui
popup. Izin tersebut dipakai agar Google dapat menampilkan grid thumbnail.
Google merekomendasikan tampilan daftar bila memakai scope `drive.file`.
Pengguna perlu memahami izin baca ini sebelum menyetujuinya.

Untuk audience External dengan status Testing, tambahkan email pengurus yang
akan memakai fitur sebagai test users. Akses akun lain dan publikasi aplikasi
dapat memerlukan proses verifikasi Google. Ikuti persyaratan yang ditampilkan
pada proyek.

## 3. Buat OAuth Client ID untuk Web application

Di bagian **Clients**, buat client jenis **Web application**. Tambahkan
**Authorized JavaScript origins** berikut sesuai domain yang dipakai.

```text
https://pondokpesantrenpemberdayaanummatannahl.com
https://www.pondokpesantrenpemberdayaanummatannahl.com
http://localhost:5173
http://127.0.0.1:5173
```

Origin tanpa path atau akhiran slash. Situs memakai alur popup token Google
Identity Services. Salin **Client ID** yang berakhiran
`.apps.googleusercontent.com`. Simpan client secret di lingkungan privat
jika Google membuatkannya.

## 4. Buat API key untuk browser

Di **APIs & Services → Credentials**, buat API key. Batasi penggunaan key ke
**Websites (HTTP referrers)** untuk domain produksi dan origin lokal di atas,
dengan pola yang mencakup halaman website, seperti
`https://pondokpesantrenpemberdayaanummatannahl.com/*`.

Pada **API restrictions**, izinkan **Google Picker API**. Client ID, API key,
dan Project number harus berasal dari proyek yang sama.

## 5. Pasang tiga nilai publik pada build

Untuk lokal, isi di `.env.local`.

```dotenv
VITE_GOOGLE_PICKER_CLIENT_ID=CLIENT_ID_WEB.apps.googleusercontent.com
VITE_GOOGLE_PICKER_API_KEY=API_KEY_PICKER
VITE_GOOGLE_PICKER_APP_ID=NOMOR_PROYEK_ANGKA
```

Mulai ulang server Vite sesudah mengubah konfigurasi lokal.

Untuk produksi melalui GitHub Actions, masukkan tiga nama yang sama pada
**Settings → Secrets and variables → Actions → Variables** di repository
produksi. Workflow build sudah meneruskan ketiganya. Isi seluruh nilai sekaligus.
Ketiga nilai ini adalah konfigurasi publik browser.

## 6. Perbarui penghubung dan terbitkan website

Perbarui `Media.gs` di proyek Apps Script pondok dan deploy versi baru pada
deployment yang sama. Terbitkan frontend dan PHP terbaru, termasuk
`public/api/media.php`. Endpoint `resolve` mengenali foto yang sudah berada
di perpustakaan pondok agar dapat dipakai kembali.

Foto yang dipilih dari luar perpustakaan diambil di browser menggunakan izin
Google pengguna, dioptimalkan hingga 1600 px, lalu disimpan sebagai satu file
di perpustakaan Drive pondok. Thumbnail berada di cache hosting.
Token Google hanya disimpan di memori tab dan dikirim ke API Google.
Server pondok menerima foto, tanpa menerima token Google pengguna.

## 7. Cek dari editor

1. Masuk ke panel pengurus dan buka **Buat postingan**.
2. Tekan **Dari Drive**, lalu **Buka Google Drive** saat menghubungkan akun.
3. Pilih akun dan setujui izin baca setelah memeriksa penjelasannya.
4. Pilih foto lewat thumbnail, lalu tekan tombol pilih milik Google.
5. Pastikan foto muncul di pratinjau editor dan judul/caption tetap tersedia.
6. Batalkan pemilihan untuk memastikan editor kembali tanpa kehilangan isian.
7. Simpan draft lalu buka ulang draft untuk memastikan foto dapat dimuat.

Popup yang diblokir browser, izin yang ditolak, token yang kedaluwarsa,
ukuran foto di atas 12 MB, dan kegagalan penyimpanan ditampilkan di dialog.
Pada akun berikutnya, Google mungkin meminta persetujuan kembali.

## Rujukan

- [Google Picker untuk aplikasi web](https://developers.google.com/workspace/drive/picker/guides/web-picker-sample)
- [Mode grid dan izin thumbnail](https://developers.google.com/workspace/drive/picker/reference/picker.docsviewmode)
- [Token Google Identity Services](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
