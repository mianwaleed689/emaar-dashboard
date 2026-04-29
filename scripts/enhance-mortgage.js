const fs = require("fs");
let src = fs.readFileSync("src/tabs/MortgageTab.jsx","latin1");

// Add liveNeighbourhoods to function signature
src = src.replace(
  `function MortgageTab({ liveMortgageRates, liveEiborRates, liveInvestScores, handleTabChange, mortPri`,
  `function MortgageTab({ liveMortgageRates, liveEiborRates, liveInvestScores, handleTabChange, liveNeighbourhoods=[], mortPri`
);

// Add community picker after the opening of the component
const COMMUNITY_PICKER = `
  // Community PPSF lookup
  const [commSearch, setCommSearch] = React.useState("");
  const [selectedComm, setSelectedComm] = React.useState(null);
  const commSuggestions = React.useMemo(() => {
    if(!commSearch.trim()) return [];
    return (liveNeighbourhoods||[])
      .filter(n=>n.avgPpsf>0&&(n.community||"").toLowerCase().includes(commSearch.toLowerCase()))
      .slice(0,6);
  }, [liveNeighbourhoods, commSearch]);
`;

src = src.replace(
  `const maxLTV = mortPrice > 5000000`,
  COMMUNITY_PICKER + `\n  const maxLTV = mortPrice > 5000000`
);

// Add community picker UI before the sliders section
const PICKER_UI = `
              {/* Community Quick Fill */}
              <div style={{marginBottom:16,padding:"14px",background:"rgba(212,168,67,0.04)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:10}}>
                <div style={{fontSize:10,fontWeight:700,color:T.gold,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8}}>Quick Fill from Community Data</div>
                <div style={{position:"relative"}}>
                  <input value={commSearch} onChange={e=>{setCommSearch(e.target.value);setSelectedComm(null);}}
                    placeholder="Type community name to auto-fill price..."
                    style={{width:"100%",padding:"8px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:T.white,fontSize:12,outline:"none",fontFamily:"'Outfit',sans-serif",boxSizing:"border-box"}}/>
                  {commSuggestions.length>0&&!selectedComm&&(
                    <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#1a1f2e",border:"1px solid "+T.border,borderRadius:8,zIndex:10,maxHeight:200,overflowY:"auto"}}>
                      {commSuggestions.map(n=>(
                        <div key={n.community} onClick={()=>{
                          setSelectedComm(n);
                          setCommSearch(n.community);
                          // Auto-fill price based on community PPSF * typical 1BR size (750 sqft)
                          const typicalPrice = Math.round((n.avgPpsf||1500)*750/50000)*50000;
                          setMortPrice(typicalPrice);
                        }}
                          style={{padding:"10px 14px",cursor:"pointer",fontSize:12,color:T.white,borderBottom:"1px solid "+T.border+"30"}}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(212,168,67,0.08)"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                        >
                          <div style={{fontWeight:600}}>{n.community}</div>
                          <div style={{fontSize:10,color:"#64748B"}}>AED {Math.round(n.avgPpsf).toLocaleString()}/sqft · {n.grossYield}% yield · typical 1BR ~AED {Math.round((n.avgPpsf||1500)*750/50000*50000).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedComm&&(
                  <div style={{marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:11,color:"#94A3B8"}}>
                      {selectedComm.community} · AED {Math.round(selectedComm.avgPpsf).toLocaleString()}/sqft · {selectedComm.grossYield}% yield
                    </div>
                    <button type="button" onClick={()=>{setSelectedComm(null);setCommSearch("");}} style={{background:"none",border:"none",color:"#64748B",cursor:"pointer",fontSize:12}}>x</button>
                  </div>
                )}
              </div>
`;

// Find slider section and add picker before it
src = src.replace(
  `{ label:"Property Price (AED)",`,
  PICKER_UI + `              { label:"Property Price (AED)",`
);

fs.writeFileSync("src/tabs/MortgageTab.jsx", src, "latin1");
console.log("Mortgage done. Non-ASCII:", (src.match(/[^\x00-\x7F]/g)||[]).length);