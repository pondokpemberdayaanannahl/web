$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$workspacePath = (Get-Location).ProviderPath
$artifactPath = Join-Path $workspacePath '.backend-backups/google-forms'
$publicPath = Join-Path $artifactPath 'hostinger-public.zip'
$manifestPath = Join-Path $artifactPath 'public-release-manifest.json'
$keyFile = Join-Path $workspacePath '.backend-backups/sheets-sync/script-properties.json'
$secret = (Get-Content -LiteralPath $keyFile -Raw | ConvertFrom-Json).ANNAHL_SHEETS_SECRET
if ($secret -notmatch '^[a-f0-9]{64}$') { throw 'Kunci konfigurasi lokal tidak valid.' }
$expected = @{}
foreach ($file in (Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json)) { $expected[$file.path] = $file }
$publicArchive = [IO.Compression.ZipFile]::OpenRead($publicPath)
$verified = 0
try {
    foreach ($entry in $publicArchive.Entries) {
        if (-not $entry.Name) { continue }
        $name = $entry.FullName
        if ($name.Contains('\') -or $name.StartsWith('/') -or $name -match '(^|/)\.\.(/|$)' -or -not $expected.ContainsKey($name)) { throw 'Susunan paket publik tidak sesuai manifest.' }
        $source = $entry.Open()
        $hash = [Security.Cryptography.SHA256]::Create()
        try { $actual = [BitConverter]::ToString($hash.ComputeHash($source)).Replace('-','').ToLowerInvariant() }
        finally { $source.Dispose(); $hash.Dispose() }
        if ($actual -ne $expected[$name].sha256 -or $entry.Length -ne $expected[$name].bytes) { throw "Isi paket berbeda dari manifest: $name" }
        if ($name -match '\.(html|js|css|php|json)$') {
            $reader = [IO.StreamReader]::new($entry.Open())
            try { if ($reader.ReadToEnd().Contains($secret)) { throw 'Kunci privat ditemukan pada paket publik.' } }
            finally { $reader.Dispose() }
        }
        $verified++
    }
    if ($verified -ne $expected.Count) { throw 'Ada berkas publik yang belum masuk paket.' }
} finally { $publicArchive.Dispose() }

$guide = @'
# Mulai di sini — paket pemasangan An-Nahl

Paket ini disiapkan untuk pemasangan manual. Hosting, izin Google baru,
folder lampiran, endpoint Google, dan migrasi pembatasan Supabase belum diaktifkan.
Paket tidak berisi kunci privat. Semua file pada CHECKSUMS.sha256 dapat diperiksa.

## Isi paket

1. 01-public_html.zip — isi website yang sudah dibangun dan penghubung PHP.
2. 02-google-apps-script/ — Code.gs dan appsscript.json untuk akun pondok.
3. 03-contoh-konfigurasi-privat/ — contoh saja, tanpa kunci asli.
4. 04-supabase/ — migrasi pembatasan formulir Supabase menjadi kontak saja.
5. PANDUAN-LENGKAP.md — langkah dan pemeriksaan lengkap.

## Urutan pemasangan

1. Simpan backup website sebelum mengganti file di Hostinger. Pastikan website
   PHP/HTML dengan PHP 8.1+ dan cURL; paket ini tidak ditujukan untuk Website Builder.
2. Masuk ke akun pondokpemberdayaanannahl@gmail.com. Buka Sheet rekap pondok,
   lalu Extensions → Apps Script. Pasang kedua file dari 02-google-apps-script.
3. Pertahankan properti ANNAHL_SPREADSHEET_ID dan ANNAHL_SHEETS_SECRET yang
   sudah diisi. Pemilik perlu meninjau izin Google baru sebelum menjalankan setup.
4. Jalankan setupGoogleForms, kemudian checkGoogleFormsSetup. Folder Drive
   lampiran dibuat privat pada akun pondok. Tidak diperlukan trigger lima menit.
5. Deploy sebagai Web app yang berjalan sebagai akun pondok. Hosting harus dapat
   menjangkau endpoint. Kode tetap mensyaratkan tanda tangan server pada setiap kiriman.
6. Salin URL deployment berakhiran /exec ke apps_script_url dalam konfigurasi PHP
   privat. File privat yang sudah berisi kunci disiapkan terpisah di komputer proyek,
   bukan di ZIP ini. Jika memakai contoh, isi kunci yang sama dengan properti Google.
7. Letakkan konfigurasi asli pada annahl-private/forms-config.php DI LUAR public_html.
   Jangan mengunggah konfigurasi asli ke folder publik atau memasukkannya ke Git.
8. Ekstrak ISI 01-public_html.zip ke public_html. Jangan menaruh paket induk ini
   sebagai isi website. File api/forms.php harus berada di public_html/api/forms.php.
9. Setelah jalur Google siap dan rilis formulir dipasang, terapkan migrasi di
   04-supabase melalui SQL Editor proyek yang benar. Migrasi tidak menghapus data.
10. Uji satu pendaftaran dan satu konfirmasi donasi dengan data rekaan, foto/PDF,
    lalu coba kirim ulang. Pastikan hanya ada satu baris dan berkas tetap utuh,
    milik akun pondok, serta privat. Bersihkan hanya data uji yang sengaja dibuat.

## Hasil yang diharapkan

- Isian pendaftaran/donasi tersimpan di Google Sheets, lampiran di Google Drive pondok.
- Sheet menyediakan tautan lampiran. Status tindak lanjut diubah di Sheet.
- Supabase tetap dipakai untuk berita, galeri editorial, login pengurus, dan kontak.
- Jika konfigurasi Google belum lengkap, formulir menampilkan pesan belum siap.
  Menyalin paket publik saja tidak otomatis mengaktifkan penyimpanan Google.

Lampiran: maksimal 3 file, 2 MB per file, 5 MB total. Format JPG/JPEG, PNG, WebP,
PDF, DOCX, XLSX, PPTX. Konfirmasi donasi tidak membuktikan transfer bank sudah masuk.
'@

$files = @(
    @{ Path=$publicPath; Name='01-public_html.zip'; Level=[IO.Compression.CompressionLevel]::NoCompression },
    @{ Path=(Join-Path $workspacePath 'integrations/google-sheets/Code.gs'); Name='02-google-apps-script/Code.gs'; Level=[IO.Compression.CompressionLevel]::Optimal },
    @{ Path=(Join-Path $workspacePath 'integrations/google-sheets/appsscript.json'); Name='02-google-apps-script/appsscript.json'; Level=[IO.Compression.CompressionLevel]::Optimal },
    @{ Path=(Join-Path $workspacePath 'integrations/hostinger/forms-config.example.php'); Name='03-contoh-konfigurasi-privat/forms-config.example.php'; Level=[IO.Compression.CompressionLevel]::Optimal },
    @{ Path=(Join-Path $workspacePath 'supabase/migrations/202610260002_google_forms_boundary.sql'); Name='04-supabase/202610260002_google_forms_boundary.sql'; Level=[IO.Compression.CompressionLevel]::Optimal },
    @{ Path=(Join-Path $workspacePath 'GOOGLE_SHEETS_SETUP.md'); Name='PANDUAN-LENGKAP.md'; Level=[IO.Compression.CompressionLevel]::Optimal },
    @{ Path=$manifestPath; Name='public-release-manifest.json'; Level=[IO.Compression.CompressionLevel]::Optimal }
)
$kitPath = Join-Path $artifactPath 'paket-pemasangan-an-nahl.zip'
$fileStream = [IO.File]::Open($kitPath,[IO.FileMode]::Create,[IO.FileAccess]::ReadWrite)
$archive = [IO.Compression.ZipArchive]::new($fileStream,[IO.Compression.ZipArchiveMode]::Create,$false)
$checksums = @()
try {
    foreach ($file in $files) {
        if ($file.Name -ne '01-public_html.zip' -and (Get-Content -LiteralPath $file.Path -Raw).Contains($secret)) { throw 'Berkas berkunci tidak boleh masuk paket pemasangan.' }
        $entry = $archive.CreateEntry($file.Name,$file.Level)
        $source = [IO.File]::OpenRead($file.Path); $target = $entry.Open()
        try { $source.CopyTo($target) } finally { $source.Dispose(); $target.Dispose() }
        $checksums += (Get-FileHash -LiteralPath $file.Path -Algorithm SHA256).Hash.ToLowerInvariant() + '  ' + $file.Name
    }
    $guideEntry = $archive.CreateEntry('00-MULAI-DI-SINI.md',[IO.Compression.CompressionLevel]::Optimal)
    $guideBytes = [Text.UTF8Encoding]::new($false).GetBytes($guide)
    $guideStream = $guideEntry.Open()
    try { $guideStream.Write($guideBytes,0,$guideBytes.Length) } finally { $guideStream.Dispose() }
    $guideHash = [Security.Cryptography.SHA256]::Create()
    try { $checksums += [BitConverter]::ToString($guideHash.ComputeHash($guideBytes)).Replace('-','').ToLowerInvariant() + '  00-MULAI-DI-SINI.md' }
    finally { $guideHash.Dispose() }
    $checksumEntry = $archive.CreateEntry('CHECKSUMS.sha256',[IO.Compression.CompressionLevel]::Optimal)
    $writer = [IO.StreamWriter]::new($checksumEntry.Open(),[Text.UTF8Encoding]::new($false))
    try { $writer.Write(($checksums -join "`n") + "`n") } finally { $writer.Dispose() }
} finally { $archive.Dispose(); $fileStream.Dispose() }

# Verify the saved outer archive against its checksum list, not only the source files.
$savedArchive = [IO.Compression.ZipFile]::OpenRead($kitPath)
try {
    $seen = 0
    foreach ($line in $checksums) {
        $parts = $line -split '  ',2
        $entry = $savedArchive.GetEntry($parts[1])
        if (-not $entry) { throw 'Paket pemasangan belum lengkap.' }
        $stream = $entry.Open(); $hash = [Security.Cryptography.SHA256]::Create()
        try { $actual = [BitConverter]::ToString($hash.ComputeHash($stream)).Replace('-','').ToLowerInvariant() }
        finally { $stream.Dispose(); $hash.Dispose() }
        if ($actual -ne $parts[0]) { throw 'Checksum paket pemasangan tidak sesuai.' }
        $seen++
    }
} finally { $savedArchive.Dispose() }
Write-Output "Paket pemasangan selesai: $kitPath"
Write-Output "$verified berkas publik dan $seen komponen pemasangan terverifikasi. Kunci privat tetap terpisah."
