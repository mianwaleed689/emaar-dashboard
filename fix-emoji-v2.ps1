$path = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)
$origLen = $content.Length

# Mojibake patterns (source) built from raw bytes
$warnMojibake = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xC5,0xA1,0xC2,0xA0,0xC3,0xAF,0xC2,0xB8,0xC2,0x8F))
$starMojibake = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xC2,0xAD,0xC2,0x90))

# Correct replacements: warning sign + variation selector (U+26A0 U+FE0F), star (U+2B50)
$warnCorrect = [string][char]0x26A0 + [string][char]0xFE0F
$starCorrect = [string][char]0x2B50

$warnCount = ([regex]::Matches($content, [regex]::Escape($warnMojibake))).Count
$starCount = ([regex]::Matches($content, [regex]::Escape($starMojibake))).Count

$content = $content.Replace($warnMojibake, $warnCorrect)
$content = $content.Replace($starMojibake, $starCorrect)

$outBytes = [System.Text.Encoding]::UTF8.GetBytes($content)
[System.IO.File]::WriteAllBytes($path, $outBytes)

Write-Host ("Fixed " + $warnCount + " warn triangles + " + $starCount + " stars")
Write-Host ("Original: " + $origLen + " chars")
Write-Host ("New:      " + $content.Length + " chars")

# Verify
$v = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))
$w = ([regex]::Matches($v, [regex]::Escape($warnMojibake))).Count
$s = ([regex]::Matches($v, [regex]::Escape($starMojibake))).Count
Write-Host ("VERIFY remaining: warn=" + $w + " star=" + $s)
if ($w -eq 0 -and $s -eq 0) {
  Write-Host "ALL CLEAN" -ForegroundColor Green
} else {
  Write-Host "NOT FULLY CLEAN" -ForegroundColor Red
}