# DXB Analytics - Existing System Inventory

**Date:** 2026-04-09
**Purpose:** Honest, comprehensive catalog of what the DXB Analytics SaaS already contains. Written AFTER discovering in Session 6A that the codebase had a substantial pre-built backend that was hidden from planning for 10+ sessions. This document is the source of truth for what exists. `docs/launch-plan.md` is the plan for what still needs to happen.

---

## 1. Product shape

DXB Analytics is an enterprise Dubai real estate intelligence SaaS owned by The Address Holding. Target market: 1000+ UAE real estate agencies. Not yet publicly launched. Substantial infrastructure already built and partially deployed.

**Stack:**
- Frontend: React 19 + Vite 5 (migrated from Create React App; CRA leftovers remain in package.json but actual build is Vite)
- Hosting: Vercel (backend serverless functions) + Cloudflare Pages (frontend static) - split stack
- Database: Firebase Firestore
- Auth: Firebase Auth
- Storage: Firebase Storage
- Payments: Stripe (configured, not yet finalized)
- AI: Anthropic Claude API (via proxy)
- Email: EmailJS (client-side, not production-scale)
- Data: Vercel cron jobs + Python automation pipeline + Excel archives

**Deployment:** git push origin main -> Cloudflare auto-builds frontend + Vercel auto-builds backend. Iron rule: NEVER run `npx vercel --prod` manually. git push only.

---

## 2. Backend (api/) - 9 Vercel serverless functions after consolidation

| File | Purpose | Notes |
|---|---|---|
| `cron.js` | Router for all 9 cron jobs via ?job=<name>. Centralized CRON_SECRET check. | NEW - Apr 9 |
| `admin-user.js` | Admin create/delete users via ?action=. Auth check centralized. | NEW - Apr 9 (replaces admin-create-user + admin-delete-user) |
| `auditLogApi.js` | Enterprise REST API for audit logs. SHA-256 hashed API keys, CSV export, pagination, filtering. | Production grade |
| `create-checkout.js` | Stripe checkout session creator. **PLACEHOLDER PRICE IDs - LAUNCH BLOCKER.** Falls back to WhatsApp link if not configured. | Needs fixing |
| `eibor.js` | On-demand EIBOR lookup with 3-layer fallback (fcmb.ae -> mortgagemarket.ae -> hardcoded) | Works |
| `proxy.js` | Consolidated proxy for claude + stock + rates by ?service=. | Works |
| `scan-launches.js` | Multi-source off-plan scanner (Bayut search x 3 categories + new-projects + per-developer + DLD CSV) | Works |
| `seed-developers.js` | ONE-TIME script. DLD OAuth2 -> all developers + projects -> writes developers/{id} and marketData/developerRegistry. 30+ VERIFIED_DEVELOPERS hardcoded. | Run manually after first deploy |
| `sync-market-data.js` | Live Bayut PPSF for 30 hardcoded communities (returns JSON, admin panel writes to Firestore) | Works |

### Cron jobs (api/_cron/, routed via api/cron.js)

| Handler | Schedule (UTC) | Writes To | Purpose |
|---|---|---|---|
| `cron-currency.js` | `0 4 * * *` | `marketData/currency` | 13 currencies from exchangerate-api.com |
| `cron-news.js` | `30 2 * * *` | `tabData` | News feed for 24/7 newspaper tab (Gulf News, The National, Gulf Business RSS) |
| `cron-eibor.js` | `0 7 * * 1-5` | `marketData/eibor` | 4-layer fallback: CBUAE JSON -> HTML -> Investing.com -> hardcoded |
| `cron-dld-daily.js` | `0 3 * * *` | `adminAlerts, communityData, developers, marketData` | Main DLD pipeline (Session 13) |
| `cron-financials.js` | `0 5 * * *` | `adminAlerts, developers` | Developer financials with 4-fallback Yahoo strategy |
| `cron-yields.js` | `0 5 * * *` | `communityData, tabData` | Weekly yield calculations |
| `cron-sync-market.js` | `0 6 * * *` | `cronLogs, liveMarketData` | Live PPSF for 30 communities |
| `cron-scan-launches.js` | `0 8 * * *` | `cronLogs, notifications, projects, radarLaunches` | Auto-detects new launches, creates notifications |
| `weekly-digest.js` | `0 4 * * 1` | (sends emails only) | Weekly digest via EmailJS |

**All cron handlers are CRON_SECRET protected.** The router verifies the Bearer token once before dispatching.

### Firebase Admin init pattern (all backend files)
```js
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId:   process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey:  (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}
```
Exception: `auditLogApi.js` uses `JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)` instead. Inconsistency worth fixing later, not blocking.

### Environment variables referenced in backend code (set in Vercel, not in .env)
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_API_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_URL`, `BAYUT_RAPIDAPI_KEY`, `CRON_SECRET`, `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `DLD_CLIENT_ID`, `DLD_CLIENT_SECRET`

