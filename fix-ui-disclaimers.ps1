$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)
$changes = 0

# FIX 1: Report tab - RERA line -> DLD Project label
$old1 = '<div><strong style={{ color:T.white }}>RERA #:</strong> {selectedProject.reraNo || selectedProject.projectNumber || "Pending"}</div>'
$new1 = '<div><strong style={{ color:T.white }}>DLD Project #:</strong> {selectedProject.reraNo || selectedProject.projectNumber || "Pending"}</div>'
if ($content.Contains($old1)) {
  $content = $content.Replace($old1, $new1)
  $changes++
  Write-Host "Fix 1 applied: Report RERA -> DLD Project" -ForegroundColor Green
}

# FIX 2: Rental tab - Gross Yield with (est.) suffix when flagged
$old2 = '>{selectedProject.grossYield ? selectedProject.grossYield.toFixed(1) + "%" : '
$new2 = '>{selectedProject.grossYield ? (selectedProject.grossYield.toFixed(1) + "%" + (selectedProject.grossYieldIsEstimate ? " (est.)" : "")) : '
if ($content.Contains($old2)) {
  $content = $content.Replace($old2, $new2)
  $changes++
  Write-Host "Fix 2 applied: Gross Yield (est.) suffix" -ForegroundColor Green
}

# FIX 3: Location - distMall, distSchool, distHospital with "inside community" labels
# Replace array entries to include label override when distance is 0
$old3a = '{ label:"Nearest Mall", val:selectedProject.distMall, code:"mall" },'
$new3a = '{ label:"Nearest Mall", val:selectedProject.distMall, code:"mall", insideLabel:selectedProject.distMallLabel },'
if ($content.Contains($old3a)) {
  $content = $content.Replace($old3a, $new3a)
  $changes++
  Write-Host "Fix 3a applied: Mall insideLabel" -ForegroundColor Green
}
$old3b = '{ label:"School", val:selectedProject.distSchool, code:"school" },'
$new3b = '{ label:"School", val:selectedProject.distSchool, code:"school", insideLabel:selectedProject.distSchoolLabel },'
if ($content.Contains($old3b)) {
  $content = $content.Replace($old3b, $new3b)
  $changes++
  Write-Host "Fix 3b applied: School insideLabel" -ForegroundColor Green
}
$old3c = '{ label:"Hospital", val:selectedProject.distHospital, code:"hospital" },'
$new3c = '{ label:"Hospital", val:selectedProject.distHospital, code:"hospital", insideLabel:selectedProject.distHospitalLabel },'
if ($content.Contains($old3c)) {
  $content = $content.Replace($old3c, $new3c)
  $changes++
  Write-Host "Fix 3c applied: Hospital insideLabel" -ForegroundColor Green
}

# FIX 4: Identity constructionPct - add "(est.)" when it is an estimate
$old4 = '{selectedProject.constructionPct != null ? selectedProject.constructionPct + "% complete" : "Not disclosed"}'
$new4 = '{selectedProject.constructionPct != null ? (selectedProject.constructionPct + "% complete" + (selectedProject.constructionPctIsEstimate ? " (est.)" : "")) : "Not disclosed"}'
if ($content.Contains($old4)) {
  $content = $content.Replace($old4, $new4)
  $changes++
  Write-Host "Fix 4 applied: Identity construction (est.)" -ForegroundColor Green
}

# FIX 5: Report tab - Build Progress with (est.) flag
$old5 = '<div><strong style={{ color:T.white }}>Build Progress:</strong> {selectedProject.constructionPct != null ? selectedProject.constructionPct + "%" : '
$new5 = '<div><strong style={{ color:T.white }}>Build Progress:</strong> {selectedProject.constructionPct != null ? (selectedProject.constructionPct + "%" + (selectedProject.constructionPctIsEstimate ? " (est.)" : "")) : '
if ($content.Contains($old5)) {
  $content = $content.Replace($old5, $new5)
  $changes++
  Write-Host "Fix 5 applied: Report Build Progress (est.)" -ForegroundColor Green
}

$outBytes = [System.Text.Encoding]::UTF8.GetBytes($content)
[System.IO.File]::WriteAllBytes($path, $outBytes)
Write-Host ""
Write-Host ("Total changes: " + $changes) -ForegroundColor Cyan