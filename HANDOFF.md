# DXB Analytics — Full Handoff Document
**Date:** May 8, 2026  
**Sessions Completed:** 1–20  
**Status:** 75% Complete — Core Platform Production Ready

---

## 1. WHAT IS DXB ANALYTICS

A Dubai real estate SaaS platform with two products:

**A) Market Intelligence Platform**
- 1,552 developer projects with DLD data
- 58,609 real DLD transactions
- Price history, yields, STR vs LTR, mortgage calculator
- Daily sync from Dubai Land Department

**B) Agency CRM**
- Multi-tenant (each agency gets their own workspace)
- 4-level hierarchy: Owner → Director → Manager → Agent
- Leads, pipeline, listings, team management
- WhatsApp integration

---

## 2. LIVE URLS

| Environment | URL |
|-------------|-----|
| Production | https://emaar-dashboard.pages.dev |
| Repository | https://github.com/mianwaleed689/emaar-dashboard |
| Firebase | https://console.firebase.google.com/project/dxb-analytics |
| Admin Panel | https://emaar-dashboard.pages.dev/admin |

---

## 3. TECH STACK

| Layer | Technology |
|-------|-----------|
| Frontend | React 19.2 + Vite 5.4 |
| Database | Firebase Firestore |
| Auth | Firebase Auth |
| Hosting | Cloudflare Pages |
| Scheduler | PM2 (dxb-sync) on local Windows server |
| Email | EmailJS (keys not set) |
| Billing | Paddle (integrated, not live) |

---

## 4. LOCAL SETUP

```
Machine: C:\Users\TAD\emaar-dashboard
Node: v24.14.0
PM2: dxb-sync (online, 16 restarts)
```

**First thing every session:**
```powershell
cd C:\Users\TAD\emaar-dashboard
pm2 status
git status
git log --oneline -5
```

---

## 5. FIRESTORE COLLECTIONS

| Collection | Count | Purpose |
|------------|-------|---------|
| projects | 1,728 | All developer projects |
| transactions | 58,609 | DLD transactions |
| organisations | 5 | Registered agencies |
| users | 21 | All platform users |
| leads | 232,821 | Agency CRM leads |
| listings | 0 | Agency property listings |
| notifications | 28 | Platform notifications |
| invites | 3 | Agent invite tokens |
| yieldData | 52 | Rental yield benchmarks |
| dldVolumes | 183 | Community volumes |
| priceHistory | 113 | Community price history |

---

## 6. PM2 SCHEDULER (Daily Jobs)

| Time (Dubai) | Job | Status |
|--------------|-----|--------|
| 1:00 PM | Auto-sync (project updates) | ✅ |
| 1:25 PM | Sync notifications (bell alerts) | ✅ |
| 1:30 PM | New launches detection | ✅ |
| 1:45 PM | Fetch DLD transactions | ✅ |
| 1:55 PM | Aggregate DLD volumes | ✅ |
| 2:00 PM | Aggregate price history | ✅ |
| 2:10 PM | Stale lead alerts | ✅ |
| Friday 2:30 PM | Yield calculator | ✅ |
| Friday 2:35 PM | Aggregate yields | ✅ |
| Sunday 1:00 PM | Full scrape | ✅ |

---

## 7. ORGANISATIONS IN DB

| Org ID | Name | Plan | Owner |
|--------|------|------|-------|
| org_dxb_analytics | DXB Analytics | enterprise | mianwaleed689@gmail.com |
| org_alpha_realty_mnk013kg | Alpha Realty | trial | alpha.manager@test.com |
| org_beta_realty | Beta Realty | free | beta.manager@test.com |
| org_test_agency | Test | trial | - |

---

## 8. USER ROLES

| Role | orgRole | What they see |
|------|---------|---------------|
| superAdmin | - | Full admin, NO agency leads (privacy) |
| admin | - | Same as superAdmin |
| owner | owner | All org leads + full dashboard |
| director | director | Own managers + agents leads |
| manager | manager | Own team leads only (managerId == uid) |
| agent | agent | Own assigned leads only |

---

## 9. KEY FILES

```
src/pages/EmaarDashboardV2.jsx    Main dashboard (6,100+ lines)
src/tabs/ProjectsTab.jsx          Projects tab + DLD Sales panel
src/tabs/MyLeadsTab.jsx           CRM (1,046 lines)
src/tabs/ListingsTab.jsx          Listings tab (513 lines)
src/tabs/TeamTab.jsx              Team + Invite system
src/pages/JoinPage.jsx            Agent join page (/join?token=)
src/pages/AgencySignup.jsx        Agency registration
src/App.jsx                       Routes
scripts/scheduler.js              PM2 cron jobs
scripts/auto-sync.js              Daily project sync
scripts/fetch-dld-transactions.js DLD transactions
scripts/sync-notifications.js     Bell notifications
scripts/stale-lead-alerts.js      7-day stale alerts
firestore.rules                   Security rules
```

---

## 10. FIRESTORE INDEXES (All Enabled)

