$path = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$backup = $path + ".bak-fix-liveProjects-array"
Copy-Item $path $backup -Force

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

# Find where HandoverTab and LaunchCalendar receive liveProjects={liveProjects}
# Change both to pass extraProjects instead (which IS a proper array containing real Firestore projects)
# Actually cleaner: construct the array inline

# For HandoverTab
$oldH = '              liveHandover={liveHandover}' + "`n" + '              liveProjects={liveProjects}'
$newH = '              liveHandover={liveHandover}' + "`n" + '              liveProjects={Array.isArray(extraProjects) ? extraProjects : []}'

if (-not $content.Contains($oldH)) {
  Write-Host "HandoverTab anchor not found" -ForegroundColor Red
  exit 1
}
$content = $content.Replace($oldH, $newH)
Write-Host "HandoverTab now receives extraProjects array" -ForegroundColor Green

# For LaunchCalendarTab
$oldL = '              liveLaunches={liveLaunches}' + "`n" + '              liveProjects={liveProjects}'
$newL = '              liveLaunches={liveLaunches}' + "`n" + '              liveProjects={Array.isArray(extraProjects) ? extraProjects : []}'

if (-not $content.Contains($oldL)) {
  Write-Host "LaunchCalendarTab anchor not found" -ForegroundColor Red
  exit 1
}
$content = $content.Replace($oldL, $newL)
Write-Host "LaunchCalendarTab now receives extraProjects array" -ForegroundColor Green

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
Write-Host ""
Write-Host "Both tabs now get the proper array of Firestore projects"