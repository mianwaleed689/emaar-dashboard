import React, { useState, useMemo } from "react";
import { T } from "../data";
import {
  ALMANAC_AS_OF,
  MOMENT,
  MOMENT_COLOR,
  MOMENT_LABEL,
} from "../data/marketAlmanac";
import { SectionTitle, Card } from "./ui/DataDisplay";
import useAlmanac from "../hooks/useAlmanac";

/**
 * The Dubai property almanac — what happened, when, and what it did.
 *
 * A price chart tells a reader the market fell in 2008. This tells them it fell
 * because credit vanished that September, that Dubai World then asked to suspend
 * repayment on roughly USD 25 billion in November 2009, that about 450 projects
 * were abandoned, and that prices ended 64% below the mid-2008 peak — with the
 * source for each of those claims printed beside it.
 *
 * Two design decisions worth stating:
 *
 *   1. Sources are shown, not footnoted. The credibility of this product rests
 *      on a reader being able to check any claim, so the citation sits in the
 *      entry rather than behind a link.
 *
 *   2. Coverage is stated honestly. The almanac holds the pivotal moments, not
 *      every month since 2002. The header says how many periods are recorded so
 *      a gap reads as a gap rather than as an absence of events.
 */
export default function MarketAlmanac({ style }) {
  const [openId, setOpenId] = useState("2022-12");
  const [filter, setFilter] = useState("all");
  const [showSources, setShowSources] = useState(false);

  const muted = T?.textMuted || "#8A94A6";
  const text = T?.textSecondary || "#C9D1D9";
  const border = T?.border || "rgba(255,255,255,0.08)";
  const white = T?.white || "#fff";

  /* Curated seed merged with whatever the nightly compile has published. One
     Firestore read regardless of how many entries the record grows to. */
  const { entries: ALMANAC, loading } = useAlmanac();

  const coverage = useMemo(() => {
    const years = new Set(ALMANAC.map(e => String(e.id).slice(0, 4)));
    return {
      entries: ALMANAC.length,
      years: years.size,
      earliest: ALMANAC[0]?.label ?? null,
      latest: ALMANAC[ALMANAC.length - 1]?.label ?? null,
    };
  }, [ALMANAC]);

  const sources = useMemo(() => {
    const set = new Set();
    ALMANAC.forEach(e => (e.sources || []).forEach(s => set.add(s)));
    return [...set].sort();
  }, [ALMANAC]);

  const filtered = useMemo(
    () => (filter === "all" ? ALMANAC : ALMANAC.filter(e => e.moment === filter)),
    [filter, ALMANAC]
  );

  const FILTERS = [
    { key: "all", label: "Everything" },
    { key: MOMENT.SHOCK, label: "Shocks" },
    { key: MOMENT.RECORD, label: "Records" },
    { key: MOMENT.REFORM, label: "Reforms" },
    { key: MOMENT.MILESTONE, label: "Milestones" },
  ].filter(f => f.key === "all" || ALMANAC.some(e => e.moment === f.key));

  return (
    <div style={style}>
      <SectionTitle
        variant="heading"
        hint={`${coverage.entries} periods recorded, ${coverage.earliest} to ${coverage.latest} · every figure carries its source`}
      >
        The Dubai property almanac
      </SectionTitle>

      <p style={{ fontSize: 11.5, color: muted, lineHeight: 1.65, maxWidth: 760, margin: "0 0 14px" }}>
        What happened, when, and what it did to the market. A chart shows you that prices fell
        in 2008 — this shows you why, who stopped buying, how far it went, and what ended it.
        Every claim names the source it came from.
      </p>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          const color = f.key === "all" ? (T?.gold || "#D4A843") : MOMENT_COLOR[f.key];
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                padding: "5px 12px", borderRadius: 999, cursor: "pointer",
                border: `1px solid ${active ? color : border}`,
                background: active ? color + "18" : "transparent",
                color: active ? color : muted,
                fontSize: 11, fontWeight: active ? 700 : 500, fontFamily: "'Outfit',sans-serif",
              }}
            >
              {f.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowSources(s => !s)}
          style={{
            marginLeft: "auto", padding: "5px 12px", borderRadius: 999, cursor: "pointer",
            border: `1px solid ${border}`, background: "transparent", color: muted,
            fontSize: 11, fontFamily: "'Outfit',sans-serif",
          }}
        >
          {showSources ? "Hide sources" : `All sources (${sources.length})`}
        </button>
      </div>

      {showSources && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: muted, marginBottom: 8 }}>
            Every source cited in the almanac
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>
            {sources.map(s => (
              <li key={s} style={{ fontSize: 11, color: text, lineHeight: 1.55 }}>{s}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* ── Entries ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {filtered.map(entry => {
          const isOpen = openId === entry.id;
          const color = MOMENT_COLOR[entry.moment] || muted;

          return (
            <div
              key={entry.id}
              style={{
                border: `1px solid ${isOpen ? color + "55" : border}`,
                borderRadius: 10,
                background: isOpen ? color + "0A" : "rgba(255,255,255,0.02)",
                overflow: "hidden",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : entry.id)}
                aria-expanded={isOpen}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 11,
                  padding: "12px 14px", cursor: "pointer", textAlign: "left",
                  background: "transparent", border: "none", fontFamily: "'Outfit',sans-serif",
                }}
              >
                <span style={{ fontSize: 11, color: muted, width: 96, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                  {entry.label}
                </span>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase",
                  padding: "2px 7px", borderRadius: 999, flexShrink: 0,
                  background: color + "1A", color, border: `1px solid ${color}40`,
                }}>
                  {MOMENT_LABEL[entry.moment]}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: white, flex: 1, minWidth: 120, lineHeight: 1.4 }}>
                  {entry.headline}
                </span>
                <span style={{ fontSize: 13, color: muted, width: 12, textAlign: "center", flexShrink: 0 }}>
                  {isOpen ? "–" : "+"}
                </span>
              </button>

              {isOpen && (
                <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${border}` }}>

                  {/* The numbers */}
                  {entry.metrics && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "12px 0 4px" }}>
                      {Object.entries(entry.metrics).map(([k, v]) => (
                        <div key={k} style={{
                          flex: "1 1 170px", minWidth: 150, padding: "9px 11px",
                          borderRadius: 8, background: "rgba(255,255,255,0.03)",
                          border: `1px solid ${border}`,
                        }}>
                          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: muted, marginBottom: 4 }}>
                            {LABELS[k] || k}
                          </div>
                          <div style={{ fontSize: 12, color: white, fontWeight: 600, lineHeight: 1.4 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <Block title="What happened">{entry.whatHappened}</Block>
                  {entry.effect && <Block title="Effect on the market">{entry.effect}</Block>}
                  {entry.whoInvested && <Block title="Who was buying">{entry.whoInvested}</Block>}

                  {entry.lesson && (
                    <div style={{
                      marginTop: 12, padding: "10px 12px", borderRadius: 8,
                      background: color + "0F", border: `1px solid ${color}33`,
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color, marginBottom: 5 }}>
                        What it teaches
                      </div>
                      <p style={{ margin: 0, fontSize: 12, color: text, lineHeight: 1.65 }}>{entry.lesson}</p>
                    </div>
                  )}

                  {/* Sources, shown rather than footnoted */}
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${border}` }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: muted, marginBottom: 5 }}>
                      Sources
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {(entry.sources || []).map(s => (
                        <li key={s} style={{ fontSize: 10, color: muted, lineHeight: 1.55 }}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 10, color: muted, lineHeight: 1.6, marginTop: 12, maxWidth: 760 }}>
        The almanac records the pivotal moments, not every month since 2002 — {coverage.entries} periods
        so far. Months are added as they are sourced; an entry is never published without one.
        Reviewed {ALMANAC_AS_OF}.
      </p>
    </div>
  );
}

const LABELS = {
  transactions: "Transactions",
  value: "Value",
  medianPpsf: "Median price",
  priceChange: "Price change",
};

function Block({ title, children }) {
  const muted = T?.textMuted || "#8A94A6";
  const text = T?.textSecondary || "#C9D1D9";
  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: muted, margin: "12px 0 5px" }}>
        {title}
      </div>
      <p style={{ margin: 0, fontSize: 12, color: text, lineHeight: 1.7 }}>{children}</p>
    </>
  );
}
