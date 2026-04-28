const fs = require("fs");
let src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "latin1");

// Replace CommunityCard to handle both tiers
const oldCard = `// ── Community Card ────────────────────────────────────────────
const CommunityCard = ({n, selected, onSelect, onCompare, isCompared}) => {
  const riskColor = RISK_COLOR[n.supplyRisk||"Unknown"];
  const grossY = parseFloat(n.grossYield||0);
  const yieldColor = grossY>=7?"#10B981":grossY>=6?"#84CC16":grossY>=5?T.gold:"#94A3B8";`;

const newCard = `// ── Community Card ────────────────────────────────────────────
const CommunityCard = ({n, selected, onSelect, onCompare, isCompared}) => {
  const isDLD = n.tier === "dld-registry";
  const riskColor = RISK_COLOR[n.supplyRisk||"Unknown"];
  const grossY = parseFloat(n.grossYield||0);
  const yieldColor = grossY>=7?"#10B981":grossY>=6?"#84CC16":grossY>=5?T.gold:"#94A3B8";`;

if (src.includes(oldCard)) {
  src = src.replace(oldCard, newCard);
  console.log("isDLD added to card");
} else {
  console.log("Card pattern not found");
}

// Replace the metrics grid in card — show DLD data for registry tier
const oldMetrics = `      {/* Key metrics */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {[
          {label:"Gross Yield", value:fmtY(n.grossYield), color:yieldColor},
          {label:"Net Yield",   value:fmtY(n.netYield),   color:T.textSecondary||"#CBD5E1"},
          {label:"Avg PPSF",    value:fmtP(n.avgPpsf),    color:T.white},
          {label:"Svc Charge",  value:fmtSC(n.serviceCharge), color:"#94A3B8"},
        ].map((m,i)=>(`);

const newMetrics = `      {/* Key metrics */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        {(isDLD ? [
          {label:"Median PPSF",   value:fmtP(n.avgPpsf),          color:T.gold},
          {label:"Median Price",  value:fmtP(n.medianPrice),       color:T.white},
          {label:"Transactions",  value:n.totalTransactions||"—",  color:"#94A3B8"},
          {label:"Projects",      value:n.totalProjects||"—",      color:"#94A3B8"},
        ] : [
          {label:"Gross Yield", value:fmtY(n.grossYield), color:yieldColor},
          {label:"Net Yield",   value:fmtY(n.netYield),   color:"#CBD5E1"},
          {label:"Avg PPSF",    value:fmtP(n.avgPpsf),    color:T.white},
          {label:"Svc Charge",  value:fmtSC(n.serviceCharge), color:"#94A3B8"},
        ]).map((m,i)=>(`);

if (src.includes(oldMetrics)) {
  src = src.replace(oldMetrics, newMetrics);
  console.log("Card metrics updated for both tiers");
} else {
  console.log("Metrics pattern not found");
}

// Fix chip for DLD registry
const oldChips = `          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            <Chip label="✓ Verified" color="#10B981"/>`;
const newChips = `          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {isDLD
              ? <Chip label="DLD Registry" color="#64748B"/>
              : <Chip label="✓ Verified" color="#10B981"/>
            }`;

if (src.includes(oldChips)) {
  src = src.replace(oldChips, newChips);
  console.log("Card chips updated");
} else {
  console.log("Chips pattern not found");
}

// Hide distances for DLD registry
const oldDist = `      {/* Distances */}
      <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>`;
const newDist = `      {/* Distances — only for verified */}
      {!isDLD&&<div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>`;

if (src.includes(oldDist)) {
  src = src.replace(oldDist, newDist);
  // Close the conditional div
  src = src.replace(
    `        {n.distAirport&&<div style={{fontSize:10,color:"#94A3B8"}}><span style={{color:"#F59E0B"}}>✈️</span> {fmtD(n.distAirport)}</div>}
      </div>`,
    `        {n.distAirport&&<div style={{fontSize:10,color:"#94A3B8"}}><span style={{color:"#F59E0B"}}>✈️</span> {fmtD(n.distAirport)}</div>}
      </div>}`
  );
  console.log("Distances hidden for DLD registry");
} else {
  console.log("Distances pattern not found");
}

// Update header count
const oldHeader = `        <p style={{margin:"4px 0 0",fontSize:12,color:"#94A3B8"}}>{liveNeighbourhoods.length} verified Emaar communities · Real yields, distances, investment scores</p>`;
const newHeader = `        <p style={{margin:"4px 0 0",fontSize:12,color:"#94A3B8"}}>
          {liveNeighbourhoods.filter(n=>n.tier==="verified").length} verified Emaar · {liveNeighbourhoods.filter(n=>n.tier==="dld-registry").length} DLD registry · {liveNeighbourhoods.length} total communities
        </p>`;

if (src.includes(oldHeader)) {
  src = src.replace(oldHeader, newHeader);
  console.log("Header count updated");
} else {
  console.log("Header pattern not found");
}

fs.writeFileSync("src/tabs/NeighbourhoodsTab.jsx", src, "utf8");
console.log("Done");