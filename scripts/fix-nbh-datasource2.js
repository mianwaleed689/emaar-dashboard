const fs = require("fs");
let src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");

// Remove the bad insertion
src = src.replace(
`/* marketData handled by collection listener, not tabData doc */
// neighbourhoodScores — load from collection (259 docs)
unsubs.push(onSnapshot(collection(db, "neighbourhoodScores"), (snap) => {
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (rows.length > 0) setLiveNeighbourhoods(rows);
}));`,
`/* marketData handled by collection listener, not tabData doc */`
);

// Find the closing of the tabKeys forEach block and insert after it
const TARGET = `tabKeys.forEach(({ key, setter }) => {
unsubs.push(onSnapshot(doc(db, "tabData", key), (snap) => {
if (snap.exists() && snap.data().rows?.length > 0) setter(snap.data().rows);
}));
});`;

const REPLACEMENT = `tabKeys.forEach(({ key, setter }) => {
unsubs.push(onSnapshot(doc(db, "tabData", key), (snap) => {
if (snap.exists() && snap.data().rows?.length > 0) setter(snap.data().rows);
}));
});

// neighbourhoodScores — direct collection listener (259 docs)
unsubs.push(onSnapshot(collection(db, "neighbourhoodScores"), (snap) => {
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (rows.length > 0) setLiveNeighbourhoods(rows);
}));`;

if (src.includes(TARGET)) {
  src = src.replace(TARGET, REPLACEMENT);
  console.log("Inserted collection listener after tabKeys forEach");
} else {
  console.log("TARGET not found — trying alternate approach");
  // Try finding by line pattern
  const lines = src.split("\n");
  const idx = lines.findIndex(l => l.includes("platformSettings") && l.includes("tabs") && l.includes("onSnapshot"));
  if (idx > -1) {
    lines.splice(idx, 0, 
      "",
      "// neighbourhoodScores — direct collection listener (259 docs)",
      "unsubs.push(onSnapshot(collection(db, \"neighbourhoodScores\"), (snap) => {",
      "  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));",
      "  if (rows.length > 0) setLiveNeighbourhoods(rows);",
      "}));",
      ""
    );
    src = lines.join("\n");
    console.log("Inserted at line", idx);
  }
}

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", src, "latin1");