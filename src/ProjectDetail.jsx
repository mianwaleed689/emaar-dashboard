/* ─── DXB ANALYTICS — PROJECT DETAIL PAGE ─────────────────────────────────
   Route: /project/:id
   Full standalone page for each Emaar project — SEO-friendly, shareable URL,
   all sections from the modal expanded into a proper page layout.
   ─────────────────────────────────────────────────────────────────────────── */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { T, emaarProjects, communityIntel, communityROI } from "./data";
import RoiCalculator from "./RoiCalculator";

/* ─── LINK HELPERS ─── */
const getLinkDomain = (url) => {
  if (!url) return "Official Listing";
  if (url.includes("propertyfinder.ae")) return "PropertyFinder.ae";
  if (url.includes("bayut.com")) return "Bayut.com";
  if (url.includes("properties.emaar.com") || url.includes("emaar.com")) return "Emaar.com";
  return "Official Listing";
};
/* ─── HANDOVER COUNTDOWN ─── */
const getHandoverCountdown = (handover) => {
  if (!handover) return null;
  const match = handover.match(/Q([1-4])\s+(\d{4})/);
  if (!match) return null;
  const q = parseInt(match[1]);
  const year = parseInt(match[2]);
  const qEndMonth = [2, 5, 8, 11];
  const qEndDay   = [31, 30, 30, 31];
  const target = new Date(year, qEndMonth[q - 1], qEndDay[q - 1]);
  const now = new Date();
  const diffMs = target - now;
  if (diffMs <= 0) return { label: "Handover due", color: "#10B981", urgent: false, passed: true };
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  let label, color;
  if (diffDays <= 90) { label = diffDays + "d left"; color = "#EF4444"; }
  else if (diffMonths <= 6) { label = diffMonths + "mo left"; color = "#F59E0B"; }
  else if (diffMonths <= 18) { label = diffMonths + "mo left"; color = "#D4A843"; }
  else { label = (diffMonths / 12).toFixed(1) + "yr left"; color = "#94A3B8"; }
  return { label, color, urgent: diffDays <= 90, months: diffMonths, days: diffDays };
};



/* ─── helpers ─── */
const fmtM = (v) => v ? `AED ${(v / 1_000_000).toFixed(2)}M` : "—";
const fmtNum = (v) => v ? `AED ${Number(v).toLocaleString()}` : "—";


const getUnitEntries = (units) => {
  if (!units) return [];
  if (Array.isArray(units))
    return units.filter(u => u && (u.total || 0) > 0).map(u => [u.type || "Unit", { total: u.total || 0, sold: (u.total || 0) - (u.available || 0) }]);
  return Object.entries(units).filter(([, d]) => d && d.total > 0);
};

const constructionColor = (pct) =>
  pct >= 100 ? T.green : pct >= 70 ? T.green : pct >= 30 ? T.gold : T.blue;

/* ─── sub-components ─── */
const Chip = ({ label, color = T.gold, bg }) => (
  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: bg || `${color}18`, color, border: `1px solid ${color}33`, letterSpacing: 0.4 }}>{label}</span>
);

const StatBox = ({ label, value, color = T.white, sub, subColor }) => (
  <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
    <div style={{ fontSize: 9, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: 15, fontWeight: 800, color, fontFamily: "'Fraunces', serif" }}>{value}</div>
    {sub && <div style={{ fontSize: 9, color: subColor || T.textMuted, marginTop: 2, fontWeight: subColor ? 700 : 400 }}>{sub}</div>}
  </div>
);

