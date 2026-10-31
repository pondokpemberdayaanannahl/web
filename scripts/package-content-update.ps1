$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$workspacePath = (Get-Location).ProviderPath
$artifactPath = Join-Path $workspacePath '.backend-backups/site-content-qa'
New-Item -ItemType Directory -Path $artifactPath -Force | Out-Null
$files = @(
    'src/username-login.js','public/api/login.php','public/api/login-core.php','public/api/forms-core.php',
    'integrations/hostinger/login-config.example.php','tests/username-login.test.js','tests/login-php.php','scripts/check-login-http.mjs','USERNAME_LOGIN_SETUP.md',
    'index.html','admin.html','login.html','vite.config.js','package.json','package-lock.json',
    'src/admin.js','src/admin-data.js','src/drive-media.js','src/drive-picker.js','src/migrate-drive-media.js','src/admin-session.js','src/login.js','src/auth-flow.js','src/bootstrap.js','src/main.js','src/router.js','src/donation-payment.js',
    'src/components/navbar.js','src/components/footer.js','src/components/social-icon.js','src/components/category-cards.js','src/pages/kontak.js','src/pages/donasi.js','src/pages/berita.js','src/pages/galeri.js',
    'src/site-content.js','src/site-content-store.js','src/site-content-admin.js',
    'src/site-page-templates.js','src/public-editor-shortcut.js',
    'src/styles/admin.css','src/styles/admin-content.css','src/styles/editor-shortcut.css','src/styles/pages.css',
    'public/brand/an-nahl.png','public/.htaccess','public/api/media.php','public/api/media-core.php','public/api/media-image.php','integrations/hostinger/media-config.example.php','integrations/google-sheets/Code.gs','integrations/google-sheets/Media.gs','integrations/google-sheets/appsscript.json',
    'supabase/migrations/202610270003_site_content.sql',
    'scripts/check-site-content-sql.mjs','scripts/prepare-drive-media.mjs','scripts/prepare-local-tls.ps1','scripts/import-drive-photos.mjs','scripts/drive-request.mjs','scripts/check-backend.mjs','scripts/check-hostinger-build.mjs','scripts/package-content-update.ps1',
    'tests/site-content.test.js','tests/site-content-ui.test.js',
    'tests/router-content.test.js','tests/public-pages.test.js','tests/admin-ui.test.js','tests/admin-data.test.js','tests/drive-media.test.js','tests/media-build.test.js','tests/drive-receiver.test.js','tests/drive-request.test.js','tests/media-php.php','tests/login.test.js','tests/auth-flow.test.js','tests/donation-payment.test.js','tests/hostinger-deploy.test.js',
    'PENGELOLAAN_WEBSITE.md','BACKEND_SETUP.md','GOOGLE_SHEETS_SETUP.md','HOSTINGER_GITHUB_SETUP.md','DRIVE_MEDIA_SETUP.md'
)
$secrets = @()
$properties = Join-Path $workspacePath '.backend-backups/sheets-sync/script-properties.json'
if (Test-Path -LiteralPath $properties) {
    $secret = (Get-Content -LiteralPath $properties -Raw | ConvertFrom-Json).ANNAHL_SHEETS_SECRET
    if ($secret -match '^[a-f0-9]{64}$') { $secrets += $secret }
}
$photoKeyPath = Join-Path $workspacePath '.backend-backups/drive-media/signing-key.json'
if (Test-Path -LiteralPath $photoKeyPath) {
    $photoKey = (Get-Content -LiteralPath $photoKeyPath -Raw | ConvertFrom-Json).key
    if ($photoKey -match '^[a-f0-9]{64}$') { $secrets += $photoKey }
}
$checksums = @()
foreach ($name in $files) {
    $path = Join-Path $workspacePath $name
    if ([IO.Path]::GetExtension($path) -ne '.png') {
        $text = Get-Content -LiteralPath $path -Raw
        foreach ($secret in $secrets) { if ($text.Contains($secret)) { throw 'Kunci privat tidak boleh masuk paket pembaruan.' } }
    }
    $checksums += (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() + '  ' + $name
}
$zipPath = Join-Path $artifactPath 'update-pengurus-website.zip'
$stream = [IO.File]::Open($zipPath,[IO.FileMode]::Create,[IO.FileAccess]::ReadWrite)
$archive = [IO.Compression.ZipArchive]::new($stream,[IO.Compression.ZipArchiveMode]::Create,$false)
try {
    foreach ($name in $files) { [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,(Join-Path $workspacePath $name),$name,[IO.Compression.CompressionLevel]::Optimal) | Out-Null }
    $entry = $archive.CreateEntry('CHECKSUMS.sha256')
    $writer = [IO.StreamWriter]::new($entry.Open(),[Text.UTF8Encoding]::new($false))
    try { $writer.Write(($checksums -join "`n") + "`n") } finally { $writer.Dispose() }
} finally { $archive.Dispose(); $stream.Dispose() }
$saved = [IO.Compression.ZipFile]::OpenRead($zipPath)
try {
    if ($saved.Entries.Count -ne $files.Count + 1) { throw 'Jumlah berkas pembaruan tidak sesuai.' }
    foreach ($line in $checksums) {
        $parts = $line -split '  ',2
        $entry = $saved.GetEntry($parts[1]); if (-not $entry) { throw 'Berkas pembaruan belum lengkap.' }
        $inputStream = $entry.Open(); $hash = [Security.Cryptography.SHA256]::Create()
        try { $actual = [BitConverter]::ToString($hash.ComputeHash($inputStream)).Replace('-','').ToLowerInvariant() }
        finally { $inputStream.Dispose(); $hash.Dispose() }
        if ($actual -ne $parts[0]) { throw 'Isi paket pembaruan tidak sesuai sumber.' }
    }
} finally { $saved.Dispose() }
Write-Output "$($files.Count) berkas pembaruan terverifikasi: $zipPath"
Write-Output 'Paket untuk repository sumber web. Tidak memuat .env, konfigurasi Google privat, atau node_modules.'
