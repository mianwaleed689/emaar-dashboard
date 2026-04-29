const fs = require("fs");

// Fix MortgageTab — move community picker BEFORE the sliders array
let mort = fs.readFileSync("src/tabs/MortgageTab.jsx","utf8");

// Find and fix — the picker is inside {[ array, need to move it before
mort = mort.replace(
  `{/* Sliders */}
                        {[
                          
              {/* Community Quick Fill */}`,
  `{/* Community Quick Fill */}`
);

// Find end of community picker and add the sliders array after it
mort = mort.replace(
  `{selectedComm&&(
                  <div style={{marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:11,color:"#94A3B8"}}>
                      {selectedComm.community} · AED {Math.round(selectedComm.avgPpsf).toLocaleString()}/sqft · {selectedComm.grossYield}% yield
                    </div>
                    <button type="button" onClick={()=>{setSelectedComm(null);setCommSearch("");}} style={{background:"none",border:"none",color:"#64748B",cursor:"pointer",fontSize:12}}>x</button>
                  </div>
                )}
              </div>
              { label:"Property Price (AED)",`,
  `{selectedComm&&(
                  <div style={{marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:11,color:"#94A3B8"}}>
                      {selectedComm.community} · AED {Math.round(selectedComm.avgPpsf).toLocaleString()}/sqft · {selectedComm.grossYield}% yield
                    </div>
                    <button type="button" onClick={()=>{setSelectedComm(null);setCommSearch("");}} style={{background:"none",border:"none",color:"#64748B",cursor:"pointer",fontSize:12}}>x</button>
                  </div>
                )}
              </div>
              {/* Sliders */}
              {[{ label:"Property Price (AED)",`
);

fs.writeFileSync("src/tabs/MortgageTab.jsx", mort, "utf8");
console.log("Mortgage fixed");

// Fix FlipTab — same issue
let flip = fs.readFileSync("src/tabs/FlipTab.jsx","utf8");
flip = flip.replace(
  `              </div>}
              {[{ label:"Buy Price (AED)",`,
  `              </div>
              {[{ label:"Buy Price (AED)",`
);
fs.writeFileSync("src/tabs/FlipTab.jsx", flip, "utf8");
console.log("Flip fixed");