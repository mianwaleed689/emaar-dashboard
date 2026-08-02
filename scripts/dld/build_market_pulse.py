"""Build the market summary the Overview reads — computed from the DLD export.

WHY THIS EXISTS
───────────────
The Overview was showing seats, team members and a plan price. On a Dubai
property intelligence platform that is a team-admin panel, not an overview. It
also carried a "COMMUNITY DATA 2026-06-29 (34 days ago)" stamp, while a 537 MB
Land Department export dated 30 July sat unused on disk — 878,578 registered
transactions, the freshest thing the business owns.

This reads that export once and writes a small JSON the app can load in a single
request. Nothing here is estimated: every figure is a count or a median over
rows that carry a date and a price.

WHAT IT DELIBERATELY DOES NOT DO
────────────────────────────────
No forecasts, no scores, no "market sentiment". The Overview's job is to say
what actually happened, with the number of transactions behind each figure so an
agent can defend it.

    python scripts/dld/build_market_pulse.py
"""
import csv, io, json, os, statistics, collections, sys, datetime

sys.stdout.reconfigure(encoding="utf-8", errors="backslashreplace")

SRC = r"C:\Users\TAD\OneDrive - The Address Holding\Pictures\transactions_2026-07-30_17-27-33_0001.csv"
OUT = "src/data/marketPulse.json"

SQFT_PER_SQM = 10.7639104          # procedure_area is SQUARE METRES

def num(v):
    try:
        f = float(str(v).replace(",", ""))
        return f if f > 0 else None
    except (TypeError, ValueError):
        return None

# ── WHY THE COMPARISON IS DAY-BOUNDED ────────────────────────────────────────
# The export is a snapshot. This one was taken on 30 July and the last
# transaction in it is dated 29 July, so the newest month is PARTIAL — 21
# trading days, not a full month.
#
# Comparing that partial month against a complete July 2025 gives "deals down
# 31.8% year on year". Projected to a full month it is 12,433 against 12,426 —
# flat. The difference between "Dubai is down a third" and "Dubai is flat" is
# the difference between a useful platform and a harmful one, and it comes
# entirely from comparing 21 days against 31.
#
# So year-on-year and month-on-month are computed over the SAME DAY-OF-MONTH
# WINDOW as the latest month covers, and the partial month is flagged.
months   = collections.Counter()
day_max  = {}                                  # month -> highest day seen
by_day   = collections.Counter()               # (month, day) -> deals
value    = collections.Counter()
area_m   = collections.defaultdict(list)     # this month, per area: ppsf
area_n   = collections.Counter()
type_n   = collections.Counter()
ppsf_all = collections.defaultdict(list)     # per month: ppsf sample
offplan  = collections.Counter()
ready    = collections.Counter()
rows = skipped = 0

with io.open(SRC, encoding="utf-8", errors="replace", newline="") as f:
    for r in csv.DictReader(f):
        rows += 1
        d = (r.get("instance_date") or "")[:10]
        # DLD ships a handful of unusable dates (one row is dated 1422-11)
        if len(d) < 7 or not d[:4].isdigit() or not ("2000" <= d[:4] <= "2030"):
            skipped += 1
            continue
        m, day = d[:7], int(d[8:10]) if d[8:10].isdigit() else 0
        months[m] += 1
        if day:
            by_day[(m, day)] += 1
            day_max[m] = max(day_max.get(m, 0), day)

        worth = num(r.get("actual_worth"))
        if worth:
            value[m] += worth

        # price per square foot, converted from the square metres DLD reports
        sqm = num(r.get("procedure_area"))
        if worth and sqm:
            ppsf = worth / (sqm * SQFT_PER_SQM)
            if 100 < ppsf < 20000:                    # discard obvious junk
                ppsf_all[m].append(ppsf)
                area = (r.get("area_name_en") or "").strip()
                if area and m == max(months, default=""):
                    area_m[area].append(ppsf)

        if m == max(months, default=""):
            area_n[(r.get("area_name_en") or "").strip()] += 1
            type_n[(r.get("property_type_en") or "").strip()] += 1
            reg = (r.get("reg_type_en") or "").strip().lower()
            if "off" in reg: offplan[m] += 1
            elif reg:        ready[m] += 1

