/* eslint-disable */
/* MY LEADS TAB — Lead capture, scoring, follow-ups */

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";
import { cleanPhone } from "../utils/helpers";
import { GOLDEN_VISA_THRESHOLD } from "../utils/constants";
import Papa from "papaparse";

function MyLeadsTab({
  myLeads, liveLeads, orgRole, userRole, orgId, orgName, listings,
  /* search/filters/sort */
  leadSearch, setLeadSearch,
  leadStatusFilter, setLeadStatusFilter,
  leadTypeFilter, setLeadTypeFilter,
  leadSourceFilter, setLeadSourceFilter,
  leadBudgetFilter, setLeadBudgetFilter,
  leadNatFilter, setLeadNatFilter,
  leadTagFilter, setLeadTagFilter,
  leadSortBy, setLeadSortBy,
  /* drawer & selected */
  selectedLead, setSelectedLead,
  leadDrawerTab, setLeadDrawerTab,
  /* add lead form */
  leadShowAdd, setLeadShowAdd,
  leadAddName, setLeadAddName,
  leadAddPhone, setLeadAddPhone,
  leadAddEmail, setLeadAddEmail,
  leadAddNat, setLeadAddNat,
  leadAddLang, setLeadAddLang,
  leadAddSource, setLeadAddSource,
  leadAddType, setLeadAddType,
  leadAddBudget, setLeadAddBudget,
  leadAddBedrooms, setLeadAddBedrooms,
  leadAddPurpose, setLeadAddPurpose,
  leadAddTimeline, setLeadAddTimeline,
  leadAddStatus, setLeadAddStatus,
  leadAddComm, setLeadAddComm,
  leadAddRef, setLeadAddRef,
  leadAddFollowUp, setLeadAddFollowUp,
  leadAddSaving, setLeadAddSaving,
  /* notes & tasks */
  noteText, setNoteText,
  noteType, setNoteType,
  noteLoading, setNoteLoading,
  taskText, setTaskText,
  taskDue, setTaskDue,
  /* modals */
  showMLAnalytics, setShowMLAnalytics,
  showMLTemplates, setShowMLTemplates,
  showQuickCapture, setShowQuickCapture,
}) {

            const mlIsAgent      = orgRole === "agent";
            const mlIsManager    = orgRole === "manager";
            const mlIsSuperAdmin = userRole === "admin" || userRole === "superAdmin";
            const mlCanSee       = mlIsAgent || mlIsManager || mlIsSuperAdmin;
            const mlAllLeads     = mlIsSuperAdmin ? (liveLeads||[])
              : (mlIsAgent||mlIsManager) ? (myLeads||[])
              : (liveLeads||[]).filter(l => !auth.currentUser?.uid || l.userId === auth.currentUser.uid);

            /* ── Status config ── */
            const ML_ST = {
              "New":       {color:"#3B82F6",bg:"rgba(59,130,246,0.12)",label:"New"},
              "Contacted": {color:"#F59E0B",bg:"rgba(245,158,11,0.12)",label:"Contacted"},
              "Viewing":   {color:"#8B5CF6",bg:"rgba(139,92,246,0.12)",label:"Viewing"},
              "Offer":     {color:"#14B8A6",bg:"rgba(20,184,166,0.12)",label:"Offer"},
              "Won":       {color:"#10B981",bg:"rgba(16,185,129,0.12)",label:"Won"},
              "Lost":      {color:"#EF4444",bg:"rgba(239,68,68,0.12)",label:"Lost"},
            };
            /* ── Source colors ── */
            const ML_SRC = {
              "Property Finder":"#00C08B","Bayut":"#FF6B35","Dubizzle":"#E8003D",
              "Meta/Facebook":"#1877F2","Instagram":"#E1306C","WhatsApp":"#25D366",
              "Google Ads":"#4285F4","Referral":"#8B5CF6","Website":"#14B8A6",
              "Cold Call":"#F59E0B","Manual":"#94A3B8",
            };
            const ML_NATS = ["Indian","British","Russian","Chinese","French","Pakistani","Saudi","Egyptian","German","American","Italian","Canadian","Australian","Japanese","Korean","Emirati","Filipino","Lebanese","Jordanian","Other"];
            const ML_LANGS = ["Arabic","English","Russian","Mandarin","French","Hindi","Urdu","Filipino","German","Italian","Japanese","Korean"];
            const ML_TAGS_OPTIONS = ["VIP","Cash Buyer","Urgent","Investor","GCC National","Mortgage","Off-Plan","Ready","End User","Flipper","Developer Contact","Returning Client"];
            const ML_BEST_TIME = {
              "Property Finder":"Evening 6-9pm","Bayut":"Evening 6-9pm","Dubizzle":"Evening 6-8pm",
              "WhatsApp":"Morning 9-11am","Instagram":"Afternoon 2-5pm","Meta/Facebook":"Afternoon 2-5pm",
              "Google Ads":"Morning 10am-12pm","Referral":"Anytime","Cold Call":"Morning 9-11am",
              "Website":"Morning 9-11am","Manual":"Anytime",
            };
            const ML_WA_TEMPLATES = [
              {label:"First Contact",   body:"Hello {name}, I came across your property enquiry. I am {agent} from The Address Holding. We have excellent options matching your requirements in Dubai. When would be a good time to connect?"},
              {label:"Follow Up",       body:"Hello {name}, just following up on your property search. We have new listings matching your budget. Would you like to schedule a viewing this week?"},
              {label:"Viewing Confirm", body:"Hello {name}, confirming your property viewing scheduled for {date}. Please let me know if you need to reschedule. Looking forward to meeting you!"},
              {label:"Offer Made",      body:"Hello {name}, great news! We have submitted your offer. Our team is working to get you the best deal. I will update you as soon as we hear back."},
              {label:"Golden Visa",     body:"Hello {name}, based on your budget you qualify for UAE Golden Visa (AED 2M+ investment). This gives you 10-year residency. Shall I send you more details?"},
              {label:"Market Update",   body:"Hello {name}, quick update — prices in your preferred area have moved. I have great options within your budget. Shall we connect?"},
            ];
            const ML_EMAIL_TEMPLATES = [
              {label:"Introduction", subject:"Property Investment Opportunities in Dubai", body:"Dear {name},\n\nThank you for your interest in Dubai real estate. I am {agent} from The Address Holding.\n\nI have identified several properties matching your criteria and would love to schedule a call.\n\nBest regards,\n{agent}"},
              {label:"Property Match", subject:"Properties Matching Your Requirements", body:"Dear {name},\n\nI have shortlisted properties matching:\n- Budget: AED {budget}\n- Area: {community}\n- Type: {type}\n\nAvailable for a viewing at your convenience.\n\nBest regards,\n{agent}"},
              {label:"Follow Up", subject:"Following Up - Your Dubai Property Search", body:"Dear {name},\n\nFollowing up on your property enquiry. The Dubai market is moving quickly.\n\nShall we schedule a call this week?\n\nBest regards,\n{agent}"},
            ];

            /* ── Helpers ── */
            const clnPhone = (p) => { if(!p) return ""; let o=""; for(let i=0;i<p.length;i++){const c=p.charCodeAt(i);if(c>=48&&c<=57)o+=p[i];} return o; };
            const fmtB = (b) => { const n=parseFloat(b||0); if(n===0) return "—"; if(n>=1000000) return "AED "+(n*0.000001).toFixed(1)+"M"; return "AED "+n.toLocaleString(); };
            const escCSV = (v) => { const s=String(v==null?"":v); return '"'+s.replace(/"/g,'""')+'"'; };

            /* ── AI Score (6-factor engine) ── */
            function mlScore(l) {
              let s=0;
              const b=parseFloat(l.budget||0);
              if(l.phone&&l.email) s+=25; else if(l.phone||l.email) s+=10;
              if(b>=5000000) s+=20; else if(b>=GOLDEN_VISA_THRESHOLD) s+=15; else if(b>=1000000) s+=10;
              const d=(Date.now()-new Date(l.createdAt||Date.now()).getTime())*0.000000011574;
              if(d<1) s+=20; else if(d<3) s+=15; else if(d<7) s+=10;
              const n=(l.notes_log||[]).length; if(n>=3) s+=10; else if(n>=1) s+=5;
              if(l.timeline==="Immediate") s+=15; else if(l.timeline==="1-3 months") s+=10;
              if(l.nationality) s+=5;
              const score = Math.min(100, s);
              return {score, color:score>=70?"#10B981":score>=40?"#D4A843":"#EF4444", label:score>=70?"Hot":score>=40?"Warm":"Cold"};
            }

            /* ── Duplicate check ── */
            function mlIsDuplicate(phone) {
              if(!phone) return false;
              const clean = clnPhone(phone);
              return mlAllLeads.some(l => clnPhone(l.phone) === clean);
            }

            /* ── Filtered & sorted leads ── */
            const mlFiltered = (() => {
              let a = mlAllLeads;
              if(leadStatusFilter!=="all") a=a.filter(l=>(l.status||"New")===leadStatusFilter);
              if(leadSourceFilter!=="all") a=a.filter(l=>l.source===leadSourceFilter);
              if(leadNatFilter!=="all") a=a.filter(l=>(l.nationality||"")===leadNatFilter);
              if(leadBudgetFilter!=="all") a=a.filter(l=>{
                const b=parseFloat(l.budget||0);
                if(leadBudgetFilter==="under1m") return b<1000000;
                if(leadBudgetFilter==="1to3m") return b>=1000000&&b<3000000;
                if(leadBudgetFilter==="3to5m") return b>=3000000&&b<5000000;
                if(leadBudgetFilter==="5to10m") return b>=5000000&&b<10000000;
                if(leadBudgetFilter==="above10m") return b>=10000000;
                return true;
              });
              if(leadTypeFilter!=="all") a=a.filter(l=>(l.type||"Buy")===leadTypeFilter);
              if(leadTagFilter!=="all") a=a.filter(l=>(l.timeline||"")===leadTagFilter);
              if(leadSearch.trim()){
                const q=leadSearch.trim().toLowerCase();
                a=a.filter(l=>(l.name||"").toLowerCase().includes(q)||(l.phone||"").includes(q)||(l.email||"").toLowerCase().includes(q)||(l.community||"").toLowerCase().includes(q));
              }
              if(leadSortBy==="score") a=[...a].sort((a,b)=>mlScore(b).score-mlScore(a).score);
              else if(leadSortBy==="budget") a=[...a].sort((a,b)=>parseFloat(b.budget||0)-parseFloat(a.budget||0));
              else if(leadSortBy==="name") a=[...a].sort((a,b)=>(a.name||"").localeCompare(b.name||""));
              else a=[...a].sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
              return a;
            })();

            /* ── KPIs ── */
            const mlTotalVal  = mlAllLeads.reduce((s,l)=>s+parseFloat(l.budget||0),0);
            const mlNewToday  = mlAllLeads.filter(l=>{const d=new Date(l.createdAt||0),n=new Date();return d.getDate()===n.getDate()&&d.getMonth()===n.getMonth();}).length;
            const mlWon       = mlAllLeads.filter(l=>l.status==="Won");
            const mlHot       = mlAllLeads.filter(l=>mlScore(l).score>=70&&l.status!=="Won"&&l.status!=="Lost");
            const mlStale     = mlAllLeads.filter(l=>{
              if(l.status==="Won"||l.status==="Lost") return false;
              return (Date.now()-new Date(l.updatedAt||l.createdAt||Date.now()).getTime())*0.000000011574>7;
            });

            /* ── Source analytics ── */
            const mlSrcStats = (() => {
              const stats={};
              mlAllLeads.forEach(l=>{const src=l.source||"Manual";if(!stats[src])stats[src]={total:0,won:0};stats[src].total++;if(l.status==="Won")stats[src].won++;});
              return Object.entries(stats).map(([src,d])=>({src,total:d.total,won:d.won,rate:d.total>0?Math.round(d.won*100/d.total):0})).sort((a,b)=>b.total-a.total);
            })();

            /* ── Save lead ── */
            async function mlSave() {
              if(!leadAddName||!leadAddPhone) return;
              if(mlIsDuplicate(leadAddPhone)){if(!window.confirm("A lead with this phone already exists. Add anyway?")) return;}
              setLeadAddSaving(true);
              try {
                await addDoc(collection(db,"leads"),{
                  name:leadAddName,phone:leadAddPhone,email:leadAddEmail,
                  budget:parseFloat(leadAddBudget)||0,source:leadAddSource,
                  status:leadAddStatus,type:leadAddType,community:leadAddComm,
                  nationality:leadAddNat||"",language:leadAddLang||"",
                  timeline:leadAddTimeline||"",purpose:leadAddPurpose||"",
                  bedrooms:leadAddBedrooms||"",referredBy:leadAddRef||"",
                  followUpDate:leadAddFollowUp||"",tags:[],
                  userId:auth.currentUser?.uid||"",assignedTo:auth.currentUser?.uid||"",
                  orgId:orgId||"",createdAt:new Date().toISOString(),
                  updatedAt:new Date().toISOString(),
                  notes_log:[{text:"Lead created",type:"Created",by:auth.currentUser?.email||"",at:new Date().toISOString()}],
                });
                setLeadAddName("");setLeadAddPhone("");setLeadAddEmail("");
                setLeadAddBudget("");setLeadAddComm("");setLeadAddNat("");
                setLeadAddLang("");setLeadAddTimeline("");setLeadAddPurpose("");
                setLeadAddBedrooms("");setLeadAddRef("");setLeadAddFollowUp("");
                setLeadAddSource("Manual");setLeadAddStatus("New");setLeadAddType("Buy");
                setLeadShowAdd(false);
              } catch(e){console.error(e);}
              setLeadAddSaving(false);
            }

            /* ── CSV Import ── */
            async function mlImportCsv(file) {
              if (!file) return;
              Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                  const rows = results.data;
                  if (!rows.length) { alert("CSV is empty"); return; }
                  const errors = [];
                  rows.forEach((r, i) => {
                    if (!r.name && !r.Name) errors.push("Row " + (i + 2) + ": missing name");
                    if (!r.phone && !r.Phone && !r.email && !r.Email) errors.push("Row " + (i + 2) + ": missing phone or email");
                  });
                  if (errors.length > 0) {
                    alert("Validation failed:\n" + errors.slice(0, 10).join("\n") + (errors.length > 10 ? "\n...and " + (errors.length - 10) + " more" : ""));
                    return;
                  }
                  if (!window.confirm("Import " + rows.length + " leads into your agency CRM?")) return;
                  let created = 0, duplicates = 0, failed = 0;
                  const now = new Date().toISOString();
                  for (const r of rows) {
                    try {
                      const phone = (r.phone || r.Phone || "").toString().trim();
                      const email = (r.email || r.Email || "").toString().trim();
                      if (phone && mlIsDuplicate(phone)) { duplicates++; continue; }
                      await addDoc(collection(db, "leads"), {
                        name: (r.name || r.Name || "").toString().trim(),
                        phone: phone,
                        email: email,
                        budget: parseFloat(r.budget || r.Budget || 0) || 0,
                        source: (r.source || r.Source || "CSV Import").toString().trim(),
                        status: (r.status || r.Status || "New").toString().trim(),
                        type: (r.type || r.Type || "Buy").toString().trim(),
                        community: (r.community || r.Community || "").toString().trim(),
                        nationality: (r.nationality || r.Nationality || "").toString().trim(),
                        language: (r.language || r.Language || "").toString().trim(),
                        timeline: (r.timeline || r.Timeline || "").toString().trim(),
                        purpose: (r.purpose || r.Purpose || "").toString().trim(),
                        bedrooms: (r.bedrooms || r.Bedrooms || "").toString().trim(),
                        referredBy: (r.referredBy || r.ReferredBy || "").toString().trim(),
                        followUpDate: (r.followUpDate || r.FollowUpDate || "").toString().trim(),
                        tags: [],
                        userId: auth.currentUser?.uid || "",
                        assignedTo: auth.currentUser?.uid || "",
                        orgId: orgId || "",
                        createdAt: now,
                        updatedAt: now,
                        notes_log: [{ text: "Imported from CSV", type: "Created", by: auth.currentUser?.email || "", at: now }],
                      });
                      created++;
                    } catch (e) {
                      console.error("Row import failed:", r, e);
                      failed++;
                    }
                  }
                  alert("Import complete!\n\n" +
                        "Created: " + created + "\n" +
                        "Duplicates skipped: " + duplicates + "\n" +
                        (failed > 0 ? "Failed: " + failed : ""));
                },
                error: (err) => alert("CSV parse error: " + err.message),
              });
            }

            /* ── Add note/activity ── */
            async function mlNote(id) {
              if(!noteText.trim()) return;
              setNoteLoading(true);
              try {
                const entry={text:noteText,type:noteType,by:auth.currentUser?.email||"",at:new Date().toISOString()};
                await updateDoc(doc(db,"leads",id),{notes_log:arrayUnion(entry),updatedAt:new Date().toISOString()});
                setNoteText("");
                if(selectedLead&&selectedLead.id===id) setSelectedLead({...selectedLead,notes_log:[...(selectedLead.notes_log||[]),entry]});
              } catch(e){console.error(e);}
              setNoteLoading(false);
            }

            /* ── Change status ── */
            async function mlStatus(id,st) {
              try {
                const entry={text:"Status changed to "+st,type:"Status Change",by:auth.currentUser?.email||"agent",at:new Date().toISOString()};
                const upd={status:st,updatedAt:new Date().toISOString(),notes_log:arrayUnion(entry)};
                if(st==="Won") upd.wonAt=new Date().toISOString();
                await updateDoc(doc(db,"leads",id),upd);
                if(selectedLead&&selectedLead.id===id) setSelectedLead({...selectedLead,status:st,notes_log:[...(selectedLead.notes_log||[]),entry]});
              } catch(e){console.error(e);}
            }

            /* ── Toggle tag ── */
            async function mlToggleTag(id,tag,currentTags) {
              const tags=currentTags||[];
              const newTags=tags.includes(tag)?tags.filter(t=>t!==tag):[...tags,tag];
              try {
                await updateDoc(doc(db,"leads",id),{tags:newTags,updatedAt:new Date().toISOString()});
                if(selectedLead&&selectedLead.id===id) setSelectedLead({...selectedLead,tags:newTags});
              } catch(e){console.error(e);}
            }

            /* ── Save deal value ── */
            async function mlSaveDeal(id,val) {
              try {
                await updateDoc(doc(db,"leads",id),{dealValue:parseFloat(val)||0,updatedAt:new Date().toISOString()});
                if(selectedLead&&selectedLead.id===id) setSelectedLead({...selectedLead,dealValue:parseFloat(val)||0});
              } catch(e){console.error(e);}
            }

            /* ── Export CSV ── */
            function mlExportCSV() {
              const h=["Name","Phone","Email","Budget","Status","Source","Nationality","Language","Timeline","Purpose","Bedrooms","Community","Type","Tags","Referred By","Follow Up","AI Score","Created","Deal Value"];
              const r=mlFiltered.map(l=>[
                l.name||"",l.phone||"",l.email||"",l.budget||"",l.status||"New",
                l.source||"",l.nationality||"",l.language||"",l.timeline||"",
                l.purpose||"",l.bedrooms||"",l.community||"",l.type||"Buy",
                (l.tags||[]).join("; "),l.referredBy||"",l.followUpDate||"",
                mlScore(l).score,
                l.createdAt?new Date(l.createdAt).toLocaleDateString("en-GB"):"",
                l.dealValue||"",
              ].map(v=>escCSV(v)));
              const csv=[h.join(","),...r.map(x=>x.join(","))].join(String.fromCharCode(10));
              const b=new Blob([csv],{type:"text/csv"});
              const u=URL.createObjectURL(b);
              const a=document.createElement("a");
              a.href=u;a.download="DXB_Leads_"+new Date().toISOString().slice(0,10)+".csv";a.click();URL.revokeObjectURL(u);
            }

            /* ── Bulk WhatsApp ── */
            function mlBulkWA() {
              const withPhone=mlFiltered.filter(l=>l.phone);
              if(withPhone.length===0){alert("No leads with phone numbers in current filter.");return;}
              setShowMLTemplates(true);
            }
            function mlSendWATemplate(tmpl) {
              const withPhone=mlFiltered.filter(l=>l.phone).slice(0,1);
              const agent=auth.currentUser?.email?.split("@")[0]||"Agent";
              const lead=withPhone[0];
              if(!lead) return;
              const msg=tmpl.body.replace("{name}",lead.name||"").replace("{agent}",agent).replace("{budget}",fmtB(lead.budget)).replace("{community}",lead.community||"Dubai").replace("{type}",lead.type||"property").replace("{date}","the scheduled time");
              window.open("https://wa.me/"+clnPhone(lead.phone)+"?text="+encodeURIComponent(msg),"_blank");
              setShowMLTemplates(false);
            }

            if(!mlCanSee) return (
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:400,gap:16}}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                <div style={{fontSize:16,fontWeight:700,color:T.textPrimary}}>Leads not enabled for your role</div>
                <div style={{fontSize:12,color:T.textMuted}}>Contact your agency manager</div>
              </div>
            );

            return (
              <div style={{padding:"0 0 60px"}}>

                {/* ── HEADER ── */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
                  <div>
                    <h1 style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:900,color:T.white,margin:0}}>
                      {orgName ? orgName + " — " : "My Agency — "}{mlIsManager ? "Team Leads" : "My Leads"}
                    </h1>
                    <p style={{fontSize:12,color:T.textMuted,margin:"3px 0 0"}}>
                      {mlFiltered.length} of {mlAllLeads.length} leads · AI scored · WhatsApp ready
                    </p>
                  </div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                    <button type="button" onClick={()=>setShowMLAnalytics(v=>!v)}
                      style={{padding:"7px 12px",borderRadius:7,border:"1px solid "+T.border,background:showMLAnalytics?"rgba(212,168,67,0.1)":"transparent",color:showMLAnalytics?"#D4A843":T.textSecondary,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                      Analytics
                    </button>
                    <button type="button" onClick={mlExportCSV}
                      style={{padding:"7px 12px",borderRadius:7,border:"1px solid "+T.border,background:"transparent",color:T.textSecondary,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                      Export CSV
                    </button>
                    <button type="button" onClick={mlBulkWA}
                      style={{padding:"7px 12px",borderRadius:7,border:"1px solid rgba(37,211,102,0.3)",background:"rgba(37,211,102,0.08)",color:"#25D366",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                      Bulk WA
                    </button>
                    <button type="button" onClick={()=>setShowQuickCapture(true)}
                      style={{padding:"8px 16px",borderRadius:8,border:"none",background:"linear-gradient(135deg,#D4A843,#B8902E)",color:"#0A0E1A",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                      + Quick Capture
                    </button>
                  </div>
                </div>

                {/* ── 5 KPI CARDS ── */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:9,marginBottom:14}}>
                  {[
                    {label:"Total",      value:String(mlAllLeads.length),  color:"#D4A843"},
                    {label:"New Today",  value:String(mlNewToday),         color:"#0EA5E9"},
                    {label:"Hot Leads",  value:String(mlHot.length),       color:"#10B981"},
                    {label:"Won",        value:String(mlWon.length),       color:"#10B981"},
                    {label:"Pipeline",   value:mlTotalVal>=1000000000?"AED "+(mlTotalVal*0.000000001).toFixed(1)+"B":"AED "+(mlTotalVal*0.000001).toFixed(1)+"M", color:"#D4A843"},
                  ].map((k,i)=>(
                    <div key={i} style={{background:T.card,border:"1px solid "+T.border,borderRadius:10,padding:"11px 13px",position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.color,opacity:0.8}}/>
                      <div style={{fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.7,marginBottom:3}}>{k.label}</div>
                      <div style={{fontSize:20,fontWeight:900,color:k.color,fontFamily:"'Fraunces',serif"}}>{k.value}</div>
                    </div>
                  ))}
                </div>

                {/* ── SOURCE ANALYTICS PANEL ── */}
                {showMLAnalytics && (
                  <div style={{background:T.card,border:"1px solid "+T.border,borderRadius:10,padding:"14px 16px",marginBottom:12}}>
                    <div style={{fontSize:12,fontWeight:700,color:T.white,marginBottom:10}}>Source Performance — Conversion Rate by Channel</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
                      {mlSrcStats.slice(0,8).map((s,i)=>(
                        <div key={i} style={{background:T.surfaceAlt,borderRadius:7,padding:"9px 11px"}}>
                          <div style={{fontSize:11,fontWeight:700,color:ML_SRC[s.src]||T.textMuted,marginBottom:5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.src}</div>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                            <div>
                              <div style={{fontSize:17,fontWeight:900,color:T.white,fontFamily:"'Fraunces',serif",lineHeight:1}}>{s.total}</div>
                              <div style={{fontSize:9,color:T.textMuted}}>leads</div>
                            </div>
                            <div style={{textAlign:"right"}}>
                              <div style={{fontSize:15,fontWeight:900,color:s.rate>=10?"#10B981":s.rate>=5?"#D4A843":"#EF4444",fontFamily:"'Fraunces',serif",lineHeight:1}}>{s.rate}%</div>
                              <div style={{fontSize:9,color:T.textMuted}}>won</div>
                            </div>
                          </div>
                          <div style={{height:2,background:T.border,borderRadius:1,marginTop:6,overflow:"hidden"}}>
                            <div style={{height:"100%",width:Math.min(s.total,100)+"%",background:ML_SRC[s.src]||"#D4A843",borderRadius:1,opacity:0.6}}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── STALE LEADS ALERT ── */}
                {mlStale.length>0 && (() => {
                  const named=mlStale.filter(l=>l.name&&l.name.trim()&&l.name!=="Unnamed");
                  return (
                    <div style={{padding:"7px 12px",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:7,marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:"#EF4444",flexShrink:0}}/>
                      <div style={{flex:1,fontSize:11,color:"#EF4444"}}>
                        {named.length>0
                          ? named.slice(0,2).map(l=>l.name).join(", ")+(mlStale.length>2?" + "+(mlStale.length-2)+" more":"")+" — 7+ days no contact"
                          : mlStale.length+" leads need follow-up — 7+ days no contact"}
                      </div>
                      <button type="button" onClick={()=>setLeadSortBy("date")}
                        style={{padding:"2px 9px",background:"transparent",border:"1px solid rgba(239,68,68,0.3)",borderRadius:4,color:"#EF4444",fontSize:10,cursor:"pointer"}}>View</button>
                    </div>
                  );
                })()}

                {/* ── SMART FILTER PILLS ── */}
                <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                  {[
                    {label:"Hot Leads",   fn:()=>{setLeadSortBy("score");setLeadStatusFilter("all");}},
                    {label:"Immediate",   fn:()=>{setLeadTagFilter("Immediate");}},
                    {label:"GV Eligible", fn:()=>{setLeadBudgetFilter("above10m");}},
                    {label:"Indian",      fn:()=>{setLeadNatFilter("Indian");}},
                    {label:"Russian",     fn:()=>{setLeadNatFilter("Russian");}},
                    {label:"Won Deals",   fn:()=>{setLeadStatusFilter("Won");}},
                    {label:"Lost Leads",  fn:()=>{setLeadStatusFilter("Lost");}},
                  ].map((f,i)=>(
                    <button key={i} type="button" onClick={f.fn}
                      style={{padding:"4px 10px",borderRadius:14,border:"1px solid "+T.border,background:"transparent",color:T.textMuted,fontSize:11,cursor:"pointer",transition:"all 0.15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.background="rgba(212,168,67,0.1)";e.currentTarget.style.color="#D4A843";e.currentTarget.style.borderColor="rgba(212,168,67,0.3)";}}
                      onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.textMuted;e.currentTarget.style.borderColor=T.border;}}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* ── FILTER BAR ── */}
                <div style={{background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:10,padding:"10px 12px",marginBottom:12}}>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center",marginBottom:7}}>
                    <div style={{position:"relative",flex:"2 1 170px"}}>
                      <svg style={{position:"absolute",left:8,top:"50%",transform:"translateY(-50%)"}} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input value={leadSearch} onChange={e=>setLeadSearch(e.target.value)} placeholder="Search name, phone, area..."
                        style={{width:"100%",padding:"7px 8px 7px 27px",background:T.surface,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                    </div>
                    <select value={leadSortBy} onChange={e=>setLeadSortBy(e.target.value)}
                      style={{flex:"1 1 90px",padding:"7px 8px",background:T.surface,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}>
                      <option value="date">Latest</option>
                      <option value="score">AI Score</option>
                      <option value="budget">Budget</option>
                      <option value="name">Name A-Z</option>
                    </select>
                    <select value={leadStatusFilter} onChange={e=>setLeadStatusFilter(e.target.value)}
                      style={{flex:"1 1 90px",padding:"7px 8px",background:T.surface,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}>
                      <option value="all">All Status</option>
                      {Object.entries(ML_ST).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <select value={leadSourceFilter} onChange={e=>setLeadSourceFilter(e.target.value)}
                      style={{flex:"1 1 105px",padding:"7px 8px",background:T.surface,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}>
                      <option value="all">All Sources</option>
                      {Object.keys(ML_SRC).map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                    <select value={leadNatFilter} onChange={e=>setLeadNatFilter(e.target.value)}
                      style={{flex:"1 1 120px",padding:"7px 8px",background:T.surface,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}>
                      <option value="all">All Nationalities</option>
                      {ML_NATS.map(n=><option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center"}}>
                    <select value={leadBudgetFilter} onChange={e=>setLeadBudgetFilter(e.target.value)}
                      style={{flex:"1 1 105px",padding:"7px 8px",background:T.surface,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}>
                      <option value="all">All Budgets</option>
                      <option value="under1m">Under 1M</option>
                      <option value="1to3m">1M – 3M</option>
                      <option value="3to5m">3M – 5M</option>
                      <option value="5to10m">5M – 10M</option>
                      <option value="above10m">10M+</option>
                    </select>
                    <select value={leadTypeFilter} onChange={e=>setLeadTypeFilter(e.target.value)}
                      style={{flex:"1 1 90px",padding:"7px 8px",background:T.surface,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}>
                      <option value="all">All Types</option>
                      <option value="Buy">Buy</option>
                      <option value="Rent">Rent</option>
                      <option value="Off-Plan">Off-Plan</option>
                      <option value="Invest">Invest</option>
                    </select>
                    <select value={leadTagFilter} onChange={e=>setLeadTagFilter(e.target.value)}
                      style={{flex:"1 1 110px",padding:"7px 8px",background:T.surface,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}>
                      <option value="all">All Timelines</option>
                      <option value="Immediate">Immediate</option>
                      <option value="1-3 months">1-3 Months</option>
                      <option value="3-6 months">3-6 Months</option>
                      <option value="6-12 months">6-12 Months</option>
                      <option value="Just browsing">Just Browsing</option>
                    </select>
                    <button type="button"
                      onClick={()=>{setLeadSearch("");setLeadStatusFilter("all");setLeadSourceFilter("all");setLeadNatFilter("all");setLeadBudgetFilter("all");setLeadTypeFilter("all");setLeadTagFilter("all");setLeadSortBy("date");}}
                      style={{padding:"7px 11px",borderRadius:6,border:"1px solid "+T.border,background:"transparent",color:T.textMuted,fontSize:11,cursor:"pointer"}}>
                      Reset
                    </button>
                    <button type="button" onClick={()=>setLeadShowAdd(v=>!v)}
                      style={{marginLeft:"auto",padding:"7px 13px",borderRadius:6,border:"none",background:leadShowAdd?"rgba(212,168,67,0.15)":"linear-gradient(135deg,#D4A843,#B8902E)",color:leadShowAdd?"#D4A843":"#0A0E1A",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                      {leadShowAdd?"Cancel":"+ Add Lead"}
                    </button>
                    <label
                      style={{marginLeft:8,padding:"7px 13px",borderRadius:6,border:"1px solid "+T.border,background:"transparent",color:T.textMuted,fontSize:11,fontWeight:600,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}>
                      📥 Import CSV
                      <input type="file" accept=".csv" style={{display:"none"}} onChange={e => { if (e.target.files[0]) { mlImportCsv(e.target.files[0]); e.target.value = ""; } }} />
                    </label>
                  </div>
                </div>

                {/* ── ADD LEAD FORM ── */}
                {leadShowAdd && (
                  <div style={{padding:"16px 18px",background:"rgba(212,168,67,0.04)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:10,marginBottom:12}}>
                    <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:12}}>Add New Lead</div>
                    {leadAddPhone && mlIsDuplicate(leadAddPhone) && (
                      <div style={{padding:"6px 10px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:6,marginBottom:10,fontSize:11,color:"#EF4444"}}>
                        Duplicate detected — a lead with this phone number already exists
                      </div>
                    )}
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,marginBottom:9}}>
                      {[
                        {label:"Full Name *",val:leadAddName,set:setLeadAddName,ph:"Client name"},
                        {label:"Phone *",val:leadAddPhone,set:setLeadAddPhone,ph:"+971 50 XXX XXXX"},
                        {label:"Email",val:leadAddEmail,set:setLeadAddEmail,ph:"email@example.com"},
                        {label:"Budget (AED)",val:leadAddBudget,set:setLeadAddBudget,ph:"e.g. 2000000"},
                        {label:"Community",val:leadAddComm,set:setLeadAddComm,ph:"e.g. Dubai Hills"},
                        {label:"Bedrooms",val:leadAddBedrooms||"",set:setLeadAddBedrooms,ph:"e.g. 2"},
                        {label:"Referred By",val:leadAddRef||"",set:setLeadAddRef,ph:"Who referred"},
                        {label:"Follow Up Date",val:leadAddFollowUp||"",set:setLeadAddFollowUp,ph:"",type:"date"},
                      ].map((f,i)=>(
                        <div key={i}>
                          <div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>{f.label}</div>
                          <input type={f.type||"text"} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                            style={{width:"100%",padding:"7px 9px",background:T.surfaceAlt,border:"1px solid "+(f.label.includes("*")&&!f.val?"rgba(239,68,68,0.4)":T.border),borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                        </div>
                      ))}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,marginBottom:9}}>
                      <div>
                        <div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Nationality</div>
                        <select value={leadAddNat||""} onChange={e=>setLeadAddNat(e.target.value)} style={{width:"100%",padding:"7px 9px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}>
                          <option value="">Select...</option>{ML_NATS.map(n=><option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Language</div>
                        <select value={leadAddLang||""} onChange={e=>setLeadAddLang(e.target.value)} style={{width:"100%",padding:"7px 9px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}>
                          <option value="">Select...</option>{ML_LANGS.map(l=><option key={l} value={l}>{l}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Timeline</div>
                        <select value={leadAddTimeline||""} onChange={e=>setLeadAddTimeline(e.target.value)} style={{width:"100%",padding:"7px 9px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}>
                          <option value="">Select...</option>
                          <option value="Immediate">Immediate</option>
                          <option value="1-3 months">1-3 Months</option>
                          <option value="3-6 months">3-6 Months</option>
                          <option value="6-12 months">6-12 Months</option>
                          <option value="Just browsing">Just Browsing</option>
                        </select>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Purpose</div>
                        <select value={leadAddPurpose||""} onChange={e=>setLeadAddPurpose(e.target.value)} style={{width:"100%",padding:"7px 9px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}>
                          <option value="">Select...</option>
                          <option value="Live-in">Live-in</option>
                          <option value="Investment">Investment</option>
                          <option value="Rental income">Rental Income</option>
                          <option value="Golden Visa">Golden Visa</option>
                        </select>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr) auto",gap:9,alignItems:"end"}}>
                      <div>
                        <div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Source</div>
                        <select value={leadAddSource} onChange={e=>setLeadAddSource(e.target.value)} style={{width:"100%",padding:"7px 9px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}>
                          {Object.keys(ML_SRC).map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Status</div>
                        <select value={leadAddStatus} onChange={e=>setLeadAddStatus(e.target.value)} style={{width:"100%",padding:"7px 9px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}>
                          {Object.entries(ML_ST).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Type</div>
                        <select value={leadAddType} onChange={e=>setLeadAddType(e.target.value)} style={{width:"100%",padding:"7px 9px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}>
                          {["Buy","Rent","Off-Plan","Invest"].map(t=><option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <button type="button" onClick={mlSave} disabled={leadAddSaving}
                        style={{padding:"8px 20px",background:(!leadAddName||!leadAddPhone||leadAddSaving)?"rgba(212,168,67,0.3)":"linear-gradient(135deg,#D4A843,#B8902E)",color:"#0A0E1A",borderRadius:6,border:"none",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                        {leadAddSaving?"Saving...":"Save Lead"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── LEAD TABLE ── */}
                <div style={{background:T.card,border:"1px solid "+T.border,borderRadius:10,overflow:"hidden"}}>
                  <div style={{display:"grid",gridTemplateColumns:"minmax(175px,1fr) 55px 88px 110px 55px 100px 78px 90px",gap:7,padding:"8px 12px",background:T.surfaceAlt,borderBottom:"1px solid "+T.border}}>
                    {["Lead","Score","Status","Source","Type","Budget","Date","Actions"].map((h,i)=>(
                      <div key={i} style={{fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.5}}>{h}</div>
                    ))}
                  </div>

                  {mlFiltered.length===0 && (
                    <div style={{padding:"40px 24px",textAlign:"center"}}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{marginBottom:10}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                      <div style={{fontSize:14,fontWeight:600,color:T.textPrimary,marginBottom:4}}>No leads found</div>
                      <div style={{fontSize:12,color:T.textMuted}}>Adjust filters or add a new lead</div>
                    </div>
                  )}

                  {mlFiltered.map((l,idx)=>{
                    const sc=ML_ST[l.status||"New"]||ML_ST["New"];
                    const srcC=ML_SRC[l.source]||"#94A3B8";
                    const name=(l.name||"").trim()||(l.email||"").split("@")[0]||l.phone||"Unnamed";
                    const initials=name.split(" ").map(w=>w[0]||"").join("").slice(0,2).toUpperCase();
                    const budget=parseFloat(l.budget||0);
                    const isGV=budget>=GOLDEN_VISA_THRESHOLD;
                    const ai=mlScore(l);
                    const isUrgent=l.timeline==="Immediate";
                    const isOverdue=(Date.now()-new Date(l.updatedAt||l.createdAt||Date.now()).getTime())*0.000000011574>7&&l.status!=="Won"&&l.status!=="Lost";
                    return (
                      <div key={l.id||idx}
                        onClick={()=>{setSelectedLead(l);setLeadDrawerTab("details");}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(212,168,67,0.03)"}
                        onMouseLeave={e=>e.currentTarget.style.background=isOverdue?"rgba(239,68,68,0.02)":"transparent"}
                        style={{display:"grid",gridTemplateColumns:"minmax(175px,1fr) 55px 88px 110px 55px 100px 78px 90px",gap:7,padding:"9px 12px",alignItems:"center",borderBottom:"1px solid "+T.border,cursor:"pointer",transition:"background 0.12s",background:isOverdue?"rgba(239,68,68,0.02)":"transparent"}}>

                        <div style={{display:"flex",alignItems:"center",gap:9,minWidth:0}}>
                          <div style={{width:33,height:33,borderRadius:"50%",background:"rgba(212,168,67,0.12)",border:"1px solid rgba(212,168,67,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#D4A843",flexShrink:0,position:"relative"}}>
                            {initials}
                            {l.nationality&&<span style={{position:"absolute",bottom:-3,right:-3,fontSize:7,lineHeight:1,background:"rgba(10,14,26,0.95)",border:"1px solid rgba(212,168,67,0.3)",borderRadius:3,padding:"1px 3px",color:"#D4A843",fontWeight:700}}>{l.nationality.slice(0,2).toUpperCase()}</span>}
                          </div>
                          <div style={{minWidth:0}}>
                            <div style={{display:"flex",gap:4,alignItems:"center"}}>
                              <span style={{fontSize:13,fontWeight:600,color:T.textPrimary,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:130}}>{name}</span>
                              {isGV&&<span style={{fontSize:8,padding:"1px 4px",borderRadius:3,background:"rgba(212,168,67,0.15)",color:"#D4A843",fontWeight:700,flexShrink:0}}>GV</span>}
                              {isUrgent&&<span style={{fontSize:8,padding:"1px 4px",borderRadius:3,background:"rgba(239,68,68,0.15)",color:"#EF4444",fontWeight:700,flexShrink:0}}>NOW</span>}
                              {isOverdue&&<span style={{fontSize:8,padding:"1px 4px",borderRadius:3,background:"rgba(239,68,68,0.1)",color:"#EF4444",fontWeight:700,flexShrink:0}}>STALE</span>}
                            </div>
                            <div style={{fontSize:11,color:T.textMuted,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.phone||l.email||l.community||"—"}</div>
                          </div>
                        </div>

                        <div style={{textAlign:"center"}}>
                          <div style={{fontSize:13,fontWeight:900,color:ai.color,fontFamily:"'Fraunces',serif",lineHeight:1}}>{ai.score}</div>
                          <div style={{fontSize:8,fontWeight:700,color:ai.color}}>{ai.label}</div>
                        </div>

                        <div><span style={{display:"inline-block",padding:"3px 7px",borderRadius:5,fontSize:10,fontWeight:600,background:sc.bg,color:sc.color}}>{sc.label}</span></div>

                        <div><span style={{display:"inline-block",padding:"3px 7px",borderRadius:4,fontSize:10,fontWeight:600,background:srcC+"1A",color:srcC,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:105}}>{(l.source||"Manual").length>14?(l.source||"Manual").slice(0,14)+"…":(l.source||"Manual")}</span></div>

                        <div style={{fontSize:11,color:T.textMuted}}>{l.type||"Buy"}</div>

                        <div style={{fontSize:12,fontWeight:700,color:isGV?"#D4A843":T.textPrimary}}>{fmtB(l.budget)}</div>

                        <div>
                          <div style={{fontSize:11,color:T.textMuted}}>{l.createdAt?new Date(l.createdAt).toLocaleDateString("en-AE",{day:"2-digit",month:"short"}):("—")}</div>
                          {l.followUpDate&&<div style={{fontSize:9,color:"#D4A843"}}>FU: {l.followUpDate}</div>}
                        </div>

                        <div onClick={e=>e.stopPropagation()} style={{display:"flex",gap:3}}>
                          {l.phone&&<a href={"https://wa.me/"+clnPhone(l.phone)} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",width:25,height:25,borderRadius:5,border:"1px solid rgba(37,211,102,0.3)",background:"rgba(37,211,102,0.08)",color:"#25D366",textDecoration:"none"}}><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg></a>}
                          {l.email&&<a href={"mailto:"+l.email} style={{display:"flex",alignItems:"center",justifyContent:"center",width:25,height:25,borderRadius:5,border:"1px solid rgba(59,130,246,0.3)",background:"rgba(59,130,246,0.08)",color:"#3B82F6",textDecoration:"none"}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></a>}
                          {l.phone&&<a href={"tel:"+l.phone} style={{display:"flex",alignItems:"center",justifyContent:"center",width:25,height:25,borderRadius:5,border:"1px solid rgba(16,185,129,0.3)",background:"rgba(16,185,129,0.08)",color:"#10B981",textDecoration:"none"}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/></svg></a>}
                        </div>
                      </div>
                    );
                  })}

                  {mlFiltered.length>0&&(
                    <div style={{padding:"8px 12px",borderTop:"1px solid "+T.border,fontSize:11,color:T.textMuted,display:"flex",justifyContent:"space-between"}}>
                      <span>{mlFiltered.length} of {mlAllLeads.length} leads shown</span>
                      <span>{mlWon.length} Won · {mlAllLeads.filter(l=>l.status==="Lost").length} Lost · {fmtB(mlTotalVal)} total pipeline</span>
                    </div>
                  )}
                </div>

                {/* ── LEAD DRAWER ── */}
                {selectedLead&&(
                  <div style={{position:"fixed",inset:0,zIndex:1500,display:"flex"}} onClick={e=>{if(e.target===e.currentTarget)setSelectedLead(null);}}>
                    <div style={{flex:1,background:"rgba(0,0,0,0.5)"}} onClick={()=>setSelectedLead(null)}/>
                    <div style={{width:500,background:T.bg,borderLeft:"1px solid "+T.border,display:"flex",flexDirection:"column"}}>

                      {/* Drawer header */}
                      <div style={{padding:"16px 18px 0",borderBottom:"1px solid "+T.border,flexShrink:0}}>
                        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                              {selectedLead.nationality&&<span style={{fontSize:10,padding:"1px 5px",borderRadius:3,background:"rgba(212,168,67,0.15)",color:"#D4A843",fontWeight:700,flexShrink:0}}>{selectedLead.nationality.slice(0,2).toUpperCase()}</span>}
                              <span style={{fontSize:16,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selectedLead.name||"Unnamed Lead"}</span>
                            </div>
                            <div style={{fontSize:11,color:T.textMuted}}>
                              {[selectedLead.nationality,selectedLead.language,selectedLead.community].filter(Boolean).join(" · ")}
                            </div>
                            <div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap"}}>
                              {selectedLead.timeline&&<span style={{fontSize:10,padding:"2px 6px",borderRadius:7,background:selectedLead.timeline==="Immediate"?"rgba(239,68,68,0.15)":"rgba(212,168,67,0.1)",color:selectedLead.timeline==="Immediate"?"#EF4444":"#D4A843",fontWeight:600}}>{selectedLead.timeline}</span>}
                              {selectedLead.purpose&&<span style={{fontSize:10,padding:"2px 6px",borderRadius:7,background:"rgba(139,92,246,0.1)",color:"#8B5CF6",fontWeight:600}}>{selectedLead.purpose}</span>}
                              {parseFloat(selectedLead.budget||0)>=GOLDEN_VISA_THRESHOLD&&<span style={{fontSize:10,padding:"2px 6px",borderRadius:7,background:"rgba(212,168,67,0.1)",color:"#D4A843",fontWeight:700}}>GV Eligible</span>}
                              {(selectedLead.tags||[]).map((tag,i)=><span key={i} style={{fontSize:10,padding:"2px 6px",borderRadius:7,background:"rgba(20,184,166,0.1)",color:"#14B8A6",fontWeight:600}}>{tag}</span>)}
                            </div>
                          </div>
                          <button type="button" onClick={()=>setSelectedLead(null)}
                            style={{background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textMuted,width:26,height:26,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:8}}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </div>

                        {/* Status buttons */}
                        <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>
                          {Object.entries(ML_ST).map(([k,v])=>(
                            <button key={k} type="button" onClick={()=>mlStatus(selectedLead.id,k)}
                              style={{padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:700,cursor:"pointer",border:"1px solid "+(selectedLead.status===k?v.color:T.border),background:selectedLead.status===k?v.bg:"transparent",color:selectedLead.status===k?v.color:T.textMuted}}>
                              {v.label}
                            </button>
                          ))}
                        </div>

                        {/* Drawer tabs */}
                        <div style={{display:"flex",gap:0}}>
                          {["details","notes","tasks","activity","tags","docs"].map(t=>(
                            <button key={t} type="button" onClick={()=>setLeadDrawerTab(t)}
                              style={{padding:"6px 11px",fontSize:11,fontWeight:600,border:"none",background:"transparent",color:leadDrawerTab===t?"#D4A843":T.textMuted,borderBottom:"2px solid "+(leadDrawerTab===t?"#D4A843":"transparent"),cursor:"pointer",textTransform:"capitalize"}}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Drawer body */}
                      <div style={{flex:1,padding:"14px 16px",overflowY:"auto"}}>

                        {/* DETAILS TAB */}
                        {leadDrawerTab==="details"&&(()=>{
                          const ai=mlScore(selectedLead);
                          const bt=ML_BEST_TIME[selectedLead.source]||"Anytime";
                          return (
                            <div>
                              {/* AI Score */}
                              <div style={{background:"rgba(212,168,67,0.06)",border:"1px solid rgba(212,168,67,0.15)",borderRadius:8,padding:"10px 12px",marginBottom:10}}>
                                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                                  <div style={{fontSize:24,fontWeight:900,color:ai.color,fontFamily:"'Fraunces',serif",lineHeight:1}}>{ai.score}</div>
                                  <div style={{flex:1}}>
                                    <div style={{fontSize:11,fontWeight:700,color:ai.color}}>{ai.label} Lead</div>
                                    <div style={{height:3,background:T.border,borderRadius:2,marginTop:3,overflow:"hidden"}}>
                                      <div style={{height:"100%",width:ai.score+"%",background:ai.color,borderRadius:2}}/>
                                    </div>
                                  </div>
                                </div>
                                <div style={{fontSize:10,color:T.textMuted}}>Best time to contact: <span style={{color:"#D4A843",fontWeight:600}}>{bt}</span></div>
                              </div>

                              {/* Deal value for Won leads */}
                              {selectedLead.status==="Won"&&(
                                <div style={{background:"rgba(16,185,129,0.07)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,padding:"10px 12px",marginBottom:10}}>
                                  <div style={{fontSize:11,fontWeight:700,color:"#10B981",marginBottom:6}}>Deal Value</div>
                                  <div style={{display:"flex",gap:7,alignItems:"center"}}>
                                    <input defaultValue={selectedLead.dealValue||""} placeholder="Enter deal value (AED)" id="dealValueInput"
                                      style={{flex:1,padding:"6px 9px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}/>
                                    <button type="button" onClick={()=>{const v=document.getElementById("dealValueInput").value;mlSaveDeal(selectedLead.id,v);}}
                                      style={{padding:"6px 12px",background:"#10B981",color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer"}}>Save</button>
                                  </div>
                                  {selectedLead.dealValue&&<div style={{fontSize:10,color:"#10B981",marginTop:5}}>{fmtB(selectedLead.dealValue)} · Est. commission {fmtB(parseFloat(selectedLead.dealValue)*0.02)}</div>}
                                </div>
                              )}

                              {/* Details grid */}
                              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:10}}>
                                {[
                                  {label:"Budget",      value:fmtB(selectedLead.budget)},
                                  {label:"Source",      value:selectedLead.source||"—"},
                                  {label:"Nationality", value:selectedLead.nationality||"—"},
                                  {label:"Language",    value:selectedLead.language||"—"},
                                  {label:"Timeline",    value:selectedLead.timeline||"—"},
                                  {label:"Purpose",     value:selectedLead.purpose||"—"},
                                  {label:"Type",        value:selectedLead.type||"—"},
                                  {label:"Bedrooms",    value:selectedLead.bedrooms||"—"},
                                  {label:"Community",   value:selectedLead.community||"—"},
                                  {label:"Referred By", value:selectedLead.referredBy||"—"},
                                  {label:"Follow Up",   value:selectedLead.followUpDate||"—"},
                                  {label:"Created",     value:selectedLead.createdAt?new Date(selectedLead.createdAt).toLocaleDateString("en-AE"):"—"},
                                ].map((item,i)=>(
                                  <div key={i} style={{background:T.surfaceAlt,borderRadius:6,padding:"7px 10px"}}>
                                    <div style={{fontSize:9,color:T.textMuted,marginBottom:2}}>{item.label}</div>
                                    <div style={{fontSize:12,fontWeight:600,color:T.textPrimary}}>{item.value}</div>
                                  </div>
                                ))}
                              </div>

                              {/* Contact buttons */}
                              <div style={{display:"flex",gap:6}}>
                                {selectedLead.phone&&<a href={"https://wa.me/"+clnPhone(selectedLead.phone)} target="_blank" rel="noopener noreferrer" style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"8px",borderRadius:7,background:"rgba(37,211,102,0.08)",border:"1px solid rgba(37,211,102,0.25)",color:"#25D366",textDecoration:"none",fontSize:11,fontWeight:600}}>WhatsApp</a>}
                                {selectedLead.email&&<a href={"mailto:"+selectedLead.email} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"8px",borderRadius:7,background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.25)",color:"#3B82F6",textDecoration:"none",fontSize:11,fontWeight:600}}>Email</a>}
                                {selectedLead.phone&&<a href={"tel:"+selectedLead.phone} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,padding:"8px",borderRadius:7,background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.25)",color:"#10B981",textDecoration:"none",fontSize:11,fontWeight:600}}>Call</a>}
                              </div>
                            </div>
                          );
                        })()}

                        {/* NOTES TAB */}
                        {leadDrawerTab==="notes"&&(
                          <div>
                            <div style={{fontSize:11,fontWeight:700,color:T.textSecondary,marginBottom:6}}>WhatsApp Templates</div>
                            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:10}}>
                              {ML_WA_TEMPLATES.map((tmpl,i)=>(
                                <button key={i} type="button"
                                  onClick={()=>{
                                    const agent=auth.currentUser?.email?.split("@")[0]||"Agent";
                                    const msg=tmpl.body.replace("{name}",selectedLead.name||"").replace("{agent}",agent).replace("{budget}",fmtB(selectedLead.budget)).replace("{community}",selectedLead.community||"Dubai").replace("{type}",selectedLead.type||"property").replace("{date}","the scheduled time");
                                    if(selectedLead.phone) window.open("https://wa.me/"+clnPhone(selectedLead.phone)+"?text="+encodeURIComponent(msg),"_blank");
                                  }}
                                  style={{padding:"3px 9px",borderRadius:5,border:"1px solid rgba(37,211,102,0.3)",background:"rgba(37,211,102,0.06)",color:"#25D366",fontSize:10,fontWeight:600,cursor:"pointer"}}>
                                  {tmpl.label}
                                </button>
                              ))}
                            </div>
                            <div style={{fontSize:11,fontWeight:700,color:T.textSecondary,marginBottom:6}}>Email Templates</div>
                            <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
                              {ML_EMAIL_TEMPLATES.map((tmpl,i)=>(
                                <button key={i} type="button"
                                  onClick={()=>{
                                    const agent=auth.currentUser?.email?.split("@")[0]||"Agent";
                                    const body=tmpl.body.replace("{name}",selectedLead.name||"").replace("{agent}",agent).replace("{budget}",fmtB(selectedLead.budget)).replace("{community}",selectedLead.community||"Dubai").replace("{type}",selectedLead.type||"property");
                                    if(selectedLead.email) window.location.href="mailto:"+selectedLead.email+"?subject="+encodeURIComponent(tmpl.subject)+"&body="+encodeURIComponent(body);
                                  }}
                                  style={{padding:"3px 9px",borderRadius:5,border:"1px solid rgba(59,130,246,0.3)",background:"rgba(59,130,246,0.06)",color:"#3B82F6",fontSize:10,fontWeight:600,cursor:"pointer"}}>
                                  {tmpl.label}
                                </button>
                              ))}
                            </div>
                            <div style={{display:"flex",gap:6,marginBottom:10}}>
                              <select value={noteType} onChange={e=>setNoteType(e.target.value)}
                                style={{padding:"7px 8px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:11,outline:"none"}}>
                                {["Call","WhatsApp","Email","Meeting","Site Visit","Note"].map(t=><option key={t} value={t}>{t}</option>)}
                              </select>
                              <input value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Add note..." onKeyDown={e=>{if(e.key==="Enter")mlNote(selectedLead.id);}}
                                style={{flex:1,padding:"7px 9px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}/>
                              <button type="button" onClick={()=>mlNote(selectedLead.id)} disabled={noteLoading}
                                style={{padding:"7px 11px",borderRadius:6,border:"none",background:"#D4A843",color:"#0A0E1A",fontSize:11,fontWeight:700,cursor:"pointer"}}>{noteLoading?"...":"Add"}</button>
                            </div>
                            {(selectedLead.notes_log||[]).filter(n=>n.type!=="Status Change"&&n.type!=="Created").length===0&&<div style={{textAlign:"center",padding:"24px",color:T.textMuted,fontSize:12}}>No notes yet</div>}
                            {[...(selectedLead.notes_log||[])].filter(n=>n.type!=="Status Change"&&n.type!=="Created").reverse().map((n,i)=>(
                              <div key={i} style={{padding:"8px 10px",background:T.surfaceAlt,borderRadius:6,marginBottom:6,borderLeft:"2px solid #D4A843"}}>
                                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                                  <span style={{fontSize:10,fontWeight:700,color:"#D4A843"}}>{n.type||"Note"}</span>
                                  <span style={{fontSize:9,color:T.textMuted}}>{n.at?new Date(n.at).toLocaleDateString("en-AE",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):""}</span>
                                </div>
                                <div style={{fontSize:12,color:T.textPrimary}}>{n.text}</div>
                                <div style={{fontSize:9,color:T.textMuted,marginTop:2}}>{n.by||""}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* TASKS TAB */}
                        {leadDrawerTab==="tasks"&&(
                          <div>
                            <div style={{display:"flex",gap:6,marginBottom:10}}>
                              <input value={taskText} onChange={e=>setTaskText(e.target.value)} placeholder="Task description..."
                                style={{flex:1,padding:"7px 9px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}/>
                              <input type="date" value={taskDue} onChange={e=>setTaskDue(e.target.value)}
                                style={{padding:"7px 8px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}/>
                              <button type="button" onClick={async()=>{
                                if(!taskText.trim()) return;
                                try{
                                  const e={text:"Task: "+taskText,type:"Task",due:taskDue,by:auth.currentUser?.email||"",at:new Date().toISOString()};
                                  await updateDoc(doc(db,"leads",selectedLead.id),{notes_log:arrayUnion(e),updatedAt:new Date().toISOString()});
                                  setTaskText("");setTaskDue("");
                                  if(selectedLead) setSelectedLead({...selectedLead,notes_log:[...(selectedLead.notes_log||[]),e]});
                                }catch(e){console.error(e);}
                              }} style={{padding:"7px 11px",borderRadius:6,border:"none",background:"#D4A843",color:"#0A0E1A",fontSize:11,fontWeight:700,cursor:"pointer"}}>Add</button>
                            </div>
                            {(selectedLead.notes_log||[]).filter(n=>n.type==="Task").length===0&&<div style={{textAlign:"center",padding:"24px",color:T.textMuted,fontSize:12}}>No tasks yet. Add one above.</div>}
                            {(selectedLead.notes_log||[]).filter(n=>n.type==="Task").reverse().map((n,i)=>{
                              const isOverdueTask=n.due&&new Date(n.due)<new Date();
                              return (
                                <div key={i} style={{padding:"8px 10px",background:T.surfaceAlt,borderRadius:6,marginBottom:6,borderLeft:"2px solid "+(isOverdueTask?"#EF4444":"#8B5CF6")}}>
                                  <div style={{fontSize:12,color:T.textPrimary,marginBottom:2}}>{n.text.replace("Task: ","")}</div>
                                  {n.due&&<div style={{fontSize:10,color:isOverdueTask?"#EF4444":"#D4A843",fontWeight:600}}>Due: {n.due}{isOverdueTask?" — OVERDUE":""}</div>}
                                  <div style={{fontSize:9,color:T.textMuted,marginTop:2}}>{n.by||""}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* ACTIVITY TAB */}
                        {leadDrawerTab==="activity"&&(
                          <div>
                            <div style={{display:"flex",gap:6,marginBottom:12}}>
                              <select value={noteType} onChange={e=>setNoteType(e.target.value)}
                                style={{padding:"6px 8px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:11,outline:"none"}}>
                                {["Call","WhatsApp","Email","Meeting","Site Visit","Note"].map(t=><option key={t} value={t}>{t}</option>)}
                              </select>
                              <input value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Log activity..." onKeyDown={e=>{if(e.key==="Enter")mlNote(selectedLead.id);}}
                                style={{flex:1,padding:"6px 9px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none"}}/>
                              <button type="button" onClick={()=>mlNote(selectedLead.id)} disabled={noteLoading}
                                style={{padding:"6px 11px",borderRadius:6,border:"none",background:"#D4A843",color:"#0A0E1A",fontSize:11,fontWeight:700,cursor:"pointer"}}>{noteLoading?"...":"Log"}</button>
                            </div>
                            {/* Timeline */}
                            <div style={{position:"relative"}}>
                              <div style={{position:"absolute",left:13,top:0,bottom:0,width:1,background:T.border}}/>
                              <div style={{display:"flex",gap:10,marginBottom:10,position:"relative"}}>
                                <div style={{width:27,height:27,borderRadius:"50%",background:"rgba(212,168,67,0.15)",border:"2px solid #D4A843",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,zIndex:1,fontSize:9,color:"#D4A843",fontWeight:700}}>CR</div>
                                <div style={{flex:1,background:T.surfaceAlt,borderRadius:7,padding:"7px 10px",border:"1px solid "+T.border}}>
                                  <div style={{display:"flex",justifyContent:"space-between"}}>
                                    <span style={{fontSize:10,fontWeight:700,color:"#D4A843"}}>Lead Created</span>
                                    <span style={{fontSize:9,color:T.textMuted}}>{selectedLead.createdAt?new Date(selectedLead.createdAt).toLocaleDateString("en-AE",{day:"2-digit",month:"short",year:"numeric"}):""}</span>
                                  </div>
                                  <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{selectedLead.source||"Manual"} · {fmtB(selectedLead.budget)}</div>
                                </div>
                              </div>
                              {(selectedLead.notes_log||[]).length===0&&<div style={{paddingLeft:37,fontSize:11,color:T.textMuted}}>No activities yet. Log a call, WhatsApp, or note above.</div>}
                              {[...(selectedLead.notes_log||[])].sort((a,b)=>new Date(a.at||0)-new Date(b.at||0)).map((n,i)=>{
                                const tc={"Call":"#10B981","WhatsApp":"#25D366","Email":"#3B82F6","Meeting":"#8B5CF6","Site Visit":"#F59E0B","Task":"#D4A843","Note":"#94A3B8","Status Change":"#14B8A6","Created":"#D4A843"};
                                const ti={"Call":"C","WhatsApp":"W","Email":"E","Meeting":"M","Site Visit":"S","Task":"T","Note":"N","Status Change":"ST","Created":"CR"};
                                const c=tc[n.type]||"#94A3B8";
                                return (
                                  <div key={i} style={{display:"flex",gap:10,marginBottom:8,position:"relative"}}>
                                    <div style={{width:27,height:27,borderRadius:"50%",background:c+"18",border:"1px solid "+c+"40",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,zIndex:1,fontSize:8,fontWeight:700,color:c}}>{ti[n.type]||"N"}</div>
                                    <div style={{flex:1,background:T.surfaceAlt,borderRadius:7,padding:"7px 10px",border:"1px solid "+T.border}}>
                                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                                        <span style={{fontSize:10,fontWeight:700,color:c}}>{n.type||"Note"}</span>
                                        <span style={{fontSize:9,color:T.textMuted}}>{n.at?new Date(n.at).toLocaleDateString("en-AE",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):""}</span>
                                      </div>
                                      <div style={{fontSize:11,color:T.textPrimary}}>{n.text}</div>
                                      {n.due&&<div style={{fontSize:9,color:"#D4A843",marginTop:2}}>Due: {n.due}</div>}
                                      <div style={{fontSize:9,color:T.textMuted,marginTop:2}}>{n.by||""}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* TAGS TAB */}
                        {leadDrawerTab==="tags"&&(
                          <div>
                            <div style={{fontSize:12,fontWeight:700,color:T.white,marginBottom:10}}>Custom Tags</div>
                            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:14}}>
                              {ML_TAGS_OPTIONS.map((tag,i)=>{
                                const active=(selectedLead.tags||[]).includes(tag);
                                return (
                                  <button key={i} type="button" onClick={()=>mlToggleTag(selectedLead.id,tag,selectedLead.tags)}
                                    style={{padding:"5px 12px",borderRadius:14,fontSize:11,fontWeight:600,cursor:"pointer",border:"1px solid "+(active?"#14B8A6":T.border),background:active?"rgba(20,184,166,0.12)":"transparent",color:active?"#14B8A6":T.textMuted}}>
                                    {tag}
                                  </button>
                                );
                              })}
                            </div>
                            {(selectedLead.tags||[]).length>0?(
                              <div>
                                <div style={{fontSize:11,color:T.textMuted,marginBottom:6}}>Active tags:</div>
                                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                                  {(selectedLead.tags||[]).map((tag,i)=>(
                                    <span key={i} style={{fontSize:11,padding:"3px 10px",borderRadius:12,background:"rgba(20,184,166,0.12)",border:"1px solid rgba(20,184,166,0.3)",color:"#14B8A6",fontWeight:600}}>{tag}</span>
                                  ))}
                                </div>
                              </div>
                            ):(
                              <div style={{textAlign:"center",padding:"20px",color:T.textMuted,fontSize:12}}>No tags yet — click above to add</div>
                            )}
                          </div>
                        )}

                        {/* DOCS TAB */}
                        {leadDrawerTab==="docs"&&(
                          <div>
                            <div style={{padding:"16px",textAlign:"center",background:T.surfaceAlt,borderRadius:8,border:"2px dashed "+T.border,marginBottom:10}}>
                              <div style={{fontSize:12,fontWeight:600,color:T.textPrimary,marginBottom:3}}>Upload Documents</div>
                              <div style={{fontSize:10,color:T.textMuted,marginBottom:10}}>Passport · Visa · Emirates ID · Proof of Funds</div>
                              <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple id="docUpload"
                                onChange={async(e)=>{
                                  const files=Array.from(e.target.files||[]);
                                  if(!files.length) return;
                                  const entries=files.map(f=>({name:f.name,uploadedAt:new Date().toISOString(),by:auth.currentUser?.email||"",size:f.size}));
                                  try{
                                    await updateDoc(doc(db,"leads",selectedLead.id),{documents:arrayUnion(...entries),updatedAt:new Date().toISOString()});
                                    setSelectedLead({...selectedLead,documents:[...(selectedLead.documents||[]),...entries]});
                                  }catch(err){console.error(err);}
                                }}
                                style={{display:"none"}}/>
                              <label htmlFor="docUpload" style={{display:"inline-block",padding:"7px 16px",background:"rgba(212,168,67,0.12)",border:"1px solid rgba(212,168,67,0.25)",borderRadius:6,color:"#D4A843",fontSize:11,fontWeight:600,cursor:"pointer"}}>Choose Files</label>
                            </div>
                            {(selectedLead.documents||[]).length===0&&<div style={{textAlign:"center",color:T.textMuted,fontSize:11,padding:"12px 0"}}>No documents uploaded yet</div>}
                            {(selectedLead.documents||[]).map((d,i)=>(
                              <div key={i} style={{display:"flex",alignItems:"center",gap:9,padding:"7px 10px",background:T.surfaceAlt,borderRadius:6,marginBottom:6}}>
                                <div style={{width:26,height:26,borderRadius:4,background:"rgba(212,168,67,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#D4A843" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontSize:11,fontWeight:600,color:T.textPrimary,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name||d}</div>
                                  <div style={{fontSize:9,color:T.textMuted}}>{d.uploadedAt?new Date(d.uploadedAt).toLocaleDateString("en-AE"):""} {d.by||""}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                )}

                {/* ── QUICK CAPTURE MODAL ── */}
                {showQuickCapture&&(
                  <div style={{position:"fixed",inset:0,background:"rgba(4,9,15,0.85)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)setShowQuickCapture(false);}}>
                    <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.border,width:"95%",maxWidth:480,padding:"20px"}} onClick={e=>e.stopPropagation()}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                        <div style={{fontFamily:"'Fraunces',serif",fontSize:15,fontWeight:900,color:T.white}}>Quick Lead Capture</div>
                        <button type="button" onClick={()=>setShowQuickCapture(false)} style={{background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textMuted,width:26,height:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                      {leadAddPhone&&mlIsDuplicate(leadAddPhone)&&(
                        <div style={{padding:"5px 9px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:5,marginBottom:8,fontSize:10,color:"#EF4444"}}>Duplicate: phone already exists</div>
                      )}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:9}}>
                        {[
                          {label:"Full Name *",val:leadAddName,set:setLeadAddName,ph:"Client name",type:"text"},
                          {label:"Phone *",val:leadAddPhone,set:setLeadAddPhone,ph:"+971 50 XXX XXXX",type:"tel"},
                          {label:"Email",val:leadAddEmail,set:setLeadAddEmail,ph:"email@example.com",type:"email"},
                          {label:"Budget (AED)",val:leadAddBudget,set:setLeadAddBudget,ph:"e.g. 2000000",type:"number"},
                        ].map((f,i)=>(
                          <div key={i}>
                            <div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>{f.label}</div>
                            <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph}
                              style={{width:"100%",padding:"7px 9px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:12,outline:"none",boxSizing:"border-box"}}/>
                          </div>
                        ))}
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:9,marginBottom:12}}>
                        <div>
                          <div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Nationality</div>
                          <select value={leadAddNat||""} onChange={e=>setLeadAddNat(e.target.value)} style={{width:"100%",padding:"7px 8px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:11,outline:"none"}}>
                            <option value="">Select...</option>{ML_NATS.map(n=><option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Source</div>
                          <select value={leadAddSource} onChange={e=>setLeadAddSource(e.target.value)} style={{width:"100%",padding:"7px 8px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:11,outline:"none"}}>
                            {Object.keys(ML_SRC).map(s=><option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Timeline</div>
                          <select value={leadAddTimeline||""} onChange={e=>setLeadAddTimeline(e.target.value)} style={{width:"100%",padding:"7px 8px",background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textPrimary,fontSize:11,outline:"none"}}>
                            <option value="">Select...</option>
                            <option value="Immediate">Immediate</option>
                            <option value="1-3 months">1-3 Months</option>
                            <option value="3-6 months">3-6 Months</option>
                            <option value="6-12 months">6-12 Months</option>
                            <option value="Just browsing">Just Browsing</option>
                          </select>
                        </div>
                      </div>
                      <button type="button" onClick={async()=>{await mlSave();setShowQuickCapture(false);}} disabled={leadAddSaving}
                        style={{width:"100%",padding:"10px",borderRadius:7,border:"none",background:"linear-gradient(135deg,#D4A843,#B8902E)",color:"#0A0E1A",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                        {leadAddSaving?"Saving...":"Save Lead"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── BULK WA TEMPLATES MODAL ── */}
                {showMLTemplates&&(
                  <div style={{position:"fixed",inset:0,background:"rgba(4,9,15,0.85)",zIndex:2100,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)setShowMLTemplates(false);}}>
                    <div style={{background:T.surface,borderRadius:12,border:"1px solid "+T.border,width:"95%",maxWidth:500,padding:"20px"}} onClick={e=>e.stopPropagation()}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
                        <div style={{fontFamily:"'Fraunces',serif",fontSize:14,fontWeight:900,color:T.white}}>Bulk WhatsApp — {mlFiltered.filter(l=>l.phone).length} leads with phone</div>
                        <button type="button" onClick={()=>setShowMLTemplates(false)} style={{background:T.surfaceAlt,border:"1px solid "+T.border,borderRadius:6,color:T.textMuted,width:26,height:26,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                      <div style={{fontSize:11,color:T.textMuted,marginBottom:12}}>Select a template — opens WhatsApp pre-filled for the first lead in your filter.</div>
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {ML_WA_TEMPLATES.map((tmpl,i)=>(
                          <button key={i} type="button" onClick={()=>mlSendWATemplate(tmpl)}
                            style={{padding:"10px 12px",borderRadius:7,border:"1px solid rgba(37,211,102,0.25)",background:"rgba(37,211,102,0.06)",textAlign:"left",cursor:"pointer"}}>
                            <div style={{fontSize:12,fontWeight:700,color:"#25D366",marginBottom:3}}>{tmpl.label}</div>
                            <div style={{fontSize:10,color:T.textMuted,lineHeight:1.4}}>{tmpl.body.slice(0,80)}...</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
}

export default MyLeadsTab;
