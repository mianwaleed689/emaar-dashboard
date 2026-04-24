$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$backup = $path + ".bak-bed-ranges"
Copy-Item $path $backup -Force

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

# REPLACE flat BED_OPTIONS with type-aware BED_OPTIONS_BY_TYPE + helper
$old = 'const UNIT_BASED_RESIDENTIAL = ["Apartment", "Villa", "Townhouse", "Hotel Apartment"];' + "`n" + 'const BED_OPTIONS = ["All", "Studio", "1 BR", "2 BR", "3 BR", "4+ BR"];'

$new = 'const UNIT_BASED_RESIDENTIAL = ["Apartment", "Villa", "Townhouse", "Hotel Apartment"];' + "`n`n" + '/* Type-aware bedroom ranges - Bloomberg-tier contextual filtering.' + "`n" + '   Each property type shows only realistic configurations:' + "`n" + '   - Apartment/Penthouse max at 5+ BR (rare above that)' + "`n" + '   - Villa goes to 7+ BR (luxury market 8-10+ BR bundled)' + "`n" + '   - Townhouse caps at 5+ BR' + "`n" + '   - Hotel Apartment caps at 3 BR' + "`n" + '*/' + "`n" + 'const BED_OPTIONS_BY_TYPE = {' + "`n" + '  "Apartment":       ["All", "Studio", "1 BR", "2 BR", "3 BR", "4 BR", "5+ BR"],' + "`n" + '  "Villa":           ["All", "2 BR", "3 BR", "4 BR", "5 BR", "6 BR", "7+ BR"],' + "`n" + '  "Townhouse":       ["All", "2 BR", "3 BR", "4 BR", "5+ BR"],' + "`n" + '  "Hotel Apartment": ["All", "Studio", "1 BR", "2 BR", "3 BR"],' + "`n" + '};' + "`n`n" + '/* Helper: get the appropriate bed options array for the selected display type */' + "`n" + 'function getBedOptionsForType(displayType) {' + "`n" + '  return BED_OPTIONS_BY_TYPE[displayType] || ["All"];' + "`n" + '}' + "`n`n" + '/* Kept for backward compatibility if any other code imports it */' + "`n" + 'const BED_OPTIONS = ["All", "Studio", "1 BR", "2 BR", "3 BR", "4 BR", "5 BR", "6 BR", "7+ BR"];'

if (-not $content.Contains($old)) {
  Write-Host "Anchor not found" -ForegroundColor Red; exit 1
}

$content = $content.Replace($old, $new)
Write-Host "BED_OPTIONS_BY_TYPE added" -ForegroundColor Green

# Now update the Configuration dropdown render to use type-aware options
$oldDropdown = '                        <option value="All">Any Beds</option>' + "`n" + '                        <option value="Studio">Studio</option>' + "`n" + '                        <option value="1 BR">1 BR</option>' + "`n" + '                        <option value="2 BR">2 BR</option>' + "`n" + '                        <option value="3 BR">3 BR</option>' + "`n" + '                        <option value="4+ BR">4+ BR</option>'

$newDropdown = '                        {getBedOptionsForType(projMode).map(bed => (' + "`n" + '                          <option key={bed} value={bed}>{bed === "All" ? "Any Beds" : bed}</option>' + "`n" + '                        ))}'

if (-not $content.Contains($oldDropdown)) {
  Write-Host "Dropdown anchor not found" -ForegroundColor Red; exit 1
}

$content = $content.Replace($oldDropdown, $newDropdown)
Write-Host "Configuration dropdown now uses type-aware bed options" -ForegroundColor Green

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))

Write-Host ""
Write-Host "TYPE-AWARE BED RANGES APPLIED"
Write-Host "Apartment:       Studio, 1-4 BR, 5+ BR"
Write-Host "Villa:           2-6 BR, 7+ BR"
Write-Host "Townhouse:       2-4 BR, 5+ BR"
Write-Host "Hotel Apartment: Studio, 1-3 BR"