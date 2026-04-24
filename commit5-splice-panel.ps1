$targetPath = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$blockPath  = "C:\Users\TAD\emaar-dashboard\new-more-filters-panel.txt"

$backup = $targetPath + ".bak-commit5"
Copy-Item $targetPath $backup -Force
Write-Host "Backup: $backup" -ForegroundColor Gray

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($targetPath))
$newBlock = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($blockPath))

$origLines = ($content -split "`n").Count
$origBytes = $content.Length

# Anchor: the closing </div> of the primary filter bar (at L939)
# The unique pattern is: "More Filters {showMoreFilters ? ..." button closing, then </button>, </div>, </div>
$anchor = '                      More Filters {showMoreFilters ? "'
$anchorIdx = $content.IndexOf($anchor)
if ($anchorIdx -lt 0) {
  Write-Host "Anchor 'More Filters {showMoreFilters' not found" -ForegroundColor Red
  exit 1
}

# Walk forward to find the closing sequence: </button>\n                  </div>\n                </div>
# We want to INSERT right after the outer </div> that closes the filter bar
$searchFrom = $anchorIdx
$closingPattern = '                    </button>' + "`n" + '                  </div>' + "`n" + '                </div>'
$closingIdx = $content.IndexOf($closingPattern, $searchFrom)
if ($closingIdx -lt 0) {
  Write-Host "Filter bar closing </div></div> pattern not found" -ForegroundColor Red
  exit 1
}

$insertAt = $closingIdx + $closingPattern.Length
Write-Host "Insert point at byte $insertAt" -ForegroundColor Gray

# Insert the panel right after the filter bar closes
$content = $content.Substring(0, $insertAt) + $newBlock + $content.Substring($insertAt)

# Verify new markers present
$hasRefine = $content.Contains('Refine By')
$hasProjDetails = $content.Contains('Project Details')
$hasEscrowBank = $content.Contains('Escrow Bank')
$hasShowMoreCondition = ([regex]::Matches($content, '\{showMoreFilters && \(')).Count

if (-not ($hasRefine -and $hasProjDetails -and $hasEscrowBank)) {
  Write-Host "VERIFICATION FAILED" -ForegroundColor Red
  Write-Host "Refine: $hasRefine  Details: $hasProjDetails  Escrow: $hasEscrowBank"
  exit 1
}

$entityLeak = ([regex]::Matches($content, '&amp;|&lt;|&gt;')).Count
if ($entityLeak -gt 0) {
  Write-Host "ENTITY LEAK: $entityLeak - aborting" -ForegroundColor Red
  exit 1
}

[System.IO.File]::WriteAllBytes($targetPath, [System.Text.Encoding]::UTF8.GetBytes($content))

$newLines = ($content -split "`n").Count
Write-Host ""
Write-Host "COMMIT 5 PANEL APPLIED" -ForegroundColor Green
Write-Host "Lines: $origLines -> $newLines (+$($newLines - $origLines))"
Write-Host "Bytes: $origBytes -> $($content.Length) (+$($content.Length - $origBytes))"
Write-Host "showMoreFilters conditional blocks: $hasShowMoreCondition (expected 1)"