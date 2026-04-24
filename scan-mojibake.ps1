$moStar   = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xCB,0x9C,0xE2,0x80,0xA6))
$moDot    = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0x82,0xC2,0xB7))
$moDash   = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xE2,0x82,0xAC,0xE2,0x80,0x9C))
$moCheck  = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xC5,0x93,0xE2,0x80,0x9C))
$moArrow  = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xE2,0x80,0xA0,0xE2,0x80,0x99))

$totalFiles = 0
$affected = @()
Get-ChildItem -Path src -Recurse -Include "*.jsx","*.js","*.ts","*.tsx","*.md" | ForEach-Object {
  $totalFiles++
  $b = [System.IO.File]::ReadAllBytes($_.FullName)
  $t = [System.Text.Encoding]::UTF8.GetString($b)
  $hits = 0
  $hits += ([regex]::Matches($t, [regex]::Escape($moStar))).Count
  $hits += ([regex]::Matches($t, [regex]::Escape($moDot))).Count
  $hits += ([regex]::Matches($t, [regex]::Escape($moDash))).Count
  $hits += ([regex]::Matches($t, [regex]::Escape($moCheck))).Count
  $hits += ([regex]::Matches($t, [regex]::Escape($moArrow))).Count
  if ($hits -gt 0) {
    $affected += ("{0,6} hits  :  {1}" -f $hits, $_.FullName.Replace("C:\Users\TAD\emaar-dashboard\",""))
  }
}
Write-Host "Scanned $totalFiles files"
if ($affected.Count -eq 0) {
  Write-Host "ALL CLEAN - zero mojibake in codebase" -ForegroundColor Green
} else {
  Write-Host ("AFFECTED: " + $affected.Count + " files") -ForegroundColor Yellow
  $affected | ForEach-Object { Write-Host $_ }
}