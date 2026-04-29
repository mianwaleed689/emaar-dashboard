const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function run() {
  // Golf Grand - reference
  const golfSnap = await db.collection("projects").where("name","==","Golf Grand").get();
  const golf = golfSnap.docs[0].data();
  
  // Random DLD project
  const dldSnap = await db.collection("projects").where("dldImported","==",true).limit(3).get();
  const dld = dldSnap.docs[0].data();

  // Key fields to compare
  const FIELDS = [
    // Identity
    {label:"Name",              golf:golf.name,              dld:dld.name},
    {label:"Developer",         golf:golf.developer,         dld:dld.developer},
    {label:"Community",         golf:golf.community,         dld:dld.community},
    {label:"Status",            golf:golf.status,            dld:dld.status},
    // Pricing
    {label:"Price Min",         golf:golf.priceMin,          dld:dld.priceMin},
    {label:"Price Estimate?",   golf:golf.priceMinIsEstimate||false, dld:dld.priceMinIsEstimate||false},
    {label:"PPSF",              golf:golf.ppsf,              dld:dld.ppsf},
    {label:"Payment Plan",      golf:golf.paymentPlan,       dld:dld.paymentPlan},
    // Yield
    {label:"Gross Yield",       golf:golf.grossYield+"%",    dld:(dld.grossYield||"--")+"%"},
    {label:"Yield Source",      golf:golf.grossYieldSource||"manual", dld:dld.grossYieldSource||"--"},
    {label:"Net Yield",         golf:golf.netYield,          dld:dld.netYield},
    {label:"Avg Annual Rent",   golf:golf.avgAnnualRent||"--", dld:dld.avgAnnualRent||"--"},
    // Construction
    {label:"Construction %",    golf:golf.constructionPct+"%", dld:(dld.constructionPct||0)+"%"},
    {label:"Handover",          golf:golf.handoverQuarter||golf.handover, dld:dld.handoverQuarter||"--"},
    {label:"Total Units",       golf:golf.totalUnits,        dld:dld.totalUnits||"--"},
    // Unit details
    {label:"Size Min (sqft)",   golf:golf.sizeMin,           dld:dld.sizeMin||"--"},
    {label:"Size Max (sqft)",   golf:golf.sizeMax,           dld:dld.sizeMax||"--"},
    {label:"Beds",              golf:golf.beds?.join(","),   dld:dld.beds?.join(",")||"--"},
    {label:"Unit Breakdown",    golf:"YES (1BR/2BR/3BR)",    dld:dld.unitBreakdown?"YES":"NO"},
    // Facilities
    {label:"Nearest Metro",     golf:golf.nearestMetro,      dld:dld.nearestMetro||"--"},
    {label:"Dist Metro",        golf:golf.distMetro+"km",    dld:(dld.distMetro||"--")+"km"},
    {label:"Nearest Mall",      golf:golf.nearestMall,       dld:dld.nearestMall||"--"},
    {label:"Nearest Hospital",  golf:golf.nearestHospital,   dld:dld.nearestHospital||"--"},
    {label:"Nearest School",    golf:golf.nearestSchool||"--", dld:dld.nearestSchool||"--"},
    // Developer
    {label:"Developer Tier",    golf:golf.developerTier,     dld:dld.developerTier||"--"},
    {label:"Developer Founded", golf:golf.developerFounded,  dld:dld.developerFounded||"--"},
    {label:"Developer OnTime",  golf:golf.developerOnTimeRate||"--", dld:dld.developerOnTimeRate||"--"},
    {label:"Escrow Bank",       golf:golf.escrowBank,        dld:dld.escrowBank||"--"},
    // Investment
    {label:"Investment Score",  golf:golf.investmentScore,   dld:dld.investmentScore||dld.communityInvestScore||"--"},
    {label:"Golden Visa",       golf:golf.goldenVisa,        dld:dld.goldenVisa||"--"},
    {label:"Service Charge",    golf:golf.serviceCharge,     dld:dld.serviceCharge||"--"},
    {label:"Supply Risk",       golf:golf.supplyRisk||"--",  dld:dld.supplyRisk||"--"},
    // Coordinates
    {label:"Coordinates",       golf:"YES",                  dld:dld.coordinates?"YES":"NO"},
  ];

  console.log("DLD Project:", dld.name, "|", dld.community);
  console.log("\n"+("FIELD").padEnd(22)+" | "+"GOLF GRAND".padEnd(30)+" | "+"DLD PROJECT".padEnd(25)+" | STATUS");
  console.log("-".repeat(100));
  
  FIELDS.forEach(f=>{
    const gVal = String(f.golf||"--").substring(0,28);
    const dVal = String(f.dld||"--").substring(0,23);
    const missing = f.dld==="--"||f.dld===false||f.dld===null||f.dld===undefined;
    const status = missing?"MISSING":"OK";
    console.log(f.label.padEnd(22)+" | "+gVal.padEnd(30)+" | "+dVal.padEnd(25)+" | "+status);
  });
  
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});