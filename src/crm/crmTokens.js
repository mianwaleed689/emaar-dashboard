// DXB Analytics CRM — Design Tokens
export const C = {
  // Backgrounds
  bg:         "#0A0F1A",
  surface:    "#111827",
  surfaceAlt: "#1A2236",
  card:       "#151E2D",
  cardHover:  "#1E2A3D",
  border:     "rgba(255,255,255,0.07)",
  borderHover:"rgba(255,255,255,0.15)",

  // Brand
  gold:       "#D4A843",
  goldLight:  "#F0C866",
  goldDim:    "rgba(212,168,67,0.12)",
  teal:       "#00BFA5",
  tealDim:    "rgba(0,191,165,0.12)",
  blue:       "#3B82F6",
  blueDim:    "rgba(59,130,246,0.12)",
  purple:     "#8B5CF6",
  purpleDim:  "rgba(139,92,246,0.12)",
  orange:     "#F59E0B",
  orangeDim:  "rgba(245,158,11,0.12)",

  // Status
  green:      "#10B981",
  greenDim:   "rgba(16,185,129,0.12)",
  red:        "#EF4444",
  redDim:     "rgba(239,68,68,0.12)",
  yellow:     "#FBBF24",
  yellowDim:  "rgba(251,191,36,0.12)",

  // Text
  white:      "#FFFFFF",
  text:       "#E2E8F0",
  textSec:    "#94A3B8",
  textMuted:  "#4B5563",

  // Fonts
  serif:      "'Georgia', serif",
  sans:       "'Outfit', 'Inter', sans-serif",
};

// Pipeline stages
export const LEAD_STAGES = [
  { key: "New Lead",       color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  { key: "Hot Case",       color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  { key: "Potential",      color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  { key: "No Answer",      color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
  { key: "Low Budget",     color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  { key: "Non Potential",  color: "#DC2626", bg: "rgba(220,38,38,0.12)" },
  { key: "WhatsApp",       color: "#25D366", bg: "rgba(37,211,102,0.12)" },
  { key: "EOI",            color: "#00BFA5", bg: "rgba(0,191,165,0.12)" },
  { key: "Interested",     color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  { key: "Not Interested", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  { key: "Call Later",     color: "#6366F1", bg: "rgba(99,102,241,0.12)" },
  { key: "Resale/Rent",    color: "#D4A843", bg: "rgba(212,168,67,0.12)" },
  { key: "Closed Deal",    color: "#10B981", bg: "rgba(16,185,129,0.2)" },
  { key: "Closed Outside", color: "#EF4444", bg: "rgba(239,68,68,0.2)" },
];

export const DEAL_STAGES = [
  { key: "EOI",         color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  { key: "Reservation", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  { key: "Contracted",  color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  { key: "Cancelled",   color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
];

export const OPP_STAGES = [
  { key: "New",          color: "#3B82F6" },
  { key: "Qualified",    color: "#8B5CF6" },
  { key: "Proposal",     color: "#F59E0B" },
  { key: "Negotiation",  color: "#00BFA5" },
  { key: "Won",          color: "#10B981" },
  { key: "Lost",         color: "#EF4444" },
];

export const SOURCES = [
  "Property Finder", "Bayut", "Dubizzle", "Meta/Facebook",
  "Instagram", "WhatsApp", "Google Ads", "Referral",
  "Website", "Manual", "Cold Call", "Email", "TikTok"
];

export const ACTIVITY_TYPES = [
  { key: "call",     label: "Log Call",         icon: "📞", color: "#3B82F6" },
  { key: "meeting",  label: "Schedule Meeting",  icon: "📅", color: "#8B5CF6" },
  { key: "message",  label: "Send Message",      icon: "💬", color: "#00BFA5" },
  { key: "note",     label: "Add Note",          icon: "📝", color: "#F59E0B" },
  { key: "email",    label: "Send Email",        icon: "📧", color: "#10B981" },
];

export const QUOTES = [
  { text: "A leader is one who knows the way, goes the way, and shows the way.", author: "John C. Maxwell" },
  { text: "Leadership is not about being in charge. It's about taking care of those in your charge.", author: "Simon Sinek" },
  { text: "Success is not the key to happiness. Happiness is the key to success.", author: "Albert Schweitzer" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "In real estate, you make 10% of your money because you're a genius and 90% because you catch a great wave.", author: "Jeff Greene" },
  { text: "Buy land, they're not making it anymore.", author: "Mark Twain" },
  { text: "Real estate is not just about properties, it's about people.", author: "Unknown" },
];

export const fmt = (n) => {
  if (!n) return "0";
  if (n >= 1e9) return (n/1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n/1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n/1e3).toFixed(0) + "K";
  return String(n);
};

export const fmtAED = (n) => "AED " + fmt(n);
export const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-AE", { day:"numeric", month:"short", year:"numeric" }); }
  catch { return "—"; }
};
export const timeAgo = (d) => {
  if (!d) return "Never";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff/60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins/60);
  if (hrs < 24) return hrs + "h ago";
  const days = Math.floor(hrs/24);
  if (days < 7) return days + "d ago";
  return fmtDate(d);
};
