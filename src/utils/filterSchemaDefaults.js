/* eslint-disable */
/**
 * DXB Analytics — Filter Schema Defaults
 * =========================================
 *
 * This is the FALLBACK data. The live app pulls its schema from Firestore
 * (platformSettings/main.filterSchema). If Firestore is empty or fails,
 * the FilterSchemaContext falls back to these defaults — guaranteeing the
 * platform always boots.
 *
 * To change the canonical lists: edit the Admin panel → Platform Settings.
 * That writes to Firestore and updates the running app without a deploy.
 *
 * To change the FALLBACK (this file): edit and deploy.
 */

export const PROPERTY_TYPES_DEFAULT = [
  {
    group: "Residential",
    types: [
      { value: "apartment",    label: "Apartment",       beds: ["Studio","1 BR","2 BR","3 BR","4 BR","5 BR+","Penthouse","Duplex"] },
      { value: "penthouse",    label: "Penthouse",       beds: ["3 BR","4 BR","5 BR","6 BR+"] },
      { value: "villa",        label: "Villa",           beds: ["2 BR","3 BR","4 BR","5 BR","6 BR","7 BR+"] },
      { value: "townhouse",    label: "Townhouse",       beds: ["2 BR","3 BR","4 BR","5 BR"] },
      { value: "duplex",       label: "Duplex",          beds: ["2 BR","3 BR","4 BR","5 BR"] },
      { value: "garden_home",  label: "Garden Home",     beds: ["2 BR","3 BR","4 BR"] },
      { value: "sky_villa",    label: "Sky Villa",       beds: ["3 BR","4 BR","5 BR","6 BR+"] },
    ],
  },
  {
    group: "Hospitality",
    types: [
      { value: "hotel_apt",    label: "Hotel Apartment",    beds: ["Hotel Room","Studio","1 BR","2 BR","3 BR","Penthouse Suite"] },
      { value: "serviced_apt", label: "Serviced Apartment", beds: ["Studio","1 BR","2 BR","3 BR"] },
      { value: "resort_villa", label: "Resort Villa",       beds: ["1 BR","2 BR","3 BR","4 BR","5 BR+"] },
      { value: "branded_res",  label: "Branded Residence",  beds: ["1 BR","2 BR","3 BR","4 BR","Penthouse"] },
    ],
  },
  {
    group: "Commercial",
    types: [
      { value: "office",       label: "Office",           beds: ["< 500 sqft","500–1K sqft","1K–2.5K sqft","2.5K–5K sqft","5K+ sqft","Full Floor","Full Building"] },
      { value: "retail",       label: "Retail / Shop",    beds: ["< 500 sqft","500–1K sqft","1K–2.5K sqft","2.5K+ sqft"] },
      { value: "showroom",     label: "Showroom",         beds: ["< 2K sqft","2K–5K sqft","5K+ sqft"] },
      { value: "warehouse",    label: "Warehouse",        beds: ["< 5K sqft","5K–10K sqft","10K+ sqft"] },
      { value: "coworking",    label: "Co-working Space", beds: ["Hot Desk","Dedicated Desk","Private Office","Full Floor"] },
    ],
  },
  {
    group: "Industrial & Land",
    types: [
      { value: "industrial",   label: "Industrial Unit",    beds: ["< 5K sqft","5K–20K sqft","20K+ sqft"] },
      { value: "land_res",     label: "Land — Residential", beds: ["< 5K sqft","5K–15K sqft","15K+ sqft"] },
      { value: "land_comm",    label: "Land — Commercial",  beds: ["< 10K sqft","10K–50K sqft","50K+ sqft"] },
      { value: "land_mixed",   label: "Mixed Use Plot",     beds: ["< 10K sqft","10K–50K sqft","50K+ sqft"] },
    ],
  },
];

export const STATUS_OPTIONS_DEFAULT = [
  { value: "all",           label: "All Status" },
  { value: "offplan",       label: "Off-Plan — Under Construction" },
  { value: "prelaunch",     label: "Off-Plan — Pre-Launch / EOI" },
  { value: "ready_new",     label: "Ready — New (Primary)" },
  { value: "secondary",     label: "Ready — Secondary Market" },
  { value: "handover_now",  label: "Handover This Year" },
  { value: "handover_2026", label: "Handover 2026" },
  { value: "handover_2027", label: "Handover 2027+" },
];

export const PRICE_PRESETS_DEFAULT = [
  { label: "Any Price", min: 0, max: 0 },
  { label: "< 500K",    min: 0, max: 500000 },
  { label: "500K–1M",   min: 500000, max: 1000000 },
  { label: "1M–2M",     min: 1000000, max: 2000000 },
  { label: "2M–5M",     min: 2000000, max: 5000000 },
  { label: "5M–10M",    min: 5000000, max: 10000000 },
  { label: "10M+",      min: 10000000, max: 0 },
];

export const TIER_LABELS_DEFAULT = {
  yieldTiers:  ["High Yield", "Mid Yield", "Low Yield", "Villa Yield"],
  priceTiers:  ["Budget", "Mid-Range", "Premium", "Luxury", "Ultra-Luxury"],
  riskGrades:  ["A+", "A", "A-", "B+", "B", "B-", "C+", "C"],
  developerTiers: ["Tier 1", "Tier 2", "Tier 3"],
};

export const GOLDEN_VISA_THRESHOLD_DEFAULT = 2000000;
