# CRM Audit — 2026-04-10

## Finding
The codebase has only ONE CRM: the Agency CRM for customer-facing use.
There is NO DXB internal sales CRM. AdminPanel was assumed to contain
one, but inspection shows it only READS from the leads collection for
monitoring and customer support purposes — it does not have its own
sales pipeline.

## Agency CRM (Type 3 — already works)

Collection: `leads` (Firestore)
Multi-tenant isolation: orgId field + sameOrg() helper in firestore.rules
Read-write in:
- src/tabs/MyLeadsTab.jsx (line 179) — display + add/edit leads from agency
- src/tabs/BankingTab.jsx (line 885) — adds mortgage leads captured via calculator
- src/EmaarDashboardV2.jsx (lines 2915, 3107, 3109) — parent fetches liveLeads prop

Pipeline stages (real estate buyers): Inquiry, Viewing, Offer, Negotiation, Won, Lost
Key fields: name, phone, email, budget, propertyType, bedrooms, community,
source, status, assignedAgent, orgId, createdAt
Source capture: manual form, mortgage calculator, future CSV import, future
browser extension, future WhatsApp

## AdminPanel's use of leads (monitoring, not sales)

Read-only access at lines 13233, 13261:
- Step 1: load first 100 leads for instant UI
- Step 2: paginated load of all leads in batches of 500
- Purpose: admin staff can see all leads across all agencies for support

This is NOT a DXB sales pipeline. It's an admin oversight view of the
agency CRM data.

## Missing: DXB Internal Sales CRM

Does not exist anywhere in the codebase. Needs to be built from scratch.

Purpose: DXB Analytics sales team tracks our own pipeline — agencies,
developers, enterprises we are selling the platform to.

Proposed:
- Collection: platformLeads
- Admin-only rules: allow read, write: if isAdmin()
- Location: new admin sub-tab in AdminPanel.jsx or separate admin route
- Pipeline stages: Prospect, Contacted, Demo Scheduled, Trial Started, Paid, Churned
- Key fields: companyName, contactName, contactEmail, contactPhone, 
  estimatedARR, employeeCount, source, stage, assignedTo (DXB staff uid),
  nextAction, nextActionDate, trialEndDate, mrr, notes, lastActivity

## Revised P1.12 plan

Old: "Separate DXB Internal CRM from Agency CRM"
New: "Build DXB Internal Sales CRM from scratch (platformLeads collection + admin sub-tab)"

Effort: ~6 hours
- 1h: add platformLeads rules to firestore.rules
- 3h: build admin sub-tab with pipeline Kanban view
- 1h: add "Add Prospect" form
- 1h: add filters, search, stage transitions

## BankingTab.jsx anomaly

Line 885: adds a lead with type: "mortgage" to the leads collection. This
is fine — it IS an agency lead (a buyer interested in mortgage advice).
But it should include orgId for multi-tenant isolation. Needs verification
that the add includes orgId field.

Action: verify BankingTab lead creation includes orgId. If not, this is a
multi-tenant isolation bug — a lead created in agency A could be visible
to agency B.