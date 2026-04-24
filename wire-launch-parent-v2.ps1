$path = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$backup = $path + ".bak-launch-prop-v2"
Copy-Item $path $backup -Force

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

# Use single-line anchor
$old = '              liveLaunches={liveLaunches}'
$new = '              liveLaunches={liveLaunches}' + "`n" + '              liveProjects={liveProjects}'

$count = ([regex]::Matches($content, [regex]::Escape($old))).Count
Write-Host "Anchor occurrences: $count"
if ($count -eq 0) { Write-Host "Not found" -ForegroundColor Red; exit 1 }
if ($count -gt 1) { Write-Host "Not unique" -ForegroundColor Red; exit 1 }

$content = $content.Replace($old, $new)
[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
Write-Host "liveProjects passed to LaunchCalendarTab" -ForegroundColor Green