/**
 * fix-yields-listeners.js
 *
 * Fixes the 3 broken yield listeners in EmaarDashboardV2.jsx.
 * Replaces them with 1 correct listener that reads from tabData/yieldSummary
 * and transforms nested yield data to flat format for both tabs.
 *
 * Run: node scripts/fix-yields-listeners.js
 */

const fs = require("fs");
const path = require("path");

const TARGET_FILE = "src/EmaarDashboardV2.jsx";
const filePath = path.join(process.cwd(), TARGET_FILE);

console.log("");
console.log("=== Fix Yields Listeners ===");
console.log("");

// ─── Step 1: Read current file ──────────────────────────────────────
console.log("Step 1: Reading " + TARGET_FILE);
const source = fs.readFileSync(filePath, "utf8");
const lines = source.split("\n");
console.log("  Lines: " + lines.length);

// Verify file is clean
const mojibake = (source.match(/\u00C3/g) || []).length + (source.match(/\u00E2/g) || []).length;
console.log("  Mojibake: " + mojibake);
if (mojibake > 50) {
  console.error("ABORT: file has mojibake corruption");
  process.exit(1);
}

// ─── Step 2: Verify all 3 broken listeners are where we expect ──────
console.log("");
console.log("Step 2: Verifying broken listener locations");

const checks = [
  { line: 2775, contains: "// yieldData" },
  { line: 2776, contains: 'onSnapshot(collection(db, "yieldData")' },
  { line: 2781, contains: "setLiveYields([])" },
  { line: 2782, contains: "}));" },
  { line: 2784, contains: "// tabData/yieldData" },
  { line: 2785, contains: 'onSnapshot(doc(db, "tabData", "yieldData")' },
  { line: 2793, contains: "setLiveYields(mapped)" },
  { line: 2794, contains: "}));" },
  { line: 2884, contains: "YIELDS DATA" },
  { line: 2885, contains: 'onSnapshot(collection(db, "yieldsData")' },
  { line: 2887, contains: "setLiveYieldsData(d)" },
  { line: 2888, contains: "}, () => {}));" },
];

let allOk = true;
for (const c of checks) {
  const actual = lines[c.line - 1] || "";
  const ok = actual.includes(c.contains);
  console.log("  [" + (ok ? "OK  " : "FAIL") + "] line " + c.line + " contains '" + c.contains + "'");
  if (!ok) {
    console.log("       actual: " + actual.substring(0, 120));
    allOk = false;
  }
}

if (!allOk) {
  console.error("ABORT: boundary verification failed");
  process.exit(1);
}

// ─── Step 3: Build the replacement listener ─────────────────────────
const newListener = [
  '    // tabData/yieldSummary (written by cron-yields daily)',
  '    // Transforms nested per-unit-type yields into flat grossYield for both tabs',
  '    unsubs.push(onSnapshot(doc(db, "tabData", "yieldSummary"), (snap) => {',
  '      if (!snap.exists() || !snap.data().communities?.length) return;',
  '      const communities = snap.data().communities;',
  '      // Transform for OverviewTab (liveYields): needs { community, gross }',
  '      const overviewYields = communities.map(c => {',
  '        const y = c.yields || {};',
  '        const vals = Object.values(y).filter(v => typeof v === "number" && v > 0);',
  '        const avgGross = vals.length > 0 ? vals.reduce((a,b) => a+b, 0) / vals.length : 0;',
  '        return { community: c.community, gross: parseFloat(avgGross.toFixed(1)), district: c.district };',
  '      }).filter(c => c.gross > 0);',
  '      setLiveYields(overviewYields);',
  '      // Transform for YieldsTab (liveYieldsData): needs { community, grossYield, netYield, type, avgRent, avgPrice, ppsf }',
  '      const yieldsTabData = communities.map(c => {',
  '        const y = c.yields || {};',
  '        const r = c.rents || {};',
  '        const s = c.salePrices || {};',
  '        const vals = Object.values(y).filter(v => typeof v === "number" && v > 0);',
  '        const avgGross = vals.length > 0 ? vals.reduce((a,b) => a+b, 0) / vals.length : 0;',
  '        const avgNet = avgGross > 0 ? avgGross * 0.78 : 0; // ~78% of gross is typical net in Dubai',
  '        const rentVals = Object.values(r).filter(v => typeof v === "number" && v > 0);',
  '        const avgRent = rentVals.length > 0 ? Math.round(rentVals.reduce((a,b) => a+b, 0) / rentVals.length) : 0;',
  '        const priceVals = Object.values(s).filter(v => typeof v === "number" && v > 0);',
  '        const avgPrice = priceVals.length > 0 ? Math.round(priceVals.reduce((a,b) => a+b, 0) / priceVals.length) : 0;',
  '        return {',
  '          id: "y_" + (c.community || "").replace(/\\s+/g, "_").toLowerCase(),',
  '          community: c.community,',
  '          type: "Apartment",',
  '          grossYield: parseFloat(avgGross.toFixed(1)),',
  '          netYield: parseFloat(avgNet.toFixed(1)),',
  '          avgRent: avgRent,',
  '          avgPrice: avgPrice,',
  '          ppsf: avgPrice > 0 ? Math.round(avgPrice / 900) : 0, // ~900 sqft avg',
  '          district: c.district || c.community,',
  '          source: c.source || "Bayut API",',
  '        };',
  '      }).filter(c => c.grossYield > 0);',
  '      if (yieldsTabData.length > 0) setLiveYieldsData(yieldsTabData);',
  '    }));',
];

