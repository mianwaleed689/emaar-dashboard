# Post-Launch Backlog

Feature requests and ideas that come up during Sessions 0-20 go here so they do not derail the plan.

Rule: Nothing here gets built until Session 20 is complete and v1.0 is tagged.

## Backlog
(empty — add items as they come up)
## EmailJS end-to-end setup (deferred from Session 0)
The dashboard file now imports emailjs correctly, so the ReferenceError crash is fixed. However, the VITE_EMAILJS_* env vars are not set in the local .env file and their status in Cloudflare/Vercel is unconfirmed. The emailjs.send() calls will silently fail until:
1. An EmailJS account exists with a service and template
2. VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY are set in Cloudflare Pages and Vercel dashboards
3. A test signup confirms a welcome email arrives in an inbox (not spam)

Not a launch blocker for first agency — onboarding emails can be sent by hand for the first week. Revisit during Session 20 (legal/billing/launch prep) or whenever EmailJS account is ready.

## Session 2 deferred work (silent failures cleanup)
Session 2 Phase A shipped the 4 critical data-loss catches in EmaarDashboardV2.jsx (watchlist, price alerts x3). The remaining cleanup is real but not launch-blocking and was deferred so we could move to the schema foundation faster.

What still needs doing, in priority order:

### Phase A.5 — Email-related silent failures in dashboard (8 catches)
EmaarDashboardV2.jsx lines 1158, 1221, 1231, 1269, 3034, 3049, 3062, 3509. Welcome emails on signup/login, email verification flows, trial warning emails (expired / 3-day / 1-day urgent). These are wrapped in try/catch with empty catches so the user thinks the email sent when it didn't. Lower urgency than data loss because:
- Welcome emails can be re-sent manually
- Verification emails have a "resend" button on screen
- Trial warning emails are server-side notifications, recoverable
Fix: same pattern as Phase A. Use safeAsyncWithToast where notify is in scope, plain safeAsync otherwise. Context strings: welcome-email-login, email-verify-signup, welcome-email-signup, verify-email-resend, trial-expired-email, trial-3d-email, trial-1d-email, welcome-email-google.

### Phase B — Lower-priority dashboard catches (5 catches)
EmaarDashboardV2.jsx lines 2602 (AI insights cache), 3008 (login history write), 3325 (notification mark read), 3535 (recent activity write), 4969 (plan upgrade after checkout). Most of these are background operations the user doesn't directly trigger. Line 4969 is the exception — if a user pays and the plan field doesn't update, that's a real bug, but Paddle webhooks should backfill it on the server side eventually.

### Phase C — Document the silent-by-design catches (6 sites)
EmaarDashboardV2.jsx lines 1974, 2537, 2958, 2974, 3520, 3521. localStorage / sessionStorage / history.pushState / Firestore listener cleanup. These are CORRECT to ignore. Add a one-line comment inside each catch like /* intentional: storage may be unavailable in private browsing */ so future devs don't think they're bugs.

### Phase D — All AdminPanel.jsx catches (~42 of them)
Same three categories. Most of admin's catches are localStorage writes for filter persistence (silent-by-design, just need comments). About 15 are real Firestore writes that need fixing — campaign saves, audit logs, organisation settings, community updates. Notable: AdminPanel.jsx already imports emailjs correctly at line 6, so any email-related catches there are real and need the same treatment as Phase A.5.

### Phase E — React error boundaries
Originally part of Session 2 plan. Wrap each top-level tab in src/components/ErrorBoundary.jsx so a crash in one tab doesn't kill the whole app. Skipped because the existing safeAsync helpers cover the most common failure modes (Firestore writes), and a tab crash from a React render error is rare. Worth doing before launch but not blocking.

When to do this: Sessions 2.5 / 2.6 / 2.7 — small, focused follow-ups slotted in between bigger sessions when there is appetite. Total time estimate: 2-3 hours of careful editing across all 5 phases. Each phase is independent and can be done in any order.

