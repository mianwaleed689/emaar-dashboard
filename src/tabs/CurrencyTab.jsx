/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — CURRENCY TAB
   Extracted from EmaarDashboardV2.jsx (lines 5966-6168)
   AED exchange rates, property price converter, 12-month trend chart
   ═══════════════════════════════════════════════════════════════════ */

import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import { GOLDEN_VISA_THRESHOLD } from "../utils/constants";

/* ── Top currencies for Dubai international buyers (FALLBACK rates) ── */
const TOP_CURRENCIES = [
  { code: "USD", name: "US Dollar",        flag: "🇺🇸", rate: 3.6725, change: 0.0,   buyers: "Americas" },
  { code: "GBP", name: "British Pound",    flag: "🇬🇧", rate: 4.6420, change: +0.8,  buyers: "UK" },
  { code: "EUR", name: "Euro",             flag: "🇪🇺", rate: 3.9850, change: -0.3,  buyers: "Europe" },
  { code: "INR", name: "Indian Rupee",     flag: "🇮🇳", rate: 0.0441, change: -0.2,  buyers: "India — #1 buyer nation" },
  { code: "RUB", name: "Russian Ruble",    flag: "🇷🇺", rate: 0.0401, change: +1.2,  buyers: "Russia" },
  { code: "CNY", name: "Chinese Yuan",     flag: "🇨🇳", rate: 0.5062, change: +0.1,  buyers: "China" },
  { code: "PKR", name: "Pakistani Rupee",  flag: "🇵🇰", rate: 0.0131, change: -0.5,  buyers: "Pakistan" },
  { code: "SAR", name: "Saudi Riyal",      flag: "🇸🇦", rate: 0.9793, change: 0.0,   buyers: "GCC" },
  { code: "CHF", name: "Swiss Franc",      flag: "🇨🇭", rate: 4.1380, change: +0.4,  buyers: "Europe" },
  { code: "CAD", name: "Canadian Dollar",  flag: "🇨🇦", rate: 2.6840, change: -0.2,  buyers: "Canada" },
  { code: "AUD", name: "Australian Dollar",flag: "🇦🇺", rate: 2.3610, change: +0.3,  buyers: "Australia" },
  { code: "JPY", name: "Japanese Yen",     flag: "🇯🇵", rate: 0.0245, change: -0.8,  buyers: "Japan" },
];

/* ── 12-month historical data (seed) ── */
const RATE_HISTORY = {
  GBP: [4.51, 4.53, 4.58, 4.60, 4.62, 4.59, 4.55, 4.57, 4.61, 4.63, 4.64, 4.642],
  EUR: [3.97, 3.99, 4.01, 3.98, 3.96, 3.94, 3.92, 3.95, 3.97, 3.99, 3.98, 3.985],
  INR: [0.0440, 0.0442, 0.0445, 0.0443, 0.0441, 0.0440, 0.0438, 0.0439, 0.0441, 0.0442, 0.0441, 0.0441],
  USD: [3.6725, 3.6725, 3.6725, 3.6725, 3.6725, 3.6725, 3.6725, 3.6725, 3.6725, 3.6725, 3.6725, 3.6725],
};
const MONTHS = ["May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr"];

