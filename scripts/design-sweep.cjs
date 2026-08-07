/**
 * A MECHANICAL SWEEP FROM THE OLD STYLING TO THE SYSTEM.
 *
 * The rebuilt tabs were done by hand, region by region, because their layout
 * changed as well as their type. This handles what is left over afterwards:
 * the drawers, modals and forms where the structure is right and only the
 * numbers are wrong.
 *
 * It fixes exactly two classes of thing, and reports every one it touches:
 *
 *   1. TYPE UNDER 12px. The system's floor. Anything at 9, 10 or 11 becomes
 *      12 or 13 depending on whether it was a label or a sentence.
 *   2. LOOSE HEXES for the four state colours, which become the system's
 *      tones so that red always means the same red.
 *
 * It deliberately does NOT touch layout, spacing or structure — those need a
 * person looking at the screen. Run it, then look.
 *
 *   node scripts/design-sweep.cjs src/tabs/SomeTab.jsx [--dry]
 */
const fs = require("fs");

const file = process.argv[2];
const dry = process.argv.includes("--dry");
if (!file) { console.error("usage: node scripts/design-sweep.cjs <file> [--dry]"); process.exit(1); }

/* Both spellings. Half this codebase writes `fontSize: 11,` and half writes
   `fontSize:11,` — the first version of this script only caught the spaced
   one and reported "0 replacements" on a file with twenty-one of them, which
   is a worse outcome than not running it at all. */
const SIZE = n => new RegExp(`fontSize:\\s*${n}(?![0-9.])`, "g");

const RULES = [
  /* 8, 8.5, 9, 9.5 were labels. 12 is the floor and only for uppercase labels. */
  [SIZE("8(?:\\.5)?"),  "fontSize:12",  "8px → 12"],
  [SIZE("9(?:\\.5)?"),  "fontSize:12",  "9px → 12"],
  /* 10 and 11 were body text. 13 is the system's small. */
  [SIZE("10(?:\\.5)?"), "fontSize:13",  "10px → 13"],
  [SIZE("11(?:\\.5)?"), "fontSize:13",  "11px → 13"],

  /* The state colours, wherever they were typed by hand.

     JSX ATTRIBUTES FIRST, AND THEY NEED BRACES. `stroke="#F59E0B"` becoming
     `stroke=ST.warning.fg` is a syntax error, and the first version of this
     script produced exactly that on an SVG inside a form. A hex inside an
     object literal takes no braces; the same hex as an attribute must have
     them, so the two cases are matched separately and the attribute case is
     matched first. */
  [/(\s[a-zA-Z-]+)=["']#(?:10B981|68D391)["']/g, "$1={ST.positive.fg}", "green attr → positive"],
  [/(\s[a-zA-Z-]+)=["']#F59E0B["']/g,            "$1={ST.warning.fg}",  "amber attr → warning"],
  [/(\s[a-zA-Z-]+)=["']#(?:EF4444|FC8181)["']/g, "$1={ST.critical.fg}", "red attr → critical"],

  [/["']#10B981["']/g,  "ST.positive.fg", "green → positive"],
  [/["']#68D391["']/g,  "ST.positive.fg", "green → positive"],
  [/["']#F59E0B["']/g,  "ST.warning.fg",  "amber → warning"],
  [/["']#EF4444["']/g,  "ST.critical.fg", "red → critical"],
  [/["']#FC8181["']/g,  "ST.critical.fg", "red → critical"],
];

let s = fs.readFileSync(file, "utf8");
const before = s;
let total = 0;
for (const [re, to, label] of RULES) {
  const hits = (s.match(re) || []).length;
  if (!hits) continue;
  s = s.replace(re, to);
  total += hits;
  console.log(`  ${String(hits).padStart(4)}  ${label}`);
}

if (s === before) { console.log(`${file}: nothing to change`); process.exit(0); }

/* A REPLACEMENT THAT DOES NOT COMPILE IS WORSE THAN NO REPLACEMENT.
   Swapping a hex for `ST.warning.fg` in a file that does not import ST builds
   perfectly — a bare identifier is valid JavaScript — and then throws the
   moment the component renders. This script did exactly that to
   TabProvenance, which every tab in the product mounts. So it now refuses to
   leave a file referring to something it cannot see. */
if (/\bST\./.test(s) && !/state as ST/.test(s)) {
  console.error(`${file}: introduced ST.* but the file does not import it.`);
  console.error(`  add:  import { state as ST } from "<path>/design/system";`);
  console.error(`  nothing was written.`);
  process.exit(1);
}

if (!dry) fs.writeFileSync(file, s);
console.log(`${file}: ${total} replacement${total === 1 ? "" : "s"}${dry ? " (dry run)" : ""}`);
