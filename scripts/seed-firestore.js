const admin = require("firebase-admin");
const path = require("path");
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function seed() {
  console.log("🚀 Seeding Firestore...\n");
  
  await db.collection("marketData").doc("global").set({
    totalMarketValue: "AED 682.5B", totalTransactions: "214,912",
    totalTransactionsNum: 214912, yoyGrowth: "+30.64%", period: "FY 2025",
    avgPpsf: "AED 1,689", avgPpsfNum: 1689, avgPpsfYoy: "+19.8%",
    offPlanShare: "60%+", cashBuyerPct: 87, topBuyer: "Indian (22%)",
    avgGrossYield: 6.9, valuStratDate: "Dec 2025",
    updatedAt: "2026-01-01", updatedBy: "admin"
  });
  console.log("✅ marketData/global done");

  await db.collection("marketData").doc("eibor").set({
    overnight: 3.3755, oneWeek: 3.6728, oneMonth: 3.6426,
    threeMonth: 3.6387, sixMonth: 3.5999, twelveMonth: 3.8346,
    asOf: "2026-03-27", source: "UAE Central Bank",
    autoFetched: false, updatedAt: new Date().toISOString()
  });
  console.log("✅ marketData/eibor done");

  await db.collection("developers").doc("emaar").set({
    id: "emaar", name: "Emaar Properties", ticker: "EMAAR.AE", tier: "live",
    propertySales: 80.4, propertySalesYoy: "+16%",
    revenue: 49.6, revenueYoy: "+40%",
    ebitda: 25.6, netProfit: 25.7, netProfitYoy: "+36%",
    backlog: 155, backlogYoy: "+39%",
    dividendPerShare: 1.00, dividendTotal: 8.8,
    grossMargin: 57.5, netMargin: 35.5,
    uaeSales: 71.1, internationalSales: 9.3,
    mallRevenue: 6.3, hospitalityRevenue: 4.2,
    cashBalance: 25.4, landBank: 618,
    unitsDeliveredTotal: "125,600+", newLaunches2025: 48,
    creditRatingSP: "BBB+", creditRatingMoodys: "Baa1",
    creditRatingFitch: "BBB", creditOutlook: "Stable",
    primaryRating: "BBB+", primaryRatingAgency: "S&P Global",
    ratingDate: "Jun 2025",
    latestReportLabel: "Annual Report FY2025",
    latestReportDate: "Feb 2026",
    financialHistory: [
      {year:"2020",revenue:14.9,netProfit:2.7,propertySales:14.0,backlog:28},
      {year:"2021",revenue:27.9,netProfit:6.6,propertySales:23.9,backlog:32},
      {year:"2022",revenue:24.9,netProfit:8.1,propertySales:30.7,backlog:41.5},
      {year:"2023",revenue:26.7,netProfit:15.1,propertySales:40.3,backlog:71.8},
      {year:"2024",revenue:35.5,netProfit:18.9,propertySales:69.5,backlog:111.5},
      {year:"2025",revenue:49.6,netProfit:25.7,propertySales:80.4,backlog:155}
    ],
    autoFetched: false, updatedAt: new Date().toISOString()
  });
  console.log("✅ developers/emaar done");

  console.log("\n✅ ALL DONE — Check Firebase console");
  process.exit(0);
}

seed().catch(e => { console.error("❌ Error:", e.message); process.exit(1); });
