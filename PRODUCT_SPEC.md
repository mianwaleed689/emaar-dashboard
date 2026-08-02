# DXB ANALYTICS — THE PRODUCT

**Written 2026-08-03.** A specification for a multi-tenant real estate operating
system for Dubai brokerages, researched against the competitors that already
exist and against UAE law. Every legal figure carries a source in §10.

[CRM_DESIGN.md](CRM_DESIGN.md) is the audit of what is broken today. This is
what gets built.

---

## 1. THE MARKET, HONESTLY

| Fact | Figure | Source |
|---|---|---|
| Active RERA-registered brokers in Dubai | **32,000+** (Q1 2026) | ME Business |
| Dubai property transactions, 2026 | **180,000+, AED 634bn** | ME Business |
| Share facilitated by RERA-registered brokers | **91%** | ME Business |
| Registered sale transactions we already hold | **878,578** | our own DLD export |

**We are not entering an empty market.** These already sell to Dubai brokerages
and already do the things §2 of the audit says we lack:

| Competitor | What they already have |
|---|---|
| **PropSpace** | Direct Property Finder API since 2012. RERA forms and Ejari-ready documents *inside* the CRM. Trakheesi permit validation. Off-plan database. Sales **and** property management. Syndication to 80+ portals. |
| **PropCRM** | Approved partner of Property Finder, Bayut **and** Dubizzle. Webhook lead ingestion — an enquiry appears in seconds and auto-assigns to the agent who owns the listing. |
| **PropHero, Ngage Plus (Retyn), Ruby** | Native sync with all three portals, one-click multi-portal publishing. |
| **Propertybase** | Built on Salesforce. Dubizzle, Bayut, Houza, Property Finder. Advanced lead routing, transaction and compliance back-office. |

### What this means

**Portal integration and RERA forms are table stakes, not a differentiator.**
Building them gets us to the starting line, not ahead of it. Any plan that
treats "we integrate with Property Finder" as the pitch is a plan to be the
sixth-best option.

### The wedge that is actually ours

Not one of those platforms has the Dubai transaction register. They are
workflow tools — they move a deal through stages and file the paperwork. They
cannot tell an agent *what the property is worth*.

We already hold 878,578 registered transactions, measured yields, service
charges and price history, and we have proven we can keep them current for free
([cron-dld-lookups.js](api/_cron/cron-dld-lookups.js)).

> **The pitch: the only Dubai CRM where the price advice comes out of the Land
> Department register, not the agent's memory.**
>
> - The agent opens a lead and sees what that community actually sold for last month.
> - They send a valuation the seller can check against the register.
> - The owner sees their agency's prices against the real market, not against a portal average.
>
> Every competitor has to buy that data or guess. We have it.

This only works if the CRM half reaches parity. A brilliant valuation engine
bolted to a CRM that cannot process a deal is not a product. **So the CRM is
built to parity, and the intelligence is what sells it.**

---

## 2. THE USERS — SEVEN JOBS, NOT ONE SCREEN

| Role | The question they open the app to answer |
|---|---|
| **Agent** | Who do I call, what do I show them, what am I owed? |
| **Sales manager** | Is my team working, who is idle, who is drowning, which deals will close? |
| **Listing coordinator** | Which listings lack a Form A or a live Trakheesi permit? |
| **Transaction coordinator** | Which deal is missing an NOC, and whose trustee appointment is Thursday? |
| **Finance** | What did we invoice, what landed, what do we owe the agents? |
| **HR** | Whose visa, BRN or labour card expires in 30 days, who is on leave, who resigned? |
| **Owner** | Revenue, cost per lead, source ROI, headcount, compliance exposure. |

Today all of these open the same screen. Each gets its own.

---

## 3. THE DATA MODEL

Everything else follows from this. Written before any UI.

```
Organisation ──┬── Users (role, BRN, contract, salary, documents)
               ├── Listings ── Trakheesi permit ── Form A
               ├── Leads ── Activities ── Viewings
               ├── Deals ── Documents ── Commission ── Payouts
               └── HR (leave, attendance, payroll, cases)
```

### Core objects

