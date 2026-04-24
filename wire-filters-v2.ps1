$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$backup = $path + ".bak-wire-filters-v2"
Copy-Item $path $backup -Force
Write-Host "Backup created" -ForegroundColor Gray

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

# Use SHORT unique anchor - just match the line that does the OLD type filter
$oldLine = 'if (projMode !== "All" && normalizeType(p) !== projMode) return false;'

if (-not $content.Contains($oldLine)) {
  Write-Host "Old type filter line not found - aborting" -ForegroundColor Red
  exit 1
}

# Count occurrences to ensure uniqueness
$occurrences = ([regex]::Matches($content, [regex]::Escape($oldLine))).Count
Write-Host "Old line occurrences: $occurrences" -ForegroundColor Gray
if ($occurrences -ne 1) {
  Write-Host "Line is not unique - aborting to be safe" -ForegroundColor Red
  exit 1
}

# Build replacement - 3 layers
$L1 = 'if (projCategory && projCategory !== "All") { const dts = getDisplayTypesForCategory(projCategory); if (dts.length > 0 && !dts.includes(normalizeType(p))) return false; }'
$L2 = 'if (projMode !== "All") { const its = getInternalTypes(projMode); if (its && its.length > 0) { const raw = String(p.type || p.propertyType || p.dldClass || "").toLowerCase(); const canon = normalizeType(p); if (!its.some(t => raw.includes(t.toLowerCase()) || t === canon)) return false; } else if (normalizeType(p) !== projMode) { return false; } }'

$newLogic = $L1 + "`n              " + $L2

$content = $content.Replace($oldLine, $newLogic)
Write-Host "3-layer filter wiring applied" -ForegroundColor Green

# Also upgrade beds filter
$oldBeds = 'if (projBeds !== "All" && Array.isArray(p.beds) && p.beds.length > 0 && !p.beds.includes(projBeds)) return false;'

$newBeds = 'if (projBeds !== "All") { const bedKey = projBeds.replace(" BR", "BR").replace("+", "").trim(); if (Array.isArray(p.beds) && p.beds.length > 0) { if (!p.beds.includes(projBeds) && !p.beds.includes(bedKey)) return false; } else if (p.bedConfig && typeof p.bedConfig === "object") { const c = p.bedConfig[bedKey] || p.bedConfig[projBeds]; if (!c || c === 0) return false; } else if (Array.isArray(p.unitBreakdown)) { const hit = p.unitBreakdown.find(u => String(u.type || "").replace(" ", "").toUpperCase() === bedKey.toUpperCase()); if (!hit || !hit.count) return false; } }'

if (-not $content.Contains($oldBeds)) {
  Write-Host "Beds filter not found - skipping" -ForegroundColor Yellow
} else {
  $content = $content.Replace($oldBeds, $newBeds)
  Write-Host "Beds filter upgraded (array + bedConfig + unitBreakdown)" -ForegroundColor Green
}

# Verify
$hasL1 = $content.Contains('getDisplayTypesForCategory(projCategory)')
$hasL2 = $content.Contains('getInternalTypes(projMode)')
if (-not ($hasL1 -and $hasL2)) {
  Write-Host "VERIFICATION FAILED - markers missing" -ForegroundColor Red
  exit 1
}

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
Write-Host ""
Write-Host "WIRING COMPLETE" -ForegroundColor Green
Write-Host "Layer 1 (Category): ADDED via getDisplayTypesForCategory"
Write-Host "Layer 2 -> Layer 3: ADDED via getInternalTypes"
Write-Host "Beds filter: handles array / bedConfig / unitBreakdown"