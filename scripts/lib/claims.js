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
const NOISE = /rgba?\(|#[0-9a-fA-F]{3,8}|\bpx\b|borderRadius|fontSize|fontWeight|gridTemplate|padding|margin|width|height|zIndex|opacity|translate|viewBox|strokeWidth|d="M|gradient|cubic-bezier|@media|keyframes|letterSpacing|lineHeight|boxShadow|\bflex\b|flexBasis|minWidth|maxWidth/;

/**
 * A BUCKET BOUNDARY, not an assertion about the market.
 *
 * "8%+ High Yield" on a filter button is the DEFINITION of a control — the
 * number says where the bucket starts. "Yields average 6.8%" is a claim about
 * the world and needs a source. Flagging the first kind produced five findings
 * across Yields and Map that could only be "fixed" by rewording working UI, and
 * an auditor that demands a citation for a dropdown option trains people to
 * ignore it.
 *
 * ── WHY THE DISCRIMINATOR IS THE KEY, NOT THE STRING ────────────────────────
 *
 * The first attempt matched on the SHAPE of the text — a number, a percent, an
 * optional range. Listing what it actually skipped killed it immediately:
 *
 *   MortgageTab   "3.635%"    <- a live EIBOR rate
 *   PortfolioTab  "12-18%"    <- an asset-class return range
 *   marketFacts   "over 70%"  <- a market claim
 *
 * Bare figures are exactly where the real claims live, and this project has
 * already shipped stale mortgage rates once. A rule that hides them is worse
 * than no rule.
 *
 * The honest signal is the KEY the string sits under. Compare:
 *
 *   { label:"EIBOR 1M", val:"3.635%", note:"Feb 2026" }   <- data in `val`
 *   { k:"8+", label:"8%+ Yield" }                          <- number names a control
 *   { label:"8%+ High Yield", value:high8+" communities" } <- data in `value`
 *
 * A `label:` names a control. A `val:`, `value:`, `rate:` or `irr:` holds the
 * datum. So a figure is a threshold only when it is the value of `label:` —
 * checked against the text immediately preceding the literal, not its shape.
 */
const LABEL_KEY = /\blabel\s*:\s*$/;

/**
 * An RGB triplet passed around as a string, e.g. btnStyle("212,168,67").
 *
 * The claim regex reads "37,211,102" as a number with thousands separators —
 * 37,211 followed by 102 — so WhatsApp green, link blue and the brand gold were
 * all being reported as unsourced figures on the Projects tab. The NOISE filter
 * misses them because the line contains no "rgba(": the colour is assembled
 * inside a helper, somewhere else.
 *
 * Matched only when the ENTIRE string is two or three 0-255 numbers. No claim
 * about the market has ever taken that shape.
 */
const RGB_TRIPLET = /^\s*(?:25[0-5]|2[0-4]\d|1\d\d|\d{1,2})\s*(?:,\s*(?:25[0-5]|2[0-4]\d|1\d\d|\d{1,2})\s*){1,2}$/;

/**
 * A figure the page explicitly declares is NOT a measurement.
 *
 * The `sourced` criterion asks whether a reader can tell where a number came
 * from. "Sell 12% above plan — stress test, not a forecast" answers that
 * completely: it came from nowhere, deliberately, and the page says so. A flip
 * calculator needs a downside and an upside case, and demanding a citation for
 * one would either delete a useful tool or invite a fake citation.
 *
 * Held to a handful of unambiguous phrases. Anyone can defeat this by typing
 * "stress test" beside a fabricated market claim — but that is lying in prose,
 * which no regex was ever going to catch, and is a different failure from a
 * number quietly appearing with no account of itself.
 *
 * This does NOT excuse a number from being right. It records that the page has
 * told the reader what kind of number it is.
 */
const DECLARED_ASSUMPTION = /not a forecast|stress test|rules? of thumb|practitioner guidance|not measured|illustrative/i;

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

    /* matchAll rather than match: the index is needed to see which key the
       literal sits under. */
    const found = [...line.matchAll(CLAIM)];
    if (!found.length) return;

    const context = lines
      .slice(Math.max(0, i - CONTEXT_LINES), i + CONTEXT_LINES + 1)
      .join(" ");
    const sourced = PROVENANCE.test(context) || DECLARED_ASSUMPTION.test(context);
    const admits = ADMISSION.test(context);

    found.forEach(m => {
      const text = m[0].slice(1, -1).trim();
      if (text.length < MIN_CLAIM_LENGTH) return;
      /* Value of a `label:` key — the figure names a control rather than
         asserting anything. See LABEL_KEY above for why this is keyed on the
         property and not on the shape of the text. */
      if (LABEL_KEY.test(line.slice(0, m.index))) return;
      /* A colour, not a figure. See RGB_TRIPLET above. */
      if (RGB_TRIPLET.test(text)) return;
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

module.exports = { analyse, CLAIM, PROVENANCE, NOISE, ADMISSION, LABEL_KEY, RGB_TRIPLET, DECLARED_ASSUMPTION };
