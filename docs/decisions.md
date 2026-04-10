# Decision Log

## 2026-04-08 â€” Stay on Firestore, no Supabase migration
Decision: No database migration for v1.
Reason: Already integrated, no migration risk, cost predictable. Relational benefits achieved via Cloud Functions, denormalized aggregates, and custom claims. Revisit in year 2 only if scale demands.

## 2026-04-08 â€” Paddle client-side token is NOT a security incident
Decision: Do not rotate PADDLE_CLIENT_TOKEN, do not scrub git history.
Reason: Paddle docs confirm client-side tokens are designed to be public. Cannot make charges, cannot access data. Blueprint was wrong.

## 2026-04-08 â€” Rebuild DataManagerTab from scratch
Decision: Throw away the existing src/admin/DataManagerTab.jsx (1029 lines) and rebuild from zero in Phase 3.
Reason: User dislikes current setup. Current version reads from projectData + communityROI + emaarProjects prop (an overrides pattern), not a unified projects collection. Rebuilding aligns it with the Firestore source-of-truth architecture.

## 2026-04-08 â€” Session 0 fix: emailjs import
Decision: Added import emailjs from "@emailjs/browser" at line 14 of src/EmaarDashboardV2.jsx.
Reason: emailjs.send() called 6 times in the dashboard file but never imported. Every welcome/verification email throws ReferenceError. One-line fix.

## 2026-04-08 â€” .env.example deferred
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

## 2026-04-08 â€” Session 1: Unified scoring across all tabs
Decision: Created src/utils/scoring.js as the single source of truth for investment scoring. All tabs that display scores now import from this file.

What was found:
- The Blueprint claimed calcScore was used 8 times in the main dashboard file â€” WRONG. It was dead code, never called.
- The real bug was that ProjectsTab, LaunchCalendarTab, and CompetitorsTab each had their own local scoring functions with DIFFERENT thresholds. Same project, different color on different tabs.
- CompetitorsTab even had scoreColor defined TWICE in the same file with different 4-color vs 3-color schemes.

Fix applied:
- Created src/utils/scoring.js with getScore(p), scoreColor(s), scoreLabel(s), calcScore(p) as the canonical exports. Internal 0-10 math with 5 factors (Yield, Value, Handover, Payment, Golden Visa), wrapped to 0-100 for display.
- Unified thresholds: 80+ Strong Buy green, 65+ Buy gold, 50+ Hold amber, below Caution red.
- ProjectsTab: deleted local calcScore/scoreColor/scoreLabel, imported from scoring.js. Visual change: scores now reflect 5-factor math instead of 4-factor.
- LaunchCalendarTab: deleted local scoreColor (85/75/65 thresholds), imported canonical. Visual change: some badges will shift color to match other tabs.
- CompetitorsTab: deleted both local scoreColor definitions (80/65 and 90/75/60), imported canonical. Visual change: chart colors unified with rest of app.
- EmaarDashboardV2.jsx: deleted dead calcScore/scoreColor/scoreLabel block (lines 2055-2067) and stale comment at line 2720. 14 lines of dead code removed.

Build verified: vite build âœ“ 840 modules transformed, 5.18s, no errors.

Pre-existing warnings noted but deferred: Firebase dynamic/static import warning, 3.6MB bundle size (will be addressed in Sessions 15 and 17).

## 2026-04-08 â€” Session 2A: Critical data-loss catches fixed
Decision: Created src/utils/safeAsync.js with three helper functions and used safeAsyncWithToast to fix the four worst silent failures in EmaarDashboardV2.jsx.

