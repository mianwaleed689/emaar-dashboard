$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# Anchor: before the flagship section we just added
$anchor = '                    {Array.isArray(selectedProject.developerFlagshipProjects) && selectedProject.developerFlagshipProjects.length > 0 && ('

$trackSection = @"
                    {selectedProject.developerTrackRecord && (
                      <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Track Record</div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:10 }}>
                          {selectedProject.developerTrackRecord.unitsDeliveredSince2002 != null && (
                            <div style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Units Delivered</div>
                              <div style={{ fontSize:20, fontWeight:800, color:T.white, fontFamily:"'Fraunces',serif" }}>{selectedProject.developerTrackRecord.unitsDeliveredSince2002.toLocaleString()}</div>
                              <div style={{ fontSize:9, color:T.textMuted, marginTop:2 }}>since 2002</div>
                            </div>
                          )}
                          {selectedProject.developerTrackRecord.unitsUnderDevelopment != null && (
                            <div style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Under Development</div>
                              <div style={{ fontSize:20, fontWeight:800, color:T.gold, fontFamily:"'Fraunces',serif" }}>{selectedProject.developerTrackRecord.unitsUnderDevelopment.toLocaleString()}</div>
                              <div style={{ fontSize:9, color:T.textMuted, marginTop:2 }}>in pipeline</div>
                            </div>
                          )}
                          {selectedProject.developerTrackRecord.projectsLaunched2025 != null && (
                            <div style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>2025 Launches</div>
                              <div style={{ fontSize:20, fontWeight:800, color:T.teal, fontFamily:"'Fraunces',serif" }}>{selectedProject.developerTrackRecord.projectsLaunched2025}</div>
                              <div style={{ fontSize:9, color:T.textMuted, marginTop:2 }}>new projects</div>
                            </div>
                          )}
                          {selectedProject.developerTrackRecord.masterCommunities != null && (
                            <div style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Master Communities</div>
                              <div style={{ fontSize:20, fontWeight:800, color:T.white, fontFamily:"'Fraunces',serif" }}>{selectedProject.developerTrackRecord.masterCommunities}</div>
                              <div style={{ fontSize:9, color:T.textMuted, marginTop:2 }}>master-planned</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
$ANCHOR$
"@
$trackSection = $trackSection.Replace('$ANCHOR$', $anchor)

if ($content.Contains($anchor)) {
  $content = $content.Replace($anchor, $trackSection)
  [System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
  Write-Host "Track record section injected" -ForegroundColor Green
} else {
  Write-Host "Anchor not found" -ForegroundColor Red
}