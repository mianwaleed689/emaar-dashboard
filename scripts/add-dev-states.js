const fs = require("fs");
let src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");

// Add states right after the function signature opens — find first useState in the component
src = src.replace(
  `  /* Phase 2.4 Batch 2: derive which communities match the global filter state.`,
  `  const [devSearch,    setDevSearch]    = React.useState("");
  const [showDevDrop,  setShowDevDrop]  = React.useState(false);
  const [commSearch2,  setCommSearch2]  = React.useState("");
  const [showCommDrop, setShowCommDrop] = React.useState(false);

  /* Phase 2.4 Batch 2: derive which communities match the global filter state.`
);

fs.writeFileSync("src/tabs/ProjectsTab.jsx", src, "latin1");
const lines = src.split("\n");
let found = false;
lines.forEach((l,i)=>{
  if(l.includes("showDevDrop,  setShowDevDrop")) { console.log("States at line:", i+1); found=true; }
});
if(!found) console.log("ERROR: States not found after replacement");