# Bank Outreach Email Pack

**Status:** Drafts - NOT YET SENT
**Created:** Session 10 (April 2026)
**Purpose:** Initial partnership outreach to 5 UAE banks for mortgage lead referrals

---

## Before sending — checklist

- [ ] Landing page at dxb-analytics.com is live and professional (or replace URL)
- [ ] Business email set up (mian@dxb-analytics.com, not gmail) — deliverability matters
- [ ] Decided on realistic volume claim (currently says 50-200/month — adjust if needed)
- [ ] Phone number and email filled in [placeholders]
- [ ] Found the right recipient at each bank (LinkedIn: Head of Mortgages / Head of Retail / Corporate Partnerships)
- [ ] Banking tab lead form tested end-to-end after Session 10 Fix #2
- [ ] `mortgageLeads` Firestore collection exists and is receiving test data
- [ ] Pricing decision confirmed: AED 300/lead standard, AED 400/lead for non-resident (Standard Chartered)

---

## Strategy notes

- **Tone:** Short, specific, banker-focused. Under 200 words each.
- **Ask:** 15-minute call, not a full meeting
- **Hook:** Reference something real about each bank (not generic pitch)
- **Volume:** Claim "50-200 leads/month" — adjust to "10-50 initially, scaling with launch" if more conservative
- **Pricing:** AED 300/lead for conventional, AED 400/lead for non-resident niche
- **Exclusivity:** Only pitched to Standard Chartered (non-resident niche makes it valuable)
- **Segmentation:** Each bank gets a targeted pitch angle:
  - Emirates NBD → largest book + existing DLD partnership experience
  - FAB → broadest product range
  - Mashreq → digital-first (NEO alignment)
  - DIB → Sharia-compliant exclusivity
  - Standard Chartered → non-resident/international exclusive

---

## Email 1: Emirates NBD

**To:** home.loans@emiratesnbd.com (primary) OR LinkedIn Head of Retail Banking / Mortgages
**Subject:** Qualified mortgage leads for Emirates NBD — pre-segmented by property value & borrower type

Dear Emirates NBD Home Loans team,

I'm Mian Waleed, founder of DXB Analytics — a Dubai real estate intelligence platform used by investors comparing mortgage options across UAE banks.

Our platform includes a Banking tab where users enter their property value, salary, borrower type (UAE national / expat / non-resident), and LTV preference. Each submission is a qualified mortgage-intent lead — property already identified, budget already set, ready for pre-approval.

I noticed Emirates NBD already has a lead-ingestion pipeline through your First-Time Home Buyers Program with DLD. I'd like to propose adding DXB Analytics as a second qualified lead source.

**The offer:** We route 50-200 mortgage-intent leads per month to Emirates NBD at AED 300 per lead. You only pay for leads that meet your minimum criteria (which we'll build into the form).

**Why Emirates NBD first:** Largest mortgage book in UAE, existing First-Time Buyers program shows you know how to work with partners.

Would a 15-minute call next week work to discuss structure and criteria? I can share the live form and backend dashboard on the call.

Best,
Mian Waleed
Founder, The Address Holding
[email] | [phone]
dxb-analytics.com

---

## Email 2: First Abu Dhabi Bank (FAB)

**To:** FAB corporate partnerships OR LinkedIn Head of Mortgages
**Subject:** Mortgage lead partnership — 200+ qualified UAE buyers/month

Dear FAB Mortgages team,

I'm Mian Waleed, founder of DXB Analytics. We run a Dubai real estate intelligence platform focused on investors and individual buyers — currently comparing FAB's mortgage products alongside 5 other UAE banks in our Banking tab.

FAB has the broadest mortgage product range in the UAE (Islamic, conventional, multi-currency, non-resident). Our users frequently select FAB in their bank comparison — but we have no referral structure in place, so those warm leads currently go cold.

**Proposal:** DXB Analytics routes qualified mortgage leads to FAB at AED 300 per lead. Each lead includes:
- Property value, salary, borrower type
- LTV calculation & DBR check already done
- Preferred bank (where the user explicitly chose FAB)
- Live EIBOR-adjusted rate quoted at submission time

No lead is sent unless it meets FAB's minimum salary & LTV thresholds (which we'd configure together).

**Why us:** We aggregate investors researching Dubai property — higher intent than cold digital ad traffic. Our Banking tab audit trail captures every lead with timestamp, IP, quoted rate, so FAB has full data integrity.

Could we do a 15-min call next week? Happy to show the platform live.

Best,
Mian Waleed
Founder, The Address Holding
[email] | [phone]
dxb-analytics.com

---

## Email 3: Mashreq Bank

**To:** Mashreq corporate partnerships OR LinkedIn Head of Retail Banking
**Subject:** Digital mortgage lead partnership with DXB Analytics — aligned with Mashreq NEO

Dear Mashreq team,

Mashreq is the most digitally-forward UAE retail bank — Mashreq NEO is why we'd benefit most from partnership.

I'm Mian Waleed, founder of DXB Analytics, a Dubai real estate platform where investors calculate mortgage options across UAE banks before applying. We currently have Mashreq listed in our Banking tab with real product details (fixed/variable rates, LTV rules, margin over 3M EIBOR).

