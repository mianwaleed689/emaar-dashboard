$path = "C:\Users\TAD\emaar-dashboard\src\tabs\LaunchCalendarTab.jsx"
$backup = $path + ".bak-launch-unify-v2"
Copy-Item $path $backup -Force

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))
$origLen = $content.Length
$origLines = ($content -split "`n").Count

# CHANGE 1: Delete SEED_LAUNCHES array (worked before, keep same pattern)
$seedStart = $content.IndexOf('const SEED_LAUNCHES = [')
if ($seedStart -lt 0) { Write-Host "SEED start not found" -ForegroundColor Red; exit 1 }
$afterStart = $content.Substring($seedStart)
$closingMatch = [regex]::Match($afterStart, "(?m)^\];")
if (-not $closingMatch.Success) { Write-Host "SEED close not found" -ForegroundColor Red; exit 1 }
$seedEnd = $seedStart + $closingMatch.Index + 2
$oldArray = $content.Substring($seedStart, $seedEnd - $seedStart)
$newArray = 'const SEED_LAUNCHES = [];' + "`n" + '/* Seed data removed - Launch Calendar reads from liveProjects prop. */'
$content = $content.Replace($oldArray, $newArray)

$check1 = $content.Contains('const SEED_LAUNCHES = [];')
Write-Host "CHANGE 1 applied: $check1" -ForegroundColor $(if ($check1) { "Green" } else { "Red" })

# CHANGE 2: Add liveProjects to signature - use SINGLE LINE anchor
$oldSigLine = '  liveLaunches,'
$newSigLines = '  liveLaunches,' + "`n" + '  liveProjects = [],'

# Count occurrences to make sure it's unique
$countOld = ([regex]::Matches($content, [regex]::Escape($oldSigLine))).Count
Write-Host "  'liveLaunches,' occurrences: $countOld" -ForegroundColor Gray

if ($countOld -eq 0) { Write-Host "Sig anchor not found" -ForegroundColor Red; exit 1 }
if ($countOld -gt 1) { Write-Host "Sig anchor not unique (appears $countOld times)" -ForegroundColor Red; exit 1 }

$content = $content.Replace($oldSigLine, $newSigLines)
$check2 = $content.Contains('  liveProjects = [],')
Write-Host "CHANGE 2 applied: $check2" -ForegroundColor $(if ($check2) { "Green" } else { "Red" })

# CHANGE 3: Data source - replace single line with multi-line transformation
$oldDataLine = '    const tier1Src = (liveLaunches && liveLaunches.length > 0) ? liveLaunches : SEED_LAUNCHES;'
$countData = ([regex]::Matches($content, [regex]::Escape($oldDataLine))).Count
Write-Host "  data source line occurrences: $countData" -ForegroundColor Gray

if ($countData -ne 1) { Write-Host "Data line not unique or missing" -ForegroundColor Red; exit 1 }

