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