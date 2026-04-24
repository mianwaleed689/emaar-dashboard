$p1 = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$content1 = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($p1))

Write-Host "=== ISSUE 1: Star button render line ===" -ForegroundColor Cyan
$idx = $content1.IndexOf("Remove from watchlist")
if ($idx -gt 0) {
  $s = [Math]::Max(0, $idx - 50)
  Write-Host $content1.Substring($s, 500)
}

$p2 = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$content2 = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($p2))

Write-Host ""
Write-Host "=== ISSUE 2: Watchlist modal rendering ===" -ForegroundColor Cyan
$idx = $content2.IndexOf("0 projects saved")
if ($idx -lt 0) { $idx = $content2.IndexOf("projects saved") }
if ($idx -gt 0) {
  $s = [Math]::Max(0, $idx - 50)
  Write-Host $content2.Substring($s, 600)
}

Write-Host ""
Write-Host "=== ISSUE 3: Watchlist modal close button area ===" -ForegroundColor Cyan
$idx = $content2.IndexOf("My Watchlist")
if ($idx -gt 0) {
  $s = [Math]::Max(0, $idx - 100)
  Write-Host $content2.Substring($s, 400)
}