$newDataBlock = '    // Unified data: transform liveProjects to launch card shape' + "`n" + '    const projectsAsLaunches = (Array.isArray(liveProjects) ? liveProjects : [])' + "`n" + '      .filter(p => p && (p.launchDate || p.projectStartDate || p.status === "Off-Plan"))' + "`n" + '      .map(p => ({' + "`n" + '        id: p.id || ("live-" + Math.random().toString(36).slice(2)),' + "`n" + '        project: p.project || p.name || "Unnamed",' + "`n" + '        developer: p.developer || p.developerName || "Unknown",' + "`n" + '        community: p.community || p.district || "Dubai",' + "`n" + '        type: p.type || "Apartment",' + "`n" + '        tier: p.tier || 2,' + "`n" + '        branded: !!p.branded,' + "`n" + '        launchDate: p.launchDate || p.projectStartDate || "",' + "`n" + '        eoiDeadline: p.eoiDeadline || "",' + "`n" + '        status: p.status || "Off-Plan",' + "`n" + '        units: p.totalUnits || p.units || 0,' + "`n" + '        soldUnits: p.unitsSold || 0,' + "`n" + '        startingPrice: p.priceMin || 0,' + "`n" + '        pricePerSqft: p.ppsf || 0,' + "`n" + '        avgUnitSize: p.avgUnitSize || 0,' + "`n" + '        eoiAmount: p.eoiAmount || 0,' + "`n" + '        eoiRefundable: !!p.eoiRefundable,' + "`n" + '        paymentPlan: p.paymentPlan || { dp: 10, construction: 70, handover: 20, postHandover: 0, label: p.payment || "10/70/20" },' + "`n" + '        handover: p.handoverQuarter || p.handover || p.expectedHandover || "",' + "`n" + '        developerOnTimeRate: p.devOnTimeRate || (p.tier === 1 ? 85 : 70),' + "`n" + '        communityAvgPpsf: p.communityAvgPpsf || p.ppsf || 0,' + "`n" + '        appreciationToHandover: p.appreciationToHandover || 0,' + "`n" + '        goldenVisa: !!p.goldenVisa,' + "`n" + '        metroDistanceKm: p.distMetro || 0,' + "`n" + '        beachAccess: !!p.beachAccess,' + "`n" + '        insight: p.overview || p.description || p.insight || "",' + "`n" + '        velocityScore: p.velocityScore || 0,' + "`n" + '        tags: Array.isArray(p.tags) ? p.tags : [],' + "`n" + '        grossYield: p.grossYield || 0,' + "`n" + '        netYield: p.netYield || 0,' + "`n" + '        serviceCharge: p.serviceCharge || 0,' + "`n" + '        commission: p.commission || 2,' + "`n" + '        investmentScore: p.investmentScore || 0,' + "`n" + '        developerScore: p.developerScore || (p.tier === 1 ? 85 : 70),' + "`n" + '        reraNo: p.reraNo || p.dldNumber || p.projectNumber || "",' + "`n" + '        escrowBank: p.escrowBank || "",' + "`n" + '        plotMin: p.plotSize || 0, plotMax: p.plotSize || 0,' + "`n" + '        distances: { metro: p.distMetro || 0, difc: p.distDIFC || 0, airport: p.distAirport || 0, beach: p.distBeach || 0, mall: p.distMall || 0, school: p.distSchool || 0, hospital: p.distHospital || 0 },' + "`n" + '        amenities: Array.isArray(p.amenities) ? p.amenities : [],' + "`n" + '        views: Array.isArray(p.view) ? p.view : (Array.isArray(p.views) ? p.views : []),' + "`n" + '        unitBreakdown: Array.isArray(p.unitBreakdown) ? p.unitBreakdown : [],' + "`n" + '        isLive: true,' + "`n" + '      }));' + "`n" + '    const liveLcMerged = [...(Array.isArray(liveLaunches) ? liveLaunches : []), ...projectsAsLaunches];' + "`n" + '    const seenLcIds = new Set();' + "`n" + '    const dedupedLc = liveLcMerged.filter(x => { if (!x || !x.id) return true; if (seenLcIds.has(x.id)) return false; seenLcIds.add(x.id); return true; });' + "`n" + '    const tier1Src = dedupedLc.length > 0 ? dedupedLc : SEED_LAUNCHES;'

$content = $content.Replace($oldDataLine, $newDataBlock)
$check3 = $content.Contains('projectsAsLaunches')
Write-Host "CHANGE 3 applied: $check3" -ForegroundColor $(if ($check3) { "Green" } else { "Red" })

if (-not ($check1 -and $check2 -and $check3)) {
  Write-Host ""
  Write-Host "One or more changes failed - reverting" -ForegroundColor Red
  Copy-Item $backup $path -Force
  exit 1
}

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))

$newLines = ($content -split "`n").Count
Write-Host ""
Write-Host "LAUNCH CALENDAR UNIFIED" -ForegroundColor Green
Write-Host "Lines: $origLines -> $newLines (removed $($origLines - $newLines))"