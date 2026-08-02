"""Build data-audit/area-aliases.json per DATA_ARCHITECTURE_PLAN Phase 1.2.

Rules honoured:
  - exact match on normalised name is auto-accepted
  - everything else is PROPOSED and carries needsReview: true (plan rule 6)
  - unmatched repo communities are listed explicitly (plan rule 5)
  - unmapped DLD master projects are ALSO listed, with volume, so no DLD
    revenue is silently dropped
"""
import json, re, sys
from collections import defaultdict

idx_path, repo_path, out_path = sys.argv[1], sys.argv[2], sys.argv[3]
IDX = json.load(open(idx_path, encoding="utf-8"))
REPO = json.load(open(repo_path, encoding="utf-8"))

MASTER, AREA, PROJ = IDX["master_project_en"], IDX["area_name_en"], IDX["project_name_en"]

def norm(s):
    return re.sub(r"[^a-z0-9]+", "", (s or "").lower())

master_norm = {norm(k): k for k in MASTER}
area_norm   = {norm(k): k for k in AREA}

# ── Hand-authored alias table ────────────────────────────────────────────────
# Authored from evidence in the DLD index (see probe output). Every entry here
# is a PROPOSAL for human review — none is auto-accepted.
#   master:  DLD master_project_en values that make up this community
#   area:    DLD area_name_en values (used when DLD has no master project)
#   projectPrefix: project_name_en prefixes; expanded to a concrete list below
ALIASES = {
    "arabian-ranches": {
        "master": ["Arabian Ranches - 1", "Arabian Ranches - Polo Homes"],
        "note": "Repo has one 'Arabian Ranches' but DLD splits the estate into 4 "
                "master projects. R1 + Polo Homes assigned here; R2 and R3 are "
                "separate communities. Confirm whether the repo entry means R1 "
                "only or the whole estate.",
    },
    "arabian-ranches-3": {
        "master": ["Arabian Ranches 3"],
        "note": "DLD spells it 'Arabian Ranches 3'. 'Arabian Ranches II' (2,902 "
                "txns, AED 6.5B) has NO repo community and is listed as unmapped.",
    },
    "jumeirah-village-circle": {
        "master": ["Jumeirah Village Circle"],
        "note": "Exact on name once the '(JVC)' suffix is stripped. CAUTION: JVC "
                "is Nakheel-master-planned but the overwhelming majority of its "
                "56,217 txns / AED 59.3B are third-party developer towers. "
                "Attributing this volume to Nakheel would be wrong.",
    },
    "palm-jebel-ali": {
        "master": ["Palm Jabal Ali"],
        "note": "Spelling variant — DLD writes 'Palm Jabal Ali' (991 txns, "
                "AED 23.3B). High value, low count: large off-plan villa plots.",
    },
    "dubai-islands": {
        "master": ["Palm Deira"],
        "note": "PROPOSED. Dubai Islands is the rebrand of Deira Islands / Palm "
                "Deira; DLD still files it under the old name 'Palm Deira' "
                "(5,189 txns, AED 25.7B). Confirm the rebrand before accepting.",
    },
    "the-greens-views": {
        "master": ["The Greens"],
        "note": "Repo bundles Greens & Views; DLD has only 'The Greens'. Verify "
                "whether The Views transactions sit under 'The Greens' or under "
                "area 'Al Thanyah Third'.",
    },
    "emaar-beachfront": {
        "projectPrefix": ["Emaar Beachfront"],
        "projectContains": ["Emaar Beachfront"],
        "area": ["Marsa Dubai"],
        "note": "NO DLD master project exists. Only one project name carries the "
                "brand ('THE BRISTOL Emaar Beachfront'). The towers (Beach Isle, "
                "Beach Mansion, Grand Bleu, Palace Beach Residence, Sunrise Bay...) "
                "are named individually and sit in area 'Marsa Dubai' alongside "
                "all of Dubai Marina. Area is NOT a safe proxy — 69,099 txns / "
                "AED 143B in Marsa Dubai is mostly not Emaar Beachfront. "
                "NEEDS A HAND-BUILT TOWER LIST.",
    },
    "emaar-south": {
        "area": ["Madinat Al Mataar"],
        "note": "No DLD master project. Area 'Madinat Al Mataar' = 22,642 txns / "
                "AED 39.0B, which also contains non-Emaar stock near DWC. "
                "Area is an over-count; verify against a project list.",
    },
    "the-oasis": {
        "projectPrefix": ["The Oasis - "],
        "note": "No DLD master project. Sub-projects are prefixed 'The Oasis - ' "
                "(Palace Villas Ostra, Address Villas Tierra, ...). Prefix match "
                "is clean here. Do NOT match master project 'Silicon Oasis'.",
    },
    "rashid-yachts-marina": {
        "master": ["Mina Rashid"],
        "note": "DLD calls it 'Mina Rashid' (2,321 txns, AED 6.2B). Confirm the "
                "repo community means the same waterfront development.",
    },
    "grand-polo-club": {
        "projectPrefix": ["Grand Polo - "],
        "note": "No DLD master project. Sub-projects prefixed 'Grand Polo - ' "
                "(Equiterra, Equestra, Montura, Selvara). All 2025+ launches. "
                "Do NOT confuse with master project 'Arabian Ranches - Polo Homes' "
                "or project 'THE POLO RESIDENCE'.",
    },
    "expo-living": {
        "master": ["EXPO CITY"],
        "note": "DISPUTED. DLD master 'EXPO CITY' (1,978 txns, AED 4.5B) is "
                "developed by Expo City Dubai, not Emaar. Repo lists 'Expo Living' "
                "under Emaar. Resolve the developer attribution before accepting.",
    },
    "the-heights-cw": {
        "projectExact": ["Serro The Heights", "Serro 2 The Heights", "Salva The Heights"],
        "note": "No master project. Three 2026-launch sub-projects carry the name. "
                "Do NOT include 'THE HEIGHTS-GOLDEN' (2 txns, 2018) — unrelated.",
    },
    "damac-islands": {
        "projectPrefix": ["DAMAC ISLANDS"],
        "note": "No master project. Phases named 'DAMAC ISLANDS - <island>' and "
                "'DAMAC ISLANDS 2 - <island>'. Prefix captures both; decide "
                "whether Islands 2 is the same community or a separate one.",
    },
    "damac-riverside": {
        "projectPrefix": ["DAMAC RIVERSIDE"],
        "note": "TRAP: the '3x0 Riverside Crescent' towers (~2,400 txns) also "
                "contain 'Riverside' but are Sobha stock in Sobha Hartland, NOT "
                "DAMAC. Prefix is restricted to 'DAMAC RIVERSIDE' for that reason. "
                "Confirm the Crescent towers' true owner before mapping them.",
    },
    "sobha-hartland-2": {
        "note": "UNRESOLVED — needs a human. DLD has master 'SOBHA HARTLAND' "
                "(8,762 txns, AED 16.0B) with no phase-2 split. Hartland 2 stock "
                "is probably filed under that master or under the 'Riverside "
                "Crescent' / 'Sobha One' / 'Sobha Orbis' project names. Assigning "
                "the master here would double-count against 'sobha-hartland'. "
                "Deliberately left claiming nothing.",
    },
    "sobha-seahaven": {
        "projectExact": ["Sobha Seahaven Tower A", "Sobha Seahaven Tower B & C"],
        "note": "No master project. Two towers only.",
    },
    "sobha-elwood": {
        "projectExact": ["Elwood Estates"],
        "note": "DLD files it as 'Elwood Estates' without the Sobha prefix.",
    },
    "port-de-la-mer": {
        "projectPrefix": ["Port de La Mer", "Port De La Mer"],
        "note": "Sub-development of DLD master 'LA MER' (1,788 txns, AED 10.0B). "
                "Mapped at project level on purpose — claiming the LA MER master "
                "would swallow 'Sur La Mer' and La Mer proper, which are not this.",
    },
    "jumeira-bay": {
        "master": ["Jumeira Bay"],
        "note": "Clean master match (522 txns, AED 12.0B). Low count, very high "
                "value — ultra-prime plots and Bulgari branded stock.",
    },
    "dubai-design-district": {
        "projectContains": ["at d3"],
        "note": "No master project; d3 residential is recent (2025+). Only two "
                "projects exist so far — 'THE EDIT at d3', 'Atelis at d3'. "
                "Commercial d3 stock does not appear in this dataset.",
    },
    "haven-dubai": {
        "projectPrefix": ["Haven By Aldar", "Verdes by Haven"],
        "note": "TRAP: 'THE HAVEN' (2016), 'Binghatti Haven' and 'Creek Haven' "
                "are different developments and are excluded.",
    },
    "dubai-mansions": {
        "note": "NO DLD PRESENCE AT ALL — zero hits across master, area and all "
                "3,261 project names. Either not yet transacting, filed under a "
                "name that shares no token, or not a real community. Verify it "
                "belongs in the registry.",
    },
    "address-residences-zabeel": {
        "projectContains": ["Address Residences Zabeel"],
        "note": "Exists only as a project_name_en (906 txns, AED 2.9B). No master "
                "project, no matching area.",
    },
}

