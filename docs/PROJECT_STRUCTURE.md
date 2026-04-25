# DXB Analytics — Project Structure

**Last updated:** April 25, 2026 (post-cleanup)
**Repo:** mianwaleed689/emaar-dashboard
**Stack:** React 19 + Vite 5 + Firebase 12

---

## TOP-LEVEL LAYOUT

```
emaar-dashboard/
├── .githooks/              Git hooks (pre-commit, pre-push safety checks)
├── .github/                GitHub Actions workflows (CI/CD, cron jobs)
├── api/                    Vercel/Cloudflare serverless functions (cron, admin APIs)
├── automation/             Python data pipeline (scrapers, parsers, KPI extractors)
├── docs/                   Project documentation (plans, audits, decisions)
├── public/                 Static assets served as-is (favicon, SVGs, marketing HTML)
├── scripts/                Node admin scripts (seeding, migrations, audits)
├── sheets_data/            Excel reference data (Dubai 2022 transactions, read-only)
├── src/                    React application source code
└── (root config files)     package.json, vite.config.js, .env, firebase.json, etc.
```

---

## ROOT CONFIG FILES (9 files)

| File | Purpose |
|---|---|
| `package.json` | Node dependencies + npm scripts |
| `package-lock.json` | Locked dependency tree (don't edit manually) |
| `vite.config.js` | Vite build/dev server config |
| `vercel.json` | Vercel deployment config |
| `firebase.json` | Firebase hosting + Firestore config |
| `firestore.rules` | Firestore security rules (deployed via `firebase deploy`) |
| `index.html` | Root HTML, mounts React |
| `README.md` | Project intro |
| `serviceAccountKey.json` | **Firebase admin key — gitignored, never commit** |

Plus 5 dotfiles: `.env`, `.env.example`, `.env.local`, `.firebaserc`, `.gitignore`

---

## src/ — React Application

### Entry-point files (8 files at src/ root)

These stay at `src/` root because they're the bootstrap layer of the app:

| File | Purpose |
|---|---|
| `index.jsx` | Vite entry point. Renders `<App />` into DOM |
| `App.jsx` | Top-level routing (BrowserRouter, all routes defined here) |
| `firebase.js` | Firebase SDK initialization (auth, firestore, storage) |
| `i18n.jsx` | Internationalization provider (translations live here, 91 KB) |
| `index.css` | Global CSS reset (minimal, 82 bytes) |
| `theme.js` | Design tokens (colors, fonts) — referenced everywhere as `T` |
| `reportWebVitals.js` | Performance metrics callback |
| `setupTests.js` | Jest test setup |

### Folders

```
src/
├── admin/          17 files — Admin panel + 13 admin tabs
│   └── DataManagerV2/  10 files — V2 data manager (split into sections)
│
├── app/            1 file — Next.js-style page (sync-data/page.js)
│
├── communities/    9 files — HARDCODED community data (Phase 1 will delete most)
│   ├── aldar.communities.js
│   ├── binghatti.communities.js
│   ├── damac.communities.js
│   ├── emaar.communities.js
│   ├── meraas.communities.js
│   ├── nakheel.communities.js
│   ├── sobha.communities.js
│   ├── index.js
│   └── index (1).js  (← duplicate, will be removed in Phase 1)
│
├── components/     11 files — Shared UI components used across pages/tabs
│   ├── FilterIndicator.jsx       (active filter badge)
│   ├── GlobalContextFilter.jsx   (filter row on dashboard)
│   ├── Icons.jsx                 (icon library)
│   ├── LegalCite.jsx             ⭐ NEW (Phase 0 — auto-switching legal citations)
│   ├── LoginScreen.jsx           (auth UI)
│   ├── ProjectActionButtons.jsx  (project card actions)
│   ├── RoiCalculator.jsx         (used by EmaarDashboardV2)
│   ├── SampleDataBanner.jsx      (banner shown when displaying sample data)
│   ├── SearchableSelect.jsx      (autocomplete dropdown)
│   ├── SharedUI.jsx              (small reusable bits: chips, panels)
│   ├── SmartEmptyState.jsx       (Phase 1 will use this for empty tabs)
│   ├── TabConfig.js              (tab definitions / metadata)
│   └── index.js                  (barrel export)
│
├── config/         3 files — App-wide configuration
│   ├── legalCitations.seed.js    ⭐ NEW (Phase 0 — 16 legal citations seed data)
│   ├── pricing.js                (subscription pricing)
│   └── tabs.config.js            (tab visibility/order config)
│
├── contexts/       2 files — React Context providers
│   ├── AuthContext.jsx           (current user, role, login state)
│   └── FilterSchemaContext.jsx   (active filter state, used by App.jsx)
│
├── data/           5 files — Hardcoded data (Phase 1 deletes most of this)
│   ├── index.js                  (was data.js — exports T re-export, emaarProjects,
│   │                              emaarFinancials, etc. 42 files import from "../data")
│   ├── data_developers.js        780 KB — DLD developers (Phase 1 will delete)
│   ├── data_emaar_complete.js    Emaar's full project list
│   ├── data_master.js            Re-exports + master combinator
│   ├── dubai_complete_foundation.js  92 KB — full project foundation (Phase 1 deletes)
│   └── projects/                 5 files — per-project data files
│
├── hooks/          10 files — Custom React hooks
│   ├── useAuth.js                (re-exports from contexts/AuthContext)
│   ├── useCommunities.js         Firestore listener for communities/
│   ├── useDevelopers.js          Firestore listener for developers/
│   ├── useDevelopments.js        Firestore listener for developments/
│   ├── useFilters.js             Filter state management
│   ├── useFirestoreCollection.js Generic Firestore subscription helper
│   ├── useLegalCitation.js       ⭐ NEW (Phase 0 — read live legal_citations)
│   ├── useProjectContext.js      Project context within Project Detail page
│   ├── useProjects.js            Firestore listener for projects/
│   └── index.js                  (barrel export)
│
├── lib/            1 file
│   └── queryClient.js            React Query client config
│
├── pages/          9 files — Routed pages (one per route)
│   ├── EmaarDashboardV2.jsx      430 KB — main dashboard (Phase 5 will split)
│   ├── LandingPage.jsx           71 KB — public homepage
│   ├── ProjectDetail.jsx         54 KB — single project view
│   ├── AgencySignup.jsx          Agency signup flow
│   ├── ErrorBoundary.jsx         React error boundary wrapper
│   ├── NotFound.jsx              404 page
│   ├── Privacy.jsx               Privacy policy
│   ├── Terms.jsx                 Terms of service
│   └── UserGuard.jsx             Auth wrapper for /dashboard route
│
├── services/       8 files — External integrations
│   ├── api/                      (placeholder for REST clients)
│   ├── external/                 (placeholder for 3rd-party APIs)
│   ├── firebase/                 4 files — modular firebase wrapper
│   │   ├── auth.js
│   │   ├── config.js
│   │   ├── firestore.js
│   │   └── index.js
│   └── syncMarket.js             Dubai Pulse market data sync
│
├── styles/         2 files
│   ├── global.js                 Global styled-components / CSS-in-JS tokens
│   └── theme.js                  (theme bridge)
│
├── tabs/           34 files — Dashboard tabs (one per tab in EmaarDashboardV2)
│   │   Each is loaded by EmaarDashboardV2 based on selected tab
│   │
│   ├── OverviewTab.jsx           Default tab — market overview
│   ├── ProjectsTab.jsx           153 KB — main projects browser
│   ├── HandoverTab.jsx           94 KB — handover schedule
│   ├── LaunchCalendarTab.jsx     115 KB — upcoming project launches
│   ├── MyLeadsTab.jsx            91 KB — agent CRM
│   ├── PlatformLeadsTab.jsx      80 KB — platform-level leads
│   ├── BankingTab.jsx            67 KB — mortgage banks
│   ├── FinancialsTab.jsx         66 KB — developer financials
│   ├── NeighbourhoodsTab.jsx     49 KB — community deep-dives
│   ├── MarketingTab.jsx          48 KB — marketing tools
│   ├── IntelligenceTab.jsx       44 KB — AI insights
│   ├── CompetitorsTab.jsx        43 KB — competitor benchmarking
│   ├── YieldsTab.jsx             43 KB — rental yield analysis (Phase 3)
│   ├── ListingsTab.jsx           40 KB — listings management
│   ├── DeveloperHealthTab.jsx    34 KB — developer reliability scoring
│   ├── GoldenVisaTab.jsx         34 KB — Golden Visa eligibility
│   ├── PipelineTab.jsx           34 KB — sales pipeline
│   ├── InvestmentScoreTab.jsx    33 KB — DXB Investment Score (Phase 3)
│   ├── ServiceChargesTab.jsx     31 KB — service charge index
│   ├── MortgageTab.jsx           30 KB — mortgage calculator (Phase 3)
│   ├── DevPortalTab.jsx          30 KB — developer portal
│   ├── FlipTab.jsx               29 KB — flip analysis (Phase 3)
│   ├── STRvsLTRTab.jsx           29 KB — short-term vs long-term rental (Phase 3)
│   ├── TeamTab.jsx               29 KB — team management
│   ├── AgencyTab.jsx             27 KB — agency management
│   ├── PriceHistoryTab.jsx       25 KB — price history charts
│   ├── RiskTab.jsx               26 KB — risk indicators
│   ├── DXBEstimateTab.jsx        24 KB — AVM (Phase 3)
│   ├── CommunityMapTab.jsx       24 KB — interactive map
│   ├── ComplianceTab.jsx         22 KB — compliance dashboard
│   ├── PortfolioTab.jsx          21 KB — user portfolio
│   ├── DLDVolumesTab.jsx         19 KB — DLD transaction volumes
│   ├── MarketTab.jsx             18 KB — market stats
│   ├── CurrencyTab.jsx           17 KB — currency conversion
│   └── index.js                  (barrel export)
│
├── types/          1 file
│   └── project.ts                Project type definitions
│
└── utils/          13 files — Pure utility functions
    ├── auditProject.js           Project data quality audit
    ├── constants.js              GOLDEN_VISA_THRESHOLD, etc.
    ├── coordinates.js            Lat/lng helpers, community polygons
    ├── dataHelpers.js            Data transformation helpers
    ├── filterSchemaDefaults.js   Default filter configs
    ├── formatters.js             Number/currency/date formatters
    ├── helpers.js                Misc helpers
    ├── projectContext.js         Project context utilities
    ├── projectValidation.js      Project field validators
    ├── propertyTypes.js          Property type constants
    ├── safeAsync.js              Error-handling async wrapper
    ├── scoring.js                Investment Score logic
    ├── seedData.js               24 KB — local seed data (Phase 1 may delete)
    └── index.js                  (barrel export)
```

---

## api/ — Serverless Functions

Deployed by Vercel/Cloudflare. Run on the server, not in the browser.

```
api/
├── _cron/                  Scheduled jobs (run daily/weekly)
│   ├── cron-dld-daily.js   Pull DLD transactions
│   ├── cron-eibor.js       Update EIBOR rates
│   ├── cron-financials.js  Pull developer financials
│   ├── cron-scan-launches.js  Scan for new project launches
│   ├── cron-sync-market.js Sync market data
│   ├── cron-yields.js      Recalculate yields
│   └── weekly-digest.js    Email weekly digest
│
├── admin-user.js           Admin user management endpoint
├── auditLogApi.js          Audit log read/write
├── create-checkout.js      Stripe checkout session
├── cron.js                 Cron entry point
├── eibor.js                EIBOR API endpoint
├── proxy.js                External API proxy
├── scan-launches.js        Launch scanner
├── seed-developers.js      Developer seed endpoint
└── sync-market-data.js     Manual market sync trigger
```

---

## scripts/ — Node Admin Scripts

Run manually via `node scripts/<name>.js`. Use `serviceAccountKey.json` for admin access.

```
scripts/
├── seed/                       Database seeders (one-time)
│   ├── enrich-developers.js
│   ├── migrate-to-schema-v1.js
│   ├── seed-communities.js
│   ├── seed-developments.js
│   ├── seed-platform-leads.js
│   └── seed-projects.js
│
├── utils/                      Reusable utilities
│   ├── csv.js
│   ├── dubai-pulse.js
│   └── slug.js
│
├── audit-projects.js           Audit project data quality
├── cleanup-dead-firestore-collections.js
├── cron-eibor.js               (local cron tester)
├── enrich-communities.mjs
├── export-leads.js
├── firestore-audit.js          Firestore health check
├── firestore-cleanup.js
├── firestore-init-stats.js
├── firestore-verify.js         Verify schema
├── fix-adminpanel-encoding.js
├── fix-billing-users-encoding.js
├── fix-emaar-encoding.js
├── fix-yields-listeners.js
├── import-emaar-active-projects.mjs
├── restore-analytics-tab.js
├── seed-firestore.js
└── seedLegalCitations.js       ⭐ NEW (Phase 0 — seed legal_citations collection)
```

---

## automation/ — Python Data Pipeline

Separate Python project for scraping/parsing public data sources.

```
automation/
├── parsers/        PDF/document parsers (earnings reports, etc.)
├── scrapers/       Web scrapers (developer sites, market trackers)
├── outputs/        Generated JSON dashboards (committed for reference)
├── logs/           Run logs
├── config.py       Python config
├── main.py         Entry point
├── generate_dashboard_data.py  Aggregator
├── requirements.txt
└── README.md
```

---

## public/ — Static Assets

Served as-is at the root URL.

```
public/
├── data/                              Static JSON snapshots
├── dxb-analytics-icon.svg            Brand icon
├── dxb-analytics-logo.svg            Brand logo
├── favicon.ico
├── logo192.png, logo512.png          PWA icons
├── manifest.json                      PWA manifest
├── *.html                             Marketing pages (privacy, terms, refund, etc.)
├── _headers                           Cloudflare headers
├── _redirects                         Cloudflare redirects
├── robots.txt
└── sitemap.xml
```

---

## docs/ — Documentation

Internal planning + audit docs. Not deployed.

```
docs/
├── ROADMAP.md / ROADMAP.html
├── decisions.md                  54 KB — architectural decisions log
├── the-final-plan-v2-with-research.md  28 KB — earlier plan
├── launch-plan.md
├── data-sources.md
├── schema-v1.md
├── existing-system.md
├── PHASE-0-README.md
└── (15 more planning/audit docs)
```

---

## sheets_data/

Read-only reference: 2022 Dubai transaction Excel files organized by community.
**Not used by app.** Kept for historical reference. Could be archived if disk space matters.

---

## ARCHIVES (outside repo)

Located at `C:\Users\TAD\dxb-archive\` — recoverable, not deleted, not in git:

| Folder | Contents | Size |
|---|---|---|
| `legacy-2026-04-25/` | 78 old utility scripts | various |
| `root-junk-2026-04-25/` | 122 one-off PowerShell/Python/JS scripts | small |
| `src-backups-2026-04-25/` | 10 .bak files (AdminPanel, EmaarDashboardV2) | 5.3 MB |
| `tabs-backups-2026-04-25/` | 21 .bak files (HandoverTab, LaunchCalendarTab, ProjectsTab) | 2.5 MB |
| `dead-context-2026-04-25/` | 2 unused DXBContext.jsx files | small |
| `data-2026-04-25/` | leads_import_ready.json | 50 MB |

**Total archived: ~58 MB**, fully recoverable with `Move-Item`.

---

## QUICK NAVIGATION

| Looking for... | Go to... |
|---|---|
| Routing / page list | `src/App.jsx` |
| Auth + role checks | `src/contexts/AuthContext.jsx` + `src/hooks/useAuth.js` |
| Theme colors / fonts | `src/theme.js` (referenced as `T` everywhere) |
| Translations | `src/i18n.jsx` |
| Firebase setup | `src/firebase.js` (web) + `src/services/firebase/` |
| A specific tab in the dashboard | `src/tabs/<TabName>.jsx` |
| Admin UI for X | `src/admin/<Tab>Tab.jsx` or `src/admin/DataManagerV2/` |
| Filter logic | `src/contexts/FilterSchemaContext.jsx` + `src/hooks/useFilters.js` |
| Hardcoded data (Phase 1 will delete most) | `src/data/`, `src/communities/` |
| Calculator math (Phase 3 will rebuild) | `src/utils/scoring.js`, `src/components/RoiCalculator.jsx`, individual tabs |
| Legal citations | `src/config/legalCitations.seed.js` + `src/components/LegalCite.jsx` |
| Cron jobs | `api/_cron/` |
| Data seeders | `scripts/seed/` |

---

## NOTES FOR PHASE 1

When Phase 1 ("The Great Purge") starts, these files will be deleted or emptied:

- `src/data/dubai_complete_foundation.js` (92 KB)
- `src/data/data_developers.js` (780 KB)
- `src/data/data_emaar_complete.js`
- `src/data/data_master.js` (most of it)
- `src/communities/*.communities.js` (7 files)
- `src/communities/index.js` and `index (1).js`
- Possibly `src/utils/seedData.js` (24 KB)

Replaced by: live Firestore data via existing hooks (`useProjects`, `useDevelopers`, `useCommunities`).

**Total Phase 1 cleanup target: ~1.5 MB of hardcoded data → 0 bytes (empty states + Firestore)**
