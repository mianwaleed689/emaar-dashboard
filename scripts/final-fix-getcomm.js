const fs = require("fs");
let src = fs.readFileSync("src/tabs/ProjectsTab.jsx","latin1");
const lines = src.split("\n");

// Find line 248 }) { — the component body start
let bodyStart = -1;
for(let i=218;i<260;i++){
  if(lines[i].trim()==="}){" || lines[i].trim()==="}) {" || lines[i].trim()==="})  {") {
    bodyStart=i; break;
  }
}
console.log("Body start at line:", bodyStart+1, "->", lines[bodyStart]?.trim());

// Insert getCommunityData right after line 248
const INSERT = `
  // ── Community intelligence ──────────────────────────────────────────
  const _commMap = React.useMemo(()=>{
    const m={};
    (liveNeighbourhoods||[]).forEach(n=>{ if(n.community) m[n.community.toLowerCase()]=n; });
    return m;
  },[liveNeighbourhoods]);
  const getCommunityData = React.useCallback((p)=>
    _commMap[(p?.community||"").toLowerCase()]||null
  ,[_commMap]);
  // ─────────────────────────────────────────────────────────────────────
`;

lines.splice(bodyStart+1, 0, INSERT);
src = lines.join("\n");
fs.writeFileSync("src/tabs/ProjectsTab.jsx", src, "latin1");

// Verify
const newLines = src.split("\n");
let newDef=-1;
newLines.forEach((l,i)=>{ if(l.includes("getCommunityData = React.useCallback")) newDef=i+1; });
console.log("getCommunityData now at line:", newDef);
console.log("Is after component start (219):", newDef>219?"YES":"NO");