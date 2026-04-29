const fs = require("fs");
let src = fs.readFileSync("src/tabs/MyLeadsTab.jsx","latin1");

// Add liveNeighbourhoods to function signature
const SIG_OLD = `export default function MyLeadsTab({`;
const SIG_NEW = `export default function MyLeadsTab({ liveNeighbourhoods=[],`;
src = src.replace(SIG_OLD, SIG_NEW);

// Add community suggestion logic after existing constants
const COMM_LOGIC = `
  // Community suggestions based on lead budget
  const getCommunitySuggestions = React.useCallback((budget) => {
    const b = parseFloat(budget||0);
    if(!b || !liveNeighbourhoods.length) return [];
    // Suggest communities where typical 1BR (750sqft) fits in budget
    return liveNeighbourhoods
      .filter(n => {
        const typicalPrice = (n.avgPpsf||0) * 750;
        return typicalPrice > 0 && typicalPrice <= b * 1.2 && typicalPrice >= b * 0.5;
      })
      .sort((a,b) => (b.investmentScore||0)-(a.investmentScore||0))
      .slice(0,5);
  }, [liveNeighbourhoods]);
`;

// Insert after the first useState block
src = src.replace(
  `const EMPTY={name:"",phone:"",email:"",budget:"",`,
  COMM_LOGIC + `  const EMPTY={name:"",phone:"",email:"",budget:"",`
);

// Find where matched projects are shown in lead detail and add community suggestions
const COMM_SUGGESTIONS_UI = `
                  {/* Community Suggestions */}
                  {selectedLead?.budget && (() => {
                    const suggestions = getCommunitySuggestions(selectedLead.budget);
                    if(!suggestions.length) return null;
                    return (
                      <div style={{marginTop:12,padding:"12px",background:"rgba(212,168,67,0.04)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:10}}>
                        <div style={{fontSize:10,fontWeight:700,color:T.gold,letterSpacing:0.8,textTransform:"uppercase",marginBottom:8}}>
                          Recommended Communities for {selectedLead.budget?("AED "+(parseFloat(selectedLead.budget)/1e6).toFixed(1)+"M budget"):"this budget"}
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:6}}>
                          {suggestions.map(n=>(
                            <div key={n.community} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:"rgba(255,255,255,0.03)",borderRadius:8,border:"1px solid "+T.border+"40"}}>
                              <div>
                                <div style={{fontSize:11,fontWeight:600,color:T.white}}>{n.community}</div>
                                <div style={{fontSize:10,color:"#94A3B8",marginTop:1}}>
                                  {n.grossYield}% yield · AED {Math.round(n.avgPpsf).toLocaleString()}/sqft
                                  {n.goldenVisa?" · GV":""}
                                  {n.hasMetro?" · Metro":""}
                                </div>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(212,168,67,0.1)",border:"1px solid rgba(212,168,67,0.3)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                                  <span style={{fontSize:10,fontWeight:700,color:T.gold}}>{n.investmentScore||"--"}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
`;

// Add after the matched projects section
src = src.replace(
  `<div style={{fontSize:11,color:T.textMuted,marginBottom:10}}>{matched.length>0?"Properties matching`,
  COMM_SUGGESTIONS_UI + `                  <div style={{fontSize:11,color:T.textMuted,marginBottom:10}}>{matched.length>0?"Properties matching`
);

fs.writeFileSync("src/tabs/MyLeadsTab.jsx", src, "latin1");
const nonAscii = (src.match(/[^\x00-\x7F]/g)||[]).length;
console.log("Done. Lines:", src.split("\n").length, "Non-ASCII:", nonAscii);