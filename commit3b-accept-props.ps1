$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$backup = $path + ".bak-commit3b-props"
Copy-Item $path $backup -Force

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

# Anchor: the last line of props before closing }
$old = '  watchlist = [],' + "`n" + '  toggleWatchlist,' + "`n" + '}) {'

$new = '  watchlist = [],' + "`n" + '  toggleWatchlist,' + "`n" + '  // NEW FILTER SYSTEM props (Commit 3)' + "`n" + '  projCategory = "All", setProjCategory = () => {},' + "`n" + '  projBuildPct = "All", setProjBuildPct = () => {},' + "`n" + '  projEscrow = "All", setProjEscrow = () => {},' + "`n" + '  showMoreFilters = false, setShowMoreFilters = () => {},' + "`n" + '}) {'

if (-not $content.Contains($old)) {
  Write-Host "Props anchor not found" -ForegroundColor Red; exit 1
}
$content = $content.Replace($old, $new)
Write-Host "New props accepted in signature" -ForegroundColor Green

# Also add setProjPriceMin / setProjPriceMax to the price range line
$oldPrice = '  projPriceMin, projPriceMax,'
$newPrice = '  projPriceMin, setProjPriceMin, projPriceMax, setProjPriceMax,'

if (-not $content.Contains($oldPrice)) {
  Write-Host "Price anchor not found" -ForegroundColor Red; exit 1
}
$content = $content.Replace($oldPrice, $newPrice)
Write-Host "Price setters added" -ForegroundColor Green

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))

Write-Host ""
Write-Host "Signature now has: projCategory, projBuildPct, projEscrow, showMoreFilters, setProjPriceMin, setProjPriceMax"