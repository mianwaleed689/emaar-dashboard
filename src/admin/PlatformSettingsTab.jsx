/* eslint-disable */
/**
 * DXB Analytics вв‚¬вЂќ Platform Settings
 * src/admin/PlatformSettingsTab.jsx
 *
 * Admin CRUD for platform-wide configuration:
 *   - Property Types (what types of real estate exist on the platform)
 *   - Status Options (Off-Plan, Ready, etc.)
 *   - Developer Tiers
 *   - Filter definitions per tab
 *
 * Reads/writes Firestore: doc(db, "platformSettings", "main")
 *
 * How to use:
 *   1. Admin opens this tab
 *   2. Edit types/statuses/tiers in the forms
 *   3. Click "Save Changes" вв‚¬вЂќ writes to Firestore
 *   4. Dashboard tabs listen to the same doc and re-render
 */

import React, { useState, useEffect, useMemo } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import {
  PROPERTY_TYPES as DEFAULT_PROPERTY_TYPES,
  STATUS_OPTIONS as DEFAULT_STATUS_OPTIONS,
} from "../utils/constants";

/** Default seed written to Firestore the first time this tab loads */
const DEFAULT_SETTINGS = {
  propertyTypes: DEFAULT_PROPERTY_TYPES.flatMap(group =>
    group.types.map(t => ({
      id: t.value,
      label: t.label,
      category: group.group,
      beds: t.beds || [],
      enabled: true,
      appearsOnTabs: ["Projects", "Investment Score", "Yields", "Communities", "Map"],
    }))
  ),
  statusOptions: DEFAULT_STATUS_OPTIONS.map(s => ({
    id: s.value,
    label: s.label,
    enabled: true,
  })),
  developerTiers: [
    { id: "T1", label: "Tier 1 вв‚¬вЂќ Top 5 by sales",  description: "Emaar, DAMAC, Nakheel, Sobha, Meraas, Aldar, Dubai Properties" },
    { id: "T2", label: "Tier 2 вв‚¬вЂќ Mid-market",       description: "Established brand, credible delivery history, lower volume than T1" },
    { id: "T3", label: "Tier 3 вв‚¬вЂќ Emerging / Boutique", description: "New or specialist developer; fewer completed projects" },
  ],
  globalFilters: {
    defaultTabFilters: ["developer", "propertyType", "configs", "status", "price"],
    hideEmptyDropdowns: true,
  },
  meta: {
    schemaVersion: 1,
    lastUpdatedBy: "",
    lastUpdatedAt: "",
  },
};

