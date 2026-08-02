# DXB ANALYTICS — FILTER TRUTH AUDIT

**Generated:** 2026-07-31 · **Method:** static analysis of all 187 files under
`src/`, no Firestore reads. Regenerate with:

```sh
python scripts/dld/filter_inventory.py data-audit/filter-inventory.json
```

Companion to [TAB_AUDIT.md](TAB_AUDIT.md). That one asks *does this tab show
real data*. This one asks *does this control actually do anything*.

---

## Summary

| | Count |
|---|---|
| `<select>` controls found | **193** |
| Literal `<option>` values | **328** |
| Classified as filters | 116 |
| Classified as form inputs (edit a record — correctly do not filter) | 50 |
| Binding expression too complex to classify | 27 |

Narrowing to the **64 user-facing filter controls** (`src/tabs`,
`src/components`, `src/pages`):

| Verdict | Count | Meaning |
|---|---|---|
| 🟢 FILTERS-ROWS | **45** | genuinely narrows a dataset |
| 🟡 COMPARED | **9** | value only read to build a chip label — no data narrowed |
| 🟡 CONSUMED-OTHER | **9** | referenced somewhere, but no row-filtering found |
| 🔴 RENDER-ONLY | **1** | referenced *only* by its own `useState` and its `<select>` |

**45 of 64 user-facing filters work. 19 are unproven or dead.**

---

## 🔴 THE GLOBAL FILTER BAR IS NEVER RENDERED

**This is the root cause.** Verified 2026-07-31:

```
$ grep -rn "<GlobalContextFilter" src/
   (no matches — 0 JSX usages)
```

The component exists **twice**, and neither copy is on screen:

| Copy | Lines | Status |
|---|---|---|
| [src/components/GlobalContextFilter.jsx](src/components/GlobalContextFilter.jsx) | 115 | exported from `components/index.js`, **never imported by anything** |
| `EmaarDashboardV2.jsx:299` | ~440 | defined inline, **never rendered as JSX** |

All six controls — developer (`SearchableSelect:667`), community (`:700`),
type (`:685`), beds (`:717`), status (`:726`), price (`:734`) — sit inside the
component declared at line 299. The live dashboard component does not begin
until **line 2142**. Everything above it is unreachable.

**So there is no way for a user to set a global filter through the UI at all.**
The filter *state* is real — `useFilters()` keeps it in context and syncs it to
the URL — and six tabs genuinely honour it. But nothing writes to it except
query parameters.

This explains why the dead controls were never reported: they were never on
screen to be clicked.

> **Two earlier corrections, recorded so the reasoning is auditable.**
> This audit first said the five controls "filter nothing anywhere" — wrong,
> because the search used the bar's variable names (`gStatus`, `gBeds`) while
> consumers read the same values off the `globalFilters` prop under different
> local names (`gfStatus`, `gfBeds`). It then said the bar "looks global and
> behaves locally" — true of the consumption side, but it assumed the bar was
> rendered. It is not. The consumption table below is still accurate and still
> matters, because it defines what will work the moment the bar is mounted.

### Consumption — accurate, and what will apply once the bar is mounted

**15 of 34 tabs receive `globalFilters`. Only 1 honours all of it.**

| Tab | Keys honoured |
|---|---|
| [ProjectsTab](src/tabs/ProjectsTab.jsx) | `developer`, `community`, `status`, `beds`, `priceMin`, `priceMax` — **complete** |
| CompetitorsTab · DeveloperHealthTab · FinancialsTab | `developer` only |
| PriceHistoryTab · RiskTab | `community` only |
| CommunityMapTab · DLDVolumesTab · DXBEstimateTab · HandoverTab · InvestmentScoreTab · LaunchCalendarTab · ServiceChargesTab · STRvsLTRTab · YieldsTab | **none** — prop received, never read |
| the other 19 tabs | prop not passed at all |

`gPropertyType` is honoured by **no tab**. ProjectsTab skips it deliberately —
there is a comment saying the tab has its own type pills — so the global type
control has no consumer anywhere.

**Effect:** the bar looks global and behaves locally. A user sets
"Emaar · 2 BR · Ready · under 3M" on Projects and sees it work, then switches to
Yields and the same bar still shows "4 filters active" while Yields ignores
every one of them. The chip is telling the truth about the *bar* and a lie about
the *page*.

That is the structural defect: **there is no contract**. Each tab decides
independently whether to honour a control, and nothing makes that visible to
the user or enforceable in code.