### Frontend .env inconsistency
- Local `.env` uses `REACT_APP_*` prefixes (legacy CRA). **Vite does not read these.** Local dev is broken until renamed.
- `.env.example` uses `VITE_*` prefixes (correct).
- Production works because Vercel env vars use correct names.
- **Fix needed:** rename local `.env` variables from `REACT_APP_*` to `VITE_*`.

---

## 3. Frontend (src/)

### Top-level files
- `EmaarDashboardV2.jsx` - main dashboard shell, 372 KB, 4983 lines. Mounts 34 tabs. Uses `liveProjects` with SEED_PROJECTS fallback.
- `AdminPanel.jsx` - admin shell, 1574 KB, 21944 lines. Mounts 13 admin sub-tabs.
- `AdminPanel.jsx.backup` - backup of earlier version.
- `AgencySignup.jsx` - 19 KB, 305 lines. 4-step agency registration wizard. **Has launch blockers** (see launch-plan.md).
- `firebase.js` - Firebase client SDK init using `import.meta.env.VITE_*`.
- `data.js` / `data_master.js` / `data_developers.js` (780 KB) - static data files.

### src/tabs/ (34 dashboard tabs, biggest first)
LaunchCalendarTab 116KB, MyLeadsTab 86KB, HandoverTab 78KB, ProjectsTab 68KB, BankingTab 65KB, FinancialsTab 65KB, MarketingTab 48KB, IntelligenceTab 44KB, CompetitorsTab 42KB, ListingsTab 40KB, PipelineTab 34KB, GoldenVisaTab 34KB, DeveloperHealthTab 33KB, YieldsTab 31KB, InvestmentScoreTab 31KB, DevPortalTab 30KB, ServiceChargesTab 30KB, MortgageTab 30KB, FlipTab 29KB, TeamTab 29KB, STRvsLTRTab 27KB, AgencyTab 27KB, RiskTab 25KB, PriceHistoryTab 25KB, NeighbourhoodsTab 24KB, DXBEstimateTab 23KB, CommunityMapTab 22KB, OverviewTab 22KB, ComplianceTab 22KB, PortfolioTab 21KB, MarketTab 18KB, CurrencyTab 17KB, DLDVolumesTab 17KB.

### src/admin/ (13 admin sub-tabs)
SupportTab 445KB (biggest file in project), UsersTab 103KB, DataManagerTab 72KB, NotificationsTab 47KB, ReferralTab 37KB, DigestTab 33KB, EiborRatesPanel 30KB, BillingTab 29KB, EmailCampaignsTab 21KB, MarketIntelligenceTab 18KB, PricingPlansTab 12KB, ForecastingTab 11KB, CancellationTab 10KB.

### src/communities/ (7 hand-curated developer community files)
emaar 51KB, meraas 19KB, damac 18KB, sobha 16KB, nakheel 14KB, aldar 13KB, binghatti 6KB. Plus index.js (and an accidental `index (1).js` duplicate - cleanup needed).

### src/utils/
scoring.js, propertyTypes.js, projectValidation.js, safeAsync.js, formatters.js, helpers.js, dataHelpers.js, constants.js, coordinates.js, seedData.js (23.8 KB of seed data).

### src/ other subfolders
admin/ (13 files), app/ (empty), communities/ (9), components/ (7), config/ (1), context/ (2 - AuthContext + DXBContext), hooks/ (1 - useAuth), services/ (empty), styles/ (2), tabs/ (34), types/ (project.ts), utils/ (11).

---

## 4. Firestore schema - 62 collections in firestore.rules

Reference data: `marketData, fxRates, eiborHistory, communityData, communityIntel, communityROI, liveMarketData, priceHistory, yieldData, news, transactions, projectData, developers, developments, projects, projectVersions, radarLaunches, devUnits, devEOIs, tabData`

Multi-tenant: `organisations, brokerages, users, subscriptions, payments, pricingPlans`

CRM: `leads, deals, listings, portfolios, watchlists, comparisons, priceAlerts, campaigns, notifications, notificationTemplates`

Compliance: `auditLog, projectAuditLog, developmentAuditLog, verifications, cronLogs, digestLog, digestSettings`

Support: 12 `support*` collections (SupportTab.jsx is 445KB - full ticketing system)

Admin: `adminSettings, aiInsights, platformSettings, ticketPresence, reports`

**firestore.rules is 394 lines.** Schema v2 (developments + projects) is already in the rules. Multi-tenant isolation via `orgId` + `sameOrg()` helpers. Role hierarchy: superAdmin > admin > manager > agent. Tier gating via `isPro()` for premium content.

---

## 5. Other folders

### automation/ (Python data pipeline, parallel to Vercel crons)
Scrapers (developer_tracker, market_tracker, property_scraper, rental_tracker, stock_fetcher) + parsers (ai_extractor, earnings_processor, kpi_extractor, pdf_parser) + main.py orchestrator. Outputs static JSON files (dashboard_data.json 28 KB, etc.). Has been run (pyc cache files present).

