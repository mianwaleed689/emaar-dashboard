# DXB Analytics - Launch Plan

**Date:** 2026-04-09
**Context:** Written after codebase inventory revealed the product is closer to launch than originally thought. Most infrastructure exists; remaining work is configuration, hardening, and polish.
**Target:** Production launch to 1000+ waiting UAE real estate agencies.
**Companion document:** `docs/existing-system.md`

---

## Status at start of this plan
- Backend consolidation commit `cebc19e` deployed successfully to Vercel (9 functions, under Hobby limit)
- Cloudflare Pages serving frontend from latest commit
- 9 cron jobs registered with Vercel scheduler, will start running at their next UTC tick
- Firebase Firestore has 62 collections defined in rules, schema is already enterprise-grade
- Agency signup flow works technically but has hardening gaps
- Stripe billing is configured but has placeholder price IDs

---

## Priority tiers

**P0 = Hard launch blockers.** Agencies will have a broken day-one experience without these. Cannot launch with any P0 unresolved.

**P1 = Soft launch blockers.** Agencies can use the product but will notice something is off. Should be fixed before public launch, acceptable for private beta.

**P2 = Polish.** Post-launch improvements.

---

## P0: Hard launch blockers

### P0.1 - Verify Vercel environment variables (30 min)
Cron jobs will fail silently until these are all set in Vercel Dashboard -> Settings -> Environment Variables.

