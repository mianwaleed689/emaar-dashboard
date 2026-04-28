const fs = require("fs");
const p = "src/tabs/DLDVolumesTab.jsx";
let src = fs.readFileSync(p, "latin1");

// Add filterLiquidity and filterOffPlan states after filterType state
src = src.replace(
  `const [filterType, setFilterType] = useState("All");`,
  `const [filterType, setFilterType] = useState("All");
  const [filterLiquidity, setFilterLiquidity] = useState("All");
  const [filterOffPlan, setFilterOffPlan] = useState("All");`
);

// Update the filter logic to include new filters
src = src.replace(
  `if (filterType !== "All") d = d.filter(x => x.type === filterType || x.type === "Mixed");`,
  `if (filterType !== "All") d = d.filter(x => x.type === filterType || x.type === "Mixed");
    if (filterLiquidity !== "All") d = d.filter(x => {
      const liq = getLiquidity(x.transactions).label;
      return liq === filterLiquidity;
    });
    if (filterOffPlan !== "All") {
      if (filterOffPlan === "0-30") d = d.filter(x => (x.offPlanPct || 0) < 30);
      else if (filterOffPlan === "30-60") d = d.filter(x => (x.offPlanPct || 0) >= 30 && (x.offPlanPct || 0) < 60);
      else if (filterOffPlan === "60+") d = d.filter(x => (x.offPlanPct || 0) >= 60);
    }`
);

// Update useMemo deps
src = src.replace(
  `}, [rawData, filterSector, filterType, searchQ, sortBy]);`,
  `}, [rawData, filterSector, filterType, filterLiquidity, filterOffPlan, searchQ, sortBy]);`
);

// Replace the entire filter UI block
const oldFilters = `      {/* ── Filters ──────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <input
          type="text" placeholder="Search community..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, background: T.surfaceAlt, border: "1px solid " + T.border, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", width: 200, outline: "none" }}
        />
        <select value={filterSector} onChange={e => setFilterSector(e.target.value)} style={{ padding: "8px 10px", borderRadius: 8, background: T.surfaceAlt, border: "1px solid " + T.border, color: T.textSecondary, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: "8px 10px", borderRadius: 8, background: T.surfaceAlt, border: "1px solid " + T.border, color: T.textSecondary, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: T.textMuted, alignSelf: "center" }}>Sort:</span>
          {[
            { key: "transactions", label: "Volume" },
            { key: "value",        label: "Value" },
            { key: "ppsf",         label: "PPSF" },
            { key: "offplan",      label: "Off-Plan" },
            { key: "growth",       label: "YoY Growth" },
          ].map(s => (
            <button key={s.key} type="button" onClick={() => setSortBy(s.key)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", background: sortBy === s.key ? "rgba(212,168,67,0.15)" : T.surfaceAlt, border: "1px solid " + (sortBy === s.key ? T.gold : T.border), color: sortBy === s.key ? T.gold : T.textMuted }}>{s.label}</button>
          ))}
        </div>
      </div>`;