# Repo entries that restate a community already defined under another developer.
# These are the "competing definitions" the architecture plan is trying to kill:
# they must NOT each claim the same DLD volume.
DUPLICATES = {
    "binghatti-business-bay": "business-bay",
    "binghatti-jvc": "jumeirah-village-circle",
}

# ── Validation: every alias/duplicate key must exist in the repo ─────────────
repo_ids = {c["id"] for c in REPO}
for table, label in ((ALIASES, "ALIASES"), (DUPLICATES, "DUPLICATES")):
    unknown = sorted(set(table) - repo_ids)
    if unknown:
        sys.exit(f"FATAL: {label} keys not present in repo communities: {unknown}")
for dup_target in DUPLICATES.values():
    if dup_target not in repo_ids:
        sys.exit(f"FATAL: DUPLICATES target '{dup_target}' not a repo id")

def expand_projects(spec):
    """Resolve projectPrefix / projectContains into concrete project_name_en values."""
    found = {}
    for p in spec.get("projectPrefix", []):
        for k in PROJ:
            if k.lower().startswith(p.lower()):
                found[k] = PROJ[k]
    for c in spec.get("projectContains", []):
        for k in PROJ:
            if c.lower() in k.lower():
                found[k] = PROJ[k]
    for x in spec.get("projectExact", []):
        if x in PROJ:
            found[x] = PROJ[x]
        else:
            sys.exit(f"FATAL: projectExact '{x}' not present in DLD project names")
    return found

