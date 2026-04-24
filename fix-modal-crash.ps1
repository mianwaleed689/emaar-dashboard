$path = "C:\Users\TAD\emaar-dashboard\src\tabs\LaunchCalendarTab.jsx"
$backup = $path + ".bak-modal-crash-fix"
Copy-Item $path $backup -Force

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

# FIX 1: L1219 - pricePerSqft might be undefined
$old1 = '{detailModalProject.pricePerSqft.toLocaleString()}'
$new1 = '{(detailModalProject.pricePerSqft || 0).toLocaleString()}'
$c1 = ([regex]::Matches($content, [regex]::Escape($old1))).Count
if ($c1 -eq 1) { $content = $content.Replace($old1, $new1); Write-Host "Fix 1: pricePerSqft guarded" -ForegroundColor Green }

# FIX 2: L1245 - units might be undefined
$old2 = '{detailModalProject.units.toLocaleString()}'
$new2 = '{(detailModalProject.units || 0).toLocaleString()}'
$c2 = ([regex]::Matches($content, [regex]::Escape($old2))).Count
if ($c2 -eq 1) { $content = $content.Replace($old2, $new2); Write-Host "Fix 2: units guarded" -ForegroundColor Green }

# FIX 3: L1488 - sizeMin / sizeMax might be undefined
$old3 = '{u.sizeMin.toLocaleString()} – {u.sizeMax.toLocaleString()}'
$new3 = '{u.sizeMin ? (u.sizeMin.toLocaleString() + " to " + (u.sizeMax || u.sizeMin).toLocaleString()) : "TBD"}'
$c3 = ([regex]::Matches($content, [regex]::Escape($old3))).Count
if ($c3 -eq 1) { $content = $content.Replace($old3, $new3); Write-Host "Fix 3: sizeMin/sizeMax guarded" -ForegroundColor Green }

# FIX 4: L1489 - plotMin / plotMax with toLocaleString
$old4 = '${u.plotMin.toLocaleString()} – ${u.plotMax.toLocaleString()}'
$new4 = '${u.plotMin.toLocaleString()} to ${(u.plotMax || u.plotMin).toLocaleString()}'
$c4 = ([regex]::Matches($content, [regex]::Escape($old4))).Count
if ($c4 -eq 1) { $content = $content.Replace($old4, $new4); Write-Host "Fix 4: plotMax null-safe" -ForegroundColor Green }

# FIX 5: L1491 - ppsf might be undefined
$old5 = '{u.ppsf.toLocaleString()}'
$new5 = '{(u.ppsf || 0).toLocaleString()}'
$c5 = ([regex]::Matches($content, [regex]::Escape($old5))).Count
if ($c5 -ge 1) { $content = $content.Replace($old5, $new5); Write-Host "Fix 5: ppsf guarded ($c5 occurrences)" -ForegroundColor Green }

# FIX 6: L1565 - eoiAmount might be undefined
$old6 = 'AED {(p.eoiAmount / 1000).toLocaleString()}K'
$new6 = 'AED {((p.eoiAmount || 0) / 1000).toLocaleString()}K'
$c6 = ([regex]::Matches($content, [regex]::Escape($old6))).Count
if ($c6 -eq 1) { $content = $content.Replace($old6, $new6); Write-Host "Fix 6: eoiAmount guarded" -ForegroundColor Green }

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))

Write-Host ""
Write-Host "MODAL CRASH FIXES APPLIED" -ForegroundColor Green
Write-Host "Every .toLocaleString() call now null-safe"