### scripts/
- **scripts/data/leads_import_ready.json** - 50 MB of pre-imported leads data, ready to load to Firestore
- **scripts/legacy/AdminPanel_original.jsx** - 1.6 MB backup of earlier AdminPanel
- **scripts/legacy/emaar-dashboard-output.md/.txt** - 40 MB text dumps (probably old conversation exports)
- Firestore management: seed-firestore.js, firestore-init-stats.js, firestore-verify.js, firestore-audit.js, firestore-cleanup.js
- 60+ legacy Python/JS migration scripts in scripts/legacy/
- **scripts/serviceAccountKey.json** - Firebase Admin credentials. **NOT tracked by git** (protected by .gitignore).
- scripts/utils/ - slug.js, csv.js, dubai-pulse.js (my framework files from Session 6A, uncommitted)

### sheets_data/
Hundreds of Excel files organized by community and date (mostly 2022 Updated Dubai). Real DLD-sourced unit-level data for Emaar Beachfront, Dubai Hills, Downtown, DAMAC Hills, JBR, Marina, JVC, Palm Jumeirah, MBR District 1, Port de la Mer. Filenames include unit counts. **Real archive, not seed data.**

---

## 6. Key findings (summary)

### What already works
- Agency signup flow (4-step wizard writes users + organisations with correct multi-tenant schema)
- Agency approval queue in AdminPanel (pending orgs filter, approve/reject)
- Enterprise-grade audit log REST API with API keys
- KYC verification workflow with email notifications
- WhatsApp Business API integration for customer messaging
- 9 cron jobs (currency, news, EIBOR, DLD, financials, yields, market sync, scan launches, weekly digest)
- Multi-tenant permission system (firestore.rules with orgId, roles, sameOrg)
- Security headers (vercel.json: X-Frame-Options, HSTS, etc.)
- Data feeds health monitoring in AdminDataHealth tab

### What's broken or has gaps
1. **Stripe price IDs are placeholders** (contains placeholder strings instead of real Stripe price IDs) - LAUNCH BLOCKER
2. **Pricing inconsistency:** AgencySignup shows 299/799 AED, create-checkout.js comments say 99/499 AED - LAUNCH BLOCKER
3. **AgencySignup gaps:** no email verification, no ToS checkbox (PDPL legal), weak passwords (6 chars), no bot protection, no RERA uniqueness check, Arabic name orgId quirk - LAUNCH BLOCKER
4. **Local .env uses REACT_APP_* prefixes** that Vite doesn't read - local dev broken
5. **EIBOR hardcoded fallback dated Feb 2026** - 6 weeks stale, will drift further
6. **Only 30 of ~400-500 Dubai communities tracked** for Bayut PPSF
7. **Only 16 developers recognized in scan-launches devIdMap** vs 100+ that exist
8. **cron-dld-daily console.log warning** - pre-commit hook flagged as possible sensitive data
9. **firestore.rules not deployed** to live Firebase (Day 1 additions sitting in repo)
10. **CRON_SECRET value leaked in git history** in weekly-digest.js comments (low blast radius, should rotate post-launch)
11. **admin-user.js missing orgId on create** - creates users without multi-tenant orgId (fine for admin test users, NOT for agency onboarding - agency signup uses AgencySignup.jsx which handles it correctly)

### Reconciliation items from Session 5A-6 work (Day 1)
The following additions to firestore.rules from yesterday need review:
- `fxRates/{date}` - **REDUNDANT** with existing `marketData/currency` pattern. Safe to leave as dead rule for now.
- `news/{newsId}` - **REDUNDANT** with existing `tabData` writes from cron-news. Safe to leave.
- `transactions/{txnId}` - Possibly used. Need to check what cron-dld-daily writes.
- `projectAuditLog/{doc}` and `developmentAuditLog/{doc}` subcollections - **COEXIST** with existing flat `auditLog` pattern. Both allowed in rules, both work.

Not urgent to remove. Dead rules do no harm.

---

## 7. What this rebuild actually needs to do

Given the above: this is NOT a "build from scratch" project. It is a "finish, polish, and launch" project.

Priority order for remaining work (see `docs/launch-plan.md` for details):
1. Verify Vercel env vars are all set (30 min)
2. Fix Stripe placeholders (2-3 hours)
3. Harden agency signup (4-6 hours)
4. Reconcile pricing between files (1 hour)
5. Add legal pages - ToS, Privacy, PDPL compliance (3-4 hours)
6. Wire dashboard tabs to real Firestore data where still using seed (8-15 hours)
7. Deploy firestore.rules to live Firebase (1 hour)
8. Run seed-developers.js one-time to populate developers collection (30 min)
9. Full QA pass (6-10 hours)
10. Launch checklist - domains, email deliverability, backups (2-3 hours)

**Total honest remaining effort: 28-45 hours.**

Not 50-65 as originally estimated. Most of the platform is built. The remaining work is connecting, fixing, and polishing.