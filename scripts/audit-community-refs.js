const fs = require("fs");
const path = require("path");

function walk(dir, results = []) {
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory() && !["node_modules", ".git", "dist", "build"].includes(item.name)) {
      walk(full, results);
    } else if (item.isFile() && /\.(jsx|js|tsx|ts)$/.test(item.name)) {
      results.push(full);
    }
  }
  return results;
}

const PATTERNS = [
  { name: "communityData (legacy)",  test: l => l.includes("communityData") },
  { name: "communities collection",  test: l => l.includes("collection(db, \"communities\")") || l.includes("collection(db,\"communities\")") },
  { name: "useCommunities hook",     test: l => l.includes("useCommunities") },
  { name: "commOptions (derived)",   test: l => l.includes("commOptions") },
  { name: "verified===true (legacy)",test: l => l.includes("verified === true") || l.includes("verified===true") },
  { name: "displayCategory",         test: l => l.includes("displayCategory") },
];

const files = walk("src");
const buckets = {};
PATTERNS.forEach(p => buckets[p.name] = []);

for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    for (const p of PATTERNS) {
      if (p.test(l)) {
        buckets[p.name].push({
          file: f.replace(/\\/g, "/"),
          line: i + 1,
          text: l.replace(/[^\x20-\x7E]/g, "?").trim().substring(0, 180),
        });
      }
    }
  }
}

for (const p of PATTERNS) {
  console.log("=== " + p.name + " (" + buckets[p.name].length + " hits) ===");
  buckets[p.name].forEach(h => console.log("  " + h.file + ":" + h.line + "  " + h.text));
  console.log("");
}