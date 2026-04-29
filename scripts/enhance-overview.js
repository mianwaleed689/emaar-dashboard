const fs = require("fs");
let src = fs.readFileSync("src/tabs/OverviewTab.jsx","latin1");

// Add liveNeighbourhoods to signature
src = src.replace(
  `function OverviewTab({`,
  `function OverviewTab({ liveNeighbourhoods=[],`
);

// Add top communities widget after the QuickStats section
// Find the button that links to Yields tab and add widget before it
const TARGET = `<button type="button" onClick={()=>handleTabChange?.("Yields")} style={{ width:"100%", marginTop:12,`;

const WIDGET = `
        {/* Top Communities Widget */}
        {liveNeighbourhoods.length>0&&(
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"16px",marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:700,color:T.white}}>Top Investment Communities</div>
              <button type="button" onClick={()=>handleTabChange?.("Neighbourhoods")} style={{fontSize:10,color:T.gold,background:"none",border:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>View all 259 -></button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[...liveNeighbourhoods].filter(n=>n.grossYield>0).sort((a,b)=>(b.investmentScore||0)-(a.investmentScore||0)).slice(0,5).map((n,i)=>(
                <div key={n.community} onClick={()=>handleTabChange?.("Neighbourhoods")}
                  style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:"rgba(255,255,255,0.02)",borderRadius:8,cursor:"pointer",border:"1px solid "+T.border+"40"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(212,168,67,0.3)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=T.border+"40"}
                >
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:10,fontWeight:700,color:"#64748B",width:16}}>{i+1}</span>
                    <div>
                      <div style={{fontSize:11,fontWeight:600,color:T.white}}>{n.community}</div>
                      <div style={{fontSize:9,color:"#64748B"}}>{n.nearestMetro?n.nearestMetro.replace(" Metro","")+" Metro · ":""}{n.supplyRisk||""} Risk</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:11,fontWeight:700,color:parseFloat(n.grossYield||0)>=7?"#10B981":"#84CC16"}}>{parseFloat(n.grossYield||0).toFixed(1)}%</span>
                    <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(212,168,67,0.1)",border:"1px solid rgba(212,168,67,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontSize:9,fontWeight:700,color:T.gold}}>{n.investmentScore}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        `;

src = src.replace(TARGET, WIDGET + TARGET);

fs.writeFileSync("src/tabs/OverviewTab.jsx", src, "latin1");
console.log("Done. Non-ASCII:", (src.match(/[^\x00-\x7F]/g)||[]).length);