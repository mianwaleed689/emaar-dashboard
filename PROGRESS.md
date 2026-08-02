# DXB ANALYTICS — WHERE WE STARTED, WHERE WE ARE, WHAT IS LEFT

*Written 2 August 2026. Every number here was measured, not recalled — the
commands are named so you can re-run them.*

Standard the work is held to: [TAB_STANDARD.md](TAB_STANDARD.md) ·
Plain-language bar: [TAB_CLARITY.md](TAB_CLARITY.md) ·
Open blockers: [LAUNCH_READINESS.md](LAUNCH_READINESS.md)

---

## THE SHORT VERSION

**44 commits across two working days — 33 on 31 July, 11 on 2 August.** The product went from one that
displayed confident numbers nobody had checked, to one where every figure on a
rebuilt screen states where it came from and how many transactions sit behind
it.

It is **not ready to launch.** It cannot take a payment, 20 of 34 tabs have not
been through this pass, and there are no automated tests. Those are stated in
full below rather than buried.

---

## WHERE WE STARTED — 31 JULY

The brief, in the owner's words: *"a webpage or website should not carry wrong
information. No one is paying for a wrong webpage or site."*

What an audit of the running app actually found:

| What the screen said | What was true |
|---|---|
| 193 communities with prices and yields | **15 distinct yield values** across all 193; 43% shared one of two numbers |
| Dubai Harbour, Dubai Marina, Emaar Beachfront | all exactly **6.5%** — the same assigned figure |
| Community price per square foot | out by a **median of 15.8%** against Land Department records |
| Dubai Investment Park First: AED 268/sqft | measured: **AED 1,193** — no Dubai community has traded at 268 |
| "Live EIBOR" on the Mortgage tab | a **February rate**, hardcoded into the JSX |
| A 0–100 investment score, the default sort | `base 60, +15 if yield>7, +5 if branded` — invented weights |
| "AI-powered property scoring" on the paywall | a chain of hand-written `if` thresholds. No model anywhere |

Alongside those: 92 characters that rendered as garbage in the mobile nav,
notifications and the WhatsApp templates agents send to clients; 17 buttons that
rendered as invisible clickable areas, one of them a **delete-row button in the
admin panel**; and a map that was a black rectangle with coloured dots on it.

---

## WHAT WAS DONE

### 1. The numbers now come from somewhere

`src/utils/measuredCommunity.js` folds counted Land Department figures over the
stored records. **93 of 193** communities get a measured price, **72** a measured
return, drawn from **1,242 DLD entities**. The other 99 keep their stored value
and are labelled an estimate — with the colour scale switched off, so a made-up
6.5% no longer renders green like a measured one.

Automatic name-matching was tried and **rejected**: it bought 15 extra matches
and produced `Sobha Hartland 2 → SOBHA HARTLAND` and `Al Barsha 1/2/3 → one
figure`, which is the exact defect being removed. The alias table is written by
hand, every entry carries its reason, and six ambiguous names are documented as
deliberately *not* aliased. A missing figure is honest; a confidently wrong one
is not.

### 2. The crons were lying, not dead

EIBOR had not moved since February. It turned out the job **fired every weekday
and returned 200** — while every source failed and it wrote a hardcoded March
rate stamped with **today's date**. The Mortgage tab's own staleness check aged
the write time, which the cron refreshed daily, so it computed an age of zero
and never once reported stale.

What that cost: the app quoted the 3-month rate at 3.6387% when it was 3.9399%.
On an AED 2M purchase at 80% over 25 years, agents were understating a client's
monthly payment by **AED 285 — AED 85,460 across the term.**

`cron-sync-market` had **zero `console` statements in 184 lines** — it could not
report anything, ever. Given logging and run, it said: *"NOT ONE live price —
all 49 communities fell back to hardcoded benchmarks."* Nothing reads its output
either; the listener feeding it was removed.

### 3. Invented scoring removed

