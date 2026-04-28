/* eslint-disable */
/*
  DXB ANALYTICS — PLATFORM ANALYTICS
  Session 13 — Replaces PlatformLeadsTab B2B CRM
  Shows aggregate platform metrics — NO individual agency lead data
  Admin only
*/

import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

const T = {
  bg:         "#0B0F14",
  surface:    "#131821",
  surfaceAlt: "#1A2028",
  border:     "rgba(148,163,184,0.15)",
  gold:       "#D4A843",
  white:      "#FFFFFF",
  textMuted:  "#94A3B8",
  textDim:    "#64748B",
  green:      "#10B981",
  amber:      "#F59E0B",
  red:        "#EF4444",
  blue:       "#3B82F6",
  purple:     "#A855F7",
};

const fmtCur = n => { if(!n) return "AED 0"; if(n>=1e6) return "AED "+(n/1e6).toFixed(1)+"M"; if(n>=1e3) return "AED "+(n/1e3).toFixed(0)+"K"; return "AED "+n.toLocaleString(); };
const fmtDate = d => { if(!d) return "—"; try { return new Date(d).toLocaleDateString("en-AE",{day:"2-digit",month:"short",year:"numeric"}); } catch(e){return "—";} };
const daysAgo = d => !d?999:Math.floor((Date.now()-new Date(d).getTime())/86400000);

const PLAN_PRICE = 299; // AED per month

const KPICard = ({label,value,sub,color,bg}) => (
  <div style={{background:T.surface,border:"1px solid "+T.border,borderRadius:12,padding:"16px 18px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:color,opacity:0.8}}/>
    <div style={{fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.8,marginBottom:8}}>{label}</div>
    <div style={{fontSize:26,fontWeight:900,color:color,fontFamily:"'Fraunces',serif",lineHeight:1,marginBottom:4}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:T.textMuted}}>{sub}</div>}
  </div>
);

