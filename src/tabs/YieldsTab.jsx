/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════════════
   DXB ANALYTICS — RENTAL YIELDS

   ── REBUILD 2, 2026-08-02: FOR AN AGENT, NOT AN ANALYST ───────────────────

   Rebuild 1 fixed the data but shipped analyst language. "223 of 264 measured
   cells" and "DISTINCT VALUES 165 — measured, not bucketed" are facts about my
   pipeline, not answers to an agent's question. A "cell" is not a thing anyone
   sells. The controls were a bare row of dropdowns with nothing explaining why
   you would touch them, and nothing told the user whether 5.4% was good.

   This version is organised around what a person actually does:

       1. understand what the number means      -> plain-English definition
                                                   + a worked sum in real money
       2. understand what it does NOT include   -> gross vs net, stated loudly
       3. choose what they are advising on      -> labelled steps with hints
       4. read the answer in context            -> "high / typical / low for Dubai"
       5. see the evidence                      -> sales and contracts per row
       6. know what to say to the client        -> a written takeaway

   Jargon removed: cell, bucketed, distinct values, minimum observations.
   Every control carries a one-line reason to use it.

   ── THE DATA (unchanged from rebuild 1) ───────────────────────────────────

   264 combinations across 78 master communities. Each is a median registered
   Ejari rent divided by a median registered DLD sale price for the SAME unit
   type, both sides 2024 onward, both needing 30+ records.

   Replaces community documents where 15 distinct yield values covered 193
   communities — 43% of them sharing 5.5% or 6.5%. Against DLD records the old
   figures ran one way: of the 14 worst gaps, 13 overstated the yield.

   See scripts/dld/build_yields.py and GAP_ANALYSIS.md.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { T } from "../data";
import Y from "../data/yieldsDld.json";

const ROOM_LABEL = {
  "Studio": "Studio", "1bed room+Hall": "1 bedroom", "2 bed rooms+hall": "2 bedroom",
  "3 bed rooms+hall": "3 bedroom", "4 bed rooms+hall": "4 bedroom", "5 bed rooms+hall": "5 bedroom",
};
const ROOM_ORDER = ["Studio", "1bed room+Hall", "2 bed rooms+hall",
                    "3 bed rooms+hall", "4 bed rooms+hall", "5 bed rooms+hall"];

/* Every segment the DLD record supports, in the order an agent thinks about
   them. Residential splits by bedroom count; an office or a shop does not have
   bedrooms, so those are grouped by type alone and the size control hides
   itself. The tab previously offered only the first two and said nothing about
   the rest of the market. */
const SEGMENTS = [
  { key: "Apartments",          label: "Apartments",  note: "Flats and studios" },
  { key: "Villas & townhouses", label: "Villas",      note: "Villas and townhouses" },
  { key: "Offices",             label: "Offices",     note: "Commercial office space" },
  { key: "Retail & shops",      label: "Retail",      note: "Shops and showrooms" },
  { key: "Warehouses",          label: "Warehouses",  note: "Industrial and storage" },
];
const IS_RESIDENTIAL = s => s === "Apartments" || s === "Villas & townhouses";

/* Dubai-wide reference points, computed from this same dataset. Used to tell a
   user whether the number in front of them is high, normal or low — the old tab
   gave a percentage with nothing to judge it against. */
const ALL = Y.y || [];
const DUBAI_MEDIAN = (() => {
  const g = ALL.map(r => r.g).sort((a, b) => a - b);
  return g.length ? g[Math.floor(g.length / 2)] : 0;
})();

const money = n => n == null ? "—" : `AED ${Math.round(n).toLocaleString()}`;
const num = n => n == null ? "—" : Math.round(n).toLocaleString();

/** Where a yield sits for Dubai, in words rather than a number. */
function verdict(g) {
  if (g >= DUBAI_MEDIAN + 1.5) return { word: "High for Dubai", c: T.green,
    why: "Well above the Dubai norm. Usually smaller units or more affordable communities — check the service charge before promising it." };
  if (g >= DUBAI_MEDIAN + 0.4) return { word: "Above average", c: T.green,
    why: "Comfortably above the Dubai norm." };
  if (g >= DUBAI_MEDIAN - 0.4) return { word: "Typical for Dubai", c: T.gold,
    why: "Right around the market norm." };
  if (g >= DUBAI_MEDIAN - 1.5) return { word: "Below average", c: T.orange || T.gold,
    why: "Below the norm. Common in prime areas where buyers pay for capital growth rather than income." };
  return { word: "Low for Dubai", c: T.red,
    why: "Well below the norm. Typical of ultra-prime property, where the return is expected from price growth, not rent." };
}

