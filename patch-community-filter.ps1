$file = "src\tabs\ProjectsTab.jsx"
$content = Get-Content $file -Raw

$old = @'
                          <select value={projCommunity} onChange={e => setProjCommunity(e.target.value)} style={{
                            width: "100%", padding: "10px 12px",
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid ${projCommunity !== "All" ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: 8,
                            color: projCommunity !== "All" ? T.gold : T.white,
                            fontSize: 13, fontWeight: projCommunity !== "All" ? 600 : 500,
                            fontFamily: "'Outfit',sans-serif", cursor: "pointer",
                          }}>
                            <option value="All">All Communities</option>
                            {commOptionsByTier.consumer.length > 0 && (
                              <optgroup label={`— Consumer Communities (${commOptionsByTier.consumer.length}) —`}>
                                {commOptionsByTier.consumer.map(c => (
                                  <option key={c.value} value={c.value}>
                                    {c.label}{c.projectCount > 0 ? ` · ${c.projectCount}` : ""}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {commOptionsByTier.master.length > 0 && (
                              <optgroup label={`— Master Communities (${commOptionsByTier.master.length}) —`}>
                                {commOptionsByTier.master.map(c => (
                                  <option key={c.value} value={c.value}>
                                    {c.label}{c.projectCount > 0 ? ` · ${c.projectCount}` : ""}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            {commOptionsByTier.sub.length > 0 && (
                              <optgroup label={`— Sub-Communities (${commOptionsByTier.sub.length}) —`}>
                                {commOptionsByTier.sub.map(c => {
                                  const cleaned = c.parentName
                                    ? c.label.replace(c.parentName + " - ", "").replace(c.parentName + " ", "").replace(c.parentName, "").replace(/^- /, "").replace(/^---+/, "").trim()
                                    : c.label;
                                  const display = c.parentName && cleaned && cleaned !== c.label
                                    ? `${c.parentName} → ${cleaned}`
                                    : c.label;
                                  return (
                                    <option key={c.value} value={c.value}>{display}</option>
                                  );
                                })}
                              </optgroup>
                            )}
                            {commOptionsByTier.other.length > 0 && (
                              <optgroup label={`— Other (${commOptionsByTier.other.length}) —`}>
                                {commOptionsByTier.other.map(c => (
                                  <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                              </optgroup>
                            )}
                          </select>
'@

$new = @'
                          <div style={{position:"relative"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid "+(projCommunity!=="All"?"rgba(212,168,67,0.4)":"rgba(255,255,255,0.08)"),borderRadius:8,cursor:"pointer"}}
                              onClick={()=>{setShowCommDrop(v=>!v);setCommSearch2("");}}>
                              <span style={{flex:1,fontSize:13,color:projCommunity!=="All"?T.gold:T.white,fontFamily:"'Outfit',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{projCommunity==="All"?"All Communities":projCommunity}</span>
                              {projCommunity!=="All"&&<button type="button" onClick={e=>{e.stopPropagation();setProjCommunity("All");setShowCommDrop(false);}} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14,padding:0}}>x</button>}
                              <span style={{color:"#94A3B8",fontSize:10}}>v</span>
                            </div>
                            {showCommDrop&&(
                              <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#1a1f2e",border:"1px solid rgba(212,168,67,0.3)",borderRadius:8,zIndex:100,maxHeight:280,display:"flex",flexDirection:"column",marginTop:2}}>
                                <div style={{padding:"8px 10px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                                  <input autoFocus value={commSearch2} onChange={e=>setCommSearch2(e.target.value)}
                                    placeholder="Search community..."
                                    style={{width:"100%",background:"none",border:"none",outline:"none",color:"#fff",fontSize:12,fontFamily:"'Outfit',sans-serif"}}/>
                                </div>
                                <div style={{overflowY:"auto",flex:1}}>
                                  {[{value:"All",label:"All Communities"},...(commOptionsByTier.consumer||[]),...(commOptionsByTier.master||[]),...(commOptionsByTier.sub||[]),...(commOptionsByTier.other||[])]
                                    .filter(c=>c.value==="All"||c.label.toLowerCase().includes(commSearch2.toLowerCase()))
                                    .slice(0,40)
                                    .map(c=>(
                                      <div key={c.value} onClick={()=>{setProjCommunity(c.value);setShowCommDrop(false);setCommSearch2("");}}
                                        style={{padding:"9px 12px",cursor:"pointer",fontSize:12,color:c.value===projCommunity?T.gold:"#CBD5E1",background:c.value===projCommunity?"rgba(212,168,67,0.08)":"transparent",fontFamily:"'Outfit',sans-serif"}}
                                        onMouseEnter={e=>e.currentTarget.style.background="rgba(212,168,67,0.06)"}
                                        onMouseLeave={e=>e.currentTarget.style.background=c.value===projCommunity?"rgba(212,168,67,0.08)":"transparent"}>
                                        {c.label}{c.projectCount>0?` · ${c.projectCount}`:""}
                                      </div>
                                    ))
                                  }
                                </div>
                              </div>
                            )}
                          </div>
'@

if ($content.Contains($old)) {
    $updated = $content.Replace($old, $new)
    Save-UTF8 $file $updated
    Write-Host "SUCCESS: Community filter upgraded to searchable dropdown"
} else {
    Write-Host "ERROR: Could not find the old select block - check line numbers"
}
