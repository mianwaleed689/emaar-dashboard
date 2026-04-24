$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)
$orig = $content.Length

# Build mojibake patterns from raw bytes (pure ASCII script source)
$moStar   = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xCB,0x9C,0xE2,0x80,0xA6))
$moDot    = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0x82,0xC2,0xB7))
$moDash   = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xE2,0x82,0xAC,0xE2,0x80,0x9C))
$moCheck  = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xC5,0x93,0xE2,0x80,0x9C))
$moArrow  = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xE2,0x80,0xA0,0xE2,0x80,0x99))
$moDiamond = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xE2,0x80,0x94,0xE2,0x80,0xA0))

# Counts
$starN    = ([regex]::Matches($content, [regex]::Escape($moStar))).Count
$dotN     = ([regex]::Matches($content, [regex]::Escape($moDot))).Count
$dashN    = ([regex]::Matches($content, [regex]::Escape($moDash))).Count
$checkN   = ([regex]::Matches($content, [regex]::Escape($moCheck))).Count
$arrowN   = ([regex]::Matches($content, [regex]::Escape($moArrow))).Count
$diamondN = ([regex]::Matches($content, [regex]::Escape($moDiamond))).Count

Write-Host "BEFORE:"
Write-Host ("  star:    " + $starN)
Write-Host ("  dot:     " + $dotN)
Write-Host ("  dash:    " + $dashN)
Write-Host ("  check:   " + $checkN)
Write-Host ("  arrow:   " + $arrowN)
Write-Host ("  diamond: " + $diamondN)

# Replacements
$content = $content.Replace($moStar,    [string][char]0x2605)
$content = $content.Replace($moDot,     [string][char]0x00B7)
$content = $content.Replace($moDash,    [string][char]0x2014)
$content = $content.Replace($moCheck,   [string][char]0x2713)
$content = $content.Replace($moArrow,   [string][char]0x2192)
$content = $content.Replace($moDiamond, [string][char]0x25C6)

$outBytes = [System.Text.Encoding]::UTF8.GetBytes($content)
[System.IO.File]::WriteAllBytes($path, $outBytes)

Write-Host ""
Write-Host ("AFTER: original=" + $orig + " new=" + $content.Length + " delta=" + ($orig - $content.Length))

# Verify zero remaining
$v = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))
$total = 0
foreach ($pat in @($moStar, $moDot, $moDash, $moCheck, $moArrow, $moDiamond)) {
  $total += ([regex]::Matches($v, [regex]::Escape($pat))).Count
}
Write-Host ("Remaining mojibake: " + $total)
if ($total -eq 0) { Write-Host "CLEAN" -ForegroundColor Green } else { Write-Host "NOT CLEAN" -ForegroundColor Red }