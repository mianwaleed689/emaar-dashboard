$targetPath = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$blockPath  = "C:\Users\TAD\emaar-dashboard\new-mapping-block.txt"

# Backup
$backup = $targetPath + ".bak-commit1"
Copy-Item $targetPath $backup -Force
Write-Host "Backup: $backup" -ForegroundColor Gray

# Read both files as UTF-8 bytes
$targetContent = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($targetPath))
$newBlock      = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($blockPath))
$origLen = $targetContent.Length

# Anchor: the exact closing of the MODES array
$anchor = '  { key:"Warehouse" }, { key:"Land" },' + "`n" + "];"

if (-not $targetContent.Contains($anchor)) {
  Write-Host "ANCHOR NOT FOUND - file not modified" -ForegroundColor Red
  exit 1
}

# Append block AFTER anchor
$replacement = $anchor + $newBlock
$targetContent = $targetContent.Replace($anchor, $replacement)

# Verify no entity leak after splice
$ampCheck = ([regex]::Matches($targetContent, 'F&amp;B')).Count
$litCheck = ([regex]::Matches($targetContent, 'F&B')).Count
if ($ampCheck -gt 0) {
  Write-Host "WARNING: F&amp;B entity leaked - aborting" -ForegroundColor Red
  exit 1
}

# Verify our new symbols are in there
$hasCategory = $targetContent.Contains("CATEGORY_TO_DISPLAY")
$hasDisplay  = $targetContent.Contains("DISPLAY_TO_INTERNAL")
$hasUnit     = $targetContent.Contains("UNIT_BASED_RESIDENTIAL")

if (-not ($hasCategory -and $hasDisplay -and $hasUnit)) {
  Write-Host "Mapping constants not present after splice - aborting" -ForegroundColor Red
  exit 1
}

# Write file
[System.IO.File]::WriteAllBytes($targetPath, [System.Text.Encoding]::UTF8.GetBytes($targetContent))

$newLen = $targetContent.Length
Write-Host ""
Write-Host "SPLICE COMPLETE" -ForegroundColor Green
Write-Host "Original: $origLen chars"
Write-Host "New:      $newLen chars"
Write-Host "Delta:    $($newLen - $origLen) chars added"
Write-Host ""
Write-Host "F&B literal count:  $litCheck"
Write-Host "F&amp;B entity:      $ampCheck"
Write-Host "CATEGORY_TO_DISPLAY: present"
Write-Host "DISPLAY_TO_INTERNAL: present"
Write-Host "UNIT_BASED_RESIDENTIAL: present"