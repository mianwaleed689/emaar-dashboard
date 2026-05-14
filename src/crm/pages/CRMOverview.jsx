/* eslint-disable */
import React, { useMemo } from "react";
import { C, LEAD_STAGES, fmtAED, fmt, timeAgo } from "../crmTokens";

function KPICard({ icon, label, value, sub, subColor, trend, color }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
      padding: "20px 22px", flex: 1, minWidth: 0, position: "relative", overflow: "hidden",
      transition: "border-color 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.borderHover}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: C.textSec, fontWeight: 500, letterSpacing: 0.3 }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: C.white, fontFamily: C.serif, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: subColor || C.textSec, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

function Widget({ title, icon, children, onViewAll }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{title}</span>
        </div>
        {onViewAll && (
          <button type="button" onClick={onViewAll} style={{ background: "none", border: "none", color: C.gold, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: C.sans }}>
            View all <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        )}
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

function EmptyState({ icon, text, sub }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", gap: 8 }}>
      <div style={{ fontSize: 32, opacity: 0.4 }}>{icon}</div>
      <div style={{ fontSize: 13, color: C.textSec, fontWeight: 500 }}>{text}</div>
      {sub && <div style={{ fontSize: 11, color: C.textMuted }}>{sub}</div>}
    </div>
  );
}

function QuickAction({ icon, label, desc, color, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
      background: "none", border: "none", width: "100%", cursor: "pointer",
      borderRadius: 8, transition: "background 0.15s", textAlign: "left",
      fontFamily: C.sans,
    }}
      onMouseEnter={e => e.currentTarget.style.background = C.surfaceAlt}
      onMouseLeave={e => e.currentTarget.style.background = "none"}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{label}</div>
        <div style={{ fontSize: 11, color: C.textSec }}>{desc}</div>
      </div>
      <svg style={{ marginLeft: "auto", color: C.textMuted }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  );
}

