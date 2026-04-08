# Session 0 Audit — Ground Truth Report
**Date:** 8 April 2026

## File sizes
| File | Lines |
|---|---|
| src/EmaarDashboardV2.jsx | 5,415 |
| src/AdminPanel.jsx | 22,873 |

## Tab counts
- Dashboard tabs extracted to src/tabs/: 33
- Admin tabs defined in TABS array: 22
- Admin tabs already extracted to src/admin/: 7
- Admin tabs still inline in AdminPanel.jsx: 15

## Real bug inventory
- Empty catch blocks (dashboard): 21
- Empty catch blocks (admin): 20
- Ungated Firestore listeners (dashboard): 53
- Ungated Firestore listeners (admin): 26
- useState calls (dashboard): 430
- useState calls (admin): 447
- useMemo (dashboard): 0
- useMemo (admin): 1
- useCallback (dashboard): 0
- useCallback (admin): 9
- Inline styles (dashboard): 668
- Inline styles (admin): 4,392
- aria attributes (dashboard): 10
- aria attributes (admin): 0

## Blueprint claims verified against reality
- Paddle "leaked billing token" line 3082: FALSE. It is PADDLE_CLIENT_TOKEN at line 2627, safe by design.
- communityIntel crash bug at line 18,992: FALSE. Fetched via onSnapshot at line 2784.
- Three alert() popups at lines 1233/15461/19309: FALSE. Zero alert() calls in the dashboard.
- emailjs not imported in dashboard: TRUE. Fixed in Session 0.
- Dual scorer getInvestmentScore + calcScore: TRUE. Fix in Session 1.
- Duplicate Handover state hdv*: TRUE. hdv* is dead code. Fix in Session 3.