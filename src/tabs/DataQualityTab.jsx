import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

import TabIntro from "../components/TabIntro";
import TabProvenance from "../components/TabProvenance";
import { tabCopy } from "../data/tabCopy";
// ─── Confidence scoring ───────────────────────────────────────────────────────
function scoreProject(p) {

  const fields = {
    name:            { val: p.name && !p.name.match(/project \d{4}|building \d{4}/i), weight: 10, label: "Name" },
    developer:       { val: !!(p.developerActual || p.developer), weight: 10, label: "Developer" },
    community:       { val: !!p.community, weight: 10, label: "Community" },
    masterCommunity: { val: !!p.masterCommunity, weight: 10, label: "Master Community" },
    handoverDate:    { val: !!(p.handoverDate || p.completionDate) && /^Q[1-4] 20\d{2}$/.test(p.handoverDate || p.completionDate), weight: 15, label: "Handover Date" },
    priceMin:        { val: p.priceMin > 0, weight: 15, label: "Starting Price" },
    beds:            { val: p.beds && p.beds.length > 0, weight: 10, label: "Bed Types" },
    paymentPlan:     { val: !!p.paymentPlan && p.paymentPlan !== "20/60/20" && p.paymentPlan !== "20/80", weight: 10, label: "Payment Plan" },
    ppsf:            { val: !!(p.ppsf || p.pricePerSqft), weight: 5, label: "PPSF" },
    description:     { val: p.description && p.description.length > 50, weight: 5, label: "Description" },
  };
  let score = 0, maxScore = 0;
  const issues = [];
  for (const [key, f] of Object.entries(fields)) {
    maxScore += f.weight;
    if (f.val) score += f.weight;
    else issues.push({ key, label: f.label, weight: f.weight });
  }
  return { score: Math.round((score / maxScore) * 100), issues, fields };
}

function getSource(p) {
  if (p.dataSource === "web-verified-2025" || p.dataSource === "web-verified") return "web";
  if (p.dataSource === "dld") return "dld";
  if (p.scraped || p.dldId) return "dld";
  return "unknown";
}

