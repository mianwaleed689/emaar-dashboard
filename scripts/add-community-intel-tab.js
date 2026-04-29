const fs = require("fs");
let src = fs.readFileSync("src/tabs/ProjectsTab.jsx", "latin1");

// 1. Add liveNeighbourhoods to component signature
src = src.replace(
  `  watchlist = [],`,
  `  watchlist = [],
  liveNeighbourhoods = [],`
);

// 2. Add community lookup helper after component signature opens
const HELPER = `
// Community intelligence lookup
const communityMap = React.useMemo(() => {
  const map = {};
  (liveNeighbourhoods||[]).forEach(n => {
    if(n.community) map[n.community.toLowerCase()] = n;
  });
  return map;
}, [liveNeighbourhoods]);

const getCommunityData = (project) => {
  const key = (project.community||"").toLowerCase();
  return communityMap[key] || null;
};
`;

src = src.replace(
  `  const MODES = [`,
  HELPER + `  const MODES = [`
);

// 3. Add Community tab to detail tabs array
src = src.replace(
  `{key:"report",label:"Full Report"},`,
  `{key:"community",label:"Community Intel"},
                  {key:"report",label:"Full Report"},`
);

// 4. Add community intel tab content before report tab
const COMMUNITY_TAB = `
              {projDetailTab === "community" && (() => {
                const cn = getCommunityData(selectedProject);
                const fmtD = n => n!=null ? parseFloat(n).toFixed(1)+" km" : "No data";
                const fmtY = n => n ? parseFloat(n).toFixed(1)+"%" : "No data";
                const fmtP = n => n ? "AED "+Math.round(n).toLocaleString() : "No data";
                return (
                  <div style={{padding:"20px 24px"}}>
                    {cn ? (
                      <div>
                        {/* Community Header */}
                        <div style={{background:"rgba(212,168,67,0.06)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:12,padding:"16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>COMMUNITY INTELLIGENCE</div>
                            <div style={{fontSize:18,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif"}}>{cn.community}</div>
                            <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>
                              {cn.tier==="verified"?"Verified Data":cn.tier==="area-data"?"Area Data":"DLD Registry"}
                              {cn.dldTransactions?" · "+cn.dldTransactions.toLocaleString()+" DLD transactions":""}
                            </div>
                          </div>
                          <div style={{textAlign:"center"}}>
                            <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(212,168,67,0.12)",border:"2px solid "+T.gold,display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <span style={{fontSize:16,fontWeight:800,color:T.gold,fontFamily:"'Fraunces',serif"}}>{cn.investmentScore||"—"}</span>
                            </div>
                            <div style={{fontSize:9,color:T.textMuted,marginTop:4}}>SCORE</div>
                          </div>
                        </div>

                        {/* Investment Metrics */}
                        <div style={{fontSize:11,fontWeight:700,color:T.textMuted,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Investment Metrics</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
                          {[
                            {label:"Gross Yield",    value:fmtY(cn.grossYield),     color:"#10B981"},
                            {label:"Net Yield",      value:fmtY(cn.netYield),       color:T.textSecondary},
                            {label:"Avg PPSF",       value:fmtP(cn.avgPpsf),        color:T.gold},
                            {label:"Service Charge", value:cn.serviceCharge?"AED "+cn.serviceCharge+"/sqft":"No data", color:T.textMuted},
                            {label:"Supply Risk",    value:cn.supplyRisk||"Unknown", color:cn.supplyRisk==="Low"?"#10B981":cn.supplyRisk==="High"?"#EF4444":"#F59E0B"},
                            {label:"Liquidity",      value:cn.liquidity||"Unknown",  color:cn.liquidity==="Very High"||cn.liquidity==="High"?"#10B981":"#F59E0B"},
                          ].map((m,i)=>(
                            <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"10px 12px"}}>
                              <div style={{fontSize:9,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.7,marginBottom:3}}>{m.label}</div>
                              <div style={{fontSize:14,fontWeight:700,color:m.color,fontFamily:"'Fraunces',serif"}}>{m.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Nearby Facilities */}
                        <div style={{fontSize:11,fontWeight:700,color:T.textMuted,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Nearby Facilities</div>
                        <div style={{display:"flex",flexDirection:"column",gap:1,marginBottom:16}}>
                          {[
                            {label:"Metro",       name:cn.nearestMetro,       dist:cn.distMetro,    color:"#10B981"},
                            {label:"School",      name:cn.nearestSchool,      dist:cn.distSchool,   color:"#8B5CF6"},
                            {label:"Hospital",    name:cn.nearestHospital,    dist:cn.distHospital, color:"#EF4444"},
                            {label:"Mall",        name:cn.nearestMall,        dist:cn.distMall,     color:T.gold},
                            {label:"Beach",       name:cn.nearestBeach,       dist:cn.distBeach,    color:"#06B6D4"},
                            {label:"Supermarket", name:cn.nearestSupermarket, dist:cn.distSupermarket, color:"#10B981"},
                          ].map((f,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+T.border+"20"}}>
                              <div>
                                <span style={{fontSize:10,fontWeight:600,color:T.textMuted,width:80,display:"inline-block"}}>{f.label}</span>
                                <span style={{fontSize:11,color:T.white}}>{f.name||"No data"}</span>
                              </div>
                              <span style={{fontSize:12,fontWeight:700,color:f.dist?f.color:T.textMuted}}>{fmtD(f.dist)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Landmarks */}
                        {cn.landmarks&&(
                          <div style={{marginBottom:16}}>
                            <div style={{fontSize:11,fontWeight:700,color:T.textMuted,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Key Distances</div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                              {[
                                {key:"dubaiMall",      label:"Dubai Mall"},
                                {key:"dxbAirport",     label:"DXB Airport"},
                                {key:"mallOfEmirates", label:"Mall of Emirates"},
                                {key:"burjKhalifa",    label:"Burj Khalifa"},
                              ].map(lm=>(
                                cn.landmarks[lm.key]&&(
                                  <div key={lm.key} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"8px 10px",display:"flex",justifyContent:"space-between"}}>
                                    <span style={{fontSize:10,color:T.textMuted}}>{lm.label}</span>
                                    <div style={{textAlign:"right"}}>
                                      <div style={{fontSize:11,fontWeight:700,color:T.gold}}>{cn.landmarks[lm.key].distKm} km</div>
                                      <div style={{fontSize:9,color:T.textMuted}}>{cn.landmarks[lm.key].duration} min</div>
                                    </div>
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        )}

                        {/* View Full Community */}
                        <button type="button" onClick={()=>handleTabChange("Neighbourhoods")}
                          style={{width:"100%",padding:"12px",borderRadius:10,border:"1px solid "+T.gold,background:"rgba(212,168,67,0.08)",color:T.gold,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                          View Full Community Profile
                        </button>
                      </div>
                    ) : (
                      <div style={{textAlign:"center",padding:"40px 20px"}}>
                        <div style={{fontSize:32,marginBottom:12}}>?</div>
                        <div style={{fontSize:14,fontWeight:600,color:T.white,marginBottom:6}}>No community data</div>
                        <div style={{fontSize:12,color:T.textMuted}}>Community "{selectedProject?.community}" not found in neighbourhood database</div>
                      </div>
                    )}
                  </div>
                );
              })()}
`;

// Insert before report tab
src = src.replace(
  `{projDetailTab === "report" && (`,
  COMMUNITY_TAB + `{projDetailTab === "report" && (`
);

fs.writeFileSync("src/tabs/ProjectsTab.jsx", src, "latin1");
console.log("Done. Lines:", src.split("\n").length);
console.log("Has community tab:", src.includes('"community",label:"Community Intel"'));
console.log("Has getCommunityData:", src.includes("getCommunityData"));