# DXB Analytics — Data Sources Strategy
**Status:** Locked (Session 6 course-correction)
**Date:** 8 April 2026
**Scope:** 400-500 communities, 100+ developers, thousands of projects, tens of thousands of unit variants across Dubai real estate. Enterprise-scale intelligence platform.

## Why this document exists

Session 6 originally planned to migrate hardcoded seed data into Firestore. We stopped and re-scoped when the product owner clarified that (1) the seed data is garbage and will not live in production, (2) Dubai has 400-500 communities and 100+ developers, and (3) DXB Analytics is an enterprise intelligence platform, not a toy dashboard.

This document defines where every category of data in DXB Analytics actually comes from. It is the authoritative source of truth for every migration, every admin workflow, every automated feed, every data refresh cycle. Every future session reads this document before deciding what to build.

---

## Key discovery: Dubai Pulse is the backbone

Dubai Land Department (DLD) publishes an official, government-backed, free, comprehensive open-data portal called Dubai Pulse at `dubaipulse.gov.ae`. It provides authenticated APIs AND direct CSV downloads for every piece of reference data DXB Analytics needs. This is the foundation for the entire data strategy.

Access model:
- Public CSV downloads: free, no authentication needed
- Authenticated APIs: free, require registering an app to get API key + secret
- OAuth2 token-based authentication
- CKAN-based data portal (industry standard for open government data)

Legal basis: Dubai Data Law (26 of 2015) and Dubai Data Establishment Law (2 of 2016) explicitly authorize public use of this data. DXB Analytics using Dubai Pulse data is legal and encouraged.

Update frequency: most DLD datasets refresh daily (transactions) or monthly (developers, projects, licenses).

---

## Datasets we will use

### 1. Developers reference (`dld_developers-open`)
- **URL:** https://www.dubaipulse.gov.ae/data/dld-registration/dld_developers-open
- **What it is:** The complete official list of every RERA-licensed real estate developer in Dubai. This is THE source — every developer operating legally in Dubai is in this dataset.
- **Format:** CSV download + authenticated API
- **Records:** 100+ active developers (per product owner estimate; actual count known after download)
- **Use in DXB Analytics:** Populates the `developers` Firestore collection (schema spec Section 4.1). Every project record links to a developer from this list.
- **Session:** First real migration. Will replace the current fake developer list from seed data.

### 2. Projects reference (`dld_projects-open`)
- **URL:** https://www.dubaipulse.gov.ae/data/dld-registration/dld_projects-open
- **What it is:** Every project registered with DLD. Includes name, developer, location, registration status, completion percentage, unit counts.
- **Format:** CSV download + authenticated API
- **Records:** Thousands (full Dubai project inventory)
- **Use in DXB Analytics:** Populates the `developments` Firestore collection (schema v2 Section 2A). Each DLD project becomes one development record; the admin team (or a future extraction pipeline) fills in the per-variant `projects` children.
- **Session:** After developers migration. Sequentially, because projects reference developers.
- **Caveat:** DLD project data has the regulatory and identity fields. It does NOT have marketing material like brochures, renders, payment plans, or variant pricing. Those come from developer portals, admin entry, or scraped sources.

### 3. Transactions (`dld_transactions-open`)
- **URL:** https://www.dubaipulse.gov.ae/data/dld-transactions/dld_transactions-open
- **What it is:** Every real estate transaction registered with DLD. The actual market data — who bought what, when, for how much.
- **Format:** CSV download + API
- **Records:** Millions of historical transactions, updated daily with new ones
- **Use in DXB Analytics:** Populates the `transactions` Firestore collection (schema spec Section 4.5). Powers the Market tab, DLD Volumes tab, Price History tab, and anything that shows actual sale/rental activity.
- **Session:** Can happen in parallel with developers/projects migration because it does not depend on them.
- **Volume consideration:** This dataset is huge. Probably not migrated "all at once" — instead, the framework pulls it incrementally (e.g., rolling 24-month window) and stores aggregates, not every row.

