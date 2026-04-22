# DXB Analytics — Architecture Roadmap

**Date:** 21 April 2026
**Platform:** Dubai real estate intelligence SaaS
**Codebase:** ~28,000 lines in 2 monolithic shells + ~20,000 in 33 extracted tabs + 22,000 in admin

---

## Executive Summary

DXB Analytics is 60% architecturally complete. You've made excellent foundational decisions — modular tabs, Firestore subscriptions, a modern stack, legal-safe positioning — but two issues block scaling to 1000s of projects:

1. **Two god components** hold 856 combined useState hooks and must change on any feature
2. **Data integrity is manual** — the Golf Grand case showed one wrong RERA number hiding in production for months

**The good news:** you already built the target pattern (`DataManagerV2`). The mission is to finish migrating to it, not invent something new.

**This document outlines:**
- Current-state architecture map
- Ranked pain points with metrics
- 4-phase migration plan (non-breaking)
- Rich data layer roadmap
- Quick wins (this week)
- Risks and mitigations

---

## Part 1 — Current State

### 1.1 What Works

| Area | Why it works |
|------|--------------|
| Routing (`App.jsx`) | Clean role-gated routes, small file |
| Auth flow | Firebase with role-based guards |
| Tab extraction | 33 tabs are individual files, not a single blob |
| DataManagerV2 | Proves you know the right pattern |
| Audit infrastructure | `auditLog` subcollection, `ClaimsSection` |
| Legal framing | "Data platform, not advice" protects you |
| Stack choice | React 19, Vite, TanStack Query, Firestore — modern |

### 1.2 The Three Blockers

**Blocker 1 — EmaarDashboardV2.jsx = 6,024 lines**

```
417 useState hooks
 39 onSnapshot Firestore subscriptions
 33 tab components rendered, each receiving 20-50 props
```

Every keystroke in any filter re-renders the whole shell, re-evaluates all 417 state values, and re-passes all props to all 33 tabs. This is why the app feels heavy and why you can't add a tab without editing a massive file.

**Blocker 2 — AdminPanel.jsx = 22,365 lines**

Even worse. 439 useState hooks, duplicates the theme instead of importing it, and mixes in old patterns alongside the new DataManagerV2.

**Blocker 3 — Fragmented data layer**

```
src/data.js                      (placeholder data, duplicates theme)
src/data_developers.js           (unknown content)
src/data_emaar_complete.js       (unknown content)
src/data_master.js               (unknown content)
src/communities/*.js             (per-developer community files)
src/data/projects/               (new pattern — only Golf Grand so far)
```

No single source of truth. Golf Grand's wrong data sits in `data.js` line 21 while the corrected record sits in `data/projects/golf-grand.data.js`. Both are imported somewhere. This is bug soil.

### 1.3 Tab Complexity Distribution

| Size tier | Count | Tabs |
|-----------|-------|------|
| Over 1500 lines | 3 | LaunchCalendar (2320), Handover (1795), Projects (1681) |
| 900-1500 lines | 3 | MyLeads (1131), Banking (979), Financials (936) |
| 400-900 lines | 10 | Competitors, NeighbourhoodsT, MarketingT, IntelligenceT, ListingsT, YieldsT, DeveloperHealthT, GoldenVisaT, InvestmentScoreT, PipelineT |
| Under 400 lines | 17 | Everything else ✓ |

28 of 33 tabs are reasonably sized. Only 3-6 are truly problematic. Good news — the migration effort is bounded.

---

## Part 2 — The Migration Plan

### Phase 0 — Foundation (this week, 1-2 days effort) ← **WE ARE HERE**

**Goal:** Stop the bleeding. One data source. Automated quality checks.

