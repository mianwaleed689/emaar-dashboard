const fs = require("fs");
let src = fs.readFileSync("src/tabs/FlipTab.jsx","utf8");

// Add liveNeighbourhoods to signature
src = src.replace(
  `function FlipTab({ flipBuyPrice, setFlipBuyPrice`,
  `function FlipTab({ liveNeighbourhoods=[], flipBuyPrice, setFlipBuyPrice`
);

// Add community lookup before calculations
const COMM_LOOKUP = `
  const [flipCommSearch, setFlipCommSearch] = React.useState("");
  const [flipComm, setFlipComm] = React.useState(null);
  const flipCommSuggestions = React.useMemo(() => {
    if(!flipCommSearch.trim()) return [];
    return (liveNeighbourhoods||[])
      .filter(n=>n.avgPpsf>0&&(n.community||"").toLowerCase().includes(flipCommSearch.toLowerCase()))
      .slice(0,5);
  }, [liveNeighbourhoods, flipCommSearch]);
`;

src = src.replace(
  `const buyPrice     = flipBuyPrice;`,
  COMM_LOOKUP + `  const buyPrice = flipBuyPrice;`
);

// Add community picker before buy price slider
const FLIP_PICKER = `
              <div style={{marginBottom:14,padding:"12px",background:"rgba(212,168,67,0.04)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:10}}>
                <div style={{fontSize:10,fontWeight:700,color:T.gold,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8}}>Auto-fill from Community Data</div>
                <div style={{position:"relative"}}>
                  <input value={flipCommSearch} onChange={e=>{setFlipCommSearch(e.target.value);setFlipComm(null);}}
                    placeholder="Search community to auto-fill prices..."
                    style={{width:"100%",padding:"8px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:T.white,fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/>
                  {flipCommSuggestions.length>0&&!flipComm&&(
                    <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#1a1f2e",border:"1px solid "+T.border,borderRadius:8,zIndex:10}}>
                      {flipCommSuggestions.map(n=>(
                        <div key={n.community} onClick={()=>{
                          setFlipComm(n);
                          setFlipCommSearch(n.community);
                          const buyP = Math.round((n.avgPpsf||1500)*750/50000)*50000;
                          setFlipBuyPrice(buyP);
                          setFlipSellPrice(Math.round(buyP*1.15/50000)*50000);
                        }}
                          style={{padding:"9px 12px",cursor:"pointer",fontSize:11,color:T.white,borderBottom:"1px solid "+T.border+"20"}}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(212,168,67,0.08)"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                        >
                          <span style={{fontWeight:600}}>{n.community}</span>
                          <span style={{color:"#64748B",marginLeft:8}}>AED {Math.round(n.avgPpsf).toLocaleString()}/sqft · Score {n.investmentScore}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {flipComm&&<div style={{marginTop:6,fontSize:10,color:"#94A3B8"}}>{flipComm.community} · {flipComm.grossYield}% yield · {flipComm.supplyRisk} risk</div>}
              </div>
`;

src = src.replace(
  `{ label:"Buy Price (AED)",`,
  FLIP_PICKER + `              { label:"Buy Price (AED)",`
);

fs.writeFileSync("src/tabs/FlipTab.jsx", src, "utf8");
console.log("Done. Non-ASCII:", (src.match(/[^\x00-\x7F]/g)||[]).length);