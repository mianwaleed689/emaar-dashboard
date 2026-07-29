# DXB ANALYTICS — HANDOFF STATUS

**Last updated:** 2026-07-29
**Live:** https://emaar-dashboard.vercel.app (Vercel auto-deploys from `main`)

This file exists so no work depends on a chat session surviving. It records what
is done, what is blocked, and what comes next.

---

## 🔴 THREE THINGS ONLY THE OWNER CAN DO

Nothing else in this document matters as much as these.

### 1. Revoke the exposed Resend API key
The key was compiled into the **public** JS bundle and was downloadable by
anyone at `/assets/chunk-admin-*.js`. The current build no longer ships it, but
**the old key stays valid until revoked**.

- Go to https://resend.com/api-keys → revoke the key starting `re_dEoh…`
- Create a new one
- In Vercel: **delete `VITE_RESEND_API_KEY`**, add **`RESEND_API_KEY`** (no `VITE_`
  prefix — that prefix is what published it) and **`EMAIL_FROM`**
- Verify your own domain in Resend. The code sends from `onboarding@resend.dev`,
  which only delivers to your own inbox, so customer email has never worked.

### 2. Test and deploy the Firestore rules
`firestore.rules` is **committed but inert**. Vercel does not deploy Firestore
rules. **Until this is deployed, anyone who signs up can write
`role: "superAdmin"` onto their own user document and read all 232,821 lead
records.** This is the most serious open issue in the product.

- Test first: Firebase Console → Firestore → Rules → **Playground**. Confirm a
  normal user cannot set `role`, and that signup still works.
- Then: `firebase deploy --only firestore:rules`
- Rules were reviewed carefully but **never behaviourally tested** — the emulator
  needs Java, which is not installed on this machine.

### 3. Upgrade Firebase Spark → Blaze
The Firestore **read quota is exhausted** (Spark = 50,000 reads/day). The live
site cannot read data until it resets at midnight Pacific. Blaze includes the
same free tier and only bills beyond it.

**Every remaining data fix is blocked behind this.**

---

## ✅ DONE AND DEPLOYED

Commits: `bbf4999` → `d06c732` → `3e8649a` → `b58bf20`

### Security (verified live with HTTP 401s)
- `api/proxy.js` — was an unauthenticated, CORS-open relay to the Anthropic API
  billed to us. Now requires a Firebase ID token, origin-locked.
- `api/send-email.js` (new) — Resend key moved server-side, admin-only.
- `firestore.rules` — self-promotion to superAdmin closed; duplicate
  `/organisations` match removed (it silently cancelled org scoping); invite
  enumeration closed. **NOT YET DEPLOYED — see item 2 above.**

### Calculation corrections (all verified against sources)
| Fix | Impact |
|---|---|
| Net yield was `gross × 0.78` for every community | 279 communities corrected. Meadows 2 showed 5.0%; real figure 0.6% |
| Flip never subtracted disposal costs | profit was overstated ~AED 180k |
| Flip exit DLD — buyer pays by market convention | +AED 96k on a 2.0M→2.4M flip |
| Affordability ignored existing debts | borrowing overstated ~AED 738k |
| Mortgage fees — VAT, trustee, site plan, knowledge | schedule now matches published 2026 rates |
| STR net yield deducted a flat 2.5pp | now % of revenue + service charge |
| STR/DXB Estimate invented AED 1,500/sqft | removed; they now refuse to compute |
| DXB Estimate fixed ±8% band | now scales with transaction count (only 3 of 281 earn "High") |

### Market data verified against DLD / ValuStrat
Corrected: Avg PPSF `1,863 → 1,692` · apartment yield `7.03% → 7.2%` · villa
yield `4.63% → 4.9%` · villa growth `25.5% → 25.1%` · ValuStrat misattribution
(they publish an index in points, not AED/sqft).

Confirmed exact: AED 917B · 270,000+ transactions · 214,912 sales / AED 682.5B ·
50,974 mortgages / AED 179.26B · 9,556 gifts / AED 57.25B · 193,100 investors ·
AED 154B women investors · Q4 record AED 187.47B.

**The three components reconcile to the AED 917B headline.**

### Code health
- 657 KB of dead admin duplicates deleted (SupportTab, UsersTab,
  NotificationsTab, DigestTab, EiborRatesPanel — all were never imported; the
  live versions are defined inside `AdminPanel.jsx`)
- 113 null bytes removed from `ProjectsTab.jsx` (the file read as binary)
- 89 empty `catch {}` blocks now log — this is why broken actions used to look
  like dead buttons
