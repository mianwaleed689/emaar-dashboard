const fs = require("fs");

// ── 1. PATCH EmaarDashboardV2.jsx ────────────────────────────────
let src = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");

// Add livePriceHistory state after liveDLDVolumes state
const stateMarker = "const [liveDLDVolumes, setLiveDLDVolumes] = useState([]);";
const stateReplacement = `const [liveDLDVolumes, setLiveDLDVolumes] = useState([]);
  const [livePriceHistory, setLivePriceHistory] = useState([]);`;

if (src.includes(stateMarker)) {
  src = src.replace(stateMarker, stateReplacement);
  console.log("✅ 1. Added livePriceHistory state");
} else {
  console.log("❌ 1. State marker not found");
  process.exit(1);
}

// Add priceHistory listener after dldVolumes listener
const listenerMarker = `unsubs.push(onSnapshot(collection(db, "dldVolumes"), snap => {
      const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
      if (d.length > 0) setLiveDLDVolumes(d);
    }, () => {}));`;
const listenerReplacement = `unsubs.push(onSnapshot(collection(db, "dldVolumes"), snap => {
      const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
      if (d.length > 0) setLiveDLDVolumes(d);
    }, () => {}));

    /* --- PRICE HISTORY --- */
    unsubs.push(onSnapshot(collection(db, "priceHistory"), snap => {
      const d = snap.docs.map(x => ({ id:x.id, ...x.data() }));
      if (d.length > 0) setLivePriceHistory(d);
    }, () => {}));`;

if (src.includes(listenerMarker)) {
  src = src.replace(listenerMarker, listenerReplacement);
  console.log("✅ 2. Added priceHistory listener");
} else {
  console.log("❌ 2. Listener marker not found");
  process.exit(1);
}

// Replace liveMarketData prop on PriceHistoryTab with livePriceHistory
const propMarker = `              liveMarketData={liveMarketData}
              globalFilters={_gf}
              handleTabChange={handleTabChange}
            />
          )}

          {/* `;
const propReplacement = `              livePriceHistory={livePriceHistory}
              globalFilters={_gf}
              handleTabChange={handleTabChange}
            />
          )}

          {/* `;

if (src.includes(propMarker)) {
  src = src.replace(propMarker, propReplacement);
  console.log("✅ 3. Replaced liveMarketData prop with livePriceHistory on PriceHistoryTab");
} else {
  // Try finding it differently due to mojibake
  const lines = src.split("\n");
  const idx = lines.findIndex(l => l.includes("PriceHistoryTab") && l.includes("<PriceHistoryTab"));
  if (idx > -1) {
    // Find liveMarketData line after PriceHistoryTab
    for (let i = idx; i < idx + 15; i++) {
      if (lines[i].includes("liveMarketData={liveMarketData}")) {
        lines[i] = lines[i].replace("liveMarketData={liveMarketData}", "livePriceHistory={livePriceHistory}");
        src = lines.join("\n");
        console.log("✅ 3. Replaced prop via line scan at line", i+1);
        break;
      }
    }
  } else {
    console.log("❌ 3. Prop replacement failed");
  }
}

fs.writeFileSync("src/pages/EmaarDashboardV2.jsx", src, "latin1");
console.log("✅ EmaarDashboardV2.jsx patched");

// ── 2. PATCH PriceHistoryTab.jsx ─────────────────────────────────
let ph = fs.readFileSync("src/tabs/PriceHistoryTab.jsx", "latin1");

// Replace function signature to add livePriceHistory prop
const sigMarker = `function PriceHistoryTab({ phCommunity, setPhCommunity, phType, setPhType, phBeds, setPhBeds, phView, setPhView, phCompare, setPhCompare, phCommunity2, setPhCommunity2, liveMarketData, globalFilters = {}, handleTabChange }) {`;
const sigReplacement = `function PriceHistoryTab({ phCommunity, setPhCommunity, phType, setPhType, phBeds, setPhBeds, phView, setPhView, phCompare, setPhCompare, phCommunity2, setPhCommunity2, liveMarketData, livePriceHistory, globalFilters = {}, handleTabChange }) {`;

