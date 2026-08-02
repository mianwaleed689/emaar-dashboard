# DLD → community alias pipeline

Builds `data-audit/area-aliases.json` — the reviewed mapping between the repo's
community registry and Dubai Land Department's naming, per
[DATA_ARCHITECTURE_PLAN.md](../../DATA_ARCHITECTURE_PLAN.md) Phase 1.2.

Reads nothing from Firestore. Writes nothing but the one JSON file.

## Run

```sh
# 1. index every distinct DLD name value (one streaming pass, ~2 min on 563 MB)
python scripts/dld/index_dld_names.py "<path>/transactions_*.csv" data-audit/dld-name-index.json

# 2. dump the repo's community registry
node scripts/dld/dump_communities.mjs data-audit/repo-communities.json

# 3. build the alias map
python scripts/dld/build_aliases.py \
  data-audit/dld-name-index.json \
  data-audit/repo-communities.json \
  data-audit/area-aliases.json
```

Step 1 is the slow one; its output is reusable, so re-run steps 2–3 alone while
iterating on the alias table.

## The problem this solves

DLD names things at **three levels** and the repo's community list straddles all
of them:

| DLD field | Distinct values | What it is |
|---|---|---|
| `master_project_en` | 159 | master community — blank on 13.4% of rows |
| `area_name_en` | 248 | cadastral area — **contains every developer in it** |
| `project_name_en` | 3,261 | individual project/tower/phase |

So "Dubai Hills Estate" is a master project, "The Oasis" exists only as eight
`The Oasis - …` project names, and "Emaar Beachfront" has no DLD record at all
beyond one branded tower.

## Match tiers

| Tier | Meaning | Auto-accepted? |
|---|---|---|
| `exact-master` | normalised name equals a `master_project_en` | **yes** |
| `alias-proposed` | hand-authored mapping, backed by evidence | no |
| `project-exact-proposed` | name exists only as a `project_name_en` | no |
| `area-exact-proposed` | name matches an area — over-counts by nature | no |
| `duplicate` | restates another community; claims zero volume | no |
| `out-of-emirate` | Abu Dhabi / UAQ — DLD is Dubai-only, absence is expected | n/a |
| `unresolved-documented` | no defensible mapping; the open question is written down | no |

Per plan rule 6, **only `exact-master` is auto-accepted.** Everything else
carries `needsReview: true` and must be signed off by a human before any tab
reads it.

## Two invariants the builder enforces

1. **Areas are never summed into a community's `evidence`.** A DLD area holds
   every developer building in it. Area figures go in `areaContext` with an
   explicit "this is a ceiling, not a volume" warning. Ignoring this inflated
   Emaar Beachfront from 106 transactions to 69,205.

2. **Nothing is silently dropped.** Every DLD master project the registry does
   *not* claim is listed in `unmappedDldMasterProjects` with its volume —
   currently 135 masters, 443,290 transactions, AED 754B.

The builder hard-exits if an alias key doesn't exist in the repo registry or a
`projectExact` value doesn't exist in DLD, so the table can't silently rot when
either side is renamed.

## Developer attribution and yields

```sh
# transactions -> projects -> developers, in AED
python scripts/dld/attribute_developers.py data-audit/developer-attribution-raw.json
python scripts/dld/developer_league.py \
  data-audit/developer-attribution-raw.json data-audit/developer-league.json

# gross yields = median Ejari rent / median DLD sale price
python scripts/dld/build_yields.py data-audit/yields-dld.json
```

### Two join traps, both load-bearing

**1. `project_number` is format-mismatched.** Transactions write `1433.00`;
projects write `1433`. Comparing them raw yields **0 matches**. Normalise via
`str(int(float(v)))` and it becomes 76.7% of sales rows, 65.0% of AED.

**2. `developer_id` is NOT a shared key.** `projects.developer_id` and
`developers.developer_id` are different identifier spaces that collide
numerically. Projects say Nakheel is developer 269; in `developers.csv` 269 is
SABA Properties DMCC, and the real Nakheel is 100. Joining on it produces a
plausible-looking, entirely wrong league table — Nakheel's AED 116B filed under
SABA, and "RABDAN REAL ESTATE" appearing twice for two different companies.

**Bridge on the exact Arabic developer name instead.** It covers 99.8% of
projects. Variants differing only by case or punctuation
(`JUMEIRAH VILLAGE (L.L.C)` vs `JUMEIRAH VILLAGE L.L.C`) are collapsed; genuine
ambiguities are reported, not guessed.

### Yield method

`median annual Ejari rent ÷ median DLD sale price`, both restricted to
2024-01-01 onward so the two medians describe the same market, and both
requiring **≥30 observations per side** — thin cells are suppressed, never
estimated. Room vocabularies differ across the two datasets (`1 B/R` on the sale
side, `1bed room+Hall` on the rent side) and are mapped explicitly.

**The rent side is 4 of 10 export parts (~40%).** Parts 0004–0009 were never
downloaded. Each part is an equal-sized arbitrary chunk spanning the full date
and area range, so it behaves as an unbiased sample — but rent medians carry
sample uncertainty that sale medians do not. This caveat is embedded in
`yields-dld.json`; keep it attached to anything the UI renders.

## Reviewing

Work through `data-audit/area-aliases.json` where `needsReview: true`. Each entry
carries a `note` explaining the evidence and the specific trap to check. When an
entry is confirmed, edit the `ALIASES` table in `build_aliases.py` and re-run —
do not hand-edit the JSON, it is generated.
