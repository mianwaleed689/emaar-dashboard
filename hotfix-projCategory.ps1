$path = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$backup = $path + ".bak-projCategory-fix"
Copy-Item $path $backup -Force
Write-Host "Backup: $backup" -ForegroundColor Gray

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

# Find a good anchor - the existing filter state declarations near L2797
$anchor = '  const [projPriceMin, setProjPriceMin] = useState(0);'
if (-not $content.Contains($anchor)) {
  Write-Host "Anchor not found" -ForegroundColor Red
  exit 1
}

# Insert the 4 missing state declarations RIGHT BEFORE the price min declaration
$newStates = '  // NEW FILTER SYSTEM state (per finalized filter spec)' + "`n" + '  const [projCategory, setProjCategory] = useState("All");' + "`n" + '  const [projBuildPct, setProjBuildPct] = useState("All");' + "`n" + '  const [projEscrow, setProjEscrow] = useState("All");' + "`n" + '  const [showMoreFilters, setShowMoreFilters] = useState(false);' + "`n" + '  const [projPriceMin, setProjPriceMin] = useState(0);'

$content = $content.Replace($anchor, $newStates)

# Verify all 4 are now present
$hasCategory = ([regex]::Matches($content, 'const \[projCategory, setProjCategory\]')).Count
$hasBuildPct = ([regex]::Matches($content, 'const \[projBuildPct, setProjBuildPct\]')).Count
$hasEscrow = ([regex]::Matches($content, 'const \[projEscrow, setProjEscrow\]')).Count
$hasMore = ([regex]::Matches($content, 'const \[showMoreFilters, setShowMoreFilters\]')).Count

Write-Host ""
Write-Host "Verification:" -ForegroundColor Cyan
Write-Host "projCategory state: $hasCategory (must be 1)"
Write-Host "projBuildPct state: $hasBuildPct (must be 1)"
Write-Host "projEscrow state: $hasEscrow (must be 1)"
Write-Host "showMoreFilters state: $hasMore (must be 1)"

if ($hasCategory -ne 1 -or $hasBuildPct -ne 1 -or $hasEscrow -ne 1 -or $hasMore -ne 1) {
  Write-Host "VERIFICATION FAILED" -ForegroundColor Red
  exit 1
}

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
Write-Host ""
Write-Host "HOTFIX APPLIED" -ForegroundColor Green