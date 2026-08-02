/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════════════
   DXB ANALYTICS — PRICE HISTORY
   Rebuilt 2026-08-02 on Dubai Land Department transaction records.

   ── WHY THIS WAS REBUILT ──────────────────────────────────────────────────

   The previous version could not answer the three questions an agent asks in
   the first ten seconds, and it was wrong on the numbers:

     "Are these real communities?"
        The filter offered 122 names in ONE flat list which was actually 85
        master projects, 25 cadastral areas, 9 sub-communities and 3 unknowns.
        SIX names — Business Bay, Palm Jumeirah, Palm Deira, Palm Jabal Ali,
        Dubai Investment Park First and Second — were simultaneously an area
        AND a master project, with no way to tell which you had selected.

     "Where does this number come from?"
        122 Firestore documents, not one carrying a source field, under a green
        "DLD Verified" badge. The chart could also fall back to a hardcoded
        growth curve — `commPPSF` — that invented five years of history for ten
        communities, six of which matched the live dropdown exactly.

     "How many sales is that?"
        Never shown.

   Measured against DLD records (see GAP_ANALYSIS.md): the median community was
   15% out, 28 of 82 were off by more than 25%, and nine by more than 50%. Every
   `DUBAI HILLS - …` sub-community showed the parent's AED 2,461 while DLD says
   GOLF GROVE is 1,238 and MAPLE 3 is 1,570.

   ── WHAT IT DOES NOW ──────────────────────────────────────────────────────

   Reads src/data/communityHierarchy.json — 1,242 entities computed from
   382,192 registered residential sales since 2019, separated into three
   explicit levels so the question "is this an area or a community?" has an
   answer on screen:

       Area (DLD cadastral)   72     each carries its DLD area_id
       Master community       95     each shows its parent area
       Project                1,075  each shows its parent master community

   Every point carries the number of sales behind it. Nothing is estimated,
   nothing is simulated, and a year with fewer than 20 sales is not published.

   ── METHOD ────────────────────────────────────────────────────────────────

   Median AED per square foot of registered DLD SALE transactions, residential
   built stock only. `procedure_area` is square metres and is converted at
   10.7639 sqft/sqm — missing that makes every figure 10.8x too small while
   still looking plausible.

   Validated against published market data on 2026-08-02:
       Palm Jumeirah  3,719 computed  vs 3,500-4,090 reported
       JVC            1,482 computed  vs 1,460 reported
       Dubai Marina   1,939 computed  vs 2,080 median transacted reported
   Portal figures are ASKING prices, which run 5-8% above transacted, so a DLD
   median sitting slightly below a portal average is the expected relationship.
   ═══════════════════════════════════════════════════════════════════════════ */

