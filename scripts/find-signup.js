const fs = require("fs");
const path = require("path");

function findFiles(dir, results = []) {
  try {
    fs.readdirSync(dir).forEach(item => {
      const full = path.join(dir, item);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory() && !item.includes("node_modules") && !item.includes(".git")) findFiles(full, results);
        else if (item.endsWith(".jsx") || item.endsWith(".js") || item.endsWith(".tsx")) results.push(full);
      } catch(e) {}
    });
  } catch(e) {}
  return results;
}

const files = findFiles("src");
console.log("=== FILES WITH SIGNUP/REGISTER/ONBOARD ===");
files.forEach(f => {
  const src = fs.readFileSync(f, "latin1");
  if (src.toLowerCase().includes("signup") || src.toLowerCase().includes("register") || src.toLowerCase().includes("onboard") || src.toLowerCase().includes("invite") || src.toLowerCase().includes("agency")) {
    const lines = src.split("\n").length;
    console.log(f, "—", lines, "lines");
  }
});