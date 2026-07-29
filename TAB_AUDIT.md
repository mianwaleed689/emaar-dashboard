# DXB ANALYTICS — TAB TRUTH AUDIT

Verified against the **live Firestore database** on 2026-07-29, not against documentation.
This supersedes `TAB_DEFINITIONS.md`, which is inaccurate in both directions.

**Legend**
| Mark | Meaning |
|---|---|
| 🟢 REAL | Backed by live data. Safe to sell. |
| 🟡 PARTIAL | Real data, but incomplete, stale, or unsourced. Ship with caveats. |
| 🔴 EMPTY | Reads a collection that does not exist. Renders nothing. **Hide before launch.** |
| ⚫ HARDCODED | Shows frozen numbers as if they were live. **Highest reputational risk.** |

---

## Summary

| Verdict | Count |
|---|---|
| 🟢 REAL | 9 |
| 🟡 PARTIAL | 9 |
| 🔴 EMPTY | 7 |
| ⚫ HARDCODED | 9 |

**9 tabs are genuinely sellable today.** 16 must be hidden or fixed before charging money.

---

## 🟢 REAL — ship these

| Tab | Data source | Verified |
|---|---|---|
| Projects | `projects` | 1,728 docs, zero duplicate DLD ids |
| My Leads | `leads` | 232,821 docs |
| Neighbourhoods | `neighbourhoodScores` | 281 docs |
| Investment Score | `neighbourhoodScores` | 281 docs |
| Yields | `yieldData` + `liveMarketData/latest` | 176 docs; Bayut synced **today**, 49 communities |
| DLD Volumes | `tabData/dldVolumes` | **185 live rows** — `TAB_DEFINITIONS.md` wrongly calls this "PLACEHOLDER" |
| Data Quality | `projects` (direct read) | 1,728 docs |
| Currency | `/api/proxy?service=rates` | Live FX, 1h cache |
| Team | `leads`, `organisations`, `users` | 232,821 / 5 / 26 |

---

## 🟡 PARTIAL — real, but with a caveat that must be disclosed

| Tab | Issue |
|---|---|
| Map | **178 of 253 communities (70%) have no `grossYield`.** Most pins can show no yield. |
| Overview | Aggregates the tabs below it — inherits their gaps. |
| Price History | 122 docs, **0% carry a `source` field**. Unattributable numbers. |
| DXB Estimate | Community medians computed from as few as **10 transactions** (`recentSampleSize: 10`). Defensible as an estimate; must be labelled as one. |
| Golden Visa | `projects` is real; `VISA_FACTS`/`STEPS` are hardcoded reference text (acceptable — rules, not market data). |
| Flip | Calculator logic **not yet verified by me**. Inputs come from PARTIAL sources. |
| Agency | `organisations` (5), `users` (26) — thin but real. |
| Launch Calendar | `radarLaunches` (30 docs); `launches` collection is **missing**. |
| Dev Portal | `developers` (2,034) real; `devEOIs` and `devUnits` both **missing**. |

---

## 🔴 EMPTY — built, wired to nothing. Hide before launch.

| Tab | Reads | Status |
|---|---|---|
| STR vs LTR | `strData`, `tabData/strLtrData` | both missing — `TAB_DEFINITIONS.md` calls this "WORLD CLASS ✅" |
| Service Charges | `serviceCharges`, `tabData/serviceCharges` | both missing — also marked "WORLD CLASS ✅" |
| Handover | `handover` | missing |
| Listings | `listings` | missing |
| Pipeline | `deals` | missing |
| Financials | `financials` | missing |
| Compliance | `compliance`, `reraCards` | both missing |

---

## ⚫ HARDCODED — frozen numbers presented as live market data

**This is the category most likely to lose a paying customer.**

| Tab | Hardcoded block | Live source that exists but is ignored |
|---|---|---|
| Mortgage | `BANKS: 6` | **CORRECTION:** Mortgage *does* read live EIBOR (`tabData/eiborRates`, wired at EmaarDashboardV2.jsx:3597) and labels live vs fallback. Only the 6 bank spreads are hardcoded. |
| Banking | `BANKS: 8`, `EIBOR_HISTORY: 9` | **`tabData/eiborRates` — updated today, with `source` and `asOf` fields** |
| Developer Health | `HEALTH_SCORES: 30` | `tabData/developerHealth` missing |
| Competitors | `COMP_DATA: 24` | `tabData/competitorData` missing |
| Risk | `RISK_FACTORS: 18` | `tabData/riskFactors` missing |
| Market | `GLOBAL_COMPARE: 5` | `tabData/marketData` exists but is **128 days stale** and unread |
| Intelligence | `SUPPLY_PIPELINE`, `RISK_ZONES` | AI call uses a **retired model id** |
| Marketing | — | Same retired model id |
| Portfolio | `SEED_PORTFOLIO: 3` | `portfolios` has 1 doc |

---

## Data your pipeline produces that the UI never reads

The crons are healthier than the interface. These documents exist and are **not consumed by any tab**:

| Document | Freshness | Contains |
|---|---|---|
| `tabData/eiborRates` | **updated today** | 1m / 3m / 6m / 1y rates, plus `source` and `asOf` |
| `tabData/yieldSummary` | **updated today** | per-community yield summary |
| `tabData/marketData` | 128 days old | 8 metric rows with `source` and `period` |
| `tabData/news` | 110 days old | 7 headlines with source URLs |
| `eiborHistory` | 1 doc | rates + `previousRates` |

**Quick win:** Banking and Mortgage display frozen EIBOR while correctly-sourced, same-day EIBOR sits one line of code away.

---

## Structural faults behind these symptoms

1. **Split-brain admin.** `AdminPanel.jsx` writes project edits to `projectData` (**missing**); `DataManagerV2/ProjectsSection.jsx` writes to `projects` (1,728 docs). Admin edits made through AdminPanel are never seen by the dashboard.
2. **21 of 53 referenced collections are empty or missing.**
3. **87 empty `catch {}` blocks** (42 in AdminPanel, 21 in EmaarDashboardV2) — failures are swallowed, so a broken action looks like an inert button.
4. **No provenance.** `projects` is 79% `allFieldsEnrichedAt` (bulk AI-generated) with **0% timestamps**.
5. **Bucketed yields.** `neighbourhoodScores` has 281 docs but only 28 distinct `grossYield` values, 189 of them on six round numbers — assigned, not measured.
6. **Zero automated tests.**

---

## Recommended launch scope

**Ship:** the 9 REAL tabs, plus PARTIAL tabs with a visible "estimate" label.
**Hide:** all 7 EMPTY tabs.
**Fix or hide:** all 9 HARDCODED tabs — a wrong mortgage rate costs more trust than a missing feature.
