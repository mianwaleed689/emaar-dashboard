/**
 * THE DUBAI MARKET, AS OF THE LAST LAND DEPARTMENT EXPORT.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * WHY THIS EXISTS
 * ───────────────
 * The Overview opened with seats, team members and a plan price — a team-admin
 * panel on a property intelligence platform — while a 537 MB Land Department
 * export of 878,578 registered transactions sat unused on disk.
 *
 * This is the part every user sees first, whether they are an agent between
 * viewings, a manager, or the owner. It answers one question: what is the Dubai
 * market actually doing, and can I repeat it to a client.
 *
 * WHY EVERY COMPARISON IS DAY-BOUNDED
 * ───────────────────────────────────
 * The export is a snapshot. This one ends on 29 July, so the newest month is
 * short. Comparing it against whole earlier months produced "deals down 31.8%
 * year on year"; comparing the same 1st-to-29th window gives -25.7%. The first
 * is an arithmetic artefact, and shipping it would have told every agent in
 * Dubai the market fell by a third. Both figures below are like-for-like, and
 * the window is printed on screen.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * ────────────────────────────────
 * No forecast, no score, no "sentiment". Counts and medians over registered
 * transactions, each with the number of records behind it.
 */
import React from "react";
import { T } from "../data";
import { colour as C, type as TY, space as S, state as ST } from "../design/system";
import PULSE from "../data/marketPulse.json";

const MONTH = ["January", "February", "March", "April", "May", "June", "July",
               "August", "September", "October", "November", "December"];

const monthName = ym => {
  const [y, m] = String(ym).split("-");
  return `${MONTH[parseInt(m, 10) - 1]} ${y}`;
};

const aed = n =>
  n >= 1e9 ? `AED ${(n / 1e9).toFixed(1)}B` :
  n >= 1e6 ? `AED ${(n / 1e6).toFixed(0)}M` : `AED ${Math.round(n).toLocaleString()}`;

/** A change, with its direction stated in words rather than only in colour. */
function Delta({ pct, label }) {
  if (pct == null) return null;
  const up = pct >= 0;
  return (
    <span style={{ ...TY.smallStrong, color: up ? ST.positive.fg : ST.warning.fg }}>
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}% {label}
    </span>
  );
}

function Figure({ label, value, sub, note, accent }) {
  return (
    <div style={{ flex: "1 1 190px", minWidth: 170, background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${T.border}`, borderRadius: 12, padding: "13px 15px" }}>
      <div style={{ ...TY.label, color: C.textMuted,
                    textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent || T.white,
                    fontFamily: "'Fraunces',serif", lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ marginTop: 5 }}>{sub}</div>}
      {note && <div style={{ ...TY.small, color: C.textFaint, marginTop: 6 }}>{note}</div>}
    </div>
  );
}

export default function MarketPulse({ handleTabChange }) {
  const L = PULSE.latest;
  const covers = `1–${L.coversToDay} ${monthName(L.month)}`;
  const bars = PULSE.series.slice(-12);
  const peak = Math.max(...bars.map(b => b.deals), 1);

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.white,
                     fontFamily: "'Fraunces',serif" }}>
          The Dubai market
        </h3>
        <span style={{ ...TY.small, color: C.textMuted }}>
          {covers} · every figure counted from registered Land Department sales
        </span>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Figure
          label="Sales registered"
          value={L.deals.toLocaleString()}
          sub={<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Delta pct={L.dealsVsPrevMonth} label="on last month" />
            <Delta pct={L.dealsVsYearAgo} label="on last year" />
          </div>}
          /* The window is stated because it is the whole reason these two
             percentages are honest. */
          note={`Compared with the same ${L.coversToDay} days of each month — ${
            L.prevMonthSameWindow?.toLocaleString()} last month, ${
            L.yearAgoSameWindow?.toLocaleString()} a year ago.`}
        />

        <Figure
          label="Total value"
          value={aed(L.valueAed)}
          note={`Across ${L.deals.toLocaleString()} registered sales. Averages ${
            aed(L.valueAed / L.deals)} a sale.`}
        />

        <Figure
          label="Middle price per sq ft"
          value={`AED ${L.ppsf?.toLocaleString()}`}
          note={`The midpoint of ${L.ppsfN.toLocaleString()} sales that record both a price and a size. Half sold above, half below.`}
        />

        <Figure
          label="Off-plan share"
          value={`${Math.round(L.offPlan / (L.offPlan + L.ready) * 100)}%`}
          note={`${L.offPlan.toLocaleString()} off-plan against ${
            L.ready.toLocaleString()} completed. Off-plan above half means the market is buying the future, not the present.`}
        />
      </div>

      {/* Twelve months of volume. A single month says nothing about direction. */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`,
                    borderRadius: 12, padding: "13px 15px" }}>
        <div style={{ ...TY.label, color: C.textMuted,
                      textTransform: "uppercase", marginBottom: 10 }}>
          Sales a month, last twelve
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 96 }}>
          {bars.map((b, i) => {
            const last = i === bars.length - 1;
            return (
              <div key={b.month} title={`${monthName(b.month)} — ${b.deals.toLocaleString()} sales, ${aed(b.valueAed)}`}
                   style={{ flex: 1, display: "flex", flexDirection: "column",
                            alignItems: "center", gap: 4 }}>
                <div style={{ width: "100%", height: Math.max(5, (b.deals / peak) * 78),
                              background: last ? T.gold : "rgba(212,168,67,0.62)",
                              borderRadius: "3px 3px 0 0" }}/>
                <span style={{ ...TY.small, fontSize: 12, color: last ? C.accent : C.textMuted }}>
                  {b.month.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ ...TY.small, color: C.textFaint, marginTop: S.sm }}>
          The last bar covers {covers} only, so it is shorter than a full month by construction.
        </div>
      </div>

      {/* Where the activity actually is. */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`,
                    borderRadius: 12, padding: "13px 15px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
                      marginBottom: 9, gap: 10, flexWrap: "wrap" }}>
          <span style={{ ...TY.label, color: C.textMuted,
                         textTransform: "uppercase" }}>
            Busiest areas, {covers}
          </span>
          <button type="button" onClick={() => handleTabChange?.("Map")}
            title="See these areas on the map"
            style={{ background: "none", border: "none", color: C.accent, fontSize: 13,
                     cursor: "pointer", fontFamily: "'Outfit',sans-serif", padding: 0 }}>
            See them on the map →
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {PULSE.topAreas.slice(0, 6).map(a => (
            <div key={a.area} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ flex: 1, fontSize: 12, color: T.white, minWidth: 0,
                             overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {a.area}
              </span>
              <span style={{ ...TY.small, color: C.text, whiteSpace: "nowrap" }}>
                {a.deals.toLocaleString()} sales
              </span>
              <span style={{ ...TY.numeric, fontSize: 13, color: C.textMuted, width: 100, textAlign: "right",
                             whiteSpace: "nowrap" }}>
                {a.ppsf ? `AED ${a.ppsf.toLocaleString()}/sqft` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...TY.small, color: C.textFaint }}>
        Source: Dubai Land Department registered sale transactions, export dated{" "}
        {PULSE.exportDate}. {PULSE.rowsRead.toLocaleString()} transactions on record.
        {PULSE.rowsSkippedBadDate > 0 &&
          ` ${PULSE.rowsSkippedBadDate.toLocaleString()} rows carry an unusable date and are excluded.`}
        {" "}Registrations reach the Land Department with a short lag, so the most
        recent days are always the lightest.
      </div>
    </section>
  );
}
