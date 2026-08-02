"""GROSS YIELDS — median registered Ejari rent / median registered DLD sale.

Both sides restricted to 2024-01-01 onward so the two medians describe the same
market, and both requiring >= 30 observations. Thin cells are suppressed, never
estimated.

── THE CONTAMINATION THIS FIXES ────────────────────────────────────────────

The previous version produced a 766.8% "yield" for Majan 3-beds: median sale
AED 2.1M against a median annual rent of AED 16,275,000 across 294 contracts.
Those are not apartments.

Measured on 2026-08-02 across 400k residential flat and villa contracts:

    median rent per sqft per year ....... AED 62
    99th percentile ..................... AED 13,094
    maximum ............................. AED 882,579

    AED 16,000,000/yr against a 48 sqm unit  = AED 31,294/sqft/yr
    AED 12,400,000/yr against a 158 sqm unit = AED  7,286/sqft/yr

These are whole-building, portfolio or bulk corporate leases registered as one
contract carrying ONE unit's area. Filtering on property_usage_en == Residential
alone does NOT remove them: Majan's 3-bed median was still AED 15.5M with that
filter applied.

Three defences, in order:

  1. property_usage_en must be Residential.
     The export also carries Commercial, Industrial, Storage and Multi Usage.

  2. rent per square foot per year must be AED 20-500.
     Real Dubai residential range: International City near 40, Downtown and Palm
     near 150-250. Above 500 the contract covers more than the unit whose area
     was recorded. 98% of contracts carry actual_area, so this is checkable on
     almost all of them; those without one are kept only if the absolute rent is
     itself plausible.

  3. the resulting cell yield must be 1%-15%.
     A backstop. Anything outside is suppressed, counted, and a sample of the
     rejects is written into the output so the exclusion is auditable.

── THE UNIT TRAP ───────────────────────────────────────────────────────────

actual_area is SQUARE METRES, converted at 10.7639 sqft/sqm. Missing that makes
every per-sqft figure 10.8x too small while still looking plausible.

── COMPLETENESS ────────────────────────────────────────────────────────────

Verified 2026-08-02: all 10 rent-contract parts present (~10.3M contracts) and
the transactions export complete at 878,578 rows, below DLD's 1,031,741-row
split threshold.

Rebuilding on the full rent record barely moved the medians — Dubai Hills 2-bed
held at 5.16% while its rent sample grew from 1,631 to 4,136 — confirming the
earlier partial sample was unbiased.

    python scripts/dld/build_yields.py <out.json>
"""
import csv, sys, json, glob, os
from collections import defaultdict

csv.field_size_limit(10_000_000)
D = r"C:\Users\TAD\OneDrive - The Address Holding\Pictures"
SINCE, UNTIL = "2024-01-01", "2026-12-31"
SQM_TO_SQFT = 10.7639104
MIN_OBS = 30
RENT_MIN, RENT_MAX = 5_000, 20_000_000
# Upper bound 13%. Above that the cause is almost never a genuine return: it is
# mismatched stock inside one community. Al Barari 4-beds computed at 16.54% —
# median sale AED 6.65M against median rent AED 1.1M on 42 sales and 52
# tenancies. Al Barari mega-villas sell far above 6.65M, so the sale median was
# catching townhouses while the rent median caught the large villas. The deepest
# genuinely high results survive this bound: International City retail at 11.61%
# on 15,296 tenancies, DIP offices at 10.35%.
YIELD_MIN, YIELD_MAX = 1.0, 13.0

# ── PER-TYPE RENT BANDS ────────────────────────────────────────────────────
# A single AED 20-500/sqft band was applied to every type. Measured 2026-08-02
# that was wrong in both directions: villas have a 5th percentile of AED 7/sqft
# (so the cheapest villa lettings were being discarded) while shops have a
# median of 206 and a 95th percentile of 1,138 (so retail could never qualify).
#
#   type        p5   median     p95
#   Flat        38      71      418
#   Office      35      84      442
#   Shop        35     206    1,138
#   Villa        7      60      133
#   Warehouse    4      40      200
#
# Bands sit just outside the measured 5th-95th percentile: wide enough to keep
# the real market, tight enough to exclude whole-building and bulk leases that
# carry a single unit's area.
RPSF_BAND = {
    "Flat":      (25, 500),
    "Villa":     (5, 250),
    "Office":    (25, 600),
    "Shop":      (25, 1500),
    "Warehouse": (4, 350),
}

