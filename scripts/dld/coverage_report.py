"""COVERAGE — what the hierarchy excludes, and why.

The hierarchy publishes 72 areas, 95 master communities and 1,075 projects.
DLD's registries hold far more than that. This script accounts for every
excluded entity so the gap is a known quantity rather than a surprise.

Exclusion rules applied by build_hierarchy.py, in order:
    1. Sales only            (mortgages and gifts are not price evidence)
    2. Unit or Villa only    (land and whole buildings distort a PPSF median)
    3. 2019 onward
    4. sane price + area     (>= AED 100k, >= 20 sqm, AED 100-20,000/sqft)
    5. >= 30 sales in total
    6. >= 20 sales in a single year for that year to be published
    7. >= 2 publishable years  (one point is not a history)
"""
import csv, sys
from collections import defaultdict

csv.field_size_limit(10_000_000)
SQM_TO_SQFT = 10.7639104
FIRST_YEAR, MIN_YEAR, MIN_TOTAL = 2019, 20, 30

TX, AREAS = sys.argv[1], sys.argv[2]

registry_areas = set()
with open(AREAS, "r", encoding="utf-8-sig", newline="") as fh:
    for r in csv.DictReader(fh):
        if r.get("name_en"): registry_areas.add(r["name_en"].strip())

seen = {"area": set(), "master": set(), "project": set()}          # appear anywhere
resid = {"area": defaultdict(lambda: defaultdict(int)),            # pass filters 1-4
         "master": defaultdict(lambda: defaultdict(int)),
         "project": defaultdict(lambda: defaultdict(int))}
dropped = defaultdict(int)
rows = 0

with open(TX, "r", encoding="utf-8-sig", newline="") as fh:
    for r in csv.DictReader(fh):
        rows += 1
        a = (r.get("area_name_en") or "").strip()
        m = (r.get("master_project_en") or "").strip()
        p = (r.get("project_name_en") or "").strip()
        if a: seen["area"].add(a)
        if m: seen["master"].add(m)
        if p: seen["project"].add(p)

        if r.get("trans_group_en") != "Sales":
            dropped["not a sale"] += 1; continue
        if r.get("property_type_en") not in ("Unit", "Villa"):
            dropped["land or whole building"] += 1; continue
        y = (r.get("instance_date") or "")[:4]
        if not y.isdigit() or int(y) < FIRST_YEAR:
            dropped["before 2019"] += 1; continue
        try:
            w = float(r.get("actual_worth") or 0); s = float(r.get("procedure_area") or 0)
        except ValueError:
            dropped["unparseable"] += 1; continue
        if w < 100_000 or s < 20:
            dropped["price/area too small"] += 1; continue
        pf = w / (s * SQM_TO_SQFT)
        if not (100 <= pf <= 20_000):
            dropped["ppsf out of range"] += 1; continue

        if a: resid["area"][a][y] += 1
        if m: resid["master"][m][y] += 1
        if p: resid["project"][p][y] += 1

print(f"transactions read: {rows:,}\n")
print("ROWS DROPPED, and why")
for k, v in sorted(dropped.items(), key=lambda x: -x[1]):
    print(f"   {k:26} {v:>9,}  ({100*v/rows:.1f}%)")
kept = rows - sum(dropped.values())
print(f"   {'KEPT':26} {kept:>9,}  ({100*kept/rows:.1f}%)\n")

print("ENTITY COVERAGE")
print(f"{'level':10}{'in data':>10}{'survive filters':>17}{'published':>11}{'excluded':>10}")
for lvl in ("area", "master", "project"):
    total = len(seen[lvl])
    survive = len(resid[lvl])
    pub = 0
    thin_total = thin_year = one_year = 0
    for name, years in resid[lvl].items():
        tot = sum(years.values())
        if tot < MIN_TOTAL: thin_total += 1; continue
        good = [y for y, n in years.items() if n >= MIN_YEAR]
        if len(good) < 2:
            (thin_year if len(good) == 0 else one_year); one_year += 1; continue
        pub += 1
    print(f"{lvl:10}{total:>10,}{survive:>17,}{pub:>11,}{total-pub:>10,}")

print("\nWHY ENTITIES ARE EXCLUDED")
for lvl in ("area", "master", "project"):
    thin_total = one_year = 0
    for name, years in resid[lvl].items():
        tot = sum(years.values())
        if tot < MIN_TOTAL: thin_total += 1; continue
        if len([y for y, n in years.items() if n >= MIN_YEAR]) < 2: one_year += 1
    never = len(seen[lvl]) - len(resid[lvl])
    print(f"   {lvl}:")
    print(f"      {never:>5} never had a qualifying residential sale since 2019")
    print(f"      {thin_total:>5} had fewer than {MIN_TOTAL} sales in total")
    print(f"      {one_year:>5} had fewer than 2 years above {MIN_YEAR} sales")

print(f"\nDLD AREA REGISTRY")
print(f"   {len(registry_areas)} areas registered with DLD")
print(f"   {len(seen['area'])} of them appear in this transactions file")
print(f"   {len(registry_areas - seen['area'])} have NO transactions in this export at all")
