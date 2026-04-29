const fs = require("fs");
const src = fs.readFileSync("src/tabs/CommunityMapTab.jsx","latin1");
const lines = src.split("\n");

// Find map initialization, tiles, center coordinates
lines.forEach((l,i)=>{
  if(l.includes("setView")||l.includes("tileLayer")||l.includes("L.map")||l.includes("center")||l.includes("zoom")||l.includes("leaflet")) {
    const clean = l.replace(/[^\x20-\x7E]/g,"").trim();
    if(clean.length>5) console.log(i+1, clean.substring(0,120));
  }
});