| Object | Key fields |
|---|---|
| `org` | ORN, trade licence + expiry, VAT number, commission defaults |
| `user` | role, **BRN + expiry**, contract type, basic salary, commission split, visa/EID/labour card + expiries |
| `lead` | source, **portal reference**, budget, requirement, assigned agent, response clock |
| `viewing` | date, listing, lead, agent, outcome, feedback |
| `listing` | owner, **Form A**, **Trakheesi permit + expiry**, portals published, price history |
| `deal` | **journey type** (secondary / off-plan / rental), stage, parties, price |
| `document` | type, status, uploaded file, **expiry**, which deal, who owns it |
| `commission` | side, rate, VAT, gross, agency split, agent split, collaboration split, state |
| `leaveRequest`, `payrollRun`, `attendance` | see §6 |

### Three journeys, three stage sets

The single biggest structural error today is one five-stage pipeline for
everything. Replace with:

**Secondary sale**
`Form A signed → Trakheesi permit → Published → Form B / Form I → Viewings →
Offer accepted → Form F (MOU) + deposit → NOC requested → NOC received →
Trustee appointment → Transferred (title deed) → Commission received`

**Off-plan**
`EOI → Booking → SPA signed → DLD registration (Oqood) → Payment plan →
Handover → Commission received`

**Rental**
`Form A → Trakheesi permit → Published → Viewings → Offer → Tenancy contract →
Ejari registered → Keys handed over → Commission received`

Each stage names the document it requires. A deal cannot advance past a stage
whose document is missing — that is the compliance value.

---

## 4. LEAD INTAKE — ALL FOUR SOURCES

You have access to all four. Build order by effort:

| Source | Mechanism | Effort |
|---|---|---|
| **Email parser** | A dedicated inbox; parse portal notification emails | Days. No partner approval. **Start here** — it works for every portal on day one, including ones we never integrate. |
| **Meta lead forms** | Meta Lead Ads webhook | Days. Self-serve developer app. |
| **Property Finder** | Partner API + webhook | Weeks. Commercial arrangement. |
| **Bayut / dubizzle** | Partner API + webhook | Weeks. Commercial arrangement. |

The email parser is the honest first move: it de-risks the partner
negotiations, and it captures sources the APIs never will.

### Routing — the piece the owner asked about

A lead lands in an **unassigned pool**, then a rule assigns it:

