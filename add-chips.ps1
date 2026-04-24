$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$backup = $path + ".bak-add-chips"
Copy-Item $path $backup -Force
Write-Host "Backup: $backup" -ForegroundColor Gray

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

# STEP 1: Add 4 new chip pushes RIGHT AFTER the last existing push (L966 - projIntelFilter)
$oldLine = '                  if (projIntelFilter !== "all") activeFilters.push({ key:"int", label:projIntelFilter === "tier1" ? "Tier 1 only" : projIntelFilter === "gv" ? "Golden Visa" : projIntelFilter === "branded" ? "Branded residences" : projIntelFilter, clear:() => setProjIntelFilter("all") });'

if (-not $content.Contains($oldLine)) {
  Write-Host "Intel filter anchor not found" -ForegroundColor Red
  exit 1
}

$newLines = '                  if (projIntelFilter !== "all") activeFilters.push({ key:"int", label:projIntelFilter === "tier1" ? "Tier 1 only" : projIntelFilter === "gv" ? "Golden Visa" : projIntelFilter === "branded" ? "Branded residences" : projIntelFilter, clear:() => setProjIntelFilter("all") });' + "`n" + '                  // NEW FILTER SYSTEM chips' + "`n" + '                  if (projCategory !== "All") activeFilters.push({ key:"cat", label:projCategory, clear:() => { setProjCategory("All"); setProjMode("All"); setProjBeds("All"); } });' + "`n" + '                  if (projMode !== "All") activeFilters.push({ key:"typ", label:projMode, clear:() => { setProjMode("All"); setProjBeds("All"); } });' + "`n" + '                  if (projBeds !== "All") activeFilters.push({ key:"bed", label:projBeds, clear:() => setProjBeds("All") });' + "`n" + '                  if (projPriceMin > 0 || (projPriceMax > 0 && projPriceMax < 999999999)) {' + "`n" + '                    const toM = n => (n/1000000).toFixed(n >= 10000000 ? 0 : 1) + "M";' + "`n" + '                    const priceLabel = projPriceMin > 0 && projPriceMax < 999999999' + "`n" + '                      ? `AED ${toM(projPriceMin)}-${toM(projPriceMax)}`' + "`n" + '                      : projPriceMin > 0 ? `From AED ${toM(projPriceMin)}`' + "`n" + '                      : `Up to AED ${toM(projPriceMax)}`;' + "`n" + '                    activeFilters.push({ key:"prc", label:priceLabel, clear:() => { if(setProjPriceMin) setProjPriceMin(0); if(setProjPriceMax) setProjPriceMax(999999999); } });' + "`n" + '                  }' + "`n" + '                  if (projDev !== "All") activeFilters.push({ key:"dev", label:projDev, clear:() => setProjDev("All") });' + "`n" + '                  if (projCommunity !== "All") activeFilters.push({ key:"com", label:projCommunity, clear:() => setProjCommunity("All") });' + "`n" + '                  if (projStatus !== "All") activeFilters.push({ key:"sts", label:projStatus, clear:() => setProjStatus("All") });'

$content = $content.Replace($oldLine, $newLines)
Write-Host "7 new chip pushes added (Cat, Type, Bed, Price, Dev, Community, Status)" -ForegroundColor Green

# STEP 2: Upgrade the Clear button to reset ALL filters (including new ones)
$oldClear = '                          {localActiveCount > 0 && (' + "`n" + '                            <button type="button" onClick={() => { setProjHandover("All"); setProjGrade("All"); setProjIntelFilter("all"); setProjLifecycle("All"); setProjEscrowBank("All"); setProjConstruction("All"); }}'

$newClear = '                          {localActiveCount > 0 && (' + "`n" + '                            <button type="button" onClick={() => { setProjHandover("All"); setProjGrade("All"); setProjIntelFilter("all"); setProjLifecycle("All"); setProjEscrowBank("All"); setProjConstruction("All"); setProjCategory("All"); setProjMode("All"); setProjBeds("All"); setProjDev("All"); setProjCommunity("All"); setProjStatus("All"); setProjSearch(""); if(setProjPriceMin) setProjPriceMin(0); if(setProjPriceMax) setProjPriceMax(999999999); }}'

if (-not $content.Contains($oldClear)) {
  Write-Host "Clear button anchor not found" -ForegroundColor Red
  exit 1
}
$content = $content.Replace($oldClear, $newClear)
Write-Host "Clear All button now resets ALL filters (12 resets)" -ForegroundColor Green

# Verify
$catChip = $content.Contains('key:"cat", label:projCategory')
$typChip = $content.Contains('key:"typ", label:projMode')
$bedChip = $content.Contains('key:"bed", label:projBeds')
$prcChip = $content.Contains('key:"prc", label:priceLabel')

if (-not ($catChip -and $typChip -and $bedChip -and $prcChip)) {
  Write-Host "VERIFICATION FAILED" -ForegroundColor Red
  exit 1
}

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
Write-Host ""
Write-Host "CHIPS + CLEAR ALL APPLIED" -ForegroundColor Green