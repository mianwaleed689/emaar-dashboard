/**
 * WHETHER A LISTING MAY LAWFULLY BE ADVERTISED.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * WHY THIS EXISTS
 * ───────────────
 * The Listings tab held no Form A, no Trakheesi permit, no broker registration
 * number and no agency registration number. A grep of the whole file for any of
 * them returned nothing. So every listing the product created was, by Dubai
 * rule, unpublishable — and the tab offered a row of buttons that published it
 * anyway.
 *
 * Worse, those buttons lied. Each one ran:
 *
 *     window.open(portal.url, "_blank"); markPublished(listing.id, portal.key);
 *
 * — it opened the portal's generic "post a property" page and immediately wrote
 * `publishedTo: [...]` with a green tick beside it. Nothing had been posted. The
 * agency's own database then said the listing was live on Property Finder. In a
 * business where advertising without a valid permit is a RERA violation, a false
 * record of having advertised is the worst possible thing to keep.
 *
 * THE RULE, IN ONE PLACE
 * ──────────────────────
 * Four things must be true before a Dubai property may be advertised anywhere —
 * portal, agency website, social media, print or billboard:
 *
 *   1. The owner has signed a Form A appointing the agency.
 *   2. A Trakheesi permit has been issued against it, and has not expired.
 *   3. The advert carries that permit number.
 *   4. The broker holding the listing has a valid broker card (BRN), and the
 *      agency has a valid registration (ORN) — the permit is issued against both.
 *
 * `canAdvertise()` returns every reason it fails, not the first, because an
 * agent chasing one missing document at a time takes four times as long.
 *
 * WHAT IS DELIBERATELY NOT HERE
 * ─────────────────────────────
 * No permit fees. Secondary sources disagree on the figures and they differ by
 * permit type; a number printed here would go stale and start lying, which is
 * the failure this codebase has spent weeks removing. Fees belong on the DLD's
 * own page, and the tab links there instead of quoting.
 *
 * Sources in PRODUCT_SPEC.md §10, verified 2026-08-03.
 */
import { canBroker } from "./hr.js";

const DAY = 86400000;
const daysUntil = (d, now = Date.now()) =>
  d ? Math.floor((new Date(d).getTime() - now) / DAY) : null;

/** How long before a permit expires we start warning. */
export const PERMIT_WARN_DAYS = 14;

export const LISTING_STATUS = {
  draft:     { key: "draft",     label: "Draft",        colour: "#6B7280",
               what: "Being prepared. Not advertised anywhere." },
  ready:     { key: "ready",     label: "Ready to post", colour: "#3B82F6",
               what: "Paperwork is complete and the permit is live. It may be advertised." },
  live:      { key: "live",      label: "Advertised",   colour: "#10B981",
               what: "Posted on at least one portal, by you." },
  reserved:  { key: "reserved",  label: "Reserved",     colour: "#F59E0B",
               what: "Under offer. Still owned by the seller." },
  sold:      { key: "sold",      label: "Sold",         colour: "#8B5CF6",
               what: "Transferred. Keep it for the record." },
  withdrawn: { key: "withdrawn", label: "Withdrawn",    colour: "#6B7280",
               what: "Taken off the market by the owner." },
};

/** The four documents a listing needs before it may be advertised. */
export const LISTING_REQUIREMENTS = [
  { key: "formA",
    label: "Form A signed",
    what: "The owner's written appointment of your agency, setting your commission and whether the listing is exclusive.",
    fail: "The owner has not signed a Form A. Without one this property cannot be advertised anywhere — not a portal, not social media, not a billboard." },
  { key: "permitNumber",
    label: "Trakheesi permit number",
    what: "The advertising permit issued by the Land Department against the Form A.",
    fail: "There is no Trakheesi permit number on this listing. The permit number has to appear on the advert itself, and the advert has to match the permit." },
  { key: "permitValid",
    label: "Permit still valid",
    what: "A permit has an expiry date. An advert running on an expired permit is a violation on the day it lapses.",
    fail: "The Trakheesi permit has expired. Anything still advertised under it is a violation until the permit is renewed." },
  { key: "brokerValid",
    label: "Broker card valid",
    what: "The permit is issued against a named broker's registration number.",
    fail: "The agent holding this listing does not have a valid broker card (BRN), so the listing cannot be compliant." },
];

/**
 * May this listing be advertised, and if not, every reason why.
 *
 * @param {object} listing  the listing record
 * @param {object} [agent]  the person holding it — { name, expiries: { brn } }
 * @param {object} [org]    the agency — { orn, expiries: { orn, tradeLicence } }
 */
