# DXB Analytics — Full Handover Report
## Session 17 — April 30, 2026

---

## Platform Overview
- **Live URL:** emaar-dashboard.pages.dev
- **Repo:** github.com/mianwaleed689/emaar-dashboard
- **Firebase Project:** dxb-analytics
- **Stack:** React 19.2 + Vite 5.4 + Firebase 12.11
- **Deploy:** Cloudflare Pages (auto-deploy on git push)

---

## What Was In The Handoff Document (Start of Session 17)

### Already Done Before This Session:
- DLD Mashrooi API integration (auto-auth, token refresh)
- Project name enrichment (1,374/1,663 renamed with real DLD names)
- Unit breakdown + floors + GPS scraper (scrape-mashrooi-details.js)
- Auto-sync scheduler (PM2, nightly 2AM → changed to 1PM)
- New launch detector (detect-new-launches.js)
- Identity tab hierarchy (LAND OWNER + MASTER ZONE labels)
- Project card header (DEVELOPER · COMMUNITY — MASTER ZONE)
- Map tab rebuild (GPS clusters + sidebar)
- unitBreakdown format fix (array → object)
- Notification bell (sync-notifications.js)
- DLD transaction fetcher v1 (bad data, cleared)

### Pending From Handoff:
- fetch-dld-transactions.js v2 (all fields)
- Admin Editor UI
- Broker scraper overnight run
- ProjectDetail.jsx hierarchy
- DXB Estimate AI valuation

---

## What We Did In Session 17 (Today)

### 1. Developer Name Normalization (COMPLETED)
**Script:** scripts/normalize-developers.js
**Script:** scripts/normalize-developers-v2.js
- Round 1: 690 projects cleaned (Emaar Development P.J.S.C. → Emaar Properties etc.)
- Round 2: 724 more projects cleaned (all DAMAC variants, Samana entities, Imtiaz variants, Ellington variants, Aurora SPV 1/2/3 → Aurora Real Estate, Prestige variants, Expo City variants)
- L.L.C suffix removal from 767 projects
- Final: 548 unique clean brand names (down from 647)

**Top developers now:**
```
187 Emaar Properties
71  Nakheel
63  DAMAC Properties
58  Azizi Developments
43  Samana Developers
35  Binghatti
33  Dubai Properties
32  Octa Properties
30  Imtiaz Developments
24  Sobha Realty
```

### 2. Data Quality Fixes (COMPLETED)
- **67 duplicate projects removed** (seed data vs DLD-synced records)
- **100 projects status fixed** (100% built → Ready)
- **750 projects status normalized** (Announced/Pending → Off-Plan)
- **Final status:** 1,508 Off-Plan + 152 Ready

### 3. Map Tab — GPS Fix (COMPLETED)
**File:** src/tabs/CommunityMapTab.jsx
- Fixed: `activeProjects` was using `liveProjects` (seed data) instead of `extraProjects` (Firestore)
- Fixed: GPS reads `p.coordinates.lat/lng` object AND `p.lat/p.lng` flat fields
- Fixed: Map center `[25.1, 55.2]` properly centered on Dubai
- Now shows 1,649 real GPS pins with MarkerCluster

### 4. Scheduler — Updated to 1PM Dubai (COMPLETED)
**File:** scripts/scheduler.js (clean rewrite)
```
1:00 PM Dubai (9:00 AM UTC)  — Auto-sync (constructionPct, status)
1:25 PM Dubai (9:25 AM UTC)  — sync-notifications.js
1:30 PM Dubai (9:30 AM UTC)  — detect-new-launches.js
1:45 PM Dubai (9:45 AM UTC)  — fetch-dld-transactions.js
Sunday 1:00 PM Dubai         — scrape-mashrooi-details.js (full refresh)
```
- PM2 running: `dxb-sync` process online
- Windows startup: DXB-Sync.bat in Startup folder

