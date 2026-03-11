import React from "react";
import { T } from "../../../styles/theme";

/**
 * AdminDataTab — Full Data Manager tab
 *
 * Props:
 *   emaarProjects        — array of project objects
 *   emaarYields          — array of yield objects
 *   liveProjects         — Firestore override map { [id]: {...} }
 *   liveYields           — Firestore yield overrides
 *   liveCommunityROI     — Firestore community ROI overrides
 *   liveCommunityIntel   — Firestore community Intel overrides
 *   defaultCommunityROI  — default community ROI data
 *   defaultCommunityIntel— default community Intel data
 *   priceHistory         — { [projectId]: [{...}] }
 *   liveProjects         — all live Firestore project overrides
 *   dataSubTab, setDataSubTab
 *   editingProject, setEditingProject
 *   projectForm, setProjectForm
 *   editingCommunity, setEditingCommunity
 *   communityForm, setCommunityForm
 *   communityIntelForm, setCommunityIntelForm
 *   editingYield, setEditingYield
 *   yieldForm, setYieldForm
 *   dataSaving
 *   dataSearch, setDataSearch
 *   projectCommunityFilter, setProjectCommunityFilter
 *   projectStatusFilter, setProjectStatusFilter
 *   projectTierFilter, setProjectTierFilter
 *   projectSortKey, setProjectSortKey
 *   projectSortDir, setProjectSortDir
 *   priceMin, setPriceMin, priceMax, setPriceMax
 *   ppsfMin, setPpsfMin, ppsfMax, setPpsfMax
 *   dataSourceFilter, setDataSourceFilter
 *   modifiedDateFilter, setModifiedDateFilter
 *   hasImageFilter, setHasImageFilter
 *   qualityFilter, setQualityFilter
 *   stalenessFilter, setStalenessFilter
 *   showAdvancedFilters, setShowAdvancedFilters
 *   showColumnSettings, setShowColumnSettings
 *   visibleColumns, toggleColumn, resetColumns
 *   bulkSelected, setBulkSelected
 *   bulkForm, setBulkForm
 *   savedFilterViews, setSavedFilterViews
 *   activeFilterViewId, setActiveFilterViewId
 *   showSaveFilterModal, setShowSaveFilterModal
 *   newFilterViewName, setNewFilterViewName
 *   showDataQualityPanel, setShowDataQualityPanel
 *   showDataIntelPanel, setShowDataIntelPanel
 *   showDuplicatesModal, setShowDuplicatesModal
 *   viewingVersions, setViewingVersions
 *   projectVersions
 *   rollbackLoading
 *   bulkDeleteLoading
 *   showBulkDeleteConfirm, setShowBulkDeleteConfirm
 *   phSelId, setPhSelId
 *   phManual, setPhManual
 *   phLoading, phSaving
 *   importFile, setImportFile
 *   importHeaders, setImportHeaders
 *   importRows, setImportRows
 *   importMapping, setImportMapping
 *   importErrors, setImportErrors
 *   importStats
 *   importProgress
 *   importDragOver, setImportDragOver
 *   importSkipInvalid, setImportSkipInvalid
 *   showDataImport, setShowDataImport
 *   validationErrors, setValidationErrors
 *   IMPORT_FIELDS
 *   getMergedProject, calculateProjectQuality, calculateOverallQuality
 *   calculateDataIntel, calculateStaleness, findDuplicates
 *   validateImportRow
 *   saveProjectData, saveNewProject, deleteProject, resetProjectData
 *   saveYieldData, saveCombinedCommunity, resetCombinedCommunity
 *   saveBulkEdit, bulkDeleteProjects, rollbackToVersion
 *   fetchProjectVersions, fetchLiveData, exportProjectsExcel
 *   exportFilteredProjects, downloadImportTemplate
 *   handleImportFile, executeImport, resetImport
 *   saveManualEntry, deletePriceHistoryEntry, loadHistory
 *   notify, I, TabHelp, Section, HelpTip
 */