function CurrencyTab({ selectedCcy, setSelectedCcy, aedAmount, setAedAmount, searchCcy, setSearchCcy }) {
  /* ─── LIVE RATES from exchangerate.host (free, UAE Central Bank source) ─── */
  const [liveRates, setLiveRates] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [fetchStatus, setFetchStatus] = useState('loading'); // loading | live | fallback

  useEffect(() => {
    const fetchRates = async () => {
      try {
        // open.er-api.com: free, no key, CORS-enabled
        // Returns: 1 AED = X of each currency (already in correct direction!)
        const res = await fetch('https://open.er-api.com/v6/latest/AED');
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        if (data && data.rates && data.result === 'success') {
          // Filter to only the currencies we display
          const wantedCodes = TOP_CURRENCIES.map(c => c.code);
          const filteredRates = {};
          for (const code of wantedCodes) {
            if (data.rates[code] !== undefined) {
              filteredRates[code] = data.rates[code];
            }
          }
          setLiveRates(filteredRates);
          setLastUpdated(new Date());
          setFetchStatus('live');
        } else {
          setFetchStatus('fallback');
        }
      } catch (err) {
        console.warn('Currency API failed, using fallback rates:', err);
        setFetchStatus('fallback');
      }
    };
    fetchRates();
    // Refresh every 5 minutes while tab is open
    const interval = setInterval(fetchRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /* Merge live rates into TOP_CURRENCIES (live takes priority, fallback to seed) */
  /* Note: seed `rate` field represents "1 [CURRENCY] = X AED" (e.g., 1 USD = 3.6725 AED) */
  /* Live rates from API are converted to "1 AED = X CURRENCY" already                    */
  const currenciesWithLiveRates = TOP_CURRENCIES.map(c => {
    // If live rate exists, use it directly (already in "1 AED = X CCY" format)
    // Otherwise convert seed rate "1 CCY = X AED" to "1 AED = X CCY" by inverting
    const aedToCcy = liveRates?.[c.code] || (1 / c.rate);
    return {
      ...c,
      rate: aedToCcy,
      isLive: !!liveRates?.[c.code],
    };
  });

  const selectedRate = currenciesWithLiveRates.find(c => c.code === selectedCcy)?.rate || 1;
  const convertedAmount = (aedAmount * selectedRate).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const chartData = (RATE_HISTORY[selectedCcy] || RATE_HISTORY.GBP).map((rate, i) => ({ month: MONTHS[i], rate: 1 / rate }));
  const filteredCcys = currenciesWithLiveRates.filter(c =>
    c.name.toLowerCase().includes(searchCcy.toLowerCase()) || c.code.toLowerCase().includes(searchCcy.toLowerCase())
  );

  return (
    <div style={{ animation: "fadeUp 0.4s ease-out forwards" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", marginBottom: 20, borderBottom: `1px solid ${T.border}`, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.white }}>Currency Intelligence</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>AED exchange rates · Property price converter · International buyer tool</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {fetchStatus === 'live' && lastUpdated && (
            <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: T.green, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 2s infinite" }} />
              Live · Updated {lastUpdated.toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {fetchStatus === 'loading' && (
            <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.2)", color: T.gold }}>
              Fetching live rates...
            </span>
          )}
          {fetchStatus === 'fallback' && (
            <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#F59E0B" }}>
              Reference rates (live API unavailable)
            </span>
          )}
          <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: T.green, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.green, display: "inline-block" }} />UAE Central Bank Peg
          </span>
          <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, color: T.textMuted }}>Bank spread 2-4% additional</span>
        </div>
      </div>

      {/* AED peg info */}
      <div style={{ background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
        {SvgIcons.Landmark({ width: 16, height: 16, style: { color: T.gold, flexShrink: 0 } })}
        <span style={{ fontSize: 12, color: T.textSecondary }}><span style={{ color: T.gold, fontWeight: 700 }}>AED is pegged to USD at 3.6725</span> — fixed since 1997 by UAE Central Bank. AED/USD rate never changes. All other pairs fluctuate vs USD.</span>
      </div>

      {/* 2-column: Converter + Chart */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 16, marginBottom: 20 }}>
        {/* Converter */}
        <div className="chart-box" style={{ padding: 20 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 16 }}>Property Price Converter</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>Property Price (AED)</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {[500000, 1000000, 2000000, 5000000, 10000000].map(amt => (
                <button key={amt} type="button" onClick={() => setAedAmount(amt)}
                  style={{ padding: "4px 10px", borderRadius: 8, border: `1px solid ${aedAmount === amt ? "rgba(212,168,67,0.5)" : T.border}`, background: aedAmount === amt ? "rgba(212,168,67,0.12)" : T.surfaceAlt, color: aedAmount === amt ? T.gold : T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: aedAmount === amt ? 700 : 400 }}>
                  {amt >= 1000000 ? "AED " + (amt/1000000) + "M" : "AED " + (amt/1000) + "K"}
                </button>
              ))}
            </div>
            <input type="number" value={aedAmount} onChange={e => setAedAmount(parseFloat(e.target.value) || 0)}
              style={{ width: "100%", padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, outline: "none" }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>Convert To</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TOP_CURRENCIES.map(c => (
                <button key={c.code} type="button" onClick={() => setSelectedCcy(c.code)}
                  style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${selectedCcy === c.code ? "rgba(212,168,67,0.5)" : T.border}`, background: selectedCcy === c.code ? "rgba(212,168,67,0.12)" : T.surfaceAlt, color: selectedCcy === c.code ? T.gold : T.textSecondary, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: selectedCcy === c.code ? 700 : 400, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 14 }}>{c.flag}</span> {c.code}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: 16, background: "rgba(212,168,67,0.06)", borderRadius: 10, border: "1px solid rgba(212,168,67,0.2)", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>AED {aedAmount.toLocaleString()} =</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 32, fontWeight: 900, color: T.gold }}>{selectedCcy} {convertedAmount}</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>Rate: 1 AED = {selectedRate.toFixed(4)} {selectedCcy}</div>
            {aedAmount >= GOLDEN_VISA_THRESHOLD && (
              <div style={{ marginTop: 10, padding: "4px 12px", borderRadius: 20, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: T.green, fontSize: 11, fontWeight: 700, display: "inline-block" }}>Golden Visa eligible (AED 2M+)</div>
            )}
          </div>
        </div>

        {/* 12-month chart */}
        <div className="chart-box" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: T.white }}>AED/{selectedCcy} — 12 Month Trend</div>
            <span style={{ fontSize: 10, color: T.textMuted }}>Apr 2025 – Apr 2026</span>
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>Exchange rate per 1 AED · UAE Central Bank data</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs><linearGradient id="ccyGold" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.gold} stopOpacity={0.2}/><stop offset="95%" stopColor={T.gold} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v.toFixed(selectedRate < 1 ? 4 : 2)} width={60} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }} labelStyle={{ color: T.white }} itemStyle={{ color: T.gold }} formatter={v => [v.toFixed(4) + " " + selectedCcy, "Rate"]} />
              <Area type="monotone" dataKey="rate" stroke={T.gold} strokeWidth={2} fill="url(#ccyGold)" dot={false} activeDot={{ r: 4, fill: T.gold }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rates table */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 14, fontWeight: 700, color: T.white }}>Reference Exchange Rates</div>
          <div style={{ position: "relative" }}>
            {SvgIcons.Search({ width: 13, height: 13, style: { position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textMuted, pointerEvents: "none" } })}
            <input value={searchCcy} onChange={e => setSearchCcy(e.target.value)} placeholder="Search currency..."
              style={{ padding: "6px 10px 6px 30px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontFamily: "'Outfit',sans-serif", fontSize: 12, outline: "none", width: 180 }} />
          </div>
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr", padding: "10px 16px", background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
            {["Currency", "Code", "1 AED =", "24H Change", "Dubai Buyers From"].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.8, textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>
          {filteredCcys.map((c, i) => (
            <div key={i} onClick={() => setSelectedCcy(c.code)}
              style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr", padding: "11px 16px", borderBottom: i < filteredCcys.length - 1 ? `1px solid ${T.border}` : "none", background: selectedCcy === c.code ? "rgba(212,168,67,0.06)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)", cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={e => { if (selectedCcy !== c.code) e.currentTarget.style.background = "rgba(212,168,67,0.03)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = selectedCcy === c.code ? "rgba(212,168,67,0.06)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ fontSize: 18 }}>{c.flag}</span><span style={{ fontSize: 13, color: T.white, fontWeight: 500 }}>{c.name}</span></div>
              <div style={{ fontSize: 13, color: T.textMuted, fontWeight: 600 }}>{c.code}</div>
              <div style={{ fontSize: 13, color: T.gold, fontWeight: 700 }}>{c.rate.toFixed(4)}</div>
              <div style={{ fontSize: 12, color: c.change > 0 ? T.green : c.change < 0 ? T.red : T.textMuted, fontWeight: 600 }}>{c.change > 0 ? "+" : ""}{c.change.toFixed(1)}%</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>{c.buyers}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sources */}
      <div style={{ paddingTop: 12, borderTop: `1px solid ${T.border}`, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: T.textMuted }}>Sources:</span>
        {["UAE Central Bank", "ExchangeRate-API", "DLD Buyer Nationality Report 2025"].map((s, i) => (
          <span key={i} style={{ fontSize: 10, color: T.textMuted, padding: "2px 8px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

export default CurrencyTab;
