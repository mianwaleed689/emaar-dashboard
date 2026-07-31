/* eslint-disable */
/* DXB ANALYTICS - INVESTMENT SCORE TAB - Session 15
   Real scores from neighbourhoodScores  DLD data powered */

import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { T } from "../data";
import SourceList from "../components/SourceList";
import { scoreCommunity, scoreBand, SCORE_WEIGHTS } from "../utils/investmentScore";

/* ── WHY THE STORED SCORE IS NO LONGER USED ─────────────────────────────────
   This tab used to rank on the `investmentScore` field written into Firestore.
   Different import scripts wrote that field with different formulas, so the
   number was not comparable between rows. Measured across the 281 cached
   community records, the 51 tagged `research-verified-2026` averaged 79.9
   while the 198 tagged `communities` averaged 55.7 — on near-identical gross
   yields of 6.75% and 6.55%.

   The effect on a ranked table: 39 of the top 50 came from that 51-record
   batch, and none of the bottom 50 did. An agent sorting by score and reading
   the top of the list to a client was reading an artefact of the import
   pipeline.

   And this footer published a THIRD formula — "25% DLD Liquidity" — that
   neither writer used.

   Now computed in the browser from the underlying fields via one formula, so
   every community is scored identically regardless of which script created it.
   scripts/verify-investment-score.js measures that the bias is gone: the
   over-represented batch now holds 10 of the top 50, against the ~9 an even
   split predicts. */

const INVESTMENT_SCORE_SOURCES = [
  { title: "Dubai Land Department — transaction and price open data",
    url: "https://dubailand.gov.ae/en/open-data/real-estate-data/",
    publisher: "Dubai Land Department",
    note: "yields, prices and transaction counts behind the score" },
];

const fmtY = n => n ? parseFloat(n).toFixed(1)+"%" : "--";
const fmtP = n => n ? "AED "+Math.round(n).toLocaleString() : "--";

const scoreColor = s => scoreBand(s).color;
const scoreLabel = s => scoreBand(s).label;

