/* eslint-disable */
/* DXB ANALYTICS - MAP TAB - Session 16 v2 World Class Rebuild
   Interactive map showing all 259 communities + 94 projects
   Leaflet + CARTO dark tiles */

import React from "react";
import { T } from "../data";
import { getProjectCoords } from "../utils/coordinates";

const YIELD_COLOR = y => {
  const n = parseFloat(y||0);
  if(n>=8) return "#10B981";
  if(n>=6) return "#D4A843";
  if(n>=5) return "#63B3ED";
  return "#94A3B8";
};

const SCORE_COLOR = s => {
  if(s>=80) return "#10B981";
  if(s>=70) return "#D4A843";
  if(s>=60) return "#63B3ED";
  return "#94A3B8";
};

export default function CommunityMapTab({
  activeProjects=[], liveNeighbourhoods=[],
  liveCommunityROI, setTab, seedCommunities,
  globalFilters={}, allDevelopers=[], handleTabChange
}) {
  const mapRef        = React.useRef(null);
  const mapInstanceRef= React.useRef(null);
  const markersRef    = React.useRef([]);
  const [mapLayer,    setMapLayer]    = React.useState("communities");
  const [filterYield, setFilterYield] = React.useState("all");
  const [selected,    setSelected]    = React.useState(null);
  const [mapReady,    setMapReady]    = React.useState(false);

  // Community map lookup
  const nbhdMap = React.useMemo(()=>{
    const m={};
    (liveNeighbourhoods||[]).forEach(n=>{if(n.lat&&n.lng)m[n.community]=n;});
    return m;
  },[liveNeighbourhoods]);

  const commWithCoords = React.useMemo(()=>
    (liveNeighbourhoods||[]).filter(n=>n.lat&&n.lng)
  ,[liveNeighbourhoods]);

  // Project count per community
  const projByComm = React.useMemo(()=>{
    const m={};
    (activeProjects||[]).forEach(p=>{
      const c=(p.community||"").toLowerCase();
      if(!m[c]) m[c]=[];
      m[c].push(p);
    });
    return m;
  },[activeProjects]);

  // Load Leaflet
  React.useEffect(()=>{
    if(!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id="leaflet-css"; link.rel="stylesheet";
      link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if(window.L) { setMapReady(true); return; }
    const script = document.createElement("script");
    script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload=()=>setMapReady(true);
    document.head.appendChild(script);
  },[]);

  // Init map
  React.useEffect(()=>{
    if(!mapReady||!mapRef.current||mapInstanceRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current,{
      center:[25.0,55.15], zoom:10, minZoom:8, maxZoom:18,
      zoomControl:true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{
      attribution:'CARTO',maxZoom:19,subdomains:"abcd"
    }).addTo(map);
    mapInstanceRef.current = map;
  },[mapReady]);

  // Update markers when layer/filter changes
  React.useEffect(()=>{
    if(!mapInstanceRef.current||!mapReady) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(m=>map.removeLayer(m));
    markersRef.current=[];

    if(mapLayer==="communities") {
      // Show all 259 communities as colored circles
      commWithCoords.forEach(n=>{
        const y = parseFloat(n.grossYield||0);
        if(filterYield==="8+" && y<8) return;
        if(filterYield==="6-8" && (y<6||y>=8)) return;
        if(filterYield==="<6" && y>=6) return;

        const color = YIELD_COLOR(y);
        const size  = n.tier==="verified"?14:10;

        const circle = L.circleMarker([n.lat,n.lng],{
          radius:size, fillColor:color, color:"rgba(0,0,0,0.3)",
          weight:1, fillOpacity:0.85
        });

        // Popup with community data
        const popup = `<div style="font-family:'Outfit',sans-serif;min-width:220px;padding:4px">
          <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:6px">${n.community}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
            <div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:6px 8px">
              <div style="font-size:9px;color:#64748B;text-transform:uppercase">Gross Yield</div>
              <div style="font-size:14px;font-weight:700;color:${color}">${y?y.toFixed(1)+"%":"--"}</div>
            </div>
            <div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:6px 8px">
              <div style="font-size:9px;color:#64748B;text-transform:uppercase">Score</div>
              <div style="font-size:14px;font-weight:700;color:#D4A843">${n.investmentScore||"--"}</div>
            </div>
            <div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:6px 8px">
              <div style="font-size:9px;color:#64748B;text-transform:uppercase">Avg PPSF</div>
              <div style="font-size:13px;font-weight:600;color:#D4A843">AED ${n.avgPpsf?Math.round(n.avgPpsf).toLocaleString():"--"}</div>
            </div>
            <div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:6px 8px">
              <div style="font-size:9px;color:#64748B;text-transform:uppercase">Risk</div>
              <div style="font-size:13px;font-weight:600;color:${n.supplyRisk==="Low"?"#10B981":"#F59E0B"}">${n.supplyRisk||"--"}</div>
            </div>
          </div>
          ${n.nearestMetro?`<div style="font-size:10px;color:#94A3B8;margin-bottom:4px">Metro: ${n.nearestMetro} (${n.distMetro}km)</div>`:""}
          ${n.nearestMall?`<div style="font-size:10px;color:#94A3B8;margin-bottom:4px">Mall: ${n.nearestMall} (${n.distMall}km)</div>`:""}
          <div style="font-size:9px;color:#64748B;margin-top:6px">${n.tier==="verified"?"Verified Data":"Area Data"}</div>
        </div>`;

        circle.bindPopup(popup, {
          className:"dxb-popup",
          maxWidth:280
        });
        circle.on("click",()=>setSelected(n));
        circle.addTo(map);
        markersRef.current.push(circle);
      });

    } else if(mapLayer==="projects") {
      // Show all projects as pins
      (activeProjects||[]).forEach(p=>{
        const coords = getProjectCoords(p);
        if(!coords || !coords[0] || !coords[1]) return;
        const nbhd = nbhdMap[p.community];
        const y = nbhd?.grossYield||p.grossYield||0;
        const color = YIELD_COLOR(y);

        const marker = L.circleMarker([coords[0]||coords.lat, coords[1]||coords.lng],{
          radius:8, fillColor:color, color:"#fff",
          weight:1.5, fillOpacity:0.9
        });

        const beds = Array.isArray(p.beds)&&p.beds.length?p.beds.join(", "):"";
        const units = p.unitBreakdown?Object.entries(p.unitBreakdown).map(([k,v])=>v+"\xd7"+k).join(" "):"";
        const popup = `<div style="font-family:'Outfit',sans-serif;min-width:220px;padding:4px">
          <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:2px">${p.name||"Project"}</div>
          <div style="font-size:10px;color:#94A3B8;margin-bottom:6px">${p.developerActual||p.developer||""} \u00b7 ${p.community||""}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:6px">
            ${p.priceMin?`<div style="background:rgba(212,168,67,0.08);border-radius:4px;padding:4px 6px"><div style="font-size:9px;color:#64748B">FROM</div><div style="font-size:12px;color:#D4A843;font-weight:600">AED ${(p.priceMin/1e6).toFixed(1)}M</div></div>`:""}
            ${p.grossYield?`<div style="background:rgba(16,185,129,0.08);border-radius:4px;padding:4px 6px"><div style="font-size:9px;color:#64748B">YIELD</div><div style="font-size:12px;color:#10B981;font-weight:600">${p.grossYield}%</div></div>`:""}
            ${p.totalFloors?`<div style="background:rgba(255,255,255,0.04);border-radius:4px;padding:4px 6px"><div style="font-size:9px;color:#64748B">FLOORS</div><div style="font-size:12px;color:#fff;font-weight:600">${p.totalFloors}</div></div>`:""}
            ${p.constructionPct!=null?`<div style="background:rgba(255,255,255,0.04);border-radius:4px;padding:4px 6px"><div style="font-size:9px;color:#64748B">BUILT</div><div style="font-size:12px;color:#fff;font-weight:600">${Math.round(p.constructionPct)}%</div></div>`:""}
          </div>
          ${units?`<div style="font-size:10px;color:#94A3B8;margin-bottom:3px">${units}</div>`:""}
          ${beds?`<div style="font-size:10px;color:#94A3B8;margin-bottom:3px">Beds: ${beds}</div>`:""}
          ${p.handoverQuarter?`<div style="font-size:10px;color:#63B3ED;margin-top:2px">Handover: ${p.handoverQuarter}</div>`:""}
          ${p.paymentPlan?`<div style="font-size:10px;color:#94A3B8">Payment: ${p.paymentPlan}</div>`:""}
        </div>`;

        marker.bindPopup(popup,{className:"dxb-popup",maxWidth:260});
        marker.addTo(map);
        markersRef.current.push(marker);
      });

    } else if(mapLayer==="heatmap") {
      // PPSF heat circles
      commWithCoords.forEach(n=>{
        if(!n.avgPpsf) return;
        const intensity = Math.min(n.avgPpsf/5000, 1);
        const r = Math.floor(255*intensity);
        const g = Math.floor(100*(1-intensity));
        const color = `rgb(${r},${g},50)`;
        const size = 8 + intensity*20;

        const circle = L.circleMarker([n.lat,n.lng],{
          radius:size, fillColor:color, color:"transparent",
          weight:0, fillOpacity:0.5
        });
        circle.bindPopup(`<div style="font-family:'Outfit',sans-serif;padding:4px">
          <div style="font-size:13px;font-weight:700;color:#fff">${n.community}</div>
          <div style="font-size:12px;color:#D4A843;font-weight:600">AED ${Math.round(n.avgPpsf).toLocaleString()}/sqft</div>
          ${n.dldTransactions?`<div style="font-size:10px;color:#94A3B8">${n.dldTransactions.toLocaleString()} DLD transactions</div>`:""}
        </div>`,{className:"dxb-popup"});
        circle.addTo(map);
        markersRef.current.push(circle);
      });
    }

  },[mapReady, mapLayer, filterYield, commWithCoords, activeProjects, nbhdMap]);

  const LAYERS = [
    {k:"communities", label:"Communities"},
    {k:"projects",    label:"All Projects"},
    {k:"heatmap",     label:"PPSF Heatmap"},
  ];

  const YIELD_FILTERS = [
    {k:"all",  label:"All Yields"},
    {k:"8+",   label:"8%+ Yield"},
    {k:"6-8",  label:"6-8% Yield"},
    {k:"<6",   label:"Below 6%"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 140px)",gap:0}}>
      
      {/* Toolbar */}
      <div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 0",flexWrap:"wrap"}}>
        {/* Layer selector */}
        <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.03)",border:"1px solid "+T.border,borderRadius:8,padding:3}}>
          {LAYERS.map(l=>(
            <button key={l.k} type="button" onClick={()=>setMapLayer(l.k)}
              style={{padding:"5px 12px",borderRadius:6,border:mapLayer===l.k?"1px solid "+T.gold:"1px solid transparent",background:mapLayer===l.k?"rgba(212,168,67,0.12)":"transparent",color:mapLayer===l.k?T.gold:"#94A3B8",fontSize:11,fontWeight:mapLayer===l.k?600:400,cursor:"pointer",fontFamily:"'Outfit',sans-serif",whiteSpace:"nowrap"}}>
              {l.label}
            </button>
          ))}
        </div>

        {/* Yield filter  only for communities layer */}
        {mapLayer==="communities"&&(
          <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.03)",border:"1px solid "+T.border,borderRadius:8,padding:3}}>
            {YIELD_FILTERS.map(f=>(
              <button key={f.k} type="button" onClick={()=>setFilterYield(f.k)}
                style={{padding:"5px 10px",borderRadius:6,border:filterYield===f.k?"1px solid "+T.gold:"1px solid transparent",background:filterYield===f.k?"rgba(212,168,67,0.12)":"transparent",color:filterYield===f.k?T.gold:"#94A3B8",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Legend */}
        <div style={{display:"flex",gap:10,alignItems:"center",marginLeft:"auto"}}>
          {mapLayer==="communities"&&[
            {color:"#10B981",label:"8%+ yield"},
            {color:"#D4A843",label:"6-8% yield"},
            {color:"#63B3ED",label:"5-6% yield"},
            {color:"#94A3B8",label:"<5% yield"},
          ].map((l,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:l.color}}/>
              <span style={{fontSize:10,color:"#94A3B8"}}>{l.label}</span>
            </div>
          ))}
          <span style={{fontSize:11,color:"#94A3B8",marginLeft:8}}>
            {commWithCoords.length+" communities"}
          </span>
        </div>
      </div>

      {/* Map + Sidebar */}
      <div style={{display:"flex",gap:12,flex:1,minHeight:0}}>
        {/* Map */}
        <div style={{flex:1,borderRadius:12,overflow:"hidden",border:"1px solid "+T.border,position:"relative"}}>
          {!mapReady&&(
            <div style={{position:"absolute",inset:0,background:T.surface,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1}}>
              <div style={{fontSize:13,color:"#94A3B8"}}>Loading map...</div>
            </div>
          )}
          <div ref={mapRef} style={{width:"100%",height:"100%"}}/>
          <style>{`.dxb-popup .leaflet-popup-content-wrapper{background:#0D1821;border:1px solid rgba(212,168,67,0.3);border-radius:10px;color:#fff;box-shadow:0 8px 32px rgba(0,0,0,0.5)}.dxb-popup .leaflet-popup-tip{background:#0D1821}.dxb-popup .leaflet-popup-close-button{color:#94A3B8!important}`}</style>
        </div>

        {/* Sidebar */}
        <div style={{width:280,display:"flex",flexDirection:"column",gap:8,overflowY:"auto"}}>
          {selected?(
            <div style={{background:"rgba(212,168,67,0.04)",border:"1px solid rgba(212,168,67,0.3)",borderRadius:12,padding:"16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                <div style={{fontSize:14,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif"}}>{selected.community}</div>
                <button type="button" onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:16}}>x</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
                {[
                  {label:"Yield",    value:selected.grossYield?parseFloat(selected.grossYield).toFixed(1)+"%":"--", color:YIELD_COLOR(selected.grossYield)},
                  {label:"Score",    value:(selected.investmentScore||"--")+"/100", color:"#D4A843"},
                  {label:"PPSF",     value:selected.avgPpsf?"AED "+Math.round(selected.avgPpsf).toLocaleString():"--", color:"#D4A843"},
                  {label:"Risk",     value:selected.supplyRisk||"--", color:selected.supplyRisk==="Low"?"#10B981":"#F59E0B"},
                ].map((m,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:7,padding:"7px 9px"}}>
                    <div style={{fontSize:9,color:"#64748B",textTransform:"uppercase",letterSpacing:0.7,marginBottom:2}}>{m.label}</div>
                    <div style={{fontSize:13,fontWeight:700,color:m.color}}>{m.value}</div>
                  </div>
                ))}
              </div>
              {selected.nearestMetro&&<div style={{fontSize:10,color:"#94A3B8",marginBottom:4}}>Metro: {selected.nearestMetro} ({selected.distMetro}km)</div>}
              {selected.nearestMall&&<div style={{fontSize:10,color:"#94A3B8",marginBottom:4}}>Mall: {selected.nearestMall} ({selected.distMall}km)</div>}
              {selected.nearestHospital&&<div style={{fontSize:10,color:"#94A3B8",marginBottom:8}}>Hospital: {selected.nearestHospital}</div>}
              <button type="button" onClick={()=>handleTabChange&&handleTabChange("Neighbourhoods")}
                style={{width:"100%",padding:"8px",borderRadius:8,border:"1px solid "+T.gold,background:"rgba(212,168,67,0.08)",color:T.gold,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                Full Community Profile
              </button>
            </div>
          ):(
            <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"14px"}}>
              <div style={{fontSize:12,fontWeight:600,color:T.white,marginBottom:8}}>
                {commWithCoords.length} Communities
              </div>
              <div style={{fontSize:11,color:"#94A3B8",lineHeight:1.6}}>
                "Click any circle to see community yield, PPSF, score, facilities and projects."
              </div>
              <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:4}}>
                {mapLayer==="communities"&&[
                  {color:"#10B981",label:"Large = Verified community"},
                  {color:"#94A3B8",label:"Small = DLD Registry"},
                ].map((l,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:"#94A3B8"}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:l.color,flexShrink:0}}/>
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top communities by yield */}
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid "+T.border,borderRadius:12,padding:"14px"}}>
            <div style={{fontSize:11,fontWeight:700,color:T.white,marginBottom:8}}>Top Yield Communities</div>
            {[...commWithCoords].sort((a,b)=>parseFloat(b.grossYield||0)-parseFloat(a.grossYield||0)).slice(0,8).map((n,i)=>(
              <div key={n.community} onClick={()=>{
                setSelected(n);
                if(mapInstanceRef.current) mapInstanceRef.current.setView([n.lat,n.lng],13);
              }}
                style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<7?"1px solid "+T.border+"20":"none",cursor:"pointer"}}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.8"}
                onMouseLeave={e=>e.currentTarget.style.opacity="1"}
              >
                <div style={{fontSize:11,color:T.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{n.community}</div>
                <span style={{fontSize:11,fontWeight:700,color:YIELD_COLOR(n.grossYield),marginLeft:8,flexShrink:0}}>{parseFloat(n.grossYield||0).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}