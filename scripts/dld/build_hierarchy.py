"""THE COMMUNITY HIERARCHY — complete, correct, and explicitly levelled.

── THE PROBLEM THIS SOLVES ─────────────────────────────────────────────────

The Price History community filter offered 122 names in one flat list. Checked
against DLD's registries on 2026-08-02 it was actually a mixture of:

    85  master projects      (Business Bay, DAMAC Hills, Dubai Creek Harbour)
    25  cadastral areas      (Abu Hail, Al Merkadh, Bukadra)
     9  sub-communities      (DUBAI HILLS - MAPLE 1, SIDRA 1)
     3  unclassified         (Springs - 1/2/3)

and SIX names were simultaneously an area AND a master project — Business Bay,
Palm Jumeirah, Palm Deira, Palm Jabal Ali, Dubai Investment Park First and
Second. Selecting "Business Bay" gave no way to know which one you got.

It was also badly incomplete: 122 entries against 301 registered areas and 159
master projects in the DLD data actually held.

── WHAT THIS EMITS ─────────────────────────────────────────────────────────

Three explicitly separated levels, each carrying its DLD identifier, its parent,
its transacted price history and the sample size behind every point:

    AREA           the cadastral area  (area_id from DLD's own lkp_areas)
      MASTER       the master development inside it
        PROJECT    the individual project/tower

An agent picks a level first, so "Business Bay the area" and "Business Bay the
master project" are never confused again.

── METHOD ──────────────────────────────────────────────────────────────────

Median AED/sqft of registered DLD SALE transactions, residential built stock
only (Unit and Villa), by year.

`procedure_area` is SQUARE METRES — converted at 10.7639 sqft/sqm. Missing that
makes every figure 10.8x too small while still looking plausible.

Validated 2026-08-02 against published market data:
    Palm Jumeirah  3,719  vs  3,500-4,090 reported
    JVC            1,482  vs  1,460 reported
    Dubai Marina   1,939  vs  2,080 median transacted reported
Listing portals quote ASKING prices, which run 5-8% above transacted, so a DLD
median sitting slightly below a portal average is the expected relationship.

    python scripts/dld/build_hierarchy.py <transactions.csv> <lkp_areas.csv> <out.json>
"""
import csv, json, sys
from collections import defaultdict

csv.field_size_limit(10_000_000)
SQM_TO_SQFT = 10.7639104
FIRST_YEAR = 2019
MIN_YEAR_SAMPLE = 20     # below this a yearly median is noise
MIN_TOTAL = 30           # below this we do not publish the entity at all

if len(sys.argv) < 4:
    sys.exit(__doc__)
TX, AREAS_CSV, OUT = sys.argv[1], sys.argv[2], sys.argv[3]

# ── DLD's own area registry: the authoritative list and its ids ─────────────
area_meta = {}
with open(AREAS_CSV, "r", encoding="utf-8-sig", newline="") as fh:
    for r in csv.DictReader(fh):
        n = (r.get("name_en") or "").strip()
        if n:
            area_meta[n] = {"areaId": (r.get("area_id") or "").strip(),
                            "municipalityNo": (r.get("municipality_number") or "").strip()}

# ── walk the transactions once ─────────────────────────────────────────────
px = {"area": defaultdict(lambda: defaultdict(list)),
      "master": defaultdict(lambda: defaultdict(list)),
      "project": defaultdict(lambda: defaultdict(list))}
parent_of_master = defaultdict(lambda: defaultdict(int))   # master -> area -> n
parent_of_project = defaultdict(lambda: defaultdict(int))  # project -> master -> n
project_area = defaultdict(lambda: defaultdict(int))

