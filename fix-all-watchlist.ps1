# ===== FIX 1: Star button in ProjectsTab.jsx =====
$p1 = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$content1 = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($p1))

$badStar = '{watchlist.some(w => w.id === p.id) ? "$" : "$"}'
$goodStar = '{watchlist.some(w => w.id === p.id) ? "' + [char]0x2605 + '" : "' + [char]0x2606 + '"}'

if ($content1.Contains($badStar)) {
  $content1 = $content1.Replace($badStar, $goodStar)
  [System.IO.File]::WriteAllBytes($p1, [System.Text.Encoding]::UTF8.GetBytes($content1))
  Write-Host "FIX 1: Star button restored" -ForegroundColor Green
} else {
  Write-Host "FIX 1: bad star pattern not found - investigating..." -ForegroundColor Yellow
  $idx = $content1.IndexOf('{watchlist.some(w => w.id === p.id) ?')
  if ($idx -gt 0) {
    Write-Host $content1.Substring($idx, 100)
  }
}

# ===== FIX 2: Watchlist storage uses priceMin, not price =====
$p2 = "C:\Users\TAD\emaar-dashboard\src\EmaarDashboardV2.jsx"
$content2 = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($p2))

$oldStorage = '{ id: project.id, name: project.name, community: project.community, price: project.price, addedAt: new Date().toISOString() }'
$newStorage = '{ id: project.id, name: project.name || project.project, community: project.community || project.area, priceMin: project.priceMin || project.price, grossYield: project.grossYield, addedAt: new Date().toISOString() }'

if ($content2.Contains($oldStorage)) {
  $content2 = $content2.Replace($oldStorage, $newStorage)
  Write-Host "FIX 2a: Watchlist storage updated to use priceMin" -ForegroundColor Green
} else {
  Write-Host "FIX 2a: storage pattern not found" -ForegroundColor Yellow
}

# ===== FIX 2b: Modal reads priceMin, renders formatted AED =====
# Find the modal line where it renders "AED " + w.price and fix it
# From the earlier diag: currentPrice = liveP?.price || w.price
$oldPriceLine = 'const currentPrice = liveP?.price || w.price;'
$newPriceLine = 'const currentPrice = liveP?.priceMin || liveP?.price || w.priceMin || w.price;'

if ($content2.Contains($oldPriceLine)) {
  $content2 = $content2.Replace($oldPriceLine, $newPriceLine)
  Write-Host "FIX 2b: Modal price-reading updated" -ForegroundColor Green
} else {
  Write-Host "FIX 2b: price line not found" -ForegroundColor Yellow
}

# ===== FIX 3: Additional em-dash mojibake left in EmaarDashboardV2.jsx =====
# The earlier fix missed some em-dash patterns - scan and fix
$moDash2 = [System.Text.Encoding]::UTF8.GetString([byte[]](0xC3,0xA2,0xE2,0x82,0xAC,0xE2,0x80,0x9C))
$countBefore = ([regex]::Matches($content2, [regex]::Escape($moDash2))).Count
if ($countBefore -gt 0) {
  $content2 = $content2.Replace($moDash2, [string][char]0x2014)
  Write-Host ("FIX 3: " + $countBefore + " em-dash mojibake instances fixed") -ForegroundColor Green
} else {
  Write-Host "FIX 3: no em-dash mojibake remaining" -ForegroundColor Gray
}

# Write back
[System.IO.File]::WriteAllBytes($p2, [System.Text.Encoding]::UTF8.GetBytes($content2))

Write-Host ""
Write-Host "All fixes applied. Run npm run build next." -ForegroundColor Cyan