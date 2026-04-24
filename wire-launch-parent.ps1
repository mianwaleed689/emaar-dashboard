$path = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$backup = $path + ".bak-launch-prop"
Copy-Item $path $backup -Force

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

$old = '              liveMarketData={liveMarketData}' + "`n" + '              liveLaunches={liveLaunches}' + "`n" + '              globalFilters={_gf}'
$new = '              liveMarketData={liveMarketData}' + "`n" + '              liveLaunches={liveLaunches}' + "`n" + '              liveProjects={liveProjects}' + "`n" + '              globalFilters={_gf}'

if (-not $content.Contains($old)) {
  Write-Host "LaunchCalendar render anchor not found" -ForegroundColor Red
  exit 1
}
$content = $content.Replace($old, $new)
[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
Write-Host "liveProjects prop passed to LaunchCalendarTab" -ForegroundColor Green