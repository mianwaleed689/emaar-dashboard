const fs = require("fs");
let src = fs.readFileSync("src/tabs/CommunityMapTab.jsx","utf8");

// Change default layer to communities only
// Remove projects layer option
src = src.replace(
  `const LAYERS = [
    {k:"communities", label:"Communities (259)"},
    {k:"projects",    label:"Projects (94)"},
    {k:"heatmap",     label:"PPSF Heatmap"},
  ];`,
  `const LAYERS = [
    {k:"communities", label:"All Communities"},
    {k:"heatmap",     label:"PPSF Heatmap"},
  ];`
);

// Build project count per community
src = src.replace(
  `  const commWithCoords = React.useMemo(()=>
    (liveNeighbourhoods||[]).filter(n=>n.lat&&n.lng)
  ,[liveNeighbourhoods]);`,
  `  const commWithCoords = React.useMemo(()=>
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
  },[activeProjects]);`
);

// Update community popup to show projects
src = src.replace(
  `  \${n.tier==="verified"?"Verified Data":"Area Data"}`,
  `  \${n.tier==="verified"?"Verified Data":"Area Data"}
          \${(()=>{const projs=projByComm[n.community?.toLowerCase()]||[];return projs.length>0?\`<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1)"><div style="font-size:9px;color:#64748B;text-transform:uppercase;margin-bottom:4px">\${projs.length} Project\${projs.length>1?"s":""}</div>\${projs.slice(0,3).map(p=>\`<div style="font-size:10px;color:#CBD5E1">\${p.name||""}</div>\`).join("")}</div>\`:"";})()}`
);

// Remove projects layer from rendering
src = src.replace(
  `    } else if(mapLayer==="projects") {
      // Show all projects as pins
      (activeProjects||[]).forEach(p=>{
        const coords = getProjectCoords(p);
        if(!coords) return;
        const nbhd = nbhdMap[p.community];
        const y = nbhd?.grossYield||p.grossYield||0;
        const color = YIELD_COLOR(y);

        const marker = L.circleMarker([coords.lat,coords.lng],{
          radius:8, fillColor:color, color:"#fff",
          weight:1.5, fillOpacity:0.9
        });

        const popup = \`<div style="font-family:'Outfit',sans-serif;min-width:200px;padding:4px">
          <div style="font-size:13px;font-weight:700;color:#fff;margin-bottom:4px">\${p.name||"Project"}</div>
          <div style="font-size:11px;color:#94A3B8;margin-bottom:6px">\${p.community||""} · \${p.developer||""}</div>
          \${p.priceMin?\`<div style="font-size:12px;color:#D4A843;font-weight:600">From AED \${Math.round(p.priceMin).toLocaleString()}</div>\`:""}
          \${p.handoverQuarter?\`<div style="font-size:10px;color:#94A3B8;margin-top:4px">Handover: \${p.handoverQuarter}</div>\`:""}
          \${nbhd?\`<div style="font-size:10px;color:#10B981;margin-top:4px">Community yield: \${nbhd.grossYield}%</div>\`:""}
        </div>\`;

        marker.bindPopup(popup,{className:"dxb-popup",maxWidth:260});
        marker.addTo(map);
        markersRef.current.push(marker);
      });

    } else if(mapLayer==="heatmap") {`,
  `    } else if(mapLayer==="heatmap") {`
);

// Update sidebar text
src = src.replace(
  `{mapLayer==="communities"?"259 Communities":"94 Projects"}`,
  `{commWithCoords.length} Communities`
);
src = src.replace(
  `{mapLayer==="communities"
                  ? "Click any circle to see community yield, PPSF, score and facilities."
                  : "Click any pin to see project details and community context."}`,
  `"Click any circle to see community yield, PPSF, score, facilities and projects."`
);

// Update layer count display
src = src.replace(
  `{mapLayer==="communities"?commWithCoords.length+" communities":activeProjects.length+" projects"}`,
  `{commWithCoords.length+" communities"}`
);

fs.writeFileSync("src/tabs/CommunityMapTab.jsx", src, "utf8");
console.log("Done. Non-ASCII:", (src.match(/[^\x00-\x7F]/g)||[]).length);