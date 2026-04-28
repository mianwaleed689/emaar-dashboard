const fs = require("fs");
let src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");

const fixed = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const l = lines[i];

  // Remove the bad insertion inside the array (lines 3399-3405)
  if (l.includes("neighbourhoodScores loaded separately")) continue;
  if (l.includes("marketData handled by collection listener")) continue;
  if (l.includes("// neighbourhoodScores  load from collection")) continue;
  if (l.includes("// neighbourhoodScores  direct collection listener")) continue;

  // Remove duplicate onSnapshot blocks for neighbourhoodScores
  if (l.includes('onSnapshot(collection(db, "neighbourhoodScores")')) {
    // Skip this line and next 3
    i += 3;
    continue;
  }

  // Restore the missing neighbourhoodScores key in tabKeys array
  if (l.includes('{ key: "mortgageRates"')) {
    fixed.push(l);
    fixed.push('      { key: "neighbourhoodScores", setter: setLiveNeighbourhoods },');
    continue;
  }

  fixed.push(l);
}

// Now add the clean collection listener after tabKeys forEach
const result = fixed.join("\n");
const INSERT_AFTER = `tabKeys.forEach(({ key, setter }) => {
      unsubs.push(onSnapshot(doc(db, "tabData", key), (snap) => {
        if (snap.exists() && snap.data().rows?.length > 0) setter(snap.data().rows);
      }));
    });`;

const WITH_LISTENER = INSERT_AFTER + `

    // neighbourhoodScores — direct collection listener (259 docs)
    unsubs.push(onSnapshot(collection(db, "neighbourhoodScores"), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (rows.length > 0) setLiveNeighbourhoods(rows);
    }));`;

const final = result.includes(INSERT_AFTER) 
  ? result.replace(INSERT_AFTER, WITH_LISTENER)
  : result;

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", final, "latin1");
console.log("Fixed. Lines:", final.split("\n").length);