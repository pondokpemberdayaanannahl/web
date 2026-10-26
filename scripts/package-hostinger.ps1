$ErrorActionPreference = 'Stop'
$workspacePath = (Get-Location).ProviderPath
$buildPath = Join-Path $workspacePath 'dist'
if (-not (Test-Path -LiteralPath (Join-Path $buildPath 'api/forms.php'))) { throw 'Jalankan npm run build sebelum menyiapkan paket Hostinger.' }
$artifactPath = Join-Path $workspacePath '.backend-backups/google-forms'
New-Item -ItemType Directory -Path $artifactPath -Force | Out-Null
$privateFile = Join-Path $workspacePath '.backend-backups/sheets-sync/script-properties.json'
$secret = (Get-Content -LiteralPath $privateFile -Raw | ConvertFrom-Json).ANNAHL_SHEETS_SECRET
$manifest = @()
foreach ($file in Get-ChildItem -LiteralPath $buildPath -Recurse -File) {
    $relative = $file.FullName.Substring($buildPath.Length + 1).Replace('\','/')
    if ($file.Name -eq 'forms-config.php' -or $file.Name.StartsWith('.env')) { throw 'Konfigurasi privat ditemukan pada build publik.' }
    if ($file.Extension -in '.html','.js','.css','.php','.json') {
        if ((Get-Content -LiteralPath $file.FullName -Raw).Contains($secret)) { throw 'Kunci penghubung ditemukan pada build publik.' }
    }
    $manifest += [PSCustomObject]@{ path=$relative; bytes=$file.Length; sha256=(Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant() }
}
$manifest | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $artifactPath 'public-release-manifest.json') -Encoding utf8
$zipPath = Join-Path $artifactPath 'hostinger-public.zip'
$buildItems = (Get-ChildItem -LiteralPath $buildPath).FullName
Compress-Archive -LiteralPath $buildItems -DestinationPath $zipPath -Force
Write-Output "Paket publik dibuat: $zipPath"
Write-Output 'Kunci telah diperiksa: tidak ada konfigurasi privat dalam paket publik. Konfigurasi Hostinger berada terpisah di hostinger-private.'
