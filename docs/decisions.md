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