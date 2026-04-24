$target = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$blockFile = "C:\Users\TAD\emaar-dashboard\new-drive-array.txt"

$content = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($target))
$newArray = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($blockFile))

# Find the old array by its first distinctive line
$startMarker = '                        {[' + "`n" + '                          { label:"Downtown Dubai", val:selectedProject.distDowntownDubaiMin, unit:"min" },'
$endMarker = '                        ].map((d,i) => ('

if (-not $content.Contains('{ label:"Downtown Dubai", val:selectedProject.distDowntownDubaiMin, unit:"min" }')) {
  Write-Host "Old array not found - may already be patched or line endings differ" -ForegroundColor Yellow
} else {
  # Find the array start and end by scanning
  $startIdx = $content.IndexOf('                        {[' + "`n" + '                          { label:"Downtown Dubai"')
  if ($startIdx -lt 0) {
    # try CRLF
    $startIdx = $content.IndexOf('                        {[' + "`r`n" + '                          { label:"Downtown Dubai"')
  }

  if ($startIdx -lt 0) {
    Write-Host "Start not found" -ForegroundColor Red
    exit 1
  }

  $endIdx = $content.IndexOf('].map((d,i) => (', $startIdx)
  if ($endIdx -lt 0) {
    Write-Host "End not found" -ForegroundColor Red
    exit 1
  }
  # Move endIdx to include the full ].map((d,i) => ( line
  $endIdx = $endIdx + '].map((d,i) => ('.Length

  $oldBlock = $content.Substring($startIdx, $endIdx - $startIdx)
  Write-Host ("Replacing " + ($endIdx - $startIdx) + " chars with " + $newArray.Length + " chars")

  # New block has to end with the same map signature to keep JSX intact
  # new-drive-array.txt already includes the map line at the end
  $content = $content.Substring(0, $startIdx) + $newArray + $content.Substring($endIdx)

  [System.IO.File]::WriteAllBytes($target, [System.Text.Encoding]::UTF8.GetBytes($content))
  Write-Host "Array replaced" -ForegroundColor Green
}

# Now update the value render to prefer range over val
$oldVal = '>{d.val}<span'
$newVal = '>{d.range || d.val}<span'

if ($content.Contains($oldVal)) {
  $content = $content.Replace($oldVal, $newVal)
  [System.IO.File]::WriteAllBytes($target, [System.Text.Encoding]::UTF8.GetBytes($content))
  Write-Host "Value render updated" -ForegroundColor Green
} else {
  Write-Host "Value render not found - may already be updated" -ForegroundColor Yellow
}