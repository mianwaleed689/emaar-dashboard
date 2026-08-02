"""Developer league table, English.

The id join is UNSOUND: projects.developer_id and developers.developer_id are
different identifier spaces that collide numerically (projects say Nakheel is
269; developers say 269 is SABA Properties, and real Nakheel is 100).
Exact Arabic name is the only reliable bridge, and it covers 99.8% of projects.
"""
import csv, json, sys
from collections import defaultdict, Counter

csv.field_size_limit(10_000_000)
D = r"C:\Users\TAD\OneDrive - The Address Holding\Pictures"

def load(n):
    with open(f"{D}\\{n}", "r", encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))

devs = load("developers_2026-07-01_17-21-44_0001.csv")

# Arabic name -> English. Detect collisions rather than silently taking the last.
ar_groups = defaultdict(set)
for d in devs:
    ar = (d.get("developer_name_ar") or "").strip()
    en = (d.get("developer_name_en") or "").strip()
    if ar and en:
        ar_groups[ar].add(en)
def canon(s):
    return "".join(ch for ch in s.upper() if ch.isalnum())

# Variants that differ only by case/punctuation are the same company, not an
# ambiguity — collapse them and keep the longest spelling as canonical.
for k, v in list(ar_groups.items()):
    if len(v) > 1 and len({canon(x) for x in v}) == 1:
        ar_groups[k] = {max(v, key=len)}

collisions = {k: v for k, v in ar_groups.items() if len(v) > 1}
print(f"developers.csv: {len(devs):,} rows, {len(ar_groups):,} distinct Arabic names, "
      f"{len(collisions)} ambiguous (same Arabic, different English)")
for k, v in list(collisions.items())[:5]:
    print(f"   AMBIGUOUS {k[:34]:36} -> {sorted(v)}")

ar2en = {k: next(iter(v)) for k, v in ar_groups.items() if len(v) == 1}

res = json.load(open(sys.argv[1], encoding="utf-8"))
dev_aed, dev_txns = res["developerAED"], res["developerTxns"]
total = sum(dev_aed.values())

rows, unresolved = [], []
for ar, v in dev_aed.items():
    en = ar2en.get(ar)
    if en:
        rows.append({"developer_en": en, "developer_ar": ar,
                     "txns": dev_txns[ar], "salesAED": round(v),
                     "sharePct": round(100 * v / total, 2)})
    else:
        unresolved.append({"developer_ar": ar, "txns": dev_txns[ar],
                           "salesAED": round(v),
                           "reason": "ambiguous" if ar in collisions else "absent from developers.csv"})

rows.sort(key=lambda r: -r["salesAED"])
unresolved.sort(key=lambda r: -r["salesAED"])

print(f"\nresolved {len(rows)} of {len(dev_aed)} developers; "
      f"{len(unresolved)} unresolved (AED {sum(u['salesAED'] for u in unresolved)/1e9:.1f}B)")
for u in unresolved[:6]:
    print(f"   UNRESOLVED {u['developer_ar'][:36]:38} AED {u['salesAED']/1e9:5.1f}B  ({u['reason']})")

print(f"\n=== DEVELOPER LEAGUE TABLE — DLD sales, all years ===")
print(f"{'':2}{'developer':50}{'txns':>8}{'AED':>10}{'share':>8}")
for i, r in enumerate(rows[:20], 1):
    print(f"{i:>2} {r['developer_en'][:48]:50}{r['txns']:>8,}{r['salesAED']/1e9:>9.1f}B{r['sharePct']:>7.1f}%")

emaar = [r for r in rows if "EMAAR" in r["developer_en"].upper()
         or "DUBAI HILLS ESTATE" in r["developer_en"].upper()]
print(f"\nEmaar-group entities: {len(emaar)}")
for r in emaar:
    print(f"   {r['developer_en'][:48]:50}{r['txns']:>8,}{r['salesAED']/1e9:>9.1f}B{r['sharePct']:>7.1f}%")
print(f"   {'COMBINED':50}{sum(r['txns'] for r in emaar):>8,}"
      f"{sum(r['salesAED'] for r in emaar)/1e9:>9.1f}B"
      f"{sum(r['sharePct'] for r in emaar):>7.1f}%")

json.dump({"note": "Bridged on exact Arabic developer name; the id join between "
                   "projects.csv and developers.csv is unsound (different id spaces).",
           "coverage": {"attributedSalesAED": round(total),
                        "totalSalesAED": res["matchedAED"] + res["unmatchedAED"],
                        "attributedPct": round(100 * total / (res["matchedAED"] + res["unmatchedAED"]), 1)},
           "league": rows, "unresolved": unresolved},
          open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"\n-> {sys.argv[2]}")