- [x] `src/data/projects/` folder with one file per project
- [x] Barrel `index.js` with `allProjects`, `projectById()`, `catalogStats`
- [x] `src/utils/auditProject.js` with 11 quality rules
- [x] `scripts/audit-projects.js` wired into pre-commit
- [ ] Migrate the 3 projects from `data.js` into `data/projects/*.js`
- [ ] Replace `emaarProjects` import in `data.js` with re-export from new location
- [ ] Delete `data_emaar_complete.js` if unused (audit first)
- [ ] Add `npm run audit:projects` to `package.json`

**Deliverables:** In the accompanying `phase-0/` folder.

**Success metric:** `node scripts/audit-projects.js --ci` runs on commit and blocks pushes with data errors.

---

### Phase 1 — Extract the Dashboard Shell (1 week)

**Goal:** Shrink `EmaarDashboardV2.jsx` from 6,024 lines to under 300.

**Strategy:** Move state ownership from shell into tabs using the DataManagerV2 pattern. Each tab becomes responsible for its own Firestore subscriptions.

**Steps:**

1. Create `src/hooks/data/` with shared Firestore hooks:
   ```javascript
   useProjects()           // onSnapshot(collection(db, "projects"))
   useDevelopers()         // onSnapshot(collection(db, "developers"))
   useDLDVolumes()         // onSnapshot(collection(db, "dldVolumes"))
   useMarketData()
   useYields()
   useMortgageRates()
   ```
   Each hook returns `{ data, loading, error }`. No parent state needed.

2. Convert `EmaarDashboardV2.jsx` into a thin shell:
   ```javascript
   function Dashboard() {
     const [tab, setTab] = useState("overview");
     return (
       <Layout>
         <Sidebar tabs={DASHBOARD_TABS} active={tab} onChange={setTab} />
         <TabRenderer tab={tab} />
       </Layout>
     );
   }
   ```
   Target: 150-300 lines.

3. Rewrite tabs to use hooks instead of props:
   ```javascript
   // Before:
   function ProjectsTab({ liveProjects, allDevelopers, projSearch, ... 30 more }) { ... }

   // After:
   function ProjectsTab() {
     const { data: projects } = useProjects();
     const { data: developers } = useDevelopers();
     const [search, setSearch] = useState("");
     // ...
   }
   ```

4. Migrate tabs in this order (easiest to hardest):
   - **Week 1 day 1-2:** CurrencyTab, MortgageTab, MarketTab, OverviewTab (small, isolated)
   - **Week 1 day 3:** YieldsTab, DLDVolumesTab, NeighbourhoodsTab
   - **Week 1 day 4-5:** ProjectsTab, HandoverTab
   - **Week 2+:** The fat ones — LaunchCalendarTab (split into 3 components)

5. Fix `tabs.config.js`:
   - Remove duplicates (projects, communities, yields, eibor appear twice)
   - Separate dashboard vs admin configs into two files
   - Add role gates per tab

**Success metric:** `EmaarDashboardV2.jsx` under 500 lines. No tab receives more than 5 props.

---

### Phase 2 — Migrate Admin Panel (1-2 weeks)

**Goal:** Same treatment for `AdminPanel.jsx` (22k → 500 lines).

**Reuse everything from Phase 1:** same hook pattern, same shell structure, same config approach.

**Steps:**

1. Follow the DataManagerV2 pattern it already uses.
2. Split by admin function area:
   - User management (Users, Roles, KYC, Cancellations)
   - Billing (PricingPlans, Billing, Referrals)
   - Operations (Support, Notifications, Platform Settings, Digest)
   - Content (DataManagerV2 is already here ✓)
   - Intelligence (MarketIntelligenceTab, Leads, FilterSchemaAdminTab)
