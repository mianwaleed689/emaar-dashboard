$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$backup = $path + ".bak-price-fix"
Copy-Item $path $backup -Force
Write-Host "Backup: $backup" -ForegroundColor Gray

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

$oldPrice = '              if (projPriceMin > 0 && p.priceMin && p.priceMin < projPriceMin) return false;' + "`n" + '              if (projPriceMax > 0 && p.priceMax && p.priceMax > projPriceMax) return false;'

if (-not $content.Contains($oldPrice)) {
  Write-Host "Anchor not found" -ForegroundColor Red
  exit 1
}

$newPrice = '              // PRICE FILTER - range overlap + bed-aware' + "`n" + '              if (projPriceMin > 0 || (projPriceMax > 0 && projPriceMax < 999999999)) {' + "`n" + '                const userMin = projPriceMin || 0;' + "`n" + '                const userMax = (projPriceMax && projPriceMax < 999999999) ? projPriceMax : Infinity;' + "`n" + '                let matched = false;' + "`n" + '                if (projBeds !== "All" && Array.isArray(p.unitBreakdown) && p.unitBreakdown.length > 0) {' + "`n" + '                  const bedKey = projBeds.replace(" BR", "BR").replace("+", "").trim();' + "`n" + '                  const unit = p.unitBreakdown.find(u => String(u.type || "").replace(" ", "").toUpperCase() === bedKey.toUpperCase());' + "`n" + '                  if (unit) {' + "`n" + '                    const unitPrice = unit.priceMin || unit.priceFrom || 0;' + "`n" + '                    if (unitPrice >= userMin && unitPrice <= userMax) matched = true;' + "`n" + '                  } else {' + "`n" + '                    const pMin = p.priceMin || 0;' + "`n" + '                    const pMax = p.priceMax || Infinity;' + "`n" + '                    if (pMax >= userMin && pMin <= userMax) matched = true;' + "`n" + '                  }' + "`n" + '                } else {' + "`n" + '                  const pMin = p.priceMin || 0;' + "`n" + '                  const pMax = p.priceMax || Infinity;' + "`n" + '                  if (pMax >= userMin && pMin <= userMax) matched = true;' + "`n" + '                }' + "`n" + '                if (!matched) return false;' + "`n" + '              }'

$content = $content.Replace($oldPrice, $newPrice)

# Verify new logic is in place
$hasRangeCheck = $content.Contains('pMax >= userMin && pMin <= userMax')
$hasBedAware = $content.Contains('Array.isArray(p.unitBreakdown) && p.unitBreakdown.length > 0')
if (-not ($hasRangeCheck -and $hasBedAware)) {
  Write-Host "VERIFICATION FAILED" -ForegroundColor Red
  exit 1
}

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
Write-Host ""
Write-Host "PRICE FILTER FIXED" -ForegroundColor Green
Write-Host "Behavior:"
Write-Host "- With bed picked + unitBreakdown: checks exact unit price against user range"
Write-Host "- Without bed: checks if project price RANGE overlaps user range"
Write-Host ""
Write-Host "Test: User picks 3BR + AED 2M-5M -> Golf Grand 3BR is 3.4M -> MATCH"
Write-Host "Test: User picks 1BR + AED 2M-5M -> Golf Grand 1BR is 1.36M -> NO MATCH"
Write-Host "Test: Any beds + AED 2M-5M -> Golf Grand range 1.36M-3.8M overlaps -> MATCH"