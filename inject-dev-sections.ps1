$path = "C:\Users\TAD\emaar-dashboard\src\tabs\ProjectsTab.jsx"
$bytes = [System.IO.File]::ReadAllBytes($path)
$content = [System.Text.Encoding]::UTF8.GetString($bytes)

# Anchor: the opening of the Construction & Delivery Data box in Developer tab
# We inject BEFORE this line so new sections appear between compliance cards and construction data
$anchor = '                    <div className="chart-box" style={{ padding:18, marginBottom:12 }}>' + "`n" + '                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Construction & Delivery Data</div>'

$newSections = @"
                    {/* Developer at a glance - only if rich data available */}
                    {selectedProject.developerFounded && (
                      <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Developer at a Glance</div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:12 }}>
                          {selectedProject.developerFounded && (
                            <div style={{ padding:"10px 14px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:3 }}>Founded</div>
                              <div style={{ fontSize:15, fontWeight:700, color:T.white, fontFamily:"'Fraunces',serif" }}>{selectedProject.developerFounded}</div>
                              {selectedProject.developerFoundedBy && <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>by {selectedProject.developerFoundedBy}</div>}
                            </div>
                          )}
                          {selectedProject.developerHeadquarters && (
                            <div style={{ padding:"10px 14px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:3 }}>Headquarters</div>
                              <div style={{ fontSize:13, fontWeight:700, color:T.white }}>{selectedProject.developerHeadquarters}</div>
                            </div>
                          )}
                          {selectedProject.developerChairman && (
                            <div style={{ padding:"10px 14px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:3 }}>Chairman</div>
                              <div style={{ fontSize:13, fontWeight:700, color:T.white }}>{selectedProject.developerChairman}</div>
                            </div>
                          )}
                          {selectedProject.developerReraOfficeNumber && (
                            <div style={{ padding:"10px 14px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:3 }}>RERA Office #</div>
                              <div style={{ fontSize:13, fontWeight:700, color:T.teal }}>{selectedProject.developerReraOfficeNumber}</div>
                            </div>
                          )}
                          {selectedProject.developerWebsite && (
                            <div style={{ padding:"10px 14px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:3 }}>Website</div>
                              <a href={selectedProject.developerWebsite} target="_blank" rel="noopener noreferrer" style={{ fontSize:12, fontWeight:700, color:T.gold, textDecoration:"none" }}>{selectedProject.developerWebsite.replace(/^https?:\/\//,'').replace(/\/$/,'')}</a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Financial Strength - only if developerFinancials present */}
                    {selectedProject.developerFinancials && (
                      <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                        <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:14 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:T.white }}>Financial Strength</div>
                          <div style={{ fontSize:10, color:T.textMuted }}>{selectedProject.developerFinancials.fiscalYear || "FY2025"}</div>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))", gap:10, marginBottom:12 }}>
                          {selectedProject.developerFinancials.revenue && (
                            <div style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, letterSpacing:0.5, textTransform:"uppercase" }}>Revenue</div>
                              <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.gold }}>AED {(selectedProject.developerFinancials.revenue/1000000000).toFixed(1)}B</div>
                              {selectedProject.developerFinancials.revenueGrowthYoY && <div style={{ fontSize:10, color:T.green, fontWeight:700, marginTop:2 }}>+{selectedProject.developerFinancials.revenueGrowthYoY}% YoY</div>}
                            </div>
                          )}
                          {selectedProject.developerFinancials.propertySales && (
                            <div style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, letterSpacing:0.5, textTransform:"uppercase" }}>Property Sales</div>
                              <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>AED {(selectedProject.developerFinancials.propertySales/1000000000).toFixed(1)}B</div>
                            </div>
                          )}
                          {selectedProject.developerFinancials.netProfitBeforeTax && (
                            <div style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, letterSpacing:0.5, textTransform:"uppercase" }}>Net Profit</div>
                              <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.teal }}>AED {(selectedProject.developerFinancials.netProfitBeforeTax/1000000000).toFixed(1)}B</div>
                            </div>
                          )}
                          {selectedProject.developerFinancials.revenueBacklog && (
                            <div style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, letterSpacing:0.5, textTransform:"uppercase" }}>Revenue Backlog</div>
                              <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>AED {(selectedProject.developerFinancials.revenueBacklog/1000000000).toFixed(0)}B</div>
                              <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>contracted future revenue</div>
                            </div>
                          )}
                          {selectedProject.developerFinancials.ebitda && (
                            <div style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, letterSpacing:0.5, textTransform:"uppercase" }}>EBITDA</div>
                              <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.textSecondary }}>AED {(selectedProject.developerFinancials.ebitda/1000000000).toFixed(1)}B</div>
                            </div>
                          )}
                          {selectedProject.developerFinancials.landBankSqFt && (
                            <div style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4, letterSpacing:0.5, textTransform:"uppercase" }}>Land Bank</div>
                              <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>{(selectedProject.developerFinancials.landBankSqFt/1000000).toFixed(0)}M sqft</div>
                            </div>
                          )}
                        </div>

                        {/* Stock ticker if listed */}
                        {selectedProject.developerStock && (
                          <div style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 14px", background:"rgba(20,184,166,0.04)", borderRadius:8, border:"1px solid rgba(20,184,166,0.15)", flexWrap:"wrap" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                              <span style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.5 }}>LISTED ON</span>
                              <span style={{ fontSize:12, fontWeight:700, color:T.teal }}>{selectedProject.developerStock.exchange}</span>
                            </div>
                            {selectedProject.developerStock.tickerParent && (
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <span style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.5 }}>TICKER</span>
                                <span style={{ fontSize:13, fontWeight:800, color:T.gold, fontFamily:"'Outfit',sans-serif", letterSpacing:0.5 }}>{selectedProject.developerStock.tickerParent}</span>
                              </div>
                            )}
                            {selectedProject.developerStock.marketCapAED && (
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <span style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.5 }}>MARKET CAP</span>
                                <span style={{ fontSize:13, fontWeight:800, color:T.white }}>AED {(selectedProject.developerStock.marketCapAED/1000000000).toFixed(0)}B</span>
                              </div>
                            )}
                            {selectedProject.developerStock.sharePrice && (
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <span style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.5 }}>PRICE</span>
                                <span style={{ fontSize:13, fontWeight:800, color:T.white }}>AED {selectedProject.developerStock.sharePrice}</span>
                              </div>
                            )}
                            {selectedProject.developerStock.dividendYield && (
                              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                <span style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.5 }}>DIV YIELD</span>
                                <span style={{ fontSize:13, fontWeight:800, color:T.green }}>{selectedProject.developerStock.dividendYield}%</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Track Record */}
                    {selectedProject.developerTrackRecord && (
                      <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Track Record</div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:10 }}>
                          {selectedProject.developerTrackRecord.unitsDeliveredSince2002 && (
                            <div style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Units Delivered</div>
                              <div style={{ fontSize:18, fontWeight:800, color:T.white, fontFamily:"'Fraunces',serif" }}>{selectedProject.developerTrackRecord.unitsDeliveredSince2002.toLocaleString()}</div>
                              <div style={{ fontSize:9, color:T.textMuted }}>since 2002</div>
                            </div>
                          )}
                          {selectedProject.developerTrackRecord.unitsUnderDevelopment && (
                            <div style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Under Development</div>
                              <div style={{ fontSize:18, fontWeight:800, color:T.gold, fontFamily:"'Fraunces',serif" }}>{selectedProject.developerTrackRecord.unitsUnderDevelopment.toLocaleString()}</div>
                              <div style={{ fontSize:9, color:T.textMuted }}>in pipeline</div>
                            </div>
                          )}
                          {selectedProject.developerTrackRecord.projectsLaunched2025 && (
                            <div style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>2025 Launches</div>
                              <div style={{ fontSize:18, fontWeight:800, color:T.teal, fontFamily:"'Fraunces',serif" }}>{selectedProject.developerTrackRecord.projectsLaunched2025}</div>
                              <div style={{ fontSize:9, color:T.textMuted }}>new projects</div>
                            </div>
                          )}
                          {selectedProject.developerTrackRecord.masterCommunities && (
                            <div style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Master Communities</div>
                              <div style={{ fontSize:18, fontWeight:800, color:T.white, fontFamily:"'Fraunces',serif" }}>{selectedProject.developerTrackRecord.masterCommunities}</div>
                              <div style={{ fontSize:9, color:T.textMuted }}>master-planned</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Flagship Projects */}
                    {Array.isArray(selectedProject.developerFlagshipProjects) && selectedProject.developerFlagshipProjects.length > 0 && (
                      <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Flagship Projects</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {selectedProject.developerFlagshipProjects.map((fp, i) => (
                            <span key={i} style={{ fontSize:11, padding:"5px 12px", borderRadius:16, background:"rgba(212,168,67,0.08)", color:T.gold, fontWeight:600, border:"1px solid rgba(212,168,67,0.2)" }}>{fp}</span>
                          ))}
                        </div>
                      </div>
                    )}

$ANCHOR_PRESERVED$
"@

# Replace $ANCHOR_PRESERVED$ with the original anchor (to keep it after our insertion)
$newSections = $newSections.Replace('$ANCHOR_PRESERVED$', $anchor)

if ($content.Contains($anchor)) {
  $content = $content.Replace($anchor, $newSections)
  [System.IO.File]::WriteAllBytes($path, [System.Text.Encoding]::UTF8.GetBytes($content))
  Write-Host "Developer tab upgraded with 4 new sections" -ForegroundColor Green
} else {
  Write-Host "Anchor not found - check Construction & Delivery line" -ForegroundColor Red
}