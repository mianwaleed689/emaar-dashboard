# DXB Sales CRM — Complete Plan

**Created:** 2026-04-09
**Purpose:** Complete specification for DXB Analytics internal sales CRM (admin side) that is best-in-class, takes the best ideas from competitors and our existing CRMs, and serves as the platform sales pipeline for The Address Holding.
**Not to be confused with:** The customer-facing Agency CRM (MyLeads/Pipeline tabs) which agencies use to manage their property buyers.

---

## What this CRM is for

DXB Analytics (the company) is selling a SaaS product to 1000+ UAE real estate agencies. We need our own internal CRM to track:
- Agencies we are prospecting, contacting, demoing, trialing
- Developers claiming their projects via the developer portal
- Trial conversions, paid customers, churn
- Pipeline value, MRR, ARR
- Follow-ups and tasks
- Team performance (if we add sales reps later)

This is a B2B SaaS sales CRM, not a real estate CRM. Think Close.io / Pipedrive / HubSpot Sales Hub, not Propertybase.

---

## Research sources

Competitors studied (2026 research):
- **Pipedrive** — gold standard visual pipeline, activity-based selling, deal rotting alerts
- **HubSpot Sales Hub** — unified pipeline+CRM view, automation, free tier benchmark
- **Close.io** — built-in VoIP/SMS/email, aggressive sales focus
- **Monday CRM** — customizable board/chart/timeline views
- **Salesforce Sales Cloud** — Einstein AI lead scoring, multi-pipeline
- **ChartMogul CRM** — SaaS-native with Stripe sync for MRR tracking
- **Attio** — modern design language, custom views
- **Folk** — relationship-first CRM with strong import tools
- **GoHighLevel** — agency-tailored with built-in automation
- **ChartMogul** — SaaS metrics built-in

Dubai-specific CRMs studied:
- **REM (Real Estate Matchmaker)** — WhatsApp integration, Arabic support, fast onboarding
- **SmartLeads Expert** — AI lead scoring, DLD data, multilingual
- **X-OPP** — Bayut/PropertyFinder native sync
- **Goyzer** — UAE payment plans, lead scoring, custom pipelines

Existing DXB Analytics CRMs studied:
- **AdminPanel old Leads CRM** (src/AdminPanel.jsx line 17577-18700+) — 78K leads, List/Inbox/Board/Stats views, pipeline funnel, lead sources filter, top leads by score, nationality breakdown
- **Dashboard MyLeadsTab** (src/tabs/MyLeadsTab.jsx) — agency-facing CRM with CSV import, lead scoring, notes, activities

---

## Core principles

1. **Opinionated, not bloated** — Pipedrive taught us: focus on activities that move deals forward, not custom field soup
2. **Dubai market context** — multilingual UI (English/Arabic later), WhatsApp integration, AED currency, UAE business hours
3. **SaaS metrics native** — show MRR, ARR, pipeline value, win rate, conversion rate prominently
4. **Fast by default** — Firestore real-time, no page refreshes, optimistic UI
5. **Mobile responsive** — admin should be able to update deals from phone
6. **Keyboard-first** — power users should never need a mouse
7. **Audit everything** — every action logged to platformLeads/{id}/auditLog for compliance

---

## Data model

### Collection: platformLeads/{leadId}

