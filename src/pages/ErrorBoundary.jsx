import React from "react";

const T = { bg: "#04090F", gold: "#D4A843", goldLight: "#E8C96A", red: "#EF4444", textMuted: "#64748B", white: "#FFFFFF", surface: "#0A1628", border: "rgba(212,168,67,0.12)" };

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("DXB Analytics Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
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
          {/* Error Icon */}
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 800, color: T.white, marginBottom: 8 }}>Something Went Wrong</h1>
          <p style={{ fontSize: 13, color: T.textMuted, maxWidth: 400, textAlign: "center", lineHeight: 1.7, marginBottom: 8 }}>
            An unexpected error occurred. This has been logged automatically.
          </p>
          {this.state.error && (
            <div style={{ maxWidth: 500, padding: "10px 16px", background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 24 }}>
              <code style={{ fontSize: 11, color: T.red, wordBreak: "break-all" }}>{this.state.error.message}</code>
            </div>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => window.location.reload()} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.bg, borderRadius: 10, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              Reload Page
            </button>
            <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "none", border: `1px solid ${T.border}`, color: T.textMuted, borderRadius: 10, fontWeight: 600, fontSize: 13, textDecoration: "none", fontFamily: "'Outfit', sans-serif" }}>
              Back to Home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