def totals(master=(), area=(), projects=()):
    t = {"txns": 0, "salesAED": 0}
    for m in master:
        if m in MASTER: t["txns"] += MASTER[m]["txns"]; t["salesAED"] += MASTER[m]["salesAED"]
    for a in area:
        if a in AREA: t["txns"] += AREA[a]["txns"]; t["salesAED"] += AREA[a]["salesAED"]
    for p in projects:
        if p in PROJ: t["txns"] += PROJ[p]["txns"]; t["salesAED"] += PROJ[p]["salesAED"]
    return t

proj_norm = {norm(k): k for k in PROJ}
entries, claimed_master = [], set()

for c in REPO:
    key, nm = c["id"], norm(c["name"])
    # strip a trailing parenthetical — "Jumeirah Village Circle (JVC)", "JVC (Binghatti)"
    nm_bare = norm(re.sub(r"\s*\([^)]*\)\s*$", "", c["name"]))
    e = {"id": key, "name": c["name"], "developer": c["developer"],
         "emirate": c.get("emirate"), "sourceFile": c["sourceFile"]}

    if c.get("emirate") and c["emirate"] != "Dubai":   # tier 0 — out of scope
        e.update(matchTier="out-of-emirate", needsReview=False, dld={},
                 evidence={"txns": 0, "salesAED": 0},
                 note=f"{c['emirate']}, not Dubai. The DLD dataset covers Dubai "
                      f"only, so absence here is expected — this is NOT a data "
                      f"gap and must not be counted as unmatched.")

    elif key in DUPLICATES:                     # tier 0b — restatement
        e.update(matchTier="duplicate", needsReview=True, dld={},
                 duplicateOf=DUPLICATES[key],
                 evidence={"txns": 0, "salesAED": 0},
                 note=f"Restates '{DUPLICATES[key]}' under a different developer. "
                      f"Deliberately claims NO DLD volume — the canonical entry "
                      f"holds it. Merge or scope these before cutover.")

    elif key in ALIASES:                        # tier 1 — hand-authored alias wins
        spec = ALIASES[key]
        ms = [m for m in spec.get("master", []) if m in MASTER]
        ar = [a for a in spec.get("area", []) if a in AREA]
        pj = expand_projects(spec)
        claimed_master.update(ms)
        # Areas are NEVER summed into the claim: a DLD area holds every developer
        # that builds in it, so adding it would inflate the community's volume.
        # It is reported separately as context, with an explicit ceiling.
        e.update(matchTier="alias-proposed" if (ms or ar or pj) else "unresolved-documented",
                 needsReview=True,
                 dld={k: v for k, v in
                      {"master_project_en": ms,
                       "project_name_en": sorted(pj, key=lambda x: -PROJ[x]["txns"])}.items() if v},
                 evidence=totals(master=ms, projects=pj),
                 note=spec["note"])
        if ar:
            e["areaContext"] = {
                "area_name_en": ar,
                "areaTotals": totals(area=ar),
                "warning": "CONTEXT ONLY — deliberately NOT added to evidence. "
                           "A DLD area contains every developer building in it, "
                           "so this is a ceiling for the community, not its volume.",
            }
            if not ms and not pj:
                e["evidenceWarning"] = "No master or project match exists — this " \
                                       "community currently claims ZERO volume. " \
                                       "The area figure is the only signal, and it " \
                                       "is an over-count."

    elif nm in master_norm or nm_bare in master_norm:   # tier 2 — exact on master
        real = master_norm[nm if nm in master_norm else nm_bare]
        claimed_master.add(real)
        e.update(matchTier="exact-master", needsReview=False,
                 dld={"master_project_en": [real]},
                 evidence={**totals(master=[real]),
                           "first": MASTER[real]["first"], "last": MASTER[real]["last"]})
        if real != c["name"]:
            e["note"] = f"DLD spells it '{real}' — differs by case/spacing, so a " \
                        f"case-sensitive join drops all {MASTER[real]['txns']:,} rows."

    elif nm in area_norm or nm_bare in area_norm:       # tier 3 — exact on area
        real = area_norm[nm if nm in area_norm else nm_bare]
        e.update(matchTier="area-exact-proposed", needsReview=True,
                 dld={"area_name_en": [real]},
                 evidence={**totals(area=[real]),
                           "first": AREA[real]["first"], "last": AREA[real]["last"]},
                 note="Matched a DLD AREA, not a master project. Areas contain "
                      "multiple developers — this over-counts. Verify.")

    elif nm in proj_norm or nm_bare in proj_norm:       # tier 4 — exact on project
        real = proj_norm[nm if nm in proj_norm else nm_bare]
        e.update(matchTier="project-exact-proposed", needsReview=True,
                 dld={"project_name_en": [real]},
                 evidence={**totals(projects=[real]),
                           "first": PROJ[real]["first"], "last": PROJ[real]["last"]},
                 note=f"Exists in DLD only as a project_name_en ('{real}'), with no "
                      f"master project. Volume is therefore a FLOOR — sibling "
                      f"phases filed under other project names are not included.")

    else:                                       # tier 5 — unmatched, listed
        toks = [t for t in re.split(r"[^a-z0-9]+", c["name"].lower()) if len(t) > 3]
        cand = defaultdict(list)
        for field, d in (("master_project_en", MASTER), ("area_name_en", AREA),
                         ("project_name_en", PROJ)):
            for k in d:
                if any(t in k.lower() for t in toks):
                    cand[field].append(k)
        e.update(matchTier="unmatched", needsReview=True, dld={},
                 fuzzyCandidates={f: sorted(v, key=lambda x: -{"master_project_en": MASTER,
                                  "area_name_en": AREA, "project_name_en": PROJ}[f][x]["txns"])[:8]
                                  for f, v in cand.items()},
                 evidence={"txns": 0, "salesAED": 0},
                 note="No exact or aliased match. Fuzzy candidates listed for "
                      "human review — NOT accepted (plan rule 6).")
    entries.append(e)

