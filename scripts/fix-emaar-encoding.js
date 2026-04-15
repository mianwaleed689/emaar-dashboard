/**
 * fix-emaar-encoding.js
 *
 * Reconstructs src/EmaarDashboardV2.jsx with proper UTF-8 encoding.
 * Same approach as AdminPanel fix - read clean baseline from git, re-apply
 * legitimate edits via Node, write proper UTF-8.
 *
 * Baseline: f4abee3 (last clean commit before encoding corruption)
 *
 * Re-applies:
 * - liveFinancials orphan state removal (was commit 11082d9)
 * - KYC/Verification user-side feature removal (was commit e76eb8a Phase C)
 *
 * Run: node scripts/fix-emaar-encoding.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const CLEAN_COMMIT = "f4abee3";
const TARGET_FILE = "src/EmaarDashboardV2.jsx";
const OUTPUT_PATH = path.join(process.cwd(), TARGET_FILE);

console.log("");
console.log("=== EmaarDashboardV2.jsx Encoding Fix ===");
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

const initMojibake = (cleanSource.match(/\u00E2/g) || []).length;
console.log("  Mojibake (â) in source: " + initMojibake);
if (initMojibake > 100) {
  console.error("ABORT: source is not clean");
  process.exit(1);
}

// ─── Step 2: Define deletion ranges (1-indexed) ────────────────────
const deletions = [
  { name: "Block A: KYC state declarations (6 useState)",  startLine: 2083, endLine: 2088 },
  { name: "Block B: liveFinancials state",                 startLine: 2117, endLine: 2117 },
  { name: "Block C: liveFinancials tabKeys entry",         startLine: 2823, endLine: 2823 },
  { name: "Block D: liveFinancials standalone listener",   startLine: 2943, endLine: 2947 },
  { name: "Block E: KYC populate setters (3)",             startLine: 3083, endLine: 3085 },
  { name: "Block F: submitKYC handler + comment",          startLine: 3433, endLine: 3450 },
  { name: "Block G: Profile badge",                        startLine: 5069, endLine: 5069 },
  { name: "Block H: KYC status section",                   startLine: 5095, endLine: 5120 },
  { name: "Block I: KYC modal + comment",                  startLine: 5125, endLine: 5171 },
];

// ─── Step 3: Verify boundaries ─────────────────────────────────────
console.log("");
console.log("Step 2: Verifying deletion boundaries...");

const verifications = [
  { line: 2083, contains: "isVerified, setIsVerified"        },
  { line: 2088, contains: "kycStatus, setKycStatus"          },
  { line: 2117, contains: "liveFinancials, setLiveFinancials" },
  { line: 2823, contains: 'key: "financials"'                },
  { line: 2943, contains: "FINANCIALS"                       },
  { line: 2947, contains: "}, () => {}));"                   },
  { line: 3083, contains: "setIsVerified"                    },
  { line: 3085, contains: "setKycStatus"                     },
  { line: 3433, contains: "// KYC SUBMIT FUNCTION"           },
  { line: 3434, contains: "const submitKYC"                  },
  { line: 3450, contains: "};"                               },
  { line: 5069, contains: "isVerified && <div"               },
  { line: 5095, contains: "KYC VERIFICATION SECTION"         },
  { line: 5120, contains: "</div>"                           },
  { line: 5125, contains: "KYC VERIFICATION MODAL"           },
  { line: 5126, contains: "showKYC && ("                     },
  { line: 5171, contains: ")}"                               },
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
const finalMojibake = (finalContent.match(/\u00E2/g) || []).length;

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
const writtenMojibake = (writtenContent.match(/\u00E2/g) || []).length;

console.log("  Wrote " + writtenBytes.length.toLocaleString() + " bytes");
console.log("  Mojibake on disk: " + writtenMojibake);

console.log("");
console.log("DONE. Next steps:");
console.log("  1. npm run build");
console.log("  2. node verify (em-dashes, arrows present)");
console.log("  3. git add + commit + push");
console.log("");