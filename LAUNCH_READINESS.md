# DXB ANALYTICS — LAUNCH READINESS

**Assessed:** 2026-08-02 · Verified against the running app and the codebase,
not against documentation.

> **The single most important finding:** you cannot currently be paid.
> There is no Stripe webhook. If you set your Stripe keys today, a customer
> would complete checkout, be charged, and their account would stay on Free —
> because nothing in this codebase listens for `checkout.session.completed` or
> upgrades a user's tier after payment.

---

## VERDICT

| | |
|---|---|
| Can take card payment today | **No** — `STRIPE_SECRET_KEY` unset; checkout falls back to WhatsApp |
| Can fulfil a payment if keys were set | **No** — no webhook, no tier activation |
| Safe to charge for the advertised product | **Nearly** — 29 tabs ship and are honestly labelled; the plan copy overstates the count and community data is 33 days stale |
| Safe from data loss | **No** — no managed backups (Blaze not enabled) |

**Launch is blocked on 4 items.** None is huge on its own. Together they are
roughly **2–3 weeks** of focused work.

---

## 🔴 BLOCKERS — cannot launch until these are done

### B1. No Stripe webhook — customers pay and get nothing
**Evidence:** no `checkout.session.completed` handler anywhere in `api/`,
`functions/` or `src/`. The only code that sets `tier: "pro"` is mock data in
`AdminPanel.jsx`. `api/create-checkout.js` creates the session and nothing
records the outcome.
**Effect:** money leaves the customer, access never arrives. This is a refund
and chargeback generator, and a consumer-protection problem.
**Fix:** add `api/stripe-webhook.js`, verify the signature, set
`users/{uid}.tier` + `subscriptionExpiry` on `checkout.session.completed`,
`invoice.paid` and `customer.subscription.deleted`.
**Effort:** 1 day, plus Stripe dashboard configuration.

### B2. Stripe not configured, and the price IDs are stale
**Evidence:** `.env` and `.env.local` contain no `STRIPE_*` keys.
`api/create-checkout.js:21-22` documents the plans as *"AED 299/month"* and
*"AED 799/month"* — the pre-July prices. `config/pricing.js` says **300** and
**500**. The plan keys are `Pro`/`Enterprise` while the config uses
`pro`/`enterprise`, so a case mismatch will 400 the request.
**Effort:** half a day once the Stripe products exist.

### B3. Agency seats never free up
**Evidence:** `config/pricing.js:71` — *"removing an agent does not yet free
their seat. That has to be fixed before billing goes live, or a ten-seat agency
hits the limit at nine."* Written by you, still open.
**Effect:** every agency customer hits a wall they paid to avoid.
**Effort:** half a day.

### ~~B4 / B5~~ — WITHDRAWN, I was working from a stale document

**Corrected 2026-08-02 after visiting all 34 tabs in the running app.**

These two blockers were taken from `TAB_AUDIT.md`, dated 2026-07-29. That
document is four days old and the product has moved. Verified live:

| What I claimed | What is actually true |
|---|---|
| 9 tabs show frozen numbers as live | **5 are already hidden** in a sidebar group labelled `NOT SHIPPED (ADMIN ONLY)` — Competitors, Developer Health, Financials, Dev Portal, Marketing |
| Service Charges is empty | **Real** — "193 of 193 communities have a filed rate · average AED 14/sqft/yr · Source: RERA Mollak" |
| Handover is empty | **Real** — 1,193 projects with handover dates, 355,408 units |
| STR vs LTR is empty | **Real, and honestly labelled** — "The long-let side is measured. The short-let side is a projection." |
| Pipeline / Agency are broken | **Permission-gated empty states**, worded correctly |
| Listings / Team are broken | **Real UI, genuinely zero records** — a new account, not a fault |

**29 tabs ship, 5 are hidden.** The sidebar is grouped by the agent's actual
workflow — Today · Find a property · Advise a client · Model a deal · Finance
the deal · Research the market · Run the agency — which is better information
architecture than most products of this size have.

The Overview tab opens with:

> *"Every figure below is either computed from the transaction data this
> platform holds, or carries the source."*
> *"COMMUNITY DATA — 2026-06-29 (33 days ago). Prices and yields below are from
> this date, not today. Confirm before quoting a client."*

That is the standard this whole exercise has been arguing for, already shipped.

**What remains from B4/B5, genuinely:**

- **B4a — community data is 33 days stale.** The in-app warning is correct and
  well done, but a research product quoting June prices in August is a
  commercial problem regardless of how honestly it is labelled. The
  `cron-sync-market` job needs checking — it may not be firing. *(Effort: half
  a day to diagnose.)*
