$path = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$backup = $path + ".bak-commit3b-fix"
Copy-Item $path $backup -Force
Write-Host "Backup: $backup" -ForegroundColor Gray

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

# FIX 1: Add setProjPriceMin and setProjPriceMax
$old1 = '              projPriceMin={projPriceMin} projPriceMax={projPriceMax}'
$new1 = '              projPriceMin={projPriceMin} setProjPriceMin={setProjPriceMin} projPriceMax={projPriceMax} setProjPriceMax={setProjPriceMax}'

if (-not $content.Contains($old1)) { Write-Host "Price props anchor not found" -ForegroundColor Red; exit 1 }
$content = $content.Replace($old1, $new1)
Write-Host "Fix 1: Price setters added" -ForegroundColor Green

# FIX 2: Add the 4 new filter prop pairs before closing />
$old2 = '              watchlist={watchlist}' + "`n" + '              toggleWatchlist={toggleWatchlist}' + "`n" + '            />'

$new2 = '              watchlist={watchlist}' + "`n" + '              toggleWatchlist={toggleWatchlist}' + "`n" + '              projCategory={projCategory} setProjCategory={setProjCategory}' + "`n" + '              projBuildPct={projBuildPct} setProjBuildPct={setProjBuildPct}' + "`n" + '              projEscrow={projEscrow} setProjEscrow={setProjEscrow}' + "`n" + '              showMoreFilters={showMoreFilters} setShowMoreFilters={setShowMoreFilters}' + "`n" + '            />'

if (-not $content.Contains($old2)) { Write-Host "ProjectsTab closing anchor not found" -ForegroundColor Red; exit 1 }
$content = $content.Replace($old2, $new2)
Write-Host "Fix 2: 4 new filter prop pairs added" -ForegroundColor Green

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))

Write-Host ""
Write-Host "All props now wired"