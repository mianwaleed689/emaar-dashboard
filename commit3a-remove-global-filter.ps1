$path = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$backup = $path + ".bak-commit3a"
Copy-Item $path $backup -Force
Write-Host "Backup: $backup" -ForegroundColor Gray

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))
$origLen = $content.Length
$origLines = ($content -split "`n").Count
Write-Host "Original: $origLines lines, $origLen chars"
Write-Host ""

# DELETE 1: <GlobalContextFilter .../> render block
$g1Start = '      {/*'
$g1Marker = 'GLOBAL CONTEXT FILTER'
$g1End = 'allDevelopers={allDevelopers} liveCommunityList={liveCommunityList} T={T}' + "`n" + '      />'

$g1Idx = $content.IndexOf($g1Marker)
if ($g1Idx -lt 0) { Write-Host "BLOCK 1 marker not found" -ForegroundColor Red; exit 1 }

# Walk backward from marker to find the comment start
$commentStart = $content.LastIndexOf('      {/*', $g1Idx)
if ($commentStart -lt 0) { Write-Host "BLOCK 1 comment start not found" -ForegroundColor Red; exit 1 }

$g1EndIdx = $content.IndexOf($g1End, $g1Idx)
if ($g1EndIdx -lt 0) { Write-Host "BLOCK 1 end not found" -ForegroundColor Red; exit 1 }

$g1Len = ($g1EndIdx + $g1End.Length) - $commentStart
$g1Text = $content.Substring($commentStart, $g1Len)

if (-not $g1Text.Contains('GlobalContextFilter')) {
  Write-Host "BLOCK 1 verification FAILED" -ForegroundColor Red; exit 1
}

Write-Host "BLOCK 1 <GlobalContextFilter />: $g1Len chars" -ForegroundColor Gray
$content = $content.Substring(0, $commentStart) + $content.Substring($commentStart + $g1Len)
Write-Host "BLOCK 1 deleted" -ForegroundColor Green

# DELETE 2: <FilterIndicator .../> render block
$f1Marker = 'Phase 3.5: Global Filter Indicator'
$f1Idx = $content.IndexOf($f1Marker)
if ($f1Idx -lt 0) {
  Write-Host "BLOCK 2 marker not found (may already be removed)" -ForegroundColor Yellow
} else {
  # Start: the comment line
  $f1Start = $content.LastIndexOf('          {/*', $f1Idx)
  if ($f1Start -lt 0) { Write-Host "BLOCK 2 comment start not found" -ForegroundColor Red; exit 1 }

  # End: closing '/>' of the FilterIndicator component
  $f1End = 'onClear={resetAllGlobalFilters}' + "`n" + '          />'
  $f1EndIdx = $content.IndexOf($f1End, $f1Idx)
  if ($f1EndIdx -lt 0) { Write-Host "BLOCK 2 end not found" -ForegroundColor Red; exit 1 }

  $f1Len = ($f1EndIdx + $f1End.Length) - $f1Start
  $f1Text = $content.Substring($f1Start, $f1Len)

  if (-not $f1Text.Contains('FilterIndicator')) {
    Write-Host "BLOCK 2 verification FAILED" -ForegroundColor Red; exit 1
  }

  Write-Host "BLOCK 2 <FilterIndicator />: $f1Len chars" -ForegroundColor Gray
  $content = $content.Substring(0, $f1Start) + $content.Substring($f1Start + $f1Len)
  Write-Host "BLOCK 2 deleted" -ForegroundColor Green
}

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))

$newLines = ($content -split "`n").Count
Write-Host ""
Write-Host "COMMIT 3A APPLIED" -ForegroundColor Green
Write-Host "Lines: $origLines -> $newLines (removed $($origLines - $newLines))"
Write-Host "Backup: $backup"