## Two Handover detail modals (deferred from Session 3)
EmaarDashboardV2.jsx has two parallel Handover detail modals:
- hv* set: state at lines 2528-2533, modal at line 3926. Fields used: status, delayRisk, delayMonths, gracePeriodMonths, escrowPct, inspectionsPassed, inspectionsFailed, developerOnTimeRate, totalUnits, contractedHandover, expectedHandover, reraStatus, lastSiteVisit, milestonesCurrent, milestonesNext.
- hdv* set: state at lines 2520-2526, modal at line 4069. Fields used: status, delayRisk, expectedDate, lostRentalPerMonth, milestones, reraNo, escrowBank, gracePeriod, delayPenalty, onTimeHistory, notes, source.

Both modals render from a different "selected handover project" state. Both have copy-to-clipboard share buttons that produce different message templates. The two modals likely represent different views or different versions of the same feature. Cannot determine which is actually shown to users without running the dashboard and clicking handover entries.

Action: during Session 17 (perf and code-quality pass), open the Handover tab in dev mode and confirm which modal opens on click. If only one renders, delete the other and its state. If both render in different contexts, rename them so the prefixes are not confusable (handoverDetail* vs handoverConstruction* for example).

Not a launch blocker — the duplicate is internal code mess, not a user-visible bug.

## Migrate non-project seed data to Firestore (Session 19+ work)
Deferred from Session 6 audit. The following seed data sources were intentionally left out of the projects-only migration and need to be migrated to their own Firestore collections in a later session:

### From utils/seedData.js
- `SEED_DATA.market` → needs new `marketStats` collection in schema
- `SEED_DATA.communities` → already defined in schema spec Section 4.2 as `communities`
- `SEED_DATA.dldVolumes` → needs new `dldVolumes` collection in schema
- `SEED_DATA.priceHistory` → needs new `priceHistory` collection in schema
- `SEED_DATA.overviewKpis` → needs new `overviewKpis` collection in schema (or merge into marketStats)
- Plus any other top-level keys not yet enumerated

Tabs that depend on these: DLDVolumesTab, MarketTab, MortgageTab, NeighbourhoodsTab, OverviewTab, PriceHistoryTab, YieldsTab.

Action when ready:
1. Extend docs/schema-v1.md to define the new collections (Section 4)
2. Update firestore.rules to add rules for each new collection
3. Write a migration script following the same dry-run pattern as Session 6
4. Wire each affected tab to read from Firestore instead of from the seedData.js import
5. Delete utils/seedData.js once all 7 tabs are wired

Estimated effort: 1 full session for schema extension + rules, 1 session for migration script, 1 session for tab wiring. Total ~3 sessions in the post-launch polish phase.

## Delete dead inline SEED_DATA in EmaarDashboardV2.jsx
EmaarDashboardV2.jsx line 495 declares `const SEED_DATA = { ... }` which is byte-for-byte identical to utils/seedData.js for the first 30+ lines. It is dead code — nothing imports from the dashboard's local copy because every tab that needs SEED_DATA imports from utils/seedData.js directly.

The full size of the dead block is unknown but likely 400-500 lines. Removing it would shrink EmaarDashboardV2.jsx significantly and reduce the maintenance burden of keeping two copies in sync (right now, anyone who edits seedData.js has no idea there's a dead duplicate to also edit).

Action when ready:
1. Confirm via grep that nothing in the dashboard file or anywhere else references the local SEED_DATA via direct property access (e.g. `SEED_DATA.market` referring to the local one rather than an imported one)
2. Find the closing brace of the inline declaration
3. Delete lines 495 through closing-brace
4. Build, verify nothing broke, commit

Estimated effort: 30-45 minutes. Low-risk cleanup, should be done at the same time as Session 17 (performance pass) or whenever someone is touching the dashboard file for another reason.

## GoldenVisaTab SEED_PROJECTS prop transition
After Session 6 migrates SEED_PROJECTS to Firestore, ProjectsTab will be wired to read from Firestore in Session 11. GoldenVisaTab currently destructures `SEED_PROJECTS` from props at line 12 and uses it as a fallback at line 132. Once both ProjectsTab and GoldenVisaTab are reading from Firestore, the SEED_PROJECTS prop can be removed from the dashboard render and from both tab signatures. Until then, both tabs continue to receive the prop.

Action: cleanup is part of Session 11 (wire ProjectsTab) and Session 12 or 13 (wire GoldenVisaTab). Not a separate task.