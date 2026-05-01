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

## What We Did In Session 18

### 1. DLD Volumes Tab — Real Data (COMPLETED)
- Script: scripts/aggregate-dld-volumes.js
- 183 communities with real PPSF, transaction counts, off-plan %
- Uses masterProject field for community names
- ppsf field is AED/sqm — divide by 10.764 for AED/sqft

### 2. Price History Tab — Real Data (COMPLETED)
- Script: scripts/aggregate-price-history.js
- 113 community price history docs in priceHistory collection
- Year-by-year PPSF trends back to 2012
- PriceHistoryTab uses real yearData from Firestore

### 3. DLD Sales Tab in Project Drawer (COMPLETED)
- Component: DLDSalesPanel in src/tabs/ProjectsTab.jsx
- Queries transactions collection live per community
- Building-level match first, fallback to community
- KPI cards: Transactions, Avg Price, Avg PPSF, vs Project PPSF
- New launch premium intelligence (not a red warning)
- Beds filter, color coded PPSF, building name column
- Firestore rule added: transactions readable by isAuthed()
- Composite index: masterProject + transGroup + date DESC

### 4. Yield Calculator (COMPLETED)
- Script: scripts/fetch-rental-benchmarks.js
- Rental benchmarks from Bayut 2025 + Property Finder + Property Monitor
- 15 verified communities with exact benchmarks
- Calculates gross yield = annual rent / avg DLD sale price
- Results written to yieldData collection
- Script: scripts/aggregate-yields.js converts to tabData/yieldSummary
- 52 communities now showing in Yields tab
- Runs every Friday 2:30 PM + 2:35 PM Dubai time

### 5. Scheduler Updates (COMPLETED)
- 1:45 PM — fetch-dld-transactions.js
- 1:55 PM — aggregate-dld-volumes.js
- 2:00 PM — aggregate-price-history.js
- Friday 2:30 PM — fetch-rental-benchmarks.js
- Friday 2:35 PM — aggregate-yields.js
- Sunday 1:00 PM — scrape-mashrooi-details.js

### 6. WhatsApp Button Encoding Fixed
- Lines 4734 + 4859 in EmaarDashboardV2.jsx
- Clean unicode replacing garbled UTF-8

### 7. Refresh Preserves Drawer Tab
- projDetailTab saved to sessionStorage on refresh
- Restored on page reload

---

## Current Data State

`
Total projects:        1,660
Transactions:          58,609
DLD Volumes:           183 communities
Price History:         113 community docs
Yield Data:            52 communities (verified)
Firestore indexes:     3 (masterProject+transGroup+date, transGroup+date, masterProject+transGroup+date)
`

---

## Full Scheduler

| Time | Job |
|------|-----|
| Mon-Sun 1:00 PM | Auto-sync construction % |
| Mon-Sun 1:25 PM | Notifications bell |
| Mon-Sun 1:30 PM | New launches |
| Mon-Sun 1:45 PM | Fetch DLD transactions |
| Mon-Sun 1:55 PM | Aggregate DLD Volumes |
| Mon-Sun 2:00 PM | Aggregate Price History |
| Friday 2:30 PM | Yield calculator |
| Friday 2:35 PM | Aggregate yields to dashboard |
| Sunday 1:00 PM | Full scrape (GPS/units/floors) |

---

## Key Files

`
scripts/aggregate-dld-volumes.js      -> tabData/dldVolumes
scripts/aggregate-price-history.js    -> priceHistory collection
scripts/fetch-dld-transactions.js     -> transactions collection
scripts/fetch-rental-benchmarks.js    -> yieldData collection
scripts/aggregate-yields.js           -> tabData/yieldSummary
scripts/scheduler.js                  -> PM2 cron
src/tabs/ProjectsTab.jsx              -> DLDSalesPanel component
src/tabs/DLDVolumesTab.jsx            -> reads tabData/dldVolumes
src/tabs/PriceHistoryTab.jsx          -> reads priceHistory
src/tabs/YieldsTab.jsx                -> reads tabData/yieldSummary
firestore.rules                       -> transactions + sync_logs added
`

---

## What Still Needs To Be Done

### PRIORITY 1 - Bugs
1. Button encoding on project cards (ROI ->, Details -> garbled)
2. Notification bell emoji showing as text
3. Yield inconsistency (project vs community)
4. Handover tab issues
5. Neighbourhoods tab issues

### PRIORITY 2 - Data
6. Expand yield coverage beyond 52 communities
7. Update rental benchmarks Jan 2027 (next Bayut report)
8. GPS accuracy — many use Downtown Dubai fallback

### PRIORITY 3 - Features
9. Admin Editor UI
10. DXB Estimate AI valuation
11. VPS for 24/7 sync (AED 15/month DigitalOcean)
12. Mobile responsiveness

---

## Critical Rules

1. NEVER use Save-UTF8 or Set-Content on EmaarDashboardV2.jsx
2. Only Node.js scripts to modify EmaarDashboardV2.jsx
3. ppsf in transactions = AED/sqm — divide by 10.764 for sqft
4. Use masterProject (not areaName) for community grouping
5. unitBreakdown is object not array
6. GPS: p.coordinates.lat/lng OR p.lat/p.lng

---

## Environment

`
Repo: C:\Users\TAD\emaar-dashboard
Node: v24.14.0
PM2: dxb-sync (13 restarts, online)
Firebase: dxb-analytics
Cloudflare: emaar-dashboard.pages.dev
`

**First thing next session:**
`powershell
cd C:\Users\TAD\emaar-dashboard
pm2 status
git status
git log --oneline -5
`