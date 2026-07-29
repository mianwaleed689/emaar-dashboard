# DXB ANALYTICS — DATA ARCHITECTURE PLAN

**Written:** 2026-07-29
**Problem:** every core entity has multiple competing definitions, so different
tabs give different answers to the same question.
**Goal:** one record per real-world thing, one stable ID, every tab reading it.

---

## THE PROBLEM, MEASURED

| Entity | Competing sources | Counts |
|---|---|---|
| **Communities** | 7 | 281 · 253 · 231 · 85 · 49 · 30 · 11 |
| **Projects** | 5 | 1,728 · 1,545 · 8 · missing · 0 |
| **Developers** | 4 | 2,034 · 1,731 · 15 · 8 |
| **Areas** | 4 field names | `.masterCommunity` 36 uses · `.sector` 10 · `.area` 7 · `.district` 1 |

Consequences already observed:
- Developer Health ranks 15 of 2,034 developers and calls it a leaderboard
- Ten `DUBAI HILLS - …` rows carry identical figures — no hierarchy
- The Map reads `n.lat`; communities store `coordinates.lat` — pins silently omitted
- `cron-yields` serves 11 communities; the Yields tab displays 281
- `communityData` holds 11 docs while the parent reads `communities` (253) for
  fields only ever written to those 11 — produced `NaN`
- 780 KB of hardcoded developer data ships to every browser

---

## CONSTRAINTS

1. **Firestore free tier: 50,000 reads/day.** Every phase below states a read
   budget. Exceeding it takes the live site down — this already happened once.
2. **No managed backups without Blaze.** Therefore: **no destructive operations.**
   Every migration writes to a NEW collection. Nothing is deleted until the new
   one is verified and has run in production for a week.
3. **Read once, cache locally.** Each phase pulls what it needs to a local JSON
   file, then works offline. No repeated querying.

---

## PHASE 0 — DIAGNOSTIC READS
**Budget: ~900 reads. Half a day. Do this first — everything else depends on it.**

The plan below is built on inference from code. Phase 0 replaces inference with
fact. Do not start Phase 1 until these numbers exist.

| # | Question | Method | Reads |
|---|---|---|---|
| 0.1 | How many communities have usable coordinates, in either `lat`/`lng` or `coordinates.lat`? | read `neighbourhoodScores` | 281 |
| 0.2 | Distinct values of `area`, `parentArea`, `masterCommunity`, `cadastralCode` | same pass, no extra reads | 0 |
| 0.3 | How many carry `isMaster: true` | same pass | 0 |
| 0.4 | Same field census for `communities` | read `communities` | 253 |
| 0.5 | `developers` schema — which fields populated, how many have `lastDailyTxnCount` | read `developers` | 2,034* |
| 0.6 | `projects` — does a `stage` field exist, and do its values match the filter options | sample 200 | 200 |
| 0.7 | Overlap between the 7 community lists — exact match, alias match, unmatched | offline, from cached data | 0 |

\* If 2,034 is too expensive on the day, sample 300 and extrapolate — schema
questions do not need a full read.

**Output:** `data-audit/phase0.json` cached locally, plus a written summary of
what each number means for the plan below. **The plan may change after this.**

---

## PHASE 1 — AREAS REGISTRY
**Budget: ~0 additional reads (uses Phase 0 cache). 2–3 days.**

Areas first: it is the root of the tree, and the smallest.

### 1.1 Build the list
From the cached data, extract every distinct value of `area`, `parentArea`,
`masterCommunity`, `cadastralCode`. Expect 30–60 real master areas.

### 1.2 Reconcile
Manual review — this cannot be automated. `"Dubai Hills Estate"`,
`"DUBAI HILLS"`, `"dubai-hills-estate"` are one area. Produce a mapping file
`data-audit/area-aliases.json` that a human has checked.

### 1.3 Write the registry
New collection **`areas_v1`**. One document per master area:
```
{ id, name, aliases[], cadastralCodes[], coordinates, communityIds[],
  source, asOf }
```
`developments` (currently 0 docs) is NOT reused — it stays untouched.

### 1.4 Verify
- Every community in Phase 0's cache maps to exactly one area
- Zero communities orphaned; if any, they go in an `UNASSIGNED` area, visibly
- Count of areas is stable across two runs

**Rollback:** delete `areas_v1`. Nothing else has changed yet.

---

## PHASE 2 — COMMUNITIES REGISTRY
**Budget: ~0 additional reads. 3–5 days. The hardest phase.**

### 2.1 Matching strategy, in order
1. Exact match on normalised name (lowercase, strip punctuation)
2. Match on `cadastralCode` — DLD's own identifier, the most reliable key
3. Alias match against a hand-built alias table
4. Fuzzy match, **flagged for human review — never auto-accepted**
5. Unmatched entries listed explicitly, never silently dropped

### 2.2 Write `communities_v1`
```
{ id, name, aliases[], areaId,        ← links to areas_v1
  coordinates: {lat, lng}, hasCoordinates,
  isMaster, parentCommunityId,        ← the hierarchy, explicit
  pricing:  { medianPPSF, medianPrice, p25, p75, sampleSize, source, asOf },
  yields:   { gross, net, serviceCharge, source, asOf },
  provenance: { level, source, asOf } ← per the existing provenance.js model
}
```

### 2.3 Verify before any tab switches over
- **Total count is explainable.** If it is not 281, the difference must be
  itemised — merged duplicates, dropped junk — not hand-waved.
