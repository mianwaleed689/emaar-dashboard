import React from "react";
import { T } from "../../../styles/theme";

const CurrencyTab = ({ activeProjects, Section, TabSources }) => {
  const [aedAmount, setAedAmount] = React.useState(2000000);
  const [rates, setRates] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [lastUpdated, setLastUpdated] = React.useState(null);
  const [error, setError] = React.useState(false);
  const [inputVal, setInputVal] = React.useState("2000000");

  const fetchRates = () => {
    setLoading(true); setError(false);
    fetch("https://v6.exchangerate-api.com/v6/60dc1d50c587d667a41d415d/latest/AED")
      .then(r => r.json())
      .then(data => {
        if (data.rates) {
          setRates(data.rates);
          setLastUpdated(new Date(data.time_last_update_utc).toLocaleDateString("en-AE", { day: "2-digit", month: "short", year: "numeric" }));
        } else { setError(true); }
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  };

  React.useEffect(() => { fetchRates(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currencies = [
    { code: "GBP", name: "British Pound",    color: "#3B82F6" },
    { code: "EUR", name: "Euro",              color: "#6366F1" },
    { code: "USD", name: "US Dollar",         color: "#10B981" },
    { code: "INR", name: "Indian Rupee",      color: "#F59E0B" },
    { code: "PKR", name: "Pakistani Rupee",   color: "#34D399" },
    { code: "SAR", name: "Saudi Riyal",       color: "#D4A843" },
    { code: "RUB", name: "Russian Ruble",     color: "#EF4444" },
    { code: "CNY", name: "Chinese Yuan",      color: "#F87171" },
    { code: "CAD", name: "Canadian Dollar",   color: "#60A5FA" },
    { code: "AUD", name: "Australian Dollar", color: "#34D399" },
    { code: "CHF", name: "Swiss Franc",       color: "#A78BFA" },
    { code: "JPY", name: "Japanese Yen",      color: "#FB923C" },
  ];

  const fmtCurrency = (val, code) => {
    if (!val || isNaN(val)) return "\u2014";
    if (val >= 1e6) return code + "\u00a0" + (val / 1e6).toFixed(2) + "M";
    if (val >= 1e3) return code + "\u00a0" + Math.round(val / 1000) + "K";
    return code + "\u00a0" + Math.round(val).toLocaleString();
  };

  const convert = (aed, code) => rates ? aed * rates[code] : null;
  const propertyPrices = activeProjects.filter(p => p.price).slice(0, 10);

  return (
    <>
      <Section title="Currency Converter" sub="Live rates · AED to GBP, EUR, USD, INR, PKR and 8 more currencies">
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Status bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: T.surface, borderRadius: 12, border: "1px solid " + T.border }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: loading ? T.gold : error ? "#EF4444" : T.green }} />
              <span style={{ fontSize: 12, color: T.textSecondary }}>{loading ? "Fetching live rates..." : error ? "Could not load rates" : "Live rates"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {lastUpdated && <span style={{ fontSize: 11, color: T.textMuted }}>Updated {lastUpdated}</span>}
              <button type="button" onClick={fetchRates} disabled={loading}
                style={{ padding: "5px 12px", background: loading ? T.surfaceAlt : "rgba(212,168,67,0.1)", border: "1px solid " + (loading ? T.border : "rgba(212,168,67,0.3)"), borderRadius: 8, color: loading ? T.textMuted : T.gold, fontSize: 11, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif" }}>
                {loading ? "Refreshing..." : "Refresh Rates"}
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div style={{ background: T.surface, borderRadius: 16, border: "1px solid " + T.border, padding: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Enter Amount in AED</div>
            <div style={{ position: "relative", marginBottom: 20 }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: T.gold, fontWeight: 700 }}>AED</span>
              <input type="number" value={inputVal} onChange={e => { setInputVal(e.target.value); setAedAmount(Number(e.target.value) || 0); }}
                style={{ width: "100%", padding: "14px 14px 14px 60px", background: T.surfaceAlt, border: "1px solid " + T.gold, borderRadius: 12, color: T.white, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10 }}>Or pick a project price:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {propertyPrices.map(p => (
                <button key={p.id} type="button" onClick={() => { setAedAmount(p.price); setInputVal(String(p.price)); }}
                  style={{ padding: "6px 12px", background: aedAmount === p.price ? "rgba(212,168,67,0.15)" : T.surfaceAlt, border: "1px solid " + (aedAmount === p.price ? T.gold : T.border), borderRadius: 8, color: aedAmount === p.price ? T.gold : T.textSecondary, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                  {p.name.split(" ").slice(0, 2).join(" ")} {(p.price / 1e6).toFixed(1)}M
                </button>
              ))}
            </div>
          </div>

          {/* Currency cards */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>&#x231B;</div>
              <div style={{ fontSize: 13 }}>Loading live exchange rates...</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {currencies.map(c => {
                const val = convert(aedAmount, c.code);
                return (
                  <div key={c.code} style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: "18px 16px", transition: "border-color 0.2s, background 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = c.color; e.currentTarget.style.background = T.surfaceAlt; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 28, height: 20, background: c.color, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>{c.code}</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{c.code}</div>
                        <div style={{ fontSize: 9, color: T.textMuted }}>{c.name}</div>
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 800, color: c.color, marginBottom: 4 }}>{fmtCurrency(val, c.code)}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>1 AED = {rates ? rates[c.code].toFixed(4) : "\u2014"} {c.code}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* All projects table */}
          {!loading && !error && rates && (
            <div style={{ background: T.surface, borderRadius: 16, border: "1px solid " + T.border, padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>All Project Prices in Your Currency</div>
              <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>Every Emaar project — prices converted live</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid " + T.border }}>
                      {["Project", "AED", "GBP", "EUR", "USD", "INR", "PKR", "SAR"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: h === "Project" ? "left" : "right", color: T.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeProjects.filter(p => p.price).map(p => (
                      <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                        onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={{ padding: "9px 12px", color: T.white, fontWeight: 600, whiteSpace: "nowrap" }}>{p.name}</td>
                        <td style={{ padding: "9px 12px", textAlign: "right", color: T.gold, fontWeight: 700 }}>{(p.price / 1e6).toFixed(2)}M</td>
                        {["GBP", "EUR", "USD", "INR", "PKR", "SAR"].map(code => (
                          <td key={code} style={{ padding: "9px 12px", textAlign: "right", color: T.textSecondary, whiteSpace: "nowrap" }}>{fmtCurrency(p.price * rates[code], code)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Section>

      <TabSources sources={[
        { label: "ExchangeRate-API (Live)", url: "https://www.exchangerate-api.com" },
        { label: "European Central Bank", url: "https://www.ecb.europa.eu" },
        { label: "UAE Central Bank", url: "https://www.cbuae.gov.ae" },
        { label: "XE Currency", url: "https://www.xe.com/currency/aed" },
      ]} />
    </>
  );
};

export default CurrencyTab;
