"use client";
import { getDubaiPulseData } from "../../syncMarket";

export default function TestSync() {
  return (
    <div style={{ backgroundColor: "#04090F", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", textAlign: "center", padding: "20px" }}>
      <div style={{ marginBottom: "30px" }}>
        <img src="https://emaar-dashboard.vercel.app" alt="DXB Analytics" style={{ width: "80px" }} />
      </div>
      <h1 style={{ color: "#D4A843", fontSize: "28px", marginBottom: "10px" }}>Live Sync Terminal</h1>
      <p style={{ color: "#94A3B8", marginBottom: "30px" }}>Pulling 2026 Dubai Pulse Data into Firebase</p>
      
      <button 
        onClick={() => getDubaiPulseData()}
        style={{ backgroundColor: "#D4A843", color: "black", padding: "18px 40px", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", fontSize: "20px", boxShadow: "0 4px 20px rgba(212,168,67,0.3)" }}
      >
        START LIVE PULSE SYNC
      </button>
    </div>
  );
}