```typescript
{
  id: string,                         // lead_<companyname>_<timestamp>
  companyName: string,                // Required
  companyType: "Agency" | "Developer" | "Brokerage" | "Boutique" | "Property Management",
  companySize: "Solo" | "Small (2-10)" | "Medium (11-50)" | "Large (51-200)" | "Enterprise (200+)",
  website: string,
  linkedin: string,

  // Primary contact
  contactName: string,
  contactTitle: string,
  contactEmail: string,
  contactPhone: string,
  contactLanguage: "English" | "Arabic" | "French" | "Russian" | "Chinese" | "Other",

  // Pipeline state
  stage: "prospect" | "contacted" | "qualified" | "demo_scheduled" | "trial_started" | "negotiating" | "paid" | "churned" | "lost",
  previousStage: string,              // For rollback
  stageChangedAt: timestamp,
  stageHistory: [{ stage, at, by }],

  // Revenue
  plan: "Free" | "Pro (AED 299)" | "Enterprise (AED 799)" | "Custom",
  estimatedArr: number,               // Annual recurring revenue potential
  mrr: number,                        // Current monthly recurring revenue (if paid)
  dealValue: number,                  // Total deal value (ARR * multi-year)
  trialStartDate: string,
  trialEndDate: string,
  conversionProbability: number,      // 0-100, auto-calc or manual

  // Scoring (auto-computed)
  leadScore: number,                  // 0-100
  leadTemperature: "cold" | "warm" | "hot" | "burning",
  lastActivityAt: timestamp,
  daysInStage: number,
  isStalled: boolean,                 // true if daysInStage > threshold

  // Ownership
  assignedTo: string,                 // sales rep email
  assignedAt: timestamp,
  source: "Inbound" | "Outbound" | "Referral" | "LinkedIn" | "Cold Email" | "Cold Call" | "Event" | "Partner" | "Website",
  sourceNotes: string,

  // Activities / engagement
  totalCalls: number,
  totalEmails: number,
  totalMeetings: number,
  lastCallAt: timestamp,
  lastEmailAt: timestamp,
  lastMeetingAt: timestamp,

  // Follow-up
  nextFollowUpAt: timestamp,
  nextFollowUpType: "call" | "email" | "meeting" | "whatsapp" | "demo",
  nextFollowUpNotes: string,

  // Custom fields
  tags: string[],                     // ["priority", "decision-maker", "competitor-user"]
  painPoints: string[],
  competitors: string[],              // Which CRM they currently use
  objections: string[],

  // Rich notes
  notes: string,                      // Plain text summary
  notes_log: [{
    id: string,
    text: string,
    type: "call" | "email" | "meeting" | "note" | "task" | "whatsapp" | "demo",
    by: string,                       // user email
    at: timestamp,
    duration?: number,                // for calls/meetings in minutes
    outcome?: string,                 // "answered" | "voicemail" | "no-answer"
  }],

  // System
  createdAt: timestamp,
  createdBy: string,
  updatedAt: timestamp,
  updatedBy: string,
  archived: boolean,
}
```

### Subcollection: platformLeads/{leadId}/auditLog/{logId}
Every create, update, stage-change, delete action logged with userId, timestamp, oldValue, newValue.

### Subcollection: platformLeads/{leadId}/tasks/{taskId}
```typescript
{
  title: string,
  type: "call" | "email" | "meeting" | "demo" | "follow-up",
  dueAt: timestamp,
  assignedTo: string,
  completed: boolean,
  completedAt: timestamp,
  createdAt: timestamp,
  createdBy: string,
}
```

### Global collection: salesActivity/{activityId}
Cross-lead activity feed for team dashboard — all calls, emails, meetings logged here for timeline view.

---

## Pipeline stages (final)

9 stages covering the full SaaS sales funnel:

1. **Prospect** — Identified but not contacted
2. **Contacted** — First outreach sent (email/call/LinkedIn)
3. **Qualified** — Replied, fit confirmed, budget understood
4. **Demo Scheduled** — Meeting booked
5. **Trial Started** — 14-day trial active
6. **Negotiating** — Contract/terms discussion
7. **Paid** — Converted customer (MRR counted)
8. **Churned** — Was paid, cancelled
9. **Lost** — Never became customer

