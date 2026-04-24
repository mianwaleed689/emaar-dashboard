$path = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)
$orig = $content.Length

# Build mojibake strings from their byte sequences (no literal broken chars in script)
$moStar   = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xCB,0x9C,0xE2,0x80,0xA6))
$moDot    = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0x82,0xC2,0xB7))
$moDash   = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xE2,0x82,0xAC,0xE2,0x80,0x9C))
$moCheck  = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xC5,0x93,0xE2,0x80,0x9C))
$moArrow  = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xE2,0x80,0xA0,0xE2,0x80,0x99))

$content = $content.Replace($moStar,  [string][char]0x2605)
$content = $content.Replace($moDot,   [string][char]0x00B7)
$content = $content.Replace($moDash,  [string][char]0x2014)
$content = $content.Replace($moCheck, [string][char]0x2713)
$content = $content.Replace($moArrow, [string][char]0x2192)

$newBytes = [System.Text.Encoding]::UTF8.GetBytes($content)
[System.IO.File]::WriteAllBytes($path, $newBytes)
Write-Host ("Before: " + $orig + " chars  |  After: " + $content.Length + " chars  |  Diff: " + ($orig - $content.Length))