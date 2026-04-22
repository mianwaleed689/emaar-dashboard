import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
const sa = JSON.parse(readFileSync("./dxb-analytics-firebase-adminsdk-fbsvc-d170435fc0.json","utf8"));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const nakheelData = {
  id:"nakheel", name:"Nakheel", founded:2000, parent:"Dubai Holding Real Estate",
  chairman:"Sheikh Ahmed bin Saeed Al Maktoum", ceo:"Khalid Al Malik",
  type:"Government-owned", tier:"T1", segment:"Waterfront + Master Communities",
  color:"#10B981", website:"https://www.nakheel.com", confidence:"VERIFIED",
  propertySales:24.6, propertySalesUSD:6.7, revenue:18.9, netProfit:5.1,
  unitsDelivered:1522, underConstruction:15000,
  rank:"#4 Dubai Developer by Sales", coastlineAdded:"300km",
  communities:["Palm Jumeirah","Palm Jebel Ali","Dubai Islands","JVC","Al Furjan","Nad Al Sheba"],
  latestReportLabel:"FY2025 DLD Data", latestReportDate:"Jan 2026",
  financialHistory:[
    {year:2020,revenue:5.67,netProfit:1.2,propertySales:9.8},
    {year:2021,revenue:7.2,netProfit:1.8,propertySales:12.4},
    {year:2022,revenue:9.8,netProfit:2.6,propertySales:16.8},
    {year:2023,revenue:12.4,netProfit:3.1,propertySales:19.2},
    {year:2024,revenue:15.8,netProfit:4.2,propertySales:22.6},
    {year:2025,revenue:18.9,netProfit:5.1,propertySales:24.6},
  ],
  nakheelRisks:[
    {factor:"Government Ownership — Policy Risk",level:2,likelihood:2,impact:3,score:12,assessment:"LOW",color:"#10B981"},
    {factor:"Mega Project Scale — Palm Jebel Ali",level:4,likelihood:3,impact:5,score:60,assessment:"ELEVATED",color:"#F59E0B"},
    {factor:"Retail Dependency",level:3,likelihood:2,impact:4,score:24,assessment:"MODERATE",color:"#D4A843"},
    {factor:"Delivery Timeline Risk",level:3,likelihood:3,impact:4,score:36,assessment:"MODERATE",color:"#D4A843"},
    {factor:"Currency Risk",level:1,likelihood:1,impact:2,score:2,assessment:"VERY LOW",color:"#10B981"},
  ],
  nakheelSegments:[
    {name:"Palm Communities",revenue:9.8,growth:"+22%",color:"#10B981"},
    {name:"Dubai Islands",revenue:5.4,growth:"+180%",color:"#00BFA5"},
    {name:"Retail Portfolio",revenue:2.8,growth:"+8%",color:"#3B82F6"},
    {name:"Other Communities",revenue:0.9,growth:"+15%",color:"#8B5CF6"},
  ],
  source:"DLD · Nakheel Official", seededAt:new Date().toISOString(), autoFetched:false,
};

const meraasData = {
  id:"meraas", name:"Meraas", founded:2007, parent:"Dubai Holding Real Estate",
  chairman:"Sheikh Ahmed bin Saeed Al Maktoum", ceo:"Abdulla Al Habbai",
  type:"Government-owned", tier:"T1", segment:"Premium Lifestyle + Waterfront",
  color:"#F59E0B", website:"https://meraas.com", confidence:"VERIFIED",
  propertySales:20.9, propertySalesUSD:5.7, revenue:15.6, netProfit:3.8,
  unitsDelivered:1913, underConstruction:12000, landBankSqFt:752000000,
  rank:"#6 Dubai Developer by Sales",
  communities:["City Walk","Bluewaters Island","La Mer","Port de La Mer","Jumeira Bay","MJL","The Acres","Nad Al Sheba","Cherrywoods","Dubai Harbour"],
  latestReportLabel:"FY2025 DLD Data", latestReportDate:"Jan 2026",
  financialHistory:[
    {year:2020,revenue:3.8,netProfit:0.6,propertySales:5.2},
    {year:2021,revenue:5.1,netProfit:1.0,propertySales:7.8},
    {year:2022,revenue:7.2,netProfit:1.6,propertySales:12.1},
    {year:2023,revenue:9.8,netProfit:2.2,propertySales:15.8},
    {year:2024,revenue:13.2,netProfit:3.1,propertySales:18.4},
    {year:2025,revenue:15.6,netProfit:3.8,propertySales:20.9},
  ],
  meraasRisks:[
    {factor:"Government-Backed — Low Financial Risk",level:1,likelihood:1,impact:2,score:2,assessment:"VERY LOW",color:"#10B981"},
    {factor:"Lifestyle Concept Risk",level:3,likelihood:2,impact:4,score:24,assessment:"MODERATE",color:"#D4A843"},
    {factor:"Ultra-Premium Pricing",level:3,likelihood:3,impact:3,score:27,assessment:"MODERATE",color:"#D4A843"},
    {factor:"Retail Revenue Dependency",level:2,likelihood:2,impact:3,score:12,assessment:"LOW",color:"#10B981"},
    {factor:"Currency Risk",level:1,likelihood:1,impact:2,score:2,assessment:"VERY LOW",color:"#10B981"},
  ],
  meraasSegments:[
    {name:"Lifestyle Destinations",revenue:6.8,growth:"+18%",color:"#F59E0B"},
    {name:"Residential Sales",revenue:5.4,growth:"+25%",color:"#10B981"},
    {name:"Retail + F&B",revenue:2.4,growth:"+12%",color:"#8B5CF6"},
    {name:"Hospitality",revenue:1.0,growth:"+20%",color:"#3B82F6"},
  ],
  source:"Meraas Official · Dubai Holding", seededAt:new Date().toISOString(), autoFetched:false,
};

async function seed() {
  try {
    await db.collection("developers").doc("nakheel").set(nakheelData, {merge:true});
    console.log("✅ Nakheel seeded to Firestore developers/nakheel");
    await db.collection("developers").doc("meraas").set(meraasData, {merge:true});
    console.log("✅ Meraas seeded to Firestore developers/meraas");
    await db.collection("marketData").doc("developerRegistry").set({
      nakheel:{id:"nakheel",name:"Nakheel",tier:"T1",salesValue2025:24.6,salesUSD2025:6.7,segment:"Waterfront + Master Communities",color:"#10B981",rank:4,communities:6,confidence:"VERIFIED"},
      meraas:{id:"meraas",name:"Meraas",tier:"T1",salesValue2025:20.9,salesUSD2025:5.7,segment:"Premium Lifestyle + Waterfront",color:"#F59E0B",rank:6,communities:10,confidence:"VERIFIED"},
      updatedAt:new Date().toISOString()
    },{merge:true});
    console.log("✅ Nakheel + Meraas added to developerRegistry");
  } catch(e){ console.error("❌",e.message); } finally { process.exit(0); }
}
seed();
