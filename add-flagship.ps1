$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# Anchor: the "Full Developer Profile" button - we inject flagship BEFORE it
$anchor = '                    <button type="button" onClick={() => { setSelectedProject(null); handleTabChange("Developer Health"); }}'

$flagshipSection = @"
                    {Array.isArray(selectedProject.developerFlagshipProjects) && selectedProject.developerFlagshipProjects.length > 0 && (
                      <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Flagship Projects by {selectedProject.developer || selectedProject.developerName}</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {selectedProject.developerFlagshipProjects.map((fp, idx) => (
                            <span key={idx} style={{ fontSize:11, padding:"5px 12px", borderRadius:16, background:"rgba(212,168,67,0.08)", color:T.gold, fontWeight:600, border:"1px solid rgba(212,168,67,0.2)" }}>{fp}</span>
                          ))}
                        </div>
                      </div>
                    )}
$ANCHOR$
"@
$flagshipSection = $flagshipSection.Replace('$ANCHOR$', $anchor)

if ($content.Contains($anchor)) {
  $content = $content.Replace($anchor, $flagshipSection)
  [System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
  Write-Host "Flagship section injected" -ForegroundColor Green
} else {
  Write-Host "Anchor not found" -ForegroundColor Red
}