Three different 0–100 scales existed, none reconciled with the others. The
Neighbourhoods "Score Breakdown" panel summed to a maximum of **62** while the
badge above it went to 100 — it had never explained the number it sat beneath.
`utils/scoring.js` already recorded that ranked buy-signals were stripped once
because unlicensed investment advice violates UAE RERA law. Two tabs missed it.
Removed from Neighbourhoods and the Map; the Investment Score **tab** still
ships and is B-15 below.

### 4. The Map, rebuilt against research rather than taste

Rejected twice, correctly. What the portals actually do: Zillow put the price on
the pin, Redfin tuned pin contrast for scanning, clusters break apart on zoom,
the map fills the frame.

That one change removed the ugly legend as a side effect — five colour bands
spelled across the page existed **only** because a coloured dot cannot state its
own value. Pins now read `AED 1,939`. Also fixed: a black basemap, Arabic labels
at street zoom, 12px project dots you could not click, popups whose titles were
white text on a white bubble, and **120px of dead padding on all 34 tabs**.

Worth recording from that research: the market's own comparisons say
price-per-sqft on Property Finder and Bayut is computed from **asking** prices
and biased upward, and point to DXBinteract for figures from closed DLD
transactions. This product computes from closed DLD transactions — the accuracy
argument was already won on data and was being lost on presentation.

---

## WHERE WE ARE — MEASURED TODAY

| | Count | How to check |
|---|---|---|
| Tabs in the codebase | **34** | `ls src/tabs/*.jsx \| wc -l` |
| Tabs with a plain-English intro and stated sources | **14** | `grep -l "<TabIntro" src/tabs/*.jsx \| wc -l` |
| Tabs opened and verified rendering | **16** | `checktabs.mjs` |
| Mojibake sequences in `src/` and `api/` | **0** | `python scripts/dld/fix_mojibake.py src api` |
| Glyphs rendering as garbage | **0** (was 92) | `scripts/dld/fix_lost_glyphs.py` |
| Communities with a measured price | **93 of 193** | `measuredCommunity.js` |
| Swallowed error handlers | **83** | `grep -rc "swallowed@" src/` |
| Automated tests | **0** | `find . -name "*.test.*"` |
| Can the product take a payment? | **No** | no `STRIPE_*` in the Vercel environment |

Six documents now hold the standards and the findings, ~1,000 lines total,
including the two corrections I had to make to my own earlier claims.

---

## WHAT IS LEFT

### Three decisions only the owner can make

- **B-15** — the Investment Score tab still ships a ranked buy-signal. My
  recommendation: keep the figures, drop the single ranked number.
- **B-16** — live EIBOR needs Cloudflare Browser Rendering (~$5/month), because
  the block is on the TLS fingerprint and even the browser's own cookies do not
  get a plain request through. The alternative is a quarterly manual refresh,
  which is now safe because the screen states the rate's date.
- **B-17** — `cron-sync-market` burns API quota and ~200 Firestore writes a day
  producing constants nothing displays. I would turn it off.

### The launch gate

**Payment.** Backups first — never wire billing to a database you cannot
restore. Then the seat-release bug (`config/pricing.js:71` — removing an agent
does not free their seat, so a ten-seat agency hits the wall at nine). Then
Stripe keys, products, and one real card charged end to end.

### The honest remainder

**20 tabs have not been through this pass.** They may be fine; nobody has
checked them the way the 14 were checked. **Zero tests** means every fix so far
was verified by a human looking at it, and nothing stops the next change undoing
one. **83 swallowed handlers** are failures that will be invisible — exactly the
shape the EIBOR cron had.

---

## WHERE THIS GETS TO

The product's position is now defensible in a way it was not on 31 July: it
computes from registered Land Department transactions, and on the rebuilt
screens it says so, names the number of sales, and marks what it has not
measured. The competitors' figures come from asking prices. That is a real
argument to sell on.

Reaching launch is roughly a week of focused work — payment wired and tested,
backups on, and the remaining 20 tabs held to the same bar as these 14. The tab
by tab method is working and should continue: **use the tab for a real job,
write down every point of confusion, fix those, then verify at the window size
the customer actually uses.**

Every fault in this document was found that way. None of them would have been
caught by checking that the page rendered.