const AdminDataTab = ({
  emaarProjects, emaarYields, liveProjects, liveYields,
  liveCommunityROI, liveCommunityIntel, defaultCommunityROI, defaultCommunityIntel,
  priceHistory,
  dataSubTab, setDataSubTab,
  editingProject, setEditingProject,
  projectForm, setProjectForm,
  editingCommunity, setEditingCommunity,
  communityForm, setCommunityForm,
  communityIntelForm, setCommunityIntelForm,
  editingYield, setEditingYield,
  yieldForm, setYieldForm,
  dataSaving,
  dataSearch, setDataSearch,
  projectCommunityFilter, setProjectCommunityFilter,
  projectStatusFilter, setProjectStatusFilter,
  projectTierFilter, setProjectTierFilter,
  projectSortKey, setProjectSortKey,
  projectSortDir, setProjectSortDir,
  priceMin, setPriceMin, priceMax, setPriceMax,
  ppsfMin, setPpsfMin, ppsfMax, setPpsfMax,
  dataSourceFilter, setDataSourceFilter,
  modifiedDateFilter, setModifiedDateFilter,
  hasImageFilter, setHasImageFilter,
  qualityFilter, setQualityFilter,
  stalenessFilter, setStalenessFilter,
  showAdvancedFilters, setShowAdvancedFilters,
  showColumnSettings, setShowColumnSettings,
  visibleColumns, toggleColumn, resetColumns,
  bulkSelected, setBulkSelected,
  bulkForm, setBulkForm,
  savedFilterViews, setSavedFilterViews,
  activeFilterViewId, setActiveFilterViewId,
  showSaveFilterModal, setShowSaveFilterModal,
  newFilterViewName, setNewFilterViewName,
  showDataQualityPanel, setShowDataQualityPanel,
  showDataIntelPanel, setShowDataIntelPanel,
  showDuplicatesModal, setShowDuplicatesModal,
  viewingVersions, setViewingVersions,
  projectVersions, rollbackLoading,
  bulkDeleteLoading,
  showBulkDeleteConfirm, setShowBulkDeleteConfirm,
  phSelId, setPhSelId,
  phManual, setPhManual,
  phLoading, phSaving,
  importFile, setImportFile,
  importHeaders, setImportHeaders,
  importRows, setImportRows,
  importMapping, setImportMapping,
  importErrors, setImportErrors,
  importStats, importProgress,
  importDragOver, setImportDragOver,
  importSkipInvalid, setImportSkipInvalid,
  showDataImport, setShowDataImport,
  validationErrors, setValidationErrors,
  IMPORT_FIELDS,
  getMergedProject, calculateProjectQuality, calculateOverallQuality,
  calculateDataIntel, calculateStaleness, findDuplicates,
  validateImportRow,
  saveProjectData, saveNewProject, deleteProject, resetProjectData,
  saveYieldData, saveCombinedCommunity, resetCombinedCommunity,
  saveBulkEdit, bulkDeleteProjects, rollbackToVersion,
  fetchProjectVersions, fetchLiveData, exportProjectsExcel,
  exportFilteredProjects, downloadImportTemplate,
  handleImportFile, executeImport, resetImport,
  saveManualEntry, deletePriceHistoryEntry, loadHistory,
  notify, I, TabHelp, Section, HelpTip,
}) => {
  const inputSt = {
    width: "100%", padding: "10px 12px", background: T.bg,
    border: `1px solid ${T.border}`, borderRadius: 8,
    color: T.textPrimary, fontSize: 13, fontFamily: "'Outfit',sans-serif",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <>
      {/* ══════════════════════════════
         CSV IMPORT PRO MODAL
      ══════════════════════════════ */}
      {showDataImport && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
          onClick={() => importProgress.status !== "importing" && resetImport()}>
          <div style={{ background:T.surface, border:`1px solid ${T.gold}40`, borderRadius:20, width:"100%", maxWidth:900, maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column" }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding:"20px 24px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:"linear-gradient(135deg,rgba(212,168,67,0.08) 0%,transparent 60%)" }}>
              <div>
                <div style={{ fontSize:18, fontWeight:700, color:T.white, fontFamily:"'Fraunces',serif" }}>CSV Import Pro</div>
                <div style={{ fontSize:12, color:T.textMuted, marginTop:4 }}>Import project data with preview, mapping, and validation</div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button type="button" onClick={downloadImportTemplate}
                  style={{ fontSize:11, padding:"8px 14px", borderRadius:8, border:`1px solid ${T.teal}40`, background:`${T.teal}10`, color:T.teal, cursor:"pointer", fontWeight:600 }}>
                  Download Template
                </button>
                <button type="button" onClick={() => importProgress.status !== "importing" && resetImport()} disabled={importProgress.status === "importing"}
                  style={{ fontSize:16, width:32, height:32, borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, cursor:importProgress.status === "importing" ? "not-allowed" : "pointer" }}>×</button>
              </div>
            </div>

            {/* Content */}
            <div style={{ flex:1, overflow:"auto", padding:24 }}>
              {/* Drop Zone */}
              {!importFile && (
                <div onDragOver={e => { e.preventDefault(); setImportDragOver(true); }}
                  onDragLeave={() => setImportDragOver(false)}
                  onDrop={e => { e.preventDefault(); setImportDragOver(false); const f=e.dataTransfer.files[0]; if(f) handleImportFile(f); }}
                  style={{ border:`2px dashed ${importDragOver?T.gold:T.border}`, borderRadius:16, padding:"48px 24px", textAlign:"center", background:importDragOver?"rgba(212,168,67,0.08)":"transparent", transition:"all 0.2s", cursor:"pointer" }}
                  onClick={() => document.getElementById("csv-file-input")?.click()}>
                  <input id="csv-file-input" type="file" accept=".csv" style={{ display:"none" }} onChange={e => { const f=e.target.files?.[0]; if(f) handleImportFile(f); }} />
                  <div style={{ width:56, height:56, borderRadius:14, background:"rgba(212,168,67,0.1)", border:"1px solid rgba(212,168,67,0.2)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <div style={{ fontSize:15, fontWeight:600, color:T.white, marginBottom:8 }}>Drop CSV file here or click to browse</div>
                  <div style={{ fontSize:12, color:T.textMuted }}>Supports .csv files with header row. Max 1000 rows recommended.</div>
                </div>
              )}

              {importFile && importHeaders.length > 0 && (
                <>
                  {/* File Info */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", background:T.surfaceAlt, borderRadius:10, marginBottom:20 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div style={{ width:36, height:36, borderRadius:8, background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{importFile.name}</div>
                        <div style={{ fontSize:11, color:T.textMuted }}>{importRows.length} rows · {importHeaders.length} columns</div>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setImportFile(null); setImportHeaders([]); setImportRows([]); setImportMapping({}); setImportErrors([]); }}
                      style={{ fontSize:11, padding:"6px 12px", borderRadius:6, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, cursor:"pointer" }}>Change File</button>
                  </div>

                  {/* Stats */}
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                    {[["Total Rows",importRows.length,T.white],["Valid",importStats.valid,T.green],["Invalid",importStats.invalid,T.red],["Imported",importProgress.status==="done"?importStats.imported:"—",T.gold]].map(([label,val,color])=>(
                      <div key={label} style={{ padding:"12px 16px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
                        <div style={{ fontSize:20, fontWeight:800, color, fontFamily:"'Fraunces',serif" }}>{val}</div>
                        <div style={{ fontSize:10, color:T.textMuted, fontWeight:600, textTransform:"uppercase" }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Column Mapping */}
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
                      <span>Column Mapping</span>
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, background:`${T.gold}10`, color:T.gold }}>{Object.keys(importMapping).length} mapped</span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, padding:16, background:T.surfaceAlt, borderRadius:12, border:`1px solid ${T.border}` }}>
                      {importHeaders.map((header, idx) => (
                        <div key={idx} style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ flex:1, fontSize:11, color:T.textSecondary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{header}</div>
                          <span style={{ color:T.textMuted }}>→</span>
                          <select value={importMapping[idx]||""} onChange={e => setImportMapping(prev => ({ ...prev, [idx]:e.target.value||undefined }))}
                            style={{ flex:1, padding:"6px 8px", background:T.bg, border:`1px solid ${importMapping[idx]?"rgba(16,185,129,0.3)":T.border}`, borderRadius:6, color:importMapping[idx]?T.green:T.textMuted, fontSize:11, cursor:"pointer" }}>
                            <option value="">— Skip —</option>
                            {(IMPORT_FIELDS||[]).map(f => <option key={f.key} value={f.key}>{f.label}{f.required?" *":""}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:12 }}>Preview (first 5 rows)</div>
                    <div style={{ overflow:"auto", borderRadius:12, border:`1px solid ${T.border}` }}>
                      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                        <thead>
                          <tr style={{ background:T.surfaceAlt }}>
                            <th style={{ padding:"10px 12px", textAlign:"left", color:T.textMuted, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>#</th>
                            {importHeaders.slice(0,6).map((h,i) => (
                              <th key={i} style={{ padding:"10px 12px", textAlign:"left", color:importMapping[i]?T.gold:T.textMuted, fontWeight:600, borderBottom:`1px solid ${T.border}`, maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {importMapping[i] ? (IMPORT_FIELDS||[]).find(f=>f.key===importMapping[i])?.label : h}
                              </th>
                            ))}
                            {importHeaders.length>6 && <th style={{ padding:"10px 12px", textAlign:"center", color:T.textMuted, fontWeight:600, borderBottom:`1px solid ${T.border}` }}>+{importHeaders.length-6}</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.slice(0,5).map((row, rowIdx) => {
                            const result = validateImportRow ? validateImportRow(row, importMapping, importHeaders) : { errors:[] };
                            return (
                              <tr key={rowIdx} style={{ background:result.errors?.length?"rgba(239,68,68,0.04)":"transparent" }}>
                                <td style={{ padding:"8px 12px", color:T.textMuted, borderBottom:`1px solid ${T.border}` }}>{row._rowNum}</td>
                                {importHeaders.slice(0,6).map((h,colIdx) => (
                                  <td key={colIdx} style={{ padding:"8px 12px", color:T.textSecondary, borderBottom:`1px solid ${T.border}`, maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row[h]||"—"}</td>
                                ))}
                                {importHeaders.length>6 && <td style={{ padding:"8px 12px", textAlign:"center", color:T.textMuted, borderBottom:`1px solid ${T.border}` }}>...</td>}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Validation Errors */}
                  {importErrors.length > 0 && (
                    <div style={{ marginBottom:20 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.red, marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
                        <span>Validation Errors</span>
                        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, background:"rgba(239,68,68,0.1)", color:T.red }}>{importErrors.length} rows</span>
                      </div>
                      <div style={{ maxHeight:200, overflow:"auto", padding:16, background:"rgba(239,68,68,0.04)", borderRadius:12, border:"1px solid rgba(239,68,68,0.2)" }}>
                        {importErrors.slice(0,10).map((err,idx) => (
                          <div key={idx} style={{ padding:"8px 0", borderBottom:idx<importErrors.length-1?`1px solid ${T.border}`:"none" }}>
                            <div style={{ fontSize:11, fontWeight:600, color:T.white, marginBottom:4 }}>Row {err.rowNum}: {err.data?.name||err.data?.id||"Unknown"}</div>
                            <div style={{ fontSize:10, color:T.red }}>{err.errors?.join(" · ")}</div>
                          </div>
                        ))}
                        {importErrors.length>10 && <div style={{ fontSize:11, color:T.textMuted, paddingTop:8 }}>...and {importErrors.length-10} more errors</div>}
                      </div>
                    </div>
                  )}

                  {importErrors.length > 0 && (
                    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", background:T.surfaceAlt, borderRadius:10, marginBottom:20 }}>
                      <input type="checkbox" id="skip-invalid" checked={importSkipInvalid} onChange={e => setImportSkipInvalid(e.target.checked)} style={{ accentColor:T.gold, width:16, height:16 }} />
                      <label htmlFor="skip-invalid" style={{ fontSize:12, color:T.textSecondary, cursor:"pointer" }}>Skip invalid rows (import only valid data)</label>
                    </div>
                  )}

                  {importProgress.status === "importing" && (
                    <div style={{ marginBottom:20 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                        <span style={{ fontSize:12, color:T.textSecondary }}>Importing...</span>
                        <span style={{ fontSize:12, color:T.gold, fontWeight:600 }}>{importProgress.current} / {importProgress.total}</span>
                      </div>
                      <div style={{ height:6, background:T.surfaceAlt, borderRadius:3, overflow:"hidden" }}>
                        <div style={{ width:`${(importProgress.current/importProgress.total)*100}%`, height:"100%", background:`linear-gradient(90deg,${T.gold},${T.teal})`, borderRadius:3, transition:"width 0.2s" }} />
                      </div>
                    </div>
                  )}

                  {importProgress.status === "done" && (
                    <div style={{ padding:20, background:"rgba(16,185,129,0.08)", borderRadius:12, border:"1px solid rgba(16,185,129,0.2)", textAlign:"center", marginBottom:20 }}>
                      <div style={{ width:48, height:48, borderRadius:12, background:"rgba(16,185,129,0.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px" }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <div style={{ fontSize:16, fontWeight:700, color:T.green, marginBottom:4 }}>Import Complete!</div>
                      <div style={{ fontSize:12, color:T.textSecondary }}>{importStats.imported} projects imported, {importStats.skipped} skipped</div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding:"16px 24px", borderTop:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:T.surfaceAlt }}>
              <div style={{ fontSize:11, color:T.textMuted }}>
                {importProgress.status==="done" ? "Import finished — data is now live" : importFile ? `${importStats.valid} rows ready` : "Upload a CSV file to begin"}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button type="button" onClick={resetImport} disabled={importProgress.status==="importing"}
                  style={{ fontSize:12, padding:"10px 20px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textSecondary, cursor:importProgress.status==="importing"?"not-allowed":"pointer", fontWeight:600 }}>
                  {importProgress.status==="done" ? "Close" : "Cancel"}
                </button>
                {importFile && importProgress.status !== "done" && (
                  <button type="button" onClick={executeImport} disabled={importProgress.status==="importing"||(importStats.valid===0&&importSkipInvalid)}
                    style={{ fontSize:12, padding:"10px 24px", borderRadius:8, border:"none", background:(importProgress.status==="importing"||(importStats.valid===0&&importSkipInvalid))?T.border:`linear-gradient(135deg,${T.gold},#B8860B)`, color:(importProgress.status==="importing"||(importStats.valid===0&&importSkipInvalid))?T.textMuted:"#000", cursor:(importProgress.status==="importing"||(importStats.valid===0&&importSkipInvalid))?"not-allowed":"pointer", fontWeight:700 }}>
                    {importProgress.status==="importing" ? "Importing..." : `Import ${importSkipInvalid?importStats.valid:importRows.length} Projects`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════
         SECTION HEADER
      ══════════════════════════════ */}
      <div style={{ marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <div style={{ width:4, height:28, background:T.gold, borderRadius:2 }} />
          {I.data}
          <h1 style={{ fontSize:24, fontWeight:700, color:T.white, fontFamily:"'Outfit',sans-serif" }}>Data Manager</h1>
        </div>
        <p style={{ fontSize:13, color:T.textMuted, marginLeft:16 }}>Manage all project data, yields, communities, and price history</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        {[
          { label:"Total Projects", value:emaarProjects.length, color:T.gold, sub:"Emaar projects" },
          { label:"Communities", value:Object.keys(defaultCommunityROI||{}).length, color:T.teal, sub:"ROI entries" },
          { label:"Avg Yield", value:`${(emaarYields.reduce((s,y)=>s+(y.gross||0),0)/(emaarYields.length||1)).toFixed(1)}%`, color:T.green, sub:"portfolio average" },
          { label:"Live Overrides", value:Object.keys(liveProjects||{}).length, color:T.blue, sub:"Firestore updates" },
        ].map((k,i) => (
          <div key={k.label} className="kpi-card fade-up" style={{ position:"relative", overflow:"hidden", animationDelay:`${i*0.05}s` }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:k.color, opacity:0.7 }} />
            <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1.2, textTransform:"uppercase", marginBottom:10 }}>{k.label}</div>
            <div style={{ fontFamily:"'Fraunces',serif", fontSize:28, fontWeight:900, color:k.color }}>{k.value}</div>
            <div style={{ fontSize:11, color:T.textMuted, marginTop:6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Data Health */}
      <div className="fade-up" style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:"16px 20px", marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:12, fontWeight:700, color:T.gold, letterSpacing:0.5 }}>Data Health Check</div>
          <div style={{ display:"flex", gap:8 }}>
            {(() => {
              const issues = [];
              const missingPrice = emaarProjects.filter(p => !p.price||p.price<=0).length;
              const missingImage = emaarProjects.filter(p => !p.image&&!liveProjects?.[p.id]?.image).length;
              const outdatedYields = emaarYields.filter(y => !y.gross||y.gross<=0).length;
              if (missingPrice > 0) issues.push({ label:`${missingPrice} missing prices`, color:T.red });
              if (missingImage > 0) issues.push({ label:`${missingImage} no images`, color:T.textMuted });
              if (outdatedYields > 0) issues.push({ label:`${outdatedYields} yields need update`, color:T.orange });
              if (!issues.length) return <span style={{ fontSize:11, color:T.green, fontWeight:600 }}>✓ All data complete</span>;
              return issues.map((issue,i) => <span key={i} style={{ fontSize:10, padding:"3px 10px", borderRadius:6, background:`${issue.color}15`, color:issue.color, fontWeight:600 }}>{issue.label}</span>);
            })()}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
          {[
            { label:"Projects", value:emaarProjects.length, color:T.gold, complete:emaarProjects.filter(p=>p.price&&(p.image||liveProjects?.[p.id]?.image)).length },
            { label:"Yields", value:emaarYields.length, color:T.green, complete:emaarYields.filter(y=>y.gross&&y.gross>0).length },
            { label:"Communities", value:Object.keys(defaultCommunityROI||{}).length, color:T.teal },
            { label:"Live Overrides", value:Object.keys(liveProjects||{}).length, color:T.blue },
            { label:"Price History", value:Object.values(priceHistory||{}).reduce((s,a)=>s+(a?.length||0),0), color:T.purple },
          ].map((item,i) => (
            <div key={i} style={{ textAlign:"center", padding:"8px 10px", background:T.surfaceAlt, borderRadius:8, border:`1px solid ${T.border}` }}>
              <div style={{ fontSize:18, fontWeight:800, color:item.color, fontFamily:"'Fraunces',serif" }}>{item.value}</div>
              <div style={{ fontSize:9, color:T.textMuted, fontWeight:600, textTransform:"uppercase" }}>{item.label}</div>
              {item.complete !== undefined && <div style={{ fontSize:9, color:item.complete===item.value?T.green:T.orange, marginTop:2 }}>{item.value>0?Math.round((item.complete/item.value)*100):0}% complete</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div style={{ display:"flex", gap:4, background:T.surfaceAlt, padding:4, borderRadius:10, marginBottom:24 }}>
        {[
          { id:"projects", label:"Projects", count:emaarProjects.length },
          { id:"yields",   label:"Yields",   count:emaarYields.length },
          { id:"communities", label:"Communities", count:Object.keys(defaultCommunityROI||{}).length },
          { id:"pricehistory", label:"Price History", count:Object.values(priceHistory||{}).reduce((s,a)=>s+(a?.length||0),0) },
        ].map(st => (
          <button type="button" key={st.id}
            onClick={() => { if(dataSubTab===st.id) return; setDataSubTab(st.id); setEditingProject(null); setEditingCommunity(null); setEditingYield(null); }}
            style={{ padding:"10px 20px", borderRadius:8, border:"none", background:dataSubTab===st.id?T.surface:"transparent", color:dataSubTab===st.id?T.white:T.textMuted, fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", gap:8 }}>
            {st.label}
            <span style={{ background:dataSubTab===st.id?T.gold:T.border, color:dataSubTab===st.id?T.surface:T.textMuted, padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:700 }}>{st.count}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════
         PROJECTS EDITOR
      ══════════════════════════════ */}
      {dataSubTab === "projects" && (
        <Section title="Project Data Manager" sub="Edit prices, PPSF, status — changes go live instantly" action={
          <div style={{ display:"flex", gap:8 }}>
            <button type="button" onClick={exportProjectsExcel} style={{ fontSize:11, padding:"7px 14px", borderRadius:8, border:`1px solid rgba(100,116,139,0.3)`, background:"transparent", color:T.textSecondary, cursor:"pointer", fontWeight:600 }}>Export</button>
            <button type="button" onClick={() => setShowDataImport(true)} style={{ fontSize:11, padding:"7px 14px", borderRadius:8, border:`1px solid ${T.teal}40`, background:`${T.teal}08`, color:T.teal, cursor:"pointer", fontWeight:600 }}>
              ↑ Import CSV
            </button>
            <button type="button" onClick={() => { setEditingProject("new"); setProjectForm({}); }} style={{ fontSize:11, padding:"7px 14px", borderRadius:8, border:`1px solid rgba(16,185,129,0.4)`, background:`rgba(16,185,129,0.08)`, color:T.green, cursor:"pointer", fontWeight:600 }}>+ Add Project</button>
            <button type="button" onClick={fetchLiveData} style={{ fontSize:11, padding:"7px 14px", borderRadius:8, border:`1px solid ${T.gold}40`, background:`${T.gold}08`, color:T.gold, cursor:"pointer", fontWeight:600 }}>{I.refresh} Refresh</button>
          </div>
        }>
          {TabHelp && <TabHelp items={[
            { icon:"[q]", title:"Data Quality Score", desc:"Each project gets a 0-100 score. Click the panel to see field breakdown." },
            { icon:"[📊]", title:"Data Intelligence", desc:"Track recent changes, find stale data, detect duplicates." },
            { icon:"[f]", title:"Advanced Filters", desc:"Filter by price, PPSF, tier, quality, staleness and more." },
            { icon:"[b]", title:"Bulk Actions", desc:"Select multiple projects with checkboxes. Export, update, or delete in bulk." },
          ]} />}

          {/* Quick Filter Pills */}
          <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
            <span style={{ fontSize:10, color:T.textMuted, fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 }}>Quick Filters:</span>
            {(savedFilterViews||[]).map(view => (
              <div key={view.id} style={{ position:"relative", display:"inline-flex" }}>
                <button type="button"
                  onClick={() => {
                    if (activeFilterViewId === view.id) {
                      setActiveFilterViewId(null);
                      setProjectCommunityFilter("All"); setProjectStatusFilter("All"); setProjectTierFilter("All");
                      setPriceMin(""); setPriceMax(""); setPpsfMin(""); setPpsfMax("");
                      setDataSourceFilter("all"); setModifiedDateFilter("all"); setHasImageFilter("all");
                    } else {
                      setActiveFilterViewId(view.id);
                      const f = view.filters;
                      if (f.community) setProjectCommunityFilter(f.community);
                      if (f.status) setProjectStatusFilter(f.status);
                      if (f.tier) setProjectTierFilter(f.tier);
                      if (f.priceMin !== undefined) setPriceMin(f.priceMin);
                      if (f.priceMax !== undefined) setPriceMax(f.priceMax);
                      if (f.dataSource) setDataSourceFilter(f.dataSource);
                    }
                  }}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:"20px 4px 4px 20px", border:`1px solid ${activeFilterViewId===view.id?view.color:T.border}`, borderRight:"none", background:activeFilterViewId===view.id?`${view.color}15`:"transparent", color:activeFilterViewId===view.id?view.color:T.textSecondary, fontSize:11, fontWeight:activeFilterViewId===view.id?700:500, cursor:"pointer" }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:view.color }} />
                  {view.name}
                </button>
                <button type="button" onClick={e => { e.stopPropagation(); const updated=(savedFilterViews||[]).filter(v=>v.id!==view.id); setSavedFilterViews(updated); if(activeFilterViewId===view.id) setActiveFilterViewId(null); notify("Filter view deleted"); }}
                  style={{ padding:"6px 8px", borderRadius:"0 20px 20px 0", border:`1px solid ${activeFilterViewId===view.id?view.color:T.border}`, borderLeft:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, fontSize:10, cursor:"pointer" }}>×</button>
              </div>
            ))}
            <button type="button" onClick={() => setShowSaveFilterModal(true)}
              style={{ padding:"6px 10px", borderRadius:20, border:`1px dashed ${T.border}`, background:"transparent", color:T.textMuted, fontSize:11, cursor:"pointer" }}>+ Save Current</button>
          </div>

          {/* Main Filter Bar */}
          <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap", alignItems:"center", padding:"10px 16px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
            <div style={{ position:"relative", flex:"1 1 200px", minWidth:160 }}>
              <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:T.textMuted, fontSize:13, pointerEvents:"none" }}>⌕</span>
              <input value={dataSearch} onChange={e => { setDataSearch(e.target.value); setActiveFilterViewId(null); }} placeholder="Search projects..."
                style={{ width:"100%", padding:"8px 10px 8px 28px", background:T.surface, border:`1px solid ${dataSearch?T.gold:T.border}`, borderRadius:8, color:T.white, fontSize:12, outline:"none", boxSizing:"border-box" }} />
            </div>
            <select value={projectCommunityFilter} onChange={e => { setProjectCommunityFilter(e.target.value); setActiveFilterViewId(null); }}
              style={{ padding:"8px 10px", background:projectCommunityFilter!=="All"?`${T.gold}15`:T.surface, border:`1px solid ${projectCommunityFilter!=="All"?T.gold:T.border}`, borderRadius:8, color:projectCommunityFilter!=="All"?T.gold:T.textSecondary, fontSize:12, cursor:"pointer", maxWidth:180 }}>
              <option value="All">All Communities</option>
              {[...new Set((emaarProjects||[]).map(p=>p.community))].sort().map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            <select value={projectStatusFilter} onChange={e => { setProjectStatusFilter(e.target.value); setActiveFilterViewId(null); }}
              style={{ padding:"8px 10px", background:projectStatusFilter!=="All"?`${T.gold}15`:T.surface, border:`1px solid ${projectStatusFilter!=="All"?T.gold:T.border}`, borderRadius:8, color:projectStatusFilter!=="All"?T.gold:T.textSecondary, fontSize:12, cursor:"pointer" }}>
              <option value="All">All Status</option>
              {["Under Construction","Off-Plan","Completed","Selling","Upcoming","Sold Out","Ready"].map(s=><option key={s} value={s}>{s}</option>)}
            </select>
            <select value={`${projectSortKey}_${projectSortDir}`} onChange={e => { const [k,d]=e.target.value.split("_"); setProjectSortKey(k); setProjectSortDir(d); }}
              style={{ padding:"8px 10px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, color:T.textSecondary, fontSize:12, cursor:"pointer" }}>
              <option value="name_asc">Name A→Z</option>
              <option value="name_desc">Name Z→A</option>
              <option value="price_asc">Price Low→High</option>
              <option value="price_desc">Price High→Low</option>
              <option value="ppsf_desc">PPSF High→Low</option>
              <option value="community_asc">Community A→Z</option>
            </select>
            <button type="button" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"8px 12px", borderRadius:8, border:`1px solid ${showAdvancedFilters?T.teal:T.border}`, background:showAdvancedFilters?`${T.teal}15`:"transparent", color:showAdvancedFilters?T.teal:T.textMuted, fontSize:11, fontWeight:600, cursor:"pointer" }}>
              ▽ Filters
            </button>
            {(dataSearch||projectCommunityFilter!=="All"||projectStatusFilter!=="All"||priceMin||priceMax||projectTierFilter!=="All"||dataSourceFilter!=="all") && (
              <button type="button" onClick={() => { setDataSearch(""); setProjectCommunityFilter("All"); setProjectStatusFilter("All"); setPriceMin(""); setPriceMax(""); setPpsfMin(""); setPpsfMax(""); setProjectTierFilter("All"); setDataSourceFilter("all"); setModifiedDateFilter("all"); setHasImageFilter("all"); setQualityFilter("all"); setStalenessFilter("all"); setActiveFilterViewId(null); }}
                style={{ padding:"8px 12px", background:`rgba(239,68,68,0.08)`, border:"1px solid rgba(239,68,68,0.25)", borderRadius:8, color:T.red, fontSize:11, cursor:"pointer", fontWeight:700 }}>
                ✕ Clear All
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="fade-up" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, padding:16, marginBottom:16, background:T.surface, borderRadius:12, border:`1px solid ${T.teal}30` }}>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.5, textTransform:"uppercase", marginBottom:6, display:"block" }}>Price Range (AED)</label>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="Min" style={{ flex:1, padding:"7px 10px", background:T.bg, border:`1px solid ${priceMin?T.teal:T.border}`, borderRadius:6, color:T.white, fontSize:11, outline:"none" }} />
                  <span style={{ color:T.textMuted, fontSize:11 }}>—</span>
                  <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="Max" style={{ flex:1, padding:"7px 10px", background:T.bg, border:`1px solid ${priceMax?T.teal:T.border}`, borderRadius:6, color:T.white, fontSize:11, outline:"none" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.5, textTransform:"uppercase", marginBottom:6, display:"block" }}>PPSF Range</label>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <input type="number" value={ppsfMin} onChange={e => setPpsfMin(e.target.value)} placeholder="Min" style={{ flex:1, padding:"7px 10px", background:T.bg, border:`1px solid ${ppsfMin?T.teal:T.border}`, borderRadius:6, color:T.white, fontSize:11, outline:"none" }} />
                  <span style={{ color:T.textMuted, fontSize:11 }}>—</span>
                  <input type="number" value={ppsfMax} onChange={e => setPpsfMax(e.target.value)} placeholder="Max" style={{ flex:1, padding:"7px 10px", background:T.bg, border:`1px solid ${ppsfMax?T.teal:T.border}`, borderRadius:6, color:T.white, fontSize:11, outline:"none" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.5, textTransform:"uppercase", marginBottom:6, display:"block" }}>Tier</label>
                <select value={projectTierFilter} onChange={e => setProjectTierFilter(e.target.value)}
                  style={{ width:"100%", padding:"7px 10px", background:T.bg, border:`1px solid ${projectTierFilter!=="All"?T.teal:T.border}`, borderRadius:6, color:projectTierFilter!=="All"?T.teal:T.textSecondary, fontSize:11, cursor:"pointer" }}>
                  <option value="All">All Tiers</option>
                  {["Affordable","Mid-Market","Mid-Premium","Premium","Luxury","Ultra-Luxury","Luxury Branded","Ultra-Lux Branded"].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.5, textTransform:"uppercase", marginBottom:6, display:"block" }}>Data Source</label>
                <select value={dataSourceFilter} onChange={e => setDataSourceFilter(e.target.value)}
                  style={{ width:"100%", padding:"7px 10px", background:T.bg, border:`1px solid ${dataSourceFilter!=="all"?T.teal:T.border}`, borderRadius:6, color:dataSourceFilter!=="all"?T.teal:T.textSecondary, fontSize:11, cursor:"pointer" }}>
                  <option value="all">All Sources</option>
                  <option value="live">Live Overrides Only</option>
                  <option value="default">Default Data Only</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.5, textTransform:"uppercase", marginBottom:6, display:"block" }}>Has Image</label>
                <select value={hasImageFilter} onChange={e => setHasImageFilter(e.target.value)}
                  style={{ width:"100%", padding:"7px 10px", background:T.bg, border:`1px solid ${hasImageFilter!=="all"?T.teal:T.border}`, borderRadius:6, color:hasImageFilter!=="all"?T.teal:T.textSecondary, fontSize:11, cursor:"pointer" }}>
                  <option value="all">Any</option>
                  <option value="yes">With Image</option>
                  <option value="no">Missing Image</option>
                </select>
              </div>
              <div style={{ gridColumn:"span 2", display:"flex", gap:8, alignItems:"flex-end" }}>
                {[["Missing Prices",()=>{setPriceMax("0"); setPriceMin("");},"red"],["Missing Images",()=>setHasImageFilter("no"),"orange"],["Live Overrides",()=>setDataSourceFilter("live"),"green"],["Recent Changes",()=>setModifiedDateFilter("7d"),"blue"]].map(([label,action,color])=>(
                  <button key={label} type="button" onClick={action}
                    style={{ padding:"7px 12px", borderRadius:6, border:`1px solid ${T[color]}40`, background:`${T[color]}10`, color:T[color], fontSize:10, fontWeight:600, cursor:"pointer" }}>{label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Data Quality Panel */}
          {calculateOverallQuality && (() => {
            const quality = calculateOverallQuality();
            if (!quality) return null;
            return (
              <div style={{ marginBottom:16 }}>
                <div onClick={() => setShowDataQualityPanel(!showDataQualityPanel)}
                  style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderRadius:showDataQualityPanel?"10px 10px 0 0":10, background:T.surfaceAlt, border:`1px solid ${T.border}`, cursor:"pointer" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                    <div style={{ width:42, height:42, borderRadius:10, background:`${quality.color}15`, display:"flex", alignItems:"center", justifyContent:"center", border:`2px solid ${quality.color}` }}>
                      <span style={{ fontSize:16, fontWeight:800, color:quality.color, fontFamily:"'Fraunces',serif" }}>{quality.avgScore}</span>
                    </div>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:T.white }}>Data Quality Score</div>
                      <div style={{ fontSize:10, color:quality.color, fontWeight:600 }}>{quality.grade}</div>
                    </div>
                    <div style={{ display:"flex", gap:16, marginLeft:16 }}>
                      {[["Excellent",quality.grades?.excellent,T.green],["Good",quality.grades?.good,T.blue],["Fair",quality.grades?.fair,T.orange],["Poor",quality.grades?.poor,T.red]].map(([label,val,color])=>(
                        <div key={label} style={{ textAlign:"center" }}>
                          <div style={{ fontSize:14, fontWeight:700, color }}>{val}</div>
                          <div style={{ fontSize:9, color:T.textMuted }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" style={{ transform:showDataQualityPanel?"rotate(180deg)":"rotate(0)", transition:"transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                {showDataQualityPanel && (
                  <div className="fade-up" style={{ padding:16, background:T.surface, borderRadius:"0 0 10px 10px", border:`1px solid ${T.border}`, borderTop:"none" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, marginBottom:12, textTransform:"uppercase", letterSpacing:0.5 }}>Field Completion Rates</div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                      {[["Price",quality.fieldRates?.price,25],["Status",quality.fieldRates?.status,15],["PPSF",quality.fieldRates?.ppsf,15],["Image",quality.fieldRates?.image,15],["Handover",quality.fieldRates?.handover,10],["Tier",quality.fieldRates?.tier,8],["Beds",quality.fieldRates?.beds,6],["Type",quality.fieldRates?.type,6]].map(([name,rate,weight])=>{
                        const r = rate||0;
                        const barColor = r>=90?T.green:r>=70?T.blue:r>=50?T.orange:T.red;
                        return (
                          <div key={name} style={{ padding:10, background:T.surfaceAlt, borderRadius:8 }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                              <span style={{ fontSize:11, color:T.white, fontWeight:600 }}>{name}</span>
                              <span style={{ fontSize:10, color:barColor, fontWeight:700 }}>{r}%</span>
                            </div>
                            <div style={{ height:4, background:T.border, borderRadius:2, overflow:"hidden" }}>
                              <div style={{ width:`${r}%`, height:"100%", background:barColor, borderRadius:2, transition:"width 0.3s" }} />
                            </div>
                            <div style={{ fontSize:9, color:T.textMuted, marginTop:4 }}>Weight: {weight}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Save Filter Modal */}
          {showSaveFilterModal && (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setShowSaveFilterModal(false)}>
              <div style={{ background:T.surface, borderRadius:16, padding:24, width:360, border:`1px solid ${T.border}` }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize:16, fontWeight:700, color:T.white, marginBottom:16 }}>Save Current Filters</div>
                <input value={newFilterViewName} onChange={e => setNewFilterViewName(e.target.value)} placeholder="Filter view name..."
                  style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontSize:13, marginBottom:16, outline:"none", boxSizing:"border-box" }} />
                <div style={{ display:"flex", gap:10 }}>
                  <button type="button" onClick={() => setShowSaveFilterModal(false)}
                    style={{ flex:1, padding:"10px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textSecondary, fontSize:12, cursor:"pointer" }}>Cancel</button>
                  <button type="button" onClick={() => {
                    if (!newFilterViewName?.trim()) { notify("Enter a name"); return; }
                    const newView = { id:Date.now(), name:newFilterViewName.trim(), filters:{ community:projectCommunityFilter, status:projectStatusFilter, tier:projectTierFilter, priceMin, priceMax, ppsfMin, ppsfMax, dataSource:dataSourceFilter, modifiedDate:modifiedDateFilter, hasImage:hasImageFilter }, color:["#D4A843","#10B981","#3B82F6","#8B5CF6","#F97316","#EF4444"][Math.floor(Math.random()*6)] };
                    setSavedFilterViews([...(savedFilterViews||[]),newView]);
                    setNewFilterViewName(""); setShowSaveFilterModal(false); notify("Filter view saved!");
                  }} style={{ flex:1, padding:"10px", borderRadius:8, border:"none", background:T.gold, color:T.bg, fontSize:12, fontWeight:700, cursor:"pointer" }}>Save View</button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Selection Bar */}
          {bulkSelected.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderRadius:10, marginBottom:16, background:`${T.gold}15`, border:`1px solid ${T.gold}30` }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ fontWeight:700, color:T.gold, fontSize:14 }}>{bulkSelected.length} selected</span>
                <button type="button" onClick={() => setBulkSelected([])} style={{ padding:"4px 10px", borderRadius:4, border:`1px solid ${T.gold}50`, background:"transparent", color:T.gold, fontSize:11, cursor:"pointer" }}>Clear</button>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button type="button" onClick={() => exportFilteredProjects && exportFilteredProjects((emaarProjects||[]).filter(p=>bulkSelected.includes(String(p.id))), `emaar-selected-${bulkSelected.length}-projects.csv`)}
                  style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${T.teal}`, background:"transparent", color:T.teal, fontSize:12, fontWeight:600, cursor:"pointer" }}>Export</button>
                <button type="button" onClick={() => setShowBulkDeleteConfirm(true)}
                  style={{ padding:"8px 14px", borderRadius:8, border:`1px solid ${T.red}`, background:`${T.red}15`, color:T.red, fontSize:12, fontWeight:600, cursor:"pointer" }}>Delete</button>
              </div>
            </div>
          )}

          {/* Bulk Delete Confirm */}
          {showBulkDeleteConfirm && (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setShowBulkDeleteConfirm(false)}>
              <div className="fade-up" style={{ background:T.surface, borderRadius:16, padding:28, width:420, border:`1px solid ${T.red}40` }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize:18, fontWeight:700, color:T.white, marginBottom:16 }}>Delete {bulkSelected.length} Projects?</div>
                <div style={{ padding:14, background:T.surfaceAlt, borderRadius:10, marginBottom:20, fontSize:12, color:T.textSecondary }}>
                  Only Firestore overrides will be deleted. Default data.js entries cannot be removed.
                </div>
                <div style={{ display:"flex", gap:12 }}>
                  <button type="button" onClick={() => setShowBulkDeleteConfirm(false)}
                    style={{ flex:1, padding:"12px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textSecondary, fontSize:13, cursor:"pointer", fontWeight:600 }}>Cancel</button>
                  <button type="button" onClick={bulkDeleteProjects} disabled={bulkDeleteLoading}
                    style={{ flex:1, padding:"12px", borderRadius:8, border:"none", background:T.red, color:"#fff", fontSize:13, cursor:bulkDeleteLoading?"wait":"pointer", fontWeight:700, opacity:bulkDeleteLoading?0.7:1 }}>
                    {bulkDeleteLoading ? "Deleting..." : "Yes, Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add New Project Form */}
          {editingProject === "new" && (
            <div className="chart-box fade-up" style={{ padding:24, marginBottom:20, border:"1px solid rgba(16,185,129,0.3)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700, color:T.green }}>+ Add New Project</h3>
                <button type="button" onClick={() => setEditingProject(null)} style={{ fontSize:11, padding:"6px 14px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textSecondary, cursor:"pointer" }}>Cancel</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                {[["name","Project Name","e.g. Golf Heights"],["community","Community","e.g. Dubai Hills Estate"],["price","Price (AED)","e.g. 2500000"],["ppsf","Price/sqft","e.g. 2200"],["handover","Handover","e.g. Q4 2027"],["beds","Bedrooms","e.g. 1-3 BR"],["paymentPlan","Payment Plan","e.g. 80/20"],["type","Type","e.g. Apartments"],["status","Status","e.g. Off-Plan"],["tier","Tier","e.g. Mid-Premium"],["construction","Construction %","e.g. 0"],["emaarUrl","Source URL","e.g. https://..."]].map(([key,label,ph]) => (
                  <div key={key}>
                    <label style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:4, display:"block" }}>{label}</label>
                    <input type="text" placeholder={ph} value={projectForm[key]||""} onChange={e => setProjectForm(prev => ({ ...prev, [key]:e.target.value }))}
                      style={inputSt} />
                  </div>
                ))}
              </div>
              {projectForm.name && (emaarProjects||[]).some(p => p.name?.toLowerCase()===projectForm.name?.toLowerCase()) && (
                <div style={{ marginTop:10, padding:"10px 14px", borderRadius:8, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", fontSize:11, color:T.red }}>
                  Warning: A project named "{projectForm.name}" already exists.
                </div>
              )}
              <button type="button" disabled={dataSaving} onClick={() => saveNewProject(projectForm)}
                style={{ marginTop:16, width:"100%", padding:"12px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#10B981,#059669)", color:"#FFFFFF", fontSize:14, fontWeight:700, cursor:dataSaving?"wait":"pointer", opacity:dataSaving?0.6:1 }}>
                {dataSaving ? "Saving..." : "+ Add Project to Firestore"}
              </button>
            </div>
          )}

          {/* Edit Project Form */}
          {editingProject && editingProject !== "new" && (() => {
            const p = (emaarProjects||[]).find(x => x.id === editingProject);
            if (!p) return null;
            const merged = getMergedProject(p);
            const hasOverride = !!(liveProjects||{})[p.id];
            const fields = [
              { key:"price", label:"Price (AED)", type:"number", tip:"Starting price in AED. Appears on project card." },
              { key:"ppsf", label:"Price/sqft (AED)", type:"number", tip:"Price per square foot used in yield calculations." },
              { key:"sizeFrom", label:"Size From (sqft)", type:"number", tip:"Minimum unit size in sqft." },
              { key:"sizeTo", label:"Size To (sqft)", type:"number", tip:"Maximum unit size in sqft." },
              { key:"status", label:"Status", type:"select", options:["Under Construction","Off-Plan","Completed","Selling","Upcoming","Sold Out","Ready"] },
              { key:"handover", label:"Handover", type:"text" },
              { key:"type", label:"Type", type:"select", options:["Apartments","Apts & TH","Apts & Villas","Townhouses","Villas","Branded Res."] },
              { key:"beds", label:"Bedrooms", type:"text" },
              { key:"paymentPlan", label:"Payment Plan", type:"text" },
              { key:"construction", label:"Construction %", type:"number" },
              { key:"tier", label:"Tier", type:"select", options:["Affordable","Mid-Market","Mid-Premium","Premium","Luxury","Ultra-Luxury","Luxury Branded","Ultra-Lux Branded"] },
              { key:"emaarUrl", label:"Source URL", type:"text" },
              { key:"availability", label:"Availability", type:"select", options:["Available","Sold Out","Limited Units","Coming Soon"] },
              { key:"notes", label:"Admin Notes", type:"text" },
            ];
            return (
              <div className="chart-box fade-up" style={{ padding:24, marginBottom:20, border:`1px solid ${T.gold}30` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div>
                    <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700, color:T.white }}>{merged.name||p.name}</h3>
                    <span style={{ fontSize:12, color:T.textMuted }}>{p.community} · ID: {p.id}</span>
                    {hasOverride && <span style={{ marginLeft:8, fontSize:10, padding:"2px 8px", borderRadius:6, background:"rgba(16,185,129,0.12)", color:T.green, fontWeight:600 }}>LIVE DATA</span>}
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    <button type="button" onClick={() => { setViewingVersions(String(p.id)); fetchProjectVersions(p.id); }} style={{ fontSize:11, padding:"6px 14px", borderRadius:8, border:`1px solid ${T.gold}30`, background:`${T.gold}06`, color:T.gold, cursor:"pointer", fontWeight:600 }}>Version History</button>
                    <button type="button" onClick={() => deleteProject(p.id)} style={{ fontSize:11, padding:"6px 14px", borderRadius:8, border:`1px solid rgba(239,68,68,0.3)`, background:"rgba(239,68,68,0.06)", color:T.red, cursor:"pointer", fontWeight:600 }}>Delete</button>
                    {hasOverride && <button type="button" onClick={() => resetProjectData(p.id)} style={{ fontSize:11, padding:"6px 14px", borderRadius:8, border:`1px solid rgba(239,68,68,0.3)`, background:"rgba(239,68,68,0.06)", color:T.red, cursor:"pointer", fontWeight:600 }}>Reset</button>}
                    <button type="button" onClick={() => setEditingProject(null)} style={{ fontSize:11, padding:"6px 14px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textSecondary, cursor:"pointer" }}>Cancel</button>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                  {fields.map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:4, display:"flex", alignItems:"center" }}>
                        {f.label}{f.tip && HelpTip && <HelpTip text={f.tip} />}
                      </label>
                      {f.type === "select" ? (
                        <select value={projectForm[f.key]??merged[f.key]??""} onChange={e => setProjectForm(prev => ({ ...prev, [f.key]:e.target.value }))}
                          style={inputSt}>
                          <option value="">—</option>
                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type={f.type||"text"} value={projectForm[f.key]??merged[f.key]??""} onChange={e => setProjectForm(prev => ({ ...prev, [f.key]:e.target.value }))} placeholder={`e.g. ${merged[f.key]||""}`}
                          style={{ ...inputSt, border:`1px solid ${validationErrors?.[f.key]?T.red:T.border}` }} />
                      )}
                      {validationErrors?.[f.key] && <div style={{ fontSize:10, color:T.red, marginTop:3 }}>{validationErrors[f.key]}</div>}
                      {hasOverride && (liveProjects||{})[p.id]?.[f.key] !== undefined && (
                        <div style={{ fontSize:9, color:T.green, marginTop:2 }}>Live: {(liveProjects||{})[p.id][f.key]} · Default: {p[f.key]??"—"}</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Image Upload */}
                <div style={{ marginTop:16, padding:16, borderRadius:10, border:"1px solid rgba(212,168,67,0.12)", background:T.surfaceAlt }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Project Image</div>
                  {(projectForm.imageUrl || (liveProjects||{})[p.id]?.imageUrl) && (
                    <img src={projectForm.imageUrl||(liveProjects||{})[p.id]?.imageUrl} alt="Project" style={{ width:"100%", height:140, objectFit:"cover", borderRadius:8, marginBottom:10 }} onError={e => e.target.style.display="none"} />
                  )}
                  <div style={{ marginTop:10 }}>
                    <label style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:4, display:"block" }}>Image URL</label>
                    <input type="url" placeholder="https://..." value={projectForm.imageUrl??(liveProjects||{})[p.id]?.imageUrl??""} onChange={e => setProjectForm(prev => ({ ...prev, imageUrl:e.target.value }))}
                      style={{ ...inputSt, boxSizing:"border-box" }} />
                  </div>
                </div>

                {/* Map Coordinates */}
                <div style={{ marginTop:12, padding:16, borderRadius:10, border:"1px solid rgba(20,184,166,0.2)", background:"rgba(20,184,166,0.04)" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.teal, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Map Coordinates</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    {[["lat","Latitude","e.g. 25.197525"],["lng","Longitude","e.g. 55.274288"]].map(([key,label,ph]) => (
                      <div key={key}>
                        <label style={{ fontSize:10, color:T.textMuted, marginBottom:4, display:"block" }}>{label}</label>
                        <input type="number" step="0.000001" placeholder={ph} value={projectForm[key]??merged[key]??""} onChange={e => setProjectForm(prev => ({ ...prev, [key]:e.target.value }))}
                          style={{ ...inputSt, boxSizing:"border-box" }} />
                      </div>
                    ))}
                  </div>
                </div>

                <button type="button" disabled={dataSaving} onClick={() => saveProjectData(p.id, projectForm)}
                  style={{ marginTop:20, width:"100%", padding:"12px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${T.gold},#B8892E)`, color:T.bg, fontSize:14, fontWeight:700, cursor:dataSaving?"wait":"pointer", opacity:dataSaving?0.6:1 }}>
                  {dataSaving ? "Saving..." : "Save to Firestore — Goes Live Instantly"}
                </button>
              </div>
            );
          })()}

          {/* Version History Modal */}
          {viewingVersions && (() => {
            const pid = viewingVersions;
            const p = (emaarProjects||[]).find(x => String(x.id)===pid) || { name:"Project "+pid, id:pid };
            const versions = (projectVersions||{})[pid] || null;
            return (
              <div style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.92)", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }} onClick={() => setViewingVersions(null)}>
                <div style={{ background:"#0C1B2E", border:"1px solid rgba(212,168,67,0.3)", borderRadius:16, width:"95%", maxWidth:780, maxHeight:"88vh", overflowY:"auto" }} onClick={e => e.stopPropagation()}>
                  <div style={{ padding:"20px 24px", borderBottom:"1px solid rgba(212,168,67,0.15)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700, color:T.gold, margin:0 }}>Version History</h3>
                      <p style={{ fontSize:12, color:T.textMuted, margin:"4px 0 0" }}>{p.name} · Click Rollback to restore any version.</p>
                    </div>
                    <button type="button" onClick={() => setViewingVersions(null)} style={{ background:"transparent", border:"none", color:T.textMuted, fontSize:20, cursor:"pointer", padding:"4px 10px" }}>×</button>
                  </div>
                  <div style={{ padding:"16px 24px" }}>
                    {versions === null && <div style={{ textAlign:"center", padding:40, color:T.textMuted }}>Loading versions...</div>}
                    {versions !== null && versions.length === 0 && <div style={{ textAlign:"center", padding:40, color:T.textMuted }}>No version history yet.</div>}
                    {versions !== null && versions.length > 0 && versions.map((v, i) => (
                      <div key={v.id} style={{ padding:"16px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                            {i===0 && <span style={{ fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:5, background:"rgba(16,185,129,0.15)", color:T.green }}>CURRENT</span>}
                            <span style={{ fontSize:13, fontWeight:700, color:T.white }}>{new Date(v.savedAt).toLocaleString("en-AE",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</span>
                            <span style={{ fontSize:11, color:T.gold }}>{v.savedBy||"admin"}</span>
                            <span style={{ fontSize:10, color:T.textMuted }}>· {v.fieldsChanged||0} fields changed</span>
                          </div>
                          {i !== 0 && (
                            <button type="button" disabled={rollbackLoading} onClick={() => rollbackToVersion(pid, v)}
                              style={{ fontSize:11, padding:"6px 16px", borderRadius:8, border:`1px solid ${T.gold}40`, background:`${T.gold}08`, color:T.gold, cursor:rollbackLoading?"wait":"pointer", fontWeight:700, flexShrink:0 }}>
                              {rollbackLoading ? "Rolling back..." : "Rollback to This"}
                            </button>
                          )}
                        </div>
                        {v.diff && Object.keys(v.diff).length > 0 && (
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                            {Object.entries(v.diff).map(([field, change]) => (
                              <div key={field} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", padding:"5px 10px", borderRadius:8 }}>
                                <span style={{ color:T.textMuted, fontWeight:700, fontSize:10, textTransform:"uppercase" }}>{field}</span>
                                <span style={{ color:"#F87171", textDecoration:"line-through" }}>{String(change.old||"—").slice(0,22)}</span>
                                <span style={{ color:T.textMuted, fontSize:10 }}>→</span>
                                <span style={{ color:"#4ADE80" }}>{String(change.new||"—").slice(0,22)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Projects Table */}
          <div className="chart-box" style={{ padding:0, overflow:"hidden" }}>
            {(() => {
              const cols = ["40px","2fr"];
              if (visibleColumns?.community) cols.push("110px");
              if (visibleColumns?.price) cols.push("110px");
              if (visibleColumns?.ppsf) cols.push("90px");
              if (visibleColumns?.status) cols.push("80px");
              if (visibleColumns?.tier) cols.push("100px");
              if (visibleColumns?.handover) cols.push("90px");
              cols.push("80px");
              const gridCols = cols.join(" ");
              const now = new Date();

              const _seen = new Set();
              const allProjects = (emaarProjects||[]).filter(p => { if(_seen.has(p.id)) return false; _seen.add(p.id); return true; });
              const filtered = allProjects.filter(p => {
                const merged = getMergedProject(p);
                const matchSearch = !dataSearch || (p.name||"").toLowerCase().includes(dataSearch.toLowerCase()) || (p.community||"").toLowerCase().includes(dataSearch.toLowerCase());
                const matchCommunity = projectCommunityFilter==="All" || p.community===projectCommunityFilter;
                const matchStatus = projectStatusFilter==="All" || (merged.status||"")===projectStatusFilter;
                const price = merged.price||0;
                const matchPriceMin = !priceMin || price>=Number(priceMin);
                const matchPriceMax = !priceMax || (priceMax==="0"?price===0:price<=Number(priceMax));
                const ppsf = merged.ppsf||0;
                const matchPpsfMin = !ppsfMin || ppsf>=Number(ppsfMin);
                const matchPpsfMax = !ppsfMax || ppsf<=Number(ppsfMax);
                const matchTier = projectTierFilter==="All" || (merged.tier||"")===projectTierFilter;
                const hasOverride = !!(liveProjects||{})[p.id];
                const matchDataSource = dataSourceFilter==="all"||(dataSourceFilter==="live"&&hasOverride)||(dataSourceFilter==="default"&&!hasOverride);
                const hasImage = !!(merged.imageUrl||merged.image||p.image);
                const matchHasImage = hasImageFilter==="all"||(hasImageFilter==="yes"&&hasImage)||(hasImageFilter==="no"&&!hasImage);
                return matchSearch&&matchCommunity&&matchStatus&&matchPriceMin&&matchPriceMax&&matchPpsfMin&&matchPpsfMax&&matchTier&&matchDataSource&&matchHasImage;
              }).sort((a,b) => {
                const ma=getMergedProject(a); const mb=getMergedProject(b);
                const va = ma[projectSortKey]??a[projectSortKey]??"";
                const vb = mb[projectSortKey]??b[projectSortKey]??"";
                const dir = projectSortDir==="asc"?1:-1;
                if (typeof va==="number"&&typeof vb==="number") return dir*(va-vb);
                return dir*String(va).localeCompare(String(vb));
              });

              return (
                <>
                  {/* Table Header */}
                  <div style={{ display:"grid", gridTemplateColumns:gridCols, gap:8, padding:"12px 20px", borderBottom:`2px solid ${T.border}`, background:T.surfaceAlt }}>
                    {[["#",null],["Project","name"],visibleColumns?.community&&["Community","community"],visibleColumns?.price&&["Price","price"],visibleColumns?.ppsf&&["PPSF","ppsf"],visibleColumns?.status&&["Status","status"],visibleColumns?.tier&&["Tier","tier"],visibleColumns?.handover&&["Handover","handover"],["",null]].filter(Boolean).map((h,idx) => (
                      <span key={idx} onClick={() => { if(!h[1]) return; if(projectSortKey===h[1]) setProjectSortDir(d=>d==="asc"?"desc":"asc"); else { setProjectSortKey(h[1]); setProjectSortDir("asc"); } }}
                        style={{ fontSize:9, fontWeight:700, color:projectSortKey===h[1]?T.gold:T.textMuted, letterSpacing:1, textTransform:"uppercase", cursor:h[1]?"pointer":"default", userSelect:"none" }}>
                        {h[0]}{projectSortKey===h[1]?(projectSortDir==="asc"?" ↑":" ↓"):""}
                      </span>
                    ))}
                  </div>
                  {/* Results Bar */}
                  <div style={{ padding:"6px 20px", fontSize:11, color:T.textMuted, borderBottom:`1px solid ${T.border}`, background:T.bg, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div>Showing <strong style={{ color:T.gold }}>{filtered.length}</strong> of {allProjects.length} projects</div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {filtered.length>0 && <button type="button" onClick={() => exportFilteredProjects&&exportFilteredProjects(filtered,`emaar-filtered-${filtered.length}-projects.csv`)} style={{ fontSize:10, color:T.teal, background:"none", border:"none", cursor:"pointer" }}>Export Filtered</button>}
                      <button type="button" onClick={() => setBulkSelected(filtered.map(p=>String(p.id)))} style={{ fontSize:10, color:T.teal, background:"none", border:"none", cursor:"pointer" }}>Select All</button>
                      {bulkSelected.length>0 && <button type="button" onClick={() => setBulkSelected([])} style={{ fontSize:10, color:T.red, background:"none", border:"none", cursor:"pointer" }}>Deselect All</button>}
                    </div>
                  </div>
                  {filtered.length === 0 && (
                    <div style={{ padding:"40px 20px", textAlign:"center" }}>
                      <div style={{ fontSize:32, marginBottom:12, opacity:0.5 }}>🔍</div>
                      <div style={{ fontSize:14, fontWeight:600, color:T.white, marginBottom:4 }}>No projects match your filters</div>
                    </div>
                  )}
                  {filtered.map((p, i) => {
                    const merged = getMergedProject(p);
                    const hasOverride = !!(liveProjects||{})[p.id];
                    const pQuality = calculateProjectQuality ? calculateProjectQuality(p) : { score:0, color:T.textMuted };
                    return (
                      <div key={p.id} className="fade-up" style={{ display:"grid", gridTemplateColumns:gridCols, gap:8, padding:"10px 20px", borderBottom:`1px solid ${T.border}`, alignItems:"center", animationDelay:`${Math.min(i*0.02,0.5)}s`, cursor:"pointer", transition:"background .15s", background:editingProject===p.id?T.goldGlow:"transparent" }}
                        onMouseEnter={e => { if(editingProject!==p.id) e.currentTarget.style.background=T.surfaceAlt; }}
                        onMouseLeave={e => { if(editingProject!==p.id) e.currentTarget.style.background="transparent"; }}
                        onClick={() => { setEditingProject(p.id); setProjectForm((liveProjects||{})[p.id]||{}); }}>
                        <input type="checkbox" checked={bulkSelected.includes(String(p.id))} onChange={e => setBulkSelected(prev => e.target.checked?[...prev,String(p.id)]:prev.filter(x=>x!==String(p.id)))}
                          onClick={e => e.stopPropagation()} style={{ cursor:"pointer", accentColor:T.gold }} />
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:T.white }}>{p.name}</div>
                          <div style={{ fontSize:10, color:T.textMuted }}>{merged.type||"—"}</div>
                        </div>
                        {visibleColumns?.community && <span style={{ fontSize:11, color:T.textSecondary }}>{p.community}</span>}
                        {visibleColumns?.price && <span style={{ fontSize:12, fontWeight:700, color:T.gold }}>{merged.price?`AED ${(merged.price/1e6).toFixed(2)}M`:"TBA"}</span>}
                        {visibleColumns?.ppsf && <span style={{ fontSize:12, color:T.textPrimary }}>{merged.ppsf?merged.ppsf.toLocaleString():"—"}</span>}
                        {visibleColumns?.status && <span style={{ fontSize:10, fontWeight:600, padding:"3px 8px", borderRadius:6, background:merged.status==="Selling"?"rgba(16,185,129,0.12)":"rgba(148,163,184,0.1)", color:merged.status==="Selling"?T.green:T.textMuted }}>{merged.status||"—"}</span>}
                        {visibleColumns?.tier && <span style={{ fontSize:10, color:T.textSecondary }}>{merged.tier||"—"}</span>}
                        {visibleColumns?.handover && <span style={{ fontSize:10, color:T.textSecondary }}>{merged.handover||"—"}</span>}
                        <span style={{ fontSize:11, color:hasOverride?T.green:T.textMuted, fontWeight:hasOverride?600:400 }}>{hasOverride?"● Live":"Edit →"}</span>
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
        </Section>
      )}

      {/* ══════════════════════════════
         COMMUNITIES EDITOR
      ══════════════════════════════ */}
      {dataSubTab === "communities" && (() => {
        const communities = Object.keys(defaultCommunityROI||{});
        const activeKey = editingCommunity || communities[0];
        const roiMerged = { ...(defaultCommunityROI?.[activeKey]||{}), ...(liveCommunityROI?.[activeKey]||{}) };
        const intelMerged = { ...(defaultCommunityIntel?.[activeKey]||{}), ...(liveCommunityIntel?.[activeKey]||{}) };
        const hasROI = !!(liveCommunityROI||{})[activeKey];
        const hasIntel = !!(liveCommunityIntel||{})[activeKey];
        const hasAnyOverride = hasROI || hasIntel;

        const inp = (val, ph, onChange) => (
          <input value={val??""} onChange={onChange} placeholder={ph}
            style={{ width:"100%", padding:"10px 13px", background:"rgba(4,9,15,0.8)", border:"1px solid rgba(212,168,67,0.14)", borderRadius:7, color:"#E2E8F0", fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }} />
        );
        const ta = (val, ph, onChange, rows) => (
          <textarea value={val??""} onChange={onChange} placeholder={ph} rows={rows||3}
            style={{ width:"100%", padding:"10px 13px", background:"rgba(4,9,15,0.8)", border:"1px solid rgba(212,168,67,0.14)", borderRadius:7, color:"#E2E8F0", fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box", resize:"vertical", lineHeight:1.6 }} />
        );
        const Lbl = ({ children, color }) => (
          <div style={{ fontSize:10, fontWeight:700, color:color||"#64748B", letterSpacing:1.1, textTransform:"uppercase", marginBottom:6 }}>{children}</div>
        );

        return (
          <div style={{ position:"fixed", top:60, left:240, right:0, bottom:0, display:"flex", zIndex:50, background:"#04090F" }}>
            {/* Left Nav */}
            <div style={{ width:280, flexShrink:0, background:"#060D1A", borderRight:"1px solid rgba(212,168,67,0.1)", display:"flex", flexDirection:"column", height:"100%", overflowY:"auto" }}>
              <button type="button" onClick={() => setDataSubTab("projects")}
                style={{ display:"flex", alignItems:"center", gap:8, padding:"14px 20px", background:"rgba(212,168,67,0.06)", border:"none", borderBottom:"1px solid rgba(212,168,67,0.1)", color:"#D4A843", fontSize:12, fontWeight:600, cursor:"pointer", textAlign:"left" }}>
                ← Back to Data Manager
              </button>
              <div style={{ padding:"18px 20px 14px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#D4A843", letterSpacing:2, textTransform:"uppercase", marginBottom:4 }}>Communities</div>
                <div style={{ fontSize:12, color:"#64748B" }}>{communities.length} areas</div>
              </div>
              <div style={{ flex:1, padding:"8px 10px", overflowY:"auto" }}>
                {communities.map(k => {
                  const isActive = activeKey === k;
                  const hasLive = !!(liveCommunityROI||{})[k] || !!(liveCommunityIntel||{})[k];
                  const roi = { ...(defaultCommunityROI?.[k]||{}), ...(liveCommunityROI?.[k]||{}) };
                  const intel = { ...(defaultCommunityIntel?.[k]||{}), ...(liveCommunityIntel?.[k]||{}) };
                  return (
                    <button key={k} type="button"
                      onClick={() => { setEditingCommunity(k); setCommunityForm({ ...(defaultCommunityROI?.[k]||{}), ...(liveCommunityROI?.[k]||{}) }); setCommunityIntelForm({ ...(defaultCommunityIntel?.[k]||{}), ...(liveCommunityIntel?.[k]||{}) }); }}
                      style={{ width:"100%", padding:"12px 14px", borderRadius:10, border:isActive?"1px solid rgba(212,168,67,0.3)":"1px solid transparent", background:isActive?"rgba(212,168,67,0.08)":"transparent", cursor:"pointer", textAlign:"left", marginBottom:4, display:"block" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                        <div style={{ fontSize:13, fontWeight:isActive?700:500, color:isActive?"#D4A843":"#CBD5E1" }}>{k}</div>
                        {hasLive ? <span style={{ fontSize:8, fontWeight:700, padding:"2px 6px", borderRadius:4, background:"rgba(16,185,129,0.12)", color:"#10B981" }}>LIVE</span>
                          : <span style={{ fontSize:8, fontWeight:600, padding:"2px 6px", borderRadius:4, background:"rgba(100,116,139,0.1)", color:"#475569" }}>DEFAULT</span>}
                      </div>
                      <div style={{ fontSize:10, color:"#475569", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{intel.tagline||"No tagline"}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Editor */}
            <div style={{ flex:1, minWidth:0, overflowY:"auto", height:"100%" }}>
              <div style={{ padding:"28px 36px 24px", background:"linear-gradient(135deg,rgba(212,168,67,0.07) 0%,rgba(10,22,40,0) 60%)", borderBottom:"1px solid rgba(212,168,67,0.1)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:24, flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:"#D4A843", letterSpacing:2, textTransform:"uppercase", marginBottom:6 }}>Editing Community</div>
                  <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:32, fontWeight:900, color:"#FFFFFF", margin:"0 0 8px" }}>{activeKey}</h1>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:hasAnyOverride?"#10B981":"#475569" }} />
                    <span style={{ fontSize:12, color:hasAnyOverride?"#10B981":"#64748B" }}>{hasAnyOverride?"Live — dashboard shows your custom data":"Default — showing data.js values"}</span>
                  </div>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button type="button" onClick={fetchLiveData} style={{ fontSize:12, padding:"10px 18px", borderRadius:8, border:"1px solid rgba(212,168,67,0.3)", background:"rgba(212,168,67,0.06)", color:"#D4A843", cursor:"pointer", fontWeight:600 }}>{I.refresh} Refresh</button>
                  {hasAnyOverride && <button type="button" onClick={() => resetCombinedCommunity(activeKey)} style={{ fontSize:12, padding:"10px 18px", borderRadius:8, border:"1px solid rgba(239,68,68,0.25)", background:"rgba(239,68,68,0.06)", color:"#EF4444", cursor:"pointer", fontWeight:600 }}>Reset All</button>}
                  <button type="button" disabled={dataSaving} onClick={() => saveCombinedCommunity(activeKey, communityForm, communityIntelForm)}
                    style={{ fontSize:14, padding:"11px 28px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#D4A843,#B8860B)", color:"#000", fontWeight:800, cursor:dataSaving?"wait":"pointer" }}>
                    {dataSaving ? "Saving..." : "Publish → Live"}
                  </button>
                </div>
              </div>

              <div style={{ padding:"28px 36px" }}>
                {/* Investment Data */}
                <div style={{ marginBottom:32, padding:24, background:"rgba(212,168,67,0.03)", border:"1px solid rgba(212,168,67,0.12)", borderRadius:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                    <div style={{ width:4, height:24, background:"#D4A843", borderRadius:2 }} />
                    <h2 style={{ fontSize:18, fontWeight:700, color:"#D4A843", margin:0 }}>Investment Data</h2>
                    {hasROI && <span style={{ fontSize:9, padding:"3px 8px", borderRadius:5, background:"rgba(16,185,129,0.12)", color:"#10B981", fontWeight:600 }}>LIVE</span>}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:12, marginBottom:20 }}>
                    {["apt1","apt2","apt3","th","villa"].map(k => (
                      <div key={k} style={{ background:"rgba(4,9,15,0.5)", padding:14, borderRadius:10, border:"1px solid rgba(255,255,255,0.05)" }}>
                        <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", marginBottom:10, textTransform:"uppercase" }}>{k==="apt1"?"1 BR":k==="apt2"?"2 BR":k==="apt3"?"3 BR":k==="th"?"TH":"Villa"}</div>
                        <div style={{ marginBottom:8 }}>
                          <div style={{ fontSize:9, color:"#D4A843", marginBottom:3 }}>Gross %</div>
                          <input type="number" step="0.1" value={communityForm.grossYield?.[k]??roiMerged.grossYield?.[k]??""} onChange={e => setCommunityForm(prev => ({ ...prev, grossYield:{ ...(prev.grossYield||roiMerged.grossYield||{}), [k]:Number(e.target.value)||null } }))}
                            style={{ width:"100%", padding:"8px", background:"#04090F", border:"1px solid rgba(212,168,67,0.2)", borderRadius:6, color:"#D4A843", fontSize:14, fontWeight:700, textAlign:"center" }} />
                        </div>
                        <div>
                          <div style={{ fontSize:9, color:"#10B981", marginBottom:3 }}>Net %</div>
                          <input type="number" step="0.1" value={communityForm.netYield?.[k]??roiMerged.netYield?.[k]??""} onChange={e => setCommunityForm(prev => ({ ...prev, netYield:{ ...(prev.netYield||roiMerged.netYield||{}), [k]:Number(e.target.value)||null } }))}
                            style={{ width:"100%", padding:"8px", background:"#04090F", border:"1px solid rgba(16,185,129,0.2)", borderRadius:6, color:"#10B981", fontSize:14, fontWeight:700, textAlign:"center" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
                    {[["appreciation5yr","5yr Appreciation %","number"],["appreciationYoY","YoY Growth %","number"],["occupancy","Occupancy %","number"],["serviceCharge","Service Charge AED/sqft","number"],["avgDaysToLease","Avg Days to Lease","number"],["shortTermPremium","Short-Term Premium %","number"]].map(([key,label,type]) => (
                      <div key={key}>
                        <Lbl>{label}</Lbl>
                        <input type={type} value={communityForm[key]??roiMerged[key]??""} onChange={e => setCommunityForm(prev => ({ ...prev, [key]:Number(e.target.value) }))}
                          style={{ width:"100%", padding:"10px 12px", background:"#04090F", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, color:"#E2E8F0", fontSize:14 }} />
                      </div>
                    ))}
                    <div>
                      <Lbl>Risk Level</Lbl>
                      <select value={communityForm.riskLevel??roiMerged.riskLevel??"Low"} onChange={e => setCommunityForm(prev => ({ ...prev, riskLevel:e.target.value }))}
                        style={{ width:"100%", padding:"10px 12px", background:"#04090F", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, color:"#E2E8F0", fontSize:14 }}>
                        {["Low","Low-Medium","Medium","Medium-High","High"].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Lifestyle Data */}
                <div style={{ padding:24, background:"rgba(0,191,165,0.03)", border:"1px solid rgba(0,191,165,0.12)", borderRadius:14 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                    <div style={{ width:4, height:24, background:"#00BFA5", borderRadius:2 }} />
                    <h2 style={{ fontSize:18, fontWeight:700, color:"#00BFA5", margin:0 }}>Lifestyle & Location</h2>
                    {hasIntel && <span style={{ fontSize:9, padding:"3px 8px", borderRadius:5, background:"rgba(16,185,129,0.12)", color:"#10B981", fontWeight:600 }}>LIVE</span>}
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                    <div><Lbl color="#00BFA5">Tagline</Lbl>{inp(communityIntelForm.tagline??intelMerged.tagline??"", "e.g. Golf-Side Family Living...", e => setCommunityIntelForm(prev => ({ ...prev, tagline:e.target.value })))}</div>
                    <div><Lbl color="#00BFA5">Master Developer</Lbl>{inp(communityIntelForm.masterDev??intelMerged.masterDev??"", "e.g. Emaar & Meraas", e => setCommunityIntelForm(prev => ({ ...prev, masterDev:e.target.value })))}</div>
                  </div>
                  <div style={{ marginTop:16 }}><Lbl color="#00BFA5">Famous For</Lbl>{ta(communityIntelForm.famousFor??intelMerged.famousFor??"", "Key attractions...", e => setCommunityIntelForm(prev => ({ ...prev, famousFor:e.target.value })), 2)}</div>
                  <div style={{ marginTop:16 }}><Lbl color="#00BFA5">Lifestyle</Lbl>{ta(communityIntelForm.lifestyle??intelMerged.lifestyle??"", "Community vibe...", e => setCommunityIntelForm(prev => ({ ...prev, lifestyle:e.target.value })), 2)}</div>
                  <div style={{ marginTop:16 }}><Lbl color="#00BFA5">Road Connectivity</Lbl>{inp(communityIntelForm.roads??intelMerged.roads??"", "Major roads...", e => setCommunityIntelForm(prev => ({ ...prev, roads:e.target.value })))}</div>
                </div>

                {/* Publish Footer */}
                <div style={{ marginTop:24, background:"linear-gradient(135deg,rgba(212,168,67,0.08),rgba(212,168,67,0.03))", border:"1px solid rgba(212,168,67,0.18)", borderRadius:12, padding:"20px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:700, color:"#FFFFFF", marginBottom:4 }}>Ready to publish: <span style={{ color:"#D4A843" }}>{activeKey}</span></div>
                    <div style={{ fontSize:12, color:"#64748B" }}>Investment + Lifestyle data saves to Firestore instantly.</div>
                  </div>
                  <button type="button" disabled={dataSaving} onClick={() => saveCombinedCommunity(activeKey, communityForm, communityIntelForm)}
                    style={{ fontSize:14, padding:"12px 36px", borderRadius:9, border:"none", background:"linear-gradient(135deg,#D4A843,#B8860B)", color:"#000", fontWeight:800, cursor:dataSaving?"wait":"pointer", boxShadow:"0 6px 28px rgba(212,168,67,0.32)" }}>
                    {dataSaving ? "Publishing..." : "Publish → Goes Live Now"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════
         YIELDS EDITOR
      ══════════════════════════════ */}
      {dataSubTab === "yields" && (
        <Section title="Yield Table Data" sub="Edit yield table entries shown in the Yields tab" action={
          <button type="button" onClick={fetchLiveData} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, padding:"7px 14px", borderRadius:8, border:`1px solid ${T.gold}`, background:T.goldGlow, color:T.gold, cursor:"pointer", fontWeight:600 }}>{I.refresh} Refresh</button>
        }>
          {editingYield !== null && (() => {
            const y = (emaarYields||[])[editingYield];
            if (!y) return null;
            const yieldKey = `${y.community}_${y.unit}`.replace(/\s+/g,"_");
            const merged = { ...y, ...((liveYields||{})[yieldKey]||{}) };
            const hasOverride = !!(liveYields||{})[yieldKey];
            return (
              <div className="chart-box fade-up" style={{ padding:24, marginBottom:20, border:`1px solid ${T.gold}30` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                  <div>
                    <h3 style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:700, color:T.white }}>{y.unit} — {y.community}</h3>
                    {hasOverride && <span style={{ fontSize:10, padding:"2px 8px", borderRadius:6, background:"rgba(16,185,129,0.12)", color:T.green, fontWeight:600 }}>LIVE DATA</span>}
                  </div>
                  <button type="button" onClick={() => setEditingYield(null)} style={{ fontSize:11, padding:"6px 14px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textSecondary, cursor:"pointer" }}>Cancel</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                  {[["rent","Annual Rent (AED)","number"],["price","Unit Price (AED)","number"],["gross","Gross Yield %","number"],["net","Net Yield %","number"]].map(([key,label,type]) => (
                    <div key={key}>
                      <label style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:4, display:"block" }}>{label}</label>
                      <input type={type} step="0.1" value={yieldForm[key]??merged[key]??""} onChange={e => setYieldForm(prev => ({ ...prev, [key]:e.target.value }))}
                        style={inputSt} />
                    </div>
                  ))}
                  {[["demand","Demand",["Very High","High","Moderate-High","Moderate","Growing"]],["visa","Golden Visa",["Yes","No","Some"]]].map(([key,label,options]) => (
                    <div key={key}>
                      <label style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:4, display:"block" }}>{label}</label>
                      <select value={yieldForm[key]??merged[key]??""} onChange={e => setYieldForm(prev => ({ ...prev, [key]:e.target.value }))} style={inputSt}>
                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <button type="button" disabled={dataSaving} onClick={() => saveYieldData(yieldKey, yieldForm)}
                  style={{ marginTop:20, width:"100%", padding:"12px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${T.gold},#B8892E)`, color:T.bg, fontSize:14, fontWeight:700, cursor:dataSaving?"wait":"pointer", opacity:dataSaving?0.6:1 }}>
                  {dataSaving ? "Saving..." : "Save Yield Data"}
                </button>
              </div>
            );
          })()}

          <div className="chart-box" style={{ padding:0, overflow:"hidden" }}>
            <div className="table-scroll">
              <div style={{ display:"grid", gridTemplateColumns:"40px 1.5fr 1fr 100px 110px 80px 80px 80px 70px", gap:8, padding:"12px 20px", borderBottom:`2px solid ${T.border}`, background:T.surfaceAlt, minWidth:800 }}>
                {["#","Unit Type","Community","Rent","Price","Gross","Net","Demand",""].map(h => (
                  <span key={h} style={{ fontSize:9, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase" }}>{h}</span>
                ))}
              </div>
              {(emaarYields||[]).map((y, i) => {
                const yieldKey = `${y.community}_${y.unit}`.replace(/\s+/g,"_");
                const hasOverride = !!(liveYields||{})[yieldKey];
                const merged = { ...y, ...((liveYields||{})[yieldKey]||{}) };
                return (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"40px 1.5fr 1fr 100px 110px 80px 80px 80px 70px", gap:8, padding:"10px 20px", borderBottom:`1px solid ${T.border}`, alignItems:"center", cursor:"pointer", transition:"background .15s", minWidth:800, background:editingYield===i?T.goldGlow:"transparent" }}
                    onMouseEnter={e => { if(editingYield!==i) e.currentTarget.style.background=T.surfaceAlt; }}
                    onMouseLeave={e => { if(editingYield!==i) e.currentTarget.style.background="transparent"; }}
                    onClick={() => { setEditingYield(i); setYieldForm((liveYields||{})[yieldKey]||{}); }}>
                    <span style={{ fontSize:11, color:T.textMuted }}>{i+1}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:T.white }}>{merged.unit}</span>
                    <span style={{ fontSize:11, color:T.textSecondary }}>{merged.community}</span>
                    <span style={{ fontSize:12, color:T.textPrimary }}>AED {((merged.rent||0)/1000).toFixed(0)}K</span>
                    <span style={{ fontSize:12, color:T.gold, fontWeight:600 }}>AED {((merged.price||0)/1e6).toFixed(2)}M</span>
                    <span style={{ fontSize:12, fontWeight:700, color:T.green }}>{merged.gross}%</span>
                    <span style={{ fontSize:12, color:T.teal }}>{merged.net}%</span>
                    <span style={{ fontSize:10, color:merged.demand==="Very High"?T.gold:T.textSecondary }}>{merged.demand}</span>
                    <span style={{ fontSize:10, color:hasOverride?T.green:T.textMuted, fontWeight:hasOverride?600:400 }}>{hasOverride?"●":"—"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>
      )}

      {/* ══════════════════════════════
         PRICE HISTORY
      ══════════════════════════════ */}
      {dataSubTab === "pricehistory" && (() => {
        const selectedProject = (emaarProjects||[]).find(p => String(p.id)===String(phSelId));
        const history = phSelId ? ((priceHistory||{})[phSelId]||[]) : [];
        const chartW = 700, chartH = 200;
        const pad = { t:20, b:30, l:50, r:20 };
        const innerW = chartW - pad.l - pad.r;
        const innerH = chartH - pad.t - pad.b;
        const prices = history.map(h => h.price);
        const minP = prices.length ? Math.min(...prices)*0.97 : 0;
        const maxP = prices.length ? Math.max(...prices)*1.03 : 1;
        const chartPoints = history.map((h,i) => ({ x:pad.l+(i/(Math.max(history.length-1,1)))*innerW, y:pad.t+(1-(h.price-minP)/(maxP-minP))*innerH, date:h.recordedAt }));
        const polyline = chartPoints.map(p => `${p.x},${p.y}`).join(" ");

        const saveManualEntry_ = () => {
          if (saveManualEntry) saveManualEntry();
        };

        return (
          <Section title="Price History" sub="Track and log price changes per project over time">
            {TabHelp && <TabHelp items={[
              { icon:"[?]", title:"Select a Project", desc:"Choose any project from the dropdown. Chart and table will load its full price history." },
              { icon:"[+]", title:"Add Manual Entry", desc:"Add a historical price point manually for any project." },
            ]} />}

            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
              <select value={phSelId} onChange={e => { setPhSelId(e.target.value); if(e.target.value) loadHistory(e.target.value); }}
                style={{ flex:1, maxWidth:400, padding:"12px 16px", background:T.surface, border:`1px solid ${phSelId?T.gold:T.border}`, borderRadius:10, color:phSelId?T.gold:T.textMuted, fontSize:14, fontFamily:"'Outfit',sans-serif", cursor:"pointer" }}>
                <option value="">Select a project to view price history...</option>
                {(emaarProjects||[]).map(p => <option key={p.id} value={p.id}>{p.name} — {p.community}</option>)}
              </select>
              {phSelId && (
                <button type="button" onClick={() => loadHistory(phSelId)} disabled={phLoading}
                  style={{ padding:"12px 18px", borderRadius:10, border:`1px solid ${T.gold}40`, background:`${T.gold}08`, color:T.gold, cursor:"pointer", fontWeight:600, fontSize:12 }}>
                  {phLoading ? "Loading..." : `${I.refresh} Refresh`}
                </button>
              )}
            </div>

            {!phSelId && (
              <div style={{ textAlign:"center", padding:"48px 24px", borderRadius:16, border:`2px dashed ${T.border}` }}>
                <div style={{ fontSize:40, marginBottom:16, opacity:0.4 }}>📈</div>
                <div style={{ fontSize:14, fontWeight:600, color:T.white, marginBottom:8 }}>Select a project to view price history</div>
                <div style={{ fontSize:12, color:T.textMuted }}>Choose from {(emaarProjects||[]).length} Emaar projects above</div>
              </div>
            )}

            {phSelId && !phLoading && (
              <>
                {history.length > 0 && (() => {
                  const first = prices[0]; const last = prices[prices.length-1];
                  const changePct = first>0?(((last-first)/first)*100).toFixed(1):0;
                  return (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
                      {[["Current Price",`AED ${last.toLocaleString()}`,T.gold],["Total Change",`${changePct>=0?"+":""}${changePct}%`,changePct>=0?T.green:T.red],["All-Time High",`AED ${Math.max(...prices).toLocaleString()}`,T.green],["All-Time Low",`AED ${Math.min(...prices).toLocaleString()}`,T.textMuted]].map(([label,val,color])=>(
                        <div key={label} className="kpi-card" style={{ border:`1px solid ${T.border}`, position:"relative" }}>
                          <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:color, opacity:0.6, borderRadius:"16px 16px 0 0" }} />
                          <div style={{ fontSize:18, fontWeight:900, color, fontFamily:"'Fraunces',serif" }}>{val}</div>
                          <div style={{ fontSize:10, color:T.textMuted, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, marginTop:4 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {history.length >= 2 && (
                  <div className="chart-box fade-up" style={{ padding:"16px 20px 12px", marginBottom:20 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:4 }}>{selectedProject?.name} — Price Timeline</div>
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width:"100%", height:chartH, overflow:"visible" }}>
                      {[0,0.25,0.5,0.75,1].map((t,i) => {
                        const y = pad.t+t*innerH;
                        const val = maxP-(maxP-minP)*t;
                        return (
                          <g key={i}>
                            <line x1={pad.l} y1={y} x2={chartW-pad.r} y2={y} stroke={T.border} strokeWidth="1" />
                            <text x={pad.l-6} y={y+4} textAnchor="end" fill={T.textMuted} fontSize="9">{(val/1e6).toFixed(1)}M</text>
                          </g>
                        );
                      })}
                      <defs><linearGradient id="phGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={T.gold} stopOpacity="0.2"/><stop offset="100%" stopColor={T.gold} stopOpacity="0"/></linearGradient></defs>
                      <polygon points={`${pad.l},${pad.t+innerH} ${polyline} ${chartW-pad.r},${pad.t+innerH}`} fill="url(#phGrad)" />
                      <polyline points={polyline} fill="none" stroke={T.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {chartPoints.map((pt,i) => (
                        <g key={i}>
                          <circle cx={pt.x} cy={pt.y} r="4" fill={T.gold} stroke={T.bg} strokeWidth="2" />
                          <text x={pt.x} y={chartH-4} textAnchor="middle" fill={T.textMuted} fontSize="8">
                            {new Date(pt.date).toLocaleDateString("en-AE",{day:"numeric",month:"short"})}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                )}

                {history.length > 0 && (
                  <div className="chart-box fade-up" style={{ padding:0, overflow:"hidden", marginBottom:20 }}>
                    <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Price Change Log</div>
                      <div style={{ fontSize:11, color:T.textMuted }}>{history.length} entries</div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 40px", gap:8, padding:"10px 20px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
                      {["Date","Price (AED)","PPSF","Change","Recorded By",""].map(h => <span key={h} style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1 }}>{h}</span>)}
                    </div>
                    {[...history].reverse().map((h, i, arr) => {
                      const prev = arr[i+1];
                      const changePct = prev?(((h.price-prev.price)/prev.price)*100).toFixed(1):null;
                      return (
                        <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 40px", gap:8, padding:"11px 20px", borderBottom:i<arr.length-1?`1px solid ${T.border}`:"none", background:i%2===0?"transparent":T.surfaceAlt, alignItems:"center" }}>
                          <span style={{ fontSize:12, color:T.textSecondary }}>{new Date(h.recordedAt).toLocaleDateString("en-AE",{day:"numeric",month:"short",year:"numeric"})}</span>
                          <span style={{ fontSize:12, fontWeight:700, color:T.gold }}>AED {h.price.toLocaleString()}</span>
                          <span style={{ fontSize:12, color:T.textSecondary }}>{h.ppsf?h.ppsf.toLocaleString():"—"}</span>
                          <span style={{ fontSize:11, fontWeight:700, color:changePct===null?T.textMuted:changePct>=0?T.green:T.red }}>{changePct===null?"—":`${changePct>=0?"+":""}${changePct}%`}</span>
                          <span style={{ fontSize:11, color:T.textMuted }}>{h.recordedBy||"—"}{h.manual?" (manual)":""}</span>
                          <button type="button" onClick={() => deletePriceHistoryEntry(h.id, phSelId)}
                            style={{ width:28, height:28, borderRadius:6, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.06)", color:T.red, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>×</button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Manual Entry Form */}
                <div className="chart-box fade-up" style={{ padding:20 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Add Manual Price Entry</div>
                  <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Add a historical price point for {selectedProject?.name||"this project"}</div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:12, marginBottom:14 }}>
                    {[["price","Price (AED) *","number","e.g. 2500000"],["ppsf","Price/sqft","number","e.g. 2200"],["date","Date *","date",""],["note","Note","text","e.g. Q1 launch price"]].map(([key,label,type,ph]) => (
                      <div key={key}>
                        <label style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, display:"block", marginBottom:6 }}>{label}</label>
                        <input type={type} placeholder={ph} value={(phManual||{})[key]||""} onChange={e => setPhManual(p => ({ ...p, [key]:e.target.value }))} style={inputSt} />
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={saveManualEntry_} disabled={phSaving}
                    style={{ width:"100%", padding:"11px", borderRadius:9, border:"none", background:`linear-gradient(135deg,${T.gold},#B8892E)`, color:T.bg, fontSize:13, fontWeight:700, cursor:phSaving?"wait":"pointer", opacity:phSaving?0.6:1 }}>
                    {phSaving ? "Saving..." : "+ Add Price Entry"}
                  </button>
                </div>
              </>
            )}

            {phLoading && <div style={{ textAlign:"center", padding:"40px", color:T.textMuted, fontSize:13 }}>Loading price history...</div>}

            {/* Info Footer */}
            <div className="chart-box fade-up" style={{ padding:16, marginTop:8, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ fontSize:24 }}>ℹ</div>
              <div>
                <div style={{ fontSize:12, fontWeight:600, color:T.white }}>How Live Data Works</div>
                <div style={{ fontSize:11, color:T.textSecondary, lineHeight:1.6 }}>Data saved here goes to Firestore and overrides default values from data.js. The main dashboard reads Firestore first, falls back to defaults if no override exists.</div>
              </div>
            </div>
          </Section>
        );
      })()}
    </>
  );
};

export default AdminDataTab;
