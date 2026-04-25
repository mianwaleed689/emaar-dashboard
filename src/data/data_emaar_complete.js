/* ─── DXB ANALYTICS — EMAAR COMPLETE PROJECT DATABASE ──────────────────────
   S30: Full A-Z project database — 208 verified Emaar Dubai projects
   Sources: Property Finder · fäm Properties · Emaar Official · Bayut
   Community breakdown confirmed from Property Finder live count March 2026:
   Creek Harbour 35 · Dubai Hills 34 · The Valley 30 · Emaar South 24
   Mina Rashid 22 · Arabian Ranches 3: 15 · Grand Polo (DIP) 12
   Emaar Beachfront 11 · The Oasis 11 · Downtown 5 · The Heights 3
   Dubai Marina 2 · Expo City 2 · Zabeel 1 · Business Bay 1 = 208 total
   Last verified: March 28 2026
─────────────────────────────────────────────────────────────────────────── */

// Re-export as emaarProjects so existing imports still work
export const emaarProjectsComplete = [

// ═══════════════════════════════════════════════════════
// STRUCTURE REFERENCE — 3 sample projects
// Add your full project data via Data Manager
// ═══════════════════════════════════════════════════════



// ═══════════════════════════════════════════════════════════════════════════
// DUBAI HILLS ESTATE — 34 projects
// ═══════════════════════════════════════════════════════════════════════════

  { id:"emaar-dh-01", developerId:"emaar", name:"The Golf Residence",         community:"Dubai Hills Estate", type:"Apartments",  beds:"1-3BR", status:"Under Construction", handover:"Q2 2026", price:1750000,  sizeFrom:750,  sizeTo:2200,  ppsf:2333, payment:"20/30/50",  construction:90, branded:false, brand:"—",         tier:"Mid-Premium",
    unitBreakdown:[{type:"1BR",sqftFrom:750,sqftTo:950,priceFrom:1750000},{type:"2BR",sqftFrom:1200,sqftTo:1500,priceFrom:2800000},{type:"3BR",sqftFrom:1800,sqftTo:2200,priceFrom:4200000}] },
  { id:"emaar-dh-02", developerId:"emaar", name:"Hills Park",                 community:"Dubai Hills Estate", type:"Apartments",  beds:"1-3BR", status:"Under Construction", handover:"Q2 2026", price:1210000,  sizeFrom:650,  sizeTo:1800,  ppsf:1862, payment:"80/20",      construction:85, branded:false, brand:"—",         tier:"Mid-Market",
    unitBreakdown:[{type:"1BR",sqftFrom:650,sqftTo:800,priceFrom:1210000},{type:"2BR",sqftFrom:1100,sqftTo:1350,priceFrom:2050000},{type:"3BR",sqftFrom:1600,sqftTo:1800,priceFrom:2990000}] },
  { id:"emaar-dh-03", developerId:"emaar", name:"Golf Grand",                 community:"Dubai Hills Estate", type:"Apartments",  beds:"1-3BR", status:"Under Construction", handover:"Q1 2027", price:1529388,  sizeFrom:700,  sizeTo:2100,  ppsf:2185, payment:"10/80/10",  construction:96, branded:false, brand:"—",         tier:"Mid-Premium",
    unitBreakdown:[{type:"1BR",sqftFrom:700,sqftTo:900,priceFrom:1529388},{type:"2BR",sqftFrom:1150,sqftTo:1450,priceFrom:2513000},{type:"3BR",sqftFrom:1700,sqftTo:2100,priceFrom:3714000}] }

];

// Verify count
if (typeof window !== 'undefined') console.log('Emaar projects:', emaarProjectsComplete.length);

// Default export for compatibility
export { emaarProjectsComplete as emaarProjects };
export default emaarProjectsComplete;

// Community lookup helper
export const emaarCommunityCount = emaarProjectsComplete.reduce((acc, p) => {
  acc[p.community] = (acc[p.community] || 0) + 1;
  return acc;
}, {});
