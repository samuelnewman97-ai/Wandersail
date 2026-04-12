#
# Wandersail PWA icon generator
# Outputs PNG icons for the web manifest and iOS home screen.
# Run once: .\scripts\generate-pwa-icons.ps1
#
# Generates:
#   public/icons/icon-192.png            (192x192 - Android/standard)
#   public/icons/icon-512.png            (512x512 - Android/standard)
#   public/icons/icon-maskable-512.png   (512x512 maskable - Android adaptive)
#   public/icons/apple-touch-icon.png    (180x180 - iOS home screen)
#

Add-Type -AssemblyName System.Drawing

$root    = Split-Path -Parent $PSScriptRoot
$outDir  = Join-Path $root "public\icons"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

function New-StampIcon {
    param(
        [int]$Size,
        [string]$OutPath,
        [bool]$Maskable = $false
    )

    # Palette
    $cream  = [System.Drawing.Color]::FromArgb(244, 235, 211)
    $ink    = [System.Drawing.Color]::FromArgb(26, 26, 26)
    $teal   = [System.Drawing.Color]::FromArgb(30, 95, 90)
    $orange = [System.Drawing.Color]::FromArgb(217, 98, 43)

    $bmp = New-Object System.Drawing.Bitmap $Size, $Size
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Maskable icons need a safe area with ~40% padding
    if ($Maskable) {
        # Fill full canvas with cream (no transparency) so edges aren't clipped
        $g.Clear($cream)
        $pad = [Math]::Round($Size * 0.20)
    } else {
        $g.Clear($cream)
        $pad = [Math]::Round($Size * 0.09)
    }

    $brushCream  = New-Object System.Drawing.SolidBrush $cream
    $brushInk    = New-Object System.Drawing.SolidBrush $ink
    $brushOrange = New-Object System.Drawing.SolidBrush $orange
    $penInk      = New-Object System.Drawing.Pen $ink, ([single]([Math]::Max(2, $Size * 0.025)))
    $penTeal     = New-Object System.Drawing.Pen $teal, ([single]([Math]::Max(2, $Size * 0.016)))

    # Outer stamp border
    $outer = New-Object System.Drawing.Rectangle $pad, $pad, ($Size - $pad * 2), ($Size - $pad * 2)
    $g.FillRectangle($brushCream, $outer)
    $g.DrawRectangle($penInk, $outer)

    # Inner decorative teal border
    $innerPad = $pad + [Math]::Round($Size * 0.08)
    $inner = New-Object System.Drawing.Rectangle $innerPad, $innerPad, ($Size - $innerPad * 2), ($Size - $innerPad * 2)
    $g.DrawRectangle($penTeal, $inner)

    # Airplane emblem (U+2708)
    $emblemFontSize = [Math]::Round($Size * 0.38)
    try {
        $font = New-Object System.Drawing.Font "Segoe UI Emoji", $emblemFontSize, ([System.Drawing.FontStyle]::Regular)
    } catch {
        $font = New-Object System.Drawing.Font "Arial", $emblemFontSize, ([System.Drawing.FontStyle]::Bold)
    }
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment     = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $emblemRect = New-Object System.Drawing.RectangleF `
        ([single]$innerPad), ([single]($innerPad + $Size * 0.03)), `
        ([single]($Size - $innerPad * 2)), ([single]($Size - $innerPad * 2 - $Size * 0.14))
    $g.DrawString([char]0x2708, $font, $brushOrange, $emblemRect, $sf)

    # "WANDERSAIL" stamp text at the bottom
    $stampFontSize = [Math]::Round($Size * 0.09)
    try {
        $stampFont = New-Object System.Drawing.Font "Impact", $stampFontSize, ([System.Drawing.FontStyle]::Regular)
    } catch {
        $stampFont = New-Object System.Drawing.Font "Arial", $stampFontSize, ([System.Drawing.FontStyle]::Bold)
    }
    $stampRect = New-Object System.Drawing.RectangleF `
        ([single]$innerPad), ([single]($Size - $innerPad - $Size * 0.14)), `
        ([single]($Size - $innerPad * 2)), ([single]($Size * 0.12))
    $g.DrawString("WANDERSAIL", $stampFont, $brushInk, $stampRect, $sf)

    # Save
    $bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $g.Dispose()
}

Write-Host "Generating icon-192.png..." -ForegroundColor Cyan
New-StampIcon -Size 192 -OutPath (Join-Path $outDir "icon-192.png") -Maskable $false

Write-Host "Generating icon-512.png..." -ForegroundColor Cyan
New-StampIcon -Size 512 -OutPath (Join-Path $outDir "icon-512.png") -Maskable $false

Write-Host "Generating icon-maskable-512.png..." -ForegroundColor Cyan
New-StampIcon -Size 512 -OutPath (Join-Path $outDir "icon-maskable-512.png") -Maskable $true

Write-Host "Generating apple-touch-icon.png..." -ForegroundColor Cyan
New-StampIcon -Size 180 -OutPath (Join-Path $outDir "apple-touch-icon.png") -Maskable $false

Write-Host ""
Write-Host "Done. Icons written to public\icons\" -ForegroundColor Yellow
Get-ChildItem $outDir -Filter "*.png" | ForEach-Object {
    Write-Host "  $($_.Name) ($([Math]::Round($_.Length / 1KB)) KB)" -ForegroundColor Green
}