// ─── Step 4: Apply changes ──────────────────────────────────────────
console.log("");
console.log("Step 3: Applying fix");

let resultLines = lines.slice();

// Delete listener 3 first (line 2884-2888, highest index)
console.log("  Removing broken listener 3 (lines 2884-2888): yieldsData collection");
resultLines.splice(2883, 5); // 0-indexed: 2883 = line 2884, remove 5 lines

// Delete listeners 1+2 (lines 2775-2794, they're contiguous with a blank line between)
console.log("  Removing broken listeners 1+2 (lines 2775-2794): yieldData + tabData/yieldData");
resultLines.splice(2774, 20); // 0-indexed: 2774 = line 2775, remove 20 lines

// Insert new listener where listeners 1+2 were
console.log("  Inserting correct listener at line 2775");
resultLines.splice(2774, 0, ...newListener);

const finalContent = resultLines.join("\n");
const finalLines = resultLines.length;
const finalMojibake = (finalContent.match(/\u00C3/g) || []).length + (finalContent.match(/\u00E2/g) || []).length;

console.log("");
console.log("Step 4: Verification");
console.log("  Original lines:  " + lines.length);
console.log("  New lines:       " + finalLines);
console.log("  Change:          " + (finalLines - lines.length) + " lines");
console.log("  Mojibake:        " + finalMojibake);

// Verify the new listener is in the right place
const newContent = resultLines.join("\n");
const hasCorrectPath = newContent.includes('doc(db, "tabData", "yieldSummary")');
const hasOverviewTransform = newContent.includes("setLiveYields(overviewYields)");
const hasYieldsTransform = newContent.includes("setLiveYieldsData(yieldsTabData)");
const noOldPath1 = !newContent.includes('collection(db, "yieldData")');
const noOldPath2 = !newContent.includes('"tabData", "yieldData"');
const noOldPath3 = !newContent.includes('collection(db, "yieldsData")');

console.log("  Correct path (tabData/yieldSummary): " + hasCorrectPath);
console.log("  OverviewTab transform: " + hasOverviewTransform);
console.log("  YieldsTab transform: " + hasYieldsTransform);
console.log("  Old path 1 removed (yieldData collection): " + noOldPath1);
console.log("  Old path 2 removed (tabData/yieldData): " + noOldPath2);
console.log("  Old path 3 removed (yieldsData collection): " + noOldPath3);

if (finalMojibake > 0 || !hasCorrectPath || !hasOverviewTransform || !hasYieldsTransform || !noOldPath1 || !noOldPath2 || !noOldPath3) {
  console.error("ABORT: verification failed");
  process.exit(1);
}

// ─── Step 5: Write ──────────────────────────────────────────────────
fs.writeFileSync(filePath, finalContent, { encoding: "utf8" });
console.log("");
console.log("  Written to " + TARGET_FILE);
console.log("");
console.log("DONE. Next: npm run build");
console.log("");