# sale rooms_en -> rent ejari_property_sub_type_en
ROOMS = {"Studio": "Studio", "1 B/R": "1bed room+Hall", "2 B/R": "2 bed rooms+hall",
         "3 B/R": "3 bed rooms+hall", "4 B/R": "4 bed rooms+hall", "5 B/R": "5 bed rooms+hall"}
RENT_ROOMS = set(ROOMS.values())

# Residential is grouped by bedroom count. An office or a shop has no bedrooms,
# so commercial is grouped by type alone.
RESIDENTIAL = {"Flat", "Villa"}
SEGMENT = {"Flat": "Apartments", "Villa": "Villas & townhouses",
           "Office": "Offices", "Shop": "Retail & shops", "Warehouse": "Warehouses"}

SALE_TYPE = {"Unit": "Flat", "Villa": "Villa"}                  # property_type_en
SALE_SUBTYPE = {"Office": "Office", "Shop": "Shop", "Warehouse": "Warehouse"}  # property_sub_type_en

OUT = sys.argv[1] if len(sys.argv) > 1 else "data-audit/yields-dld.json"

def median(xs):
    xs = sorted(xs); n = len(xs)
    if not n: return None
    return xs[n // 2] if n % 2 else (xs[n // 2 - 1] + xs[n // 2]) / 2

# ── sale side ──────────────────────────────────────────────────────────────
sale = defaultdict(list)
with open(os.path.join(D, "transactions_2026-07-30_17-27-33_0001.csv"),
          "r", encoding="utf-8-sig", newline="") as fh:
    for i, row in enumerate(csv.DictReader(fh), 1):
        if row.get("trans_group_en") != "Sales": continue
        d = (row.get("instance_date") or "")[:10]
        if d < SINCE or d > UNTIL: continue
        mp = (row.get("master_project_en") or "").strip()
        if not mp: continue
        st = (row.get("property_sub_type_en") or "").strip()
        pt = SALE_SUBTYPE.get(st) or SALE_TYPE.get((row.get("property_type_en") or "").strip())
        if not pt: continue
        if pt in RESIDENTIAL:
            rm = ROOMS.get((row.get("rooms_en") or "").strip())
            if not rm: continue
        else:
            rm = "—"                      # commercial has no bedroom split
        try: w = float(row.get("actual_worth") or 0)
        except ValueError: continue
        if 100_000 <= w <= 500_000_000:
            sale[(mp, pt, rm)].append(w)
        if i % 250_000 == 0: print(f"  sales {i:,}...", file=sys.stderr, flush=True)
print(f"sale cells: {len(sale):,}", file=sys.stderr)

# ── rent side ──────────────────────────────────────────────────────────────
rent = defaultdict(list)
rej = defaultdict(int)
for p in sorted(glob.glob(os.path.join(D, "rent_contracts_*.csv"))):
    tag = os.path.basename(p).split("_")[-1].replace(".csv", "")
    with open(p, "r", encoding="utf-8-sig", newline="") as fh:
        for i, row in enumerate(csv.DictReader(fh), 1):
            d = (row.get("contract_start_date") or "")[:10]
            if d < SINCE or d > UNTIL: continue
            mp = (row.get("master_project_en") or "").strip()
            if not mp: continue
            pt = (row.get("ejari_property_type_en") or "").strip()
            if pt not in RPSF_BAND:
                rej["property type not covered"] += 1; continue
            usage = (row.get("property_usage_en") or "").strip()
            if pt in RESIDENTIAL and usage != "Residential":
                rej["residential type, non-residential use"] += 1; continue
            if pt in RESIDENTIAL:
                rm = (row.get("ejari_property_sub_type_en") or "").strip()
                if rm not in RENT_ROOMS: continue
            else:
                rm = "—"
            try: a = float(row.get("annual_amount") or 0)
            except ValueError: continue
            if not (RENT_MIN <= a <= RENT_MAX):
                rej["rent outside plausible band"] += 1; continue
            lo, hi = RPSF_BAND[pt]
            try: ar = float(row.get("actual_area") or 0)
            except ValueError: ar = 0
            if ar > 0 and not (lo <= a / (ar * SQM_TO_SQFT) <= hi):
                rej["rent/sqft implausible (bulk lease)"] += 1; continue
            rent[(mp, pt, rm)].append(a)
            if i % 500_000 == 0: print(f"  rent {tag} {i:,}...", file=sys.stderr, flush=True)
print(f"rent cells: {len(rent):,}", file=sys.stderr)
print("rent rows rejected:", file=sys.stderr)
for k, v in sorted(rej.items(), key=lambda x: -x[1]):
    print(f"   {k:36} {v:>10,}", file=sys.stderr)

# ── join ───────────────────────────────────────────────────────────────────
out, thin, implausible = [], 0, []
for key in set(sale) & set(rent):
    mp, pt, rm = key
    ns, nr = len(sale[key]), len(rent[key])
    if ns < MIN_OBS or nr < MIN_OBS:
        thin += 1; continue
    ms, mr = median(sale[key]), median(rent[key])
    y = round(100 * mr / ms, 2)
    rec = {"masterProject": mp, "propertyType": pt, "segment": SEGMENT[pt], "rooms": rm,
           "medianSaleAED": round(ms), "medianAnnualRentAED": round(mr),
           "saleN": ns, "rentN": nr, "grossYieldPct": y}
    (out if YIELD_MIN <= y <= YIELD_MAX else implausible).append(rec)

out.sort(key=lambda r: (r["masterProject"], r["propertyType"], r["rooms"]))
json.dump({
    "method": "median annual Ejari rent / median DLD sale price",
    "window": f"{SINCE} .. {UNTIL}",
    "minObservationsPerSide": MIN_OBS,
    "filters": {
        "usage": "property_usage_en == Residential",
        "rentPerSqftPerYear": "a sensible rent-per-square-foot range set separately for each property type — this removes whole-building and company leases",
        "bandsUsed": {k: f"AED {v[0]}-{v[1]}/sqft/yr" for k, v in RPSF_BAND.items()},
        "absoluteRent": f"AED {RENT_MIN:,}-{RENT_MAX:,}",
        "yieldBand": f"{YIELD_MIN}%-{YIELD_MAX}%",
    },
    "caveat": ("Computed from the COMPLETE DLD exports: all 10 rent-contract parts "
               "against the full transactions export. Verified 2026-08-02."),
    "source": {"sales": "transactions_2026-07-30 (complete)",
               "rents": "rent_contracts_2026-07-29 parts 1-10 (complete)"},
    "cellsPublished": len(out),
    "cellsSuppressedTooThin": thin,
    "cellsSuppressedImplausible": len(implausible),
    "suppressedExamples": sorted(implausible, key=lambda r: -r["grossYieldPct"])[:8],
    "yields": out,
}, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

g = [r["grossYieldPct"] for r in out]
print(f"\npublished {len(out)} cells")
print(f"  suppressed — thin sample: {thin}")
print(f"  suppressed — implausible: {len(implausible)}")
if g:
    print(f"  yield range now: {min(g)}% - {max(g)}%   median {median(g):.2f}%")
print("\nEmaar master projects:")
for r in out:
    if r["masterProject"] in ("Dubai Hills Estate", "DownTown Dubai", "Dubai Creek Harbour",
                              "Business Bay", "Emirates Living", "The Valley"):
        print(f"  {r['masterProject'][:22]:24}{r['propertyType']:6}{r['rooms']:18}"
              f"{r['grossYieldPct']:>6}%  n={r['saleN']}/{r['rentN']}")
