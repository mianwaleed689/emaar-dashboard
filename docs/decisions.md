# Decision Log

## 2026-04-08 — Stay on Firestore, no Supabase migration
Decision: No database migration for v1.
Reason: Already integrated, no migration risk, cost predictable. Relational benefits achieved via Cloud Functions, denormalized aggregates, and custom claims. Revisit in year 2 only if scale demands.

## 2026-04-08 — Paddle client-side token is NOT a security incident
Decision: Do not rotate PADDLE_CLIENT_TOKEN, do not scrub git history.
Reason: Paddle docs confirm client-side tokens are designed to be public. Cannot make charges, cannot access data. Blueprint was wrong.

## 2026-04-08 — Rebuild DataManagerTab from scratch
Decision: Throw away the existing src/admin/DataManagerTab.jsx (1029 lines) and rebuild from zero in Phase 3.
Reason: User dislikes current setup. Current version reads from projectData + communityROI + emaarProjects prop (an overrides pattern), not a unified projects collection. Rebuilding aligns it with the Firestore source-of-truth architecture.

## 2026-04-08 — Session 0 fix: emailjs import
Decision: Added import emailjs from "@emailjs/browser" at line 14 of src/EmaarDashboardV2.jsx.
Reason: emailjs.send() called 6 times in the dashboard file but never imported. Every welcome/verification email throws ReferenceError. One-line fix.

## 2026-04-08 — .env.example deferred
Decision: Do not commit a .env.example file in Session 0.
Reason: Pre-commit hook blocks all .env* files. Hook is correct to be cautious. Will update hook in a later session to whitelist .env.example specifically. Required env vars are documented below instead.

Required environment variables (put these in your local .env file, which is gitignored):
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_EMAILJS_SERVICE_ID
- VITE_EMAILJS_TEMPLATE_ID
- VITE_EMAILJS_PUBLIC_KEY

## 2026-04-08 — Session 1: Unified scoring across all tabs
Decision: Created src/utils/scoring.js as the single source of truth for investment scoring. All tabs that display scores now import from this file.

What was found:
- The Blueprint claimed calcScore was used 8 times in the main dashboard file — WRONG. It was dead code, never called.
- The real bug was that ProjectsTab, LaunchCalendarTab, and CompetitorsTab each had their own local scoring functions with DIFFERENT thresholds. Same project, different color on different tabs.
- CompetitorsTab even had scoreColor defined TWICE in the same file with different 4-color vs 3-color schemes.

Fix applied:
- Created src/utils/scoring.js with getScore(p), scoreColor(s), scoreLabel(s), calcScore(p) as the canonical exports. Internal 0-10 math with 5 factors (Yield, Value, Handover, Payment, Golden Visa), wrapped to 0-100 for display.
- Unified thresholds: 80+ Strong Buy green, 65+ Buy gold, 50+ Hold amber, below Caution red.
- ProjectsTab: deleted local calcScore/scoreColor/scoreLabel, imported from scoring.js. Visual change: scores now reflect 5-factor math instead of 4-factor.
- LaunchCalendarTab: deleted local scoreColor (85/75/65 thresholds), imported canonical. Visual change: some badges will shift color to match other tabs.
- CompetitorsTab: deleted both local scoreColor definitions (80/65 and 90/75/60), imported canonical. Visual change: chart colors unified with rest of app.
- EmaarDashboardV2.jsx: deleted dead calcScore/scoreColor/scoreLabel block (lines 2055-2067) and stale comment at line 2720. 14 lines of dead code removed.

Build verified: vite build ✓ 840 modules transformed, 5.18s, no errors.

Pre-existing warnings noted but deferred: Firebase dynamic/static import warning, 3.6MB bundle size (will be addressed in Sessions 15 and 17).

## 2026-04-08 — Session 2A: Critical data-loss catches fixed
Decision: Created src/utils/safeAsync.js with three helper functions and used safeAsyncWithToast to fix the four worst silent failures in EmaarDashboardV2.jsx.

