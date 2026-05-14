/* eslint-disable */
import React, { useState, useEffect, useCallback } from "react";
import { C, QUOTES } from "./crmTokens";
import CRMOverview from "./pages/CRMOverview";
import CRMLeads from "./pages/CRMLeads";
import { CRMOpportunities } from "./pages/CRMPages";
import { CRMDeals } from "./pages/CRMPages";
import { CRMActivities } from "./pages/CRMPages";

const NAV_ITEMS = [
  { key: "overview",       label: "Overview",       icon: OverviewIcon },
  { key: "leads",          label: "Leads",          icon: LeadsIcon },
  { key: "opportunities",  label: "Opportunities",  icon: OppsIcon },
  { key: "deals",          label: "Deals",          icon: DealsIcon },
  { key: "activities",     label: "Activities",     icon: ActivitiesIcon },
];

function OverviewIcon({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  );
}
function LeadsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function OppsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}
function DealsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  );
}
function ActivitiesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

export default function CRMApp({
  firebaseUser, orgId, orgRole, userRole, orgName,
  myLeads, myLeadsLoading, teamMembers,
  deals, listings, onBack,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [leadCounts, setLeadCounts] = useState({});
  const [dealCounts, setDealCounts] = useState({});
  const [oppCounts, setOppCounts] = useState({});
  const [toast, setToast] = useState(null);

  const notify = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Compute counts for badges
  useEffect(() => {
    if (!myLeads) return;
    const counts = {};
    myLeads.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1; });
    setLeadCounts(counts);
  }, [myLeads]);

  const userName = firebaseUser?.displayName || firebaseUser?.email?.split("@")[0] || "Agent";
  const quote = QUOTES[new Date().getDay() % QUOTES.length];

  const sharedProps = {
    firebaseUser, orgId, orgRole, userRole, orgName,
    myLeads, myLeadsLoading, teamMembers,
    deals, listings, notify, leadCounts,
    userName,
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: C.bg, fontFamily: C.sans, color: C.text, overflow: "hidden"
    }}>

      {/* ── Top Bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        height: 56, flexShrink: 0, paddingRight: 20,
      }}>
        {/* Back button */}
        <button type="button" onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "0 20px",
          height: "100%", background: "none", border: "none", borderRight: `1px solid ${C.border}`,
          color: C.textSec, cursor: "pointer", fontSize: 13, fontFamily: C.sans,
        }}
          onMouseEnter={e => e.currentTarget.style.color = C.white}
          onMouseLeave={e => e.currentTarget.style.color = C.textSec}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Dashboard
        </button>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px", borderRight: `1px solid ${C.border}` }}>
          <div style={{ width: 28, height: 28, background: `linear-gradient(135deg, ${C.gold}, #B8922A)`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.white }}>DXB <span style={{ color: C.gold }}>CRM</span></span>
        </div>

        {/* Nav tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "0 16px", flex: 1 }}>
          {NAV_ITEMS.map(item => {
            const active = activeTab === item.key;
            return (
              <button key={item.key} type="button" onClick={() => setActiveTab(item.key)} style={{
                display: "flex", alignItems: "center", gap: 7, padding: "0 14px",
                height: 56, background: "none", border: "none",
                borderBottom: active ? `2px solid ${C.gold}` : "2px solid transparent",
                color: active ? C.gold : C.textSec, cursor: "pointer",
                fontSize: 13, fontWeight: active ? 600 : 400, fontFamily: C.sans,
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.color = C.white; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.color = C.textSec; }}
              >
                <item.icon active={active} />
                {item.label}
                {item.key === "leads" && myLeads?.length > 0 && (
                  <span style={{ background: C.goldDim, color: C.gold, borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>
                    {myLeads.length > 999 ? "999+" : myLeads.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Date */}
          <div style={{ fontSize: 12, color: C.textSec, textAlign: "right" }}>
            <div style={{ color: C.white, fontWeight: 600 }}>{new Date().toLocaleDateString("en-AE", { weekday: "short", month: "short", day: "numeric" })}</div>
            <div style={{ color: C.textSec, fontSize: 10 }}>Dubai, UAE</div>
          </div>

          {/* Avatar */}
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: `linear-gradient(135deg, ${C.gold}, #B8922A)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "#000", cursor: "pointer",
            border: `2px solid ${C.gold}`,
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {activeTab === "overview"      && <CRMOverview      {...sharedProps} quote={quote} onNavigate={setActiveTab} />}
        {activeTab === "leads"         && <CRMLeads         {...sharedProps} />}
        {activeTab === "opportunities" && <CRMOpportunities {...sharedProps} />}
        {activeTab === "deals"         && <CRMDeals         {...sharedProps} />}
        {activeTab === "activities"    && <CRMActivities    {...sharedProps} />}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          background: toast.type === "error" ? C.redDim : C.greenDim,
          border: `1px solid ${toast.type === "error" ? C.red : C.green}`,
          borderRadius: 10, padding: "12px 20px",
          color: toast.type === "error" ? C.red : C.green,
          fontSize: 13, fontWeight: 600, fontFamily: C.sans,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          animation: "slideUp 0.2s ease",
        }}>
          {toast.type === "error" ? "⚠️" : "✅"}  {toast.msg}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
