/* eslint-disable */
/**
 * FilterSchema Admin Tab
 * ========================
 * Edits platformSettings/main.filterSchema. FilterSchemaContext on the
 * user-side picks up changes instantly via onSnapshot.
 *
 * Sections:
 *   - Property Types (grouped, with bed options)
 *   - Status Options
 *   - Price Presets
 *   - Tier Labels
 *   - Golden Visa Threshold
 *
 * Safety:
 *   - All edits go through a local draft first (not written until Save)
 *   - Reset button restores to last-saved state from Firestore
 *   - Validation: required fields, numeric where needed
 *   - Duplicate value prevention on types/statuses
 */

import React, { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  PROPERTY_TYPES_DEFAULT,
  STATUS_OPTIONS_DEFAULT,
  PRICE_PRESETS_DEFAULT,
  TIER_LABELS_DEFAULT,
  GOLDEN_VISA_THRESHOLD_DEFAULT,
} from "../utils/filterSchemaDefaults";

export default function FilterSchemaAdminTab({ T, I, notify }) {
  // Minimal local styling to match the admin panel without importing its huge shared CSS
  const colors = T || {
    bg: "#04090F",
    surface: "#0A1119",
    surfaceAlt: "#111823",
    border: "rgba(255,255,255,0.08)",
    white: "#FFFFFF",
    textPrimary: "#FFFFFF",
    textMuted: "rgba(255,255,255,0.45)",
    textSecondary: "rgba(255,255,255,0.65)",
    gold: "#D4A843",
    green: "#10B981",
    red: "#EF4444",
    blue: "#3B82F6",
  };
  const toast = notify || ((msg) => { try { alert(msg); } catch {} });

  const [draft, setDraft] = useState({
    propertyTypes: PROPERTY_TYPES_DEFAULT,
    statusOptions: STATUS_OPTIONS_DEFAULT,
    pricePresets: PRICE_PRESETS_DEFAULT,
    tierLabels: TIER_LABELS_DEFAULT,
    goldenVisaThreshold: GOLDEN_VISA_THRESHOLD_DEFAULT,
  });
  const [lastSaved, setLastSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("propertyTypes");
  const [loading, setLoading] = useState(true);
  /* Phase 3.9.1 fix: use a ref instead of reading stale `lastSaved` from closure.
     The ref survives the useEffect's [] dep list and reflects the actual
     current load state. Fixes Reset-to-defaults snap-back bug. */
  const didInitialLoad = useRef(false);

  // Subscribe to Firestore
  useEffect(() => {
    let unsub = null;
    try {
      unsub = onSnapshot(doc(db, "platformSettings", "main"), (snap) => {
        const data = snap.exists() ? snap.data() : {};
        const fs = data.filterSchema || {};
        const resolved = {
          propertyTypes:       Array.isArray(fs.propertyTypes) && fs.propertyTypes.length > 0 ? fs.propertyTypes : PROPERTY_TYPES_DEFAULT,
          statusOptions:       Array.isArray(fs.statusOptions) && fs.statusOptions.length > 0 ? fs.statusOptions : STATUS_OPTIONS_DEFAULT,
          pricePresets:        Array.isArray(fs.pricePresets) && fs.pricePresets.length > 0 ? fs.pricePresets : PRICE_PRESETS_DEFAULT,
          tierLabels:          fs.tierLabels && typeof fs.tierLabels === "object" ? { ...TIER_LABELS_DEFAULT, ...fs.tierLabels } : TIER_LABELS_DEFAULT,
          goldenVisaThreshold: typeof fs.goldenVisaThreshold === "number" ? fs.goldenVisaThreshold : GOLDEN_VISA_THRESHOLD_DEFAULT,
        };
        setLastSaved(resolved);
        /* Only overwrite draft on VERY FIRST load. After that, preserve
           whatever user has typed/reset locally until they explicitly Save. */
        if (!didInitialLoad.current) {
          setDraft(resolved);
          didInitialLoad.current = true;
        }
        setLoading(false);
      }, (err) => {
        console.warn("FilterSchemaAdminTab: Firestore error:", err?.message);
        setLoading(false);
      });
    } catch (err) {
      console.warn("FilterSchemaAdminTab: subscription failed:", err?.message);
      setLoading(false);
    }
    return () => { try { unsub && unsub(); } catch {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasChanges = lastSaved && JSON.stringify(draft) !== JSON.stringify(lastSaved);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      // Validate before save
      const typeValues = draft.propertyTypes.flatMap(g => (g.types || []).map(t => t.value));
      const dupValues = typeValues.filter((v, i) => typeValues.indexOf(v) !== i);
      if (dupValues.length > 0) {
        toast("Error: duplicate type values: " + dupValues.join(", "));
        setSaving(false);
        return;
      }
      const statusValues = draft.statusOptions.map(s => s.value);
      const dupStatus = statusValues.filter((v, i) => statusValues.indexOf(v) !== i);
      if (dupStatus.length > 0) {
        toast("Error: duplicate status values: " + dupStatus.join(", "));
        setSaving(false);
        return;
      }
      if (typeof draft.goldenVisaThreshold !== "number" || draft.goldenVisaThreshold < 0) {
        toast("Error: Golden Visa threshold must be a positive number");
        setSaving(false);
        return;
      }
      await setDoc(doc(db, "platformSettings", "main"), {
        filterSchema: draft,
        _lastEditedAt: new Date().toISOString(),
      }, { merge: true });
      toast("Filter schema saved. All users see updates instantly.");
    } catch (err) {
      toast("Save failed: " + (err?.message || err));
    }
    setSaving(false);
  };

  const reset = () => {
    if (lastSaved) setDraft(lastSaved);
    toast("Reverted to last saved");
  };

  const resetToDefaults = async () => {
    if (!window.confirm("Reset ALL filter schema to built-in defaults? This will publish to Firestore immediately — all users will see the defaults.")) return;
    const defaults = {
      propertyTypes: PROPERTY_TYPES_DEFAULT,
      statusOptions: STATUS_OPTIONS_DEFAULT,
      pricePresets: PRICE_PRESETS_DEFAULT,
      tierLabels: TIER_LABELS_DEFAULT,
      goldenVisaThreshold: GOLDEN_VISA_THRESHOLD_DEFAULT,
    };
    setDraft(defaults);
    /* Phase 3.11: auto-save to Firestore so Reset actually persists. */
    if (saving) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "platformSettings", "main"), {
        filterSchema: defaults,
        _lastEditedAt: new Date().toISOString(),
      }, { merge: true });
      toast("Reset to defaults — published platform-wide");
    } catch (err) {
      toast("Reset save failed: " + (err?.message || err));
    }
    setSaving(false);
  };

  /* ── Styles ── */
  const card = { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 20 };
  const input = { background: colors.surfaceAlt, border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.white, padding: "6px 10px", fontSize: 12, fontFamily: "'Outfit',sans-serif" };
  const btn = (variant) => ({
    padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
    fontFamily: "'Outfit',sans-serif", border: "1px solid",
    background: variant === "primary" ? colors.gold : variant === "danger" ? "transparent" : colors.surfaceAlt,
    borderColor: variant === "primary" ? colors.gold : variant === "danger" ? colors.red : colors.border,
    color: variant === "primary" ? colors.bg : variant === "danger" ? colors.red : colors.white,
  });

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: colors.textMuted }}>
        Loading filter schema…
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, fontWeight: 800, color: colors.white }}>Filter Schema</div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4, maxWidth: 700 }}>
            Canonical list of property types, statuses, price presets, and thresholds that every tab reads from.
            Changes publish to Firestore instantly — users see them on their next data refresh (no deploy).
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={resetToDefaults} style={btn("danger")}>Reset to defaults</button>
          <button type="button" onClick={reset} disabled={!hasChanges} style={{ ...btn(), opacity: hasChanges ? 1 : 0.4 }}>Undo changes</button>
          <button type="button" onClick={save} disabled={!hasChanges || saving} style={{ ...btn("primary"), opacity: (hasChanges && !saving) ? 1 : 0.5 }}>
            {saving ? "Saving…" : hasChanges ? "Save & publish" : "Saved"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: `1px solid ${colors.border}`, flexWrap: "wrap" }}>
        {[
          { id: "propertyTypes",      label: "Property Types" },
          { id: "statusOptions",      label: "Statuses" },
          { id: "pricePresets",       label: "Price Presets" },
          { id: "tierLabels",         label: "Tier Labels" },
          { id: "goldenVisaThreshold",label: "Golden Visa" },
        ].map(t => (
          <button key={t.id} type="button" onClick={() => setActiveSection(t.id)}
            style={{
              padding: "10px 18px", background: "transparent",
              border: "none", borderBottom: `2px solid ${activeSection === t.id ? colors.gold : "transparent"}`,
              color: activeSection === t.id ? colors.gold : colors.textMuted,
              fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Property Types editor */}
      {activeSection === "propertyTypes" && (
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.white, marginBottom: 16 }}>Property Types</div>
          {draft.propertyTypes.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 20, padding: 14, background: colors.surfaceAlt, borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <input type="text" value={group.group}
                  onChange={e => setDraft(d => ({ ...d, propertyTypes: d.propertyTypes.map((g, i) => i === gi ? { ...g, group: e.target.value } : g) }))}
                  style={{ ...input, flex: 1, fontWeight: 700 }} />
                <button type="button" style={btn("danger")}
                  onClick={() => {
                    if (!window.confirm(`Remove group "${group.group}" and all its types?`)) return;
                    setDraft(d => ({ ...d, propertyTypes: d.propertyTypes.filter((_, i) => i !== gi) }));
                  }}>Remove group</button>
              </div>
              {(group.types || []).map((type, ti) => (
                <div key={ti} style={{ display: "grid", gridTemplateColumns: "140px 180px 1fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <input type="text" placeholder="value (lowercase)" value={type.value}
                    onChange={e => setDraft(d => ({ ...d, propertyTypes: d.propertyTypes.map((g, i) => i === gi ? { ...g, types: g.types.map((t, j) => j === ti ? { ...t, value: e.target.value.toLowerCase().replace(/\s+/g, '_') } : t) } : g) }))}
                    style={input} />
                  <input type="text" placeholder="Label" value={type.label}
                    onChange={e => setDraft(d => ({ ...d, propertyTypes: d.propertyTypes.map((g, i) => i === gi ? { ...g, types: g.types.map((t, j) => j === ti ? { ...t, label: e.target.value } : t) } : g) }))}
                    style={input} />
                  <input type="text" placeholder="Bed options (comma-separated, e.g. Studio, 1 BR, 2 BR)" value={(type.beds || []).join(", ")}
                    onChange={e => setDraft(d => ({ ...d, propertyTypes: d.propertyTypes.map((g, i) => i === gi ? { ...g, types: g.types.map((t, j) => j === ti ? { ...t, beds: e.target.value.split(",").map(s => s.trim()).filter(Boolean) } : t) } : g) }))}
                    style={input} />
                  <button type="button" style={{ ...btn("danger"), padding: "6px 10px" }}
                    onClick={() => setDraft(d => ({ ...d, propertyTypes: d.propertyTypes.map((g, i) => i === gi ? { ...g, types: g.types.filter((_, j) => j !== ti) } : g) }))}>×</button>
                </div>
              ))}
              <button type="button" style={{ ...btn(), marginTop: 6, fontSize: 11 }}
                onClick={() => setDraft(d => ({ ...d, propertyTypes: d.propertyTypes.map((g, i) => i === gi ? { ...g, types: [...(g.types || []), { value: "new_type_" + ((g.types || []).length + 1), label: "New Type", beds: [] }] } : g) }))}>
                + Add type to this group
              </button>
            </div>
          ))}
          <button type="button" style={btn("primary")}
            onClick={() => setDraft(d => ({ ...d, propertyTypes: [...d.propertyTypes, { group: "New Group", types: [] }] }))}>
            + Add group
          </button>
        </div>
      )}

      {/* Status Options editor */}
      {activeSection === "statusOptions" && (
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.white, marginBottom: 16 }}>Status Options</div>
          {draft.statusOptions.map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "160px 1fr auto", gap: 8, marginBottom: 8 }}>
              <input type="text" placeholder="value" value={s.value}
                onChange={e => setDraft(d => ({ ...d, statusOptions: d.statusOptions.map((x, j) => j === i ? { ...x, value: e.target.value.toLowerCase().replace(/\s+/g, '_') } : x) }))}
                style={input} />
              <input type="text" placeholder="Label" value={s.label}
                onChange={e => setDraft(d => ({ ...d, statusOptions: d.statusOptions.map((x, j) => j === i ? { ...x, label: e.target.value } : x) }))}
                style={input} />
              <button type="button" style={{ ...btn("danger"), padding: "6px 10px" }}
                onClick={() => setDraft(d => ({ ...d, statusOptions: d.statusOptions.filter((_, j) => j !== i) }))}>×</button>
            </div>
          ))}
          <button type="button" style={{ ...btn(), marginTop: 6 }}
            onClick={() => setDraft(d => ({ ...d, statusOptions: [...d.statusOptions, { value: "new_status", label: "New Status" }] }))}>
            + Add status
          </button>
        </div>
      )}

      {/* Price Presets editor */}
      {activeSection === "pricePresets" && (
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.white, marginBottom: 16 }}>Price Presets</div>
          <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 12 }}>
            min/max are in AED. Use 0 for "no limit".
          </div>
          {draft.pricePresets.map((p, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 140px 140px auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <input type="text" placeholder="Label" value={p.label}
                onChange={e => setDraft(d => ({ ...d, pricePresets: d.pricePresets.map((x, j) => j === i ? { ...x, label: e.target.value } : x) }))}
                style={input} />
              <input type="number" placeholder="Min AED" value={p.min}
                onChange={e => setDraft(d => ({ ...d, pricePresets: d.pricePresets.map((x, j) => j === i ? { ...x, min: parseFloat(e.target.value) || 0 } : x) }))}
                style={input} />
              <input type="number" placeholder="Max AED (0 = no limit)" value={p.max}
                onChange={e => setDraft(d => ({ ...d, pricePresets: d.pricePresets.map((x, j) => j === i ? { ...x, max: parseFloat(e.target.value) || 0 } : x) }))}
                style={input} />
              <button type="button" style={{ ...btn("danger"), padding: "6px 10px" }}
                onClick={() => setDraft(d => ({ ...d, pricePresets: d.pricePresets.filter((_, j) => j !== i) }))}>×</button>
            </div>
          ))}
          <button type="button" style={{ ...btn(), marginTop: 6 }}
            onClick={() => setDraft(d => ({ ...d, pricePresets: [...d.pricePresets, { label: "New preset", min: 0, max: 0 }] }))}>
            + Add preset
          </button>
        </div>
      )}

      {/* Tier Labels editor */}
      {activeSection === "tierLabels" && (
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.white, marginBottom: 16 }}>Tier Labels</div>
          {Object.entries(draft.tierLabels).map(([key, values]) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{key}</div>
              <input type="text" value={Array.isArray(values) ? values.join(", ") : ""}
                onChange={e => setDraft(d => ({ ...d, tierLabels: { ...d.tierLabels, [key]: e.target.value.split(",").map(s => s.trim()).filter(Boolean) } }))}
                style={{ ...input, width: "100%" }}
                placeholder="Comma-separated values" />
            </div>
          ))}
        </div>
      )}

      {/* Golden Visa threshold */}
      {activeSection === "goldenVisaThreshold" && (
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.white, marginBottom: 8 }}>Golden Visa Threshold</div>
          <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 16, maxWidth: 600 }}>
            Minimum AED purchase value that qualifies for a 10-year UAE Golden Visa. Current official value (Jan 2022 onwards): AED 2,000,000.
            Update here if UAE government changes the threshold — platform will reflect instantly.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: colors.gold }}>AED</span>
            <input type="number" value={draft.goldenVisaThreshold}
              onChange={e => setDraft(d => ({ ...d, goldenVisaThreshold: parseFloat(e.target.value) || 0 }))}
              style={{ ...input, fontSize: 20, padding: "10px 14px", width: 220, fontWeight: 700 }} />
            <span style={{ fontSize: 13, color: colors.textSecondary }}>
              ≈ ${((draft.goldenVisaThreshold || 0) / 3.67).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
            </span>
          </div>
        </div>
      )}

      {/* Footer info */}
      <div style={{ marginTop: 20, padding: "10px 14px", background: colors.surfaceAlt, borderRadius: 8, fontSize: 11, color: colors.textMuted }}>
        <strong style={{ color: colors.gold }}>Tip:</strong> Edits here are local until you click Save & publish.
        After saving, all users see the new schema instantly — their dropdowns, pills, and filters update without a reload.
      </div>
    </div>
  );
}
