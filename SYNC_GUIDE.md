# DXB Analytics — Data Sync Guide

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
