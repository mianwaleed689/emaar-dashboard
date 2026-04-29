/**
 * scrape-brokers.js
 * 
 * Downloads all 33,827 licensed Dubai brokers from DLD.
 * Data: name, office, rank (GOLD/SILVER/etc), card rating, license dates,
 *       phone, email, photo URL, office logo URL.
 * 
 * Output: data/dld-brokers.json
 * Then: node scripts/apply-brokers.js to import into Firestore
 * 
 * Run: node scripts/scrape-brokers.js --limit 50  (test)
 * Run: node scripts/scrape-brokers.js             (all ~34k, ~3 hours)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const LIMIT = parseInt(args[args.indexOf("--limit") + 1]) || 0;
const PAGE_SIZE = 100;
const DELAY_MS = 800;
const CONSUMER_ID = "gkb3WvEG0rY9eilwXC0P2pTz8UzvLj9F";

const OUTPUT_FILE = path.join(__dirname, "../data/dld-brokers.json");
let existing = {};
if (fs.existsSync(OUTPUT_FILE)) {
  const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
  existing = data;
  console.log(`📂 Resuming: ${Object.keys(existing).length} already fetched`);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getToken() {
  const params = {
    ApplicationKey: "MyBrowser", MethodIdentity: "guest", MethodPasscode: "",
    Platform: "DESKTOP", Method: "ANONYMOUS", DeviceKey: `dxb-analytics-${Date.now()}`,
  };
  return new Promise((resolve) => {
    const postData = "";
    const authHeader = "Basic " + Buffer.from(JSON.stringify(params)).toString("base64");
    const options = {
      hostname: "b2c.dubailand.gov.ae", path: "/mashrooi/authenticate", method: "POST",
      headers: {
        "consumer-id": CONSUMER_ID, "Authorization": authHeader,
        "Content-Type": "application/json", "Origin": "https://dubailand.gov.ae",
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

function fetchBrokersPage(pageNumber, token) {
  return new Promise((resolve) => {
    const options = {
      hostname: "gateway.dubailand.gov.ae",
      path: `/brokers/?pageSize=${PAGE_SIZE}&pageNumber=${pageNumber}`,
      method: "GET",
      headers: {
        "consumer-id": CONSUMER_ID, "Token": token,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Origin": "https://dubailand.gov.ae",
      }, timeout: 20000,
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try {
          if (res.status === 401 || res.statusCode === 401) return resolve({ auth: true });
          const json = JSON.parse(data);
          resolve({ brokers: json.Response || [], total: json.TotalRowsCount || 0 });
        } catch(e) { resolve({ error: e.message, raw: data.substring(0, 100) }); }
      });
    });
    req.on("error", e => resolve({ error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ error: "timeout" }); });
    req.end();
  });
}

async function main() {
  console.log("🔑 Getting token...");
  let token = await getToken();
  if (!token) {
    const ti = args.indexOf("--token");
    token = ti >= 0 ? args[ti + 1] : null;
    if (!token) { console.error("❌ No token."); process.exit(1); }
  } else {
    console.log("✅ Auto-auth successful!");
  }

  // Find total
  const first = await fetchBrokersPage(1, token);
  if (first.error) { console.error("❌ First page failed:", first.error); process.exit(1); }
  
  const total = first.total;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const alreadyDone = Object.keys(existing).length;
  const startPage = Math.floor(alreadyDone / PAGE_SIZE) + 1;
  
  console.log(`📋 Total brokers: ${total.toLocaleString()} | Pages: ${totalPages} | Resuming from page: ${startPage}`);
  const maxPage = LIMIT > 0 ? Math.min(startPage + Math.ceil(LIMIT/PAGE_SIZE) - 1, totalPages) : totalPages;
  console.log(`🚀 Processing pages ${startPage}-${maxPage} (~${Math.round((maxPage-startPage+1)*DELAY_MS/60000)} min)\n`);

  let saved = 0;

  // Process first page results
  if (startPage === 1) {
    first.brokers.forEach(b => {
      existing[b.CardNumber] = normalizeBroker(b);
      saved++;
    });
  }

  for (let page = Math.max(startPage, 2); page <= maxPage; page++) {
    const res = await fetchBrokersPage(page, token);
    
    if (res.auth) {
      console.log(`\n🔄 Re-authenticating at page ${page}...`);
      token = await getToken();
      if (!token) { console.error("❌ Re-auth failed"); break; }
      const retry = await fetchBrokersPage(page, token);
      if (retry.brokers) res.brokers = retry.brokers;
    }

    if (res.brokers) {
      res.brokers.forEach(b => {
        existing[b.CardNumber] = normalizeBroker(b);
        saved++;
      });

      if (page % 10 === 0 || page <= 3) {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existing, null, 2));
        console.log(`  💾 Page ${page}/${maxPage} | ${Object.keys(existing).length.toLocaleString()} brokers saved`);
      }
    } else if (res.error) {
      console.log(`  ⚠️  Page ${page}: ${res.error}`);
    }

    await sleep(DELAY_MS);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existing, null, 2));
  console.log(`\n✅ Done! Total brokers saved: ${Object.keys(existing).length.toLocaleString()}`);
  console.log(`\nNext: node scripts/apply-brokers.js --dry`);
  process.exit(0);
}

function normalizeBroker(b) {
  return {
    cardNumber: b.CardNumber,
    nameEn: b.CardHolderNameEn || "",
    nameAr: b.CardHolderNameAr || "",
    phone: (b.CardHolderPhone || b.CardHolderMobile || "").replace("971|", "+971-"),
    mobile: (b.CardHolderMobile || "").replace("971|", "+971-"),
    email: b.CardHolderEmail || "",
    photo: b.CardHolderPhoto || "",
    licenseNumber: b.LicenseNumber || "",
    issueDate: b.CardIssueDate?.substring(0, 10) || "",
    expiryDate: b.CardExpiryDate?.substring(0, 10) || "",
    cardRank: b.CardRank || "",
    cardRankId: b.CardRankId || 0,
    officeId: b.RealEstateNumber || "",
    officeNameEn: b.OfficeNameEn || "",
    officeNameAr: b.OfficeNameAr || "",
    officeLogo: b.OfficeLogo || "",
    officeRank: b.OfficeRank || "",
    officeRankId: b.OfficeRankId || 0,
    officeIssueDate: b.OfficeIssueDate?.substring(0, 10) || "",
    officeExpiryDate: b.OfficeExpiryDate?.substring(0, 10) || "",
    awardsCount: b.AwardsCount || 0,
  };
}

main().catch(e => { console.error(e); process.exit(1); });
