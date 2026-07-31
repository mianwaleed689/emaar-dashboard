/**
 * SHARED CLAIM ANALYSIS — one definition, used by both audit tools.
 *
 * audit-claims.js and tab-scorecard.js each carried their own copy of the claim
 * regex, the noise filter and the comment handling. They drifted, and reported
 * different numbers for the same file — 2 unsourced versus 7 for MarketTab.
 *
 * Two tools disagreeing about the same question is precisely the fault being
 * hunted in the product itself. Fixed the same way: one definition, imported.
 */

/** A claim is a string literal holding a figure a reader would act on. */
const CLAIM = /"[^"]*?(?:AED\s?[\d,]+|\d+(?:\.\d+)?%|\b\d{1,3}(?:,\d{3})+\b)[^"]*"/g;

/** Provenance signals: a source, a date, a sample size, a named authority. */
const PROVENANCE = /source|sourced|asOf|as of|verified|DLD|Land Department|ValuStrat|REIDIN|Knight Frank|Provident|Central Bank|CBUAE|Bayut|Property Monitor|Dubai Chronicle|CEIC|Deutsche Bank|Al Jazeera|n\s*=|sample|published|reported|comparative|per\s+\w+\s+20\d\d|20\d\d-\d\d-\d\d|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+20\d\d|FY20\d\d|Q[1-4]\s?20\d\d|\b20\d\d\b/i;

/** Styling and geometry, not content. */
const NOISE = /rgba?\(|#[0-9a-fA-F]{3,8}|\bpx\b|borderRadius|fontSize|fontWeight|gridTemplate|padding|margin|width|height|zIndex|opacity|translate|viewBox|strokeWidth|d="M|gradient|cubic-bezier|@media|keyframes|letterSpacing|lineHeight|boxShadow|flexBasis|minWidth|maxWidth/;

/** The code admitting, in its own words, that a figure is not good. */
const ADMISSION = /unverified|no published source|stale|not confirmed|could not be traced|do not quote|placeholder|dummy|fake\b|hardcoded/i;

/** Minimum length for a string to count as a claim rather than a fragment. */
const MIN_CLAIM_LENGTH = 6;

/** How many lines either side count as "nearby" for provenance. */
const CONTEXT_LINES = 3;

/**
 * Analyse one file's source.
 * @returns {{claims: Array, counts: {total:number, sourced:number, unsourced:number, admitted:number}}}
 */
function analyse(source) {
  const lines = source.split(/\r?\n/);
  const claims = [];
  let inBlock = false;

  lines.forEach((line, i) => {
    const t = line.trim();

    /* Comments are documentation, not claims. JSX comments open with "{/*"
       rather than "/*" — missing that counted prose explaining a past fix as a
       live unsourced figure. */
    if (inBlock) { if (t.includes("*/")) inBlock = false; return; }
    if (/^\{?\/\*/.test(t) && !t.includes("*/")) { inBlock = true; return; }
    if (t.startsWith("//") || t.startsWith("*") || /^\{?\/\*/.test(t)) return;
    if (NOISE.test(line)) return;

    const found = line.match(CLAIM);
    if (!found) return;

    const context = lines
      .slice(Math.max(0, i - CONTEXT_LINES), i + CONTEXT_LINES + 1)
      .join(" ");
    const sourced = PROVENANCE.test(context);
    const admits = ADMISSION.test(context);

    found.forEach(raw => {
      const text = raw.slice(1, -1).trim();
      if (text.length < MIN_CLAIM_LENGTH) return;
      claims.push({
        line: i + 1,
        text: text.length > 74 ? text.slice(0, 74) + "…" : text,
        severity: admits ? "ADMITTED" : sourced ? "ok" : "UNSOURCED",
      });
    });
  });

  return {
    claims,
    counts: {
      total: claims.length,
      sourced: claims.filter(c => c.severity === "ok").length,
      unsourced: claims.filter(c => c.severity === "UNSOURCED").length,
      admitted: claims.filter(c => c.severity === "ADMITTED").length,
    },
  };
}

module.exports = { analyse, CLAIM, PROVENANCE, NOISE, ADMISSION };