import React, { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { T } from "../data";
import HIER from "../data/communityHierarchy.json";

const LEVELS = [
  { key: "area",    label: "Area",             hint: "DLD cadastral area — the official land division" },
  { key: "master",  label: "Master community", hint: "A master development, e.g. Dubai Hills Estate" },
  { key: "project", label: "Project",          hint: "A single project or sub-community within a master" },
];

const fmt = n => n == null ? "—" : n.toLocaleString();

export default function PriceHistoryTab({ globalFilters = {} }) {
  const [level, setLevel] = useState("master");
  const [name, setName] = useState(null);
  const [compare, setCompare] = useState(null);
  const [search, setSearch] = useState("");

  const all = HIER.entities || [];
  const inLevel = useMemo(
    () => all.filter(e => e.l === level).sort((a, b) => b.t - a.t),
    [all, level]
  );

  /* Default to the deepest-traded entity in the level so the tab is never
     blank on arrival — an empty chart teaches the user nothing. */
  const selected = useMemo(() => {
    const pick = inLevel.find(e => e.n === name) || inLevel[0];
    return pick || null;
  }, [inLevel, name]);
  const other = useMemo(
    () => compare ? inLevel.find(e => e.n === compare) : null,
    [inLevel, compare]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? inLevel.filter(e => e.n.toLowerCase().includes(q)) : inLevel;
  }, [inLevel, search]);

  const chart = useMemo(() => {
    if (!selected) return [];
    const years = [...new Set([
      ...selected.s.map(x => x.year),
      ...(other ? other.s.map(x => x.year) : []),
    ])].sort();
    return years.map(y => ({
      year: y,
      a: selected.s.find(x => x.year === y)?.ppsf ?? null,
      aN: selected.s.find(x => x.year === y)?.n ?? null,
      b: other?.s.find(x => x.year === y)?.ppsf ?? null,
      bN: other?.s.find(x => x.year === y)?.n ?? null,
    }));
  }, [selected, other]);

  const card = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14 };
  const sel = {
    background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8,
    color: T.white, fontFamily: "'Outfit',sans-serif", fontSize: 13,
    padding: "9px 12px", outline: "none", cursor: "pointer", minWidth: 220,
  };

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ ...card, padding: "10px 12px", fontSize: 12 }}>
        <div style={{ color: T.white, fontWeight: 700, marginBottom: 6 }}>{label}</div>
        {d.a != null && (
          <div style={{ color: T.gold }}>
            {selected.n}: AED {fmt(d.a)}/sqft
            <span style={{ color: T.textMuted }}> · {fmt(d.aN)} sales</span>
          </div>
        )}
        {d.b != null && other && (
          <div style={{ color: T.teal }}>
            {other.n}: AED {fmt(d.b)}/sqft
            <span style={{ color: T.textMuted }}> · {fmt(d.bN)} sales</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: "0 4px" }}>

      {/* ── What this tab is. An agent should not have to guess. ── */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: T.white, margin: 0 }}>Price History</h2>
        <p style={{ fontSize: 13, color: T.textSecondary, marginTop: 6, lineHeight: 1.7, maxWidth: 760 }}>
          Median price per square foot each year, calculated from{" "}
          <strong style={{ color: T.white }}>registered Dubai Land Department sale
          transactions</strong> — not asking prices. Choose what you are looking at first:
          an <strong style={{ color: T.white }}>area</strong>, a{" "}
          <strong style={{ color: T.white }}>master community</strong>, or a single{" "}
          <strong style={{ color: T.white }}>project</strong>. Every figure shows how many
          sales it is based on.
        </p>
      </div>

      {/* ── Level: the question the old tab could not answer ── */}
      <div style={{ ...card, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: .6,
                      textTransform: "uppercase", marginBottom: 9 }}>
          1 · What are you looking at?
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {LEVELS.map(l => {
            const on = level === l.key;
            const n = all.filter(e => e.l === l.key).length;
            return (
              <button key={l.key} type="button" title={l.hint}
                onClick={() => { setLevel(l.key); setName(null); setCompare(null); setSearch(""); }}
                style={{
                  padding: "9px 16px", borderRadius: 9, cursor: "pointer",
                  fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: on ? 700 : 500,
                  background: on ? "rgba(212,168,67,0.12)" : "transparent",
                  border: `1px solid ${on ? T.gold : T.border}`,
                  color: on ? T.gold : T.textSecondary,
                }}>
                {l.label} <span style={{ opacity: .6, fontWeight: 500 }}>({n})</span>
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 9 }}>
          {LEVELS.find(l => l.key === level)?.hint}
        </div>
      </div>

      {/* ── Which one ── */}
      <div style={{ ...card, padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: .6,
                      textTransform: "uppercase", marginBottom: 9 }}>
          2 · Which one?
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${inLevel.length} ${level === "master" ? "communities" : level + "s"}…`}
            style={{ ...sel, cursor: "text", minWidth: 240 }}
          />
          <select value={selected?.n || ""} onChange={e => setName(e.target.value)} style={sel}>
            {visible.slice(0, 400).map(e => (
              <option key={e.n} value={e.n}>
                {e.n} — AED {fmt(e.s[e.s.length - 1].ppsf)}/sqft ({fmt(e.t)} sales)
              </option>
            ))}
          </select>
          <span style={{ fontSize: 12, color: T.textMuted }}>compare with</span>
          <select value={compare || ""} onChange={e => setCompare(e.target.value || null)} style={sel}>
            <option value="">— none —</option>
            {visible.slice(0, 400).filter(e => e.n !== selected?.n).map(e => (
              <option key={e.n} value={e.n}>{e.n}</option>
            ))}
          </select>
        </div>
        {selected?.p && (
          <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 10 }}>
            {level === "master" ? "Sits inside area" : level === "project" ? "Part of" : "DLD area id"}
            :{" "}
            <span style={{ color: T.textSecondary, fontWeight: 600 }}>
              {level === "area" ? (selected.id || "—") : selected.p}
            </span>
            {level === "project" && selected.pm && selected.pm !== selected.p && (
              <span style={{ color: T.textMuted }}> · master: {selected.pm}</span>
            )}
          </div>
        )}
      </div>

      {/* ── The answer ── */}
      {selected && (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
            {[
              { l: "Latest median", v: `AED ${fmt(selected.s[selected.s.length-1].ppsf)}`, s: "per sqft", c: T.gold },
              { l: "Based on", v: fmt(selected.s[selected.s.length-1].n), s: `sales in ${selected.s[selected.s.length-1].year}`, c: T.white },
              { l: `Since ${selected.cf}`, v: `${selected.c > 0 ? "+" : ""}${selected.c}%`, s: "change in median", c: selected.c >= 0 ? T.green : T.red },
              { l: "Total recorded", v: fmt(selected.t), s: "sales since 2019", c: T.white },
            ].map(x => (
              <div key={x.l} style={{ ...card, padding: "14px 18px", flex: "1 1 190px" }}>
                <div style={{ fontSize: 10.5, color: T.textMuted, textTransform: "uppercase",
                              letterSpacing: .7, fontWeight: 700 }}>{x.l}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: x.c, marginTop: 6, lineHeight: 1 }}>{x.v}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>{x.s}</div>
              </div>
            ))}
          </div>

          <div style={{ ...card, padding: "18px 20px", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 2 }}>
              Median AED/sqft by year
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 14 }}>
              Registered DLD sale transactions · years with fewer than {HIER.minYearSample} sales are not shown
            </div>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="year" stroke={T.textMuted} fontSize={12} tickLine={false} />
                  <YAxis stroke={T.textMuted} fontSize={12} tickLine={false} axisLine={false}
                         tickFormatter={v => v.toLocaleString()} width={62} />
                  <Tooltip content={<Tip />} />
                  {other && <Legend wrapperStyle={{ fontSize: 12 }} />}
                  <Line type="monotone" dataKey="a" name={selected.n} stroke={T.gold}
                        strokeWidth={2.5} dot={{ r: 3.5 }} connectNulls />
                  {other && (
                    <Line type="monotone" dataKey="b" name={other.n} stroke={T.teal}
                          strokeWidth={2.5} dot={{ r: 3.5 }} connectNulls />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ ...card, padding: "16px 18px", marginBottom: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.white, marginBottom: 10 }}>
              Year by year — with the evidence
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ color: T.textMuted, textAlign: "left" }}>
                    <th style={{ padding: "8px 10px", fontWeight: 600 }}>Year</th>
                    <th style={{ padding: "8px 10px", fontWeight: 600 }}>Median AED/sqft</th>
                    <th style={{ padding: "8px 10px", fontWeight: 600 }}>Sales recorded</th>
                    <th style={{ padding: "8px 10px", fontWeight: 600 }}>Year on year</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.s.map((r, i) => {
                    const prev = selected.s[i - 1];
                    const yoy = prev ? 100 * (r.ppsf - prev.ppsf) / prev.ppsf : null;
                    return (
                      <tr key={r.year} style={{ borderTop: `1px solid ${T.border}` }}>
                        <td style={{ padding: "9px 10px", color: T.white, fontWeight: 600 }}>{r.year}</td>
                        <td style={{ padding: "9px 10px", color: T.gold, fontWeight: 700 }}>{fmt(r.ppsf)}</td>
                        <td style={{ padding: "9px 10px", color: T.textSecondary }}>{fmt(r.n)}</td>
                        <td style={{ padding: "9px 10px", color: yoy == null ? T.textMuted : yoy >= 0 ? T.green : T.red }}>
                          {yoy == null ? "—" : `${yoy > 0 ? "+" : ""}${yoy.toFixed(1)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Provenance. The old badge asserted "DLD Verified" with nothing
             behind it; this states the method so a client can check it. ── */}
      <div style={{ ...card, padding: "14px 18px", background: "rgba(212,168,67,0.03)" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, textTransform: "uppercase",
                      letterSpacing: .7, marginBottom: 7 }}>
          How this is calculated
        </div>
        <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.8 }}>
          Median price per square foot of registered <strong style={{ color: T.white }}>{HIER.source}</strong>{" "}
          sale transactions, residential property only, from 2019 onward.
          Area is converted from square metres at 10.7639 sqft/sqm.
          A year needs at least {HIER.minYearSample} sales to appear.
          <br />
          <span style={{ color: T.textMuted }}>
            These are <strong>transacted</strong> prices, not asking prices — portal
            listings typically sit 5–8% higher. {HIER.caveat} Generated {HIER.generated}.
          </span>
        </div>
      </div>
    </div>
  );
}
