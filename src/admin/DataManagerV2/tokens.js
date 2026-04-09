// Design tokens for DataManager V2
// Matches the existing admin panel palette
export const C = {
  bg: "#03080E", s1: "#070E17", s2: "#0B1520", s3: "#101C2A", s4: "#152030",
  border: "rgba(255,255,255,0.055)", borderG: "rgba(212,168,67,0.25)",
  gold: "#D4A843", goldD: "rgba(212,168,67,0.1)", goldB: "#F0C060",
  green: "#10B981", greenD: "rgba(16,185,129,0.1)",
  red: "#EF4444", redD: "rgba(239,68,68,0.1)",
  blue: "#3B82F6", blueD: "rgba(59,130,246,0.1)",
  teal: "#14B8A6", tealD: "rgba(20,184,166,0.1)",
  amber: "#F59E0B", amberD: "rgba(245,158,11,0.1)",
  purple: "#8B5CF6", purpleD: "rgba(139,92,246,0.1)",
  cyan: "#06B6D4", cyanD: "rgba(6,182,212,0.1)",
  w: "#F1F5F9", m: "#475569", t2: "#94A3B8",
  ff: `'Outfit',sans-serif`,
  ffH: `'Fraunces',serif`,
};

export const btnStyles = (variant, disabled = false) => {
  const base = {
    padding: "9px 16px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    fontFamily: C.ff,
    cursor: disabled ? "not-allowed" : "pointer",
    border: "none",
    transition: "all 0.15s",
    opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary: { ...base, background: `linear-gradient(135deg, ${C.gold}, #B8922A)`, color: "#000" },
    teal:    { ...base, background: C.tealD, color: C.teal, border: `1px solid ${C.teal}` },
    blue:    { ...base, background: C.blueD, color: C.blue, border: `1px solid ${C.blue}` },
    red:     { ...base, background: C.redD, color: C.red, border: `1px solid ${C.red}` },
    ghost:   { ...base, background: "transparent", color: C.t2, border: `1px solid ${C.border}` },
  };
  return variants[variant] || variants.ghost;
};

export const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  background: C.s2,
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  color: C.w,
  fontSize: 13,
  fontFamily: C.ff,
  outline: "none",
};

export const cardStyle = {
  background: C.s1,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: 20,
};