Backend env vars (all 3 environments: Production, Preview, Development):
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- FIREBASE_PRIVATE_KEY (multi-line with \n literal)
- FIREBASE_SERVICE_ACCOUNT (full JSON string, used by auditLogApi.js)
- FIREBASE_API_KEY (web API key, used by weekly-digest.js)
- ANTHROPIC_API_KEY
- STRIPE_SECRET_KEY (live mode key for production)
- NEXT_PUBLIC_URL (e.g. https://emaar-dashboard.vercel.app)
- BAYUT_RAPIDAPI_KEY
- CRON_SECRET (any strong random string)
- EMAILJS_SERVICE_ID
- EMAILJS_TEMPLATE_ID
- EMAILJS_PUBLIC_KEY
- DLD_CLIENT_ID (only for seed-developers.js)
- DLD_CLIENT_SECRET (only for seed-developers.js)

Frontend env vars:
- VITE_FIREBASE_API_KEY
- VITE_FIREBASE_AUTH_DOMAIN
- VITE_FIREBASE_PROJECT_ID
- VITE_FIREBASE_STORAGE_BUCKET
- VITE_FIREBASE_MESSAGING_SENDER_ID
- VITE_FIREBASE_APP_ID
- VITE_EMAILJS_SERVICE_ID
- VITE_EMAILJS_TEMPLATE_ID
- VITE_EMAILJS_PUBLIC_KEY

Verification: trigger one cron manually via curl with the Bearer token. Should return JSON with rates, not "Unauthorized".

### P0.2 - Fix Stripe placeholder price IDs (1-2 hours)
File: `api/create-checkout.js` lines 19-20 currently have placeholders.

Steps:
1. Log in to Stripe Dashboard
2. Activate UAE payments if not already done
3. Create 2 recurring products: "DXB Analytics Pro" AED 299/month and "DXB Analytics Enterprise" AED 799/month
4. Copy the resulting price_ IDs
5. Update create-checkout.js with real IDs
6. Set STRIPE_SECRET_KEY in Vercel env vars
7. Test end-to-end with Stripe test card 4242 4242 4242 4242

**IMPORTANT:** create-checkout.js has outdated comments saying 99/499 AED. The 299/799 values in AgencySignup.jsx are the INTENDED prices. Update the comments too.

### P0.3 - Reconcile pricing across files (30 min)
Files that must all say AED 299/799:
- src/AgencySignup.jsx lines 32-34 - already correct
- api/create-checkout.js lines 7-8 (header comments) - WRONG
- src/admin/BillingTab.jsx - verify
- src/admin/PricingPlansTab.jsx - verify

### P0.4 - Add email verification to signup (1 hour)
File: `src/AgencySignup.jsx`

After createUserWithEmailAndPassword (line 79), add sendEmailVerification(cred.user).

Update success screen (lines 268-289): "We have sent a verification link to {email}. Click it to activate. Your account will be reviewed within 24 hours after verification."

### P0.5 - Add ToS + Privacy checkbox to signup (1 hour)
File: `src/AgencySignup.jsx` step 2

Add checkbox above Continue button linking to /terms and /privacy. Block advancing to step 3 if unchecked. UAE PDPL legal requirement.

### P0.6 - Write legal pages (2-3 hours)
Four static pages accessible from dashboard footer:
1. Terms of Service
2. Privacy Policy
3. PDPL Data Processing Addendum
4. Cookie Policy

Start from standard UAE SaaS templates, get lawyer-reviewed post-launch.

### P0.7 - Harden password requirements (15 min)
File: `src/AgencySignup.jsx` line 68

Change from 6-char minimum to 8+ chars with 1 uppercase + 1 number.

---

## P1: Soft launch blockers

### P1.1 - Run seed-developers.js once (30 min)
Only after P0.1 done and DLD env vars set.
Call: curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://emaar-dashboard.vercel.app/api/seed-developers
Verify developers/ collection has 100+ docs and marketData/developerRegistry exists.

### P1.2 - Deploy firestore.rules to live Firebase (30 min)
Run: firebase login --reauth then firebase deploy --only firestore:rules --project dxb-analytics

### P1.3 - Rename .env variables REACT_APP_* to VITE_* (15 min)
Affects local dev only. Production works because Vercel has correct VITE_* names.

### P1.4 - Add CAPTCHA to signup (1-2 hours)
Integrate Cloudflare Turnstile into AgencySignup.jsx.

### P1.5 - Add RERA uniqueness check (1 hour)
Prevents agency impersonation. Query Firestore before creating organisation doc.

### P1.6 - Reconcile schema-v1.md with reality (2 hours)
Update Section 4 to match marketData/{type} pattern and actual 13 currencies.

### P1.7 - Wire remaining tabs to Firestore (5-10 hours)
Audit 34 tabs for SEED_ references, replace with Firestore queries.

### P1.8 - Email deliverability setup (1-2 hours)
SPF, DKIM, DMARC records for sending domain.

---

## P2: Polish (post-launch)

### P2.1 - Rotate CRON_SECRET (30 min)
The current CRON_SECRET value was briefly exposed in git history via a comment block in the old weekly-digest.js file. The comment has been sanitized but the value is still in the git log. Low blast radius (it only allows triggering cron jobs manually, and those jobs are idempotent) but should be rotated on principle. Generate a new random value, update the Vercel env var, verify cron jobs still work.

### P2.2 - Move EmailJS to SendGrid or Postmark (4-6 hours)
EmailJS has low monthly limits. For 1000+ agencies, switch to SendGrid or Postmark for better deliverability and volume.

### P2.3 - Expand community tracking from 30 to 200+ (2-3 hours)
Files: api/_cron/cron-sync-market.js and api/sync-market-data.js
Research Bayut locationIds for remaining major Dubai neighbourhoods and add to the COMMUNITIES array.

### P2.4 - Expand developer recognition from 16 to 100+ (1-2 hours)
File: api/scan-launches.js devIdMap
Add Omniyat, Select Group, Deyaar, Wasl, Tiger, Vincitore, Iman, Expo City, H and H, LEOS, Trident, and others with their Bayut IDs.

### P2.5 - Update EIBOR hardcoded fallback quarterly (15 min quarterly)
File: api/_cron/cron-eibor.js
The FALLBACK constant is currently dated March 2026. Update each quarter from centralbank.ae.

### P2.6 - Frontend code splitting (2-4 hours)
Bundle is 3.6 MB (845 KB gzipped). Split by tab using React.lazy() and dynamic imports.

### P2.7 - Clean up scripts/legacy/ (1 hour)
Approximately 60 obsolete fix and migration scripts. Archive or delete.

### P2.8 - Full QA pass on all 34 tabs (6-10 hours)
Systematic walkthrough: loads, buttons, forms, charts, exports, permissions, mobile responsive.

### P2.9 - Automated tests (8-12 hours)
Unit tests for utils, integration tests for Firestore rules, E2E tests for signup flow.

### P2.10 - Monitoring and alerting (2-3 hours)
Vercel logs to Slack or email, Firestore usage alerts, Stripe webhook alerts, uptime monitoring.

---

## Launch readiness checklist

Before announcing to any agency:

- All P0 items complete
- Stripe test transactions work end to end
- At least 2 test agencies successfully signed up and approved
- Dashboard loads in under 3 seconds on 4G mobile
- All legal pages live
- Custom domain configured on Vercel and Cloudflare
- SSL certificate auto-renewing
- Firestore backups enabled
- Firestore rules deployed and tested
- Admin can approve agencies from pending queue
- First cron job has successfully run at least once
- marketData/currency, marketData/eibor, marketData/developerRegistry docs exist and are fresh
- One real agency in private beta has signed up, been approved, logged in, and used at least 3 tabs without bugs

---

## Total honest effort from this point

- P0: 6-8 hours
- P1: 10-15 hours
- P2: 20-30 plus hours (spread over weeks or months post-launch)

**Minimum viable launch:** 6-8 hours of focused P0 work.
**Comfortable launch:** 16-23 hours (P0 plus P1).
**Ambitious launch:** 36 plus hours (everything).

Recommendation: Ship P0 plus critical P1 items (1.1, 1.2, 1.3, 1.8). Hold P1.4 through P1.7 for week 2. Do P2 continuously post launch.

---

## Sequencing for next session (immediately actionable)

1. P0.1 (env vars) - user does this manually in Vercel dashboard, about 30 min
2. P0.2 and P0.3 (Stripe and pricing) - Claude edits files, about 2 hours
3. P0.7 (password hardening) - Claude edits AgencySignup.jsx, about 15 min
4. P0.4 (email verification) - Claude edits AgencySignup.jsx, about 1 hour
5. P0.5 (ToS checkbox) - Claude edits AgencySignup.jsx, about 1 hour
6. P1.2 (deploy firestore.rules) - user runs firebase deploy, about 30 min
7. P1.1 (seed developers) - user curls endpoint, about 30 min
8. P0.6 (legal pages) - Claude drafts templates, user reviews, about 3 hours
9. Full QA pass on signup to approve to login flow, about 1 hour
10. Private beta launch to 5-10 friendly agencies
