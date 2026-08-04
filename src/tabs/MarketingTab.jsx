/* eslint-disable */
/**
 * MARKETING — WHICH CHANNELS ARE WORTH THE MONEY.
 *
 * WHAT WAS HERE BEFORE
 * ────────────────────
 * An AI marketing-copy generator, held back from customers because it carried
 * 27 unsourced claims. It wrote listing descriptions; it did not tell anybody
 * whether Property Finder was worth what the agency pays for it. A marketing
 * manager in a brokerage is judged on the second question. The old file is in
 * git history if the copy generator is ever wanted as its own thing.
 *
 * WHAT A MARKETING MANAGER ACTUALLY NEEDS
 * ───────────────────────────────────────
 * One question nothing else in this product answers: of everything we spend,
 * what turned into a deal. Not how many leads arrived — how many closed, and
 * what each closing cost. Every figure is computed from the agency's own leads
 * by src/crm/model/marketing.js, tested to 30 assertions.
 *
 * AGGREGATES ONLY, AND THAT IS DELIBERATE
 * ───────────────────────────────────────
 * This screen never shows a client's name, phone or email, and structurally
 * cannot: the model returns counts and rates, never a lead. org.js draws that
 * line already — marketing needs to know Property Finder converts better than
 * Bayut and has no business with the buyer's mobile number.
 *
 * WHAT IT REFUSES TO GUESS
 * ────────────────────────
 * There is no advertising-platform integration in this product — no Meta, no
 * Google, no portal billing API — so spend is typed in by the agency. A channel
 * nobody has priced shows "not recorded" rather than a zero, because a zero
 * reads as free. Until every channel has a cost the headline refuses to name a
 * best one, since "best" without cost quietly means "loudest".
 */
