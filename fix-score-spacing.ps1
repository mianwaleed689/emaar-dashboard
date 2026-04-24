$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# Old: <span style={...}>/ 100</span>
# New: <span style={...}> / 100</span>   (leading space added inside span)
$old = 'letterSpacing:0.3 }}>/ 100</span>'
$new = 'letterSpacing:0.3 }}> / 100</span>'

if ($content.Contains($old)) {
  $content = $content.Replace($old, $new)
  $outBytes = [System.Text.Encoding]::UTF8.GetBytes($content)
  [System.IO.File]::WriteAllBytes($path, $outBytes)
  Write-Host "Fix applied" -ForegroundColor Green
} else {
  Write-Host "Pattern not found - might already be fixed" -ForegroundColor Yellow
}