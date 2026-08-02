# DXB ANALYTICS — THE TAB STANDARD

**Written:** 2026-07-31
**Purpose:** one definition of "this tab works", applied identically to all 34
tabs. Without it, 34 tabs get fixed to 34 different standards.

> A tab is a web page someone pays for. It must answer a question correctly, or
> say plainly that it cannot. Those are the only two acceptable states.

---

## THE SEVEN CHECKS

A tab ships only when all seven pass.

### 1. It has a stated job

One sentence: *what question does this page answer?* If nobody can write that
sentence, the tab should not exist. Written at the top of the tab's audit row.

### 2. Every number on screen has a source

Each figure traces to a collection, a document, and a date. No literal arrays
standing in for market data. Where a value is derived, the derivation is one
named function — not repeated inline in three places.

### 3. Every control does something

No control renders unless code narrows or changes data using its value. This is
the defect [FILTER_AUDIT.md](FILTER_AUDIT.md) found on 19 of 64 user-facing
filters. A control that does nothing is worse than a missing one: it tells the
user a lie about the numbers they are looking at.

### 4. Every option matches at least one record

Filter options are **derived from the data**, not hardcoded. An option that
returns zero must not be offered. Where the option list is fixed by nature
(months, bedroom counts), each option carries its count in the label:
`Under Construction (1,216)`.

Precedent: [projectStage.js](src/utils/projectStage.js) — three of four options
on the Projects filter matched **zero** records before it was fixed.

### 5. The controls the job requires are present

A tab missing the filter its question needs is incomplete even if everything
rendered works. Each tab's required controls are listed in its audit row, and
derived from check 1 — not from what happens to be built today.

### 6. Empty, loading and error states are real

- **No data yet** → says so, and says why
- **Filtered to nothing** → "no results for these filters", with a clear-filters action
- **Failed to load** → says it failed

Never a blank panel, never a zero that means "unknown", never a silent `catch {}`.
There are currently **87 empty catch blocks**; a swallowed failure renders as an
inert button.

### 7. One vocabulary per concept

Filter value, badge label and stored field all derive from a single function.
Today `status` has **five** competing definitions. A project can display
"Under Construction" and vanish when filtered for it.

---

## THE FOUR CATEGORIES

Applying check 2 sorts every tab by whether a real source exists. This decides
what "fix" even means.

| | Category | What fixing means |
|---|---|---|
| **A** | Data exists and is wired | Fix filters, add missing controls. Cosmetic-to-moderate. |
| **B** | Data exists locally, not wired | Build the pipeline, then fix filters. This is where the new DLD files land. |
| **C** | Data obtainable but not held | Download the source first, then treat as B. |
| **D** | No source exists anywhere | **Remove the tab, or ship it visibly labelled as unavailable.** |

### On category D

This is the uncomfortable one, and it is the direct consequence of *"no one is
paying for a wrong webpage."*

A tab whose collection does not exist cannot be fixed by better filters. There
are exactly two honest options:

1. **Remove it** — from the sidebar and the router. It is not lost; it is in git.
2. **Ship it labelled** — visible "not yet available", no fabricated numbers, no
   empty panels pretending to load.

What is **not** acceptable is the current third state: a tab that renders
hardcoded numbers as though they were live. `TAB_AUDIT.md` already names this
*"the category most likely to lose a paying customer."*

Removing nine dead tabs and shipping 25 correct ones is a better product than
34 tabs where a quarter are wrong. **The count is not the asset. Being right
is.**

---

## ORDER OF WORK

Shared foundations first — they touch every tab, so doing them last means
redoing the per-tab work.

1. **The global filter bar** — 5 dead controls on all 34 tabs
2. **The shared filter primitive** — derive options from data, attach counts,
   refuse to render an empty control
3. **One vocabulary per concept** — extend the `projectStage.js` pattern to
   status, type, beds, community, developer
4. **Wire the new DLD data** — Yields, Service Charges, Developer Health,
   Competitors, Price History
5. **Per-tab pass** — one tab per commit, seven checks each
6. **Category D decision** — remove or label

---

## PER-TAB RECORD

Each tab gets a row recording: its job sentence, category, which of the seven
checks fail, required controls, and what was done. Kept in
[TAB_REBUILD.md](TAB_REBUILD.md), updated as each tab is completed.