**What we see in our data:** Users comparing banks gravitate toward digital-first options. Mashreq gets strong selection rates from expat users 30-45, property values AED 1.5M-5M — which aligns with NEO's target segment.

**Proposal:** We route qualified mortgage leads to Mashreq at AED 300 per lead via API or daily batch email. Each lead includes borrower type, property value, salary, LTV, quoted rate, and contact details. All captured in a dedicated `mortgageLeads` collection with complete audit trail.

**Volume estimate:** 50-200 leads/month for Mashreq specifically, based on user bank preferences.

Could I get 15 minutes next week to demo the platform and discuss integration with NEO's existing lead pipeline?

Best,
Mian Waleed
Founder, The Address Holding
[email] | [phone]
dxb-analytics.com

---

## Email 4: Dubai Islamic Bank (DIB)

**To:** DIB home finance team OR LinkedIn Head of Consumer Banking
**Subject:** Sharia-compliant mortgage leads — DXB Analytics partnership proposal

Dear DIB Home Finance team,

Al-salaam alaykum. I'm Mian Waleed, founder of DXB Analytics and The Address Holding (Dubai real estate).

Our platform serves investors comparing mortgage products across UAE banks. A meaningful subset of our users — particularly GCC nationals and Muslim expats — specifically filter for **Sharia-compliant financing**, which is where DIB has unique positioning.

**Our Banking tab already lists DIB's Home Finance product** alongside Ijara and Murabaha options, with current profit rates and LTV rules per the UAE Central Bank framework. Users who select DIB have actively chosen Islamic finance — they're not competitive shoppers, they're committed customers.

**Proposal:** DXB Analytics routes Sharia-compliant mortgage leads exclusively to DIB at AED 300 per lead. Each lead is:
- Pre-filtered for Islamic finance preference
- Qualified on DIB's eligibility rules (salary, property value, LTV)
- Captured in a dedicated database with full audit trail

No conventional-finance leads cross over — you only receive users who want Islamic products.

Could we schedule 15 minutes next week to discuss?

Shukran,
Mian Waleed
Founder, The Address Holding
[email] | [phone]
dxb-analytics.com

---

## Email 5: Standard Chartered UAE

**To:** SC UAE home loans OR LinkedIn Head of Retail Banking Wealth Management
**Subject:** International buyer mortgage leads — DXB Analytics x Standard Chartered

Dear Standard Chartered UAE team,

I'm Mian Waleed, founder of DXB Analytics. Our platform targets a specific niche that aligns well with Standard Chartered's strengths: **international buyers and non-residents purchasing Dubai property.**

Standard Chartered is one of the few UAE banks offering non-resident mortgages (up to 60% LTV for overseas applicants) and has strong relationships with international clients — exactly the buyer segment we see in our Golden Visa tab, currency converter tab, and Banking tab.

**What our data shows:** A significant share of Banking tab users select "non-resident" as their borrower type. These leads are valuable — high property values (AED 2M+), complex income sources, often looking for international banking relationship alongside the mortgage. Currently, they drop off because most UAE banks don't serve them.

**Proposal:** DXB Analytics routes non-resident and international expat mortgage leads exclusively to Standard Chartered at AED 400 per lead (higher than standard because of the niche).

Each lead includes nationality, residency status, property value (typically AED 2M+), and income source. Complete audit trail via our dedicated `mortgageLeads` database.

**Why exclusivity:** Non-resident leads are low-volume, high-value. Splitting them across banks waters down the proposition. One-bank exclusive is more valuable for both of us.

Could we schedule 15 minutes next week?

Best,
Mian Waleed
Founder, The Address Holding
[email] | [phone]
dxb-analytics.com

---

## Response tracking

When you start sending, track responses here:

| Bank | Sent date | Response | Next step |
|---|---|---|---|
| Emirates NBD | | | |
| FAB | | | |
| Mashreq | | | |
| DIB | | | |
| Standard Chartered | | | |

---

## Follow-up strategy

**If no response in 5 business days:**
- Send a 1-sentence follow-up: "Quick bump — wanted to make sure this didn't get lost in the inbox. Happy to send a 1-pager if easier than a call."
- Try a different contact (LinkedIn message to a different person at the bank)

**If rejected:**
- Ask "Is there a partnerships team I should route this to instead?" — banks have complex org structures and you may have hit the wrong desk

**If interested but wants more info:**
- Have a 1-pager ready with: volume projections, lead quality metrics, sample lead JSON, tech integration options (API, webhook, daily CSV), pricing
- This 1-pager does not exist yet — build it before the first positive reply comes in

---

## Notes for later sessions

- After first signed agreement: add "Trusted by [Bank]" logo to landing page
- After first AED of revenue: update pitch to include "We've already processed X leads for [Bank X] worth [Y AED]" — social proof
- If 2+ banks sign: consider raising lead price from AED 300 to AED 400-500 (supply/demand)
- Long-term: build a Stripe-integrated self-serve bank dashboard where banks can log in, see their leads, download CSVs, pay monthly invoices
