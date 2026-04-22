# DXB Analytics - Session 4 Deploy
# Ships:
#   1. EmaarDashboardV2.jsx: add liveDevelopments prop to HandoverTab (1-line)
#   2. HandoverTab.jsx: tiered display (Verified + DLD Registry cards)
# ASCII only, uses [System.IO.File]

$ErrorActionPreference = "Stop"
$emaar = "src\EmaarDashboardV2.jsx"
$handoverTab = "src\tabs\HandoverTab.jsx"
$handoverSource = "HandoverTab.jsx"

Write-Host "=== DXB Analytics - Session 4 Deploy (Handover Tab) ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "package.json")) {
    Write-Host "FATAL: Not in emaar-dashboard folder." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $handoverSource)) {
    Write-Host "FATAL: $handoverSource not in current folder." -ForegroundColor Red
    Write-Host '  Move-Item "$HOME\Downloads\HandoverTab.jsx" . -Force' -ForegroundColor Gray
    exit 1
}
if (-not (Test-Path $handoverTab)) {
    Write-Host "FATAL: $handoverTab not found." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $emaar)) {
    Write-Host "FATAL: $emaar not found." -ForegroundColor Red
    exit 1
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# === PART 1: Patch EmaarDashboardV2.jsx ===
Write-Host "Part 1: Patching EmaarDashboardV2.jsx..." -ForegroundColor Cyan
$content = [System.IO.File]::ReadAllText($emaar)
$origLen = $content.Length

if ($content.Contains("liveDevelopments={liveDevelopments}`r`n              globalFilters") -or
    $content -match "liveDevelopments=\{liveDevelopments\}[\r\n\s]+globalFilters") {
    Write-Host "  SKIP: HandoverTab already has liveDevelopments prop." -ForegroundColor Yellow
} else {
    $content = $content -replace "`r`n", "`n"
    $a = @'
            <HandoverTab
              liveHandover={liveHandover}
              globalFilters={_gf}
'@
    $r = @'
            <HandoverTab
              liveHandover={liveHandover}
              liveDevelopments={liveDevelopments}
              globalFilters={_gf}
'@
    $an = $a -replace "`r`n", "`n"
    $rn = $r -replace "`r`n", "`n"
    if (-not $content.Contains($an)) {
        Write-Host "  ERROR: HandoverTab prop anchor not found." -ForegroundColor Red
        exit 1
    }
    $content = $content.Replace($an, $rn)
    $content = $content -replace "`n", "`r`n"
    [System.IO.File]::WriteAllText($emaar, $content, $utf8NoBom)

    $verify = [System.IO.File]::ReadAllText($emaar)
    if (-not ($verify -match "HandoverTab[\s\S]{0,200}liveDevelopments=\{liveDevelopments\}")) {
        Write-Host "  FAIL: Verification failed." -ForegroundColor Red
        exit 1
    }
    Write-Host ("  EmaarDashboardV2.jsx: " + $origLen + " -> " + $verify.Length + " bytes") -ForegroundColor Gray
    Write-Host "  OK: liveDevelopments prop added" -ForegroundColor Green
}
Write-Host ""

# === PART 2: Verify + deploy HandoverTab.jsx ===
Write-Host "Part 2: Verifying new HandoverTab.jsx..." -ForegroundColor Cyan
$newTab = [System.IO.File]::ReadAllText($handoverSource)
$checks = @(
    @{n="liveDevelopments prop";   ok=$newTab.Contains("liveDevelopments = []")}
    @{n="Tier filter state";       ok=$newTab.Contains("tierFilter")}
    @{n="Show historical toggle";  ok=$newTab.Contains("showHistorical")}
    @{n="Registry card branch";    ok=$newTab.Contains('p.tier === "dld-registry" ?')}
    @{n="DLD Registry modal";      ok=$newTab.Contains("DLD Registry Record")}
    @{n="Lifecycle stage";         ok=$newTab.Contains("lifecycleStage")}
    @{n="Risk matrix filter";      ok=$newTab.Contains('filtered.filter(p => p.tier !== "dld-registry")')}
)
$allOk = $true
foreach ($c in $checks) {
    if ($c.ok) { Write-Host ("  OK  " + $c.n) -ForegroundColor Green }
    else { Write-Host ("  FAIL " + $c.n) -ForegroundColor Red; $allOk = $false }
}
if (-not $allOk) { exit 1 }
Write-Host ("  Size: " + $newTab.Length + " bytes") -ForegroundColor Gray
Write-Host ""

Write-Host "Deploying HandoverTab.jsx..." -ForegroundColor Cyan
$backup = $handoverTab + ".backup-session4"
$oldTab = [System.IO.File]::ReadAllText($handoverTab)
[System.IO.File]::WriteAllText($backup, $oldTab, $utf8NoBom)
Write-Host ("  Backup: " + $backup) -ForegroundColor Gray
[System.IO.File]::WriteAllText($handoverTab, $newTab, $utf8NoBom)
[System.IO.File]::Delete("$PWD\$handoverSource")
Write-Host "  Deployed." -ForegroundColor Green
Write-Host ""

Write-Host "=== Deploy complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next:" -ForegroundColor Yellow
Write-Host "  npm run build" -ForegroundColor Gray
Write-Host "  git add src/EmaarDashboardV2.jsx src/tabs/HandoverTab.jsx" -ForegroundColor Gray
Write-Host "  git commit -m 'session 4: Handover tab tiered display (Verified + DLD Registry)'" -ForegroundColor Gray
Write-Host "  git push" -ForegroundColor Gray
Write-Host ""
Write-Host "Restore if needed:" -ForegroundColor Yellow
Write-Host ("  [System.IO.File]::Copy('" + $backup + "','" + $handoverTab + "',`$true)") -ForegroundColor Gray
