# Panduan Setup Google Sheets — Form Pendaftaran An-Nahl

## LANGKAH 1 — Buat Google Sheets

1. Buka https://sheets.google.com
2. Klik "Blank" untuk membuat spreadsheet baru
3. Rename file menjadi: **"Data Pendaftaran Santri An-Nahl"**
4. Di **Row 1**, isi header kolom berikut (PERSIS seperti ini):
   - A1: `Timestamp`
   - B1: `Nama Lengkap`
   - C1: `Tempat Lahir`
   - D1: `Tanggal Lahir`
   - E1: `Jenis Kelamin`
   - F1: `Asal Sekolah`
   - G1: `Program`
   - H1: `Nama Wali`
   - I1: `No WhatsApp`
   - J1: `Email`
   - K1: `Alamat`
   - L1: `Status`  ← (kolom ini untuk admin isi manual: Pending/Diterima/Ditolak)

---

## LANGKAH 2 — Pasang Google Apps Script

1. Di Google Sheets, klik menu **Extensions → Apps Script**
2. Hapus semua kode yang ada, ganti dengan kode berikut:

```javascript
// ═══════════════════════════════════════════
// Google Apps Script — An-Nahl Registration
// Paste this in Extensions > Apps Script
// ═══════════════════════════════════════════

const SHEET_NAME = 'Sheet1'; // Ganti jika nama sheet berbeda

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = JSON.parse(e.postData.contents);

    sheet.appendRow([
      new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }), // Timestamp WIB
      data.nama        || '',
      data.tempatLahir || '',
      data.tanggalLahir|| '',
      data.jenisKelamin|| '',
      data.asalSekolah || '',
      data.program     || '',
      data.namaWali    || '',
      data.noWA        || '',
      data.email       || '',
      data.alamat      || '',
      'Pending',              // Status default
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Data berhasil disimpan' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function — jalankan ini sekali untuk verifikasi
function testConnection() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  Logger.log('Sheet ditemukan: ' + sheet.getName());
  Logger.log('Koneksi berhasil!');
}
```

3. Klik **Save** (ikon disket)
4. Klik **Run → testConnection** untuk memastikan koneksi berjalan
5. Jika muncul popup izin, klik **"Review Permissions" → pilih akun Google Anda → Allow**

---

## LANGKAH 3 — Deploy sebagai Web App

1. Klik tombol **"Deploy"** (pojok kanan atas) → **"New deployment"**
2. Klik ikon gear ⚙ di sebelah "Select type" → pilih **"Web app"**
3. Isi konfigurasi:
   - **Description**: `API Form Pendaftaran An-Nahl`
   - **Execute as**: `Me (email Anda)`
   - **Who has access**: `Anyone` ← PENTING agar website bisa mengirim data
4. Klik **"Deploy"**
5. Salin **Web App URL** yang muncul. Formatnya seperti ini:
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

---

## LANGKAH 4 — Sambungkan ke Website

1. Buka file: `d:\AN-NAHL\src\pages\pendaftaran.js`
2. Temukan baris:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'PASTE_URL_DISINI';
   ```
3. Ganti `PASTE_URL_DISINI` dengan URL Web App dari Langkah 3

---

## LANGKAH 5 — Keamanan Google Sheets (Hanya Admin)

Agar Google Sheets hanya bisa diakses admin:

1. Di Google Sheets, klik **Share** (pojok kanan atas)
2. Pastikan bagian **"General access"** diatur ke **"Restricted"**
3. Tambahkan email admin pesantren di kolom "Add people"
4. Atur permission ke **"Editor"** untuk admin yang perlu mengedit
5. Klik **"Done"**

> ⚠️ PENTING: "Who has access: Anyone" di Apps Script (Langkah 3) hanya mengizinkan
> website MENULIS data (kirim form). Bukan berarti siapapun bisa MEMBUKA Google Sheets-nya.
> Google Sheets tetap private dan hanya bisa dibuka oleh akun yang Anda undang.

---

## Akses Admin — Export PDF

Untuk mengekspor data sebagai PDF:
1. Buka Google Sheets
2. Klik **File → Download → PDF Document**
3. Atur range, orientasi, dll → klik **Export**
