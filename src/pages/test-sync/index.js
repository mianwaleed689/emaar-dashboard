import { getDubaiPulseData } from "../../syncMarket";

export default function TestSync() {
  return (
    <div style={{ backgroundColor: "#04090F", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "sans-serif" }}>
      <h1 style={{ color: "#D4A843", marginBottom: "20px" }}>DXB Analytics: Live Sync Engine</h1>
      <button 
        onClick={() => getDubaiPulseData()}
        style={{ backgroundColor: "#D4A843", color: "black", padding: "15px 30px", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", fontSize: "18px" }}
      >
        START LIVE PULSE SYNC
      </button>
      <p style={{ marginTop: "20px", color: "#94A3B8" }}>Click to pull free 2026 data from Dubai Pulse to your Firebase.</p>
    </div>
  );
}
