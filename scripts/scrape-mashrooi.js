/**
 * scrape-mashrooi.js v5 - FINAL WITH AUTO-AUTH
 * 
 * Fully automatic — no manual token needed ever again.
 * Authenticates as guest using DLD's own method.
 * 
 * Run: node scripts/scrape-mashrooi.js
 * Run: node scripts/scrape-mashrooi.js --limit 10
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const LIMIT = parseInt(args[args.indexOf("--limit") + 1]) || 0;
const DELAY_MS = 1200;
const CONSUMER_ID = "gkb3WvEG0rY9eilwXC0P2pTz8UzvLj9F";
const MASHROOI_BASE = "https://b2c.dubailand.gov.ae/mashrooi";

const OUTPUT_FILE = path.join(__dirname, "../data/mashrooi-names.json");
let results = {};
if (fs.existsSync(OUTPUT_FILE)) {
  results = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
  console.log(`📂 Resuming: ${Object.keys(results).length} already fetched`);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function httpsRequest(hostname, path, method, headers, postData) {
  return new Promise((resolve) => {
    const options = {
      hostname, path, method,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", ...headers },
      timeout: 15000,
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve({
        status: res.statusCode,
        data,
        token: res.headers["token"] || res.headers["Token"] || null
      }));
    });
    req.on("error", e => resolve({ status: 0, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ status: 0, error: "timeout" }); });
    if (postData) req.write(postData);
    req.end();
  });
}

async function getToken() {
  const params = {
    ApplicationKey: "MyBrowser",
    MethodIdentity: "guest",
    MethodPasscode: "",
    Platform: "DESKTOP",
    Method: "ANONYMOUS",
    DeviceKey: `dxb-analytics-${Date.now()}`,
  };
  const authHeader = "Basic " + Buffer.from(JSON.stringify(params)).toString("base64");

  const res = await httpsRequest(
    "b2c.dubailand.gov.ae",
    "/mashrooi/authenticate",
    "POST",
    {
      "consumer-id": CONSUMER_ID,
      "Authorization": authHeader,
      "Content-Type": "application/json",
      "Origin": "https://dubailand.gov.ae",
      "Referer": "https://dubailand.gov.ae/",
    }
  );

  if (res.token) return res.token;
  if (res.status === 200) {
    try {
      const json = JSON.parse(res.data);
      return json.response?.token || null;
    } catch(e) {}
  }
  return null;
}

async function fetchProject(num, token) {
  const res = await httpsRequest(
    "b2c.dubailand.gov.ae",
    `/mashrooi/projects/searchlite?keywords=${num}&`,
    "GET",
    {
      "consumer-id": CONSUMER_ID,
      "Token": token,
      "Accept": "application/json",
      "Origin": "https://dubailand.gov.ae",
      "Referer": "https://dubailand.gov.ae/",
    }
  );

  const newToken = res.token;

  if (res.status === 200) {
    try {
      const json = JSON.parse(res.data);
      if (json.responseCode === "Success" && json.response?.projects?.length > 0) {
        const project = json.response.projects.find(p => String(p.number) === String(num))
                     || json.response.projects[0];
        if (project) {
          return {
            success: true, newToken,
            data: {
              number: project.number,
              nameEn: project.name?.englishName || "",
              nameAr: project.name?.arabicName || "",
              status: project.status?.englishName || "",
              completionRatio: project.completionRatio || 0,
              developerName: project.developer?.name?.englishName || project.mainDeveloper?.name?.englishName || "",
              developerNumber: project.developer?.number || project.mainDeveloper?.number || "",
              developerUrl: project.developer?.contact?.url || "",
              lat: project.location?.googleCoordinates?.latitude || null,
              lng: project.location?.googleCoordinates?.longitude || null,
              area: project.location?.area?.englishName || "",
              street: project.location?.street?.englishName || "",
            }
          };
        }
      }
      return { success: false, newToken, reason: "no_match" };
    } catch(e) { return { success: false, error: e.message }; }
  } else if (res.status === 401) {
    return { success: false, reason: "auth_expired" };
  }
  return { success: false, status: res.status };
}

async function main() {
  console.log("🔑 Auto-authenticating with DLD Mashrooi...");
  let token = await getToken();
  if (!token) {
    // Fallback to manual token
    const ti = args.indexOf("--token");
    token = ti >= 0 ? args[ti + 1] : null;
    if (!token) { console.error("❌ Auth failed and no --token provided."); process.exit(1); }
    console.log("Using manual token fallback.");
  } else {
    console.log("✅ Auto-auth successful — no manual token needed!");
  }

  const csvPath = path.join(__dirname, "../numbered-projects.csv");
  if (!fs.existsSync(csvPath)) { console.error("❌ numbered-projects.csv not found."); process.exit(1); }

  const lines = fs.readFileSync(csvPath, "utf8").split("\n").slice(1);
  const allNumbers = lines.map(l => l.split(",")[0]?.trim()).filter(n => n && /^\d+$/.test(n));
  const remaining = allNumbers.filter(n => !results[n]);
  const toProcess = LIMIT > 0 ? remaining.slice(0, LIMIT) : remaining;

  console.log(`📋 Total: ${allNumbers.length} | Done: ${allNumbers.length - remaining.length} | To go: ${toProcess.length}`);
  console.log(`⏱️  Est: ~${Math.round(toProcess.length * DELAY_MS / 60000)} min\n`);

  let found = 0, notFound = 0, errors = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const num = toProcess[i];
    let result = await fetchProject(num, token);
    if (result.newToken) token = result.newToken;

    if (result.reason === "auth_expired") {
      console.log(`\n🔄 Re-authenticating...`);
      token = await getToken();
      if (token) result = await fetchProject(num, token);
    }

    if (result.success) {
      results[num] = result.data;
      found++;
      if (i < 5 || found % 100 === 0)
        console.log(`  [${i+1}/${toProcess.length}] #${num} → "${result.data.nameEn}" | ${result.data.developerName} | ${result.data.completionRatio}%`);
    } else if (result.reason === "no_match") {
      results[num] = { nameEn: null, noMatch: true };
      notFound++;
    } else {
      errors++;
      if (errors <= 3) console.log(`  ❌ #${num}: ${JSON.stringify(result)}`);
    }

    if ((i + 1) % 100 === 0) {
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
      console.log(`  💾 Saved | ${i+1}/${toProcess.length} | ✅${found} ⬜${notFound} ❌${errors}`);
    }
    await sleep(DELAY_MS);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`\n✅ Done! Found: ${found} | Not found: ${notFound} | Errors: ${errors}`);
  console.log(`\nNext: node scripts/apply-mashrooi-names.js --dry`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
