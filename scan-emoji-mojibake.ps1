$path = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# Common emoji mojibake patterns (3-byte emoji misread as Latin-1 = 3 weird chars each)
$patterns = @(
  @("warn_tri",   "warning triangle U+26A0",  [byte[]](0xC3,0xA2,0xC5,0xA1,0xC2,0xA0,0xC3,0xAF,0xC2,0xB8)),
  @("check_mark", "check mark U+2705",        [byte[]](0xC3,0xA2,0xC5,0x93,0xC5,0x93)),
  @("fire",       "fire U+1F525",             [byte[]](0xC3,0xB0,0xC5,0xB8,0xC2,0x94,0xC2,0xA5)),
  @("star",       "star U+2B50",              [byte[]](0xC3,0xA2,0xC2,0xAD,0xC2,0x90)),
  @("rocket",     "rocket U+1F680",           [byte[]](0xC3,0xB0,0xC5,0xB8,0xC2,0x9A,0xC2,0x80)),
  @("sparkle",    "sparkles U+2728",          [byte[]](0xC3,0xA2,0xC5,0x93,0xC2,0xA8))
)

Write-Host "=== REMAINING MOJIBAKE PATTERNS ===" -ForegroundColor Cyan
foreach ($p in $patterns) {
  $mojibake = [System.Text.Encoding]::UTF8.GetString($p[2])
  $count = ([regex]::Matches($content, [regex]::Escape($mojibake))).Count
  if ($count -gt 0) {
    Write-Host ("{0,-15} {1,-30} count: {2}" -f $p[0], $p[1], $count) -ForegroundColor Yellow
  }
}

# Also scan for "aS" "aE" "ac" start patterns (generic emoji mojibake prefix)
Write-Host "`n=== GENERIC EMOJI MOJIBAKE SCAN ===" -ForegroundColor Cyan
# Look for any "âX" followed by non-standard chars (these are the telltale mojibake markers)
$idx = 0
$samples = @()
while ($idx -lt $content.Length -and $samples.Count -lt 10) {
  $idx = $content.IndexOf("â", $idx)
  if ($idx -lt 0) { break }
  # Check if next 2 chars are also garbage (look weird)
  $chunk = $content.Substring($idx, [Math]::Min(6, $content.Length - $idx))
  # If this looks like mojibake (followed by extended latin chars)
  if ($chunk -match "â[\u0080-\u00FF]{2,}") {
    $ctxStart = [Math]::Max(0, $idx - 20)
    $ctxLen = [Math]::Min(60, $content.Length - $ctxStart)
    $ctx = $content.Substring($ctxStart, $ctxLen)
    $samples += $ctx
  }
  $idx++
}
foreach ($s in $samples) { Write-Host $s }