- to the agent who owns the listing it came from (PropCRM's model, and correct)
- else round-robin within the team that covers that community
- else by language, budget band, or a manual queue for the manager

Then: a **response clock** starts. Speed to first contact is the single number
that most predicts conversion, and no agency in Dubai measures it well. Show it
per agent, per source, per team. That is a report an owner will pay for.

---

## 5. COMMISSION — THE CENTRE OF THE BUSINESS

Today it is one typed number. It has to hold:

| Field | Basis |
|---|---|
| **Side** | Resale: customarily **2% + 5% VAT from each side**, each to their own agent |
| **Off-plan rate** | Paid by the **developer**, varying roughly **2–8%** by project |
| **VAT** | 5%, on a compliant tax invoice. A commission request without one is a known red flag. |
| **Agency / agent split** | Commonly **50/50**, set per agent by contract |
| **Collaboration split** | Under **Form I**, between two agencies — both must be DLD-registered to be entitled |
| **State** | `invoiced → received → paid out` — three states, not one number |

Delivers: an agent's "what am I owed this month", the owner's "what did we bill
and what landed", and the finance payout run that feeds payroll (§6).

---

## 6. HR — RUNNING THE WHOLE COMPANY

You asked for annual leave, sick leave, resignation — the whole company through
one system. Every rule below is UAE Federal law; sources in §10.

### 6.1 Employee record
Personal details, emergency contact, **passport / visa / Emirates ID / labour
card / medical insurance with expiry dates**, employment contract, job title,
reporting line, basic salary and allowances, bank/IBAN for WPS.

### 6.2 Onboarding
Offer → contract → MOHRE work permit → medical → Emirates ID → visa stamping →
bank account → **RERA training (DREI) → RERA exam → BRN issued** → system access
→ equipment. A checklist with owners and due dates, because a broker without a
BRN cannot legally work and cannot appear on a Trakheesi permit.

### 6.3 Leave

| Type | Entitlement | Rule |
|---|---|---|
| **Annual** | **30 calendar days** after one year of service | Accrual, carry-over policy, encashment on exit |
| **Sick** | Up to **90 days** per year of service, after probation | **First 15 days full pay · next 30 days half pay · final 45 days unpaid.** No paid sick leave during probation. |
| Maternity / parental / bereavement / hajj / study | Statutory | Per UAE law |
| Unpaid | By approval | Affects gratuity service calculation |

Flow: employee requests on mobile → manager approves → balance updates →
calendar shows the team → payroll picks up unpaid days automatically. **Sick
leave must apply the three-band pay split automatically** — this is where
manual payroll goes wrong.

### 6.4 Attendance
Check-in/out, geo-tagged for field agents, shift patterns, overtime, absence.
Feeds payroll.

### 6.5 Payroll and WPS
Salary structure, allowances, deductions, **commission payouts pulled from §5**,
payslips. Generates a **WPS SIF file** validated for UAE banks before
submission — a single formatting error in a SIF blocks payment.

### 6.6 Resignation and offboarding

The flow you named, in full:

1. Resignation submitted (employee) or termination initiated (employer)
2. **Notice period** — statutory minimum **30 days**, up to **90** if the
   contract says so, and then binding on both sides
3. Handover: leads reassigned, listings reassigned, deals transferred, company
   property returned, system access revoked on the last day
4. **End-of-service gratuity**, calculated automatically:
   - **basic salary only**
   - **21 days' pay per year for the first 5 years**
   - **30 days' pay per year thereafter**
   - **capped at 2 years' total remuneration**
   - minimum **1 year** continuous service to qualify
5. Final settlement: gratuity + unused annual leave + outstanding commission
   − deductions
6. **Visa cancellation** and MOHRE labour contract cancellation
7. **BRN transfer or cancellation** — real-estate-specific and missed by every
   generic HR product

### 6.7 Performance
Targets by deals, volume or commission. Reviews. Probation confirmation at or
before **6 months** — the maximum, which cannot be extended or renewed.

### 6.8 The compliance register — where HR meets RERA

One screen, and the reason an owner buys this over a generic HRMS:

| Expiring | Warn at |
|---|---|
| **Agent BRN** (annual; renewal needs the RERA exam re-sat at **≥85%** plus DREI CPD, applied through Trakheesi, ~AED 510, submitted a month early) | 90 / 60 / 30 days |
| **Agency ORN and trade licence** | 90 / 60 / 30 days |
| **Trakheesi permits** on live listings | on expiry |
| Visa, Emirates ID, labour card, medical insurance | 90 / 60 / 30 days |

**An agent whose BRN lapses cannot lawfully broker, and their listings become
non-compliant the same day.** Linking HR to listings is a connection no generic
HR product and no generic CRM makes. It is the strongest single reason for
these two halves to live in one system.

---

## 7. ARCHITECTURE FOR 9,000 AGENCIES

The current build is a single-agency app that happens to have an `orgId` field.

### What is already right
Lead isolation is correct — `firestore.rules` scopes reads to
`isSameOrg(resource.data.orgId)`.

### What is not
- **Only 24 of 82 rule blocks check `orgId`.** Before a second agency is
  onboarded, every collection must be audited for tenant scoping. One unscoped
  collection leaks one agency's pipeline to a competitor, and in this market
  that ends the company.
- **Hosting**: Vercel Hobby is nowhere near 9,000 tenants.
- **Firestore cost**: read volume at this scale needs aggregation documents, not
  client-side counting over collections.
- **No backups**, **no automated tests**, **83 swallowed catch blocks** —
  survivable for one agency, not for 9,000.
- **Stripe has no environment variables**, so the product cannot charge anyone.

**Tenant isolation is a launch blocker and gets a dedicated audit before any
second agency signs.**

---

## 8. BUILD SEQUENCE

The rule: **one agency must be able to take one real deal from portal enquiry to
title deed to commission paid, before anything is widened.**

### Phase 1 — the spine (the deal works)
1. Data model written and reviewed — §3
2. Deal journeys: secondary first, then off-plan, then rental — §3
3. Documents as objects, with expiries and stage gates
4. Commission properly — §5

### Phase 2 — the desk works
5. Viewings as objects; agent diary; manager's week
6. Lead intake: email parser → Meta → Property Finder → Bayut, with routing and the response clock — §4
7. Role-shaped views for the seven jobs — §2

### Phase 3 — compliance and people
8. Listings compliance: Form A, Trakheesi permit, BRN/ORN, publish blocked without them
9. HR core: employee records, leave, attendance, offboarding with gratuity — §6
10. Payroll and WPS SIF
11. The compliance register — §6.8

### Phase 4 — the wedge
12. Wire the DLD intelligence into the CRM: valuation on the lead, comparables on
    the listing, the agency's prices against the register

### Phase 5 — the platform
13. Tenant isolation audit, backups, tests, hosting, Stripe — §7

---

## 9. WHAT I NEED FROM YOU

1. **Confirm the sequence.** Specifically: CRM to parity first, intelligence
   after — or intelligence first to differentiate earlier and accept a weaker
   CRM at launch?
2. **Portal partner status.** Do you already have Property Finder / Bayut
   partner credentials, or do those conversations still need to happen? It
   changes Phase 2 by weeks, not days.
3. **HR scope.** Everything in §6, or start at 6.1–6.4 + 6.8 (records, leave,
   attendance, compliance register) and add payroll/WPS after? Payroll carries
   real liability when it is wrong.
4. **Is the current codebase the base, or a rewrite?** 34 tabs exist. The CRM
   spine above does not fit inside them; it sits underneath. My view: keep the
   intelligence tabs, rebuild the CRM underneath them.

---

## 10. SOURCES

All verified 2026-08-03.

**Market and competitors**
[ME Business — RERA standards, broker numbers](https://www.mebusiness.com.au/post/dubai-s-off-plan-surge-has-flooded-the-market-with-new-agents-rera-is-now-raising-the-bar) ·
[PropSpace — best CRM Dubai](https://www.propspace.com/blog/best-real-estate-crm-dubai) ·
[PropCRM — portal integration guide](https://propcrm.ae/blog/property-portal-integration-guide-uae) ·
[Retyn — Property Finder integrated CRMs](https://www.retyn.ai/blog/best-propertyfinder-real-estate-crm-streamline-property-listings) ·
[Propertybase — Middle East portal integration](https://help.propertybase.com/hc/en-us/articles/202899016-Middle-East-Property-Portal-Integration)

**Transaction process and forms** — see [CRM_DESIGN.md §9](CRM_DESIGN.md)

**Commission**
[Property Finder](https://www.propertyfinder.ae/blog/real-estate-commission-dubai/) ·
[Bayut Agent Portal](https://www.bayut.com/agentportal/demystifying-real-estate-commissions-in-dubai-who-pays-and-how-much/)

**UAE Labour Law — leave, notice, probation, gratuity**
[MOHRE gratuity guide](https://mohregratuitycalculator.ae/uae-labour-law/) ·
[HZ Legal — 2026 employer guide](https://hzlegal.ae/uae-labour-law-2026-guide-employers-employees/) ·
[Kayrouz & Associates — resignation rules](https://www.kayrouzandassociates.com/insights/uae-labor-law-resignation-rules-2026) ·
[EGSH — notice periods](https://egsh.ae/insights/notice-period-in-the-uae)

**HR systems, WPS, document expiry**
[Zoho Payroll — UAE HRMS buyer's guide](https://www.zoho.com/en-ae/payroll/academy/payroll-operations/hr-payroll-software-uae.html) ·
[Tuscan — top HR software UAE 2026](https://www.tuscan-me.com/blog/hr-software-uae-gcc.html) ·
[Rockford — HRMS and UAE labour compliance](https://rockfordcomputer.ae/hrms-implementation-uae-labor-compliance/)

**Broker licensing, BRN, DREI**
[Engel & Völkers — broker licence steps](https://www.engelvoelkers.com/ae/en/resources/real-estate-broker-license-dubai) ·
[Driven Properties](https://www.drivenproperties.com/blog/how-to-get-a-real-estate-broker-license-in-dubai) ·
[Raes Associates — cost and exam guide](https://www.raesassociates.com/real-estate-broker-license-dubai/)

**Still to confirm against the primary source before it reaches a screen:**
exact Trakheesi permit fees by permit type, Oqood registration mechanics, and
current BRN renewal fee — secondary sources disagree, and none of it changes the
design.
