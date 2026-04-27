// scripts/audit-all-tabs.js
// Scans every tab file in src/tabs/ to map what data sources it uses.
// Output: per-tab breakdown of Firestore reads, hook usage, hardcoded SEED_DATA references.

const fs = require("fs");
const path = require("path");

const tabs = fs.readdirSync("src/tabs").filter(f => f.endsWith(".jsx"));

console.log("TAB DATA SOURCE AUDIT (" + tabs.length + " tabs)");
console.log("=".repeat(80));
console.log("");

const results = tabs.map(tab => {
  const filepath = "src/tabs/" + tab;
  const text = fs.readFileSync(filepath, "utf8");
  const lines = text.split("\n");

  return {
    tab: tab.replace(".jsx", ""),
    lines: lines.length,
    seedData: (text.match(/SEED_DATA\.\w+/g) || []).length,
    seedDataTypes: [...new Set((text.match(/SEED_DATA\.(\w+)/g) || []).map(s => s.replace("SEED_DATA.", "")))],
    firestoreReads: (text.match(/collection\(db,/g) || []).length,
    useHooks: [...new Set((text.match(/use(Communities|Developers|Projects|Developments|Yields|UserFacingCommunities|AllCommunities|ConsumerCommunities)\b/g) || []))],
    useUserFacing: text.includes("useUserFacingCommunities"),
    hardcodedConstants: (text.match(/^const [A-Z_]+\s*=\s*[\[{]/gm) || []).length,
    rawProjectsRefs: (text.match(/rawProjects/g) || []).length,
    hardcodedCommunities: (text.match(/COMMUNITY_COORDS|BASE_PPSF/g) || []).length,
  };
});

const usingFirestore = results.filter(r => r.firestoreReads > 0 || r.useHooks.length > 0);
const usingSeedData  = results.filter(r => r.seedData > 0);
const usingBoth      = results.filter(r => (r.firestoreReads > 0 || r.useHooks.length > 0) && r.seedData > 0);
const usingNeither   = results.filter(r => r.firestoreReads === 0 && r.useHooks.length === 0 && r.seedData === 0);
const onlyProps      = usingNeither.filter(r => r.rawProjectsRefs > 0 || r.hardcodedConstants > 0);

console.log("SUMMARY:");
console.log("  Total tabs:                          " + results.length);
console.log("  Using Firestore (collection or hook): " + usingFirestore.length);
console.log("  Using SEED_DATA hardcoded:           " + usingSeedData.length);
console.log("  Using both (mixed sources):          " + usingBoth.length);
console.log("  Using neither (props/constants only): " + usingNeither.length);
console.log("");

console.log("PER-TAB BREAKDOWN (sorted by SEED_DATA usage, highest first):");
console.log("");

const sorted = [...results].sort((a, b) => b.seedData - a.seedData);
sorted.forEach(r => {
  const sources = [];
  if (r.firestoreReads > 0) sources.push("FS:" + r.firestoreReads);
  if (r.useHooks.length > 0) sources.push("hooks:" + r.useHooks.join("+"));
  if (r.seedData > 0) sources.push("SEED:" + r.seedData + "(" + r.seedDataTypes.join(",") + ")");
  if (r.rawProjectsRefs > 0) sources.push("rawProj:" + r.rawProjectsRefs);
  if (r.hardcodedCommunities > 0) sources.push("hardcoded:" + r.hardcodedCommunities);
  const status = sources.length ? sources.join(" | ") : "(props only)";
  console.log("  " + r.tab.padEnd(28) + " " + status);
});

console.log("");
console.log("=".repeat(80));
console.log("MIGRATION PRIORITY (worst offenders first):");
console.log("=".repeat(80));
sorted.filter(r => r.seedData > 5 || r.hardcodedCommunities > 0).forEach((r, i) => {
  console.log((i + 1) + ". " + r.tab + " — SEED:" + r.seedData + " hardcoded:" + r.hardcodedCommunities);
});