const SectionTitle = ({ children }) => (
  <h2 style={{ fontSize: 11, fontWeight: 700, color: T.goldLight, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>
    {children}
  </h2>
);

const ProGateInline = ({ isPro, onUpgrade, children }) => {
  if (isPro) return children;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ filter: "blur(5px)", pointerEvents: "none", userSelect: "none", opacity: 0.45 }}>{children}</div>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(4,9,15,0.82)", borderRadius: 16, backdropFilter: "blur(4px)", zIndex: 5 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.gold}`, borderRadius: 16, padding: "28px 32px", textAlign: "center", maxWidth: 380, boxShadow: `0 20px 60px rgba(0,0,0,0.5)` }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, fontWeight: 800, color: T.white, marginBottom: 6 }}>Pro Feature</div>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16, lineHeight: 1.6 }}>Upgrade to Pro to unlock location intelligence, yield data, and ROI analytics.</div>
          <button onClick={onUpgrade} style={{ width: "100%", padding: "11px 0", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, color: T.bg, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>
            Unlock Pro — AED 99/mo →
          </button>
        </div>
      </div>
    </div>
  );
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Fraunces:opsz,wght@9..144,700;9..144,900&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #04090F; overflow-x: hidden; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  .pd-card { background: #0A1628; border: 1px solid rgba(212,168,67,0.12); border-radius: 14px; padding: 22px; margin-bottom: 16px; animation: fadeUp 0.4s ease-out both; }
  .pd-back { display: inline-flex; align-items: center; gap: 6px; color: #94A3B8; font-size: 13px; text-decoration: none; transition: color 0.2s; font-family: 'Outfit', sans-serif; }
  .pd-back:hover { color: #D4A843; }
  .pd-share { display: flex; align-items: center; gap: 6px; padding: "8px 16px"; background: transparent; border: 1px solid rgba(212,168,67,0.25); border-radius: 8px; color: #94A3B8; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; transition: all 0.2s; }
  .pd-share:hover { color: #D4A843; border-color: rgba(212,168,67,0.5); }
  .amenity-card { background: #0E1D35; border-radius: 10px; padding: 12px; border-left: 3px solid; }
  @media (max-width: 768px) {
    .pd-grid-3 { grid-template-columns: 1fr 1fr !important; }
    .pd-grid-2 { grid-template-columns: 1fr !important; }
    .pd-main { grid-template-columns: 1fr !important; }
    .pd-hero-row { flex-direction: column !important; align-items: flex-start !important; }
  }
`;

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [firestoreOverride, setFirestoreOverride] = useState({});
  const [userTier, setUserTier] = useState("free");
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [copied, setCopied] = useState(false);

  const isPro = ["pro", "pro_trial", "enterprise", "admin"].includes(userTier);

  /* ── load project from data.js + Firestore override ── */
  useEffect(() => {
    const base = emaarProjects.find(p => p.id === Number(id) || p.id === id || String(p.id) === String(id));
    if (!base) { setProject(null); return; }

    // Try Firestore override
    const unsub = onSnapshot(doc(db, "projectData", String(base.id)), (snap) => {
      const override = snap.exists() ? snap.data() : {};
      setFirestoreOverride(override);
      setProject({ ...base, ...override });
    }, () => {
      setProject(base);
    });
    return () => unsub();
  }, [id]);

  /* ── auth listener ── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { setUserTier("free"); return; }
      setUserEmail(u.email || "");
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          const d = snap.data();
          setUserTier(d.tier || d.role || "free");
          setUserName(d.name || d.displayName || u.email?.split("@")[0] || "");
        }
      } catch {}
    });
    return () => unsub();
  }, []);

  /* ── page title ── */
  useEffect(() => {
    if (project) {
      document.title = `${project.name} — DXB Analytics`;
    }
  }, [project]);

  /* ── loading / not found ── */
  if (project === null && emaarProjects.length > 0) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Outfit', sans-serif", color: T.textPrimary }}>
        <style>{css}</style>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏗️</div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, color: T.white, marginBottom: 8 }}>Project Not Found</h1>
        <p style={{ color: T.textMuted, marginBottom: 24 }}>ID #{id} doesn't match any project in our database.</p>
        <Link to="/" style={{ padding: "12px 28px", background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, color: T.bg, borderRadius: 10, fontWeight: 700, textDecoration: "none", fontSize: 14 }}>← Back to Dashboard</Link>
      </div>
    );
  }
  if (!project) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{css}</style>
        <div style={{ width: 28, height: 28, border: "2px solid rgba(212,168,67,0.3)", borderTopColor: T.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const ci = communityIntel[project.community] || null;
  const roi = communityROI[project.community] || null;
  const price = project.price || 0;
  const gross = roi?.grossYield?.apt1 || roi?.grossYield?.th || roi?.grossYield?.villa || 0;
  const net = roi?.netYield?.apt1 || roi?.netYield?.th || roi?.netYield?.villa || 0;
  const appr5 = roi?.appreciation5yr || 0;
  const annualRent = roi?.estRent?.apt1 || roi?.estRent?.th || roi?.estRent?.villa || 0;
  const projValue = price > 0 ? price * (1 + appr5 / 100) : 0;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };


  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Outfit', sans-serif", color: T.textPrimary }}>
      <style>{css}</style>

      {/* ── NAVBAR ── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(4,9,15,0.95)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${T.border}`, padding: "14px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link to="/" className="pd-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Dashboard
          </Link>
          <span style={{ color: T.border, fontSize: 14 }}>/</span>
          <span style={{ fontSize: 13, color: T.textMuted }}>{project.community}</span>
          <span style={{ color: T.border, fontSize: 14 }}>/</span>
          <span style={{ fontSize: 13, color: T.gold, fontWeight: 600 }}>{project.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="pd-share" onClick={handleShare} style={{ padding: "7px 14px", display: "flex", alignItems: "center", gap: 6 }}>
            {copied
              ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> <span style={{ color: T.green }}>Copied!</span></>
              : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Share</>
            }
          </button>
          {project.emaarUrl && (
            <a href={project.emaarUrl} target="_blank" rel="noopener noreferrer"
              style={{ padding: "7px 14px", borderRadius: 8, background: T.goldMuted, border: `1px solid ${T.border}`, color: T.gold, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
              View on {getLinkDomain(project.emaarUrl)} ↗
            </a>
          )}
        </div>
      </nav>

      {/* ── HERO IMAGE ── */}
      {project.imageUrl && (
        <div style={{ width: "100%", height: 340, overflow: "hidden", position: "relative" }}>
          <img src={project.imageUrl} alt={project.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={e => { e.target.parentElement.style.display = "none"; }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(4,9,15,0.95))" }} />
          <div style={{ position: "absolute", bottom: 28, left: 40 }}>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 900, color: T.white, marginBottom: 6 }}>{project.name}</h1>
            <p style={{ color: T.textSecondary, fontSize: 15 }}>{project.community} · {project.district} · {project.type}</p>
          </div>
        </div>
      )}

      {/* ── MAIN LAYOUT ── */}
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── TITLE (if no image) ── */}
        {!project.imageUrl && (
          <div style={{ marginBottom: 24, animation: "fadeUp 0.4s both" }}>
            <div className="pd-hero-row" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 36, fontWeight: 900, color: T.gold, marginBottom: 6 }}>{project.name}</h1>
                <p style={{ color: T.textSecondary, fontSize: 15 }}>{project.community} · {project.district} · {project.type}</p>
                {ci && <p style={{ color: T.teal, fontSize: 12, marginTop: 4, fontStyle: "italic" }}>{ci.tagline}</p>}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {project.branded && <Chip label={project.brand} />}
                <Chip label={project.status || "Off-Plan"}
                  color={project.status === "Completed" ? T.green : project.status === "Under Construction" ? T.green : T.blue}
                />
                {project.tier && <Chip label={project.tier} color={T.teal} />}
              </div>
            </div>
          </div>
        )}
        {project.imageUrl && ci && (
          <p style={{ color: T.teal, fontSize: 12, marginBottom: 20, fontStyle: "italic" }}>{ci.tagline}</p>
        )}

        <div className="pd-main" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>

          {/* ── LEFT COLUMN ── */}
          <div>

            {/* Status badges (shown with image hero) */}
            {project.imageUrl && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {project.branded && <Chip label={project.brand} />}
                <Chip label={project.status || "Off-Plan"} color={project.status === "Completed" ? T.green : project.status === "Under Construction" ? T.green : T.blue} />
                {project.tier && <Chip label={project.tier} color={T.teal} />}
              </div>
            )}

            {/* Construction progress */}
            <div className="pd-card" style={{ animationDelay: "0.05s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: T.textSecondary, fontWeight: 600 }}>Construction Progress</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: constructionColor(project.construction), fontFamily: "'Fraunces', serif" }}>{project.construction}%</span>
              </div>
              <div style={{ height: 10, borderRadius: 5, background: T.surfaceAlt, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${project.construction}%`, borderRadius: 5, background: constructionColor(project.construction), transition: "width 0.8s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: T.textMuted }}>
                <span>Launch</span>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  Handover: {project.handover}
                  {(() => { const cd = getHandoverCountdown(project.handover); return cd ? (
                    <span style={{ fontSize: 10, fontWeight: 700, color: cd.passed ? "#10B981" : cd.color, background: cd.passed ? "rgba(16,185,129,0.1)" : cd.urgent ? "rgba(239,68,68,0.12)" : "rgba(212,168,67,0.08)", padding: "1px 6px", borderRadius: 4 }}>
                      {cd.passed ? "\u2713 Ready" : "\u23F1 " + cd.label}
                    </span>
                  ) : null; })()}
                </span>
              </div>
            </div>

            {/* Key details grid */}
            <div className="pd-card" style={{ animationDelay: "0.1s" }}>
              <SectionTitle>📋 Project Details</SectionTitle>
              <div className="pd-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                <StatBox label="Starting From" value={price ? fmtM(price) : "TBD"} color={T.gold} />
                <StatBox label="Handover" value={project.handover || "—"} />
                <StatBox label="Price / sqft" value={project.ppsf ? `AED ${project.ppsf.toLocaleString()}` : "—"} />
                <StatBox label="Size Range" value={project.sizeFrom ? `${project.sizeFrom.toLocaleString()}–${(project.sizeTo || "").toLocaleString()} sqft` : project.sizeRange || "—"} />
                <StatBox label="Bedrooms" value={project.beds ? project.beds + " BR" : "—"} />
                <StatBox label="Payment Plan" value={project.payment || project.paymentPlan || "—"} color={T.teal} />
              </div>
            </div>

            {/* Unit inventory */}
            {project.units && getUnitEntries(project.units).length > 0 && (
              <div className="pd-card" style={{ animationDelay: "0.15s" }}>
                <SectionTitle>🏢 Unit Inventory & Availability</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                  {getUnitEntries(project.units).map(([type, d]) => {
                    const avail = d.total - d.sold;
                    const pct = d.total > 0 ? (d.sold / d.total) * 100 : 0;
                    return (
                      <div key={type} style={{ background: T.surfaceAlt, borderRadius: 10, padding: 14, textAlign: "center", border: `1px solid ${avail === 0 ? "rgba(239,68,68,0.2)" : T.border}` }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: T.gold, textTransform: "uppercase", marginBottom: 6 }}>{type}</div>
                        <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Fraunces', serif", color: avail > 0 ? T.green : T.red }}>{avail}</div>
                        <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 8 }}>available of {d.total}</div>
                        <div style={{ height: 4, borderRadius: 2, background: T.bg }}>
                          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2, background: pct >= 90 ? T.red : pct >= 60 ? T.gold : T.green }} />
                        </div>
                        <div style={{ fontSize: 9, color: T.textMuted, marginTop: 4 }}>{pct.toFixed(0)}% sold</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Location Intelligence */}
            {ci && (
              <ProGateInline isPro={isPro} onUpgrade={() => navigate("/?upgrade=1")}>
                <div className="pd-card" style={{ animationDelay: "0.2s" }}>
                  <SectionTitle>📍 Location Intelligence</SectionTitle>
                  <div style={{ background: `linear-gradient(135deg, rgba(212,168,67,0.07), rgba(0,191,165,0.04))`, borderRadius: 10, padding: 14, border: `1px solid ${T.border}`, marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, marginBottom: 6 }}>⭐ Famous For</div>
                    <p style={{ fontSize: 13, color: T.textPrimary, lineHeight: 1.6, marginBottom: 8 }}>{ci.famousFor}</p>
                    <div style={{ fontSize: 11, color: T.textMuted }}><span style={{ color: T.teal }}>Developer:</span> {ci.masterDev} · <span style={{ color: T.teal }}>Lifestyle:</span> {ci.lifestyle}</div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>🏢 Key Amenities</div>
                    <div className="pd-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {ci.keyAmenities?.map((a, i) => (
                        <div key={i} className="amenity-card" style={{ borderLeftColor: [T.blue, T.red, T.gold, T.teal][i % 4] }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 3 }}>{a.icon} {a.label}</div>
                          <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.4 }}>{a.items}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>🗺️ Drive Times</div>
                    <div style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}` }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: T.surfaceAlt }}>
                            <th style={{ padding: "8px 12px", textAlign: "left", color: T.gold, fontWeight: 600, fontSize: 10 }}>Destination</th>
                            <th style={{ padding: "8px 12px", textAlign: "center", color: T.gold, fontWeight: 600, fontSize: 10 }}>Distance</th>
                            <th style={{ padding: "8px 12px", textAlign: "center", color: T.gold, fontWeight: 600, fontSize: 10 }}>Drive</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ci.distances?.map((d, i) => (
                            <tr key={i} style={{ borderTop: `1px solid ${T.border}`, background: i % 2 === 0 ? "transparent" : "rgba(14,29,53,0.3)" }}>
                              <td style={{ padding: "8px 12px", color: T.textPrimary }}>{d.dest}</td>
                              <td style={{ padding: "8px 12px", textAlign: "center", color: T.textSecondary }}>{d.km} km</td>
                              <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: d.min <= 10 ? "rgba(16,185,129,0.15)" : d.min <= 20 ? "rgba(212,168,67,0.15)" : "rgba(59,130,246,0.12)", color: d.min <= 10 ? T.green : d.min <= 20 ? T.gold : T.blue }}>
                                  {d.min} min
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {ci.roads && <p style={{ fontSize: 10, color: T.textMuted, marginTop: 8 }}>🛣️ <strong>Road Access:</strong> {ci.roads}</p>}
                  </div>
                </div>
              </ProGateInline>
            )}

            {/* ROI & Yields */}
            {roi && (
              <ProGateInline isPro={isPro} onUpgrade={() => navigate("/?upgrade=1")}>
                <div className="pd-card" style={{ animationDelay: "0.25s", background: "linear-gradient(135deg, rgba(16,185,129,0.04), rgba(212,168,67,0.03))", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <SectionTitle>💰 ROI & Yield Estimates</SectionTitle>
                  <div className="pd-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                    <StatBox label="Gross Yield" value={gross + "%"} color={T.green} />
                    <StatBox label="Net Yield" value={net + "%"} color={T.teal} />
                    <StatBox label="5-Yr Appreciation" value={"+" + appr5 + "%"} color={T.gold} />
                    <StatBox label="Annual YoY" value={"+" + (roi.appreciationYoY || 0) + "%"} color={T.blue} />
                  </div>
                  <div className="pd-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    {price > 0 && <StatBox label="Est. 5-Yr Value" value={`AED ${(projValue / 1e6).toFixed(2)}M`} color={T.gold} sub={`+AED ${((projValue - price) / 1e6).toFixed(2)}M gain`} />}
                    {annualRent > 0 && <StatBox label="Est. Annual Rent" value={`AED ${annualRent.toLocaleString()}`} color={T.teal} sub="1BR estimate" />}
                    <StatBox label="Golden Visa" value={roi.goldenVisa ? "✓ Eligible" : "Not Eligible"} color={roi.goldenVisa ? T.green : T.textMuted} sub={roi.goldenVisaNote} />
                  </div>
                  {(roi.riskLevel || roi.occupancy) && (
                    <div style={{ marginTop: 12, fontSize: 11, color: T.textMuted }}>
                      {roi.riskLevel && <>Risk: <span style={{ color: roi.riskLevel === "Low" ? T.green : roi.riskLevel === "Medium" ? T.gold : T.red, fontWeight: 600 }}>{roi.riskLevel}</span></>}
                      {roi.occupancy && <> · Occupancy: <span style={{ color: T.white, fontWeight: 600 }}>{roi.occupancy}%</span></>}
                    </div>
                  )}
                </div>
              </ProGateInline>
            )}

            {/* ROI Calculator */}
            {roi && (
              <ProGateInline isPro={isPro} onUpgrade={() => navigate("/?upgrade=1")}>
                <div className="pd-card" style={{ animationDelay: "0.3s" }}>
                  <SectionTitle>🧮 ROI Calculator</SectionTitle>
                  <RoiCalculator project={project} roi={roi} T={T} />
                </div>
              </ProGateInline>
            )}

            {/* Price history */}
            {Array.isArray(project.priceHistory) && project.priceHistory.length >= 2 && (
              <div className="pd-card" style={{ animationDelay: "0.35s" }}>
                <SectionTitle>📈 Price History</SectionTitle>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={project.priceHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.textMuted, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1_000_000).toFixed(1)}M`} />
                    <Tooltip formatter={v => [`AED ${Number(v).toLocaleString()}`, "Price"]} contentStyle={{ background: T.surface, border: `1px solid ${T.gold}`, borderRadius: 8, fontSize: 11 }} />
                    <Area type="monotone" dataKey="price" stroke={T.gold} fill="rgba(212,168,67,0.1)" strokeWidth={2} dot={{ r: 3, fill: T.gold }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Documents */}
            {(project.pdfBrochure || project.pdfFloorPlan || project.pdfPaymentPlan || project.pdfFactSheet || project.videoUrl) && (
              <div className="pd-card" style={{ animationDelay: "0.4s" }}>
                <SectionTitle>📎 Documents & Media</SectionTitle>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {project.pdfBrochure && <a href={project.pdfBrochure} target="_blank" rel="noreferrer" style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.3)", color: T.gold, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>📄 Brochure</a>}
                  {project.pdfFloorPlan && <a href={project.pdfFloorPlan} target="_blank" rel="noreferrer" style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", color: T.blue, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>🏠 Floor Plan</a>}
                  {project.pdfPaymentPlan && <a href={project.pdfPaymentPlan} target="_blank" rel="noreferrer" style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: T.green, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>💳 Payment Plan</a>}
                  {project.pdfFactSheet && <a href={project.pdfFactSheet} target="_blank" rel="noreferrer" style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(0,191,165,0.1)", border: "1px solid rgba(0,191,165,0.3)", color: T.teal, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>📊 Fact Sheet</a>}
                </div>
                {project.videoUrl && (
                  <div style={{ marginTop: 12, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.border}` }}>
                    <video controls style={{ width: "100%", maxHeight: 260, background: "#000", display: "block" }}>
                      <source src={project.videoUrl} />
                    </video>
                  </div>
                )}
              </div>
            )}

          </div>{/* end left col */}

          {/* ── RIGHT SIDEBAR ── */}
          <div>

            {/* Quick stats */}
            <div className="pd-card" style={{ animationDelay: "0.05s" }}>
              <SectionTitle>⚡ Quick Stats</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Developer", value: "Emaar Properties" },
                  { label: "Community", value: project.community },
                  { label: "District", value: project.district || "—" },
                  { label: "Type", value: project.type || "—" },
                  { label: "Construction", value: `${project.construction}%` },
                  { label: "Handover", value: project.handover || "—" },
                  { label: "Payment Plan", value: project.payment || "—" },
                  ...(price ? [{ label: "Starting From", value: fmtM(price), highlight: true }] : []),
                  ...(project.ppsf ? [{ label: "Price / sqft", value: `AED ${project.ppsf.toLocaleString()}` }] : []),
                  ...(roi ? [{ label: "Gross Yield", value: `${gross}%`, color: T.green }] : []),
                  ...(roi?.goldenVisa ? [{ label: "Golden Visa", value: "Eligible ✓", color: T.green }] : []),
                ].map((row, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                    <span style={{ color: T.textMuted }}>{row.label}</span>
                    <span style={{ fontWeight: 600, color: row.color || (row.highlight ? T.gold : T.white) }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>


            {/* Location summary */}
            {ci && isPro && (
              <div className="pd-card" style={{ animationDelay: "0.15s" }}>
                <SectionTitle>📊 Investment Summary</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <StatBox label="Est. Yield" value={ci.avgYield || (gross ? gross + "%" : "—")} color={T.green} />
                  <StatBox label="Golden Visa" value={roi?.goldenVisa ? "✓ Yes" : "Below 2M"} color={roi?.goldenVisa ? T.green : T.textMuted} />
                  <StatBox label="Risk Level" value={roi?.riskLevel || "—"} color={roi?.riskLevel === "Low" ? T.green : roi?.riskLevel === "Medium" ? T.gold : T.red} />
                  <StatBox label="Occupancy" value={roi?.occupancy ? roi.occupancy + "%" : "—"} color={T.teal} />
                </div>
              </div>
            )}

            {/* Similar projects */}
            <div className="pd-card" style={{ animationDelay: "0.2s" }}>
              <SectionTitle>🔗 More in {project.community}</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {emaarProjects
                  .filter(p => p.community === project.community && p.id !== project.id)
                  .slice(0, 5)
                  .map(p => (
                    <Link key={p.id} to={`/project/${p.id}`}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 8px", borderRadius: 8, textDecoration: "none", transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.surfaceAlt}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ fontSize: 13, color: T.textPrimary, fontWeight: 500 }}>{p.name}</span>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>{p.price ? fmtM(p.price) : "—"}</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>{p.handover}</div>
                      </div>
                    </Link>
                  ))}
              </div>
              <Link to="/" style={{ display: "block", textAlign: "center", marginTop: 12, fontSize: 12, color: T.gold, textDecoration: "none", fontWeight: 600 }}>
                View All Projects →
              </Link>
            </div>

          </div>{/* end sidebar */}
        </div>{/* end main grid */}

        {/* ── DISCLAIMER ── */}
        <div style={{ marginTop: 32, padding: 16, borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, fontSize: 10, color: T.textMuted, lineHeight: 1.7 }}>
          <strong style={{ color: T.textSecondary }}>Disclaimer:</strong> Prices, handover dates, payment plans, and availability shown are estimates based on publicly available data from Emaar official sources, DLD, and market reports. They may have changed since last update. DXB Analytics is not a licensed real estate brokerage. Always verify with the developer before making any financial decisions.
        </div>

      </div>
    </div>
  );
}
