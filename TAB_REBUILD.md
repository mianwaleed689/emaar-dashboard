# DXB ANALYTICS — 34-TAB REBUILD RECORD

Standard: [TAB_STANDARD.md](TAB_STANDARD.md) · Data status:
[TAB_AUDIT.md](TAB_AUDIT.md) (verified against live Firestore 2026-07-29) ·
Filter status: [FILTER_AUDIT.md](FILTER_AUDIT.md)

**Category** — A: wired & real · B: data held locally, needs wiring ·
C: data obtainable, not yet held · D: no source, or user-generated feature not built

**Status** — ☐ not started · ◐ in progress · ☑ meets all seven checks

---

## Category A — wired and real (10 tabs)

Fix filters, add missing controls. No data work needed.

| # | Tab | Job it answers | Known issues |
|---|---|---|---|
| 1 | Projects | Which projects match my criteria? | Filters fixed in `projectStage.js`. Verify remaining controls. |
| 2 | My Leads | Who are my leads and what stage are they at? | 5 filters work, `noteType2` unproven |
| 3 | Neighbourhoods | How does each community compare? | ☑ **Rebuilt 2026-08-02.** Measured Land Department figures replace the assigned ones on 94 of 193 communities; every figure now carries how it was arrived at and how many sales sit behind it. Investment score removed (see B-15). |
| 4 | Investment Score | Which communities score best? | 🔴 **B-15 — awaiting owner decision.** Hand-written weights sold as "AI-powered"; the false claim is fixed, the ranked buy-signal is not. |
| 5 | DLD Volumes | What is transacting, where? | Receives `globalFilters`, never uses it |
| 6 | Data Quality | How complete is our data? | — |
| 7 | Currency | What are today's FX rates? | Live, 1h cache. Cleanest tab in the app. |
| 8 | Team | Who is in my organisation? | — |
| 9 | Agency | How is my agency performing? | Thin: 5 orgs, 26 users. Real but sparse. |
| 10 | Golden Visa | Which properties qualify? | `budgetType` control is **dead** (FILTER_AUDIT) |

## Category B — data held locally, needs wiring (14 tabs)

The DLD files now on disk close these. This is the largest block of real work.

| # | Tab | Source now available | Unblocks |
|---|---|---|---|
| 11 | Yields | `data-audit/yields-dld.json` — 249 cells, 76 master projects | Measured yields replace 28 assigned values |
| 12 | Map | same as above + `area-aliases.json` | ☑ **Done 2026-08-02.** Reads the same `applyMeasured()` as Neighbourhoods, so the two tabs can no longer disagree. Default colouring moved off net yield, which is never measured. |
| 13 | Service Charges | `oa_service_charges` — 91,193 rows, 63 communities, 695 projects | 🔴 EMPTY → real (2024 budget year) |
| 14 | Developer Health | `data-audit/developer-league.json` — 106 developers | ⚫ HARDCODED → real market share |
| 15 | Competitors | same | ⚫ HARDCODED → real comparison |
| 16 | Price History | `transactions` — 878,578 rows with dates | 🟡 0% sourced → fully sourced |
| 17 | DXB Estimate | same | n=10 medians → n in thousands |
| 18 | Handover | `projects.csv` — `completion_date`, `project_end_date`, `percent_completed` | 🔴 EMPTY → real |
| 19 | Launch Calendar | `projects.csv` — 459 NOT_STARTED, 232 PENDING | 30 docs → hundreds |
| 20 | Dev Portal | `developers.csv` — 2,317 registered developers | Beats all four existing sources |
| 21 | Market | `transactions` + Residential Sale Index (C) | ⚫ frozen `GLOBAL_COMPARE: 5` |
| 22 | Banking | `tabData/eiborRates` — **updated today, already in Firestore, unread** | ⚫ → real. One line of code. |
| 23 | Mortgage | same | Only the 6 bank spreads are hardcoded |
| 24 | Overview | aggregates 11–23 | Inherits their gaps; fix last |

## Category C — data obtainable, not yet held (2 tabs)

Available on Dubai Pulse. Download, then treat as B.

| # | Tab | Dataset to pull |
|---|---|---|
| 25 | Compliance | Real Estate Permits · Real Estate Licenses · Licensed Valuators |
| 26 | Risk | Residential Sale Index + transaction volatility (derivable from held data) |

## Category D — no source, or feature not built (8 tabs)

**These cannot be fixed by better filters.** Each needs a decision: remove, or
ship visibly labelled as unavailable. Nine of them currently render hardcoded
numbers as though they were live.

| # | Tab | Why | Options |
|---|---|---|---|
| 27 | STR vs LTR | Short-term rental data is not in DLD. Needs DTCM or AirDNA. LTR half is derivable from rent contracts; STR half is not. | Half-build LTR only, or remove |
| 28 | Listings | Live listings need a Bayut/Property Finder feed. Not open data. | Remove, or licence a feed |
| 29 | Pipeline | `deals` — user-generated CRM data. Not a data problem; the feature to create deals is not built. | Build the feature, or remove |
| 30 | Portfolio | `portfolios` has 1 doc. User-generated. `SEED_PORTFOLIO: 3` is fake. | Build the feature, or remove |
| 31 | Financials | Developer financials. Real for Emaar (investor relations), absent for everyone else. | Emaar-only and labelled, or remove |
| 32 | Flip | Calculator over other tabs' inputs. Logic unverified, inputs from PARTIAL sources. | Verify logic + add tests |
| 33 | Intelligence | AI-generated. Uses a **retired model id** — the call fails. | Fix model id, ground on real data, or remove |
| 34 | Marketing | Same retired model id. 2 dead filters. | Same |

---

## Totals

| Category | Tabs |
|---|---|
| A — fix filters only | 10 |
| B — wire held data | 14 |
| C — fetch then wire | 2 |
| D — decide: remove or label | 8 |

**24 of 34 tabs can be made correct with data already on this machine.**
Eight need a decision rather than a fix.

---

## Progress

| Step | Status |
|---|---|
| Global filter bar — honoured fully by 1 of 34 tabs, ignored by 9 that receive it | ◐ |
| Shared filter primitive — options from data, with counts | ☐ |
| One vocabulary per concept | ☐ |
| Wire DLD data (B block) | ☐ |
| Per-tab pass, seven checks each | ☐ |
| Category D decisions | ☐ |
