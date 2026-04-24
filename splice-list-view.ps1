$targetPath = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$blockPath = "C:\Users\TAD\emaar-dashboard\new-list-block.txt"

# Read both via .NET UTF-8
$targetBytes = [System.IO.File]::ReadAllBytes($targetPath)
$content = [System.Text.Encoding]::UTF8.GetString($targetBytes)
$origLen = $content.Length

$blockBytes = [System.IO.File]::ReadAllBytes($blockPath)
$newBlock = [System.Text.Encoding]::UTF8.GetString($blockBytes)

# Locate anchors
$anchorStart = "                {/* List */}"
$endAnchor = "                {/* Cross-tab nav */}"
$startIdx = $content.IndexOf($anchorStart)
$endIdx = $content.IndexOf($endAnchor, $startIdx)

if ($startIdx -lt 0) {
  Write-Host "ERROR: start anchor not found" -ForegroundColor Red
  exit 1
}
if ($endIdx -lt 0) {
  Write-Host "ERROR: end anchor not found" -ForegroundColor Red
  exit 1
}

Write-Host "Anchors found: start=$startIdx end=$endIdx"
Write-Host "Old block length: $($endIdx - $startIdx) chars"
Write-Host "New block length: $($newBlock.Length) chars"

# Splice
$newContent = $content.Substring(0, $startIdx) + $newBlock + $content.Substring($endIdx)

# Write back via .NET UTF-8 (no BOM)
$outBytes = [System.Text.Encoding]::UTF8.GetBytes($newContent)
[System.IO.File]::WriteAllBytes($targetPath, $outBytes)

Write-Host ""
Write-Host "Original file bytes: $($targetBytes.Length)"
Write-Host "New file bytes:      $($outBytes.Length)"
Write-Host "Delta:               $($outBytes.Length - $targetBytes.Length)"
Write-Host ""

# Sanity check: re-read, verify middle-dot still intact, verify new block present
$verifyBytes = [System.IO.File]::ReadAllBytes($targetPath)
$verifyContent = [System.Text.Encoding]::UTF8.GetString($verifyBytes)

$dotCount = ([regex]::Matches($verifyContent, [string][char]0x00B7)).Count
$mojibakeCount = ([regex]::Matches($verifyContent, "Â·")).Count
$hasNewBlock = $verifyContent.Contains('Build %')

Write-Host "VERIFY:"
Write-Host "  Middle-dot chars preserved: $dotCount"
Write-Host "  Mojibake patterns:          $mojibakeCount"
Write-Host "  New 'Build %' header:       $hasNewBlock"

if ($mojibakeCount -eq 0 -and $hasNewBlock) {
  Write-Host "SUCCESS - edit applied cleanly" -ForegroundColor Green
} else {
  Write-Host "FAILED - investigate" -ForegroundColor Red
}