What was found in the audit:
- 23 empty catch blocks in EmaarDashboardV2.jsx (more than the original audit's 21)
- ~42 empty catch blocks in AdminPanel.jsx (more than the original audit's 20)
- Three real categories: silent-by-design (localStorage, listener cleanup), real bugs (Firestore writes, email sends), and a few in-between cases
- The Blueprint-era audit numbers were undercounting

What was fixed in Phase A:
- Line 3258 watchlist-save — user adds to watchlist, Firestore write fails, user sees toast instead of silent loss
- Line 3268 price-alerts-save — initial price alerts list save
- Line 4894 price-alert-add — user adds new alert from modal
- Line 4914 price-alert-delete — user removes alert from modal

What was almost shipped wrong:
- The first attempt used .NET String.Replace() which is global substring replacement. The 16-space anchor for line 4894 also matched as a substring inside the 18-space line 4914. If saved, it would have replaced BOTH with the price-alert-add code, making the delete operation log/toast wrong. Caught by simulating the edit in memory before saving. Fixed by switching to line-index-based editing.
- Lesson: never use global substring replace for code edits where similar patterns repeat. Always edit by line index after verifying the line content matches an exact anchor.

Helpers created:
- safeAsync(fn, context) — log only, returns { ok, data?, error? }
- safeAsyncWithToast(fn, context, notify, userMessage?) — log + toast, same return shape
- safeSync(fn, context) — synchronous version for localStorage/sessionStorage

Build verified: vite build ✓ 841 modules, 6.56s, no errors. 5 edits applied: 1 import + 4 catches fixed.

Deferred to backlog: Phase A.5 (8 email catches), Phase B (5 lower-priority dashboard catches), Phase C (6 silent-by-design comments), Phase D (~42 admin catches), Phase E (React error boundaries). Reasoning: Phase A is the only part of Session 2 that affects user-visible data integrity. Everything else is real cleanup but not launch-blocking. Better to move forward to schema/foundation work (Sessions 3-9) than to perfect error handling everywhere before doing the database work that matters more for the first agency.

## 2026-04-08 — Session 3 abandoned: original cleanup tasks were misdiagnosed
Decision: Skip Session 3 entirely and move directly to Session 4 (schema design).

What happened:
1. The Master Plan listed two Session 3 tasks: add seed data banners to tabs, and delete duplicate hdv* Handover state variables.
2. User correctly redirected the focus from "fix specific tabs" to "fix the whole SaaS." We pivoted to building a universal useDataSource hook.
3. During the seed-banner audit, we discovered ProjectsTab is "the brain of the SaaS" — every other tab is a different lens on project data. Cosmetic banner work on ProjectsTab is wasted because Sessions 4-13 will rebuild it as part of the Firestore migration.
4. Re-scoped Session 3 to "duplicate Handover state cleanup only" as a small tactical win.
5. Verified the duplicate state hypothesis with a fresh grep — and found the original audit was WRONG. Both hdv* (lines 2520-2526) and hv* (lines 2528-2533) are alive. They drive two DIFFERENT Handover detail modals at lines 3926 (hv*) and 4069 (hdv*). Deleting hdv* would have broken a working modal in production with ~90 lines of UI: construction status, milestones, RERA number, escrow bank, grace period, delay penalty, developer record, share text.
6. Session 3 has no remaining valid tasks. Abandoning the branch and moving directly to Session 4.

What was created and kept:
- src/components/SampleDataBanner.jsx — the standalone banner component is still useful and stays in the repo even though we did not wire it into any tabs in Session 3. It will be picked up later as part of Sessions 11-13 (wire tabs to Firestore) when we rewrite each tab to read from real data, and the banner pattern naturally fits there.

What goes on the backlog:
- Two Handover detail modals at lines 3926 (hv*) and 4069 (hdv*) need investigation. They have confusingly similar prefixes and overlapping field references. They might be (a) two modals shown in different contexts on purpose, (b) one dead modal hidden by routing, or (c) genuine code duplication where one was a draft of the other. Determining which requires running the app, opening the Handover tab, and inspecting the React tree. Not a launch blocker. Will revisit in Session 17 (performance/code-quality pass).
- Universal useDataSource hook never built. Reasoning above — the work is more useful when the tabs are being rewritten anyway, not as a retrofit on the current versions.

Lesson: Always verify cleanup hypotheses with a fresh grep BEFORE editing. The Session 0 audit was right about most things but wrong about hdv* being dead — it never tested usages, only declarations.

## 2026-04-08 — Session 6 audit: scope locked to projects-only migration
Decision: Migrate only the project-shaped seed data sources (SEED_PROJECTS, SEED_LAUNCHES, SEED_HANDOVERS) to Firestore in Session 6 implementation. Leave the shared SEED_DATA object (market, communities, dldVolumes, priceHistory, overviewKpis) as static seed data for now.

What was found in the audit:
- 6 seed declarations exist across the codebase, but most are not project records.
- The shared utils/seedData.js module is the source of truth for 7 dashboard tabs (DLDVolumes, Market, Mortgage, Neighbourhoods, Overview, PriceHistory, Yields). These hold market statistics, community reference data, DLD volumes, and price history — NOT project records.
- A duplicate inline SEED_DATA exists in EmaarDashboardV2.jsx line 495, byte-identical to the shared module for the first 30+ lines. Dead code, never imported. Marked for deletion in post-launch backlog.
- SEED_PROJECTS lives at EmaarDashboardV2.jsx line 2650 and is passed as a prop to ProjectsTab and GoldenVisaTab. This is the actual project array.
- SEED_LAUNCHES (LaunchCalendarTab line 35) and SEED_HANDOVERS (HandoverTab line 35) are also project-shaped data, just slightly different field conventions.

Reasoning for projects-only scope:
- Project records are "the brain of the SaaS" — every audience (buyers, agents, banks, brokers, agencies, developers) primarily cares about projects.
- The Session 4 schema spec only defines a `projects` collection. Migrating market stats / DLD volumes / price history would require extending the schema spec to define new collections (`marketStats`, `dldVolumes`, `priceHistory`, etc.), which is real design work that should not be rushed.
- Migrating only projects in Session 6 keeps the session finishable in one sitting and unblocks Sessions 7-13 (cloud functions, Data Manager, dashboard wiring) which all depend on real project data being in Firestore.
- The other seed sources will keep working as-is. The 7 tabs that import SEED_DATA continue to read from utils/seedData.js exactly as they do today. Nothing breaks.
- Migrating the remaining seed sources becomes Session 19 or 20 work (post-launch polish) after the schema spec is extended.

What this means for the rest of the rebuild:
- Session 6 implementation (next session) will be: design the field mapping table, write the transformer with dry-run mode, run dry-run, review output, run live-write to Firestore.
- Sessions 7-10 (cloud functions, Data Manager) operate against the migrated projects collection.
- Sessions 11-13 (dashboard tab wiring) replace SEED_PROJECTS / SEED_LAUNCHES / SEED_HANDOVERS references with Firestore queries.
- Tabs that currently read from utils/seedData.js (Market, Overview, etc.) keep working unchanged. No regression.

Document: docs/migration-audit.md captures every detail and is the working spec for Session 6 implementation.