export default function InvestmentScoreTab({ liveNeighbourhoods=[], handleTabChange, globalFilters={} }) {
  const [search,   setSearch]   = useState("");
  const [sortBy,   setSortBy]   = useState("score");
  const [minScore, setMinScore] = useState("all");
  const [gvOnly,   setGvOnly]   = useState(false);
  const [selected, setSelected] = useState(null);

  /* Each community carries its computed result on `_s`. A community without
     enough inputs to score returns null and is left out rather than ranked on a
     number assembled from two or three fields. */
  const withScore = useMemo(() =>
    (liveNeighbourhoods||[])
      .map(n => ({ ...n, _s: scoreCommunity(n) }))
      .filter(n => n._s)
  , [liveNeighbourhoods]);

  const unscorable = (liveNeighbourhoods||[]).length - withScore.length;

  const filtered = useMemo(() => {
    let a = [...withScore];
    if(search.trim()) a = a.filter(n=>(n.community||"").toLowerCase().includes(search.toLowerCase()));
    if(minScore==="80") a = a.filter(n=>n._s.score>=80);
    if(minScore==="70") a = a.filter(n=>n._s.score>=70);
    if(minScore==="60") a = a.filter(n=>n._s.score>=60);
    if(gvOnly) a = a.filter(n=>n.goldenVisa);
    a.sort((x,y)=>{
      if(sortBy==="score")  return y._s.score-x._s.score;
      if(sortBy==="yield")  return parseFloat(y.grossYield||0)-parseFloat(x.grossYield||0);
      if(sortBy==="liquid") return (y.dldTransactions||0)-(x.dldTransactions||0);
      if(sortBy==="name")   return (x.community||"").localeCompare(y.community||"");
      return 0;
    });
    return a;
  }, [withScore,search,sortBy,minScore,gvOnly]);

  const avgScore  = withScore.length ? Math.round(withScore.reduce((s,n)=>s+n._s.score,0)/withScore.length) : 0;
  const excellent = withScore.filter(n=>n._s.score>=80).length;
  const good      = withScore.filter(n=>n._s.score>=70&&n._s.score<80).length;
  const topComm   = [...withScore].sort((a,b)=>b._s.score-a._s.score)[0];

  const chartData = filtered.slice(0,12).map(n=>({
    name: (n.community||"").length>10?(n.community||"").substring(0,10)+"...":n.community,
    score: n._s.score,
    fill: scoreColor(n._s.score),
  }));

  const selStyle = {padding:"6px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid "+T.border,borderRadius:7,color:"#CBD5E1",fontSize:11,outline:"none",fontFamily:"'Outfit',sans-serif"};

  return (
    <div style={{paddingBottom:60}}>
      <div style={{marginBottom:16}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:900,color:T.white,fontFamily:"'Fraunces',serif"}}>Investment Score</h2>
        <p style={{margin:"4px 0 0",fontSize:12,color:"#94A3B8"}}>
          {withScore.length} communities scored  ·  6 factors, weights shown below
          {unscorable > 0 ? `  ·  ${unscorable} not scored — too little data` : ""}
        </p>
      </div>

      {/* ── WHAT THIS SCORE IS ───────────────────────────────────────────
          Same standard as the Risk tab: the inputs are measured, the weighting
          is ours. An agent about to say "this community scores 82" needs to
          know which half is which before a client asks. */}
      <div style={{padding:"11px 15px",marginBottom:14,borderRadius:10,background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.25)"}}>
        <div style={{fontSize:11,fontWeight:700,color:"#60A5FA",marginBottom:5}}>Derived from measured data — the weighting is our judgement</div>
        <div style={{fontSize:10.5,color:"#94A3B8",lineHeight:1.6}}>
          Every input below is real: DLD yields, prices, supply risk, metro distance. How they are
          weighted against each other is our editorial call, stated in full at the foot of this page,
          and nothing here is calibrated against realised investor returns. Use the score to shortlist
          communities, then open the breakdown to see which factor actually carried it.
        </div>
      </div>

      {/* ── EMPTY STATE ────────────────────────────────────────────────── */}
      {withScore.length === 0 && (
        <div style={{padding:"14px 16px",marginBottom:16,borderRadius:12,background:"rgba(100,116,139,0.08)",border:"1px solid rgba(100,116,139,0.28)"}}>
          <div style={{fontSize:12,fontWeight:700,color:T.white,marginBottom:5}}>No communities could be scored</div>
          <div style={{fontSize:11,color:"#94A3B8",lineHeight:1.7}}>
            {(liveNeighbourhoods||[]).length === 0
              ? "Community data has not reached the app. Reload the page; if the table stays empty, community data is not loading."
              : `${(liveNeighbourhoods||[]).length} communities loaded, but none carries enough of the six factors to be ranked honestly.`}
            {" "}An empty table here means missing data, not that no community is worth buying in.
          </div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        {[
          {label:"Avg Score",      value:avgScore+"/100",    color:scoreColor(avgScore)},
          {label:"Excellent 80+",  value:excellent+" areas", color:"#10B981"},
          {label:"Good 70+",       value:good+" areas",      color:"#84CC16"},
          {label:"Top Community",  value:topComm?.community||"--", color:T.gold},
        ].map((k,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"14px 16px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:k.color}}/>
            <div style={{fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,marginBottom:4}}>{k.label}</div>
            <div style={{fontSize:16,fontWeight:900,color:k.color,fontFamily:"'Fraunces',serif"}}>{k.value}</div>
          </div>
        ))}
      </div>

      {chartData.length>0&&(
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"16px",marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:T.white,marginBottom:12}}>Top 12 Investment Score Rankings</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{top:5,right:10,left:-20,bottom:35}}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:8,fill:"#64748B"}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fontSize:9,fill:"#64748B"}} domain={[0,100]}/>
              <Tooltip contentStyle={{background:T.surface,border:"1px solid "+T.border,borderRadius:8,fontSize:11}} formatter={v=>[v+"/100","Score"]}/>
              <Bar dataKey="score" radius={[3,3,0,0]}>
                {chartData.map((d,i)=>(
                  <Cell key={i} fill={d.fill}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
        <div style={{flex:"1 1 200px",display:"flex",alignItems:"center",gap:8,padding:"7px 12px",background:"rgba(255,255,255,0.03)",border:"1px solid "+(search?T.gold:T.border),borderRadius:8}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search community..." style={{flex:1,background:"none",border:"none",outline:"none",color:T.white,fontSize:12,fontFamily:"'Outfit',sans-serif"}}/>
          {search&&<button type="button" onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14}}>x</button>}
        </div>
        <select value={minScore} onChange={e=>setMinScore(e.target.value)} style={selStyle}>
          <option value="all">All Scores</option>
          <option value="80">80+ Excellent</option>
          <option value="70">70+ Good</option>
          <option value="60">60+ Average</option>
        </select>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={selStyle}>
          <option value="score">Highest Score</option>
          <option value="yield">Highest Yield</option>
          <option value="liquid">Most Liquid</option>
          <option value="name">A - Z</option>
        </select>
        <button type="button" onClick={()=>setGvOnly(v=>!v)} style={{padding:"6px 12px",borderRadius:7,border:"1px solid "+(gvOnly?T.gold:T.border),background:gvOnly?"rgba(212,168,67,0.1)":"rgba(255,255,255,0.03)",color:gvOnly?T.gold:"#94A3B8",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Golden Visa</button>
        <span style={{fontSize:11,color:"#94A3B8",marginLeft:"auto"}}>{filtered.length} communities</span>
      </div>

      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:14,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:"28px 2fr 70px 80px 80px 90px 80px",padding:"10px 16px",fontSize:9,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:0.8,borderBottom:"1px solid "+T.border,background:"rgba(255,255,255,0.02)"}}>
          {["#","Community","Score","Grade","Yield","Transactions","PPSF"].map((h,i)=>(
            <div key={i} style={{textAlign:i>1?"center":"left"}}>{h}</div>
          ))}
        </div>
        {filtered.slice(0,100).map((n,i)=>(
          <div key={n.community||i} onClick={()=>setSelected(selected?.community===n.community?null:n)}
            style={{display:"grid",gridTemplateColumns:"28px 2fr 70px 80px 80px 90px 80px",padding:"11px 16px",alignItems:"center",borderBottom:i<filtered.length-1?"1px solid "+T.border+"30":"none",cursor:"pointer",background:selected?.community===n.community?"rgba(212,168,67,0.04)":"transparent"}}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(212,168,67,0.03)"}
            onMouseLeave={e=>e.currentTarget.style.background=selected?.community===n.community?"rgba(212,168,67,0.04)":"transparent"}
          >
            <div style={{fontSize:10,color:"#64748B",fontWeight:600}}>{i+1}</div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:T.white}}>{n.community}</div>
              <div style={{display:"flex",gap:4,marginTop:2}}>
                {n.tier==="verified"&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(16,185,129,0.12)",color:"#10B981",fontWeight:600}}>Verified</span>}
                {n.goldenVisa&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(212,168,67,0.12)",color:T.gold,fontWeight:600}}>GV</span>}
                {n.hasMetro&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(16,185,129,0.1)",color:"#10B981",fontWeight:600}}>Metro</span>}
              </div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:scoreColor(n._s.score)+"18",border:"2px solid "+scoreColor(n._s.score),display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{fontSize:11,fontWeight:800,color:scoreColor(n._s.score),fontFamily:"'Fraunces',serif"}}>{n._s.score}</span>
              </div>
              {/* Thin evidence is shown, not hidden behind a confident number. */}
              {n._s.coverage < 1 && (
                <div style={{fontSize:8,color:"#64748B",marginTop:2}}>{n._s.scoredOn}/{n._s.totalComponents} factors</div>
              )}
            </div>
            <div style={{textAlign:"center",fontSize:10,fontWeight:600,color:scoreColor(n._s.score)}}>{scoreLabel(n._s.score)}</div>
            <div style={{textAlign:"center",fontSize:12,fontWeight:700,color:parseFloat(n.grossYield||0)>=7?"#10B981":T.gold}}>{fmtY(n.grossYield)}</div>
            <div style={{textAlign:"center",fontSize:11,color:"#94A3B8"}}>{n.dldTransactions?n.dldTransactions.toLocaleString():"--"}</div>
            <div style={{textAlign:"center",fontSize:11,color:T.gold}}>{n.avgPpsf?"AED "+Math.round(n.avgPpsf).toLocaleString():"--"}</div>
          </div>
        ))}
      </div>

      {selected&&(
        <div style={{marginTop:12,background:"rgba(212,168,67,0.04)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:14,padding:"20px"}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
            <div>
              <div style={{fontSize:18,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif"}}>{selected.community}</div>
              <div style={{fontSize:11,color:"#94A3B8",marginTop:2}}>
                Scored on {selected._s.scoredOn} of {selected._s.totalComponents} factors
                {selected._s.missing.length ? ` — no data for ${selected._s.missing.map(k=>SCORE_WEIGHTS[k].label.toLowerCase()).join(", ")}` : ""}
              </div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <button type="button" onClick={()=>handleTabChange&&handleTabChange("Neighbourhoods")} style={{padding:"8px 14px",borderRadius:8,border:"1px solid "+T.gold,background:"rgba(212,168,67,0.08)",color:T.gold,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Full Profile</button>
              <button type="button" onClick={()=>setSelected(null)} style={{background:"rgba(255,255,255,0.06)",border:"1px solid "+T.border,borderRadius:8,color:"#94A3B8",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>x</button>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
            {[
              {label:"Score",       value:selected._s.score+"/100", color:scoreColor(selected._s.score)},
              {label:"Gross Yield", value:fmtY(selected.grossYield),       color:"#10B981"},
              {label:"DLD Txns",    value:selected.dldTransactions?selected.dldTransactions.toLocaleString():"--", color:"#94A3B8"},
              {label:"Avg PPSF",    value:fmtP(selected.avgPpsf),          color:T.gold},
              {label:"Supply Risk", value:selected.supplyRisk||"--",       color:selected.supplyRisk==="Low"?"#10B981":"#F59E0B"},
            ].map((m,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:3}}>{m.label}</div>
                <div style={{fontSize:13,fontWeight:700,color:m.color,fontFamily:"'Fraunces',serif"}}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* ── HOW THIS SCORE WAS REACHED ────────────────────────────────
              The whole argument for keeping a composite at all is that the
              reasoning is inspectable. If an agent cannot see which factor
              carried the score, it is just a number with a colour. */}
          <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#94A3B8",textTransform:"uppercase",letterSpacing:0.7,marginBottom:8}}>
              How this score was reached
            </div>
            {selected._s.components.map(c=>(
              <div key={c.key} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,opacity:c.available?1:0.45}}>
                <div style={{width:130,fontSize:11,color:"#CBD5E1"}}>{c.label}</div>
                <div style={{flex:1,height:6,borderRadius:3,background:"rgba(255,255,255,0.06)",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${c.available?(c.earned/c.max)*100:0}%`,background:c.available?T.gold:"#475569",borderRadius:3}}/>
                </div>
                <div style={{width:52,textAlign:"right",fontSize:10,fontWeight:700,color:c.available?T.gold:"#64748B"}}>
                  {c.available?`${c.earned}/${c.max}`:"no data"}
                </div>
                <div style={{width:170,fontSize:10,color:"#64748B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.detail}</div>
              </div>
            ))}
            <div style={{fontSize:10,color:"#64748B",marginTop:8,lineHeight:1.6}}>
              Factors with no data are excluded and the total is rescaled, so a community is not
              penalised for a gap in our records — the "{selected._s.scoredOn} of {selected._s.totalComponents} factors"
              note is how thin evidence stays visible.
            </div>
          </div>
        </div>
      )}

      {/* Weights, read from the formula itself rather than typed alongside it —
          the old footer listed a third set of weights that no code used. */}
      <div style={{marginTop:16,paddingTop:12,borderTop:"1px solid "+T.border}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:10}}>
          <span style={{fontSize:10,color:"#64748B"}}>Score formula — computed here, not stored:</span>
          {Object.entries(SCORE_WEIGHTS).map(([k,w])=>(
            <span key={k} title={w.why} style={{fontSize:10,color:"#64748B",padding:"2px 8px",borderRadius:8,border:"1px solid rgba(255,255,255,0.06)"}}>{w.max}% {w.label}</span>
          ))}
        </div>
        <SourceList sources={INVESTMENT_SCORE_SOURCES} />
      </div>
    </div>
  );
}