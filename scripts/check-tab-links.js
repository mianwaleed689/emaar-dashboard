/**
 * TAB LINK CHECK — no shipped tab may send an agent somewhere that isn't sold.
 *
 * ── WHY ─────────────────────────────────────────────────────────────────────
 *
 * Holding a tab back removes it from the sidebar. It does not remove the
 * buttons elsewhere in the product that link straight to it. Auditing the code
 * turned up five such links — a "Full Developer Profile" button on the Projects
 * tab pointed at Developer Health, which publishes a composite grade assembled
 * from figures the product does not hold.
 *
 * handleTabChange() catches a bad target at runtime and lands on Overview, but
 * that is a safety net, not a fix: the agent still clicked a button that
 * promised something and silently went somewhere else. This finds them before
 * they ship.
 *
 * A link FROM a held tab TO a held tab is fine — only an admin can be standing
 * there in the first place.
 *
 *   node scripts/check-tab-links.js
 */
const fs = require("fs");
const path = require("path");
const { readTabConfig } = require("./lib/tabConfig");

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.jsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

/* Which tab does this file render? Used to allow held -> held links. */
function tabKeyOfFile(file, allKeys) {
  const base = path.basename(file).replace(/Tab\.jsx?$/, "");
  for (const k of allKeys) if (k.replace(/[^A-Za-z]/g, "") === base) return k;
  return null;
}

const { allKeys: all, heldKeys: held } = readTabConfig();
const files = walk("src/tabs").concat(walk("src/components"), walk("src/pages"));

const problems = [];

files.forEach(file => {
  const src = fs.readFileSync(file, "utf8");
  const ownKey = tabKeyOfFile(file, all);
  const fromHeld = ownKey && held.has(ownKey);

  const lines = src.split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/(?:handleTabChange|setTab)\(\s*"([^"]+)"\s*\)/g)) {
      const target = m[1];
      if (!all.has(target)) {
        problems.push({ file, line: i + 1, target, why: "not a tab in src/config/tabs.js" });
      } else if (held.has(target) && !fromHeld) {
        problems.push({ file, line: i + 1, target, why: "target is held back — a customer cannot open it" });
      }
    }
    /* A stray identifier between JSX attributes parses as a boolean prop, so
       the build stays green while the intended edit never landed. That is how
       `}}$ style={{` survived in ProjectsTab — the same half-applied-edit
       failure that took the Market tab down in production. */
    if (/\}\}\s*\$\s+[a-zA-Z]/.test(line)) {
      problems.push({ file, line: i + 1, target: "$", why: "stray '$' between JSX attributes — a half-applied edit" });
    }

    /* A React component written in lowercase is not an error — JSX reads it as
       an HTML tag. `<cell fill={...}/>` renders an unknown DOM element that
       does nothing, so a chart's colour coding silently stops working while the
       build, the linter and the type-free runtime all stay quiet.
       Four instances were found across ServiceCharges, InvestmentScore,
       Handover and Yields: every per-bar colour in the product was dead.

       Deliberately a SHORT list. The first version of this check also flagged
       `line` and `area`, which produced 157 hits across the icon set — <line>
       and <area> are real SVG and HTML elements. Only names with no HTML or SVG
       equivalent are listed, so every hit is a genuine bug. A checker that
       cries wolf is one nobody runs. */
    for (const m of line.matchAll(/<(cell|pie|legend|radar|scatter|funnel)\b/g)) {
      const tag = m[1];
      problems.push({
        file, line: i + 1, target: `<${tag}>`,
        why: `lowercase recharts component — renders as an unknown DOM element and does nothing (should be <${tag[0].toUpperCase()}${tag.slice(1)}>)`,
      });
    }
  });
});

console.log("\nTAB LINK CHECK — where the product sends an agent\n");
console.log(`  ${all.size} tabs configured, ${held.size} held back\n`);

if (!problems.length) {
  console.log(`  ${files.length} files checked — every link points at a tab that ships.\n`);
  process.exit(0);
}

problems.forEach(p => {
  console.log(`  ${p.file}:${p.line}`);
  console.log(`      -> "${p.target}"  — ${p.why}`);
});
console.log(`\n  ${problems.length} broken link(s).\n`);
process.exit(1);
