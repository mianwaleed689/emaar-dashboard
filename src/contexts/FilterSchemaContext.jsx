/* eslint-disable */
/**
 * DXB Analytics — FilterSchemaContext
 * =====================================
 *
 * Single source of truth for filter options platform-wide.
 *
 * Usage in any tab:
 *
 *   import { useFilterSchema } from "../contexts/FilterSchemaContext";
 *
 *   function MyTab() {
 *     const { propertyTypes, statusOptions, priceResets, tierLabels,
 *             goldenVisaThreshold, allTypeLabels } = useFilterSchema();
 *     // ...
 *   }
 *
 * The context subscribes to Firestore platformSettings/main and falls
 * back to local defaults if data is unavailable. All tabs re-render
 * automatically when the admin edits the schema in the admin panel.
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  PROPERTY_TYPES_DEFAULT,
  STATUS_OPTIONS_DEFAULT,
  PRICE_PRESETS_DEFAULT,
  TIER_LABELS_DEFAULT,
  GOLDEN_VISA_THRESHOLD_DEFAULT,
} from "../utils/filterSchemaDefaults";

const FilterSchemaContext = createContext(null);

export function FilterSchemaProvider({ children }) {
  const [schema, setSchema] = useState({
    propertyTypes: PROPERTY_TYPES_DEFAULT,
    statusOptions: STATUS_OPTIONS_DEFAULT,
    pricePresets: PRICE_PRESETS_DEFAULT,
    tierLabels: TIER_LABELS_DEFAULT,
    goldenVisaThreshold: GOLDEN_VISA_THRESHOLD_DEFAULT,
    isLiveData: false,
  });

  useEffect(() => {
    let unsub = null;
    try {
      unsub = onSnapshot(doc(db, "platformSettings", "main"), (snap) => {
        if (!snap.exists()) return; // keep defaults
        const data = snap.data() || {};
        const fs = data.filterSchema || {};
        setSchema({
          propertyTypes:       Array.isArray(fs.propertyTypes) && fs.propertyTypes.length > 0 ? fs.propertyTypes : PROPERTY_TYPES_DEFAULT,
          statusOptions:       Array.isArray(fs.statusOptions) && fs.statusOptions.length > 0 ? fs.statusOptions : STATUS_OPTIONS_DEFAULT,
          pricePresets:        Array.isArray(fs.pricePresets) && fs.pricePresets.length > 0 ? fs.pricePresets : PRICE_PRESETS_DEFAULT,
          tierLabels:          (fs.tierLabels && typeof fs.tierLabels === "object") ? { ...TIER_LABELS_DEFAULT, ...fs.tierLabels } : TIER_LABELS_DEFAULT,
          goldenVisaThreshold: typeof fs.goldenVisaThreshold === "number" ? fs.goldenVisaThreshold : GOLDEN_VISA_THRESHOLD_DEFAULT,
          isLiveData: true,
        });
      }, (err) => {
        console.warn("FilterSchema: Firestore error, using defaults:", err?.message);
      });
    } catch (err) {
      console.warn("FilterSchema: subscription setup failed, using defaults:", err?.message);
    }
    return () => { try { unsub && unsub(); } catch (e) { console.error("swallowed@FilterSchemaContext.jsx:67", e); } };
  }, []);

  // Derived, memoized helpers useful across tabs
  const derived = useMemo(() => {
    const allTypeLabels = schema.propertyTypes
      .flatMap(g => g.types || [])
      .map(t => t.label);
    const allTypeValues = schema.propertyTypes
      .flatMap(g => g.types || [])
      .map(t => t.value);
    // Type value → label map (for filter matching with mixed casing)
    const typeLabelByValue = {};
    const typeValueByLabel = {};
    schema.propertyTypes.forEach(g => {
      (g.types || []).forEach(t => {
        typeLabelByValue[t.value] = t.label;
        typeValueByLabel[t.label.toLowerCase()] = t.value;
      });
    });
    // Beds options for a given type value
    const bedsForType = (typeValue) => {
      for (const g of schema.propertyTypes) {
        for (const t of (g.types || [])) {
          if (t.value === typeValue) return t.beds || [];
        }
      }
      return [];
    };
    // Universal bed options (union across all types)
    const allBeds = Array.from(new Set(
      schema.propertyTypes.flatMap(g => (g.types || []).flatMap(t => t.beds || []))
    ));
    return { allTypeLabels, allTypeValues, typeLabelByValue, typeValueByLabel, bedsForType, allBeds };
  }, [schema.propertyTypes]);

  const value = useMemo(() => ({ ...schema, ...derived }), [schema, derived]);
  return <FilterSchemaContext.Provider value={value}>{children}</FilterSchemaContext.Provider>;
}

/** Hook to read the current filter schema. Always returns populated defaults. */
export function useFilterSchema() {
  const ctx = useContext(FilterSchemaContext);
  if (!ctx) {
    // Graceful fallback — if a component is rendered outside the provider,
    // return defaults rather than throwing.
    return {
      propertyTypes: PROPERTY_TYPES_DEFAULT,
      statusOptions: STATUS_OPTIONS_DEFAULT,
      pricePresets: PRICE_PRESETS_DEFAULT,
      tierLabels: TIER_LABELS_DEFAULT,
      goldenVisaThreshold: GOLDEN_VISA_THRESHOLD_DEFAULT,
      isLiveData: false,
      allTypeLabels: PROPERTY_TYPES_DEFAULT.flatMap(g => g.types).map(t => t.label),
      allTypeValues: PROPERTY_TYPES_DEFAULT.flatMap(g => g.types).map(t => t.value),
      typeLabelByValue: {},
      typeValueByLabel: {},
      bedsForType: () => [],
      allBeds: [],
    };
  }
  return ctx;
}
