const fs = require("fs");
let src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");

// Add search states for developer and community filters
src = src.replace(
  `  /* Phase 2.4 Batch 2: derive which communities match the global filter state.`,
  `  const [devSearch, setDevSearch] = React.useState("");
  const [commSearch2, setCommSearch2] = React.useState("");
  const [showDevDrop, setShowDevDrop] = React.useState(false);
  const [showCommDrop, setShowCommDrop] = React.useState(false);

  /* Phase 2.4 Batch 2: derive which communities match the global filter state.`
);

// Replace developer select with searchable input
const OLD_DEV_SELECT = `<select value={projDev} onChange={e => setProjDev(e.target.value)} style={{
                            width: "100%", padding: "10px 12px",
                            background: "rgba(255,255,255,0.04)",
                            border: \`1px solid \${projDev !== "All" ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.08)"}\`,
                            borderRadius: 8,
                            color: projDev !== "All" ? T.gold : T.white,
                            fontSize: 13, fontWeight: projDev !== "All" ? 600 : 500,
                            fontFamily: "'Outfit',sans-serif", cursor: "pointer",
                          }}>
                            {(devOptions || ["All"]).map(d => (
                              <option key={d} value={d}>{d === "All" ? "All Developers" : d}</option>
                            ))}
                          </select>`;

const NEW_DEV_SELECT = `<div style={{position:"relative"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid "+(projDev!=="All"?"rgba(212,168,67,0.4)":"rgba(255,255,255,0.08)"),borderRadius:8,cursor:"pointer"}}
                              onClick={()=>{setShowDevDrop(v=>!v);setDevSearch("");}}>
                              <span style={{flex:1,fontSize:13,color:projDev!=="All"?T.gold:T.white,fontFamily:"'Outfit',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{projDev==="All"?"All Developers":projDev}</span>
                              {projDev!=="All"&&<button type="button" onClick={e=>{e.stopPropagation();setProjDev("All");setShowDevDrop(false);}} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14,padding:0}}>x</button>}
                              <span style={{color:"#94A3B8",fontSize:10}}>v</span>
                            </div>
                            {showDevDrop&&(
                              <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#1a1f2e",border:"1px solid rgba(212,168,67,0.3)",borderRadius:8,zIndex:100,maxHeight:280,display:"flex",flexDirection:"column",marginTop:2}}>
                                <div style={{padding:"8px 10px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                                  <input autoFocus value={devSearch} onChange={e=>setDevSearch(e.target.value)}
                                    placeholder="Search developer..."
                                    style={{width:"100%",background:"none",border:"none",outline:"none",color:"#fff",fontSize:12,fontFamily:"'Outfit',sans-serif"}}/>
                                </div>
                                <div style={{overflowY:"auto",flex:1}}>
                                  {(devOptions||["All"]).filter(d=>d==="All"||d.toLowerCase().includes(devSearch.toLowerCase())).slice(0,30).map(d=>(
                                    <div key={d} onClick={()=>{setProjDev(d);setShowDevDrop(false);setDevSearch("");}}
                                      style={{padding:"9px 12px",cursor:"pointer",fontSize:12,color:d===projDev?T.gold:"#CBD5E1",background:d===projDev?"rgba(212,168,67,0.08)":"transparent",fontFamily:"'Outfit',sans-serif"}}
                                      onMouseEnter={e=>e.currentTarget.style.background="rgba(212,168,67,0.06)"}
                                      onMouseLeave={e=>e.currentTarget.style.background=d===projDev?"rgba(212,168,67,0.08)":"transparent"}
                                    >{d==="All"?"All Developers":d}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>`;

src = src.replace(OLD_DEV_SELECT, NEW_DEV_SELECT);
console.log("Dev select replaced:", !src.includes(OLD_DEV_SELECT));

// Find community select
const lines = src.split("\n");
let commSelectStart = -1;
lines.forEach((l,i)=>{
  if(l.includes("projCommunity")&&l.includes("select")&&commSelectStart===-1) commSelectStart = i;
});
console.log("Community select at line:", commSelectStart+1);

fs.writeFileSync("src/tabs/ProjectsTab.jsx", src, "latin1");