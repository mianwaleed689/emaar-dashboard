import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
const sa = JSON.parse(readFileSync("./dxb-analytics-firebase-adminsdk-fbsvc-d170435fc0.json","utf8"));
initializeApp({ credential: cert(sa) });
const db = getFirestore();

const bingData = {
  id:"binghatti", name:"Binghatti", founded:2008, chairman:"Muhammad BinGhatti",
  hq:"Business Bay, Dubai", type:"Private", listed:false, exchange:null, sukukListed:"Nasdaq Dubai + LSE (bonds only)",
  tier:"T1", segment:"Affordable → Ultra-Luxury", color:"#3B82F6",
  creditRating:"BB- Fitch · Ba3 Moody's",
  propertySales:26.0, propertySalesUSD:7.1, revenue:12.43, netProfit:3.58,
  ebitda:4.40, unitsSold2025:17000, unitsDelivered:12500, underConstruction:38000,
  portfolioGDV:100000, totalAssets:24370, cash:8840, rank:"#1 Dubai by Units Sold · #3 by Value",
  financialHistory:[
    {year:2021,revenue:1.8,netProfit:0.4,propertySales:5.2},
    {year:2022,revenue:2.8,netProfit:0.7,propertySales:9.8},
    {year:2023,revenue:3.4,netProfit:1.0,propertySales:14.5},
    {year:2024,revenue:6.34,netProfit:1.83,propertySales:18.8},
    {year:2025,revenue:12.43,netProfit:3.58,propertySales:26.0},
  ],
  binghattiRisks:[
    {factor:"Rapid Scale — 17K Units/Year",level:4,likelihood:3,impact:4,score:48,assessment:"MODERATE",color:"#F59E0B"},
    {factor:"Affordable Segment Margin",level:3,likelihood:3,impact:3,score:27,assessment:"MODERATE",color:"#D4A843"},
    {factor:"Construction Delivery 38K",level:4,likelihood:3,impact:4,score:48,assessment:"MODERATE",color:"#F59E0B"},
    {factor:"Branded Partnership Risk",level:2,likelihood:2,impact:4,score:16,assessment:"LOW",color:"#10B981"},
    {factor:"Dubai Concentration",level:3,likelihood:2,impact:3,score:18,assessment:"LOW",color:"#10B981"},
    {factor:"Currency Risk",level:1,likelihood:1,impact:2,score:2,assessment:"VERY LOW",color:"#10B981"},
  ],
  binghattiSegments:[
    {name:"Ultra-Luxury (Bugatti/MB)",revenue:4.8,growth:"+145%",color:"#3B82F6"},
    {name:"Premium (Business Bay)",revenue:4.2,growth:"+82%",color:"#8B5CF6"},
    {name:"Mid-Market (JVC/DSP)",revenue:3.4,growth:"+65%",color:"#00BFA5"},
  ],
  latestReportLabel:"FY2025 Annual Results", latestReportDate:"February 2026",
  source:"Binghatti Official · Gulf News · Arabian Business", seededAt:new Date().toISOString(), autoFetched:false,
};

const aldarData = {
  id:"aldar", name:"Aldar Properties", legalName:"Aldar Properties PJSC",
  founded:2004, ceo:"Talal Al Dhiyebi", chairman:"Mohamed Khalifa Al Mubarak",
  hq:"Yas Island, Abu Dhabi", type:"Private", listed:false, exchange:null, sukukListed:"Nasdaq Dubai + LSE (bonds only)", ticker:"ALDAR",
  tier:"T1", segment:"Abu Dhabi + Dubai — Full Spectrum", color:"#06B6D4",
  propertySales:40.6, propertySalesUAE:35.5, propertySalesUSD:11.1,
  revenue:33.8, netProfit:8.8, ebitda:11.2, backlog:71700, aum:49000,
  rank:"#1 Abu Dhabi · #2 UAE by Sales Value", intlBuyerPct:77,
  financialHistory:[
    {year:2020,revenue:8.2,netProfit:1.9,propertySales:9.9},
    {year:2021,revenue:9.8,netProfit:2.3,propertySales:13.2},
    {year:2022,revenue:14.1,netProfit:3.4,propertySales:19.8},
    {year:2023,revenue:18.4,netProfit:4.6,propertySales:26.3},
    {year:2024,revenue:23.0,netProfit:6.5,propertySales:33.6},
    {year:2025,revenue:33.8,netProfit:8.8,propertySales:40.6},
  ],
  aldarRisks:[
    {factor:"Abu Dhabi Concentration",level:3,likelihood:2,impact:4,score:24,assessment:"MODERATE",color:"#D4A843"},
    {factor:"Government Dependency",level:2,likelihood:1,impact:3,score:6,assessment:"LOW",color:"#10B981"},
    {factor:"Backlog Execution AED 71.7B",level:3,likelihood:2,impact:4,score:24,assessment:"MODERATE",color:"#D4A843"},
    {factor:"International Expansion",level:3,likelihood:2,impact:3,score:18,assessment:"MODERATE",color:"#D4A843"},
    {factor:"Currency Risk",level:1,likelihood:1,impact:2,score:2,assessment:"VERY LOW",color:"#10B981"},
    {factor:"Interest Rate Sensitivity",level:2,likelihood:2,impact:2,score:8,assessment:"LOW",color:"#10B981"},
  ],
  aldarSegments:[
    {name:"UAE Development",revenue:24.8,growth:"+58%",color:"#06B6D4"},
    {name:"Investment Platform",revenue:6.4,growth:"+20%",color:"#3B82F6"},
    {name:"Project Management",revenue:1.8,growth:"+35%",color:"#8B5CF6"},
    {name:"International",revenue:0.8,growth:"+40%",color:"#10B981"},
  ],
  latestReportLabel:"FY2025 Annual Results", latestReportDate:"February 2026",
  source:"Aldar Official IR · ADX · Gulf News · The National", seededAt:new Date().toISOString(), autoFetched:false,
};

async function seed() {
  try {
    await db.collection("developers").doc("binghatti").set(bingData, {merge:true});
    console.log("✅ Binghatti seeded");
    await db.collection("developers").doc("aldar").set(aldarData, {merge:true});
    console.log("✅ Aldar seeded");
    await db.collection("marketData").doc("developerRegistry").set({
      binghatti:{id:"binghatti",name:"Binghatti",tier:"T1",salesValue2025:26.0,salesUSD2025:7.1,segment:"Affordable → Ultra-Luxury",color:"#3B82F6",rank:3,unitsSold2025:17000,confidence:"VERIFIED"},
      aldar:{id:"aldar",name:"Aldar Properties",tier:"T1",salesValue2025:40.6,salesUSD2025:11.1,segment:"Abu Dhabi + Dubai",color:"#06B6D4",rank:2,listed:true,ticker:"ALDAR",confidence:"VERIFIED"},
      updatedAt:new Date().toISOString()
    },{merge:true});
    console.log("✅ Registry updated");
  } catch(e){ console.error("❌",e.message); } finally { process.exit(0); }
}
seed();