- **B4b — `PLAN_FEATURES.pro` sells "All 34 research tabs"** while 5 are hidden
  from customers. Should read 29. *(Effort: 5 minutes.)*

## 🟠 HIGH — fix before or immediately after launch

| # | Issue | Evidence | Effort |
|---|---|---|---|
| H1 | Revenue reporting computes at the wrong price | `BillingTab.jsx` 99/499, `SharedUI.jsx` 99/499, `PlatformLeadsTab.jsx` 299 — config says 300/500 | 2h |
| H2 | Firestore free tier, 50k reads/day | The plan records the site going down once already | 1–2d |
| H3 | 87 empty `catch {}` blocks | 42 in AdminPanel, 21 in the dashboard — a broken action looks like an inert button | 2d |
| H4 | Split-brain admin | AdminPanel writes project edits to `projectData`, which does not exist — across 13 paths, **3 of them deletes** | 2d, needs backups first |
| H5 | 19 of 64 user-facing filters dead or unproven | `FILTER_AUDIT.md` | 3d |
| H6 | Zero automated tests | No runnable test script; `test` points at react-scripts inside a Vite project | 2d |
| H7 | 138 ambiguous corrupted characters | Same sequence maps to `✕`, `•`, `±`, `⏳`, `─` by context | 1d |

---

## 🟡 MEDIUM

- **Dead duplicate components.** `components/LoginScreen.jsx` (377 lines) and
  `components/GlobalContextFilter.jsx` (115 lines) are exported and never
  imported. Editing them achieves nothing. Third instance of this pattern.
- **The landing page is not translated.** Zero translation calls, while the
  product advertises 20 languages.
- **`AdminPanel.jsx` is 22,364 lines.** One file, one commit at a time.

---

## ✅ ALREADY FIXED IN THIS PASS

- Login required two clicks — `?auth=` was never read. One click now.
- Login screen rendered `â†' Â â†' Back to Home` and `🔒`. Clean.
- In-app upgrade quoted **AED 99** while config said **300**, in 6 places.
- 57 literal unicode escapes and 134 mojibake sequences decoded.
- Landing page: false counts (208 → 1,552), wrong market total (919 → 917B),
  three fabricated testimonials removed, false competitor claims corrected.
- Projects tab: 133 projects silently relabelled "Apartment" now say
  "Type not specified"; the category filter actually filters; the yield tile
  no longer claims figures were "disclosed".

---

## SEQUENCE

**Revised 2026-08-02 at the owner's direction: payment work moves to the end.**
The webhook (B1) and the missing `stripe` package are already fixed and waiting
on credentials, so nothing is lost by deferring — but note that until B1's
environment variables are set, **the product cannot take money at all.** Every
day of product work is a day of no revenue, which is a deliberate choice here,
not an oversight.

**Phase 1 — finish the product** *(the current mission)*
B4a stale community data · B4b the plan copy · H7 the remaining corrupted
characters · H5 the dead filters. The tabs are in far better shape than the
old audit suggested, so this is a finishing pass against the seven checks in
[TAB_STANDARD.md](TAB_STANDARD.md), not a rebuild.

**Phase 2 — make it hold up**
H5 filters, H3 error handling, H7 the ambiguous characters, H6 tests on the
yield and pricing calculations.

**Phase 3 — protect it**
B6 backups (Blaze), then H4 the admin split-brain — which includes three delete
paths pointing at a collection that does not exist, and must not be touched
before backups exist.

**Phase 4 — get paid**
B1 environment variables → B2 Stripe products → B3 seat release → H1 admin
price alignment → end-to-end test.

**Launch gate:** a real card charged on a real account that lands on the correct
tier, with a receipt, and a downgrade that works.

---

## B-15 — FIVE INVENTED SCORING SYSTEMS, TWO SOLD AS "AI"
*Raised 2026-08-02 during the Neighbourhoods rebuild. Widened 2026-08-03 when
the My Leads rebuild found two more. Needs an owner decision on the last one.*

The app scores communities, projects, leads and **the agency's own staff** on a
0–100 or 0–10 scale in five different places, using five different sets of
weights that were chosen by hand and never reconciled with each other.