export function canAdvertise(listing = {}, agent = null, org = null, now = Date.now()) {
  const blocking = [];
  const warnings = [];

  const req = k => LISTING_REQUIREMENTS.find(r => r.key === k);

  if (!listing.formA?.signedAt) blocking.push({ ...req("formA") });

  const permit = String(listing.permitNumber || "").trim();
  if (!permit) {
    blocking.push({ ...req("permitNumber") });
  } else {
    const left = daysUntil(listing.permitExpiresAt, now);
    if (left == null) {
      warnings.push({
        key: "permitNoExpiry", label: "Permit expiry not recorded",
        note: "No expiry date is recorded for this permit, so nobody will be warned before it lapses. Add the date from the permit itself.",
      });
    } else if (left < 0) {
      blocking.push({
        ...req("permitValid"),
        fail: `The Trakheesi permit expired ${Math.abs(left)} day${Math.abs(left) === 1 ? "" : "s"} ago. Anything still advertised under it is a violation until it is renewed.`,
      });
    } else if (left <= PERMIT_WARN_DAYS) {
      warnings.push({
        key: "permitExpiring", label: "Permit expiring",
        note: left === 0
          ? "The Trakheesi permit expires today. Renew it before the advert runs another day."
          : `The Trakheesi permit expires in ${left} day${left === 1 ? "" : "s"}. Renew it before the advert lapses.`,
      });
    }
  }

  /* The broker card. This is why HR and the CRM share a database — a lapsed BRN
     makes every listing that agent holds non-compliant on the same day. */
  if (agent) {
    const b = canBroker(agent, now);
    if (!b.ok) blocking.push({ ...req("brokerValid"), fail: b.reason });
    else if (b.warn) warnings.push({ key: "brnExpiring", label: "Broker card expiring", note: b.reason });
  }

  if (org) {
    const ornLeft = daysUntil(org.expiries?.orn, now);
    if (ornLeft != null && ornLeft < 0) {
      blocking.push({
        key: "orn", label: "Agency registration expired",
        fail: `The agency's registration (ORN) expired ${Math.abs(ornLeft)} days ago. No permit can be issued against it until it is renewed.`,
      });
    } else if (ornLeft != null && ornLeft <= 30) {
      warnings.push({ key: "ornExpiring", label: "Agency registration expiring",
        note: `The agency's ORN expires in ${ornLeft} days. Every future permit depends on it.` });
    }
  }

  return {
    ok: blocking.length === 0,
    blocking,
    warnings,
    /* One sentence for a list row, where there is no space for four reasons. */
    summary: blocking.length === 0
      ? (warnings.length ? warnings[0].note : "Cleared to advertise.")
      : blocking.length === 1
        ? blocking[0].fail
        : `${blocking.length} things stop this being advertised — open it to see them.`,
  };
}

/** Documents held, for a progress line on the card. */
export function complianceProgress(listing = {}, agent = null) {
  const have = [
    Boolean(listing.formA?.signedAt),
    Boolean(String(listing.permitNumber || "").trim()),
    listing.permitExpiresAt ? daysUntil(listing.permitExpiresAt) >= 0 : false,
    agent ? canBroker(agent).ok : true,
  ];
  return { done: have.filter(Boolean).length, total: have.length };
}

/**
 * Portals a listing has been POSTED TO — which is a record of what a human says
 * they did, not of an API call this product made. The wording matters: the old
 * tab called this "Portal Syndication" and showed a tick, which claimed an
 * integration that does not exist.
 */
export const PORTALS = [
  { key: "pf",       name: "Property Finder", colour: "#00C08B", url: "https://www.propertyfinder.ae/en/post-property" },
  { key: "bayut",    name: "Bayut",           colour: "#FF6B35", url: "https://www.bayut.com" },
  { key: "dubizzle", name: "dubizzle",        colour: "#E8003D", url: "https://www.dubizzle.com" },
];

export const POSTED_NOTE =
  "This records that you posted it, and opens the portal for you. DXB Analytics " +
  "does not publish to portals — there is no integration behind this button, and " +
  "ticking it changes nothing on the portal.";

/** An agency-wide view: what is at risk right now. */
export function listingCompliance(listings = [], agentsById = {}, org = null, now = Date.now()) {
  const rows = listings.map(l => ({
    listing: l,
    verdict: canAdvertise(l, agentsById[l.agentId] || null, org, now),
  }));
  const advertised = rows.filter(r => (r.listing.postedTo || []).length > 0);
  const violating  = advertised.filter(r => !r.verdict.ok);
  return {
    rows,
    total: listings.length,
    clear: rows.filter(r => r.verdict.ok).length,
    blocked: rows.filter(r => !r.verdict.ok).length,
    /* The number that should frighten an owner: adverts running that should not be. */
    violating: violating.length,
    violatingRows: violating,
    headline: violating.length
      ? `${violating.length} listing${violating.length === 1 ? " is" : "s are"} marked as posted but ${violating.length === 1 ? "does" : "do"} not meet the advertising rules. Take ${violating.length === 1 ? "it" : "them"} down or fix the paperwork.`
      : rows.filter(r => !r.verdict.ok).length
        ? `${rows.filter(r => !r.verdict.ok).length} listing${rows.filter(r => !r.verdict.ok).length === 1 ? "" : "s"} cannot be advertised yet.`
        : "Every listing meets the advertising rules.",
  };
}
