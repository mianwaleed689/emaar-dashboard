/**
 * THE DESIGN SYSTEM — the decisions, made once.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * WHY THIS EXISTS
 *
 * Every screen in this product picked its own font sizes and its own colours,
 * element by element. Measured across the ten CRM tabs that produced:
 *
 *   · body text at 9, 10 and 11px — My Leads alone rendered 1,672 nodes at
 *     10px and 670 at 9px, on a screen somebody reads for eight hours
 *   · up to ELEVEN different type sizes on one tab
 *   · ten to twelve different text colours per tab, none of which meant
 *     anything: on Agency, 125 was gold, 418 blue, 69 purple, AED 0 green
 *   · 623 of 650 clickable things on Pipeline under 32px tall
 *   · nine different corner radii on one screen
 *
 * None of that is a styling mistake to be corrected element by element. It is
 * the absence of a system. This file is the system: a screen asks it for a
 * role — "this is a figure", "this is a label", "this is blocked" — and gets
 * the answer. Screens stop choosing.
 *
 * THE RULES IT ENFORCES
 *
 *   1. TYPE HAS A SCALE. Seven sizes, no others. Body is 15px. Nothing under
 *      12px exists, and 12px is only for uppercase labels — never for a
 *      sentence somebody has to read.
 *
 *   2. COLOUR MEANS SOMETHING. Gold is the brand and marks ONE thing per
 *      screen: the action you are meant to take. Red, amber and green are
 *      state — blocked, due, clear — and are never decoration. A figure is
 *      not coloured because it would look nice coloured.
 *
 *   3. EVERYTHING CLICKABLE IS BIG ENOUGH TO HIT. 44px on a phone, 36px on a
 *      desktop, because agents use this standing in a building.
 *
 *   4. SPACING COMES FROM A SCALE. Layout does the spacing, with gap, not
 *      per-element margins that collapse or double.
 *
 * Import the tokens, not the hex. `T` in ../theme is the old flat colour bag;
 * it stays for the twenty-four non-CRM tabs until they are rebuilt too.
 */

/* ── GROUND, PANELS, LINES ─────────────────────────────────────────────────
   The neutrals are biased slightly blue, toward the navy the brand already
   uses. A pure grey on a navy ground reads as an accident; these read as
   chosen. Lines are neutral, NOT gold: the old borders were gold at 12%,
   which tinted every edge on every screen and left nothing for gold to mean. */
export const colour = {
  ground:      "#060B13",
  groundAlt:   "#0A101B",
  panel:       "#0C1523",
  panelHover:  "#111C2E",
  panelSunk:   "#070D17",

  line:        "rgba(150,172,202,0.13)",
  lineStrong:  "rgba(150,172,202,0.26)",

  text:        "#E7EDF6",
  textMuted:   "#95A7BF",
  textFaint:   "#63788F",
  textOn:      "#07101D",   /* on gold or on a solid state colour */

  /* THE BRAND, SPENT IN ONE PLACE.
     Gold marks the action you are meant to take and the thing you are looking
     at. If two things on a screen are gold, one of them is wrong. */
  accent:      "#D8AC48",
  accentHover: "#E5BE63",
  accentSoft:  "rgba(216,172,72,0.13)",
  accentLine:  "rgba(216,172,72,0.35)",
};

/* ── STATE ────────────────────────────────────────────────────────────────
   Four states, each with a text colour, a soft ground and a line. Nothing
   else in the product is allowed to be red, amber or green. */
export const state = {
  critical: { fg: "#F58278", bg: "rgba(239,110,98,0.12)",  line: "rgba(239,110,98,0.34)",  label: "Blocked" },
  warning:  { fg: "#E5AE45", bg: "rgba(224,164,46,0.12)",  line: "rgba(224,164,46,0.32)",  label: "Due" },
  positive: { fg: "#43CCA2", bg: "rgba(52,199,154,0.12)",  line: "rgba(52,199,154,0.30)",  label: "Clear" },
  info:     { fg: "#7FB2E5", bg: "rgba(111,168,220,0.12)", line: "rgba(111,168,220,0.30)", label: "" },
  /* The absence of state. A chip with nothing to say still needs a look. */
  neutral:  { fg: colour.textMuted, bg: "rgba(150,172,202,0.09)", line: colour.line, label: "" },
};

