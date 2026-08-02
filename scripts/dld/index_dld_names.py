"""One streaming pass: index every distinct DLD name value with volume + value + date span.
All matching happens offline afterwards, from this index."""
import csv, sys, json, os
from collections import Counter, defaultdict

csv.field_size_limit(10_000_000)
if len(sys.argv) < 3:
    sys.exit("usage: index_dld_names.py <dld-transactions.csv> <out-index.json>")
PATH, OUT = sys.argv[1], sys.argv[2]
if os.path.abspath(PATH) == os.path.abspath(OUT):
    sys.exit("refusing to overwrite the source CSV with the index")

FIELDS = ["master_project_en", "area_name_en", "project_name_en"]

rows   = {f: Counter() for f in FIELDS}          # value -> txn count
value  = {f: defaultdict(float) for f in FIELDS} # value -> total Sales AED
dmin   = {f: {} for f in FIELDS}                 # value -> earliest instance_date
dmax   = {f: {} for f in FIELDS}
mp_area = defaultdict(Counter)                   # master_project -> Counter(area)
mp_proj = defaultdict(Counter)                   # master_project -> Counter(project)
area_of_blank_mp = Counter()                     # where the blank-master rows live

n = 0
with open(PATH, "r", encoding="utf-8-sig", newline="") as fh:
    for row in csv.DictReader(fh):
        n += 1
        d = (row.get("instance_date") or "")[:10]
        is_sale = row.get("trans_group_en") == "Sales"
        try: worth = float(row.get("actual_worth") or 0) if is_sale else 0.0
        except ValueError: worth = 0.0

        for f in FIELDS:
            v = (row.get(f) or "").strip()
            if not v: continue
            rows[f][v] += 1
            value[f][v] += worth
            if d:
                if v not in dmin[f] or d < dmin[f][v]: dmin[f][v] = d
                if v not in dmax[f] or d > dmax[f][v]: dmax[f][v] = d

        mp = (row.get("master_project_en") or "").strip()
        ar = (row.get("area_name_en") or "").strip()
        pj = (row.get("project_name_en") or "").strip()
        if mp:
            if ar: mp_area[mp][ar] += 1
            if pj: mp_proj[mp][pj] += 1
        else:
            if ar: area_of_blank_mp[ar] += 1

        if n % 250_000 == 0:
            print(f"  {n:,} rows...", file=sys.stderr, flush=True)

def pack(f):
    return {v: {"txns": c,
                "salesAED": round(value[f][v]),
                "first": dmin[f].get(v),
                "last": dmax[f].get(v)}
            for v, c in rows[f].most_common()}

out = {
    "totalRows": n,
    "master_project_en": pack("master_project_en"),
    "area_name_en": pack("area_name_en"),
    "project_name_en": pack("project_name_en"),
    "master_to_areas": {k: v.most_common(6) for k, v in mp_area.items()},
    "master_to_projects": {k: v.most_common(8) for k, v in mp_proj.items()},
    "blank_master_by_area": area_of_blank_mp.most_common(40),
}
json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"\n{n:,} rows. distinct: master={len(rows['master_project_en'])} "
      f"area={len(rows['area_name_en'])} project={len(rows['project_name_en'])}", file=sys.stderr)
print(f"-> {OUT}", file=sys.stderr)
