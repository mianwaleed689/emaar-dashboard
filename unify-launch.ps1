$path = "C:\Users\TAD\emaar-dashboard\src\tabs\LaunchCalendarTab.jsx"
$backup = $path + ".bak-launch-unify"
Copy-Item $path $backup -Force
Write-Host "Backup: $backup" -ForegroundColor Gray

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))
$origLen = $content.Length
$origLines = ($content -split "`n").Count

# CHANGE 1: Delete the SEED_LAUNCHES array body
$seedStart = $content.IndexOf('const SEED_LAUNCHES = [')
if ($seedStart -lt 0) { Write-Host "SEED_LAUNCHES start not found" -ForegroundColor Red; exit 1 }

$afterStart = $content.Substring($seedStart)
$closingMatch = [regex]::Match($afterStart, "(?m)^\];")
if (-not $closingMatch.Success) { Write-Host "SEED_LAUNCHES close not found" -ForegroundColor Red; exit 1 }

$seedEnd = $seedStart + $closingMatch.Index + 2
$oldArray = $content.Substring($seedStart, $seedEnd - $seedStart)

$newArray = 'const SEED_LAUNCHES = [];' + "`n" + '/* NOTE: Seed data removed. Launch Calendar now reads from liveProjects' + "`n" + '   prop passed from parent EmaarDashboardV2. Only DLD-verified Firestore' + "`n" + '   projects appear here. Projects with a launchDate or projectStartDate' + "`n" + '   populate Newspaper/Calendar/Comparison views. See tabs/ProjectsTab.jsx' + "`n" + '   for the golden-standard schema (145 fields, source attribution). */'

$content = $content.Replace($oldArray, $newArray)
Write-Host "CHANGE 1: Deleted 714-line SEED_LAUNCHES array" -ForegroundColor Green

# CHANGE 2: Function signature - add liveProjects prop
$oldSig = 'function LaunchCalendarTab({' + "`n" + '  lcSearch, setLcSearch,' + "`n" + '  lcDev, setLcDev,' + "`n" + '  lcStatus, setLcStatus,' + "`n" + '  lcType, setLcType,' + "`n" + '  lcView, setLcView,' + "`n" + '  liveMarketData,' + "`n" + '  liveLaunches,' + "`n" + '  liveDevelopments = [],' + "`n" + '  globalFilters = {},' + "`n" + '  allDevelopers = [],' + "`n" + '  handleTabChange,' + "`n" + '}) {'

$newSig = 'function LaunchCalendarTab({' + "`n" + '  lcSearch, setLcSearch,' + "`n" + '  lcDev, setLcDev,' + "`n" + '  lcStatus, setLcStatus,' + "`n" + '  lcType, setLcType,' + "`n" + '  lcView, setLcView,' + "`n" + '  liveMarketData,' + "`n" + '  liveLaunches,' + "`n" + '  liveProjects = [],' + "`n" + '  liveDevelopments = [],' + "`n" + '  globalFilters = {},' + "`n" + '  allDevelopers = [],' + "`n" + '  handleTabChange,' + "`n" + '}) {'

if (-not $content.Contains($oldSig)) { Write-Host "Function signature not found" -ForegroundColor Red; exit 1 }
$content = $content.Replace($oldSig, $newSig)
Write-Host "CHANGE 2: Added liveProjects prop to signature" -ForegroundColor Green

# CHANGE 3: Data source transformation
$oldDataLine = '    const tier1Src = (liveLaunches && liveLaunches.length > 0) ? liveLaunches : SEED_LAUNCHES;'

