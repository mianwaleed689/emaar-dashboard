/**
 * SHARED READER for src/config/tabs.js.
 *
 * The config is ESM and the audit scripts are CommonJS, and package.json has
 * no "type": "module", so node cannot import it directly. It is parsed instead.
 *
 * This lives in scripts/lib for one reason: audit-claims.js and
 * tab-scorecard.js once carried their own copies of the claim-detection regex
 * and disagreed with each other — one said MarketTab had 2 unsourced claims,
 * the other said 7. A checker that contradicts another checker gets ignored.
 * So there is exactly one parser, here, and every script that needs to know
 * what ships reads it through this file.
 *
 * The config is written to stay parseable: flat entries, no computed keys, no
 * JSX. If that ever stops being true, this is the file that has to change —
 * not each caller.
 */
const fs = require("fs");

const CONFIG_PATH = "src/config/tabs.js";

function readTabConfig(configPath = CONFIG_PATH) {
  const src = fs.readFileSync(configPath, "utf8");

  const groups = [];
  const tabs = [];

  /* Groups: `id: "x", label: "y", iconName: "z", tabs: [ ... ]` */
  for (const g of src.matchAll(
    /\{\s*(?:\/\*[\s\S]*?\*\/\s*)?id:\s*"([^"]+)",\s*label:\s*"([^"]+)"[\s\S]*?tabs:\s*\[([\s\S]*?)\n\s*\],?\s*\n\s*\}/g
  )) {
    const [, id, label, body] = g;
    const groupTabs = [];
    for (const t of body.matchAll(/\{\s*key:\s*"([^"]+)"[\s\S]*?\}/g)) {
      const entry = t[0];
      const key = t[1];
      const iconName = (entry.match(/iconName:\s*"([^"]+)"/) || [])[1] || null;
      const heldMatch = entry.match(/held:\s*"((?:[^"\\]|\\.)*)"/);
      const tab = { key, iconName, group: id, held: heldMatch ? heldMatch[1] : null };
      groupTabs.push(tab);
      tabs.push(tab);
    }
    groups.push({ id, label, tabs: groupTabs });
  }

  const held = tabs.filter(t => t.held);
  return {
    groups,
    tabs,
    heldTabs: held,
    heldKeys: new Set(held.map(t => t.key)),
    shippedTabs: tabs.filter(t => !t.held),
    shippedKeys: new Set(tabs.filter(t => !t.held).map(t => t.key)),
    allKeys: new Set(tabs.map(t => t.key)),
  };
}

module.exports = { readTabConfig, CONFIG_PATH };
