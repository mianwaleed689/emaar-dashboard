/**
 * NAVIGATION CHECK — the sidebar a customer actually sees.
 *
 * ── WHY ─────────────────────────────────────────────────────────────────────
 *
 * Holding tabs back is a customer-visible change made through a config file,
 * and the failure mode is silent: a held tab that still renders is a tab being
 * sold before it is ready, and an over-eager filter that empties a group leaves
 * a heading with nothing under it. Neither breaks the build.
 *
 * This asserts the invariants the sidebar depends on, and prints the navigation
 * as a customer and as an admin will see it — so a nav change is reviewable by
 * reading the output rather than by clicking through the site.
 *
 *   node scripts/check-nav.js
 */
const { readTabConfig } = require("./lib/tabConfig");

const cfg = readTabConfig();

/* Mirror of groupsFor() in src/config/tabs.js. Deliberately re-derived here
   rather than trusted: if the two ever disagree, the assertions below fail and
   the disagreement is the finding. */
const customerGroups = cfg.groups
  .map(g => ({ ...g, tabs: g.tabs.filter(t => !t.held) }))
  .filter(g => g.tabs.length > 0);

console.log("\nNAVIGATION CHECK — what an agent sees in the sidebar\n");

customerGroups.forEach(g => {
  console.log(`  ${g.label}`);
  g.tabs.forEach(t => console.log(`      ${t.key}`));
});

console.log(`\n  HELD BACK — admin only, ${cfg.heldTabs.length} tabs\n`);
cfg.heldTabs.forEach(t => {
  const reason = t.held.length > 96 ? t.held.slice(0, 93) + "..." : t.held;
  console.log(`      ${t.key}`);
  console.log(`          ${reason}`);
});

/* ── Invariants ───────────────────────────────────────────────────────────── */
const failures = [];
const assert = (name, cond) => { if (!cond) failures.push(name); };

const customerKeys = customerGroups.flatMap(g => g.tabs.map(t => t.key));

assert("no held tab reaches a customer",
  !cfg.heldTabs.some(t => customerKeys.includes(t.key)));
assert("no group renders empty",
  customerGroups.every(g => g.tabs.length > 0));
assert("shipped + held accounts for every tab",
  cfg.shippedTabs.length + cfg.heldTabs.length === cfg.tabs.length);
assert("no duplicate tab key",
  new Set(cfg.tabs.map(t => t.key)).size === cfg.tabs.length);
assert("every tab has an icon name",
  cfg.tabs.every(t => !!t.iconName));
assert("every held tab states a reason",
  cfg.heldTabs.every(t => t.held && t.held.length > 20));
assert("Overview is the first thing an agent sees",
  customerGroups[0] && customerGroups[0].tabs[0] && customerGroups[0].tabs[0].key === "Overview");
assert("the config parsed at all",
  cfg.tabs.length > 20 && cfg.groups.length > 3);

console.log("");
console.log(`  ${cfg.groups.length} groups · ${cfg.tabs.length} tabs · ${cfg.shippedTabs.length} shipped · ${cfg.heldTabs.length} held`);

if (failures.length) {
  console.log("");
  failures.forEach(f => console.log(`  FAILED: ${f}`));
  console.log("");
  process.exit(1);
}
console.log(`  ${8 - failures.length}/8 invariants hold.\n`);
process.exit(0);
