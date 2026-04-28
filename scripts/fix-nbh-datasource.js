const fs = require("fs");
let src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");

// Replace the tabData/neighbourhoodScores listener with a direct collection listener
const OLD = `{ key: "neighbourhoodScores",setter: setLiveNeighbourhoods },`;
const NEW = `/* neighbourhoodScores loaded separately from collection below */`;

src = src.replace(OLD, NEW);

// Now find where the tabKeys forEach ends and add the collection listener after it
const INSERT_AFTER = `/* marketData handled by collection listener, not tabData doc */`;
const COLLECTION_LISTENER = `/* marketData handled by collection listener, not tabData doc */
// neighbourhoodScores — load from collection (259 docs)
unsubs.push(onSnapshot(collection(db, "neighbourhoodScores"), (snap) => {
  const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (rows.length > 0) setLiveNeighbourhoods(rows);
}));`;

src = src.replace(INSERT_AFTER, COLLECTION_LISTENER);

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", src, "latin1");
console.log("Fixed — now reads from neighbourhoodScores collection directly");