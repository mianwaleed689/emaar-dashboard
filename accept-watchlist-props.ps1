$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

$old = @"
  allDevelopers = [],
  handleTabChange,
}) {
"@

$new = @"
  allDevelopers = [],
  handleTabChange,
  watchlist = [],
  toggleWatchlist,
}) {
"@

if ($content.Contains($old)) {
  $content = $content.Replace($old, $new)
  $outBytes = [System.Text.Encoding]::UTF8.GetBytes($content)
  [System.IO.File]::WriteAllBytes($path, $outBytes)
  Write-Host "Watchlist props accepted in ProjectsTab.jsx" -ForegroundColor Green
} else {
  Write-Host "Pattern not found" -ForegroundColor Red
}