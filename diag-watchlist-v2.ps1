$p1 = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$content1 = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($p1))

Write-Host "=== Star button inner content ===" -ForegroundColor Cyan
$idx = $content1.IndexOf("STAR_FILLED")
if ($idx -gt 0) {
  Write-Host ("FOUND unreplaced STAR_FILLED placeholder at char " + $idx) -ForegroundColor Red
  Write-Host $content1.Substring([Math]::Max(0,$idx-100), 300)
} else {
  Write-Host "No STAR_FILLED placeholder - searching for star button inner..."
  $idx = $content1.IndexOf('"Remove from watchlist"')
  if ($idx -gt 0) {
    Write-Host $content1.Substring($idx, 1100)
  }
}

Write-Host ""
Write-Host "=== Watchlist toggle function ===" -ForegroundColor Cyan
$p2 = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$content2 = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($p2))
$idx = $content2.IndexOf("toggleWatchlist = async")
if ($idx -gt 0) {
  Write-Host $content2.Substring($idx, 600)
}

Write-Host ""
Write-Host "=== Watchlist modal close button ===" -ForegroundColor Cyan
# Find close button (usually has onClick setShowWatchlist(false))
$idx = $content2.IndexOf("setShowWatchlist(false)")
if ($idx -gt 0) {
  $s = [Math]::Max(0, $idx - 200)
  Write-Host $content2.Substring($s, 500)
}