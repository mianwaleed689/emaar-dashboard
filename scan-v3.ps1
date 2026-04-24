$path = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# Just two BMP-safe markers we know exist
$warnMojibake = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xC5,0xA1,0xC2,0xA0,0xC3,0xAF,0xC2,0xB8,0xC2,0x8F))
$starMojibake = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xC2,0xAD,0xC2,0x90))
$checkMojibake = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xC5,0x93,0xC5,0x93))

Write-Host "=== COUNTS ==="
Write-Host ("warn triangle: " + ([regex]::Matches($content, [regex]::Escape($warnMojibake))).Count)
Write-Host ("star (2B50):   " + ([regex]::Matches($content, [regex]::Escape($starMojibake))).Count)
Write-Host ("check (2705):  " + ([regex]::Matches($content, [regex]::Escape($checkMojibake))).Count)

# Show context for first of each
Write-Host ""
Write-Host "=== CONTEXTS ==="
$idx = $content.IndexOf($warnMojibake)
if ($idx -gt 0) {
  $s = [Math]::Max(0, $idx - 20)
  $l = [Math]::Min(100, $content.Length - $s)
  Write-Host ("warn: ..." + ($content.Substring($s, $l) -replace "[\r\n]", " ") + "...")
}
$idx = $content.IndexOf($starMojibake)
if ($idx -gt 0) {
  $s = [Math]::Max(0, $idx - 20)
  $l = [Math]::Min(100, $content.Length - $s)
  Write-Host ("star: ..." + ($content.Substring($s, $l) -replace "[\r\n]", " ") + "...")
}