export default function PlatformLeadsTab() {
  const [orgs,     setOrgs]     = useState([]);
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [period,   setPeriod]   = useState("all"); // all | 30 | 7

  useEffect(() => {
    const unsubs = [];
    unsubs.push(onSnapshot(collection(db,"organisations"), snap => {
      setOrgs(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    }));
    unsubs.push(onSnapshot(collection(db,"users"), snap => {
      setUsers(snap.docs.map(d=>({id:d.id,...d.data()})));
    }));
    return () => unsubs.forEach(u=>u());
  },[]);

  // ── Derived metrics ────────────────────────────────────────
  const cutoff = useMemo(()=>{ const d=new Date(); if(period==="30") d.setDate(d.getDate()-30); else if(period==="7") d.setDate(d.getDate()-7); else return null; return d; },[period]);

  const filtered = useMemo(()=>cutoff?orgs.filter(o=>new Date(o.createdAt)>=cutoff):orgs,[orgs,cutoff]);

  const totalOrgs    = orgs.length;
  const activeOrgs   = orgs.filter(o=>o.status==="active"||o.paid===true).length;
  const pendingOrgs  = orgs.filter(o=>o.status==="pending").length;
  const suspendedOrgs= orgs.filter(o=>o.status==="suspended").length;
  const mrr          = activeOrgs * PLAN_PRICE;
  const arr          = mrr * 12;

  const totalUsers   = users.length;
  const totalAgents  = users.filter(u=>u.orgRole==="agent").length;
  const totalManagers= users.filter(u=>u.orgRole==="manager"||u.orgRole==="director"||u.orgRole==="owner").length;
  const suspended    = users.filter(u=>u.status==="suspended").length;

  // New signups by month (last 6 months)
  const monthlySignups = useMemo(()=>{
    const months = [];
    for(let i=5;i>=0;i--){
      const d = new Date();
      d.setMonth(d.getMonth()-i);
      const label = d.toLocaleDateString("en-AE",{month:"short",year:"2-digit"});
      const count = orgs.filter(o=>{
        if(!o.createdAt) return false;
        const od = new Date(o.createdAt);
        return od.getMonth()===d.getMonth()&&od.getFullYear()===d.getFullYear();
      }).length;
      months.push({label,count});
    }
    return months;
  },[orgs]);

  const maxSignups = Math.max(...monthlySignups.map(m=>m.count),1);

  // City breakdown
  const cityBreakdown = useMemo(()=>{
    const m={};
    orgs.forEach(o=>{ const c=o.city||"Unknown"; m[c]=(m[c]||0)+1; });
    return Object.entries(m).map(([city,count])=>({city,count})).sort((a,b)=>b.count-a.count);
  },[orgs]);

  // Type breakdown
  const typeBreakdown = useMemo(()=>{
    const m={};
    orgs.forEach(o=>{ const t=o.type||"Agency"; m[t]=(m[t]||0)+1; });
    return Object.entries(m).map(([type,count])=>({type,count})).sort((a,b)=>b.count-a.count);
  },[orgs]);

  const TYPE_COLORS = {"Agency":"#10B981","Developer":"#A855F7","Brokerage":"#F59E0B","Boutique":"#06B6D4","Property Management":"#EC4899"};

  if(loading) return <div style={{padding:40,color:T.textMuted,fontFamily:"'Outfit',sans-serif"}}>Loading platform analytics...</div>;

  return (
    <div style={{padding:"20px 28px 60px",background:T.bg,minHeight:"100vh",fontFamily:"'Outfit',sans-serif"}}>

      {/* ── Header ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:10}}>
        <div>
          <h1 style={{margin:0,fontSize:24,color:T.gold,fontFamily:"'Fraunces',serif",fontWeight:700}}>Platform Analytics</h1>
          <p style={{margin:"4px 0 0",fontSize:12,color:T.textMuted}}>Aggregate metrics · No individual agency lead data · Admin only</p>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[{k:"7",l:"Last 7 days"},{k:"30",l:"Last 30 days"},{k:"all",l:"All time"}].map(v=>(
            <button key={v.k} type="button" onClick={()=>setPeriod(v.k)}
              style={{padding:"7px 14px",borderRadius:7,border:"1px solid "+(period===v.k?T.gold:T.border),background:period===v.k?"rgba(212,168,67,0.1)":"transparent",color:period===v.k?T.gold:T.textMuted,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
              {v.l}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:12,marginBottom:24}}>
        <KPICard label="Total Agencies"  value={totalOrgs}        sub={pendingOrgs+" pending approval"} color={T.gold}/>
        <KPICard label="Active Paid"     value={activeOrgs}       sub={"AED "+PLAN_PRICE+"/mo each"}    color={T.green}/>
        <KPICard label="MRR"             value={fmtCur(mrr)}      sub="Monthly recurring revenue"       color={T.green}/>
        <KPICard label="ARR"             value={fmtCur(arr)}      sub="Annual recurring revenue"        color={T.green}/>
        <KPICard label="Total Users"     value={totalUsers}       sub={totalAgents+" agents · "+totalManagers+" managers"} color={T.blue}/>
        <KPICard label="Suspended"       value={suspendedOrgs}    sub={suspended+" users suspended"}    color={suspendedOrgs>0?T.red:T.textMuted}/>
      </div>

      {/* ── Main grid ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>

        {/* Monthly signups chart */}
        <div style={{background:T.surface,border:"1px solid "+T.border,borderRadius:12,padding:"18px 20px"}}>
          <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:4}}>Monthly signups</div>
          <div style={{fontSize:11,color:T.textMuted,marginBottom:20}}>New agency registrations per month</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:8,height:120}}>
            {monthlySignups.map((m,i)=>(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                <div style={{fontSize:11,fontWeight:700,color:T.gold}}>{m.count||""}</div>
                <div style={{width:"100%",background:m.count>0?"rgba(212,168,67,0.7)":"rgba(255,255,255,0.05)",borderRadius:"4px 4px 0 0",height:m.count>0?(m.count/maxSignups)*100+"%":"8px",minHeight:8,transition:"height 0.6s"}} />
                <div style={{fontSize:9,color:T.textDim||T.textMuted,textAlign:"center"}}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue projection */}
        <div style={{background:T.surface,border:"1px solid "+T.border,borderRadius:12,padding:"18px 20px"}}>
          <div style={{fontSize:13,fontWeight:700,color:T.white,marginBottom:4}}>Revenue overview</div>
          <div style={{fontSize:11,color:T.textMuted,marginBottom:20}}>Based on AED {PLAN_PRICE}/mo per active agency</div>
          {[
            {label:"MRR",          value:fmtCur(mrr),        color:T.green,  pct:100},
            {label:"Quarterly",    value:fmtCur(mrr*3),      color:T.green,  pct:75},
            {label:"ARR",          value:fmtCur(arr),        color:T.gold,   pct:50},
            {label:"Per agency/yr",value:fmtCur(PLAN_PRICE*12),color:T.blue, pct:25},
          ].map((r,i)=>(
            <div key={i} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:12,color:T.textMuted}}>{r.label}</span>
                <span style={{fontSize:13,fontWeight:700,color:r.color,fontFamily:"'Fraunces',serif"}}>{r.value}</span>
              </div>
              <div style={{height:4,borderRadius:2,background:"rgba(255,255,255,0.05)"}}>
                <div style={{height:"100%",width:r.pct+"%",background:r.color,borderRadius:2,opacity:0.7}}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>

        {/* City breakdown */}
        <div style={{background:T.surface,border:"1px solid "+T.border,borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid "+T.border}}>
            <div style={{fontSize:13,fontWeight:700,color:T.white}}>By city</div>
          </div>
          <div>
            {cityBreakdown.length===0&&<div style={{padding:"20px",textAlign:"center",fontSize:12,color:T.textMuted}}>No data</div>}
            {cityBreakdown.map((c,i)=>(
              <div key={c.city} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 18px",borderBottom:i<cityBreakdown.length-1?"1px solid "+T.border+"40":""}}>
                <span style={{fontSize:12,color:T.white}}>{c.city}</span>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:60,height:4,borderRadius:2,background:"rgba(255,255,255,0.05)"}}>
                    <div style={{height:"100%",width:(c.count/totalOrgs*100)+"%",background:T.gold,borderRadius:2}}/>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,color:T.gold,minWidth:20,textAlign:"right"}}>{c.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Type breakdown */}
        <div style={{background:T.surface,border:"1px solid "+T.border,borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid "+T.border}}>
            <div style={{fontSize:13,fontWeight:700,color:T.white}}>By type</div>
          </div>
          <div>
            {typeBreakdown.length===0&&<div style={{padding:"20px",textAlign:"center",fontSize:12,color:T.textMuted}}>No data</div>}
            {typeBreakdown.map((t,i)=>(
              <div key={t.type} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 18px",borderBottom:i<typeBreakdown.length-1?"1px solid "+T.border+"40":""}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:TYPE_COLORS[t.type]||T.textMuted}}/>
                  <span style={{fontSize:12,color:T.white}}>{t.type}</span>
                </div>
                <span style={{fontSize:12,fontWeight:700,color:TYPE_COLORS[t.type]||T.gold}}>{t.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User breakdown */}
        <div style={{background:T.surface,border:"1px solid "+T.border,borderRadius:12,overflow:"hidden"}}>
          <div style={{padding:"14px 18px",borderBottom:"1px solid "+T.border}}>
            <div style={{fontSize:13,fontWeight:700,color:T.white}}>Platform users</div>
          </div>
          <div>
            {[
              {label:"Total users",    value:totalUsers,   color:T.blue},
              {label:"Agents",         value:totalAgents,  color:T.gold},
              {label:"Managers",       value:totalManagers,color:T.green},
              {label:"Pending approval",value:pendingOrgs, color:T.amber},
              {label:"Suspended users",value:suspended,    color:suspended>0?T.red:T.textMuted},
            ].map((r,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 18px",borderBottom:i<4?"1px solid "+T.border+"40":""}}>
                <span style={{fontSize:12,color:T.textMuted}}>{r.label}</span>
                <span style={{fontSize:13,fontWeight:700,color:r.color,fontFamily:"'Fraunces',serif"}}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Agencies table ── */}
      <div style={{background:T.surface,border:"1px solid "+T.border,borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid "+T.border,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:13,fontWeight:700,color:T.white}}>All agencies</div>
          <div style={{fontSize:11,color:T.textMuted}}>{orgs.length} registered</div>
        </div>
        <div style={{overflowX:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 100px 100px",minWidth:600,padding:"8px 18px",fontSize:9,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.8,borderBottom:"1px solid "+T.border}}>
            {["Agency","Type","City","Owner","Registered","Status"].map((h,i)=>(<div key={i}>{h}</div>))}
          </div>
          {orgs.length===0&&<div style={{padding:"40px",textAlign:"center",fontSize:12,color:T.textMuted}}>No agencies registered yet</div>}
          {orgs.sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)).map((org,i)=>(
            <div key={org.id} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 100px 100px",minWidth:600,padding:"12px 18px",alignItems:"center",borderBottom:i<orgs.length-1?"1px solid "+T.border+"30":"",background:i%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:T.white}}>{org.name||"Unnamed"}</div>
                {org.reraNo&&<div style={{fontSize:10,color:T.textMuted}}>RERA: {org.reraNo}</div>}
              </div>
              <div style={{fontSize:11,color:TYPE_COLORS[org.type]||T.textMuted,fontWeight:600}}>{org.type||"Agency"}</div>
              <div style={{fontSize:11,color:T.textMuted}}>{org.city||"Dubai"}</div>
              <div style={{fontSize:11,color:T.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{org.ownerEmail||"—"}</div>
              <div style={{fontSize:11,color:T.textMuted}}>{fmtDate(org.createdAt)}</div>
              <div>
                <span style={{fontSize:10,padding:"3px 8px",borderRadius:8,fontWeight:700,
                  background:org.status==="active"||org.paid?"rgba(16,185,129,0.1)":org.status==="pending"?"rgba(245,158,11,0.1)":"rgba(239,68,68,0.1)",
                  color:org.status==="active"||org.paid?"#10B981":org.status==="pending"?"#F59E0B":"#EF4444"}}>
                  {org.status==="active"||org.paid?"Active":org.status==="pending"?"Pending":"Suspended"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}