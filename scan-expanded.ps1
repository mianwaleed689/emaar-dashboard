$path = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# Show raw bytes of problem areas to identify all patterns
# Find context around our known mojibake markers
$markers = @("âš", "âœ", "â­", "âŒ", "âž", "ðŸ", "âœ¨", "âœ…")

Write-Host "=== CONTEXT FOR EACH MOJIBAKE MARKER ===" -ForegroundColor Cyan
foreach ($m in $markers) {
  $count = ([regex]::Matches($content, [regex]::Escape($m))).Count
  if ($count -gt 0) {
    Write-Host ""
    Write-Host ("Marker '" + $m + "' found " + $count + " times") -ForegroundColor Yellow
    # Get first 3 contexts
    $idx = 0
    $shown = 0
    while ($idx -lt $content.Length -and $shown -lt 3) {
      $idx = $content.IndexOf($m, $idx)
      if ($idx -lt 0) { break }
      $ctxStart = [Math]::Max(0, $idx - 15)
      $ctx = $content.Substring($ctxStart, [Math]::Min(50, $content.Length - $ctxStart))
      Write-Host ("  ..." + $ctx.Replace("`n"," ").Replace("`r","") + "...")
      $idx += $m.Length
      $shown++
    }
  }
}