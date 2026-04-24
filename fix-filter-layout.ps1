$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$backup = $path + ".bak-layout-fix"
Copy-Item $path $backup -Force

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

# FIX 1: Change outer container from grid to flex
$oldGrid = '                <div style={{' + "`n" + '                  display:"grid",' + "`n" + '                  gridTemplateColumns:"1.3fr 1.3fr 1fr 1fr 1.1fr",' + "`n" + '                  gap:10,' + "`n" + '                  marginBottom: 12,' + "`n" + '                  padding:"16px 18px",' + "`n" + '                  background:"linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",' + "`n" + '                  border:`1px solid rgba(255,255,255,0.06)`,' + "`n" + '                  borderRadius:14,' + "`n" + '                }}>'

if (-not $content.Contains($oldGrid)) {
  Write-Host "Outer grid anchor not found" -ForegroundColor Red
  exit 1
}

$newFlex = '                <div style={{' + "`n" + '                  display:"flex",' + "`n" + '                  flexWrap:"wrap",' + "`n" + '                  gap:12,' + "`n" + '                  marginBottom: 12,' + "`n" + '                  padding:"16px 18px",' + "`n" + '                  background:"linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",' + "`n" + '                  border:`1px solid rgba(255,255,255,0.06)`,' + "`n" + '                  borderRadius:14,' + "`n" + '                  alignItems:"flex-end",' + "`n" + '                }}>'

$content = $content.Replace($oldGrid, $newFlex)
Write-Host "Outer container: grid -> flex" -ForegroundColor Green

# FIX 2: Give each filter div a flex-basis/min-width so they size well
# Category div - add flex sizing
$oldCatDiv = '                  {/* Property Category */}' + "`n" + '                  <div>'
$newCatDiv = '                  {/* Property Category */}' + "`n" + '                  <div style={{ flex:"1 1 180px", minWidth:160 }}>'
$content = $content.Replace($oldCatDiv, $newCatDiv)

# Property Type div
$oldTypeDiv = '                  {/* Property Type - depends on Category */}' + "`n" + '                  <div>'
$newTypeDiv = '                  {/* Property Type - depends on Category */}' + "`n" + '                  <div style={{ flex:"1 1 180px", minWidth:160 }}>'
$content = $content.Replace($oldTypeDiv, $newTypeDiv)

# Configuration div (inside the ternary)
$oldCfgDiv = '                  {shouldShowConfiguration(projCategory, projMode) ? (' + "`n" + '                    <div>'
$newCfgDiv = '                  {shouldShowConfiguration(projCategory, projMode) ? (' + "`n" + '                    <div style={{ flex:"1 1 140px", minWidth:120 }}>'
$content = $content.Replace($oldCfgDiv, $newCfgDiv)

# Remove the <div /> placeholder when Configuration is hidden - replace with null
$oldPlaceholder = '                  ) : <div />}'
$newPlaceholder = '                  ) : null}'
$content = $content.Replace($oldPlaceholder, $newPlaceholder)

# Price Range div
$oldPriceDiv = '                  {/* Price Range */}' + "`n" + '                  <div>'
$newPriceDiv = '                  {/* Price Range */}' + "`n" + '                  <div style={{ flex:"1 1 140px", minWidth:130 }}>'
$content = $content.Replace($oldPriceDiv, $newPriceDiv)

# More Filters button div
$oldMoreDiv = '                  {/* More Filters button */}' + "`n" + '                  <div>'
$newMoreDiv = '                  {/* More Filters button */}' + "`n" + '                  <div style={{ flex:"0 0 150px" }}>'
$content = $content.Replace($oldMoreDiv, $newMoreDiv)

Write-Host "Filter children: flex sizing applied" -ForegroundColor Green

# Verify
$flexCount = ([regex]::Matches($content, 'flex:"1 1 180px"')).Count
$nullCount = ([regex]::Matches($content, '\) : null\}')).Count
Write-Host ""
Write-Host "Verification:"
Write-Host "  flex:'1 1 180px' occurrences: $flexCount (expected 2)"
Write-Host "  Null placeholder: $nullCount (expected 1)"

if ($flexCount -ne 2 -or $nullCount -ne 1) {
  Write-Host "VERIFICATION FAILED" -ForegroundColor Red
  exit 1
}

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
Write-Host ""
Write-Host "LAYOUT FIX APPLIED" -ForegroundColor Green