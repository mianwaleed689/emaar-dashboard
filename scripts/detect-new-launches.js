/**
 * detect-new-launches.js
 * 
 * Scans DLD Mashrooi for newly registered projects not in our database.
 * 
 * Strategy:
 * 1. Find the highest project number we have
 * 2. Scan from that number upwards in batches
 * 3. Any new project found → add to Firestore automatically
 * 4. Also check recently registered projects via DLD filters endpoint
 * 
 * Run manually:  node scripts/detect-new-launches.js
 * Run nightly:   add to auto-sync.js schedule
 * 
 * AED 0 cost — uses same free DLD API
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
const STATE_FILE = path.join(__dirname, "../data/new-launches-state.json");

// Load state (last scanned number)
let state = { lastScannedNumber: 4200, newProjectsFound: [], lastRun: null };
if (fs.existsSync(STATE_FILE)) {
  state = { ...state, ...JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getToken() {
  const params = {
    ApplicationKey: "MyBrowser", MethodIdentity: "guest", MethodPasscode: "",
    Platform: "DESKTOP", Method: "ANONYMOUS", DeviceKey: `dxb-newlaunch-${Date.now()}`,
  };
  return new Promise((resolve) => {
    const authHeader = "Basic " + Buffer.from(JSON.stringify(params)).toString("base64");
    const req = https.request({
      hostname: "b2c.dubailand.gov.ae", path: "/mashrooi/authenticate", method: "POST",
      headers: { "consumer-id": CONSUMER_ID, "Authorization": authHeader, "Content-Type": "application/json" },
      timeout: 15000,
    }, (res) => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => resolve(res.headers["token"] || res.headers["Token"] || null));
    });
    req.on("error", () => resolve(null));
    req.end();
  });
}

function fetchProject(num, token) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: "b2c.dubailand.gov.ae",
      path: `/mashrooi/projects/searchlite?keywords=${num}&`,
      method: "GET",
      headers: {
        "consumer-id": CONSUMER_ID, "Token": token,
        "Accept": "application/json", "Origin": "https://dubailand.gov.ae",
        "User-Agent": "Mozilla/5.0",
      }, timeout: 15000,
    }, (res) => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => {
        const newToken = res.headers["token"] || res.headers["Token"] || null;
        try {
          if (res.statusCode === 401) return resolve({ auth: true, newToken });
          const json = JSON.parse(d);
          if (json.responseCode === "Success" && json.response?.projects?.length > 0) {
            const p = json.response.projects.find(x => String(x.number) === String(num));
            if (p) return resolve({
              found: true, newToken,
              project: {
                name: p.name?.englishName || "",
                nameAr: p.name?.arabicName || "",
                status: p.status?.englishName || "",
                completionRatio: p.completionRatio || 0,
                developerActual: p.developer?.name?.englishName || p.mainDeveloper?.name?.englishName || "",
                developerNumber: p.developer?.number || "",
                lat: p.location?.googleCoordinates?.latitude || null,
                lng: p.location?.googleCoordinates?.longitude || null,
                area: p.location?.area?.englishName || "",
                street: p.location?.street?.englishName || "",
              }
            });
          }
          resolve({ found: false, newToken });
        } catch(e) { resolve({ found: false, error: e.message, newToken }); }
      });
    });
    req.on("error", e => resolve({ found: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ found: false, error: "timeout" }); });
    req.end();
  });
}

// Also try to get recently registered projects from filters endpoint
function fetchRecentProjects(token) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: "b2c.dubailand.gov.ae",
      path: "/mashrooi/projects/filters",
      method: "GET",
      headers: {
        "consumer-id": CONSUMER_ID, "Token": token,
        "Accept": "application/json", "Origin": "https://dubailand.gov.ae",
        "User-Agent": "Mozilla/5.0",
      }, timeout: 15000,
    }, (res) => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => {
        try {
          const json = JSON.parse(d);
          resolve({ success: true, data: json });
        } catch(e) { resolve({ success: false }); }
      });
    });
    req.on("error", () => resolve({ success: false }));
    req.end();
  });
}

function buildProjectDoc(num, data) {
  const isNumbered = !data.name || data.name.match(/^\d+$/) || data.name === "";
  return {
    // Identity
    name: isNumbered ? `DLD Project ${num}` : data.name,
    nameAr: data.nameAr || "",
    nameSource: isNumbered ? "dld-auto" : "dld-mashrooi-api",
    projectNumber: parseInt(num),
    dldProjectNumber: parseInt(num),

    // Developer
    developer: data.developerActual || "Unknown",
    developerActual: data.developerActual || "",

    // Status
    status: data.status === "Active" ? "Off-Plan" : data.status || "Off-Plan",
    dldProjectStatus: data.status === "Finished" ? "Ready (DLD Registered)" : "Off-Plan (RERA Registered)",
    active: data.status !== "Cancelled",
    archived: false,
    visibility: "published",

    // Construction
    constructionPct: data.completionRatio || 0,
    constructionBand: data.completionRatio >= 100 ? "Completed" :
                      data.completionRatio >= 75 ? "Near Completion" :
                      data.completionRatio >= 50 ? "Mid Construction" :
                      data.completionRatio >= 25 ? "Early Construction" :
                      data.completionRatio > 0 ? "Foundation Stage" : "Pre-Construction",

    // Location
    lat: data.lat || null,
    lng: data.lng || null,
    coordinates: data.lat ? { lat: data.lat, lng: data.lng } : null,
    area: data.area || "",
    community: data.area || "",
    city: "Dubai",
    emirate: "Dubai",
    country: "UAE",

    // Defaults
    freehold: true,
    foreignOwnership: true,
    dldRegistered: true,
    reraRegistered: true,
    mortgageAvailable: true,
    goldenVisaEligible: false,

    // Sources
    sources: [{
      name: "DLD Mashrooi Project Registry",
      url: "https://dubailand.gov.ae",
      type: "government",
      tier: "primary",
      covers: `Project #${num}: auto-discovered via DLD API`,
      verifiedAt: new Date().toISOString().split("T")[0],
    }],
    dataQualityScore: 40,
    dataSource: "dld-mashrooi-auto-discovery",

    // Timestamps
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    autoDiscoveredAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
  };
}

async function getHighestProjectNumber() {
  // Get from our existing Firestore data
  const snap = await db.collection("projects")
    .orderBy("projectNumber", "desc")
    .limit(1)
    .get();
  if (!snap.empty) {
    return snap.docs[0].data().projectNumber || 4200;
  }
  return 4200;
}

async function getExistingProjectNumbers() {
  const snap = await db.collection("projects").get();
  const numbers = new Set();
  snap.docs.forEach(d => {
    const n = d.data().projectNumber || d.data().dldProjectNumber;
    if (n) numbers.add(String(n));
  });
  return numbers;
}

async function main() {
  console.log("\n🔍 DXB Analytics — New Launch Detector");
  console.log(`📅 ${new Date().toLocaleString("en-AE", { timeZone: "Asia/Dubai" })} (Dubai time)\n`);

  // Get token
  let token = await getToken();
  if (!token) { console.error("❌ Auth failed"); process.exit(1); }
  console.log("✅ Authenticated");

  // Get existing project numbers
  const existing = await getExistingProjectNumbers();
  console.log(`📦 ${existing.size} projects already in database`);

  // Find highest number we have
  const highestNum = await getHighestProjectNumber();
  const scanFrom = Math.max(state.lastScannedNumber, highestNum);
  const scanTo = scanFrom + 100; // Scan next 100 numbers each run

  console.log(`🔢 Scanning project numbers ${scanFrom} → ${scanTo}`);
  console.log(`   (DLD registers ~5-10 new projects per day)\n`);

  let newFound = 0, scanned = 0;
  const newProjects = [];

  for (let num = scanFrom + 1; num <= scanTo; num++) {
    if (existing.has(String(num))) {
      scanned++;
      continue;
    }

    const result = await fetchProject(num, token);
    if (result.newToken) token = result.newToken;

    if (result.auth) {
      token = await getToken();
      if (!token) break;
    }

    if (result.found) {
      newFound++;
      const projectData = result.project;
      console.log(`  🆕 NEW: #${num} "${projectData.name}" | ${projectData.developerActual} | ${projectData.completionRatio}%`);

      // Add to Firestore
      const docData = buildProjectDoc(num, projectData);
      await db.collection("projects").add(docData);

      newProjects.push({ number: num, ...projectData });

      // Also save to state
      state.newProjectsFound.push({
        number: num,
        name: projectData.name,
        developer: projectData.developerActual,
        discoveredAt: new Date().toISOString(),
      });
    }

    scanned++;
    await sleep(DELAY_MS);
  }

  // Update state
  state.lastScannedNumber = scanTo;
  state.lastRun = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

  // Also check if any of our existing numbered projects now have names
  // (DLD sometimes adds names to previously unnamed projects)
  console.log("\n🔄 Checking if any unnamed projects got names from DLD...");
  const unnamedSnap = await db.collection("projects")
    .where("nameSource", "==", "dld-auto")
    .limit(50)
    .get();

  let renamed = 0;
  for (const doc of unnamedSnap.docs) {
    const p = doc.data();
    const num = p.projectNumber || p.dldProjectNumber;
    if (!num) continue;

    const result = await fetchProject(num, token);
    if (result.newToken) token = result.newToken;

    if (result.found && result.project.name && !result.project.name.match(/^\d+$/)) {
      await doc.ref.update({
        name: result.project.name,
        nameAr: result.project.nameAr,
        nameSource: "dld-mashrooi-api",
        lastSyncedAt: new Date().toISOString(),
      });
      console.log(`  ✅ Renamed: #${num} → "${result.project.name}"`);
      renamed++;
    }
    await sleep(500);
  }

  console.log(`\n✅ Done!`);
  console.log(`   Scanned: ${scanTo - scanFrom} numbers`);
  console.log(`   New projects found: ${newFound}`);
  console.log(`   Previously unnamed now named: ${renamed}`);
  console.log(`   Next scan will start from: ${scanTo}`);

  if (newFound > 0) {
    console.log(`\n🎉 NEW LAUNCHES:`);
    newProjects.forEach(p => {
      console.log(`   #${p.number} "${p.name}" by ${p.developerActual}`);
    });
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