$newDataBlock = '    // Unified data source: transform liveProjects to launch card shape' + "`n" + '    const projectsAsLaunches = (Array.isArray(liveProjects) ? liveProjects : [])' + "`n" + '      .filter(p => p && (p.launchDate || p.projectStartDate || p.status === "Off-Plan"))' + "`n" + '      .map(p => {' + "`n" + '        const ld = p.launchDate || p.projectStartDate || "";' + "`n" + '        return {' + "`n" + '          id: p.id || ("live-" + Math.random().toString(36).slice(2)),' + "`n" + '          project: p.project || p.name || "Unnamed Project",' + "`n" + '          developer: p.developer || p.developerName || "Unknown",' + "`n" + '          community: p.community || p.district || "Dubai",' + "`n" + '          type: p.type || "Apartment",' + "`n" + '          tier: p.tier || 2,' + "`n" + '          branded: !!p.branded,' + "`n" + '          launchDate: ld,' + "`n" + '          eoiDeadline: p.eoiDeadline || "",' + "`n" + '          status: p.status || "Off-Plan",' + "`n" + '          units: p.totalUnits || p.units || 0,' + "`n" + '          soldUnits: p.unitsSold || 0,' + "`n" + '          startingPrice: p.priceMin || 0,' + "`n" + '          pricePerSqft: p.ppsf || 0,' + "`n" + '          avgUnitSize: p.avgUnitSize || 0,' + "`n" + '          eoiAmount: p.eoiAmount || 0,' + "`n" + '          eoiRefundable: !!p.eoiRefundable,' + "`n" + '          paymentPlan: p.paymentPlan || { dp: 10, construction: 70, handover: 20, postHandover: 0, label: p.payment || "10/70/20" },' + "`n" + '          handover: p.handoverQuarter || p.handover || p.expectedHandover || "",' + "`n" + '          developerOnTimeRate: p.devOnTimeRate || (p.tier === 1 ? 85 : 70),' + "`n" + '          communityAvgPpsf: p.communityAvgPpsf || p.ppsf || 0,' + "`n" + '          appreciationToHandover: p.appreciationToHandover || 0,' + "`n" + '          goldenVisa: !!p.goldenVisa,' + "`n" + '          metroDistanceKm: p.distMetro || 0,' + "`n" + '          beachAccess: !!p.beachAccess,' + "`n" + '          insight: p.overview || p.description || p.insight || "",' + "`n" + '          velocityScore: p.velocityScore || 0,' + "`n" + '          tags: Array.isArray(p.tags) ? p.tags : [],' + "`n" + '          grossYield: p.grossYield || 0,' + "`n" + '          netYield: p.netYield || 0,' + "`n" + '          serviceCharge: p.serviceCharge || 0,' + "`n" + '          commission: p.commission || 2,' + "`n" + '          investmentScore: p.investmentScore || 0,' + "`n" + '          developerScore: p.developerScore || (p.tier === 1 ? 85 : 70),' + "`n" + '          reraNo: p.reraNo || p.dldNumber || p.projectNumber || "",' + "`n" + '          escrowBank: p.escrowBank || "",' + "`n" + '          plotMin: p.plotSize || 0,' + "`n" + '          plotMax: p.plotSize || 0,' + "`n" + '          distances: {' + "`n" + '            metro: p.distMetro || 0,' + "`n" + '            difc: p.distDIFC || 0,' + "`n" + '            airport: p.distAirport || 0,' + "`n" + '            beach: p.distBeach || 0,' + "`n" + '            mall: p.distMall || 0,' + "`n" + '            school: p.distSchool || 0,' + "`n" + '            hospital: p.distHospital || 0,' + "`n" + '          },' + "`n" + '          amenities: Array.isArray(p.amenities) ? p.amenities : [],' + "`n" + '          views: Array.isArray(p.view) ? p.view : (Array.isArray(p.views) ? p.views : []),' + "`n" + '          unitBreakdown: Array.isArray(p.unitBreakdown) ? p.unitBreakdown : [],' + "`n" + '          isLive: true,' + "`n" + '        };' + "`n" + '      });' + "`n" + '    const liveLcMerged = [...(Array.isArray(liveLaunches) ? liveLaunches : []), ...projectsAsLaunches];' + "`n" + '    const seenLcIds = new Set();' + "`n" + '    const dedupedLc = liveLcMerged.filter(x => {' + "`n" + '      if (!x || !x.id) return true;' + "`n" + '      if (seenLcIds.has(x.id)) return false;' + "`n" + '      seenLcIds.add(x.id);' + "`n" + '      return true;' + "`n" + '    });' + "`n" + '    const tier1Src = dedupedLc.length > 0 ? dedupedLc : SEED_LAUNCHES;'

if (-not $content.Contains($oldDataLine)) { Write-Host "Data source line not found" -ForegroundColor Red; exit 1 }
$content = $content.Replace($oldDataLine, $newDataBlock)
Write-Host "CHANGE 3: Data source now reads from liveProjects + liveLaunches merged" -ForegroundColor Green

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))

$newLines = ($content -split "`n").Count
Write-Host ""
Write-Host "LAUNCH CALENDAR UNIFIED" -ForegroundColor Green
Write-Host "Lines: $origLines -> $newLines (removed $($origLines - $newLines))"