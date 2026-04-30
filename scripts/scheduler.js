const cron = require("node-cron");
const { execSync } = require("child_process");
const path = require("path");

console.log("DXB Analytics - Scheduler started");
console.log("Syncs at 1:00 PM Dubai time daily");

function runScript(name, file) {
  const fp = path.join(__dirname, file);
  console.log("[" + new Date().toLocaleString("en-AE",{timeZone:"Asia/Dubai"}) + "] Running: " + name);
  try {
    const r = execSync("node " + fp, {cwd:path.join(__dirname,".."),timeout:3600000,encoding:"utf8"});
    console.log(r);
    console.log("Done: " + name);
  } catch(e) { console.error("Failed: " + name + " - " + e.message); }
}

// 1:00 PM Dubai = 9:00 AM UTC
cron.schedule("0 9 * * *", ()=>runScript("Auto Sync","auto-sync.js"), {timezone:"UTC"});

// 1:30 PM Dubai = 9:30 AM UTC
cron.schedule("30 9 * * *", ()=>runScript("New Launches","detect-new-launches.js"), {timezone:"UTC"});

console.log("Ready - next sync at 1:00 PM Dubai time");
