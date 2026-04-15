/**
 * fix-billing-users-encoding.js
 *
 * Restores BillingTab.jsx and UsersTab.jsx from clean commit 94be360,
 * then applies the legitimate pricing change to BillingTab only.
 *
 * UsersTab had no pricing changes - my Session 9 PowerShell script
 * corrupted it for no reason during a folder-wide operation.
 *
 * Run: node scripts/fix-billing-users-encoding.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const CLEAN_COMMIT = "94be360";

console.log("");
console.log("=== BillingTab + UsersTab Encoding Fix ===");
console.log("");

// ─── Helper: get clean file from git ────────────────────────────────
function getCleanFile(filePath) {
  return execSync(
    "git cat-file -p " + CLEAN_COMMIT + ":" + filePath,
    { encoding: "utf8", maxBuffer: 50 * 1024 * 1024 }
  );
}

function checkClean(content, label) {
  const aHat = (content.match(/\u00E2/g) || []).length;
  const aTilde = (content.match(/\u00C3/g) || []).length;
  console.log("  " + label + ": " + aHat + " a-hat, " + aTilde + " A-tilde");
  if (aHat > 50 || aTilde > 50) {
    console.error("ABORT: source not clean");
    process.exit(1);
  }
}

// ─── UsersTab.jsx (no edits needed - just restore) ──────────────────
console.log("Step 1: Restoring src/admin/UsersTab.jsx (no edits needed)");
const usersClean = getCleanFile("src/admin/UsersTab.jsx");
const usersLines = usersClean.split("\n").length;
console.log("  Read " + usersClean.length.toLocaleString() + " characters, " + usersLines + " lines");
checkClean(usersClean, "UsersTab clean");

fs.writeFileSync(
  path.join(process.cwd(), "src/admin/UsersTab.jsx"),
  usersClean,
  { encoding: "utf8" }
);

// Verify on disk
const usersWritten = fs.readFileSync(path.join(process.cwd(), "src/admin/UsersTab.jsx"), "utf8");
checkClean(usersWritten, "UsersTab on disk");

// ─── BillingTab.jsx (restore + apply pricing edit) ─────────────────
console.log("");
console.log("Step 2: Restoring src/admin/BillingTab.jsx + applying pricing edit");
const billingClean = getCleanFile("src/admin/BillingTab.jsx");
const billingLines = billingClean.split("\n").length;
console.log("  Read " + billingClean.length.toLocaleString() + " characters, " + billingLines + " lines");
checkClean(billingClean, "BillingTab clean");

// Apply pricing edit: import PRICING + replace local constant
const oldImport = 'import { T } from "../theme";';
const newImports = 'import { T } from "../theme";\nimport { PRICING } from "../config/pricing";';

const oldPrices = "const PRICES = { pro: 99, enterprise: 499, pro_trial: 0, free: 0 };";
const newPrices = "const PRICES = { pro: PRICING.pro, enterprise: PRICING.enterprise, pro_trial: 0, free: 0 };";

let billingFixed = billingClean;

if (billingFixed.includes(oldImport)) {
  billingFixed = billingFixed.replace(oldImport, newImports);
  console.log("  [OK] Added PRICING import");
} else {
  console.log("  [SKIP] Import line not found - leaving as-is");
}

if (billingFixed.includes(oldPrices)) {
  billingFixed = billingFixed.replace(oldPrices, newPrices);
  console.log("  [OK] Updated PRICES constant to use PRICING config");
} else {
  console.log("  [WARN] PRICES constant not found - leaving hardcoded values");
}

checkClean(billingFixed, "BillingTab with edits");

fs.writeFileSync(
  path.join(process.cwd(), "src/admin/BillingTab.jsx"),
  billingFixed,
  { encoding: "utf8" }
);

const billingWritten = fs.readFileSync(path.join(process.cwd(), "src/admin/BillingTab.jsx"), "utf8");
checkClean(billingWritten, "BillingTab on disk");

console.log("");
console.log("DONE. Next steps:");
console.log("  1. npm run build");
console.log("  2. git add + commit + push");
console.log("");