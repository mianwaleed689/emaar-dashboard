$path = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$backup = $path + ".bak-handover-prop"
Copy-Item $path $backup -Force

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

$old = '            <HandoverTab' + "`n" + '              liveHandover={liveHandover}'
$new = '            <HandoverTab' + "`n" + '              liveHandover={liveHandover}' + "`n" + '              liveProjects={liveProjects}'

if (-not $content.Contains($old)) {
  Write-Host "HandoverTab render anchor not found" -ForegroundColor Red
  exit 1
}
$content = $content.Replace($old, $new)

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
Write-Host "liveProjects prop passed to HandoverTab" -ForegroundColor Green