import React, { useMemo, useState, useEffect } from "react";
import { doc, setDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { T } from "../data";
import { sourcePerformance, marketingTotals, demandByArea, headline } from "../crm/model/marketing";

const card  = { background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}`, borderRadius: 12 };
const muted = { fontSize: 9.5, fontWeight: 700, color: T.textMuted, letterSpacing: .7, textTransform: "uppercase" };
const aed   = n => `AED ${Math.round(Number(n) || 0).toLocaleString("en-AE")}`;
const COLS  = "1.4fr 68px 68px 96px 118px 100px 116px";

function MarketingTab({ myLeads = [], orgId, orgName, canEditSpend = true }) {
  const [spend, setSpend]   = useState({});
  const [draft, setDraft]   = useState({});
  const [saving, setSaving] = useState({});

  /* Spend lives in its own subcollection rather than as a map on the
     organisation record, so a rule can restrict who reads it. Commission
     splits taught that lesson the expensive way. */
  useEffect(() => {
    if (!orgId) return;
    const unsub = onSnapshot(collection(db, "organisations", orgId, "marketingSpend"), snap => {
      const next = {};
      snap.forEach(d => { next[d.id] = Number(d.data()?.amount) || 0; });
      setSpend(next);
    }, err => console.warn("[marketingSpend]", err?.code || err));
    return () => unsub();
  }, [orgId]);

  const rows   = useMemo(() => sourcePerformance(myLeads, spend), [myLeads, spend]);
  const totals = useMemo(() => marketingTotals(rows), [rows]);
  const areas  = useMemo(() => demandByArea(myLeads), [myLeads]);
  const line   = useMemo(() => headline(rows, totals), [rows, totals]);

  const save = async (source, amount) => {
    if (!orgId) return;
    setSaving(s => ({ ...s, [source]: true }));
    try {
      await setDoc(doc(db, "organisations", orgId, "marketingSpend", source),
        { source, amount: Number(amount) || 0, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) { console.error("[marketingSpend] save failed", e); }
    setSaving(s => ({ ...s, [source]: false }));
  };

  const inp = { width: 100, padding: "5px 8px", background: "rgba(255,255,255,0.04)",
                border: `1px solid ${T.border}`, borderRadius: 6, color: T.white,
                fontSize: 11.5, fontFamily: "'Outfit',sans-serif", outline: "none", textAlign: "right" };

  if (!myLeads.length) return (
    <div style={{ padding: "60px 20px", textAlign: "center", color: T.textSecondary,
                  fontSize: 12.5, lineHeight: 1.8, maxWidth: 520, margin: "0 auto" }}>
      No leads on record yet, so there is nothing to judge a channel by. Once enquiries
      start arriving this shows which of them turn into deals, and what each deal cost to win.
    </div>
  );

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={{ padding: "14px 4px 12px", borderBottom: `1px solid ${T.border}` }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif" }}>
          Marketing{orgName ? ` — ${orgName}` : ""}
        </h2>
        <p style={{ fontSize: 12.5, color: T.textSecondary, lineHeight: 1.7, margin: "8px 0 0", maxWidth: 780 }}>
          {line}
        </p>
        <div style={{ marginTop: 9, fontSize: 11, lineHeight: 1.6, color: T.textMuted }}>
          <span style={{ fontWeight: 700 }}>Not covered</span> — spend is not read from any
          advertising platform. There is no Meta, Google or portal billing connection in this
          product, so what a channel cost is what somebody records below. Anything unpriced
          reads “not recorded”, never zero.
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "14px 4px" }}>
        {[["Leads", String(totals.leads), `across ${rows.length} channel${rows.length === 1 ? "" : "s"}`],
          ["Closed", String(totals.won), `${totals.conversionPct}% of the ${totals.settled} that settled`],
          ["Spend recorded", totals.spend ? aed(totals.spend) : "—", `for ${totals.spendCoverage} channels`],
          ["Cost per deal", totals.costPerWon ? aed(totals.costPerWon) : "not known",
            totals.spendComplete ? "every channel priced" : "only where spend is recorded"],
        ].map(([label, value, note]) => (
          <div key={label} style={{ ...card, padding: "12px 15px", flex: "1 1 190px", minWidth: 168 }}>
            <div style={muted}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.white,
                          fontFamily: "'Fraunces',serif", margin: "4px 0 2px" }}>{value}</div>
            <div style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5 }}>{note}</div>
          </div>
        ))}
      </div>

      <div style={{ ...card, margin: "0 4px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: COLS, gap: 8, padding: "9px 14px",
                      borderBottom: `1px solid ${T.border}`, background: "rgba(255,255,255,0.02)" }}>
          {["Channel", "Leads", "Closed", "Conversion", "Spend", "Per lead", "Per deal"].map((h, i) => (
            <div key={h} style={{ ...muted, textAlign: i === 0 ? "left" : "right" }}>{h}</div>
          ))}
        </div>

        {rows.map(r => (
          <div key={r.source} style={{ display: "grid", gridTemplateColumns: COLS, gap: 8,
                                       padding: "10px 14px", alignItems: "center",
                                       borderBottom: `1px solid ${T.border}40` }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, color: T.white, fontWeight: 600 }}>{r.source}</div>
              {r.spentWithNothingWon > 0 && (
                <div style={{ fontSize: 9.5, color: "#FCA5A5", marginTop: 1 }}>
                  {aed(r.spentWithNothingWon)} spent, nothing closed
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, textAlign: "right", color: T.textSecondary }}>{r.leads}</div>
            <div style={{ fontSize: 12, textAlign: "right", color: r.won ? T.green : T.textMuted }}>{r.won}</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: T.textSecondary }}>
                {r.settled ? `${r.conversionPct}%` : "—"}
              </div>
              <div style={{ fontSize: 9, color: T.textMuted }}>
                {r.settled ? `of ${r.settled} settled` : "none settled yet"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {canEditSpend ? (
                <input style={inp} placeholder="not recorded"
                  value={draft[r.source] ?? (r.spend ?? "")}
                  onChange={e => setDraft(d => ({ ...d, [r.source]: e.target.value }))}
                  onBlur={e => save(r.source, e.target.value)} />
              ) : (
                <span style={{ fontSize: 12, color: r.spend ? T.white : T.textMuted }}>
                  {r.spend ? aed(r.spend) : "not recorded"}
                </span>
              )}
              {saving[r.source] && <span style={{ fontSize: 9, color: T.textMuted }}> …</span>}
            </div>
            <div style={{ fontSize: 12, textAlign: "right",
                          color: r.costPerLead != null ? T.white : T.textMuted }}>
              {r.costPerLead != null ? aed(r.costPerLead) : "—"}
            </div>
            <div style={{ fontSize: 12.5, textAlign: "right", fontWeight: 700,
                          color: r.costPerWon != null ? T.gold : T.textMuted }}>
              {r.costPerWon != null ? aed(r.costPerWon) : r.won === 0 ? "nothing closed" : "—"}
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...card, margin: "14px 4px", padding: "12px 14px" }}>
        <div style={{ ...muted, marginBottom: 9 }}>Where the demand is</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {areas.map(a => (
            <div key={a.area} style={{ padding: "8px 11px", borderRadius: 9, minWidth: 152,
                                       background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 11.5, color: T.white, fontWeight: 600 }}>{a.area}</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>
                {a.leads} lead{a.leads === 1 ? "" : "s"}{a.won ? ` · ${a.won} closed` : ""}
              </div>
              <div style={{ fontSize: 10, color: T.gold, marginTop: 1 }}>
                {a.averageBudget ? `avg ${aed(a.averageBudget)}` : "no budgets stated"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ margin: "0 4px", fontSize: 10.5, color: T.textMuted, lineHeight: 1.7 }}>
        Every figure is counted from this agency's own leads. Client names, phone numbers and
        email addresses are never shown here — marketing measures channels, not people.
      </div>
    </div>
  );
}

export default MarketingTab;
