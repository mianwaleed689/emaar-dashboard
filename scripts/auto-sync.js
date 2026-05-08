/**
 * auto-sync.js
 * 
 * Nightly auto-sync from DLD Mashrooi API.
 * Updates: constructionPct, status, completionDate, developerActual
 * Only writes to Firestore if data actually changed.
 * Logs all changes to data/sync-logs/
 * 
 * Run manually:  node scripts/auto-sync.js
 * Run as cron:   node scripts/auto-sync.js --schedule
 * 
 * Schedule: every night at 2:00 AM Dubai time (GMT+4)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const CONSUMER_ID = "gkb3WvEG0rY9eilwXC0P2pTz8UzvLj9F";
const DELAY_MS = 800;
const LOG_DIR = path.join(__dirname, "../data/sync-logs");
const SCHEDULE = process.argv.includes("--schedule");

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── AUTO AUTH ────────────────────────────────────────────────────────────────
async function getToken() {
  const params = {
    ApplicationKey: "MyBrowser", MethodIdentity: "guest", MethodPasscode: "",
    Platform: "DESKTOP", Method: "ANONYMOUS", DeviceKey: `dxb-sync-${Date.now()}`,
  };
  return new Promise((resolve) => {
    const authHeader = "Basic " + Buffer.from(JSON.stringify(params)).toString("base64");
    const options = {
      hostname: "b2c.dubailand.gov.ae", path: "/mashrooi/authenticate", method: "POST",
      headers: {
        "consumer-id": CONSUMER_ID, "Authorization": authHeader,
        "Content-Type": "application/json", "Origin": "https://dubailand.gov.ae",
        "User-Agent": "Mozilla/5.0",
      }, timeout: 15000,
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve(res.headers["token"] || res.headers["Token"] || null));
    });
    req.on("error", () => resolve(null));
    req.end();
  });
}

// ─── FETCH PROJECT FROM DLD ───────────────────────────────────────────────────
function fetchProject(num, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: "b2c.dubailand.gov.ae",
      path: `/mashrooi/projects/searchlite?keywords=${num}&`,
      method: "GET",
      headers: {
        "consumer-id": CONSUMER_ID, "Token": token,
        "Accept": "application/json", "Origin": "https://dubailand.gov.ae",
        "User-Agent": "Mozilla/5.0",
      }, timeout: 15000,
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        const newToken = res.headers["token"] || res.headers["Token"] || null;
        try {
          if (res.statusCode === 401) return resolve({ auth: true, newToken });
          const json = JSON.parse(data);
          if (json.responseCode === "Success" && json.response?.projects?.length > 0) {
            const p = json.response.projects.find(x => String(x.number) === String(num))
                   || json.response.projects[0];
            if (p) return resolve({
              success: true, newToken,
              data: {
                nameEn: p.name?.englishName || "",
                status: p.status?.englishName || "",
                completionRatio: p.completionRatio || 0,
                developerName: p.developer?.name?.englishName || p.mainDeveloper?.name?.englishName || "",
                lat: p.location?.googleCoordinates?.latitude || null,
                lng: p.location?.googleCoordinates?.longitude || null,
              }
            });
          }
          resolve({ success: false, newToken });
        } catch(e) { resolve({ success: false, error: e.message, newToken }); }
      });
    });
    req.on("error", e => resolve({ success: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ success: false, error: "timeout" }); });
    req.end();
  });
}

// ─── DETECT CHANGES ───────────────────────────────────────────────────────────
function detectChanges(existing, fresh) {
  const changes = {};
  const updates = {};

  // Construction progress
  if (fresh.completionRatio !== undefined) {
    const oldPct = existing.constructionPct || 0;
    const newPct = fresh.completionRatio;
    if (Math.abs(oldPct - newPct) >= 1) { // only if changed by 1%+
      updates.constructionPct = newPct;
      changes.constructionPct = `${oldPct}% → ${newPct}%`;

      // Update construction band
      if (newPct >= 100)      updates.constructionBand = "Completed";
      else if (newPct >= 75)  updates.constructionBand = "Near Completion";
      else if (newPct >= 50)  updates.constructionBand = "Mid Construction";
      else if (newPct >= 25)  updates.constructionBand = "Early Construction";
      else if (newPct > 0)    updates.constructionBand = "Foundation Stage";
      else                     updates.constructionBand = "Pre-Construction";
    }
  }

  // Status change (Active → Finished etc.)
  if (fresh.status) {
    const statusMap = {
      "Finished": "Ready (DLD Registered)",
      "Active": "Off-Plan (RERA Registered)",
      "Cancelled": "Cancelled",
    };
    const newStatus = statusMap[fresh.status] || fresh.status;
    if (existing.dldProjectStatus !== newStatus) {
      updates.dldProjectStatus = newStatus;
      changes.status = `"${existing.dldProjectStatus || "unknown"}" → "${newStatus}"`;
    }
  }

  // Developer actual - apply canonical name mapping
  const DEV_MAP={"dubai creek harbour l.l.c":"Emaar Properties","damac prime development l.l.c":"DAMAC Properties","damac mry investment l.l.c":"DAMAC Properties","ellington properties development l.l.c":"Ellington Properties","danube properties development l.l.c":"Danube Properties","sobha l.l.c":"Sobha Realty","aurora spv 2 l.l.c":"Aurora Real Estate","samana premium real estate development l.l.c":"Samana Developers","nshama properties owned by nshmi development one person company l.l.c":"Nshama","imtiaz south real estate development l.l.c":"Imtiaz","imtiaz luxury real estate development l.l.c":"Imtiaz","imtiaz ghd real estate development l.l.c":"Imtiaz","zazen property development l.l.c":"Zazen Homes","nas estates l.l.c":"Nas Estates","dubai south properties dwc llc":"Dubai South Properties","acube real estate development l l c":"Acube Real Estate","majid developments l.l.c":"Majid Al Futtaim","marquis home developer l.l.c":"Marquis Developers","prestige gardens real estate development l.l.c":"Prestige Properties","prestige sanctuary real estate development l.l.c":"Prestige Properties","rabdan gardens real estate developments l.l.c":"Rabdan","rabdan square developments l.l.c":"Rabdan","fakhruddin properties development l.l.c":"Fakhruddin Properties","park 1 l.l.c":"Park Group","myra real estate deveiopment l.l.c":"Myra Real Estate"};
  function getCanonicalDev(raw){if(!raw)return raw;var k=raw.toLowerCase().trim();if(DEV_MAP[k])return DEV_MAP[k];for(var p in DEV_MAP){if(k.includes(p))return DEV_MAP[p];}return raw;}
  if (fresh.developerName) {
    const canonical=getCanonicalDev(fresh.developerName);
    if(!existing.developerActual || existing.developerActual!==canonical){
      updates.developerActual=canonical;
      changes.developerActual=`→ "${canonical}"`;
    }
  }

  // Coordinates (if not already set)
  if (fresh.lat && fresh.lng && !existing.lat) {
    updates.lat = fresh.lat;
    updates.lng = fresh.lng;
    updates.coordinates = { lat: fresh.lat, lng: fresh.lng };
    changes.coordinates = `→ [${fresh.lat}, ${fresh.lng}]`;
  }

  return { updates, changes };
}

// ─── MAIN SYNC ────────────────────────────────────────────────────────────────
async function runSync() {
  const startTime = Date.now();
  const date = new Date().toISOString().split("T")[0];
  console.log(`\n🔄 DXB Analytics — Auto Sync`);
  console.log(`📅 ${new Date().toLocaleString("en-AE", { timeZone: "Asia/Dubai" })} (Dubai time)`);

  // Get token
  console.log("\n🔑 Authenticating...");
  let token = await getToken();
  if (!token) { console.error("❌ Auth failed"); return; }
  console.log("✅ Auth successful");

  // Load all projects
  const snap = await db.collection("projects").get();
  const projects = snap.docs.map(d => ({ ref: d.ref, ...d.data() }));
  const activeProjects = projects.filter(p =>
    p.projectNumber && !p.archived &&
    String(p.projectNumber).match(/^\d+$/)
  );
  console.log(`📦 ${activeProjects.length} active projects to sync\n`);

  let checked = 0, changed = 0, errors = 0, authRefreshes = 0;
  const changeLog = [];
  let batch = db.batch(), bc = 0;

  for (const project of activeProjects) {
    const num = String(project.projectNumber);
    const result = await fetchProject(num, token);

    if (result.newToken) token = result.newToken;

    if (result.auth) {
      console.log("🔄 Re-authenticating...");
      token = await getToken();
      authRefreshes++;
      if (!token) break;
      continue;
    }

    if (result.success) {
      const { updates, changes } = detectChanges(project, result.data);

      if (Object.keys(updates).length > 0) {
        updates.lastSyncedAt = new Date().toISOString();
        updates.lastSyncedSource = "dld-mashrooi-auto";
        batch.update(project.ref, updates);
        bc++;
        changed++;

        // Log the change
        changeLog.push({
          projectNumber: num,
          name: project.name,
          changes,
        });

        if (changed <= 10) {
          console.log(`  📝 "${project.name}" (#${num})`);
          Object.entries(changes).forEach(([k,v]) => console.log(`     ${k}: ${v}`));
        }

        if (bc >= 400) {
          await batch.commit();
          batch = db.batch(); bc = 0;
          console.log(`  💾 Committed batch`);
        }
      }
    } else if (result.error) {
      errors++;
    }

    checked++;
    if (checked % 200 === 0) {
      console.log(`  📊 ${checked}/${activeProjects.length} checked | ${changed} changed | ${errors} errors`);
    }

    await sleep(DELAY_MS);
  }

  if (bc > 0) await batch.commit();

  const elapsed = Math.round((Date.now() - startTime) / 1000);

  // Save sync log
  const logData = {
    date,
    timestamp: new Date().toISOString(),
    projectsChecked: checked,
    projectsChanged: changed,
    errors,
    authRefreshes,
    elapsedSeconds: elapsed,
    changes: changeLog,
  };

  const logFile = path.join(LOG_DIR, `sync-${date}.json`);
  fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));

  // Save to Firestore for dashboard visibility
  await db.collection("sync_logs").doc(date).set(logData);

  console.log(`\n✅ Sync complete in ${elapsed}s`);
  console.log(`   Checked:  ${checked}`);
  console.log(`   Changed:  ${changed}`);
  console.log(`   Errors:   ${errors}`);
  console.log(`   Log:      data/sync-logs/sync-${date}.json`);

  if (changed > 0) {
    console.log(`\n📋 Changes summary:`);
    changeLog.slice(0, 20).forEach(c => {
      console.log(`   "${c.name}" — ${Object.keys(c.changes).join(", ")}`);
    });
  }
}

// ─── SCHEDULER ────────────────────────────────────────────────────────────────
if (SCHEDULE) {
  const cron = require("node-cron");

  // Run every night at 2:00 AM Dubai time (GMT+4 = UTC+4, so 10:00 PM UTC)
  cron.schedule("0 22 * * *", async () => {
    console.log("\n⏰ Scheduled sync triggered");
    await runSync();
  }, { timezone: "UTC" });

  // Also run immediately on start
  console.log("🚀 Auto-sync scheduler started");
  console.log("⏰ Will sync every night at 2:00 AM Dubai time");
  console.log("   Running initial sync now...\n");
  runSync();

} else {
  // Manual run
  runSync().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
