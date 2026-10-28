$ErrorActionPreference = 'Stop'
# Export public CA certificates already trusted by Windows, for standalone PHP.
$workspacePath = (Get-Location).ProviderPath
$privatePath = Join-Path $workspacePath 'annahl-private'
New-Item -ItemType Directory -Path $privatePath -Force | Out-Null
$certificates = @(Get-ChildItem Cert:\CurrentUser\Root,Cert:\LocalMachine\Root | Sort-Object Thumbprint -Unique)
if (-not $certificates.Count) { throw 'Windows tidak menyediakan sertifikat root untuk PHP lokal.' }
$pem = foreach ($certificate in $certificates) {
    "-----BEGIN CERTIFICATE-----`n" + [Convert]::ToBase64String($certificate.RawData,[Base64FormattingOptions]::InsertLineBreaks) + "`n-----END CERTIFICATE-----`n"
}
[IO.File]::WriteAllText((Join-Path $privatePath 'local-ca.pem'),($pem -join "`n"),[Text.UTF8Encoding]::new($false))
Write-Output "$($certificates.Count) sertifikat publik tepercaya Windows disiapkan untuk PHP lokal."
