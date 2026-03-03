import React, { useState } from "react";
import { db } from "./firebase";
import { doc, updateDoc } from "firebase/firestore";

const FIXES = [
  { id: 10, name: "Greencrest", price: 1680000, ppsf: 2400 },
  { id: 15, name: "Rosehill", price: 1540000, ppsf: 2200 },
  { id: 22, name: "Montiva by Vida", price: 2100000, ppsf: 3000 },
  { id: 23, name: "Silva", price: 1750000, ppsf: 2500 },
  { id: 24, name: "Creek Bay", price: 1820000, ppsf: 2600 },
  { id: 25, name: "Creek Haven", price: 1750000, ppsf: 2500 },
  { id: 26, name: "Lyvia by Palace", price: 2800000, ppsf: 3500 },
  { id: 27, name: "Altan", price: 1780000, ppsf: 2543 },
  { id: 35, name: "Terra Gardens", price: 1550000, ppsf: 2089 },
  { id: 41, name: "Chevalia Estate 2", price: 7200000, ppsf: 1895 },
  { id: 42, name: "Selvara 3", price: 5670000, ppsf: 1770 },
  { id: 43, name: "Selvara 4", price: 5670000, ppsf: 1770 },
  { id: 47, name: "Avarra by Palace", price: 2700000, ppsf: 3422 },
];

export default function FixPrices() {
  const [status, setStatus] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  async function runFix() {
    setRunning(true);
    setStatus([]);
    const results = [];

    for (const fix of FIXES) {
      try {
        const ref = doc(db, "projects", `project_${fix.id}`);
        await updateDoc(ref, {
          price: fix.price,
          ppsf: fix.ppsf,
          priceFrom: String(fix.price),
          pricePerSqft: String(fix.ppsf),
          lastUpdated: new Date().toISOString(),
        });
        results.push({ name: fix.name, ok: true });
      } catch (e) {
        results.push({ name: fix.name, ok: false, err: e.message });
      }
      setStatus([...results]);
    }

    setRunning(false);
    setDone(true);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#04090F", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ background: "#0A1628", border: "1px solid #1E293B", borderRadius: 16, padding: 40, maxWidth: 500, width: "90%" }}>
        <h1 style={{ color: "#D4A843", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Fix 13 Null Prices</h1>
        <p style={{ color: "#64748B", fontSize: 13, marginBottom: 24 }}>
          Updates Firestore projects with verified prices. One-time use.
        </p>

        {!done && (
          <button onClick={runFix} disabled={running} style={{
            width: "100%", padding: "12px 24px", background: running ? "#1E293B" : "linear-gradient(135deg, #D4A843, #B8860B)",
            color: running ? "#64748B" : "#04090F", border: "none", borderRadius: 10, fontSize: 14,
            fontWeight: 700, cursor: running ? "wait" : "pointer", fontFamily: "'Outfit', sans-serif",
          }}>
            {running ? `Updating... (${status.length}/${FIXES.length})` : "Run Price Fix"}
          </button>
        )}

        {done && (
          <div style={{ padding: 16, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, marginBottom: 16 }}>
            <div style={{ color: "#10B981", fontWeight: 700, fontSize: 14 }}>
              All done! {status.filter(s => s.ok).length}/{FIXES.length} updated successfully.
            </div>
            <p style={{ color: "#64748B", fontSize: 12, marginTop: 6 }}>
              Refresh the dashboard to see the new prices. You can remove this route now.
            </p>
          </div>
        )}

        {status.length > 0 && (
          <div style={{ marginTop: 16 }}>
            {status.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1E293B" }}>
                <span style={{ color: "#E2E8F0", fontSize: 12 }}>{s.name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: s.ok ? "#10B981" : "#EF4444" }}>
                  {s.ok ? "✓ Fixed" : `✗ ${s.err}`}
                </span>
              </div>
            ))}
          </div>
        )}

        <a href="/" style={{ display: "block", textAlign: "center", marginTop: 20, color: "#D4A843", fontSize: 12, textDecoration: "none" }}>
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
