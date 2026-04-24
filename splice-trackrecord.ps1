$target = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$blockFile = "C:\Users\TAD\emaar-dashboard\section-trackrecord.txt"

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($target))
$newBlock = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($blockFile))

$anchor = "                    {Array.isArray(selectedProject.developerFlagshipProjects)"

if ($content.Contains($anchor)) {
  $content = $content.Replace($anchor, $newBlock + $anchor)
  [System.IO.File]::WriteAllBytes($target, [System.Text.Encoding]::UTF8.GetBytes($content))
  Write-Host "Track record injected before flagship" -ForegroundColor Green
} else {
  Write-Host "Anchor not found" -ForegroundColor Red
}