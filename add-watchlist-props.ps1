$path = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

$old = @"
              allDevelopers={allDevelopers}
              handleTabChange={handleTabChange}
            />
"@

$new = @"
              allDevelopers={allDevelopers}
              handleTabChange={handleTabChange}
              watchlist={watchlist}
              toggleWatchlist={toggleWatchlist}
            />
"@

if ($content.Contains($old)) {
  $content = $content.Replace($old, $new)
  $outBytes = [System.Text.Encoding]::UTF8.GetBytes($content)
  [System.IO.File]::WriteAllBytes($path, $outBytes)
  Write-Host "Props added to ProjectsTab render call" -ForegroundColor Green
} else {
  Write-Host "Pattern not found" -ForegroundColor Red
}