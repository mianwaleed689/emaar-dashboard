/* eslint-disable */
import React, { useState, useCallback, useMemo } from "react";
import { C, QUOTES } from "./crmTokens";
import CRMOverview from "./pages/CRMOverview";
import CRMLeads from "./pages/CRMLeads";
import { CRMOpportunities, CRMDeals, CRMActivities } from "./pages/CRMPages";

const TABS = [
  { key:"overview",      label:"Overview",      icon:"⊞" },
  { key:"leads",         label:"Leads",         icon:"👥" },
  { key:"opportunities", label:"Opportunities", icon:"📈" },
  { key:"deals",         label:"Deals",         icon:"🤝" },
  { key:"activities",    label:"Activities",    icon:"📅" },
];

export default function CRMApp({
  firebaseUser, orgId, orgRole, userRole, orgName,
  myLeads, myLeadsLoading, teamMembers,
  deals, listings, onBack,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [toast, setToast] = useState(null);

  const notify = useCallback((msg, type="success") => {
    setToast({msg, type});
    setTimeout(()=>setToast(null), 3500);
  }, []);

  const userName = firebaseUser?.displayName || firebaseUser?.email?.split("@")[0] || "Agent";
  const quote = QUOTES[new Date().getDay() % QUOTES.length];
  const role = orgRole || userRole || "agent";
  const isManager = ["owner","director","manager","admin","superAdmin"].includes(role);

  const hotCount = useMemo(()=>(myLeads||[]).filter(l=>l.status==="Hot Case").length,[myLeads]);
  const staleCount = useMemo(()=>(myLeads||[]).filter(l=>l.lastContact&&(Date.now()-new Date(l.lastContact).getTime())>7*86400000&&!["Closed Deal","Closed Outside"].includes(l.status)).length,[myLeads]);

  const sharedProps = {
    firebaseUser, orgId, orgRole:role, userRole, orgName,
    myLeads, myLeadsLoading, teamMembers,
    deals, listings, notify,
    userName, isManager, staleCount,
  };

  const S = {
    wrap: { display:"flex",flexDirection:"column",height:"100vh",background:C.bg,fontFamily:C.sans,color:C.text,overflow:"hidden" },
    topbar: { display:"flex",alignItems:"center",background:C.surface,borderBottom:`1px solid ${C.border}`,height:52,flexShrink:0 },
    backBtn: { display:"flex",alignItems:"center",gap:7,padding:"0 18px",height:"100%",background:"none",border:"none",borderRight:`1px solid ${C.border}`,color:C.textSec,cursor:"pointer",fontSize:12,fontFamily:C.sans,transition:"color 0.15s" },
    brand: { display:"flex",alignItems:"center",gap:10,padding:"0 18px",borderRight:`1px solid ${C.border}`,flexShrink:0 },
    logoBox: { width:30,height:30,background:`linear-gradient(135deg,${C.gold},#9B7A2E)`,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 },
    tabs: { display:"flex",alignItems:"center",flex:1,height:"100%" },
    right: { display:"flex",alignItems:"center",gap:12,padding:"0 18px",flexShrink:0 },
    avatar: { width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.gold},#9B7A2E)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#000",border:`2px solid ${C.gold}40`,cursor:"pointer" },
    content: { flex:1,overflow:"hidden",display:"flex",flexDirection:"column" },
  };

  return (
    <div style={S.wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px;}
        input,select,textarea{font-family:'Outfit','Inter',sans-serif!important;}
        input::placeholder,textarea::placeholder{color:#374151;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
        .crm-tab:hover{color:#E2E8F0!important;}
        .crm-row:hover{background:#0D1525!important;}
        .crm-card:hover{border-color:rgba(212,168,67,0.3)!important;transform:translateY(-1px);}
        .crm-qa:hover{background:rgba(255,255,255,0.03)!important;}
      `}</style>

      {/* Topbar */}
      <div style={S.topbar}>
        <button type="button" onClick={onBack} style={S.backBtn}
          onMouseEnter={e=>e.currentTarget.style.color=C.white}
          onMouseLeave={e=>e.currentTarget.style.color=C.textSec}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Dashboard
        </button>

        <div style={S.brand}>
          <div style={S.logoBox}>⚡</div>
          <div>
            <div style={{fontSize:13,fontWeight:800,color:C.white,lineHeight:1}}>DXB <span style={{color:C.gold}}>CRM</span></div>
            {orgName&&<div style={{fontSize:9,color:C.textSec,lineHeight:1.3,marginTop:1}}>{orgName}</div>}
          </div>
        </div>

        <div style={S.tabs}>
          {TABS.map(t=>{
            const active = activeTab===t.key;
            return (
              <button key={t.key} type="button" className="crm-tab"
                onClick={()=>setActiveTab(t.key)}
                style={{
                  display:"flex",alignItems:"center",gap:6,
                  padding:"0 16px",height:"100%",
                  background:"none",border:"none",
                  borderBottom:active?`2px solid ${C.gold}`:"2px solid transparent",
                  color:active?C.gold:C.textSec,
                  fontSize:13,fontWeight:active?700:400,
                  cursor:"pointer",fontFamily:C.sans,
                  transition:"all 0.15s",whiteSpace:"nowrap",
                }}
              >
                <span style={{fontSize:13}}>{t.icon}</span>
                {t.label}
                {t.key==="leads"&&(myLeads?.length||0)>0&&(
                  <span style={{background:C.goldDim,color:C.gold,borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:700}}>
                    {(myLeads.length>999?"999+":myLeads.length)}
                  </span>
                )}
                {t.key==="leads"&&hotCount>0&&(
                  <span style={{background:C.redDim,color:C.red,borderRadius:10,padding:"1px 6px",fontSize:10,fontWeight:700}}>
                    {hotCount} 🔥
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={S.right}>
          {staleCount>0&&(
            <div style={{display:"flex",alignItems:"center",gap:5,background:C.yellowDim,border:`1px solid rgba(251,191,36,0.2)`,borderRadius:8,padding:"4px 10px"}}>
              <span style={{fontSize:11}}>⚠️</span>
              <span style={{fontSize:11,color:C.yellow,fontWeight:600}}>{staleCount} stale</span>
            </div>
          )}
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,fontWeight:600,color:C.white}}>{new Date().toLocaleDateString("en-AE",{weekday:"short",day:"numeric",month:"short"})}</div>
            <div style={{fontSize:9,color:C.textSec}}>Dubai, UAE</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:12,fontWeight:600,color:C.white}}>{userName}</div>
              <div style={{fontSize:9,color:C.gold,textTransform:"capitalize"}}>{role}</div>
            </div>
            <div style={S.avatar}>{userName.charAt(0).toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={S.content}>
        {activeTab==="overview"      && <CRMOverview      {...sharedProps} quote={quote} onNavigate={setActiveTab} />}
        {activeTab==="leads"         && <CRMLeads         {...sharedProps} />}
        {activeTab==="opportunities" && <CRMOpportunities {...sharedProps} />}
        {activeTab==="deals"         && <CRMDeals         {...sharedProps} />}
        {activeTab==="activities"    && <CRMActivities    {...sharedProps} />}
      </div>

      {/* Toast */}
      {toast&&(
        <div style={{
          position:"fixed",bottom:24,right:24,zIndex:9999,
          background:toast.type==="error"?C.redDim:C.greenDim,
          border:`1px solid ${toast.type==="error"?C.red:C.green}`,
          borderRadius:10,padding:"12px 18px",
          color:toast.type==="error"?C.red:C.green,
          fontSize:13,fontWeight:600,fontFamily:C.sans,
          boxShadow:"0 8px 32px rgba(0,0,0,0.5)",
          animation:"fadeUp 0.2s ease",
          display:"flex",alignItems:"center",gap:8,
        }}>
          {toast.type==="error"?"⚠️":"✅"} {toast.msg}
        </div>
      )}
    </div>
  );
}
