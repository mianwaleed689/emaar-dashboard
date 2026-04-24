$path = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$backup = $path + ".bak-commit3a-v2"
Copy-Item $path $backup -Force
Write-Host "Backup: $backup" -ForegroundColor Gray

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))
$origLen = $content.Length
$origLines = ($content -split "`n").Count
Write-Host "Original: $origLines lines, $origLen chars"
Write-Host ""

# DELETE 1: <GlobalContextFilter /> render (find by UNIQUE substring of the render jsx)
# The render has 'gDeveloper={gDeveloper} setGDeveloperAndReset={setGDeveloperAndReset}'
# which only appears at the render site, not in the component definition.
$uniqueMarker = 'gDeveloper={gDeveloper} setGDeveloperAndReset={setGDeveloperAndReset}'
$markerIdx = $content.IndexOf($uniqueMarker)
if ($markerIdx -lt 0) { Write-Host "Render marker not found" -ForegroundColor Red; exit 1 }

Write-Host "Found render point at byte $markerIdx" -ForegroundColor Gray

# Walk BACKWARD from marker to find the comment start '{/*'
# The comment line is: '      {/* ... GLOBAL CONTEXT FILTER ... */}'
$commentStart = $content.LastIndexOf("{/*", $markerIdx)
if ($commentStart -lt 0) { Write-Host "Comment { start not found" -ForegroundColor Red; exit 1 }

# Step back further to include the indentation before {/*
# Look for the last `n before the {/*
$lineStart = $content.LastIndexOf("`n", $commentStart) + 1
Write-Host "Delete starts at byte $lineStart (start of comment line)" -ForegroundColor Gray

# Walk FORWARD from marker to find the closing '/>'
$endMarker = 'allDevelopers={allDevelopers} liveCommunityList={liveCommunityList} T={T}'
$endIdx = $content.IndexOf($endMarker, $markerIdx)
if ($endIdx -lt 0) { Write-Host "End marker not found" -ForegroundColor Red; exit 1 }

# From end marker, find the next '/>'
$closeIdx = $content.IndexOf('/>', $endIdx)
if ($closeIdx -lt 0) { Write-Host "Close /> not found" -ForegroundColor Red; exit 1 }

# Include the '/>' and the newline after it
$deleteEnd = $closeIdx + 2
# Skip trailing newline if present
if ($content[$deleteEnd] -eq "`n") { $deleteEnd++ }

$deleteLen = $deleteEnd - $lineStart
$deleteText = $content.Substring($lineStart, $deleteLen)

if (-not $deleteText.Contains('<GlobalContextFilter')) {
  Write-Host "Verification failed - text doesn't contain <GlobalContextFilter" -ForegroundColor Red
  exit 1
}

Write-Host "Deleting $deleteLen chars:" -ForegroundColor Gray
Write-Host "---"
Write-Host $deleteText
Write-Host "---"

$content = $content.Substring(0, $lineStart) + $content.Substring($lineStart + $deleteLen)
Write-Host "BLOCK 1 <GlobalContextFilter /> DELETED" -ForegroundColor Green
Write-Host ""

# DELETE 2: <FilterIndicator /> render
$f1Marker = 'Phase 3.5: Global Filter Indicator'
$f1Idx = $content.IndexOf($f1Marker)
if ($f1Idx -lt 0) {
  Write-Host "BLOCK 2: FilterIndicator marker not found (skipping)" -ForegroundColor Yellow
} else {
  $f1Start = $content.LastIndexOf("{/*", $f1Idx)
  $f1LineStart = $content.LastIndexOf("`n", $f1Start) + 1

  $f1EndMarker = 'onClear={resetAllGlobalFilters}'
  $f1EndIdx = $content.IndexOf($f1EndMarker, $f1Idx)
  if ($f1EndIdx -lt 0) { Write-Host "BLOCK 2 end marker not found" -ForegroundColor Red; exit 1 }

  $f1CloseIdx = $content.IndexOf('/>', $f1EndIdx)
  if ($f1CloseIdx -lt 0) { Write-Host "BLOCK 2 close /> not found" -ForegroundColor Red; exit 1 }

  $f1DeleteEnd = $f1CloseIdx + 2
  if ($content[$f1DeleteEnd] -eq "`n") { $f1DeleteEnd++ }

  $f1DeleteLen = $f1DeleteEnd - $f1LineStart
  $f1DeleteText = $content.Substring($f1LineStart, $f1DeleteLen)

  if (-not $f1DeleteText.Contains('<FilterIndicator')) {
    Write-Host "BLOCK 2 verification failed" -ForegroundColor Red; exit 1
  }

  Write-Host "Deleting BLOCK 2 ($f1DeleteLen chars):" -ForegroundColor Gray
  Write-Host "---"
  Write-Host $f1DeleteText
  Write-Host "---"

  $content = $content.Substring(0, $f1LineStart) + $content.Substring($f1LineStart + $f1DeleteLen)
  Write-Host "BLOCK 2 <FilterIndicator /> DELETED" -ForegroundColor Green
}

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))

$newLines = ($content -split "`n").Count
Write-Host ""
Write-Host "COMMIT 3A APPLIED" -ForegroundColor Green
Write-Host "Lines: $origLines -> $newLines (removed $($origLines - $newLines))"
Write-Host "Bytes: $origLen -> $($content.Length) (removed $($origLen - $content.Length))"