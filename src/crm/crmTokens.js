// DXB Analytics CRM — Design Tokens v2
export const C = {
  bg:          "#070D1A",
  surface:     "#0A1020",
  surfaceAlt:  "#0F1828",
  card:        "#0D1525",
  cardHover:   "#111D30",
  border:      "rgba(255,255,255,0.06)",
  borderHover: "rgba(255,255,255,0.12)",
  gold:        "#D4A843",
  goldLight:   "#F0C866",
  goldDim:     "rgba(212,168,67,0.12)",
  goldBorder:  "rgba(212,168,67,0.25)",
  teal:        "#00BFA5",
  tealDim:     "rgba(0,191,165,0.12)",
  blue:        "#3B82F6",
  blueDim:     "rgba(59,130,246,0.12)",
  purple:      "#8B5CF6",
  purpleDim:   "rgba(139,92,246,0.12)",
  green:       "#10B981",
  greenDim:    "rgba(16,185,129,0.12)",
  red:         "#EF4444",
  redDim:      "rgba(239,68,68,0.12)",
  yellow:      "#FBBF24",
  yellowDim:   "rgba(251,191,36,0.12)",
  orange:      "#F59E0B",
  wa:          "#25D366",
  waDim:       "rgba(37,211,102,0.1)",
  white:       "#FFFFFF",
  text:        "#E2E8F0",
  textSec:     "#94A3B8",
  textMuted:   "#374151",
  sans:        "'Outfit','Inter',sans-serif",
  serif:       "'Georgia',serif",
};

export const LEAD_STAGES = [
  { key:"New Lead",       color:"#3B82F6", bg:"rgba(59,130,246,0.12)" },
  { key:"Hot Case",       color:"#EF4444", bg:"rgba(239,68,68,0.12)" },
  { key:"Potential",      color:"#8B5CF6", bg:"rgba(139,92,246,0.12)" },
  { key:"No Answer",      color:"#6B7280", bg:"rgba(107,114,128,0.12)" },
  { key:"Low Budget",     color:"#F59E0B", bg:"rgba(245,158,11,0.12)" },
  { key:"Non Potential",  color:"#DC2626", bg:"rgba(220,38,38,0.12)" },
  { key:"WhatsApp",       color:"#25D366", bg:"rgba(37,211,102,0.12)" },
  { key:"EOI",            color:"#00BFA5", bg:"rgba(0,191,165,0.12)" },
  { key:"Interested",     color:"#10B981", bg:"rgba(16,185,129,0.12)" },
  { key:"Not Interested", color:"#EF4444", bg:"rgba(239,68,68,0.12)" },
  { key:"Call Later",     color:"#6366F1", bg:"rgba(99,102,241,0.12)" },
  { key:"Resale/Rent",    color:"#D4A843", bg:"rgba(212,168,67,0.12)" },
  { key:"Closed Deal",    color:"#10B981", bg:"rgba(16,185,129,0.2)" },
  { key:"Closed Outside", color:"#EF4444", bg:"rgba(239,68,68,0.2)" },
];

export const DEAL_STAGES = [
  { key:"EOI",         color:"#3B82F6", bg:"rgba(59,130,246,0.12)" },
  { key:"Reservation", color:"#F59E0B", bg:"rgba(245,158,11,0.12)" },
  { key:"Contracted",  color:"#10B981", bg:"rgba(16,185,129,0.12)" },
  { key:"Cancelled",   color:"#EF4444", bg:"rgba(239,68,68,0.12)" },
];

export const OPP_STAGES = [
  { key:"New",         color:"#3B82F6" },
  { key:"Qualified",   color:"#8B5CF6" },
  { key:"Proposal",    color:"#F59E0B" },
  { key:"Negotiation", color:"#00BFA5" },
  { key:"Won",         color:"#10B981" },
  { key:"Lost",        color:"#EF4444" },
];

export const SOURCES = [
  "Property Finder","Bayut","Dubizzle","Meta/Facebook",
  "Instagram","WhatsApp","Google Ads","Referral",
  "Website","Manual","Cold Call","Email","TikTok","Other"
];

export const QUOTES = [
  { text:"In real estate, the money is made in the buy.", author:"Warren Buffett" },
  { text:"Real estate cannot be lost or stolen, nor can it be carried away.", author:"Franklin D. Roosevelt" },
  { text:"Buy land, they're not making it anymore.", author:"Mark Twain" },
  { text:"The best investment on earth is earth.", author:"Louis Glickman" },
  { text:"A leader is one who knows the way, goes the way, and shows the way.", author:"John C. Maxwell" },
  { text:"Success is not the key to happiness. Happiness is the key to success.", author:"Albert Schweitzer" },
  { text:"The secret of getting ahead is getting started.", author:"Mark Twain" },
];

export const fmt = n => {
  if (!n && n !== 0) return "0";
  if (n >= 1e9) return (n/1e9).toFixed(1)+"B";
  if (n >= 1e6) return (n/1e6).toFixed(1)+"M";
  if (n >= 1e3) return (n/1e3).toFixed(0)+"K";
  return String(Math.round(n));
};
export const fmtAED = n => "AED "+fmt(n);
export const fmtDate = d => { try { return new Date(d).toLocaleDateString("en-AE",{day:"numeric",month:"short",year:"numeric"}); } catch { return "—"; } };
export const timeAgo = d => {
  if (!d) return "Never";
  const diff = Date.now()-new Date(d).getTime();
  const m = Math.floor(diff/60000);
  if (m<1) return "Just now";
  if (m<60) return m+"m ago";
  const h = Math.floor(m/60);
  if (h<24) return h+"h ago";
  const dy = Math.floor(h/24);
  if (dy<7) return dy+"d ago";
  return fmtDate(d);
};
export const getStageCfg = key => LEAD_STAGES.find(s=>s.key===key)||{color:"#6B7280",bg:"rgba(107,114,128,0.12)"};