Stage colors:
- Prospect: gray (#94A3B8)
- Contacted: blue (#3B82F6)
- Qualified: cyan (#06B6D4)
- Demo Scheduled: amber (#F59E0B)
- Trial Started: purple (#A855F7)
- Negotiating: orange (#F97316)
- Paid: green (#10B981)
- Churned: red (#EF4444)
- Lost: dark red (#991B1B)

---

## 4 views (inspired by old AdminPanel Leads CRM)

### View 1: Kanban Board (default)
9 columns, drag-and-drop, lead cards show:
- Company name + type badge
- Contact name + email
- ARR / MRR value
- Lead score (0-100) with color
- Days in stage (turns red if stalled)
- Next follow-up (due today = warning)
- Source icon
- Quick-move buttons to any stage

### View 2: List (spreadsheet-style)
Sortable columns:
- Company, Contact, Stage, Source, ARR, MRR, Score, Last Activity, Next Follow-up, Owner, Tags

Bulk actions:
- Change stage for N leads
- Assign to rep
- Add tag
- Export to CSV
- Archive
- Delete

Inline editing on any cell.

### View 3: Inbox (activity feed)
Chronological feed of all activities across all leads:
- Latest calls, emails, meetings, notes
- Filter by rep, type, date range
- Shows unread/pending follow-ups at top
- Quick reply buttons

### View 4: Stats (analytics dashboard)
- **Pipeline funnel** chart — shows conversion rate between each stage
- **Revenue metrics** — Current MRR, ARR, Avg deal size, Win rate, Sales cycle length
- **Source breakdown** — pie chart of where leads come from
- **Stage breakdown** — count and value per stage
- **Top 10 leads by score**
- **Top 10 stalled leads** (in stage too long)
- **Team performance** — leads per rep, conversion rate per rep, activities per rep
- **Sales velocity** — (leads x win rate x avg deal / sales cycle)
- **Cohort analysis** — leads created in month X, conversion over time

---

## Features checklist (pre-launch)

### Must-have (P0)
- [x] Firestore collection with admin-only rules
- [x] Kanban view with 9 stages
- [x] New/Edit modal with full field set
- [x] Audit logging on every action
- [x] Search bar
- [x] Stats cards header
- [x] Sample data seed (10 leads)
- [ ] List view
- [ ] CSV import with column mapping
- [ ] CSV export
- [ ] Bulk actions (multi-select in list view)
- [ ] Lead score auto-calculation
- [ ] Days in stage calculation + stalled flag
- [ ] Next follow-up field with overdue warning banner
- [ ] Trial end date + "expiring soon" warning
- [ ] Activity log subcollection (calls, emails, notes, meetings)
- [ ] Notes log within lead modal
- [ ] Tags with auto-complete
- [ ] Filter by: stage, type, source, owner, tag, date range
- [ ] Sort by: value, score, last activity, created date, days in stage

### Should-have (P1)
- [ ] Inbox view (activity feed)
- [ ] Stats view (full analytics dashboard)
- [ ] Pipeline funnel with conversion rates
- [ ] Task subcollection with due dates
- [ ] Reminder notifications (browser + email)
- [ ] WhatsApp click-to-chat on contactPhone
- [ ] Click-to-email on contactEmail
- [ ] Click-to-call (tel: link)
- [ ] Stripe webhook sync (auto-update MRR when customer signs up)
- [ ] Keyboard shortcuts (N = new lead, / = search, esc = close)
- [ ] Saved filter presets ("My Hot Leads", "This Week's Demos")
- [ ] Dark mode (already default)
- [ ] Toast notifications for all actions

### Nice-to-have (P2, post-launch)
- [ ] Drag-and-drop stage changes on Kanban
- [ ] Multi-pipeline support (Agencies vs Developers as separate pipelines)
- [ ] Custom fields per lead
- [ ] Custom stages per pipeline
- [ ] Email integration (send from CRM, track opens/clicks)
- [ ] Email templates with merge tags
- [ ] Calendar integration (Google/Outlook)
- [ ] AI lead scoring via Claude API
- [ ] AI next-best-action suggestions
- [ ] Sequences (automated multi-touch outreach)
- [ ] Web forms (embed on website, capture leads)
- [ ] Browser extension (capture LinkedIn profiles as leads)
- [ ] Chrome extension with Gmail/Outlook sync
- [ ] Mobile app (PWA first, native later)
- [ ] Arabic RTL support
- [ ] Team management (roles, permissions, assignments)
- [ ] Commission tracking
- [ ] Forecasting module (weighted pipeline x probability)
- [ ] Integration with DXB Analytics billing (Stripe)
- [ ] SLA tracking (response time per lead)
- [ ] Goals and quotas per rep
- [ ] Leaderboard
- [ ] Deal rooms (shared workspace per lead)
- [ ] Proposal/quote generator
- [ ] E-signature integration (DocuSign)

---

## Lead scoring formula (v1 — simple)

Score 0-100 based on:
- **Company size:** Enterprise +25, Large +20, Medium +15, Small +10, Solo +5
- **Plan interest:** Enterprise +20, Pro +10, Free +0
- **Stage progression:** Prospect +0, Contacted +5, Qualified +15, Demo +25, Trial +35, Negotiating +40
- **Recent activity:** Last 7 days +20, Last 14 days +10, Last 30 days +5, Older +0
- **Source quality:** Referral +15, Inbound +10, LinkedIn +8, Event +5, Cold +0
- **Engagement:** Per call +3, per email reply +2, per meeting +8 (capped at 20)

Cap at 100. Recompute on every update.

Temperature:
- Burning: 80-100
- Hot: 60-79
- Warm: 40-59
- Cold: 0-39

## Days in stage / stalled logic

Thresholds before flagging as stalled:
- Prospect: 14 days
- Contacted: 7 days
- Qualified: 14 days
- Demo Scheduled: 3 days
- Trial Started: 14 days (entire trial)
- Negotiating: 21 days
- Paid/Churned/Lost: never stalled

Stalled leads get a red warning badge and appear in "Stalled Leads" filter.

## Follow-up logic

Every lead should have `nextFollowUpAt` set.
- If empty: show warning "No follow-up scheduled"
- If overdue: show red banner at top of CRM: "X leads have overdue follow-ups"
- If due today: show amber badge on the card
- If due this week: show gray indicator

When a stage changes, auto-suggest next follow-up based on new stage:
- Prospect -> Contacted: next = today + 2 days ("follow up on first email")
- Contacted -> Qualified: next = today + 1 day ("send demo invite")
- Qualified -> Demo Scheduled: next = day before demo ("confirm demo")
- Demo -> Trial: next = today + 3 days ("check trial onboarding")
- Trial -> Negotiating: next = today + 1 day ("send contract")
- etc.

## Empty state UX

First time admin opens the CRM:
- Show a welcome hero explaining the purpose
- Show 3 sample leads in Prospect column as examples
- Show a "+ Create your first lead" CTA
- Show a "Import from CSV" CTA for bulk import

## CSV import mapping

Support flexible column names:
- companyName, Company, Company Name, Name
- contactName, Contact, Contact Name, Primary Contact
- contactEmail, Email, Contact Email, Primary Email
- contactPhone, Phone, Contact Phone, Mobile
- stage, Stage, Status, Pipeline Stage
- plan, Plan, Subscription
- estimatedArr, ARR, Annual Revenue
- mrr, MRR, Monthly
- source, Source, Lead Source
- assignedTo, Owner, Assigned To, Rep
- notes, Notes, Comments, Description
- tags, Tags, Labels (comma-separated)

Validation:
- Must have companyName
- Must have contactEmail OR contactPhone
- Stage must map to known stage (normalize "prospect", "New", "Lead", "Open" all to "prospect")
- Show preview of first 5 rows before import
- Show validation errors with row numbers
- Confirm count before writing

---

## Keyboard shortcuts

- **N** — New lead
- **/** — Focus search
- **Esc** — Close modal
- **1-9** — Switch to stage column (Kanban)
- **K** — Kanban view
- **L** — List view
- **I** — Inbox view
- **S** — Stats view
- **Ctrl+F** — Search
- **Ctrl+E** — Export to CSV
- **Ctrl+I** — Import CSV

---

## Build sequence

### Phase 1 — Foundation (2 hours) NEXT
1. Rewrite PlatformLeadsTab.jsx with new 9-stage pipeline
2. Add lead score calculation
3. Add days in stage + stalled flag
4. Add next follow-up field + overdue banner
5. Upgrade new/edit modal with full field set
6. Commit + push

### Phase 2 — Multi-view (2 hours)
1. Add view tabs: Kanban | List | Inbox | Stats
2. Build List view with sortable columns + bulk actions
3. Build basic Stats view with pipeline funnel
4. Commit + push

### Phase 3 — CSV + activity (1 hour)
1. CSV import with column mapping modal
2. CSV export
3. Notes log within modal
4. Activity feed Inbox view
5. Commit + push

### Phase 4 — Polish (1 hour)
1. Keyboard shortcuts
2. Empty state UX
3. Toast notifications
4. Saved filter presets
5. Stripe webhook sync stub
6. Commit + push

**Total: 6 hours across 4 phases. Each phase ships independently.**

## Success metrics (post-launch)

Track these after CRM goes live:
- Time to first lead created
- Time to first stage change
- Number of leads created per week
- Conversion rate from Prospect to Paid
- Average sales cycle length
- MRR growth rate
- Admin NPS ("How useful is this CRM? 1-10")

## Non-goals (explicitly out of scope)

These are tempting but we are NOT building:
- Custom CRM builder (like Attio) — too complex
- Multi-tenant CRM for agencies (that is MyLeadsTab, different product)
- Email marketing (use SendGrid/Mailchimp separately)
- Accounting (use Xero/QuickBooks separately)
- Full task management (use Linear/Notion separately)
- Chat with leads (use WhatsApp/Intercom separately)

This CRM is focused: track the sales pipeline for DXB Analytics SaaS subscriptions. Nothing more.

---

**Document owner:** DXB Analytics Product
**Last updated:** 2026-04-09
**Status:** Approved for Phase 1 build