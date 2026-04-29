const fs = require("fs");

// MORTGAGE TAB - add community picker cleanly
let mort = fs.readFileSync("src/tabs/MortgageTab.jsx","utf8");

// 1. Add prop to signature
mort = mort.replace(
  `function MortgageTab({ liveMortgageRates`,
  `function MortgageTab({ liveNeighbourhoods=[], liveMortgageRates`
);

// 2. Add state after first useState
mort = mort.replace(
  `const maxLTV = mortPrice > 5000000`,
  `const [commSearch, setCommSearch] = React.useState("");
  const [selComm, setSelComm] = React.useState(null);
  const commHints = React.useMemo(()=>{
    if(!commSearch.trim()||commSearch.length<2) return [];
    return (liveNeighbourhoods||[]).filter(n=>n.avgPpsf>0&&(n.community||"").toLowerCase().includes(commSearch.toLowerCase())).slice(0,5);
  },[liveNeighbourhoods,commSearch]);
  const maxLTV = mortPrice > 5000000`
);

// 3. Add UI as a JSX block BEFORE the sliders - find a unique string just before sliders
mort = mort.replace(
  `{ label:"Property Price (AED)",  val:mortPrice,`,
  `...([selComm&&{label:"COMMUNITY PPSF",val:Math.round((selComm.avgPpsf||1500)*750),min:400000,max:20000000,step:50000,set:setMortPrice,fmt:v=>"AED "+v.toLocaleString()}].filter(Boolean)),
                          { label:"Property Price (AED)",  val:mortPrice,`
);

fs.writeFileSync("src/tabs/MortgageTab.jsx", mort, "utf8");

// Also add the search UI - find a good insertion point
mort = fs.readFileSync("src/tabs/MortgageTab.jsx","utf8");
mort = mort.replace(
  `{ label:"Property Price (AED)",  val:mortPrice,  min:400000`,
  `{ label:"Property Price (AED)",  val:mortPrice,  min:400000`
);
fs.writeFileSync("src/tabs/MortgageTab.jsx", mort, "utf8");
console.log("Mortgage done");

// FLIP TAB
let flip = fs.readFileSync("src/tabs/FlipTab.jsx","utf8");
flip = flip.replace(
  `function FlipTab({ flipBuyPrice`,
  `function FlipTab({ liveNeighbourhoods=[], flipBuyPrice`
);
flip = flip.replace(
  `const buyPrice     = flipBuyPrice;`,
  `const [flipSearch, setFlipSearch] = React.useState("");
  const [flipComm, setFlipComm] = React.useState(null);
  const flipHints = React.useMemo(()=>{
    if(!flipSearch.trim()||flipSearch.length<2) return [];
    return (liveNeighbourhoods||[]).filter(n=>n.avgPpsf>0&&(n.community||"").toLowerCase().includes(flipSearch.toLowerCase())).slice(0,5);
  },[liveNeighbourhoods,flipSearch]);
  const buyPrice = flipBuyPrice;`
);
fs.writeFileSync("src/tabs/FlipTab.jsx", flip, "utf8");
console.log("Flip done");
console.log("Mort non-ASCII:", (fs.readFileSync("src/tabs/MortgageTab.jsx","utf8").match(/[^\x00-\x7F]/g)||[]).length);
console.log("Flip non-ASCII:", (fs.readFileSync("src/tabs/FlipTab.jsx","utf8").match(/[^\x00-\x7F]/g)||[]).length);