unmapped = [{"master_project_en": k, **v} for k, v in MASTER.items() if k not in claimed_master]
unmapped.sort(key=lambda x: -x["salesAED"])

matched_txns = sum(MASTER[m]["txns"] for m in claimed_master)
out = {
    "generated": "2026-07-31",
    "source": {
        "dld": "transactions_2026-07-30_17-27-33_0001.csv",
        "dldRows": IDX["totalRows"],
        "repo": "src/communities/*.communities.js",
        "repoCommunities": len(REPO),
    },
    "summary": {
        "byTier": {t: sum(1 for e in entries if e["matchTier"] == t) for t in
                   ["exact-master", "alias-proposed", "area-exact-proposed",
                    "project-exact-proposed", "duplicate", "out-of-emirate",
                    "unresolved-documented", "unmatched"]},
        "needsReview": sum(1 for e in entries if e["needsReview"]),
        "dldMasterProjects": len(MASTER),
        "dldMasterProjectsClaimed": len(claimed_master),
        "dldMasterProjectsUnmapped": len(unmapped),
        "txnsCoveredByClaimedMasters": matched_txns,
        "txnsCoveredPct": round(100 * matched_txns / IDX["totalRows"], 1),
    },
    "communities": entries,
    "unmappedDldMasterProjects": unmapped,
}
json.dump(out, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

s = out["summary"]
for t, n in s["byTier"].items():
    print(f"  {t:26} {n:>3}{'   (review)' if t != 'exact-master' and t != 'out-of-emirate' and n else ''}")
print(f"-> needs human review: {s['needsReview']} of {len(entries)}")
print(f"\nDLD master projects: {s['dldMasterProjects']} total, "
      f"{s['dldMasterProjectsClaimed']} claimed, {s['dldMasterProjectsUnmapped']} unmapped")
print(f"Repo covers {s['txnsCoveredPct']}% of the {IDX['totalRows']:,} DLD transactions")
print(f"\nTop unmapped by sales value:")
for u in unmapped[:12]:
    print(f"   {u['master_project_en']:48} {u['txns']:>7,} txns  AED {u['salesAED']/1e9:6.1f}B")