| Where | Weights | Status |
|---|---|---|
| `AdminPanel.jsx` `investmentScore` | base 60, +15 yield>7, +10 construction>80, +5 branded, +10 near Downtown | **removed from Neighbourhoods and the Map** |
| `NeighbourhoodsTab` drawer breakdown | Yield /20, Metro /12, PPSF /8, Waterfront /8, Amenities /9, Golden Visa /5 | **removed** — its parts summed to 62 while the badge it "explained" went to 100 |
| `MyLeadsTab.jsx` `aiScore()` — labelled **"AI LEAD SCORE"** on screen | phone+email 25, budget>5M 20, under a day old 20, "Immediate" 15, three notes 10, **nationality recorded 5** | **removed 2026-08-03** — replaced by a printed call-order rule |
| `MyLeadsTab.jsx` agent leaderboard `combined` | (closed × 10) + (conversion × 2) + (pipeline in millions × 0.5), capped at 50M | **removed 2026-08-03** — ranked the agency's own people on invented weights |
| `InvestmentScoreTab.jsx` + `getInvestmentScore()` | Yield 0–3, Value 0–2, Handover 0–2, … | **still shipping** |

### The two found in My Leads (2026-08-03)

`aiScore()` was the worse of the pair. It was named for a model that does not
exist, rendered under the heading **"AI LEAD SCORE"**, and its 70-point line
decided the "Hot" counter, the "Hot" view, a sort option and the leaderboard's
hot column. Two specific faults made it actively misleading:

- **It paid five points for a recorded nationality.** Two otherwise identical
  leads scored 80 and 75 depending only on whether somebody had filled in an
  ethnicity field. A Hot/Warm/Cold label must not move on that.
- **It decayed on the calendar alone.** The same buyer, unchanged, fell from
  60 to 40 — Hot to Warm — in eight days. An agent who watches a serious client
  fade while nothing about that client has changed learns to ignore the label,
  which is the opposite of what a priority signal is for.

It is replaced by a rule printed on the tab, in the order a desk is actually
worked: came in today and nobody called, then a promised follow-up that is due,
then never contacted, then silent over a week. Every lead carries its reason in
words on its own row. No number, so nothing to argue with.

The leaderboard's `combined` handed an owner a ranking of their own staff built
from five invented constants — nothing in the business decided a closed deal is
worth five points of conversion rate. Ranking is now by deals closed, then by
the share of their leads that closed, and the Score column is gone. The
conversion colour also compared each agent against a hard-coded 10%/5% pair;
1–3% is normal for Dubai portal leads, so it painted competent agents red. It
now compares each agent against that agency's own average.

### What is already fixed

The first two are gone. Neighbourhoods and the Map no longer show a score,
no longer sort by one, and no longer crown a "Top Rated" community with one.

The paywall copy sold the third as **"AI-powered property scoring"** in three
files. There is no model, no inference and no API call anywhere near it — it is
a chain of hand-written `if` thresholds. That claim was used to persuade people
to pay, so it has been corrected in all three files to describe what the feature
actually does.

### What still needs your decision

**The Investment Score tab itself still ships.** It is a sellable feature, so
removing it is a commercial call rather than a bug fix, and it is yours to make.
Two things weigh on it:

1. `utils/scoring.js` states in its own header that investment scoring carrying
   Strong Buy / Buy / Hold / Caution labels **was removed because unlicensed
   investment advice violates UAE RERA law.** A ranked 0–10 buy signal with
   "Top picks by budget" is the same product wearing a different label, and the
   customers are licensed Dubai agents who carry that risk with their client.
2. `EmaarDashboardV2.jsx:3288` already records the decision — *"investmentScore
   / velocityScore / developerScore removed — they were arbitrary opinions, not
   data"*. That conclusion was reached twice before and never reached this tab.

**Recommendation:** keep the underlying figures, drop the single ranked number
and the "top picks" framing. Show yield, price per square foot and handover
timing side by side and let the agent weigh them — which is the judgement they
are licensed and paid to make. That keeps the feature saleable without the
platform issuing a buy signal it is not licensed to issue.

I have not touched the tab pending your answer.

---

## B-16 — THE CRON WAS NEVER DEAD. IT WAS LYING.
*Diagnosed against the live Vercel project on 2026-08-02. Root cause found; most of it fixed.*

**Every suspect in the first draft of this entry was wrong.** It blamed the Hobby
tier's cron limits, the non-daily `0 7 * * 1-5` schedule, and the query string in
`/api/cron?job=eibor`. The dashboard disproves all three: Cron Jobs is
**Enabled**, all ten jobs are **registered**, the weekday schedule was
**accepted**, and the request log shows `User Agent: vercel-cron/1.0` with
`Search Params: job=eibor` arriving intact.

