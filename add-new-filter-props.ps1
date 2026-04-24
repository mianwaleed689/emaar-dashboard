$path = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# Anchor: the end of the props list on the ProjectsTab render
$old = '              watchlist={watchlist}' + "`n" + '              toggleWatchlist={toggleWatchlist}' + "`n" + '            />'
$new = '              watchlist={watchlist}' + "`n" +
       '              toggleWatchlist={toggleWatchlist}' + "`n" +
       '              projCategory={projCategory} setProjCategory={setProjCategory}' + "`n" +
       '              projBuildPct={projBuildPct} setProjBuildPct={setProjBuildPct}' + "`n" +
       '              projEscrow={projEscrow} setProjEscrow={setProjEscrow}' + "`n" +
       '              showMoreFilters={showMoreFilters} setShowMoreFilters={setShowMoreFilters}' + "`n" +
       '            />'

if ($content.Contains($old)) {
  $content = $content.Replace($old, $new)
  [System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
  Write-Host "New props passed to ProjectsTab" -ForegroundColor Green
} else {
  Write-Host "Anchor not found" -ForegroundColor Red
}