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