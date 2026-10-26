# Regenerate optimized assets after changing references in src/data/photos.js.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceText = Get-Content -LiteralPath (Join-Path $projectRoot 'src/data/photos.js') -Raw
$pattern = @'
photo\((?:'([^']*)'|"([^"]*)")\)
'@
$references = [regex]::Matches($sourceText, $pattern.Trim()) | ForEach-Object {
  if ($_.Groups[1].Success) { $_.Groups[1].Value } else { $_.Groups[2].Value }
} | Sort-Object -Unique
$outputDirectory = Join-Path $projectRoot 'public/media'
New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$manifest = [ordered]@{}
[long]$sourceBytes = 0
[long]$optimizedBytes = 0
foreach ($relative in $references) {
  $inputPath = Join-Path (Join-Path $projectRoot 'picture') $relative
  $sourceBytes += (Get-Item -LiteralPath $inputPath).Length
  $digest = (Get-FileHash -LiteralPath $inputPath -Algorithm SHA256).Hash.Substring(0,16).ToLowerInvariant()
  $image = [System.Drawing.Image]::FromFile($inputPath)
  try {
    if ($image.PropertyIdList -contains 274) {
      $orientation = [BitConverter]::ToUInt16($image.GetPropertyItem(274).Value,0)
      $rotation = switch ($orientation) { 2 { 'RotateNoneFlipX' } 3 { 'Rotate180FlipNone' } 4 { 'Rotate180FlipX' } 5 { 'Rotate90FlipX' } 6 { 'Rotate90FlipNone' } 7 { 'Rotate270FlipX' } 8 { 'Rotate270FlipNone' } default { 'RotateNoneFlipNone' } }
      $image.RotateFlip([System.Drawing.RotateFlipType]::$rotation)
    }
    foreach ($edge in @(1600,480)) {
      $scale = [Math]::Min([double]1,$edge / [double][Math]::Max($image.Width,$image.Height))
      $width = [Math]::Max(1,[int][Math]::Round($image.Width*$scale))
      $height = [Math]::Max(1,[int][Math]::Round($image.Height*$scale))
      $bitmap = New-Object System.Drawing.Bitmap($width,$height)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $parameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
      try {
        $graphics.Clear([System.Drawing.Color]::White)
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.DrawImage($image,0,0,$width,$height)
        $parameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]80)
        $outputPath = Join-Path $outputDirectory "$digest-$edge.jpg"
        $bitmap.Save($outputPath,$encoder,$parameters)
        $optimizedBytes += (Get-Item -LiteralPath $outputPath).Length
      } finally { $graphics.Dispose(); $bitmap.Dispose(); $parameters.Dispose() }
    }
    $manifest[$relative] = @{ full="/media/$digest-1600.jpg"; thumbnail="/media/$digest-480.jpg" }
  } finally { $image.Dispose() }
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $projectRoot 'src/data/photo-manifest.json') -Encoding utf8
Write-Output "Optimized $($references.Count) referenced photos: $([Math]::Round($sourceBytes/1MB,1)) MB original -> $([Math]::Round($optimizedBytes/1MB,1)) MB including thumbnails."
