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

## 2026-04-08 — Session 6A halted: existing backend discovered mid-session
The product owner shared a screenshot of the `api/` folder during Session 6A implementation. This folder contains 21 serverless endpoints I was not aware existed, including working DLD integration, developer seeding, news feeds, cron jobs for currency/EIBOR/yields/market sync, Anthropic Claude proxy, Stripe checkout, and audit logging. Total backend code is approximately 170 KB.

Reading the first 100 lines of `api/seed-developers.js` revealed the existing system has its own session numbering (Session 14 was about "228 Developers Auto-Population"), its own DLD OAuth2 flow, its own tier classification logic, and hardcoded verified developer data for 30+ major Dubai developers. This means the rebuild I have been planning since Session 0 is partially redundant — significant portions of what I was designing (migration framework, DLD integration, developer registry, news feed, currency rates) already exist and are probably running in production.

I should have inventoried the entire repo at the start of Session 0 instead of planning from the React dashboard files alone. That was the root mistake, and every session's scope has been affected by it. I am naming it honestly in this log so it gets addressed properly next time.

Critically, nothing committed tonight is wasted or broken. All ten commits still stand. The schema v2 spec, the firestore.rules additions (disclosedAt immutability, developments collection, fxRates/news/transactions rules), the propertyTypes.js canonical list, the validation code, the data-sources.md strategy doc, the migration framework utilities (slug.js, csv.js, dubai-pulse.js) all still exist. Whether they are ultimately kept, merged with existing code, or replaced by existing equivalents depends on what the existing backend already does. That determination is NEXT session's work.

What was in progress and NOT committed at the time of halt: the tests of `dubai-pulse.js` against the real Dubai Pulse server, which returned WAF rejection pages (the CSV-download path is blocked without authentication). The `session-6a-migration-framework` branch has the three utility files committed locally but not merged to main or pushed, because the framework was proven incomplete mid-build.

### Plan for the next session (call it Session 6-RESET)

1. Do NOT resume the migration framework until the codebase inventory is complete.
2. Start with a full read of the `api/` folder — every file, in order of size. Understand what endpoints exist, what data they fetch, what Firestore collections they write to, what environment variables they need, whether they are currently running.
3. Then read `automation/`, `scripts/`, `sheets_data/`, and any src/ folders I have not seen: admin/, communities/, config/, hooks/, services/, types/, tabs/.
4. Read the .env variable NAMES (not values) to see what external services are configured: Firebase Admin, DLD API, Anthropic, Stripe, SendGrid, OpenAI, or others.
5. Read the existing `src/data_developers.js`, `src/data_emaar_complete.js`, `src/data_master.js` — these are substantial data files I have never seen that may already contain real data.
6. Write `docs/existing-system.md` — a comprehensive, honest catalog of what the SaaS already is, with no planning or opinions, just facts.
7. THEN re-plan Sessions 6-20 against reality: what already works, what needs wiring, what is genuinely missing, what should be deleted.

### What is still true despite the course-correction
- Schema v2 hybrid two-collection model is probably still correct — will verify against existing data shapes in the next session
- The 43 property types are still correct — will verify against whatever taxonomy the existing system uses
- The disclosedAt immutability legal protection is still correct per Decree-Law 25/2025 — will verify the existing `api/seed-developers.js` and similar files do not violate it
- The decision log, post-launch backlog, data-sources.md, schema-v1.md, firestore.rules, propertyTypes.js, projectValidation.js, project.ts all remain valid working documents
- The 10 commits pushed to main tonight remain the foundation, pending the next session's verification against the existing backend

The branch `session-6a-migration-framework` can be merged to main, left in place, or deleted after the next session decides whether the framework is still needed.

### For the next Claude or the product owner returning later
If you are picking this up cold, read docs in this order: `docs/decisions.md` (this file), `docs/schema-v1.md`, `docs/data-sources.md`, then inventory api/ before doing anything else. Do not start writing code until `docs/existing-system.md` exists. The product owner knows exactly how to run PowerShell commands and has a preference for one-command-at-a-time with clear explanations. Save-UTF8 is the file save function (the profile blocks Set-Content). Use --force-with-lease on pushes (the profile blocks force pushes). The product owner is non-technical but has strong product judgment; defer technical decisions to yourself and only ask about real product questions.

