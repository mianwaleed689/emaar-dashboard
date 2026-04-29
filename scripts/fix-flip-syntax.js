const fs = require("fs");
let src = fs.readFileSync("src/tabs/FlipTab.jsx","utf8");

// Fix — the picker was inserted inside the array, breaking it
// Need to wrap the sliders in a proper JSX array
src = src.replace(
  `                {flipComm&&<div style={{marginTop:6,fontSize:10,color:"#94A3B8"}}>{flipComm.community} · {flipComm.grossYield}% yield · {flipComm.supplyRisk} risk</div>}
              </div>
              { label:"Buy Price (AED)",`,
  `                {flipComm&&<div style={{marginTop:6,fontSize:10,color:"#94A3B8"}}>{flipComm.community} · {flipComm.grossYield}% yield · {flipComm.supplyRisk} risk</div>}
              </div>
              </div>}
              {[{ label:"Buy Price (AED)",`
);

// Also fix the closing of the sliders array if needed
console.log("Fixed. Checking line 178-185:");
src.split("\n").slice(175,185).forEach((l,i)=>console.log(176+i, l.substring(0,100)));

fs.writeFileSync("src/tabs/FlipTab.jsx", src, "utf8");