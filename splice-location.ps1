$target = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$blockFile = "C:\Users\TAD\emaar-dashboard\section-location.txt"

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($target))
$newBlock = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($blockFile))
$origLen = $content.Length

# Locate the old Distance block: from 'Distance to Key Landmarks' chart-box opening
# to its closing </div> </div> before LegalNote
$startAnchor = '                    <div className="chart-box" style={{ padding:18, marginBottom:12 }}>' + "`r`n" + '                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Distance to Key Landmarks</div>'
$endAnchor = '                    <LegalNote T={T} />' + "`r`n" + '                  </div>' + "`r`n" + '                  );' + "`r`n" + '                })()}'

$startIdx = $content.IndexOf($startAnchor)
if ($startIdx -lt 0) {
  # Try with LF line endings instead of CRLF
  $startAnchor = $startAnchor -replace "`r`n", "`n"
  $endAnchor = $endAnchor -replace "`r`n", "`n"
  $startIdx = $content.IndexOf($startAnchor)
}

if ($startIdx -lt 0) {
  Write-Host "Start anchor not found" -ForegroundColor Red
  exit 1
}

$endIdx = $content.IndexOf($endAnchor, $startIdx)
if ($endIdx -lt 0) {
  Write-Host "End anchor not found" -ForegroundColor Red
  exit 1
}

Write-Host ("Found block: " + $startIdx + " -> " + $endIdx + " (" + ($endIdx - $startIdx) + " chars)")

# Build replacement: new block + preserve the LegalNote closing
$replacement = $newBlock + "`n" + $endAnchor
$content = $content.Substring(0, $startIdx) + $replacement + $content.Substring($endIdx + $endAnchor.Length)

# FIX 2: RERA badges -> DLD
$rera1old = 'RERA #{p.reraNo || p.projectNumber}'
$rera1new = 'DLD #{p.reraNo || p.projectNumber}'
if ($content.Contains($rera1old)) {
  $content = $content.Replace($rera1old, $rera1new)
  Write-Host "Fixed RERA -> DLD (card badge)" -ForegroundColor Green
}

$rera2old = 'RERA #{selectedProject.reraNo || selectedProject.projectNumber}'
$rera2new = 'DLD #{selectedProject.reraNo || selectedProject.projectNumber}'
if ($content.Contains($rera2old)) {
  $content = $content.Replace($rera2old, $rera2new)
  Write-Host "Fixed RERA -> DLD (modal badge)" -ForegroundColor Green
}

[System.IO.File]::WriteAllBytes($target, [System.Text.Encoding]::UTF8.GetBytes($content))

Write-Host ""
Write-Host ("Original: " + $origLen + " chars")
Write-Host ("New:      " + $content.Length + " chars")
Write-Host ("Delta:    " + ($content.Length - $origLen))