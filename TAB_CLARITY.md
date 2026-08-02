# THE CLARITY CHECK

**Written 2026-08-02**, after the Yields tab was rebuilt twice — once for
correct data, then again because the correct data was presented in language
only its author understood.

[TAB_STANDARD.md](TAB_STANDARD.md) asks *"is this tab TRUE?"*
This asks *"can somebody USE it?"* A tab has to pass both.

Run [scripts/dld/check_clarity.mjs](scripts/dld/check_clarity.mjs) against the
live tab. It automates checks 1, 4, 6, 7 and 9.

---

## THE TEN CHECKS

### 1. The first sentence defines the metric in plain words
Before any control, a reader must learn what the number *is*.

> ✅ "Gross yield is what a property earns in rent each year, as a percentage of
> what it costs to buy. A 5% yield means a property bought for AED 2,000,000
> collects AED 100,000 a year in rent."

> ❌ "Median annual Ejari rent over median DLD sale price, 2024 window."

### 2. There is a worked example in real money
Using a real row from the real data, not a made-up one. Show the division.

> ✅ "A 1 bedroom in JVC typically rents for AED 66,000 a year ÷ typically sells
> for AED 1,042,955 = 6.33%"

### 3. What the number does NOT include is stated, loudly
Every metric has an edge. Say where it is before a customer finds it.

> ✅ "This is **gross** yield. It does not subtract service charges, vacancy,
> management fees or maintenance. Net is normally 1–1.5 points lower."

### 4. Every control has a one-line reason to use it
A dropdown with no explanation is a dropdown nobody touches.

> ✅ "How sure do you need to be? — Raise this before an important meeting. A
> yield from 30 deals can move; one from 3,000 will not."

### 5. Every number is judged against a benchmark
A percentage alone is unusable. Is it good?

> ✅ "Typical for Dubai. The Dubai-wide middle is 5.62%, so you are right on the norm."

### 6. No option is offered that returns nothing
If a segment has no qualifying data, the control does not render it. The Yields
tab shows four segment buttons, not five — Warehouses is absent because no
warehouse cleared the evidence threshold.

### 7. No jargon. Ever.
Banned in user-facing text, with the replacement that must be used instead:

| Never write | Write instead |
|---|---|
| cell, combination | result |
| bucketed, assigned | — (explain the actual problem) |
| distinct values | — (meaningless to a user) |
| n=, observations, sample size | "based on 4,913 tenancies" |
| minimum observations | "how sure do you need to be?" |
| median, percentile | "the middle of the market" |
| aggregate, dataset, record set | the specific thing |
| DLD, PPSF, LTV, AVM | spell out on first use |

### 8. The evidence is on every row
Not in a footnote. The count that backs a figure sits beside the figure.

### 9. Column meanings are one click away
A "what do these columns mean?" toggle, written for someone who has never seen
the tab.

### 10. It says what to tell the client
An agent's last question is always *"so what do I say?"* Answer it in the tab.

---

## COVERAGE MUST BE DISCLOSED

If a tab covers part of a market, say which part and how big it is. The Yields
tab covered only apartments and villas for a day without ever saying so — the
user had to ask *"what about the rest of the market?"*

State: what is included, what is not, and why.

> Apartments · Villas · Offices · Retail. Land (8.6% of sales) and whole
> buildings (0.3%) are excluded — neither has a per-unit rental yield.

---

## THE TEST THAT MATTERS

> **Hand the tab to an agent who has never seen it. Do not speak.**
> **Can they explain the number to a client in sixty seconds?**

If they ask you a question, the tab failed and the answer belongs on screen.
