"use client";
import { getDubaiPulseData } from "../../services/syncMarket";

export default function SyncPage() {
  return (
    <div style={{ backgroundColor: "#04090F", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", textAlign: "center", padding: "20px" }}>
      <h1 style={{ color: "#D4A843", fontSize: "28px", marginBottom: "10px" }}>DXB Analytics: Sync Engine</h1>
      <p style={{ color: "#94A3B8", marginBottom: "30px" }}>Pulling 2026 Dubai Pulse Data into Firebase</p>
      <button 
        onClick={() => getDubaiPulseData()}
        style={{ backgroundColor: "#D4A843", color: "black", padding: "18px 40px", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", fontSize: "20px" }}
      >
        START LIVE PULSE SYNC
      </button>
    </div>
  );
}
