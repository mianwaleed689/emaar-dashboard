const fs = require("fs");
let src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "utf8");

// Replace the FacilityRow icon prop with colored div backgrounds
// Change the Chip and FacilityRow to use colored letter badges
src = src.replace(
  `const FacilityRow=({icon,label,name,dist,color})=>`,
  `const FacilityRow=({icon,label,name,dist,color})=>`
);

// Replace icon string values with better ones
src = src
  .replace(/icon="M" label="Nearest Metro"/g,        'icon="M" label="Nearest Metro"')
  .replace(/icon="S" label="Nearest School"/g,       'icon="Sch" label="Nearest School"')
  .replace(/icon="H" label="Nearest Hospital"/g,     'icon="Hosp" label="Nearest Hospital"')
  .replace(/icon="P" label="Nearest Park"/g,         'icon="Park" label="Nearest Park"')
  .replace(/icon="N" label="Nearest Nursery"/g,      'icon="Nurs" label="Nearest Nursery"')
  .replace(/icon="Rx" label="Nearest Pharmacy"/g,    'icon="Rx" label="Nearest Pharmacy"')
  .replace(/icon="R" label="Top Restaurant"/g,       'icon="Rest" label="Top Restaurant"')
  .replace(/icon="A" label="DXB Airport"/g,          'icon="DXB" label="DXB Airport"')
  .replace(/icon="~" label="Nearest Beach"/g,        'icon="Beach" label="Nearest Beach"')
  .replace(/icon="S" label="Nearest Supermarket"/g,  'icon="Sup" label="Nearest Supermarket"')
  .replace(/icon="\+" label="Nearest Mosque"/g,      'icon="Msq" label="Nearest Mosque"')
  .replace(/icon="\+" label="Mosque"/g,              'icon="Msq" label="Mosque"')
  .replace(/icon="P" label="Park"/g,                 'icon="Park" label="Park"')
  .replace(/icon="N" label="Nursery"/g,              'icon="Nurs" label="Nursery"')
  .replace(/icon="Rx" label="Pharmacy"/g,            'icon="Rx" label="Pharmacy"')
  .replace(/icon="S" label="Supermarket"/g,          'icon="Sup" label="Supermarket"')
  .replace(/icon="R" label="Restaurant"/g,           'icon="Rest" label="Top Restaurant"');

// Fix the FacilityRow component to show icon as a colored badge
src = src.replace(
  `<div style={{width:32,height:32,borderRadius:8,background:(color||"#94A3B8")+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{icon}</div>`,
  `<div style={{width:32,height:32,borderRadius:8,background:(color||"#94A3B8")+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:color||"#94A3B8",flexShrink:0,letterSpacing:0}}>{icon}</div>`
);

fs.writeFileSync("src/tabs/NeighbourhoodsTab.jsx", src, "utf8");
console.log("Done. Non-ASCII:", (src.match(/[^\x00-\x7F]/g)||[]).length);