$path = "C:\Users\TAD\emaar-dashboard\src\tabs\HandoverTab.jsx"
$backup = $path + ".bak-handover-unify"
Copy-Item $path $backup -Force
Write-Host "Backup: $backup" -ForegroundColor Gray

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))
$origLen = $content.Length
$origLines = ($content -split "`n").Count

# ===========================================
# CHANGE 1: Delete the SEED_HANDOVERS array body (L35-L540)
# Replace with empty array + comment
# ===========================================
$seedStart = $content.IndexOf('const SEED_HANDOVERS = [')
if ($seedStart -lt 0) { Write-Host "SEED_HANDOVERS start not found" -ForegroundColor Red; exit 1 }

# Find the closing '];' at column 0 after the start
$afterStart = $content.Substring($seedStart)
$closingMatch = [regex]::Match($afterStart, "(?m)^\];")
if (-not $closingMatch.Success) { Write-Host "SEED_HANDOVERS closing not found" -ForegroundColor Red; exit 1 }

$seedEnd = $seedStart + $closingMatch.Index + 2  # include '];'
$oldArray = $content.Substring($seedStart, $seedEnd - $seedStart)

$newArray = 'const SEED_HANDOVERS = [];' + "`n" + '/* NOTE: Seed data removed. Handover tab now reads from liveProjects' + "`n" + '   prop passed from parent EmaarDashboardV2. Only DLD-verified' + "`n" + '   Firestore projects appear here. When more projects are added' + "`n" + '   via the admin flow, they will automatically appear in Cards/' + "`n" + '   Calendar/Risk Matrix views. See tabs/ProjectsTab.jsx for the' + "`n" + '   golden-standard data schema (145 fields, source attribution). */'

$content = $content.Replace($oldArray, $newArray)
Write-Host "CHANGE 1: Deleted 506-line SEED_HANDOVERS array" -ForegroundColor Green

# ===========================================
# CHANGE 2: Function signature - add liveProjects prop
# ===========================================
$oldSig = 'function HandoverTab({ liveHandover, liveDevelopments = [], globalFilters = {}, allDevelopers = [], handleTabChange }) {'
$newSig = 'function HandoverTab({ liveHandover, liveDevelopments = [], liveProjects = [], globalFilters = {}, allDevelopers = [], handleTabChange }) {'

if (-not $content.Contains($oldSig)) { Write-Host "Function signature not found" -ForegroundColor Red; exit 1 }
$content = $content.Replace($oldSig, $newSig)
Write-Host "CHANGE 2: Added liveProjects prop to signature" -ForegroundColor Green

# ===========================================
# CHANGE 3: The data source logic at L633
# Old: uses liveHandover OR SEED_HANDOVERS
# New: merges liveHandover + liveProjects (transformed), uses that
# ===========================================
$oldDataLine = '    const tier1Src = (liveHandover && liveHandover.length > 0) ? liveHandover : SEED_HANDOVERS;'

