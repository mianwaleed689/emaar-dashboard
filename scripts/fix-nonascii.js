const fs = require("fs");
let src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "utf8");

// Replace all emoji usage with text alternatives
const replacements = [
  // Chips
  [/label="Metro 3km\+"/g,       'label="Metro <3km"'],
  [/label="Waterfront"/g,        'label="Beach"'],
  [/label="Metro Access"/g,      'label="Metro"'],
  [/label="Golden Visa"/g,       'label="Golden Visa"'],
  [/label="Sports"/g,            'label="Sports"'],
  [/label="GV"/g,                'label="Golden Visa"'],
  // FacilityRow icons
  ['icon="\\u{1F687}"',          'icon="[M]"'],
  // Filter buttons
  [/label=".*Metro"/g,           'label="Metro"'],
  [/label=".*Beach"/g,           'label="Beach"'],
  [/label=".*Sports"/g,          'label="Sports"'],
  [/label=".*Golden Visa"/g,     'label="Golden Visa"'],
  // Empty state icon
  [/fontSize:40.*marginBottom:12/g, 'fontSize:40,marginBottom:12'],
];

// Replace FacilityRow icons with text
src = src
  .replace(/icon="[^\x00-\x7F]+"\s+label="Nearest Metro"/g,       'icon="M" label="Nearest Metro"')
  .replace(/icon="[^\x00-\x7F]+"\s+label="Nearest School"/g,      'icon="S" label="Nearest School"')
  .replace(/icon="[^\x00-\x7F]+"\s+label="Nearest Hospital"/g,    'icon="H" label="Nearest Hospital"')
  .replace(/icon="[^\x00-\x7F]+"\s+label="Nearest Mall"/g,        'icon="$" label="Nearest Mall"')
  .replace(/icon="[^\x00-\x7F]+"\s+label="Nearest Beach"/g,       'icon="~" label="Nearest Beach"')
  .replace(/icon="[^\x00-\x7F]+"\s+label="Nearest Supermarket"/g, 'icon="S" label="Nearest Supermarket"')
  .replace(/icon="[^\x00-\x7F]+"\s+label="Nearest Park"/g,        'icon="P" label="Nearest Park"')
  .replace(/icon="[^\x00-\x7F]+"\s+label="Nearest Mosque"/g,      'icon="+" label="Nearest Mosque"')
  .replace(/icon="[^\x00-\x7F]+"\s+label="Nearest Nursery"/g,     'icon="N" label="Nearest Nursery"')
  .replace(/icon="[^\x00-\x7F]+"\s+label="Nearest Pharmacy"/g,    'icon="Rx" label="Nearest Pharmacy"')
  .replace(/icon="[^\x00-\x7F]+"\s+label="Top Restaurant"/g,      'icon="R" label="Top Restaurant"')
  .replace(/icon="[^\x00-\x7F]+"\s+label="DXB Airport"/g,         'icon="A" label="DXB Airport"')
  .replace(/icon="[^\x00-\x7F]+"\s+label="Supermarket"/g,         'icon="S" label="Supermarket"')
  .replace(/icon="[^\x00-\x7F]+"\s+label="Park"/g,                'icon="P" label="Park"')
  .replace(/icon="[^\x00-\x7F]+"\s+label="Mosque"/g,              'icon="+" label="Mosque"')
  .replace(/icon="[^\x00-\x7F]+"\s+label="Nursery"/g,             'icon="N" label="Nursery"')
  .replace(/icon="[^\x00-\x7F]+"\s+label="Pharmacy"/g,            'icon="Rx" label="Pharmacy"')
  // Filter buttons
  .replace(/label="[^\x00-\x7F]+ Metro"/g,       'label="Metro"')
  .replace(/label="[^\x00-\x7F]+ Beach"/g,       'label="Beach"')
  .replace(/label="[^\x00-\x7F]+ Sports"/g,      'label="Sports"')
  .replace(/label="[^\x00-\x7F]+ Golden Visa"/g, 'label="Golden Visa"')
  // Card chips
  .replace(/icon="[^\x00-\x7F]+" label="Metro"/g,      'label="Metro"')
  .replace(/icon="[^\x00-\x7F]+" label="Beach"/g,      'label="Beach"')
  .replace(/icon="[^\x00-\x7F]+" label="GV"/g,         'label="GV"')
  .replace(/icon="[^\x00-\x7F]+" label="Sports"/g,     'label="Sports"')
  .replace(/icon="[^\x00-\x7F]+" label="Waterfront"/g, 'label="Beach"')
  // Overview chips
  .replace(/icon="[^\x00-\x7F]+" label="Waterfront"/g,          'label="Beach"')
  .replace(/icon="[^\x00-\x7F]+" label={n\.nearestSchool/g,     'label={n.nearestSchool')
  .replace(/icon="[^\x00-\x7F]+" label={n\.nearestHospital/g,   'label={n.nearestHospital')
  .replace(/icon="[^\x00-\x7F]+" label={n\.nearestMall/g,       'label={n.nearestMall')
  .replace(/icon="[^\x00-\x7F]+" label={n\.nearestSports/g,     'label={n.nearestSports')
  .replace(/icon="[^\x00-\x7F]+" label={n\.nearestPark/g,       'label={n.nearestPark')
  .replace(/icon="[^\x00-\x7F]+" label="Golden Visa Eligible"/g,'label="Golden Visa Eligible"')
  // Empty state
  .replace(/<div style={{fontSize:40[^}]+}}>[^\x00-\x7F]+<\/div>/g, '<div style={{fontSize:40,marginBottom:12}}>[ ]</div>')
  // Highlight cards
  .replace(/icon:"[^\x00-\x7F]+",label:"Highest Yield"/g,  'label:"Highest Yield"')
  .replace(/icon:"[^\x00-\x7F]+",label:"Top Rated"/g,      'label:"Top Rated"')
  .replace(/icon:"[^\x00-\x7F]+",label:"Nearest Beach"/g,  'label:"Nearest Beach"')
  .replace(/\{h\.icon&&<span>\{h\.icon\}<\/span>\}/g,       '')
  // Sports section header
  .replace(/<div[^>]*>[^\x00-\x7F]+ Sports Facilities<\/div>/g, '<div style={{fontSize:11,fontWeight:700,color:T.white,marginBottom:8}}>Sports Facilities</div>')
  // Investment score header
  .replace(/[^\x00-\x7F]+\s+UAE Golden Visa Eligible/g, 'UAE Golden Visa Eligible')
  // View buttons arrows
  .replace(/View Yields [^\x00-\x7F]+/g, 'View Yields ->')
  .replace(/Price History [^\x00-\x7F]+/g, 'Price History ->')
  // Sort A-Z
  .replace(/Sort: A[^\x00-\x7F]+Z/g, 'Sort: A-Z');

fs.writeFileSync("src/tabs/NeighbourhoodsTab.jsx", src, "utf8");
console.log("Done — all non-ASCII replaced with text");
console.log("Remaining non-ASCII:", (src.match(/[^\x00-\x7F]/g)||[]).length);