const fs = require("fs");
const path = require("path");

// Find all files with "lead" in name
function findFiles(dir, results = []) {
  try {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const full = path.join(dir, item);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory()) findFiles(full, results);
        else if (item.toLowerCase().includes("lead")) results.push(full);
      } catch(e) {}
    });
  } catch(e) {}
  return results;
}

const found = findFiles("src");
console.log("Files with 'lead' in name:");
found.forEach(f => {
  const lines = fs.readFileSync(f, "latin1").split("\n").length;
  console.log(" ", f, "—", lines, "lines");
});