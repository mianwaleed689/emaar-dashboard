/**
 * fix-adminpanel-encoding.js
 *
 * Reconstructs src/AdminPanel.jsx with proper UTF-8 encoding by:
 * 1. Reading clean version from commit 82e1110 (last clean baseline)
 * 2. Removing the 4 deleted tabs by exact line ranges
 * 3. Writing with Node's native UTF-8 (no PowerShell decoder)
 *
 * Run: node scripts/fix-adminpanel-encoding.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const CLEAN_COMMIT = "82e1110";
const TARGET_FILE = "src/AdminPanel.jsx";
const OUTPUT_PATH = path.join(process.cwd(), TARGET_FILE);

console.log("");
console.log("=== AdminPanel.jsx Encoding Fix ===");
console.log("");

// ─── Step 1: Read clean source from git (binary-safe) ──────────────
console.log("Step 1: Extracting clean version from " + CLEAN_COMMIT);
const cleanSource = execSync(
  "git cat-file -p " + CLEAN_COMMIT + ":" + TARGET_FILE,
  { encoding: "utf8", maxBuffer: 100 * 1024 * 1024 }
);

const lines = cleanSource.split("\n");
console.log("  Read " + cleanSource.length.toLocaleString() + " characters");
console.log("  Lines: " + lines.length.toLocaleString());

const initMojibake = (cleanSource.match(/\u00C3/g) || []).length;
console.log("  Mojibake in source: " + initMojibake);
if (initMojibake > 100) {
  console.error("ABORT: source is not clean");
  process.exit(1);
}

// ─── Step 2: Define deletion ranges (1-indexed) - CORRECTED ────────
const deletions = [
  { name: "Block A: EmailCampaigns function + header", startLine: 30,    endLine: 192   },
  { name: "Block B: Forecasting import",                startLine: 17,    endLine: 17    },
  { name: "Block C: Sidebar Campaigns button",          startLine: 15062, endLine: 15062 },
  { name: "Block D: Sidebar Verification button",       startLine: 15064, endLine: 15064 },
  { name: "Block E: Sidebar Analytics button",          startLine: 15065, endLine: 15065 },
  { name: "Block F: Sidebar Forecasting button",        startLine: 15074, endLine: 15074 },
  { name: "Block G: Render Campaigns",                  startLine: 19186, endLine: 19186 },
  { name: "Block H: Render Verification",               startLine: 19191, endLine: 19552 },
  { name: "Block I: Render Analytics",                  startLine: 19557, endLine: 22445 },
  { name: "Block J: Render Forecasting",                startLine: 22769, endLine: 22769 },
];

// ─── Step 3: Verify each boundary by content ───────────────────────
console.log("");
console.log("Step 2: Verifying deletion boundaries...");

const verifications = [
  { line: 17,    contains: "import ForecastingTab"          },
  { line: 30,    contains: "/*"                             },
  { line: 31,    contains: "EMAIL CAMPAIGNS"                },
  { line: 33,    contains: "function EmailCampaignsTab"     },
  { line: 192,   contains: "}"                              },
  { line: 15062, contains: 'id: "campaigns"'                },
  { line: 15064, contains: 'id: "verification"'             },
  { line: 15065, contains: 'id: "analytics"'                },
  { line: 15074, contains: 'id: "forecasting"'              },
  { line: 19186, contains: 'tab === "campaigns"'            },
  { line: 19191, contains: 'tab === "verification"'         },
  { line: 19552, contains: ""                               },  // could be blank or any line
  { line: 19553, contains: "EMAIL DIGEST"                   },  // proves verification ended at 19552
  { line: 19557, contains: 'tab === "analytics"'            },
  { line: 22445, contains: "*/}"                            },
  { line: 22446, contains: 'tab === "cancellation"'         },  // proves analytics ends at 22445
  { line: 22769, contains: 'tab === "forecasting"'          },
];

let allValid = true;
for (const v of verifications) {
  const lineContent = lines[v.line - 1] || "";
  const ok = lineContent.includes(v.contains);
  const marker = ok ? "OK  " : "FAIL";
  console.log("  [" + marker + "] line " + v.line + " contains '" + v.contains + "'");
  if (!ok) {
    console.log("       actual: " + lineContent.substring(0, 120));
    allValid = false;
  }
}

if (!allValid) {
  console.error("");
  console.error("ABORT: boundary verification failed");
  process.exit(1);
}

// ─── Step 4: Delete in REVERSE order ───────────────────────────────
console.log("");
console.log("Step 3: Removing blocks (reverse order)...");

const sortedDeletions = deletions.slice().sort((a, b) => b.startLine - a.startLine);

let resultLines = lines.slice();
let totalRemoved = 0;
for (const del of sortedDeletions) {
  const removeCount = del.endLine - del.startLine + 1;
  resultLines.splice(del.startLine - 1, removeCount);
  totalRemoved += removeCount;
  console.log("  " + del.name + ": removed " + removeCount + " lines");
}

console.log("  Total removed: " + totalRemoved + " lines");

// ─── Step 5: Write with native Node UTF-8 ──────────────────────────
console.log("");
console.log("Step 4: Writing output...");

const finalContent = resultLines.join("\n");
const finalMojibake = (finalContent.match(/\u00C3/g) || []).length;

console.log("  Final lines: " + resultLines.length.toLocaleString());
console.log("  Final chars: " + finalContent.length.toLocaleString());
console.log("  Mojibake:    " + finalMojibake);

if (finalMojibake > 0) {
  console.error("ABORT: result has mojibake");
  process.exit(1);
}

fs.writeFileSync(OUTPUT_PATH, finalContent, { encoding: "utf8" });

const writtenBytes = fs.readFileSync(OUTPUT_PATH);
const writtenContent = writtenBytes.toString("utf8");
const writtenMojibake = (writtenContent.match(/\u00C3/g) || []).length;

console.log("  Wrote " + writtenBytes.length.toLocaleString() + " bytes");
console.log("  Mojibake on disk: " + writtenMojibake);

console.log("");
console.log("DONE. Next steps:");
console.log("  1. npm run build");
console.log("  2. git diff --stat src/AdminPanel.jsx");
console.log("  3. git add + commit + push");
console.log("");