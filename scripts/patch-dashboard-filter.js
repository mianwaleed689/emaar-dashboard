const fs = require('fs');
const path = 'src/pages/EmaarDashboardV2.jsx';
let content = fs.readFileSync(path, 'utf8');

const oldFilter = `      const list = [];
      snap.forEach(d => {
        const data = d.data();
        // Only published communities with a human-readable name.
        // Skip the short-ID cron-yields artefacts (BB, DCH, etc.) which lack visibility.
        if (data.visibility === "published" && data.verified === true && (data.name || data.community)) {
          list.push({
            id: d.id,
            name: data.name || data.community,
            district: data.district || null,
          });
        }
      });`;

const newFilter = `      const list = [];
      const USER_FACING = new Set(["consumer-community", "master-community", "sub-community"]);
      snap.forEach(d => {
        const data = d.data();
        if (!USER_FACING.has(data.displayCategory)) return;
        if (data.visibility === "archived") return;
        if (!data.name && !data.community) return;
        list.push({
          id: d.id,
          name: data.name || data.community,
          district: data.district || null,
          displayCategory: data.displayCategory,
          parentCommunity: data.parentCommunity || null,
        });
      });`;

if (!content.includes(oldFilter)) {
  console.error("FAIL: Old filter not found.");
  process.exit(1);
}
content = content.replace(oldFilter, newFilter);
fs.writeFileSync(path, content, "utf8");
console.log("Patched: " + path);