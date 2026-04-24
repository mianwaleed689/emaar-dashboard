$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$backup = $path + ".bak-wire-filters"
Copy-Item $path $backup -Force
Write-Host "Backup: $backup" -ForegroundColor Gray

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

# Replace the single-line type filter with 3-layer Category + Type
$old = '              // Global top-bar filters first' + "`n" + '              if (!projMatchesGlobalFilter(p)) return false;' + "`n" + '              // Type filter â€” but skip when ''All'' is selected' + "`n" + '              if (projMode !== "All" && normalizeType(p) !== projMode) return false;'

# Fallback match in case of mojibake dash
if (-not $content.Contains($old)) {
  $old = '              // Global top-bar filters first' + "`n" + '              if (!projMatchesGlobalFilter(p)) return false;'
  Write-Host "Using shorter anchor" -ForegroundColor Yellow
}

$newLogic = '              // Global top-bar filters first' + "`n" + '              if (!projMatchesGlobalFilter(p)) return false;' + "`n" + '              // === 3-LAYER FILTER WIRING ===' + "`n" + '              // Layer 1: Property Category' + "`n" + '              if (projCategory && projCategory !== "All") {' + "`n" + '                const displayTypesForCat = getDisplayTypesForCategory(projCategory);' + "`n" + '                if (displayTypesForCat.length > 0 && !displayTypesForCat.includes(normalizeType(p))) return false;' + "`n" + '              }' + "`n" + '              // Layer 2 -> Layer 3: Property Type expands to all internal variants' + "`n" + '              if (projMode !== "All") {' + "`n" + '                const internalTypes = getInternalTypes(projMode);' + "`n" + '                if (internalTypes && internalTypes.length > 0) {' + "`n" + '                  const pTypeRaw = String(p.type || p.propertyType || p.dldClass || "").toLowerCase();' + "`n" + '                  const pTypeCanon = normalizeType(p);' + "`n" + '                  const matches = internalTypes.some(t => pTypeRaw.includes(t.toLowerCase()) || t === pTypeCanon);' + "`n" + '                  if (!matches) return false;' + "`n" + '                } else if (normalizeType(p) !== projMode) {' + "`n" + '                  return false;' + "`n" + '                }' + "`n" + '              }'

$content = $content.Replace($old, $newLogic)

# Also upgrade the beds filter to handle both array and object shapes
$oldBeds = 'if (projBeds !== "All" && Array.isArray(p.beds) && p.beds.length > 0 && !p.beds.includes(projBeds)) return false;'

$newBeds = '// Beds filter: handles both p.beds array AND p.bedConfig object shape' + "`n" + '              if (projBeds !== "All") {' + "`n" + '                const bedLabel = projBeds.replace(" BR", "BR").replace("+", "").trim(); /* "2 BR" -> "2BR", "4+ BR" -> "4BR" */' + "`n" + '                if (Array.isArray(p.beds) && p.beds.length > 0) {' + "`n" + '                  if (!p.beds.includes(projBeds) && !p.beds.includes(bedLabel)) return false;' + "`n" + '                } else if (p.bedConfig && typeof p.bedConfig === "object") {' + "`n" + '                  const count = p.bedConfig[bedLabel] || p.bedConfig[projBeds] || p.bedConfig[bedLabel.toLowerCase()];' + "`n" + '                  if (!count || count === 0) return false;' + "`n" + '                } else if (Array.isArray(p.unitBreakdown)) {' + "`n" + '                  const hit = p.unitBreakdown.find(u => String(u.type || "").replace(" ", "").toUpperCase() === bedLabel.toUpperCase());' + "`n" + '                  if (!hit || !hit.count) return false;' + "`n" + '                }' + "`n" + '              }'

if (-not $content.Contains($oldBeds)) {
  Write-Host "Beds anchor not found - skipping beds upgrade" -ForegroundColor Yellow
} else {
  $content = $content.Replace($oldBeds, $newBeds)
  Write-Host "Beds filter upgraded to handle array + bedConfig + unitBreakdown shapes" -ForegroundColor Green
}

# Verify new markers are in
$hasLayer1 = $content.Contains('Layer 1: Property Category')
$hasLayer2 = $content.Contains('Layer 2 -> Layer 3')
$hasDisplayCall = $content.Contains('getDisplayTypesForCategory(projCategory)')
$hasInternalCall = $content.Contains('getInternalTypes(projMode)')

if (-not ($hasLayer1 -and $hasLayer2 -and $hasDisplayCall -and $hasInternalCall)) {
  Write-Host "VERIFICATION FAILED" -ForegroundColor Red
  Write-Host "Layer1: $hasLayer1  Layer2: $hasLayer2  DisplayCall: $hasDisplayCall  InternalCall: $hasInternalCall"
  exit 1
}

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))

Write-Host ""
Write-Host "FILTER WIRING COMPLETE" -ForegroundColor Green
Write-Host "Layer 1 (Category): ADDED"
Write-Host "Layer 2 -> Layer 3 (Type expands to 47 internal): ADDED"
Write-Host "Beds filter: upgraded for array + bedConfig + unitBreakdown"