if (ph.includes(sigMarker)) {
  ph = ph.replace(sigMarker, sigReplacement);
  console.log("✅ 4. Added livePriceHistory to PriceHistoryTab signature");
} else {
  console.log("⚠️  4. Signature not found — trying partial match");
  const phLines = ph.split("\n");
  const sigIdx = phLines.findIndex(l => l.includes("function PriceHistoryTab") && l.includes("liveMarketData"));
  if (sigIdx > -1) {
    phLines[sigIdx] = phLines[sigIdx].replace("liveMarketData,", "liveMarketData, livePriceHistory,");
    ph = phLines.join("\n");
    console.log("✅ 4. Added livePriceHistory via partial match at line", sigIdx+1);
  }
}

// Replace data resolution to use livePriceHistory
const dataMarker = `const phRaw = liveMarketData?.filter?.(d => d.type === "priceHistory") || [];
  const phData = phRaw.length > 0 ? phRaw : SEED_DATA.priceHistory;`;
const dataReplacement = `// Use livePriceHistory from Firestore priceHistory collection (seeded Session 8)
  // Falls back to liveMarketData filter, then SEED_DATA
  const phFromFirestore = (livePriceHistory || []).filter(d => d.type === "annual" || d.type === "quarterly" || d.type === "monthly");
  const phRaw = liveMarketData?.filter?.(d => d.type === "priceHistory") || [];
  const phData = phFromFirestore.length > 0 ? phFromFirestore : phRaw.length > 0 ? phRaw : SEED_DATA.priceHistory;`;

if (ph.includes(dataMarker)) {
  ph = ph.replace(dataMarker, dataReplacement);
  console.log("✅ 5. Updated phData resolution to use livePriceHistory");
} else {
  // Try line scan
  const phLines = ph.split("\n");
  const dataIdx = phLines.findIndex(l => l.includes("phRaw = liveMarketData"));
  if (dataIdx > -1) {
    phLines.splice(dataIdx, 0,
      `  const phFromFirestore = (livePriceHistory || []).filter(d => d.type === "annual" || d.type === "quarterly" || d.type === "monthly");`
    );
    const phDataIdx = phLines.findIndex(l => l.includes("phData =") && l.includes("phRaw.length"));
    if (phDataIdx > -1) {
      phLines[phDataIdx] = `  const phData = phFromFirestore.length > 0 ? phFromFirestore : phRaw.length > 0 ? phRaw : SEED_DATA.priceHistory;`;
    }
    ph = phLines.join("\n");
    console.log("✅ 5. Updated phData via line scan at", dataIdx+1);
  } else {
    console.log("❌ 5. Could not find phData resolution");
  }
}

fs.writeFileSync("src/tabs/PriceHistoryTab.jsx", ph, "latin1");
console.log("✅ PriceHistoryTab.jsx patched");

// ── 3. VERIFY ────────────────────────────────────────────────────
const finalSrc = fs.readFileSync("src/pages/EmaarDashboardV2.jsx", "latin1");
const finalPh = fs.readFileSync("src/tabs/PriceHistoryTab.jsx", "latin1");
console.log("\n══ VERIFICATION ══════════════════");
console.log("livePriceHistory state:", finalSrc.includes("livePriceHistory, setLivePriceHistory") ? "✅" : "❌");
console.log("priceHistory listener:", finalSrc.includes('collection(db, "priceHistory")') ? "✅" : "❌");
console.log("livePriceHistory prop passed:", finalSrc.includes("livePriceHistory={livePriceHistory}") ? "✅" : "❌");
console.log("PriceHistoryTab uses livePriceHistory:", finalPh.includes("livePriceHistory") ? "✅" : "❌");
console.log("phFromFirestore resolution:", finalPh.includes("phFromFirestore") ? "✅" : "❌");