/**
 * CLARITY CHECK — automated, against the live running app.
 *
 * Tests the mechanical half of TAB_CLARITY.md so "is this tab confusing?" stops
 * being a matter of opinion. Checks 1, 4, 6, 7 and 9 are testable from the DOM;
 * the rest need a human.
 *
 *   node scripts/dld/check_clarity.mjs "Yields" ["Price History" ...]
 *
 * Requires the app running on :3000 and a Chrome with --remote-debugging-port=9222.
 */
import puppeteer from "puppeteer-core";

/* Words that mean something to whoever built the pipeline and nothing to an
   agent. Each was found in a shipped tab during the 2026-08-02 rebuild. */
const JARGON = [
  "cell", "cells", "bucketed", "distinct values", "observations",
  "minimum observations", "aggregate", "dataset", "record set",
  "n=", "sample size", "percentile", "normalise", "normalize",
  "schema", "null", "undefined", "NaN", "TODO", "FIXME",
];

/* Abbreviations that must be spelled out somewhere on the page. */
const NEEDS_EXPANSION = {
  "PPSF": "per square foot",
  "AVM": "automated valuation",
  "LTV": "loan to value",
  "DLD": "Dubai Land Department",
  "STR": "short term",
  "LTR": "long term",
};

const tabs = process.argv.slice(2);
if (!tabs.length) {
  console.error("usage: node check_clarity.mjs \"Tab Name\" [...]");
  process.exit(2);
}

const b = await puppeteer.connect({ browserURL: "http://127.0.0.1:9222", defaultViewport: null });
const p = (await b.pages()).find(x => x.url().includes("localhost:3000"));
await p.bringToFront();
await p.setViewport({ width: 1500, height: 1100 });
const wait = ms => new Promise(r => setTimeout(r, ms));

let totalFail = 0;

for (const tab of tabs) {
  await p.evaluate(n => {
    const el = [...document.querySelectorAll("div,span,a,button,li")]
      .filter(e => e.offsetParent && e.children.length <= 2)
      .find(e => (e.innerText || "").trim() === n);
    if (el) el.click();
  }, tab);
  await wait(3000);

  const d = await p.evaluate(() => {
    const t = document.body.innerText || "";
    // strip the sidebar: the tab's own content starts after the Refresh button
    const i = t.indexOf("Refresh");
    const body = i >= 0 ? t.slice(i + 7) : t;
    const paras = body.split("\n").map(s => s.trim()).filter(Boolean);

    const selects = [...document.querySelectorAll("select")].filter(e => e.offsetParent);
    return {
      body,
      firstProse: paras.slice(0, 6).find(s => s.length > 90 && s.includes(" ")) || null,
      selectCount: selects.length,
      selectOptionCounts: selects.map(s => s.options.length),
      // a control is "explained" if small muted text sits near it
      smallTextBlocks: [...document.querySelectorAll("div")]
        .filter(e => e.offsetParent && !e.children.length)
        .map(e => ({ txt: (e.innerText || "").trim(),
                     size: parseFloat(getComputedStyle(e).fontSize) || 0 }))
        .filter(x => x.size <= 12 && x.txt.length > 25).length,
      hasHelpToggle: /what do these columns mean|how (this|it) is calculated|where these numbers come from/i.test(body),
      hasSource: /Dubai Land Department|Ejari|source/i.test(body),
      hasBenchmark: /typical for dubai|dubai norm|above average|below average|compared|norm/i.test(body),
      hasClientLine: /client/i.test(body),
    };
  });

  const fails = [];
  const warns = [];

  // 1 — opens with plain-English prose
  if (!d.firstProse) fails.push("no plain-English explanation before the controls");
  else if (/median|ejari|dld sale|per sqft/i.test(d.firstProse) && !/is what|means|tells you/i.test(d.firstProse))
    warns.push("opening sentence leads with method, not meaning");

  // 4 — controls explained
  if (d.selectCount > 0 && d.smallTextBlocks < d.selectCount)
    warns.push(`${d.selectCount} controls but only ${d.smallTextBlocks} explanatory notes`);

  // 6 — no empty options
  d.selectOptionCounts.forEach((n, i) => {
    if (n === 0) fails.push(`control ${i + 1} renders with zero options`);
    if (n === 1) warns.push(`control ${i + 1} offers only one option — why is it a control?`);
  });

  // 7 — jargon
  const found = JARGON.filter(w => {
    const re = new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i");
    return re.test(d.body);
  });
  if (found.length) fails.push(`jargon on screen: ${found.join(", ")}`);

  // abbreviations unexpanded
  for (const [ab, exp] of Object.entries(NEEDS_EXPANSION)) {
    if (d.body.includes(ab) && !new RegExp(exp, "i").test(d.body))
      warns.push(`"${ab}" used without ever spelling it out`);
  }

  // 9 — help + provenance + benchmark + client guidance
  if (!d.hasHelpToggle) warns.push("no 'what do these columns mean' or 'how this is calculated'");
  if (!d.hasSource) fails.push("no source stated anywhere on the tab");
  if (!d.hasBenchmark) warns.push("numbers shown with nothing to judge them against");
  if (!d.hasClientLine) warns.push("nothing telling the agent what to say to a client");

  totalFail += fails.length;
  const verdict = fails.length ? "FAIL" : warns.length ? "PASS with warnings" : "PASS";
  console.log(`\n═══ ${tab} — ${verdict}`);
  fails.forEach(f => console.log(`   ✗ ${f}`));
  warns.forEach(w => console.log(`   ! ${w}`));
  if (!fails.length && !warns.length) console.log("   clean");
}

console.log(`\n${totalFail === 0 ? "no blocking issues" : totalFail + " blocking issue(s)"}`);
process.exit(0);
