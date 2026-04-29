const fs = require("fs");
let src = fs.readFileSync("src/tabs/ProjectsTab.jsx", "latin1");

// Add community yield badge next to community name on project card
src = src.replace(
  `<div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>{p.community || p.area}</div>`,
  `<div style={{ fontSize:10, color:T.textMuted, marginTop:2, display:"flex", alignItems:"center", gap:6 }}>
                  <span>{p.community || p.area}</span>
                  {(() => {
                    const cn = getCommunityData(p);
                    if(!cn) return null;
                    const y = parseFloat(cn.grossYield||0);
                    const yColor = y>=7?"#10B981":y>=6?"#84CC16":y>=5?"#D4A843":"#94A3B8";
                    return (
                      <span style={{display:"inline-flex",gap:4,alignItems:"center"}}>
                        {y>0&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:yColor+"18",color:yColor,fontWeight:600}}>{y.toFixed(1)}%</span>}
                        {cn.investmentScore&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(212,168,67,0.12)",color:"#D4A843",fontWeight:600}}>Score {cn.investmentScore}</span>}
                        {cn.hasMetro&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(16,185,129,0.1)",color:"#10B981",fontWeight:600}}>Metro</span>}
                      </span>
                    );
                  })()}
                </div>`
);

fs.writeFileSync("src/tabs/ProjectsTab.jsx", src, "latin1");
console.log("Done. Non-ASCII:", (src.match(/[^\x00-\x7F]/g)||[]).length);