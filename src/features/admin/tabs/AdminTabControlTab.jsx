import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs, getDoc, doc, setDoc, query, orderBy } from "firebase/firestore";
import { auth, db } from "../../../firebase";
import { signOut } from "firebase/auth";

function AdminTabControlTab({ T, I, notify, db, logAudit = () => {},
  tabSettings = [], setTabSettings = () => {},
  tabSearch = '', setTabSearch = () => {},
  selectedTabControl, setSelectedTabControl = () => {},
  users = [], adminUser,
  auditLog = [],
  timeSince = () => '—',
  liveCommunityROI = {},
  tabDataEdits = {}, setTabDataEdits = () => {},
  tabDataSaving = false, setTabDataSaving = () => {}
}) {

  // ── Internal state ────────────────────────────────────────────────
  const [tabSettingsSaving, setTabSettingsSaving] = React.useState(false);
  const [previewTier, setPreviewTier] = React.useState("pro");
  // ─────────────────────────────────────────────────────────────────

            /* ═══════════════════════════════════════════════════════════════════
               TAB 9: TAB CONTROL — PRO LEVEL
               LaunchDarkly + Statsig + Flagsmith inspired feature flags
               Search, badges, descriptions, usage stats, bulk actions
            ═══════════════════════════════════════════════════════════════════ */

            const ALL_TABS = [
              { id: "Overview", category: "Core", desc: "Dashboard home with key metrics" },
              { id: "Financials", category: "Core", desc: "Revenue, payments, MRR tracking" },
              { id: "Projects", category: "Properties", desc: "Emaar project listings and details" },
              { id: "Handover", category: "Properties", desc: "Project completion timeline tracker" },
              { id: "Launch Calendar", category: "Properties", desc: "Upcoming project launches" },
              { id: "Neighbourhoods", category: "Properties", desc: "Community profiles and stats" },
              { id: "Service Charges", category: "Properties", desc: "Annual fees by community" },
              { id: "STR vs LTR", category: "Investment", desc: "Short-term vs long-term rental analysis" },
              { id: "Developer Health", category: "Analytics", desc: "Developer financial scorecards" },
              { id: "DLD Volumes", category: "Analytics", desc: "Dubai Land Dept transaction data" },
              { id: "DXB Estimate", category: "Tools", desc: "Property value estimator" },
              { id: "Portfolio", category: "User", desc: "Personal investment tracker" },
              { id: "Competitors", category: "Analytics", desc: "Market competitor analysis" },
              { id: "Yields", category: "Investment", desc: "Rental yield by community" },
              { id: "Mortgage", category: "Tools", desc: "Mortgage calculator UAE banks" },
              { id: "Map", category: "Tools", desc: "Interactive Dubai property map" },
              { id: "Risk", category: "Analytics", desc: "Investment risk assessment" },
              { id: "Market", category: "Analytics", desc: "Market overview and trends" },
              { id: "Currency", category: "Tools", desc: "FX rates and converter" },
              { id: "Golden Visa", category: "Tools", desc: "Visa eligibility checker" },
              { id: "Flip", category: "Investment", desc: "Property flipping calculator" },
            ];

            const CATEGORIES = ["Core", "Properties", "Investment", "Analytics", "Tools", "User"];
            const TIERS = ["free", "pro", "enterprise"];
            const TIER_COLORS = { free: T.textSecondary, pro: T.gold, enterprise: T.purple };
            const TIER_LABELS = { free: "Free", pro: "Pro", enterprise: "Enterprise" };
            const BADGE_TYPES = { none: null, beta: { label: "BETA", color: T.blue }, new: { label: "NEW", color: T.green }, soon: { label: "SOON", color: T.orange } };

            const getTabSetting = (tabKey) => tabSettings[tabKey] || { visible: true, minTier: "free", badge: "none", description: "" };

            const updateTabSetting = async (tabKey, field, value) => {
              const current = getTabSetting(tabKey);
              const updated = { ...tabSettings, [tabKey]: { ...current, [field]: value, lastModified: new Date().toISOString(), modifiedBy: adminUser?.email || "admin" } };
              setTabSettings(updated);
              setTabSettingsSaving(true);
              try { await setDoc(doc(db, "platformSettings", "tabs"), updated); } catch(e) {}
              logAudit(db, { action: "tab_setting_change", tabKey, field, value }).catch(() => {});
              setTimeout(() => setTabSettingsSaving(false), 800);
            };

            // Usage stats from auditLog
            const tabUsageStats = (() => {
              const stats = {};
              auditLog.forEach(log => {
                if (log.action === "tab_view" && log.tabKey) {
                  stats[log.tabKey] = (stats[log.tabKey] || 0) + 1;
                }
              });
              return stats;
            })();

            // Filter tabs by search
            const filteredTabs = ALL_TABS.filter(t => {
              if (!tabSearch) return true;
              const s = tabSearch.toLowerCase();
              const setting = getTabSetting(t.id);
              const customDesc = setting.description || t.desc;
              return t.id.toLowerCase().includes(s) || t.category.toLowerCase().includes(s) || customDesc.toLowerCase().includes(s);
            });

            // Stats
            const hiddenCount = ALL_TABS.filter(t => !getTabSetting(t.id).visible).length;
            const proCount = ALL_TABS.filter(t => getTabSetting(t.id).minTier === "pro").length;
            const entCount = ALL_TABS.filter(t => getTabSetting(t.id).minTier === "enterprise").length;
            const betaCount = ALL_TABS.filter(t => getTabSetting(t.id).badge === "beta").length;

            // Per-tab data
            const TAB_DATA = {
              "Yields": { fields: ["community","grossYield","netYield","avgRent","trend"], labels: { community:"Community", grossYield:"Gross Yield %", netYield:"Net Yield %", avgRent:"Avg Rent (AED)", trend:"Trend" }, rows: liveCommunityROI && Object.keys(liveCommunityROI).length > 0 ? Object.entries(liveCommunityROI).map(([k,v]) => ({ community: k, grossYield: v.grossYield || "", netYield: v.netYield || "", avgRent: v.avgRent || "", trend: v.trend || "" })) : [{ community:"Dubai Marina", grossYield:"5.8", netYield:"4.9", avgRent:"110000", trend:"stable" }], firestoreKey: "yieldData" },
              "Developer Health": { fields: ["developer","revenue","profit","backlog","score","rating"], labels: { developer:"Developer", revenue:"Revenue (AED B)", profit:"Profit (AED B)", backlog:"Backlog (AED B)", score:"Score /100", rating:"Rating" }, rows: [{ developer:"Emaar", revenue:"49.6", profit:"25.7", backlog:"155", score:"95", rating:"AAA" }], firestoreKey: "developerHealth" },
              "DLD Volumes": { fields: ["community","deals","value","avgPrice","yoyChange"], labels: { community:"Community", deals:"Deals (2025)", value:"Value (AED B)", avgPrice:"Avg Price (AED)", yoyChange:"YoY %" }, rows: [{ community:"Business Bay", deals:"29950", value:"89.2", avgPrice:"1850000", yoyChange:"+18" }], firestoreKey: "dldVolumes" },
              "STR vs LTR": { fields: ["community","strYield","ltrYield","occupancy","avgNightly","verdict"], labels: { community:"Community", strYield:"STR Yield %", ltrYield:"LTR Yield %", occupancy:"Occupancy %", avgNightly:"Avg Nightly", verdict:"Verdict" }, rows: [{ community:"Dubai Marina", strYield:"7.2", ltrYield:"5.8", occupancy:"74", avgNightly:"650", verdict:"STR wins" }], firestoreKey: "strLtrData" },
              "Market": { fields: ["metric","value","period","source","change"], labels: { metric:"Metric", value:"Value", period:"Period", source:"Source", change:"Change" }, rows: [{ metric:"Avg Price/sqft", value:"AED 1,689", period:"Dec 2025", source:"REIDIN", change:"+12.88%" }], firestoreKey: "marketData" },
            };
            const hasData = (t) => !!TAB_DATA[t];
            const activeTabData = selectedTabControl ? TAB_DATA[selectedTabControl] : null;

            const getEditableRows = () => { if (!activeTabData) return []; return tabDataEdits[selectedTabControl] || activeTabData.rows; };
            const updateCell = (rowIdx, field, value) => { const rows = getEditableRows().map((r, i) => i === rowIdx ? { ...r, [field]: value } : r); setTabDataEdits(prev => ({ ...prev, [selectedTabControl]: rows })); };
            const addRow = () => { if (!activeTabData) return; const emptyRow = {}; activeTabData.fields.forEach(f => { emptyRow[f] = ""; }); setTabDataEdits(prev => ({ ...prev, [selectedTabControl]: [...getEditableRows(), emptyRow] })); };
            const deleteRow = (idx) => { setTabDataEdits(prev => ({ ...prev, [selectedTabControl]: getEditableRows().filter((_, i) => i !== idx) })); };
            const saveTabData = async () => { if (!activeTabData) return; setTabDataSaving(true); try { await setDoc(doc(db, "tabData", activeTabData.firestoreKey), { rows: getEditableRows(), updatedAt: new Date().toISOString() }); notify("Saved!"); } catch(e) { notify("Failed"); } setTabDataSaving(false); };


  return (
            
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* ═══ HEADER WITH SEARCH ═══ */}
                <div className="fade-up" style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 800, color: T.gold }}>Tab Control</div>
                      <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Feature flags, tier gating, badges, and data management</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {tabSettingsSaving && <div style={{ fontSize: 11, color: T.green, display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, animation: "pulse 1s infinite" }} />Saving...</div>}
                      <button type="button" onClick={async () => { const snap = await getDoc(doc(db, "platformSettings", "tabs")); if (snap.exists()) setTabSettings(snap.data()); notify("Refreshed"); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, padding: "6px 12px", borderRadius: 8, border: `1px solid ${T.gold}`, background: T.goldGlow, color: T.gold, cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>{I.refresh}</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                      <input type="text" placeholder="Search tabs..." value={tabSearch} onChange={e => setTabSearch(e.target.value)} style={{ width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                      {tabSearch && <button type="button" onClick={() => setTabSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.textMuted, cursor: "pointer", fontSize: 14 }}>Γ£ò</button>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[{ label: `${ALL_TABS.length - hiddenCount} visible`, color: T.green }, { label: `${hiddenCount} hidden`, color: T.textMuted }, { label: `${proCount} Pro`, color: T.gold }, { label: `${entCount} Ent`, color: T.purple }, { label: `${betaCount} Beta`, color: T.blue }].map((s, i) => (
                        <div key={i} style={{ fontSize: 10, padding: "5px 10px", borderRadius: 6, background: `${s.color}10`, color: s.color, fontWeight: 600 }}>{s.label}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ═══ PREVIEW MODE ═══ */}
                <div className="fade-up" style={{ background: previewTier ? `${TIER_COLORS[previewTier]}10` : T.surface, borderRadius: 14, border: `1px solid ${previewTier ? TIER_COLORS[previewTier] + "40" : T.border}`, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={previewTier ? TIER_COLORS[previewTier] : T.textMuted} strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/></svg>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: previewTier ? TIER_COLORS[previewTier] : T.white }}>{previewTier ? `Preview: ${TIER_LABELS[previewTier]} User` : "Preview Mode"}</div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>{previewTier ? "Showing sidebar view for this tier" : "Test different tier perspectives"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[{ id: null, label: "Admin", color: T.white }, { id: "free", label: "Free", color: T.textSecondary }, { id: "pro", label: "Pro", color: T.gold }, { id: "enterprise", label: "Ent", color: T.purple }].map(p => (
                      <button key={p.id || "admin"} type="button" onClick={() => setPreviewTier(p.id)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer", border: previewTier === p.id ? `2px solid ${p.color}` : `1px solid ${T.border}`, background: previewTier === p.id ? `${p.color}15` : "transparent", color: previewTier === p.id ? p.color : T.textMuted, fontFamily: "'Outfit',sans-serif" }}>{p.label}</button>
                    ))}
                  </div>
                </div>

                {/* Preview Sidebar */}
                {previewTier && (
                  <div className="fade-up" style={{ background: T.surfaceAlt, borderRadius: 14, border: `1px solid ${TIER_COLORS[previewTier]}30`, padding: "16px 20px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: TIER_COLORS[previewTier], textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Sidebar — {TIER_LABELS[previewTier]}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {ALL_TABS.map(tabObj => {
                        const setting = getTabSetting(tabObj.id);
                        const isVisible = setting.visible !== false;
                        const minTier = setting.minTier || "free";
                        const badge = setting.badge || "none";
                        const tierOrder = { free: 0, pro: 1, enterprise: 2 };
                        const canAccess = isVisible && tierOrder[previewTier] >= tierOrder[minTier];
                        if (!isVisible) return null;
                        return (
                          <div key={tabObj.id} style={{ padding: "6px 10px", borderRadius: 6, background: canAccess ? "rgba(16,185,129,0.08)" : "rgba(100,116,139,0.08)", border: `1px solid ${canAccess ? T.green + "30" : T.border}`, display: "flex", alignItems: "center", gap: 4, opacity: canAccess ? 1 : 0.5 }}>
                            {!canAccess && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                            <span style={{ fontSize: 10, color: canAccess ? T.white : T.textMuted }}>{tabObj.id}</span>
                            {badge !== "none" && BADGE_TYPES[badge] && <span style={{ fontSize: 7, padding: "1px 4px", borderRadius: 3, background: `${BADGE_TYPES[badge].color}20`, color: BADGE_TYPES[badge].color, fontWeight: 700 }}>{BADGE_TYPES[badge].label}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ═══ BULK ACTIONS ═══ */}
                <div className="fade-up" style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "14px 20px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Bulk Actions</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                      { label: "Show All", color: T.green, action: async () => { const u = {}; ALL_TABS.forEach(t => { u[t.id] = { ...getTabSetting(t.id), visible: true }; }); setTabSettings(u); await setDoc(doc(db, "platformSettings", "tabs"), u); notify("All visible"); } },
                      { label: "Hide All", color: T.red, action: async () => { const u = {}; ALL_TABS.forEach(t => { u[t.id] = { ...getTabSetting(t.id), visible: false }; }); setTabSettings(u); await setDoc(doc(db, "platformSettings", "tabs"), u); notify("All hidden"); } },
                      { label: "All ΓåÆ Free", color: T.textSecondary, action: async () => { const u = {}; ALL_TABS.forEach(t => { u[t.id] = { ...getTabSetting(t.id), minTier: "free" }; }); setTabSettings(u); await setDoc(doc(db, "platformSettings", "tabs"), u); notify("All free"); } },
                      { label: "All ΓåÆ Pro", color: T.gold, action: async () => { const u = {}; ALL_TABS.forEach(t => { if (t.id !== "Overview") u[t.id] = { ...getTabSetting(t.id), minTier: "pro" }; }); const f = { ...tabSettings, ...u }; setTabSettings(f); await setDoc(doc(db, "platformSettings", "tabs"), f); notify("Locked to Pro"); } },
                      { label: "Analytics ΓåÆ Ent", color: T.purple, action: async () => { const analytics = ["Developer Health", "DLD Volumes", "Competitors", "Risk", "Market"]; const u = { ...tabSettings }; analytics.forEach(t => { u[t] = { ...getTabSetting(t), minTier: "enterprise" }; }); setTabSettings(u); await setDoc(doc(db, "platformSettings", "tabs"), u); notify("Analytics locked"); } },
                      { label: "Clear Badges", color: T.orange, action: async () => { const u = {}; ALL_TABS.forEach(t => { u[t.id] = { ...getTabSetting(t.id), badge: "none" }; }); setTabSettings(u); await setDoc(doc(db, "platformSettings", "tabs"), u); notify("Badges cleared"); } },
                      { label: "Reset All", color: T.textMuted, action: async () => { const u = {}; ALL_TABS.forEach(t => { u[t.id] = { visible: true, minTier: "free", badge: "none", description: "" }; }); setTabSettings(u); await setDoc(doc(db, "platformSettings", "tabs"), u); notify("Reset complete"); } },
                    ].map(({ label, action, color }) => (
                      <button key={label} type="button" onClick={action} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer", border: `1px solid ${color}40`, background: `${color}10`, color, fontFamily: "'Outfit',sans-serif" }}>{label}</button>
                    ))}
                  </div>
                </div>

                {/* ═══ TAB LIST BY CATEGORY ═══ */}
                <div className="fade-up" style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>All Tabs ({filteredTabs.length})</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>Click to configure</div>
                  </div>
                  
                  {filteredTabs.length === 0 ? (
                    <div style={{ padding: "40px 20px", textAlign: "center" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>≡ƒöì</div>
                      <div style={{ fontSize: 13, color: T.textMuted }}>No tabs match "{tabSearch}"</div>
                      <button type="button" onClick={() => setTabSearch("")} style={{ marginTop: 12, padding: "6px 14px", borderRadius: 8, fontSize: 11, background: T.goldGlow, border: `1px solid ${T.gold}`, color: T.gold, cursor: "pointer" }}>Clear</button>
                    </div>
                  ) : (
                    <div style={{ maxHeight: 400, overflowY: "auto" }}>
                      {CATEGORIES.map(cat => {
                        const catTabs = filteredTabs.filter(t => t.category === cat);
                        if (catTabs.length === 0) return null;
                        return (
                          <div key={cat}>
                            <div style={{ padding: "8px 20px", background: T.surfaceAlt, fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, borderBottom: `1px solid ${T.border}` }}>{cat} ({catTabs.length})</div>
                            {catTabs.map(tabObj => {
                              const setting = getTabSetting(tabObj.id);
                              const isVisible = setting.visible !== false;
                              const minTier = setting.minTier || "free";
                              const badge = setting.badge || "none";
                              const customDesc = setting.description || tabObj.desc;
                              const lastMod = setting.lastModified;
                              const usage = tabUsageStats[tabObj.id] || 0;
                              const isSelected = selectedTabControl === tabObj.id;
                              const editable = hasData(tabObj.id);

                              return (
                                <div key={tabObj.id} onClick={() => setSelectedTabControl(isSelected ? null : tabObj.id)} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto auto", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: `1px solid ${T.border}`, background: isSelected ? "rgba(212,168,67,0.08)" : "transparent", cursor: "pointer" }} onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }} onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                                  <div style={{ minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: !isVisible ? T.textMuted : minTier === "enterprise" ? T.purple : minTier === "pro" ? T.gold : T.green, flexShrink: 0 }} />
                                      <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isVisible ? T.white : T.textMuted }}>{tabObj.id}</span>
                                      {badge !== "none" && BADGE_TYPES[badge] && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: `${BADGE_TYPES[badge].color}20`, color: BADGE_TYPES[badge].color, fontWeight: 700 }}>{BADGE_TYPES[badge].label}</span>}
                                      {editable && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: "rgba(59,130,246,0.1)", color: T.blue, fontWeight: 600 }}>DATA</span>}
                                    </div>
                                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{customDesc}</div>
                                  </div>
                                  <div style={{ textAlign: "center", minWidth: 50 }}><div style={{ fontSize: 12, fontWeight: 700, color: usage > 0 ? T.teal : T.textMuted }}>{usage}</div><div style={{ fontSize: 8, color: T.textMuted }}>views</div></div>
                                  <div style={{ minWidth: 70 }}><span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: `${TIER_COLORS[minTier]}15`, color: TIER_COLORS[minTier] }}>{TIER_LABELS[minTier].toUpperCase()}</span></div>
                                  <div style={{ fontSize: 9, color: T.textMuted, minWidth: 70, textAlign: "right" }}>{lastMod ? timeSince(new Date(lastMod)) : "—"}</div>
                                  <div onClick={e => e.stopPropagation()}><button type="button" onClick={() => updateTabSetting(tabObj.id, "visible", !isVisible)} style={{ width: 36, height: 20, borderRadius: 10, background: isVisible ? T.green : "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", position: "relative" }}><div style={{ position: "absolute", top: 3, left: isVisible ? 19 : 3, width: 14, height: 14, borderRadius: "50%", background: T.white, transition: "left 0.2s" }} /></button></div>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isSelected ? T.gold : T.textMuted} strokeWidth="2" style={{ transform: isSelected ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}><path d="m9 18 6-6-6-6"/></svg>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ═══ SELECTED TAB CONFIG ═══ */}
                {selectedTabControl && (
                  <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.gold}40`, padding: "16px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                        <div>
                          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: T.gold }}>{selectedTabControl}</div>
                          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>Configure access, badge, and description</div>
                        </div>
                        <button type="button" onClick={() => setSelectedTabControl(null)} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 18, cursor: "pointer" }}>Γ£ò</button>
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Min Tier</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {TIERS.map(tier => {
                            const minTier = getTabSetting(selectedTabControl).minTier || "free";
                            return <button key={tier} type="button" onClick={() => updateTabSetting(selectedTabControl, "minTier", tier)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `2px solid ${minTier === tier ? TIER_COLORS[tier] : T.border}`, background: minTier === tier ? `${TIER_COLORS[tier]}18` : T.surfaceAlt, color: minTier === tier ? TIER_COLORS[tier] : T.textMuted, fontFamily: "'Outfit',sans-serif" }}>{TIER_LABELS[tier]}</button>;
                          })}
                        </div>
                      </div>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Badge</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          {Object.entries(BADGE_TYPES).map(([key, val]) => {
                            const currentBadge = getTabSetting(selectedTabControl).badge || "none";
                            const isActive = currentBadge === key;
                            const color = val ? val.color : T.textMuted;
                            return <button key={key} type="button" onClick={() => updateTabSetting(selectedTabControl, "badge", key)} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `2px solid ${isActive ? color : T.border}`, background: isActive ? `${color}15` : T.surfaceAlt, color: isActive ? color : T.textMuted, fontFamily: "'Outfit',sans-serif" }}>{key === "none" ? "None" : val.label}</button>;
                          })}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Description</div>
                        <input type="text" placeholder={ALL_TABS.find(t => t.id === selectedTabControl)?.desc || "Tab description..."} value={getTabSetting(selectedTabControl).description || ""} onChange={e => updateTabSetting(selectedTabControl, "description", e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.white, fontSize: 12, fontFamily: "'Outfit',sans-serif", outline: "none" }} />
                      </div>
                    </div>

                    {activeTabData ? (
                      <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, overflow: "hidden" }}>
                        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>Data Table</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" onClick={addRow} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1px solid ${T.border}`, background: T.surfaceAlt, color: T.textSecondary }}>+ Row</button>
                            <button type="button" onClick={saveTabData} disabled={tabDataSaving} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", border: `1px solid ${T.gold}`, background: "rgba(212,168,67,0.1)", color: T.gold }}>{tabDataSaving ? "SavingΓÇª" : "Save"}</button>
                          </div>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                            <thead><tr style={{ background: T.surfaceAlt }}>{activeTabData.fields.map(f => <th key={f} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", borderBottom: `1px solid ${T.border}` }}>{activeTabData.labels[f]}</th>)}<th style={{ borderBottom: `1px solid ${T.border}` }} /></tr></thead>
                            <tbody>
                              {getEditableRows().map((row, rowIdx) => (
                                <tr key={rowIdx} style={{ borderBottom: `1px solid ${T.border}` }}>
                                  {activeTabData.fields.map(f => <td key={f} style={{ padding: "6px 8px" }}><input value={row[f] ?? ""} onChange={e => updateCell(rowIdx, f, e.target.value)} style={{ width: "100%", minWidth: 80, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 8px", color: T.white, fontSize: 12, fontFamily: "'Outfit', sans-serif", outline: "none" }} /></td>)}
                                  <td style={{ padding: "6px 8px" }}><button type="button" onClick={() => deleteRow(rowIdx)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, color: "#EF4444", fontSize: 11, padding: "4px 8px", cursor: "pointer" }}>Γ£ò</button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, padding: "32px 24px", textAlign: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.white, marginBottom: 6 }}>No editable data</div>
                        <div style={{ fontSize: 12, color: T.textMuted }}>This tab uses dynamic data</div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ fontSize: 11, color: T.textMuted, padding: "10px 16px", borderRadius: 10, background: T.surfaceAlt, border: `1px solid ${T.border}` }}>
                  ≡ƒÆí <strong>Tips:</strong> Tabs with <span style={{ color: T.blue }}>DATA</span> have editable tables. Badge labels show in sidebar. Changes sync instantly.
                </div>
              </div>

  );
}

export default AdminTabControlTab;
