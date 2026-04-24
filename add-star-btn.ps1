$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# We add a watchlist star just AFTER the data source badge block (after its closing </div>)
# The closing </div> we target is line ~523: the wrapper around DLD Verified/Research pill
# Marker to find: the line where that wrapper div closes, just before the card content div begins

# Anchor: the ending of the data source badge block then the start of padding div
$old = @"
                    )}
                  </div>
                  <div style={{ padding:"14px 16px", borderBottom:
"@

$new = @"
                    )}
                  </div>
                  {/* Watchlist star - top-right below data source badge */}
                  {toggleWatchlist && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleWatchlist(p); }}
                      title={watchlist.some(w => w.id === p.id) ? "Remove from watchlist" : "Add to watchlist"}
                      style={{
                        position:"absolute", top:40, right:12, zIndex:2,
                        width:28, height:28, borderRadius:"50%",
                        background: watchlist.some(w => w.id === p.id) ? "rgba(212,168,67,0.18)" : "rgba(255,255,255,0.04)",
                        border: `+"`"+`1px solid `+"`"+`+(watchlist.some(w => w.id === p.id) ? "rgba(212,168,67,0.5)" : "rgba(255,255,255,0.1)"),
                        cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:14, color: watchlist.some(w => w.id === p.id) ? T.gold : T.textMuted,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(212,168,67,0.25)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = watchlist.some(w => w.id === p.id) ? "rgba(212,168,67,0.18)" : "rgba(255,255,255,0.04)"}
                    >
                      {watchlist.some(w => w.id === p.id) ? "$STAR_FILLED$" : "$STAR_OUTLINE$"}
                    </button>
                  )}
                  <div style={{ padding:"14px 16px", borderBottom:
"@

# Replace placeholders with actual Unicode
$new = $new.Replace('$STAR_FILLED$',  [string][char]0x2605)
$new = $new.Replace('$STAR_OUTLINE$', [string][char]0x2606)

if ($content.Contains($old)) {
  $content = $content.Replace($old, $new)
  $outBytes = [System.Text.Encoding]::UTF8.GetBytes($content)
  [System.IO.File]::WriteAllBytes($path, $outBytes)
  Write-Host "Star button injected" -ForegroundColor Green
} else {
  Write-Host "Anchor not found - investigating" -ForegroundColor Yellow
  # Debug: show what the actual line looks like
  $idx = $content.IndexOf("padding:" + '"14px 16px"' + ", borderBottom:")
  if ($idx -gt 0) {
    $s = [Math]::Max(0, $idx - 200)
    Write-Host ("Context: " + $content.Substring($s, 250))
  }
}