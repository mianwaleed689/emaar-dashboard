# WHO SEES WHAT

**Written 2026-08-03**, answering the owner's question:

> *"How will the Leads, Pipeline and Listings tabs show for the agents, for the
> sales manager, for top level management and the owner? And how will the HR
> system work — because it will be used by all departments, not only sales."*

That last sentence is the one that changed the design. The code in
[src/crm/model/org.js](src/crm/model/org.js) is the answer; this explains it.

---

## 1. THE MISTAKE THIS FIXES

The application had **one axis**: `orgRole` — agent, manager, director, owner.
Every screen was then written as *"if manager, show more"*. Two consequences:

- An owner and an agent opened My Leads and saw almost the same screen.
- There was **nowhere to put** an HR officer, a finance clerk, a listings
  coordinator or a PRO. They would have had to be entered as "agents".

A brokerage is not a sales team with extra people attached. It is a company. The
HR officer is not an agent with fewer permissions — different job, different
screen, and they must **not** see a client's phone number.

So there are now **three axes**:

| Axis | Values |
|---|---|
| **Department** | Sales · Listings & marketing · Conveyancing · Finance · HR · Admin & PRO · Management · IT |
| **Seniority** | Staff · Team leader · Manager · Director · Owner |
| **Scope** | none · own · team · org — *derived, never typed in* |

Seniority widens scope by exactly **one** step. Only director and above reach the
whole organisation — a manager runs a team, and seeing across teams is what a
director is for.

---

## 2. THE THREE SALES TABS, BY WHO OPENED THEM

Same tab. The question it answers changes.

### My Leads

| Who | Sees | The question it answers |
|---|---|---|
| **Agent** | Own leads | *Who do I call next?* |
| **Sales manager** | Their team | *Who is idle, who is drowning, what is unassigned?* |
| **Director / Owner** | Everything | *Which sources are worth the money, and which team converts them?* |
| **HR, Finance, IT** | — | Tab is not shown at all |
| **Marketing** | — | No leads, but see the deal figures below |

### Pipeline (Deals)

| Who | Sees | The question |
|---|---|---|
| **Agent** | Own deals | *What is blocking mine, and what am I owed?* |
| **Sales manager** | Their team | *What will close this month, and who needs help?* |
| **Director / Owner** | Everything | *What did we bill, what landed, what is stuck?* |
| **Conveyancing** | **Every deal in the company**, from staff level up | Their job is the document queue — every outstanding NOC in one list, not deals grouped by agent |
| **Finance** | Every deal | The commission invoicing and collection queue |
| **HR, IT** | — | Not shown |

Conveyancing seeing every deal at staff level is deliberate. A transaction
coordinator does not have "their own" deals; they run the paperwork for all of
them.

### Listings

| Who | Sees | The question |
|---|---|---|
| **Agent** | Own listings | *Can each of mine be advertised?* |
| **Listings coordinator** | **All listings**, from staff level | *What is not compliant, and whose permit expires this week?* |
| **Sales manager** | Their team | *What stock do we hold?* |
| **Director / Owner** | Everything | *Are we advertising anything we should not be?* |

---

## 3. PERSONAL DATA IS A SEPARATE GATE

Scope says *how many records*. It does not say *how much of each record*.

Marketing needs to know Property Finder converts better than Bayut. They have no
business with the buyer's mobile number. Finance needs the commission on a deal,
not the client's passport.

| | May see client name, phone, email |
|---|---|
| Sales | **yes** — they are the ones calling |
| Conveyancing | **yes** — they run the transfer |
| Management | yes |
| Listings & marketing | **no** — figures only |
| Finance | **no** |
| HR, Admin, IT | **no** |

And pay is gated separately again: **HR, Finance and Management** may see what
anyone earns. A **sales manager may not** — they manage performance, not salary.
Everybody can always see their own.

---

## 4. HR IS FOR THE WHOLE COMPANY

This is the part the owner was right to press on. HR is not a sales feature.

### Every employee, every department

- Personal record, emergency contact, contract, reporting line
- **Document expiries** — passport, visa, Emirates ID, labour card, medical
  insurance — warned at 90 / 60 / 30 days
- **Leave**: 30 days annual after one year; sick leave up to 90 days a year with
  the three pay bands (15 full · 30 half · 45 unpaid) applied automatically, and
  none during probation
- **Attendance**, feeding payroll
- **Payroll and WPS**, generating a validated SIF file
- **Onboarding and offboarding**, including gratuity and final settlement
- **Self-service**: request leave, see my balance, my payslips, my documents

### Only sales

- **Broker card (BRN)** and its expiry
- RERA training and exam in onboarding
- BRN transfer or cancellation in offboarding
- Listings and leads reassignment when they leave

A finance clerk has no BRN and is never asked for one. An agent has both.

### Who sees which people

| Who | Sees |
|---|---|
| Any employee | **Themselves** — leave, payslips, documents |
| Any manager, any department | **Their team** — absence, document expiry, reviews |
| **HR** | **Everyone in the company** |
| **Admin / PRO** | Everyone — visas and licences are their job |
| Owner / Director | Everyone |
| Sales manager | Their team's absence, but **not** their pay |

### The compliance register — why HR and the CRM share one database

One screen listing everything that expires:

| Expiring | Applies to |
|---|---|
| Broker card (BRN) | Sales only |
| Visa, Emirates ID, labour card, passport, medical insurance | Everyone |
| Agency ORN, trade licence | The company |
| Trakheesi permits | Every live listing |

**An agent whose BRN lapses cannot lawfully broker, and every listing they hold
becomes non-compliant the same day.** No standalone HR product can see the
listings. No standalone CRM knows the broker card expires on Thursday. That
single connection is the strongest reason these two halves live in one system,
and it is why HR is not a bolt-on here.

---

## 5. EXISTING ACCOUNTS KEEP WORKING

Nobody has a department yet. Rather than demand the whole company be re-entered
before the app works, a department is inferred from the old `orgRole`: owner and
director become Management, everyone else becomes Sales. Tested, so a legacy
owner still sees everything and a legacy agent still sees only their own.

---

## 6. WHAT IS BUILT AND WHAT IS NOT

**Built and tested** (146 assertions in
[scripts/test/model.test.mjs](scripts/test/model.test.mjs)): the departments, the
seniority ladder, scope derivation, the PII and pay gates, per-role view intent,
record filtering, and the legacy fallback.

**Not yet wired into the tabs.** My Leads, Pipeline and Listings still use the
old `orgRole` checks. Connecting them is the next step, and it is now a small
change per tab rather than a rewrite, because each one asks
`scopeFor(user, area)` and renders the matching view.

**Not yet built**: the HR screens themselves. The rules underneath them —
gratuity, the sick-leave bands, leave accrual, notice periods, offboarding, the
compliance register — are written and tested in
[src/crm/model/hr.js](src/crm/model/hr.js). The screens come next.
