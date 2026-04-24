$path = "C:\Users\TAD\emaar-dashboard\src\tabs\HandoverTab.jsx"
$backup = $path + ".bak-tier1src-fix"
Copy-Item $path $backup -Force

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))

# The second useMemo (L373+) references tier1Src but it's out of scope
# Fix: replace 'tier1Src' at L374 with the inline data derivation
$oldLine = '    const quarters = new Set(tier1Src.map(h => h.handoverQuarter).filter(Boolean));'

if (-not $content.Contains($oldLine)) {
  Write-Host "Anchor not found" -ForegroundColor Red
  exit 1
}

# Inline - since we cant reach tier1Src from here, derive quarters from liveProjects directly
$newLines = '    // Derive quarters from the same sources used by the main useMemo above' + "`n" + '    const projectsQuarters = (Array.isArray(liveProjects) ? liveProjects : [])' + "`n" + '      .map(p => {' + "`n" + '        if (p.handoverQuarter) return p.handoverQuarter;' + "`n" + '        const hd = String(p.handoverDate || p.contractedHandover || p.expectedHandover || p.handover || "");' + "`n" + '        const m = hd.match(/(\d{4})/);' + "`n" + '        const year = m ? m[1] : "";' + "`n" + '        const q = hd.includes("January") || hd.includes("February") || hd.includes("March") ? "Q1"' + "`n" + '          : hd.includes("April") || hd.includes("May") || hd.includes("June") ? "Q2"' + "`n" + '          : hd.includes("July") || hd.includes("August") || hd.includes("September") ? "Q3"' + "`n" + '          : hd.includes("October") || hd.includes("November") || hd.includes("December") ? "Q4"' + "`n" + '          : "";' + "`n" + '        return (q && year) ? (q + " " + year) : year;' + "`n" + '      }).filter(Boolean);' + "`n" + '    const launchQuarters = (Array.isArray(liveHandover) ? liveHandover : []).map(h => h.handoverQuarter).filter(Boolean);' + "`n" + '    const quarters = new Set([...projectsQuarters, ...launchQuarters]);'

$content = $content.Replace($oldLine, $newLines)

# Verify
$hasNew = $content.Contains('projectsQuarters')
$hasOld = $content.Contains('new Set(tier1Src.map(h')
Write-Host "New code inserted: $hasNew"
Write-Host "Old broken line gone: $(-not $hasOld)"

if (-not $hasNew -or $hasOld) {
  Write-Host "Fix failed - reverting" -ForegroundColor Red
  Copy-Item $backup $path -Force
  exit 1
}

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
Write-Host ""
Write-Host "HOTFIX APPLIED - tier1Src scope error resolved" -ForegroundColor Green