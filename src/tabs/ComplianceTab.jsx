/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — COMPLIANCE TAB
   RERA card management, WhatsApp template
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import SourceList from "../components/SourceList";

/* Broker registration is a regulatory obligation, so the tab should point at
   the regulator rather than paraphrase it. Dubai REST is the app agents
   actually use to check their own standing — naming it is more useful than any
   summary this tab could write. */
const COMPLIANCE_SOURCES = [
  { title: "Dubai Land Department — broker registration and RERA services",
    url: "https://dubailand.gov.ae/en/eservices/",
    publisher: "Dubai Land Department",
    note: "where a broker card is renewed and its status confirmed" },
  { title: "Dubai REST — official DLD app for brokers and owners",
    publisher: "Dubai Land Department",
    note: "check registration status directly; no public API exists for this tab to query" },
];

function ComplianceTab({ reraCard, setReraCard, reraCardLoading, setReraCardLoading, reraCardSaved, setReraCardSaved, waTemplate, setWaTemplate, firebaseUser, orgRole, userName }) {

            const isAgent   = orgRole === "agent";
            /* An agency OWNER is not the string "manager". These gates predate
               owners existing: signup used to record the founder as a manager, so
               comparing to that one word happened to work. Now that the founder is
               written as an owner — which is what they are — the literal check
               locked them out of their own agency. */
            const isManager = orgRole === "owner" || orgRole === "director" || orgRole === "manager";

            // RERA expiry calculation
            const reraExpiry    = reraCard.expiry ? new Date(reraCard.expiry) : null;
            const daysLeft      = reraExpiry ? Math.ceil((reraExpiry - new Date()) / (1000*60*60*24)) : null;
            const reraStatus    = daysLeft === null ? "none"
              : daysLeft <= 0   ? "expired"
              : daysLeft <= 30  ? "critical"
              : daysLeft <= 60  ? "warning"
              : "ok";
            const statusConfig = {
              none:     { color:T.textMuted, bg:"rgba(100,116,139,0.1)", border:"rgba(100,116,139,0.2)", label:"Not set",          icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
              expired:  { color:T.red,       bg:"rgba(239,68,68,0.08)",  border:"rgba(239,68,68,0.25)",  label:"EXPIRED",          icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
              critical: { color:"#F97316",   bg:"rgba(249,115,22,0.08)", border:"rgba(249,115,22,0.25)", label:"Renew immediately", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
              warning:  { color:"#F59E0B",   bg:"rgba(245,158,11,0.08)", border:"rgba(245,158,11,0.25)", label:"Renewal due soon",  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
              ok:       { color:T.green,     bg:"rgba(16,185,129,0.08)", border:"rgba(16,185,129,0.25)", label:"Valid",             icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
            };
            const sc = statusConfig[reraStatus];

            // WhatsApp templates
            const WA_TEMPLATES = {
              intro:    { label:"Introduction", text:(name,phone)=>`Hello${name?" "+name:""},\n\nI'm ${userName||"your agent"} from DXB Analytics. I'd love to help you find the perfect property in Dubai.\n\nAre you looking to buy or invest? Let me know your requirements and I'll send you matching properties right away.\n\nBest regards` },
              followup: { label:"Follow-Up",    text:(name)=>`Hi${name?" "+name:""},\n\nJust following up on our previous conversation about Dubai properties. I have some exciting new listings that match your criteria.\n\nWould you be available for a quick call this week?\n\nLooking forward to hearing from you.` },
              match:    { label:"Property Match",text:(name)=>`Hi${name?" "+name:""},\n\nGreat news! I've found a property that matches exactly what you're looking for.\n\nI'll send you the full details shortly. Would you like to schedule a viewing?\n\nBest regards` },
              meeting:  { label:"Meeting Request",text:(name)=>`Hello${name?" "+name:""},\n\nI'd like to schedule a meeting to discuss your property requirements in detail and show you some exclusive listings.\n\nAre you free for a 30-minute call this week? Please let me know your preferred time.\n\nThank you` },
              gv:       { label:"Golden Visa",  text:(name)=>`Hi${name?" "+name:""},\n\nDid you know that purchasing a property above AED 2 Million in Dubai qualifies you for a 10-year UAE Golden Visa?\n\nI have some excellent options in this range — would you like me to share the details?\n\nBest regards` },
            };

            // Save RERA card
            const saveReraCard = async () => {
              if (!reraCard.number.trim()) return;
              setReraCardLoading(true);
              try {
                await setDoc(doc(db, "users", firebaseUser.uid), { reraCard: { ...reraCard, updatedAt: new Date().toISOString() } }, { merge: true });
                setReraCardSaved(true);
                setTimeout(() => setReraCardSaved(false), 2000);
              } catch(e) { console.error(e); }
              setReraCardLoading(false);
            };

            return (<>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <div>
                  <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:T.white, margin:0 }}>Compliance</h1>
                  <p style={{ fontSize:12, color:T.textMuted, margin:"4px 0 0" }}>RERA card tracker · WhatsApp templates · Regulatory alerts</p>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignItems:"start" }}>

                {/* ── Left column ── */}
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                  {/* RERA Card Status */}
                  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                    <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="1.8" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white }}>RERA Broker Card</div>
                    </div>

                    {/* ── EMPTY STATE ────────────────────────────────────────
                        With no card saved the panel showed two blank inputs and
                        no status, which reads as "nothing to do here". This is
                        the one tab where an empty state is itself the warning:
                        an unregistered broker cannot legally market property in
                        Dubai, and the tracker only helps if it is filled in. */}
                    {reraStatus === "none" && !reraCardLoading && (
                      <div style={{ margin:"16px 18px 0", padding:"13px 15px", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.28)", borderRadius:10 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:"#F59E0B", marginBottom:4 }}>
                          No RERA card recorded
                        </div>
                        <div style={{ fontSize:10.5, color:T.textSecondary, lineHeight:1.65 }}>
                          Add your broker number and expiry below and this tab will warn you before it
                          lapses. Practising without a valid RERA broker registration is a regulatory
                          matter, not an administrative one — and an expiry that passes unnoticed is the
                          most common way it happens.
                        </div>
                      </div>
                    )}

                    {/* ── WHAT THIS TRACKER IS ───────────────────────────────
                        It stores what you type and counts down to the date you
                        entered. It does NOT check the number against RERA, and
                        cannot: there is no public verification endpoint. An agent
                        who reads a green "Valid" badge as confirmation that their
                        registration is in good standing has been misled by us,
                        so the panel says plainly whose word it is on. */}
                    {reraStatus !== "none" && (
                      <div style={{ margin:"16px 18px 0", fontSize:10, color:T.textMuted, lineHeight:1.6 }}>
                        Self-entered — this is your record of your own card, not a check against RERA.
                        Nothing here verifies the number is registered or in good standing; confirm
                        status with the Dubai Land Department or through the Dubai REST app.
                      </div>
                    )}

                    {/* Status banner */}
                    {reraStatus !== "none" && (
                      <div style={{ margin:"16px 18px 0", padding:"12px 14px", background:sc.bg, border:`1px solid ${sc.border}`, borderRadius:10, display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ color:sc.color }}>{sc.icon}</div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:700, color:sc.color }}>{sc.label}</div>
                          {daysLeft !== null && (
                            <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>
                              {daysLeft <= 0 ? "Your RERA card has expired — renew immediately" : `${daysLeft} days remaining until expiry`}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 }}>
                      {[
                        { key:"name",   label:"Full Name (as on card)", placeholder:"Ahmed Al-Mansouri" },
                        { key:"number", label:"RERA Card Number *",     placeholder:"BRN-XXXXX"         },
                      ].map(({key,label,placeholder})=>(
                        <div key={key}>
                          <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>{label}</div>
                          <input value={reraCard[key]||""} onChange={e=>setReraCard(r=>({...r,[key]:e.target.value}))}
                            placeholder={placeholder}
                            style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                        </div>
                      ))}

                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Card Expiry Date *</div>
                        <input type="date" value={reraCard.expiry||""} onChange={e=>setReraCard(r=>({...r,expiry:e.target.value}))}
                          style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box", cursor:"pointer" }}/>
                      </div>

                      <button type="button" onClick={saveReraCard} disabled={!reraCard.number||reraCardLoading}
                        style={{ padding:"10px 0", borderRadius:9, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:(!reraCard.number||reraCardLoading)?0.5:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                        {reraCardSaved ? (
                          <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Saved</>
                        ) : reraCardLoading ? "Saving..." : (
                          <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Card</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* RERA Renewal Timeline */}
                  {reraExpiry && (
                    <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 18px" }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Renewal Timeline</div>
                      {[
                        { days:60, label:"60-day warning",    color:"#F59E0B" },
                        { days:30, label:"30-day alert",      color:"#F97316" },
                        { days:0,  label:"Expiry date",       color:T.red     },
                      ].map(({days,label,color})=>{
                        const d = new Date(reraExpiry);
                        d.setDate(d.getDate() - days);
                        const passed = new Date() > d;
                        return (
                          <div key={days} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:passed?color:"rgba(255,255,255,0.1)", flexShrink:0 }}/>
                            <div style={{ flex:1, fontSize:11, color:passed?color:T.textMuted }}>{label}</div>
                            <div style={{ fontSize:11, color:T.textMuted }}>{d.toLocaleDateString("en-AE",{day:"2-digit",month:"short",year:"numeric"})}</div>
                          </div>
                        );
                      })}
                      <div style={{ display:"flex", gap:8, marginTop:12 }}>
                        <a href="https://government.ae/en/information-and-services/licensing-and-permits/real-estate-brokerage-licence" target="_blank" rel="noopener noreferrer"
                          style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"9px 0", borderRadius:8, border:"1px solid rgba(59,130,246,0.3)", background:"rgba(59,130,246,0.08)", color:"#3B82F6", fontSize:11, fontWeight:600, textDecoration:"none" }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          RERA Renewal Portal
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Right column ── */}
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

                  {/* WhatsApp Message Templates */}
                  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden" }}>
                    <div style={{ padding:"16px 18px", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white }}>WhatsApp Message Templates</div>
                    </div>
                    <div style={{ padding:"16px 18px" }}>
                      {/* Template selector */}
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
                        {Object.entries(WA_TEMPLATES).map(([key,tpl])=>(
                          <button key={key} type="button" onClick={()=>setWaTemplate(key)}
                            style={{ padding:"6px 12px", borderRadius:7, border:`1px solid ${waTemplate===key?"#25D366":T.border}`, background:waTemplate===key?"rgba(37,211,102,0.1)":"transparent", color:waTemplate===key?"#25D366":T.textMuted, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                            {tpl.label}
                          </button>
                        ))}
                      </div>

                      {/* Template preview */}
                      <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:10, padding:"14px", marginBottom:14, fontSize:12, color:T.textSecondary, lineHeight:1.7, whiteSpace:"pre-wrap", fontFamily:"'Outfit',sans-serif", minHeight:140 }}>
                        {WA_TEMPLATES[waTemplate]?.text("Client Name", "+971500000000")}
                      </div>

                      {/* Send button */}
                      <a href={`https://wa.me/?text=${encodeURIComponent(WA_TEMPLATES[waTemplate]?.text("",""))}`} target="_blank" rel="noopener noreferrer"
                        style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"10px 0", borderRadius:9, border:"1px solid rgba(37,211,102,0.4)", background:"rgba(37,211,102,0.08)", color:"#25D366", fontSize:12, fontWeight:700, textDecoration:"none", fontFamily:"'Outfit',sans-serif" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                        Open in WhatsApp
                      </a>
                    </div>
                  </div>

                  {/* Compliance Checklist */}
                  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 18px" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:12 }}>Agent Compliance Checklist</div>
                    {[
                      { label:"RERA Broker Card active",          done: reraStatus === "ok" || reraStatus === "warning"  },
                      { label:"Card expiry set in system",        done: !!reraCard.expiry                                },
                      { label:"Trakheesi permit for listings",    done: false                                             },
                      { label:"Form A signed before advertising", done: false                                             },
                      { label:"Form B signed on agency agreement",done: false                                             },
                      { label:"DLD registration up to date",      done: false                                             },
                    ].map(({label,done},i)=>(
                      <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:i<5?`1px solid ${T.border}`:"none" }}>
                        <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${done?T.green:T.border}`, background:done?"rgba(16,185,129,0.1)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          {done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <div style={{ fontSize:12, color:done?T.textPrimary:T.textMuted }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Dubai Compliance Links */}
                  <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 18px" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:12 }}>Official Regulatory Links</div>
                    {[
                      { label:"RERA — Real Estate Regulatory Agency",   url:"https://www.dubailand.gov.ae/en/eservices/real-estate-broker-registration/" },
                      { label:"DLD — Dubai Land Department",            url:"https://dubailand.gov.ae"                },
                      { label:"Trakheesi — Permit System",              url:"https://www.dubailand.gov.ae/en/eservices/trakheesi/" },
                      { label:"DTCM — Holiday Home Permits",            url:"https://dtcm.gov.ae"                     },
                      { label:"ICP — Visa & Golden Visa",               url:"https://icp.gov.ae"                      },
                    ].map(({label,url},i)=>(
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 0", borderBottom:i<4?`1px solid ${T.border}`:"none", textDecoration:"none" }}>
                        <div style={{ fontSize:11, color:T.textSecondary }}>{label}</div>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop:16, paddingTop:12, borderTop:`1px solid ${T.border}` }}>
                <SourceList sources={COMPLIANCE_SOURCES} />
              </div>
            </>);
}

export default ComplianceTab;