export default function PlatformSettingsTab({ T, db, notify, adminUser }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeSection, setActiveSection] = useState("propertyTypes");

  // Subscribe to the settings doc
  useEffect(() => {
    const settingsRef = doc(db, "platformSettings", "main");
    const unsub = onSnapshot(
      settingsRef,
      async (snap) => {
        if (!snap.exists()) {
          // First-time load: seed from defaults
          try {
            await setDoc(settingsRef, {
              ...DEFAULT_SETTINGS,
              meta: { ...DEFAULT_SETTINGS.meta, lastUpdatedBy: adminUser?.email || "system", lastUpdatedAt: new Date().toISOString() },
            });
            // onSnapshot will fire again with the new data
          } catch (err) {
            console.error("PlatformSettingsTab seed failed:", err);
            setSettings(DEFAULT_SETTINGS); // fallback to local defaults so UI renders
            setLoading(false);
          }
        } else {
          setSettings(snap.data());
          setLoading(false);
        }
      },
      (err) => {
        console.error("PlatformSettingsTab onSnapshot error:", err);
        notify && notify("Failed to load settings: " + err.message);
        setSettings(DEFAULT_SETTINGS);
        setLoading(false);
      }
    );
    return () => { try { unsub(); } catch {} };
  }, [db, adminUser]);

  // Mark dirty whenever the user mutates local state
  function patch(updater) {
    setSettings((prev) => {
      const next = updater(prev);
      setDirty(true);
      return next;
    });
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const settingsRef = doc(db, "platformSettings", "main");
      await setDoc(settingsRef, {
        ...settings,
        meta: {
          ...(settings.meta || {}),
          lastUpdatedBy: adminUser?.email || "unknown",
          lastUpdatedAt: new Date().toISOString(),
          schemaVersion: 1,
        },
      });
      notify && notify("Settings saved. Dashboard will update within seconds.");
      setDirty(false);
    } catch (err) {
      console.error("Save failed:", err);
      notify && notify("Save failed: " + err.message);
    }
    setSaving(false);
  }

  function handleResetToDefaults() {
    if (!confirm("Reset ALL settings to defaults? This cannot be undone after save.")) return;
    setSettings({ ...DEFAULT_SETTINGS });
    setDirty(true);
  }

  if (loading || !settings) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>
        <div style={{ fontSize: 14 }}>Loading platform settingsвв‚¬¦</div>
      </div>
    );
  }

  const cardStyle = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  };

  const sectionTabStyle = (active) => ({
    padding: "10px 16px",
    background: active ? T.goldGlow : "transparent",
    color: active ? T.gold : T.textSecondary,
    border: "none",
    borderBottom: active ? `2px solid ${T.gold}` : "2px solid transparent",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Outfit', sans-serif",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ввЂќв‚¬ввЂќв‚¬ Header ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */}
      <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.white, fontFamily: "'Fraunces', serif" }}>
            Platform Settings
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
            Source of truth for property types, statuses, and filter configs. Changes save to Firestore and propagate to every dashboard tab.
          </div>
          {settings.meta?.lastUpdatedAt && (
            <div style={{ fontSize: 10, color: T.textMuted, marginTop: 8 }}>
              Last updated: {new Date(settings.meta.lastUpdatedAt).toLocaleString("en-AE")}
              {settings.meta.lastUpdatedBy && ` by ${settings.meta.lastUpdatedBy}`}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={handleResetToDefaults}
            style={{ padding: "10px 16px", background: "transparent", border: `1px solid ${T.border}`, color: T.textSecondary, borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
          >
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            style={{
              padding: "10px 20px",
              background: dirty ? T.gold : T.surfaceAlt,
              color: dirty ? T.navy : T.textMuted,
              border: "none",
              borderRadius: 10,
              cursor: dirty && !saving ? "pointer" : "not-allowed",
              fontSize: 13,
              fontWeight: 700,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Savingвв‚¬¦" : dirty ? "Save Changes" : "Saved вњвЂњ"}
          </button>
        </div>
      </div>

      {/* ввЂќв‚¬ввЂќв‚¬ Section tabs ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "0 20px", display: "flex", gap: 8 }}>
        {[
          { id: "propertyTypes", label: "Property Types" },
          { id: "statusOptions", label: "Status Options" },
          { id: "developerTiers", label: "Developer Tiers" },
          { id: "globalFilters", label: "Filter Config" },
        ].map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            style={sectionTabStyle(activeSection === s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ввЂќв‚¬ввЂќв‚¬ PROPERTY TYPES section ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */}
      {activeSection === "propertyTypes" && (
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 4 }}>Property Types</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>
            These are the property categories every filter and dropdown on the platform will show. Disable one to hide it everywhere.
          </div>
          <PropertyTypesEditor
            types={settings.propertyTypes || []}
            T={T}
            onChange={(nextTypes) => patch(prev => ({ ...prev, propertyTypes: nextTypes }))}
          />
        </div>
      )}

      {/* ввЂќв‚¬ввЂќв‚¬ STATUS OPTIONS section ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */}
      {activeSection === "statusOptions" && (
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 4 }}>Status Options</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>
            Status dropdown values. Used on the filter bar and inside the Projects admin.
          </div>
          <StatusOptionsEditor
            statuses={settings.statusOptions || []}
            T={T}
            onChange={(nextStatuses) => patch(prev => ({ ...prev, statusOptions: nextStatuses }))}
          />
        </div>
      )}

      {/* ввЂќв‚¬ввЂќв‚¬ DEVELOPER TIERS section ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */}
      {activeSection === "developerTiers" && (
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 4 }}>Developer Tiers</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>
            Developers are assigned a tier. These labels appear on badges and filters.
          </div>
          <DeveloperTiersEditor
            tiers={settings.developerTiers || []}
            T={T}
            onChange={(nextTiers) => patch(prev => ({ ...prev, developerTiers: nextTiers }))}
          />
        </div>
      )}

      {/* ввЂќв‚¬ввЂќв‚¬ GLOBAL FILTERS section ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */}
      {activeSection === "globalFilters" && (
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.white, marginBottom: 4 }}>Filter Config</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 16 }}>
            Controls which filters appear in the top bar across dashboard tabs.
          </div>
          <GlobalFiltersEditor
            config={settings.globalFilters || {}}
            T={T}
            onChange={(nextConfig) => patch(prev => ({ ...prev, globalFilters: nextConfig }))}
          />
        </div>
      )}
    </div>
  );
}

/* ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ Sub-editors ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ввЂќв‚¬ */