export const TONES = Object.keys(state);
export const toneOf = t => state[t] || state.neutral;

/* ── TYPE ─────────────────────────────────────────────────────────────────
   Two families with different jobs. Fraunces is a display serif: page titles
   and the large figures, where its character reads. Outfit does everything a
   person has to read at length, because a serif at 13px on a dark ground is
   where legibility goes to die.

   Figures carry tabular-nums so a column of money lines up. */
export const font = {
  display: "'Fraunces', Georgia, serif",
  ui:      "'Outfit', system-ui, sans-serif",
};

export const size = { xs: 12, sm: 13, base: 15, md: 17, lg: 21, xl: 27, xxl: 34 };

export const type = {
  /* The name of the page. One per screen. */
  display:   { fontFamily: font.display, fontSize: size.xl,   fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.01em" },
  /* The name of a region within it. */
  title:     { fontFamily: font.display, fontSize: size.lg,   fontWeight: 700, lineHeight: 1.25 },
  /* The name of a card. */
  section:   { fontFamily: font.ui,      fontSize: size.base, fontWeight: 700, lineHeight: 1.3 },
  /* The small uppercase caption over a group. The ONLY use of 12px. */
  label:     { fontFamily: font.ui,      fontSize: size.xs,   fontWeight: 700, lineHeight: 1.2,
               letterSpacing: "0.09em", textTransform: "uppercase" },
  /* Everything a person actually reads. */
  body:      { fontFamily: font.ui,      fontSize: size.base, fontWeight: 400, lineHeight: 1.65 },
  bodyStrong:{ fontFamily: font.ui,      fontSize: size.base, fontWeight: 600, lineHeight: 1.55 },
  /* Secondary detail on a row — still readable, deliberately quieter. */
  small:     { fontFamily: font.ui,      fontSize: size.sm,   fontWeight: 400, lineHeight: 1.55 },
  smallStrong:{fontFamily: font.ui,      fontSize: size.sm,   fontWeight: 600, lineHeight: 1.5 },
  /* Numbers. */
  figure:    { fontFamily: font.display, fontSize: size.xl,   fontWeight: 800, lineHeight: 1.05,
               fontVariantNumeric: "tabular-nums", letterSpacing: "-0.015em" },
  figureSm:  { fontFamily: font.display, fontSize: size.lg,   fontWeight: 800, lineHeight: 1.1,
               fontVariantNumeric: "tabular-nums" },
  /* A number inside a sentence or a table cell. */
  numeric:   { fontFamily: font.ui,      fontSize: size.base, fontWeight: 600, lineHeight: 1.4,
               fontVariantNumeric: "tabular-nums" },
};

/* ── DENSITY ──────────────────────────────────────────────────────────────
   TWO DENSITIES, NOT ONE. This is the mistake the first cut of this system
   made: one body size and one row height applied to everything, including a
   data grid. The result was seven leads visible on a 900px screen. A
   professional terminal shows thirty, and an agency with 418 leads is not
   served by a screen that shows seven of them beautifully.

   `page` is for surfaces somebody READS — a card of prose, a form, a figure.
   `grid` is for surfaces somebody SCANS — a table of 400 rows where the job
   is to find one. Scanning wants tight rows, tabular figures and columns that
   line up; it does not want the generous line height that makes a paragraph
   pleasant. Both still obey the floor: nothing under 12px, ever.

   Change these two numbers and every table in the product changes with them.
   That is the whole reason the system exists. */
export const density = {
  page: { rowH: 48, padY: 12, padX: 16, font: size.base },
  grid: { rowH: 36, padY: 7,  padX: 12, font: size.sm },
};

/* ── SPACE, SHAPE, TARGETS ────────────────────────────────────────────────── */
export const space = { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32, huge: 40, page: 56 };

/* Three radii. Not nine. */
export const radius = { control: 8, card: 14, pill: 999 };

/* Anything a finger or a cursor has to land on. The phone figure is the
   accessibility minimum; the desktop one is what a mouse needs to feel
   reliable. Rows use `row`, which is taller than either because a lead row
   carries two lines. */
export const target = { phone: 44, desktop: 36, row: 56 };

/* ── BREAKPOINTS ──────────────────────────────────────────────────────────
   Two, because two is what the content needs: one column, or more than one.
   `wide` is where a table has room to be a table. */
export const bp = { phone: 700, wide: 1000 };
export const mq = {
  phone: `@media (max-width: ${bp.phone - 1}px)`,
  wide:  `@media (min-width: ${bp.wide}px)`,
};

/* ── THE STYLESHEET ───────────────────────────────────────────────────────
   Hover, focus, media queries and scrollbars cannot be expressed as inline
   styles, and inline styles are how this product is built. So the parts that
   need a real stylesheet live here, injected once, under a `ds-` prefix that
   cannot collide with the twenty-four tabs not yet rebuilt.

   Focus is visible. It was not, anywhere, which makes the product unusable by
   keyboard and fails the basics of accessibility. */
export const SYSTEM_CSS = `
  .ds-root { color: ${colour.text}; font-family: ${font.ui}; }

  .ds-focus:focus-visible,
  .ds-btn:focus-visible,
  .ds-row:focus-visible,
  .ds-input:focus-visible {
    outline: 2px solid ${colour.accent};
    outline-offset: 2px;
  }

  .ds-btn { transition: background-color .12s ease, border-color .12s ease, color .12s ease; }
  .ds-btn:hover:not(:disabled) { border-color: ${colour.lineStrong}; }
  .ds-btn-primary:hover:not(:disabled) { background: ${colour.accentHover}; border-color: ${colour.accentHover}; }
  .ds-btn:disabled { opacity: .45; cursor: not-allowed; }

  .ds-row { transition: background-color .1s ease; }
  .ds-row:hover { background: ${colour.panelHover}; }

  .ds-input { transition: border-color .12s ease; }
  .ds-input:focus { border-color: ${colour.accentLine}; }
  .ds-input::placeholder { color: ${colour.textFaint}; }

  /* A table that has to scroll scrolls inside itself, never taking the page
     sideways with it. */
  .ds-scroll-x { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .ds-scroll-x::-webkit-scrollbar { height: 8px; width: 8px; }
  .ds-scroll-x::-webkit-scrollbar-thumb { background: ${colour.lineStrong}; border-radius: 4px; }

  /* THE COLUMN NAMES STAY WHILE THE ROWS MOVE.
     Scrolling 418 leads past a heading row that left the screen forty rows ago
     is how somebody reads the wrong column and rings the wrong person. */
  .ds-grid thead th {
    position: sticky; top: 0; z-index: 2;
    background: ${colour.groundAlt};
    box-shadow: inset 0 -1px 0 ${colour.line};
  }
  .ds-grid tbody tr:hover { background: ${colour.panelHover}; }

  /* A grid row is one line. Anything inside it that would wrap is clipped
     rather than allowed to make the row two lines tall — a table whose rows
     are different heights cannot be scanned down a column. */
  .ds-grid td > .ds-cell {
    display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .ds-hide-phone { }
  .ds-only-phone { display: none; }
  ${mq.phone} {
    .ds-hide-phone { display: none !important; }
    .ds-only-phone { display: revert !important; }
    /* Nothing on a phone may be smaller than a finger. */
    .ds-btn, .ds-row, .ds-input, .ds-tap { min-height: ${target.phone}px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .ds-btn, .ds-row, .ds-input { transition: none; }
  }
`;

/* ── HELPERS ──────────────────────────────────────────────────────────────── */

/** A card surface. One place, so every card on every screen matches. */
export const surface = (raised = false) => ({
  background: raised ? colour.panelHover : colour.panel,
  border: `1px solid ${colour.line}`,
  borderRadius: radius.card,
});

/** Money and counts, in the format Dubai agencies read. */
export const aed = n => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e6) return `AED ${(v / 1e6).toFixed(2).replace(/\.00$/, "")}M`;
  if (Math.abs(v) >= 1e3) return `AED ${Math.round(v).toLocaleString("en-GB")}`;
  return `AED ${Math.round(v)}`;
};

export default { colour, state, type, font, size, space, radius, target, bp, mq, surface, aed };
