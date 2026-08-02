"""The real join test: transactions.project_number -> projects.project_number,
measured in transactions AND in AED, which is what developer attribution needs."""
import csv, sys, json
from collections import Counter, defaultdict

csv.field_size_limit(10_000_000)
D = r"C:\Users\TAD\OneDrive - The Address Holding\Pictures"

with open(f"{D}\\projects_2026-07-06_16-25-21_0001.csv", "r", encoding="utf-8-sig", newline="") as fh:
    projects = list(csv.DictReader(fh))

def kn(v):
    """Normalise a project_number: transactions write '1433.00', projects '2744'."""
    v = (v or "").strip()
    if not v: return ""
    try: return str(int(float(v)))
    except ValueError: return v

by_num = {kn(p["project_number"]): p for p in projects if p.get("project_number")}
print(f"projects indexed by project_number: {len(by_num):,}")
print(f"  sample project keys:     {list(by_num)[:6]}")

# Emaar in Arabic — the Latin search returned 0 because names are Arabic only
EMAAR_AR = "اعمار"
SHOWN = []
emaar_projects = {n for n, p in by_num.items()
                  if EMAAR_AR in (p.get("developer_name") or "")
                  or EMAAR_AR in (p.get("master_developer_name") or "")}
print(f"projects whose developer/master developer contains '{EMAAR_AR}': {len(emaar_projects):,}")

matched = unmatched = 0
matched_aed = unmatched_aed = 0.0
dev_txns = Counter(); dev_aed = defaultdict(float)
emaar_masters = Counter()
no_projnum = 0

with open(f"{D}\\transactions_2026-07-30_17-27-33_0001.csv", "r",
          encoding="utf-8-sig", newline="") as fh:
    for i, row in enumerate(csv.DictReader(fh), 1):
        if row.get("trans_group_en") != "Sales":
            continue
        try: worth = float(row.get("actual_worth") or 0)
        except ValueError: worth = 0.0
        pn = kn(row.get("project_number"))
        if len(SHOWN) < 6 and pn:
            SHOWN.append(pn)
        if not pn:
            no_projnum += 1
            unmatched += 1; unmatched_aed += worth
            continue
        p = by_num.get(pn)
        if p:
            matched += 1; matched_aed += worth
            d = (p.get("developer_name") or "(blank)").strip()
            dev_txns[d] += 1; dev_aed[d] += worth
            if pn in emaar_projects:
                emaar_masters[(row.get("master_project_en") or "(blank)")] += 1
        else:
            unmatched += 1; unmatched_aed += worth
        if i % 250_000 == 0:
            print(f"  {i:,}...", file=sys.stderr, flush=True)

tot = matched + unmatched
print(f"\n  sample transaction keys: {SHOWN}")
print(f"\n=== SALES TRANSACTIONS vs PROJECTS FILE ===")
print(f"  total sales rows:      {tot:,}")
print(f"  no project_number:     {no_projnum:,} ({100*no_projnum/tot:.1f}%)")
print(f"  matched a project:     {matched:,} ({100*matched/tot:.1f}%)")
print(f"  unmatched:             {unmatched:,} ({100*unmatched/tot:.1f}%)")
print(f"  AED matched:   {matched_aed/1e9:,.0f}B ({100*matched_aed/(matched_aed+unmatched_aed):.1f}%)")
print(f"  AED unmatched: {unmatched_aed/1e9:,.0f}B")

print(f"\n=== TOP DEVELOPERS BY SALES VALUE (via the join) ===")
for d, v in sorted(dev_aed.items(), key=lambda kv: -kv[1])[:15]:
    print(f"  {d[:50]:52} {dev_txns[d]:>6,} txns  AED {v/1e9:6.1f}B")

print(f"\n=== EMAAR master projects reached via the join ===")
for m, c in emaar_masters.most_common(12):
    print(f"  {m[:50]:52} {c:>6,}")

json.dump({"matched": matched, "unmatched": unmatched, "noProjectNumber": no_projnum,
           "matchedAED": round(matched_aed), "unmatchedAED": round(unmatched_aed),
           "developerAED": {k: round(v) for k, v in dev_aed.items()},
           "developerTxns": dict(dev_txns)},
          open(sys.argv[1], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