### 4. Areas / Communities (`dld_lkp_areas-open`)
- **URL:** https://www.dubaipulse.gov.ae/data/dld-transactions/dld_lkp_areas-open
- **What it is:** The official DLD lookup table of area IDs and area names used in all DLD datasets. This is how DLD itself groups Dubai geographically — it IS the communities list.
- **Format:** CSV download
- **Records:** 400-500 areas (matches the product owner estimate)
- **Use in DXB Analytics:** Populates the `communities` Firestore collection (schema spec Section 4.2). Every development and project references a community from this list.
- **Session:** First migration — runs BEFORE developers and projects because both reference communities.
- **Note:** DLD areas list is authoritative for names and IDs but does NOT include boundaries (GeoJSON), metro access data, school counts, or population. Those come from Dubai Statistics Center (DSC) datasets (also on Dubai Pulse — `dsc_population_by_community`) and from manual enrichment.

### 5. Real estate licenses (`dld_real_estate_licenses-open`)
- **URL:** https://www.dubaipulse.gov.ae/data/dld-licenses/dld_real_estate_licenses-open
- **What it is:** Every licensed real estate company in Dubai — brokerages, management companies, consultancy firms.
- **Format:** CSV + API
- **Use in DXB Analytics:** Populates the `brokerages` collection (already exists in firestore.rules). Used for the Broker Directory feature and for validating agent affiliations.
- **Session:** Part of the developers/brokerages migration wave.

### 6. Rental Index & Sales Index
- **Sales Index dataset:** `dld_residential_sale_index-open`
- **URL:** https://www.dubaipulse.gov.ae/data/dld-transactions/dld_residential_sale_index-open
- **What it is:** The official DLD sales price index (REIDIN-style) published in cooperation with Property Finder. Base: January 2012.
- **Rental Index:** Similar dataset, published via the DLD Rental Index API (requires registration).
- **Use in DXB Analytics:** Populates the Market tab and Price History tab with REAL market indices instead of fake seed data.
- **Session:** Part of the market data migration wave (after projects because some index values are community-level).

### 7. Dubai Statistics Center (DSC) — population, buildings
- **Population by community:** `dsc_population_by_community`
- **Buildings:** `dsc_buildings-open`
- **URL:** via Dubai Pulse portal
- **Use in DXB Analytics:** Enriches the `communities` collection with population counts, building counts, household sizes. Powers the Neighbourhoods tab with real demographic data.
- **Session:** Enrichment wave, after the initial communities migration is done.

---

## Data that does NOT come from Dubai Pulse

### 8. Developer marketing material (brochures, renders, payment plans, launch info)
DLD data is regulatory and factual. It does not include the marketing material developers use to sell their projects. Sources for this:
- **Primary:** Admin manual entry via the Data Manager (Sessions 8-10). Your admin team adds marketing info to the DLD-imported developments.
- **Secondary (future):** Scraping legal sources like developer official portals (Emaar, DAMAC, Sobha, etc.), aggregator feeds (Bayut, Property Finder, Dubizzle), or press release feeds. All scraping needs legal review per jurisdiction.
- **Tertiary (future):** Direct partnership APIs with Bayut, Property Finder, or Dubizzle if we negotiate data sharing agreements.
- **Session:** Entirely manual in the launch phase. Automated sources become a post-launch growth lever.

### 9. Per-variant pricing (1BR vs 2BR vs 3BR price ranges)
Same as above. DLD knows a project has N units, but not what each bedroom type costs. This data comes from:
- Admin manual entry
- Developer brochures (uploaded via Data Manager, OCR/extracted in future enhancements)
- Scraped aggregators (future)

### 10. News and insights
- **Sources:** Dubai Pulse does not publish news. News comes from:
  - DLD press releases (scraped from dubailand.gov.ae news page)
  - Gulf News, Khaleej Times, The National real estate sections (RSS feeds or scraping)
  - Arabian Business, Zawya (business news feeds)
  - Developer press releases
  - Manual curation by admin team