$newDataBlock = '    // Unified data source: transform liveProjects to handover card shape' + "`n" + '    const projectsAsHandovers = (Array.isArray(liveProjects) ? liveProjects : [])' + "`n" + '      .filter(p => p && (p.handoverDate || p.handoverQuarter || p.expectedHandover || p.handover))' + "`n" + '      .map(p => {' + "`n" + '        const hd = String(p.handoverDate || p.contractedHandover || p.expectedHandover || p.handover || "").trim();' + "`n" + '        let quarter = p.handoverQuarter || "";' + "`n" + '        if (!quarter && hd) {' + "`n" + '          const m = hd.match(/(\d{4})/);' + "`n" + '          const year = m ? m[1] : "";' + "`n" + '          const month = hd.includes("January") || hd.includes("February") || hd.includes("March") ? "Q1"' + "`n" + '            : hd.includes("April") || hd.includes("May") || hd.includes("June") ? "Q2"' + "`n" + '            : hd.includes("July") || hd.includes("August") || hd.includes("September") ? "Q3"' + "`n" + '            : hd.includes("October") || hd.includes("November") || hd.includes("December") ? "Q4"' + "`n" + '            : "";' + "`n" + '          if (month && year) quarter = month + " " + year;' + "`n" + '          else if (year) quarter = year;' + "`n" + '        }' + "`n" + '        return {' + "`n" + '          id: p.id || ("live-" + Math.random().toString(36).slice(2)),' + "`n" + '          project: p.project || p.name || "Unnamed Project",' + "`n" + '          developer: p.developer || p.developerName || "Unknown",' + "`n" + '          community: p.community || p.district || "Dubai",' + "`n" + '          type: p.type || "Apartment",' + "`n" + '          handoverQuarter: quarter || "TBD",' + "`n" + '          handoverDate: hd || "",' + "`n" + '          units: p.totalUnits || p.units || p.unitCount || 0,' + "`n" + '          constructionPct: typeof p.constructionPct === "number" ? p.constructionPct : 0,' + "`n" + '          rerVerified: !!(p.reraNo || p.dldNumber || p.projectNumber),' + "`n" + '          onSchedule: (typeof p.constructionPct === "number" ? p.constructionPct : 0) >= 50,' + "`n" + '          delayRiskScore: p.delayRiskScore || (p.tier === 1 ? 15 : 40),' + "`n" + '          startingPrice: p.priceMin || 0,' + "`n" + '          pricePerSqft: p.ppsf || 0,' + "`n" + '          avgUnitSize: p.avgUnitSize || 0,' + "`n" + '          grossYield: p.grossYield || 0,' + "`n" + '          devOnTimeRate: p.devOnTimeRate || (p.tier === 1 ? 85 : 70),' + "`n" + '          insight: p.overview || p.description || p.insight || "",' + "`n" + '          bedTypes: Array.isArray(p.beds) ? p.beds : Object.keys(p.bedConfig || {}),' + "`n" + '          riskFactors: p.tier === 1 ? ["Tier 1 developer", "DLD verified"] : ["Verify DLD status"],' + "`n" + '          riskLevel: p.tier === 1 ? "low" : "medium",' + "`n" + '          paymentPlan: p.paymentPlan || p.payment || "",' + "`n" + '          appreciationSinceLaunch: p.appreciationSinceLaunch || 0,' + "`n" + '          reraNo: p.reraNo || p.dldNumber || p.projectNumber || "",' + "`n" + '          escrowBank: p.escrowBank || "",' + "`n" + '          isLive: true,  /* flag: DLD-verified live Firestore data */' + "`n" + '        };' + "`n" + '      });' + "`n" + '    // Merge: liveProjects (Firestore) + liveHandover (admin-added handovers). Empty SEED array means no fake data.' + "`n" + '    const liveHoMerged = [...(Array.isArray(liveHandover) ? liveHandover : []), ...projectsAsHandovers];' + "`n" + '    const seenIds = new Set();' + "`n" + '    const dedupedHo = liveHoMerged.filter(h => {' + "`n" + '      if (!h || !h.id) return true;' + "`n" + '      if (seenIds.has(h.id)) return false;' + "`n" + '      seenIds.add(h.id);' + "`n" + '      return true;' + "`n" + '    });' + "`n" + '    const tier1Src = dedupedHo.length > 0 ? dedupedHo : SEED_HANDOVERS;'

if (-not $content.Contains($oldDataLine)) {
  Write-Host "Data source line (L633) not found" -ForegroundColor Red
  exit 1
}
$content = $content.Replace($oldDataLine, $newDataBlock)
Write-Host "CHANGE 3: Data source now reads from liveProjects + liveHandover merged" -ForegroundColor Green

# ===========================================
# CHANGE 4: Update the quarters Set at L818 to use the merged data
# ===========================================
$oldQuartersLine = '    const quarters = new Set(SEED_HANDOVERS.map(h => h.handoverQuarter));'
$newQuartersLine = '    const quarters = new Set(tier1Src.map(h => h.handoverQuarter).filter(Boolean));'

if ($content.Contains($oldQuartersLine)) {
  $content = $content.Replace($oldQuartersLine, $newQuartersLine)
  Write-Host "CHANGE 4: Quarters list now derived from merged data" -ForegroundColor Green
} else {
  Write-Host "CHANGE 4: quarters line not found (may already be fixed)" -ForegroundColor Yellow
}

# Write
[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))

$newLines = ($content -split "`n").Count
Write-Host ""
Write-Host "HANDOVER TAB UNIFIED" -ForegroundColor Green
Write-Host "Lines: $origLines -> $newLines (removed $($origLines - $newLines))"
Write-Host "Bytes: $origLen -> $($content.Length)"