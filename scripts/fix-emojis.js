const fs = require("fs");
let src = fs.readFileSync("src/tabs/NeighbourhoodsTab.jsx", "utf8");

// Fix all emoji characters to use proper unicode escapes or text alternatives
const emojiMap = {
  "🚇": "M",   // Metro
  "🏖": "~",   // Beach  
  "🏆": "GV",  // Golden Visa
  "⚽": "S",   // Sports
  "✓": "v",    // Verified check
  "🏫": "Sch", // School
  "🏥": "H",   // Hospital
  "🛍": "Mal", // Mall
  "🌳": "Pk",  // Park
  "🕌": "Ms",  // Mosque
  "👶": "Nr",  // Nursery
  "💊": "Ph",  // Pharmacy
  "🍽": "Rs",  // Restaurant
  "✈️": "Apt", // Airport
  "🛒": "Sup", // Supermarket
  "🏙": "[]",  // City
  "📈": "^",   // Yield up
  "⭐": "*",   // Star
  "⊞": "||",  // Grid
  "⊟": "=",   // Table
};

// Replace emojis with text labels in chip labels and icons
src = src.replace(/icon="🚇"/g, 'icon="🚇"');

// Actually just remove icon prop from Chip calls and use text only
src = src
  .replace(/<Chip icon="🚇" label="Metro"/g, '<Chip label="🚇 Metro"')
  .replace(/<Chip icon="🏖" label="Beach"/g, '<Chip label="🏖 Beach"')
  .replace(/<Chip icon="🏖" label="Waterfront"/g, '<Chip label="🏖 Waterfront"')
  .replace(/<Chip icon="🏆" label="GV"/g, '<Chip label="🏆 GV"')
  .replace(/<Chip icon="🏆" label="Golden Visa"/g, '<Chip label="🏆 Golden Visa"')
  .replace(/<Chip icon="⚽" label="Sports"/g, '<Chip label="⚽ Sports"')
  .replace(/<Chip icon="🏫" label=/g, '<Chip label=')
  .replace(/<Chip icon="🏥" label=/g, '<Chip label=')
  .replace(/<Chip icon="🛍" label=/g, '<Chip label=')
  .replace(/<Chip icon="🌳" label=/g, '<Chip label=')
  .replace(/<Chip icon="🏆" label="Golden Visa Eligible"/g, '<Chip label="🏆 Golden Visa Eligible"');

fs.writeFileSync("src/tabs/NeighbourhoodsTab.jsx", src, "utf8");
console.log("Done");