export default function YieldsTab() {
  const [seg, setSeg] = useState("Apartments");
  const [rooms, setRooms] = useState("all");
  const [confidence, setConfidence] = useState(30);
  const [search, setSearch] = useState("");
  const [openHelp, setOpenHelp] = useState(false);

  const available = useMemo(
    () => SEGMENTS.filter(s => ALL.some(c => c.seg === s.key)), []);
  const roomsAvailable = useMemo(
    () => ROOM_ORDER.filter(r => ALL.some(c => c.seg === seg && c.r === r)), [seg]);

  const rows = useMemo(() => {
    let a = ALL.filter(c => c.seg === seg);
    if (rooms !== "all" && IS_RESIDENTIAL(seg)) a = a.filter(c => c.r === rooms);
    a = a.filter(c => Math.min(c.sn, c.rn) >= confidence);
    const q = search.trim().toLowerCase();
    if (q) a = a.filter(c => c.m.toLowerCase().includes(q));
    return [...a].sort((x, y) => y.g - x.g);
  }, [seg, rooms, confidence, search]);

  const stats = useMemo(() => {
    if (!rows.length) return null;
    const g = rows.map(r => r.g).sort((a, b) => a - b);
    return { median: g[Math.floor(g.length / 2)], best: rows[0], worst: rows[rows.length - 1] };
  }, [rows]);

  /* The single row we explain in full — the strongest-evidence one on screen. */
  const featured = useMemo(() => {
    if (!rows.length) return null;
    return [...rows].sort((a, b) => Math.min(b.sn, b.rn) - Math.min(a.sn, a.rn))[0];
  }, [rows]);

  const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14 };
  const ctl = {
    background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8,
    color: T.white, fontFamily: "'Outfit',sans-serif", fontSize: 13,
    padding: "9px 12px", outline: "none", cursor: "pointer", width: "100%",
  };
  const stepLabel = {
    fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: .5,
    textTransform: "uppercase", marginBottom: 4,
  };
  const hint = { fontSize: 11, color: T.textMuted, marginTop: 5, lineHeight: 1.5 };

  const chart = rows.slice(0, 15).map(r => ({
    name: `${r.m.length > 18 ? r.m.slice(0, 17) + "…" : r.m}`,
    yield: r.g, full: r,
  }));

  const Tip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const r = payload[0].payload.full;
    const v = verdict(r.g);
    return (
      <div style={{ ...card, padding: "12px 14px", fontSize: 12, lineHeight: 1.8, maxWidth: 290 }}>
        <div style={{ color: T.white, fontWeight: 700 }}>{r.m}</div>
        <div style={{ color: T.textMuted }}>{IS_RESIDENTIAL(r.seg) ? ROOM_LABEL[r.r] : r.seg}</div>
        <div style={{ color: v.c, fontWeight: 700, marginTop: 5 }}>{r.g}% — {v.word}</div>
        <div style={{ color: T.textSecondary, marginTop: 4 }}>
          Rent {money(r.rent)} a year<br/>÷ Price {money(r.s)}
        </div>
        <div style={{ color: T.textMuted, marginTop: 4 }}>
          Based on {num(r.sn)} sales and {num(r.rn)} tenancy contracts
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "0 4px" }}>

      {/* ═══ 1. WHAT THIS NUMBER MEANS ═══════════════════════════════════ */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 23, fontWeight: 800, color: T.white, margin: 0 }}>Rental Yields</h2>
        <p style={{ fontSize: 14, color: T.textSecondary, marginTop: 8, lineHeight: 1.75, maxWidth: 820 }}>
          <strong style={{ color: T.white }}>Gross yield is what a property earns in rent each
          year, as a percentage of what it costs to buy.</strong>{" "}
          A 5% yield means a property bought for AED 2,000,000 collects AED 100,000 a year in rent.
          The higher the number, the faster the rent pays back the purchase.
        </p>
      </div>

      {/* worked example in real money, from the strongest row on screen */}
      {featured && (
        <div style={{ ...card, padding: "18px 22px", marginBottom: 14,
                      background: "rgba(212,168,67,0.04)", borderColor: "rgba(212,168,67,0.22)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: .6,
                        textTransform: "uppercase", marginBottom: 10 }}>
            How the sum works — a real example from your data
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", fontSize: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: T.textMuted }}>A {IS_RESIDENTIAL(featured.seg) ? ROOM_LABEL[featured.r].toLowerCase() : featured.seg.toLowerCase()} in</div>
              <div style={{ color: T.white, fontWeight: 700 }}>{featured.m}</div>
            </div>
            <div style={{ fontSize: 20, color: T.textMuted }}>·</div>
            <div>
              <div style={{ fontSize: 11, color: T.textMuted }}>typically rents for</div>
              <div style={{ color: T.green, fontWeight: 700 }}>{money(featured.rent)} a year</div>
            </div>
            <div style={{ fontSize: 20, color: T.textMuted }}>÷</div>
            <div>
              <div style={{ fontSize: 11, color: T.textMuted }}>typically sells for</div>
              <div style={{ color: T.white, fontWeight: 700 }}>{money(featured.s)}</div>
            </div>
            <div style={{ fontSize: 20, color: T.textMuted }}>=</div>
            <div>
              <div style={{ fontSize: 11, color: T.textMuted }}>gross yield</div>
              <div style={{ color: T.gold, fontWeight: 800, fontSize: 20 }}>{featured.g}%</div>
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 12, lineHeight: 1.6 }}>
            Both figures are the middle of the market — {num(featured.sn)} recorded sales and{" "}
            {num(featured.rn)} registered tenancy contracts since 2024. Not asking prices. Not estimates.
          </div>
        </div>
      )}

      {/* ═══ 2. WHAT IT DOES NOT INCLUDE ═════════════════════════════════ */}
      <div style={{ ...card, padding: "16px 20px", marginBottom: 18,
                    borderColor: "rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.03)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 6 }}>
          Read this before you quote it to a client
        </div>
        <div style={{ fontSize: 12.5, color: T.textSecondary, lineHeight: 1.8 }}>
          This is <strong style={{ color: T.white }}>gross</strong> yield. It is the rent before any
          cost comes out. It does <strong style={{ color: T.white }}>not</strong> subtract:
          <span style={{ color: T.textMuted }}> service charges · vacant periods between tenants ·
          agency and management fees · maintenance · DLD registration.</span>
          <br />
          What an owner actually keeps — the <strong style={{ color: T.white }}>net</strong> yield —
          is normally <strong style={{ color: T.white }}>1 to 1.5 percentage points lower</strong>.
          A 6% gross is roughly a 4.5–5% net. Quote gross as gross, or a client will hold you to it.
        </div>
      </div>

      {/* ═══ 3. CHOOSE WHAT YOU ARE ADVISING ON ══════════════════════════ */}
      <div style={{ ...card, padding: "18px 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 14 }}>
          Tell me what you are looking at
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(215px,1fr))", gap: 18 }}>

          <div>
            <div style={stepLabel}>1 · Market segment</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {available.map(s => (
                <button key={s.key} type="button" title={s.note}
                  onClick={() => { setSeg(s.key); setRooms("all"); }}
                  style={{ ...ctl, width: "auto", padding: "8px 13px", fontSize: 12.5,
                           fontWeight: seg === s.key ? 700 : 500,
                           background: seg === s.key ? "rgba(212,168,67,0.12)" : "transparent",
                           borderColor: seg === s.key ? T.gold : T.border,
                           color: seg === s.key ? T.gold : T.textSecondary }}>{s.label}</button>
              ))}
            </div>
            <div style={hint}>
              Residential and commercial behave differently. In Dubai offices and retail
              typically yield <strong style={{ color: T.textSecondary }}>more</strong> than
              apartments — the trade-off is longer void periods and harder resale.
            </div>
          </div>

          <div>
            <div style={stepLabel}>2 · Size</div>
            {IS_RESIDENTIAL(seg) ? (
              <select value={rooms} onChange={e => setRooms(e.target.value)} style={ctl}>
                <option value="all">Any size</option>
                {roomsAvailable.map(r => <option key={r} value={r}>{ROOM_LABEL[r]}</option>)}
              </select>
            ) : (
              /* A dropdown with one choice is not a control. Offices and shops
                 have no bedroom count, so the control is removed rather than
                 greyed out — TAB_CLARITY.md check 6. */
              <div style={{ ...ctl, cursor: "default", color: T.textMuted,
                            display: "flex", alignItems: "center" }}>
                Not applicable
              </div>
            )}
            <div style={hint}>
              {IS_RESIDENTIAL(seg)
                ? "Smaller units almost always yield more. Studios run roughly 1.5–2 points above 3-beds, because rent falls more slowly than price as size drops."
                : "Not applicable — offices, shops and warehouses are not measured by bedroom count."}
            </div>
          </div>

          <div>
            <div style={stepLabel}>3 · How sure do you need to be?</div>
            <select value={confidence} onChange={e => setConfidence(+e.target.value)} style={ctl}>
              <option value={30}>Show everything (30+ records)</option>
              <option value={200}>Only well-evidenced (200+)</option>
              <option value={1000}>Only very strong (1,000+)</option>
              <option value={3000}>Only the deepest markets (3,000+)</option>
            </select>
            <div style={hint}>
              Raise this before an important meeting. A yield from 30 deals can move; one from
              3,000 will not.
            </div>
          </div>

          <div>
            <div style={stepLabel}>4 · A community in mind?</div>
            <input value={search} onChange={e => setSearch(e.target.value)}
                   placeholder="Type a community name…" style={{ ...ctl, cursor: "text" }} />
            <div style={hint}>Leave blank to compare the whole market.</div>
          </div>
        </div>
      </div>

      {/* ═══ 4. THE ANSWER, IN CONTEXT ═══════════════════════════════════ */}
      {rows.length === 0 ? (
        <div style={{ ...card, padding: "26px 22px", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 6 }}>
            Nothing recorded for that combination
          </div>
          <div style={{ fontSize: 12.5, color: T.textMuted, lineHeight: 1.7 }}>
            A figure only appears when at least {confidence} sales and {confidence} tenancy
            contracts exist for that exact unit type since 2024. Try a lower confidence level,
            a different size, or clear the community search.
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 8 }}>
            {[
              { l: "Typical here", v: `${stats.median}%`,
                s: `middle of ${rows.length} ${rows.length === 1 ? "result" : "results"}`, c: T.gold },
              { l: "Best return", v: `${stats.best.g}%`,
                s: `${stats.best.m}${IS_RESIDENTIAL(stats.best.seg) ? " · " + ROOM_LABEL[stats.best.r] : ""}`, c: T.green },
              { l: "Lowest return", v: `${stats.worst.g}%`,
                s: `${stats.worst.m}${IS_RESIDENTIAL(stats.worst.seg) ? " · " + ROOM_LABEL[stats.worst.r] : ""}`, c: T.red },
              { l: "Dubai norm", v: `${DUBAI_MEDIAN}%`, s: "all communities, all sizes", c: T.white },
            ].map(x => (
              <div key={x.l} style={{ ...card, padding: "14px 18px", flex: "1 1 200px" }}>
                <div style={{ fontSize: 10.5, color: T.textMuted, textTransform: "uppercase",
                              letterSpacing: .7, fontWeight: 700 }}>{x.l}</div>
                <div style={{ fontSize: 25, fontWeight: 800, color: x.c, marginTop: 6, lineHeight: 1 }}>{x.v}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, overflow: "hidden",
                              textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.s}</div>
              </div>
            ))}
          </div>

          {/* what it means, in a sentence */}
          <div style={{ ...card, padding: "14px 20px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.8 }}>
              <span style={{ color: verdict(stats.median).c, fontWeight: 700 }}>
                {verdict(stats.median).word}.
              </span>{" "}
              {verdict(stats.median).why}{" "}
              The Dubai-wide middle across every community and size is {DUBAI_MEDIAN}%, so what you
              are looking at is{" "}
              <strong style={{ color: T.white }}>
                {Math.abs(stats.median - DUBAI_MEDIAN) < 0.05 ? "right on the norm"
                  : `${Math.abs(stats.median - DUBAI_MEDIAN).toFixed(2)} points ${stats.median > DUBAI_MEDIAN ? "above" : "below"} it`}
              </strong>.
            </div>
          </div>

          <div style={{ ...card, padding: "18px 20px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>
              Best returns in this selection
            </div>
            <div style={{ fontSize: 11.5, color: T.textMuted, marginBottom: 14 }}>
              Green sits above the Dubai norm, gold below. The dashed line is the Dubai
              norm of {DUBAI_MEDIAN}%. Hover a bar for the full working.
            </div>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ top: 4, right: 8, left: 0, bottom: 56 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="name" stroke={T.textMuted} fontSize={10.5}
                         angle={-38} textAnchor="end" interval={0} height={64} />
                  <YAxis stroke={T.textMuted} fontSize={12} tickLine={false} axisLine={false}
                         tickFormatter={v => `${v}%`} width={46} />
                  <Tooltip content={<Tip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <ReferenceLine y={DUBAI_MEDIAN} stroke={T.gold} strokeDasharray="4 4" />
                  <Bar dataKey="yield" radius={[4, 4, 0, 0]}>
                    {chart.map((c, i) => (
                      <Cell key={i} fill={c.yield >= DUBAI_MEDIAN ? T.green : T.gold} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ═══ 5. THE EVIDENCE ══════════════════════════════════════════ */}
          <div style={{ ...card, padding: "16px 18px", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                          flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>
                Every result, and what it is based on
              </div>
              <button type="button" onClick={() => setOpenHelp(!openHelp)}
                style={{ ...ctl, width: "auto", padding: "6px 12px", fontSize: 11.5, color: T.gold,
                         borderColor: "rgba(212,168,67,0.3)", background: "transparent" }}>
                {openHelp ? "Hide" : "What do these columns mean?"}
              </button>
            </div>
            {openHelp && (
              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.9,
                            padding: "12px 14px", marginBottom: 10, borderRadius: 10,
                            background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                <strong style={{ color: T.white }}>Typical price</strong> — the middle sale price
                recorded with the Land Department. Half sold for more, half for less. Not an asking price.<br/>
                <strong style={{ color: T.white }}>Typical rent</strong> — the middle annual rent on
                registered tenancy contracts for that same unit type.<br/>
                <strong style={{ color: T.white }}>Gross yield</strong> — rent divided by price.<br/>
                <strong style={{ color: T.white }}>Sales / Tenancies</strong> — how many real records
                the two middles come from. This is your confidence. A row built on 4,913 tenancies is
                one you can defend; a row built on 40 is a guide.
              </div>
            )}
            <div style={{ overflowX: "auto", maxHeight: 440 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ color: T.textMuted, textAlign: "left" }}>
                    {["Community", "Size", "Gross yield", "How it compares",
                      "Typical price", "Typical rent/yr", "Sales", "Tenancies"].map(h => (
                      <th key={h} style={{ padding: "9px 10px", fontWeight: 600,
                                           position: "sticky", top: 0, background: T.surface }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 200).map((r, i) => {
                    const v = verdict(r.g);
                    return (
                      <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                        <td style={{ padding: "9px 10px", color: T.white, fontWeight: 600 }}>{r.m}</td>
                        <td style={{ padding: "9px 10px", color: T.textSecondary }}>{IS_RESIDENTIAL(r.seg) ? ROOM_LABEL[r.r] : r.seg}</td>
                        <td style={{ padding: "9px 10px", color: T.green, fontWeight: 700 }}>{r.g}%</td>
                        <td style={{ padding: "9px 10px", color: v.c, fontSize: 11.5 }}>{v.word}</td>
                        <td style={{ padding: "9px 10px", color: T.textSecondary }}>{money(r.s)}</td>
                        <td style={{ padding: "9px 10px", color: T.textSecondary }}>{money(r.rent)}</td>
                        <td style={{ padding: "9px 10px", color: T.textMuted }}>{num(r.sn)}</td>
                        <td style={{ padding: "9px 10px", color: T.textMuted }}>{num(r.rn)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══ 6. WHAT TO SAY TO THE CLIENT ════════════════════════════════ */}
      <div style={{ ...card, padding: "16px 20px", marginBottom: 14,
                    background: "rgba(20,184,166,0.03)", borderColor: "rgba(20,184,166,0.22)" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.teal, marginBottom: 8 }}>
          Using this with a client
        </div>
        <div style={{ fontSize: 12.5, color: T.textSecondary, lineHeight: 1.9 }}>
          <strong style={{ color: T.white }}>Say how many deals it is based on.</strong> "This is the
          middle of 2,197 recorded sales and 4,131 registered tenancies" ends the conversation
          about where the number came from.<br/>
          <strong style={{ color: T.white }}>Say gross, then say net.</strong> Give the gross figure,
          then subtract roughly 1–1.5 points for costs so nobody is surprised later.<br/>
          <strong style={{ color: T.white }}>A low yield is not a bad investment.</strong> Prime
          communities yield less because buyers there are paying for capital growth. Explain the
          trade-off rather than steering on yield alone.
        </div>
      </div>

      {/* provenance */}
      <div style={{ ...card, padding: "14px 18px", background: "rgba(212,168,67,0.03)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, textTransform: "uppercase",
                      letterSpacing: .7, marginBottom: 7 }}>Where these numbers come from</div>
        <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.8 }}>
          Dubai Land Department sale records and registered Ejari tenancy contracts,{" "}
          {Y.window.replace("..", "to")}. A figure needs at least {Y.minObservationsPerSide} of each
          before it is shown — {Y.cellsSuppressedTooThin} combinations were held back for having too
          little evidence rather than shown as a guess.
          <br />
          <span style={{ color: T.textMuted }}>
            Tenancy records are limited to residential use and to {Y.filters.rentPerSqftPerYear},
            which removes whole-building and company leases registered as a single contract.
            {" "}{Y.caveat}
          </span>
        </div>
      </div>
    </div>
  );
}
