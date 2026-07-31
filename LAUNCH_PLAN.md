# DXB ANALYTICS — LAUNCH PLAN

**Written:** 2026-07-31
**Goal:** a product Dubai agents and agencies pay for monthly, that never
embarrasses them in front of a client.

---

## THE ONE IDEA

You sell **defensible data**. Every competitor shows rising lines; you show the
whole truth including both crashes, label what is estimated, and let an agent
send a client the source. That is the product. Every decision below serves it.

An agent is not buying data. They are buying the ability to answer *"is now a
good time?"* without sounding like a brochure.

---

## THE LAUNCH BAR

Not "all 34 tabs perfect". A tab ships when a paying agent can use it in front
of a client without getting caught out:

1. **Sourced** — every number has a source, date or sample size
2. **Honest** — nothing the code itself flags as unverified
3. **Provenance** — measured and estimated are visibly different
4. **Alive** — reads real data
5. **Renders** — verified in a browser, not just in a passing build

Measured by `node scripts/tab-scorecard.js`. **Ship bar: 75%+.**

### Where we are today

```
average score        64%
tabs at 75%+          9 of 35
tabs below 70%       25
unsourced claims     97
self-admitted bad     0
```

---

## THE STRATEGIC CHOICE

**Ship 18 tabs that meet the bar, not 34 that do not.**

34 tabs is not a feature. An agent uses eight. The rest is navigation cost, and
every unfinished tab is a chance to be caught with a number you cannot defend —
which is the one thing this product cannot afford.

Tabs held back are not deleted. They return when they meet the bar.

---

## PHASE 0 — DECISIONS (blocks everything, ~1 hour of your time)

| # | Decision | Why it blocks |
|---|---|---|
| 0.1 | **The four developer tabs** — Dev Portal, Competitors, Developer Health, Financials. Repurpose for agents, or hold back? | 12% of the product serves an audience that does not pay. Financials is the worst-scoring tab because nobody maintains it. |
| 0.2 | **Seat allowance** — AED 500 = how many agents? Assumed 10. | Billing and seat enforcement both depend on it. Confirm before taking money. |
| 0.3 | **Firestore rules** — yes to deploying `almanacEntries` access. | Blocks the almanac editor. |
| 0.4 | **v1 tab list** — confirm the 18 below. | Everything downstream. |

### Proposed v1 — 18 tabs

**Daily use (agent):** Overview · Neighbourhoods · Projects · Map · Yields ·
Service Charges · Mortgage · Banking · DXB Estimate

**Research:** Market · DLD Volumes · Price History · Launch Calendar · Handover

**Agency:** My Leads · Pipeline · Listings · Team

**Held back:** Dev Portal, Competitors, Developer Health, Financials, Currency,
Marketing, Compliance, Flip, STR vs LTR, Portfolio, Golden Visa, Risk,
Investment Score, Intelligence, Data Quality, Agency.

Several are close to the bar and will return quickly. Risk and Golden Visa are
the likeliest first additions.

---

## PHASE 1 — STRUCTURE (3–4 sessions)

**1.1 Kill the invented composites.**
`developerMetrics.js` is built and verified against all 1,728 projects. Wire it
into Competitors and Developer Health, replacing `score:94, grade:"A+"` and
`factors:{delivery:20, reputation:9}` with computed figures: project counts,
communities, median PPSF, catalogue share — and four fields **listed as
unavailable** rather than invented.

**1.2 Reorganise the sidebar around agent jobs.**
Six feature-shaped groups become four job-shaped ones:

```
Today          Overview · My Leads · Pipeline · Listings
Find           Projects · Map · Launch Calendar · Handover
Advise         Neighbourhoods · Yields · Service Charges · DXB Estimate
Finance        Mortgage · Banking
Research       Market · DLD Volumes · Price History
Agency         Team
```

**1.3 Apply the canonical taxonomy to every filter.**
`taxonomy.js` is built. Every filter reads it, so no two tabs can disagree about
what a villa is. Options carry counts; combinations returning zero are disabled
rather than showing a blank screen.

---

## PHASE 2 — DATA (4–5 sessions)

**2.1 Fix the geography.** `area` exists on 9% of projects — a filter on 9%
coverage is worse than none. Derive it from community. Resolve the 13 orphan
communities where a project names a community with no record, so the join stops
failing silently.

**2.2 Grind the unsourced claims to zero on v1 tabs.** 97 remain overall;
roughly 20 sit on v1 tabs. Each is either sourced, recomputed, or removed.

**2.3 Every v1 tab shows provenance.** Only five do today. The pattern exists —
`SourceBadge`, `SourceList`, the DLD/EST labels — it needs applying.

**2.4 Render-check every v1 tab.** The Market outage proved a passing build is
not evidence a tab works. Every v1 tab opened in a browser before launch.

---

## PHASE 3 — COMMERCIAL (2–3 sessions)

**3.1 Billing.** Deferred by your decision until the product is right. Connect
the plan step to Stripe checkout, handle the webhook, flip `tier` from
`pro_trial` on payment, handle failure and cancellation. Needs a Stripe account
with UAE payments — yours to create.

**3.2 Agency onboarding.** Registration and seat limits work. Removing an agent
does not yet free a seat. Approval is manual.

**3.3 Landing page.** Written and live. Revisit once the v1 tab list is fixed so
the claims match what ships.

---

## PHASE 4 — OPERATIONS (1–2 sessions)

**4.1 Notifications.** Still dead. `sync-notifications.js` is a manual script
that was never scheduled — it ran on 18–19 May because someone ran it. Wrap in a
GitHub Action, the pattern `cron-eibor.yml` already proves. **Free, ~30 minutes,
and it is the gap you noticed as a user.**

**4.2 Cron failure logging.** Four jobs fail without writing to `cronLogs`,
which is how the DLD cron went 128 days unnoticed.

**4.3 DLD API key.** Free registration at Dubai Pulse. **This is the ceiling on
your data quality**: only 60 of 193 communities have measured prices; the other
133 are area-level estimates. No amount of engineering invents those.

---

## SEQUENCE

| Phase | Sessions | Gate |
|---|---|---|
| 0 — Decisions | your hour | — |
| 1 — Structure | 3–4 | Phase 0 |
| 2 — Data | 4–5 | Phase 1 |
| 4 — Operations | 1–2 | can run in parallel |
| **LAUNCH** | | 18 tabs at 75%+, render-checked |
| 3 — Billing | 2–3 | after launch, per your decision |

**~10–14 working sessions to launch.** Billing follows, because a payment page
for an unfinished product sells nothing.

---

## WHAT WOULD MAKE THIS FAIL

**Trying to ship 34 tabs.** The bar is not negotiable; the tab count is.

**Shipping a number you cannot defend.** One "87% cash" in front of a paying
agent costs more than a missing feature. It was wrong in seven places and each
was found separately — which is why the audit tooling now exists.

**Trusting a green build.** The Market tab was dead in production while the
build, the linter and the scorecard all passed. `check-undefined-refs.js` closes
that specific hole; a browser check closes the rest.

**Adding tabs before the existing ones meet the bar.**

---

## HOW PROGRESS IS MEASURED

```bash
node scripts/tab-scorecard.js        # the bar, per tab
node scripts/audit-claims.js         # unsourced numbers
node scripts/check-undefined-refs.js # what the build cannot see
```

No claim of progress in this project should be made without one of these.