The cron has been firing on schedule and returning **200** the entire time.

### What it was actually doing

Triggering it by hand from the dashboard produced this:

    [S9 EIBOR] triggered — 02/08/2026, 7:05:33 AM
    [S9] All sources failed — using hardcoded fallback
    [S9 EIBOR] Firestore updated — source: Hardcoded fallback (CBUAE Mar 2026) ✅

Four faults, stacked:

**1. Source 1 called `res.json()` on an HTML endpoint.** `GetEiborData` is the
AJAX partial the CBUAE page loads, and it serves HTML. `res.json()` threw on the
first character, straight into a bare `catch {}`. Fetched by hand on 2026-08-02
that same endpoint returned the full rate table dated **31 July 2026** — the live
data had been sitting there all along. *Fixed: `parseEiborTable()` reads it.*

**2. Source 2 scrapes the page source 1 exists to populate.** The file's own
header says the site "is JS-rendered — server fetch gets empty HTML", and then
source 2 scrapes that page anyway.

**3. Source 3, investing.com, now returns 404.**

**4. The fallback stamped today's date on a March rate.** This is the one that
mattered:

    asOf: now.toLocaleDateString(...)   // today — even for a March rate

The Mortgage tab reads that document, so a five-month-old number arrived
labelled "2 Aug 2026". Worse, the tab's own staleness check aged `updatedAt`,
which the cron rewrites on every run, so it computed an age of zero and never
once reported stale. *Both fixed: `asOf` now carries the rate's own date,
`FALLBACK_DATE` travels with the hardcoded block, a fallback logs
`console.error` instead of a tick, and the tab ages the rate rather than the
write.*

### The part that is NOT fixed

**CBUAE now sits behind Cloudflare.** Every request from this machine's Node
returns 403 with "Just a moment...", including one sending the exact
`curl/8.0.1` user agent that had succeeded minutes earlier — so it is TLS
fingerprinting, not headers. Fetching the same endpoint from inside a real
Chrome returns 200 and the full table.

**What is NOT known: whether Vercel's own egress is challenged.** It is tempting
to read "All sources failed" in the production log as proof that it is, but that
log cannot say so — the old code called `res.json()` on an HTML body, which
throws on a 200 exactly as it does on a 403. Every run failed identically
regardless of what CBUAE returned. The block is confirmed from this machine and
assumed nowhere else.

That is settled by deploying the parser fix and reading one log line. If Vercel
is not challenged, the fix is complete on its own. If it is, the log will now say
`Source 1 403` explicitly instead of failing silently.

### Settled by experiment, 2026-08-02

**Deployed and read the log.** Vercel's egress IS challenged:

    [S9] Source 1 403 from https://www.centralbank.ae/umbraco/Surface/Eibor/GetEiborData

**Then tested what the block actually keys on.** A real Chrome was used to load
the CBUAE page and collect its cookies — thirteen of them, including
`cf_clearance` and `__cf_bm`. Those exact cookies were then replayed from a
plain Node fetch with the browser's own User-Agent, Accept, Accept-Language and
Referer:

    without the cookie jar      403  challenged
    WITH the browser's cookies  403  challenged

**So the block is on the TLS/client fingerprint, not the cookie.** That rules
out a plain Cloudflare Worker: a Worker is not a browser either and would be
challenged identically. It also rules out any cookie-refreshing scheme.

Only a real browser gets through. The remaining options are:

1. **Cloudflare Browser Rendering** — real headless Chrome on Cloudflare's edge,
   which is the one approach known to work here, since a real Chrome returns 200
   and the full table. Needs the Workers Paid plan, about $5/month. This is the
   only route to a genuinely automated daily rate.
2. **Manual quarterly update.** Free, and now safe: refresh `FALLBACK` and
   `FALLBACK_DATE` together in `api/_cron/cron-eibor.js`, and the Mortgage tab
   will state the date and warn that it is not a live feed. It says so today.
3. **A different source, accepting it is not the Central Bank.** Every UAE
   government domain sits behind the same Cloudflare — `centralbank.ae`, the
   open data portal, `opendata.fcsc.gov.ae`, all 403. TradingEconomics responds
   but publishes only the 3-month rate behind a data plan, and global-rates 404s.
   The product attributes this figure to the Central Bank, so switching source
   means changing that attribution too.

**Recommendation:** option 1 if EIBOR accuracy is worth $5/month — and given a
stale rate understated a client's monthly payment by AED 285, it likely is.
Otherwise option 2, which is honest and costs nothing but a calendar reminder.