- 3 files unblocked for ESLint (raw line breaks inside string/regex literals);
  lint errors 9 → 2, unparseable files 3 → 0
- Admin project overrides were loaded as a map but every consumer guarded with
  `Array.isArray()`, so edits were fetched then silently discarded

---

## 📁 KEY FILES CREATED

| File | Purpose |
|---|---|
| `TAB_AUDIT.md` | All 34 tabs verified against the live database: 9 REAL, 9 PARTIAL, 7 EMPTY, 9 HARDCODED |
| `src/data/marketFacts.js` | **Single source of truth** for market figures. Each carries `source`, `asOf`, `verified`. Market and Overview both read from it so they cannot drift |
| `src/utils/yield.js` | Net yield formula. `netYield = gross × (1 − vacancy − mgmt) − serviceChargeDrag` |
| `src/utils/provenance.js` | Classifies data as verified / derived / estimate / unsourced |
| `src/components/SourceBadge.jsx` | The pill that shows provenance on screen |
| `src/utils/audit.js` | `logAudit` / `checkAlerts`, extracted from AdminPanel |
| `src/utils/sendEmail.js` | Client helper calling the server-side email endpoint |

---

## ⏭️ NEXT UP

### Blocked until Blaze (data writes)
1. Off-Plan Share KPI still serves a stale **65%** from Firestore; verified 2025
   share is **over 70%**
2. Duplicate rows — Dubai Investment Park / DIP Second, Liwan1 / Liwan2, Deira /
   Palm Deira, and all ten `DUBAI HILLS – …` entries share identical figures
3. Junk entries presented as communities — "Site A", "WARSAN FIRST DEVELOPMENT",
   "JABEL ALI HILLS", "Madinat Hind 4", "Saih Shuaib 1/2"
4. **Gross yield is still assigned, not measured** — only ~28 distinct values
   across 281 communities, clustered on round halves. Deriving it from the
   67,209 `transactions` records is the single biggest remaining data win
5. Two provenance fields contradict each other: `scoreSource` says 259 records
   are DLD-verified, `source` marks 51 of the same as `research-verified-2026`

### Code-only (can proceed anytime)
6. **Mortgage + Banking** — 6 and 8 hardcoded bank rates, plus a frozen
   `EIBOR_HISTORY`, sitting beside `tabData/eiborRates` which **updates daily and
   is read by nobody**. Highest commercial risk remaining
7. Hide the 7 EMPTY tabs (Listings, Pipeline, Handover, Financials, Compliance,
   STR vs LTR, Service Charges) — all read collections that do not exist
8. `SourceBadge` into the remaining tabs (Map, Projects, Golden Visa, Launch
   Calendar, Handover, Investment Score)
9. Mojibake throughout the UI and email templates — the signup email currently
   reads *"Welcome to DXB Analytics! â‚¬â€ Please verify your email"*
10. 17 `react-hooks/exhaustive-deps` warnings — each a stale-data risk
11. Zero tests. `AdminPanel.jsx` is 22,315 lines; `EmaarDashboardV2.jsx` 6,181

### Still unverified figures (labelled on screen, do not quote to clients)
- "228 active developers, up from 163" — the RERA registry lists **2,200+**
  licensed developers, so the DLD attribution was wrong
- "131,504 units launched by Oct 2025"
- "6.55% blended gross yield" — REIDIN is paywalled

---

## ⚠️ CONTEXT A NEW SESSION NEEDS

- **Build tool is Vite, not Create React App.** `VITE_` prefixes are correct;
  `REACT_APP_` variables are dead. An earlier audit claimed the opposite — acting
  on it would have broken the production build.
- **Anything read as `import.meta.env.VITE_*` is compiled into the public
  bundle.** That is how the Resend key leaked. Never put a secret behind `VITE_`.
- **Do not run exploratory Firestore queries.** That is what exhausted the read
  quota. Use `.count()` aggregations, or wait for Blaze.
- **Pushing to `main` deploys to production automatically.** The pre-push hook
  says "Cloudflare will auto-deploy" — that message is stale; it is Vercel.
- `serviceAccountKey.json` is present locally and gitignored. It grants full
  admin and **bypasses Firestore rules**, so it can read data but cannot be used
  to test rules.
- **Verify deploys against the live bundle.** Twice this was the only thing that
  caught a fix that had not actually shipped.
- Bayut data comes from an **unofficial RapidAPI scraper** — a terms-of-service
  and reliability risk for a paid product. Replace before charging customers.