What was found in the audit:
- 23 empty catch blocks in EmaarDashboardV2.jsx (more than the original audit's 21)
- ~42 empty catch blocks in AdminPanel.jsx (more than the original audit's 20)
- Three real categories: silent-by-design (localStorage, listener cleanup), real bugs (Firestore writes, email sends), and a few in-between cases
- The Blueprint-era audit numbers were undercounting

What was fixed in Phase A:
- Line 3258 watchlist-save â€” user adds to watchlist, Firestore write fails, user sees toast instead of silent loss
- Line 3268 price-alerts-save â€” initial price alerts list save
- Line 4894 price-alert-add â€” user adds new alert from modal
- Line 4914 price-alert-delete â€” user removes alert from modal

What was almost shipped wrong:
- The first attempt used .NET String.Replace() which is global substring replacement. The 16-space anchor for line 4894 also matched as a substring inside the 18-space line 4914. If saved, it would have replaced BOTH with the price-alert-add code, making the delete operation log/toast wrong. Caught by simulating the edit in memory before saving. Fixed by switching to line-index-based editing.
- Lesson: never use global substring replace for code edits where similar patterns repeat. Always edit by line index after verifying the line content matches an exact anchor.

Helpers created:
- safeAsync(fn, context) â€” log only, returns { ok, data?, error? }
- safeAsyncWithToast(fn, context, notify, userMessage?) â€” log + toast, same return shape
- safeSync(fn, context) â€” synchronous version for localStorage/sessionStorage

Build verified: vite build âœ“ 841 modules, 6.56s, no errors. 5 edits applied: 1 import + 4 catches fixed.

Deferred to backlog: Phase A.5 (8 email catches), Phase B (5 lower-priority dashboard catches), Phase C (6 silent-by-design comments), Phase D (~42 admin catches), Phase E (React error boundaries). Reasoning: Phase A is the only part of Session 2 that affects user-visible data integrity. Everything else is real cleanup but not launch-blocking. Better to move forward to schema/foundation work (Sessions 3-9) than to perfect error handling everywhere before doing the database work that matters more for the first agency.

## 2026-04-08 â€” Session 3 abandoned: original cleanup tasks were misdiagnosed
Decision: Skip Session 3 entirely and move directly to Session 4 (schema design).

What happened:
1. The Master Plan listed two Session 3 tasks: add seed data banners to tabs, and delete duplicate hdv* Handover state variables.
2. User correctly redirected the focus from "fix specific tabs" to "fix the whole SaaS." We pivoted to building a universal useDataSource hook.
3. During the seed-banner audit, we discovered ProjectsTab is "the brain of the SaaS" â€” every other tab is a different lens on project data. Cosmetic banner work on ProjectsTab is wasted because Sessions 4-13 will rebuild it as part of the Firestore migration.
4. Re-scoped Session 3 to "duplicate Handover state cleanup only" as a small tactical win.
5. Verified the duplicate state hypothesis with a fresh grep â€” and found the original audit was WRONG. Both hdv* (lines 2520-2526) and hv* (lines 2528-2533) are alive. They drive two DIFFERENT Handover detail modals at lines 3926 (hv*) and 4069 (hdv*). Deleting hdv* would have broken a working modal in production with ~90 lines of UI: construction status, milestones, RERA number, escrow bank, grace period, delay penalty, developer record, share text.
6. Session 3 has no remaining valid tasks. Abandoning the branch and moving directly to Session 4.

What was created and kept:
- src/components/SampleDataBanner.jsx â€” the standalone banner component is still useful and stays in the repo even though we did not wire it into any tabs in Session 3. It will be picked up later as part of Sessions 11-13 (wire tabs to Firestore) when we rewrite each tab to read from real data, and the banner pattern naturally fits there.

What goes on the backlog:
- Two Handover detail modals at lines 3926 (hv*) and 4069 (hdv*) need investigation. They have confusingly similar prefixes and overlapping field references. They might be (a) two modals shown in different contexts on purpose, (b) one dead modal hidden by routing, or (c) genuine code duplication where one was a draft of the other. Determining which requires running the app, opening the Handover tab, and inspecting the React tree. Not a launch blocker. Will revisit in Session 17 (performance/code-quality pass).
- Universal useDataSource hook never built. Reasoning above â€” the work is more useful when the tabs are being rewritten anyway, not as a retrofit on the current versions.

Lesson: Always verify cleanup hypotheses with a fresh grep BEFORE editing. The Session 0 audit was right about most things but wrong about hdv* being dead â€” it never tested usages, only declarations.

## 2026-04-08 â€” Session 6 audit: scope locked to projects-only migration
Decision: Migrate only the project-shaped seed data sources (SEED_PROJECTS, SEED_LAUNCHES, SEED_HANDOVERS) to Firestore in Session 6 implementation. Leave the shared SEED_DATA object (market, communities, dldVolumes, priceHistory, overviewKpis) as static seed data for now.

What was found in the audit:
- 6 seed declarations exist across the codebase, but most are not project records.
- The shared utils/seedData.js module is the source of truth for 7 dashboard tabs (DLDVolumes, Market, Mortgage, Neighbourhoods, Overview, PriceHistory, Yields). These hold market statistics, community reference data, DLD volumes, and price history â€” NOT project records.
- A duplicate inline SEED_DATA exists in EmaarDashboardV2.jsx line 495, byte-identical to the shared module for the first 30+ lines. Dead code, never imported. Marked for deletion in post-launch backlog.
- SEED_PROJECTS lives at EmaarDashboardV2.jsx line 2650 and is passed as a prop to ProjectsTab and GoldenVisaTab. This is the actual project array.
- SEED_LAUNCHES (LaunchCalendarTab line 35) and SEED_HANDOVERS (HandoverTab line 35) are also project-shaped data, just slightly different field conventions.

Reasoning for projects-only scope:
- Project records are "the brain of the SaaS" â€” every audience (buyers, agents, banks, brokers, agencies, developers) primarily cares about projects.
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

## 2026-04-08 â€” Session 6A halted: existing backend discovered mid-session
The product owner shared a screenshot of the `api/` folder during Session 6A implementation. This folder contains 21 serverless endpoints I was not aware existed, including working DLD integration, developer seeding, news feeds, cron jobs for currency/EIBOR/yields/market sync, Anthropic Claude proxy, Stripe checkout, and audit logging. Total backend code is approximately 170 KB.

Reading the first 100 lines of `api/seed-developers.js` revealed the existing system has its own session numbering (Session 14 was about "228 Developers Auto-Population"), its own DLD OAuth2 flow, its own tier classification logic, and hardcoded verified developer data for 30+ major Dubai developers. This means the rebuild I have been planning since Session 0 is partially redundant â€” significant portions of what I was designing (migration framework, DLD integration, developer registry, news feed, currency rates) already exist and are probably running in production.

I should have inventoried the entire repo at the start of Session 0 instead of planning from the React dashboard files alone. That was the root mistake, and every session's scope has been affected by it. I am naming it honestly in this log so it gets addressed properly next time.

Critically, nothing committed tonight is wasted or broken. All ten commits still stand. The schema v2 spec, the firestore.rules additions (disclosedAt immutability, developments collection, fxRates/news/transactions rules), the propertyTypes.js canonical list, the validation code, the data-sources.md strategy doc, the migration framework utilities (slug.js, csv.js, dubai-pulse.js) all still exist. Whether they are ultimately kept, merged with existing code, or replaced by existing equivalents depends on what the existing backend already does. That determination is NEXT session's work.

What was in progress and NOT committed at the time of halt: the tests of `dubai-pulse.js` against the real Dubai Pulse server, which returned WAF rejection pages (the CSV-download path is blocked without authentication). The `session-6a-migration-framework` branch has the three utility files committed locally but not merged to main or pushed, because the framework was proven incomplete mid-build.

### Plan for the next session (call it Session 6-RESET)

1. Do NOT resume the migration framework until the codebase inventory is complete.
2. Start with a full read of the `api/` folder â€” every file, in order of size. Understand what endpoints exist, what data they fetch, what Firestore collections they write to, what environment variables they need, whether they are currently running.
3. Then read `automation/`, `scripts/`, `sheets_data/`, and any src/ folders I have not seen: admin/, communities/, config/, hooks/, services/, types/, tabs/.
4. Read the .env variable NAMES (not values) to see what external services are configured: Firebase Admin, DLD API, Anthropic, Stripe, SendGrid, OpenAI, or others.
5. Read the existing `src/data_developers.js`, `src/data_emaar_complete.js`, `src/data_master.js` â€” these are substantial data files I have never seen that may already contain real data.
6. Write `docs/existing-system.md` â€” a comprehensive, honest catalog of what the SaaS already is, with no planning or opinions, just facts.
7. THEN re-plan Sessions 6-20 against reality: what already works, what needs wiring, what is genuinely missing, what should be deleted.

### What is still true despite the course-correction
- Schema v2 hybrid two-collection model is probably still correct â€” will verify against existing data shapes in the next session
- The 43 property types are still correct â€” will verify against whatever taxonomy the existing system uses
- The disclosedAt immutability legal protection is still correct per Decree-Law 25/2025 â€” will verify the existing `api/seed-developers.js` and similar files do not violate it
- The decision log, post-launch backlog, data-sources.md, schema-v1.md, firestore.rules, propertyTypes.js, projectValidation.js, project.ts all remain valid working documents
- The 10 commits pushed to main tonight remain the foundation, pending the next session's verification against the existing backend

The branch `session-6a-migration-framework` can be merged to main, left in place, or deleted after the next session decides whether the framework is still needed.

### For the next Claude or the product owner returning later
If you are picking this up cold, read docs in this order: `docs/decisions.md` (this file), `docs/schema-v1.md`, `docs/data-sources.md`, then inventory api/ before doing anything else. Do not start writing code until `docs/existing-system.md` exists. The product owner knows exactly how to run PowerShell commands and has a preference for one-command-at-a-time with clear explanations. Save-UTF8 is the file save function (the profile blocks Set-Content). Use --force-with-lease on pushes (the profile blocks force pushes). The product owner is non-technical but has strong product judgment; defer technical decisions to yourself and only ask about real product questions.

## 2026-04-09 â€” Session 6-RESET: MVP launch-ready
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
- P0.6 Cookie Policy page and PDPL DPA page (drafted earlier but only Terms and Privacy are wired in the router â€” App.jsx imports only those two. Cookie and PDPL can be added post-launch.)
- P1.1 Run seed-developers.js (needs DLD_CLIENT_ID and DLD_CLIENT_SECRET env vars which are not yet set)
- P1.3 Rename local .env from REACT_APP_* to VITE_* (production works because Vercel has correct VITE_* vars; only local dev is affected)
- P1.4 Captcha on signup (not critical for private beta)
- P1.5 RERA uniqueness check (not critical for private beta â€” admin reviews signups anyway)
- P1.9 Admin Data Manager audit and finish (10 hours of work, post-launch)
- P1.10 CSV import for agency leads (post-launch)
- P1.11 CRM audit (post-launch)
- All P2 items

### For the next session
Priority order:
1. Read src/admin/DataManagerTab.jsx (71.6 KB) and assess current state â€” this is the admin tool for managing projects
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
---

## Session 7 Closing Note — April 9, 2026

**Duration:** ~8 hours intensive build
**Outcome:** Data Manager V2 complete, schema unified, dashboard shows Firestore data

### What landed today

**Data Manager V2 (/admin ? Data Manager):**
- 7 sections: Overview, Developments, Projects, Developers, Communities, Compliance, Claims
- Full CRUD on 4 collections with audit logging
- Bulk operations on all 4 sections: multi-select, archive, publish/draft, CSV export/import (papaparse)
- Advanced Developments form with 5 tabs (Basic, Location, Regulatory, Media, Amenities)
- Real-time publish-readiness indicator
- ~30 commits pushed

**Developer Portal (/developer):**
- New signup path with "I am a Developer" toggle at step 1
- Dedicated dashboard for role=developer users
- Browse unclaimed projects, submit claim with RERA license + evidence URL
- Admin claim queue in Data Manager ? Claims section
- One-click approve/reject with audit logging
- firestore.rules updated with developerClaims collection rules (deployed)

**Schema v1 migration (Option 1 dual-write validated):**
- Deleted 15 Schema v2 projects
- Wrote 5 dashboard-native Schema v1 projects with full fields:
  Emaar Beachfront, Dubai Hills Estate, Sobha Hartland, DAMAC Hills, Bluewaters
- Each project has 3 unit variants in unitBreakdown array
- All 30+ dashboard fields populated (velocityScore, distMetro, amenities, etc)
- Reverted the translation shim in EmaarDashboardV2 (clean architecture)

**Dashboard integration:**
- Projects tab shows 5 hardcoded + 5 Firestore = 10 total
- All cards look identical (Schema v1 native format)
- Comparison modal works across both data sources
- Villa filter shows DAMAC Hills + Dubai Hills Estate
- Apartment filter shows Emaar Beachfront, Sobha Hartland, Bluewaters

**Seed data:**
- 5 developments, 5 projects, 28 developers, 25 communities
- scripts/seed/migrate-to-schema-v1.js — migration script
- scripts/seed/seed-communities.js — 25 communities with market data
- scripts/seed/enrich-developers.js — 20 developers with full data

### Known limitations

1. **Data Manager V2 writes Schema v2 format** — to sync to dashboard, run `node scripts/seed/migrate-to-schema-v1.js` manually. Post-launch task: rewrite save logic to output Schema v1 natively or add "Publish to Dashboard" button.

2. **Remaining 31 dashboard tabs still read legacy collections** — Projects tab proven, others (Market, DLD Volumes, Yields, Handover, etc) still read hardcoded arrays or legacy collections. Each tab needs similar migration when ready.

3. **22 developer drafts unfilled** — boutique/emerging developers not covered by enrichment script. Can be filled via admin UI or CSV import.

### Remaining launch blockers

**Critical (must do before launch):**
1. Stripe product creation at AED 299 (Pro) and AED 799 (Enterprise)
2. Add to Vercel env vars: STRIPE_SECRET_KEY, STRIPE_PRICE_ID_PRO, STRIPE_PRICE_ID_ENTERPRISE, NEXT_PUBLIC_URL
3. Test signup ? checkout ? dashboard flow end-to-end with test card 4242

**Nice-to-have (post-launch):**
- Media upload to Firebase Storage (drag/drop file upload)
- Edit permissions for approved developers (limited field editing)
- DXB Internal Sales CRM (platformLeads Kanban)
- Fill remaining 22 developer drafts
- Per-tab Firestore migration (Option 2 progressive migration)

### Launch recommendation

Ship to 10 friendly agencies first. Collect real feedback. Then iterate.
The product is functionally ready. Do not wait for perfect.

### Files of record

- `src/admin/DataManagerV2/` — 11 files, ~140 KB of admin code
- `src/DeveloperPortal.jsx` — standalone developer dashboard
- `src/EmaarDashboardV2.jsx` — 5,440 lines, Firestore integration working
- `src/AgencySignup.jsx` — dual-mode signup (Agency + Developer)
- `scripts/seed/` — 4 seed/migration scripts
- `docs/decisions.md` — this file

---

## Session 8 Closing Note — April 9, 2026 (continued from Session 7)

**Duration:** ~4 more hours after the original Session 7 closing note
**Outcome:** DXB Sales CRM fully built (4 phases), P1.10/P1.12/P1.13 shipped

### What shipped today (after Session 7 note)

#### 1. P1.10 — CSV Import for Agency Leads ?
- `src/tabs/MyLeadsTab.jsx` — Added "Import CSV" button + `mlImportCsv()` function
- Uses papaparse with flexible column names (name/Name, phone/Phone, etc)
- Dedupes by phone via existing `mlIsDuplicate()` check
- Validates required fields per row with row-number errors
- Confirmation prompt before writing
- Creates leads with orgId for multi-tenant isolation
- Adds "Imported from CSV" audit entry to notes_log
- Commit: `ff5d83f`

#### 2. P1.13 — Agency CRM Labels ?
- `src/tabs/MyLeadsTab.jsx` — Header shows `{orgName} — My Leads`
- `src/tabs/PipelineTab.jsx` — Header shows `{orgName} — Deal Pipeline`
- `src/EmaarDashboardV2.jsx` — Passes `orgName={orgProfile?.name}` to both tabs
- Visual distinction from upcoming DXB Sales internal CRM
- Commit: `32315dc`

#### 3. P1.12 — DXB Internal Sales CRM (Platform Sales Pipeline) ?
**The big one.** Complete SaaS sales CRM built from scratch based on research.

**Research phase:**
- Web-researched 10 top SaaS sales CRMs (Pipedrive, HubSpot, Close.io, Monday, Salesforce, ChartMogul, Attio, Folk, GoHighLevel, Zoho)
- Researched 6 Dubai real estate CRMs (REM, SmartLeads, X-OPP, Goyzer, PropHero, Engage Plus)
- Studied existing DXB codebase CRMs (AdminPanel old Leads with 78K leads, MyLeadsTab with scoring)
- Wrote `docs/dxb-sales-crm-plan.md` (16 KB, 470 lines, full spec)
- Commit: `34c73fa`

**Build phase — 4 phases:**

**Phase 1** — Foundation rewrite (47 KB)
- 9 pipeline stages (Prospect ? Contacted ? Qualified ? Demo Scheduled ? Trial Started ? Negotiating ? Paid ? Churned ? Lost)
- Auto lead scoring 0-100 based on company size, plan interest, stage, recent activity, source, engagement
- Temperature classification (burning 80+, hot 60+, warm 40+, cold <40)
- Stalled lead detection (per-stage thresholds)
- Overdue follow-up detection with red warning banner
- Trial ending soon warning (<3 days, purple banner)
- Stalled leads warning (amber banner)
- 7 KPI stat cards (Total, MRR, ARR, Pipeline, Win Rate, Paid, Burning)
- Rich edit modal with 3 tabs: Details / Activity / Advanced
- Activity logging with counters (calls, emails, meetings, demos, notes)
- Click-to-call (`tel:`), click-to-email (`mailto:`), click-to-WhatsApp (`wa.me/`)
- Tag system with add/remove UI
- Stage history tracking
- Contact language field (English/Arabic/French/Russian/Chinese/Other)
- Full field set: companySize, companyType, website, linkedin, contactTitle, plan, estimatedArr, mrr, trialEndDate, source, assignedTo, nextFollowUpAt
- Firestore audit logging to `platformLeads/{id}/auditLog/` subcollection
- Commit: `a1e3972`

**Phase 2** — Multi-view
- View switcher tabs: Kanban | List | Inbox | Stats
- **List view**: Spreadsheet-style table, sortable columns, multi-select, bulk stage change
- **Stats view**: Pipeline funnel (horizontal bars), revenue metrics grid, lead sources breakdown, top 10 hot leads, stalled leads section
- Commit: `22e7982`

**Phase 3** — Inbox + keyboard shortcuts
- **Inbox view**: Cross-lead activity timeline, filter by type (call/email/meeting/demo/note/whatsapp), last 100 activities, click to jump to lead
- Keyboard shortcuts: N = new lead, K = kanban, L = list, I = inbox, S = stats, / = focus search
- Shortcuts disabled when typing in inputs or modal is open
- Commit: `224c5a5`

**Phase 4** — Auto follow-ups + trial warnings
- `suggestNextFollowUp()` auto-sets `nextFollowUpAt` when stage changes
- `suggestFollowUpNotes()` auto-fills follow-up action hint
- Trial ending soon detection (`isTrialEndingSoon()`)
- Purple banner when trials expire within 3 days
- Stats include `trialEndingSoon` count
- Commit: `28ec7e2`

**Rich seed data**
- `scripts/seed/seed-platform-leads.js` — 10 realistic Dubai leads across all 9 stages
- Full field set: companySize, tags, ARR, stageHistory, notes_log, totalCalls/Emails/Meetings
- Auto-calculated leadScore per seeded lead
- 2 paid (Nakheel Enterprise + Betterhomes Enterprise, MRR 1,598)
- 1 trial (Allsopp & Allsopp)
- 2 demo scheduled (Haus & Haus, LEOS Developments)
- 1 qualified (Fam Properties)
- 1 contacted (Samana Developers)
- 2 prospect (Gulf Sotheby's, Metropolitan Premium)
- 1 churned (Aqua Properties)
- Commit: `2e27e2d`

**UX refinements (post-feedback iteration)**

- **Emoji icons ? inline SVG** — typeIcons object made module-level with Feather-style SVG components for call/email/meeting/demo/note/whatsapp/task. Fixes "??" glyph rendering on some systems. Commit: `2dc3e70`
- **Drag-drop Kanban** — HTML5 native drag-drop, draggedLead + dragOverStage state, drop zone visual feedback, stage change via drop triggers moveStage. Commit: `f7ff9de`
- **Auto-scroll on drag** — Kanban container scrolls when mouse is within 80px of left/right edge during drag. Commit: `ac1ee77`
- **Kanban card redesign** — Wider columns (270 ? 320px), bigger cards (14px padding, 10 radius), bigger fonts, score badge top-right, contact section with divider, stacked ARR/MRR with uppercase labels, larger warning badges. Commit: `a1e3972`
- **Help banner + color-coded types** — Gold banner at top explains "each card is a company you're selling DXB Analytics to". Color-coded left border on cards: Agency=green, Developer=purple, Brokerage=amber, Boutique=cyan, Property Management=pink. Contact name prefixed with "CONTACT:" label. Commit: `68c93dd`
- **Restored quick-move buttons** — Added buttons back alongside drag-drop for precise stage changes (after user feedback that removing them was too aggressive). Full stage label text, hover effects in target stage color. Commit: `f7ff9de`
- **JSX structure fix** — Earlier button insertion put them outside card `</div>`, broke parser. Moved closing div to after buttons block. Commit: `[latest]`

#### 4. Documentation
- `docs/dxb-sales-crm-plan.md` — 16 KB, 470 lines comprehensive spec covering data model, pipeline stages, 4 views, lead scoring formula, CSV import, keyboard shortcuts, build sequence, success metrics, explicit non-goals

---

### Two CRMs clarification (IMPORTANT for future reference)

There are now **TWO separate CRMs** in the system:

**CRM #1: DXB Sales CRM (internal, platform sales)**
- **Location:** `/admin` ? DXB Sales tab
- **Component:** `src/admin/PlatformLeadsTab.jsx` (47 KB)
- **Collection:** `platformLeads/` (admin-only Firestore rules)
- **Users:** DXB Analytics admin team (you)
- **Purpose:** Track agencies/developers you are selling the SaaS platform to
- **Example lead:** "Betterhomes Real Estate is in Negotiating stage for Enterprise plan"

**CRM #2: Agency CRM (customer-facing, multi-tenant)**
- **Location:** `/dashboard` ? My Leads, Pipeline, Team, Listings tabs
- **Components:** `src/tabs/MyLeadsTab.jsx`, `PipelineTab.jsx`, etc
- **Collection:** `leads/` (multi-tenant with orgId via sameOrg() helper)
- **Users:** Agency owners, managers, brokers, agents at paying customer agencies
- **Purpose:** Agencies use this to manage THEIR property buyers/sellers
- **Example lead:** "Ahmed wants 2BR in Dubai Marina, budget AED 2M"

**Key difference:** DXB Sales CRM tracks the SALES FUNNEL (who's buying the platform). Agency CRM tracks property BUYERS (the agencies' own customers). They never share data or collections.

---

### Architecture decisions from Session 8

**Decision 1: Keep DXB Sales CRM and Agency CRM completely separate**
- Different collections (`platformLeads/` vs `leads/`)
- Different access rules (admin-only vs multi-tenant)
- Different pipeline stages (SaaS sales vs property sales)
- Different field sets
- Rationale: Merging would confuse users; separation enforces clear mental model

**Decision 2: Schema v1 migration validated as correct approach**
- Dashboard reads legacy collection names (projects, developers, communityData, etc)
- Data Manager V2 writes Schema v2 collections
- Solution: Migration script translates once, no dashboard changes needed
- Works perfectly in production, proven today with 5 real Dubai projects rendering identical to hardcoded ones

**Decision 3: Agency signup does NOT auto-sync to DXB Sales CRM yet**
- Currently manual: when an agency signs up, you manually drag their CRM card to "Paid" stage
- Future automation planned (30 min work): webhook from signup ? auto-create or auto-update platformLeads entry
- Decided to leave manual for now to avoid blocking launch on automation polish

---

### Current state of P1 items

| # | Item | Status |
|---|---|---|
| P1.1 | Seed developers | ? Done (28 devs) |
| P1.2 | Deploy firestore.rules | ? Done |
| P1.3 | Env var rename | Local dev only, skip |
| P1.4 | CAPTCHA | ? Left |
| P1.5 | RERA uniqueness | ? Left |
| P1.6 | Schema docs reconcile | ? Docs only, skip |
| P1.7 | Wire remaining tabs | ? Partial (Projects tab done, 30+ left) |
| P1.8 | Email deliverability SPF/DKIM | ? DNS access needed |
| P1.9 | Admin Data Manager | ? Done (Data Manager V2) |
| P1.10 | CSV import for leads | ? Done (Session 8) |
| P1.11 | CRM audit | ? Done |
| P1.12 | DXB Internal Sales CRM | ? Done (Session 8, 4 phases) |
| P1.13 | Agency CRM labels | ? Done (Session 8) |

**P1 progress: 10 of 13 done** (up from 6/13 at start of session)

---

### Known issues / tech debt

1. **Large file warning** — `src/admin/PlatformLeadsTab.jsx` is now 1475 lines, past the 1000-line warning. Post-launch, split into smaller files (main component, ListView, StatsView, InboxView, LeadEditModal, helpers)

2. **DXB Sales CRM and agency signup not auto-synced** — when a real agency signs up via /agency/signup, the DXB Sales CRM card doesn't auto-move to "Trial Started" or "Paid". Admin must manually drag it. Future automation planned.

3. **Data Manager V2 still writes Schema v2** — need to run migrate-to-schema-v1.js script manually to sync changes to dashboard. Future: add "Publish to Dashboard" button inside Data Manager.

4. **5 hardcoded SEED_PROJECTS** — still hardcoded in src/EmaarDashboardV2.jsx. Dashboard shows 10 total (5 hardcoded + 5 Firestore). Future: migrate hardcoded to Firestore so everything is editable in Data Manager.

5. **Vite build not in pre-commit hook** — today a broken commit passed pre-commit checks because the hook only checks secrets/file-size/module-syntax, not vite build. A JSX syntax error slipped through and broke Vercel deploy. Fixed within minutes but ideal to add `npx vite build --mode development` to pre-commit.

---

### Launch blockers remaining (same as Session 7)

**Critical:**
1. Stripe product creation at AED 299 Pro and AED 799 Enterprise
2. Add Stripe env vars to Vercel
3. Test signup ? checkout ? dashboard flow end-to-end

**Recommended before launch:**
4. P1.5 RERA uniqueness check (1 hour)
5. P1.4 CAPTCHA on signup (2 hours)
6. Delete 10 sample leads from DXB Sales CRM before going live (30 seconds)

---

### Files created/modified in Session 8

**New files:**
- `docs/dxb-sales-crm-plan.md` — Full CRM spec (16 KB)
- `src/admin/PlatformLeadsTab.jsx` — Rewritten, 1475 lines, 47 KB
- `scripts/seed/seed-platform-leads.js` — 10 rich sample leads

**Modified files:**
- `src/AdminPanel.jsx` — Added DXB Sales nav item + route
- `src/EmaarDashboardV2.jsx` — Passes orgName to MyLeadsTab/PipelineTab
- `src/tabs/MyLeadsTab.jsx` — CSV import + orgName label
- `src/tabs/PipelineTab.jsx` — orgName label
- `firestore.rules` — Added platformLeads + auditLog rules (deployed)
- `docs/decisions.md` — This closing note

---

### Commits from Session 8 (chronological)

1. `ff5d83f` — feat(myleads): P1.10 CSV import for agency leads
2. `32315dc` — feat(crm): P1.13 clear labels for Agency CRM tabs
3. `8d5e726` — docs: Session 7 closing note
4. `828b1f9`, `7f05aed`, `82e1110` — feat(admin): P1.12 DXB Internal Sales CRM (3 attempts to commit AdminPanel wiring due to patch failures)
5. `34c73fa` — docs: complete DXB Sales CRM plan (research-based spec)
6. `a1e3972` — feat(crm): Phase 1 Rewrite DXB Sales CRM with rich features
7. `22e7982` — feat(crm): Phase 2 Multi-view (Kanban/List/Stats)
8. `224c5a5` — feat(crm): Phase 3 Inbox view + keyboard shortcuts
9. `28ec7e2` — feat(crm): Phase 4 Auto follow-ups + trial ending warning
10. `2e27e2d` — feat(seed): rich sample leads with full field set
11. `2dc3e70` — fix(crm): move typeIcons to module scope for InboxView access
12. `ac1ee77` — fix(crm): Kanban drag auto-scroll on edges
13. `68c93dd` — feat(crm): help banner + color-coded company types
14. `f7ff9de` — feat(crm): restore quick-move stage buttons alongside drag-drop

**Total: 14 commits, 1 doc file, ~80 KB of new code**

---

### Session 8 final recommendation (same as Session 7)

**Tomorrow's single priority:** Stripe product setup (30 min in dashboard), add keys to Vercel, test one signup flow end-to-end. Then invite 10 friendly agencies to try it.

**DO NOT build new features until payment works.** The CRM is feature-complete. The product is launch-ready. Everything else is distraction.

**Session 8 signed off:** Thursday 9 April 2026, late evening Dubai time.

---

## Session 8 Closing Note — April 9, 2026 (continued from Session 7)

**Duration:** ~4 more hours after the original Session 7 closing note
**Outcome:** DXB Sales CRM fully built (4 phases), P1.10/P1.12/P1.13 shipped

### What shipped today (after Session 7 note)

#### 1. P1.10 — CSV Import for Agency Leads ?
- `src/tabs/MyLeadsTab.jsx` — Added "Import CSV" button + `mlImportCsv()` function
- Uses papaparse with flexible column names (name/Name, phone/Phone, etc)
- Dedupes by phone via existing `mlIsDuplicate()` check
- Validates required fields per row with row-number errors
- Confirmation prompt before writing
- Creates leads with orgId for multi-tenant isolation
- Adds "Imported from CSV" audit entry to notes_log
- Commit: `ff5d83f`

#### 2. P1.13 — Agency CRM Labels ?
- `src/tabs/MyLeadsTab.jsx` — Header shows `{orgName} — My Leads`
- `src/tabs/PipelineTab.jsx` — Header shows `{orgName} — Deal Pipeline`
- `src/EmaarDashboardV2.jsx` — Passes `orgName={orgProfile?.name}` to both tabs
- Visual distinction from upcoming DXB Sales internal CRM
- Commit: `32315dc`

#### 3. P1.12 — DXB Internal Sales CRM (Platform Sales Pipeline) ?
**The big one.** Complete SaaS sales CRM built from scratch based on research.

**Research phase:**
- Web-researched 10 top SaaS sales CRMs (Pipedrive, HubSpot, Close.io, Monday, Salesforce, ChartMogul, Attio, Folk, GoHighLevel, Zoho)
- Researched 6 Dubai real estate CRMs (REM, SmartLeads, X-OPP, Goyzer, PropHero, Engage Plus)
- Studied existing DXB codebase CRMs (AdminPanel old Leads with 78K leads, MyLeadsTab with scoring)
- Wrote `docs/dxb-sales-crm-plan.md` (16 KB, 470 lines, full spec)
- Commit: `34c73fa`

**Build phase — 4 phases:**

**Phase 1** — Foundation rewrite (47 KB)
- 9 pipeline stages (Prospect ? Contacted ? Qualified ? Demo Scheduled ? Trial Started ? Negotiating ? Paid ? Churned ? Lost)
- Auto lead scoring 0-100 based on company size, plan interest, stage, recent activity, source, engagement
- Temperature classification (burning 80+, hot 60+, warm 40+, cold <40)
- Stalled lead detection (per-stage thresholds)
- Overdue follow-up detection with red warning banner
- Trial ending soon warning (<3 days, purple banner)
- Stalled leads warning (amber banner)
- 7 KPI stat cards (Total, MRR, ARR, Pipeline, Win Rate, Paid, Burning)
- Rich edit modal with 3 tabs: Details / Activity / Advanced
- Activity logging with counters (calls, emails, meetings, demos, notes)
- Click-to-call (`tel:`), click-to-email (`mailto:`), click-to-WhatsApp (`wa.me/`)
- Tag system with add/remove UI
- Stage history tracking
- Contact language field (English/Arabic/French/Russian/Chinese/Other)
- Full field set: companySize, companyType, website, linkedin, contactTitle, plan, estimatedArr, mrr, trialEndDate, source, assignedTo, nextFollowUpAt
- Firestore audit logging to `platformLeads/{id}/auditLog/` subcollection
- Commit: `a1e3972`

**Phase 2** — Multi-view
- View switcher tabs: Kanban | List | Inbox | Stats
- **List view**: Spreadsheet-style table, sortable columns, multi-select, bulk stage change
- **Stats view**: Pipeline funnel (horizontal bars), revenue metrics grid, lead sources breakdown, top 10 hot leads, stalled leads section
- Commit: `22e7982`

**Phase 3** — Inbox + keyboard shortcuts
- **Inbox view**: Cross-lead activity timeline, filter by type (call/email/meeting/demo/note/whatsapp), last 100 activities, click to jump to lead
- Keyboard shortcuts: N = new lead, K = kanban, L = list, I = inbox, S = stats, / = focus search
- Shortcuts disabled when typing in inputs or modal is open
- Commit: `224c5a5`

**Phase 4** — Auto follow-ups + trial warnings
- `suggestNextFollowUp()` auto-sets `nextFollowUpAt` when stage changes
- `suggestFollowUpNotes()` auto-fills follow-up action hint
- Trial ending soon detection (`isTrialEndingSoon()`)
- Purple banner when trials expire within 3 days
- Stats include `trialEndingSoon` count
- Commit: `28ec7e2`

**Rich seed data**
- `scripts/seed/seed-platform-leads.js` — 10 realistic Dubai leads across all 9 stages
- Full field set: companySize, tags, ARR, stageHistory, notes_log, totalCalls/Emails/Meetings
- Auto-calculated leadScore per seeded lead
- 2 paid (Nakheel Enterprise + Betterhomes Enterprise, MRR 1,598)
- 1 trial (Allsopp & Allsopp)
- 2 demo scheduled (Haus & Haus, LEOS Developments)
- 1 qualified (Fam Properties)
- 1 contacted (Samana Developers)
- 2 prospect (Gulf Sotheby's, Metropolitan Premium)
- 1 churned (Aqua Properties)
- Commit: `2e27e2d`

**UX refinements (post-feedback iteration)**

- **Emoji icons ? inline SVG** — typeIcons object made module-level with Feather-style SVG components for call/email/meeting/demo/note/whatsapp/task. Fixes "??" glyph rendering on some systems. Commit: `2dc3e70`
- **Drag-drop Kanban** — HTML5 native drag-drop, draggedLead + dragOverStage state, drop zone visual feedback, stage change via drop triggers moveStage. Commit: `f7ff9de`
- **Auto-scroll on drag** — Kanban container scrolls when mouse is within 80px of left/right edge during drag. Commit: `ac1ee77`
- **Kanban card redesign** — Wider columns (270 ? 320px), bigger cards (14px padding, 10 radius), bigger fonts, score badge top-right, contact section with divider, stacked ARR/MRR with uppercase labels, larger warning badges. Commit: `a1e3972`
- **Help banner + color-coded types** — Gold banner at top explains "each card is a company you're selling DXB Analytics to". Color-coded left border on cards: Agency=green, Developer=purple, Brokerage=amber, Boutique=cyan, Property Management=pink. Contact name prefixed with "CONTACT:" label. Commit: `68c93dd`
- **Restored quick-move buttons** — Added buttons back alongside drag-drop for precise stage changes (after user feedback that removing them was too aggressive). Full stage label text, hover effects in target stage color. Commit: `f7ff9de`
- **JSX structure fix** — Earlier button insertion put them outside card `</div>`, broke parser. Moved closing div to after buttons block. Commit: `[latest]`

#### 4. Documentation
- `docs/dxb-sales-crm-plan.md` — 16 KB, 470 lines comprehensive spec covering data model, pipeline stages, 4 views, lead scoring formula, CSV import, keyboard shortcuts, build sequence, success metrics, explicit non-goals

---

### Two CRMs clarification (IMPORTANT for future reference)

There are now **TWO separate CRMs** in the system:

**CRM #1: DXB Sales CRM (internal, platform sales)**
- **Location:** `/admin` ? DXB Sales tab
- **Component:** `src/admin/PlatformLeadsTab.jsx` (47 KB)
- **Collection:** `platformLeads/` (admin-only Firestore rules)
- **Users:** DXB Analytics admin team (you)
- **Purpose:** Track agencies/developers you are selling the SaaS platform to
- **Example lead:** "Betterhomes Real Estate is in Negotiating stage for Enterprise plan"

**CRM #2: Agency CRM (customer-facing, multi-tenant)**
- **Location:** `/dashboard` ? My Leads, Pipeline, Team, Listings tabs
- **Components:** `src/tabs/MyLeadsTab.jsx`, `PipelineTab.jsx`, etc
- **Collection:** `leads/` (multi-tenant with orgId via sameOrg() helper)
- **Users:** Agency owners, managers, brokers, agents at paying customer agencies
- **Purpose:** Agencies use this to manage THEIR property buyers/sellers
- **Example lead:** "Ahmed wants 2BR in Dubai Marina, budget AED 2M"

**Key difference:** DXB Sales CRM tracks the SALES FUNNEL (who's buying the platform). Agency CRM tracks property BUYERS (the agencies' own customers). They never share data or collections.

---

### Architecture decisions from Session 8

**Decision 1: Keep DXB Sales CRM and Agency CRM completely separate**
- Different collections (`platformLeads/` vs `leads/`)
- Different access rules (admin-only vs multi-tenant)
- Different pipeline stages (SaaS sales vs property sales)
- Different field sets
- Rationale: Merging would confuse users; separation enforces clear mental model

**Decision 2: Schema v1 migration validated as correct approach**
- Dashboard reads legacy collection names (projects, developers, communityData, etc)
- Data Manager V2 writes Schema v2 collections
- Solution: Migration script translates once, no dashboard changes needed
- Works perfectly in production, proven today with 5 real Dubai projects rendering identical to hardcoded ones

**Decision 3: Agency signup does NOT auto-sync to DXB Sales CRM yet**
- Currently manual: when an agency signs up, you manually drag their CRM card to "Paid" stage
- Future automation planned (30 min work): webhook from signup ? auto-create or auto-update platformLeads entry
- Decided to leave manual for now to avoid blocking launch on automation polish

---

### Current state of P1 items

| # | Item | Status |
|---|---|---|
| P1.1 | Seed developers | ? Done (28 devs) |
| P1.2 | Deploy firestore.rules | ? Done |
| P1.3 | Env var rename | Local dev only, skip |
| P1.4 | CAPTCHA | ? Left |
| P1.5 | RERA uniqueness | ? Left |
| P1.6 | Schema docs reconcile | ? Docs only, skip |
| P1.7 | Wire remaining tabs | ? Partial (Projects tab done, 30+ left) |
| P1.8 | Email deliverability SPF/DKIM | ? DNS access needed |
| P1.9 | Admin Data Manager | ? Done (Data Manager V2) |
| P1.10 | CSV import for leads | ? Done (Session 8) |
| P1.11 | CRM audit | ? Done |
| P1.12 | DXB Internal Sales CRM | ? Done (Session 8, 4 phases) |
| P1.13 | Agency CRM labels | ? Done (Session 8) |

**P1 progress: 10 of 13 done** (up from 6/13 at start of session)

---

### Known issues / tech debt

1. **Large file warning** — `src/admin/PlatformLeadsTab.jsx` is now 1475 lines, past the 1000-line warning. Post-launch, split into smaller files (main component, ListView, StatsView, InboxView, LeadEditModal, helpers)

2. **DXB Sales CRM and agency signup not auto-synced** — when a real agency signs up via /agency/signup, the DXB Sales CRM card doesn't auto-move to "Trial Started" or "Paid". Admin must manually drag it. Future automation planned.

3. **Data Manager V2 still writes Schema v2** — need to run migrate-to-schema-v1.js script manually to sync changes to dashboard. Future: add "Publish to Dashboard" button inside Data Manager.

4. **5 hardcoded SEED_PROJECTS** — still hardcoded in src/EmaarDashboardV2.jsx. Dashboard shows 10 total (5 hardcoded + 5 Firestore). Future: migrate hardcoded to Firestore so everything is editable in Data Manager.

5. **Vite build not in pre-commit hook** — today a broken commit passed pre-commit checks because the hook only checks secrets/file-size/module-syntax, not vite build. A JSX syntax error slipped through and broke Vercel deploy. Fixed within minutes but ideal to add `npx vite build --mode development` to pre-commit.

---

### Launch blockers remaining (same as Session 7)

**Critical:**
1. Stripe product creation at AED 299 Pro and AED 799 Enterprise
2. Add Stripe env vars to Vercel
3. Test signup ? checkout ? dashboard flow end-to-end

**Recommended before launch:**
4. P1.5 RERA uniqueness check (1 hour)
5. P1.4 CAPTCHA on signup (2 hours)
6. Delete 10 sample leads from DXB Sales CRM before going live (30 seconds)

---

### Files created/modified in Session 8

**New files:**
- `docs/dxb-sales-crm-plan.md` — Full CRM spec (16 KB)
- `src/admin/PlatformLeadsTab.jsx` — Rewritten, 1475 lines, 47 KB
- `scripts/seed/seed-platform-leads.js` — 10 rich sample leads

**Modified files:**
- `src/AdminPanel.jsx` — Added DXB Sales nav item + route
- `src/EmaarDashboardV2.jsx` — Passes orgName to MyLeadsTab/PipelineTab
- `src/tabs/MyLeadsTab.jsx` — CSV import + orgName label
- `src/tabs/PipelineTab.jsx` — orgName label
- `firestore.rules` — Added platformLeads + auditLog rules (deployed)
- `docs/decisions.md` — This closing note

---

### Commits from Session 8 (chronological)

1. `ff5d83f` — feat(myleads): P1.10 CSV import for agency leads
2. `32315dc` — feat(crm): P1.13 clear labels for Agency CRM tabs
3. `8d5e726` — docs: Session 7 closing note
4. `828b1f9`, `7f05aed`, `82e1110` — feat(admin): P1.12 DXB Internal Sales CRM (3 attempts to commit AdminPanel wiring due to patch failures)
5. `34c73fa` — docs: complete DXB Sales CRM plan (research-based spec)
6. `a1e3972` — feat(crm): Phase 1 Rewrite DXB Sales CRM with rich features
7. `22e7982` — feat(crm): Phase 2 Multi-view (Kanban/List/Stats)
8. `224c5a5` — feat(crm): Phase 3 Inbox view + keyboard shortcuts
9. `28ec7e2` — feat(crm): Phase 4 Auto follow-ups + trial ending warning
10. `2e27e2d` — feat(seed): rich sample leads with full field set
11. `2dc3e70` — fix(crm): move typeIcons to module scope for InboxView access
12. `ac1ee77` — fix(crm): Kanban drag auto-scroll on edges
13. `68c93dd` — feat(crm): help banner + color-coded company types
14. `f7ff9de` — feat(crm): restore quick-move stage buttons alongside drag-drop

**Total: 14 commits, 1 doc file, ~80 KB of new code**

---

### Session 8 final recommendation (same as Session 7)

**Tomorrow's single priority:** Stripe product setup (30 min in dashboard), add keys to Vercel, test one signup flow end-to-end. Then invite 10 friendly agencies to try it.

**DO NOT build new features until payment works.** The CRM is feature-complete. The product is launch-ready. Everything else is distraction.

**Session 8 signed off:** Thursday 9 April 2026, late evening Dubai time.