What is genuinely fixed is the dangerous half. The product can no longer present
a stale rate as a live one. A wrong rate shown as wrong is a caveat an agent can
work with; a wrong rate shown as live is the exact failure this product exists
to prevent.

### Worth checking on the other nine

The same fallback-and-tick pattern may exist in the other cron handlers —
`cron-sync-market` stopped logging on 18 May and is the obvious next one to
trigger by hand and read the logs for.

---

## B-17 — cron-sync-market WRITES DATA NOTHING READS
*Found 2026-08-02 while chasing why it "stopped logging on 18 May".*

It never stopped logging. **It never logged.** 184 lines, zero `console`
statements, so a run produced a 200 and nothing else. Adding logging and
triggering it gave the answer immediately:

    [sync-market] NOT ONE live price — all 49 communities fell back to
    hardcoded benchmarks. The dashboard is showing constants, not the market.

### Two separate problems

**1. The Bayut source is not returning anything.** `BAYUT_RAPIDAPI_KEY` is set
in Vercel — that was checked, not assumed. But the host answers **429 "Too many
requests"**, which is RapidAPI's over-quota response. The likely cause is
arithmetic: 49 communities × 4 runs a day is roughly 6,000 calls a month,
comfortably past a typical free RapidAPI tier. Worth confirming on the RapidAPI
dashboard under the `unofficial-bayut-api` subscription.

Also worth weighing: this is an *unofficial* scraper of Bayut **asking** prices.
The product's own position is that portal asking prices run 5–8% above
registered transactions, and the Neighbourhoods and Map tabs now use measured
Land Department figures instead. So the data this job fetches is weaker than
what the platform already holds.

**2. Nothing reads the result.** The job writes about 50 Firestore documents per
run. The app subscribed to `liveMarketData/latest` and fed it into
`liveBayutData` and `lastDataSync` — and a search of the entire repository found
**neither state read anywhere**. The listener has been removed, which saves a
Firestore read on every session; on a free tier that has already been exhausted
once, that is not nothing.

`liveMarketData` — the array used by the Market and Overview tabs — is a
different thing entirely, populated from `tabData`, and is untouched.

### Recommendation

**Turn the cron off.** As it stands it burns RapidAPI quota and roughly 200
Firestore writes a day to produce hardcoded constants that nothing displays.
Removing its entry from `vercel.json` costs nothing and is reversible in one
line.

If live asking prices are wanted later, the honest version fetches them, labels
them as asking prices rather than transactions, and is actually rendered
somewhere. All three are missing today.

I have not edited `vercel.json` — turning off a scheduled job is a call for the
owner, and the logging now in place means the next run will say plainly what it
did either way.

---

## B-18 — WHAT CAN AND CANNOT BE PULLED FROM DLD FOR FREE
*Investigated 2026-08-03 against the live Land Department gateway.*

The Land Department runs a JSON gateway that needs **no key and no account**:

    POST https://gateway.dubailand.gov.ae/open-data/carea-lookup     -> 200
    POST https://gateway.dubailand.gov.ae/open-data/projects-lookup  -> 200

Both answered a plain `curl` with an empty body and returned real data — every
Dubai area, every registered project. Those two can be pulled on a schedule for
nothing.

**Transactions cannot.** `transaction-lookup` and its siblings exist — they
answer `420 INVALID_REQUEST` rather than 404 — but every payload shape was
rejected, and their own page reports **"Invalid captcha"** when the form is
submitted programmatically. Their script confirms why:

    if (AppInfo.featureGate.captchaEnabled && verifyCache) {
      var proxyUrl = '/umbraco/surface/CaptchaProxy/CallThenPost';
      ...
    }

Transaction queries are routed through a reCAPTCHA proxy. The two lookups above
are not, which is why they answer freely.

### What this means

| Data | Free daily pull? |
|---|---|
| Areas | **yes** |
| Projects, launches | **yes** |
| Transactions | **no — captcha** |
| Rent contracts | **no — same gate** |

### Recommendation

Keep the manual export for transactions. It takes a few minutes, the file is
authoritative, and the one on disk (`transactions_2026-07-30`, 537 MB, 878,578
rows) was three days old when this was written — fresher than anything the app
was displaying, which showed community figures from 29 June.

Wire the two free lookups into the existing `dld-daily` cron so new projects and
areas appear without anyone doing anything. That covers the "upcoming" half of
the live-market picture at no cost.

Solving the captcha automatically would need Cloudflare Browser Rendering, the
same paid route as B-16 — one subscription would serve both if it is ever worth
it.
