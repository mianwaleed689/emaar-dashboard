$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

$old = '{d.val != null ? (d.val < 1 ? (d.val*1000).toFixed(0)+"m" : d.val+"km") : '
$new = '{d.val === 0 && d.insideLabel ? d.insideLabel : d.val != null ? (d.val < 1 ? (d.val*1000).toFixed(0)+"m" : d.val+"km") : '

if ($content.Contains($old)) {
  $content = $content.Replace($old, $new)
  [System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
  Write-Host "Inside-label render fix applied" -ForegroundColor Green
} else {
  Write-Host "Anchor not found - may already be updated" -ForegroundColor Yellow
}