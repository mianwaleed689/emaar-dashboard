const fs = require("fs");
let src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

// Insert states right after line 248 (}) {)
const STATES = `  const [devSearch,    setDevSearch]    = React.useState("");
  const [showDevDrop,  setShowDevDrop]  = React.useState(false);
  const [commSearch2,  setCommSearch2]  = React.useState("");
  const [showCommDrop, setShowCommDrop] = React.useState(false);`;

// Insert after line 248 (index 247)
lines.splice(248, 0, STATES);

src = lines.join("\n");
fs.writeFileSync("src/tabs/ProjectsTab.jsx", src, "latin1");

// Verify
const newLines = src.split("\n");
console.log("Lines 248-255:");
newLines.slice(247,256).forEach((l,i)=>console.log(248+i, l.replace(/[^\x20-\x7E]/g,"").substring(0,100)));