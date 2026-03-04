import React from "react";

const T = { bg: "#04090F", gold: "#D4A843", goldLight: "#E8C96A", textMuted: "#64748B", textSecondary: "#94A3B8", white: "#FFFFFF", surface: "#0A1628", border: "rgba(212,168,67,0.12)" };

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&display=swap');`}</style>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.bg} strokeWidth="2.5" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </div>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: T.white }}>DXB Analytics</span>
      </div>
      {/* 404 */}
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 120, fontWeight: 900, color: T.gold, lineHeight: 1, opacity: 0.15 }}>404</div>
      <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 800, color: T.white, marginTop: -20, marginBottom: 12 }}>Page Not Found</h1>
      <p style={{ fontSize: 14, color: T.textMuted, maxWidth: 400, textAlign: "center", lineHeight: 1.7, marginBottom: 32 }}>
        The page you're looking for doesn't exist or has been moved. Let's get you back to the dashboard.
      </p>
      <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 28px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.bg, borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none", fontFamily: "'Outfit', sans-serif", transition: "transform 0.2s" }}
        onMouseEnter={e => e.target.style.transform = "translateY(-2px)"} onMouseLeave={e => e.target.style.transform = "none"}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Back to Dashboard
      </a>
    </div>
  );
}
