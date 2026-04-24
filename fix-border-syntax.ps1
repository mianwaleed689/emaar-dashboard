$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

$old = 'border: +""+1px solid +""++(watchlist.some(w => w.id === p.id) ? "rgba(212,168,67,0.5)" : "rgba(255,255,255,0.1)"),'
$new = 'border: "1px solid " + (watchlist.some(w => w.id === p.id) ? "rgba(212,168,67,0.5)" : "rgba(255,255,255,0.1)"),'

if ($content.Contains($old)) {
  $content = $content.Replace($old, $new)
  $outBytes = [System.Text.Encoding]::UTF8.GetBytes($content)
  [System.IO.File]::WriteAllBytes($path, $outBytes)
  Write-Host "Border fix applied" -ForegroundColor Green
} else {
  Write-Host "Pattern not found - showing line 530-540" -ForegroundColor Yellow
  $lines = $content -split "`n"
  for ($i = 529; $i -lt 540; $i++) {
    Write-Host ("L" + ($i+1) + ": " + $lines[$i])
  }
}