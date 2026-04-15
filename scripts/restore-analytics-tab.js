/**
 * restore-analytics-tab.js
 *
 * Restores the Admin Analytics tab to AdminPanel.jsx.
 * Was deleted in Session 9 fix #3 (commit eadceee).
 *
 * Approach:
 * 1. Read current AdminPanel.jsx (19,468 lines, clean UTF-8)
 * 2. Extract Analytics block + sidebar button from clean commit 82e1110
 * 3. Insert at proper locations (preserves all current state)
 * 4. Write with proper UTF-8
 *
 * Run: node scripts/restore-analytics-tab.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const CLEAN_COMMIT = "82e1110";
const TARGET_FILE = "src/AdminPanel.jsx";

console.log("");
console.log("=== Restore Admin Analytics Tab ===");
console.log("");

// ─── Step 1: Read current AdminPanel.jsx (clean working version) ──
console.log("Step 1: Reading current AdminPanel.jsx");
const currentSource = fs.readFileSync(path.join(process.cwd(), TARGET_FILE), "utf8");
const currentLines = currentSource.split("\n");
console.log("  Current lines: " + currentLines.length.toLocaleString());

const currentMojibake = (currentSource.match(/\u00C3/g) || []).length + (currentSource.match(/\u00E2/g) || []).length;
console.log("  Current mojibake: " + currentMojibake);
if (currentMojibake > 50) {
  console.error("ABORT: current file has mojibake corruption");
  process.exit(1);
}

// ─── Step 2: Extract Analytics from clean commit ──────────────────
console.log("");
console.log("Step 2: Extracting Analytics block from " + CLEAN_COMMIT);
const cleanSource = execSync(
  "git cat-file -p " + CLEAN_COMMIT + ":" + TARGET_FILE,
  { encoding: "utf8", maxBuffer: 100 * 1024 * 1024 }
);
const cleanLines = cleanSource.split("\n");
console.log("  Clean source: " + cleanLines.length.toLocaleString() + " lines");

// Analytics block: lines 19557-22445 (0-indexed: 19556-22444)
const analyticsBlock = cleanLines.slice(19556, 22445);  // inclusive of 22444
console.log("  Analytics block: " + analyticsBlock.length + " lines");
console.log("    First line: " + analyticsBlock[0].substring(0, 80));
console.log("    Last line:  " + analyticsBlock[analyticsBlock.length - 1].substring(0, 80));

// Sidebar button: line 15065 (0-indexed: 15064)
const sidebarLine = cleanLines[15064];
console.log("  Sidebar button: " + sidebarLine.trim());

// Verify content
if (!analyticsBlock[0].includes('tab === "analytics"')) {
  console.error("ABORT: analytics block doesn't start with expected content");
  process.exit(1);
}
if (!sidebarLine.includes('id: "analytics"')) {
  console.error("ABORT: sidebar line doesn't contain id: analytics");
  process.exit(1);
}

// ─── Step 3: Find insertion points in current file ─────────────────
console.log("");
console.log("Step 3: Finding insertion points in current file");

// Sidebar: insert AFTER line containing market_intelligence
let sidebarInsertIdx = -1;
for (let i = 0; i < currentLines.length; i++) {
  if (currentLines[i].includes('id: "market_intelligence"') &&
      currentLines[i].includes("Market Intel")) {
    sidebarInsertIdx = i + 1;  // insert AFTER this line
    console.log("  Sidebar insert AFTER line " + (i + 1) + ": " + currentLines[i].trim().substring(0, 80));
    break;
  }
}

if (sidebarInsertIdx === -1) {
  console.error("ABORT: could not find market_intelligence sidebar entry");
  process.exit(1);
}

// Render: insert AFTER line containing digest tab render, BEFORE cancellation
let renderInsertIdx = -1;
for (let i = 0; i < currentLines.length; i++) {
  if (currentLines[i].includes('tab === "digest"') &&
      currentLines[i].includes("DigestTab")) {
    // Insert after the digest render line
    // But check if next non-blank line is cancellation
    let nextIdx = i + 1;
    while (nextIdx < currentLines.length && currentLines[nextIdx].trim() === "") nextIdx++;
    if (nextIdx < currentLines.length && currentLines[nextIdx].includes('tab === "cancellation"')) {
      renderInsertIdx = nextIdx;  // insert before cancellation
      console.log("  Render insert at line " + (renderInsertIdx + 1) + " (before cancellation)");
      break;
    }
  }
}

if (renderInsertIdx === -1) {
  console.error("ABORT: could not find digest/cancellation insertion point");
  process.exit(1);
}

// ─── Step 4: Apply insertions (in REVERSE order to keep indices valid) ──
console.log("");
console.log("Step 4: Inserting blocks");

let resultLines = currentLines.slice();

// Insert render block first (it's later in file - higher index)
console.log("  Inserting Analytics render block (" + analyticsBlock.length + " lines) at line " + (renderInsertIdx + 1));
resultLines.splice(renderInsertIdx, 0, ...analyticsBlock);

// Then insert sidebar button (earlier in file - lower index)
console.log("  Inserting sidebar button at line " + (sidebarInsertIdx + 1));
resultLines.splice(sidebarInsertIdx, 0, sidebarLine);

console.log("");
console.log("Step 5: Verification");
console.log("  Original lines:  " + currentLines.length.toLocaleString());
console.log("  New lines:       " + resultLines.length.toLocaleString());
console.log("  Added:           " + (resultLines.length - currentLines.length) + " lines (expected ~2,890)");

const finalContent = resultLines.join("\n");
const finalMojibake = (finalContent.match(/\u00C3/g) || []).length + (finalContent.match(/\u00E2/g) || []).length;
console.log("  Mojibake:        " + finalMojibake);

if (finalMojibake > 50) {
  console.error("ABORT: result has mojibake");
  process.exit(1);
}

// ─── Step 6: Write ─────────────────────────────────────────────────
fs.writeFileSync(path.join(process.cwd(), TARGET_FILE), finalContent, { encoding: "utf8" });

const writtenBytes = fs.readFileSync(path.join(process.cwd(), TARGET_FILE));
const writtenContent = writtenBytes.toString("utf8");
const writtenMojibake = (writtenContent.match(/\u00C3/g) || []).length + (writtenContent.match(/\u00E2/g) || []).length;

console.log("  Wrote " + writtenBytes.length.toLocaleString() + " bytes");
console.log("  Mojibake on disk: " + writtenMojibake);

console.log("");
console.log("DONE. Next steps:");
console.log("  1. npm run build");
console.log("  2. Verify in incognito browser");
console.log("  3. git add + commit + push");
console.log("");