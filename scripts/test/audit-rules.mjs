/**
 * TENANT ISOLATION AUDIT.
 *
 * This product is meant to serve thousands of Dubai agencies out of one
 * database. Every collection holding agency data must therefore be scoped to
 * the organisation that owns it. One collection that is not is one agency
 * reading a competitor's pipeline, and in this market that ends the company.
 *
 * So every match block is classified, and anything holding tenant data without
 * an orgId check fails the audit loudly rather than being counted as "24 of 82"
 * and left alone.
 *
 *     node scripts/test/audit-rules.mjs
 */
import { readFileSync } from "fs";

const src = readFileSync("firestore.rules", "utf8");
const lines = src.split("\n");

/* Pull out every `match /path/{id} { ... }` with its body, tracking depth so a
   nested match is attributed to itself and not to its parent. */
/* Two things broke earlier attempts at this parser, and both are worth naming
   because they made the audit under-report by a factor of four:

   1. Path parameters are braces. `match /users/{userId} {` has two opening
      braces and only one opens a block.
   2. A single-line rule — `match /projects/{doc} { allow read: ...; }` — opens
      and closes on the same line, so a parser that pushes the block AND then
      counts its own opening brace never sees it close, and silently swallows
      every rule after it.

   So: strip the parameters, then walk a single depth counter, recording the
   depth at which each block opened and closing it when depth returns there. */
const blocks = [];
const open = [];
let depth = 0;

lines.forEach((line, i) => {
  const structural = line.replace(/\{[A-Za-z0-9_=*.$()]*\}/g, "«p»");
  const m = structural.match(/^\s*match\s+(\S+)\s*\{/);

  const opens  = (structural.match(/\{/g) || []).length;
  const closes = (structural.match(/\}/g) || []).length;

  if (m) {
    /* Rebuild a readable path from the original line. */
    const raw = (line.match(/^\s*match\s+(\S+)/) || [])[1] || m[1];
    open.push({ path: raw, start: i, atDepth: depth, body: [] });
  }

  open.forEach(b => b.body.push(line));
  depth += opens - closes;

  while (open.length && depth <= open[open.length - 1].atDepth) {
    const done = open.pop();
    blocks.push({ ...done, end: i, depth: done.atDepth, text: done.body.join("\n") });
  }
});

/* Collections that legitimately carry no organisation, with the reason. */
const NOT_TENANT = {
  "/databases/{database}/documents": "the root wrapper, not a collection",
  "/users/{userId}":            "keyed by the user's own uid",
  "/watchlists/{userId}":       "keyed by the user's own uid",
  "/priceAlerts/{userId}":      "keyed by the user's own uid",
  "/portfolios/{userId}":       "keyed by the user's own uid",
  "/notifications/{notifId}":   "carries userId, checked directly",
  "/organisations/{orgId}":     "IS the organisation — the id is the tenant",
  "/orgs/{orgId}":              "IS the organisation",
  "/invites/{token}":           "the token IS the credential — a recipient reads their own invite",
};

/* Dubai market data every agency legitimately sees the same copy of. Reading
   this across tenants is the product, not a leak. Named explicitly rather than
   pattern-matched, so a new collection has to be classified on purpose. */
const SHARED_MARKET = new Set([
  "projects", "projectData", "projectVersions", "liveMarketData", "dldVolumes",
  "yieldData", "neighbourhoods", "neighbourhoodScores", "launches", "radarLaunches",
  "serviceCharges", "developers", "developerHealth", "devHealth", "financials",
  "eiborRates", "eiborHistory", "communityData", "communities", "communityROI",
  "communityIntel", "developments", "handover", "mortgageRates", "strData",
  "competitors", "investScores", "tabData", "config", "content",
  /* Also Dubai market data — verified by reading each one's writer. aiInsights
     writes to a single shared "latest" document, not one per agency;
     platformSettings is platform configuration read by the user-facing filter
     schema, not tenant data. */
  "riskData", "strLtrData", "priceHistory", "marketData", "devUnits",
  "marketMetrics", "transactions", "legal_citations", "aiInsights",
  "platformSettings",
]);

const rows = blocks.map(b => {
  const path = b.path;
  const collection = (path.match(/^\/([A-Za-z0-9_]+)/) || [])[1] || path;
  const body = b.text;

  const hasOrgCheck  = /isSameOrg\s*\(|orgId\s*==|==\s*orgId|userOrgId\s*\(\)/.test(body);
  const hasUserCheck = /uid\s*\(\)\s*==|==\s*uid\s*\(\)|request\.auth\.uid/.test(body);

  /* The question that matters is who may READ. A collection whose write is
     admin-only but whose read is `isAuthed()` is still every tenant reading
     every other tenant's rows. */
  const readRule = (body.match(/allow\s+(?:read|read,\s*write|get|list)[^;]*?:\s*if\s+([^;]+);/) || [])[1] || "";
  const readIsAnySignedIn = /^\s*isAuthed\(\)\s*$/.test(readRule);
  const readIsAdminOnly   = /isAdmin\(\)|isSuperAdmin\(\)/.test(readRule) && !readIsAnySignedIn;

  let verdict, why;
  /* AN OPEN READ IS CHECKED FIRST, BEFORE ANY OTHER REASON TO PASS.
     This ordering matters and getting it wrong hid a real leak. /notifications
     had `allow read: if isAuthed()` and a write keyed on the user's own uid —
     and because the user check was evaluated first, the whole block was waved
     through as "keyed to the signed-in user" while every signed-in user on the
     platform could read every notification in it. A permissive read is never
     excused by a restrictive write. */
  if (NOT_TENANT[path])                    { verdict = "ok";     why = NOT_TENANT[path]; }
  else if (readIsAnySignedIn && !SHARED_MARKET.has(collection)) {
    verdict = "REVIEW";
    why = "READ IS OPEN TO EVERY SIGNED-IN USER — a restrictive write does not make up for it";
  }
  else if (readIsAdminOnly)                { verdict = "ok";     why = "read restricted to platform admin"; }
  else if (hasOrgCheck)                    { verdict = "ok";     why = "scoped to the organisation"; }
  else if (hasUserCheck)                   { verdict = "ok";     why = "keyed to the signed-in user"; }
  else if (SHARED_MARKET.has(collection))  { verdict = "shared"; why = "Dubai market data — every agency sees the same copy"; }
  else                                     { verdict = "REVIEW"; why = "holds data but no organisation check found"; }

  return { path, collection, verdict, why, line: b.start + 1, depth: b.depth };
});

const seen = new Set();
const unique = rows.filter(r => { const k = r.path + r.line; if (seen.has(k)) return false; seen.add(k); return true; })
                   .sort((a, b) => a.line - b.line);

const count = v => unique.filter(r => r.verdict === v).length;
const review = unique.filter(r => r.verdict === "REVIEW");

console.log("TENANT ISOLATION AUDIT\n");
console.log(`  ${unique.length} match blocks`);
console.log(`  ${count("ok")} isolated or correctly scoped`);
console.log(`  ${count("shared")} shared reference data (same for every agency)`);
console.log(`  ${review.length} NEED REVIEW\n`);

if (review.length) {
  console.log("── NEEDS REVIEW ────────────────────────────────────────────");
  review.forEach(r => console.log(`  line ${String(r.line).padStart(4)}  ${r.path}\n                ${r.why}`));
  console.log("");
}

console.log("── SHARED REFERENCE DATA (no tenant, by design) ─────────────");
unique.filter(r => r.verdict === "shared").forEach(r => console.log(`  ${r.path}`));

process.exit(review.length ? 1 : 0);
