# Pondok Pesantren Pemberdayaan Ummat An-Nahl
## Website Landing Page & Formulir Pendaftaran Santri Baru (PSB) Online

Website resmi dan sistem penerimaan santri baru (PSB) untuk **Pondok Pesantren Pemberdayaan Ummat An-Nahl**. Dibuat menggunakan HTML5, Vanilla CSS3, dan Modern JavaScript murni tanpa dependency eksternal yang rumit, sehingga **sangat ringan (blazing fast load time < 1 detik)**, mobile-responsive, dan **bisa langsung dipush dan online gratis di GitHub Pages**.

---

### ✨ Fitur Utama Website

1. **Desain Modern Islamic Premium**:
   - Skema warna elegan: Emerald Green (`#083D2F`), Radiant Gold (`#D8AA30`), dan Ivory White.
   - Tipografi modern Google Fonts (*Plus Jakarta Sans* & *Amiri* untuk ayat Al-Qur'an).
   - Glassmorphism header, micro-interactions, floating badges, dan Islamic geometric background.

2. **Landing Page Lengkap (`index.html`)**:
   - **Hero Section**: Headline representatif, badge info PSB, kutipan basmalah, tombol CTA, dan animasi counter statistik capaian santri.
   - **Profil & Filosofi An-Nahl**: Makna filosofi lebah (Surah An-Nahl: 68-69) dan 4 nilai inti pesantren.
   - **Program Pendidikan**: MTs/SMP Terpadu, MA/SMA Terpadu, dan Takhassus Tahfidz 30 Juz & Kemandirian.
   - **Keunggulan & Karakter**: Adab sebelum ilmu, bilingual environment (Arab & Inggris), agropreneur ummat.
   - **Fasilitas**: Sarana ibadah, asrama beradab, lab digital, green house hidroponik, dan olahraga sunnah.
   - **Alur & Transparansi Biaya**: 4 tahapan PSB dan rincian infaq yang jelas termasuk beasiswa yatim/dhuafa.
   - **Testimoni & FAQ**: Accordion interaktif tanya-jawab dan ulasan orang tua santri.
   - **Sekretariat & Kontak**: Peta alamat, nomor hotline, email, dan integrasi WhatsApp.

3. **Formulir Pendaftaran Online Interaktif (`pendaftaran.html`)**:
   - **Multi-Step Wizard 4 Langkah**:
     - *Langkah 1*: Data Calon Santri & Jenjang Pilihan (MTs/MA/Takhassus/Beasiswa, NIK, NISN, TTL, Asal Sekolah, Riwayat Hafalan).
     - *Langkah 2*: Data Orang Tua / Wali (Nama, Status, No. WhatsApp Aktif, Pekerjaan, Alamat Domisili).
     - *Langkah 3*: Data Kesehatan, Ukuran Seragam Santri, & Catatan Orang Tua.
     - *Langkah 4*: Ringkasan Konfirmasi Data & Pernyataan Persetujuan.
   - **Validasi Otomatis**: Memastikan tidak ada data wajib yang terlewat.
   - **Draft Auto-Save**: Otomatis menyimpan isian di browser (LocalStorage) agar data tidak hilang jika tab tidak sengaja tertutup.
   - **Nomor Registrasi Otomatis**: Menghasilkan kode pendaftaran unik (contoh: `AN-25-7821`).
   - **Kirim Otomatis ke WhatsApp Admin**: Mengonversi formulir menjadi pesan WhatsApp rapi siap kirim ke panitia PSB.
   - **Cetak / PDF Kartu Bukti Pendaftaran**: Dilengkapi format cetak resmi (Print Layout) untuk dibawa saat tes seleksi.

---

### 🚀 Cara Menjalankan Secara Lokal

Cukup buka file `index.html` langsung di browser Anda (Google Chrome, Edge, Safari, Firefox), atau gunakan ekstensi seperti **Live Server** di VS Code.

---

### 🌐 Cara Push ke GitHub & Aktifkan GitHub Pages (1 Menit)

#### Langkah 1: Buat Repository Baru di GitHub
1. Buka [github.com/new](https://github.com/new).
2. Beri nama repository, misalnya `pesantren-annahl`.
3. Pilih **Public**. Jangan centang "Initialize with README" karena file sudah dibuat.
4. Klik **Create repository**.

#### Langkah 2: Hubungkan & Push dari Terminal / PowerShell
Jalankan perintah berikut di folder ini:

```bash
# 1. Inisialisasi git dan commit file
git init
git add .
git commit -m "feat: inisialisasi website landing page & psb ponpes an-nahl"

# 2. Ganti nama branch utama ke main
git branch -M main

# 3. Hubungkan dengan repository GitHub Anda (ganti USERNAME dan REPO_NAME)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# 4. Push ke GitHub
git push -u origin main
```

#### Langkah 3: Aktifkan GitHub Pages (Gratis Hosting)
1. Buka repository Anda di GitHub.
2. Masuk ke menu **Settings** > **Pages** (di sidebar kiri).
3. Pada bagian **Build and deployment** > **Source**, pilih **Deploy from a branch**.
4. Pilih branch `main` dan folder `/(root)`, lalu klik **Save**.
5. Tunggu sekitar 1 menit, website Anda sudah aktif di internet dengan URL:
   `https://USERNAME.github.io/REPO_NAME/`

---

### ⚙️ Konfigurasi Nomor WhatsApp Panitia PSB

Untuk mengganti nomor WhatsApp panitia penerima pendaftaran santri baru:
Buka file [`js/pendaftaran.js`](js/pendaftaran.js) dan ubah nilai pada baris ke-7:

```javascript
const CONFIG = {
  ADMIN_WA: '6281398908980', // Nomor WhatsApp resmi panitia
  TAHUN_AJARAN: '2025/2026',
  ...
};
```

---

&copy; 2025 Pondok Pesantren Pemberdayaan Ummat An-Nahl.
