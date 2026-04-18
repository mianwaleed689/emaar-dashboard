/* eslint-disable */
/* ═══════════════════════════════════════════════════════════════════
   DXB ANALYTICS — COMMUNITY MAP TAB
   Extracted from EmaarDashboardV2.jsx (lines 1587-2080)
   Interactive Leaflet map with 3 data layers:
   - Yield layer (color pins by rental yield)
   - PPSF layer (heat circles by price/sqft)
   - Volume layer (circles by DLD transaction count)
   ═══════════════════════════════════════════════════════════════════ */

import React from "react";
import { T } from "../data";
import { COMMUNITY_COORDS, getProjectCoords, getPPSFColor, getVolumeColor } from "../utils/coordinates";

function CommunityMapTab({ activeProjects, liveCommunityROI, setTab, seedCommunities, globalFilters = {}, allDevelopers = [] }) {

  /* Phase 2.4 Batch 4: derive which communities match the global filter.
     Returns a Set of lowercase community names, or null if no global filter. */
  const gfDev = globalFilters?.developer && globalFilters.developer !== "all"
    ? String(globalFilters.developer).toLowerCase() : null;
  const gfCommunity = globalFilters?.community && globalFilters.community !== "all"
    ? String(globalFilters.community).toLowerCase() : null;

  const mapMatchingCommunities = React.useMemo(() => {
    if (!gfDev && !gfCommunity) return null;
    let set = null;
    if (gfDev) {
      const dev = (allDevelopers || []).find(d =>
        String(d.id || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase().includes(gfDev)
      );
      if (dev && Array.isArray(dev.communities) && dev.communities.length > 0) {
        set = new Set(dev.communities.map(c => String(c).toLowerCase()));
      } else {
        set = new Set();
      }
    }
    if (gfCommunity) {
      if (set) set = new Set([...set].filter(c => c === gfCommunity));
      else set = new Set([gfCommunity]);
    }
    return set;
  }, [gfDev, gfCommunity, allDevelopers]);

  const mapMatchesGlobalFilter = (communityName) => {
    if (!mapMatchingCommunities) return true;
    return mapMatchingCommunities.has(String(communityName || "").toLowerCase());
  };

  const [filterComm, setFilterComm] = React.useState("All");
  const [filterYield, setFilterYield] = React.useState("All");
  const [mapLoaded, setMapLoaded] = React.useState(false);
  const [selectedProject, setSelectedProjectMap] = React.useState(null);
  const [mapLayer, setMapLayer] = React.useState("yield");
  const heatLayersRef = React.useRef([]);
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markersRef = React.useRef([]);

  // Phase 2.4 Batch 4: filter projects shown on map
  const filteredActiveProjects = React.useMemo(() => {
    if (!mapMatchingCommunities) return activeProjects || [];
    return (activeProjects || []).filter(p => mapMatchesGlobalFilter(p.community));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjects, mapMatchingCommunities]);

  // Community-level data for heat map layers
  // Phase 2.4 Batch 4: pre-filter to communities that match the global filter
  const filteredSeedCommunities = (seedCommunities || []).filter(c => mapMatchesGlobalFilter(c.community));
  const communityData = filteredSeedCommunities.length > 0
    ? Object.fromEntries(filteredSeedCommunities.map(c => [
        c.community,
        {
          coords: COMMUNITY_COORDS[c.community] || [25.1124, 55.2594],
          ppsf: c.avgPpsf || 1500,
          volume: Math.round((c.grossYield || 6) * 1000),
          yoy: c.grossYield >= 8 ? 45 : c.grossYield >= 7 ? 30 : c.grossYield >= 6 ? 20 : 12,
          radius: Math.max(600, Math.min(1800, (c.avgPpsf || 1500) / 2)),
          grossYield: c.grossYield,
          netYield: c.netYield,
          serviceCharge: c.serviceCharge,
          supplyRisk: c.supplyRisk,
          investmentScore: c.investmentScore,
          tenantProfile: c.tenantProfile,
        }
      ]))
    : {
        "Dubai Creek Harbour":  { coords: [25.1942, 55.3556], ppsf: 1620, volume: 6400,  yoy: 45, radius: 1200, grossYield: 6.4, supplyRisk: "Medium" },
        "Dubai Hills Estate":   { coords: [25.1124, 55.2594], ppsf: 1850, volume: 8200,  yoy: 22, radius: 1400, grossYield: 6.2, supplyRisk: "Medium" },
        "Emaar Beachfront":     { coords: [25.0882, 55.1385], ppsf: 2800, volume: 1600,  yoy: 18, radius: 900,  grossYield: 5.8, supplyRisk: "Low"    },
        "Downtown Dubai":       { coords: [25.1972, 55.2744], ppsf: 3100, volume: 8900,  yoy: 12, radius: 1100, grossYield: 5.8, supplyRisk: "Low"    },
        "Business Bay":         { coords: [25.1854, 55.2719], ppsf: 2050, volume: 12450, yoy: 8,  radius: 1300, grossYield: 7.1, supplyRisk: "High"   },
        "Arabian Ranches":      { coords: [25.0517, 55.2699], ppsf: 1380, volume: 4800,  yoy: 20, radius: 900,  grossYield: 5.5, supplyRisk: "Low"    },
        "Dubai South":          { coords: [24.8972, 55.1615], ppsf: 850,  volume: 4100,  yoy: 38, radius: 1100, grossYield: 8.8, supplyRisk: "Medium" },
        "Jumeirah Village Circle":{ coords:[25.0607, 55.2088], ppsf: 1180, volume: 18782, yoy: 17, radius: 1400, grossYield: 7.8, supplyRisk: "Medium" },
        "Jumeirah Lake Towers": { coords: [25.0699, 55.1478], ppsf: 1420, volume: 4600,  yoy: 5,  radius: 1000, grossYield: 8.1, supplyRisk: "Low"    },
        "Palm Jumeirah":        { coords: [25.1124, 55.1390], ppsf: 4800, volume: 5200,  yoy: 15, radius: 1600, grossYield: 5.2, supplyRisk: "Low"    },
        "International City":   { coords: [25.1621, 55.4121], ppsf: 580,  volume: 3800,  yoy: 9,  radius: 800,  grossYield: 9.2, supplyRisk: "Low"    },
        "Al Furjan":            { coords: [25.0255, 55.1494], ppsf: 1080, volume: 4200,  yoy: 14, radius: 900,  grossYield: 8.2, supplyRisk: "Medium" },
        "Mohammed Bin Rashid City":{ coords:[25.1740, 55.3310], ppsf: 1950, volume: 5100, yoy: 28, radius: 1200, grossYield: 6.1, supplyRisk: "Medium" },
        "Sobha Hartland":       { coords: [25.1825, 55.3427], ppsf: 2100, volume: 6800,  yoy: 31, radius: 1000, grossYield: 6.0, supplyRisk: "Low"    },
        "Tilal Al Ghaf":        { coords: [25.0308, 55.2290], ppsf: 1650, volume: 3600,  yoy: 52, radius: 1000, grossYield: 6.8, supplyRisk: "Low"    },
        "Discovery Gardens":    { coords: [25.0366, 55.1318], ppsf: 680,  volume: 400,   yoy: 10, radius: 700,  grossYield: 8.5, supplyRisk: "Low"    },
        "Dubai Silicon Oasis":  { coords: [25.1175, 55.3796], ppsf: 820,  volume: 2400,  yoy: 12, radius: 800,  grossYield: 7.5, supplyRisk: "Low"    },
        "Arjan":                { coords: [25.0552, 55.2178], ppsf: 1020, volume: 4200,  yoy: 15, radius: 800,  grossYield: 8.0, supplyRisk: "Medium" },
        "DAMAC Hills 2":        { coords: [24.9729, 55.3035], ppsf: 780,  volume: 16000, yoy: 18, radius: 1200, grossYield: 7.2, supplyRisk: "High"   },
      };

  const getYield = (project) => {
    if (project.grossYield) return project.grossYield;
    const roi = (liveCommunityROI && liveCommunityROI[project.community]) || {};
    const y = roi.grossYield;
    if (!y) return 6.5;
    if (typeof y === "object") return parseFloat(y.apt1 || y.apt2 || Object.values(y)[0]) || 6.5;
    return parseFloat(y) || 6.5;
  };

  const getPinColor = (project) => {
    const y = getYield(project);
    if (y >= 8) return "#10B981";
    if (y >= 6.5) return "#D4A843";
    if (y >= 5) return "#3B82F6";
    return "#94A3B8";
  };

  const communities = ["All", ...Array.from(new Set(activeProjects.map(p => p.community)))];
  const filteredProjects = activeProjects.filter(p => {
    const commOk = filterComm === "All" || p.community === filterComm;
    const y = getYield(p);
    const yieldOk = filterYield === "All" || (filterYield === "8%+" && y >= 8) || (filterYield === "6-8%" && y >= 6 && y < 8) || (filterYield === "<6%" && y < 6);
    return commOk && yieldOk;
  });

  // Load Leaflet dynamically
  React.useEffect(() => {
    if (mapLoaded || typeof window === "undefined") return;
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css"; link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!window.L) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else { setMapLoaded(true); }
  }, []);

  // Init map after Leaflet loads
  React.useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [25.1124, 55.2594], zoom: 12, minZoom: 11, maxZoom: 18,
      zoomControl: true, maxBounds: [[24.7, 54.8], [25.5, 55.9]], maxBoundsViscosity: 0.9,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap © CARTO", maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;
  }, [mapLoaded]);

  // Update markers when filters change
  React.useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    filteredProjects.forEach(p => {
      const coords = getProjectCoords(p);
      const color = getPinColor(p);
      const y = getYield(p);
      const icon = L.divIcon({
        className: "",
        html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;"><div style="background:${color};color:#000;font-size:10px;font-weight:800;padding:3px 7px;border-radius:6px;box-shadow:0 2px 10px rgba(0,0,0,0.7);">${y.toFixed(1)}%</div><div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid ${color};"></div></div>`,
        iconSize: [46, 32], iconAnchor: [23, 32],
      });
      const marker = L.marker(coords, { icon })
        .addTo(map)
        .bindPopup(`<div style="font-family:'Outfit',sans-serif;min-width:180px;background:#0D1821;color:#fff;border-radius:10px;padding:0;">
          <div style="background:linear-gradient(135deg,rgba(212,168,67,0.15),rgba(212,168,67,0.05));padding:12px 14px;border-radius:10px 10px 0 0;border-bottom:1px solid rgba(255,255,255,0.08);">
            <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:2px;">${p.project || p.name || "Project"}</div>
            <div style="font-size:10px;color:#94A3B8;">${p.community}</div>
          </div>
          <div style="padding:10px 14px;display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <div><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Price</div><div style="font-size:12px;font-weight:700;color:#D4A843;">${p.priceMin ? "AED " + (p.priceMin/1e6).toFixed(2) + "M" : (p.priceMin || p.price) ? "AED " + ((p.priceMin || p.price)/1e6).toFixed(2) + "M" : "TBC"}</div></div>
            <div><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Yield</div><div style="font-size:12px;font-weight:700;color:${color}">${y.toFixed(1)}%</div></div>
            <div><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Type</div><div style="font-size:11px;color:#CBD5E1;">${p.type || "Residential"}</div></div>
            <div><div style="font-size:9px;color:#94A3B8;text-transform:uppercase;">Handover</div><div style="font-size:11px;color:#CBD5E1;">${p.handover || "TBC"}</div></div>
          </div>
        </div>`, { className: "dxb-popup" });
      marker.on("click", () => setSelectedProjectMap(p));
      markersRef.current.push(marker);
    });

    // Clear old heat circles
    heatLayersRef.current.forEach(c => map.removeLayer(c));
    heatLayersRef.current = [];

    // Add PPSF or Volume heat circles
    if (mapLayer === "ppsf" || mapLayer === "volume" || mapLayer === "yield") {
      Object.entries(communityData).forEach(([name, data]) => {
        const color = mapLayer === "ppsf" ? getPPSFColor(data.ppsf) : mapLayer === "volume" ? getVolumeColor(data.volume) : ((data.grossYield||0) >= 8 ? "#10B981" : (data.grossYield||0) >= 6 ? "#D4A843" : "#3B82F6");
        const value = mapLayer === "ppsf" ? `AED ${data.ppsf.toLocaleString()}/sqft` : mapLayer === "volume" ? `${data.volume.toLocaleString()} deals` : `${(data.grossYield||6).toFixed(1)}% yield`;
        const radiusScale = mapLayer === "volume" ? Math.min(data.volume / 100, 600) + 400 : mapLayer === "yield" ? Math.max(800, Math.min((data.grossYield||6) * 200, 2000)) : data.radius;
        const circle = L.circle(data.coords, {
          radius: radiusScale, color: color, fillColor: color,
          fillOpacity: 0.25, weight: 2, opacity: 0.7,
        }).addTo(map);
        circle.bindTooltip(`<div style="font-family:'Outfit',sans-serif;background:#0D1821;color:#fff;border:1px solid ${color};border-radius:8px;padding:8px 12px;font-size:12px;">
          <strong style="color:${color}">${name}</strong><br/>
          ${mapLayer === "ppsf" ? "PPSF: " : mapLayer === "volume" ? "Volume: " : "Yield: "}<strong>${value}</strong><br/>
          <span style="color:#94A3B8;font-size:10px">YoY: +${data.yoy}%</span>
        </div>`, { permanent: false, sticky: true, className: "dxb-tooltip" });
        heatLayersRef.current.push(circle);
      });
    }
  }, [mapLoaded, filteredProjects.length, filterComm, filterYield, mapLayer]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Layer switcher + Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 4 }}>
        <div style={{ display: "flex", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          {[
            { id: "yield",  label: "🎯 Yield Layer",  desc: "Color by rental yield" },
            { id: "ppsf",   label: "📐 PPSF Layer",   desc: "Color by price/sqft" },
            { id: "volume", label: "📊 Volume Layer",  desc: "Size by DLD transactions" },
          ].map(l => (
            <button key={l.id} type="button" onClick={() => setMapLayer(l.id)}
              style={{ padding: "7px 14px", fontSize: 11, fontWeight: 600, background: mapLayer === l.id ? `${T.gold}20` : "transparent", color: mapLayer === l.id ? T.gold : T.textMuted, border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif", whiteSpace: "nowrap" }}>
              {l.label}
            </button>
          ))}
        </div>
        {/* Layer legends */}
        {mapLayer === "ppsf" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {[["#F59E0B","AED 3,500+/sqft"],["#D4A843","AED 2,500+"],["#14B8A6","AED 1,800+"],["#3B82F6","AED 1,400+"],["#10B981","<AED 1,400"]].map(([col, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: col, opacity: 0.8 }} />
                <span style={{ fontSize: 9, color: T.textMuted }}>{label}</span>
              </div>
            ))}
          </div>
        )}
        {mapLayer === "volume" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {[["#EF4444","10,000+ deals"],["#F97316","3,000+"],["#F59E0B","1,500+"],["#10B981","800+"],["#3B82F6","<800"]].map(([col, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: col, opacity: 0.8 }} />
                <span style={{ fontSize: 9, color: T.textMuted }}>{label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>FILTER:</div>
        <select value={filterComm} onChange={e => setFilterComm(e.target.value)} style={{ padding: "6px 12px", background: T.surfaceAlt, border: "1px solid " + T.border, borderRadius: 8, color: T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
          {communities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: "flex", gap: 6 }}>
          {["All", "8%+", "6-8%", "<6%"].map(f => (
            <button key={f} type="button" onClick={() => setFilterYield(f)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid " + (filterYield === f ? T.gold : T.border), background: filterYield === f ? "rgba(212,168,67,0.15)" : T.surfaceAlt, color: filterYield === f ? T.gold : T.textSecondary, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{f === "All" ? "All Yields" : f + " yield"}</button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          {[["#10B981", "8%+ yield"], ["#D4A843", "6-8% yield"], ["#3B82F6", "5-6% yield"], ["#94A3B8", "<5% yield"]].map(([col, label]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: col, boxShadow: "0 0 6px " + col + "88" }} />
              <span style={{ fontSize: 10, color: T.textMuted }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map + sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, height: 560 }}>
        {/* Map */}
        <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid " + T.border, position: "relative" }}>
          {!mapLoaded && (
            <div style={{ position: "absolute", inset: 0, background: T.surface, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, zIndex: 10 }}>
              <div style={{ fontSize: 32 }}>🗺</div>
              <div style={{ fontSize: 13, color: T.textMuted }}>Loading map...</div>
            </div>
          )}
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
          <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(13,24,33,0.9)", backdropFilter: "blur(8px)", borderRadius: 8, padding: "6px 12px", border: "1px solid " + T.border, zIndex: 999, fontSize: 11, color: T.textSecondary }}>
            <span style={{ color: T.gold, fontWeight: 700 }}>{filteredProjects.length}</span> projects ·{" "}
            <span style={{ color: T.teal, fontWeight: 600 }}>{mapLayer === "yield" ? "Yield layer" : mapLayer === "ppsf" ? "PPSF heat map" : "Volume heat map"}</span>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
          {selectedProject ? (
            <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.gold, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15, fontWeight: 700, color: T.gold }}>{selectedProject.project || selectedProject.name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{selectedProject.community}</div>
                </div>
                <button type="button" onClick={() => setSelectedProjectMap(null)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 18 }}>×</button>
              </div>
              {selectedProject.imageUrl && <img src={selectedProject.imageUrl} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 8, marginBottom: 12 }} onError={e => e.target.style.display="none"} />}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  ["Price", selectedProject.price ? "AED " + (selectedProject.price/1e6).toFixed(2) + "M" : "TBC", T.gold],
                  ["Yield", getYield(selectedProject).toFixed(1) + "%", getPinColor(selectedProject)],
                  ["Handover", selectedProject.handover || "TBC", T.teal],
                  ["Type", selectedProject.type || "Residential", T.textPrimary],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ background: T.card, borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setTab("Projects")} style={{ width: "100%", padding: "9px 0", background: "linear-gradient(135deg," + T.gold + ",#B8912F)", color: T.bg, border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>View Full Details →</button>
            </div>
          ) : (
            <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 4 }}>Click any pin on the map</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>to see project details here</div>
            </div>
          )}

          {/* Project list */}
          <div style={{ background: T.surface, borderRadius: 14, border: "1px solid " + T.border, padding: 14, flex: 1, overflowY: "auto" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.goldLight, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>All Projects ({filteredProjects.length})</div>
            {filteredProjects.map(p => (
              <div key={p.id} onClick={() => { setSelectedProjectMap(p); const coords = getProjectCoords(p); if (mapInstanceRef.current) mapInstanceRef.current.setView(coords, 14, { animate: true }); }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: selectedProject?.id === p.id ? "rgba(212,168,67,0.1)" : "transparent", border: "1px solid " + (selectedProject?.id === p.id ? T.gold : "transparent"), transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                onMouseLeave={e => e.currentTarget.style.background = selectedProject?.id === p.id ? "rgba(212,168,67,0.1)" : "transparent"}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.white }}>{p.project || p.name}</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{p.community}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: getPinColor(p) }}>{getYield(p).toFixed(1)}%</div>
                  <div style={{ fontSize: 10, color: T.textMuted }}>{p.price ? (p.price/1e6).toFixed(1) + "M" : "TBC"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popup CSS */}
      <style>{".dxb-popup .leaflet-popup-content-wrapper { background: #0D1821; border: 1px solid rgba(212,168,67,0.3); border-radius: 12px; padding: 0; box-shadow: 0 20px 60px rgba(0,0,0,0.6); } .dxb-popup .leaflet-popup-content { margin: 0; } .dxb-popup .leaflet-popup-tip { background: #0D1821; } .leaflet-container { background: #0D1821; }"}</style>
    </div>
  );
}

export default CommunityMapTab;