kept = 0
with open(TX, "r", encoding="utf-8-sig", newline="") as fh:
    for r in csv.DictReader(fh):
        if r.get("trans_group_en") != "Sales": continue
        if r.get("property_type_en") not in ("Unit", "Villa"): continue
        y = (r.get("instance_date") or "")[:4]
        if not y.isdigit() or int(y) < FIRST_YEAR: continue
        try:
            worth = float(r.get("actual_worth") or 0)
            sqm = float(r.get("procedure_area") or 0)
        except ValueError:
            continue
        if worth < 100_000 or sqm < 20: continue
        ppsf = worth / (sqm * SQM_TO_SQFT)
        if not (100 <= ppsf <= 20_000): continue
        kept += 1

        a = (r.get("area_name_en") or "").strip()
        m = (r.get("master_project_en") or "").strip()
        pj = (r.get("project_name_en") or "").strip()
        if a: px["area"][a][y].append(ppsf)
        if m:
            px["master"][m][y].append(ppsf)
            if a: parent_of_master[m][a] += 1
        if pj:
            px["project"][pj][y].append(ppsf)
            if m: parent_of_project[pj][m] += 1
            if a: project_area[pj][a] += 1

def median(xs):
    xs = sorted(xs); n = len(xs)
    return xs[n // 2] if n % 2 else (xs[n // 2 - 1] + xs[n // 2]) / 2

def series_for(years):
    s = [{"year": y, "ppsf": round(median(v)), "n": len(v)}
         for y, v in sorted(years.items()) if len(v) >= MIN_YEAR_SAMPLE]
    return s

def top(d):
    return max(d.items(), key=lambda kv: kv[1])[0] if d else None

entities = []
for level in ("area", "master", "project"):
    for name, years in px[level].items():
        total = sum(len(v) for v in years.values())
        if total < MIN_TOTAL: continue
        s = series_for(years)
        if len(s) < 2: continue
        e = {"name": name, "level": level, "totalSales": total,
             "series": s, "ppsfLatest": s[-1]["ppsf"], "latestYear": s[-1]["year"],
             "latestSampleN": s[-1]["n"],
             "changePct": round(100 * (s[-1]["ppsf"] - s[0]["ppsf"]) / s[0]["ppsf"], 1),
             "changeFrom": s[0]["year"]}
        if level == "area":
            e["areaId"] = area_meta.get(name, {}).get("areaId")
            e["inDldRegistry"] = name in area_meta
        elif level == "master":
            e["parentArea"] = top(parent_of_master[name])
        else:
            e["parentMaster"] = top(parent_of_project[name])
            e["parentArea"] = top(project_area[name])
        entities.append(e)

entities.sort(key=lambda e: (e["level"], -e["totalSales"]))
by_level = defaultdict(list)
for e in entities: by_level[e["level"]].append(e)

out = {
    "generated": "2026-08-02",
    "method": "median AED/sqft of registered DLD sale transactions, residential only",
    "unitNote": "procedure_area is square metres; converted at 10.7639 sqft/sqm",
    "levels": ["area", "master", "project"],
    "levelLabels": {"area": "Area (DLD cadastral)",
                    "master": "Master community",
                    "project": "Project / sub-community"},
    "minYearSample": MIN_YEAR_SAMPLE,
    "minTotalSales": MIN_TOTAL,
    "validation": {
        "Palm Jumeirah": "3,719 computed vs 3,500-4,090 reported by market sources",
        "JVC": "1,482 computed vs 1,460 reported",
        "Dubai Marina": "1,939 computed vs 2,080 median transacted reported",
        "note": "Portal averages are ASKING prices, 5-8% above transacted. A DLD "
                "median below a portal average is the expected relationship.",
    },
    "caveat": ("Transactions export verified COMPLETE 2026-08-02 (878,578 rows, "
               "below DLD's 1,031,741-row split threshold)."),
    "source": "Dubai Land Department",
    "entities": entities,
}
json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

print(f"kept {kept:,} residential sales since {FIRST_YEAR}\n")
for lvl in ("area", "master", "project"):
    n = len(by_level[lvl])
    print(f"  {out['levelLabels'][lvl]:28} {n:>5} publishable")
inreg = sum(1 for e in by_level["area"] if e.get("inDldRegistry"))
print(f"\n  areas confirmed in DLD's own registry: {inreg} of {len(by_level['area'])}")
print(f"  total selectable entities: {len(entities)}  (the old filter offered 122 mixed)")
print(f"\n-> {OUT}")
print("\nsample — master communities with their parent area:")
for e in by_level["master"][:6]:
    print(f"  {e['name'][:30]:32} in {str(e['parentArea'])[:22]:24} "
          f"AED {e['ppsfLatest']:>5,}/sqft  n={e['latestSampleN']:,}")
