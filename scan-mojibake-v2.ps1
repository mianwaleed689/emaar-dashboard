$path = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# Build markers from raw UTF-8 bytes (pure hex, no literal mojibake in script source)
# These are the UTF-8 byte sequences for Latin-1 reinterpretations of common emoji
$markers = @(
  @("warn_triangle",  [byte[]](0xC3,0xA2,0xC5,0xA1,0xC2,0xA0,0xC3,0xAF,0xC2,0xB8,0xC2,0x8F), [char]0x26A0),
  @("check_mark",     [byte[]](0xC3,0xA2,0xC5,0x93,0xC5,0x93),                                [char]0x2705),
  @("star_gold",      [byte[]](0xC3,0xA2,0xC2,0xAD,0xC2,0x90),                                [char]0x2B50),
  @("fire",           [byte[]](0xC3,0xB0,0xC5,0xB8,0xC2,0x94,0xC2,0xA5),                      [char]0x1F525),
  @("rocket",         [byte[]](0xC3,0xB0,0xC5,0xB8,0xC2,0x9A,0xC2,0x80),                      [char]0x1F680),
  @("sparkles",       [byte[]](0xC3,0xA2,0xC5,0x93,0xC2,0xA8),                                [char]0x2728),
  @("cross_mark",     [byte[]](0xC3,0xA2,0xC5,0x93,0xC5,0x92),                                [char]0x274C),
  @("money_bag",      [byte[]](0xC3,0xB0,0xC5,0xB8,0xC2,0x92,0xC2,0xB0),                      [char]0x1F4B0)
)

Write-Host "=== MOJIBAKE REMAINING IN EmaarDashboardV2.jsx ===" -ForegroundColor Cyan
$total = 0
foreach ($m in $markers) {
  $mojiStr = [System.Text.Encoding]::UTF8.GetString($m[1])
  $count = ([regex]::Matches($content, [regex]::Escape($mojiStr))).Count
  if ($count -gt 0) {
    Write-Host ("  {0,-16} count: {1}  -> should become: {2}" -f $m[0], $count, ([string]$m[2]))
    $total += $count
  }
}
Write-Host ""
Write-Host ("Total mojibake instances to fix: " + $total)

# Show context of one warn_triangle and one star to confirm detection
Write-Host ""
Write-Host "=== SAMPLE CONTEXTS ===" -ForegroundColor Cyan
$warnStr = [System.Text.Encoding]::UTF8.GetString($markers[0][1])
$idx = $content.IndexOf($warnStr)
if ($idx -gt 0) {
  $ctx = $content.Substring([Math]::Max(0, $idx - 20), [Math]::Min(80, $content.Length - [Math]::Max(0, $idx - 20)))
  Write-Host ("warn_triangle context: " + $ctx.Replace("`n", " "))
}
$starStr = [System.Text.Encoding]::UTF8.GetString($markers[2][1])
$idx = $content.IndexOf($starStr)
if ($idx -gt 0) {
  $ctx = $content.Substring([Math]::Max(0, $idx - 20), [Math]::Min(80, $content.Length - [Math]::Max(0, $idx - 20)))
  Write-Host ("star_gold context:     " + $ctx.Replace("`n", " "))
}