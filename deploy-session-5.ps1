# DXB Analytics - Session 5 Deploy
# Ships:
#   1. EmaarDashboardV2.jsx: add liveDevelopments prop to LaunchCalendarTab (1-line)
#   2. LaunchCalendarTab.jsx: tiered display (Verified + DLD Registry for early-stage projects)

$ErrorActionPreference = "Stop"
$emaar = "src\EmaarDashboardV2.jsx"
$lcTab = "src\tabs\LaunchCalendarTab.jsx"
$lcSource = "LaunchCalendarTab.jsx"

Write-Host "=== DXB Analytics - Session 5 Deploy (Launch Calendar Tab) ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path "package.json")) { Write-Host "FATAL: Not in emaar-dashboard folder." -ForegroundColor Red; exit 1 }
if (-not (Test-Path $lcSource)) {
    Write-Host "FATAL: $lcSource not in current folder." -ForegroundColor Red
    Write-Host '  Move-Item "$HOME\Downloads\LaunchCalendarTab.jsx" . -Force' -ForegroundColor Gray
    exit 1
}
if (-not (Test-Path $lcTab)) { Write-Host "FATAL: $lcTab not found." -ForegroundColor Red; exit 1 }
if (-not (Test-Path $emaar)) { Write-Host "FATAL: $emaar not found." -ForegroundColor Red; exit 1 }

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

# === PART 1: Patch EmaarDashboardV2.jsx ===
Write-Host "Part 1: Patching EmaarDashboardV2.jsx..." -ForegroundColor Cyan
$content = [System.IO.File]::ReadAllText($emaar)
$origLen = $content.Length

if ($content -match "liveLaunches=\{liveLaunches\}[\r\n\s]+liveDevelopments=\{liveDevelopments\}") {
    Write-Host "  SKIP: LaunchCalendarTab already has liveDevelopments prop." -ForegroundColor Yellow
} else {
    $content = $content -replace "`r`n", "`n"
    $a = @'
              liveLaunches={liveLaunches}
              globalFilters={_gf}
'@
    $r = @'
              liveLaunches={liveLaunches}
              liveDevelopments={liveDevelopments}
              globalFilters={_gf}
'@
    $an = $a -replace "`r`n", "`n"
    $rn = $r -replace "`r`n", "`n"
    if (-not $content.Contains($an)) {
        Write-Host "  ERROR: LaunchCalendarTab prop anchor not found." -ForegroundColor Red
        exit 1
    }
    $content = $content.Replace($an, $rn)
    $content = $content -replace "`n", "`r`n"
    [System.IO.File]::WriteAllText($emaar, $content, $utf8NoBom)

    $verify = [System.IO.File]::ReadAllText($emaar)
    if (-not ($verify -match "liveLaunches=\{liveLaunches\}[\s\S]{0,100}liveDevelopments=\{liveDevelopments\}")) {
        Write-Host "  FAIL: Verification failed." -ForegroundColor Red
        exit 1
    }
    Write-Host ("  EmaarDashboardV2.jsx: " + $origLen + " -> " + $verify.Length + " bytes") -ForegroundColor Gray
    Write-Host "  OK: liveDevelopments prop added" -ForegroundColor Green
}
Write-Host ""

# === PART 2: Verify + deploy LaunchCalendarTab.jsx ===
Write-Host "Part 2: Verifying new LaunchCalendarTab.jsx..." -ForegroundColor Cyan
$newTab = [System.IO.File]::ReadAllText($lcSource)
$checks = @(
    @{n="liveDevelopments prop";   ok=$newTab.Contains("liveDevelopments = []")}
    @{n="Tier filter state";       ok=$newTab.Contains("tierFilter")}
    @{n="Registry card branch";    ok=$newTab.Contains('p.tier === "dld-registry"')}
    @{n="DLD Registry modal";      ok=$newTab.Contains("DLD Registry Record")}
    @{n="Lifecycle stage filter";  ok=$newTab.Contains("lifecycleStage")}
    @{n="Inferred handover";       ok=$newTab.Contains("2029+")}
)
$allOk = $true
foreach ($c in $checks) {
    if ($c.ok) { Write-Host ("  OK  " + $c.n) -ForegroundColor Green }
    else { Write-Host ("  FAIL " + $c.n) -ForegroundColor Red; $allOk = $false }
}
if (-not $allOk) { exit 1 }
Write-Host ("  Size: " + $newTab.Length + " bytes") -ForegroundColor Gray
Write-Host ""

Write-Host "Deploying LaunchCalendarTab.jsx..." -ForegroundColor Cyan
$backup = $lcTab + ".backup-session5"
$oldTab = [System.IO.File]::ReadAllText($lcTab)
[System.IO.File]::WriteAllText($backup, $oldTab, $utf8NoBom)
Write-Host ("  Backup: " + $backup) -ForegroundColor Gray
[System.IO.File]::WriteAllText($lcTab, $newTab, $utf8NoBom)
[System.IO.File]::Delete("$PWD\$lcSource")
Write-Host "  Deployed." -ForegroundColor Green
Write-Host ""

Write-Host "=== Deploy complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next:" -ForegroundColor Yellow
Write-Host "  npm run build" -ForegroundColor Gray
Write-Host "  git add src/EmaarDashboardV2.jsx src/tabs/LaunchCalendarTab.jsx" -ForegroundColor Gray
Write-Host "  git commit -m 'session 5: Launch Calendar tiered display (Verified + DLD Registry)'" -ForegroundColor Gray
Write-Host "  git push" -ForegroundColor Gray
Write-Host ""
Write-Host "Restore if needed:" -ForegroundColor Yellow
Write-Host ("  [System.IO.File]::Copy('" + $backup + "','" + $lcTab + "',`$true)") -ForegroundColor Gray
