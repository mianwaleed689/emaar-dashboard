$target = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$blockFile = "C:\Users\TAD\emaar-dashboard\section-sources.txt"

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($target))
$newBlock = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($blockFile))

# Anchor: before the existing "Full Developer Profile" button
$anchor = "                    <button type=`"button`" onClick={() => { setSelectedProject(null); handleTabChange(`"Developer Health`");"

if ($content.Contains($anchor)) {
  $content = $content.Replace($anchor, $newBlock + "`n" + $anchor)
  [System.IO.File]::WriteAllBytes($target, [System.Text.Encoding]::UTF8.GetBytes($content))
  Write-Host "Sources section injected" -ForegroundColor Green
} else {
  Write-Host "Anchor not found" -ForegroundColor Red
}