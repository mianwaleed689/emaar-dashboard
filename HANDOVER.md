# DXB Analytics — Full Handover Report
## Session 18 — May 1, 2026

---

## Platform Overview
- **Live URL:** emaar-dashboard.pages.dev
- **Repo:** github.com/mianwaleed689/emaar-dashboard
- **Firebase Project:** dxb-analytics
- **Stack:** React 19.2 + Vite 5.4 + Firebase 12.11
- **Deploy:** Cloudflare Pages (auto-deploy on git push)

---

## What We Did In Session 18 (Today)

### 1. DLD Volumes Tab — Real Data (COMPLETED)
**Script:** scripts/aggregate-dld-volumes.js
- Aggregated 58,609 real DLD transactions into tabData/dldVolumes
- 183 communities with real PPSF, transaction counts, value, off-plan %
- Fixed ppsf field: stored as AED/sqm, converted to AED/sqft (/10.764)
- Used masterProject field for community names (not areaName)
- Top communities: JVC 3,434tx, Business Bay 2,816tx, Dubai Marina 2,366tx

### 2. Price History Tab — Real Data (COMPLETED)
**Script:** scripts/aggregate-price-history.js
- 113 community price history docs written to priceHistory collection
- Year-by-year PPSF trends going back to 2012
- 1Y and 5Y change calculations
- PriceHistoryTab updated to use real yearData from Firestore
- Communities dropdown now shows real communities

### 3. Daily Scheduler — Auto-Updated (COMPLETED)
**File:** scripts/scheduler.js
- Added to daily schedule:
  - 1:45 PM — fetch-dld-transactions.js (latest transactions)
  - 1:55 PM — aggregate-dld-volumes.js
  - 2:00 PM — aggregate-price-history.js
- PM2 restarted with new schedule

### 4. DLD Sales Tab in Project Drawer (COMPLETED)
**File:** src/tabs/ProjectsTab.jsx
**Component:** DLDSalesPanel
- New tab added to project drawer: Identity, Location... Full Report, DLD Sales
- Queries Firestore transactions collection live
- Building-level match first (projectName), fallback to community
- 4 KPI cards: Transactions, Avg Price, Avg PPSF, vs Project PPSF
- New launch premium intelligence (not a warning)
- Beds filter: All / Studio / 1BR / 2BR / 3BR / 4BR
- Color coded PPSF: green = below project, red = above
- Building name column showing real DLD building names
- Community data vs Building data badge
- Firestore rule added: transactions collection readable by isAuthed()
- Composite index created: masterProject + transGroup + date DESC

### 5. WhatsApp Button Encoding Fixed (COMPLETED)
**File:** src/pages/EmaarDashboardV2.jsx
- Lines 4734 and 4859: garbled UTF-8 chars replaced with clean unicode
- HANDOVER UPDATE and DXB ANALYTICS share buttons now send clean text

### 6. Refresh Preserves Drawer Tab (COMPLETED)
**File:** src/pages/EmaarDashboardV2.jsx
- globalRefresh now saves projDetailTab to sessionStorage
- On reload, projDetailTab restored from sessionStorage
- User stays on same drawer tab after refresh

---

## Current Platform Data State

`
Total projects:       1,660
Off-Plan:             1,508
Ready:                152
With GPS:             1,649
Unique developers:    548
Transactions:         58,609 (v2 full fields)
DLD Volumes:          183 communities (real data)
Price History:        113 community docs (real data)
`

---

## Key File Map

`
scripts/aggregate-dld-volumes.js      Aggregates transactions into tabData/dldVolumes
scripts/aggregate-price-history.js    Aggregates transactions into priceHistory
scripts/fetch-dld-transactions.js     DLD transaction fetcher v2
scripts/scheduler.js                  PM2 cron (1PM-2PM Dubai)
src/tabs/ProjectsTab.jsx              Projects tab + DLDSalesPanel component
src/tabs/DLDVolumesTab.jsx            DLD Volumes tab (reads tabData/dldVolumes)
src/tabs/PriceHistoryTab.jsx          Price History tab (reads priceHistory)
src/pages/EmaarDashboardV2.jsx        Main dashboard
firestore.rules                       Added transactions + sync_logs rules
`

---

## Daily Automation (Running on Your PC)

| Time | Job | Output |
|------|-----|--------|
| 1:00 PM | Auto-sync | Updates constructionPct, status |
| 1:25 PM | Notifications | Bell alerts |
| 1:30 PM | New launches | New DLD projects |
| 1:45 PM | Transactions | Latest ~5,000 DLD transactions |
| 1:55 PM | Aggregate volumes | Updates DLD Volumes tab |
| 2:00 PM | Aggregate price history | Updates Price History tab |
| Sunday 1PM | Full refresh | Units/floors/GPS |

---

## What Still Needs To Be Done (Priority Order)

### PRIORITY 1 — Fix Before Launch (Bugs)
1. **Button encoding on project cards** — ROI ->, Details -> garbled
2. **Notification bell emoji** — showing as text not emoji
3. **Yield inconsistency** — project yield vs community yield mismatch
4. **Handover tab** — reported issue, needs testing
5. **Neighbourhoods tab** — reported issue, needs testing

### PRIORITY 2 — Connect Transaction Data (High Value)
6. **Community PPSF update** — recalculate from real transactions
7. **Gross yield accuracy** — recalculate from real transaction data
8. **PPSF per project** — match transactions.projectNumber to projects

### PRIORITY 3 — New Features
9. **Admin Editor** — UI to fix wrong developer/community
10. **ProjectDetail.jsx** — add masterDeveloper + masterCommunity
11. **DXB Estimate** — AI valuation using comparable transactions
12. **Developer Intelligence tab** — track record, delivery history
13. **VPS for 24/7 sync** — AED 15/month DigitalOcean
14. **Mobile responsiveness** — not tested

### PRIORITY 4 — Data Quality
15. **GPS accuracy** — many projects use default Downtown Dubai fallback
16. **DLD Sales tab** — KPI cards scrolled out of view (UX fix needed)

---

## Critical Rules (NEVER VIOLATE)

1. NEVER use Save-UTF8 or Set-Content on EmaarDashboardV2.jsx
2. Only use Node.js scripts to modify EmaarDashboardV2.jsx
3. unitBreakdown is object {Studio:192} NOT array
4. GPS stored as p.coordinates.lat/lng OR p.lat/p.lng
5. Developer field: use developerActual for display
6. ppsf in transactions = AED/sqm, divide by 10.764 for AED/sqft
7. Use masterProject field (not areaName) for community grouping

---

## Environment Setup

`
Repo: C:\Users\TAD\emaar-dashboard
Node: v24.14.0
PM2: Running as dxb-sync
Firebase: dxb-analytics project
Cloudflare: emaar-dashboard.pages.dev
GitHub: github.com/mianwaleed689/emaar-dashboard
`

**First thing in any new session:**
`powershell
cd C:\Users\TAD\emaar-dashboard
pm2 status
git status
git log --oneline -5
`