const newFilters = `      {/* ── World Class Filter Bar ─────────────────────────── */}
      <div style={{ marginBottom: 16 }}>

        {/* Row 1: Search + View toggle + Sort */}
        <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "0 0 220px" }}>
            <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" placeholder="Search community..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
              style={{ padding: "8px 12px 8px 30px", borderRadius: 8, background: T.surfaceAlt, border: "1px solid " + T.border, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", width: "100%", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Sort:</span>
            {[
              { key: "transactions", label: "Volume",    icon: "📊" },
              { key: "value",        label: "Value",     icon: "💰" },
              { key: "ppsf",         label: "PPSF",      icon: "📐" },
              { key: "offplan",      label: "Off-Plan",  icon: "🏗" },
              { key: "growth",       label: "YoY Growth",icon: "📈" },
            ].map(s => (
              <button key={s.key} type="button" onClick={() => setSortBy(s.key)} style={{ padding: "6px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 4, background: sortBy === s.key ? "rgba(212,168,67,0.15)" : T.surfaceAlt, border: "1px solid " + (sortBy === s.key ? T.gold : T.border), color: sortBy === s.key ? T.gold : T.textMuted, transition: "all 0.15s" }}>
                <span style={{ fontSize: 10 }}>{s.icon}</span>{s.label}
              </button>
            ))}
            <button type="button" onClick={() => setView(view === "table" ? "chart" : "table")} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", background: "rgba(99,179,237,0.1)", border: "1px solid rgba(99,179,237,0.3)", color: "#63B3ED", fontFamily: "'Outfit',sans-serif" }}>
              {view === "table" ? "📊 Chart" : "📋 Table"}
            </button>
          </div>
        </div>

        {/* Row 2: Sector pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, alignSelf: "center", minWidth: 44 }}>Sector:</span>
          {sectors.map(s => {
            const color = s === "All" ? T.textSecondary : ({"New Dubai":"#D4A843","Trade Center":"#63B3ED","MBR City":"#68D391","Dubailand":"#FC8181","Dubai South":"#9F7AEA","Jebel Ali":"#F6AD55","Deira":"#4FD1C5","Bur Dubai":"#ED8936"}[s] || T.textMuted);
            const active = filterSector === s;
            return (
              <button key={s} type="button" onClick={() => setFilterSector(s)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: active ? 700 : 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif", background: active ? color + "20" : T.surfaceAlt, border: "1px solid " + (active ? color : T.border), color: active ? color : T.textMuted, transition: "all 0.15s" }}>
                {s}
              </button>
            );
          })}
        </div>

        {/* Row 3: Type + Liquidity + Off-Plan + Active filters */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {/* Property type */}
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Type:</span>
            {["All","Apartment","Villa","Mixed"].map(t => (
              <button key={t} type="button" onClick={() => setFilterType(t)} style={{ padding: "4px 10px", borderRadius: 16, fontSize: 11, fontWeight: filterType===t?700:500, cursor: "pointer", fontFamily: "'Outfit',sans-serif", background: filterType===t?"rgba(212,168,67,0.15)":T.surfaceAlt, border: "1px solid "+(filterType===t?T.gold:T.border), color: filterType===t?T.gold:T.textMuted, transition: "all 0.15s" }}>
                {t}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 20, background: T.border }} />

          {/* Liquidity filter */}
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Liquidity:</span>
            {[
              { key: "All",        label: "All",        color: T.textMuted },
              { key: "Ultra-High", label: "Ultra-High", color: "#68D391" },
              { key: "High",       label: "High",       color: "#D4A843" },
              { key: "Medium",     label: "Medium",     color: "#63B3ED" },
              { key: "Low",        label: "Low",        color: "#FC8181" },
            ].map(l => (
              <button key={l.key} type="button" onClick={() => setFilterLiquidity(l.key)} style={{ padding: "4px 10px", borderRadius: 16, fontSize: 11, fontWeight: filterLiquidity===l.key?700:500, cursor: "pointer", fontFamily: "'Outfit',sans-serif", background: filterLiquidity===l.key?l.color+"20":T.surfaceAlt, border: "1px solid "+(filterLiquidity===l.key?l.color:T.border), color: filterLiquidity===l.key?l.color:T.textMuted, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 4 }}>
                {l.key !== "All" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: l.color }} />}
                {l.label}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 20, background: T.border }} />

          {/* Off-plan filter */}
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Off-Plan:</span>
            {[
              { key: "All",   label: "All" },
              { key: "0-30",  label: "<30%" },
              { key: "30-60", label: "30-60%" },
              { key: "60+",   label: "60%+" },
            ].map(o => (
              <button key={o.key} type="button" onClick={() => setFilterOffPlan(o.key)} style={{ padding: "4px 10px", borderRadius: 16, fontSize: 11, fontWeight: filterOffPlan===o.key?700:500, cursor: "pointer", fontFamily: "'Outfit',sans-serif", background: filterOffPlan===o.key?"rgba(104,211,145,0.15)":T.surfaceAlt, border: "1px solid "+(filterOffPlan===o.key?"#68D391":T.border), color: filterOffPlan===o.key?"#68D391":T.textMuted, transition: "all 0.15s" }}>
                {o.label}
              </button>
            ))}
          </div>

          {/* Active filter chips + Clear all */}
          {(filterSector !== "All" || filterType !== "All" || filterLiquidity !== "All" || filterOffPlan !== "All" || searchQ) && (
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginLeft: "auto", flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, color: T.textMuted }}>Active:</span>
              {filterSector !== "All" && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 12, background: "rgba(212,168,67,0.15)", color: T.gold, display: "flex", alignItems: "center", gap: 4 }}>{filterSector} <span style={{ cursor: "pointer" }} onClick={() => setFilterSector("All")}>×</span></span>}
              {filterType !== "All" && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 12, background: "rgba(212,168,67,0.15)", color: T.gold, display: "flex", alignItems: "center", gap: 4 }}>{filterType} <span style={{ cursor: "pointer" }} onClick={() => setFilterType("All")}>×</span></span>}
              {filterLiquidity !== "All" && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 12, background: "rgba(104,211,145,0.15)", color: "#68D391", display: "flex", alignItems: "center", gap: 4 }}>{filterLiquidity} Liquidity <span style={{ cursor: "pointer" }} onClick={() => setFilterLiquidity("All")}>×</span></span>}
              {filterOffPlan !== "All" && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 12, background: "rgba(104,211,145,0.15)", color: "#68D391", display: "flex", alignItems: "center", gap: 4 }}>Off-Plan {filterOffPlan}% <span style={{ cursor: "pointer" }} onClick={() => setFilterOffPlan("All")}>×</span></span>}
              {searchQ && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 12, background: "rgba(99,179,237,0.15)", color: "#63B3ED", display: "flex", alignItems: "center", gap: 4 }}>"{searchQ}" <span style={{ cursor: "pointer" }} onClick={() => setSearchQ("")}>×</span></span>}
              <button type="button" onClick={() => { setFilterSector("All"); setFilterType("All"); setFilterLiquidity("All"); setFilterOffPlan("All"); setSearchQ(""); }} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 12, background: "rgba(252,129,129,0.1)", border: "1px solid rgba(252,129,129,0.3)", color: "#FC8181", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Clear all</button>
              <span style={{ fontSize: 10, color: T.textMuted }}>{filtered.length} results</span>
            </div>
          )}
        </div>
      </div>`;

if (src.includes(oldFilters.substring(0, 60))) {
  src = src.replace(oldFilters, newFilters);
  fs.writeFileSync(p, src, "latin1");
  console.log("Done. Lines:", src.split("\n").length);
} else {
  // Fallback: find by line number
  const lines = src.split("\n");
  const start = lines.findIndex(l => l.includes("Filters") && l.includes("{/*"));
  const end = lines.findIndex((l, i) => i > start + 2 && l.trim() === "</div>" && lines[i+1]?.trim().startsWith("{/*"));
  if (start > -1 && end > -1) {
    lines.splice(start, end - start + 1, ...newFilters.split("\n"));
    fs.writeFileSync(p, lines.join("\n"), "latin1");
    console.log("Done via line splice. Lines:", lines.length);
  } else {
    console.log("Could not find filter block. start:", start, "end:", end);
    lines.forEach((l, i) => { if (l.includes("Filters") || l.includes("Search community")) console.log(i+1, l.trim()); });
  }
}