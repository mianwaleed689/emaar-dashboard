const cron = require("node-cron");
const { spawn } = require("child_process");
const path = require("path");

function runScript(name, file) {
  const fp = path.join(__dirname, file);
  console.log("[" + new Date().toLocaleString("en-AE",{timeZone:"Asia/Dubai"}) + "] Running: " + name);
  const child = spawn("node",[fp],{cwd:path.join(__dirname,".."),stdio:["ignore","pipe","pipe"]});
  child.stdout.on("data",d=>process.stdout.write(d));
  child.stderr.on("data",d=>process.stderr.write(d));
  child.on("close",code=>{if(code===0)console.log("Done: "+name);else console.error("Failed: "+name+" exit "+code);});
  child.on("error",e=>console.error("Failed: "+name+" - "+e.message));
}

cron.schedule("0 9 * * *",  ()=>runScript("Auto Sync","auto-sync.js"),{timezone:"UTC"});
cron.schedule("25 9 * * *", ()=>runScript("Sync Notifications","sync-notifications.js"),{timezone:"UTC"});
cron.schedule("30 9 * * *", ()=>runScript("New Launches","detect-new-launches.js"),{timezone:"UTC"});
cron.schedule("45 9 * * *", ()=>runScript("DLD Transactions","fetch-dld-transactions.js"),{timezone:"UTC"});
cron.schedule("55 9 * * *", ()=>runScript("Aggregate DLD Volumes","aggregate-dld-volumes.js"),{timezone:"UTC"});
cron.schedule("0 10 * * *", ()=>runScript("Aggregate Price History","aggregate-price-history.js"),{timezone:"UTC"});
cron.schedule("10 10 * * *",()=>runScript("Stale Lead Alerts","stale-lead-alerts.js"),{timezone:"UTC"});
cron.schedule("30 10 * * 5",()=>runScript("Yield Calculator","fetch-rental-benchmarks.js"),{timezone:"UTC"});
cron.schedule("35 10 * * 5",()=>runScript("Aggregate Yields","aggregate-yields.js"),{timezone:"UTC"});
cron.schedule("0 10 * * 0",  ()=>runScript("Full Detail Refresh","scrape-mashrooi-details.js"),{timezone:"UTC"});

console.log("Ready - all jobs non-blocking. Auto-sync runs async in background.");