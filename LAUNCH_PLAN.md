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
SHIPPED — what a paying agent can open
  average score      83%     (was 72% this morning, same instrument)
  at the bar (75%+)  29 of 29 (was 16 of 29)
  below 70%           0
  unsourced claims    0      (was 19)
  self-admitted bad   0

HELD BACK — not sold
  average score      52%
  unsourced claims   68
```

**Every shipped tab meets the bar and carries zero unsourced claims.**

Measured honestly: the instrument was corrected five times during the work — a
re-export barrel was being counted as a tab, three tabs that read Firestore were
scored as hardcoded, RGB colour triplets were being read as figures, filter
labels as claims, and explicitly-declared stress-test assumptions as unsourced
market claims. Each correction was verified by listing exactly what it moved.
Those corrections plus scoping to shipped tabs account for 64% → 72% on the
unchanged morning code. **The 72% → 83% is the work.**

**68 of the 97 unsourced claims sit on the five held-back tabs** — 40 on
Competitors and 27 on Marketing alone. Holding those five removes 70% of the
product's unsourced numbers on day one, and leaves 29 to grind down across the
tabs that actually ship.

That is the whole argument for holding them, in one number.

---

## THE STRATEGIC CHOICE

**Hold back what serves the wrong audience. Group the rest by the job the agent
is doing.**

The first draft of this plan said "ship 18 tabs, hold 16". Re-running the
scorecard killed that: **Golden Visa and Data Quality already score 75%** and
were on the held list, while **Risk and Investment Score sit at 67% with working
in-app buttons pointing at them** — holding them would have broken navigation to
fix nothing.

The draft had conflated two different problems:

- **Quality** — tabs that publish numbers they cannot defend. The scorecard
  measures this, and the answer is to fix them or hold them.
- **Navigation cost** — 34 tabs is a lot to scroll past. This is a *grouping*
  problem, and deleting good tabs does not solve it.

So: hold back the five that are wrong-audience or far below the bar, and
reorganise the remaining 29 by job so an agent's daily eight sit in the top two
groups.

Held is not deleted. A tab returns by removing one line, once it reaches the bar.

---

## PHASE 0 — DECISIONS ✅ SETTLED 2026-07-31

| # | Decision | Outcome |
|---|---|---|
| 0.1 | The four developer tabs | **Held back.** Competitors to be rebuilt later on `developerMetrics.js` as a "who actually delivers here" tool for agents. Dev Portal, Developer Health and Financials stay out. |
| 0.2 | Seat allowance behind AED 500 | **10 agents.** AED 50 per seat against AED 300 individual — a real reason for an agency to sign up as a team. |
| 0.3 | Firestore rules | **Deployed** 2026-07-31. Dry-run shown, rules compiled, `almanacEntries` live. |
| 0.4 | v1 tab list | **29 shipped, 5 held** — see below. |

Deferred by you: the DLD API key, and scheduling the notifications fix.

### v1 — 29 tabs, seven job-shaped groups

```
Today                 Overview · My Leads · Pipeline · Listings
Find a property       Projects · Map · Launch Calendar · Handover
Advise a client       Neighbourhoods · Yields · Service Charges · DXB Estimate · Risk
Model a deal          Investment Score · STR vs LTR · Flip · Portfolio · Golden Visa
Finance the deal      Mortgage · Banking · Currency
Research the market   Market · DLD Volumes · Price History
Run the agency        Team · Agency · Compliance · Data Quality · Intelligence
```

The old grouping put nine tabs under "Investment Tools" and filed Banking under
"Developer Intelligence" — organised the way the product was built, not the way
it is used. An agent does not think "I need an investment tool"; they think "my
client asked whether the service charge kills the yield".

### Held back — 5 tabs, admin-visible only

| Tab | Score | Why |
|---|---|---|
| Financials | 25% | Developer IR reporting. No agent use case, and the lowest score in the product precisely because nobody maintains a tab for an absent audience. |
| Competitors | 42% | 40 unsourced claims and ten invented sub-scores. Returns rebuilt for agents. |
| Marketing | 42% | 27 unsourced claims; a content tool, not market intelligence. |
| Developer Health | 67% | Publishes `score: 94, grade: "A+"` from delivery and reputation figures the product does not hold. |
| Dev Portal | 58% | A submission portal for developers. Nothing to serve until developers are customers. |

An admin still sees all five on the live site under "Not shipped", so work in
progress stays checkable without being sold.

---

## PHASE 1 — STRUCTURE ✅ DONE 2026-07-31

**1.1 One source of truth for navigation.** `src/config/tabs.js`. There were
two copies of the tab structure — one inline in `EmaarDashboardV2.jsx` that the
app rendered, one in `components/TabConfig.js` that nothing imported — and they
had already drifted; the unused copy was missing the Data Quality tab. Both now
come from the config. It stores icon *names* rather than components so it stays
JSX-free and the audit scripts can read it.

**1.2 Sidebar reorganised by job.** Seven groups, above. Held tabs are hidden
from customers and visible to admins.

**1.3 Held tabs made genuinely unreachable.** Removing a tab from the sidebar
does not remove the buttons elsewhere that link to it. Five such links existed;
a "Full Developer Profile" button on the **Projects** tab — a shipped,
agent-facing tab — pointed straight at the invented A+ grade. Fixed at the call
site, with `resolveTab()` as a runtime safety net for saved tabs and `?tab=`
parameters.

**1.4 Two new checkers**, because this class of change fails silently:
`check-nav.js` (invariants + prints the sidebar as customer and admin see it)
and `check-tab-links.js` (no link may point at a held tab). Both verified by
injecting the failures they exist to catch.

*Still open from Phase 1:* wire `developerMetrics.js` into the Competitors
rebuild. Moved after launch — the tab is held, so it no longer blocks.

---

## PHASE 2 — DATA (4–5 sessions)

The scorecard shows where the leverage actually is. Criteria are weighted
sourced(3) honest(3) provenance(2) live(2) consistent(1) empty-state(1) = 12.

**2.1 Provenance and empty states on the 67% tabs.** Eight tabs — Risk,
Investment Score, Service Charges, DXB Estimate, STR vs LTR, Currency,
Intelligence, Developer Health — score 67% with sourced + honest + live already
green. Adding provenance (2) and an empty state (1) takes each to **92%**. This
is the single highest-leverage change left, and the pattern already exists in
`SourceBadge` / `SourceList`.

**2.2 Source the 50% tabs.** Projects, Mortgage, Launch Calendar, My Leads,
Portfolio, Flip all fail on `sourced` — worth 3 points each. 19 unsourced claims
between them.

**2.3 The geography — investigated, and the plan was wrong.** ✅

This said "`area` exists on 9% of projects — a filter on 9% coverage is worse
than none. Derive it from community." Two of those three claims did not survive
contact with the data.

`area` **is not a filter.** It is a display field in the project detail panel,
and it already falls back to `community`, which is populated on 100% of the 1,728
projects. Nothing was broken for the user.

And deriving it would have been the wrong fix. A join on community fills it to
82%, and unambiguous prefix matching reaches 89% — but the values themselves are
three vocabularies wearing one name:

```
official DLD cadastral    Al Thanayah Fourth · Wadi Al Safa 7 · Zaabeel First
marketing regions         New Dubai · Bur Dubai · Deira · Dubailand
plain community names     Dubai Marina · Downtown Dubai · Emaar Beachfront
```

94 distinct values across 241 records. Filling that to 89% would have made a
meaningless field look authoritative across nine projects in ten — the same
mistake as the investment score, arrived at from the opposite direction. A thin
field invites doubt, which is correct here. A full one would not.

**What was actually wrong:** `subCommunity` is populated on **zero** of 1,728
projects and rendered an em-dash on every project detail in the product. It is
now hidden unless it holds a value, and the area label says "Community" when
that is what it is showing.

The real geography work — mapping communities to Dubai's 9 official sectors — is
a data project, not a display fix, and it needs the DLD API key to do properly.

**2.4 Render-check every shipped tab.** The Market outage proved a passing build
is not evidence a tab works. Every shipped tab opened in a browser before launch.

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

| Phase | Status |
|---|---|
| 0 — Decisions | ✅ done |
| 1 — Structure | ✅ done |
| 2.1 — Provenance and empty states | ✅ done — 9 tabs to 92% |
| 2.2 — Sourcing | ✅ done — 0 unsourced on shipped tabs |
| 4 — Operations | ✅ done — nightly sync scheduled, heartbeat, seat leak fixed |
| 2.3 — Geography (`area` at 9%, 13 orphans) | remaining |
| 2.4 — Browser pass with a real login | remaining — needs you |
| **LAUNCH** | after 2.3 and 2.4 |
| 3 — Billing | after launch, per your decision |

**~1–2 sessions to launch.** Billing follows, because a payment page for an
unfinished product sells nothing.

### What is actually left

1. **The geography fix.** `area` exists on 9% of projects and 13 communities are
   orphans. A filter on 9% coverage is worse than none.
2. **A browser pass while logged in.** Every shipped tab now transforms cleanly
   through Vite and the production build is green, but neither proves a tab
   renders with real data behind a real login. That check is yours.
3. **Run the DLD sync once by hand** from the GitHub Actions tab. It has not
   called the DLD API since May and should be watched the first time.

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
node scripts/check-undefined-refs.js # constants the build cannot see
node scripts/check-nav.js            # the sidebar a customer actually gets
node scripts/check-tab-links.js      # no link points at a tab that is held
```

No claim of progress in this project should be made without one of these.

Each checker was verified by injecting the failure it exists to catch. A green
checker that has never been shown to go red is not evidence of anything — that
is the whole lesson of the Market tab, where the build, the linter and the
scorecard were all green while the tab was dead in production.