### [GoldenVisaTab.jsx:167](src/tabs/GoldenVisaTab.jsx#L167) — `budgetType`

Offers "Single Property" / "Portfolio". Exactly two references in the file:
the `useState` on line 150 and the `<select>` on line 167. Nothing reads it.
This is on a tab marked 🟡 PARTIAL — i.e. one you intend to ship.

---

## 🟡 UNPROVEN — needs a human to confirm

| File | Control | Note |
|---|---|---|
| [CompetitorsTab.jsx](src/tabs/CompetitorsTab.jsx) | `cptMetric`, `cptDevA`, `cptDevB` | Tab is ⚫ HARDCODED (`COMP_DATA: 24`). Even if wired, they filter a frozen array. |
| [FinancialsTab.jsx](src/tabs/FinancialsTab.jsx) | `finDeveloper`, `finCompareDev` | Tab is 🔴 EMPTY — `financials` collection missing. |
| [MarketingTab.jsx](src/tabs/MarketingTab.jsx) | `mktListingType`, `mktListingBeds` | |
| [IntelligenceTab.jsx](src/tabs/IntelligenceTab.jsx) | `compCommunity` | |
| [MyLeadsTab.jsx](src/tabs/MyLeadsTab.jsx) | `noteType2` | Likely a form input mis-binned. |

---

## Why this happens — three structural causes

### 1. Five competing `STATUS_OPTIONS`

| Source | |
|---|---|
| [constants.js:52](src/utils/constants.js#L52) | 8 options |
| [filterSchemaDefaults.js:60](src/utils/filterSchemaDefaults.js#L60) | `STATUS_OPTIONS_DEFAULT` |
| [EmaarDashboardV2.jsx:227](src/pages/EmaarDashboardV2.jsx#L227) | local redefinition |
| `dubai_complete_foundation.js:394` | another |
| Firestore filter schema | `STATUS_OPTIONS_LIVE` |

One concept, five vocabularies. Nothing forces them to agree, and nothing
checks any of them against the data.

### 2. Options are hardcoded, never derived from records

`constants.js` offers `handover_2026`, `handover_2027`, `ready_new`,
`secondary`. **No project record uses those words.** Each would return zero
even after being wired up.

The same defect, already measured in [projectStage.js](src/utils/projectStage.js):
of the four options the Projects dropdown offered, **three matched zero records
and the fourth matched 31 of 1,728.**

### 3. Options offered for fields that are empty

`propertyType` is populated on **3 of 40** sampled projects (7.5%). The type
filter offers **20 options across 4 groups** — `apartment`, `penthouse`,
`sky_villa`, `branded_res`, `coworking`, `land_res`, `land_comm`, `land_mixed`
and more. Wiring it correctly today would still return nothing for almost every
selection.

---

## The pattern that already works

[src/utils/projectStage.js](src/utils/projectStage.js) is the template. It:

1. **Measured the data first** and wrote the counts into the file
2. Derived **one canonical value** used by *both* the filter and the card badge
3. **Dropped "Historical"** because nothing in the data could distinguish it
   from "Recently Delivered" — rather than offer a filter that silently
   returns nothing

Applied generally, that gives four rules:

- **One vocabulary per concept.** One function, filter and display both derive from it.
- **Build options from the data, not from a literal.** Then an option can never match zero.
- **Put the count in the label** — "Under Construction (1,216)". A broken filter becomes self-evident.
- **Rendered means applied.** A control that does not filter must not render.

---

## Reading the machine output

`data-audit/filter-inventory.json` carries every control with its file, line,
bound variable, option list and evidence lines.

**The classifier is a regex over JSX, not a parser.** It was wrong in both
directions during this audit and both modes are fixed, but treat every verdict
as a lead:

- It first called [DXBEstimateTab.jsx:180](src/tabs/DXBEstimateTab.jsx#L180)
  `floor` dead. It is not — `FLOOR_MULTIPLIER[floor]` on line 82 consumes it via
  bracket index, which the pattern missed. **That filter works.**
- It first cleared `gStatus` as working, because the `<select>` line itself
  contains `e.target.value` and `!==` and looked like a predicate.
- **It cannot follow a value across a prop rename.** `gStatus` in the bar is
  `globalFilters.status` in the page and `gfStatus` inside the tab. Classifying
  by variable name says "dead" when the value is very much alive. This is why
  the global-bar section above needed correcting, and it is the tool's most
  serious limitation.

Confirm before you delete anything.
