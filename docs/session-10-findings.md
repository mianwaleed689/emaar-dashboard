# Session 10 Findings - Cron Disconnects Discovered

## ✅ FIXED in Session 10

### Fix #1: Cron-EIBOR wrote to wrong document (commit 5d6271b)
- Cron wrote: `marketData/eibor`
- Mortgage tab reads: `tabData/eiborRates`
- Fix: Cron now dual-writes to both docs with matching schema
- Impact: Mortgage tab will auto-update daily starting next weekday 7am UAE

### Fix #2: BankingTab lead capture was broken + hardcoded EIBOR (commit f4abee3)
- Lead button threw ReferenceError (db/addDoc/collection not imported)
- Banking leads mixed with agency leads in `leads/` collection
- Hardcoded EIBOR_3M = 3.593 used in 5 places
- Fix: Imports added, dedicated `mortgageLeads/` collection, live EIBOR wired
- Impact: First mortgage leads ever capturable + bank partnership revenue unblocked

## 🟡 KNOWN ISSUES - DEFERRED to Session 11+

### Issue #1: DLD-daily cron data shape mismatch
- Cron writes: `communityData/{districtCode}` with `{district, areaName, lastTxnCount, avgPpsf, ...}`
- Cron writes: `marketData/global` with rolling totals
- Cron writes: `developers/{docId}` with daily txn counts
- DLD Volumes tab reads: `dldVolumes` collection with `{community, type, transactions, avgPpsf, volume, change}`
- **Disconnect:** Collection name wrong, field names wrong, schema wrong
- **Users impact:** DLD Volumes tab shows seed data forever (isSeedData: true flag visible)
- **Fix complexity:** 2-3 hours - requires district code to community name mapping + change % calculation vs previous month
- **Priority:** HIGH - this is the DXBiQ-competing tab, needs to show real data at launch

### Issue #2: Other crons unverified
Still need to check:
- cron-news.js — does it write to same doc the News tab reads from?
- cron-financials.js — does it update Financials tab data?
- cron-yields.js — does it update Yields tab data?
- cron-scan-launches.js — does it populate Launch Calendar?
- cron-sync-market.js — market data for Overview/Market tabs?
- cron-currency.js — currency tab live rates?
- weekly-digest.js — email digest subscribers?

**Pattern:** Every cron needs cross-reference verification. The EIBOR + DLD findings suggest there are likely more silent disconnects.

## Next steps (Session 11 suggestions)
1. Fix DLD-daily cron → dldVolumes collection (2-3 hours)
2. Audit remaining 7 crons for same pattern (1 hour)
3. Fix any discovered disconnects (variable time)
4. Then move to Stripe wiring

## Why these bugs existed
Based on audit: codebase grew organically over many sessions. Different sessions added:
- Admin EIBOR tab writing to one path
- Mortgage tab reading from another
- Crons writing to yet another
No single session verified the full chain end-to-end. These disconnects only show up during cross-reference audit like what we just did.