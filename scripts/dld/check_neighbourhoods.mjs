/**
 * NEIGHBOURHOODS — did the rebuild actually fix the numbers?
 *
 * The defect this tests for: the stored community records carried figures that
 * were assigned rather than counted. Before the rebuild the 193 cards showed
 * only 15 distinct gross yields, and 43% of communities shared one of two
 * values. Dubai Harbour, Dubai Marina and Emaar Beachfront were all 6.5%.
 *
 * Counting distinct values on the rendered page is the honest test, because it
 * measures what the agent sees rather than what the builder intended.
 *
 *   node scripts/dld/check_neighbourhoods.mjs
 *
 * Needs the app on :3000, Chrome with --remote-debugging-port=9222, AND a
 * logged-in session — the tab sits behind Firebase auth, so an unauthenticated
 * browser lands on the landing page and every check below reports zero.
 *
 * Counting trap worth knowing: the tab's own intro copy contains the string
 * "193 communities", so a naive /(\d+) communities/ match reads the prose and
 * never changes when a filter is applied. Count rendered cards instead.
 */
import puppeteer from "puppeteer-core";

const b = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const p = (await b.pages()).find(x => x.url().includes("localhost:3000"));
if (!p) { console.error("No tab open on localhost:3000"); process.exit(2); }

/* Navigate to the tab by clicking its name, the way an agent would. */
const went = await p.evaluate(() => {
  const el = [...document.querySelectorAll("button,a,div,span")]
    .find(e => e.textContent.trim() === "Neighbourhoods" && e.offsetParent);
  if (!el) return false;
  el.click(); return true;
});
if (!went) { console.error("Could not find the Neighbourhoods tab control"); process.exit(2); }
await new Promise(r => setTimeout(r, 2500));

const R = await p.evaluate(() => {
  const txt = document.body.innerText;

  /* Read each card: label above value, so pair them up. */
  const grab = label => {
    const out = [];
    for (const el of document.querySelectorAll("div")) {
      if (el.children.length) continue;
      if (el.textContent.trim().toUpperCase() !== label.toUpperCase()) continue;
      const box = el.closest("div")?.parentElement;
      const val = box?.querySelector("div:last-child")?.textContent?.trim();
      if (val) out.push(val);
    }
    return out;
  };

  const pct = [...txt.matchAll(/(\d+\.\d)%/g)].map(m => m[1]);
  const aed = [...txt.matchAll(/AED ([\d,]{3,})/g)].map(m => m[1].replace(/,/g, ""));

  return {
    cards:        document.body.innerText.split("Compare").length - 1,
    /* the live count, not the sentence in the intro */
    listed:       (txt.match(/^(\d+) communities$/m) || [])[1],
    distinctPct:  [...new Set(pct)].length,
    distinctAed:  [...new Set(aed)].length,
    salesBadges:  (txt.match(/[\d,]+ sales/g) || []).length,
    estBadges:    (txt.match(/\bEST\b/g) || []).length,
    hasGlossary:  /what the figures mean/i.test(txt),
    spellsPpsf:   /per square foot/i.test(txt),
    hasBenchmark: /Dubai middle/i.test(txt),
    hasNotRecorded: txt.includes("Not recorded"),
    saysMeasured: /measured from Land Department sales/i.test(txt),
    aliasNote:    /Land Department records this as/i.test(txt),
    topPct:       [...new Set(pct)].slice(0, 20),
  };
});

const ok = (c, s) => console.log(`  ${c ? "PASS" : "FAIL"}  ${s}`);
console.log("\nNEIGHBOURHOODS — rendered page\n");
console.log(`  cards on screen        ${R.cards}`);
console.log(`  distinct percentages   ${R.distinctPct}   (was 15 before the rebuild)`);
console.log(`  distinct AED figures   ${R.distinctAed}`);
console.log(`  "N sales" badges       ${R.salesBadges}`);
console.log(`  "EST" badges           ${R.estBadges}\n`);

ok(R.distinctPct > 40, `gross returns no longer bucketed (${R.distinctPct} distinct)`);
ok(R.salesBadges > 20, "measured figures state how many sales are behind them");
ok(R.estBadges > 0,    "unmeasured figures are marked as estimates");
ok(R.hasGlossary,      "the page explains what each figure means");
ok(R.spellsPpsf,       "price per square foot is spelled out");
ok(R.hasBenchmark,     "a Dubai reference point is given to judge against");
ok(R.saysMeasured,     "the page states how much of it is measured");

console.log(`\n  first distinct returns: ${R.topPct.join("  ")}`);
await b.disconnect();
