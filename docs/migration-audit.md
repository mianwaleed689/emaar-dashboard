# DXB Analytics — Seed Data Migration Audit
**Status:** Complete (Session 6 audit phase)
**Date:** 8 April 2026
**Next:** Session 6 implementation phase will use this document as the working spec.

## Why this document exists

Session 6 was originally planned as "write the migration script and run it." During the audit phase we discovered the seed data is more complex than expected:
- Multiple seed sources in different files with different shapes
- Some seed data is project records (the "brain of the SaaS"), some is market statistics, some is reference data (communities, DLD volumes, price history)
- The schema spec from Session 4 only defines a `projects` collection, not the other shapes
- Two duplicate definitions of `SEED_DATA` exist (one in `utils/seedData.js`, one inline in `EmaarDashboardV2.jsx`) — the dashboard's inline copy is dead code that nobody imports from

This document captures everything we found, then locks the scope of the actual migration to keep Session 6 finishable.

---

## Inventory: every seed source in the codebase

### Source 1 — utils/seedData.js (the shared module)
**File:** `src/utils/seedData.js`
**Variable:** `SEED_DATA` (object)
**Used by:** 7 tabs import this directly:
- `DLDVolumesTab.jsx` (line 13)
- `MarketTab.jsx` (line 12)
- `MortgageTab.jsx` (line 13)
- `NeighbourhoodsTab.jsx` (line 13)
- `OverviewTab.jsx` (line 8)
- `PriceHistoryTab.jsx` (line 13)
- `YieldsTab.jsx` (line 13)

**Shape:** A nested object with multiple keys, each containing a different dataset:
- `SEED_DATA.market` — array of market statistics (e.g. "Total Market Value: AED 682.6B")
- `SEED_DATA.communities` — array of community/neighbourhood records
- `SEED_DATA.dldVolumes` — array of DLD transaction volume data
- `SEED_DATA.priceHistory` — array of price history records
- `SEED_DATA.overviewKpis` — array of overview tab KPIs
- (more keys to be enumerated when needed)

**Migration target:** This is NOT project records. It's a mix of market statistics, reference data, and historical metrics. Each key would need its own Firestore collection (`marketStats`, `communities`, `dldVolumes`, `priceHistory`, etc.) — and most of those are not in the Session 4 schema spec.

**Decision: NOT migrated in Session 6.** Stays as seed data for now. Will be migrated in a later session (likely Session 19 polish phase) once the schema spec is extended to cover these collections.

### Source 2 — EmaarDashboardV2.jsx inline SEED_DATA (DEAD CODE)
**File:** `src/EmaarDashboardV2.jsx` line 495
**Variable:** `SEED_DATA` (object)
**Used by:** Nobody. The first 30+ lines are byte-for-byte identical to `utils/seedData.js`. Whoever extracted the shared module never deleted the original.

**Decision: Mark for deletion.** Not part of migration. Add to post-launch backlog as code cleanup. Estimated 400-500 lines of dead code that can be safely removed in a separate session.

### Source 3 — SEED_PROJECTS (the brain of the SaaS)
**File:** `src/EmaarDashboardV2.jsx` line 2650
**Variable:** `SEED_PROJECTS` (array)
**Used by:** Passed as a prop to ProjectsTab and GoldenVisaTab from the dashboard render.

**Shape:** Project records — the actual property data that makes DXB Analytics a real estate intelligence platform. Field names not yet sampled but expected to include things like name, developer, community, type, bedrooms, ppsf, gross yield, handover date, etc.

**Migration target:** Firestore `projects` collection in the new Schema v1 shape.

**Decision: PRIMARY MIGRATION TARGET.**

### Source 4 — SEED_LAUNCHES
**File:** `src/tabs/LaunchCalendarTab.jsx` line 35
**Variable:** `SEED_LAUNCHES` (array)
**Used by:** LaunchCalendarTab only.

**Shape:** Off-plan launch records. Sample of first record (lines 36-86):
- Fields seen: id, project, developer, community, type, tier, branded, launchDate, eoiDeadline, status, units, soldUnits, startingPrice, pricePerSqft, avgUnitSize, eoiAmount, eoiRefundable, paymentPlan (object), handover, developerOnTimeRate, communityAvgPpsf, appreciationToHandover, goldenVisa, metroDistanceKm, beachAccess, insight, velocityScore, tags, grossYield, netYield, serviceCharge

**Migration target:** Firestore `projects` collection. Each launch becomes a project record with `saleStatus: "off-plan"`.

