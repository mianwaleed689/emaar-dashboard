$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$backup = $path + ".bak-commit2"
Copy-Item $path $backup -Force
Write-Host "Backup: $backup" -ForegroundColor Gray

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($path))
$origLen = $content.Length
$origLines = ($content -split "`n").Count
Write-Host "Original: $origLines lines, $origLen chars"
Write-Host ""

# ============================================
# DELETION 1: Property Type Pill Row
# Start: '                {/* ' (comment marker before div, L750)
# End: '                </div>' closing the pill row (L793)
# ============================================
$block1Start = '                <div style={{' + "`n" + '                  display:"flex", gap:8, flexWrap:"wrap",' + "`n" + '                  marginBottom: 16,' + "`n" + '                  padding: "14px 18px",' + "`n" + '                  background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",'

$block1Idx = $content.IndexOf($block1Start)
if ($block1Idx -lt 0) { Write-Host "BLOCK 1 start anchor not found - aborting" -ForegroundColor Red; exit 1 }

# Find closing </div> after the MODES.map
# Search for the unique closing pattern: "                })}`n                </div>" after the pill row
$block1End = '                  })}' + "`n" + '                </div>'
$block1EndIdx = $content.IndexOf($block1End, $block1Idx)
if ($block1EndIdx -lt 0) { Write-Host "BLOCK 1 end anchor not found - aborting" -ForegroundColor Red; exit 1 }

$block1Len = ($block1EndIdx + $block1End.Length) - $block1Idx
$block1Text = $content.Substring($block1Idx, $block1Len)

# Verify it's the pill row (contains MODES.map and Property type span)
if (-not ($block1Text.Contains('MODES.map(m =>') -and $block1Text.Contains('Property type</span>'))) {
  Write-Host "BLOCK 1 verification FAILED - anchors matched wrong region" -ForegroundColor Red
  exit 1
}

Write-Host "BLOCK 1 found: $block1Len chars (pill row)" -ForegroundColor Gray

# Delete it
$content = $content.Substring(0, $block1Idx) + $content.Substring($block1Idx + $block1Len)
Write-Host "BLOCK 1 deleted" -ForegroundColor Green

# ============================================
# DELETION 2: Old "Project filters" button
# Start: '                        <button type="button" onClick={() => setFiltersOpen(!filtersOpen)}'
# End: closing </button> with "Project filters" inside
# ============================================
$block2Start = '                        <button type="button" onClick={() => setFiltersOpen(!filtersOpen)}'
$block2Idx = $content.IndexOf($block2Start)
if ($block2Idx -lt 0) { Write-Host "BLOCK 2 start anchor not found - aborting" -ForegroundColor Red; exit 1 }

# End: the closing </button> of the Project filters button
# The button ends at '</button>\n\n                        <select'
$block2End = '</button>' + "`n`n" + '                        <select value={projSort}'
$block2EndIdx = $content.IndexOf($block2End, $block2Idx)
if ($block2EndIdx -lt 0) { Write-Host "BLOCK 2 end anchor not found - aborting" -ForegroundColor Red; exit 1 }

# Delete from block2Start to end of </button>\n (keeping the \n\n + select intact, so we delete up to right before \n\n + select)
$block2Len = ($block2EndIdx + '</button>'.Length) - $block2Idx
$block2Text = $content.Substring($block2Idx, $block2Len)

if (-not ($block2Text.Contains('Project filters') -and $block2Text.Contains('setFiltersOpen'))) {
  Write-Host "BLOCK 2 verification FAILED" -ForegroundColor Red
  exit 1
}

Write-Host "BLOCK 2 found: $block2Len chars (Project filters button)" -ForegroundColor Gray

$content = $content.Substring(0, $block2Idx) + $content.Substring($block2Idx + $block2Len)
Write-Host "BLOCK 2 deleted" -ForegroundColor Green

# ============================================
# DELETION 3: Expandable drawer {filtersOpen && (...)}
# Start: '                      {filtersOpen && ('
# End: '                      )}' closing the drawer
# ============================================
$block3Start = '                      {filtersOpen && ('
$block3Idx = $content.IndexOf($block3Start)
if ($block3Idx -lt 0) { Write-Host "BLOCK 3 start anchor not found - aborting" -ForegroundColor Red; exit 1 }

# The drawer ends with '\n                      )}'. But that pattern might appear elsewhere.
# Unique end: find the Smart segments label inside the drawer, then walk forward to the balanced ')}'
# Instead, use the specific "Smart segments" closing pattern:
$block3EndMarker = 'borderColor = "rgba(255,255,255,0.1)"; }' + "`n" + '                                    }}>' + "`n" + '                                    {f.label}' + "`n" + '                                  </button>' + "`n" + '                                );' + "`n" + '                              })}' + "`n" + '                            </div>' + "`n" + '                          </div>' + "`n" + '                        </div>' + "`n" + '                      )}'

$block3EndIdx = $content.IndexOf($block3EndMarker, $block3Idx)
if ($block3EndIdx -lt 0) { Write-Host "BLOCK 3 end anchor not found - aborting" -ForegroundColor Red; exit 1 }

$block3Len = ($block3EndIdx + $block3EndMarker.Length) - $block3Idx
$block3Text = $content.Substring($block3Idx, $block3Len)

if (-not ($block3Text.Contains('Smart segments') -and $block3Text.Contains('filtersOpen'))) {
  Write-Host "BLOCK 3 verification FAILED" -ForegroundColor Red
  exit 1
}

Write-Host "BLOCK 3 found: $block3Len chars (drawer + smart segments)" -ForegroundColor Gray

$content = $content.Substring(0, $block3Idx) + $content.Substring($block3Idx + $block3Len)
Write-Host "BLOCK 3 deleted" -ForegroundColor Green

# Write
[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))

$newLines = ($content -split "`n").Count
Write-Host ""
Write-Host "COMMIT 2 APPLIED" -ForegroundColor Green
Write-Host "Lines before: $origLines"
Write-Host "Lines after:  $newLines"
Write-Host "Removed:      $($origLines - $newLines) lines"
Write-Host ""
Write-Host "Backup preserved at: $backup"