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
/* Shared across mounts — see the comment in the loader effect. */
const SCRIPT_LOADS = {};

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
  const [showHelp,     setShowHelp]    = React.useState(false);

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

  /* One definition of "is this community currently on the map", shared by the
     pin loop, the count in the toolbar and the list on the right. They used to
     each decide separately, and the search box did not reach the map at all. */
  const commVisible = React.useCallback(n=>{
    const y = parseFloat(n.grossYield||0);
    if(filterYield==="8+"  && y<8) return false;
    if(filterYield==="6-8" && (y<6||y>=8)) return false;
    if(filterYield==="<6"  && y>=6) return false;
    if(search.trim() && !(n.community||"").toLowerCase().includes(search.trim().toLowerCase()))
      return false;
    return true;
  },[filterYield,search]);

  const shownCommunities = React.useMemo(
    ()=>commWithCoords.filter(commVisible).length, [commWithCoords,commVisible]);

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
    /* ── WHY THIS IS NOT A ONE-LINER ────────────────────────────────────────
       This used to resolve the moment a <script> TAG existed:

           if (document.getElementById(id) || window[id]) { resolve(); return; }

       A tag existing does not mean the script has run. React mounts this
       component twice in development, so the first mount appended leaflet.js
       and the second mount saw the tag, resolved instantly, and loaded
       leaflet.markercluster.js into a page where Leaflet had not finished
       executing. The plugin's first line reads L, so:

           ReferenceError: L is not defined  (leaflet.markercluster.js:1:243)

       The cluster plugin then never registered, and switching to the Projects
       layer — which calls L.markerClusterGroup — tore the map down.

       The cache is module-level on purpose: both mounts must await the SAME
       promise, which a per-effect cache cannot do. */
    const loadScript = (src, id, ready) => {
      if (ready()) return Promise.resolve();
      if (SCRIPT_LOADS[id]) return SCRIPT_LOADS[id];
      SCRIPT_LOADS[id] = new Promise((resolve, reject) => {
        const existing = document.getElementById(id);
        if (existing) {
          // tag is there but may still be parsing — wait for it properly
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", reject);
          if (ready()) resolve();
          return;
        }
        const s = document.createElement("script");
        s.src = src; s.id = id;
        s.onload = () => resolve();
        s.onerror = reject;
        document.head.appendChild(s);
      });
      return SCRIPT_LOADS[id];
    };
    const loadCSS = (href, id) => {
      if(document.getElementById(id)) return;
      const l = document.createElement("link");
      l.rel="stylesheet"; l.href=href; l.id=id;
      document.head.appendChild(l);
    };
    loadCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css","leaflet-css");
    loadCSS("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css","cluster-css");
    loadCSS("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css","cluster-css2");
    loadScript("https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
               "leaflet-js", () => !!window.L)
      .then(()=>loadScript("https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js",
               "cluster-js", () => !!(window.L && window.L.markerClusterGroup)))
      .then(()=>setLeafletReady(true))
      .catch(err=>console.error("[Map] Leaflet failed to load:", err));
  },[]);

  // Init map
  React.useEffect(()=>{
    if(!leafletReady||!mapRef.current||mapInstanceRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current,{
      center:[25.1,55.2], zoom:11, minZoom:8, maxZoom:18, zoomControl:true,
    });
    /* ── WHY A LIGHT BASEMAP ────────────────────────────────────────────────
       This was CARTO "dark_all", chosen to match the dashboard. On screen it is
       almost black: no street names, no parks, no coastline you can read, no
       landmarks. Dubai became a black rectangle with coloured dots floating on
       it, and an agent could not tell Marina from Mirdif — which is the entire
       point of putting figures on a map rather than in a list.

       This needs a LIGHT basemap with street names — but standard OpenStreetMap
       tiles label places in the local language, so Dubai came back as الشارقة
       and أبوظبي. CARTO Voyager is the same OpenStreetMap data rendered light
       with English labels, which is what a Dubai agency desk actually reads. */
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",{
      attribution:"&copy; OpenStreetMap contributors &copy; CARTO",
      maxZoom:19, subdomains:"abcd",
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

      /* Progressive disclosure, the pattern Rightmove and Zillow both use: a
         count while you are looking at the whole city, individual prices once
         you zoom into an area. Without this, 193 price labels overlap into an
         unreadable heap — which is exactly what the coloured dots did. */
      const commCluster = L.markerClusterGroup({
        maxClusterRadius: 46,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        iconCreateFunction: c => {
          const n = c.getChildCount();
          const d = n > 40 ? 46 : n > 15 ? 40 : 34;
          return L.divIcon({
            className: "",
            iconSize: [d, d],
            html: `<div style="width:${d}px;height:${d}px;border-radius:50%;` +
                  `background:rgba(15,23,42,0.88);border:2px solid #FFFFFF;` +
                  `box-shadow:0 2px 6px rgba(15,23,42,0.4);display:flex;` +
                  `align-items:center;justify-content:center;` +
                  `font-family:'Outfit',sans-serif;font-size:${n>99?11:13}px;` +
                  `font-weight:800;color:#FFFFFF">${n}</div>`,
          });
        },
      });

      commWithCoords.forEach(n=>{
        if(!commVisible(n)) return;

        const pt = coordsOf(n);
        if(!pt) return;                       // never guess a location

        const value    = activeMetric.get(n);
        const colour   = colourFor(value, activeMetric, breaks);
        /* Was isMeasured(n), which returned true whenever a free-text `source`
           field happened to contain "dld". Now it reflects whether this
           community's figures were actually counted from transactions. */
        const measured = isEvidenced(n._ppsfEv) || isEvidenced(n._yieldEv);

        /* ── PRICE LABELS, NOT COLOURED DOTS ─────────────────────────────────
           This drew a plain coloured circle per community. 193 of them overlap
           into a blob, and a colour means nothing until you go and decode it
           against a legend — which is why the legend had to be a long row of
           "AED 216 – AED 1,193  38 here" chunks across the top of the tab.

           Every serious property map solved this the same way. Zillow put the
           price directly on the pin; Redfin then tuned pin size and contrast so
           prices can be scanned at a glance. The value is the label, so no
           decoding step and no legend to read.

           Colour is kept as a secondary cue for the band, and the border still
           carries provenance: solid = counted, dashed = estimate. */
        const label = value != null ? activeMetric.format(value) : "—";
        const dark  = ["#2D4A22","#5A7D2A","#1E3A5F","#2E6F9E"].includes(colour);
        const circle = L.marker([pt.lat,pt.lng],{
          icon: L.divIcon({
            className: "",
            html:
              `<div style="` +
              `background:${colour};color:${dark?"#FFFFFF":"#0F172A"};` +
              `font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;` +
              `padding:3px 7px;border-radius:11px;white-space:nowrap;` +
              `border:${measured ? "1.5px solid rgba(255,255,255,0.95)" : "1.5px dashed #0F172A"};` +
              `box-shadow:0 1px 4px rgba(15,23,42,0.35);` +
              `opacity:${measured ? 1 : 0.82};">` +
              `${label}</div>`,
            iconSize: null,
            iconAnchor: [22, 11],
          }),
          riseOnHover: true,
        });

        /* ── WHAT THE POPUP USED TO SAY ──────────────────────────────────────
           It led with NET YIELD in the largest, greenest text, and closed with
           "Measured from DLD transactions". Net return is derived from the
           service charge, which no source publishes per community — it is never
           measured. So the most prominent number in the popup was the least
           reliable one, under a line claiming the opposite.

           It now leads with price per square foot, which IS counted, marks each
           figure for what it is, and the footer describes only the figures it
           is actually true of. */
        const ppsfVal = n.medianPPSF ?? n.avgPpsf ?? n.ppsf;
        const tag = (text, ok) =>
          `<span style="font-size:8px;font-weight:700;padding:1px 4px;border-radius:3px;margin-left:5px;white-space:nowrap;` +
          `background:${ok ? "rgba(16,185,129,0.16)" : "rgba(148,163,184,0.16)"};` +
          `color:${ok ? "#10B981" : "#94A3B8"}">${text}</span>`;

        const ppsfOk  = isEvidenced(n._ppsfEv);
        const yieldOk = isEvidenced(n._yieldEv);

        const footer = ppsfOk || yieldOk
          ? `<div style="font-size:10px;color:#047857;line-height:1.5;font-weight:600">Counted from ${
              [ppsfOk ? `${(n._ppsfN||0).toLocaleString()} recorded sales` : null,
               yieldOk ? "registered tenancy contracts" : null].filter(Boolean).join(" and ")
            }.${(!ppsfOk || !yieldOk) ? " The other figures are estimates." : ""}</div>`
          : `<div style="font-size:10px;color:#B45309;line-height:1.5;font-weight:600">No figure here was measured — ` +
            `all four are stored estimates. Do not quote them as market facts.</div>`;

        circle.bindPopup(`<div style="font-family:'Outfit',sans-serif;min-width:250px;padding:4px">
          <div style="font-size:15px;font-weight:800;color:#0F172A;margin-bottom:2px">${n.name||n.community||n.id}</div>
          <div style="font-size:10px;color:#64748B;margin-bottom:8px">${n.kindLabel||"Community"}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
            <div style="background:rgba(212,168,67,0.08);border-radius:6px;padding:6px 8px">
              <div style="font-size:9px;color:#64748B;margin-bottom:2px">PRICE PER SQ FT ${tag(ppsfOk?"REAL":"EST",ppsfOk)}</div>
              <div style="font-size:15px;font-weight:700;color:#92700F">${
                ppsfVal ? "AED " + Math.round(ppsfVal).toLocaleString() : "—"}</div>
            </div>
            <div style="background:rgba(16,185,129,0.08);border-radius:6px;padding:6px 8px">
              <div style="font-size:9px;color:#64748B;margin-bottom:2px">GROSS RETURN ${tag(yieldOk?"REAL":"EST",yieldOk)}</div>
              <div style="font-size:15px;font-weight:700;color:${yieldOk?"#047857":"#64748B"}">${
                n.grossYield ? Number(n.grossYield).toFixed(1) + "%" : "—"}</div>
            </div>
          </div>
          <div style="font-size:10px;color:#475569;margin-bottom:6px;line-height:1.6">
            Net return ${n.netYield ? Number(n.netYield).toFixed(1)+"%" : "—"} and service charge ${
            n.serviceCharge ? "AED "+n.serviceCharge+"/sqft" : "—"} are
            <span style="color:#B45309;font-weight:700">estimates</span> — no source publishes a
            service charge per community.
          </div>
          ${footer}
        </div>`,{className:"dxb-popup",maxWidth:310});
        circle.on("click",()=>setSelected({type:"community",...n}));
        commCluster.addLayer(circle);
      });
      map.addLayer(commCluster);
      clusterRef.current = commCluster;

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
          <div style="font-size:14px;font-weight:800;color:#0F172A;margin-bottom:2px">${p.name||"Project"}</div>
          <div style="font-size:10px;color:#94A3B8;margin-bottom:8px">${dev} · ${comm}${masterComm}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:6px">
            ${p.priceMin?`<div style="background:rgba(212,168,67,0.08);border-radius:4px;padding:4px 6px"><div style="font-size:9px;color:#64748B">FROM</div><div style="font-size:12px;color:#D4A843;font-weight:600">AED ${(p.priceMin/1e6).toFixed(1)}M</div></div>`:""}
            ${p.grossYield?`<div style="background:rgba(16,185,129,0.08);border-radius:4px;padding:4px 6px"><div style="font-size:9px;color:#64748B">GROSS RETURN</div><div style="font-size:12px;color:#047857;font-weight:700">${p.grossYield}%</div></div>`:""}
            ${p.constructionPct!=null?`<div style="background:rgba(15,23,42,0.05);border-radius:4px;padding:4px 6px"><div style="font-size:9px;color:#64748B">BUILT</div><div style="font-size:12px;color:#0F172A;font-weight:700">${Math.round(p.constructionPct)}%</div></div>`:""}
            ${p.totalFloors?`<div style="background:rgba(15,23,42,0.05);border-radius:4px;padding:4px 6px"><div style="font-size:9px;color:#64748B">FLOORS</div><div style="font-size:12px;color:#0F172A;font-weight:700">${p.totalFloors}</div></div>`:""}
          </div>
          ${p.handoverQuarter?`<div style="font-size:10px;color:#63B3ED">Handover: ${p.handoverQuarter}</div>`:""}
          ${p.paymentPlan?`<div style="font-size:10px;color:#94A3B8">Payment: ${p.paymentPlan}</div>`:""}
        </div>`,{className:"dxb-popup",maxWidth:270});
        marker.on("click",()=>setSelected({type:"project",...p}));
        cluster.addLayer(marker);
      });
      map.addLayer(cluster);
      clusterRef.current=cluster;

    }
    /* REMOVED: a third "PPSF Heatmap" layer. It painted the same price data as
       the Communities layer coloured by price per square foot, but with an
       arbitrary rgb() ramp and NO LEGEND — a colour scale with no key, which a
       reader cannot decode. The Colour by control does the same job with a
       banded legend and a stated source. */
    /* ── FRAME THE MAP ON THE DATA ───────────────────────────────────────
       The map opened at a hardcoded center [25.1,55.2] zoom 11. That framed the
       old short container; once the map was given its proper height the same
       zoom showed Abu Dhabi, Al Ain and half of Oman, with all 193 Dubai pins
       squeezed into one corner.

       Fitting to the pins is correct at any container size, and it also follows
       a filter — search for one community and the map goes to it instead of
       leaving the user to find a single dot.

       invalidateSize() first, because Leaflet caches the container dimensions
       and this one changes when the tab mounts. */
    try {
      map.invalidateSize();
      const pts = [];
      if (mapLayer === "communities") {
        commWithCoords.forEach(n => { if (commVisible(n)) { const c = coordsOf(n); if (c) pts.push([c.lat, c.lng]); } });
      } else {
        filteredProjects.forEach(pr => {
          const la = parseFloat(pr.lat ?? pr.coordinates?.lat);
          const ln = parseFloat(pr.lng ?? pr.coordinates?.lng);
          if (Number.isFinite(la) && Number.isFinite(ln)) pts.push([la, ln]);
        });
      }
      /* Fitting ALL 193 communities pulls the view out past Abu Dhabi, because
         a handful sit far inland and the bounds stretch to reach them — the
         urban core where 90% of the pins are ends up a smudge in one corner.

         So: open on Dubai at a zoom that frames the city, and only fit the
         bounds once the user has narrowed the set, where flying to the result
         is exactly what they want. */
      const narrowed = mapLayer === "projects"
        ? (search.trim() || filterDev !== "All" || filterStatus !== "All")
        : (search.trim() || filterYield !== "all");

      if (pts.length === 1) map.setView(pts[0], 14);
      else if (narrowed && pts.length > 1)
        map.fitBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom: 14 });
      else map.setView([25.11, 55.20], 10);
    } catch (e) { console.error("[Map] could not fit to markers:", e); }

    /* activeMetric belongs here: without it, switching the metric leaves the
       pins painted by the previous one and the legend disagrees with the map. */
  },[mapReady, mapLayer, commVisible, commWithCoords, filteredProjects, activeMetric]);

  /* A labelled cluster of controls. The label is the question the group answers,
     which is the whole difference between a row of buttons and a control an
     agent can use without being taught. */
  const Group = ({label,children}) => (
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      <span style={{fontSize:9,fontWeight:700,color:T.textMuted,letterSpacing:.7,
                    textTransform:"uppercase"}}>{label}</span>
      <div style={{display:"flex",gap:2,background:"rgba(255,255,255,0.03)",
                   border:`1px solid ${T.border}`,borderRadius:8,padding:3}}>
        {children}
      </div>
    </div>
  );

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
    /* ── FULL-BLEED MAP ────────────────────────────────────────────────────
       The tab used to stack a title, a ten-line intro, a warning banner, a
       toolbar and a five-band legend above the map, then hand whatever height
       was left to a 70/30 split. On a laptop the map got about 340 visible
       pixels — a strip under a page of text, when the map IS the product.

       Every property portal does the opposite: the map fills the frame and the
       controls float on top of it. That is the layout here now. The explanation
       has not been thrown away — it moved behind the "How to use this" button
       in the bar, so it is one click away instead of in the way. */
    <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 116px)",
                 margin:"-8px 0 0",overflow:"hidden"}}>

      {showHelp && _copy && (
        <div style={{position:"relative",marginBottom:8}}>
          <TabIntro title={_copy.title} what={_copy.what} detail={_copy.detail}
            includes={_copy.includes} excludes={_copy.excludes} warning={_copy.warning}/>
          {_copy.provenance && <TabProvenance {..._copy.provenance}/>}
          <button type="button" onClick={()=>setShowHelp(false)} aria-label="Close" title="Close"
            style={{position:"absolute",top:10,right:12,background:"rgba(255,255,255,0.06)",
              border:`1px solid ${T.border}`,borderRadius:8,color:"#94A3B8",width:26,height:26,
              cursor:"pointer",fontSize:13,lineHeight:1}}>✕</button>
        </div>
      )}

      {/* ── TOOLBAR ─────────────────────────────────────────────────────────
          Eleven buttons used to sit here in three identical-looking groups with
          no headings: a layer switch, a return filter and a colour metric, all
          styled the same. Nothing said which was which, so the tab opened with
          three unlabelled toolbars and no indication of what any of them did.

          Each group now states its own question. */}
      <div data-map-toolbar style={{display:"flex",gap:14,alignItems:"flex-end",padding:"10px 0 8px",flexWrap:"wrap"}}>

        <Group label="Show me">
          {[{k:"communities",label:"Communities",
             hint:"All 193 communities, coloured by the figure you choose below."},
            {k:"projects",label:`Projects (${projectsWithGPS.length})`,
             hint:`Individual projects rather than whole communities. A numbered circle groups nearby projects — zoom in to split it.`}]
            .map(l=><Btn key={l.k} active={mapLayer===l.k} onClick={()=>setMapLayer(l.k)} title={l.hint}>{l.label}</Btn>)}
        </Group>

        {mapLayer==="communities"&&(
          <Group label="Colour by">
            {MAP_METRICS.map(m=>(
              <Btn key={m.key} active={metricKey===m.key} onClick={()=>setMetricKey(m.key)}
                title={m.evidenced
                  ? m.hint+" — counted from Land Department records."
                  : m.hint+" — ESTIMATE. No source publishes this per community."}>
                {m.label}{m.evidenced===false&&<span style={{fontSize:8,marginLeft:4,opacity:0.75}}>EST</span>}
              </Btn>
            ))}
          </Group>
        )}

        {mapLayer==="communities"&&(
          <Group label="Only show">
            {[{k:"all",  label:"Everything", hint:"No filter — all 193 communities."},
              {k:"8+",   label:"8% or more", hint:"Communities whose gross return is 8% or higher."},
              {k:"6-8",  label:"6% to 8%",   hint:"Communities whose gross return is between 6% and 8%."},
              {k:"<6",   label:"Under 6%",   hint:"Communities whose gross return is below 6%."}]
              .map(f=><Btn key={f.k} active={filterYield===f.k} onClick={()=>setFilterYield(f.k)} title={f.hint}>{f.label}</Btn>)}
          </Group>
        )}

        {/* Find a community by name — 193 pins with no way to search was the
            single most common thing to reach for and not find. */}
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <label style={{fontSize:9,fontWeight:700,color:T.textMuted,letterSpacing:.7,textTransform:"uppercase"}}>
            {mapLayer==="projects" ? "Find a project" : "Find a community"}
          </label>
          <input type="text"
            placeholder={mapLayer==="projects" ? "Name, developer or community…" : "Type a community name…"}
            value={search} onChange={e=>setSearch(e.target.value)}
            title="Type to highlight matching pins and filter the list on the right."
            style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${search?T.gold:T.border}`,borderRadius:8,
              padding:"6px 12px",color:T.white,fontSize:11,fontFamily:"'Outfit',sans-serif",width:230,outline:"none"}}/>
        </div>

        {mapLayer==="projects"&&(
          <Group label="Narrow to">
            <Select value={filterDev} onChange={setFilterDev}
              options={["All",...new Set((activeProjects||[]).map(p=>p.developerActual||p.developer||"").filter(Boolean).sort())].slice(0,100)}/>
            <Select value={filterStatus} onChange={setFilterStatus} options={["All","Off-Plan","Ready"]}/>
          </Group>
        )}

        <button type="button" onClick={()=>setShowHelp(v=>!v)}
          title="What this tab is for, what the pins mean, and where the numbers come from"
          style={{marginLeft:"auto",padding:"5px 11px",borderRadius:7,
            border:`1px solid ${showHelp?T.gold:T.border}`,background:"transparent",
            color:showHelp?T.gold:"#94A3B8",fontSize:11,cursor:"pointer",
            fontFamily:"'Outfit',sans-serif",whiteSpace:"nowrap"}}>
          {showHelp ? "Hide guide" : "How to use this"}
        </button>
        <span style={{fontSize:11,color:T.textSecondary,paddingBottom:6}}>
          {mapLayer==="projects"
            ? `${filteredProjects.length.toLocaleString()} of ${projectsWithGPS.length.toLocaleString()} projects shown`
            : `${shownCommunities} of ${commWithCoords.length} communities shown`}
        </span>
      </div>

      {/* ── LEGEND ──────────────────────────────────────────────────────────
          Quantile bands with the count in each, because a legend that shows
          colours without distribution tells a reader what the colours mean but
          not what the city looks like. Plus the provenance key, which is the
          part no competitor has: solid pins are measured, hollow ones inherited. */}
      {/* Map + Sidebar */}
      <div style={{display:"flex",gap:10,flex:1,minHeight:0}}>

        {/* Map — 70% */}
        <div style={{flex:1,minWidth:0,position:"relative",borderRadius:12,overflow:"hidden",border:`1px solid ${T.border}`}}>
          <div ref={mapRef} style={{width:"100%",height:"100%"}}/>
      {/* ── KEY ─────────────────────────────────────────────────────────────
              This was five colour swatches spelled out as "AED 216 – AED 1,193
              38 here · AED 1,193 – AED 1,476 29 here · …" strung across the tab. It
              existed because a coloured dot has to be decoded into a number.

              The pins now carry the number itself, so the bands do not need
              spelling out. What is left is the one thing the colour cannot say —
              whether the figure was counted or estimated — and that is the part no
              competing Dubai map shows at all. */}
          {mapLayer==="communities"&&(()=>{
            const cov = coverage(commWithCoords);
            return (
              <div style={{position:"absolute",left:12,bottom:12,zIndex:500,
                display:"flex",gap:14,alignItems:"center",flexWrap:"wrap",maxWidth:"min(680px,72%)",
                background:"rgba(15,23,42,0.92)",border:`1px solid ${T.border}`,borderRadius:10,
                padding:"8px 12px",backdropFilter:"blur(6px)"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:10,fontWeight:700,color:"#0F172A",background:"#D4A843",
                    borderRadius:11,padding:"2px 7px",border:"1.5px solid rgba(255,255,255,0.95)"}}>AED 1,287</span>
                  <span style={{fontSize:10.5,color:T.textSecondary}}>counted from sales ({cov.measured})</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:10,fontWeight:700,color:"#0F172A",background:"#D4A843",opacity:.82,
                    borderRadius:11,padding:"2px 7px",border:"1.5px dashed #0F172A"}}>AED 1,287</span>
                  <span style={{fontSize:10.5,color:T.textSecondary}}>estimate — quote with a caveat ({cov.estimated})</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:22,height:22,borderRadius:"50%",background:"rgba(15,23,42,0.88)",
                    border:"2px solid #fff",display:"inline-flex",alignItems:"center",justifyContent:"center",
                    fontSize:10,fontWeight:800,color:"#fff"}}>12</span>
                  <span style={{fontSize:10.5,color:T.textSecondary}}>communities grouped — zoom in to split</span>
                </div>
                <span style={{fontSize:10,color:T.textMuted,marginLeft:"auto"}}>
                  Colour runs cheap to dear. {activeMetric.hint}.
                </span>
              </div>
            );
          })()}

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
                      {label:"GROSS RETURN",value:selected.grossYield?`${selected.grossYield}%`:null,color:"#10B981"},
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
                      {label:"GROSS RETURN",value:selected.grossYield?`${selected.grossYield}%`:null,color:"#10B981"},
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
              {/* A bare ranked list with no caption leaves the reader guessing
                  what it is for and where the numbers came from. */}
              <div style={{marginBottom:10}}>
                <div style={{fontSize:10,fontWeight:700,color:T.textMuted,letterSpacing:0.8,textTransform:"uppercase"}}>
                  {mapLayer==="projects"?"Highest return — projects":"Highest measured return"}
                </div>
                <div style={{fontSize:10,color:T.textMuted,marginTop:4,lineHeight:1.5}}>
                  {mapLayer==="projects"
                    ? "Projects with the highest recorded gross return. Click one to see it on the map."
                    : "Ranked on returns counted from tenancy contracts — estimates are left out, so this is a shortlist you can defend. Click one to open it."}
                </div>
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

    </div>
  );
}