**Decision: PRIMARY MIGRATION TARGET.**

### Source 5 — SEED_HANDOVERS
**File:** `src/tabs/HandoverTab.jsx` line 35
**Variable:** `SEED_HANDOVERS` (array)
**Used by:** HandoverTab only.

**Shape:** Handover/construction tracking records. Field names not yet sampled but expected to overlap heavily with SEED_LAUNCHES.

**Migration target:** Firestore `projects` collection. Each handover becomes a project record with `saleStatus: "off-plan"` or `"ready"` depending on construction status.

**Decision: PRIMARY MIGRATION TARGET.**

### Source 6 — SEED_SOURCE_URL (NOT seed data)
**Files:** `src/utils/constants.js` line 140 and `src/EmaarDashboardV2.jsx` line 632
**Variable:** `SEED_SOURCE_URL` (string)

**Decision: IGNORED.** Despite the name, this is a constant string (probably a label or URL), not seed data. Not part of migration.

---

## Scope decision: projects-only for Session 6

**Migrating in Session 6 (next session):**
- `SEED_PROJECTS` (EmaarDashboardV2.jsx line 2650)
- `SEED_LAUNCHES` (LaunchCalendarTab.jsx line 35)
- `SEED_HANDOVERS` (HandoverTab.jsx line 35)

All three transform into the same Firestore `projects` collection in the Schema v1 shape. Records that appear in multiple sources will be deduplicated by `developer + name + bedrooms` deterministic ID.

**NOT migrating in Session 6:**
- `SEED_DATA.market`, `SEED_DATA.communities`, `SEED_DATA.dldVolumes`, `SEED_DATA.priceHistory`, `SEED_DATA.overviewKpis`, etc. — all the keys inside the shared `seedData.js` module. These need their own Firestore collections (`marketStats`, `dldVolumes`, etc.) which are not yet in the schema spec.

**Reasoning:** The "brain of the SaaS" is project records. Buyers, agents, banks, brokers all care about projects first. Market statistics and reference data are secondary. Migrating only projects in Session 6 lets the next session actually finish, and lets the new Data Manager (Sessions 8-10) and dashboard tab wiring (Sessions 11-13) start operating against real project data.

The other seed sources stay as static seed data for the launch. Tabs reading from them will continue to show the seed data warning banner (when we wire it up). Migrating them becomes a Session 19 or 20 task (post-launch polish), at which point the schema can be extended to cover the additional collections cleanly.

---

## What still needs to be done before Session 6 implementation

These are the questions Session 6 will need answered before writing the migration script:

1. **Sample SEED_PROJECTS field shape** (Dashboard line 2650 — read 50 lines)
2. **Sample SEED_LAUNCHES field shape** (LaunchCalendarTab line 35 — done, see Source 4 above)
3. **Sample SEED_HANDOVERS field shape** (HandoverTab line 35 — read 50 lines)
4. **Build the field-name mapping table** — every old field name → new schema field name, with defaults for missing fields
5. **Decide deduplication key** — likely `slugify(developer + name + bedrooms)`
6. **Decide tenure default** — most Dubai launches in freehold areas are `tenure: "freehold"`, but some plots are leasehold. Default to freehold and flag any plot records for human review.
7. **Decide foreign ownership default** — most projects are in freehold zones (foreignOwnershipAllowed: true), but some aren't. Default true, flag exceptions.
8. **Decide dldClass default** — apartment → "unit", villa/townhouse → "villa", land plot → "land". Derive from `type`.
9. **Set source verification flag** — all migrated records get `sourceVerified: false` initially, since they came from hardcoded arrays not from official sources. The admin team can verify them later through the new Data Manager.

---

## Post-launch backlog items added by this audit

1. **Delete the dead inline SEED_DATA in EmaarDashboardV2.jsx (line 495+)** — duplicates the shared module, ~400-500 lines of dead code.
2. **Migrate SEED_DATA.market, SEED_DATA.communities, etc. to Firestore collections** — Session 19 or 20 work after launch. Requires extending schema spec to define `marketStats`, `dldVolumes`, `priceHistory`, etc. collections.
3. **Confirm whether GoldenVisaTab needs SEED_PROJECTS as a separate prop or if it can read from the migrated Firestore collection** — line 12 of GoldenVisaTab destructures `SEED_PROJECTS` from props. After Session 6, the prop becomes redundant for any tab reading from Firestore, but GoldenVisaTab might still need it as a fallback during the transition.