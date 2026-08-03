# CONNECTING YOUR LEAD SOURCES

**Written 2026-08-03.** Before this, the CRM offered fifteen lead sources and
every one of them was typed in by hand. There was no webhook anywhere in `api/`.
An agency paying for Property Finder was re-keying its own enquiries.

Endpoint: **`POST /api/leads-inbound?source=<source>&orgId=<agency>`**

---

## 1. WHAT HAPPENS TO A LEAD WHEN IT ARRIVES

1. **Parsed** into one shape, whatever it came from.
2. **Checked for a duplicate** — same phone or same email within 30 days. If it
   matches, the new enquiry is added as a note on the existing lead rather than
   creating a second one, so two agents do not ring the same buyer.
3. **Routed** to an agent by a stated rule (§4).
4. **Written**, and the agent is notified.
5. The **response clock starts** (§5).

### The rule the parser follows

> Read what you can. Flag what you cannot. **Never guess.**

A mis-parsed budget looks exactly like a typed one — nobody checks it, and an
agent quotes a client the wrong figure. So a field that cannot be read is left
empty and the lead is flagged with the reason in words. A human confirming five
fields in ten seconds beats a machine inventing one of them.

Worked example: `parseBudget("3")` returns **nothing**, not AED 3. A bare number
under 1,000 is far likelier a bedroom count or a page number than a budget.

---

## 2. SET THESE FIRST

| Variable | For | Without it |
|---|---|---|
| `INBOUND_LEAD_SECRET` | every source except Meta | The endpoint **refuses all requests**. An open lead intake lets anyone on the internet write into a customer's CRM. |
| `META_APP_SECRET` | Meta | Meta deliveries are rejected — its signature cannot be verified. |
| `META_VERIFY_TOKEN` | Meta | Meta's one-time webhook verification fails. |

Generate the shared secret with something unguessable:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 3. THE FOUR SOURCES, IN THE ORDER THEY SHOULD BE DONE

### a. Email parser — **start here, needs nobody's approval**

Point a mail rule at the endpoint. Every portal that emails you works on day
one, including ones we never integrate directly.

```
POST /api/leads-inbound?source=propertyfinder&orgId=YOUR_ORG_ID
Header: x-intake-secret: <INBOUND_LEAD_SECRET>
Body:   { "subject": "...", "body": "...the email text..." }
```

The parser reads labelled `Field: value` lines and maps the labels each portal
uses — so a portal renaming "Mobile" to "Phone number" costs one line of code,
not a rewrite.

> **These three parsers have not been checked against a real message.** No
> sample of a genuine Property Finder, Bayut or dubizzle notification email was
> available. Each is marked `verified: false`, and **every lead they produce
> arrives flagged for review** until somebody confirms the format against a real
> email. That flag is the honest state, not a placeholder to delete.
>
> **What you can do:** forward one real notification email from each portal and
> the parsers can be confirmed or corrected in minutes, and the flag lifted.

### b. Meta lead forms — self-serve, no partner approval

Meta's Lead Ads webhook is a documented JSON contract, so it is parsed
structurally and does **not** carry the caveat above.

1. In your Meta app, add a **Webhooks** product, subscribe to `leadgen`.
2. Callback URL: `https://<your-domain>/api/leads-inbound?source=meta&orgId=YOUR_ORG_ID`
3. Verify token: whatever you set as `META_VERIFY_TOKEN`.
4. Meta sends a `GET` to verify; the endpoint answers the challenge.

### c. Property Finder · d. Bayut / dubizzle — need a commercial arrangement

Both run partner APIs with webhook delivery. Once you have credentials they drop
in behind the same interface: a new entry in `INTAKE_SOURCES`, a parser, and the
routing, dedupe, notification and response clock are already there.

---

## 4. WHO GETS THE LEAD

Tried in order, and **the reason is recorded on the lead** — "the system
decided" is what makes agents distrust a CRM.

| Rule | When |
|---|---|
| **The agent marketing that listing** | The enquiry names a property one of your agents holds. They already know the unit. |
| **An agent who covers that community** | Otherwise — and the least busy of them, so it is shared evenly. |
| **Least busy overall** | Otherwise. Round-robin that self-corrects. |
| **Left unassigned** | If nobody can take it. |

**An agent whose broker card (BRN) has lapsed is never given a lead** — the same
check the Listings tab uses. If every agent's card has lapsed the lead waits, and
says so.

---

## 5. THE RESPONSE CLOCK

Speed to first contact predicts conversion better than anything else an agency
can measure, and almost nobody in Dubai measures it well. My Leads now shows
**Typical reply time** across the desk, and the wait on each answered lead.

- Measured from arrival to the first **call, WhatsApp, email, viewing or offer**
  logged against the lead. Writing a note is not contacting anybody, and does
  not stop the clock.
- **Median, not average.** One lead answered three weeks late would drag a mean
  into uselessness while the typical reply was four minutes.
- A lead nobody has touched is reported as **still waiting**, never as a fast
  response.

---

## 6. WHAT THIS DOES NOT DO

- It does not send anything to a portal. Nothing here publishes listings.
- It does not chase the lead, auto-reply, or contact anyone.
- It does not judge lead quality. There is no score — see
  [LAUNCH_READINESS.md](LAUNCH_READINESS.md) B-15 for why five of them were removed.
- The three portal email parsers are **unverified** until you forward a real
  message from each. Every lead they create says so on its face.

---

## 7. TESTED

55 assertions in [scripts/test/intake.test.mjs](scripts/test/intake.test.mjs).
The ones that matter most are the refusals:

- a bare `"3"` is refused rather than recorded as a budget of AED 3
- `"around two million-ish"` is reported as unreadable, not rounded to something
- a lead with no phone **and** no email is flagged as uncontactable
- an unworked lead is never reported as a fast response
- names are never used for duplicate matching — *"Mohammed"* is not an identifier
- an agent with a lapsed broker card is never routed a lead
