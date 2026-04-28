const fs = require("fs");
const src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const lines = src.split("\n");

// ── FIX 1: Remove unfiltered liveLeads fetch (lines 3590-3599) ──
// Replace the ALL LEADS block with nothing — liveLeads no longer needed
const fix1Old = `    /* ─── ALL LEADS (admin/general view) ─── */
    if (auth.currentUser?.uid) {
      unsubs.push(onSnapshot(
        query(collection(db, "leads"), orderBy("createdAt", "desc"), limit(500)),
        snap => {
          const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
          setLiveLeads(d);
        }, () => {}
      ));
    }`;

// Find and remove it using a pattern match on the key line
let content = src;

// Remove the ALL LEADS block by finding its boundaries
const allLeadsStart = content.indexOf("ALL LEADS (admin/general view)");
if (allLeadsStart > -1) {
  // Find the start of the comment line before it
  const blockStart = content.lastIndexOf("    if (auth.currentUser?.uid) {", allLeadsStart + 200);
  // Find the closing }); after the onSnapshot
  const blockEnd = content.indexOf("    })", blockStart) + 6;
  const removed = content.substring(blockStart, blockEnd + 1);
  console.log("FIX 1 — Removing block:\n" + removed.substring(0, 200) + "...");
  content = content.substring(0, content.lastIndexOf("/*", allLeadsStart)) + content.substring(blockEnd + 1);
  console.log("FIX 1 done");
} else {
  console.log("FIX 1 — pattern not found, searching differently...");
  // Try finding by the exact query line
  const idx = content.indexOf('query(collection(db, "leads"), orderBy("createdAt", "desc"), limit(500))');
  if (idx > -1) {
    console.log("Found at char", idx);
    const lineNum = content.substring(0, idx).split("\n").length;
    console.log("Line:", lineNum);
  }
}

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", content, "latin1");
console.log("Written");