function confidenceColor(score) {
  if (score >= 85) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

function fieldStatus(val) {
  if (val) return "✅";
  return "❌";
}

// ─── Search links ─────────────────────────────────────────────────────────────
function searchLinks(p) {
  const name = p.name || "";
  const developer = p.developerActual || p.developer || "";
  const community = p.masterCommunity || p.community || "";
  const handover = p.handoverDate || p.completionDate || "";
  const year = handover.match(/\d{4}/) ? handover.match(/\d{4}/)[0] : "";

  const nameEnc = encodeURIComponent(name);
  const googleQ = encodeURIComponent(`"${name}" ${developer} Dubai ${year} handover price payment plan`);

  return {
    // Google — most reliable, quoted exact name
    google: `https://www.google.com/search?q=${googleQ}`,
    // DXBOffplan — works
    dxboffplan: `https://dxboffplan.com/?s=${nameEnc}`,
    // Bayut new projects — user searches manually once landed
    bayut: `https://www.bayut.com/new-projects/dubai/`,
    // PropertyFinder new projects — user searches manually
    pf: `https://www.propertyfinder.ae/en/new-projects`,
    // Propsearch homepage — user searches manually
    propsearch: `https://propsearch.ae`,
    // DubaiLand DLD
    dubailand: `https://dubailand.gov.ae/en/open-data/real-estate-data/#/`,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DataQualityTab() {
  const _copy = tabCopy("Data Quality");

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("issues"); // all | issues | critical | verified | generic_payment
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("score_asc");
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    getDocs(collection(db, "projects")).then(snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProjects(data);
      setLoading(false);
    });
  }, []);

  const scored = useMemo(() => {
    return projects.map(p => ({ ...p, _scored: scoreProject(p), _source: getSource(p) }));
  }, [projects]);

  const stats = useMemo(() => {
    const total = scored.length;
    const critical = scored.filter(p => p._scored.score < 50).length;
    const issues = scored.filter(p => p._scored.score < 85).length;
    const verified = scored.filter(p => p._source === "web").length;
    const perfect = scored.filter(p => p._scored.score === 100).length;
    const genericPP = scored.filter(p => p.paymentPlan === "20/60/20" || p.paymentPlan === "20/80").length;
    const noHandover = scored.filter(p => !p.handoverDate && !p.completionDate).length;
    const noPrice = scored.filter(p => !p.priceMin || p.priceMin <= 0).length;
    const avgScore = Math.round(scored.reduce((a, p) => a + p._scored.score, 0) / total);
    return { total, critical, issues, verified, perfect, genericPP, noHandover, noPrice, avgScore };
  }, [scored]);

  const filtered = useMemo(() => {
    let list = scored;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.name || "").toLowerCase().includes(q) ||
        (p.developerActual || p.developer || "").toLowerCase().includes(q) ||
        (p.masterCommunity || "").toLowerCase().includes(q) ||
        (p.community || "").toLowerCase().includes(q)
      );
    }
    if (filter === "issues") list = list.filter(p => p._scored.score < 85);
    if (filter === "critical") list = list.filter(p => p._scored.score < 50);
    if (filter === "verified") list = list.filter(p => p._source === "web");
    if (filter === "perfect") list = list.filter(p => p._scored.score === 100);
    if (filter === "generic_payment") list = list.filter(p => p.paymentPlan === "20/60/20" || p.paymentPlan === "20/80");
    if (filter === "no_handover") list = list.filter(p => !p.handoverDate && !p.completionDate);
    if (filter === "no_price") list = list.filter(p => !p.priceMin || p.priceMin <= 0);

    if (sortBy === "score_asc") list = [...list].sort((a, b) => a._scored.score - b._scored.score);
    if (sortBy === "score_desc") list = [...list].sort((a, b) => b._scored.score - a._scored.score);
    if (sortBy === "name") list = [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (sortBy === "developer") list = [...list].sort((a, b) => (a.developerActual || a.developer || "").localeCompare(b.developerActual || b.developer || ""));

    return list;
  }, [scored, filter, search, sortBy]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  async function saveEdit(id) {
    setSaving(true);
    try {
      const updates = {};
      if (editValues.handoverDate) { updates.handoverDate = editValues.handoverDate; updates.completionDate = editValues.handoverDate; }
      if (editValues.priceMin) updates.priceMin = Number(editValues.priceMin);
      if (editValues.paymentPlan) updates.paymentPlan = editValues.paymentPlan;
      if (editValues.masterCommunity) updates.masterCommunity = editValues.masterCommunity;
      updates.dataSource = "web-verified-2025";
      updates.dataEnrichedAt = new Date().toISOString();
      await updateDoc(doc(db, "projects", id), updates);
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      setSavedIds(prev => new Set([...prev, id]));
      setEditingId(null);
      setEditValues({});
    } finally {
      setSaving(false);
    }
  }

  function exportCSV() {
    const rows = filtered.map(p => [
      `"${(p.name || "").replace(/"/g, "'")}"`,
      `"${(p.developerActual || p.developer || "").replace(/"/g, "'")}"`,
      `"${(p.community || "").replace(/"/g, "'")}"`,
      `"${(p.masterCommunity || "").replace(/"/g, "'")}"`,
      `"${p.handoverDate || p.completionDate || ""}"`,
      p.priceMin || 0,
      `"${(p.beds || []).join("/")}"`  ,
      `"${p.paymentPlan || ""}"`,
      p.ppsf || 0,
      p._scored.score,
      `"${p._source}"`,
      `"${p._scored.issues.map(i => i.label).join("; ")}"`,
    ].join(","));
    const csv = ["Name,Developer,Community,MasterCommunity,Handover,PriceMin,Beds,PaymentPlan,PPSF,Score,Source,Issues", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `dxb-data-quality-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  if (loading) return (
    <div style={styles.loading}>
      <div style={styles.spinner} />
      <span>Loading 1,728 projects...</span>
    </div>
  );

  return (
    <div style={styles.container}>
      {_copy && <TabIntro title={_copy.title} what={_copy.what} detail={_copy.detail} includes={_copy.includes} excludes={_copy.excludes} warning={_copy.warning} />}

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Data Quality Control</h2>
          <p style={styles.subtitle}>Verify project data against DLD, PropertyFinder, Bayut & developer sources</p>
        </div>
        <button onClick={exportCSV} style={styles.exportBtn}>
          ⬇ Export Issues CSV
        </button>
      </div>

      {/* Stats Bar */}
      <div style={styles.statsBar}>
        {[
          { label: "Total Projects", value: stats.total, color: "#64748b" },
          { label: "Avg Score", value: `${stats.avgScore}%`, color: confidenceColor(stats.avgScore) },
          { label: "Perfect (100%)", value: stats.perfect, color: "#10b981" },
          { label: "Has Issues (<85%)", value: stats.issues, color: "#f59e0b" },
          { label: "Critical (<50%)", value: stats.critical, color: "#ef4444" },
          { label: "Web-Verified", value: stats.verified, color: "#6366f1" },
          { label: "Generic Payment", value: stats.genericPP, color: "#f59e0b" },
          { label: "No Handover", value: stats.noHandover, color: "#ef4444" },
          { label: "No Price", value: stats.noPrice, color: "#ef4444" },
        ].map(s => (
          <div key={s.label} style={styles.statCard}>
            <span style={{ ...styles.statValue, color: s.color }}>{s.value}</span>
            <span style={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div style={styles.toolbar}>
        <div style={styles.filterGroup}>
          {[
            { key: "all", label: `All (${scored.length})` },
            { key: "issues", label: `Issues (${stats.issues})` },
            { key: "critical", label: `Critical (${stats.critical})` },
            { key: "no_handover", label: `No Handover (${stats.noHandover})` },
            { key: "no_price", label: `No Price (${stats.noPrice})` },
            { key: "generic_payment", label: `Generic Payment (${stats.genericPP})` },
            { key: "verified", label: `Web-Verified (${stats.verified})` },
            { key: "perfect", label: `Perfect (${stats.perfect})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(0); }}
              style={{ ...styles.filterBtn, ...(filter === f.key ? styles.filterBtnActive : {}) }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div style={styles.rightTools}>
          <input
            placeholder="Search project, developer, community..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            style={styles.searchInput}
          />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={styles.select}>
            <option value="score_asc">Score ↑ (worst first)</option>
            <option value="score_desc">Score ↓ (best first)</option>
            <option value="name">Name A-Z</option>
            <option value="developer">Developer A-Z</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div style={styles.resultCount}>
        Showing {paginated.length} of {filtered.length} projects
        {page > 0 || totalPages > 1 ? ` — Page ${page + 1} of ${totalPages}` : ""}
      </div>

      {/* Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>Score</th>
              <th style={styles.th}>Project Name</th>
              <th style={styles.th}>Developer</th>
              <th style={styles.th}>Master Community</th>
              <th style={styles.th}>Handover</th>
              <th style={styles.th}>Price (AED)</th>
              <th style={styles.th}>Beds</th>
              <th style={styles.th}>Payment Plan</th>
              <th style={styles.th}>PPSF</th>
              <th style={styles.th}>Source</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(p => {
              const { score, issues, fields } = p._scored;
              const isExpanded = expandedId === p.id;
              const isEditing = editingId === p.id;
              const isSaved = savedIds.has(p.id);
              const links = searchLinks(p);
              const handover = p.handoverDate || p.completionDate || "";
              const handoverOk = handover && /^Q[1-4] 20\d{2}$/.test(handover);

              return [
                <tr
                  key={p.id}
                  style={{ ...styles.tr, ...(isExpanded ? styles.trExpanded : {}), ...(isSaved ? styles.trSaved : {}) }}
                  onClick={() => !isEditing && setExpandedId(isExpanded ? null : p.id)}
                >
                  {/* Score */}
                  <td style={styles.td}>
                    <div style={styles.scoreCell}>
                      <div style={{ ...styles.scoreBadge, background: confidenceColor(score) }}>
                        {score}%
                      </div>
                      {issues.length > 0 && (
                        <div style={styles.issueCount}>{issues.length} issue{issues.length > 1 ? "s" : ""}</div>
                      )}
                    </div>
                  </td>

                  {/* Name */}
                  <td style={styles.td}>
                    <div style={styles.nameCell}>
                      <span style={styles.projectName}>{p.name || "—"}</span>
                      {p.name && p.name.match(/project \d{4}|building \d{4}/i) && (
                        <span style={styles.badge("warning")}>DLD Name</span>
                      )}
                      {isSaved && <span style={styles.badge("success")}>Saved ✓</span>}
                    </div>
                  </td>

                  {/* Developer */}
                  <td style={styles.td}>
                    <span style={{ color: (p.developerActual || p.developer) ? "#e2e8f0" : "#ef4444" }}>
                      {fieldStatus(!!(p.developerActual || p.developer))} {p.developerActual || p.developer || "Missing"}
                    </span>
                  </td>

                  {/* Master Community */}
                  <td style={styles.td}>
                    {isEditing ? (
                      <input
                        value={editValues.masterCommunity ?? (p.masterCommunity || "")}
                        onChange={e => setEditValues(v => ({ ...v, masterCommunity: e.target.value }))}
                        style={styles.inlineInput}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span style={{ color: p.masterCommunity ? "#e2e8f0" : "#ef4444" }}>
                        {fieldStatus(!!p.masterCommunity)} {p.masterCommunity || "Missing"}
                      </span>
                    )}
                  </td>

                  {/* Handover */}
                  <td style={styles.td}>
                    {isEditing ? (
                      <input
                        placeholder="Q4 2027"
                        value={editValues.handoverDate ?? handover}
                        onChange={e => setEditValues(v => ({ ...v, handoverDate: e.target.value }))}
                        style={styles.inlineInput}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span style={{ color: handoverOk ? "#10b981" : handover ? "#f59e0b" : "#ef4444" }}>
                        {handoverOk ? "✅" : handover ? "⚠️" : "❌"} {handover || "Missing"}
                      </span>
                    )}
                  </td>

                  {/* Price */}
                  <td style={styles.td}>
                    {isEditing ? (
                      <input
                        placeholder="1200000"
                        value={editValues.priceMin ?? (p.priceMin || "")}
                        onChange={e => setEditValues(v => ({ ...v, priceMin: e.target.value }))}
                        style={styles.inlineInput}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span style={{ color: p.priceMin > 0 ? "#e2e8f0" : "#ef4444" }}>
                        {p.priceMin > 0 ? `✅ ${(p.priceMin / 1000000).toFixed(2)}M` : "❌ Missing"}
                      </span>
                    )}
                  </td>

                  {/* Beds */}
                  <td style={styles.td}>
                    <span style={{ color: p.beds?.length ? "#e2e8f0" : "#ef4444" }}>
                      {p.beds?.length ? `✅ ${p.beds.join(", ")}` : "❌ Missing"}
                    </span>
                  </td>

                  {/* Payment Plan */}
                  <td style={styles.td}>
                    {isEditing ? (
                      <input
                        placeholder="60/40"
                        value={editValues.paymentPlan ?? (p.paymentPlan || "")}
                        onChange={e => setEditValues(v => ({ ...v, paymentPlan: e.target.value }))}
                        style={styles.inlineInput}
                        onClick={e => e.stopPropagation()}
                      />
                    ) : (
                      <span style={{
                        color: !p.paymentPlan ? "#ef4444"
                          : (p.paymentPlan === "20/60/20" || p.paymentPlan === "20/80") ? "#f59e0b"
                          : "#10b981"
                      }}>
                        {!p.paymentPlan ? "❌ Missing"
                          : (p.paymentPlan === "20/60/20" || p.paymentPlan === "20/80") ? `⚠️ ${p.paymentPlan}`
                          : `✅ ${p.paymentPlan}`}
                      </span>
                    )}
                  </td>

                  {/* PPSF */}
                  <td style={styles.td}>
                    <span style={{ color: (p.ppsf || p.pricePerSqft) ? "#e2e8f0" : "#ef4444" }}>
                      {(p.ppsf || p.pricePerSqft) ? `✅ ${p.ppsf || p.pricePerSqft}` : "❌"}
                    </span>
                  </td>

                  {/* Source */}
                  <td style={styles.td}>
                    <span style={styles.sourceBadge(p._source)}>
                      {p._source === "web" ? "🌐 Web" : p._source === "dld" ? "🏛 DLD" : "? Unknown"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={styles.td} onClick={e => e.stopPropagation()}>
                    <div style={styles.actions}>
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(p.id)} disabled={saving} style={styles.btnSave}>
                            {saving ? "..." : "Save"}
                          </button>
                          <button onClick={() => { setEditingId(null); setEditValues({}); }} style={styles.btnCancel}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button onClick={() => { setEditingId(p.id); setEditValues({}); }} style={styles.btnEdit}>
                          Edit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>,

                // Expanded row
                isExpanded && (
                  <tr key={`${p.id}-expanded`}>
                    <td colSpan={11} style={styles.expandedCell}>
                      <div style={styles.expandedContent}>

                        {/* Issues */}
                        {issues.length > 0 && (
                          <div style={styles.expandSection}>
                            <h4 style={styles.expandTitle}>⚠️ Missing / Invalid Fields</h4>
                            <div style={styles.issuesList}>
                              {issues.map(i => (
                                <span key={i.key} style={styles.issueTag}>
                                  {i.label} (−{i.weight}pts)
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Full data */}
                        <div style={styles.expandSection}>
                          <h4 style={styles.expandTitle}>📋 Full Project Data</h4>
                          <div style={styles.dataGrid}>
                            {[
                              ["DLD Community", p.community],
                              ["Master Community", p.masterCommunity],
                              ["Property Type", p.propertyType],
                              ["Market Segment", p.marketSegment],
                              ["Total Units", p.totalUnits],
                              ["Size Min (sqft)", p.sizeMin],
                              ["Size Max (sqft)", p.sizeMax],
                              ["Gross Yield", p.grossYield ? `${p.grossYield}%` : null],
                              ["Net Yield", p.netYield ? `${p.netYield}%` : null],
                              ["PPSF", p.ppsf || p.pricePerSqft],
                              ["Escrow Bank", p.escrowBank],
                              ["Service Charge", p.serviceCharge ? `AED ${p.serviceCharge}/sqft` : null],
                              ["Data Source", p.dataSource],
                              ["Enriched At", p.dataEnrichedAt ? new Date(p.dataEnrichedAt).toLocaleDateString() : null],
                              ["Description", p.description ? p.description.slice(0, 120) + "..." : null],
                            ].map(([label, val]) => (
                              <div key={label} style={styles.dataItem}>
                                <span style={styles.dataLabel}>{label}</span>
                                <span style={{ color: val ? "#e2e8f0" : "#ef4444" }}>{val || "—"}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Verify Links */}
                        <div style={styles.expandSection}>
                          <h4 style={styles.expandTitle}>🔍 Verify Against Sources</h4>
                          <div style={{
                            background:"#0f172a", border:"1px solid #1e293b",
                            borderRadius:6, padding:"8px 12px", marginBottom:10,
                            display:"flex", alignItems:"center", gap:8
                          }}>
                            <span style={{color:"#475569",fontSize:11}}>Search term:</span>
                            <code style={{color:"#818cf8",fontSize:12,letterSpacing:"0.02em"}}>{p.name}</code>
                            <button
                              onClick={e=>{e.stopPropagation();navigator.clipboard.writeText(p.name);}}
                              style={{background:"#1e293b",border:"1px solid #334155",color:"#64748b",padding:"2px 8px",borderRadius:3,cursor:"pointer",fontSize:11,fontFamily:"inherit"}}
                            >Copy</button>
                          </div>
                          <div style={styles.linkRow}>
                            <a href={links.google} target="_blank" rel="noreferrer" style={styles.sourceLink("google")}>
                              ⚪ Google Search →
                            </a>
                            <a href={links.dxboffplan} target="_blank" rel="noreferrer" style={styles.sourceLink("dxboffplan")}>
                              🟠 DXB Offplan →
                            </a>
                            <a href={links.bayut} target="_blank" rel="noreferrer" style={styles.sourceLink("bayut")}>
                              🟡 Bayut New Projects →
                            </a>
                            <a href={links.pf} target="_blank" rel="noreferrer" style={styles.sourceLink("pf")}>
                              🟢 PropertyFinder →
                            </a>
                            <a href={links.propsearch} target="_blank" rel="noreferrer" style={styles.sourceLink("propsearch")}>
                              🟣 Propsearch →
                            </a>
                            <a href={links.dubailand} target="_blank" rel="noreferrer" style={styles.sourceLink("google")}>
                              🏛 DubaiLand DLD →
                            </a>
                          </div>
                          <p style={{fontSize:10,color:"#334155",margin:"8px 0 0"}}>
                            Copy the search term above → paste into the portal search box. Google Search is most reliable — searches exact project name + developer + year.
                          </p>
                        </div>

                      </div>
                    </td>
                  </tr>
                )
              ];
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button onClick={() => setPage(0)} disabled={page === 0} style={styles.pageBtn}>«</button>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={styles.pageBtn}>‹</button>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            const p = page < 4 ? i : page > totalPages - 4 ? totalPages - 7 + i : page - 3 + i;
            return p >= 0 && p < totalPages ? (
              <button key={p} onClick={() => setPage(p)} style={{ ...styles.pageBtn, ...(p === page ? styles.pageBtnActive : {}) }}>
                {p + 1}
              </button>
            ) : null;
          })}
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} style={styles.pageBtn}>›</button>
          <button onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1} style={styles.pageBtn}>»</button>
        </div>
      )}
      {_copy?.provenance && <TabProvenance {..._copy.provenance} />}

    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  container: {
    padding: "24px",
    background: "#0f172a",
    minHeight: "100vh",
    fontFamily: "'IBM Plex Mono', 'JetBrains Mono', monospace",
    color: "#e2e8f0",
  },
  loading: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 12, height: 200, color: "#94a3b8",
    fontFamily: "monospace",
  },
  spinner: {
    width: 20, height: 20, border: "2px solid #334155",
    borderTopColor: "#6366f1", borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    fontSize: 24, fontWeight: 700, color: "#f1f5f9", margin: 0,
    letterSpacing: "-0.5px",
  },
  subtitle: { color: "#64748b", fontSize: 13, margin: "4px 0 0", },
  exportBtn: {
    background: "#1e293b", border: "1px solid #334155", color: "#94a3b8",
    padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13,
    fontFamily: "inherit",
    ":hover": { borderColor: "#6366f1" },
  },
  statsBar: {
    display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20,
  },
  statCard: {
    background: "#1e293b", border: "1px solid #1e293b",
    borderRadius: 8, padding: "10px 16px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
    minWidth: 90,
  },
  statValue: { fontSize: 22, fontWeight: 700, lineHeight: 1 },
  statLabel: { fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" },
  toolbar: {
    display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12, alignItems: "center",
  },
  filterGroup: { display: "flex", flexWrap: "wrap", gap: 6 },
  filterBtn: {
    background: "#1e293b", border: "1px solid #2d3748", color: "#94a3b8",
    padding: "5px 12px", borderRadius: 20, cursor: "pointer", fontSize: 12,
    fontFamily: "inherit", transition: "all 0.15s",
  },
  filterBtnActive: {
    background: "#6366f1", border: "1px solid #6366f1", color: "#fff",
  },
  rightTools: { display: "flex", gap: 8, marginLeft: "auto" },
  searchInput: {
    background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0",
    padding: "7px 14px", borderRadius: 6, fontSize: 13, width: 280,
    fontFamily: "inherit", outline: "none",
  },
  select: {
    background: "#1e293b", border: "1px solid #334155", color: "#94a3b8",
    padding: "7px 12px", borderRadius: 6, fontSize: 12,
    fontFamily: "inherit", cursor: "pointer",
  },
  resultCount: { color: "#64748b", fontSize: 12, marginBottom: 8 },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 12 },
  thead: { background: "#0f172a" },
  th: {
    padding: "8px 12px", textAlign: "left", color: "#64748b",
    fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em",
    borderBottom: "1px solid #1e293b", whiteSpace: "nowrap",
  },
  tr: {
    borderBottom: "1px solid #1e293b", cursor: "pointer",
    transition: "background 0.1s",
    ":hover": { background: "#1e293b" },
  },
  trExpanded: { background: "#1e293b" },
  trSaved: { background: "rgba(16,185,129,0.05)" },
  td: { padding: "10px 12px", verticalAlign: "middle" },
  scoreCell: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  scoreBadge: {
    padding: "3px 8px", borderRadius: 4, color: "#fff",
    fontWeight: 700, fontSize: 12, minWidth: 42, textAlign: "center",
  },
  issueCount: { fontSize: 10, color: "#64748b" },
  nameCell: { display: "flex", flexDirection: "column", gap: 3 },
  projectName: { color: "#e2e8f0", fontWeight: 500 },
  badge: (type) => ({
    display: "inline-block",
    padding: "1px 6px", borderRadius: 3, fontSize: 10,
    background: type === "warning" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)",
    color: type === "warning" ? "#f59e0b" : "#10b981",
    border: `1px solid ${type === "warning" ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}`,
  }),
  sourceBadge: (src) => ({
    padding: "2px 8px", borderRadius: 3, fontSize: 11,
    background: src === "web" ? "rgba(99,102,241,0.15)" : src === "dld" ? "rgba(16,185,129,0.1)" : "rgba(100,116,139,0.15)",
    color: src === "web" ? "#818cf8" : src === "dld" ? "#34d399" : "#64748b",
  }),
  inlineInput: {
    background: "#0f172a", border: "1px solid #6366f1", color: "#e2e8f0",
    padding: "4px 8px", borderRadius: 4, fontSize: 12, width: "100%",
    fontFamily: "inherit", outline: "none",
  },
  actions: { display: "flex", gap: 4 },
  btnEdit: {
    background: "#1e293b", border: "1px solid #334155", color: "#94a3b8",
    padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 11,
    fontFamily: "inherit",
  },
  btnSave: {
    background: "#6366f1", border: "none", color: "#fff",
    padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 11,
    fontFamily: "inherit",
  },
  btnCancel: {
    background: "transparent", border: "1px solid #334155", color: "#64748b",
    padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 11,
    fontFamily: "inherit",
  },
  expandedCell: { padding: 0, background: "#0f172a" },
  expandedContent: {
    padding: "16px 24px 20px",
    borderBottom: "1px solid #1e293b",
    display: "flex", flexDirection: "column", gap: 16,
  },
  expandSection: {},
  expandTitle: { fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" },
  issuesList: { display: "flex", flexWrap: "wrap", gap: 6 },
  issueTag: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
    color: "#fca5a5", padding: "2px 8px", borderRadius: 3, fontSize: 11,
  },
  dataGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "6px 16px",
  },
  dataItem: { display: "flex", flexDirection: "column", gap: 1 },
  dataLabel: { fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" },
  linkRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  sourceLink: (src) => ({
    padding: "5px 14px", borderRadius: 4, fontSize: 12, cursor: "pointer",
    textDecoration: "none", fontFamily: "inherit",
    background: src === "pf" ? "rgba(34,197,94,0.1)" :
                src === "bayut" ? "rgba(234,179,8,0.1)" :
                src === "propsearch" ? "rgba(99,102,241,0.1)" :
                src === "dxboffplan" ? "rgba(249,115,22,0.1)" :
                "rgba(100,116,139,0.1)",
    color: src === "pf" ? "#4ade80" :
           src === "bayut" ? "#fbbf24" :
           src === "propsearch" ? "#818cf8" :
           src === "dxboffplan" ? "#fb923c" :
           "#94a3b8",
    border: `1px solid ${src === "pf" ? "rgba(34,197,94,0.2)" :
              src === "bayut" ? "rgba(234,179,8,0.2)" :
              src === "propsearch" ? "rgba(99,102,241,0.2)" :
              src === "dxboffplan" ? "rgba(249,115,22,0.2)" :
              "rgba(100,116,139,0.2)"}`,
  }),
  pagination: { display: "flex", gap: 4, justifyContent: "center", marginTop: 20 },
  pageBtn: {
    background: "#1e293b", border: "1px solid #334155", color: "#94a3b8",
    padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12,
    fontFamily: "inherit", minWidth: 32,
  },
  pageBtnActive: { background: "#6366f1", border: "1px solid #6366f1", color: "#fff" },
};
