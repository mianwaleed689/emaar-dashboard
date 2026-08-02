"""THE GAP — what the app shows vs what DLD records say.

Compares the 193 community cards rendered in the running app against figures
computed directly from the Dubai Land Department transaction export.

Run after:
  scripts/dld/build_price_history.py   -> data-audit/price-history-dld.json
  scripts/dld/build_yields.py          -> data-audit/yields-dld.json
"""
import json, re, statistics, sys

S = r"C:\Users\TAD\AppData\Local\Temp\claude\c--Users-TAD-emaar-dashboard\3c1226e4-8457-443c-9a63-0ddbe687af35\scratchpad"
R = r"C:\Users\TAD\emaar-dashboard"

app = json.load(open(f"{S}/app_193.json", encoding="utf-8"))
ph = json.load(open(f"{R}/data-audit/price-history-dld.json", encoding="utf-8"))
yl = json.load(open(f"{R}/data-audit/yields-dld.json", encoding="utf-8"))

def norm(s):
    return re.sub(r"[^a-z0-9]+", "", (s or "").lower())

# DLD ground truth: latest median ppsf per name (master projects win over areas)
dld_ppsf = {}
for lvl in ("area", "master"):
    for e in ph["levels"][lvl]:
        dld_ppsf[norm(e["name"])] = {"ppsf": e["ppsfLatest"], "n": e["series"][-1]["n"],
                                     "year": e["latestYear"], "level": lvl}

# DLD ground truth: gross yield per master project (flats, all bed counts pooled)
dld_yield = {}
for y in yl["yields"]:
    k = norm(y["masterProject"])
    dld_yield.setdefault(k, []).append(y["grossYieldPct"])
dld_yield = {k: round(statistics.median(v), 2) for k, v in dld_yield.items()}

print("=" * 74)
print("PRICE PER SQFT — app vs DLD")
print("=" * 74)
rows = []
for a in app:
    k = norm(a["name"])
    d = dld_ppsf.get(k)
    if not d or not a.get("ppsf"):
        continue
    diff = 100 * (a["ppsf"] - d["ppsf"]) / d["ppsf"]
    rows.append((abs(diff), a["name"], a["ppsf"], d["ppsf"], diff, d["n"], d["level"]))
rows.sort(reverse=True)
print(f"matched {len(rows)} communities\n")
print(f"{'community':30}{'app':>8}{'DLD':>8}{'gap':>9}   sales")
for _, name, av, dv, diff, n, lvl in rows[:18]:
    print(f"  {name[:28]:28}{av:>8,}{dv:>8,}{diff:>+8.0f}%   {n:,} ({lvl})")
if rows:
    gaps = [abs(r[4]) for r in rows]
    print(f"\n  median absolute gap: {statistics.median(gaps):.0f}%")
    print(f"  within 10% of DLD:   {sum(1 for g in gaps if g <= 10)} of {len(gaps)}")
    print(f"  off by more than 25%:{sum(1 for g in gaps if g > 25)} of {len(gaps)}")
    print(f"  off by more than 50%:{sum(1 for g in gaps if g > 50)} of {len(gaps)}")

print("\n" + "=" * 74)
print("GROSS YIELD — app vs DLD (median rent / median sale, both from DLD)")
print("=" * 74)
yrows = []
for a in app:
    k = norm(a["name"])
    d = dld_yield.get(k)
    if d is None or not a.get("gross"):
        continue
    yrows.append((abs(a["gross"] - d), a["name"], a["gross"], d))
yrows.sort(reverse=True)
print(f"matched {len(yrows)} communities\n")
print(f"{'community':30}{'app':>8}{'DLD':>8}{'gap':>9}")
for _, name, av, dv in yrows[:14]:
    print(f"  {name[:28]:28}{av:>7.1f}%{dv:>7.2f}%{av-dv:>+8.1f}pp")
if yrows:
    g = [r[0] for r in yrows]
    print(f"\n  median absolute gap: {statistics.median(g):.2f} percentage points")
    print(f"  within 0.5pp of DLD: {sum(1 for x in g if x <= 0.5)} of {len(g)}")
    print(f"  off by more than 2pp:{sum(1 for x in g if x > 2)} of {len(g)}")

print("\n" + "=" * 74)
print("HOW MANY DISTINCT VALUES THE APP USES")
print("=" * 74)
for key, label in (("gross", "gross yield"), ("net", "net yield"),
                   ("svc", "service charge"), ("ppsf", "price per sqft")):
    vals = [a[key] for a in app if a.get(key) is not None]
    print(f"  {label:16} {len(set(vals)):>4} distinct across {len(vals)} communities")
