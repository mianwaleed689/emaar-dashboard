import React, { useState } from "react";
import { db } from "./firebase";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";

/* All 48 projects with unit inventory */
const projectsData = [
  { id:1, name:"The Golf Residence", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q2 2026", price:1750000, sizeFrom:750, sizeTo:2200, ppsf:2333, payment:"20/30/50", construction:80, branded:false, brand:"—", tier:"Mid-Premium", units:{ studio:{total:0,sold:0}, "1br":{total:120,sold:85}, "2br":{total:80,sold:52}, "3br":{total:40,sold:28} }},
  { id:2, name:"Hills Park", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q2 2026", price:1210000, sizeFrom:650, sizeTo:1800, ppsf:1862, payment:"80/20", construction:75, branded:false, brand:"—", tier:"Mid-Market", units:{ studio:{total:60,sold:45}, "1br":{total:150,sold:110}, "2br":{total:100,sold:72}, "3br":{total:50,sold:35} }},
  { id:3, name:"Golf Grand", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q1 2027", price:1529388, sizeFrom:700, sizeTo:2100, ppsf:2185, payment:"10/80/10", construction:96, branded:false, brand:"—", tier:"Mid-Premium", units:{ studio:{total:0,sold:0}, "1br":{total:90,sold:82}, "2br":{total:70,sold:63}, "3br":{total:35,sold:30} }},
  { id:4, name:"Parkside Views", community:"Dubai Hills Estate", district:"DHE", type:"Apts & TH", beds:"1-3", status:"Under Construction", handover:"Q3 2027", price:2756888, sizeFrom:900, sizeTo:2800, ppsf:3063, payment:"10/80/10", construction:74, branded:false, brand:"—", tier:"Premium", units:{ "1br":{total:80,sold:55}, "2br":{total:60,sold:40}, "3br":{total:30,sold:18} }},
  { id:5, name:"Greenside Residence", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q3 2027", price:1540000, sizeFrom:700, sizeTo:2000, ppsf:2200, payment:"10/80/10", construction:61, branded:false, brand:"—", tier:"Mid-Premium", units:{ "1br":{total:110,sold:70}, "2br":{total:85,sold:50}, "3br":{total:40,sold:22} }},
  { id:6, name:"Club Drive", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q1 2028", price:1626566, sizeFrom:726, sizeTo:2622, ppsf:2240, payment:"10/90", construction:55, branded:false, brand:"—", tier:"Mid-Premium", units:{ "1br":{total:100,sold:55}, "2br":{total:75,sold:38}, "3br":{total:35,sold:15} }},
  { id:7, name:"Golf Hillside", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q4 2028", price:2816888, sizeFrom:741, sizeTo:2322, ppsf:3801, payment:"80/20", construction:37, branded:false, brand:"—", tier:"Premium", units:{ "1br":{total:70,sold:30}, "2br":{total:55,sold:22}, "3br":{total:25,sold:8} }},
  { id:8, name:"Park Lane", community:"Dubai Hills Estate", district:"DHE", type:"Apts & TH", beds:"1-3", status:"Under Construction", handover:"Q4 2028", price:1480000, sizeFrom:700, sizeTo:2200, ppsf:2114, payment:"10/70/20", construction:33, branded:false, brand:"—", tier:"Mid-Premium", units:{ "1br":{total:90,sold:35}, "2br":{total:70,sold:25}, "3br":{total:30,sold:10} }},
  { id:9, name:"Palace Residences Hillside", community:"Dubai Hills Estate", district:"DHE", type:"Apts & TH", beds:"1-3", status:"Under Construction", handover:"Q2 2028", price:1760888, sizeFrom:750, sizeTo:2500, ppsf:2348, payment:"80/20", construction:17, branded:true, brand:"Palace", tier:"Luxury Branded", units:{ "1br":{total:50,sold:15}, "2br":{total:40,sold:10}, "3br":{total:20,sold:5} }},
  { id:10, name:"Greencrest", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q1 2029", price:null, sizeFrom:700, sizeTo:2200, ppsf:null, payment:"80/20", construction:10, branded:false, brand:"—", tier:"Mid-Premium", units:{ "1br":{total:100,sold:20}, "2br":{total:80,sold:15}, "3br":{total:35,sold:5} }},
  { id:11, name:"Vida Residences Hillside", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q2 2029", price:1800000, sizeFrom:700, sizeTo:2200, ppsf:2571, payment:"80/20", construction:8, branded:true, brand:"Vida", tier:"Luxury Branded", units:{ "1br":{total:60,sold:12}, "2br":{total:45,sold:8}, "3br":{total:20,sold:3} }},
  { id:12, name:"Parkwood", community:"Dubai Hills Estate", district:"DHE", type:"Apts & TH", beds:"1-3", status:"Off-Plan", handover:"Q1 2029", price:1770000, sizeFrom:750, sizeTo:2400, ppsf:2360, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Mid-Premium", units:{ "1br":{total:80,sold:15}, "2br":{total:65,sold:10}, "3br":{total:30,sold:5} }},
  { id:13, name:"Hillsedge", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q1 2029", price:1840000, sizeFrom:700, sizeTo:2000, ppsf:2629, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Mid-Premium", units:{ "1br":{total:90,sold:18}, "2br":{total:70,sold:12}, "3br":{total:30,sold:5} }},
  { id:14, name:"Club Place", community:"Dubai Hills Estate", district:"DHE", type:"Apts & Duplex", beds:"1-3", status:"Off-Plan", handover:"Q4 2028", price:1450000, sizeFrom:700, sizeTo:2200, ppsf:2071, payment:"80/20", construction:10, branded:false, brand:"—", tier:"Mid-Premium", units:{ "1br":{total:85,sold:20}, "2br":{total:65,sold:12}, "3br":{total:30,sold:6} }},
  { id:15, name:"Rosehill", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q2 2029", price:null, sizeFrom:700, sizeTo:2000, ppsf:null, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Mid-Premium", units:{ "1br":{total:100,sold:10}, "2br":{total:75,sold:8}, "3br":{total:30,sold:3} }},
  { id:16, name:"Parkland", community:"Dubai Hills Estate", district:"DHE", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q4 2028", price:1500000, sizeFrom:700, sizeTo:2200, ppsf:2143, payment:"80/20", construction:8, branded:false, brand:"—", tier:"Mid-Premium", units:{ "1br":{total:95,sold:22}, "2br":{total:70,sold:15}, "3br":{total:30,sold:5} }},
  { id:17, name:"The Cove II", community:"Dubai Creek Harbour", district:"DCH", type:"Apts & TH", beds:"1-4", status:"Under Construction", handover:"Q4 2026", price:1669000, sizeFrom:650, sizeTo:2800, ppsf:2568, payment:"10/70/20", construction:87, branded:false, brand:"—", tier:"Mid-Premium", units:{ "1br":{total:100,sold:80}, "2br":{total:80,sold:62}, "3br":{total:40,sold:30}, "4br":{total:15,sold:12} }},
  { id:18, name:"Creek Waters", community:"Dubai Creek Harbour", district:"DCH", type:"Apts & TH", beds:"1-4", status:"Under Construction", handover:"Q3 2027", price:1750000, sizeFrom:700, sizeTo:2600, ppsf:2500, payment:"10/80/10", construction:62, branded:false, brand:"—", tier:"Premium", units:{ "1br":{total:90,sold:55}, "2br":{total:70,sold:40}, "3br":{total:35,sold:18}, "4br":{total:12,sold:6} }},
  { id:19, name:"Creek Waters 2", community:"Dubai Creek Harbour", district:"DCH", type:"Apts & TH", beds:"1-4", status:"Under Construction", handover:"Q4 2027", price:1938110, sizeFrom:700, sizeTo:2800, ppsf:2769, payment:"10/80/10", construction:63, branded:false, brand:"—", tier:"Premium", units:{ "1br":{total:85,sold:50}, "2br":{total:65,sold:35}, "3br":{total:30,sold:15}, "4br":{total:10,sold:4} }},
  { id:20, name:"Oria", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Under Construction", handover:"Q3 2028", price:1814888, sizeFrom:700, sizeTo:2200, ppsf:2593, payment:"10/80/10", construction:49, branded:false, brand:"—", tier:"Premium", units:{ "1br":{total:80,sold:35}, "2br":{total:60,sold:22}, "3br":{total:25,sold:8} }},
  { id:21, name:"Albero", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q4 2028", price:1810000, sizeFrom:700, sizeTo:2200, ppsf:2586, payment:"80/20", construction:10, branded:false, brand:"—", tier:"Premium", units:{ "1br":{total:75,sold:18}, "2br":{total:55,sold:12}, "3br":{total:25,sold:5} }},
  { id:22, name:"Montiva by Vida", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q2 2029", price:null, sizeFrom:700, sizeTo:2200, ppsf:null, payment:"80/20", construction:5, branded:true, brand:"Vida", tier:"Luxury Branded", units:{ "1br":{total:60,sold:8}, "2br":{total:45,sold:5}, "3br":{total:20,sold:2} }},
  { id:23, name:"Silva", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q3 2029", price:null, sizeFrom:700, sizeTo:2200, ppsf:null, payment:"80/20", construction:3, branded:false, brand:"—", tier:"Premium", units:{ "1br":{total:70,sold:5}, "2br":{total:55,sold:3}, "3br":{total:25,sold:1} }},
  { id:24, name:"Creek Bay", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q4 2029", price:null, sizeFrom:700, sizeTo:2200, ppsf:null, payment:"10/70/20", construction:0, branded:false, brand:"—", tier:"Premium", units:{ "1br":{total:80,sold:0}, "2br":{total:60,sold:0}, "3br":{total:30,sold:0} }},
  { id:25, name:"Creek Haven", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q4 2029", price:null, sizeFrom:700, sizeTo:2200, ppsf:null, payment:"80/20", construction:0, branded:false, brand:"—", tier:"Premium", units:{ "1br":{total:75,sold:0}, "2br":{total:55,sold:0}, "3br":{total:25,sold:0} }},
  { id:26, name:"Lyvia by Palace", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q4 2029", price:null, sizeFrom:700, sizeTo:2500, ppsf:null, payment:"80/20", construction:0, branded:true, brand:"Palace", tier:"Ultra-Lux Branded", units:{ "1br":{total:40,sold:0}, "2br":{total:30,sold:0}, "3br":{total:15,sold:0} }},
  { id:27, name:"Altan", community:"Dubai Creek Harbour", district:"DCH", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q3 2029", price:null, sizeFrom:700, sizeTo:2200, ppsf:null, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Premium", units:{ "1br":{total:70,sold:5}, "2br":{total:50,sold:3}, "3br":{total:25,sold:1} }},
  { id:28, name:"Address The Bay", community:"Emaar Beachfront", district:"EBF", type:"Apts & PH", beds:"1-4", status:"Under Construction", handover:"Q4 2026", price:3500000, sizeFrom:800, sizeTo:4500, ppsf:4375, payment:"80/20", construction:70, branded:true, brand:"Address", tier:"Ultra-Lux Branded", units:{ "1br":{total:50,sold:38}, "2br":{total:40,sold:30}, "3br":{total:20,sold:15}, "4br":{total:8,sold:6} }},
  { id:29, name:"Beachgate by Address", community:"Emaar Beachfront", district:"EBF", type:"Apts, TH, PH", beds:"1-4", status:"Under Construction", handover:"Q4 2026", price:3200000, sizeFrom:800, sizeTo:4000, ppsf:4000, payment:"80/20", construction:70, branded:true, brand:"Address", tier:"Ultra-Lux Branded", units:{ "1br":{total:55,sold:40}, "2br":{total:45,sold:32}, "3br":{total:22,sold:16}, "4br":{total:10,sold:7} }},
  { id:30, name:"Seapoint", community:"Emaar Beachfront", district:"EBF", type:"Apts & Villas", beds:"1-4", status:"Under Construction", handover:"Q2 2028", price:3000000, sizeFrom:750, sizeTo:3500, ppsf:4000, payment:"80/20", construction:45, branded:false, brand:"—", tier:"Luxury", units:{ "1br":{total:60,sold:25}, "2br":{total:45,sold:18}, "3br":{total:20,sold:8}, "4br":{total:8,sold:3} }},
  { id:31, name:"Bayview", community:"Emaar Beachfront", district:"EBF", type:"Apartments", beds:"1-4", status:"Under Construction", handover:"Q3 2028", price:3000000, sizeFrom:750, sizeTo:3500, ppsf:4000, payment:"80/20", construction:40, branded:true, brand:"Address", tier:"Ultra-Lux Branded", units:{ "1br":{total:55,sold:20}, "2br":{total:40,sold:15}, "3br":{total:18,sold:6}, "4br":{total:7,sold:2} }},
  { id:32, name:"Bristol Luxury Residences", community:"Emaar Beachfront", district:"EBF", type:"Branded Res.", beds:"1-4", status:"Off-Plan", handover:"Q3 2029", price:3500000, sizeFrom:800, sizeTo:4000, ppsf:4375, payment:"80/20", construction:15, branded:true, brand:"Bristol", tier:"Ultra-Lux Branded", units:{ "1br":{total:45,sold:10}, "2br":{total:35,sold:8}, "3br":{total:15,sold:3}, "4br":{total:5,sold:1} }},
  { id:33, name:"Golf Verge", community:"Emaar South", district:"ES", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q2 2029", price:1200000, sizeFrom:650, sizeTo:1800, ppsf:1846, payment:"10/70/20", construction:5, branded:false, brand:"—", tier:"Affordable", units:{ studio:{total:80,sold:10}, "1br":{total:120,sold:20}, "2br":{total:90,sold:12}, "3br":{total:40,sold:5} }},
  { id:34, name:"Golf Meadow", community:"Emaar South", district:"ES", type:"Apts & TH", beds:"1-3", status:"Off-Plan", handover:"Q3 2029", price:3045888, sizeFrom:800, sizeTo:2500, ppsf:3807, payment:"10/70/20", construction:5, branded:false, brand:"—", tier:"Mid-Premium", units:{ "1br":{total:60,sold:8}, "2br":{total:50,sold:5}, "3br":{total:25,sold:2} }},
  { id:35, name:"Terra Gardens", community:"Expo Living", district:"EL", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q1 2029", price:null, sizeFrom:650, sizeTo:1800, ppsf:null, payment:"80/20", construction:0, branded:false, brand:"—", tier:"Affordable", units:{ studio:{total:100,sold:0}, "1br":{total:150,sold:0}, "2br":{total:100,sold:0}, "3br":{total:50,sold:0} }},
  { id:36, name:"Farm Gardens", community:"The Valley", district:"TV", type:"Villas", beds:"4-5", status:"Under Construction", handover:"Q3 2026", price:7300000, sizeFrom:4950, sizeTo:10004, ppsf:1475, payment:"10/70/20", construction:76, branded:false, brand:"—", tier:"Ultra-Luxury", units:{ "4br":{total:80,sold:62}, "5br":{total:45,sold:35} }},
  { id:37, name:"Elora", community:"The Valley", district:"TV", type:"Townhouses", beds:"3-4", status:"Off-Plan", handover:"Q4 2026", price:1600000, sizeFrom:2111, sizeTo:2608, ppsf:758, payment:"80/20", construction:30, branded:false, brand:"—", tier:"Mid-Market", units:{ "3br":{total:120,sold:45}, "4br":{total:80,sold:28} }},
  { id:38, name:"Selvara", community:"Grand Polo Club", district:"GPC", type:"Villas", beds:"3-5", status:"Off-Plan", handover:"Q2 2029", price:5670000, sizeFrom:2948, sizeTo:5115, ppsf:1923, payment:"80/20", construction:10, branded:false, brand:"—", tier:"Ultra-Luxury", units:{ "3br":{total:40,sold:8}, "4br":{total:30,sold:5}, "5br":{total:15,sold:2} }},
  { id:39, name:"Equestra", community:"Grand Polo Club", district:"GPC", type:"Townhouses", beds:"3-4", status:"Off-Plan", handover:"Q2 2029", price:3700000, sizeFrom:2176, sizeTo:2176, ppsf:1700, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Luxury", units:{ "3br":{total:60,sold:10}, "4br":{total:40,sold:5} }},
  { id:40, name:"Equiterra", community:"Grand Polo Club", district:"GPC", type:"Townhouses", beds:"3-4", status:"Off-Plan", handover:"Q2 2029", price:3700000, sizeFrom:2176, sizeTo:2176, ppsf:1700, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Luxury", units:{ "3br":{total:55,sold:8}, "4br":{total:35,sold:4} }},
  { id:41, name:"Chevalia Estate 2", community:"Grand Polo Club", district:"GPC", type:"Villas", beds:"4-5", status:"Off-Plan", handover:"Q4 2029", price:null, sizeFrom:3800, sizeTo:5400, ppsf:null, payment:"80/20", construction:3, branded:false, brand:"—", tier:"Ultra-Luxury", units:{ "4br":{total:35,sold:2}, "5br":{total:20,sold:1} }},
  { id:42, name:"Selvara 3", community:"Grand Polo Club", district:"GPC", type:"Villas", beds:"3-5", status:"Off-Plan", handover:"Q2 2029", price:null, sizeFrom:2948, sizeTo:5115, ppsf:null, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Ultra-Luxury", units:{ "3br":{total:30,sold:3}, "4br":{total:25,sold:2}, "5br":{total:12,sold:0} }},
  { id:43, name:"Selvara 4", community:"Grand Polo Club", district:"GPC", type:"Villas", beds:"3-5", status:"Off-Plan", handover:"Q2 2029", price:null, sizeFrom:2948, sizeTo:5115, ppsf:null, payment:"80/20", construction:3, branded:false, brand:"—", tier:"Ultra-Luxury", units:{ "3br":{total:28,sold:2}, "4br":{total:22,sold:1}, "5br":{total:10,sold:0} }},
  { id:44, name:"Aurea", community:"Rashid Yachts & Marina", district:"RYM", type:"Apartments", beds:"1-3", status:"Off-Plan", handover:"Q4 2029", price:2100000, sizeFrom:700, sizeTo:2500, ppsf:3000, payment:"10/70/20", construction:0, branded:false, brand:"—", tier:"Premium", units:{ "1br":{total:65,sold:5}, "2br":{total:50,sold:3}, "3br":{total:20,sold:1} }},
  { id:45, name:"Baystar by Vida", community:"Rashid Yachts & Marina", district:"RYM", type:"Apartments", beds:"1-4", status:"Off-Plan", handover:"Q4 2029", price:2100000, sizeFrom:700, sizeTo:3000, ppsf:3000, payment:"80/20", construction:5, branded:true, brand:"Vida", tier:"Luxury Branded", units:{ "1br":{total:50,sold:5}, "2br":{total:40,sold:3}, "3br":{total:18,sold:1}, "4br":{total:8,sold:0} }},
  { id:46, name:"Marèva 2", community:"The Oasis", district:"TO", type:"Villas", beds:"4-6", status:"Off-Plan", handover:"Q4 2029", price:13830000, sizeFrom:7200, sizeTo:12700, ppsf:1921, payment:"80/20", construction:5, branded:false, brand:"—", tier:"Ultra-Luxury", units:{ "4br":{total:25,sold:5}, "5br":{total:18,sold:3}, "6br":{total:10,sold:2} }},
  { id:47, name:"Avarra by Palace", community:"Business Bay", district:"BB", type:"Apts & PH", beds:"1-4", status:"Off-Plan", handover:"Q4 2029", price:null, sizeFrom:750, sizeTo:3500, ppsf:null, payment:"80/20", construction:0, branded:true, brand:"Palace", tier:"Ultra-Lux Branded", units:{ "1br":{total:45,sold:0}, "2br":{total:35,sold:0}, "3br":{total:15,sold:0}, "4br":{total:8,sold:0} }},
  { id:48, name:"Greencrest Heights", community:"The Heights CW", district:"TH", type:"Townhouses", beds:"3-4", status:"Off-Plan", handover:"Q4 2029", price:2500000, sizeFrom:2200, sizeTo:3000, ppsf:1136, payment:"80/20", construction:3, branded:false, brand:"—", tier:"Mid-Premium", units:{ "3br":{total:70,sold:5}, "4br":{total:45,sold:3} }},
];

export default function SeedData() {
  const [status, setStatus] = useState("ready");
  const [progress, setProgress] = useState(0);
  const [existing, setExisting] = useState(null);

  const checkExisting = async () => {
    const snap = await getDocs(collection(db, "projects"));
    setExisting(snap.size);
  };

  const seedAll = async () => {
    setStatus("seeding");
    try {
      for (let i = 0; i < projectsData.length; i++) {
        const p = projectsData[i];
        await setDoc(doc(db, "projects", `project_${p.id}`), {
          ...p,
          updatedAt: new Date().toISOString(),
        });
        setProgress(i + 1);
      }
      setStatus("done");
    } catch (err) {
      setStatus("error");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: "monospace", background: "#0A1628", minHeight: "100vh", color: "#E2E8F0" }}>
      <h1 style={{ color: "#D4A843" }}>🗄️ DXB Analytics — Database Seed Tool</h1>
      <p style={{ color: "#94A3B8", marginTop: 10 }}>This will upload all 48 Emaar projects with unit inventory to Firestore.</p>
      
      <div style={{ marginTop: 20 }}>
        <button onClick={checkExisting} style={{ padding: "10px 20px", background: "#0E1D35", border: "1px solid #D4A843", color: "#D4A843", borderRadius: 8, cursor: "pointer", marginRight: 10 }}>
          Check Existing Data
        </button>
        {existing !== null && <span style={{ color: "#10B981" }}>Found {existing} projects in database</span>}
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={seedAll} disabled={status === "seeding"} style={{ padding: "12px 24px", background: status === "done" ? "#10B981" : "#D4A843", border: "none", color: "#04090F", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 16 }}>
          {status === "ready" && "🚀 Upload 48 Projects to Firestore"}
          {status === "seeding" && `Uploading... ${progress}/48`}
          {status === "done" && "✅ All 48 Projects Uploaded!"}
          {status === "error" && "❌ Error — Check Console"}
        </button>
      </div>

      {status === "seeding" && (
        <div style={{ marginTop: 20, width: 400, height: 8, background: "#0E1D35", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${(progress/48)*100}%`, background: "#D4A843", transition: "width 0.3s" }} />
        </div>
      )}

      {status === "done" && (
        <div style={{ marginTop: 20, padding: 20, background: "#0E1D35", borderRadius: 10, border: "1px solid #10B981" }}>
          <p style={{ color: "#10B981", fontWeight: 700 }}>✅ Success! All 48 projects with unit inventory are now in Firestore.</p>
          <p style={{ color: "#94A3B8", marginTop: 8 }}>You can now go back to the dashboard. The Projects tab will read live data.</p>
          <p style={{ color: "#94A3B8", marginTop: 4 }}>Check Firebase Console → Firestore to see your data.</p>
        </div>
      )}
    </div>
  );
}
