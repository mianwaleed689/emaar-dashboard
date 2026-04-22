import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const sa = JSON.parse(readFileSync("./dxb-analytics-firebase-adminsdk-fbsvc-d170435fc0.json","utf8"));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const sobhaData = {
  id:"sobha", name:"Sobha Realty", legalName:"Sobha Realty LLC",
  founded:1976, founderDubai:2003, founder:"PNC Menon", chairman:"Ravi Menon",
  hq:"Mohammed Bin Rashid City, Dubai, UAE", type:"Private", listed:false,
  tier:"T1", segment:"Premium → Ultra-Luxury", color:"#8B5CF6",
  website:"https://sobharealty.com", confidence:"VERIFIED",
  usp:"100% backward integration — in-house design, build and delivery",
  propertySales:30.0, propertySalesUSD:8.17, revenue:21.8, netProfit:5.6,
  yoyGrowth:"+30%", uaqSales:8.0, uaePortfolio:14, unitsDelivered:27000,
  underConstruction:26933, employees:3200,
  rank:"#3 Dubai Developer by Sales Volume (Aug 2025)",
  markets:["UAE","India","Bahrain","USA","Australia","UK"],
  communities:["Sobha Hartland","Sobha Hartland II","Sobha Seahaven","Sobha One","Sobha Reserve","Sobha Siniya Island","Sobha SkyParks","Downtown UAQ"],
  latestReportLabel:"FY2025 Sales Results", latestReportDate:"January 2026",
  financialHistory:[
    {year:2020,revenue:4.2,netProfit:0.8,propertySales:7.2},
    {year:2021,revenue:5.8,netProfit:1.1,propertySales:9.8},
    {year:2022,revenue:8.1,netProfit:1.9,propertySales:14.2},
    {year:2023,revenue:11.4,netProfit:2.8,propertySales:18.5},
    {year:2024,revenue:16.2,netProfit:4.1,propertySales:23.1},
    {year:2025,revenue:21.8,netProfit:5.6,propertySales:30.0},
  ],
  sobhaRisks:[
    {factor:"Vertical Integration Risk",level:4,likelihood:3,impact:4,score:48,assessment:"MODERATE",color:"#F59E0B"},
    {factor:"Geographic Concentration",level:3,likelihood:3,impact:4,score:36,assessment:"MODERATE",color:"#D4A843"},
    {factor:"Private Ownership",level:3,likelihood:2,impact:4,score:24,assessment:"MODERATE",color:"#D4A843"},
    {factor:"Premium Pricing Risk",level:3,likelihood:3,impact:3,score:27,assessment:"MODERATE",color:"#D4A843"},
    {factor:"Construction Pipeline",level:3,likelihood:2,impact:4,score:24,assessment:"MODERATE",color:"#D4A843"},
    {factor:"Currency Risk (AED Peg)",level:1,likelihood:1,impact:2,score:2,assessment:"VERY LOW",color:"#10B981"},
    {factor:"Regulatory Risk",level:1,likelihood:1,impact:2,score:2,assessment:"VERY LOW",color:"#10B981"},
    {factor:"Demand Sustainability",level:2,likelihood:2,impact:3,score:12,assessment:"LOW",color:"#10B981"},
  ],
  sobhaSegments:[
    {name:"Dubai Residential",revenue:16.4,growth:"+28%",color:"#8B5CF6"},
    {name:"UAQ / Siniya Island",revenue:4.2,growth:"+120%",color:"#00BFA5"},
    {name:"International Markets",revenue:1.2,growth:"+85%",color:"#3B82F6"},
  ],
  sobhaRadar:[
    {metric:"Build Quality",sobha:98,emaar:85,damac:78,market:70},
    {metric:"Sales Volume",sobha:78,emaar:100,damac:92,market:70},
    {metric:"Delivery Record",sobha:92,emaar:92,damac:82,market:72},
    {metric:"Yield Performance",sobha:82,emaar:78,damac:85,market:70},
    {metric:"Price Appreciation",sobha:86,emaar:86,damac:83,market:72},
    {metric:"Community Scale",sobha:72,emaar:88,damac:90,market:68},
    {metric:"International Reach",sobha:68,emaar:72,damac:80,market:55},
    {metric:"Financial Strength",sobha:72,emaar:95,damac:75,market:65},
  ],
  source:"Sobha Official Press Release Jan 2026 · DLD · Zawya · Khaleej Times · Bayut",
  seededAt:new Date().toISOString(), updatedAt:new Date().toISOString(), autoFetched:false,
};

async function seed() {
  try {
    await db.collection("developers").doc("sobha").set(sobhaData, { merge:true });
    console.log("✅ Sobha seeded to Firestore developers/sobha");
    await db.collection("marketData").doc("developerRegistry").set({
      sobha:{id:"sobha",name:"Sobha Realty",tier:"T1",salesValue2025:30.0,salesUSD2025:8.17,
        unitsDelivered:27000,underConstruction:26933,segment:"Premium → Ultra-Luxury",
        color:"#8B5CF6",rank:3,chairman:"Ravi Menon",founded:1976,listed:false,
        communities:8,projects:18,usp:"100% backward integration",confidence:"VERIFIED"},
      updatedAt:new Date().toISOString()
    },{merge:true});
    console.log("✅ Sobha added to developerRegistry");
  } catch(e){ console.error("❌",e.message); } finally { process.exit(0); }
}
seed();
