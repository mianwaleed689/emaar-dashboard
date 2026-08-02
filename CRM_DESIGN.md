# WHAT THIS CRM ACTUALLY HAS TO BE

**Written 2026-08-03**, after the owner asked the question I should have asked
before touching a single tab:

> *"Who is this tab for? Where is the whole process of assigning the leads,
> contacting the client, the meeting, the whole deal processing, the government
> documentation until the deal is closed? Where is the commission? Where is the
> HR section?"*

I had been fixing faults inside tabs — a fake score, invisible buttons, missing
explanations — without ever establishing what the product is. Those fixes were
real, but they were repairs to rooms in a house with no plan. This document is
the plan, and it starts from what a Dubai brokerage actually does, with
references.

---

## 1. WHO THE USERS ARE

The code already defines **five roles** ([MyLeadsTab.jsx:214-223](src/tabs/MyLeadsTab.jsx#L214-L223)):

| Role | `orgRole` | What the code lets them do today |
|---|---|---|
| Super admin | `userRole==="admin"` | everything, platform-wide |
| Owner | `owner` | everything in their agency + the leaderboard |
| Director | `director` | same as owner minus the leaderboard |
| Manager | `manager` | see the team, assign leads |
| Agent | `agent` | see their own leads |

**The fault:** *My Leads* renders one screen for all five. The differences are
three conditionals — a manager dropdown, an "Unassigned" chip, a leaderboard.
An owner and an agent open the same tab and see almost the same thing, which is
why it reads as belonging to nobody.

A brokerage has at least these distinct jobs, and only two of them are served:

| Job | Needs | Served today |
|---|---|---|
| **Agent** | my leads, my viewings, my deals, my commission owed | partly |
| **Sales manager** | my team's leads, who is idle, who is overloaded, reassign | partly |
| **Listing / admin coordinator** | Form A collected, Trakheesi permit live, listing published, documents chased | **no** |
| **Conveyancing / transaction coordinator** | NOC requested, trustee appointment booked, cheques ready, title deed issued | **no** |
| **Finance** | commission invoiced, VAT, received, agent payout | **no** |
| **HR / compliance** | broker card (BRN) expiry, visa, labour card, contract, leave, payroll | **no** |
| **Owner** | revenue, cost per lead, source ROI, headcount, compliance exposure | partly |

---

## 2. LEADS — WHAT IS MISSING

### There is assignment, but no intake

`assignLead()` ([MyLeadsTab.jsx](src/tabs/MyLeadsTab.jsx)) does work: it writes
`assignedTo`, `managerId`, `directorId`, appends a note, and fires an in-app
notification to the agent. That part is real.

**But nothing brings leads in.** There is no webhook, no email parser, no portal
integration anywhere in [api/](api/) — the whole directory is crons, Stripe,
email and a proxy. The `source` dropdown offers fifteen sources (Property
Finder, Bayut, Dubizzle, Meta, Instagram, Google Ads, TikTok…) and **every one
of them is typed in by hand.**

That is the gap behind the owner's question. In a real Dubai brokerage a lead
lands from Property Finder or a Meta lead form into a **pool**, is **routed** to
an agent by a rule (round-robin, by language, by community, by budget band), and
the agent is told. Here, somebody re-types it. The routing rule, the pool, the
response-time clock — none of it exists.

### What a lead record is missing

Nothing records **the meeting**. There are note types (`Call`, `Viewing`,
`Offer`) but a viewing is not an object — it has no date, no property, no
outcome, no feedback, so it cannot be scheduled, reminded, or reported on. An
agent cannot answer *"what viewings do I have on Thursday"*.

---

## 3. THE DEAL — THE PIPELINE ONLY MODELS ONE THIRD OF THE BUSINESS

[PipelineTab.jsx:30-36](src/tabs/PipelineTab.jsx#L30-L36) defines five stages:

```
EOI → Booking → SPA → DLD → Completed
```

**That is an off-plan pipeline only.** The tab has an Off-Plan / Secondary
filter, but *both* types are pushed through these same five stages — and a
secondary sale has no EOI and no SPA. A rental has neither, plus a step
(Ejari) that appears nowhere.

The three real journeys, from the research below:

### A. Secondary / resale sale
1. **Form A** signed with the seller — the seller-broker agreement. Sets the
   commission and whether the listing is exclusive. *Without a signed Form A a
   broker cannot legally list the property anywhere* — not a portal, not social
   media, not a billboard.
2. **Trakheesi permit** issued by DLD against that Form A. The advert must carry
   the permit number.
3. **Listing published** to the portals with the permit number.
4. **Form B** signed with the buyer (buyer-broker agreement), and **Form I** if a
   second agency is collaborating on the deal.
5. **Viewings**, then an accepted offer.
6. **Form F — the MOU / Sale and Purchase contract** between buyer and seller.
   Deposit (customarily 10%) lodged.
7. **NOC** from the developer confirming service charges are settled. Typically
   valid ~30 days, which makes it a deadline that must be tracked.
8. **Trustee office appointment** — a DLD Registration Trustee, not the DLD
   itself. Manager's cheques or Noqodi payment. **4% DLD transfer fee** plus
   admin and title deed fees.
9. **New title deed** issued, usually the same day.

### B. Off-plan
EOI → booking → SPA → registration with DLD (the off-plan interim registration,
issued as an Oqood certificate) → construction milestones → handover.
This is the only journey the current Pipeline resembles, and even it collapses
the registration and the handover.

### C. Rental
Form A equivalent → Trakheesi permit → listing → offer → tenancy contract →
**Ejari registration** → handover of keys. Ejari appears in the codebase only as
a data source for the Yields tab, never as a step in a deal.

**None of the documents above exists as a field, a checklist or an upload
anywhere in the app.** A grep for Form A, Form B, Form F, Form I, MOU, NOC,
Trakheesi, Oqood, Ejari, title deed, trustee and manager's cheque across `src/`
returns nothing but false positives and unrelated tabs.

---

## 4. COMMISSION — ONE NUMBER, TYPED IN

`commission` exists as a single free-typed figure on a deal
([PipelineTab.jsx](src/tabs/PipelineTab.jsx), 13 mentions). What it cannot
express, all of which a Dubai brokerage needs:

| Missing | Why it matters |
|---|---|
| Which side | Resale is customarily **2% + 5% VAT from each side**, each to their own agent. One number cannot hold two. |
| VAT | Commission is VAT-rated. The invoice is a legal document; a cash request without one is a known red flag. |
| Agency / agent split | Commonly **50/50**, but set per agent by contract. Without it an agent cannot see what they earned. |
| Collaboration split | Under **Form I**, two agencies share. Both must be registered with DLD to be entitled to payment. |
| Off-plan source | On off-plan the **developer** usually pays, and the rate varies roughly **2–8%** by project. Different money, different timing. |
| Invoiced / received / paid | Three separate states. Today there is one number and no state at all. |

Consequence: **an agent cannot answer "what am I owed this month", and an owner
cannot answer "what did we bill and what has actually landed".** For a
commission-driven business that is the centre of the product, and it is absent.

---

## 5. LISTINGS — CANNOT LEGALLY BE PUBLISHED

[ListingsTab.jsx](src/tabs/ListingsTab.jsx) (523 lines) has **no Trakheesi
permit field, no Form A, no BRN, no ORN, no permit expiry.**

Every online property advertisement in Dubai — portal, agency website or social
media — must display a valid unique permit number obtained through Trakheesi,
and the advert must match the permit. Advertising without one, or with wrong
details, is a RERA violation carrying fines reported from around AED 50,000 and
rising, with listing removal and licence suspension also possible.

So the Listings tab as it stands produces listings that **cannot lawfully be
advertised**. That is not a polish item; it is the first thing to fix in that
tab.

---

## 6. HR — DOES NOT EXIST

[TeamTab.jsx](src/tabs/TeamTab.jsx) (620 lines) creates **user accounts** — full
name, work email, phone, temporary password — and shows a sales scoreboard. It
is user administration, not HR.

Absent entirely (verified by grep across `src/`): payroll, WPS, annual leave,
sick leave, attendance, visa expiry, labour card, Emirates ID, employment
contract, probation, gratuity / end-of-service, appraisals, offboarding.

For a Dubai brokerage, one part of this is not optional. **An agent must hold a
valid RERA broker card (BRN) to broker at all, and every Trakheesi permit is
tied to a valid broker and agency licence (ORN).** So the following are
compliance data, not HR nice-to-haves:

- **BRN** number and expiry, per agent
- **ORN** and trade licence expiry, per agency
- Visa, Emirates ID and labour card expiry, per employee
- Which agent is legally allowed to hold a listing today

Everything else — leave, payroll, appraisals — is real HR and should be judged
on whether you want to compete with a dedicated HR product, or integrate.

---

## 7. WHAT I PROPOSE TO BUILD, IN ORDER

The ordering rule: **an agent must be able to take one real deal from enquiry to
title deed to commission received before anything else is widened.** A CRM that
handles one journey completely beats one that half-handles three.

### Phase 1 — the spine (a deal end to end)
1. **One data model** for Lead → Viewing → Deal → Documents → Commission, with
   three journey types (Secondary, Off-plan, Rental) that have *different*
   stages. Written down before any UI.
2. **Rebuild Pipeline** on that model. Secondary gets its own nine stages with
   the documents attached to the stage that requires them; off-plan keeps its
   own; rental gets Ejari.
3. **Documents as objects** — Form A, B, F, I, MOU, NOC, SPA, title deed, Ejari.
   Each with a status, an owner, an upload, and an expiry where it has one
   (NOC ~30 days, Trakheesi permit, broker card).
4. **Commission properly** — side, rate, VAT, agency/agent split, collaboration
   split, and the three states invoiced / received / paid out.

### Phase 2 — the desk works
5. **Viewings as objects** — date, property, lead, outcome, feedback. Then an
   agent has a diary and a manager can see the week.
6. **Lead intake** — a webhook endpoint plus a routing rule (round-robin, by
   language, by community, by budget), an unassigned pool, and a response-time
   clock. This is the "agency assigns to agent" flow that is missing.
7. **Role-shaped views** — the same data, four openings: agent, manager,
   coordinator, owner. Not one screen with three conditionals.

### Phase 3 — compliance and people
8. **Listings compliance** — Form A, Trakheesi permit number and expiry, BRN and
   ORN on every listing, and a block on publishing without them.
9. **Compliance register** — BRN / ORN / trade licence / visa expiries with
   warnings before they lapse.
10. **HR** — scope decision required from the owner: full HR, or compliance-only
    plus an integration.

---

## 8. WHAT NEEDS THE OWNER'S DECISION

1. **How much HR?** Full (payroll, leave, attendance, appraisals) is a second
   product. Compliance-only (BRN, ORN, visa, licence expiry) is a week and is
   genuinely required. My recommendation: compliance-only now, full HR later,
   sold separately.
2. **Which journey first?** My recommendation: **secondary sale.** It has the
   most paperwork, so it proves the model, and it is where brokerages feel the
   most pain. Off-plan is already half-built.
3. **Lead intake sources.** Property Finder and Bayut both need commercial
   arrangements. Meta lead forms and an email parser do not. Which do you have
   access to?

---

## 9. SOURCES

Verified 2026-08-03. Everything in sections 3, 4 and 5 above traces to these.

- RERA forms A / B / F / I — [Bayut](https://www.bayut.com/mybayut/guide-rera-forms-dubai/), [Engel & Völkers](https://www.engelvoelkers.com/ae/en/resources/types-of-rera-forms-in-dubai-for-property-transactions), [Binghatti](https://www.binghatti.com/en/blog/rera-forms-dubai-guide)
- Transfer, NOC, trustee office, manager's cheque, 4% fee — [EGSH](https://egsh.ae/insights/property-transfer-dubai-guide), [Engel & Völkers](https://www.engelvoelkers.com/ae/en/resources/property-transfer-in-dubai-understanding-the-legal-process), [UAE Expert Hub](https://www.uaeexperthub.com/dld-registration-trustee-office-dubai/)
- Trakheesi advertising permit and penalties — [EGSH](https://egsh.ae/insights/trakheesi-permit-dubai-advertising-compliance), [PropSpace](https://www.propspace.com/blog/uae-real-estate-advertising-permits)
- Commission, VAT, agency/agent split, off-plan rates — [Property Finder](https://www.propertyfinder.ae/blog/real-estate-commission-dubai/), [Bayut Agent Portal](https://www.bayut.com/agentportal/demystifying-real-estate-commissions-in-dubai-who-pays-and-how-much/), [PropSpace](https://blog.propspace.com/understanding-real-estate-commission-in-dubai-a-complete-guide-for-buyers-and-sellers/)

**Two figures I did not settle and will confirm against DLD directly before any
of it reaches a screen:** the exact Trakheesi permit fee (sources gave both
~AED 220 and AED 1,000 + AED 20, which look like different permit types), and
the precise Oqood registration mechanics for off-plan. Neither changes the
design; both would be wrong to print as fact today.