### 5. Sync Notifications (COMPLETED)
**File:** scripts/sync-notifications.js
- Reads sync_log for today
- Writes to Firestore `notifications` collection (userId: "all")
- Triggers: project COMPLETE (100%), CANCELLED, major progress jump (10%+)
- 13 notifications written today including 4 Jebel Ali Village completions
- Firestore rules fixed: userId == "all" now readable by all authenticated users

### 6. Developer Dropdown Fix (COMPLETED)
**File:** src/tabs/ProjectsTab.jsx
- Dropdown now uses `developerActual` (clean brand names)
- Shows only developers with 2+ projects in dropdown
- Search box now searches `developerActual` field
- Agents can still find any developer via text search

### 7. unitBreakdown Bug Fixes (COMPLETED)
**File:** src/tabs/ProjectsTab.jsx
- Fixed `computeUnitMix` to handle object format
- Fixed `u.type/u.count` → correct variable names in mix.map context
- Fixed `p is not defined` → changed to `selectedProject`
- Fixed lines 798, 1857, 2269

### 8. DLD Transaction Fetcher v2 (COMPLETED)
**File:** scripts/fetch-dld-transactions.js
- API: `https://data.dubai/o/dda/data-services/dataset-metadata?datasetId=470061&page=N&pageSize=1000`
- No authentication needed (government public API)
- 67 pages × 1,000 rows = 67,000 transactions available
- **59,920 transactions imported** with full fields:
  - transactionId, date, price, ppsf (meter_sale_price)
  - projectName, masterProject, buildingName, areaName
  - rooms, propertyType, propertySubType, hasParking
  - procedureName, transGroup, regType
  - nearestMetro, nearestMall, nearestLandmark
  - projectNumber (links to our projects collection!)
- Daily fetch: `node scripts/fetch-dld-transactions.js` (pages 1-5, ~5,000 latest)
- Bulk import: `node scripts/fetch-dld-transactions.js --bulk` (all 67 pages)

---

## Current Platform Data State

```
Total projects:       1,660
Off-Plan:             1,508
Ready:                152
With GPS:             1,649
Unique developers:    548
With masterCommunity: 1,660/1,660 (100%)
With masterDeveloper: 1,660/1,660 (100%)
Transactions:         59,920 (v2 full fields)
```

---

## Key File Map

```
scripts/auto-sync.js                  Nightly DLD sync (constructionPct, status)
scripts/detect-new-launches.js        New project detector
scripts/scheduler.js                  PM2 cron scheduler (1PM Dubai)
scripts/sync-notifications.js         Writes bell notifications
scripts/fetch-dld-transactions.js     DLD transaction fetcher v2
scripts/scrape-mashrooi-details.js    Unit breakdown/floors/GPS (weekly Sunday)
scripts/normalize-developers.js       Brand name normalization pass 1
scripts/normalize-developers-v2.js    Brand name normalization pass 2
src/tabs/CommunityMapTab.jsx          Map tab (GPS clusters + sidebar)
src/tabs/ProjectsTab.jsx              Projects tab (unitBreakdown object format)
src/pages/EmaarDashboardV2.jsx        Main dashboard (line 4597: extraProjects fix)
firestore.rules                       Fixed: notifications userId=="all" readable
```

---

## Daily Automation (Running on Your PC)

| Time | Job | Output |
|------|-----|--------|
| 1:00 PM | Auto-sync | Updates constructionPct, status for 1,660 projects |
| 1:25 PM | Notifications | Writes completed/cancelled/progress alerts to bell |
| 1:30 PM | New launches | Adds new DLD projects within 24hrs |
| 1:45 PM | Transactions | Downloads latest ~5,000 DLD transactions |
| Sunday 1PM | Full refresh | Updates units/floors/beds/GPS for all projects |

**PM2 Commands:**
```
pm2 status              — check if running
pm2 restart dxb-sync    — restart scheduler
pm2 logs dxb-sync       — see recent logs
```