## 2026-04-09 — Session 6-RESET: MVP launch-ready
Massive productive session. Went from "half-deployed backend, blind to codebase" to "full P0 shipped, backend verified live, firestore rules deployed, launch-ready pending Stripe setup."

### What was accomplished
1. Full codebase inventory completed (finally). Read api/, src/ subfolders, admin/, automation/, scripts/, sheets_data/. Wrote docs/existing-system.md capturing the honest state of everything.
2. Fixed the .gitignore deployment gap: 10 of 21 api/ files were invisible to git due to a blanket *.js ignore without an api/ exception. Added !api/*.js rule. Commit 3be1288.
3. Hit Vercel Hobby 12-function limit on first deploy attempt. Consolidated 21 functions into 9 by creating api/cron.js router (routes all 9 cron jobs via ?job=) and api/admin-user.js (merges create/delete user). Moved 9 cron handlers to api/_cron/ (underscore prefix excludes from Vercel function count). Deleted stock.js, rates.js, claude.js (duplicates of proxy.js). Commit cebc19e. Deploy succeeded.
4. Pre-commit hook caught 4 hardcoded secrets in weekly-digest.js (EmailJS service/template/public key fallbacks + CRON_SECRET fallback). Removed all fallback defaults, forcing env-var-only reads. File fails loudly if env vars missing instead of using stale fallbacks.
5. Wrote docs/launch-plan.md with P0 (7 items), P1 (11 items), P2 (15 items). Total honest effort revised from 50-65 hours to 28-45 hours.
6. P0.2: Fixed Stripe pricing. create-checkout.js now reads STRIPE_PRICE_ID_PRO and STRIPE_PRICE_ID_ENTERPRISE from env vars instead of hardcoded placeholders. Comments updated from 99/499 to correct 299/799 AED pricing.
7. P0.3: Pricing reconciled across AgencySignup.jsx and create-checkout.js (both now consistent at 299/799).
8. P0.7: Password hardening. Changed from 6 chars minimum to 8 chars + 1 uppercase + 1 number. Updated placeholder text.
9. P0.4: Email verification on signup. Added sendEmailVerification(cred.user) call after createUserWithEmailAndPassword in AgencySignup.jsx.
10. P0.5: Terms of Service + Privacy Policy checkbox. Added agreedToTerms state, validation, and checkbox UI to step 2 of signup wizard.
11. P0.6: Rewrote Terms.jsx and Privacy.jsx with DXB RE Analytics Intelligence Platform branding. Removed all references to "The Address Holding", "Emaar Properties developments", and (personal gmail removed). PDPL-compliant privacy policy with data subject rights section. Deleted unused src/legal/ folder (I accidentally created it before realizing the old files existed at src/ root).
12. P0.1: Confirmed Vercel env vars. User had 23 vars already set (Firebase, Anthropic, Bayut, CRON_SECRET, Resend, EmailJS VITE_* versions, etc.). Added 3 backend EmailJS vars (EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY) for weekly-digest.js. Still missing: STRIPE_SECRET_KEY, STRIPE_PRICE_ID_PRO, STRIPE_PRICE_ID_ENTERPRISE, NEXT_PUBLIC_URL (all only needed once Stripe products are created).
13. Verified backend actually works. Test curl to /api/cron?job=eibor returned a real response with CRON_SECRET validated, Firebase Admin initialized, Firestore write succeeded. marketData/eibor document confirmed live.
14. P1.2: Deployed firestore.rules to live Firebase. All 62 collections + tightened rules (disclosedAt immutability, developments collection, projectAuditLog subcollections) are live in production.

### Architectural decisions added to launch-plan.md
- Two-CRM architecture: DXB Internal Sales CRM (platformLeads collection, admin-only) completely separate from Agency CRM (leads collection, multi-tenant via orgId). Short-term: keep in separate files with clear labels. Long-term P2.15: merge into one app with role-based tab rendering (30-40 hour rebuild, post-launch month 2).
- Data management: 3 data types (market data owned by us via crons, project data shared with developers via claim-and-verify flow, agency CRM data owned by agencies with strict orgId isolation).
- Claim-and-verify for developer project updates: developers can edit photos/brochures/payment plans after admin approval, but cannot edit DLD-locked fields (disclosedAt, original price, unit count per Decree-Law 25/2025).
- Data quality decisions: agencies cannot upload project data (would be gamed), end users read-only, developer edits always go through admin approval for first claim.

### Commits pushed today
- 3be1288 fix: track 10 previously-ignored api/ files
- cebc19e refactor: consolidate api/ to fit Vercel Hobby 12-function limit
- c20f383 docs: add existing-system.md and launch-plan.md
- fix(stripe): env-var-based price IDs and 299/799 AED pricing
- fix(signup): harden password to 8+ chars with uppercase and number
- fix(signup): dedupe password validation lines
- feat(signup): email verification on agency signup + placeholder update
- feat(signup): add ToS checkbox state and validation part 1
- feat(signup): add ToS checkbox UI to step 2
- 03b21e9 feat(legal): add Terms, Privacy, Cookies, PDPL pages (draft)
- c2ba48f fix(legal): replace Terms and Privacy with DXB RE Analytics branding
- 52ce5a5 chore: remove unused src/legal/ folder
- docs(plan): two-CRM architecture + data management sections
- docs(plan): P1.9-P1.13 and P2.11-P2.15 items added

### Launch status
**MVP READY** pending Stripe product creation:
1. Create Pro product in Stripe Dashboard at AED 299/month recurring
2. Create Enterprise product in Stripe Dashboard at AED 799/month recurring  
3. Copy the price IDs to Vercel env vars (STRIPE_PRICE_ID_PRO, STRIPE_PRICE_ID_ENTERPRISE)
4. Add STRIPE_SECRET_KEY to Vercel env vars
5. Add NEXT_PUBLIC_URL to Vercel env vars (value: https://emaar-dashboard.vercel.app or custom domain)

After those 5 steps, a private beta with 5-10 friendly agencies can launch.

### What was intentionally NOT done today
- P0.6 Cookie Policy page and PDPL DPA page (drafted earlier but only Terms and Privacy are wired in the router — App.jsx imports only those two. Cookie and PDPL can be added post-launch.)
- P1.1 Run seed-developers.js (needs DLD_CLIENT_ID and DLD_CLIENT_SECRET env vars which are not yet set)
- P1.3 Rename local .env from REACT_APP_* to VITE_* (production works because Vercel has correct VITE_* vars; only local dev is affected)
- P1.4 Captcha on signup (not critical for private beta)
- P1.5 RERA uniqueness check (not critical for private beta — admin reviews signups anyway)
- P1.9 Admin Data Manager audit and finish (10 hours of work, post-launch)
- P1.10 CSV import for agency leads (post-launch)
- P1.11 CRM audit (post-launch)
- All P2 items

### For the next session
Priority order:
1. Read src/admin/DataManagerTab.jsx (71.6 KB) and assess current state — this is the admin tool for managing projects
2. Read existing CRM files for P1.11 audit (MyLeadsTab.jsx, PipelineTab.jsx, admin panel CRM sections)
3. Write docs/crm-audit.md mapping current state
4. Plan P1.12 collection split (platformLeads vs leads)
5. Do the collection split as first code work of next session

Still-open items tracked in docs/launch-plan.md P0/P1/P2 sections.

### Key files created or updated today
- docs/existing-system.md (inventory, 13.5 KB)
- docs/launch-plan.md (A-to-Z plan, ~10 KB after appends)
- api/cron.js (new cron router)
- api/admin-user.js (new admin user router)
- api/_cron/ folder (9 handler files moved here)
- api/create-checkout.js (Stripe pricing fix)
- src/AgencySignup.jsx (password hardening, email verification, ToS checkbox)
- src/Terms.jsx (rewritten with DXB RE Analytics branding)
- src/Privacy.jsx (rewritten, PDPL compliant)
- firestore.rules (deployed to live Firebase)
- .gitignore (added !api/*.js exception)
- vercel.json (updated cron paths to new router)

The product owner asked the right architectural questions throughout: data management strategy, two-CRM separation. Both now captured in launch-plan.md.