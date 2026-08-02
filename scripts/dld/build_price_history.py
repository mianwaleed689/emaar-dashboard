"""REAL price history, computed from DLD sale transactions.

Replaces a Firestore collection of 122 documents in which not one record
carries a source field, behind a chart that until today could fall back to a
hardcoded growth curve.

── WHAT THIS FIXES ─────────────────────────────────────────────────────────

The old Price History tab could not answer three questions a paying agent will
ask immediately:

  "Are these real communities?"   -> the dropdown mixed 85 master projects,
                                     25 cadastral areas and 9 sub-communities
                                     in one list, and 6 names were BOTH an area
                                     and a master project.
  "Where is this number from?"    -> no document carried a source.
  "How many sales is that?"       -> sample size was never shown.

Every figure this script emits carries its level, its DLD identifier, its
sample size and the window it was measured over.

── THE UNIT TRAP ───────────────────────────────────────────────────────────

`procedure_area` is in SQUARE METRES. Dividing price by it directly gives
AED/sqm, which is ~10.8x smaller than the AED/sqft every Dubai agent quotes.
Getting this wrong silently produces numbers that look plausible-ish and are
completely wrong. The conversion is explicit below and the output is
sanity-checked against a realistic Dubai range before it is written.

── EXPORT COMPLETENESS, CORRECTED 2026-08-02 ───────────────────────────────

An earlier version of this file said the transactions export was one part of a
multi-part download. It is not. DLD splits an export at exactly 1,031,741 rows
— measured from the ten rent-contract parts, each holding precisely that count.
The transactions export holds 878,578 rows, below the split threshold, so it is
COMPLETE. There is nothing further to download for it.

    python scripts/dld/build_price_history.py <transactions.csv> <out.json>
"""
import csv, json, sys
from collections import defaultdict

csv.field_size_limit(10_000_000)

SQM_TO_SQFT = 10.7639104
FIRST_YEAR = 2019          # five full years plus the current one
MIN_SAMPLE = 20            # below this a median is noise, so it is not published

if len(sys.argv) < 3:
    sys.exit(__doc__)
SRC, OUT = sys.argv[1], sys.argv[2]

# level -> key -> year -> [ppsf, ...]
buckets = {"area": defaultdict(lambda: defaultdict(list)),
           "master": defaultdict(lambda: defaultdict(list))}

rows = kept = 0
with open(SRC, "r", encoding="utf-8-sig", newline="") as fh:
    for r in csv.DictReader(fh):
        rows += 1
        if r.get("trans_group_en") != "Sales":
            continue
        # residential built stock only — land and buildings distort a PPSF median
        if r.get("property_type_en") not in ("Unit", "Villa"):
            continue
        year = (r.get("instance_date") or "")[:4]
        if not year.isdigit() or int(year) < FIRST_YEAR:
            continue
        try:
            worth = float(r.get("actual_worth") or 0)
            area_sqm = float(r.get("procedure_area") or 0)
        except ValueError:
            continue
        if worth < 100_000 or area_sqm < 20:      # drop obvious junk rows
            continue
        ppsf = worth / (area_sqm * SQM_TO_SQFT)
        if not (100 <= ppsf <= 20_000):           # outside any real Dubai price
            continue
        kept += 1
        a = (r.get("area_name_en") or "").strip()
        m = (r.get("master_project_en") or "").strip()
        if a: buckets["area"][a][year].append(ppsf)
        if m: buckets["master"][m][year].append(ppsf)

def median(xs):
    xs = sorted(xs); n = len(xs)
    return xs[n // 2] if n % 2 else (xs[n // 2 - 1] + xs[n // 2]) / 2

out = {"generated": "2026-08-02",
       "method": "median AED per square foot of registered DLD sale transactions",
       "unitNote": "procedure_area is square metres; converted at 10.7639 sqft/sqm",
       "scope": "Sales only, property_type Unit or Villa",
       "minSamplePerYear": MIN_SAMPLE,
       "caveat": ("Computed from the COMPLETE DLD transactions export — 878,578 rows, "
                  "below DLD's 1,031,741-row split threshold, verified 2026-08-02."),
       "source": "Dubai Land Department transaction export",
       "levels": {}}

for level, data in buckets.items():
    entries = []
    for name, years in data.items():
        series = [{"year": y, "ppsf": round(median(v)), "n": len(v)}
                  for y, v in sorted(years.items()) if len(v) >= MIN_SAMPLE]
        if len(series) < 2:            # a single point is not a history
            continue
        total = sum(s["n"] for s in series)
        first, last = series[0], series[-1]
        entries.append({
            "name": name,
            "level": level,
            "series": series,
            "totalSales": total,
            "ppsfLatest": last["ppsf"],
            "latestYear": last["year"],
            "changePct": round(100 * (last["ppsf"] - first["ppsf"]) / first["ppsf"], 1),
            "changeFrom": first["year"],
        })
    entries.sort(key=lambda e: -e["totalSales"])
    out["levels"][level] = entries

json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

print(f"read {rows:,} rows, kept {kept:,} residential sales since {FIRST_YEAR}")
for level, entries in out["levels"].items():
    print(f"  {level:8} {len(entries):>4} with a publishable series")
print(f"\n-> {OUT}\n")
print("sanity check — largest master projects:")
for e in out["levels"]["master"][:8]:
    s = " ".join(f"{x['year']}:{x['ppsf']}" for x in e["series"][-4:])
    print(f"  {e['name'][:30]:32} n={e['totalSales']:>6,}  {s}  ({e['changePct']:+.1f}% since {e['changeFrom']})")
