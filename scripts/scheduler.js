/**
 * scheduler.js
 * 
 * Master nightly scheduler for DXB Analytics.
 * Runs automatically every night at 2:00 AM Dubai time.
 * 
 * Jobs:
 * 1. 2:00 AM — Auto-sync: update construction %, status for all projects
 * 2. 2:30 AM — New launches: scan DLD for newly registered projects
 * 
 * Start: node scripts/scheduler.js
 * Keep alive with PM2:
 *   npm install -g pm2
 *   pm2 start scripts/scheduler.js --name "dxb-scheduler"
 *   pm2 save
 *   pm2 startup
 */

const cron = require("node-cron");
const { execSync } = require("child_process");
const path = require("path");

console.log("╔══════════════════════════════════════════╗");
console.log("║   DXB Analytics — Nightly Scheduler      ║");
console.log("╚══════════════════════════════════════════╝");
console.log(`Started: ${new Date().toLocaleString("en-AE", { timeZone: "Asia/Dubai" })} Dubai time`);
console.log();
console.log("📅 Schedule:");
console.log("   2:00 AM Dubai — Auto-sync (construction %, status)");
console.log("   2:30 AM Dubai — New launch detector");
console.log();

function runScript(name, file) {
  console.log(`\n⏰ [${new Date().toLocaleString("en-AE", { timeZone: "Asia/Dubai" })}] Running: ${name}`);
  try {
    const result = execSync(`node ${path.join(__dirname, file)}`, {
      cwd: path.join(__dirname, ".."),
      timeout: 60 * 60 * 1000, // 1 hour max
      encoding: "utf8",
    });
    console.log(result);
    console.log(`✅ ${name} completed`);
  } catch(e) {
    console.error(`❌ ${name} failed:`, e.message);
  }
}

// 2:00 AM Dubai time = 10:00 PM UTC
cron.schedule("0 22 * * *", () => {
  runScript("Auto Sync", "scripts/auto-sync.js");
}, { timezone: "UTC" });

// 2:30 AM Dubai time = 10:30 PM UTC
cron.schedule("30 22 * * *", () => {
  runScript("New Launch Detector", "scripts/detect-new-launches.js");
}, { timezone: "UTC" });

console.log("✅ Scheduler running. Press Ctrl+C to stop.");
console.log("   (Use PM2 to keep running after terminal closes)\n");

// Run immediately on first start to verify everything works
setTimeout(() => {
  console.log("🔄 Running initial sync to verify setup...");
  runScript("Auto Sync (initial)", "scripts/auto-sync.js");
}, 5000);