function PropertyTypesEditor({ types, T, onChange }) {
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [newTypeCategory, setNewTypeCategory] = useState("Residential");

  const byCategory = useMemo(() => {
    const acc = {};
    for (const t of types) {
      const cat = t.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(t);
    }
    return acc;
  }, [types]);

  const categories = ["Residential", "Hospitality", "Commercial", "Industrial & Land"];

  function toggle(typeId) {
    onChange(types.map(t => t.id === typeId ? { ...t, enabled: !t.enabled } : t));
  }
  function remove(typeId) {
    if (!confirm("Remove this property type?")) return;
    onChange(types.filter(t => t.id !== typeId));
  }
  function addNew() {
    const label = newTypeLabel.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    if (types.find(t => t.id === id)) { alert("A type with that ID already exists."); return; }
    onChange([...types, { id, label, category: newTypeCategory, beds: [], enabled: true, appearsOnTabs: ["Projects"] }]);
    setNewTypeLabel("");
  }

  const inputStyle = { padding: "8px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.white, borderRadius: 8, fontSize: 12, fontFamily: "'Outfit', sans-serif" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Add new */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", padding: 12, background: T.surfaceAlt, borderRadius: 10, border: `1px dashed ${T.border}` }}>
        <input
          type="text"
          placeholder="New property type name (e.g. Loft Apartment)"
          value={newTypeLabel}
          onChange={(e) => setNewTypeLabel(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <select value={newTypeCategory} onChange={(e) => setNewTypeCategory(e.target.value)} style={inputStyle}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="button" onClick={addNew} style={{ padding: "8px 14px", background: T.gold, color: T.navy, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>+ Add</button>
      </div>

      {categories.map(cat => {
        const items = byCategory[cat] || [];
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.gold, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{cat}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
              {items.map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, opacity: t.enabled ? 1 : 0.5 }}>
                  <input type="checkbox" checked={!!t.enabled} onChange={() => toggle(t.id)} style={{ cursor: "pointer" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</div>
                    <div style={{ fontSize: 9, color: T.textMuted }}>{t.id} В· {(t.beds || []).length} bed options</div>
                  </div>
                  <button type="button" onClick={() => remove(t.id)} style={{ background: "transparent", border: "none", color: T.red, cursor: "pointer", fontSize: 14, padding: 4 }}>ГвЂ”</button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusOptionsEditor({ statuses, T, onChange }) {
  const [newLabel, setNewLabel] = useState("");
  const inputStyle = { padding: "8px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.white, borderRadius: 8, fontSize: 12, fontFamily: "'Outfit', sans-serif" };

  function toggle(id) { onChange(statuses.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)); }
  function remove(id) {
    if (!confirm("Remove this status?")) return;
    onChange(statuses.filter(s => s.id !== id));
  }
  function addNew() {
    const label = newLabel.trim();
    if (!label) return;
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    if (statuses.find(s => s.id === id)) { alert("A status with that ID already exists."); return; }
    onChange([...statuses, { id, label, enabled: true }]);
    setNewLabel("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, padding: 12, background: T.surfaceAlt, borderRadius: 10, border: `1px dashed ${T.border}` }}>
        <input
          type="text"
          placeholder="New status label (e.g. Handover 2028)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button type="button" onClick={addNew} style={{ padding: "8px 14px", background: T.gold, color: T.navy, border: "none", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>+ Add</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
        {statuses.map(s => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, opacity: s.enabled ? 1 : 0.5 }}>
            <input type="checkbox" checked={!!s.enabled} onChange={() => toggle(s.id)} style={{ cursor: "pointer" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.white, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</div>
              <div style={{ fontSize: 9, color: T.textMuted }}>{s.id}</div>
            </div>
            <button type="button" onClick={() => remove(s.id)} style={{ background: "transparent", border: "none", color: T.red, cursor: "pointer", fontSize: 14, padding: 4 }}>ГвЂ”</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeveloperTiersEditor({ tiers, T, onChange }) {
  function update(id, field, value) {
    onChange(tiers.map(t => t.id === id ? { ...t, [field]: value } : t));
  }
  const inputStyle = { width: "100%", padding: "8px 12px", background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.white, borderRadius: 8, fontSize: 12, fontFamily: "'Outfit', sans-serif" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {tiers.map(t => (
        <div key={t.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr 2fr", gap: 10, padding: 14, background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: T.gold, fontFamily: "'Fraunces', serif", alignSelf: "center" }}>{t.id}</div>
          <input type="text" value={t.label} onChange={(e) => update(t.id, "label", e.target.value)} style={inputStyle} />
          <input type="text" value={t.description} onChange={(e) => update(t.id, "description", e.target.value)} style={inputStyle} />
        </div>
      ))}
    </div>
  );
}

function GlobalFiltersEditor({ config, T, onChange }) {
  const available = [
    { id: "developer",    label: "Developer" },
    { id: "propertyType", label: "Property Type" },
    { id: "configs",      label: "Configurations (beds/layout)" },
    { id: "status",       label: "Status" },
    { id: "price",        label: "Price Range" },
    { id: "community",    label: "Community" },
    { id: "handover",     label: "Handover Date" },
    { id: "yield",        label: "Yield Range" },
  ];
  const selected = config.defaultTabFilters || [];

  function toggle(id) {
    const next = selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id];
    onChange({ ...config, defaultTabFilters: next });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.white, marginBottom: 10 }}>Default filters shown on dashboard tabs</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
          {available.map(f => {
            const on = selected.includes(f.id);
            return (
              <label key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: T.surfaceAlt, border: `1px solid ${on ? T.gold : T.border}`, borderRadius: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={on} onChange={() => toggle(f.id)} style={{ cursor: "pointer" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{f.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={!!config.hideEmptyDropdowns}
            onChange={(e) => onChange({ ...config, hideEmptyDropdowns: e.target.checked })}
          />
          <span style={{ fontSize: 12, color: T.white }}>
            Hide filter dropdowns that would be empty (recommended)
          </span>
        </label>
        <div style={{ fontSize: 10, color: T.textMuted, marginLeft: 24, marginTop: 4 }}>
          E.g. on the Yields tab, hide Status filter since yield data isn't categorised by status.
        </div>
      </div>
    </div>
  );
}
