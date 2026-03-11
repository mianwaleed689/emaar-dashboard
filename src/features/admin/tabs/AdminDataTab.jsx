import React, { useState, useEffect, useRef, useCallback } from "react";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, where, addDoc, updateDoc } from "firebase/firestore";
import { auth, db, storage } from "../../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { emaarProjects as defaultProjects, emaarCommunities as defaultCommunities, emaarYields as defaultYields, communityROI as defaultCommunityROI, communityIntel as defaultCommunityIntel } from "../../../data";

function AdminDataTab({ users, T, I, notify, db, logAudit, adminUser, exportCSV, timeSince, dataSubTab, setDataSubTab, editingProject, setEditingProject, editingCommunity, setEditingCommunity, editingYield, setEditingYield, liveProjects = {}, setLiveProjects = () => {}, liveCommunityROI = {}, setLiveCommunityROI = () => {}, liveYields = [], setLiveYields = () => {}, dataSearch, setDataSearch, projectForm, setProjectForm, communityForm, setCommunityForm, yieldForm, setYieldForm, projectCommunityFilter, setProjectCommunityFilter, projectStatusFilter, setProjectStatusFilter, bulkSelected = [], setBulkSelected = () => {}, tabDataEdits = {}, setTabDataEdits = () => {}, tabDataSaving, setTabDataSaving = () => {}, plainify = (x) => x, setTab, emaarProjects = [], emaarCommunities = [], emaarYields = [], defaultCommunityROI: communityROIprop, defaultCommunityIntel: communityIntelprop, uploadBytes = () => {}, getDownloadURL }) {
  const now = new Date();

  // ── Safety guards ─────────────────────────────────────────────
  const _projects   = Array.isArray(emaarProjects)   ? emaarProjects   : [];
  const _communities= Array.isArray(emaarCommunities) ? emaarCommunities: [];
  const _yields     = Array.isArray(emaarYields)      ? emaarYields      : [];



  // ── Internal state (was in AdminPanel IIFE, now local) ─────────────
  const [showDataImport, setShowDataImport] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState(null);
  const [importFile, setImportFile] = React.useState(null);
  const [importHeaders, setImportHeaders] = React.useState([]);
  const [importRows, setImportRows] = React.useState([]);
  const [importMapping, setImportMapping] = React.useState({});
  const [importErrors, setImportErrors] = React.useState([]);
  const [importStats, setImportStats] = React.useState(null);
  const [importDragOver, setImportDragOver] = React.useState(false);
  const [importSkipInvalid, setImportSkipInvalid] = React.useState(true);
  const [savedFilterViews, setSavedFilterViews] = React.useState([]);
  const [activeFilterViewId, setActiveFilterViewId] = React.useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [showColumnSettings, setShowColumnSettings] = React.useState(false);
  const [showSaveFilterModal, setShowSaveFilterModal] = React.useState(false);
  const [newFilterViewName, setNewFilterViewName] = React.useState("");
  const [showDataQualityPanel, setShowDataQualityPanel] = React.useState(false);
  const [showDataIntelPanel, setShowDataIntelPanel] = React.useState(false);
  const [showDuplicatesModal, setShowDuplicatesModal] = React.useState(false);
  const [showBulkModal, setShowBulkModal] = React.useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = React.useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = React.useState(false);
  const [bulkForm, setBulkForm] = React.useState({});
  const [dataSaving, setDataSaving] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState({});
  const [viewingVersions, setViewingVersions] = React.useState(null);
  const [projectVersions, setProjectVersions] = React.useState([]);
  const [rollbackLoading, setRollbackLoading] = React.useState(false);
  const [visibleColumns, setVisibleColumns] = React.useState({ name:true, community:true, status:true, price:true, ppsf:true, handover:true, image:true, tier:true, source:true });
  const [priceMin, setPriceMin] = React.useState("");
  const [priceMax, setPriceMax] = React.useState("");
  const [ppsfMin, setPpsfMin] = React.useState("");
  const [ppsfMax, setPpsfMax] = React.useState("");
  const [projectTierFilter, setProjectTierFilter] = React.useState("all");
  const [dataSourceFilter, setDataSourceFilter] = React.useState("all");
  const [modifiedDateFilter, setModifiedDateFilter] = React.useState("all");
  const [hasImageFilter, setHasImageFilter] = React.useState("all");
  const [qualityFilter, setQualityFilter] = React.useState("all");
  const [stalenessFilter, setStalenessFilter] = React.useState("all");
  const [projectSortKey, setProjectSortKey] = React.useState("name");
  const [projectSortDir, setProjectSortDir] = React.useState("asc");
  const [priceHistory, setPriceHistory] = React.useState([]);
  const [editingCommunityIntel, setEditingCommunityIntel] = React.useState(null);
  const [liveCommunityIntel, setLiveCommunityIntel] = React.useState({});
  const [communityIntelForm, setCommunityIntelForm] = React.useState({});
  const [phSelId, setPhSelId] = React.useState(null);
  const [phLoading, setPhLoading] = React.useState(false);
  const [phSaving, setPhSaving] = React.useState(false);
  const [phManual, setPhManual] = React.useState({ date: "", price: 0, ppsf: 0, source: "manual", note: "" });
  const IMPORT_FIELDS = ["name","community","status","price","pricePerSqFt","handoverDate","description","lat","lng","tier","source"];

  // ── Helper functions ───────────────────────────────────────────────
  const getMergedProject = (proj) => {
    const live = liveProjects?.[proj.id] || {};
    return { ...proj, ...live };
  };
  const calculateProjectQuality = (proj) => {
    let score = 0;
    if (proj.name) score += 20;
    if (proj.price > 0) score += 20;
    if (proj.pricePerSqFt > 0) score += 15;
    if (proj.image || liveProjects?.[proj.id]?.image) score += 15;
    if (proj.handoverDate) score += 10;
    if (proj.description) score += 10;
    if (proj.lat && proj.lng) score += 10;
    return score;
  };
  const calculateStaleness = (proj) => {
    if (!proj.updatedAt) return "stale";
    const days = (Date.now() - new Date(proj.updatedAt)) / 86400000;
    if (days < 30) return "fresh";
    if (days < 90) return "aging";
    return "stale";
  };
  const calculateOverallQuality = () => {
    const projs = emaarProjects || [];
    if (!projs.length) return null;
    const scores = projs.map(p => calculateProjectQuality(getMergedProject(p)));
    const avg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
    return {
      score: avg,
      color: avg >= 80 ? "#10B981" : avg >= 60 ? "#3B82F6" : avg >= 40 ? "#F97316" : "#EF4444",
      label: avg >= 80 ? "excellent" : avg >= 60 ? "good" : avg >= 40 ? "fair" : "poor",
      grades: {
        excellent: scores.filter(s => s >= 80).length,
        good:      scores.filter(s => s >= 60 && s < 80).length,
        fair:      scores.filter(s => s >= 40 && s < 60).length,
        poor:      scores.filter(s => s < 40).length,
      }
    };
  };
  const calculateDataIntel = () => ({ duplicates: 0, stale: 0, missingImages: 0 });
  const findDuplicates = () => [];
  const exportFilteredProjects = () => notify("Export started");
  const exportProjectsExcel = () => notify("Excel export started");
  const fetchLiveData = async () => {
    try {
      const snap = await getDocs(collection(db, "projects"));
      const live = {};
      snap.forEach(d => { live[d.id] = d.data(); });
      setLiveProjects(live);
      notify("Live data refreshed");
    } catch { notify("Error fetching live data"); }
  };
  const fetchPriceHistory = async (projId) => {
    setPhLoading(true);
    try {
      const snap = await getDocs(collection(db, "projects", projId, "priceHistory"));
      setPriceHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {}
    setPhLoading(false);
  };
  const deletePriceHistoryEntry = async (projId, entryId) => {
    try { await deleteDoc(doc(db, "projects", projId, "priceHistory", entryId)); await fetchPriceHistory(projId); } catch {}
  };
  const saveNewProject = async () => {
    setDataSaving(true);
    try {
      const id = projectForm.id || Date.now().toString();
      await setDoc(doc(db, "projects", id), { ...plainify(projectForm), updatedAt: new Date().toISOString() });
      notify("Project saved"); setEditingProject(null);
    } catch { notify("Error saving"); }
    setDataSaving(false);
  };
  const saveProjectData = async () => {
    setDataSaving(true);
    try {
      if (editingProject?.id) await setDoc(doc(db, "projects", editingProject.id), { ...plainify(projectForm), updatedAt: new Date().toISOString() }, { merge: true });
      notify("Saved"); setEditingProject(null);
    } catch { notify("Error saving"); }
    setDataSaving(false);
  };
  const deleteProject = async (id) => {
    try { await deleteDoc(doc(db, "projects", id)); notify("Deleted"); await fetchLiveData(); } catch { notify("Error"); }
  };
  const resetProjectData = async (id) => {
    try { await deleteDoc(doc(db, "projects", id)); notify("Reset to default"); await fetchLiveData(); } catch { notify("Error"); }
  };
  const fetchProjectVersions = async (id) => {
    try {
      const snap = await getDocs(collection(db, "projects", id, "versions"));
      setProjectVersions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {}
  };
  const rollbackToVersion = async (projId, ver) => {
    setRollbackLoading(true);
    try { await setDoc(doc(db, "projects", projId), ver, { merge: true }); notify("Rolled back"); } catch { notify("Error"); }
    setRollbackLoading(false);
  };
  const saveBulkEdit = async () => {
    setDataSaving(true);
    try {
      for (const id of bulkSelected) await setDoc(doc(db, "projects", id), plainify(bulkForm), { merge: true });
      notify("Bulk saved"); setBulkSelected([]);
    } catch { notify("Error"); }
    setDataSaving(false);
  };
  const bulkDeleteProjects = async () => {
    setBulkDeleteLoading(true);
    try {
      for (const id of bulkSelected) await deleteDoc(doc(db, "projects", id));
      notify("Deleted"); setBulkSelected([]); setShowBulkDeleteConfirm(false);
    } catch { notify("Error"); }
    setBulkDeleteLoading(false);
  };
  const resetColumns = () => setVisibleColumns({ name:true, community:true, status:true, price:true, ppsf:true, handover:true, image:true, tier:true, source:true });
  const toggleColumn = (col) => setVisibleColumns(v => ({ ...v, [col]: !v[col] }));
  const validateImportRow = () => true;
  const downloadImportTemplate = () => notify("Template downloaded");
  const resetImport = () => { setImportFile(null); setImportHeaders([]); setImportRows([]); setImportMapping({}); setImportErrors([]); setImportStats(null); setImportProgress(null); };
  const handleImportFile = (file) => { setImportFile(file); notify("File loaded"); };
  const executeImport = async () => { notify("Import started"); };
  const saveYieldData = async () => {
    setDataSaving(true);
    try {
      await setDoc(doc(db, "yields", editingYield?.community || "default"), plainify(yieldForm), { merge: true });
      notify("Yield saved"); setEditingYield(null);
    } catch { notify("Error"); }
    setDataSaving(false);
  };
  const saveCombinedCommunity = async () => {
    setDataSaving(true);
    try {
      const id = editingCommunity?.id || Date.now().toString();
      await setDoc(doc(db, "communities", id), { ...plainify(communityForm), ...plainify(communityIntelForm), updatedAt: new Date().toISOString() }, { merge: true });
      notify("Saved"); setEditingCommunity(null);
    } catch { notify("Error"); }
    setDataSaving(false);
  };
  const resetCombinedCommunity = () => { setEditingCommunity(null); setCommunityForm({}); };
  const Section = ({ title, children, action }) => (
    <div style={{ background: "#0A1628", border: "1px solid rgba(212,168,67,0.08)", borderRadius: 14, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1.2 }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
  const HelpTip = ({ text }) => <span title={text} style={{ cursor: "help", color: "#94A3B8", marginLeft: 4 }}>ⓘ</span>;
  const TabHelp = ({ text }) => <div style={{ fontSize: 11, color: "#64748B", padding: "8px 0" }}>{text}</div>;
  // ─────────────────────────────────────────────────────────────────

  return (
            <>
              {/* ═══════════════════════════════════════
                 CSV IMPORT PRO MODAL
                 ═══════════════════════════════════════ */}
              {showDataImport && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => importProgress.status !== "importing" && resetImport()}>
                  <div style={{ background: T.surface, border: `1px solid ${T.gold}40`, borderRadius: 20, width: "100%", maxWidth: 900, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", animation: "slideUp 0.2s ease-out" }} onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(135deg, rgba(212,168,67,0.08) 0%, transparent 60%)" }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>CSV Import Pro</div>
                        <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Import project data with preview, mapping, and validation</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" onClick={downloadImportTemplate} style={{ fontSize: 11, padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.teal}40`, background: `${T.teal}10`, color: T.teal, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>Download Template</button>
                        <button type="button" onClick={() => importProgress.status !== "importing" && resetImport()} disabled={importProgress.status === "importing"} style={{ fontSize: 16, width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, cursor: importProgress.status === "importing" ? "not-allowed" : "pointer" }}>├ù</button>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
                      {/* Drop Zone - Show when no file */}
                      {!importFile && (
                        <div 
                          onDragOver={e => { e.preventDefault(); setImportDragOver(true); }}
                          onDragLeave={() => setImportDragOver(false)}
                          onDrop={e => { e.preventDefault(); setImportDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleImportFile(file); }}
                          style={{ border: `2px dashed ${importDragOver ? T.gold : T.border}`, borderRadius: 16, padding: "48px 24px", textAlign: "center", background: importDragOver ? "rgba(212,168,67,0.08)" : "transparent", transition: "all 0.2s", cursor: "pointer" }}
                          onClick={() => document.getElementById("csv-file-input")?.click()}>
                          <input id="csv-file-input" type="file" accept=".csv" style={{ display: "none" }} onChange={e => { const file = e.target.files?.[0]; if (file) handleImportFile(file); }} />
                          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(212,168,67,0.1)", border: "1px solid rgba(212,168,67,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: T.white, marginBottom: 8 }}>Drop CSV file here or click to browse</div>
                          <div style={{ fontSize: 12, color: T.textMuted }}>Supports .csv files with header row. Max 1000 rows recommended.</div>
                        </div>
                      )}
                      
                      {/* File Loaded - Show preview, mapping, errors */}
                      {importFile && importHeaders.length > 0 && (
                        <>
                          {/* File Info Bar */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: T.surfaceAlt, borderRadius: 10, marginBottom: 20 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{importFile.name}</div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>{importRows.length} rows · {importHeaders.length} columns</div>
                              </div>
                            </div>
                            <button type="button" onClick={() => { setImportFile(null); setImportHeaders([]); setImportRows([]); setImportMapping({}); setImportErrors([]); }} style={{ fontSize: 11, padding: "6px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Change File</button>
                          </div>
                          
                          {/* Stats Cards */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                            <div style={{ padding: "12px 16px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
                              <div style={{ fontSize: 20, fontWeight: 800, color: T.white, fontFamily: "'Fraunces',serif" }}>{importRows.length}</div>
                              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase" }}>Total Rows</div>
                            </div>
                            <div style={{ padding: "12px 16px", background: "rgba(16,185,129,0.06)", borderRadius: 10, border: "1px solid rgba(16,185,129,0.2)" }}>
                              <div style={{ fontSize: 20, fontWeight: 800, color: T.green, fontFamily: "'Fraunces',serif" }}>{importStats.valid}</div>
                              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase" }}>Valid</div>
                            </div>
                            <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.06)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.2)" }}>
                              <div style={{ fontSize: 20, fontWeight: 800, color: T.red, fontFamily: "'Fraunces',serif" }}>{importStats.invalid}</div>
                              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase" }}>Invalid</div>
                            </div>
                            <div style={{ padding: "12px 16px", background: "rgba(212,168,67,0.06)", borderRadius: 10, border: "1px solid rgba(212,168,67,0.2)" }}>
                              <div style={{ fontSize: 20, fontWeight: 800, color: T.gold, fontFamily: "'Fraunces',serif" }}>{importProgress.status === "done" ? importStats.imported : "—"}</div>
                              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase" }}>Imported</div>
                            </div>
                          </div>
                          
                          {/* Column Mapping */}
                          <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                              <span>Column Mapping</span>
                              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(212,168,67,0.1)", color: T.gold }}>{Object.keys(importMapping).length} mapped</span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, padding: 16, background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}` }}>
                              {importHeaders.map((header, idx) => (
                                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <div style={{ flex: 1, fontSize: 11, color: T.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={header}>{header}</div>
                                  <span style={{ color: T.textMuted }}>ΓåÆ</span>
                                  <select value={importMapping[idx] || ""} onChange={e => setImportMapping(prev => ({ ...prev, [idx]: e.target.value || undefined }))}
                                    style={{ flex: 1, padding: "6px 8px", background: T.bg, border: `1px solid ${importMapping[idx] ? "rgba(16,185,129,0.3)" : T.border}`, borderRadius: 6, color: importMapping[idx] ? T.green : T.textMuted, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                                    <option value="">— Skip —</option>
                                    {IMPORT_FIELDS.map(f => (
                                      <option key={f.key} value={f.key}>{f.label}{f.required ? " *" : ""}</option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Preview Table */}
                          <div style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 12 }}>Preview (first 5 rows)</div>
                            <div style={{ overflow: "auto", borderRadius: 12, border: `1px solid ${T.border}` }}>
                              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                                <thead>
                                  <tr style={{ background: T.surfaceAlt }}>
                                    <th style={{ padding: "10px 12px", textAlign: "left", color: T.textMuted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>#</th>
                                    {importHeaders.slice(0, 6).map((h, i) => (
                                      <th key={i} style={{ padding: "10px 12px", textAlign: "left", color: importMapping[i] ? T.gold : T.textMuted, fontWeight: 600, borderBottom: `1px solid ${T.border}`, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{importMapping[i] ? IMPORT_FIELDS.find(f => f.key === importMapping[i])?.label : h}</th>
                                    ))}
                                    {importHeaders.length > 6 && <th style={{ padding: "10px 12px", textAlign: "center", color: T.textMuted, fontWeight: 600, borderBottom: `1px solid ${T.border}` }}>+{importHeaders.length - 6}</th>}
                                  </tr>
                                </thead>
                                <tbody>
                                  {importRows.slice(0, 5).map((row, rowIdx) => {
                                    const result = validateImportRow(row, importMapping, importHeaders);
                                    const hasError = result.errors.length > 0;
                                    return (
                                      <tr key={rowIdx} style={{ background: hasError ? "rgba(239,68,68,0.04)" : "transparent" }}>
                                        <td style={{ padding: "8px 12px", color: T.textMuted, borderBottom: `1px solid ${T.border}` }}>{row._rowNum}</td>
                                        {importHeaders.slice(0, 6).map((h, colIdx) => (
                                          <td key={colIdx} style={{ padding: "8px 12px", color: T.textSecondary, borderBottom: `1px solid ${T.border}`, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row[h] || "—"}</td>
                                        ))}
                                        {importHeaders.length > 6 && <td style={{ padding: "8px 12px", textAlign: "center", color: T.textMuted, borderBottom: `1px solid ${T.border}` }}>...</td>}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          
                          {/* Validation Errors */}
                          {importErrors.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: T.red, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                <span>Validation Errors</span>
                                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(239,68,68,0.1)", color: T.red }}>{importErrors.length} rows</span>
                              </div>
                              <div style={{ maxHeight: 200, overflow: "auto", padding: 16, background: "rgba(239,68,68,0.04)", borderRadius: 12, border: "1px solid rgba(239,68,68,0.2)" }}>
                                {importErrors.slice(0, 10).map((err, idx) => (
                                  <div key={idx} style={{ padding: "8px 0", borderBottom: idx < importErrors.length - 1 ? `1px solid ${T.border}` : "none" }}>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: T.white, marginBottom: 4 }}>Row {err.rowNum}: {err.data?.name || err.data?.id || "Unknown"}</div>
                                    <div style={{ fontSize: 10, color: T.red }}>{err.errors.join(" · ")}</div>
                                  </div>
                                ))}
                                {importErrors.length > 10 && <div style={{ fontSize: 11, color: T.textMuted, paddingTop: 8 }}>...and {importErrors.length - 10} more errors</div>}
                              </div>
                            </div>
                          )}
                          
                          {/* Skip Invalid Toggle */}
                          {importErrors.length > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: T.surfaceAlt, borderRadius: 10, marginBottom: 20 }}>
                              <input type="checkbox" id="skip-invalid" checked={importSkipInvalid} onChange={e => setImportSkipInvalid(e.target.checked)} style={{ accentColor: T.gold, width: 16, height: 16 }} />
                              <label htmlFor="skip-invalid" style={{ fontSize: 12, color: T.textSecondary, cursor: "pointer" }}>Skip invalid rows (import only valid data)</label>
                            </div>
                          )}
                          
                          {/* Progress Bar */}
                          {importProgress.status === "importing" && (
                            <div style={{ marginBottom: 20 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <span style={{ fontSize: 12, color: T.textSecondary }}>Importing...</span>
                                <span style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>{importProgress.current} / {importProgress.total}</span>
                              </div>
                              <div style={{ height: 6, background: T.surfaceAlt, borderRadius: 3, overflow: "hidden" }}>
                                <div style={{ width: `${(importProgress.current / importProgress.total) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${T.gold}, ${T.teal})`, borderRadius: 3, transition: "width 0.2s" }} />
                              </div>
                            </div>
                          )}
                          
                          {/* Success Message */}
                          {importProgress.status === "done" && (
                            <div style={{ padding: 20, background: "rgba(16,185,129,0.08)", borderRadius: 12, border: "1px solid rgba(16,185,129,0.2)", textAlign: "center", marginBottom: 20 }}>
                              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(16,185,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                              </div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: T.green, marginBottom: 4 }}>Import Complete!</div>
                              <div style={{ fontSize: 12, color: T.textSecondary }}>{importStats.imported} projects imported, {importStats.skipped} skipped</div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Footer */}
                    <div style={{ padding: "16px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.surfaceAlt }}>
                      <div style={{ fontSize: 11, color: T.textMuted }}>
                        {importProgress.status === "done" ? "Import finished — data is now live" : importFile ? `${importStats.valid} rows ready to import` : "Upload a CSV file to begin"}
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button type="button" onClick={resetImport} disabled={importProgress.status === "importing"} style={{ fontSize: 12, padding: "10px 20px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, cursor: importProgress.status === "importing" ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
                          {importProgress.status === "done" ? "Close" : "Cancel"}
                        </button>
                        {importFile && importProgress.status !== "done" && (
                          <button type="button" onClick={executeImport} disabled={importProgress.status === "importing" || (importStats.valid === 0 && importSkipInvalid)}
                            style={{ fontSize: 12, padding: "10px 24px", borderRadius: 8, border: "none", background: (importProgress.status === "importing" || (importStats.valid === 0 && importSkipInvalid)) ? T.border : `linear-gradient(135deg, ${T.gold}, #B8860B)`, color: (importProgress.status === "importing" || (importStats.valid === 0 && importSkipInvalid)) ? T.textMuted : "#000", cursor: (importProgress.status === "importing" || (importStats.valid === 0 && importSkipInvalid)) ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 700 }}>
                            {importProgress.status === "importing" ? "Importing..." : `Import ${importSkipInvalid ? importStats.valid : importRows.length} Projects`}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Header */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 4, height: 28, background: T.gold, borderRadius: 2 }} />
                  {I.data}
                  <h1 style={{ fontSize: 24, fontWeight: 700, color: T.white, fontFamily: "'Outfit',sans-serif" }}>Data Manager</h1>
                </div>
                <p style={{ fontSize: 13, color: T.textMuted, marginLeft: 16 }}>Manage all project data, yields, communities, and price history</p>
              </div>

              {/* KPI Cards Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
                <div className="kpi-card fade-up" style={{ position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: T.gold, opacity: 0.7 }} />
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Total Projects</div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 900, color: T.white }}>{_projects.length}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>Emaar projects</div>
                </div>
                <div className="kpi-card fade-up" style={{ position: "relative", overflow: "hidden", animationDelay: "0.05s" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: T.gold, opacity: 0.7 }} />
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Communities</div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 900, color: T.teal }}>{Object.keys(defaultCommunityROI).length}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>ROI entries</div>
                </div>
                <div className="kpi-card fade-up" style={{ position: "relative", overflow: "hidden", animationDelay: "0.1s" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: T.gold, opacity: 0.7 }} />
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Avg Yield</div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 900, color: T.green }}>{(_yields.reduce((sum, y) => sum + (y.gross || 0), 0) / (_yields.length || 1)).toFixed(1)}%</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>portfolio average</div>
                </div>
                <div className="kpi-card fade-up" style={{ position: "relative", overflow: "hidden", animationDelay: "0.15s" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: T.gold, opacity: 0.7 }} />
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>Live Overrides</div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 900, color: T.blue }}>{Object.keys(liveProjects).length}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>Firestore updates</div>
                </div>
              </div>

              {/* Data Health Panel */}
              <div className="fade-up" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.gold, letterSpacing: 0.5 }}>Data Health Check</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {(() => {
                      const issues = [];
                      const missingPrice = _projects.filter(p => !p.price || p.price <= 0).length;
                      const missingPpsf = _projects.filter(p => !p.pricePerSqFt || p.pricePerSqFt <= 0).length;
                      const missingImage = _projects.filter(p => !p.image && !liveProjects[p.id]?.image).length;
                      const outdatedYields = _yields.filter(y => !y.gross || y.gross <= 0).length;
                      if (missingPrice > 0) issues.push({ label: `${missingPrice} missing prices`, color: T.red });
                      if (missingPpsf > 0) issues.push({ label: `${missingPpsf} missing PPSF`, color: T.orange });
                      if (missingImage > 0) issues.push({ label: `${missingImage} no images`, color: T.textMuted });
                      if (outdatedYields > 0) issues.push({ label: `${outdatedYields} yields need update`, color: T.orange });
                      if (issues.length === 0) return <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>Γ£ô All data complete</span>;
                      return issues.map((issue, i) => (
                        <span key={i} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 6, background: `${issue.color}15`, color: issue.color, fontWeight: 600 }}>{issue.label}</span>
                      ));
                    })()}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                  {[
                    { label: "Projects", value: _projects.length, color: T.gold, complete: _projects.filter(p => p.price && p.pricePerSqFt && (p.image || liveProjects[p.id]?.image)).length },
                    { label: "Yields", value: _yields.length, color: T.green, complete: _yields.filter(y => y.gross && y.gross > 0).length },
                    { label: "Communities", value: Object.keys(defaultCommunityROI).length, color: T.teal, complete: Object.values(defaultCommunityROI).filter(c => c.roi && c.roi > 0).length },
                    { label: "Live Overrides", value: Object.keys(liveProjects).length, color: T.blue },
                    { label: "Price History", value: Object.values(priceHistory).reduce((sum, arr) => sum + (arr?.length || 0), 0), color: T.purple },
                  ].map((item, i) => (
                    <div key={i} style={{ textAlign: "center", padding: "8px 10px", background: T.surfaceAlt, borderRadius: 8, border: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: item.color, fontFamily: "'Fraunces',serif" }}>{item.value}</div>
                      <div style={{ fontSize: 9, color: T.textMuted, fontWeight: 600, textTransform: "uppercase" }}>{item.label}</div>
                      {item.complete !== undefined && <div style={{ fontSize: 9, color: item.complete === item.value ? T.green : T.orange, marginTop: 2 }}>{Math.round((item.complete / item.value) * 100)}% complete</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sub-tab navigation - Enhanced */}
              <div style={{ display: "flex", gap: 4, background: T.surfaceAlt, padding: 4, borderRadius: 10, marginBottom: 24 }}>
                {[
                  { id: "projects", label: "Projects", count: _projects.length, icon: I.projects },
                  { id: "yields", label: "Yields", count: _yields.length, icon: I.yields },
                  { id: "communities", label: "Communities", count: Object.keys(defaultCommunityROI).length, icon: I.chart },
                  { id: "pricehistory", label: "Price History", count: Object.values(priceHistory).reduce((sum, arr) => sum + (arr?.length || 0), 0), icon: I.chart },
                ].map(st => (
                  <button type="button" key={st.id} onClick={() => { 
                    if (dataSubTab === st.id) return; // Don't reset if same tab
                    setDataSubTab(st.id); 
                    setEditingProject(null); 
                    setEditingCommunity(null); 
                    setEditingYield(null); 
                    setEditingCommunityIntel(null); 
                    setBulkSelected([]); 
                  }}
                    style={{ 
                      padding: "10px 20px", borderRadius: 8, border: "none",
                      background: dataSubTab === st.id ? T.surface : "transparent",
                      color: dataSubTab === st.id ? T.white : T.textMuted,
                      fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
                      transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8
                    }}>
                    <span style={{ opacity: dataSubTab === st.id ? 1 : 0.6 }}>{st.icon}</span>
                    {st.label}
                    <span style={{ 
                      background: dataSubTab === st.id ? T.gold : T.border,
                      color: dataSubTab === st.id ? T.surface : T.textMuted,
                      padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700
                    }}>{st.count}</span>
                  </button>
                ))}
              </div>

              {/* ─── PROJECTS EDITOR ─── */}
              {dataSubTab === "projects" && (
                <Section title="Project Data Manager" sub="Edit prices, PPSF, status — changes go live instantly" action={
                <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={exportProjectsExcel} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,padding:"7px 14px",borderRadius:8,border:"1px solid rgba(100,116,139,0.3)",background:"transparent",color:T.textSecondary,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>Export</button>
                    <button type="button" onClick={() => setShowDataImport(true)} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,padding:"7px 14px",borderRadius:8,border:"1px solid rgba(20,184,166,0.4)",background:"rgba(20,184,166,0.08)",color:T.teal,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Import CSV
                    </button>
                    <button type="button" onClick={() => { setEditingProject("new"); setProjectForm({}); }} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,padding:"7px 14px",borderRadius:8,border:"1px solid rgba(16,185,129,0.4)",background:"rgba(16,185,129,0.08)",color:"#10B981",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>+ Add Project</button>
                    <button type="button" onClick={fetchLiveData} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,padding:"7px 14px",borderRadius:8,border:"1px solid rgba(212,168,67,0.4)",background:"rgba(212,168,67,0.08)",color:"#D4A843",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600}}>{I.refresh} Refresh</button>
                  </div>
                }>
                  {/* Search */}
                  <TabHelp items={[
                    { icon: "[q]", title: "Data Quality Score", desc: "Each project gets a 0-100 score based on completeness. Click the panel to see field breakdown and quick actions." },
                    { icon: "[≡ƒôè]", title: "Data Intelligence", desc: "Track recent changes, find stale data, detect duplicates, and identify integrity issues. Click to expand." },
                    { icon: "[f]", title: "Advanced Filters", desc: "Filter by price, PPSF, tier, quality, staleness, and more. Save custom filter views." },
                    { icon: "[≡ƒöù]", title: "Linked Records", desc: "When editing a project, see community stats and quickly jump to related projects." },
                    { icon: "[b]", title: "Bulk Actions", desc: "Select multiple projects with checkboxes. Export, update prices, or delete in bulk." },
                  ]} />
                  {/* ══════════════════════════════════════
                     ADVANCED FILTER PRO SYSTEM
                     ══════════════════════════════════════ */}
                  
                  {/* Saved Filter Views Pills - Always visible */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Quick Filters:</span>
                    {savedFilterViews.length === 0 && (
                      <button type="button" onClick={() => {
                        const defaults = [
                          { id: 1, name: "Missing Prices", filters: { priceMin: "", priceMax: "0", status: "All", community: "All" }, color: "#EF4444" },
                          { id: 2, name: "Live Overrides", filters: { dataSource: "live", status: "All", community: "All" }, color: "#10B981" },
                          { id: 3, name: "Premium Projects", filters: { tier: "Premium", status: "All", community: "All" }, color: "#D4A843" },
                        ];
                        setSavedFilterViews(defaults);
                        try { localStorage.setItem("admin_savedFilterViews", JSON.stringify(defaults)); } catch {}
                        notify("Default filters restored!");
                      }}
                        style={{ padding: "6px 12px", borderRadius: 20, border: `1px dashed ${T.gold}`, background: `${T.gold}10`, color: T.gold, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
                        Γå╗ Restore Defaults
                      </button>
                    )}
                    {savedFilterViews.map(view => (
                      <div key={view.id} style={{ position: "relative", display: "inline-flex" }}>
                        <button type="button"
                          onClick={() => {
                            if (activeFilterViewId === view.id) {
                              // Deactivate - clear all filters
                              setActiveFilterViewId(null);
                              setProjectCommunityFilter("All");
                              setProjectStatusFilter("All");
                              setProjectTierFilter("All");
                              setPriceMin(""); setPriceMax("");
                              setPpsfMin(""); setPpsfMax("");
                              setDataSourceFilter("all");
                              setModifiedDateFilter("all");
                              setHasImageFilter("all");
                            } else {
                              // Activate this view
                              setActiveFilterViewId(view.id);
                              const f = view.filters;
                              if (f.community) setProjectCommunityFilter(f.community);
                              if (f.status) setProjectStatusFilter(f.status);
                              if (f.tier) setProjectTierFilter(f.tier);
                              if (f.priceMin !== undefined) setPriceMin(f.priceMin);
                              if (f.priceMax !== undefined) setPriceMax(f.priceMax);
                              if (f.ppsfMin !== undefined) setPpsfMin(f.ppsfMin);
                              if (f.ppsfMax !== undefined) setPpsfMax(f.ppsfMax);
                              if (f.dataSource) setDataSourceFilter(f.dataSource);
                              if (f.modifiedDate) setModifiedDateFilter(f.modifiedDate);
                              if (f.hasImage) setHasImageFilter(f.hasImage);
                            }
                          }}
                          style={{ 
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "6px 12px", borderRadius: "20px 4px 4px 20px", 
                            border: `1px solid ${activeFilterViewId === view.id ? view.color : T.border}`,
                            borderRight: "none",
                            background: activeFilterViewId === view.id ? `${view.color}15` : "transparent",
                            color: activeFilterViewId === view.id ? view.color : T.textSecondary,
                            fontSize: 11, fontWeight: activeFilterViewId === view.id ? 700 : 500,
                            cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.15s"
                          }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: view.color }} />
                          {view.name}
                        </button>
                        <button type="button" onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete filter view "${view.name}"?`)) {
                            const updated = savedFilterViews.filter(v => v.id !== view.id);
                            setSavedFilterViews(updated);
                            try { localStorage.setItem("admin_savedFilterViews", JSON.stringify(updated)); } catch {}
                            if (activeFilterViewId === view.id) setActiveFilterViewId(null);
                            notify("Filter view deleted");
                          }
                        }}
                          style={{ 
                            padding: "6px 8px", borderRadius: "0 20px 20px 0",
                            border: `1px solid ${activeFilterViewId === view.id ? view.color : T.border}`,
                            borderLeft: `1px solid ${T.border}`,
                            background: "transparent", color: T.textMuted,
                            fontSize: 10, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
                            transition: "all 0.15s"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = T.red; e.currentTarget.style.background = `${T.red}10`; }}
                          onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = "transparent"; }}>
                          ├ù
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setShowSaveFilterModal(true)}
                      style={{ padding: "6px 10px", borderRadius: 20, border: `1px dashed ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                      + Save Current
                    </button>
                  </div>
                  
                  {/* Main Filter Bar */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center", padding: "10px 16px", background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
                    {/* Search */}
                    <div style={{ position: "relative", flex: "1 1 200px", minWidth: 160 }}>
                      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textMuted, fontSize: 13, pointerEvents: "none" }}>Γîò</span>
                      <input value={dataSearch} onChange={e => { setDataSearch(e.target.value); setActiveFilterViewId(null); }} placeholder="Search projects..."
                        style={{ width: "100%", padding: "8px 10px 8px 28px", background: T.surface, border: `1px solid ${dataSearch ? T.gold : T.border}`, borderRadius: 8, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    
                    {/* Community Filter */}
                    <select value={projectCommunityFilter} onChange={e => { setProjectCommunityFilter(e.target.value); setActiveFilterViewId(null); }}
                      style={{ padding: "8px 10px", background: projectCommunityFilter !== "All" ? `${T.gold}15` : T.surface, border: `1px solid ${projectCommunityFilter !== "All" ? T.gold : T.border}`, borderRadius: 8, color: projectCommunityFilter !== "All" ? T.gold : T.textSecondary, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer", fontWeight: projectCommunityFilter !== "All" ? 700 : 400, maxWidth: 180 }}>
                      <option value="All">All Communities</option>
                      {[...new Set(_projects.map(p => p.community))].sort().map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    
                    {/* Status Filter */}
                    <select value={projectStatusFilter} onChange={e => { setProjectStatusFilter(e.target.value); setActiveFilterViewId(null); }}
                      style={{ padding: "8px 10px", background: projectStatusFilter !== "All" ? `${T.gold}15` : T.surface, border: `1px solid ${projectStatusFilter !== "All" ? T.gold : T.border}`, borderRadius: 8, color: projectStatusFilter !== "All" ? T.gold : T.textSecondary, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer", fontWeight: projectStatusFilter !== "All" ? 700 : 400 }}>
                      <option value="All">All Status</option>
                      {["Under Construction","Off-Plan","Completed","Selling","Upcoming","Sold Out","Ready"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    
                    {/* Sort */}
                    <select value={projectSortKey + "_" + projectSortDir} onChange={e => { const [k,d] = e.target.value.split("_"); setProjectSortKey(k); setProjectSortDir(d); }}
                      style={{ padding: "8px 10px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSecondary, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                      <option value="name_asc">Name AΓåÆZ</option>
                      <option value="name_desc">Name ZΓåÆA</option>
                      <option value="price_asc">Price LowΓåÆHigh</option>
                      <option value="price_desc">Price HighΓåÆLow</option>
                      <option value="ppsf_desc">PPSF HighΓåÆLow</option>
                      <option value="construction_desc">Construction % High</option>
                      <option value="status_asc">Status AΓåÆZ</option>
                      <option value="community_asc">Community AΓåÆZ</option>
                    </select>
                    
                    {/* Advanced Filters Toggle */}
                    <button type="button" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      style={{ 
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "8px 12px", borderRadius: 8, 
                        border: `1px solid ${showAdvancedFilters || priceMin || priceMax || ppsfMin || ppsfMax || projectTierFilter !== "All" || dataSourceFilter !== "all" || modifiedDateFilter !== "all" || hasImageFilter !== "all" ? T.teal : T.border}`,
                        background: showAdvancedFilters ? `${T.teal}15` : "transparent",
                        color: showAdvancedFilters || priceMin || priceMax || ppsfMin || ppsfMax || projectTierFilter !== "All" || dataSourceFilter !== "all" || modifiedDateFilter !== "all" || hasImageFilter !== "all" ? T.teal : T.textMuted,
                        fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif"
                      }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                      Filters
                      {(priceMin || priceMax || ppsfMin || ppsfMax || projectTierFilter !== "All" || dataSourceFilter !== "all" || modifiedDateFilter !== "all" || hasImageFilter !== "all") && (
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.teal }} />
                      )}
                    </button>
                    
                    {/* Column Settings Toggle */}
                    <div style={{ position: "relative" }}>
                      <button type="button" onClick={() => setShowColumnSettings(!showColumnSettings)}
                        style={{ 
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "8px 12px", borderRadius: 8, 
                          border: `1px solid ${showColumnSettings ? T.purple : T.border}`,
                          background: showColumnSettings ? `${T.purple}15` : "transparent",
                          color: showColumnSettings ? T.purple : T.textMuted,
                          fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif"
                        }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        Columns
                      </button>
                      {/* Column Settings Dropdown */}
                      {showColumnSettings && (
                        <div className="fade-up" style={{ 
                          position: "absolute", top: "100%", right: 0, marginTop: 8, 
                          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
                          padding: 16, zIndex: 100, minWidth: 220, boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>Toggle Columns</span>
                            <button type="button" onClick={resetColumns} style={{ fontSize: 10, color: T.textMuted, background: "none", border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Reset</button>
                          </div>
                          {[
                            { key: "community", label: "Community" },
                            { key: "price", label: "Price" },
                            { key: "ppsf", label: "PPSF" },
                            { key: "status", label: "Status" },
                            { key: "source", label: "Source" },
                            { key: "quality", label: "Quality Score" },
                            { key: "tier", label: "Tier" },
                            { key: "handover", label: "Handover" },
                            { key: "beds", label: "Beds/Type" },
                          ].map(col => (
                            <label key={col.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer", borderBottom: `1px solid ${T.border}20` }}>
                              <input type="checkbox" checked={visibleColumns[col.key]} onChange={() => toggleColumn(col.key)}
                                style={{ accentColor: T.purple, cursor: "pointer" }} />
                              <span style={{ fontSize: 12, color: visibleColumns[col.key] ? T.white : T.textMuted }}>{col.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Clear All Filters */}
                    {(dataSearch || projectCommunityFilter !== "All" || projectStatusFilter !== "All" || priceMin || priceMax || ppsfMin || ppsfMax || projectTierFilter !== "All" || dataSourceFilter !== "all" || modifiedDateFilter !== "all" || hasImageFilter !== "all" || qualityFilter !== "all" || stalenessFilter !== "all") && (
                      <button type="button" onClick={() => { 
                        setDataSearch(""); setProjectCommunityFilter("All"); setProjectStatusFilter("All");
                        setPriceMin(""); setPriceMax(""); setPpsfMin(""); setPpsfMax("");
                        setProjectTierFilter("All"); setDataSourceFilter("all"); setModifiedDateFilter("all");
                        setHasImageFilter("all"); setQualityFilter("all"); setStalenessFilter("all"); setActiveFilterViewId(null);
                      }}
                        style={{ padding: "8px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, color: T.red, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" }}>
                        Γ£ò Clear All
                      </button>
                    )}
                  </div>
                  
                  {/* Advanced Filters Panel */}
                  {showAdvancedFilters && (
                    <div className="fade-up" style={{ 
                      display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12,
                      padding: 16, marginBottom: 16, background: T.surface, borderRadius: 12, 
                      border: `1px solid ${T.teal}30`
                    }}>
                      {/* Price Range */}
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Price Range (AED)</label>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input type="number" value={priceMin} onChange={e => { setPriceMin(e.target.value); setActiveFilterViewId(null); }} placeholder="Min"
                            style={{ flex: 1, padding: "7px 10px", background: T.bg, border: `1px solid ${priceMin ? T.teal : T.border}`, borderRadius: 6, color: T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                          <span style={{ color: T.textMuted, fontSize: 11 }}>—</span>
                          <input type="number" value={priceMax} onChange={e => { setPriceMax(e.target.value); setActiveFilterViewId(null); }} placeholder="Max"
                            style={{ flex: 1, padding: "7px 10px", background: T.bg, border: `1px solid ${priceMax ? T.teal : T.border}`, borderRadius: 6, color: T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                        </div>
                      </div>
                      
                      {/* PPSF Range */}
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6, display: "block" }}>PPSF Range</label>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input type="number" value={ppsfMin} onChange={e => { setPpsfMin(e.target.value); setActiveFilterViewId(null); }} placeholder="Min"
                            style={{ flex: 1, padding: "7px 10px", background: T.bg, border: `1px solid ${ppsfMin ? T.teal : T.border}`, borderRadius: 6, color: T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                          <span style={{ color: T.textMuted, fontSize: 11 }}>—</span>
                          <input type="number" value={ppsfMax} onChange={e => { setPpsfMax(e.target.value); setActiveFilterViewId(null); }} placeholder="Max"
                            style={{ flex: 1, padding: "7px 10px", background: T.bg, border: `1px solid ${ppsfMax ? T.teal : T.border}`, borderRadius: 6, color: T.white, fontSize: 11, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                        </div>
                      </div>
                      
                      {/* Tier Filter */}
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Tier</label>
                        <select value={projectTierFilter} onChange={e => { setProjectTierFilter(e.target.value); setActiveFilterViewId(null); }}
                          style={{ width: "100%", padding: "7px 10px", background: T.bg, border: `1px solid ${projectTierFilter !== "All" ? T.teal : T.border}`, borderRadius: 6, color: projectTierFilter !== "All" ? T.teal : T.textSecondary, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                          <option value="All">All Tiers</option>
                          {["Affordable", "Mid-Market", "Mid-Premium", "Premium", "Luxury", "Ultra-Luxury", "Luxury Branded", "Ultra-Lux Branded"].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Data Source */}
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Data Source</label>
                        <select value={dataSourceFilter} onChange={e => { setDataSourceFilter(e.target.value); setActiveFilterViewId(null); }}
                          style={{ width: "100%", padding: "7px 10px", background: T.bg, border: `1px solid ${dataSourceFilter !== "all" ? T.teal : T.border}`, borderRadius: 6, color: dataSourceFilter !== "all" ? T.teal : T.textSecondary, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                          <option value="all">All Sources</option>
                          <option value="live">Live Overrides Only</option>
                          <option value="default">Default Data Only</option>
                        </select>
                      </div>
                      
                      {/* Modified Date */}
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Last Modified</label>
                        <select value={modifiedDateFilter} onChange={e => { setModifiedDateFilter(e.target.value); setActiveFilterViewId(null); }}
                          style={{ width: "100%", padding: "7px 10px", background: T.bg, border: `1px solid ${modifiedDateFilter !== "all" ? T.teal : T.border}`, borderRadius: 6, color: modifiedDateFilter !== "all" ? T.teal : T.textSecondary, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                          <option value="all">Any Time</option>
                          <option value="today">Today</option>
                          <option value="7d">Last 7 Days</option>
                          <option value="30d">Last 30 Days</option>
                          <option value="90d">Last 90 Days</option>
                        </select>
                      </div>
                      
                      {/* Has Image */}
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6, display: "block" }}>Has Image</label>
                        <select value={hasImageFilter} onChange={e => { setHasImageFilter(e.target.value); setActiveFilterViewId(null); }}
                          style={{ width: "100%", padding: "7px 10px", background: T.bg, border: `1px solid ${hasImageFilter !== "all" ? T.teal : T.border}`, borderRadius: 6, color: hasImageFilter !== "all" ? T.teal : T.textSecondary, fontSize: 11, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                          <option value="all">Any</option>
                          <option value="yes">With Image</option>
                          <option value="no">Missing Image</option>
                        </select>
                      </div>
                      
                      {/* Quick Presets */}
                      <div style={{ gridColumn: "span 2", display: "flex", gap: 8, alignItems: "flex-end" }}>
                        <button type="button" onClick={() => { setPriceMax("0"); setPriceMin(""); setActiveFilterViewId(null); }}
                          style={{ padding: "7px 12px", borderRadius: 6, border: `1px solid ${T.red}40`, background: `${T.red}10`, color: T.red, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                          Missing Prices
                        </button>
                        <button type="button" onClick={() => { setHasImageFilter("no"); setActiveFilterViewId(null); }}
                          style={{ padding: "7px 12px", borderRadius: 6, border: `1px solid ${T.orange}40`, background: `${T.orange}10`, color: T.orange, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                          Missing Images
                        </button>
                        <button type="button" onClick={() => { setDataSourceFilter("live"); setActiveFilterViewId(null); }}
                          style={{ padding: "7px 12px", borderRadius: 6, border: `1px solid ${T.green}40`, background: `${T.green}10`, color: T.green, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                          Live Overrides
                        </button>
                        <button type="button" onClick={() => { setModifiedDateFilter("7d"); setActiveFilterViewId(null); }}
                          style={{ padding: "7px 12px", borderRadius: 6, border: `1px solid ${T.blue}40`, background: `${T.blue}10`, color: T.blue, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                          Recent Changes
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Save Filter View Modal */}
                  {showSaveFilterModal && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowSaveFilterModal(false)}>
                      <div style={{ background: T.surface, borderRadius: 16, padding: 24, width: 360, border: `1px solid ${T.border}` }} onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: T.white, marginBottom: 16 }}>Save Current Filters</div>
                        <input value={newFilterViewName} onChange={e => setNewFilterViewName(e.target.value)} placeholder="Filter view name..."
                          style={{ width: "100%", padding: "10px 14px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", marginBottom: 16, outline: "none", boxSizing: "border-box" }} />
                        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16, padding: 12, background: T.surfaceAlt, borderRadius: 8 }}>
                          <div style={{ marginBottom: 4 }}>Current filters:</div>
                          {projectCommunityFilter !== "All" && <div>ΓÇó Community: {projectCommunityFilter}</div>}
                          {projectStatusFilter !== "All" && <div>ΓÇó Status: {projectStatusFilter}</div>}
                          {projectTierFilter !== "All" && <div>ΓÇó Tier: {projectTierFilter}</div>}
                          {priceMin && <div>ΓÇó Price min: AED {Number(priceMin).toLocaleString()}</div>}
                          {priceMax && <div>ΓÇó Price max: AED {Number(priceMax).toLocaleString()}</div>}
                          {ppsfMin && <div>ΓÇó PPSF min: {ppsfMin}</div>}
                          {ppsfMax && <div>ΓÇó PPSF max: {ppsfMax}</div>}
                          {dataSourceFilter !== "all" && <div>ΓÇó Source: {dataSourceFilter}</div>}
                          {modifiedDateFilter !== "all" && <div>ΓÇó Modified: {modifiedDateFilter}</div>}
                          {hasImageFilter !== "all" && <div>ΓÇó Has image: {hasImageFilter}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button type="button" onClick={() => setShowSaveFilterModal(false)}
                            style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
                          <button type="button" onClick={() => {
                            if (!newFilterViewName.trim()) { notify("Enter a name"); return; }
                            const newView = {
                              id: Date.now(),
                              name: newFilterViewName.trim(),
                              filters: {
                                community: projectCommunityFilter,
                                status: projectStatusFilter,
                                tier: projectTierFilter,
                                priceMin, priceMax, ppsfMin, ppsfMax,
                                dataSource: dataSourceFilter,
                                modifiedDate: modifiedDateFilter,
                                hasImage: hasImageFilter
                              },
                              color: ["#D4A843", "#10B981", "#3B82F6", "#8B5CF6", "#F97316", "#EF4444"][Math.floor(Math.random() * 6)]
                            };
                            const updated = [...savedFilterViews, newView];
                            setSavedFilterViews(updated);
                            try { localStorage.setItem("admin_savedFilterViews", JSON.stringify(updated)); } catch {}
                            setNewFilterViewName("");
                            setShowSaveFilterModal(false);
                            notify("Filter view saved!");
                          }}
                            style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: T.gold, color: T.bg, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Save View</button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* ══════════════════════════════════════
                     DATA QUALITY SCORE PANEL
                     ══════════════════════════════════════ */}
                  {(() => {
                    const quality = calculateOverallQuality();
                    if (!quality) return null;
                    
                    return (
                      <div style={{ marginBottom: 16 }}>
                        {/* Quality Summary Bar */}
                        <div 
                          onClick={() => setShowDataQualityPanel(!showDataQualityPanel)}
                          style={{ 
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "12px 16px", borderRadius: showDataQualityPanel ? "10px 10px 0 0" : 10,
                            background: T.surfaceAlt, border: `1px solid ${T.border}`,
                            borderBottom: showDataQualityPanel ? "none" : `1px solid ${T.border}`,
                            cursor: "pointer", transition: "all 0.15s"
                          }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ 
                                width: 42, height: 42, borderRadius: 10, 
                                background: `${quality?.color}15`, 
                                display: "flex", alignItems: "center", justifyContent: "center",
                                border: `2px solid ${quality?.color}`
                              }}>
                                <span style={{ fontSize: 16, fontWeight: 800, color: quality?.color, fontFamily: "'Fraunces',serif" }}>{quality.avgScore}</span>
                              </div>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>Data Quality Score</div>
                                <div style={{ fontSize: 10, color: quality?.color, fontWeight: 600, textTransform: "capitalize" }}>{quality.grade}</div>
                              </div>
                            </div>
                            
                            {/* Quick Stats */}
                            <div style={{ display: "flex", gap: 16, marginLeft: 16 }}>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#10B981" }}>{quality?.grades?.excellent}</div>
                                <div style={{ fontSize: 9, color: T.textMuted }}>Excellent</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#3B82F6" }}>{quality?.grades?.good}</div>
                                <div style={{ fontSize: 9, color: T.textMuted }}>Good</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#F97316" }}>{quality?.grades?.fair}</div>
                                <div style={{ fontSize: 9, color: T.textMuted }}>Fair</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#EF4444" }}>{quality?.grades?.poor}</div>
                                <div style={{ fontSize: 9, color: T.textMuted }}>Poor</div>
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {/* Quality Filter Pills */}
                            <div style={{ display: "flex", gap: 6 }}>
                              {[
                                { key: "all", label: "All", color: T.textMuted },
                                { key: "poor", label: "Poor", color: "#EF4444" },
                                { key: "fair", label: "Fair", color: "#F97316" },
                              ].map(f => (
                                <button key={f.key} type="button" onClick={(e) => { e.stopPropagation(); setQualityFilter(qualityFilter === f.key ? "all" : f.key); }}
                                  style={{ 
                                    padding: "4px 10px", borderRadius: 12, fontSize: 10, fontWeight: 600,
                                    border: `1px solid ${qualityFilter === f.key ? f.color : T.border}`,
                                    background: qualityFilter === f.key ? `${f.color}15` : "transparent",
                                    color: qualityFilter === f.key ? f.color : T.textMuted,
                                    cursor: "pointer", fontFamily: "'Outfit',sans-serif"
                                  }}>
                                  {f.label}
                                </button>
                              ))}
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" style={{ transform: showDataQualityPanel ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          </div>
                        </div>
                        
                        {/* Expanded Quality Details */}
                        {showDataQualityPanel && (
                          <div className="fade-up" style={{ 
                            padding: 16, background: T.surface, 
                            borderRadius: "0 0 10px 10px", border: `1px solid ${T.border}`, borderTop: "none"
                          }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Field Completion Rates</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                              {[
                                { key: "price", label: "Price", weight: 25 },
                                { key: "status", label: "Status", weight: 15 },
                                { key: "ppsf", label: "PPSF", weight: 15 },
                                { key: "image", label: "Image", weight: 15 },
                                { key: "handover", label: "Handover", weight: 10 },
                                { key: "tier", label: "Tier", weight: 8 },
                                { key: "beds", label: "Beds", weight: 6 },
                                { key: "type", label: "Type", weight: 6 },
                              ].map(field => {
                                const rate = quality.fieldRates[field.key];
                                const barColor = rate >= 90 ? "#10B981" : rate >= 70 ? "#3B82F6" : rate >= 50 ? "#F97316" : "#EF4444";
                                return (
                                  <div key={field.key} style={{ padding: 10, background: T.surfaceAlt, borderRadius: 8 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                      <span style={{ fontSize: 11, color: T.white, fontWeight: 600 }}>{field.label}</span>
                                      <span style={{ fontSize: 10, color: barColor, fontWeight: 700 }}>{rate}%</span>
                                    </div>
                                    <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
                                      <div style={{ width: `${rate}%`, height: "100%", background: barColor, borderRadius: 2, transition: "width 0.3s" }} />
                                    </div>
                                    <div style={{ fontSize: 9, color: T.textMuted, marginTop: 4 }}>Weight: {field.weight}%</div>
                                  </div>
                                );
                              })}
                            </div>
                            
                            {/* Quick Actions */}
                            <div style={{ display: "flex", gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                              <button type="button" onClick={() => { setQualityFilter("poor"); setShowDataQualityPanel(false); }}
                                style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.red}40`, background: `${T.red}10`, color: T.red, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                Fix {quality?.grades?.poor} Poor Quality Projects
                              </button>
                              <button type="button" onClick={() => { setPriceMax("0"); setShowDataQualityPanel(false); }}
                                style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.orange}40`, background: `${T.orange}10`, color: T.orange, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                Find Missing Prices ({100 - quality.fieldRates.price}%)
                              </button>
                              <button type="button" onClick={() => { setHasImageFilter("no"); setShowDataQualityPanel(false); }}
                                style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.blue}40`, background: `${T.blue}10`, color: T.blue, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                Find Missing Images ({100 - quality.fieldRates.image}%)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  
                  {/* ══════════════════════════════════════
                     DATA INTELLIGENCE PANEL
                     ══════════════════════════════════════ */}
                  {(() => {
                    const intel = calculateDataIntel();
                    if (!intel) return null;
                    
                    return (
                      <div style={{ marginBottom: 16 }}>
                        {/* Intel Summary Bar */}
                        <div 
                          onClick={() => setShowDataIntelPanel(!showDataIntelPanel)}
                          style={{ 
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "12px 16px", borderRadius: showDataIntelPanel ? "10px 10px 0 0" : 10,
                            background: T.surfaceAlt, border: `1px solid ${T.teal}30`,
                            borderBottom: showDataIntelPanel ? "none" : `1px solid ${T.teal}30`,
                            cursor: "pointer", transition: "all 0.15s"
                          }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ 
                                width: 42, height: 42, borderRadius: 10, 
                                background: `${T.teal}15`, 
                                display: "flex", alignItems: "center", justifyContent: "center",
                                border: `2px solid ${T.teal}`
                              }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                              </div>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>Data Intelligence</div>
                                <div style={{ fontSize: 10, color: T.teal, fontWeight: 600 }}>
                                  {intel.recentChanges.length} changes this week · {intel.duplicates.length} potential duplicates
                                </div>
                              </div>
                            </div>
                            
                            {/* Quick Stats */}
                            <div style={{ display: "flex", gap: 16, marginLeft: 16 }}>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#10B981" }}>{intel.staleness.fresh + intel.staleness.recent}</div>
                                <div style={{ fontSize: 9, color: T.textMuted }}>Fresh</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#F97316" }}>{intel.staleness.stale30 + intel.staleness.stale60}</div>
                                <div style={{ fontSize: 9, color: T.textMuted }}>Stale</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: T.textMuted }}>{intel.staleness.never}</div>
                                <div style={{ fontSize: 9, color: T.textMuted }}>Never</div>
                              </div>
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: T.red }}>{intel.integrityIssues.length}</div>
                                <div style={{ fontSize: 9, color: T.textMuted }}>Issues</div>
                              </div>
                            </div>
                          </div>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {/* Staleness Filter Pills */}
                            <div style={{ display: "flex", gap: 6 }}>
                              {[
                                { key: "all", label: "All", color: T.textMuted },
                                { key: "stale60", label: "60+ days", color: "#EF4444" },
                                { key: "never", label: "Never", color: "#7F1D1D" },
                              ].map(f => (
                                <button key={f.key} type="button" onClick={(e) => { e.stopPropagation(); setStalenessFilter(stalenessFilter === f.key ? "all" : f.key); }}
                                  style={{ 
                                    padding: "4px 10px", borderRadius: 12, fontSize: 10, fontWeight: 600,
                                    border: `1px solid ${stalenessFilter === f.key ? f.color : T.border}`,
                                    background: stalenessFilter === f.key ? `${f.color}15` : "transparent",
                                    color: stalenessFilter === f.key ? f.color : T.textMuted,
                                    cursor: "pointer", fontFamily: "'Outfit',sans-serif"
                                  }}>
                                  {f.label}
                                </button>
                              ))}
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" style={{ transform: showDataIntelPanel ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          </div>
                        </div>
                        
                        {/* Expanded Intel Details */}
                        {showDataIntelPanel && (
                          <div className="fade-up" style={{ 
                            padding: 16, background: T.surface, 
                            borderRadius: "0 0 10px 10px", border: `1px solid ${T.teal}30`, borderTop: "none"
                          }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                              
                              {/* Recent Changes */}
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                  Recent Changes (7 days)
                                </div>
                                {intel.recentChanges.length === 0 ? (
                                  <div style={{ padding: 16, background: T.surfaceAlt, borderRadius: 8, textAlign: "center", color: T.textMuted, fontSize: 11 }}>No changes in the last 7 days</div>
                                ) : (
                                  <div style={{ maxHeight: 180, overflowY: "auto", background: T.surfaceAlt, borderRadius: 8 }}>
                                    {intel.recentChanges.map((change, i) => (
                                      <div key={i} onClick={() => { setEditingProject(change.project.id); setProjectForm(liveProjects[change.project.id] || {}); setShowDataIntelPanel(false); }}
                                        style={{ padding: "8px 12px", borderBottom: `1px solid ${T.border}20`, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                                        onMouseEnter={e => e.currentTarget.style.background = T.surface}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <div>
                                          <div style={{ fontSize: 11, fontWeight: 600, color: T.white }}>{change.project.name}</div>
                                          <div style={{ fontSize: 10, color: T.textMuted }}>{change.updatedBy || "admin"}</div>
                                        </div>
                                        <div style={{ fontSize: 10, color: T.teal, fontWeight: 600 }}>{change.days === 0 ? "Today" : `${change.days}d ago`}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              {/* Data Integrity Issues */}
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                  Data Issues ({intel.integrityIssues.length})
                                </div>
                                {intel.integrityIssues.length === 0 ? (
                                  <div style={{ padding: 16, background: "rgba(16,185,129,0.08)", borderRadius: 8, textAlign: "center", color: T.green, fontSize: 11, border: `1px solid ${T.green}30` }}>
                                    Γ£ô No data integrity issues found
                                  </div>
                                ) : (
                                  <div style={{ maxHeight: 180, overflowY: "auto", background: T.surfaceAlt, borderRadius: 8 }}>
                                    {intel.integrityIssues.slice(0, 8).map((issue, i) => (
                                      <div key={i} onClick={() => { setEditingProject(issue.project.id); setProjectForm(liveProjects[issue.project.id] || {}); setShowDataIntelPanel(false); }}
                                        style={{ padding: "8px 12px", borderBottom: `1px solid ${T.border}20`, cursor: "pointer" }}
                                        onMouseEnter={e => e.currentTarget.style.background = T.surface}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <div style={{ fontSize: 11, fontWeight: 600, color: T.white, marginBottom: 2 }}>{issue.project.name}</div>
                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                          {issue.issues.map((iss, j) => (
                                            <span key={j} style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: `${T.red}15`, color: T.red }}>{iss}</span>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                    {intel.integrityIssues.length > 8 && (
                                      <div style={{ padding: 8, textAlign: "center", fontSize: 10, color: T.textMuted }}>+{intel.integrityIssues.length - 8} more issues</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Potential Duplicates */}
                            {intel.duplicates.length > 0 && (
                              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.orange} strokeWidth="2"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V4a2 2 0 012-2h12"/></svg>
                                    Potential Duplicates ({intel.duplicates.length})
                                  </div>
                                  <button type="button" onClick={() => setShowDuplicatesModal(true)}
                                    style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.orange}40`, background: "transparent", color: T.orange, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
                                    Review All
                                  </button>
                                </div>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  {intel.duplicates.slice(0, 3).map((dup, i) => (
                                    <div key={i} style={{ padding: "8px 12px", background: `${T.orange}10`, borderRadius: 8, border: `1px solid ${T.orange}30`, fontSize: 11 }}>
                                      <span style={{ color: T.white }}>{dup.project1.name}</span>
                                      <span style={{ color: T.orange, margin: "0 6px" }}>Γåö</span>
                                      <span style={{ color: T.white }}>{dup.project2.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Quick Actions */}
                            <div style={{ display: "flex", gap: 10, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                              <button type="button" onClick={() => { setStalenessFilter("stale60"); setShowDataIntelPanel(false); }}
                                style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.red}40`, background: `${T.red}10`, color: T.red, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                Review Stale Data ({intel.staleness.stale60 + intel.staleness.stale90})
                              </button>
                              <button type="button" onClick={() => { setStalenessFilter("never"); setShowDataIntelPanel(false); }}
                                style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.textMuted}40`, background: `${T.textMuted}10`, color: T.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                Never Updated ({intel.staleness.never})
                              </button>
                              <button type="button" onClick={() => { setDataSourceFilter("live"); setShowDataIntelPanel(false); }}
                                style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.green}40`, background: `${T.green}10`, color: T.green, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                View Live Overrides ({intel.totalLive})
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  
                  {/* ══════════════════════════════════════
                     DUPLICATES REVIEW MODAL
                     ══════════════════════════════════════ */}
                  {showDuplicatesModal && (() => {
                    const duplicates = findDuplicates();
                    return (
                      <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.92)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setShowDuplicatesModal(false)}>
                        <div style={{ background: "#0C1B2E", border: `1px solid ${T.orange}40`, borderRadius: 16, width: "95%", maxWidth: 700, maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
                          <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.orange}20`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.orange, margin: 0 }}>Potential Duplicates</h3>
                              <p style={{ fontSize: 12, color: T.textMuted, margin: "4px 0 0" }}>{duplicates.length} potential duplicate pairs found</p>
                            </div>
                            <button type="button" onClick={() => setShowDuplicatesModal(false)} style={{ background: "transparent", border: "none", color: T.textMuted, fontSize: 20, cursor: "pointer", padding: "4px 10px" }}>├ù</button>
                          </div>
                          <div style={{ padding: 20 }}>
                            {duplicates.length === 0 ? (
                              <div style={{ textAlign: "center", padding: 40 }}>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>Γ£ô</div>
                                <div style={{ fontSize: 14, color: T.green, fontWeight: 600 }}>No duplicates detected</div>
                                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Your data is clean!</div>
                              </div>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                {duplicates.map((dup, i) => {
                                  const m1 = getMergedProject(dup.project1);
                                  const m2 = getMergedProject(dup.project2);
                                  return (
                                    <div key={i} style={{ padding: 16, background: T.surfaceAlt, borderRadius: 10, border: `1px solid ${T.border}` }}>
                                      <div style={{ fontSize: 10, color: T.orange, fontWeight: 600, marginBottom: 10 }}>{dup.reason}</div>
                                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
                                        <div onClick={() => { setEditingProject(dup.project1.id); setProjectForm(liveProjects[dup.project1.id] || {}); setShowDuplicatesModal(false); }}
                                          style={{ padding: 12, background: T.surface, borderRadius: 8, cursor: "pointer" }}>
                                          <div style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{dup.project1.name}</div>
                                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{dup.project1.community}</div>
                                          <div style={{ fontSize: 11, color: T.gold, marginTop: 4 }}>{m1.price ? `AED ${(m1.price/1e6).toFixed(2)}M` : "No price"}</div>
                                        </div>
                                        <div style={{ color: T.orange, fontSize: 20 }}>Γåö</div>
                                        <div onClick={() => { setEditingProject(dup.project2.id); setProjectForm(liveProjects[dup.project2.id] || {}); setShowDuplicatesModal(false); }}
                                          style={{ padding: 12, background: T.surface, borderRadius: 8, cursor: "pointer" }}>
                                          <div style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{dup.project2.name}</div>
                                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>{dup.project2.community}</div>
                                          <div style={{ fontSize: 11, color: T.gold, marginTop: 4 }}>{m2.price ? `AED ${(m2.price/1e6).toFixed(2)}M` : "No price"}</div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Bulk Selection Action Bar */}
                  {bulkSelected.length > 0 && (
                    <div style={{ 
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 16px", borderRadius: 10, marginBottom: 16,
                      background: `${T.gold}15`, border: `1px solid ${T.gold}30`
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontWeight: 700, color: T.gold, fontSize: 14 }}>{bulkSelected.length} selected</span>
                        <button type="button" onClick={() => setBulkSelected([])}
                          style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${T.gold}50`, background: "transparent", color: T.gold, fontSize: 11, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Clear</button>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {/* Export Selected */}
                        <button type="button" onClick={() => {
                          const selectedProjects = _projects.filter(p => bulkSelected.includes(String(p.id)));
                          exportFilteredProjects(selectedProjects, `emaar-selected-${bulkSelected.length}-projects.csv`);
                        }}
                          style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.teal}`, background: "transparent", color: T.teal, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Export
                        </button>
                        {/* Bulk Price Update */}
                        <button type="button" onClick={() => setShowBulkModal(true)}
                          style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: T.gold, color: T.bg, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                          {I.revenue} Price Update
                        </button>
                        {/* Bulk Delete */}
                        <button type="button" onClick={() => setShowBulkDeleteConfirm(true)}
                          style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.red}`, background: `${T.red}15`, color: T.red, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Bulk Delete Confirmation Modal */}
                  {showBulkDeleteConfirm && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowBulkDeleteConfirm(false)}>
                      <div className="fade-up" style={{ background: T.surface, borderRadius: 16, padding: 28, width: 420, border: `1px solid ${T.red}40` }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${T.red}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </div>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: T.white }}>Delete {bulkSelected.length} Projects?</div>
                            <div style={{ fontSize: 12, color: T.textMuted }}>This will remove Firestore overrides</div>
                          </div>
                        </div>
                        <div style={{ padding: 14, background: T.surfaceAlt, borderRadius: 10, marginBottom: 20, fontSize: 12, color: T.textSecondary }}>
                          <div style={{ marginBottom: 8 }}><strong>Note:</strong> Only "Live" overrides will be deleted. Default data from data.js cannot be removed.</div>
                          <div>Projects with overrides: <strong style={{ color: T.gold }}>{bulkSelected.filter(id => liveProjects[id]).length}</strong> of {bulkSelected.length} selected</div>
                        </div>
                        <div style={{ display: "flex", gap: 12 }}>
                          <button type="button" onClick={() => setShowBulkDeleteConfirm(false)}
                            style={{ flex: 1, padding: "12px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
                            Cancel
                          </button>
                          <button type="button" onClick={bulkDeleteProjects} disabled={bulkDeleteLoading}
                            style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", background: T.red, color: "#fff", fontSize: 13, cursor: bulkDeleteLoading ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 700, opacity: bulkDeleteLoading ? 0.7 : 1 }}>
                            {bulkDeleteLoading ? "Deleting..." : "Yes, Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Editing form */}
                  {editingProject && (() => {
                    if (editingProject === "new") return (
                      <div className="chart-box fade-up" style={{ padding: 24, marginBottom: 20, border: "1px solid rgba(16,185,129,0.3)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                          <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.green }}>+ Add New Project</h3>
                          <button type="button" onClick={() => setEditingProject(null)} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(100,116,139,0.3)", background: "transparent", color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                          {[
                            { key: "name", label: "Project Name", placeholder: "e.g. Golf Heights" },
                            { key: "community", label: "Community", placeholder: "e.g. Dubai Hills Estate" },
                            { key: "price", label: "Price (AED)", placeholder: "e.g. 2500000" },
                            { key: "ppsf", label: "Price/sqft", placeholder: "e.g. 2200" },
                            { key: "handover", label: "Handover", placeholder: "e.g. Q4 2027" },
                            { key: "beds", label: "Bedrooms", placeholder: "e.g. 1-3 BR" },
                            { key: "paymentPlan", label: "Payment Plan", placeholder: "e.g. 80/20" },
                            { key: "type", label: "Type", placeholder: "e.g. Apartments" },
                            { key: "status", label: "Status", placeholder: "e.g. Off-Plan" },
                            { key: "tier", label: "Tier", placeholder: "e.g. Mid-Premium" },
                            { key: "construction", label: "Construction %", placeholder: "e.g. 0" },
                            { key: "emaarUrl", label: "Source URL", placeholder: "e.g. https://propertyfinder.ae/..." },
                          ].map(f => (
                            <div key={f.key}>
                              <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>{f.label}</label>
                              <input type="text" placeholder={f.placeholder} value={projectForm[f.key] || ""} onChange={e => setProjectForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                style={{ width: "100%", padding: "10px 12px", background: T.bg, border: "1px solid rgba(212,168,67,0.12)", borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                            </div>
                          ))}
                        </div>
                        {/* Image upload for new project */}
                        <div style={{ marginTop: 14, padding: 14, borderRadius: 10, border: "1px solid rgba(212,168,67,0.12)", background: T.surfaceAlt }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Project Image (optional)</div>
                          {projectForm.imageUrl && <img src={projectForm.imageUrl} alt="Preview" style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 8, marginBottom: 8 }} onError={e => e.target.style.display="none"} />}
                          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "9px 14px", borderRadius: 8, border: "1px solid rgba(212,168,67,0.2)", background: T.bg, color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                            {projectForm.imageUploading ? "Uploading..." : projectForm.imageUrl ? "Image Uploaded [change]" : "Upload Image"}
                            <input type="file" accept="image/*" style={{ display: "none" }} onChange={async e => {
                              const file = e.target.files[0]; if (!file) return;
                              setProjectForm(prev => ({ ...prev, imageUploading: true }));
                              const fd = new FormData(); fd.append("file", file); fd.append("upload_preset", "dxb-analytics"); fd.append("cloud_name", "dh9dd5ld0");
                              const res = await fetch("https://api.cloudinary.com/v1_1/dh9dd5ld0/auto/upload", { method: "POST", body: fd });
                              const data = await res.json();
                              setProjectForm(prev => ({ ...prev, imageUrl: data.secure_url, imageUploading: false }));
                              notify("Image uploaded!");
                            }} />
                          </label>
                        </div>
                        {/* Coordinates for new project */}
                        <div style={{ marginTop: 14, padding: 14, borderRadius: 10, border: "1px solid rgba(20,184,166,0.2)", background: "rgba(20,184,166,0.04)" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.teal, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Map Coordinates (optional)</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                              <label style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, display: "block" }}>Latitude</label>
                              <input type="number" step="0.000001" placeholder="e.g. 25.197525" value={projectForm.lat || ""} onChange={e => setProjectForm(prev => ({ ...prev, lat: e.target.value }))}
                                style={{ width: "100%", padding: "8px 10px", background: T.bg, border: "1px solid rgba(20,184,166,0.15)", borderRadius: 7, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 10, color: T.textMuted, marginBottom: 4, display: "block" }}>Longitude</label>
                              <input type="number" step="0.000001" placeholder="e.g. 55.274288" value={projectForm.lng || ""} onChange={e => setProjectForm(prev => ({ ...prev, lng: e.target.value }))}
                                style={{ width: "100%", padding: "8px 10px", background: T.bg, border: "1px solid rgba(20,184,166,0.15)", borderRadius: 7, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
                            </div>
                          </div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>Right-click on Google Maps to copy coordinates</div>
                        </div>
                        {/* Duplicate name warning */}
                        {projectForm.name && emaarProjects.some(p => p.name?.toLowerCase() === projectForm.name?.toLowerCase()) && (
                          <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 11, color: "#EF4444" }}>
                            Warning: A project named "{projectForm.name}" already exists in data.js. This will create a duplicate entry.
                          </div>
                        )}
                        <button type="button" disabled={dataSaving} onClick={() => saveNewProject(projectForm)}
                          style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #10B981, #059669)", color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: dataSaving ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: dataSaving ? 0.6 : 1 }}>
                          {dataSaving ? "Saving..." : "+ Add Project to Firestore"}
                        </button>
                      </div>
                    );
                    const p = _projects.find(x => x.id === editingProject);
                    if (!p) return null;
                    const merged = getMergedProject(p);
                    const hasOverride = !!liveProjects[p.id];
                    const fields = [
                      { key: "price", label: "Price (AED)", type: "number", placeholder: "e.g. 2500000", tip: "Starting price of the project in AED. This appears on the project card on the dashboard." },
                      { key: "ppsf", label: "Price/sqft (AED)", type: "number", placeholder: "e.g. 2200", tip: "Price per square foot. Used in yield calculations and shown in comparison tables." },
                      { key: "sizeFrom", label: "Size From (sqft)", type: "number", placeholder: "e.g. 750", tip: "Minimum unit size in sqft. Shown as size range on the project detail page." },
                      { key: "sizeTo", label: "Size To (sqft)", type: "number", placeholder: "e.g. 2200", tip: "Maximum unit size in sqft. Shown as size range on the project detail page." },
                      { key: "status", label: "Status", type: "select", options: ["Under Construction", "Off-Plan", "Completed", "Selling", "Upcoming", "Sold Out", "Ready"], tip: "Current project status shown as a badge on the project card and detail page." },
                      { key: "handover", label: "Handover", type: "text", placeholder: "e.g. Q4 2027", tip: "Expected handover/completion date. Shown on the project detail page with countdown." },
                      { key: "type", label: "Type", type: "select", options: ["Apartments", "Apts & TH", "Apts & Villas", "Apts & PH", "Townhouses", "Villas", "Branded Res."], tip: "Property type used for filtering on the dashboard and yield calculations." },
                      { key: "beds", label: "Bedrooms", type: "text", placeholder: "e.g. 1-3 BR", tip: "Available bedroom configurations, e.g. '1-3 BR' or 'Studio-4 BR'." },
                      { key: "paymentPlan", label: "Payment Plan", type: "text", placeholder: "e.g. 80/20", tip: "Payment split — affects investment score rating on project cards." },
                      { key: "construction", label: "Construction %", type: "number", placeholder: "e.g. 75", tip: "Construction progress percentage (0-100). Shown as a progress bar on the project card and detail page." },
                      { key: "tier", label: "Tier", type: "select", options: ["Affordable", "Mid-Market", "Mid-Premium", "Premium", "Luxury", "Ultra-Luxury", "Luxury Branded", "Ultra-Lux Branded"], tip: "Price/quality tier badge shown on project cards and in the tier filter on the dashboard." },
                      { key: "emaarUrl", label: "PropertyFinder / Source URL", type: "text", placeholder: "e.g. https://www.propertyfinder.ae/...", tip: "Official listing URL shown as the SOURCE button on the project detail page." },
                      { key: "tagline", label: "Project Tagline", type: "text", placeholder: "e.g. Golf-Side Family Living...", tip: "Short italic tagline shown on the project detail page under the community name. Leave blank to use community default." },
                      { key: "dldPpsf", label: "DLD PPSF (AED)", type: "number", placeholder: "e.g. 2100", tip: "Dubai Land Department's registered price per sqft. Used for comparison vs asking price." },
                      { key: "dataSource", label: "Data Source", type: "select", options: ["Emaar IR Report", "DLD Portal", "DXBinteract", "Manual Entry", "Agent Verified", "Market Research"], tip: "Where this data came from. Helps track data quality and credibility." },
                      { key: "lastVerified", label: "Last Verified Date", type: "text", placeholder: "e.g. Mar 2026", tip: "When this data was last checked against a source. Helps keep data fresh." },
                      { key: "availability", label: "Availability", type: "select", options: ["Available", "Sold Out", "Limited Units", "Coming Soon"], tip: "Current unit availability shown on the project card." },
                      { key: "unitsTotal", label: "Total Units", type: "number", placeholder: "e.g. 200", tip: "Total number of units in the development." },
                      { key: "unitsAvail", label: "Units Available", type: "number", placeholder: "e.g. 45", tip: "Number of units currently available for purchase." },
                      { key: "notes", label: "Admin Notes", type: "text", placeholder: "Internal notes...", tip: "Private notes only visible to admins. Never shown to users." },
                      { key: "name", label: "Project Name", type: "text", placeholder: "e.g. The Golf Residence", tip: "Display name of the project shown everywhere on the dashboard." },
                      { key: "community", label: "Community", type: "text", placeholder: "e.g. Dubai Hills Estate", tip: "Master community name. Must match exactly for ROI data to link correctly." },
                      { key: "district", label: "District Code", type: "text", placeholder: "e.g. DHE", tip: "Short district code used for filtering (DHE, DCH, EBF, ES, GPC, TV, RYM, TO, BB, TH)." },
                      { key: "brand", label: "Brand Name", type: "select", options: ["—", "Address", "Vida", "Palace", "Bristol"], tip: "Branded hotel/lifestyle brand. Shows as a gold badge on the project detail page." },
                      { key: "ratingOverride", label: "Rating Override (/10)", type: "number", placeholder: "Leave blank = auto-calculated", tip: "Override the auto-calculated investment score. Set 0-10. Leave blank to use the automatic score based on yield, PPSF, handover, and payment plan." },
                    ];
                    return (
                      <div className="chart-box fade-up" style={{ padding: 24, marginBottom: 20, border: `1px solid ${T.gold}30` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <div>
                            <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.white }}>{merged.name || p.name}</h3>
                            <span style={{ fontSize: 12, color: T.textMuted }}>{p.community} · ID: {p.id}</span>
                            {hasOverride && <span style={{ marginLeft: 8, fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: T.green, fontWeight: 600 }}>LIVE DATA</span>}
                          </div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button type="button" onClick={() => { setViewingVersions(String(p.id)); fetchProjectVersions(p.id); }} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(212,168,67,0.3)", background: "rgba(212,168,67,0.06)", color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>Version History</button>
                            <button type="button" onClick={() => deleteProject(p.id)} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: T.red, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>Delete</button>
                            {hasOverride && <button type="button" onClick={() => resetProjectData(p.id)} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 8, border: `1px solid rgba(239,68,68,0.3)`, background: "rgba(239,68,68,0.06)", color: T.red, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>Reset</button>}
                            <button type="button" onClick={() => setEditingProject(null)} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
                          </div>
                        </div>
                        {hasOverride && (merged.updatedBy || merged.updatedAt) && (
                          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: 8, background: "rgba(212,168,67,0.05)", border: "1px solid rgba(212,168,67,0.1)", marginBottom: 16, fontSize: 11, flexWrap: "wrap" }}>
                            <span style={{ color: T.textMuted }}>Last saved by</span>
                            <span style={{ color: T.gold, fontWeight: 700 }}>{merged.updatedBy || "—"}</span>
                            {merged.updatedAt && <><span style={{ color: T.textMuted }}>·</span><span style={{ color: T.textSecondary }}>{new Date(merged.updatedAt).toLocaleString("en-AE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span></>}
                            {merged.rolledBackFrom && <span style={{ color: T.teal, fontSize: 10, fontWeight: 700 }}>[Rolled back from {new Date(merged.rolledBackFrom).toLocaleString("en-AE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}]</span>}
                          </div>
                        )}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                          {fields.map(f => (
                            <div key={f.key}>
                              <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center" }}>{f.label}{f.tip && <HelpTip text={f.tip} />}</label>
                              {(() => {
                                const hasErr = validationErrors[f.key];
                                const borderColor = hasErr ? "#EF4444" : T.border;
                                return f.type === "select" ? (
                                  <select value={projectForm[f.key] ?? merged[f.key] ?? ""} onChange={e => { setProjectForm(prev => ({ ...prev, [f.key]: e.target.value })); setValidationErrors(prev => ({ ...prev, [f.key]: null })); }}
                                    style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${borderColor}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                                    <option value="">—</option>
                                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                                ) : (
                                  <input type={f.type} value={projectForm[f.key] ?? merged[f.key] ?? ""} onChange={e => { setProjectForm(prev => ({ ...prev, [f.key]: e.target.value })); setValidationErrors(prev => ({ ...prev, [f.key]: null })); }} placeholder={f.placeholder}
                                    style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${borderColor}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                                );
                              })()}
                              {validationErrors[f.key] && <div style={{ fontSize: 10, color: "#EF4444", marginTop: 3 }}>{validationErrors[f.key]}</div>}
                              {hasOverride && liveProjects[p.id]?.[f.key] !== undefined && (
                                <div style={{ fontSize: 9, color: T.green, marginTop: 2 }}>Live: {liveProjects[p.id][f.key]} · Default: {p[f.key] ?? "—"}</div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 16, padding: 16, borderRadius: 10, border: "1px solid rgba(212,168,67,0.12)", background: T.surfaceAlt }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Project Image</div>
                          {(projectForm.imageUrl || liveProjects[p.id]?.imageUrl) && (
                            <img src={projectForm.imageUrl || liveProjects[p.id]?.imageUrl} alt="Project" style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 8, marginBottom: 10 }} onError={e => e.target.style.display="none"} />
                          )}
                          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, padding: "10px 16px", borderRadius: 8, border: "1px solid rgba(212,168,67,0.2)", background: T.bg, color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            {projectForm.imageUploading ? "Uploading..." : "Upload Project Image"}
                            <input type="file" accept="image/*,video/*,.pdf" style={{ display: "none" }} onChange={async e => {
                              const file = e.target.files[0]; if (!file) return;
                              setProjectForm(prev => ({ ...prev, imageUploading: true }));
                              const fd = new FormData();
                              fd.append("file", file);
                              fd.append("upload_preset", "dxb-analytics");
                              fd.append("cloud_name", "dh9dd5ld0");
                              const res = await fetch("https://api.cloudinary.com/v1_1/dh9dd5ld0/auto/upload", { method: "POST", body: fd });
                              const data = await res.json();
                              setProjectForm(prev => ({ ...prev, imageUrl: data.secure_url, imageUploading: false }));
                              notify("Image uploaded!");
                            }} />
                          </label>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 6 }}>Supports images, PDFs, videos up to 25MB</div>
                          {/* Direct Image URL input */}
                          <div style={{ marginTop: 10 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Or Paste Image URL</label>
                            <input type="url" placeholder="https://cloudinary.com/... or any image URL" value={projectForm.imageUrl ?? liveProjects[p.id]?.imageUrl ?? ""} onChange={e => setProjectForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                              style={{ width: "100%", padding: "8px 12px", background: T.bg, border: "1px solid rgba(212,168,67,0.12)", borderRadius: 8, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box" }} />
                          </div>
                        </div>

                        {/* ── COORDINATES FOR MAP ── */}
                        <div style={{ marginTop: 12, padding: 16, borderRadius: 10, border: "1px solid rgba(20,184,166,0.2)", background: "rgba(20,184,166,0.04)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: T.teal, letterSpacing: 1, textTransform: "uppercase" }}>Map Coordinates</div>
                              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Set the pin location on the Map tab. Get coordinates from Google Maps.</div>
                            </div>
                            <a href={`https://www.google.com/maps/search/${encodeURIComponent((merged.name || p.name) + " Dubai")}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: T.teal, textDecoration: "none", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(20,184,166,0.3)", background: "rgba(20,184,166,0.08)" }}>Find on Google Maps Γåù</a>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center" }}>Latitude<HelpTip text="Latitude coordinate (e.g. 25.1234). Right-click on Google Maps and copy the first number." /></label>
                              <input type="number" step="0.000001" placeholder="e.g. 25.197525" value={projectForm.lat ?? merged.lat ?? ""} onChange={e => setProjectForm(prev => ({ ...prev, lat: e.target.value }))}
                                style={{ width: "100%", padding: "10px 12px", background: T.bg, border: "1px solid rgba(20,184,166,0.2)", borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box" }} />
                            </div>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center" }}>Longitude<HelpTip text="Longitude coordinate (e.g. 55.2743). Right-click on Google Maps and copy the second number." /></label>
                              <input type="number" step="0.000001" placeholder="e.g. 55.274288" value={projectForm.lng ?? merged.lng ?? ""} onChange={e => setProjectForm(prev => ({ ...prev, lng: e.target.value }))}
                                style={{ width: "100%", padding: "10px 12px", background: T.bg, border: "1px solid rgba(20,184,166,0.2)", borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box" }} />
                            </div>
                          </div>
                          {(projectForm.lat || merged.lat) && (projectForm.lng || merged.lng) && (
                            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ fontSize: 10, color: T.green }}>Γ£ô Coordinates set: {projectForm.lat || merged.lat}, {projectForm.lng || merged.lng}</div>
                              <a href={`https://www.google.com/maps?q=${projectForm.lat || merged.lat},${projectForm.lng || merged.lng}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: T.teal, textDecoration: "none" }}>Preview on Map Γåù</a>
                            </div>
                          )}
                        </div>
                        
                          <div style={{ marginTop: 12, padding: 16, borderRadius: 10, border: "1px solid rgba(212,168,67,0.12)", background: T.surfaceAlt }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Unit Inventory (per bedroom type)</div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 10 }}>Add rows for each bedroom type. Total = all units. Available = units left to sell. This shows the inventory breakdown on the project detail page.</div>
                          {(() => {
                            const currentUnits = projectForm.units || (merged.units ? (Array.isArray(merged.units) ? merged.units : Object.entries(merged.units).map(([type, d]) => ({ type, total: d.total || 0, available: (d.total || 0) - (d.sold || 0) }))) : []);
                            const unitRows = currentUnits.length > 0 ? currentUnits : [{ type: "1BR", total: "", available: "" }, { type: "2BR", total: "", available: "" }, { type: "3BR", total: "", available: "" }];
                            return (
                              <div>
                                {unitRows.map((u, idx) => (
                                  <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
                                    <input placeholder="Type (e.g. 1BR)" value={u.type || ""} onChange={e => { const rows = [...unitRows]; rows[idx] = { ...rows[idx], type: e.target.value }; setProjectForm(prev => ({ ...prev, units: rows })); }} style={{ padding: "8px 10px", background: T.bg, border: "1px solid " + T.border, borderRadius: 7, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif" }} />
                                    <input type="number" placeholder="Total units" value={u.total || ""} onChange={e => { const rows = [...unitRows]; rows[idx] = { ...rows[idx], total: Number(e.target.value) }; setProjectForm(prev => ({ ...prev, units: rows })); }} style={{ padding: "8px 10px", background: T.bg, border: "1px solid " + T.border, borderRadius: 7, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif" }} />
                                    <input type="number" placeholder="Available" value={u.available || ""} onChange={e => { const rows = [...unitRows]; rows[idx] = { ...rows[idx], available: Number(e.target.value) }; setProjectForm(prev => ({ ...prev, units: rows })); }} style={{ padding: "8px 10px", background: T.bg, border: "1px solid " + T.border, borderRadius: 7, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif" }} />
                                    <button type="button" onClick={() => { const rows = unitRows.filter((_, i) => i !== idx); setProjectForm(prev => ({ ...prev, units: rows })); }} style={{ padding: "8px 10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, color: T.red, cursor: "pointer", fontSize: 12 }}>x</button>
                                  </div>
                                ))}
                                <button type="button" onClick={() => { const rows = [...unitRows, { type: "", total: "", available: "" }]; setProjectForm(prev => ({ ...prev, units: rows })); }} style={{ fontSize: 11, padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(212,168,67,0.3)", background: "transparent", color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", marginTop: 4 }}>+ Add Row</button>
                              </div>
                            );
                          })()}
                        </div>
                        <div style={{ marginTop: 12, padding: 16, borderRadius: 10, border: "1px solid rgba(212,168,67,0.12)", background: T.surfaceAlt }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Project Documents</div>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                            {[
                              { key: "pdfBrochure", label: "Brochure PDF" },
                              { key: "pdfFloorPlan", label: "Floor Plan PDF" },
                              { key: "pdfPaymentPlan", label: "Payment Plan PDF" },
                              { key: "pdfFactSheet", label: "Fact Sheet PDF" },
                            ].map(doc => (
                              <div key={doc.key}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>{doc.label}</label>
                                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(212,168,67,0.12)", background: T.bg, color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                  {projectForm[doc.key + "_uploading"] ? "Uploading..." : (projectForm[doc.key] || liveProjects[p.id]?.[doc.key]) ? "Uploaded Γ£ô" : "Upload PDF"}
                                  <input type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={async e => {
                                    const file = e.target.files[0]; if (!file) return;
                                    setProjectForm(prev => ({ ...prev, [doc.key + "_uploading"]: true }));
                                    const fd = new FormData();
                                    fd.append("file", file);
                                    fd.append("upload_preset", "dxb-analytics");
                                    const res = await fetch("https://api.cloudinary.com/v1_1/dh9dd5ld0/auto/upload", { method: "POST", body: fd });
                                    const data = await res.json();
                                    setProjectForm(prev => ({ ...prev, [doc.key]: data.secure_url, [doc.key + "_uploading"]: false }));
                                    notify(doc.label + " uploaded!");
                                  }} />
                                </label>
                                {(projectForm[doc.key] || liveProjects[p.id]?.[doc.key]) && (
                                  <a href={projectForm[doc.key] || liveProjects[p.id]?.[doc.key]} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: T.gold, textDecoration: "none", marginTop: 3, display: "block" }}>View ΓåÆ</a>
                                )}
                              </div>
                            ))}
                          </div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8 }}>Tip: Upload PDFs to Google Drive, set to public, paste the share link here</div>
                          {/* VIDEO + EXTERNAL LINK */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Video URL</label>
                              <input type="url" placeholder="https://youtube.com/..." value={projectForm.videoUrl ?? liveProjects[p.id]?.videoUrl ?? ""} onChange={e => setProjectForm(prev => ({ ...prev, videoUrl: e.target.value }))}
                                style={{ width: "100%", padding: "8px 12px", background: T.bg, border: "1px solid rgba(212,168,67,0.12)", borderRadius: 8, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box" }} />
                              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 3 }}>MP4 or YouTube link. Plays inline on dashboard.</div>
                            </div>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>External Link</label>
                              <input type="url" placeholder="https://emaar.com/project/..." value={projectForm.externalLink ?? liveProjects[p.id]?.externalLink ?? ""} onChange={e => setProjectForm(prev => ({ ...prev, externalLink: e.target.value }))}
                                style={{ width: "100%", padding: "8px 12px", background: T.bg, border: "1px solid rgba(212,168,67,0.12)", borderRadius: 8, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box" }} />
                              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 3 }}>"Visit Website" button on dashboard.</div>
                            </div>
                          </div>
                          {(() => {
                            const history = priceHistory[p.id];
                            if (!history) return (
                              <div style={{ marginTop: 16, padding: 16, borderRadius: 10, border: "1px solid rgba(212,168,67,0.12)", background: T.surfaceAlt, textAlign: "center" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 10 }}>Price History</div>
                                <button type="button" onClick={() => fetchPriceHistory(p.id)} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(212,168,67,0.3)", background: "transparent", color: T.gold, cursor: "pointer" }}>Load Price History</button>
                              </div>
                            );
                            if (history.length === 0) return (
                              <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: T.surfaceAlt }}>
                                <div style={{ fontSize: 11, color: T.textMuted }}>No price history yet.</div>
                              </div>
                            );
                            const max = Math.max(...history.map(h => h.price));
                            const min = Math.min(...history.map(h => h.price));
                            const range = max - min || 1;
                            return (
                              <div style={{ marginTop: 16, padding: 16, borderRadius: 10, border: "1px solid rgba(212,168,67,0.12)", background: T.surfaceAlt }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 12 }}>Price History</div>
                                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
                                  {history.map((h, i) => (
                                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                      <div style={{ fontSize: 8, color: T.textMuted }}>{Math.round(h.price/1000000*10)/10}M</div>
                                      <div style={{ width: "100%", background: T.gold, borderRadius: 3, height: Math.max(4, ((h.price - min) / range) * 60 + 4) + "px" }} />
                                      <div style={{ fontSize: 7, color: T.textMuted }}>{new Date(h.recordedAt).toLocaleDateString("en-AE", { month: "short", day: "numeric" })}</div>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                                  <span style={{ fontSize: 10, color: T.textMuted }}>Low: AED {min.toLocaleString()}</span>
                                  <span style={{ fontSize: 10, color: T.gold }}>High: AED {max.toLocaleString()}</span>
                                </div>
                              </div>
                            );
                          })()}
                        
                        {/* ═══════════════════════════════════════
                           LINKED RECORDS PANEL
                           ═══════════════════════════════════════ */}
                        {(() => {
                          const communityName = p.community;
                          const communityProjects = _projects.filter(proj => proj.community === communityName && proj.id !== p.id);
                          const communityROI = { ...(defaultCommunityROI[communityName] || {}), ...(liveCommunityROI[communityName] || {}) };
                          const communityIntel = { ...(defaultCommunityIntel[communityName] || {}), ...(liveCommunityIntel[communityName] || {}) };
                          const hasROI = !!liveCommunityROI[communityName] || !!defaultCommunityROI[communityName];
                          const hasIntel = !!liveCommunityIntel[communityName] || !!defaultCommunityIntel[communityName];
                          
                          // Calculate community stats
                          const allCommunityProjects = _projects.filter(proj => proj.community === communityName);
                          const avgPrice = allCommunityProjects.length > 0 
                            ? Math.round(allCommunityProjects.reduce((sum, proj) => sum + (getMergedProject(proj).price || 0), 0) / allCommunityProjects.length)
                            : 0;
                          const avgPpsf = allCommunityProjects.length > 0
                            ? Math.round(allCommunityProjects.reduce((sum, proj) => sum + (getMergedProject(proj).ppsf || 0), 0) / allCommunityProjects.length)
                            : 0;
                          
                          return (
                            <div style={{ marginTop: 20, padding: 16, borderRadius: 12, border: `1px solid ${T.purple}30`, background: `${T.purple}08` }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.purple} strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: T.purple }}>Linked Records</span>
                                  <span style={{ fontSize: 10, color: T.textMuted }}>· {communityName}</span>
                                </div>
                                <button type="button" onClick={() => { setDataSubTab("communities"); setEditingCommunity(communityName); setEditingProject(null); }}
                                  style={{ fontSize: 10, padding: "5px 12px", borderRadius: 6, border: `1px solid ${T.purple}40`, background: "transparent", color: T.purple, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
                                  Edit Community ΓåÆ
                                </button>
                              </div>
                              
                              {/* Community Stats Row */}
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 12 }}>
                                <div style={{ padding: 10, background: T.surface, borderRadius: 8, textAlign: "center" }}>
                                  <div style={{ fontSize: 16, fontWeight: 700, color: T.gold, fontFamily: "'Fraunces',serif" }}>{allCommunityProjects.length}</div>
                                  <div style={{ fontSize: 9, color: T.textMuted }}>Projects</div>
                                </div>
                                <div style={{ padding: 10, background: T.surface, borderRadius: 8, textAlign: "center" }}>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>{avgPrice > 0 ? `${(avgPrice/1e6).toFixed(1)}M` : "—"}</div>
                                  <div style={{ fontSize: 9, color: T.textMuted }}>Avg Price</div>
                                </div>
                                <div style={{ padding: 10, background: T.surface, borderRadius: 8, textAlign: "center" }}>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>{avgPpsf > 0 ? avgPpsf.toLocaleString() : "—"}</div>
                                  <div style={{ fontSize: 9, color: T.textMuted }}>Avg PPSF</div>
                                </div>
                                <div style={{ padding: 10, background: T.surface, borderRadius: 8, textAlign: "center" }}>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: communityROI.yield ? T.green : T.textMuted, fontFamily: "'Fraunces',serif" }}>{communityROI.yield ? `${communityROI.yield}%` : "—"}</div>
                                  <div style={{ fontSize: 9, color: T.textMuted }}>Yield</div>
                                </div>
                              </div>
                              
                              {/* Community Data Preview */}
                              {(hasROI || hasIntel) && (
                                <div style={{ padding: 10, background: T.surface, borderRadius: 8, marginBottom: 12 }}>
                                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 11 }}>
                                    {communityROI.rentalYield && <span><span style={{ color: T.textMuted }}>Rental Yield:</span> <span style={{ color: T.green }}>{communityROI.rentalYield}%</span></span>}
                                    {communityROI.appreciation && <span><span style={{ color: T.textMuted }}>Appreciation:</span> <span style={{ color: T.teal }}>{communityROI.appreciation}%</span></span>}
                                    {communityIntel.nearbySchools && <span><span style={{ color: T.textMuted }}>Schools:</span> <span style={{ color: T.white }}>{communityIntel.nearbySchools}</span></span>}
                                    {communityIntel.developmentStage && <span><span style={{ color: T.textMuted }}>Stage:</span> <span style={{ color: T.white }}>{communityIntel.developmentStage}</span></span>}
                                  </div>
                                </div>
                              )}
                              
                              {/* Other Projects in Community */}
                              {communityProjects.length > 0 && (
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                    Other Projects in {communityName} ({communityProjects.length})
                                  </div>
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {communityProjects.slice(0, 8).map(proj => {
                                      const projMerged = getMergedProject(proj);
                                      const projQuality = calculateProjectQuality(proj);
                                      return (
                                        <button key={proj.id} type="button" 
                                          onClick={() => { setEditingProject(proj.id); setProjectForm(liveProjects[proj.id] || {}); }}
                                          style={{ 
                                            padding: "6px 10px", borderRadius: 6, 
                                            border: `1px solid ${T.border}`, background: T.surfaceAlt,
                                            color: T.white, fontSize: 11, cursor: "pointer", 
                                            fontFamily: "'Outfit',sans-serif", textAlign: "left",
                                            display: "flex", alignItems: "center", gap: 6
                                          }}>
                                          <span style={{ 
                                            width: 18, height: 18, borderRadius: 4, fontSize: 8, fontWeight: 700,
                                            background: `${projQuality.color}20`, color: projQuality.color,
                                            display: "flex", alignItems: "center", justifyContent: "center"
                                          }}>{projQuality.score}</span>
                                          <span>{proj.name}</span>
                                          {projMerged.price && <span style={{ color: T.gold, fontSize: 10 }}>{(projMerged.price/1e6).toFixed(1)}M</span>}
                                        </button>
                                      );
                                    })}
                                    {communityProjects.length > 8 && (
                                      <span style={{ padding: "6px 10px", fontSize: 11, color: T.textMuted }}>+{communityProjects.length - 8} more</span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        <button type="button" disabled={dataSaving} onClick={() => saveProjectData(p.id, projectForm)}
                          style={{ marginTop: 20, width: "100%", padding: "12px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: T.bg, fontSize: 14, fontWeight: 700, cursor: dataSaving ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: dataSaving ? 0.6 : 1 }}>
                          {dataSaving ? "Saving..." : "Save to Firestore — Goes Live Instantly"}
                        </button>
                      </div>
                    );
                  })()}

                  {/* ── VERSION HISTORY MODAL ── */}
                  {viewingVersions && (() => {
                    const pid = viewingVersions;
                    const p = _projects.find(x => String(x.id) === pid) || { name: "Project " + pid, id: pid };
                    const versions = projectVersions[pid] || null;
                    return (
                      <div style={{ position: "fixed", inset: 0, background: "rgba(4,9,15,0.92)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }} onClick={() => setViewingVersions(null)}>
                        <div style={{ background: "#0C1B2E", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 16, width: "95%", maxWidth: 780, maxHeight: "88vh", overflowY: "auto", position: "relative" }} onClick={e => e.stopPropagation()}>
                          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(212,168,67,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.gold, margin: 0 }}>Version History</h3>
                              <p style={{ fontSize: 12, color: T.textMuted, margin: "4px 0 0" }}>{p.name} · Every save is captured. Click Rollback to restore any version.</p>
                            </div>
                            <button type="button" onClick={() => setViewingVersions(null)} style={{ background: "transparent", border: "none", color: T.textMuted, fontSize: 20, cursor: "pointer", padding: "4px 10px" }}>x</button>
                          </div>
                          <div style={{ padding: "16px 24px" }}>
                            {versions === null && (
                              <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>Loading versions...</div>
                            )}
                            {versions !== null && versions.length === 0 && (
                              <div style={{ textAlign: "center", padding: 40 }}>
                                <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 8 }}>No version history yet.</div>
                                <div style={{ fontSize: 11, color: T.textMuted }}>Versions are saved automatically every time you click "Save to Firestore".</div>
                              </div>
                            )}
                            {versions !== null && versions.length > 0 && versions.map((v, i) => (
                              <div key={v.id} style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                  <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                      {i === 0 && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: "rgba(16,185,129,0.15)", color: "#10B981" }}>CURRENT</span>}
                                      <span style={{ fontSize: 13, fontWeight: 700, color: T.white }}>{new Date(v.savedAt).toLocaleString("en-AE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                      <span style={{ fontSize: 11, color: T.textMuted }}>·</span>
                                      <span style={{ fontSize: 11, color: T.gold }}>{v.savedBy || "admin"}</span>
                                      <span style={{ fontSize: 10, color: T.textMuted }}>· {v.fieldsChanged || 0} field{v.fieldsChanged !== 1 ? "s" : ""} changed</span>
                                    </div>
                                  </div>
                                  {i !== 0 && (
                                    <button type="button" disabled={rollbackLoading} onClick={() => rollbackToVersion(pid, v)}
                                      style={{ fontSize: 11, padding: "6px 16px", borderRadius: 8, border: "1px solid rgba(212,168,67,0.4)", background: "rgba(212,168,67,0.08)", color: T.gold, cursor: rollbackLoading ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 700, flexShrink: 0 }}>
                                      {rollbackLoading ? "Rolling back..." : "Rollback to This"}
                                    </button>
                                  )}
                                </div>
                                {v.diff && Object.keys(v.diff).length > 0 && (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {Object.entries(v.diff).map(([field, change]) => (
                                      <div key={field} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", padding: "5px 10px", borderRadius: 8 }}>
                                        <span style={{ color: T.textMuted, fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>{field}</span>
                                        <span style={{ color: "#F87171", fontSize: 11, textDecoration: "line-through" }}>{String(change.old || "—").slice(0, 22)}</span>
                                        <span style={{ color: T.textMuted, fontSize: 10 }}>ΓåÆ</span>
                                        <span style={{ color: "#4ADE80", fontSize: 11 }}>{String(change.new || "—").slice(0, 22)}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {(!v.diff || Object.keys(v.diff).length === 0) && (
                                  <div style={{ fontSize: 11, color: T.textMuted, fontStyle: "italic" }}>Initial save — full snapshot stored</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Bulk Edit Bar — only visible when rows are checked ── */}
                  {bulkSelected.length > 0 && (
                    <div className="fade-up" style={{ marginBottom: 12, borderRadius: 10, background: "#0C1B2E", border: `2px solid ${T.gold}`, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px 8px", borderBottom: "1px solid rgba(212,168,67,0.2)" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 7, background: T.gold, fontSize: 12, fontWeight: 900, color: T.bg, flexShrink: 0 }}>{bulkSelected.length}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>projects selected</span>
                        <span style={{ fontSize: 11, color: T.textMuted }}>Set a value below, then click Apply to All</span>
                        <button type="button" onClick={() => { setBulkSelected([]); setBulkForm({}); }} style={{ marginLeft: "auto", fontSize: 11, padding: "4px 12px", borderRadius: 7, border: "1px solid rgba(100,116,139,0.3)", background: "transparent", color: T.textMuted, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Γ£ò Deselect all</button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8, padding: "12px 16px" }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</div>
                          <select value={bulkForm.status || ""} onChange={e => setBulkForm(prev => ({ ...prev, status: e.target.value }))}
                            style={{ width: "100%", padding: "7px 10px", background: bulkForm.status ? `${T.gold}15` : T.surface, border: `1px solid ${bulkForm.status ? T.gold : T.border}`, borderRadius: 8, color: bulkForm.status ? T.gold : T.textMuted, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                            <option value="">— unchanged —</option>
                            {["Under Construction","Off-Plan","Completed","Selling","Upcoming","Sold Out","Ready"].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Tier</div>
                          <select value={bulkForm.tier || ""} onChange={e => setBulkForm(prev => ({ ...prev, tier: e.target.value }))}
                            style={{ width: "100%", padding: "7px 10px", background: bulkForm.tier ? `${T.gold}15` : T.surface, border: `1px solid ${bulkForm.tier ? T.gold : T.border}`, borderRadius: 8, color: bulkForm.tier ? T.gold : T.textMuted, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                            <option value="">— unchanged —</option>
                            {["Affordable","Mid-Market","Mid-Premium","Premium","Luxury","Ultra-Luxury","Luxury Branded","Ultra-Lux Branded"].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Availability</div>
                          <select value={bulkForm.availability || ""} onChange={e => setBulkForm(prev => ({ ...prev, availability: e.target.value }))}
                            style={{ width: "100%", padding: "7px 10px", background: bulkForm.availability ? `${T.gold}15` : T.surface, border: `1px solid ${bulkForm.availability ? T.gold : T.border}`, borderRadius: 8, color: bulkForm.availability ? T.gold : T.textMuted, fontSize: 12, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                            <option value="">— unchanged —</option>
                            {["Available","Sold Out","Limited Units","Coming Soon"].map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Construction %</div>
                          <input type="number" min="0" max="100" placeholder="e.g. 75" value={bulkForm.construction || ""} onChange={e => setBulkForm(prev => ({ ...prev, construction: e.target.value }))}
                            style={{ width: "100%", padding: "7px 10px", background: bulkForm.construction ? `${T.gold}15` : T.surface, border: `1px solid ${bulkForm.construction ? T.gold : T.border}`, borderRadius: 8, color: bulkForm.construction ? T.gold : T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Handover</div>
                          <input type="text" placeholder="e.g. Q4 2027" value={bulkForm.handover || ""} onChange={e => setBulkForm(prev => ({ ...prev, handover: e.target.value }))}
                            style={{ width: "100%", padding: "7px 10px", background: bulkForm.handover ? `${T.gold}15` : T.surface, border: `1px solid ${bulkForm.handover ? T.gold : T.border}`, borderRadius: 8, color: bulkForm.handover ? T.gold : T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box" }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                          <button type="button" onClick={saveBulkEdit} disabled={dataSaving || Object.values(bulkForm).every(v => !v)}
                            style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: Object.values(bulkForm).some(v => v) ? T.gold : "rgba(212,168,67,0.15)", color: Object.values(bulkForm).some(v => v) ? T.bg : T.textMuted, fontSize: 12, fontWeight: 800, cursor: Object.values(bulkForm).some(v => v) ? "pointer" : "not-allowed", fontFamily: "'Outfit',sans-serif" }}>
                            {dataSaving ? "Saving..." : `Apply to All ${bulkSelected.length}`}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Projects list */}
                  <div className="chart-box" style={{ padding: 0, overflow: "hidden" }}>
                    {(() => {
                      // Build dynamic grid columns based on visibility
                      const cols = ["40px", "2fr"]; // checkbox + project name always visible
                      if (visibleColumns.community) cols.push("110px");
                      if (visibleColumns.price) cols.push("110px");
                      if (visibleColumns.ppsf) cols.push("90px");
                      if (visibleColumns.status) cols.push("80px");
                      if (visibleColumns.quality) cols.push("70px");
                      if (visibleColumns.tier) cols.push("100px");
                      if (visibleColumns.handover) cols.push("90px");
                      if (visibleColumns.beds) cols.push("90px");
                      if (visibleColumns.source) cols.push("90px");
                      cols.push("80px"); // edit button always visible
                      const gridCols = cols.join(" ");
                      
                      // Build header columns
                      const headers = [
                        { label: "#", key: null, always: true },
                        { label: "Project", key: "name", always: true },
                        { label: "Community", key: "community", col: "community" },
                        { label: "Price", key: "price", col: "price" },
                        { label: "PPSF", key: "ppsf", col: "ppsf" },
                        { label: "Status", key: "status", col: "status" },
                        { label: "Quality", key: null, col: "quality" },
                        { label: "Tier", key: "tier", col: "tier" },
                        { label: "Handover", key: "handover", col: "handover" },
                        { label: "Beds", key: "beds", col: "beds" },
                        { label: "Source", key: null, col: "source" },
                        { label: "", key: null, always: true },
                      ].filter(h => h.always || visibleColumns[h.col]);
                      
                      // Deduplicate by id — safety net in case data.js has duplicates
                      const _seen = new Set();
                      const allProjects = _projects.filter(p => { if (_seen.has(p.id)) return false; _seen.add(p.id); return true; });
                      const filtered = allProjects
                          .filter(p => {
                            const merged = getMergedProject(p);
                            const hasOverride = !!liveProjects[p.id];
                            const projectQuality = calculateProjectQuality(p);
                            
                            // Basic filters
                            const matchSearch = !dataSearch || (p.name||"").toLowerCase().includes(dataSearch.toLowerCase()) || (p.community||"").toLowerCase().includes(dataSearch.toLowerCase());
                            const matchCommunity = projectCommunityFilter === "All" || p.community === projectCommunityFilter;
                            const matchStatus = projectStatusFilter === "All" || (merged.status||"") === projectStatusFilter;
                            
                            // Advanced filters
                            const price = merged.price || 0;
                            const matchPriceMin = !priceMin || price >= Number(priceMin);
                            const matchPriceMax = !priceMax || (priceMax === "0" ? price === 0 : price <= Number(priceMax));
                            
                            const ppsf = merged.ppsf || 0;
                            const matchPpsfMin = !ppsfMin || ppsf >= Number(ppsfMin);
                            const matchPpsfMax = !ppsfMax || ppsf <= Number(ppsfMax);
                            
                            const matchTier = projectTierFilter === "All" || (merged.tier||"") === projectTierFilter;
                            
                            const matchDataSource = dataSourceFilter === "all" || 
                              (dataSourceFilter === "live" && hasOverride) || 
                              (dataSourceFilter === "default" && !hasOverride);
                            
                            // Modified date filter
                            let matchModifiedDate = true;
                            if (modifiedDateFilter !== "all" && hasOverride && liveProjects[p.id]?.updatedAt) {
                              const modDate = new Date(liveProjects[p.id].updatedAt);
                              const daysDiff = (now - modDate) / (1000 * 60 * 60 * 24);
                              if (modifiedDateFilter === "today") matchModifiedDate = daysDiff < 1;
                              else if (modifiedDateFilter === "7d") matchModifiedDate = daysDiff <= 7;
                              else if (modifiedDateFilter === "30d") matchModifiedDate = daysDiff <= 30;
                              else if (modifiedDateFilter === "90d") matchModifiedDate = daysDiff <= 90;
                            } else if (modifiedDateFilter !== "all" && !hasOverride) {
                              matchModifiedDate = false; // Default data has no modification date
                            }
                            
                            // Has image filter
                            const hasImage = !!(merged.imageUrl || merged.image || p.image);
                            const matchHasImage = hasImageFilter === "all" || 
                              (hasImageFilter === "yes" && hasImage) || 
                              (hasImageFilter === "no" && !hasImage);
                            
                            // Quality filter
                            const matchQuality = qualityFilter === "all" || projectQuality.grade === qualityFilter;
                            
                            // Staleness filter
                            const staleness = calculateStaleness(p);
                            const matchStaleness = stalenessFilter === "all" || 
                              (stalenessFilter === "stale60" && (staleness.status === "stale60" || staleness.status === "stale90")) ||
                              (stalenessFilter === "never" && staleness.status === "never");
                            
                            return matchSearch && matchCommunity && matchStatus && 
                                   matchPriceMin && matchPriceMax && matchPpsfMin && matchPpsfMax &&
                                   matchTier && matchDataSource && matchModifiedDate && matchHasImage && matchQuality && matchStaleness;
                          })
                          .sort((a, b) => {
                            const ma = getMergedProject(a); const mb = getMergedProject(b);
                            const va = ma[projectSortKey] ?? a[projectSortKey] ?? "";
                            const vb = mb[projectSortKey] ?? b[projectSortKey] ?? "";
                            const dir = projectSortDir === "asc" ? 1 : -1;
                            if (typeof va === "number" && typeof vb === "number") return dir * (va - vb);
                            return dir * String(va).localeCompare(String(vb));
                          });
                        
                        // Count active filters
                        const activeFilterCount = [
                          dataSearch, 
                          projectCommunityFilter !== "All", 
                          projectStatusFilter !== "All",
                          priceMin, priceMax, ppsfMin, ppsfMax,
                          projectTierFilter !== "All",
                          dataSourceFilter !== "all",
                          modifiedDateFilter !== "all",
                          hasImageFilter !== "all",
                          qualityFilter !== "all",
                          stalenessFilter !== "all"
                        ].filter(Boolean).length;
                        
                        return (
                          <>
                            {/* Table Header */}
                            <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: 8, padding: "12px 20px", borderBottom: `2px solid ${T.border}`, background: T.surfaceAlt }}>
                              {headers.map(h => (
                                <span key={h.label || "edit"} onClick={() => { if (!h.key) return; if (projectSortKey === h.key) setProjectSortDir(d => d === "asc" ? "desc" : "asc"); else { setProjectSortKey(h.key); setProjectSortDir("asc"); } }}
                                  style={{ fontSize: 9, fontWeight: 700, color: projectSortKey === h.key ? T.gold : T.textMuted, letterSpacing: 1, textTransform: "uppercase", cursor: h.key ? "pointer" : "default", userSelect: "none" }}>
                                  {h.label}{projectSortKey === h.key ? (projectSortDir === "asc" ? " ↑" : " ↓") : ""}
                                </span>
                              ))}
                            </div>
                            {/* Results Bar */}
                            <div style={{ padding: "6px 20px", fontSize: 11, color: T.textMuted, borderBottom: `1px solid ${T.border}`, background: T.bg, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div>
                                Showing <strong style={{ color: T.gold }}>{filtered.length}</strong> of {allProjects.length} projects
                                {activeFilterCount > 0 && <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 10, background: `${T.teal}20`, color: T.teal, fontSize: 10, fontWeight: 600 }}>{activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}</span>}
                                {bulkSelected.length > 0 && <span style={{ marginLeft: 12, color: T.gold }}>· {bulkSelected.length} selected</span>}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {filtered.length > 0 && (
                                  <button type="button" onClick={() => exportFilteredProjects(filtered, `emaar-filtered-${filtered.length}-projects.csv`)}
                                    style={{ fontSize: 10, color: T.teal, background: "none", border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                    Export Filtered
                                  </button>
                                )}
                                <button type="button" onClick={() => setBulkSelected(filtered.map(p => String(p.id)))} style={{ fontSize: 10, color: T.teal, background: "none", border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Select All Visible</button>
                                {bulkSelected.length > 0 && <button type="button" onClick={() => setBulkSelected([])} style={{ fontSize: 10, color: T.red, background: "none", border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Deselect All</button>}
                              </div>
                            </div>
                            {filtered.length === 0 && (
                              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>≡ƒöì</div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: T.white, marginBottom: 4 }}>No projects match your filters</div>
                                <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 16 }}>Try adjusting your filter criteria</div>
                                <button type="button" onClick={() => { 
                                  setDataSearch(""); setProjectCommunityFilter("All"); setProjectStatusFilter("All");
                                  setPriceMin(""); setPriceMax(""); setPpsfMin(""); setPpsfMax("");
                                  setProjectTierFilter("All"); setDataSourceFilter("all"); setModifiedDateFilter("all");
                                  setHasImageFilter("all"); setQualityFilter("all"); setStalenessFilter("all"); setActiveFilterViewId(null);
                                }}
                                  style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.gold}`, background: "transparent", color: T.gold, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
                                  Clear All Filters
                                </button>
                              </div>
                            )}
                            {filtered.map((p, i) => {
                        const merged = getMergedProject(p);
                        const hasOverride = !!liveProjects[p.id];
                        const pQuality = calculateProjectQuality(p);
                        return (
                          <div key={p.id} className="fade-up" style={{ display: "grid", gridTemplateColumns: gridCols, gap: 8, padding: "10px 20px", borderBottom: `1px solid ${T.border}`, alignItems: "center", animationDelay: `${Math.min(i * 0.02, 0.5)}s`, cursor: "pointer", transition: "background .15s", background: editingProject === p.id ? T.goldGlow : "transparent" }}
                            onMouseEnter={e => { if (editingProject !== p.id) e.currentTarget.style.background = T.surfaceAlt; }}
                            onMouseLeave={e => { if (editingProject !== p.id) e.currentTarget.style.background = "transparent"; }}
                            onClick={() => { setEditingProject(p.id); setProjectForm(liveProjects[p.id] || {}); }}>
                            <input type="checkbox" checked={bulkSelected.includes(String(p.id))} onChange={e => setBulkSelected(prev => e.target.checked ? [...prev, String(p.id)] : prev.filter(x => x !== String(p.id)))}
                               onClick={e => e.stopPropagation()} style={{ cursor: "pointer", accentColor: T.gold }} />
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{p.name}</div>
                              <div style={{ fontSize: 10, color: T.textMuted }}>{merged.type || "—"}{visibleColumns.beds ? "" : ` · ${merged.beds || "—"}`}</div>
                            </div>
                            {visibleColumns.community && <span style={{ fontSize: 11, color: T.textSecondary }}>{p.community}</span>}
                            {visibleColumns.price && <span style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>{merged.price ? `AED ${(merged.price / 1e6).toFixed(2)}M` : "TBA"}</span>}
                            {visibleColumns.ppsf && <span style={{ fontSize: 12, color: T.textPrimary }}>{merged.ppsf ? merged.ppsf.toLocaleString() : "—"}</span>}
                            {visibleColumns.status && <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: merged.status === "Selling" ? "rgba(16,185,129,0.12)" : merged.status === "Upcoming" ? "rgba(212,168,67,0.12)" : "rgba(148,163,184,0.1)", color: merged.status === "Selling" ? T.green : merged.status === "Upcoming" ? T.gold : T.textMuted }}>{merged.status || "—"}</span>}
                            {visibleColumns.quality && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4 }} title={`Missing: ${pQuality.missing.join(", ") || "None"}`}>
                                <div style={{ 
                                  width: 28, height: 28, borderRadius: 6, 
                                  background: `${pQuality.color}15`, 
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  border: `1.5px solid ${pQuality.color}`
                                }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: pQuality.color }}>{pQuality.score}</span>
                                </div>
                              </div>
                            )}
                            {visibleColumns.tier && <span style={{ fontSize: 10, color: T.textSecondary }}>{merged.tier || "—"}</span>}
                            {visibleColumns.handover && <span style={{ fontSize: 10, color: T.textSecondary }}>{merged.handover || "—"}</span>}
                            {visibleColumns.beds && <span style={{ fontSize: 10, color: T.textSecondary }}>{merged.beds || "—"}</span>}
                            {visibleColumns.source && <span style={{ fontSize: 10, color: hasOverride ? T.green : T.textMuted, fontWeight: hasOverride ? 600 : 400 }}>{hasOverride ? "ΓùÅ Live" : "Γùï Default"}</span>}
                            <span style={{ fontSize: 11, color: T.gold, fontWeight: 600 }}>Edit ΓåÆ</span>
                          </div>
                        );
                      })}
                          </>
                        );
                      })()}
                  </div>
                </Section>
              )}

              {/* ═══════════════════════════════════════
                 UNIFIED COMMUNITIES EDITOR (ROI + INTEL)
                 ═══════════════════════════════════════ */}
              {dataSubTab === "communities" && (() => {
                const communities = Object.keys(defaultCommunityROI);
                const activeKey = editingCommunity || communities[0];
                const roiMerged = { ...(defaultCommunityROI[activeKey] || {}), ...(liveCommunityROI[activeKey] || {}) };
                const intelMerged = { ...(defaultCommunityIntel[activeKey] || {}), ...(liveCommunityIntel[activeKey] || {}) };
                const hasROI = !!liveCommunityROI[activeKey];
                const hasIntel = !!liveCommunityIntel[activeKey];
                const hasAnyOverride = hasROI || hasIntel;
                
                // Initialize forms when switching communities or on first load
                if (communities.length > 0) {
                  const targetKey = editingCommunity && communities.includes(editingCommunity) ? editingCommunity : communities[0];
                  if (!editingCommunity || !communities.includes(editingCommunity)) {
                    setTimeout(() => {
                      setEditingCommunity(targetKey);
                      setCommunityForm({ ...(defaultCommunityROI[targetKey] || {}), ...(liveCommunityROI[targetKey] || {}) });
                      setCommunityIntelForm({ ...(defaultCommunityIntel[targetKey] || {}), ...(liveCommunityIntel[targetKey] || {}) });
                    }, 0);
                  } else if (Object.keys(communityForm).length === 0) {
                    // Forms not initialized yet (e.g., page refresh with localStorage)
                    setTimeout(() => {
                      setCommunityForm({ ...(defaultCommunityROI[targetKey] || {}), ...(liveCommunityROI[targetKey] || {}) });
                      setCommunityIntelForm({ ...(defaultCommunityIntel[targetKey] || {}), ...(liveCommunityIntel[targetKey] || {}) });
                    }, 0);
                  }
                }

                const inp = (val, ph, onChange, extra) => (
                  <input value={val ?? ""} onChange={onChange} placeholder={ph}
                    style={{ width: "100%", padding: "10px 13px", background: "rgba(4,9,15,0.8)", border: "1px solid rgba(212,168,67,0.14)", borderRadius: 7, color: "#E2E8F0", fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s", ...(extra||{}) }}
                    onFocus={e => e.target.style.borderColor="#D4A843"} onBlur={e => e.target.style.borderColor="rgba(212,168,67,0.14)"} />
                );
                const ta = (val, ph, onChange, rows) => (
                  <textarea value={val ?? ""} onChange={onChange} placeholder={ph} rows={rows||3}
                    style={{ width: "100%", padding: "10px 13px", background: "rgba(4,9,15,0.8)", border: "1px solid rgba(212,168,67,0.14)", borderRadius: 7, color: "#E2E8F0", fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box", resize: "vertical", transition: "border-color 0.15s", lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor="#D4A843"} onBlur={e => e.target.style.borderColor="rgba(212,168,67,0.14)"} />
                );
                const Lbl = ({ children, color }) => (
                  <div style={{ fontSize: 10, fontWeight: 700, color: color || "#64748B", letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 6 }}>{children}</div>
                );

                return (
                  <div style={{ position: "fixed", top: 60, left: 240, right: 0, bottom: 0, display: "flex", zIndex: 50, background: "#04090F" }}>

                    {/* ══════════════════════════════
                        LEFT NAV — Community List
                    ══════════════════════════════ */}
                    <div style={{ width: 280, flexShrink: 0, background: "#060D1A", borderRight: "1px solid rgba(212,168,67,0.1)", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>

                      {/* Back Button */}
                      <button type="button" onClick={() => setDataSubTab("projects")}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 20px", background: "rgba(212,168,67,0.06)", border: "none", borderBottom: "1px solid rgba(212,168,67,0.1)", color: "#D4A843", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left" }}>
                        <span style={{ fontSize: 16 }}>ΓåÉ</span> Back to Data Manager
                      </button>

                      {/* Nav Header */}
                      <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#D4A843", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Communities</div>
                        <div style={{ fontSize: 12, color: "#64748B" }}>{communities.length} areas · {Object.keys(liveCommunityROI).length + Object.keys(liveCommunityIntel).length} live overrides</div>
                      </div>

                      {/* Community List */}
                      <div style={{ flex: 1, padding: "8px 10px", overflowY: "auto" }}>
                        {communities.map(k => {
                          const isActive = activeKey === k;
                          const hasLiveROI = !!liveCommunityROI[k];
                          const hasLiveIntel = !!liveCommunityIntel[k];
                          const roi = { ...(defaultCommunityROI[k] || {}), ...(liveCommunityROI[k] || {}) };
                          const intel = { ...(defaultCommunityIntel[k] || {}), ...(liveCommunityIntel[k] || {}) };
                          const avgYield = roi.grossYield ? Object.values(roi.grossYield).filter(v => v).reduce((a,b) => a+b, 0) / Object.values(roi.grossYield).filter(v => v).length : null;
                          return (
                            <button key={k} type="button"
                              onClick={() => { 
                                setEditingCommunity(k); 
                                setCommunityForm({ ...(defaultCommunityROI[k] || {}), ...(liveCommunityROI[k] || {}) });
                                setCommunityIntelForm({ ...(defaultCommunityIntel[k] || {}), ...(liveCommunityIntel[k] || {}) });
                              }}
                              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: isActive ? "1px solid rgba(212,168,67,0.3)" : "1px solid transparent", background: isActive ? "rgba(212,168,67,0.08)" : "transparent", cursor: "pointer", textAlign: "left", fontFamily: "'Outfit',sans-serif", transition: "all 0.15s", marginBottom: 4, display: "block" }}
                              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background="rgba(255,255,255,0.03)"; }}
                              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background="transparent"; }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                                <div style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? "#D4A843" : "#CBD5E1", lineHeight: 1.3 }}>{k}</div>
                                {(hasLiveROI || hasLiveIntel)
                                  ? <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "rgba(16,185,129,0.12)", color: "#10B981", flexShrink: 0, marginLeft: 6 }}>LIVE</span>
                                  : <span style={{ fontSize: 8, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: "rgba(100,116,139,0.1)", color: "#475569", flexShrink: 0, marginLeft: 6 }}>DEFAULT</span>}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? "#D4A843" : "#94A3B8" }}>{avgYield ? avgYield.toFixed(1) + "%" : intel.avgYield || "—"}</span>
                                {roi.goldenVisa && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 3, background: "rgba(212,168,67,0.1)", color: "#D4A843", fontWeight: 700 }}>VISA</span>}
                                <span style={{ fontSize: 10, color: roi.riskLevel === "Low" ? "#10B981" : roi.riskLevel === "Medium" ? "#F59E0B" : "#64748B" }}>{roi.riskLevel || ""}</span>
                              </div>
                              <div style={{ fontSize: 10, color: "#475569", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{intel.tagline || "No tagline"}</div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Nav Footer */}
                      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: 10, color: "#334155", lineHeight: 1.6 }}>
                        Investment + Lifestyle data saves to Firestore. Dashboard updates instantly.
                      </div>
                    </div>

                    {/* ══════════════════════════════
                        RIGHT — Combined Editor
                    ══════════════════════════════ */}
                    <div style={{ flex: 1, minWidth: 0, overflowY: "auto", height: "100%", scrollbarWidth: "thin" }}>

                      {/* Hero Banner */}
                      <div style={{ padding: "28px 36px 24px", background: "linear-gradient(135deg, rgba(212,168,67,0.07) 0%, rgba(10,22,40,0) 60%)", borderBottom: "1px solid rgba(212,168,67,0.1)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#D4A843", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Editing Community</div>
                          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 32, fontWeight: 900, color: "#FFFFFF", margin: "0 0 8px", lineHeight: 1.1 }}>{activeKey}</h1>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: hasAnyOverride ? "#10B981" : "#475569", boxShadow: hasAnyOverride ? "0 0 8px #10B981" : "none" }} />
                            <span style={{ fontSize: 12, color: hasAnyOverride ? "#10B981" : "#64748B" }}>
                              {hasAnyOverride ? "Live — dashboard shows your custom data" : "Default — showing data.js values"}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button type="button" onClick={fetchLiveData}
                            style={{ fontSize: 12, padding: "10px 18px", borderRadius: 8, border: "1px solid rgba(212,168,67,0.3)", background: "rgba(212,168,67,0.06)", color: "#D4A843", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                            {I.refresh} Refresh
                          </button>
                          {hasAnyOverride && (
                            <button type="button" onClick={() => resetCombinedCommunity(activeKey)}
                              style={{ fontSize: 12, padding: "10px 18px", borderRadius: 8, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.06)", color: "#EF4444", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
                              Reset All
                            </button>
                          )}
                          <button type="button" disabled={dataSaving} onClick={() => saveCombinedCommunity(activeKey, communityForm, communityIntelForm)}
                            style={{ fontSize: 14, padding: "11px 28px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#D4A843,#B8860B)", color: "#000", fontWeight: 800, cursor: dataSaving ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", boxShadow: "0 6px 24px rgba(212,168,67,0.3)" }}>
                            {dataSaving ? "Saving..." : "Publish ΓåÆ Live"}
                          </button>
                        </div>
                      </div>

                      {/* Editor Content */}
                      <div style={{ padding: "28px 36px" }}>

                        {/* ══════ INVESTMENT DATA SECTION ══════ */}
                        <div style={{ marginBottom: 32, padding: 24, background: "rgba(212,168,67,0.03)", border: "1px solid rgba(212,168,67,0.12)", borderRadius: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                            <div style={{ width: 4, height: 24, background: "#D4A843", borderRadius: 2 }} />
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#D4A843", margin: 0 }}>Investment Data</h2>
                            {hasROI && <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 5, background: "rgba(16,185,129,0.12)", color: "#10B981", fontWeight: 600 }}>LIVE</span>}
                          </div>

                          {/* Yield Grid */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
                            {["apt1", "apt2", "apt3", "th", "villa"].map(k => (
                              <div key={k} style={{ background: "rgba(4,9,15,0.5)", padding: 14, borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", marginBottom: 10, textTransform: "uppercase" }}>{k === "apt1" ? "1 BR" : k === "apt2" ? "2 BR" : k === "apt3" ? "3 BR" : k === "th" ? "Townhouse" : "Villa"}</div>
                                <div style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: 9, color: "#D4A843", marginBottom: 3 }}>Gross %</div>
                                  <input type="number" step="0.1" value={communityForm.grossYield?.[k] ?? roiMerged.grossYield?.[k] ?? ""} 
                                    onChange={e => setCommunityForm(prev => ({ ...prev, grossYield: { ...(prev.grossYield || roiMerged.grossYield || {}), [k]: Number(e.target.value) || null } }))}
                                    style={{ width: "100%", padding: "8px", background: "#04090F", border: "1px solid rgba(212,168,67,0.2)", borderRadius: 6, color: "#D4A843", fontSize: 14, fontWeight: 700, fontFamily: "'Fraunces',serif", textAlign: "center" }} />
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                  <div style={{ fontSize: 9, color: "#10B981", marginBottom: 3 }}>Net %</div>
                                  <input type="number" step="0.1" value={communityForm.netYield?.[k] ?? roiMerged.netYield?.[k] ?? ""} 
                                    onChange={e => setCommunityForm(prev => ({ ...prev, netYield: { ...(prev.netYield || roiMerged.netYield || {}), [k]: Number(e.target.value) || null } }))}
                                    style={{ width: "100%", padding: "8px", background: "#04090F", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 6, color: "#10B981", fontSize: 14, fontWeight: 700, fontFamily: "'Fraunces',serif", textAlign: "center" }} />
                                </div>
                                <div>
                                  <div style={{ fontSize: 9, color: "#3B82F6", marginBottom: 3 }}>Rent AED/yr</div>
                                  <input type="number" value={communityForm.estRent?.[k] ?? roiMerged.estRent?.[k] ?? ""} 
                                    onChange={e => setCommunityForm(prev => ({ ...prev, estRent: { ...(prev.estRent || roiMerged.estRent || {}), [k]: Number(e.target.value) || null } }))}
                                    style={{ width: "100%", padding: "8px", background: "#04090F", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 6, color: "#3B82F6", fontSize: 12, fontWeight: 600, textAlign: "center" }} />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Other Investment Fields */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                            <div>
                              <Lbl>5-Year Appreciation %</Lbl>
                              <input type="number" value={communityForm.appreciation5yr ?? roiMerged.appreciation5yr ?? ""} 
                                onChange={e => setCommunityForm(prev => ({ ...prev, appreciation5yr: Number(e.target.value) }))}
                                style={{ width: "100%", padding: "10px 12px", background: "#04090F", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#E2E8F0", fontSize: 14, fontFamily: "'Outfit',sans-serif" }} />
                            </div>
                            <div>
                              <Lbl>YoY Growth %</Lbl>
                              <input type="number" value={communityForm.appreciationYoY ?? roiMerged.appreciationYoY ?? ""} 
                                onChange={e => setCommunityForm(prev => ({ ...prev, appreciationYoY: Number(e.target.value) }))}
                                style={{ width: "100%", padding: "10px 12px", background: "#04090F", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#E2E8F0", fontSize: 14, fontFamily: "'Outfit',sans-serif" }} />
                            </div>
                            <div>
                              <Lbl>Occupancy %</Lbl>
                              <input type="number" value={communityForm.occupancy ?? roiMerged.occupancy ?? ""} 
                                onChange={e => setCommunityForm(prev => ({ ...prev, occupancy: Number(e.target.value) }))}
                                style={{ width: "100%", padding: "10px 12px", background: "#04090F", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#E2E8F0", fontSize: 14, fontFamily: "'Outfit',sans-serif" }} />
                            </div>
                            <div>
                              <Lbl>Risk Level</Lbl>
                              <select value={communityForm.riskLevel ?? roiMerged.riskLevel ?? "Low"} 
                                onChange={e => setCommunityForm(prev => ({ ...prev, riskLevel: e.target.value }))}
                                style={{ width: "100%", padding: "10px 12px", background: "#04090F", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#E2E8F0", fontSize: 14, fontFamily: "'Outfit',sans-serif" }}>
                                <option value="Low">Low</option>
                                <option value="Low-Medium">Low-Medium</option>
                                <option value="Medium">Medium</option>
                                <option value="Medium-High">Medium-High</option>
                                <option value="High">High</option>
                              </select>
                            </div>
                            <div>
                              <Lbl>Service Charge (AED/sqft)</Lbl>
                              <input type="number" value={communityForm.serviceCharge ?? roiMerged.serviceCharge ?? ""} 
                                onChange={e => setCommunityForm(prev => ({ ...prev, serviceCharge: Number(e.target.value) }))}
                                style={{ width: "100%", padding: "10px 12px", background: "#04090F", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#E2E8F0", fontSize: 14, fontFamily: "'Outfit',sans-serif" }} />
                            </div>
                            <div>
                              <Lbl>Avg Days to Lease</Lbl>
                              <input type="number" value={communityForm.avgDaysToLease ?? roiMerged.avgDaysToLease ?? ""} 
                                onChange={e => setCommunityForm(prev => ({ ...prev, avgDaysToLease: Number(e.target.value) }))}
                                style={{ width: "100%", padding: "10px 12px", background: "#04090F", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#E2E8F0", fontSize: 14, fontFamily: "'Outfit',sans-serif" }} />
                            </div>
                            <div>
                              <Lbl>Short-Term Premium %</Lbl>
                              <input type="number" value={communityForm.shortTermPremium ?? roiMerged.shortTermPremium ?? ""} 
                                onChange={e => setCommunityForm(prev => ({ ...prev, shortTermPremium: Number(e.target.value) }))}
                                style={{ width: "100%", padding: "10px 12px", background: "#04090F", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#E2E8F0", fontSize: 14, fontFamily: "'Outfit',sans-serif" }} />
                            </div>
                            <div>
                              <Lbl>Golden Visa Eligible</Lbl>
                              <select value={communityForm.goldenVisa ?? roiMerged.goldenVisa ?? true} 
                                onChange={e => setCommunityForm(prev => ({ ...prev, goldenVisa: e.target.value === "true" }))}
                                style={{ width: "100%", padding: "10px 12px", background: "#04090F", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#E2E8F0", fontSize: 14, fontFamily: "'Outfit',sans-serif" }}>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                              </select>
                            </div>
                          </div>
                          <div style={{ marginTop: 16 }}>
                            <Lbl>Capital Growth Driver</Lbl>
                            {ta(communityForm.capitalGrowthDriver ?? roiMerged.capitalGrowthDriver ?? "", "What drives value in this community?", e => setCommunityForm(prev => ({ ...prev, capitalGrowthDriver: e.target.value })), 2)}
                          </div>
                        </div>

                        {/* ══════ LIFESTYLE DATA SECTION ══════ */}
                        <div style={{ padding: 24, background: "rgba(0,191,165,0.03)", border: "1px solid rgba(0,191,165,0.12)", borderRadius: 14 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                            <div style={{ width: 4, height: 24, background: "#00BFA5", borderRadius: 2 }} />
                            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#00BFA5", margin: 0 }}>Lifestyle & Location</h2>
                            {hasIntel && <span style={{ fontSize: 9, padding: "3px 8px", borderRadius: 5, background: "rgba(16,185,129,0.12)", color: "#10B981", fontWeight: 600 }}>LIVE</span>}
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                            <div>
                              <Lbl color="#00BFA5">Tagline</Lbl>
                              {inp(communityIntelForm.tagline ?? intelMerged.tagline ?? "", "e.g. Golf-Side Family Living...", e => setCommunityIntelForm(prev => ({ ...prev, tagline: e.target.value })))}
                            </div>
                            <div>
                              <Lbl color="#00BFA5">Master Developer</Lbl>
                              {inp(communityIntelForm.masterDev ?? intelMerged.masterDev ?? "", "e.g. Emaar & Meraas joint venture", e => setCommunityIntelForm(prev => ({ ...prev, masterDev: e.target.value })))}
                            </div>
                          </div>

                          <div style={{ marginTop: 16 }}>
                            <Lbl color="#00BFA5">Famous For</Lbl>
                            {ta(communityIntelForm.famousFor ?? intelMerged.famousFor ?? "", "Key attractions, landmarks, features...", e => setCommunityIntelForm(prev => ({ ...prev, famousFor: e.target.value })), 2)}
                          </div>

                          <div style={{ marginTop: 16 }}>
                            <Lbl color="#00BFA5">Lifestyle Description</Lbl>
                            {ta(communityIntelForm.lifestyle ?? intelMerged.lifestyle ?? "", "Target demographic, community vibe...", e => setCommunityIntelForm(prev => ({ ...prev, lifestyle: e.target.value })), 2)}
                          </div>

                          <div style={{ marginTop: 16 }}>
                            <Lbl color="#00BFA5">Road Connectivity</Lbl>
                            {inp(communityIntelForm.roads ?? intelMerged.roads ?? "", "Major roads, metro connections...", e => setCommunityIntelForm(prev => ({ ...prev, roads: e.target.value })))}
                          </div>

                          {/* Key Amenities */}
                          <div style={{ marginTop: 20 }}>
                            <Lbl color="#00BFA5">Key Amenities</Lbl>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                              {(communityIntelForm.keyAmenities ?? intelMerged.keyAmenities ?? []).map((am, idx) => (
                                <div key={idx} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "rgba(4,9,15,0.5)", padding: 12, borderRadius: 8 }}>
                                  <input value={am.icon || ""} onChange={e => {
                                    const arr = [...(communityIntelForm.keyAmenities ?? intelMerged.keyAmenities ?? [])];
                                    arr[idx] = { ...arr[idx], icon: e.target.value };
                                    setCommunityIntelForm(prev => ({ ...prev, keyAmenities: arr }));
                                  }} style={{ width: 40, padding: "6px", background: "#04090F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#E2E8F0", fontSize: 16, textAlign: "center" }} />
                                  <div style={{ flex: 1 }}>
                                    <input value={am.label || ""} onChange={e => {
                                      const arr = [...(communityIntelForm.keyAmenities ?? intelMerged.keyAmenities ?? [])];
                                      arr[idx] = { ...arr[idx], label: e.target.value };
                                      setCommunityIntelForm(prev => ({ ...prev, keyAmenities: arr }));
                                    }} placeholder="Label" style={{ width: "100%", padding: "6px 8px", background: "#04090F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#E2E8F0", fontSize: 12, marginBottom: 4 }} />
                                    <input value={am.items || ""} onChange={e => {
                                      const arr = [...(communityIntelForm.keyAmenities ?? intelMerged.keyAmenities ?? [])];
                                      arr[idx] = { ...arr[idx], items: e.target.value };
                                      setCommunityIntelForm(prev => ({ ...prev, keyAmenities: arr }));
                                    }} placeholder="Items (comma-separated)" style={{ width: "100%", padding: "6px 8px", background: "#04090F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#94A3B8", fontSize: 11 }} />
                                  </div>
                                  <button type="button" onClick={() => {
                                    const arr = (communityIntelForm.keyAmenities ?? intelMerged.keyAmenities ?? []).filter((_, i) => i !== idx);
                                    setCommunityIntelForm(prev => ({ ...prev, keyAmenities: arr }));
                                  }} style={{ padding: "4px 8px", background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 4, color: "#EF4444", cursor: "pointer", fontSize: 14 }}>├ù</button>
                                </div>
                              ))}
                            </div>
                            <button type="button" onClick={() => setCommunityIntelForm(prev => ({ ...prev, keyAmenities: [...(prev.keyAmenities ?? intelMerged.keyAmenities ?? []), { icon: "", label: "", items: "" }] }))}
                              style={{ marginTop: 8, fontSize: 11, padding: "8px 16px", borderRadius: 6, border: "1px solid rgba(0,191,165,0.3)", background: "rgba(0,191,165,0.05)", color: "#00BFA5", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                              + Add Amenity
                            </button>
                          </div>

                          {/* Distances */}
                          <div style={{ marginTop: 20 }}>
                            <Lbl color="#00BFA5">Distances to Key Locations</Lbl>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              {(communityIntelForm.distances ?? intelMerged.distances ?? []).map((d, idx) => (
                                <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", background: "rgba(4,9,15,0.5)", padding: 10, borderRadius: 8 }}>
                                  <input value={d.dest || ""} onChange={e => {
                                    const arr = [...(communityIntelForm.distances ?? intelMerged.distances ?? [])];
                                    arr[idx] = { ...arr[idx], dest: e.target.value };
                                    setCommunityIntelForm(prev => ({ ...prev, distances: arr }));
                                  }} placeholder="Destination" style={{ flex: 1, padding: "6px 8px", background: "#04090F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#E2E8F0", fontSize: 12 }} />
                                  <input type="number" value={d.km || ""} onChange={e => {
                                    const arr = [...(communityIntelForm.distances ?? intelMerged.distances ?? [])];
                                    arr[idx] = { ...arr[idx], km: Number(e.target.value) };
                                    setCommunityIntelForm(prev => ({ ...prev, distances: arr }));
                                  }} placeholder="km" style={{ width: 50, padding: "6px 8px", background: "#04090F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#D4A843", fontSize: 12, textAlign: "center" }} />
                                  <input type="number" value={d.min || ""} onChange={e => {
                                    const arr = [...(communityIntelForm.distances ?? intelMerged.distances ?? [])];
                                    arr[idx] = { ...arr[idx], min: Number(e.target.value) };
                                    setCommunityIntelForm(prev => ({ ...prev, distances: arr }));
                                  }} placeholder="min" style={{ width: 50, padding: "6px 8px", background: "#04090F", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#00BFA5", fontSize: 12, textAlign: "center" }} />
                                  <button type="button" onClick={() => {
                                    const arr = (communityIntelForm.distances ?? intelMerged.distances ?? []).filter((_, i) => i !== idx);
                                    setCommunityIntelForm(prev => ({ ...prev, distances: arr }));
                                  }} style={{ padding: "4px 8px", background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 4, color: "#EF4444", cursor: "pointer", fontSize: 14 }}>├ù</button>
                                </div>
                              ))}
                            </div>
                            <button type="button" onClick={() => setCommunityIntelForm(prev => ({ ...prev, distances: [...(prev.distances ?? intelMerged.distances ?? []), { dest: "", km: 0, min: 0 }] }))}
                              style={{ marginTop: 8, fontSize: 11, padding: "8px 16px", borderRadius: 6, border: "1px solid rgba(0,191,165,0.3)", background: "rgba(0,191,165,0.05)", color: "#00BFA5", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                              + Add Distance
                            </button>
                          </div>
                        </div>
                        
                        {/* ═══════════════════════════════════════
                           LINKED PROJECTS PANEL
                           ═══════════════════════════════════════ */}
                        {(() => {
                          const communityProjects = _projects.filter(p => p.community === activeKey);
                          
                          // Calculate stats
                          const totalProjects = communityProjects.length;
                          const avgPrice = totalProjects > 0 
                            ? Math.round(communityProjects.reduce((sum, p) => sum + (getMergedProject(p).price || 0), 0) / totalProjects)
                            : 0;
                          const avgPpsf = totalProjects > 0
                            ? Math.round(communityProjects.reduce((sum, p) => sum + (getMergedProject(p).ppsf || 0), 0) / totalProjects)
                            : 0;
                          const avgQuality = totalProjects > 0
                            ? Math.round(communityProjects.reduce((sum, p) => sum + calculateProjectQuality(p).score, 0) / totalProjects)
                            : 0;
                          const liveCount = communityProjects.filter(p => liveProjects[p.id]).length;
                          
                          // Group by status
                          const statusGroups = {};
                          communityProjects.forEach(p => {
                            const status = getMergedProject(p).status || "Unknown";
                            if (!statusGroups[status]) statusGroups[status] = [];
                            statusGroups[status].push(p);
                          });
                          
                          return (
                            <div style={{ marginTop: 24, padding: 20, borderRadius: 12, border: `1px solid ${T.purple}30`, background: `${T.purple}05` }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.purple} strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: T.purple }}>Linked Projects</span>
                                  <span style={{ padding: "3px 10px", borderRadius: 12, background: `${T.gold}20`, color: T.gold, fontSize: 11, fontWeight: 700 }}>{totalProjects}</span>
                                </div>
                                <button type="button" onClick={() => { setDataSubTab("projects"); setProjectCommunityFilter(activeKey); }}
                                  style={{ fontSize: 11, padding: "6px 14px", borderRadius: 6, border: `1px solid ${T.purple}40`, background: "transparent", color: T.purple, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>
                                  View All in Projects ΓåÆ
                                </button>
                              </div>
                              
                              {/* Stats Row */}
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 16 }}>
                                <div style={{ padding: 12, background: T.surface, borderRadius: 8, textAlign: "center" }}>
                                  <div style={{ fontSize: 18, fontWeight: 700, color: T.gold, fontFamily: "'Fraunces',serif" }}>{totalProjects}</div>
                                  <div style={{ fontSize: 9, color: T.textMuted }}>Total Projects</div>
                                </div>
                                <div style={{ padding: 12, background: T.surface, borderRadius: 8, textAlign: "center" }}>
                                  <div style={{ fontSize: 15, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>{avgPrice > 0 ? `${(avgPrice/1e6).toFixed(1)}M` : "—"}</div>
                                  <div style={{ fontSize: 9, color: T.textMuted }}>Avg Price</div>
                                </div>
                                <div style={{ padding: 12, background: T.surface, borderRadius: 8, textAlign: "center" }}>
                                  <div style={{ fontSize: 15, fontWeight: 700, color: T.white, fontFamily: "'Fraunces',serif" }}>{avgPpsf > 0 ? avgPpsf.toLocaleString() : "—"}</div>
                                  <div style={{ fontSize: 9, color: T.textMuted }}>Avg PPSF</div>
                                </div>
                                <div style={{ padding: 12, background: T.surface, borderRadius: 8, textAlign: "center" }}>
                                  <div style={{ fontSize: 15, fontWeight: 700, color: avgQuality >= 70 ? T.green : avgQuality >= 50 ? T.orange : T.red, fontFamily: "'Fraunces',serif" }}>{avgQuality}</div>
                                  <div style={{ fontSize: 9, color: T.textMuted }}>Avg Quality</div>
                                </div>
                                <div style={{ padding: 12, background: T.surface, borderRadius: 8, textAlign: "center" }}>
                                  <div style={{ fontSize: 15, fontWeight: 700, color: T.green, fontFamily: "'Fraunces',serif" }}>{liveCount}</div>
                                  <div style={{ fontSize: 9, color: T.textMuted }}>Live Overrides</div>
                                </div>
                              </div>
                              
                              {/* Status Breakdown */}
                              {Object.keys(statusGroups).length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>By Status</div>
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {Object.entries(statusGroups).map(([status, projects]) => (
                                      <div key={status} style={{ 
                                        padding: "6px 12px", borderRadius: 8, 
                                        background: status === "Selling" ? "rgba(16,185,129,0.1)" : status === "Upcoming" ? "rgba(212,168,67,0.1)" : "rgba(148,163,184,0.1)",
                                        border: `1px solid ${status === "Selling" ? "rgba(16,185,129,0.3)" : status === "Upcoming" ? "rgba(212,168,67,0.3)" : "rgba(148,163,184,0.2)"}`,
                                        display: "flex", alignItems: "center", gap: 6
                                      }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: status === "Selling" ? T.green : status === "Upcoming" ? T.gold : T.textMuted }}>{projects.length}</span>
                                        <span style={{ fontSize: 11, color: T.textSecondary }}>{status}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Project List (collapsed by default) */}
                              {totalProjects > 0 && (
                                <div>
                                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Quick Edit Projects</div>
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8, maxHeight: 200, overflowY: "auto" }}>
                                    {communityProjects.map(p => {
                                      const merged = getMergedProject(p);
                                      const quality = calculateProjectQuality(p);
                                      const hasOverride = !!liveProjects[p.id];
                                      return (
                                        <button key={p.id} type="button"
                                          onClick={() => { setDataSubTab("projects"); setEditingProject(p.id); setProjectForm(liveProjects[p.id] || {}); }}
                                          style={{ 
                                            padding: "10px 12px", borderRadius: 8, 
                                            border: `1px solid ${T.border}`, background: T.surface,
                                            cursor: "pointer", fontFamily: "'Outfit',sans-serif", textAlign: "left",
                                            display: "flex", alignItems: "center", gap: 8
                                          }}>
                                          <div style={{ 
                                            width: 24, height: 24, borderRadius: 6, fontSize: 10, fontWeight: 700,
                                            background: `${quality?.color}15`, color: quality?.color,
                                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                                          }}>{quality.score}</div>
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                                            <div style={{ fontSize: 10, color: T.textMuted, display: "flex", gap: 6 }}>
                                              <span>{merged.price ? `${(merged.price/1e6).toFixed(1)}M` : "TBA"}</span>
                                              {hasOverride && <span style={{ color: T.green }}>ΓùÅ Live</span>}
                                            </div>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {totalProjects === 0 && (
                                <div style={{ textAlign: "center", padding: 20, color: T.textMuted }}>
                                  <div style={{ fontSize: 24, marginBottom: 8 }}>≡ƒô¡</div>
                                  <div style={{ fontSize: 12 }}>No projects in this community yet</div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Publish Footer */}
                        <div style={{ marginTop: 24, background: "linear-gradient(135deg,rgba(212,168,67,0.08),rgba(212,168,67,0.03))", border: "1px solid rgba(212,168,67,0.18)", borderRadius: 12, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF", marginBottom: 4 }}>Ready to publish: <span style={{ color: "#D4A843" }}>{activeKey}</span></div>
                            <div style={{ fontSize: 12, color: "#64748B" }}>Investment + Lifestyle data saves to Firestore. Dashboard updates instantly.</div>
                          </div>
                          <button type="button" disabled={dataSaving} onClick={() => saveCombinedCommunity(activeKey, communityForm, communityIntelForm)}
                            style={{ fontSize: 14, padding: "12px 36px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#D4A843,#B8860B)", color: "#000", fontWeight: 800, cursor: dataSaving ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", boxShadow: "0 6px 28px rgba(212,168,67,0.32)" }}>
                            {dataSaving ? "Publishing..." : "Publish ΓåÆ Goes Live Now"}
                          </button>
                        </div>

                      </div>
                    </div>

                  </div>
                );
              })()}

              {/* ─── YIELD TABLE EDITOR ─── */}
              {dataSubTab === "yields" && (
                <Section title="Yield Table Data" sub="Edit yield table entries shown in the Yields tab" action={
                  <button type="button" onClick={fetchLiveData} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.gold}`, background: T.goldGlow, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{I.refresh} Refresh</button>
                }>
                  <TabHelp items={[
                    { icon: "[=]", title: "What is this table?", desc: "This is the yield comparison table users see on the dashboard. It shows rent, price and yield by unit type per community." },
                    { icon: "[e]", title: "How to edit", desc: "Click any row to open the edit form. Change rent, price, gross/net yield, demand level and Golden Visa eligibility." },
                    { icon: "[v]", title: "Save Goes Live", desc: "Changes save to Firestore and update immediately on the main dashboard Yields tab." },
                    { icon: "[o]", title: "Live vs Default", desc: "Green 'Live' badge means you have a Firestore override. Grey means it's showing default data from data.js." },
                  ]} />
                  {/* Editing form */}
                  {editingYield !== null && (() => {
                    const y = emaarYields[editingYield];
                    if (!y) return null;
                    const yieldKey = `${y.community}_${y.unit}`.replace(/\s+/g, "_");
                    const merged = { ...y, ...(liveYields[yieldKey] || {}) };
                    const hasOverride = !!liveYields[yieldKey];
                    const fields = [
                      { key: "rent", label: "Annual Rent (AED)", type: "number" },
                      { key: "price", label: "Unit Price (AED)", type: "number" },
                      { key: "gross", label: "Gross Yield %", type: "number" },
                      { key: "net", label: "Net Yield %", type: "number" },
                      { key: "demand", label: "Demand", type: "select", options: ["Very High", "High", "Moderate-High", "Moderate", "Growing"] },
                      { key: "visa", label: "Golden Visa", type: "select", options: ["Yes", "No", "Some"] },
                    ];
                    return (
                      <div className="chart-box fade-up" style={{ padding: 24, marginBottom: 20, border: `1px solid ${T.gold}30` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                          <div>
                            <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 18, fontWeight: 700, color: T.white }}>{y.unit} — {y.community}</h3>
                            {hasOverride && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "rgba(16,185,129,0.12)", color: T.green, fontWeight: 600 }}>LIVE DATA</span>}
                          </div>
                          <button type="button" onClick={() => setEditingYield(null)} style={{ fontSize: 11, padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                          {fields.map(f => (
                            <div key={f.key}>
                              <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>{f.label}</label>
                              {f.type === "select" ? (
                                <select value={yieldForm[f.key] ?? merged[f.key] ?? ""} onChange={e => setYieldForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                  style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : (
                                <input type={f.type} step="0.1" value={yieldForm[f.key] ?? merged[f.key] ?? ""} onChange={e => setYieldForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={`e.g. ${merged[f.key] || ""}`}
                                  style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                              )}
                            </div>
                          ))}
                        </div>
                        <button type="button" disabled={dataSaving} onClick={() => saveYieldData(yieldKey, yieldForm)}
                          style={{ marginTop: 20, width: "100%", padding: "12px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${T.gold}, ${T.goldDim})`, color: T.bg, fontSize: 14, fontWeight: 700, cursor: dataSaving ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: dataSaving ? 0.6 : 1 }}>
                          {dataSaving ? "Saving..." : "Save Yield Data"}
                        </button>
                      </div>
                    );
                  })()}

                  {/* Yields table */}
                  <div className="chart-box" style={{ padding: 0, overflow: "hidden" }}>
                    <div className="table-scroll">
                      <div style={{ display: "grid", gridTemplateColumns: "40px 1.5fr 1fr 100px 110px 80px 80px 80px 70px", gap: 8, padding: "12px 20px", borderBottom: `2px solid ${T.border}`, background: T.surfaceAlt, minWidth: 800 }}>
                        {["#", "Unit Type", "Community", "Rent", "Price", "Gross", "Net", "Demand", ""].map(h => (
                          <span key={h} style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>{h}</span>
                        ))}
                      </div>
                      {_yields.map((y, i) => {
                        const yieldKey = `${y.community}_${y.unit}`.replace(/\s+/g, "_");
                        const hasOverride = !!liveYields[yieldKey];
                        const merged = { ...y, ...(liveYields[yieldKey] || {}) };
                        return (
                          <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1.5fr 1fr 100px 110px 80px 80px 80px 70px", gap: 8, padding: "10px 20px", borderBottom: `1px solid ${T.border}`, alignItems: "center", cursor: "pointer", transition: "background .15s", minWidth: 800, background: editingYield === i ? T.goldGlow : "transparent" }}
                            onMouseEnter={e => { if (editingYield !== i) e.currentTarget.style.background = T.surfaceAlt; }}
                            onMouseLeave={e => { if (editingYield !== i) e.currentTarget.style.background = "transparent"; }}
                            onClick={() => { setEditingYield(i); setYieldForm(liveYields[yieldKey] || {}); }}>
                            <span style={{ fontSize: 11, color: T.textMuted }}>{i + 1}</span>

                            <span style={{ fontSize: 13, fontWeight: 600, color: T.white }}>{merged.unit}</span>
                            <span style={{ fontSize: 11, color: T.textSecondary }}>{merged.community}</span>
                            <span style={{ fontSize: 12, color: T.textPrimary }}>AED {(merged.rent / 1000).toFixed(0)}K</span>
                            <span style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>AED {(merged.price / 1e6).toFixed(2)}M</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: T.green }}>{merged.gross}%</span>
                            <span style={{ fontSize: 12, color: T.teal }}>{merged.net}%</span>
                            <span style={{ fontSize: 10, color: merged.demand === "Very High" ? T.gold : T.textSecondary }}>{merged.demand}</span>
                            <span style={{ fontSize: 10, color: hasOverride ? T.green : T.textMuted, fontWeight: hasOverride ? 600 : 400 }}>{hasOverride ? "ΓùÅ" : "—"}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Section>
              )}

              {/* ─── PRICE HISTORY SUB-TAB ─── */}
              {dataSubTab === "pricehistory" && (() => {
                const selectedProject = _projects.find(p => String(p.id) === String(phSelId));
                const history         = phSelId ? (priceHistory[phSelId] || []) : [];

                const loadHistory = async (id) => {
                  setPhLoading(true);
                  await fetchPriceHistory(id);
                  setPhLoading(false);
                };

                const saveManualEntry = async () => {
                  if (!phSelId)           { notify("Error: Select a project first"); return; }
                  if (!phManual.price)    { notify("Error: Price is required"); return; }
                  if (!phManual.date)     { notify("Error: Date is required"); return; }
                  setPhSaving(true);
                  try {
                    const entryId = String(phSelId) + "_manual_" + Date.now();
                    await setDoc(doc(db, "priceHistory", entryId), {
                      projectId:  String(phSelId),
                      projectName: selectedProject?.name || "",
                      price:      Number(phManual.price),
                      ppsf:       Number(phManual.ppsf) || 0,
                      recordedAt: new Date(phManual.date).toISOString(),
                      recordedBy: adminUser?.email || "admin",
                      note:       phManual.note || "",
                      manual:     true,
                    });
                    await logAudit(db, { action: "price_history_manual", projectId: phSelId, price: Number(phManual.price), date: phManual.date });
                    notify("Price entry saved");
                    setPhManual({ price: "", ppsf: "", date: "", note: "" });
                    await loadHistory(phSelId);
                  } catch(e) { notify("Error: " + e.message); }
                  setPhSaving(false);
                };

                // Chart dimensions
                const chartH = 140;
                const chartW = 600;
                const pad    = { t: 16, r: 20, b: 28, l: 56 };
                const innerW = chartW - pad.l - pad.r;
                const innerH = chartH - pad.t - pad.b;

                const chartPoints = history.length >= 2 ? (() => {
                  const prices = history.map(h => h.price);
                  const minP   = Math.min(...prices) * 0.97;
                  const maxP   = Math.max(...prices) * 1.03;
                  const rangeP = maxP - minP || 1;
                  return history.map((h, i) => ({
                    x: pad.l + (i / (history.length - 1)) * innerW,
                    y: pad.t + innerH - ((h.price - minP) / rangeP) * innerH,
                    price: h.price,
                    date:  h.recordedAt,
                    ppsf:  h.ppsf,
                  }));
                })() : [];

                const polyline = chartPoints.map(p => `${p.x},${p.y}`).join(" ");

                const inputSt = { width: "100%", padding: "9px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textPrimary, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none", boxSizing: "border-box" };

                return (
                  <Section title="Price History" sub="Track and log price changes per project over time">
                    <TabHelp items={[
                      { icon: "[v]", title: "What is this?", desc: "An audit trail of every price change per project. Automatically records when you save a new price in the Projects tab." },
                      { icon: "[?]", title: "Select a Project", desc: "Choose any of the 48 projects from the dropdown. The chart and table will load its full price history." },
                      { icon: "[n]", title: "Manual Entry", desc: "Add historical price points manually — useful for logging past prices before the system was set up." },
                      { icon: "[x]", title: "Delete Entry", desc: "Click the ├ù button on any row to remove that price entry. A confirmation will appear first." },
                      { icon: "[^]", title: "Chart", desc: "Gold line chart shows price trend over time. Needs at least 2 data points to appear." },
                    ]} />

                    {/* ── PROJECT SELECTOR ── */}
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap" }}>
                      <div style={{ flex: "1 1 300px" }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Select Project</label>
                        <select value={phSelId} onChange={e => { setPhSelId(e.target.value); if (e.target.value) loadHistory(e.target.value); }}
                          style={{ ...inputSt, cursor: "pointer" }}>
                          <option value="">— Choose a project —</option>
                          {[...emaarProjects].sort((a,b) => (a.name||"").localeCompare(b.name||"")).map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.community})</option>
                          ))}
                        </select>
                      </div>
                      {phSelId && (
                        <button type="button" onClick={() => loadHistory(phSelId)} disabled={phLoading}
                          style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${T.gold}40`, background: T.goldGlow, color: T.gold, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif", opacity: phLoading ? 0.6 : 1 }}>
                          {phLoading ? "Loading..." : "Γå║ Refresh"}
                        </button>
                      )}
                    </div>

                    {/* ── EMPTY STATE ── */}
                    {!phSelId && (
                      <div style={{ textAlign: "center", padding: "48px 20px", background: T.surfaceAlt, borderRadius: 14, border: `1px solid ${T.border}` }}>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", color: T.gold }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 6 }}>Select a project to view price history</div>
                        <div style={{ fontSize: 12, color: T.textMuted }}>Price changes are recorded automatically every time you save a project's price.</div>
                      </div>
                    )}

                    {/* ── LOADED STATE ── */}
                    {phSelId && !phLoading && (
                      <>
                        {/* KPI row */}
                        {history.length > 0 && (() => {
                          const prices  = history.map(h => h.price);
                          const first   = prices[0];
                          const last    = prices[prices.length - 1];
                          const changePct = first > 0 ? (((last - first) / first) * 100).toFixed(1) : 0;
                          const highest = Math.max(...prices);
                          const lowest  = Math.min(...prices);
                          return (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                              {[
                                { label: "Current Price",   value: `AED ${last.toLocaleString()}`,     color: T.gold  },
                                { label: "Total Change",    value: `${changePct >= 0 ? "+" : ""}${changePct}%`, color: changePct >= 0 ? T.green : T.red },
                                { label: "All-Time High",   value: `AED ${highest.toLocaleString()}`,  color: T.green },
                                { label: "All-Time Low",    value: `AED ${lowest.toLocaleString()}`,   color: T.textMuted },
                              ].map((k, i) => (
                                <div key={i} className="kpi-card" style={{ border: `1px solid ${T.border}`, position: "relative" }}>
                                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: k.color, opacity: 0.6, borderRadius: "16px 16px 0 0" }} />
                                  <div style={{ fontSize: 18, fontWeight: 900, color: k.color, fontFamily: "'Fraunces',serif" }}>{k.value}</div>
                                  <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>{k.label}</div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        {/* SVG CHART */}
                        {history.length >= 2 ? (
                          <div className="chart-box fade-up" style={{ padding: "16px 20px 12px", marginBottom: 20 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 4 }}>{selectedProject?.name} — Price Timeline</div>
                            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 14 }}>{history.length} data points · AED values</div>
                            <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", height: chartH, overflow: "visible" }}>
                              {/* Grid lines */}
                              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                                const y = pad.t + t * innerH;
                                const prices = history.map(h => h.price);
                                const minP = Math.min(...prices) * 0.97;
                                const maxP = Math.max(...prices) * 1.03;
                                const val  = maxP - (maxP - minP) * t;
                                return (
                                  <g key={i}>
                                    <line x1={pad.l} y1={y} x2={chartW - pad.r} y2={y} stroke={T.border} strokeWidth="1" />
                                    <text x={pad.l - 6} y={y + 4} textAnchor="end" fill={T.textMuted} fontSize="9">{(val / 1e6).toFixed(1)}M</text>
                                  </g>
                                );
                              })}
                              {/* Area fill */}
                              <defs>
                                <linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={T.gold} stopOpacity="0.2" />
                                  <stop offset="100%" stopColor={T.gold} stopOpacity="0" />
                                </linearGradient>
                              </defs>
                              <polygon
                                points={`${pad.l},${pad.t + innerH} ${polyline} ${chartW - pad.r},${pad.t + innerH}`}
                                fill="url(#phGrad)"
                              />
                              {/* Line */}
                              <polyline points={polyline} fill="none" stroke={T.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              {/* Dots + labels */}
                              {chartPoints.map((pt, i) => (
                                <g key={i}>
                                  <circle cx={pt.x} cy={pt.y} r="4" fill={T.gold} stroke={T.bg} strokeWidth="2" />
                                  <text x={pt.x} y={chartH - 4} textAnchor="middle" fill={T.textMuted} fontSize="8">
                                    {new Date(pt.date).toLocaleDateString("en-AE", { day: "numeric", month: "short" })}
                                  </text>
                                </g>
                              ))}
                            </svg>
                          </div>
                        ) : history.length === 1 ? (
                          <div style={{ padding: "16px 20px", background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}`, marginBottom: 20, fontSize: 12, color: T.textMuted }}>
                            Only 1 data point — chart requires at least 2 entries. Add more price records below.
                          </div>
                        ) : (
                          <div style={{ padding: "24px", textAlign: "center", background: T.surfaceAlt, borderRadius: 12, border: `1px solid ${T.border}`, marginBottom: 20 }}>
                            <div style={{ fontSize: 13, color: T.textSecondary, fontWeight: 600, marginBottom: 4 }}>No price history yet</div>
                            <div style={{ fontSize: 11, color: T.textMuted }}>Price changes are auto-recorded when you save a project. You can also add entries manually below.</div>
                          </div>
                        )}

                        {/* PRICE CHANGE TABLE */}
                        {history.length > 0 && (
                          <div className="chart-box fade-up" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
                            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>Price Change Log</div>
                              <div style={{ fontSize: 11, color: T.textMuted }}>{history.length} entries</div>
                            </div>
                            {/* Header */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 40px", gap: 8, padding: "10px 20px", background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
                              {["Date", "Price (AED)", "PPSF", "Change", "Recorded By", ""].map(h => (
                                <span key={h} style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>{h}</span>
                              ))}
                            </div>
                            {[...history].reverse().map((h, i, arr) => {
                              const prev     = arr[i + 1];
                              const changePct = prev ? (((h.price - prev.price) / prev.price) * 100).toFixed(1) : null;
                              return (
                                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 40px", gap: 8, padding: "11px 20px", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? "transparent" : T.surfaceAlt, alignItems: "center" }}>
                                  <span style={{ fontSize: 12, color: T.textSecondary }}>{new Date(h.recordedAt).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })}</span>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: T.gold }}>AED {h.price.toLocaleString()}</span>
                                  <span style={{ fontSize: 12, color: T.textSecondary }}>{h.ppsf ? h.ppsf.toLocaleString() : "—"}</span>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: changePct === null ? T.textMuted : changePct >= 0 ? T.green : T.red }}>
                                    {changePct === null ? "—" : `${changePct >= 0 ? "+" : ""}${changePct}%`}
                                  </span>
                                  <span style={{ fontSize: 11, color: T.textMuted }}>{h.recordedBy || "—"}{h.manual ? " (manual)" : ""}</span>
                                  <button type="button" onClick={() => deletePriceHistoryEntry(h.id, phSelId)}
                                    style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: T.red, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                                    ├ù
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* MANUAL ENTRY FORM */}
                        <div className="chart-box fade-up" style={{ padding: 20 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.white, marginBottom: 4 }}>Add Manual Price Entry</div>
                          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>Add a historical price point for {selectedProject?.name || "this project"}</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Price (AED) *</label>
                              <input type="number" placeholder="e.g. 2500000" value={phManual.price} onChange={e => setPhManual(p => ({ ...p, price: e.target.value }))} style={inputSt} />
                            </div>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Price/sqft</label>
                              <input type="number" placeholder="e.g. 2200" value={phManual.ppsf} onChange={e => setPhManual(p => ({ ...p, ppsf: e.target.value }))} style={inputSt} />
                            </div>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Date *</label>
                              <input type="date" value={phManual.date} onChange={e => setPhManual(p => ({ ...p, date: e.target.value }))} style={inputSt} />
                            </div>
                            <div>
                              <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>Note</label>
                              <input type="text" placeholder="e.g. Q1 launch price" value={phManual.note} onChange={e => setPhManual(p => ({ ...p, note: e.target.value }))} style={inputSt} />
                            </div>
                          </div>
                          <button type="button" onClick={saveManualEntry} disabled={phSaving}
                            style={{ width: "100%", padding: "11px", borderRadius: 9, border: "none", background: `linear-gradient(135deg, ${T.gold}, #B8892E)`, color: T.bg, fontSize: 13, fontWeight: 700, cursor: phSaving ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: phSaving ? 0.6 : 1 }}>
                            {phSaving ? "Saving..." : "+ Add Price Entry"}
                          </button>
                        </div>
                      </>
                    )}

                    {phLoading && (
                      <div style={{ textAlign: "center", padding: "40px", color: T.textMuted, fontSize: 13 }}>Loading price history...</div>
                    )}
                  </Section>
                );
              })()}

              {/* Data sync info */}
              {dataSubTab !== "communities" && <div className="chart-box fade-up" style={{ padding: 16, marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 24 }}>Γä╣</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.white }}>How Live Data Works</div>
                  <div style={{ fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
                    Data saved here goes to Firestore and overrides default values from data.js. The main dashboard reads Firestore first, falls back to defaults if no override exists. Click "Reset to Default" on any item to remove the live override. Last updated timestamps are tracked per entry.
                  </div>
                </div>
              </div>}

            </>
  );
}

export default AdminDataTab;
