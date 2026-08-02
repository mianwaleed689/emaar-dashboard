/* eslint-disable */
/* DXB ANALYTICS - MAP TAB - Rebuilt Session 17 v2
   100% matches diagram plan:
   - 3 layers: Communities / All Projects / PPSF Heatmap
   - Search + Developer + Status filters on Projects layer
   - Yield filter on Communities layer
   - Map 70% + Sidebar 30%
   - Sidebar: selected project with full hierarchy + LAND OWNER label
   - Sidebar default: top yield list
   - Legend on map
   - MarkerCluster for projects
*/

import React from "react";
import {
  MAP_METRICS, quantileBreaks, colourFor, legendFor, coordsOf, coverage,
} from "../utils/mapScale";
import { applyMeasured, isEvidenced } from "../utils/measuredCommunity";
import { T } from "../data";

import TabIntro from "../components/TabIntro";
import TabProvenance from "../components/TabProvenance";
import { tabCopy } from "../data/tabCopy";
const YIELD_COLOR = y => {
  const n = parseFloat(y||0);
  if(n>=8) return "#10B981";
  if(n>=6) return "#D4A843";
  if(n>=5) return "#63B3ED";
  return "#94A3B8";
};

export default function CommunityMapTab({
  activeProjects=[], liveNeighbourhoods=[],
  globalFilters={}, allDevelopers=[], handleTabChange
}) {
  const _copy = tabCopy("Map");

  const mapRef         = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markersRef     = React.useRef([]);
  const clusterRef     = React.useRef(null);
  const [mapLayer,     setMapLayer]    = React.useState("communities");
  /* Defaulted to net yield — the one metric on the list that is never
     measured, since it is derived from an unpublished service charge. The
     map opened by colouring the whole of Dubai with an estimate. Price per
     square foot is counted from Land Department sales. */
  const [metricKey,    setMetricKey]   = React.useState("ppsf");
  const activeMetric = MAP_METRICS.find(m => m.key === metricKey) || MAP_METRICS[0];
  const [filterYield,  setFilterYield] = React.useState("all");
  const [search,       setSearch]      = React.useState("");
  const [filterDev,    setFilterDev]   = React.useState("All");
  const [filterStatus, setFilterStatus]= React.useState("All");
  const [selected,     setSelected]    = React.useState(null);
  const [mapReady,     setMapReady]    = React.useState(false);
  const [leafletReady, setLeafletReady]= React.useState(false);

  /* Fold in the measured Land Department figures before anything is plotted or
     coloured. The Map and the Neighbourhoods list render the same communities,
     so they have to render the same numbers — this tab read the raw stored
     fields while Neighbourhoods reads measured ones, which would have put Dubai
     Marina at 6.5% here and 5.1% there. */
  const communities = React.useMemo(
    ()=>(liveNeighbourhoods||[]).map(applyMeasured), [liveNeighbourhoods]);

  // Community lookup
  const nbhdMap = React.useMemo(()=>{
    const m={};
    communities.forEach(n=>{ if(n.lat&&n.lng) m[(n.community||"").toLowerCase()]=n; });
    return m;
  },[communities]);

  const commWithCoords = React.useMemo(()=>
    communities.filter(n=>n.lat&&n.lng&&!isNaN(n.lat)&&!isNaN(n.lng))
  ,[communities]);

  // Projects with real verified Dubai GPS only
  const projectsWithGPS = React.useMemo(()=>
    (activeProjects||[]).filter(p=>{
      const lat = parseFloat(p.lat||p.coordinates&&p.coordinates.lat||0);
      const lng = parseFloat(p.lng||p.coordinates&&p.coordinates.lng||0);
      return lat > 24.5 && lat < 25.5 && lng > 54.5 && lng < 56;
    })
  ,[activeProjects]);

  // Developer options for filter
  const devOptions = React.useMemo(()=>{
    const devs = new Set();
    projectsWithGPS.forEach(p=>{ const d=p.developerActual||p.developer||""; if(d) devs.add(d); });
    return ["All", ...[...devs].sort()];
  },[projectsWithGPS]);

  // Filtered projects
  const filteredProjects = React.useMemo(()=>{
    return projectsWithGPS.filter(p=>{
      if(search.trim()) {
        const q = search.toLowerCase();
        if(!(p.name||"").toLowerCase().includes(q) &&
           !(p.developerActual||p.developer||"").toLowerCase().includes(q) &&
           !(p.community||"").toLowerCase().includes(q)) return false;
      }
      if(filterDev!=="All") {
        if((p.developerActual||p.developer||"")!==filterDev) return false;
      }
      if(filterStatus!=="All") {
        const s = (p.status||"").toLowerCase();
        if(filterStatus==="Off-Plan" && !s.includes("off")) return false;
        if(filterStatus==="Ready" && !s.includes("ready")&&!s.includes("finish")) return false;
      }
      return true;
    });
  },[projectsWithGPS, search, filterDev, filterStatus]);

  // Load Leaflet + MarkerCluster
  React.useEffect(()=>{
    const loadScript = (src, id) => new Promise(resolve => {
      if(document.getElementById(id)||window[id]) { resolve(); return; }
      const s = document.createElement("script");
      s.src=src; s.id=id; s.onload=resolve;
      document.head.appendChild(s);
    });
    const loadCSS = (href, id) => {
      if(document.getElementById(id)) return;
      const l = document.createElement("link");
      l.rel="stylesheet"; l.href=href; l.id=id;
      document.head.appendChild(l);
    };
    loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css","leaflet-css");
    loadCSS("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css","cluster-css");
    loadCSS("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css","cluster-css2");
    loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js","leaflet-js")
      .then(()=>loadScript("https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js","cluster-js"))
      .then(()=>setLeafletReady(true));
  },[]);

  // Init map
  React.useEffect(()=>{
    if(!leafletReady||!mapRef.current||mapInstanceRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current,{
      center:[25.1,55.2], zoom:11, minZoom:8, maxZoom:18, zoomControl:true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{
      attribution:"CARTO", maxZoom:19, subdomains:"abcd"
    }).addTo(map);
    mapInstanceRef.current = map;
    setMapReady(true);
  },[leafletReady]);

  // Update markers
  React.useEffect(()=>{
    if(!mapInstanceRef.current||!mapReady) return;
    const L = window.L;
    const map = mapInstanceRef.current;
    markersRef.current.forEach(m=>{ try{map.removeLayer(m);}catch (e) { console.error("swallowed@CommunityMapTab.jsx:131", e); } });
    markersRef.current=[];
    if(clusterRef.current) { try{map.removeLayer(clusterRef.current);}catch (e) { console.error("swallowed@CommunityMapTab.jsx:133", e); } clusterRef.current=null; }

    if(mapLayer==="communities") {
      /* ── METRIC-DRIVEN LAYER WITH PROVENANCE ENCODED ────────────────────────
         Every Dubai property map plots price and draws every pin with identical
         confidence. This one paints by the metric a user chooses and, more
         importantly, distinguishes a MEASURED figure from an INHERITED one:

           solid fill   the community's number was counted from Land Department
                        records — 94 of 193
           hollow ring  a stored estimate nobody measured — the other 99

         An agent can see at a glance which parts of the city they can quote hard
         and which need a caveat. No competitor shows this, because none of them
         tracks it. */
      const breaks = quantileBreaks(commWithCoords, activeMetric);

      commWithCoords.forEach(n=>{
        const y = parseFloat(n.grossYield||0);
        if(filterYield==="8+" && y<8) return;
        if(filterYield==="6-8" && (y<6||y>=8)) return;
        if(filterYield==="<6" && y>=6) return;

        const pt = coordsOf(n);
        if(!pt) return;                       // never guess a location

        const value    = activeMetric.get(n);
        const colour   = colourFor(value, activeMetric, breaks);
        /* Was isMeasured(n), which returned true whenever a free-text `source`
           field happened to contain "dld". Now it reflects whether this
           community's figures were actually counted from transactions. */
        const measured = isEvidenced(n._ppsfEv) || isEvidenced(n._yieldEv);

        const circle = L.circleMarker([pt.lat,pt.lng],{
          radius: measured ? 11 : 9,
          fillColor: colour,
          color: measured ? "rgba(0,0,0,0.35)" : colour,
          weight: measured ? 1 : 2,
          fillOpacity: measured ? 0.9 : 0.12,   // hollow = estimate
          dashArray: measured ? null : "3,3",
        });

        const provLine = measured
          ? `<div style="font-size:10px;color:#10B981">Measured from DLD transactions</div>`
          : `<div style="font-size:10px;color:#F59E0B">Estimate${Number(n.valueSharedWith)>0
              ? ` — this figure is shared with ${n.valueSharedWith} other communit${Number(n.valueSharedWith)===1?"y":"ies"}`
              : ""}</div>`;

        circle.bindPopup(`<div style="font-family:'Outfit',sans-serif;min-width:230px;padding:4px">
          <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:2px">${n.name||n.community||n.id}</div>
          <div style="font-size:10px;color:#64748B;margin-bottom:8px">${n.kindLabel||""}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
            <div style="background:rgba(16,185,129,0.08);border-radius:6px;padding:6px 8px">
              <div style="font-size:9px;color:#64748B;margin-bottom:2px">NET YIELD</div>
              <div style="font-size:15px;font-weight:700;color:#10B981">${n.netYield?n.netYield+"%":"—"}</div>
            </div>
            <div style="background:rgba(212,168,67,0.08);border-radius:6px;padding:6px 8px">
              <div style="font-size:9px;color:#64748B;margin-bottom:2px">PRICE / SQFT</div>
              <div style="font-size:15px;font-weight:700;color:#D4A843">AED ${
                (n.medianPPSF??n.avgPpsf??n.ppsf) ? Math.round(n.medianPPSF??n.avgPpsf??n.ppsf).toLocaleString() : "—"}</div>
            </div>
          </div>
          <div style="font-size:10px;color:#94A3B8;margin-bottom:5px">Gross ${n.grossYield||"—"}% · service charge ${
            n.serviceCharge?"AED "+n.serviceCharge+"/sqft":"not recorded"}</div>
          ${provLine}
        </div>`,{className:"dxb-popup",maxWidth:290});
        circle.on("click",()=>setSelected({type:"community",...n}));
        circle.addTo(map);
        markersRef.current.push(circle);
      });

    } else if(mapLayer==="projects") {
      const cluster = L.markerClusterGroup({
        maxClusterRadius:50,
        iconCreateFunction: c => {
          const count = c.getChildCount();
          const size = count>100?44:count>20?36:28;
          return L.divIcon({
            html:`<div style="background:rgba(212,168,67,0.9);border:2px solid #D4A843;border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;color:#0F172A">${count}</div>`,
            className:"",iconSize:[size,size]
          });
        },
        spiderfyOnMaxZoom:true,showCoverageOnHover:false,zoomToBoundsOnClick:true
      });

      filteredProjects.forEach(p=>{
        const lat=parseFloat(p.lat||p.coordinates&&p.coordinates.lat||0), lng=parseFloat(p.lng||p.coordinates&&p.coordinates.lng||0);
        const color = YIELD_COLOR(p.grossYield||0);
        const icon = L.divIcon({
          html:`<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 4px rgba(0,0,0,0.5)"></div>`,
          className:"",iconSize:[12,12],iconAnchor:[6,6]
        });
        const marker = L.marker([lat,lng],{icon});
        const dev = p.developerActual||p.developer||"";
        const comm = p.community||"";
        const masterComm = p.masterCommunity&&p.masterCommunity!==comm?` — ${p.masterCommunity}`:"";
        marker.bindPopup(`<div style="font-family:'Outfit',sans-serif;min-width:230px;padding:4px">
          <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:2px">${p.name||"Project"}</div>
          <div style="font-size:10px;color:#94A3B8;margin-bottom:8px">${dev} · ${comm}${masterComm}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:6px">
            ${p.priceMin?`<div style="background:rgba(212,168,67,0.08);border-radius:4px;padding:4px 6px"><div style="font-size:9px;color:#64748B">FROM</div><div style="font-size:12px;color:#D4A843;font-weight:600">AED ${(p.priceMin/1e6).toFixed(1)}M</div></div>`:""}
            ${p.grossYield?`<div style="background:rgba(16,185,129,0.08);border-radius:4px;padding:4px 6px"><div style="font-size:9px;color:#64748B">YIELD</div><div style="font-size:12px;color:#10B981;font-weight:600">${p.grossYield}%</div></div>`:""}
            ${p.constructionPct!=null?`<div style="background:rgba(255,255,255,0.04);border-radius:4px;padding:4px 6px"><div style="font-size:9px;color:#64748B">BUILT</div><div style="font-size:12px;color:#fff;font-weight:600">${Math.round(p.constructionPct)}%</div></div>`:""}
            ${p.totalFloors?`<div style="background:rgba(255,255,255,0.04);border-radius:4px;padding:4px 6px"><div style="font-size:9px;color:#64748B">FLOORS</div><div style="font-size:12px;color:#fff;font-weight:600">${p.totalFloors}</div></div>`:""}
          </div>
          ${p.handoverQuarter?`<div style="font-size:10px;color:#63B3ED">Handover: ${p.handoverQuarter}</div>`:""}
          ${p.paymentPlan?`<div style="font-size:10px;color:#94A3B8">Payment: ${p.paymentPlan}</div>`:""}
        </div>`,{className:"dxb-popup",maxWidth:270});
        marker.on("click",()=>setSelected({type:"project",...p}));
        cluster.addLayer(marker);
      });
      map.addLayer(cluster);
      clusterRef.current=cluster;

    } else if(mapLayer==="heatmap") {
      commWithCoords.forEach(n=>{
        if(!n.avgPpsf) return;
        const intensity=Math.min(n.avgPpsf/5000,1);
        const color=`rgb(${Math.floor(255*intensity)},${Math.floor(100*(1-intensity))},50)`;
        const circle=L.circleMarker([n.lat,n.lng],{radius:8+intensity*20,fillColor:color,color:"transparent",weight:0,fillOpacity:0.5});
        circle.bindPopup(`<div style="font-family:'Outfit',sans-serif;padding:4px">
          <div style="font-size:13px;font-weight:700;color:#fff">${n.community}</div>
          <div style="font-size:12px;color:#D4A843;font-weight:600">AED ${Math.round(n.avgPpsf).toLocaleString()}/sqft</div>
          ${n.dldTransactions?`<div style="font-size:10px;color:#94A3B8">${n.dldTransactions.toLocaleString()} DLD transactions</div>`:""}
        </div>`,{className:"dxb-popup"});
        circle.addTo(map);
        markersRef.current.push(circle);
      });
    }
    /* activeMetric belongs here: without it, switching the metric leaves the
       pins painted by the previous one and the legend disagrees with the map. */
  },[mapReady, mapLayer, filterYield, commWithCoords, filteredProjects, activeMetric]);

  const Btn = ({active,onClick,children,title}) => (
    <button type="button" onClick={onClick} title={title} style={{
      padding:"5px 12px",borderRadius:6,
      border:active?`1px solid ${T.gold}`:"1px solid transparent",
      background:active?"rgba(212,168,67,0.12)":"transparent",
      color:active?T.gold:"#94A3B8",fontSize:11,fontWeight:active?600:400,
      cursor:"pointer",fontFamily:"'Outfit',sans-serif",whiteSpace:"nowrap"
    }}>{children}</button>
  );

  const Select = ({value,onChange,options,style={}}) => (
    <select value={value} onChange={e=>onChange(e.target.value)} style={{
      background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,
      borderRadius:8,padding:"5px 10px",color:T.white,fontSize:11,
      fontFamily:"'Outfit',sans-serif",cursor:"pointer",outline:"none",...style
    }}>
      {options.map(o=><option key={o} value={o} style={{background:"#1E293B"}}>{o}</option>)}
    </select>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 140px)",gap:0}}>
      {_copy && <TabIntro title={_copy.title} what={_copy.what} detail={_copy.detail} includes={_copy.includes} excludes={_copy.excludes} warning={_copy.warning} />}


      {/* Toolbar */}
      <div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0",flexWrap:"wrap"}}>
        {/* Layer buttons */}
        <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:8,padding:3}}>
          {[{k:"communities",label:"Communities"},{k:"projects",label:"All Projects"},{k:"heatmap",label:"PPSF Heatmap"}]
            .map(l=><Btn key={l.k} active={mapLayer===l.k} onClick={()=>setMapLayer(l.k)}>{l.label}</Btn>)}
        </div>

        {/* Communities: yield filter */}
        {mapLayer==="communities"&&(
          <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:8,padding:3}}>
            {[{k:"all",label:"All Yields"},{k:"8+",label:"8%+ Yield"},{k:"6-8",label:"6-8% Yield"},{k:"<6",label:"Below 6%"}]
              .map(f=><Btn key={f.k} active={filterYield===f.k} onClick={()=>setFilterYield(f.k)}>{f.label}</Btn>)}
          </div>
        )}

        {/* Projects: search + developer + status filters */}
        {mapLayer==="projects"&&(<>
          <input type="text" placeholder="Search project, developer, community..."
            value={search} onChange={e=>setSearch(e.target.value)}
            style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${T.border}`,borderRadius:8,
              padding:"6px 12px",color:T.white,fontSize:11,fontFamily:"'Outfit',sans-serif",width:240,outline:"none"}}/>
          <Select value={filterDev} onChange={setFilterDev}
            options={["All",...new Set((activeProjects||[]).map(p=>p.developerActual||p.developer||"").filter(Boolean).sort())].slice(0,100)}/>
          <Select value={filterStatus} onChange={setFilterStatus} options={["All","Off-Plan","Ready"]}/>
        </>)}

        {/* Metric selector — what the map is painted by. Every other Dubai map
            plots price and only price. */}
        {mapLayer==="communities"&&(
          <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:8,padding:3}}>
            {MAP_METRICS.map(m=>(
              <Btn key={m.key} active={metricKey===m.key} onClick={()=>setMetricKey(m.key)}
                title={m.evidenced
                  ? m.hint+" — counted from Land Department records."
                  : m.hint+" — ESTIMATE. No source publishes this per community."}>
                {m.label}{m.evidenced===false&&<span style={{fontSize:8,marginLeft:4,opacity:0.75}}>EST</span>}
              </Btn>
            ))}
          </div>
        )}

        <span style={{fontSize:10,color:T.textMuted,marginLeft:"auto"}}>
          {mapLayer==="projects"?`${filteredProjects.length.toLocaleString()} projects`:`${commWithCoords.length} communities`}
        </span>
      </div>

      {/* ── LEGEND ──────────────────────────────────────────────────────────
          Quantile bands with the count in each, because a legend that shows
          colours without distribution tells a reader what the colours mean but
          not what the city looks like. Plus the provenance key, which is the
          part no competitor has: solid pins are measured, hollow ones inherited. */}
      {mapLayer==="communities"&&(()=>{
        const breaks = quantileBreaks(commWithCoords, activeMetric);
        const rows   = legendFor(commWithCoords, activeMetric, breaks);
        const cov    = coverage(commWithCoords);
        if(!rows.length) return null;
        return (
          <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap",padding:"6px 2px 10px"}}>
            <span style={{fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.6}}>
              {activeMetric.label}
            </span>
            {rows.map((r,i)=>(
              <div key={i} title={`${r.count} communities`} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:11,height:11,borderRadius:3,background:r.colour}}/>
                <span style={{fontSize:10,color:T.textSecondary}}>{r.label}</span>
                <span style={{fontSize:9,color:T.textMuted}}>({r.count})</span>
              </div>
            ))}
            <span style={{width:1,height:16,background:T.border}}/>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:11,height:11,borderRadius:"50%",background:"#94A3B8"}}/>
              <span style={{fontSize:10,color:T.textSecondary}}>Measured ({cov.measured})</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:11,height:11,borderRadius:"50%",border:"2px dashed #94A3B8"}}/>
              <span style={{fontSize:10,color:T.textSecondary}}>Estimate ({cov.estimated})</span>
            </div>
            <span style={{fontSize:9.5,color:T.textMuted,flex:"1 1 240px",lineHeight:1.5}}>
              {activeMetric.hint}. An estimate is an area-level figure applied to a
              community rather than measured in it — quote it with a caveat.
            </span>
          </div>
        );
      })()}

      {/* Map + Sidebar */}
      <div style={{display:"flex",flex:1,gap:12,minHeight:0}}>

        {/* Map — 70% */}
        <div style={{flex:"0 0 70%",position:"relative",borderRadius:12,overflow:"hidden",border:`1px solid ${T.border}`}}>
          <div ref={mapRef} style={{width:"100%",height:"100%"}}/>
          {!leafletReady&&(
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(15,23,42,0.9)"}}>
              <div style={{color:T.textMuted,fontSize:13,fontFamily:"'Outfit',sans-serif"}}>Loading map...</div>
            </div>
          )}
        </div>

        {/* Sidebar — 30% */}
        <div style={{flex:"0 0 30%",overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>

          {selected ? (
            <>
              {/* Header */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:10,fontWeight:700,color:T.textMuted,letterSpacing:0.8,textTransform:"uppercase"}}>
                  {selected.type==="project"?"Selected Project":"Community Detail"}
                </div>
                <button type="button" onClick={()=>setSelected(null)}
                  style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:18,padding:"0 4px",lineHeight:1}}>×</button>
              </div>

              {selected.type==="project" ? (
                <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:16}}>
                  {/* Developer hierarchy */}
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,color:T.textMuted,marginBottom:2,textTransform:"uppercase",letterSpacing:0.8}}>Project Developer</div>
                    <div style={{fontSize:14,fontWeight:700,color:T.white}}>{selected.developerActual||selected.developer||"—"}</div>
                    {selected.masterDeveloper&&selected.masterDeveloper!==(selected.developerActual||selected.developer)&&(
                      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
                        <span style={{fontSize:9,fontWeight:700,color:T.gold,background:"rgba(212,168,67,0.12)",padding:"2px 6px",borderRadius:4}}>LAND OWNER</span>
                        <span style={{fontSize:11,color:T.textMuted}}>{selected.masterDeveloper}</span>
                      </div>
                    )}
                  </div>

                  {/* Project name */}
                  <div style={{fontSize:18,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif",marginBottom:4,lineHeight:1.2}}>{selected.name}</div>

                  {/* Community hierarchy */}
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:12,color:T.textSecondary}}>{selected.community||"—"}</div>
                    {selected.masterCommunity&&selected.masterCommunity!==selected.community&&(
                      <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                        <span style={{fontSize:9,fontWeight:700,color:"#63B3ED",background:"rgba(99,179,237,0.1)",padding:"2px 6px",borderRadius:4}}>MASTER ZONE</span>
                        <span style={{fontSize:11,color:T.textMuted}}>{selected.masterCommunity}</span>
                      </div>
                    )}
                  </div>

                  {/* Key metrics */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {[
                      {label:"FROM",value:selected.priceMin?`AED ${(selected.priceMin/1e6).toFixed(1)}M`:null,color:T.gold},
                      {label:"YIELD",value:selected.grossYield?`${selected.grossYield}%`:null,color:"#10B981"},
                      {label:"PAYMENT",value:selected.paymentPlan,color:T.white},
                      {label:"BUILT",value:selected.constructionPct!=null?`${Math.round(selected.constructionPct)}%`:null,color:T.white},
                      {label:"PPSF",value:selected.pricePerSqft?`AED ${Math.round(selected.pricePerSqft).toLocaleString()}`:null,color:T.gold},
                      {label:"HANDOVER",value:selected.handoverQuarter,color:"#63B3ED"},
                    ].filter(x=>x.value).map((x,i)=>(
                      <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 10px"}}>
                        <div style={{fontSize:9,color:"#64748B",marginBottom:2}}>{x.label}</div>
                        <div style={{fontSize:13,fontWeight:700,color:x.color}}>{x.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Beds */}
                  {Array.isArray(selected.beds)&&selected.beds.length>0&&(
                    <div style={{fontSize:11,color:T.textMuted,marginBottom:6}}>
                      <span style={{color:T.textSecondary}}>Beds: </span>{selected.beds.join(", ")}
                    </div>
                  )}
                  {selected.totalFloors&&(
                    <div style={{fontSize:11,color:T.textMuted,marginBottom:6}}>
                      <span style={{color:T.textSecondary}}>Floors: </span>{selected.totalFloors}
                    </div>
                  )}

                  {/* DLD badge */}
                  {selected.projectNumber&&(
                    <div style={{marginTop:8,padding:"6px 10px",background:"rgba(212,168,67,0.06)",borderRadius:8,border:"1px solid rgba(212,168,67,0.15)"}}>
                      <span style={{fontSize:10,color:T.textMuted}}>DLD #{selected.projectNumber} · </span>
                      <span style={{fontSize:10,color:T.gold}}>DLD Verified</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Community detail */
                <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:16}}>
                  <div style={{fontSize:18,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif",marginBottom:12}}>{selected.community}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {[
                      {label:"GROSS YIELD",value:selected.grossYield?`${selected.grossYield}%`:null,color:"#10B981"},
                      {label:"AVG PPSF",value:selected.avgPpsf?`AED ${Math.round(selected.avgPpsf).toLocaleString()}`:null,color:T.gold},
                      {label:"DXB SCORE",value:selected.score,color:"#63B3ED"},
                      {label:"PROJECTS",value:selected.projectCount,color:T.white},
                    ].filter(x=>x.value).map((x,i)=>(
                      <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:8,padding:"8px 10px"}}>
                        <div style={{fontSize:9,color:"#64748B",marginBottom:2}}>{x.label}</div>
                        <div style={{fontSize:13,fontWeight:700,color:x.color}}>{x.value}</div>
                      </div>
                    ))}
                  </div>
                  {selected.dldTransactions&&(
                    <div style={{fontSize:11,color:T.textMuted}}>{selected.dldTransactions.toLocaleString()} DLD transactions</div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Default: top yield list */
            <>
              <div style={{fontSize:10,fontWeight:700,color:T.textMuted,letterSpacing:0.8,textTransform:"uppercase"}}>
                {mapLayer==="projects"?"Top Yield Projects":"Top Yield Communities"}
              </div>
              {mapLayer==="projects" ? (
                (activeProjects||[])
                  /* Coordinates live in two shapes: 1,621 projects have flat
                     lat/lng, 105 have only coordinates.lat/lng. Filtering on
                     p.lat alone silently dropped those 105 from this list while
                     the map itself (which checks both, lines 56 and 180) still
                     plotted them — so a pin could be on the map but missing from
                     the Top Yield list beside it. */
                  .filter(p=>p.grossYield&&(p.lat||p.coordinates&&p.coordinates.lat)&&(p.lng||p.coordinates&&p.coordinates.lng))
                  .sort((a,b)=>parseFloat(b.grossYield)-parseFloat(a.grossYield))
                  .slice(0,15)
                  .map((p,i)=>(
                    <div key={i} onClick={()=>setSelected({type:"project",...p})}
                      style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",cursor:"pointer",transition:"border-color 0.2s"}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=T.gold}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{fontSize:12,fontWeight:600,color:T.white,flex:1,marginRight:8,lineHeight:1.3}}>{p.name}</div>
                        <div style={{fontSize:13,fontWeight:700,color:"#10B981",flexShrink:0}}>{p.grossYield}%</div>
                      </div>
                      <div style={{fontSize:10,color:T.textMuted,marginTop:2}}>{p.developerActual||p.developer} · {p.community}</div>
                      {p.priceMin&&<div style={{fontSize:10,color:T.gold,marginTop:2}}>From AED {(p.priceMin/1e6).toFixed(1)}M</div>}
                    </div>
                  ))
              ) : (
                /* ── RANK ONLY WHAT WAS MEASURED ──────────────────────────
                   This ranked every community by grossYield regardless of where
                   the number came from, so the top of the most prominent list on
                   the tab read "Dubai Investment Park 9.0%, Green Community 9.0%,
                   International City 9.0%" — three identical figures, none of
                   them measured. They are the old assigned values, and putting
                   them at the top presented a guess as the best opportunity in
                   Dubai. Estimates still appear on the map as hollow pins; they
                   just no longer win a ranking they were never measured for. */
                commWithCoords
                  .filter(n=>n.grossYield && isEvidenced(n._yieldEv))
                  .sort((a,b)=>parseFloat(b.grossYield)-parseFloat(a.grossYield))
                  .slice(0,15)
                  .map((n,i)=>(
                    <div key={i} onClick={()=>setSelected({type:"community",...n})}
                      style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 12px",cursor:"pointer",transition:"border-color 0.2s"}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=T.gold}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{fontSize:12,fontWeight:600,color:T.white}}>{n.community}</div>
                        <div style={{fontSize:13,fontWeight:700,color:"#10B981"}}>{n.grossYield}%</div>
                      </div>
                      {n.avgPpsf&&<div style={{fontSize:10,color:T.textMuted,marginTop:2}}>AED {Math.round(n.avgPpsf).toLocaleString()}/sqft</div>}
                      {n.score&&<div style={{fontSize:10,color:"#63B3ED",marginTop:1}}>Score {n.score}</div>}
                    </div>
                  ))
              )}
            </>
          )}
        </div>
      </div>
      {_copy?.provenance && <TabProvenance {..._copy.provenance} />}

    </div>
  );
}