- **Use:** Populates the `news` Firestore collection (schema spec Section 4.4). Powers the News tab, the 24/7 newspaper feature mentioned in the product vision.
- **Session:** News feed automation is a post-launch feature. Launch phase uses manual curation via the admin Data Manager.

### 11. Economic indicators (EIBOR, mortgage rates, currency rates)
- **EIBOR (Emirates Interbank Offered Rate):** UAE Central Bank publishes this. Free, official. No API — scraped from the central bank website or from Reuters/Bloomberg.
- **Mortgage rates:** Individual bank websites, aggregated. Bayut and Property Finder publish indicative rates. No single source.
- **Currency rates:** UAE Central Bank publishes official AED rates daily. Alternative: use a general FX API like OpenExchangeRates or ExchangeRate-API (both have free tiers).
- **Use:** Powers the Mortgage tab, the multi-currency display on project cards, the fxRates collection (schema spec Section 4.3).
- **Session:** Currency rates needed early (Session 7 cloud functions). Mortgage rates can be post-launch.

### 12. AI insights, reports
- **Source:** Generated in-house using Claude, OpenAI, or similar LLM APIs to analyze the real data in our Firestore collections.
- **Use:** Powers the AI Insights tab, the Reports tab.
- **Session:** After the core data layer is stable (Session 15+). These are value-add features, not launch requirements.

---

## The revised Session 6 implementation plan

Given everything above, Session 6 implementation becomes:

### Session 6A — Migration framework core
Build the framework with proper enterprise-scale features:
- `scripts/migrate.js` — runner with `--dry-run`, `--live`, `--source=X`, `--resume` flags
- `scripts/firestore-writer.js` — batched writes (500/batch Firestore limit), progress reporting, resume capability, rate limiting
- `scripts/dubai-pulse-client.js` — wrapper for Dubai Pulse API calls (OAuth, CSV download fallback, error handling)
- `scripts/migrations/` — folder for transformer plugins, one per data source

Framework does NOT include any data yet. It is infrastructure, tested by migrating a tiny dataset (the 10-item property types list we already have) as a smoke test.

### Session 6B — Communities migration
First real migration using the framework:
- Download `dld_lkp_areas-open` CSV from Dubai Pulse
- Transform to `communities` collection shape per schema spec Section 4.2
- Dry-run, review, live-write
- Enrich with `dsc_population_by_community` data

After Session 6B, DXB Analytics has 400-500 real communities in Firestore. Three dashboard tabs can immediately start showing real data.

### Session 6C — Developers migration
- Download `dld_developers-open` CSV
- Transform to `developers` collection shape per schema spec Section 4.1
- Dry-run, review, live-write

After Session 6C, DXB Analytics has 100+ real developers in Firestore with RERA license numbers, establishment years, and regulatory status.

### Session 6D — Projects migration (developments collection)
- Download `dld_projects-open` CSV
- Transform to `developments` collection shape per schema v2 Section 2A
- Links to communities and developers from Session 6B and 6C
- Dry-run, review, live-write

After Session 6D, DXB Analytics has thousands of real developments. The main ProjectsTab can immediately start showing real Dubai projects.

### Session 6E — Transactions migration (rolling window)
- Connect to Dubai Pulse `dld_transactions-open` API
- Incremental pull (24-month rolling window, not full history)
- Transform to `transactions` collection shape per schema spec Section 4.5
- Live-write via scheduled cloud function (daily refresh)

After Session 6E, DXB Analytics has real transaction data powering the Market, DLD Volumes, Price History tabs.

### Session 6F — Market data wave
- Sales Index, Rental Index from Dubai Pulse
- Population data from DSC
- Building data from DSC
- Transform and populate supporting collections

After Session 6F, every market-data-driven tab has real data behind it.

---

## What is NOT in Session 6

These items are explicitly deferred to later sessions:

- **Per-variant pricing** — DLD data has projects but not bedroom-type pricing breakdowns. This comes from admin entry (Sessions 8-10) or from future scraping (post-launch)
- **Marketing material** — brochures, renders, payment plans, launch info. Admin entry or post-launch automation
- **News feed automation** — manual curation at launch; automated feeds post-launch
- **AI insights generation** — post-launch feature
- **Mortgage rate aggregation** — post-launch or Session 18
- **Any data scraping from Bayut/Property Finder/Dubizzle** — requires legal review, defer to post-launch unless explicitly approved

## What Session 6 is NOT anymore

The original Session 6 plan was to migrate SEED_PROJECTS, SEED_LAUNCHES, and SEED_HANDOVERS from the hardcoded tab files into Firestore. That plan is cancelled. The seed data will be deleted entirely in Sessions 11-13 when the tabs are wired to read from the migrated Firestore collections (which will contain real DLD data, not seed data). At no point does seed data enter the Firestore database. This is a clean break.

---

## Legal checklist before Session 6 implementation begins

Before running any of the Dubai Pulse migrations, confirm:

1. **Dubai Pulse terms of service** have been read and accepted. Free for public use per Dubai Data Law but there may be attribution requirements or rate limits.
2. **API registration done** if we are using API access (not strictly necessary for CSV downloads). Register an application on dubaipulse.gov.ae, receive API key and secret via email (2-day turnaround per the docs), store credentials in environment variables (never committed).
3. **Attribution plan** — when we display data that originated from DLD (transactions, prices, developer licenses), the dashboard needs a small "Source: DLD / Dubai Pulse" attribution somewhere visible. Add to footer or per-card.
4. **Update cadence** documented — tell users how fresh the data is. "Transactions: updated daily via Dubai Pulse" / "Developer list: refreshed monthly."

Product owner confirms all four before Session 6A starts.

---

## The framework pattern (for future reference)

Every future migration follows this pattern:

1. **Read**: fetch data from source (Dubai Pulse API, CSV download, admin upload, etc.)
2. **Validate source**: confirm the data is what we expect — row count sane, required columns present
3. **Transform**: map source fields to schema v2 collection shape using a transformer module
4. **Validate output**: run every transformed record through `projectValidation.js` validators
5. **Dedupe**: collapse any duplicates using deterministic IDs
6. **Dry-run**: print summary — total read, total valid, total invalid, total deduped, sample output
7. **Review**: human reviews dry-run output before any writes
8. **Live-write**: batch-write to Firestore with progress reporting, rate limiting, resume capability
9. **Audit**: every write creates an entry in the relevant `auditLog` subcollection with `source`, `timestamp`, `reason: "migration"`
10. **Verify**: post-migration check — count Firestore documents, spot-check a few records

Following this pattern, every future migration is safe, repeatable, auditable, and professionally executed.

---

## Summary table: what every data source feeds

| Data source | Destination collection | Schema reference | First session |
|---|---|---|---|
| Dubai Pulse `dld_lkp_areas-open` | `communities` | Section 4.2 | 6B |
| Dubai Pulse `dld_developers-open` | `developers` | Section 4.1 | 6C |
| Dubai Pulse `dld_projects-open` | `developments` | Section 2A | 6D |
| Dubai Pulse `dld_transactions-open` | `transactions` | Section 4.5 | 6E |
| Dubai Pulse `dld_residential_sale_index-open` | `priceIndex` (new) | TBD Session 19 | 6F |
| Dubai Pulse `dsc_population_by_community` | enriches `communities` | Section 4.2 | 6F |
| DLD Rental Index API | `rentalIndex` (new) | TBD Session 19 | 6F |
| Admin Data Manager | `projects` (unit variants) | Section 2B | 8-10 |
| UAE Central Bank (currency) | `fxRates` | Section 4.3 | 7 |
| Manual curation + press releases | `news` | Section 4.4 | launch phase |
| In-house LLM analysis | `aiInsights`, `reports` | not yet in spec | post-launch |

Every row in this table corresponds to a future, concrete migration or manual workflow. No more guessing. No more fake seed data.