3. Remove the duplicate `T` theme definition — import from `src/theme.js` (you already have this).
4. Kill `AdminPanel.jsx.backup` (backups don't belong in git).

**Success metric:** `AdminPanel.jsx` under 500 lines. Zero state lives in the shell.

---

### Phase 3 — Data Catalog at Scale (2-3 weeks)

**Goal:** Move from 3 curated projects + 2,798 DLD placeholders to a unified catalog of 100-500 verified projects.

**Steps:**

1. **Firestore-first strategy:** All projects live in Firestore, seed files in git are for bootstrapping/testing only.

2. **Admin workflow for adding projects:**
   - DataManagerV2 → Projects section → "Add New"
   - Form validates against audit rules as you type
   - Save fails if any error-level rule fails
   - Attaches `_audit.lastVerified` automatically

3. **Auto-enrichment pipeline:**
   - Given a project with just `{ project, developer, community }`
   - Fetch DLD record by RERA
   - Fetch nearby schools/metros from Google Places
   - Fetch community benchmarks from transaction data
   - Save with confidence scores per field

4. **Data quality dashboard:**
   - New admin section: `CatalogHealth`
   - Shows: clean %, top offenders, rules most violated, stale projects
   - Sorted worklist of "fix these next"

5. **Source attribution:**
   - Every field has `_sources: { field: ["DLD", "Propsearch", "manual"] }`
   - Admin UI shows each field's source on hover
   - Audit requires source for every field

**Success metric:** 100% of published projects have `_audit.dataQuality: "high"`. Zero error-level issues across catalog.

---

### Phase 4 — Rich Data Layer (4-6 weeks)

**Goal:** Move from Level 3 (validated) to Level 4 (rich) — the depth investors actually need.

**4.1 Time-series data**
- Construction % over time (weekly snapshots)
- Price history per unit type (monthly)
- Yield trend (12-month rolling)
- Sales velocity (units/month)

**4.2 Transaction integration**
- DLD transaction records per project (price, floor, date, buyer type)
- Resale listings count from Bayut/PF
- Ejari rental contracts count
- Days-on-market average

**4.3 Connected data**
- "Other projects by same contractor" links
- "Comparable PPSF in community" benchmarks
- "Same architect elsewhere" links
- Map view showing nearby Emaar projects

**4.4 Derived signals**
- Price momentum (% vs 6mo ago)
- Supply pressure (resale listings / total units)
- Demand score (search vol + listing views)
- Risk flags (contractor delay history, developer complaints)

**4.5 Media layer**
- Brochure PDF link
- Floor plans per unit type
- Construction photos (timestamped)
- Master community map

**Success metric:** An investor can make a buy/no-buy decision without leaving the project page.

---

### Phase 5 — Intelligence (ongoing)

**Goal:** Turn rich data into insights users can't compute themselves.

Examples:
- "This project's PPSF has decoupled from community by 8% over 3 months — unusual."
- "Contractor X has 3 projects delivered on time, 2 late. Median delay: 4 months."
- "5 similar units (same community, same BR count) sold in last 30 days at AED 2,100-2,400 PPSF vs this project's AED 1,974 asking."

This is the moat. This is why investors pay.

---

## Part 3 — Quick Wins (This Week)

Independent of the big migration, here are 5 things you can do in under an hour each:

1. **Kill `AdminPanel.jsx.backup`** — `git rm` it. Backups belong in git history, not in your repo.

2. **Delete unused root data files** — run `grep -r "data_emaar_complete\|data_developers\|data_master" src/` to find what's actually imported. Delete the rest.

3. **Merge `context/` and `contexts/` folders** — you have both. Pick one convention (plural `contexts/` is React's), move DXBContext.jsx and AuthContext.jsx into it, update imports.

4. **Remove empty `.gitkeep` folders that have no real plan** — `services/api/`, `services/external/`, `components/layout/`, `components/shared/`, `components/ui/`, `hooks/.gitkeep`. Clean slate.

5. **Remove `react-scripts` dependency** — you migrated to Vite but still have `react-scripts` in package.json. It's 200MB of dead weight in node_modules.

---

## Part 4 — Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Breaking production during migration | Medium | High | Migrate one tab at a time; deploy to preview URL first; smoke-test each phase |
| Firestore rules don't allow new hook patterns | Low | High | Audit rules before Phase 1; test subscriptions in dev |
| Lost in-progress work | Medium | Medium | Phase 1 touches many files; commit after each tab migration |
| Admin users notice UI regressions | Medium | Medium | Admin is internal — they'll tell you; keep old AdminPanel.jsx until Phase 2 complete |
| Golf Grand fix doesn't propagate | High if not done | Medium | Phase 0 includes removing the old data.js entry — verify in prod after deploy |
| tabs.config.js deduplication breaks navigation | Low | Medium | Test each nav item after deduping; deploy to preview first |
| Bundle size increases with hooks refactor | Low | Low | TanStack Query already handles caching; no new deps |

---

## Part 5 — Architecture Diagrams

### Before (Current State)

```
┌──────────────────────────────────────────────────────────────┐
│                     EmaarDashboardV2.jsx                     │
│                       (6,024 lines)                          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  417 useState hooks                                    │  │
│  │  39 onSnapshot subscriptions                           │  │
│  │  All Firestore queries                                 │  │
│  │  All global filters                                    │  │
│  │  All feature flags                                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Passes 20-50 props to each tab ↓                           │
└──┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬───────┬─┘
   ↓      ↓      ↓      ↓      ↓      ↓      ↓      ↓       ↓
 ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   ... 33 tabs
 │Proj│ │Hand│ │Laun│ │Leas│ │Cur │ │Mort│ │Yiel│ │Mark│
 └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘
```

### After (Target State)

```
┌───────────────────────┐    ┌────────────────────────────┐
│    Dashboard Shell    │    │  Shared Data Hooks Layer   │
│      (~300 lines)     │    │                            │
│                       │    │  useProjects()             │
│  Just routing +       │◄───┤  useDevelopers()           │
│  layout + navigation  │    │  useYields()               │
│                       │    │  useDLDVolumes()           │
│                       │    │  useMarketData()           │
└───────────┬───────────┘    │  ...                       │
            │                └────────────────────────────┘
            │                             ▲
            ▼                             │
    ┌─────────────┐                       │
    │ TabRenderer │                       │
    └──────┬──────┘                       │
           │                              │
    ┌──────┴──────┬──────┬──────┐        │
    ↓             ↓      ↓      ↓        │
  ┌────┐       ┌────┐ ┌────┐ ┌────┐     │
  │Proj│──────►│Hand│ │Laun│ │... │─────┘
  └────┘       └────┘ └────┘ └────┘
  Each tab owns its own state,
  reads from shared hooks directly.
  Receives 0-2 props from shell.
```

---

## Part 6 — Success Metrics

After Phase 2 complete, this platform will have:

| Metric | Before | Target After Phase 2 |
|--------|--------|---------------------|
| `EmaarDashboardV2.jsx` size | 6,024 lines | < 500 lines |
| `AdminPanel.jsx` size | 22,365 lines | < 500 lines |
| Total `useState` in shells | 856 | < 20 |
| Props per tab (median) | 25-40 | 0-3 |
| Project catalog integrity | Manual | Automated (audit gate) |
| Data sources of truth | 7+ files | 1 (Firestore + `data/projects/`) |
| Config drift | Duplicates in tabs.config.js | Single config per surface |
| Build time (estimate) | Slow | ~30% faster (less prop churn) |
| Onboarding new developer | Weeks | Days |

---

## Appendix — The Files in `phase-0/`

```
phase-0/
├── data/projects/
│   ├── emaar-golf-grand.js              ← Corrected, audit-clean
│   ├── emaar-the-golf-residence.js      ← Migrated from data.js, needs research
│   ├── emaar-hills-park.js              ← Migrated from data.js, needs research
│   └── index.js                         ← Barrel + helpers + legacy alias
├── utils/
│   └── auditProject.js                  ← 11 validation rules
├── scripts/
│   └── audit-projects.js                ← CI-runnable gate
└── docs/
    ├── ROADMAP.md                       ← This document
    └── ROADMAP.html                     ← Visual version
```

---

**Prepared by:** Claude (architecture audit session, 21 April 2026)
**Status:** Draft — open for feedback and iteration
