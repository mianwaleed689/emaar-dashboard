# DXB Analytics — Unified Data Architecture Plan

**Date:** April 25, 2026
**Author:** Architectural research session
**Status:** Proposal — awaiting decisions

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Current State — Inventory](#2-current-state--inventory)
3. [Diagnosed Problems](#3-diagnosed-problems)
4. [Target Architecture](#4-target-architecture)
5. [Migration Plan](#5-migration-plan)
6. [Decisions Required](#6-decisions-required)

---

## 1. EXECUTIVE SUMMARY

### Goal in one sentence

**Make every piece of data on the dashboard come from one place — Firestore — written by one set of admin tools, with a clear publish/draft workflow.**

### The core problems found

1. **76% of dashboard tabs (25 of 33) ignore Firestore entirely.** They read only hardcoded `data.js`. Admin changes don't reach them.
2. **2 admin tabs write to the same Firestore doc in 2 different schemas.** Filter Schema and Platform Settings both edit `platformSettings/main` but with incompatible structures.
3. **3 admin paths write community data to 3 different collections.** Admin → `communityData` (191 docs). Dashboard reads `communities` (231 docs). They don't sync.
4. **2 project managers exist.** DataManagerV2 → `projects`. AdminPanel/ProjectManager → `projectData`. Neither knows about the other.
5. **Firestore has 2,023 developers but only 62 are visible.** Filter logic is correct; the 1,961 unverified are DLD scrape leftovers.

### The fix

Three architectural shifts:

1. **Single source of truth per data type** — one collection, one writer, all readers.
2. **Two admin tabs only:** "Content Manager" (data) + "Platform Settings" (options).
3. **Phase 1 of master plan still applies:** delete hardcoded `data.js`, force all tabs to read live Firestore.

---

## 2. CURRENT STATE — INVENTORY

### 2.1 Dashboard tabs (33 total)

| Pattern | Count | What this means |
|---|---|---|
| Reads ONLY hardcoded `data.js` | 25 | Admin writes never reach these tabs |
| Firestore + data.js | 5 | Mixed — some live, some stale |
| Hook + data.js | 3 | Uses hooks but still imports hardcoded |
| Pure Firestore | 0 | None! |

**The 25 disconnected tabs:**
AgencyTab, CommunityMapTab, CompetitorsTab, ComplianceTab, CurrencyTab, DeveloperHealthTab, DLDVolumesTab, DXBEstimateTab, FinancialsTab, FlipTab, HandoverTab, IntelligenceTab, InvestmentScoreTab, LaunchCalendarTab, MarketingTab, MarketTab, MortgageTab, NeighbourhoodsTab, OverviewTab, PortfolioTab, RiskTab, ServiceChargesTab, STRvsLTRTab, TeamTab, YieldsTab

### 2.2 Admin tabs (17 + DataManagerV2 sub-sections)

**Top-level admin tabs:**
| Tab | Writes to | Reads from |
|---|---|---|
| AdminDataHealth | adminAlerts, marketData, tabData | same |
| AdminPanel | adminSettings, auditLog, communityIntel, communityROI, developers | same + more |
| BillingTab | adminAlerts, payments | same |
| CancellationTab | (read only) | cancellations |
| DeveloperPortal | developerClaims, developments, users | same |
| DigestTab | digestLog, digestSettings | same |
| EiborRatesPanel | eiborHistory, notifications, tabData | same |
| **FilterSchemaAdminTab** | **platformSettings/main** | same |
| MarketIntelligenceTab | adminAlerts, communityData, developers, eiborHistory, marketData | same |
| NotificationsTab | notifications, notificationTemplates | same |
| PlatformLeadsTab | platformLeads | same |
| **PlatformSettingsTab** | **platformSettings/main (DIFFERENT SCHEMA!)** | same |
| PricingPlansTab | pricingPlans | same |
| ProjectManager | projectData, users | same |
| ReferralTab | adminAlerts, marketData, referrals, users | same |
| SupportTab (445 KB!) | 5+ support collections | same |
| UsersTab | notifications, users | same |

**DataManagerV2 sub-sections:**
| Section | Writes to |
|---|---|
| OverviewSection | (read only — developers, developments, projects) |
| DevelopmentsSection | developers, developments |
| ProjectsSection | developments, projects |
| DevelopersSection | developers |
| **CommunitiesSection** | **communityData (NOT communities!)** |
| ComplianceSection | (read only) |
| ClaimsSection | developerClaims, developers, developments |

### 2.3 Firestore collection state

| Collection | Doc count | Status |
|---|---|---|
| developers | 2,023 | 62 verified, 1,961 unverified DLD scrape |
| communities | 231 | 164 verified, 67 unverified (after our cleanup) |
| **communityData** | **191** | **Different collection — admin writes here, dashboard ignores** |
| projects | 94 | 1 published, 93 hidden Emaar projects |
| projectData | ? | Used by old ProjectManager |
| developments | 0 | Empty |
| communityIntel | 11 | Sparse |
| communityROI | 12 | Sparse |
| marketData | ? | Used by 4+ tabs |
| platformSettings/main | 1 doc | **Has BOTH schemas at top level** |

### 2.4 The schema conflict in `platformSettings/main`

```
platformSettings/main
├── propertyTypes (PlatformSettingsTab format) ── flat: {id, label, category, beds, enabled, appearsOnTabs}
├── statusOptions (PlatformSettingsTab format)
├── developerTiers (PlatformSettingsTab format)
├── globalFilters (PlatformSettingsTab format)
├── meta
└── filterSchema/ (FilterSchemaAdminTab format) ── nested
    ├── propertyTypes (grouped: {group, types[]})
    ├── pricePresets
    ├── statusOptions (DUPLICATE of top-level!)
    ├── tierLabels (DUPLICATE of developerTiers!)
    └── goldenVisaThreshold
```

Both tabs write here. Both have parts the other doesn't. Whichever saves last wins for the overlap.

---

## 3. DIAGNOSED PROBLEMS

### Problem 1: Hardcoded data foundation

**Symptom:** Admin adds project via Data Manager → most tabs don't see it.
**Cause:** 25 tabs read from `src/data/index.js` (the hardcoded foundation), not Firestore.
**Fix:** Master Plan Phase 1 — delete hardcoded data, replace with Firestore reads everywhere.

### Problem 2: Communities admin → dashboard mismatch

**Symptom:** Admin edits community in Data Manager → dashboard never updates.
**Cause:** `CommunitiesSection.jsx` writes to `communityData` collection. Dashboard reads `communities` collection.
**Fix:** Migrate `communityData` (191 docs) into `communities` (231 docs), update CommunitiesSection to write there, delete `communityData`.

### Problem 3: Two admin tabs editing same settings doc

**Symptom:** Admin can edit Property Types in two places, get different results.
**Cause:** FilterSchemaAdminTab and PlatformSettingsTab both write to `platformSettings/main` in different schemas.
**Fix:** Build ONE unified Platform Settings tab. Migrate Firestore doc to a single canonical schema. Delete old tabs.

### Problem 4: Two project managers

**Symptom:** Admin doesn't know which tab to use for projects.
**Cause:** DataManagerV2 → `projects` collection. ProjectManager (legacy) → `projectData` collection.
**Fix:** Pick one. Migrate data. Delete the other.

### Problem 5: 2,023 developers but only 62 visible

**Symptom:** Firestore says 2,023, platform shows 62.
**Cause:** 1,961 are unverified DLD scrape leftovers (filtered correctly by `verified: true`).
**Fix:** Not actually a bug — but the 1,961 should be archived to a separate collection so admin views aren't cluttered.

### Problem 6: Project data hidden

**Symptom:** Only 1 of 94 projects displayed (1 developer, 1 community in dropdowns).
**Cause:** 93 of 94 projects have `visibility: hidden, active: false`.
**Fix:** Either bulk-publish (after review) or build a clear publish workflow in admin.

---

## 4. TARGET ARCHITECTURE

### 4.1 Single source of truth principle

**Every data type has ONE collection, ONE admin writer, ALL tabs read from there.**

| Data type | Collection | Admin writer | Dashboard readers |
|---|---|---|---|
| Developers | `developers` | DataManagerV2 → DevelopersSection | All 33 tabs via `useDevelopers()` |
| Communities | `communities` | DataManagerV2 → CommunitiesSection | All 33 tabs via `useCommunities()` |
| Projects | `projects` | DataManagerV2 → ProjectsSection | All 33 tabs via `useProjects()` |
| Settings/Options | `platformSettings/main` | Platform Settings tab | All 33 tabs via `useFilterSchema()` |
| Market data | `marketData` | MarketIntelligenceTab | Relevant tabs |
| EIBOR rates | `eiborHistory` | EiborRatesPanel | MortgageTab, BankingTab |
| Users/agents | `users` | UsersTab | AuthContext |
| Leads | `platformLeads` | PlatformLeadsTab | MyLeadsTab, PipelineTab |

### 4.2 Two-tab admin (replaces FilterSchema + PlatformSettings + scattered)

#### Tab 1: Content Manager (rename DataManagerV2)

```
Content Manager
├── 📊 Overview        — counts, recent activity, alerts
├── 🏗 Projects         — full CRUD on projects collection
├── 👤 Developers       — full CRUD on developers collection
├── 🏘 Communities      — full CRUD on communities collection
├── 📋 Compliance       — escrow/RERA/DLD numbers
└── ⚖ Claims            — developer claims/disputes
```

**Each row gets ONE status indicator and ONE publish button.** No scattered `verified/active/visibility` flags.

| Status | Means | User sees? |
|---|---|---|
| 🟢 Published | verified=true, active=true, visibility=published | Yes |
| 🟡 Draft | Saved but not yet reviewed | No |
| 🔴 Archived | Removed from platform but kept | No |

#### Tab 2: Platform Settings (consolidates FilterSchema + old PlatformSettings)

```
Platform Settings
├── Property Types       — categories with bed options
├── Statuses             — Off-Plan, Ready, etc.
├── Price Presets        — quick-pick ranges
├── Developer Tiers      — tier-1/2/3 labels
├── Filter Bar Config    — which filters appear on tabs
└── Thresholds           — Golden Visa, etc.
```

#### Other admin tabs stay as-is (different concerns):

- AdminDataHealth — read-only diagnostics
- BillingTab, PricingPlansTab — finance
- NotificationsTab, DigestTab — communications
- SupportTab — customer support
- UsersTab — user management
- ReferralTab — growth
- EiborRatesPanel — financial data feed
- MarketIntelligenceTab — market data feed
- PlatformLeadsTab — sales/CRM
- CancellationTab — churn analysis
- DeveloperPortal — partner-facing

### 4.3 Hook architecture (already partially exists)

Build on existing hooks in `src/hooks/`:

```
useProjects()      → onSnapshot('projects') filtered by published
useDevelopers()    → onSnapshot('developers') filtered by verified, grouped by parentBrand
useCommunities()   → onSnapshot('communities') filtered by verified
useFilterSchema()  → onSnapshot('platformSettings/main') unified schema
useMarketData()    → onSnapshot('marketData') latest rates
useEibor()         → onSnapshot('eiborHistory') latest
```

**Every dashboard tab uses these hooks. No tab imports from `src/data/*` directly anymore.**

---

## 5. MIGRATION PLAN

Total: ~12 sessions over 2-3 days. Each session = 1 commit. Each independently safe.

### Phase A — Data Plumbing (3 sessions)

**A1. Communities collection unification**
- Migrate `communityData` (191 docs) → `communities` (with merge, like our bad-id fix)
- Update CommunitiesSection.jsx to write to `communities`
- Delete `communityData` collection
- Verify dashboard reads consistent data

**A2. Project managers consolidation**
- Audit `projectData` collection (count, format, contents)
- Decide: migrate to `projects`, or delete legacy ProjectManager.jsx
- If migrating: write merge script, run dry-run, apply
- Wire admin sidebar to use only DataManagerV2 → ProjectsSection

**A3. Settings doc unification**
- Define canonical schema for `platformSettings/main` (hybrid: grouped types + flag fields)
- Write migration script: read both formats, merge, save canonical
- Update all tabs that read `platformSettings/main` to use canonical schema

### Phase B — Unified Admin UI (3 sessions)

**B1. New Platform Settings tab**
- Build component combining FilterSchema + PlatformSettings features
- Reads/writes canonical schema
- Side-by-side test against old tabs

**B2. Status indicators in Content Manager**
- Add 🟢🟡🔴 indicator to every row in Projects/Developers/Communities sections
- Replace scattered `verified/active/visibility` toggles with one "Publish" button
- Server-side rule: published = verified+active+visibility=published

**B3. Sidebar reorganization**
- Hide old FilterSchemaAdminTab and old PlatformSettingsTab
- Wire up new unified Platform Settings
- Group sidebar: "Content" (Data Manager + Compliance) vs "Configure" (Settings + Tab Control + Pricing)
- Remove deprecated ProjectManager link if migrated

### Phase C — The Great Purge (5 sessions = original Master Plan Phase 1)

**C1. Audit imports of `src/data/*`**
- Map every file that imports from `src/data/`
- Categorize: which need real data, which can be deleted

**C2-C5. Replace hardcoded data with Firestore reads, tab by tab**
- Group tabs by data dependency
- For each tab: replace `import { X } from "../data"` with `useX()` hook
- Add `<SmartEmptyState>` where data is empty
- Test in browser between each batch

**C6. Delete `src/data/dubai_complete_foundation.js`, `data_developers.js`, `data_emaar_complete.js`**
**C7. Delete `src/communities/*.communities.js` files**
**C8. Verify build, deploy, smoke-test**

### Phase D — Polish (1 session)

**D1. Documentation**
- Update PROJECT_STRUCTURE.md
- Add ADMIN_GUIDE.md showing the unified flow

---

## 6. DECISIONS REQUIRED

Before I start any session, you need to make these calls:

### Decision 1: Settings schema format

How should the unified `platformSettings/main` look? Three options:

- **(A) Grouped only** — categories with nested types (FilterSchema's format)
- **(B) Flat with category field** — flat list, each item has category (PlatformSettings's format)
- **(C) Hybrid** — grouped structure + per-type flag fields (recommended)

### Decision 2: ProjectManager fate

The old `src/admin/ProjectManager.jsx` (68 KB) writes to `projectData`. Do you want to:

- **(A) Migrate `projectData` → `projects`, delete ProjectManager.jsx**
- **(B) Keep ProjectManager as alternative interface**
- **(C) Investigate first** — I check what `projectData` contains and propose

### Decision 3: 1,961 unverified developers

These DLD scrape leftovers clutter admin views. Three options:

- **(A) Move to `developers_archive` collection** — out of admin view, preserved
- **(B) Delete with backup file**
- **(C) Leave as-is** — they're already filtered out, no actual damage

### Decision 4: 93 hidden Emaar projects

Real Emaar projects but unpublished. Three options:

- **(A) Bulk-publish** all 93 — they appear on dashboard
- **(B) Review one-by-one** in new admin UI before publishing
- **(C) Leave hidden** — only Golf Grand visible until you decide

### Decision 5: Pace

How fast do you want to move?

- **(A) One session per day** — careful, low risk, 2-3 weeks total
- **(B) Sprint** — multiple sessions per day when you have energy
- **(C) Pause** — research is enough for now, just keep this document

---

## APPENDIX: NUMBERS THAT MATTER

```
Total hardcoded data to delete:    1,200+ KB
Total tabs to convert to Firestore:    25
Admin tabs to delete:                   2 (FilterSchema, old PlatformSettings)
Admin tabs to merge:                    1 (combine into new PlatformSettings)
Admin tabs to keep as-is:              14
Firestore collections in active use:   ~25
Firestore collections to consolidate:   3 (communityData→communities, projectData→projects?)
Estimated total dev time:        15-20 hours
Estimated time to MVP-clean:      6-8 hours (Phase A + B)
Estimated time to fully purged:   10-15 hours (+ Phase C)
```
