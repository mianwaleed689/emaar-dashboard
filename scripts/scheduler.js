const cron = require("node-cron");
const { execSync } = require("child_process");
const path = require("path");

console.log("DXB Analytics - Scheduler started");
console.log("Daily: 1:00 PM Dubai | Full detail: Sunday 1:00 PM Dubai");

function runScript(name, file) {
  const fp = path.join(__dirname, file);
  console.log("[" + new Date().toLocaleString("en-AE",{timeZone:"Asia/Dubai"}) + "] Running: " + name);
  try {
    const r = execSync("node " + fp, {cwd:path.join(__dirname,".."),timeout:14400000,encoding:"utf8"});
    console.log(r);
    console.log("Done: " + name);
  } catch(e) { console.error("Failed: " + name + " - " + e.message); }
}

// Daily 1:00 PM Dubai (9:00 AM UTC) - fast sync
cron.schedule("0 9 * * *", ()=>runScript("Auto Sync","auto-sync.js"), {timezone:"UTC"});

// Daily 1:25 PM Dubai (9:25 AM UTC) - push notifications for important changes
cron.schedule("25 9 * * *", ()=>runScript("Sync Notifications","sync-notifications.js"), {timezone:"UTC"});

// Daily 1:30 PM Dubai (9:30 AM UTC) - new launches
cron.schedule("30 9 * * *", ()=>runScript("New Launches","detect-new-launches.js"), {timezone:"UTC"});

// Sunday 1:00 PM Dubai (9:00 AM UTC) - full detail refresh
cron.schedule("0 9 * * 0", ()=>runScript("Full Detail Refresh","scrape-mashrooi-details.js"), {timezone:"UTC"});

console.log("Ready - daily sync 1PM + notifications 1:25PM + full refresh every Sunday");
