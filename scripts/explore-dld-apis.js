/**
 * explore-dld-apis.js
 * 
 * Explores all DLD API endpoints discovered from apiConfig.
 * Uses same consumer-id as Mashrooi scraper.
 * Run: node scripts/explore-dld-apis.js --token "YOUR_TOKEN"
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const CONSUMER_ID = "gkb3WvEG0rY9eilwXC0P2pTz8UzvLj9F";
const token = process.argv[process.argv.indexOf("--token") + 1] || "";

function httpsGet(url, extraHeaders = {}) {
  return new Promise((resolve) => {
    let u;
    try { u = new URL(url); } catch(e) { return resolve({ status: 0, error: "bad url" }); }
    
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: "GET",
      headers: {
        "consumer-id": CONSUMER_ID,
        "Token": token,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Origin": "https://dubailand.gov.ae",
        "Referer": "https://dubailand.gov.ae/",
        ...extraHeaders,
      },
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve({ status: res.statusCode, data }));
    });
    req.on("error", e => resolve({ status: 0, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ status: 0, error: "timeout" }); });
    req.end();
  });
}

const ENDPOINTS = [
  // ── RENTAL INDEX ─────────────────────────────────────────────────────────
  { name: "Rental Index - Residential Areas", url: "https://ext.dubailand.gov.ae/rentalindex/GetResidentialSubAreas" },
  { name: "Rental Index - Commercial Areas",  url: "https://ext.dubailand.gov.ae/rentalindex/GetCommercialSubAreas" },
  { name: "Rental Index V2 - Areas",          url: "https://ext.dubailand.gov.ae/rentalindex-v2/GetResidentialSubAreas" },
  { name: "Rental Index V2 - Rates",          url: "https://ext.dubailand.gov.ae/rentalindex-v2/GetRentalRates?areaCode=1&bedrooms=1&propertyType=1&year=2025" },
  { name: "Rental Index V2 - All",            url: "https://ext.dubailand.gov.ae/rentalindex-v2/" },

  // ── MARKET INDEXES ───────────────────────────────────────────────────────
  { name: "Indexes API - Root",               url: "https://gateway.dubailand.gov.ae/indexes-api" },
  { name: "Indexes API - Price Index",        url: "https://gateway.dubailand.gov.ae/indexes-api/priceindex" },
  { name: "Indexes API - Volume",             url: "https://gateway.dubailand.gov.ae/indexes-api/volumeindex" },
  { name: "Indexes API - Residential",        url: "https://gateway.dubailand.gov.ae/indexes-api/residentialindex" },
  { name: "Indexes API - Community",          url: "https://gateway.dubailand.gov.ae/indexes-api/communityindex" },

  // ── OPEN DATA ────────────────────────────────────────────────────────────
  { name: "Open Data - Root",                 url: "https://gateway.dubailand.gov.ae/open-data" },
  { name: "Open Data - Transactions",         url: "https://gateway.dubailand.gov.ae/open-data/transactions?pageSize=5&pageNumber=1" },
  { name: "Open Data - Projects",             url: "https://gateway.dubailand.gov.ae/open-data/projects?pageSize=5&pageNumber=1" },

  // ── BROKERS ──────────────────────────────────────────────────────────────
  { name: "Brokers - List",                   url: "https://gateway.dubailand.gov.ae/brokers/?pageSize=5&pageNumber=1" },
  { name: "Brokers - Transactions",           url: "https://gateway.dubailand.gov.ae/brokers/transactions?pageSize=5" },
  { name: "Broker Search",                    url: "https://gateway.dubailand.gov.ae/card/office/search?pageSize=5" },
  { name: "Broker Ranking",                   url: "https://gateway.dubailand.gov.ae/classification/api/brokerage/card/classification/detail/verified?pageSize=5" },
  { name: "Office Ranking",                   url: "https://gateway.dubailand.gov.ae/classification/api/brokerage/office/classification/detail/verified?pageSize=5" },

  // ── MOLLAK SERVICE CHARGES ───────────────────────────────────────────────
  { name: "Mollak - Public Root",             url: "https://gateway.dubailand.gov.ae/mollak/public" },
  { name: "Mollak - Service Charge",          url: "https://gateway.dubailand.gov.ae/rest.mollak/servicecharge?pageSize=5" },
  { name: "Mollak - Management Cos",          url: "https://gateway.dubailand.gov.ae/mollak/public/managementcompany?pageSize=5" },

  // ── ERES / EJAARI ─────────────────────────────────────────────────────────
  { name: "ERES API - Root",                  url: "https://gateway.dubailand.gov.ae/eresapi/" },
  { name: "ERES - Rental Contracts",          url: "https://gateway.dubailand.gov.ae/eresapi/rentalcontracts?pageSize=5" },

  // ── PROPERTY DATA ────────────────────────────────────────────────────────
  { name: "Property Images",                  url: "https://gateway.dubailand.gov.ae/prop-imgs?pageSize=3" },
  { name: "Mashrooi - Project Detail",        url: "https://b2c.dubailand.gov.ae/mashrooi/projects/2599" },
  { name: "Mashrooi - Units List",            url: "https://b2c.dubailand.gov.ae/mashrooi/projects/2599/units?pageSize=5" },
  { name: "Mashrooi - Inspection",            url: "https://b2c.dubailand.gov.ae/mashrooi/projects/2599/inspections" },
  { name: "Mashrooi - Escrow",                url: "https://b2c.dubailand.gov.ae/mashrooi/projects/2599/escrow" },
  { name: "Mashrooi - Developer Detail",      url: "https://b2c.dubailand.gov.ae/mashrooi/developers/984" },

  // ── VALUATION ────────────────────────────────────────────────────────────
  { name: "Taqyimee - Root",                  url: "https://b2c.dubailand.gov.ae/Taqyimee/" },
  { name: "RVS API",                          url: "https://gateway.dubailand.gov.ae/rvs.api/" },
];

async function main() {
  if (!token) {
    console.log("⚠️  No token provided. Some endpoints may return 401.");
    console.log("   Run: node scripts/explore-dld-apis.js --token YOUR_TOKEN\n");
  }

  console.log(`🔍 Exploring ${ENDPOINTS.length} DLD API endpoints...\n`);
  
  const results = { working: [], auth_needed: [], not_found: [], errors: [] };
  const OUTPUT = {};

  for (const ep of ENDPOINTS) {
    const res = await httpsGet(ep.url);
    let preview = "";
    let status = res.status;

    if (res.data) {
      try {
        const json = JSON.parse(res.data);
        const str = JSON.stringify(json);
        preview = str.substring(0, 150);
      } catch(e) {
        preview = res.data.substring(0, 100);
      }
    }

    const icon = status === 200 ? "✅" : status === 401 ? "🔒" : status === 404 ? "❌" : status === 405 ? "⚙️" : "⚠️";
    console.log(`${icon} [${status}] ${ep.name}`);
    if (status === 200 && preview) console.log(`        → ${preview}`);

    OUTPUT[ep.name] = { url: ep.url, status, preview };

    if (status === 200) results.working.push(ep.name);
    else if (status === 401) results.auth_needed.push(ep.name);
    else if (status === 404) results.not_found.push(ep.name);
    else results.errors.push(`${ep.name} (${status})`);

    await new Promise(r => setTimeout(r, 300));
  }

  // Save results
  fs.writeFileSync(
    path.join(__dirname, "../data/dld-api-exploration.json"),
    JSON.stringify(OUTPUT, null, 2)
  );

  console.log(`\n📊 SUMMARY:`);
  console.log(`  ✅ Working (200):     ${results.working.length}`);
  console.log(`  🔒 Need auth (401):  ${results.auth_needed.length}`);
  console.log(`  ❌ Not found (404):  ${results.not_found.length}`);
  console.log(`  ⚠️  Other errors:    ${results.errors.length}`);

  console.log(`\n✅ WORKING ENDPOINTS:`);
  results.working.forEach(n => console.log(`   - ${n}`));
  
  console.log(`\n🔒 AUTH NEEDED (try with fresh token):`);
  results.auth_needed.forEach(n => console.log(`   - ${n}`));

  console.log(`\n💾 Full results saved to data/dld-api-exploration.json`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