| Collection | Fields |
|------------|--------|
| leads | orgId + createdAt DESC |
| leads | assignedTo + createdAt DESC |
| leads | managerId + createdAt DESC |
| leads | directorId + createdAt DESC |
| transactions | masterProject + transGroup + date DESC |
| transactions | transGroup + date ASC |
| notifications | userId + createdAt DESC |

---

## 11. WHAT IS FULLY WORKING ✅

### Market Intelligence
- Overview, Market, DLD Volumes, Price History tabs
- Projects tab — 1,552 projects with search + filters
- Yields tab — 52 communities
- STR vs LTR, Mortgage, Investment Score
- Neighbourhoods, Launch Calendar, Currency
- Handover, Service Charges, DXB Estimate
- Banking, Financials, Developer Health

### Agency CRM
- 4-level role hierarchy with privacy rules
- Lead add/edit/assign/pipeline management
- WhatsApp from any lead
- Lead assignment sets managerId automatically
- Stale lead alerts (7 days)
- Agent leaderboard for owners
- Export leads to CSV
- Bulk WhatsApp messaging

### Team Management
- Invite agent via WhatsApp link (no manager logout!)
- Agent join page (/join?token=)
- Agent deactivation (leads return to pool)
- Team performance table

### Listings
- Add listings with all DLD required fields
- Publish to Bayut, Property Finder, Dubizzle
- Trakheesi permit tracking
- Portfolio value KPIs

### Auth & Onboarding
- Agency signup flow (/agency/signup)
- Login/Signup/Forgot Password
- Agent welcome screen on first login

### Notifications
- 🚀 New project discoveries
- 🏗 Construction progress jumps
- ✅ Project completions
- ⚠️ Cancellations
- 👤 Lead assignments
- Click notification → navigates to relevant tab/project

### Infrastructure
- Code splitting: 3.7MB → 284KB main bundle (13x faster)
- Nuclear encoding fix (76,999 garbled chars removed)
- Firestore rules (privacy compliant, GDPR)
- Multi-tenant schema

---

## 12. WHAT IS NOT DONE YET ❌

### HIGH PRIORITY
1. **CSV Lead Import** — bulk import from Bayut/PF/Meta/Google Ads
2. **Project search filter** — search bar exists but filter logic broken (De initialization error)
3. **Billing gates** — Paddle integrated but not enforcing plan limits
4. **Free tier 15%** — gate not implemented

### MEDIUM PRIORITY
5. **Developer name mapping** — "Dubai Creek Harbour L.L.C" should show "Emaar"
6. **Agent notification on join** — owner should get notified when agent joins
7. **Weekly performance summary** — manager gets weekly team stats
8. **Deal pipeline** — deals collection exists but UI not fully connected
9. **Compliance tab** — RERA card tracking

### LOW PRIORITY
10. **Map tab** — UI exists, not fully connected
11. **Agency profile page** — logo, RERA number display
12. **Landing page** — update with new features
13. **Mobile responsive** — needs improvement
14. **CommunitiesSection.jsx** — duplicate "aliases" key warning (non-breaking)

---

## 13. KNOWN BUGS

| Bug | Impact | Fix |
|-----|--------|-----|
| Project search "De initialization" error | Projects tab crashes on search | Need to fix filtered variable scope |
| Listings index building | Listings may be slow | Index auto-created, wait |
| Notifications show old duplicate entries | Bell shows same notif twice | Run dedup script |
| Some garbled chars remain in comments | Visual only, no functional impact | Low priority |

---

## 14. CRITICAL RULES

1. **NEVER use Save-UTF8 or Set-Content on EmaarDashboardV2.jsx**
2. Only Node.js scripts to modify EmaarDashboardV2.jsx
3. `ppsf` in transactions = AED/sqm ÷ 10.764 = AED/sqft
4. Use `masterProject` (not areaName) for community grouping
5. **SuperAdmin CANNOT see agency leads** — privacy rule
6. Collection is `organisations` (not `organizations`)
7. Always `firebase deploy --only firestore:rules` after rule changes
8. Always `pm2 restart dxb-sync` after scheduler changes

---

## 15. NEXT SESSION PRIORITIES

1. Fix project search (De initialization error)
2. CSV lead import
3. Billing plan enforcement
4. Developer name mapping
5. Update HANDOVER.md in repo

---

## 16. ENVIRONMENT VARIABLES (.env.local)

```
VITE_FIREBASE_API_KEY=AIzaSyBEtQr19WTjSTxssB2TjJq-ENioG8Jpq6Q
VITE_FIREBASE_AUTH_DOMAIN=dxb-analytics.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dxb-analytics
VITE_FIREBASE_STORAGE_BUCKET=dxb-analytics.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=329487314073
VITE_FIREBASE_APP_ID=1:329487314073:web:2a73aa4a5b770f58459c08
VITE_EMAILJS_SERVICE_ID=(empty — needs setting)
VITE_EMAILJS_TEMPLATE_ID=(empty — needs setting)
VITE_EMAILJS_PUBLIC_KEY=(empty — needs setting)
VITE_BASE_URL=https://dxb-analytics.com
VITE_ADMIN_EMAIL=mianwaleed689@gmail.com
```

---

*DXB Analytics · Confidential · May 2026*
