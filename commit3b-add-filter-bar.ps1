$targetPath = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$blockPath  = "C:\Users\TAD\emaar-dashboard\new-primary-bar.txt"

$backup = $targetPath + ".bak-commit3b"
Copy-Item $targetPath $backup -Force
Write-Host "Backup: $backup" -ForegroundColor Gray

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($targetPath))
$newBlock = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($blockPath))
$origLen = $content.Length
$origLines = ($content -split "`n").Count

# Anchor: the empty div structure where pill row used to be
$anchor = '                  <div style={{ display:"flex", gap:8 }}>' + "`n" + '                  </div>' + "`n" + '                </div>' + "`n" + "`n" + '                {/*'

if (-not $content.Contains($anchor)) {
  Write-Host "Anchor not found" -ForegroundColor Red
  exit 1
}

# Split anchor so we insert AFTER the three closing div lines but BEFORE the next comment
$anchorKeep = '                  <div style={{ display:"flex", gap:8 }}>' + "`n" + '                  </div>' + "`n" + '                </div>'
$anchorAfter = "`n`n" + '                {/*'

$replacement = $anchorKeep + $newBlock + '                {/*'

# Since splitting differently, reconstruct full anchor + replacement
$fullOld = $anchorKeep + "`n`n" + '                {/*'
$fullNew = $anchorKeep + $newBlock + '                {/*'

$content = $content.Replace($fullOld, $fullNew)

# Verify new block is in place
$hasCategory = $content.Contains('Property Category')
$hasShouldShow = $content.Contains('shouldShowConfiguration(projCategory, projMode)')
$hasMoreBtn = $content.Contains('setShowMoreFilters(!showMoreFilters)')

if (-not ($hasCategory -and $hasShouldShow -and $hasMoreBtn)) {
  Write-Host "Verification failed - new filter bar markers not all found" -ForegroundColor Red
  Write-Host "hasCategory: $hasCategory, hasShouldShow: $hasShouldShow, hasMoreBtn: $hasMoreBtn"
  exit 1
}

# Verify no entity leak
$entityLeak = ([regex]::Matches($content, '&amp;|&lt;|&gt;')).Count
if ($entityLeak -gt 0) {
  Write-Host "ENTITY LEAK DETECTED: $entityLeak occurrences - aborting" -ForegroundColor Red
  exit 1
}

[System.IO.File]::WriteAllBytes($targetPath, [System.Text.Encoding]::UTF8.GetBytes($content))

$newLines = ($content -split "`n").Count
Write-Host ""
Write-Host "COMMIT 3B APPLIED" -ForegroundColor Green
Write-Host "Lines: $origLines -> $newLines (+$($newLines - $origLines))"
Write-Host "Bytes: $origLen -> $($content.Length) (+$($content.Length - $origLen))"
Write-Host ""
Write-Host "Markers verified: Property Category, shouldShowConfiguration, setShowMoreFilters"
Write-Host "HTML entities: 0"