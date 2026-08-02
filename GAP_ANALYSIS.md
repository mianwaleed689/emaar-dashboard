# THE GAP — what the app shows vs what DLD records say

**Measured 2026-08-02** against the running app, logged in, 193 community cards
extracted from the DOM and compared with figures computed directly from the
Dubai Land Department transaction export.

Reproduce with:

```sh
python scripts/dld/build_price_history.py "<transactions.csv>" data-audit/price-history-dld.json
python scripts/dld/measure_gap.py
```

---

## HEADLINE

| Measure | Result |
|---|---|
| Communities matched on price per sqft | 82 |
| **Median absolute gap** | **15%** |
| Within 10% of DLD | 31 of 82 |
| Off by more than 25% | **28 of 82** |
| Off by more than 50% | **9 of 82** |
| Communities matched on gross yield | 64 |
| **Median absolute gap** | **1.25 percentage points** |
| Within 0.5pp of DLD | 15 of 64 |

**The yield error is one-directional.** Of the fourteen largest gaps, thirteen
are the app quoting a *higher* yield than the transactions support. That is the
dangerous direction: it tells an investor they will earn more than they will.

---

## 1. Price per square foot

Worst offenders:

| Community | App | DLD | Gap | DLD sales |
|---|---|---|---|---|
| DUBAI HILLS - GOLF GROVE | 2,461 | 1,238 | **+99%** | 47 |
| DUBAI HILLS - SIDRA 2 | 2,461 | 1,313 | **+87%** | 29 |
| Dubai Investment Park First | 268 | 1,193 | **−78%** | 671 |
| Meydan Racecourse Community | 1,453 | 3,559 | **−59%** | 859 |
| Jumeira Bay | 4,000 | 9,747 | **−59%** | 27 |
| Bluewaters Island | 2,188 | 5,239 | **−58%** | 30 |
| Meydan One Community | 985 | 2,121 | **−54%** | 403 |
| DMCC Master Community | 945 | 1,662 | **−43%** | 621 |
| Business Bay | 3,331 | 2,470 | **+35%** | 1,690 |
| Palm Jumeirah | 1,902 | 3,719 | **−49%** | 334 |

### The sub-community defect, proven

Every `DUBAI HILLS - …` row shows **the same AED 2,461/sqft**. DLD says they
are materially different:

| | App | DLD |
|---|---|---|
| GOLF GROVE | 2,461 | 1,238 |
| SIDRA 2 | 2,461 | 1,313 |
| MAPLE 3 | 2,461 | 1,570 |

The parent's figure has been copied onto every child. `DATA_ARCHITECTURE_PLAN.md`
predicted exactly this — *"Ten `DUBAI HILLS - …` rows carry identical figures —
no hierarchy"* — and here it is costing up to 99% accuracy.

---

## 2. Gross yield

| Community | App | DLD | Gap |
|---|---|---|---|
| 800 Villas | 9.0% | 5.36% | **+3.6pp** |
| Dubai World Central | 7.2% | 4.20% | **+3.0pp** |
| International City Phase 3 | 9.0% | 6.16% | **+2.8pp** |
| Dubai Harbour | 6.5% | 4.16% | **+2.3pp** |
| Dubai Sports City | 8.0% | 5.92% | **+2.1pp** |
| Jumeirah Golf Estates | 5.5% | 7.50% | −2.0pp |

An agent quoting 9.0% on 800 Villas when the registered transactions support
5.36% is overstating income by two thirds.

---

## 3. The values are assigned, not measured

| Field | Distinct values | Across |
|---|---|---|
| **Gross yield** | **15** | 193 communities |
| **Service charge** | **15** | 193 communities |
| Net yield | 40 | 193 communities |
| Price per sqft | 120 | 193 communities |

Distribution of gross yield:

```
5.5%  ->  43 communities
6.5%  ->  41 communities
6.0%  ->  22 communities
7.0%  ->  13     8.0%  ->  13
7.5%  ->  13     6.9%  ->  13
```

**84 of 193 communities — 43% — carry one of just two values.** Dubai Harbour,
Dubai Marina and Emaar Beachfront all show exactly 6.5%. These are buckets
someone chose, not yields anyone measured.

---

## 4. What replaces it

Already computed and on disk:

| File | Contents |
|---|---|
| `data-audit/price-history-dld.json` | 95 master projects + 72 areas, yearly median PPSF, **sample size on every point**, 382,192 sales since 2019 |
| `data-audit/yields-dld.json` | 249 cells, median Ejari rent ÷ median DLD sale, both sides ≥30 observations |

Sanity check against the real market — JVC 1,482 · Business Bay 2,470 ·
Downtown 2,808 · Marina 1,939 · Creek Harbour 2,584 · Palm Jumeirah 3,719.

### One trap that would have silently ruined it

`procedure_area` is in **square metres**. Dividing price by it without
converting gives AED/sqm — 10.8× too small, and still plausible enough to ship.
The conversion is explicit in the builder and the output is range-checked before
it is written.

### Honest limit

**Corrected 2026-08-02.** An earlier version of this document said the
transactions export was one part of a multi-part download. It is not. DLD splits
an export at exactly 1,031,741 rows — measured from the ten rent-contract parts,
each of which holds precisely that many. The transactions file holds 878,578
rows, below the threshold, so it is a **complete single-part export**. Nothing
further is available to download for it.

The rent-contract export is now complete too: all ten parts are present,
~10.3 million registered contracts. Yields previously computed from four parts
have been rebuilt on the full record.

One open question remains: DLD publicly reported 214,912 sales for 2025, while
this export holds fewer for the same year. That is a difference in what the open
dataset counts, not missing parts — worth confirming with DLD before quoting
transaction *counts* publicly. Medians are unaffected.

---

## VERDICT

The app is not a little off. On a third of communities it is off by more than a
quarter, on nine of them by more than half, and its yields lean systematically
high. The replacement data is computed, sourced, sample-sized and already on
this machine.