**Sync Log Check:**
```
node -e "
const admin = require('firebase-admin');
const sa = require('./serviceAccountKey.json');
admin.initializeApp({credential:admin.credential.cert(sa)});
admin.firestore().collection('sync_logs').orderBy('timestamp','desc').limit(1).get()
  .then(s=>{s.docs.forEach(d=>console.log(d.data()));process.exit(0)});
"
```

---

## Critical Rules (NEVER VIOLATE)

1. **NEVER use Save-UTF8 or Set-Content on EmaarDashboardV2.jsx** — encoding corruption
2. **Only use Node.js scripts** to modify EmaarDashboardV2.jsx
3. unitBreakdown is **object** `{"Studio":192}` NOT array
4. GPS stored as `p.coordinates.lat/lng` (object) OR `p.lat/p.lng` (flat)
5. Developer field: use `developerActual` for display, `developer` = DLD land owner
6. All map layers need null coord checks before L.circleMarker()

---

## What Still Needs To Be Done (Priority Order)

### PRIORITY 1 — Fix Before Launch (Bugs)
1. **Project drawer tabs crashing** — unitBreakdown errors still intermittent on some projects
2. **Button encoding** — â†, Ã¢â€ garbled characters on WhatsApp/Email/Copy buttons
3. **Notification bell empty state** — \uD83D\uDD14 showing as text not emoji
4. **Handover tab** — reported issue, needs testing
5. **Neighbourhoods tab** — reported issue, needs testing
6. **Yield inconsistency** — project yield (10.1%) vs community yield (6.9%) on same project

### PRIORITY 2 — Connect Transaction Data (High Value)
7. **DLD Volumes tab** — connect to real `transactions` Firestore collection
8. **Price History tab** — connect to real `transactions` Firestore collection  
9. **Community PPSF update** — recalculate from 59,920 real transactions
10. **Comparable sales** — show last 5 DLD sales in project drawer
11. **Add transactions fetch to scheduler** — currently not in scheduler yet

### PRIORITY 3 — New Features
12. **Admin Editor** — UI to fix wrong developer/community without running scripts
13. **ProjectDetail.jsx** — add masterDeveloper + masterCommunity to /project/xxx page
14. **DXB Estimate** — AI valuation using comparable transactions
15. **Developer Intelligence tab** — track record, delivery history
16. **Broker scraper** — `node scripts/scrape-brokers.js` overnight (33,827 brokers)
17. **VPS for 24/7 sync** — currently only syncs when PC is on (AED 15/month DigitalOcean)
18. **Mobile responsiveness** — not tested on mobile yet

### PRIORITY 4 — Data Quality
19. **GPS accuracy** — many projects use default [25.276987, 55.296249] (Downtown Dubai fallback)
20. **Gross yield accuracy** — needs recalculation from real transaction data
21. **PPSF per project** — match transactions.projectNumber to projects collection

---

## Transaction Data API (Free, No Auth)

```
Endpoint: https://data.dubai/o/dda/data-services/dataset-metadata?datasetId=470061&page=N&pageSize=1000
Pages: 67 total (~67,000 rows)
Updates: New transactions added daily by DLD
Fields: 30+ fields including price, ppsf, rooms, metro, masterProject
```

---

## How To Re-Run Key Scripts

```powershell
# Re-normalize developer names
node scripts/normalize-developers-v2.js

# Re-fetch all transactions (bulk)
node scripts/fetch-dld-transactions.js --bulk

# Re-scrape full details (units/floors/beds)
node scripts/scrape-mashrooi-details.js

# Fix duplicate projects
node scripts/remove-duplicates.js

# Check sync health
pm2 status
pm2 logs dxb-sync --lines 20
```

---

## Environment Setup (For New Session)

```
Repo: C:\Users\TAD\emaar-dashboard
Node: v24.14.0
PM2: Running as dxb-sync
Firebase: dxb-analytics project
Cloudflare: emaar-dashboard.pages.dev
GitHub: github.com/mianwaleed689/emaar-dashboard
```

**First thing to check in any new session:**
```powershell
cd C:\Users\TAD\emaar-dashboard
pm2 status
git status
git log --oneline -5
```

