const fs = require("fs");

// Add sync trigger to package.json scripts
const pkg = JSON.parse(fs.readFileSync("package.json","utf8"));
pkg.scripts["sync:communities"] = "node scripts/sync-communities-from-projects.js";
pkg.scripts["sync:all"] = "npm run sync:communities";
fs.writeFileSync("package.json", JSON.stringify(pkg,null,2), "utf8");
console.log("Added sync scripts to package.json");

// Create a README for the sync process
const readme = `# DXB Analytics — Data Sync Guide

## When to run syncs:

### After adding/updating projects:
npm run sync:communities

### After new DLD transactions CSV:
1. Download from Dubai Pulse
2. Copy to data/dld-area-stats.json  
3. node scripts/seed-dld-scores.js

### After quarterly yield research:
node scripts/seed-verified-communities.js --apply
node scripts/fix-data-quality.js

### Full data refresh (quarterly):
npm run sync:all

## What each sync does:
sync:communities  → Updates community scores from project data
                    Recalculates supply risk
                    Updates PPSF from project prices
                    Propagates to ALL 25 connected tabs
`;

fs.writeFileSync("SYNC_GUIDE.md", readme, "utf8");
console.log("SYNC_GUIDE.md created");