def med(xs):
    return round(statistics.median(xs)) if xs else None

ordered = sorted(months)
latest  = ordered[-1]
series  = [{
    "month": m,
    "deals": months[m],
    "valueAed": round(value[m]),
    "ppsf": med(ppsf_all.get(m, [])),
    "ppsfN": len(ppsf_all.get(m, [])),
} for m in ordered[-25:]]

def delta(cur, prev):
    if not prev: return None
    return round((cur - prev) / prev * 100, 1)

CUTOFF = day_max.get(latest, 31)               # last day the export actually holds

def deals_to_cutoff(month):
    """Deals in `month` up to the same day the latest month reaches."""
    return sum(n for (mm, dd), n in by_day.items() if mm == month and dd <= CUTOFF)

partial = CUTOFF < 28

i = ordered.index(latest)
prev_m = ordered[i-1] if i else None
year_m = latest[:4] and f"{int(latest[:4])-1}-{latest[5:7]}"

top_areas = sorted(
    ({"area": a, "deals": area_n[a], "ppsf": med(area_m.get(a, [])), "ppsfN": len(area_m.get(a, []))}
     for a in area_n if a),
    key=lambda x: -x["deals"])[:12]

out = {
    "generated": datetime.date.today().isoformat(),
    "source": "Dubai Land Department registered sale transactions",
    "exportFile": os.path.basename(SRC),
    "exportDate": "2026-07-30",
    "rowsRead": rows,
    "rowsSkippedBadDate": skipped,
    "latestMonth": latest,
    "latest": {
        "month": latest,
        "deals": months[latest],
        "valueAed": round(value[latest]),
        "ppsf": med(ppsf_all.get(latest, [])),
        "ppsfN": len(ppsf_all.get(latest, [])),
        # like-for-like: same day window in each comparison month
        "coversToDay": CUTOFF,
        "isPartialMonth": partial,
        "dealsVsPrevMonth": delta(months[latest], deals_to_cutoff(prev_m)) if prev_m else None,
        "dealsVsYearAgo": delta(months[latest], deals_to_cutoff(year_m)) if year_m in months else None,
        "prevMonthSameWindow": deals_to_cutoff(prev_m) if prev_m else None,
        "yearAgoSameWindow": deals_to_cutoff(year_m) if year_m in months else None,
        "offPlan": offplan.get(latest, 0),
        "ready": ready.get(latest, 0),
    },
    "series": series,
    "topAreas": top_areas,
    "propertyTypes": [{"type": t, "deals": n} for t, n in type_n.most_common(8) if t],
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
io.open(OUT, "w", encoding="utf-8", newline="").write(json.dumps(out, separators=(",", ":")))

print("wrote %s  (%.0f KB)" % (OUT, os.path.getsize(OUT) / 1024))
print("  rows read       : %s" % format(rows, ","))
print("  unusable dates  : %s" % format(skipped, ","))
print("  latest month    : %s" % latest)
print("  deals           : %s" % format(out["latest"]["deals"], ","))
print("  value           : AED %.1fB" % (out["latest"]["valueAed"] / 1e9))
print("  median ppsf     : AED %s  from %s sales"
      % (out["latest"]["ppsf"], format(out["latest"]["ppsfN"], ",")))
print("  vs prev month   : %s%% deals" % out["latest"]["dealsVsPrevMonth"])
print("  vs a year ago   : %s%% deals" % out["latest"]["dealsVsYearAgo"])
print("  top area        : %s (%s deals)" % (top_areas[0]["area"], top_areas[0]["deals"]))