export default function CRMOverview({ myLeads, myLeadsLoading, teamMembers, deals, userName, quote, onNavigate, orgName }) {

  const stats = useMemo(() => {
    const leads = myLeads || [];
    const dealsArr = deals || [];
    const closed = leads.filter(l => l.status === "Closed Deal").length;
    const hot = leads.filter(l => l.status === "Hot Case").length;
    const uncontacted = leads.filter(l => !l.lastContact).length;
    const totalPipeline = dealsArr.reduce((s, d) => s + parseFloat(d.price || d.value || 0), 0);
    const conversion = leads.length > 0 ? ((closed / leads.length) * 100).toFixed(1) : "0.0";
    const commissions = dealsArr.filter(d => d.stage === "Contracted").reduce((s, d) => s + parseFloat(d.commission || 0), 0);
    return { total: leads.length, hot, closed, uncontacted, pipeline: totalPipeline, conversion, commissions, deals: dealsArr.length };
  }, [myLeads, deals]);

  const stageBreakdown = useMemo(() => {
    const leads = myLeads || [];
    const counts = {};
    leads.forEach(l => { counts[l.status || "New Lead"] = (counts[l.status || "New Lead"] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [myLeads]);

  const recentLeads = useMemo(() => (myLeads || []).slice(0, 5), [myLeads]);

  const recentDeals = useMemo(() => (deals || []).slice(0, 4), [deals]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Greeting ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: C.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            {new Date().getHours() < 17 ? "☀️" : "🌙"}
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.white }}>
              {greeting()}, <span style={{ color: C.gold }}>{userName}</span>
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textSec, fontStyle: "italic", maxWidth: 500 }}>
              "{quote.text}" — {quote.author}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 16px", textAlign: "right" }}>
            <div style={{ fontSize: 11, color: C.textSec }}>Today</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.white }}>{new Date().toLocaleDateString("en-AE", { weekday: "short", day: "numeric", month: "short" })}</div>
          </div>
          {orgName && (
            <div style={{ background: C.goldDim, border: `1px solid ${C.gold}40`, borderRadius: 10, padding: "10px 16px", textAlign: "right" }}>
              <div style={{ fontSize: 11, color: C.gold }}>Agency</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.gold }}>{orgName}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.textSec, letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>CRM Overview</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          <KPICard icon="👥" label="Total Leads" value={fmt(stats.total)} sub={`${stats.hot} hot leads`} subColor={C.red} color={C.blue} />
          <KPICard icon="🎯" label="Opportunities" value={fmt(stats.hot + stats.closed)} sub={`${stats.uncontacted} uncontacted`} subColor={C.yellow} color={C.purple} />
          <KPICard icon="🤝" label="Active Deals" value={fmt(stats.deals)} sub={fmtAED(stats.pipeline) + " pipeline"} subColor={C.gold} color={C.teal} />
          <KPICard icon="📈" label="Conversion" value={stats.conversion + "%"} sub="Lead to deal rate" color={C.green} />
        </div>
      </div>

      {/* ── Commission Bar ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.goldDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💰</div>
          <div>
            <div style={{ fontSize: 11, color: C.textSec }}>Total Commissions</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.gold, fontFamily: C.serif }}>{fmtAED(stats.commissions)}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {[["Groups", "0"], ["Batches", "0"]].map(([label, val]) => (
            <div key={label} style={{ background: C.surfaceAlt, borderRadius: 8, padding: "6px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: C.textSec }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.white }}>{val}</div>
            </div>
          ))}
          <button type="button" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.gold, fontSize: 12, cursor: "pointer", fontFamily: C.sans, fontWeight: 600 }}>
            Details ▾
          </button>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

        {/* Deals Pipeline */}
        <Widget title="Deals Pipeline" icon="📊" onViewAll={() => onNavigate("deals")}>
          {recentDeals.length === 0 ? (
            <EmptyState icon="📦" text="No deals in pipeline" sub="Create your first deal to see the pipeline" />
          ) : (
            <div style={{ padding: "0 4px" }}>
              {recentDeals.map((deal, i) => (
                <div key={deal.id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: deal.stage === "Contracted" ? C.green : deal.stage === "Cancelled" ? C.red : C.gold, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deal.project || deal.unit || "Deal"}</div>
                    <div style={{ fontSize: 10, color: C.textSec }}>{deal.stage}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.gold }}>{fmtAED(deal.price || deal.value || 0)}</div>
                </div>
              ))}
            </div>
          )}
        </Widget>

        {/* Leads by Stage */}
        <Widget title="Leads by Stage" icon="🎯" onViewAll={() => onNavigate("leads")}>
          {stageBreakdown.length === 0 ? (
            <EmptyState icon="📋" text="No stage data available" />
          ) : (
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              {stageBreakdown.map(([stage, count]) => {
                const stageConfig = { "Hot Case": C.red, "New Lead": C.blue, "Potential": C.purple, "Closed Deal": C.green, "EOI": C.teal }[stage] || C.textSec;
                const pct = Math.round((count / (myLeads?.length || 1)) * 100);
                return (
                  <div key={stage}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: C.textSec }}>{stage}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.white }}>{count}</span>
                    </div>
                    <div style={{ height: 4, background: C.surfaceAlt, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: pct + "%", height: "100%", background: stageConfig, borderRadius: 2, transition: "width 0.5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Widget>

        {/* Activities */}
        <Widget title="Activities" icon="⚡" onViewAll={() => onNavigate("activities")}>
          <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
            {["Pending & Overdue", "Upcoming"].map((tab, i) => (
              <button key={tab} type="button" style={{
                flex: 1, padding: "10px 8px", background: "none", border: "none",
                color: i === 0 ? C.white : C.textSec, fontSize: 12, fontWeight: i === 0 ? 600 : 400,
                borderBottom: i === 0 ? `2px solid ${C.gold}` : "2px solid transparent",
                cursor: "pointer", fontFamily: C.sans,
              }}>{tab}</button>
            ))}
          </div>
          <EmptyState icon="✅" text="No pending activities" sub="All caught up!" />
        </Widget>
      </div>

      {/* ── Bottom Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>

        {/* Opportunities */}
        <Widget title="Opportunities" icon="🎪" onViewAll={() => onNavigate("opportunities")}>
          <EmptyState icon="🎯" text="No opportunities in pipeline" sub="Create your first opportunity" />
        </Widget>

        {/* By Status */}
        <Widget title="By Status" icon="📈">
          <div style={{ padding: "14px 16px" }}>
            {[
              { label: "Open", sub: "Active opportunities", color: C.orange, val: stats.hot },
              { label: "Won", sub: "Converted to deals", color: C.green, val: stats.closed },
              { label: "Lost", sub: "Closed without conversion", color: C.red, val: 0 },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: `${row.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: row.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.white }}>{row.label}</div>
                    <div style={{ fontSize: 10, color: C.textSec }}>{row.sub}</div>
                  </div>
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.white }}>{row.val}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 4px" }}>
              <span style={{ fontSize: 11, color: C.textSec }}>Pipeline Value</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{fmtAED(stats.pipeline)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 4 }}>
              <span style={{ fontSize: 11, color: C.textSec }}>Weighted Value</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{fmtAED(stats.pipeline * 0.6)}</span>
            </div>
            <button type="button" onClick={() => onNavigate("opportunities")} style={{
              width: "100%", marginTop: 10, padding: "10px", background: C.goldDim,
              border: `1px solid ${C.gold}40`, borderRadius: 8, color: C.gold,
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: C.sans,
            }}>
              🎯 Create Opportunity
            </button>
          </div>
        </Widget>

        {/* Quick Actions */}
        <Widget title="Quick Actions" icon="⚡">
          <div style={{ padding: "6px 4px" }}>
            <QuickAction icon="👤" label="Add Lead" desc="Create a new lead" color={C.blue} onClick={() => onNavigate("leads")} />
            <QuickAction icon="🎯" label="New Opportunity" desc="Start tracking a deal" color={C.purple} onClick={() => onNavigate("opportunities")} />
            <QuickAction icon="📞" label="Log Call" desc="Record a call activity" color={C.teal} onClick={() => onNavigate("activities")} />
            <QuickAction icon="📅" label="Schedule Meeting" desc="Plan a meeting" color={C.gold} onClick={() => onNavigate("activities")} />
            <QuickAction icon="💬" label="Send Message" desc="Send an email or SMS" color={C.green} onClick={() => onNavigate("activities")} />
            <QuickAction icon="👥" label="View Leads" desc="Browse all leads" color={C.blue} onClick={() => onNavigate("leads")} />
            <QuickAction icon="🤝" label="View Deals" desc="Browse all deals" color={C.orange} onClick={() => onNavigate("deals")} />
          </div>
        </Widget>
      </div>

    </div>
  );
}
