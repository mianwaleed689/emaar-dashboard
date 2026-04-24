# DXB ANALYTICS — TAB AUDIT REPORT
Date: 2026-04-24
Scope: Projects, Handover, Launch Calendar (all 3 unified tabs)
Source: Golf Grand in Firestore (267 verified fields, quality score 95/100)

---

## CRITICAL FINDING

Golf Grand has 267 fields with data_quality_score=95 ("fully-verified").
The UI is showing "0" or missing data for fields that DO exist under
different names, because my transformers look for the wrong field names.

Worse, my transformers default to fabricated values (like devOnTimeRate=85 for tier 1)
instead of reading real fields OR showing "—" for missing data.

This is the exact anti-pattern we removed from SEED_HANDOVERS and SEED_LAUNCHES.
I silently reintroduced it in the transformers.

---

## ISSUE 1: "Handover: 2027" (missing Q1)

TAB: Handover detail modal
CURRENT: Shows "2027" only
SHOULD: Show "Q1 2027" or "March 2027"

ROOT CAUSE:
- My transformer sets handoverQuarter to "" then tries to parse handoverDate
- handoverDate is "2027-03-31" which doesn't contain "March" word
- Month parser fails, falls back to year only "2027"

FIRESTORE TRUTH:
- p.handoverQuarter = undefined
- p.handover = "Q1 2027"           ← USE THIS
- p.expectedHandover = "Q1 2027"   ← OR THIS
- p.handoverMonth = "March 2027"   ← OR THIS
- p.contractedHandover = "31 March 2027"

FIX: Prioritize p.handover first (already "Q1 2027"), fallback chain correctly.

---

## ISSUE 2: "Avg Unit Size: 0 sqft"

TAB: Handover detail modal
CURRENT: Shows "0 sqft"
SHOULD: Show "940 sqft" OR range "680-2,011 sqft"

ROOT CAUSE:
- My transformer does: avgUnitSize: p.avgUnitSize || 0
- p.avgUnitSize does not exist in Firestore
- Falls back to 0

FIRESTORE TRUTH:
- p.unitSizeAvgSqFt = 940          ← USE THIS
- p.unitSizeMinSqFt = 680
- p.unitSizeMaxSqFt = 2011
- p.sizeMin = 680
- p.sizeMax = 2011

FIX: Map p.unitSizeAvgSqFt || p.avgUnitSize || 0 with fallback to range string.

---

## ISSUE 3: "Since Launch: +0%" (Capital Appreciation)

TAB: Handover detail modal
CURRENT: "+0%"
SHOULD: Show real value OR hide field if unknown

ROOT CAUSE:
- My transformer does: appreciationSinceLaunch: p.appreciationSinceLaunch || 0
- p.appreciationSinceLaunch does not exist
- p.appreciationToHandover = null (explicitly null)
- Falls back to 0, shown as "+0%" which is misleading

FIRESTORE TRUTH (calculable):
- p.priceMinAtLaunch = 1,450,000   ← launch price
- p.priceMin = 1,360,000           ← current price
- Computed appreciation = (1360000 - 1450000) / 1450000 = -6.2%

HONEST ANSWER: Golf Grand's entry price has DROPPED -6.2% since launch
(from 1.45M to 1.36M). This is real, meaningful intelligence.

OPTIONS:
  A) Compute honestly: show "-6.2% since launch" (could alarm buyers)
  B) Show "—" for unknown (hide the field)
  C) Remove this field entirely from the modal

RECOMMENDATION: Option A. Real investors want truth, not comforting defaults.
A price drop since launch signals developer discounting or market softness
- critical info for Bloomberg-tier platform.

---

## ISSUE 4: "Dev On-Time: 85%" (Fabricated)

TAB: Handover detail modal + Launch Calendar
CURRENT: "85%"
SHOULD: "88%" from DEVELOPER_INDEX (Emaar research-backed)

ROOT CAUSE:
- My transformer does: devOnTimeRate: p.devOnTimeRate || (p.tier === 1 ? 85 : 70)
- p.devOnTimeRate does not exist in Firestore
- Falls back to 85 for all tier 1 developers - WRONG
- Emaar's research-backed rate is 88 per DEVELOPER_INDEX in HandoverTab.jsx
- Sobha is 91, Nakheel 80, DAMAC 71, etc. - each different

SOLUTION: Look up developer name in DEVELOPER_INDEX, return its onTime value.
This is honest (research-backed from prelaunch.ae, BSA Law, Fitch Ratings)
instead of fabricated defaults.

---

## ISSUE 5: Description Duplicated

TAB: Handover detail modal
CURRENT: Shows description text twice (once at top of card, once in modal quoted)
SHOULD: Show once

ROOT CAUSE: Card and modal both render p.description independently.

FIX: Modal shouldnt repeat the card description; show other details instead
(amenities count, verification status, etc.) or remove the duplicate quote.

---

## ISSUE 6: Delay Risk Score "15" (Fabricated)

TAB: Handover detail modal
CURRENT: "15" (hardcoded for tier 1)
SHOULD: Either compute from real signals OR show "N/A"

ROOT CAUSE:
- My transformer does: delayRiskScore: p.delayRiskScore || (p.tier === 1 ? 15 : 40)
- No such field in Firestore
- Fabricated

SOLUTION: Compute from real signals:
- constructionPct (73% = on track)
- handoverDate proximity
- developer DEVELOPER_INDEX score
OR just show "Low risk" label without the numeric score (the label is already
shown and is sufficient).

---

## ISSUE 7: Rise Risk Score alignment

Checking - probably affected by same patterns. Will audit Launch Calendar
modal fully in Phase 3.

---

## OTHER FAKE DEFAULTS IN TRANSFORMERS

HandoverTab.jsx transformer (L151-L178):
  L160: constructionPct uses real field ✓
  L162: onSchedule computed from constructionPct ✓
  L163: delayRiskScore FABRICATED (15 or 40)
  L166: avgUnitSize WRONG field name (p.avgUnitSize not p.unitSizeAvgSqFt)
  L168: devOnTimeRate FABRICATED (85 or 70)
  L170: bedTypes reads p.beds or Object.keys(p.bedConfig) - Golf Grand has p.beds ✓
  L171: riskFactors HARDCODED strings
  L172: riskLevel ALWAYS "low" for tier 1, "medium" for others (oversimplified)
  L174: appreciationSinceLaunch WRONG field + missing calculation fallback

LaunchCalendarTab.jsx transformer (similar patterns to audit fully).

---

## RECOMMENDATION

Do a proper rewrite of both transformers with these principles:

RULE 1: Read real field first, try 2-3 known aliases, fall back to empty
RULE 2: Never fabricate defaults ("85" for all tier 1 is fake)
RULE 3: When field genuinely missing, show "—" or hide, not "0"
RULE 4: Compute derived values when possible (appreciation from price history)
RULE 5: Use DEVELOPER_INDEX for on-time rates (real research)

After this pass: Golf Grand Handover and Launch Calendar views will have
ZERO fabricated fields. Every number shown is either from Firestore directly
or computed from real data with clear labeling.