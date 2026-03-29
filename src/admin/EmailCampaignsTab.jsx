import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, where, addDoc, updateDoc } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { T } from "../theme";
import emailjs from "@emailjs/browser";

function EmailCampaignsTab({ T, db, notify, adminUser, leads, leadsTotal, fetchLeads }) {
  const [campaigns, setCampaigns]       = React.useState([]);
  const [showCreate, setShowCreate]     = React.useState(false);
  const [sending, setSending]           = React.useState(false);
  const [sendProgress, setSendProgress] = React.useState(0);
  const [sendTotal, setSendTotal]       = React.useState(0);
  const [selectedCampaign, setSelectedCampaign] = React.useState(null);
  const [form, setForm] = React.useState({ name: "", subject: "", body: "", targetFilter: "all", targetCommunity: "", targetStatus: "", template: "custom" });

  const TEMPLATES = [
    { id: "followup", label: "Follow-up", subject: "Following up on your interest in {community}", body: "Dear {name},

I wanted to follow up on your interest in {community}.

Best regards,
The Address Holding Team" },
    { id: "golden_visa", label: "Golden Visa", subject: "You may qualify for a UAE Golden Visa", body: "Dear {name},

Based on your interest in {community}, you may qualify for a UAE Golden Visa.

Best regards,
The Address Holding Team" },
    { id: "market_update", label: "Market Update", subject: "Dubai Property Market Update — {community}", body: "Dear {name},

The Dubai property market continues to show strong growth in {community}.

Best regards,
The Address Holding Team" },
    { id: "new_launch", label: "New Launch", subject: "Exclusive New Launch — {community}", body: "Dear {name},

We have an exciting new project launch in {community}.

Best regards,
The Address Holding Team" },
    { id: "reengagement", label: "Re-engagement", subject: "We miss you — special offer inside", body: "Dear {name},

It\'s been a while since we connected regarding your property search in {community}.

Best regards,
The Address Holding Team" },
  ];

  React.useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, "campaigns"), orderBy("createdAt", "desc"), limit(50)));
        const list = []; snap.forEach(d => list.push({ id: d.id, ...d.data() })); setCampaigns(list);
      } catch(e) { console.error("Load campaigns:", e); }
    };
    load();
  }, []);

  const getTargetLeads = () => {
    let targets = (leads||[]).filter(l => l.email && l.email.includes("@"));
    if (form.targetFilter === "community" && form.targetCommunity) targets = targets.filter(l => l.community === form.targetCommunity);
    if (form.targetFilter === "status" && form.targetStatus) targets = targets.filter(l => (l.status||"New") === form.targetStatus);
    return targets;
  };

  const communities = [...new Set((leads||[]).filter(l=>l.community).map(l=>l.community))].sort();
  const targetLeads = getTargetLeads();
  const inputStyle = { width:"100%", padding:"10px 14px", background:T.bg, border:"1px solid rgba(212,168,67,0.15)", borderRadius:9, color:"#E2E8F0", fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" };

  const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

  const sendWithResend = async (to, subject, html) => {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "DXB Analytics <onboarding@resend.dev>", to, subject, html }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const sendCampaign = async () => {
    if (!form.name || !form.subject || !form.body) { notify("Fill in campaign name, subject and message"); return; }
    const targets = getTargetLeads();
    if (targets.length === 0) { notify("No leads match the filter with valid emails"); return; }
    setSending(true); setSendProgress(0); setSendTotal(targets.length);
    const campaignId = `camp_${Date.now()}`;
    const campaignDoc = { name: form.name, subject: form.subject, template: form.template, targetFilter: form.targetFilter, targetCommunity: form.targetCommunity, targetStatus: form.targetStatus, totalTargets: targets.length, sent: 0, failed: 0, status: "sending", createdAt: new Date().toISOString(), sentBy: adminUser?.email || "admin" };
    try { await setDoc(doc(db, "campaigns", campaignId), campaignDoc); } catch(e) {}
    let sent = 0; let failed = 0; const BATCH = 10;
    for (let i = 0; i < targets.length; i += BATCH) {
      const chunk = targets.slice(i, i + BATCH);
      await Promise.allSettled(chunk.map(async lead => {
        try {
          const bodyText = form.body.replace(/\{name\}/g, lead.name||"there").replace(/\{community\}/g, lead.community||"Dubai").replace(/\{project\}/g, lead.project||"your property");
          const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <div style="border-bottom:2px solid #D4A843;padding-bottom:12px;margin-bottom:20px">
              <h2 style="color:#D4A843;margin:0;font-size:20px">DXB Analytics</h2>
              <p style="color:#64748B;margin:4px 0 0;font-size:12px">The Address Holding · Dubai</p>
            </div>
            <div style="color:#1E293B;font-size:14px;line-height:1.7;white-space:pre-wrap">${bodyText}</div>
            <div style="border-top:1px solid #E2E8F0;margin-top:24px;padding-top:16px;color:#94A3B8;font-size:11px">
              DXB Analytics · The Address Holding · Dubai, UAE<br/>
              <a href="mailto:info@theaddressholding.ae" style="color:#D4A843">info@theaddressholding.ae</a>
            </div>
          </div>`;
          await sendWithResend(lead.email, form.subject, html);
          sent++;
        } catch(e) { failed++; }
      }));
      setSendProgress(Math.min(i + BATCH, targets.length));
      await new Promise(r => setTimeout(r, 200));
    }
    try { await setDoc(doc(db, "campaigns", campaignId), { ...campaignDoc, sent, failed, status: "completed", completedAt: new Date().toISOString() }, { merge: true }); } catch(e) {}
    setSending(false); notify(`✅ Campaign sent — ${sent} delivered, ${failed} failed`);
    setShowCreate(false); setForm({ name:"", subject:"", body:"", targetFilter:"all", targetCommunity:"", targetStatus:"", template:"custom" });
    try { const snap = await getDocs(query(collection(db, "campaigns"), orderBy("createdAt", "desc"), limit(50))); const list = []; snap.forEach(d => list.push({ id: d.id, ...d.data() })); setCampaigns(list); } catch(e) {}
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:800, color:"#FFFFFF", margin:0 }}>Email Campaigns</h2>
          <p style={{ fontSize:13, color:T.textMuted, margin:"4px 0 0" }}>{(leads||[]).filter(l=>l.email).length.toLocaleString()} leads with emails · {(leadsTotal||0).toLocaleString()} total</p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:`linear-gradient(135deg, ${T.gold}, #B8912F)`, color:T.bg, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>+ New Campaign</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
        {[{label:"Total Campaigns",value:campaigns.length,color:T.gold},{label:"Emails Sent",value:campaigns.reduce((s,c)=>s+(c.sent||0),0).toLocaleString(),color:T.green},{label:"Leads with Email",value:(leads||[]).filter(l=>l.email).length.toLocaleString(),color:T.blue}].map((item,i)=>(
          <div key={i} style={{ padding:"18px 20px", background:T.surface, borderRadius:14, border:`1px solid ${T.border}` }}>
            <div style={{ fontSize:10, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>{item.label}</div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:900, color:item.color }}>{item.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.border}`, overflow:"hidden" }}>
        <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}` }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.gold, textTransform:"uppercase", letterSpacing:1 }}>Campaign History</div>
        </div>
        {campaigns.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📧</div>
            <div style={{ fontSize:15, fontWeight:700, color:T.white, marginBottom:6 }}>No campaigns yet</div>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ background:T.surfaceAlt }}>{["Campaign","Target","Sent","Status","Date"].map(h=><th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase" }}>{h}</th>)}</tr></thead>
            <tbody>{campaigns.map((c,i)=>(
              <tr key={c.id} style={{ borderTop:`1px solid ${T.border}`, cursor:"pointer" }} onClick={()=>setSelectedCampaign(c)}>
                <td style={{ padding:"12px 16px" }}><div style={{ fontSize:13, fontWeight:600, color:T.white }}>{c.name}</div><div style={{ fontSize:11, color:T.textMuted }}>{c.subject}</div></td>
                <td style={{ padding:"12px 16px", fontSize:12, color:T.textSecondary }}>{c.targetFilter==="community"?c.targetCommunity:c.targetFilter==="status"?c.targetStatus:"All leads"}</td>
                <td style={{ padding:"12px 16px" }}><span style={{ fontSize:13, fontWeight:700, color:T.green }}>{(c.sent||0).toLocaleString()}</span></td>
                <td style={{ padding:"12px 16px" }}><span style={{ fontSize:11, padding:"3px 8px", borderRadius:5, fontWeight:700, background:c.status==="completed"?"rgba(16,185,129,0.1)":"rgba(59,130,246,0.1)", color:c.status==="completed"?T.green:T.blue }}>{c.status==="completed"?"✓ Sent":"⟳ Sending"}</span></td>
                <td style={{ padding:"12px 16px", fontSize:11, color:T.textMuted }}>{c.createdAt?new Date(c.createdAt).toLocaleDateString("en-AE",{day:"2-digit",month:"short"}):"—"}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
      {showCreate && (
        <div style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.92)", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)", padding:20 }} onClick={()=>{ if(!sending) setShowCreate(false); }}>
          <div style={{ background:T.surface, border:"1px solid rgba(212,168,67,0.3)", borderRadius:16, width:"100%", maxWidth:620, maxHeight:"92vh", overflowY:"auto", padding:28 }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:20 }}>
              <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:700, color:T.gold }}>New Campaign</h3>
              {!sending && <button type="button" onClick={()=>setShowCreate(false)} style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:22 }}>×</button>}
            </div>
            <div style={{ marginBottom:14 }}><label style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:6 }}>Campaign Name *</label><input type="text" placeholder="e.g. Arabian Ranches Follow-up" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={inputStyle} /></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
              <div><label style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:6 }}>Target</label><select value={form.targetFilter} onChange={e=>setForm(p=>({...p,targetFilter:e.target.value,targetCommunity:"",targetStatus:""}))} style={{...inputStyle,cursor:"pointer"}}><option value="all">All leads with email</option><option value="community">By Community</option><option value="status">By Status</option></select></div>
              <div>{form.targetFilter==="community"&&<><label style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:6 }}>Community</label><select value={form.targetCommunity} onChange={e=>setForm(p=>({...p,targetCommunity:e.target.value}))} style={{...inputStyle,cursor:"pointer"}}><option value="">Select...</option>{communities.map(c=><option key={c} value={c}>{c}</option>)}</select></>}
              {form.targetFilter==="status"&&<><label style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:6 }}>Status</label><select value={form.targetStatus} onChange={e=>setForm(p=>({...p,targetStatus:e.target.value}))} style={{...inputStyle,cursor:"pointer"}}><option value="">Select...</option>{["New","Contacted","Qualified","Viewing Scheduled","Offer Made","Converted","Dormant","Lost"].map(s=><option key={s} value={s}>{s}</option>)}</select></>}
              {form.targetFilter==="all"&&<div style={{ padding:"12px", background:"rgba(16,185,129,0.06)", borderRadius:8, border:"1px solid rgba(16,185,129,0.2)", marginTop:20 }}><div style={{ fontSize:12, fontWeight:700, color:T.green }}>{targetLeads.length.toLocaleString()} leads targeted</div></div>}</div>
            </div>
            <div style={{ marginBottom:14 }}><label style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:8 }}>Templates</label><div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{TEMPLATES.map(t=><button key={t.id} type="button" onClick={()=>setForm(p=>({...p,template:t.id,subject:t.subject,body:t.body}))} style={{ fontSize:11, padding:"5px 10px", borderRadius:7, border:`1px solid ${form.template===t.id?T.gold:T.border}`, background:form.template===t.id?"rgba(212,168,67,0.1)":T.surfaceAlt, color:form.template===t.id?T.gold:T.textSecondary, cursor:"pointer" }}>{t.label}</button>)}</div></div>
            <div style={{ marginBottom:14 }}><label style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:6 }}>Subject *</label><input type="text" placeholder="Subject..." value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))} style={inputStyle} /></div>
            <div style={{ marginBottom:20 }}><label style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:6 }}>Message *</label><textarea rows={6} value={form.body} onChange={e=>setForm(p=>({...p,body:e.target.value}))} style={{...inputStyle,resize:"vertical"}} /></div>
            {sending && <div style={{ marginBottom:16 }}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}><span style={{ fontSize:11, color:T.textMuted }}>Sending...</span><span style={{ fontSize:11, fontWeight:700, color:T.gold }}>{sendProgress}/{sendTotal}</span></div><div style={{ height:6, borderRadius:3, background:T.border }}><div style={{ height:"100%", borderRadius:3, background:`linear-gradient(90deg,${T.gold},${T.green})`, width:`${sendTotal>0?(sendProgress/sendTotal)*100:0}%`, transition:"width 0.3s" }} /></div></div>}
            <div style={{ display:"flex", gap:12 }}>
              <button type="button" onClick={()=>setShowCreate(false)} disabled={sending} style={{ flex:1, padding:"12px", borderRadius:10, border:`1px solid ${T.border}`, background:"transparent", color:T.textSecondary, fontSize:13, fontWeight:600, cursor:sending?"not-allowed":"pointer", fontFamily:"'Outfit',sans-serif" }}>Cancel</button>
              <button type="button" onClick={sendCampaign} disabled={sending||!form.name||!form.subject||!form.body||targetLeads.length===0} style={{ flex:2, padding:"12px", borderRadius:10, border:"none", background:(sending||!form.name)?T.surfaceAlt:`linear-gradient(135deg,${T.gold},#B8912F)`, color:(sending||!form.name)?T.textMuted:T.bg, fontSize:14, fontWeight:700, cursor:(sending||!form.name)?"not-allowed":"pointer", fontFamily:"'Outfit',sans-serif" }}>{sending?`Sending ${sendProgress}/${sendTotal}...`:`🚀 Send to ${targetLeads.length.toLocaleString()} leads`}</button>
            </div>
          </div>
        </div>
      )}
      {selectedCampaign && (
        <div style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.85)", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={()=>setSelectedCampaign(null)}>
          <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, width:"95%", maxWidth:440, padding:24 }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}><h3 style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:700, color:T.gold }}>{selectedCampaign.name}</h3><button type="button" onClick={()=>setSelectedCampaign(null)} style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:20 }}>×</button></div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[["Sent",(selectedCampaign.sent||0).toLocaleString(),T.green],["Failed",selectedCampaign.failed||0,T.red],["Target",selectedCampaign.targetFilter==="community"?selectedCampaign.targetCommunity:"All",T.blue],["Template",selectedCampaign.template||"custom",T.gold]].map(([l,v,c],i)=>(
                <div key={i} style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}><div style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", marginBottom:3 }}>{l}</div><div style={{ fontSize:15, fontWeight:700, color:c }}>{v}</div></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===============================================================
   DXB ANALYTICS — ADMIN PANEL
   Matching dashboard design DNA: sidebar nav, KPI cards, sections
   =============================================================== */

/* ─── RESEND EMAIL HELPER ─── */
const RESEND_KEY = import.meta.env.VITE_RESEND_API_KEY;
const sendResend = async (to, subject, bodyText) => {
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
    <div style="border-bottom:2px solid #D4A843;padding-bottom:12px;margin-bottom:20px">
      <h2 style="color:#D4A843;margin:0;font-size:18px">DXB Analytics</h2>
      <p style="color:#64748B;margin:4px 0 0;font-size:11px">The Address Holding · Dubai, UAE</p>
    </div>
    <div style="color:#1E293B;font-size:14px;line-height:1.7;white-space:pre-wrap">${bodyText}</div>
    <div style="border-top:1px solid #E2E8F0;margin-top:24px;padding-top:12px;color:#94A3B8;font-size:11px">
      DXB Analytics · <a href="mailto:info@theaddressholding.ae" style="color:#D4A843">info@theaddressholding.ae</a>
    </div>
  </div>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "DXB Analytics <onboarding@resend.dev>", to, subject, html }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

/* ─── THEME (exact dashboard match) ─── */
// S16: T theme imported from src/theme.js — see import above

/* ─── S20: MARKET INTELLIGENCE TAB ──────────────────────────────────────────
   The admin's Bloomberg Terminal view:
   - All data feed statuses (live from Firestore)
   - Latest DLD transaction anomalies (adminAlerts)
   - EIBOR trend last 30 days (eiborHistory)
   - Top community by transaction volume (communityData)
   - Developer launch alerts (new DLD project registrations)
────────────────────────────────────────────────────────────────────────── */

export default EmailCampaignsTab;
