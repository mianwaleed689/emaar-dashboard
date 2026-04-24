$path = "C:\Users\TAD\emaar-dashboard\src\tabs\LaunchCalendarTab.jsx"
$backup = $path + ".bak-modal-fix-v2"
Copy-Item $path $backup -Force

$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# The en-dash is 3 bytes in UTF-8: 0xE2 0x80 0x93
# In .NET string it's [char]0x2013
$endash = [char]0x2013  # this is a single char representing U+2013

# FIX 3: L1488 - {u.sizeMin.toLocaleString()} - {u.sizeMax.toLocaleString()}
$old3 = '{u.sizeMin.toLocaleString()} ' + $endash + ' {u.sizeMax.toLocaleString()}'
$new3 = '{u.sizeMin ? (u.sizeMin.toLocaleString() + " to " + (u.sizeMax || u.sizeMin).toLocaleString()) : "TBD"}'
$c3 = ([regex]::Matches($content, [regex]::Escape($old3))).Count
Write-Host "Fix 3 anchor matches: $c3"
if ($c3 -eq 1) {
  $content = $content.Replace($old3, $new3)
  Write-Host "Fix 3: sizeMin/sizeMax now null-safe" -ForegroundColor Green
} else {
  Write-Host "Fix 3 anchor not matched - aborting" -ForegroundColor Red
  exit 1
}

# FIX 4: L1489 - ${u.plotMin.toLocaleString()} - ${u.plotMax.toLocaleString()}
$old4 = '${u.plotMin.toLocaleString()} ' + $endash + ' ${u.plotMax.toLocaleString()}'
$new4 = '${u.plotMin.toLocaleString()} to ${(u.plotMax || u.plotMin).toLocaleString()}'
$c4 = ([regex]::Matches($content, [regex]::Escape($old4))).Count
Write-Host "Fix 4 anchor matches: $c4"
if ($c4 -eq 1) {
  $content = $content.Replace($old4, $new4)
  Write-Host "Fix 4: plotMax now null-safe" -ForegroundColor Green
} else {
  Write-Host "Fix 4 anchor not matched - aborting" -ForegroundColor Red
  exit 1
}

# FIX 5: L862 - the grid view uses {u.sizeMin}-{u.sizeMax} without toLocaleString
# Doesn't crash but can show "undefined-undefined" - guard it
$old5 = '{u.sizeMin}-{u.sizeMax}'
$new5 = '{u.sizeMin ? (u.sizeMin + "-" + (u.sizeMax || u.sizeMin)) : "TBD"}'
$c5 = ([regex]::Matches($content, [regex]::Escape($old5))).Count
Write-Host "Fix 5 anchor matches: $c5"
if ($c5 -ge 1) {
  $content = $content.Replace($old5, $new5)
  Write-Host "Fix 5: grid sizeMin guarded" -ForegroundColor Green
}

# FIX 6: L1490 - priceMin / priceMax toFixed - should be safe but check
# Actually priceMin always exists from our transform; skip

[System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))

Write-Host ""
Write-Host "MODAL CRASH FIX V2 DONE" -ForegroundColor Green