const fs = require("fs");
let content = fs.readFileSync("src/admin/AdminPanel.jsx", "latin1");

const idx = content.indexOf(`const q1 = query(collection(db, "leads")`);
if (idx > -1) {
  const line = content.substring(0,idx).split("\n").length;
  console.log("Leads fetch at line:", line);
  console.log("Context:", content.substring(idx-200, idx+200));
}