- The ten `DUBAI HILLS - …` rows collapse to one master with sub-communities
- Known junk (`Site A`, `WARSAN FIRST DEVELOPMENT`, `JABEL ALI HILLS`,
  `Madinat Hind 4`, `Saih Shuaib 1/2`) is either classified as a real area or
  flagged `visibility: "hidden"` — **not deleted**
- Coordinate coverage is stated as a number, and communities without
  coordinates render as "location unavailable" rather than vanishing

### 2.4 Cut over, one tab at a time
Order by blast radius, smallest first: Service Charges → Yields → Investment
Score → Neighbourhoods → Map → the rest. **Record the row count before and
after each switch.** A change in count is a bug until explained.

**Rollback:** tabs read a single `useCommunities()` hook. Point it back at
`neighbourhoodScores`. One-line revert.

---

## PHASE 3 — DEVELOPERS REGISTRY
**Budget: ~0 additional reads. 2–3 days.**

### 3.1 Write `developers_v1`
Merge Firestore `developers` (2,034) with `data_developers.js` (1,731),
matching on normalised name. Keep `lastDailyTxnCount` / `lastDailyTxnValue`
from the DLD cron — that is the only live signal.

### 3.2 Rebuild the two fabricated tabs
**Developer Health** currently shows a 9-factor score. Of 100 points, ~33 are
derivable; delivery record (20), reputation (9), RERA compliance (10) and buyer
mix (5) have no data source. **Do not compute a composite.** Show instead:
- transaction count and value (live, daily, DLD)
- market share and rank (computed from the above)
- active project count (from `projects_v1`)
- financials — real for Emaar, shown as absent for everyone else

**Competitors** — same treatment. Real metrics, no invented grades.

### 3.3 Delete `data_developers.js`
780 KB removed from the browser bundle, once nothing imports it.

---

## PHASE 4 — PROJECTS REGISTRY
**Budget: 1,728 reads. 2–3 days.**

### 4.1 Write `projects_v1`
```
{ id, dldId, name, developerId,   ← links to developers_v1
  communityId,                    ← links to communities_v1
  coordinates, stage, constructionPct, handoverQuarter,
  pricing, provenance }
```

### 4.2 Fix the filter/display mismatch
The filter offers `announced` / `under-construction` / `recently-delivered` /
`historical`. The card badge is derived from `constructionPct`, `status` and
`lifecycleStage`. **They use different vocabularies**, so a project can display
"Under Construction" and not appear when filtered for it.

Define `stage` once, derive both filter and badge from it.

### 4.3 Resolve the `projectData` split-brain
AdminPanel writes project edits to `projectData` — a collection that does not
exist — across 13 paths, **3 of which are deletes**. DataManagerV2 writes to
`projects`. Redirecting the deletes without a backup would make currently-inert
buttons destructive.

**Requires Blaze + a verified export first. Do not attempt before then.**

---

## PHASE 5 — RETIRE THE OLD SOURCES
**1 day. Only after the new registries have run in production for a week.**

- Remove hardcoded lists from `cron-yields` and `cron-sync-market`; iterate the
  registry instead, so coverage grows automatically
- Delete `SEED_DATA` (85 communities), `SEED_PROJECTS`, `communities-list.json`
- Retire `dubai_complete_foundation.js`, `emaar.communities.js`, `data_master.js`
  where superseded — ~207 KB
- Only then archive `neighbourhoodScores` / `communities` / `developers`

---

## PARALLEL WORK — does not need the registries

| Task | Effort | Blocked by |
|---|---|---|
| Filter audit — confirm every dropdown option matches ≥1 record | 0.5 day | quota |
| Real yields: live Bayut rent ÷ stored DLD median | 1 day | quota |
| Fix stale off-plan 65% → 70%+ (Firestore value) | 1 hour | quota |
| Reconcile `scoreSource` vs `source` contradiction | 0.5 day | quota |
| Support system: build or remove (39 refs, 3 missing collections) | 2–3 days or 1 hour | decision |
| Tests on calculators and yield formula | 2 days | nothing |
| Split AdminPanel.jsx (22,315 lines), one tab per commit | ongoing | nothing |

---

## SEQUENCE AND TIMELINE

| Phase | Days | Gate |
|---|---|---|
| 0 — Diagnostics | 0.5 | quota reset |
| 1 — Areas | 2–3 | Phase 0 |
| 2 — Communities | 3–5 | Phase 1 |
| 3 — Developers | 2–3 | Phase 2 |
| 4 — Projects | 2–3 | Phase 3 + **Blaze** for the split-brain |
| 5 — Retire | 1 | one week of production stability |

**Total: 11–16 working days**, plus parallel work.

---

## RULES FOR EVERY PHASE

1. **Write to a new collection.** Never mutate the source in place.
2. **State a read budget before starting.** Cache locally; do not re-query.
3. **Count before and after.** An unexplained change in row count is a bug.
4. **Nothing is deleted** until the replacement has been live a week.
5. **Unmatched records are listed, never silently dropped.**
6. **Fuzzy matches need human review.** Automated fuzzy matching is how
   "Dubai Hills" became ten separate communities in the first place.
7. **Missing data renders as "unavailable"**, never as an invented value and
   never by omitting the row.

---

## WHAT SUCCESS LOOKS LIKE

Ask *"how many communities do we cover?"* from any tab, any cron, any admin
screen — and get **one number**.

Today that question has seven answers.
