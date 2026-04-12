#
# Wandersail - one-time desktop shortcut installer
# Creates a stamp-styled icon and places a shortcut on the Desktop.
#
# Usage: right-click this file -> "Run with PowerShell"
#

Add-Type -AssemblyName System.Drawing

$root       = $PSScriptRoot
$iconPath   = Join-Path $root "wandersail.ico"
$batPath    = Join-Path $root "Wandersail.bat"
$desktop    = [Environment]::GetFolderPath("Desktop")
$lnkPath    = Join-Path $desktop "Wandersail.lnk"

Write-Host "Generating stamp icon..." -ForegroundColor Cyan

# ---- Draw stamp-style icon ----
$size = 256
$bmp  = New-Object System.Drawing.Bitmap $size, $size
$g    = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::Transparent)

# Palette (matches the app)
$cream  = [System.Drawing.Color]::FromArgb(244, 235, 211)
$ink    = [System.Drawing.Color]::FromArgb(26, 26, 26)
$teal   = [System.Drawing.Color]::FromArgb(30, 95, 90)
$orange = [System.Drawing.Color]::FromArgb(217, 98, 43)

$brushCream  = New-Object System.Drawing.SolidBrush $cream
$brushInk    = New-Object System.Drawing.SolidBrush $ink
$brushOrange = New-Object System.Drawing.SolidBrush $orange
$penInk      = New-Object System.Drawing.Pen $ink, 6
$penTeal     = New-Object System.Drawing.Pen $teal, 4

# Outer perforated stamp background
$pad        = 22
$stampSize  = $size - ($pad * 2)
$stampRect  = New-Object System.Drawing.Rectangle $pad, $pad, $stampSize, $stampSize
$g.FillRectangle($brushCream, $stampRect)

# Scalloped perforations (small cream circles around the edge so it looks like a postage stamp)
$perfBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(0,0,0,0))
$perfDiameter = 18
$perfCount = 11
$step = $stampSize / $perfCount
$transparentBrush = [System.Drawing.Brushes]::Transparent

# Use a clear rect technique: punch holes with the parent transparent color
$holeBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(0,0,0,0))

# We'll simulate scalloped edges by drawing small transparent-cut ellipses at the border
$g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
for ($i = 0; $i -lt $perfCount; $i++) {
    $o = [Math]::Round($pad + ($i + 0.5) * $step - ($perfDiameter / 2))
    # Top
    $g.FillEllipse($holeBrush, $o, $pad - ($perfDiameter/2), $perfDiameter, $perfDiameter)
    # Bottom
    $g.FillEllipse($holeBrush, $o, $pad + $stampSize - ($perfDiameter/2), $perfDiameter, $perfDiameter)
    # Left
    $g.FillEllipse($holeBrush, $pad - ($perfDiameter/2), $o, $perfDiameter, $perfDiameter)
    # Right
    $g.FillEllipse($holeBrush, $pad + $stampSize - ($perfDiameter/2), $o, $perfDiameter, $perfDiameter)
}
$g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver

# Outer ink border
$g.DrawRectangle($penInk, $stampRect)

# Inner decorative teal border
$innerPad = 44
$innerRect = New-Object System.Drawing.Rectangle $innerPad, $innerPad, ($size - $innerPad*2), ($size - $innerPad*2)
$g.DrawRectangle($penTeal, $innerRect)

# Airplane / emblem in middle
try {
    $font = New-Object System.Drawing.Font "Segoe UI Emoji", 96, ([System.Drawing.FontStyle]::Regular)
} catch {
    $font = New-Object System.Drawing.Font "Arial", 96, ([System.Drawing.FontStyle]::Bold)
}
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment     = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$emblemRect = New-Object System.Drawing.RectangleF ([single]$innerPad), ([single]($innerPad + 8)), ([single]($size - $innerPad*2)), ([single]($size - $innerPad*2 - 40))
$g.DrawString([char]0x2708, $font, $brushOrange, $emblemRect, $sf)

# "WANDERSAIL" stamp text along the bottom
try {
    $stampFont = New-Object System.Drawing.Font "Impact", 22, ([System.Drawing.FontStyle]::Regular)
} catch {
    $stampFont = New-Object System.Drawing.Font "Arial", 22, ([System.Drawing.FontStyle]::Bold)
}
$stampTextRect = New-Object System.Drawing.RectangleF ([single]$innerPad), ([single]($size - $innerPad - 36)), ([single]($size - $innerPad*2)), 32
$g.DrawString("WANDERSAIL", $stampFont, $brushInk, $stampTextRect, $sf)

# Save as .ico
$hIcon = $bmp.GetHicon()
$icon  = [System.Drawing.Icon]::FromHandle($hIcon)
$fs    = [System.IO.File]::Open($iconPath, [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$icon.Dispose()
[void][System.Runtime.InteropServices.Marshal]::GetLastWin32Error()
$bmp.Dispose()
$g.Dispose()

Write-Host "Icon saved to: $iconPath" -ForegroundColor Green

# ---- Create desktop shortcut ----
Write-Host "Creating desktop shortcut..." -ForegroundColor Cyan
$shell             = New-Object -ComObject WScript.Shell
$shortcut          = $shell.CreateShortcut($lnkPath)
$shortcut.TargetPath       = $batPath
$shortcut.WorkingDirectory = $root
$shortcut.IconLocation     = "$iconPath,0"
$shortcut.Description      = "Wandersail - Katie's Travel Journal"
$shortcut.WindowStyle      = 1
$shortcut.Save()

Write-Host ""
Write-Host "Done! Look for 'Wandersail' on your Desktop." -ForegroundColor Yellow
Write-Host "Double-click it any time to launch the travel journal." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
