/* ─────────────────────────────────────────────────────────────
   DXB ANALYTICS — PROPERTY TYPES (canonical)
   src/utils/propertyTypes.js

   The single source of truth for what property types exist in
   DXB Analytics. Every tab, every form, every filter, every
   migration imports from here. Do not duplicate this list.

   Locked in Session 4 schema spec (docs/schema-v1.md).
   Last updated: 8 April 2026
   ───────────────────────────────────────────────────────────── */

// All 43 property types, grouped by master category.
// Each entry has:
// - id: stable internal identifier (used in Firestore as the `type` field)
// - label: human-readable name shown in the UI
// - category: master category (residential / commercial / industrial / land / specialty)
// - dldClass: the legal DLD title-deed classification (land / unit / villa)

export const PROPERTY_TYPES = [
  // RESIDENTIAL (12)
  { id: "apartment",          label: "Apartment",                category: "residential", dldClass: "unit" },
  { id: "villa",              label: "Villa",                    category: "residential", dldClass: "villa" },
  { id: "townhouse",          label: "Townhouse",                category: "residential", dldClass: "villa" },
  { id: "penthouse",          label: "Penthouse",                category: "residential", dldClass: "unit" },
  { id: "duplex",             label: "Duplex",                   category: "residential", dldClass: "unit" },
  { id: "loft",               label: "Loft",                     category: "residential", dldClass: "unit" },
  { id: "hotel-apartment",    label: "Hotel Apartment",          category: "residential", dldClass: "unit" },
  { id: "branded-residence",  label: "Branded Residence",        category: "residential", dldClass: "unit" },
  { id: "residential-building", label: "Residential Building",   category: "residential", dldClass: "unit" },
  { id: "residential-floor",  label: "Residential Floor",        category: "residential", dldClass: "unit" },
  { id: "villa-compound",     label: "Villa Compound",           category: "residential", dldClass: "villa" },
  { id: "compound-villa",     label: "Compound Villa",           category: "residential", dldClass: "villa" },

  // COMMERCIAL (15)
  { id: "office",             label: "Office",                   category: "commercial",  dldClass: "unit" },
  { id: "retail-shop",        label: "Retail Shop",              category: "commercial",  dldClass: "unit" },
  { id: "showroom",           label: "Showroom",                 category: "commercial",  dldClass: "unit" },
  { id: "business-centre",    label: "Business Centre",          category: "commercial",  dldClass: "unit" },
  { id: "co-working-space",   label: "Co-working Space",         category: "commercial",  dldClass: "unit" },
  { id: "mall-anchor-space",  label: "Mall Anchor Space",        category: "commercial",  dldClass: "unit" },
  { id: "restaurant-fnb",     label: "Restaurant / F&B Space",   category: "commercial",  dldClass: "unit" },
  { id: "clinic-medical",     label: "Clinic / Medical Centre",  category: "commercial",  dldClass: "unit" },
  { id: "education-facility", label: "Education Facility",       category: "commercial",  dldClass: "unit" },
  { id: "commercial-villa",   label: "Commercial Villa",         category: "commercial",  dldClass: "villa" },
  { id: "commercial-floor",   label: "Commercial Floor",         category: "commercial",  dldClass: "unit" },
  { id: "commercial-building", label: "Commercial Building",     category: "commercial",  dldClass: "unit" },
  { id: "mixed-use-building", label: "Mixed-Use Building",       category: "commercial",  dldClass: "unit" },
  { id: "bulk-sale-unit",     label: "Bulk Sale Unit",           category: "commercial",  dldClass: "unit" },
  { id: "hotel",              label: "Hotel",                    category: "commercial",  dldClass: "unit" },

  // INDUSTRIAL & LOGISTICS (6)
  { id: "warehouse",          label: "Warehouse",                category: "industrial",  dldClass: "unit" },
  { id: "cold-storage",       label: "Cold Storage Warehouse",   category: "industrial",  dldClass: "unit" },
  { id: "light-industrial",   label: "Light Industrial Building", category: "industrial", dldClass: "unit" },
  { id: "factory",            label: "Factory",                  category: "industrial",  dldClass: "unit" },
  { id: "labour-camp",        label: "Labour Camp / Staff Accommodation", category: "industrial", dldClass: "unit" },
  { id: "logistics-centre",   label: "Logistics Centre",         category: "industrial",  dldClass: "unit" },

  // LAND & PLOTS (6)
  { id: "residential-plot",   label: "Residential Plot",         category: "land",        dldClass: "land" },
  { id: "commercial-plot",    label: "Commercial Plot",          category: "land",        dldClass: "land" },
  { id: "industrial-land",    label: "Industrial Land",          category: "land",        dldClass: "land" },
  { id: "mixed-use-plot",     label: "Mixed-Use Plot",           category: "land",        dldClass: "land" },
  { id: "farm-agricultural",  label: "Farm / Agricultural Land", category: "land",        dldClass: "land" },
  { id: "hospitality-plot",   label: "Hospitality Plot",         category: "land",        dldClass: "land" },

  // SPECIALTY (4)
  { id: "parking-space",      label: "Parking Space",            category: "specialty",   dldClass: "unit" },
  { id: "storage-unit",       label: "Storage Unit",             category: "specialty",   dldClass: "unit" },
  { id: "marina-berth",       label: "Marina Berth",             category: "specialty",   dldClass: "unit" },
  { id: "long-leasehold",     label: "Land Lease / Long-term Leasehold", category: "specialty", dldClass: "unit" },
];

// Convenience: array of just the IDs (for validation)
export const PROPERTY_TYPE_IDS = PROPERTY_TYPES.map(t => t.id);

// Convenience: lookup map for fast access
export const PROPERTY_TYPE_MAP = Object.fromEntries(
  PROPERTY_TYPES.map(t => [t.id, t])
);

// Convenience: master categories
export const MASTER_CATEGORIES = ["residential", "commercial", "industrial", "land", "specialty"];

// Convenience: get all types in a category
export function typesInCategory(category) {
  return PROPERTY_TYPES.filter(t => t.category === category);
}

// Convenience: validate a type ID
export function isValidPropertyType(id) {
  return PROPERTY_TYPE_IDS.includes(id);
}

// Convenience: get display label for an ID
export function propertyTypeLabel(id) {
  return PROPERTY_TYPE_MAP[id]?.label || id;
}

// Convenience: get DLD class for an ID
export function propertyTypeDldClass(id) {
  return PROPERTY_TYPE_MAP[id]?.dldClass || "unit";
}