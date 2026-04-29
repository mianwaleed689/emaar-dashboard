/* eslint-disable */
/* PROJECTS TAB ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Master catalog of all Dubai property projects
   Includes detail modal (rendered via React Portal for safety)
*/

import React, { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { T } from "../data";
import SmartEmptyState from "../components/SmartEmptyState";
import SearchableSelect from "../components/SearchableSelect";
import { SvgIcons } from "../components/Icons";

import { calcScore, scoreColor, scoreLabel } from "../utils/scoring";
import { GOLDEN_VISA_THRESHOLD } from "../utils/constants";
import { useUserFacingCommunities } from "../lib/communities";

const MODES = [
  { key:"All", label:"All Types" },
  { key:"Apartment" }, { key:"Villa" }, { key:"Townhouse" },
  { key:"Hotel Apartment" }, { key:"Office" }, { key:"Retail" },
  { key:"Warehouse" }, { key:"Land" },
];

/* ===============================================================
   3-LAYER FILTER ARCHITECTURE
   ---------------------------------------------------------------
   Layer 1: Property Category (user-facing, 4 options)
   Layer 2: Display Type (user-facing, ~12 options grouped by Category)
   Layer 3: Internal Types (backend-only, 47+ fine-grained variants)

   When a user picks a Display Type like "Apartment", the filter
   expands to match ALL internal types that belong to that display
   type: Apartment matches Apartment, Studio Apartment, Duplex,
   Penthouse, Loft, Serviced Apartment in the data.

   This mirrors how Bayut, Property Finder, Rightmove, Zillow work.
   =============================================================== */

const CATEGORY_TO_DISPLAY = {
  "All":          [],
  "Residential":  ["Apartment", "Villa", "Townhouse", "Hotel Apartment"],
  "Commercial":   ["Office", "Retail", "Warehouse"],
  "Industrial":   ["Industrial Unit", "Industrial Land"],
  "Land":         ["Residential Plot", "Commercial Plot", "Mixed-Use Plot"],
};

const DISPLAY_TO_INTERNAL = {
  "Apartment":        ["Apartment", "Studio Apartment", "Duplex", "Penthouse", "Loft", "Serviced Apartment"],
  "Villa":            ["Villa", "Semi-Detached Villa", "Independent Villa", "Sky Villa", "Villa Compound"],
  "Townhouse":        ["Townhouse", "Row House"],
  "Hotel Apartment":  ["Hotel Apartment", "Hotel Room", "Branded Residence"],
  "Office":           ["Office", "Business Center", "Co-working Space"],
  "Retail":           ["Retail", "Shop", "Showroom", "F&B"],
  "Warehouse":        ["Warehouse", "Storage Facility", "Logistics Hub"],
  "Industrial Unit":  ["Factory", "Staff Accommodation", "Workshop", "Industrial Unit"],
  "Industrial Land":  ["Industrial Plot", "Industrial Land"],
  "Residential Plot": ["Residential Plot", "Residential Land", "G+1 Plot", "G+2 Plot"],
  "Commercial Plot":  ["Commercial Plot", "Commercial Land"],
  "Mixed-Use Plot":   ["Mixed-Use Plot", "Mixed-Use Land"],
};

const UNIT_BASED_RESIDENTIAL = ["Apartment", "Villa", "Townhouse", "Hotel Apartment"];

/* Type-aware bedroom ranges - Bloomberg-tier contextual filtering.
   Each property type shows only realistic configurations:
   - Apartment/Penthouse max at 5+ BR (rare above that)
   - Villa goes to 7+ BR (luxury market 8-10+ BR bundled)
   - Townhouse caps at 5+ BR
   - Hotel Apartment caps at 3 BR
*/
const BED_OPTIONS_BY_TYPE = {
  "Apartment":       ["All", "Studio", "1 BR", "2 BR", "3 BR", "4 BR", "5+ BR"],
  "Villa":           ["All", "2 BR", "3 BR", "4 BR", "5 BR", "6 BR", "7+ BR"],
  "Townhouse":       ["All", "2 BR", "3 BR", "4 BR", "5+ BR"],
  "Hotel Apartment": ["All", "Studio", "1 BR", "2 BR", "3 BR"],
};

/* Helper: get the appropriate bed options array for the selected display type */
function getBedOptionsForType(displayType) {
  return BED_OPTIONS_BY_TYPE[displayType] || ["All"];
}

/* Kept for backward compatibility if any other code imports it */
const BED_OPTIONS = ["All", "Studio", "1 BR", "2 BR", "3 BR", "4 BR", "5 BR", "6 BR", "7+ BR"];
const PROJECT_STAGES = ["All", "Off-Plan", "Under Construction", "Ready", "Completed"];
const BUILD_PCT_BUCKETS = ["0-25", "26-50", "51-75", "76-99"];

function getInternalTypes(displayType) {
  if (!displayType || displayType === "All") return null;
  return DISPLAY_TO_INTERNAL[displayType] || [displayType];
}

function getDisplayTypesForCategory(category) {
  return CATEGORY_TO_DISPLAY[category] || [];
}

function shouldShowConfiguration(category, displayType) {
  return category === "Residential" && UNIT_BASED_RESIDENTIAL.includes(displayType);
}

/* Helper ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â detect fake/placeholder RERA numbers and suppress display.
   Real RERA project numbers are typically 3-6 digits.
   Fake patterns: 10+ digit placeholders, repeating digits, sequential like 1234/5678 */
function isValidReraNumber(num) {
  if (!num) return false;
  const s = String(num).trim();
  if (s.length > 6) return false;
  if (/^(\d)\1+$/.test(s)) return false;
  if (/^(1234|5678|0000|9999)/.test(s)) return false;
  return /^\d{3,6}$/.test(s);
}

/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â
   DXB ANALYTICS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â DATA PLATFORM LAYER
   ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬
   Legal positioning: This is a DATA AGGREGATION platform, not advice.
   All data displayed is sourced from Dubai Land Department (DLD) records.
   No investment recommendations. No BUY/SELL verdicts.
   For advice, users must consult RERA-licensed consultants.
   ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */

/* Asset class ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â descriptive segmentation (like MLS tiers), not a score */
function describeAssetClass(p) {
  const ppsf = p.ppsf || 0;
  if (ppsf >= 3000) return { tier:"Ultra-Luxury Segment", color:"#D4A843" };
  if (ppsf >= 2000) return { tier:"Luxury Segment", color:"#F59E0B" };
  if (ppsf >= 1400) return { tier:"Premium Segment", color:"#14B8A6" };
  if (ppsf >= 900) return { tier:"Mid-Market Segment", color:"#10B981" };
  if (ppsf > 0) return { tier:"Affordable Segment", color:"#6B7280" };
  return { tier:"Segment Not Disclosed", color:"#6B7280" };
}

/* Construction stage ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â descriptive only, from DLD data */
function describeMarketStatus(p) {
  const pct = p.constructionPct || 0;
  if (p.status === "Sold Out") return { label:"Sold Out (per DLD)", color:"#EF4444" };
  if (p.lifecycleStage === "launching" || p.lifecycleStage === "announced") return { label:"Recently Launched", color:"#10B981" };
  if (pct >= 100 || p.status === "Ready") return { label:"Delivered", color:"#14B8A6" };
  if (pct >= 70) return { label:"Near Completion", color:"#F59E0B" };
  if (pct > 0) return { label:"Under Construction", color:"#8B5CF6" };
  return { label:"Off-Plan", color:"#6B7280" };
}

/* Location advantages ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â factual tags based on measurable distances */
function locationTags(p) {
  const out = [];
  if (p.distBeach != null && p.distBeach <= 1) out.push({ label:"Waterfront (<1km)", color:"#14B8A6" });
  if (p.distMetro != null && p.distMetro <= 0.8) out.push({ label:"Metro Walking Distance", color:"#10B981" });
  if (p.distDIFC != null && p.distDIFC <= 5) out.push({ label:"DIFC Proximity (<5km)", color:"#F59E0B" });
  if (p.distMall != null && p.distMall <= 1.5) out.push({ label:"Retail Access (<1.5km)", color:"#8B5CF6" });
  return out;
}

/* Unit mix percentages ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â derived from actual unit breakdown data */
function computeUnitMix(p) {
  const ub = Array.isArray(p.unitBreakdown) ? p.unitBreakdown : Object.entries(p.unitBreakdown||{}).map(([type,count])=>({type,count}));
  if (ub.length === 0) return null;
  const total = ub.reduce((s,u) => s + (u.count || 1), 0);
  return ub.map(u => ({
    type: u.type,
    pct: Math.round((u.count || 1) / total * 100),
    count: u.count || 1,
  }));
}

/* Community average PPSF ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â prefers DLD-computed median over legacy field */
function communityBenchmarkPPSF(p) {
  if (p.communityMedianPPSF) {
    return {
      value: p.communityMedianPPSF,
      p25: p.communityP25PPSF,
      p75: p.communityP75PPSF,
      source: `DLD ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${p.communityTxCount?.toLocaleString() || "N"} transactions ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${p.communityBenchmarkSource || "Recent"}`,
    };
  }
  if (p.communityAvgPPSF) return { value: p.communityAvgPPSF, source:"Legacy estimate" };
  return { value: null, source:"Not available ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â DLD benchmark pending" };
}

/* STR indicator ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â factual flag only (not a score) */
function strIndicator(p) {
  const t = (p.type || "").toLowerCase();
  if (t.includes("hotel")) return { flag:"Hotel Apartment", note:"Designated for short-term rental per developer licensing" };
  if (p.distBeach != null && p.distBeach <= 2) return { flag:"Tourist Zone", note:"Beach-adjacent micro-location" };
  if (/marina|downtown|creek|palm|blue ?waters/i.test(p.community || "")) return { flag:"Tourist District", note:"Historically high STR demand" };
  return { flag:"Residential Primary", note:"Area zoned primarily for long-term residence" };
}

/* Escrow status ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â factual DLD data */
function escrowStatus(p) {
  if (p.escrowAccount && p.escrowBank) return { verified:true, label:"DLD-Registered Escrow Active" };
  if (p.escrowBank) return { verified:true, label:"Escrow Bank Verified" };
  return { verified:false, label:"Escrow Details Pending" };
}

/* RERA compliance indicator */
function reraCompliance(p) {
  if (p.reraNo || p.reraProjectNumber || p.projectNumber) {
    return { verified:true, number: p.reraNo || p.reraProjectNumber || p.projectNumber };
  }
  return { verified:false };
}

/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â
   LEGAL DISCLAIMER ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â reusable component
   ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ */
function LegalNote({ T, compact }) {
  return (
    <div style={{ padding:compact ? "8px 12px" : "12px 16px", background:"rgba(107,114,128,0.08)", borderRadius:8, border:`1px solid ${T.border}`, marginTop:12 }}>
      <div style={{ fontSize:10, color:T.textMuted, lineHeight:1.6 }}>
        <strong style={{ color:T.textSecondary }}>Data Source:</strong> Dubai Land Department (DLD) public records and project filings. Information is provided for reference only and is not investment advice. For regulated advice, consult a RERA-licensed real estate consultant. DXB Analytics is a data aggregation platform and does not provide investment recommendations.
      </div>
    </div>
  );
}

function ProjectsTab({
  SEED_PROJECTS, liveProjects, extraProjects = [], developments = [],
  projSearch, setProjSearch,
  projDev, setProjDev,
  projCommunity, setProjCommunity,
  projStatus, setProjStatus,
  projBeds, setProjBeds,
  projHandover, setProjHandover,
  projSort, setProjSort,
  projGrade, setProjGrade,
  projMode, setProjMode,
  projView, setProjView,
  projPriceMin, setProjPriceMin, projPriceMax, setProjPriceMax,
  projCompare, setProjCompare,
  projIntelFilter, setProjIntelFilter,
  selectedProject, setSelectedProject,
  projDetailTab, setProjDetailTab,
  showCompare, setShowCompare,
  globalFilters = {},
  allDevelopers = [],
  handleTabChange,
  watchlist = [],
  liveNeighbourhoods = [],
  toggleWatchlist,
  // NEW FILTER SYSTEM props (Commit 3)
  projCategory = "All", setProjCategory = () => {},
  projBuildPct = "All", setProjBuildPct = () => {},
  projEscrow = "All", setProjEscrow = () => {},
  showMoreFilters = false, setShowMoreFilters = () => {},
}) {

  //    Community intelligence                                           
  const _commMap = React.useMemo(()=>{
    const m={};
    (liveNeighbourhoods||[]).forEach(n=>{ if(n.community) m[n.community.toLowerCase()]=n; });
    return m;
  },[liveNeighbourhoods]);
  const getCommunityData = React.useCallback((p)=>
    _commMap[(p?.community||"").toLowerCase()]||null
  ,[_commMap]);
  //                                                                      

  const [devSearch,    setDevSearch]    = React.useState("");
  const [showDevDrop,  setShowDevDrop]  = React.useState(false);
  const [commSearch2,  setCommSearch2]  = React.useState("");
  const [showCommDrop, setShowCommDrop] = React.useState(false);
  // Single source of truth for community data (Session 5 unification)
  const { data: allCommunitiesFromDb = [] } = useUserFacingCommunities();


  /* NEW FILTERS (v7) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â match data reality from audit:
     - lifecycleStage (100% coverage): Historical / Under Construction / Announced / Recently Delivered
     - escrowBank (94% coverage): 27 banks, strong trust signal
     - constructionBand (100% coverage): 0-25% / 25-50% / 50-75% / 75-100% / Completed
     These are self-contained because they don't need to persist across tabs. */
  const [projLifecycle, setProjLifecycle] = useState("All");
  const [projEscrowBank, setProjEscrowBank] = useState("All");
  const [projConstruction, setProjConstruction] = useState("All");
  /* Separate state for filter panel so it doesn't clobber grid/list view mode */
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* Phase 2.4 Batch 3: stack the top-bar global filter on top of the
     existing internal filter system. Both must match for a project to appear.

     Note: the type filter is NOT applied here, because Projects tab already
     has its own type pills (Apartment/Villa/etc). Users explicitly asked for
     the internal type pills to stay, so we skip the global type filter to
     avoid double-filtering. Instead, when the top bar picks a type, we mirror
     it into projMode (handled at the top bar level). */

  const gfDev = globalFilters?.developer && globalFilters.developer !== "all"
    ? String(globalFilters.developer).toLowerCase() : null;
  const gfCommunity = globalFilters?.community && globalFilters.community !== "all"
    ? String(globalFilters.community).toLowerCase() : null;
  const gfStatus = globalFilters?.status && globalFilters.status !== "all"
    ? String(globalFilters.status).toLowerCase() : null;
  const gfBeds = globalFilters?.beds && globalFilters.beds !== "all"
    ? String(globalFilters.beds).toLowerCase() : null;
  const gfPriceMin = Number(globalFilters?.priceMin) || 0;
  const gfPriceMax = Number(globalFilters?.priceMax) || 0;

  // Find developer by id/name to resolve its child entity names and communities
  const gfDeveloperRecord = gfDev
    ? (allDevelopers || []).find(d =>
        String(d.id || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase() === gfDev ||
        String(d.name || "").toLowerCase().includes(gfDev)
      )
    : null;
  const gfDeveloperName = gfDeveloperRecord?.name || null;
  /* Child entity names (for parent-brand grouping): when user picks
     "DAMAC Properties", match projects whose developer is any DAMAC SPV */
  const gfDeveloperChildNames = (gfDeveloperRecord && Array.isArray(gfDeveloperRecord._childNames))
    ? new Set(gfDeveloperRecord._childNames.map(n => String(n).toLowerCase()))
    : null;
  const gfDeveloperCommunities = (gfDeveloperRecord && Array.isArray(gfDeveloperRecord.communities))
    ? new Set(gfDeveloperRecord.communities.map(c => String(c).toLowerCase()))
    : null;

  /** Returns true if project passes the global filter (or if no global
      filter is active) */
  const projMatchesGlobalFilter = (p) => {
    if (!p) return false;

    // Developer filter: match if project's developer/developerName matches
    // the selected brand OR any of its child entity names (SPVs).
    if (gfDev) {
      const pDev = String(p.developer || "").toLowerCase();
      const pDevName = String(p.developerName || "").toLowerCase();
      const pCommunity = String(p.community || "").toLowerCase();
      const gfDevName = gfDeveloperName ? String(gfDeveloperName).toLowerCase() : "";

      /* Match against parent brand name or any child entity name */
      const matchesChildEntity = gfDeveloperChildNames &&
        (gfDeveloperChildNames.has(pDev) || gfDeveloperChildNames.has(pDevName));

      const developerMatches = matchesChildEntity ||
        (pDev && (pDev === gfDev || pDev === gfDevName || pDev.includes(gfDev))) ||
        (pDevName && (pDevName === gfDev || pDevName === gfDevName || pDevName.includes(gfDev)));

      const communityBelongsToDeveloper = gfDeveloperCommunities && gfDeveloperCommunities.has(pCommunity);
      if (!developerMatches && !communityBelongsToDeveloper) return false;
    }

    // Community filter
    if (gfCommunity) {
      if (String(p.community || "").toLowerCase() !== gfCommunity) return false;
    }

    // Status filter (e.g. "offplan", "ready") ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â fallback to lifecycleStage for DLD
    if (gfStatus) {
      const effectiveStatus = p.status || (
        p.lifecycleStage === "recently-delivered" || p.constructionPct >= 100 ? "Ready" :
        p.lifecycleStage === "historical" ? "Ready" :
        p.lifecycleStage === "under-construction" ? "Off-Plan" :
        p.lifecycleStage === "announced" ? "Off-Plan" :
        null
      );
      if (!effectiveStatus) return false;
      const ps = String(effectiveStatus).toLowerCase().replace(/[-\s]/g, "_");
      const gs = gfStatus.replace(/[-\s]/g, "_");
      if (ps !== gs) return false;
    }

    // Beds filter (e.g. "1 BR", "2 BR")
    if (gfBeds) {
      const beds = Array.isArray(p.beds) ? p.beds : (p.beds ? [p.beds] : []);
      if (!beds.some(b => {
        const normBed = String(b).toLowerCase().replace(/\s+/g, "");
        const normGf = gfBeds.replace(/\s+/g, "");
        return normBed === normGf;
      })) return false;
    }

    // Price range ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â only apply when project HAS priceMin (DLD records don't).
    // Records without price pass through unfiltered so user can still browse them.
    if (gfPriceMin > 0 && p.priceMin && Number(p.priceMin) < gfPriceMin) return false;
    if (gfPriceMax > 0 && p.priceMax && Number(p.priceMax) > gfPriceMax) return false;

    return true;
  };

  /* Lock body scroll when modal open */
  useEffect(() => {
    if (selectedProject) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = original; };
    }
  }, [selectedProject]);

  /* Escape closes modal */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && selectedProject) setSelectedProject(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedProject, setSelectedProject]);

  /* Phase 3.16: deep-link reader. When user arrives via /project/<id>,
     App.jsx ProjectRedirect passes location.state.openProjectId.
     Match against liveProjects + SEED_PROJECTS + extraProjects, auto-open. */
  const _location = useLocation();
  useEffect(() => {
    try {
      const wantedId = _location && _location.state && _location.state.openProjectId;
      if (!wantedId) return;
      if (selectedProject) return;
      const all = [
        ...((Array.isArray(liveProjects) ? liveProjects : [])),
        ...((Array.isArray(SEED_PROJECTS) ? SEED_PROJECTS : [])),
        ...((Array.isArray(extraProjects) ? extraProjects : [])),
      ];
      if (all.length === 0) return;
      const match = all.find(p => p && String(p.id || "") === String(wantedId));
      if (match) {
        setSelectedProject(match);
        try { window.history.replaceState({}, "", window.location.pathname); } catch {}
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_location, liveProjects, SEED_PROJECTS, extraProjects]);

  return (
    <>
      {(() => {

            /* Phase 4: merge all data sources ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â SEED (18 Verified) + DLD developments (2,798 Registry) + extras.
               Guard every spread with Array.isArray to prevent 'not iterable' crashes when props
               arrive as undefined/null (Firestore still loading). */
            const allSources = [
              ...(Array.isArray(SEED_PROJECTS) ? SEED_PROJECTS : []),
              ...(Array.isArray(developments) ? developments : []),
              ...(Array.isArray(liveProjects) ? liveProjects : []),
              ...(Array.isArray(extraProjects) ? extraProjects : []),
            ];
            /* De-dupe by id ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â live version wins over seed if same id */
            const seenIds = new Set();
            const rawProjects = allSources.filter(p => {
              if (!p) return false;
              if (!p.id) return true;
              if (seenIds.has(p.id)) return false;
              seenIds.add(p.id);
              return true;
            });

            /* Normalize type field across data sources.
               DLD records often have dldClass="unit" or propertyType="Flat"
               Seed records have type="Apartment"/"Villa" etc.
               Map everything to the 8 canonical types. */
            const normalizeType = (p) => {
              if (!p) return "Apartment";
              const t = String(p.type || p.propertyType || p.dldClass || "").toLowerCase();
              if (t.includes("villa")) return "Villa";
              if (t.includes("townhouse") || t.includes("town house")) return "Townhouse";
              if (t.includes("hotel")) return "Hotel Apartment";
              if (t.includes("office")) return "Office";
              if (t.includes("retail") || t.includes("shop")) return "Retail";
              if (t.includes("warehouse") || t.includes("industrial")) return "Warehouse";
              if (t.includes("land") || t.includes("plot")) return "Land";
              return "Apartment"; /* default ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â most DLD records are unit/flat = apartment */
            };

            const filtered = rawProjects.filter(p => {
              // Global top-bar filters first
              if (!projMatchesGlobalFilter(p)) return false;
              // Type filter ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â but skip when 'All' is selected
              if (projCategory && projCategory !== "All") { const dts = getDisplayTypesForCategory(projCategory); if (dts.length > 0 && !dts.includes(normalizeType(p))) return false; }
              if (projMode !== "All") { const its = getInternalTypes(projMode); if (its && its.length > 0) { const raw = String(p.type || p.propertyType || p.dldClass || "").toLowerCase(); const canon = normalizeType(p); if (!its.some(t => raw.includes(t.toLowerCase()) || t === canon)) return false; } else if (normalizeType(p) !== projMode) { return false; } }
              if (projSearch && !JSON.stringify(p).toLowerCase().includes(projSearch.toLowerCase())) return false;
              if (projDev !== "All" && p.developer !== projDev && p.developerName !== projDev) return false;
              if (projCommunity !== "All" && p.community !== projCommunity) return false;
              /* SALE STATUS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â fallback to lifecycleStage mapping for DLD records without status */
              if (projStatus !== "All") {
                const effectiveStatus = p.status || (
                  p.lifecycleStage === "recently-delivered" || p.constructionPct >= 100 ? "Ready" :
                  p.lifecycleStage === "historical" ? "Ready" :
                  p.lifecycleStage === "under-construction" ? "Off-Plan" :
                  p.lifecycleStage === "announced" ? "Off-Plan" :
                  null
                );
                if (effectiveStatus !== projStatus) return false;
              }
              /* NEW: Lifecycle Stage (100% DLD coverage) */
              if (projLifecycle !== "All" && p.lifecycleStage !== projLifecycle) return false;
              /* NEW: Escrow Bank (94% DLD coverage) */
              if (projEscrowBank !== "All" && p.escrowBank !== projEscrowBank) return false;
              /* NEW: Construction Progress (100% DLD coverage) */
              if (projConstruction !== "All") {
                const pct = p.constructionPct;
                if (pct == null) return false;
                if (projConstruction === "0-25" && (pct < 0 || pct >= 25)) return false;
                if (projConstruction === "25-50" && (pct < 25 || pct >= 50)) return false;
                if (projConstruction === "50-75" && (pct < 50 || pct >= 75)) return false;
                if (projConstruction === "75-99" && (pct < 75 || pct >= 100)) return false;
                if (projConstruction === "100" && pct < 100) return false;
              }
              if (projBeds !== "All") { const bedKey = projBeds.replace(" BR", "BR").replace("+", "").trim(); if (Array.isArray(p.beds) && p.beds.length > 0) { if (!p.beds.includes(projBeds) && !p.beds.includes(bedKey)) return false; } else if (p.bedConfig && typeof p.bedConfig === "object") { const c = p.bedConfig[bedKey] || p.bedConfig[projBeds]; if (!c || c === 0) return false; } else if (p.unitBreakdown && typeof p.unitBreakdown === "object") { const keys = Object.keys(p.unitBreakdown); const hit = keys.find(k => k.replace(" ","").toUpperCase() === bedKey.toUpperCase()); if (!hit || !p.unitBreakdown[hit]) return false; } }
              if (projHandover !== "All" && !String(p.handover || p.expectedHandover || "").includes(projHandover)) return false;
              if (projGrade !== "All" && p.officeGrade !== projGrade) return false;
              if (projIntelFilter === "tier1" && p.tier !== 1) return false;
              if (projIntelFilter === "gv" && !(p.goldenVisa && p.priceMin >= GOLDEN_VISA_THRESHOLD)) return false;
              if (projIntelFilter === "branded" && !p.branded) return false;
              // PRICE FILTER - range overlap + bed-aware
              if (projPriceMin > 0 || (projPriceMax > 0 && projPriceMax < 999999999)) {
                const userMin = projPriceMin || 0;
                const userMax = (projPriceMax && projPriceMax < 999999999) ? projPriceMax : Infinity;
                let matched = false;
                if (projBeds !== "All" && p.unitBreakdown && typeof p.unitBreakdown === "object" && !Array.isArray(p.unitBreakdown) && Object.keys(p.unitBreakdown).length > 0) {
                  const bedKey = projBeds.replace(" BR", "BR").replace("+", "").trim();
                  const unitKey = Object.keys(p.unitBreakdown).find(k => k.replace(" ","").toUpperCase() === bedKey.toUpperCase()); const unit = unitKey ? {type:unitKey, count:p.unitBreakdown[unitKey]} : null;
                  if (unit) {
                    const unitPrice = unit.priceMin || unit.priceFrom || 0;
                    if (unitPrice >= userMin && unitPrice <= userMax) matched = true;
                  } else {
                    const pMin = p.priceMin || 0;
                    const pMax = p.priceMax || Infinity;
                    if (pMax >= userMin && pMin <= userMax) matched = true;
                  }
                } else {
                  const pMin = p.priceMin || 0;
                  const pMax = p.priceMax || Infinity;
                  if (pMax >= userMin && pMin <= userMax) matched = true;
                }
                if (!matched) return false;
              }
              return true;
            }).sort((a,b) => {
              if (projSort === "yield") return (b.grossYield||0) - (a.grossYield||0);
              if (projSort === "score") return calcScore(b) - calcScore(a);
              if (projSort === "price_asc") return (a.priceMin || Infinity) - (b.priceMin || Infinity);
              if (projSort === "price_desc") return (b.priceMin || 0) - (a.priceMin || 0);
              if (projSort === "alphabetical") return (a.project || a.name || "").localeCompare(b.project || b.name || "");
              if (projSort === "recent") {
                const aDate = a.launchDate || a.projectStartDate || "";
                const bDate = b.launchDate || b.projectStartDate || "";
                return bDate.localeCompare(aDate);
              }
              /* Default 'relevance' ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â interleave: Research (enriched data) first, DLD second, within each group by score/data completeness */
              const aIsDld = String(a.id || "").startsWith("dld-") || a.dldSource;
              const bIsDld = String(b.id || "").startsWith("dld-") || b.dldSource;
              if (aIsDld !== bIsDld) return aIsDld ? 1 : -1; /* Research first */
              return calcScore(b) - calcScore(a);
            });

            const avgYield = filtered.length > 0 && filtered.some(p => p.grossYield > 0)
              ? (filtered.filter(p=>p.grossYield>0).reduce((a,p) => a + p.grossYield, 0) / filtered.filter(p=>p.grossYield>0).length).toFixed(1) : "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â";
            const avgPpsf = filtered.length > 0 && filtered.some(p=>p.ppsf)
              ? Math.round(filtered.filter(p=>p.ppsf).reduce((a,p) => a + p.ppsf, 0) / filtered.filter(p=>p.ppsf).length) : 0;

            // Use allDevelopers from Firestore for complete developer list
            const devOptions = allDevelopers && allDevelopers.length > 0
              ? ["All", ...allDevelopers
                  .filter(d => d.name && d.verified !== false)
                  .sort((a,b) => {
                    const ta = a.tier===1?0:a.tier===2?1:a.tier===3?2:3;
                    const tb = b.tier===1?0:b.tier===2?1:b.tier===3?2:3;
                    if(ta!==tb) return ta-tb;
                    return (b.totalProjects||0)-(a.totalProjects||0);
                  })
                  .map(d => d.name)
                ]
              : ["All", ...new Set(rawProjects.filter(p => projMode === "All" || normalizeType(p)===projMode).map(p=>p.developer||"").filter(Boolean))];
            // commOptions: tier-organized community list (Session 5 hierarchy)
            // Pulls from Firestore via useUserFacingCommunities, groups by displayCategory.
            // Sub-communities show parent prefix (e.g. "Dubai Hills Estate > Maple 1").
            const dbByName = new Map();
            (allCommunitiesFromDb || []).forEach(c => { if (c.name) dbByName.set(c.name, c); });
            const projectNames = new Set(rawProjects.filter(p => projMode === "All" || normalizeType(p)===projMode).map(p=>p.community).filter(Boolean));
            const allNames = new Set([...dbByName.keys(), ...projectNames]);
            const TIER_ORDER = { "consumer-community": 1, "master-community": 2, "sub-community": 3 };
            const enrichedComms = Array.from(allNames).map(name => {
              const doc = dbByName.get(name);
              const tier = doc?.displayCategory || "unknown";
              const parentId = doc?.parentCommunity || null;
              const parentDoc = parentId ? (allCommunitiesFromDb || []).find(c => c.id === parentId) : null;
              const parentName = parentDoc?.name || null;
              return {
                value: name,
                label: name,
                tier,
                tierOrder: TIER_ORDER[tier] || 99,
                parentName,
                projectCount: doc?.totalProjects || 0,
              };
            }).sort((a, b) => {
              if (a.tierOrder !== b.tierOrder) return a.tierOrder - b.tierOrder;
              return a.label.localeCompare(b.label);
            });
            const commOptionsByTier = {
              consumer: enrichedComms.filter(c => c.tier === "consumer-community"),
              master:   enrichedComms.filter(c => c.tier === "master-community"),
              sub:      enrichedComms.filter(c => c.tier === "sub-community"),
              other:    enrichedComms.filter(c => !TIER_ORDER[c.tier]),
            };
            // Legacy flat array kept for backward compat
            const commOptions = ["All", ...enrichedComms.map(c => c.value)].slice(0, 500);
            /* Escrow bank options with project counts ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â DLD enriched */
            const escrowCounts = {};
            rawProjects.forEach(p => {
              if (p.escrowBank) escrowCounts[p.escrowBank] = (escrowCounts[p.escrowBank] || 0) + 1;
            });
            const escrowOptionsData = [
              { value: "All", label: "Any escrow bank" },
              ...Object.entries(escrowCounts)
                .sort((a, b) => b[1] - a[1])  /* sort by count desc */
                .map(([bank, count]) => ({ value: bank, label: bank, count })),
            ];
            /* Legacy string array ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â kept for backward compat where other code reads it */
            const escrowOptions = ["All", ...Object.keys(escrowCounts).sort((a, b) => escrowCounts[b] - escrowCounts[a])];
            /* DYNAMIC HANDOVER YEARS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â extract actual years from data, include 2030+ */
            const handoverYearsFromData = new Set();
            const currentYear = new Date().getFullYear();
            rawProjects.forEach(p => {
              const handoverStr = String(p.handover || p.expectedHandover || p.handoverDate || "");
              const yearMatch = handoverStr.match(/20\d{2}/);
              if (yearMatch) handoverYearsFromData.add(yearMatch[0]);
            });
            /* Always include current year + next 4 years even if no data, plus any years from data */
            for (let y = currentYear; y <= currentYear + 4; y++) handoverYearsFromData.add(String(y));
            const handoverYearsSorted = [...handoverYearsFromData].sort();

            const selSt = {
              background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 10,
              color: T.white,
              fontFamily:"'Outfit',sans-serif",
              fontSize: 13,
              fontWeight: 500,
              padding:"10px 36px 10px 14px",
              outline:"none",
              cursor:"pointer",
              appearance:"none",
              WebkitAppearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a0a0a0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat",
              backgroundPosition:"right 12px center",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.2)",
              transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            };

            const StatusBadge = ({ status }) => {
              const cfg = { "Off-Plan":{ bg:"rgba(212,168,67,0.15)", color:T.gold }, "Ready":{ bg:"rgba(16,185,129,0.15)", color:T.green }, "Sold Out":{ bg:"rgba(255,255,255,0.08)", color:T.textMuted } }[status] || { bg:"rgba(212,168,67,0.1)", color:T.gold };
              return <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10, background:cfg.bg, color:cfg.color }}>{status}</span>;
            };

            /* DataCompletenessBadge ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â shows factual data completeness, NOT investment advice.
               Replaces the old ScoreCircle/scoreLabel which said "Strong Buy/Buy/Hold" =
               unlicensed investment advice under RERA law. */
            const DataCompletenessBadge = ({ p }) => {
              const isDld = String(p.id || "").startsWith("dld-") || p.dldSource;
              if (isDld) {
                return (
                  <div style={{ width:52, height:52, borderRadius:"50%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:`2px solid ${T.teal}`, background:"rgba(20,184,166,0.15)", flexShrink:0 }}>
                    <span style={{ fontSize:16, color:T.teal, lineHeight:1 }}>ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ</span>
                    <span style={{ fontSize:8, fontWeight:700, color:T.teal, marginTop:2 }}>DLD</span>
                  </div>
                );
              }
              /* Research-enriched: show data completeness indicator */
              let completeness = 0;
              if (p.priceMin) completeness++;
              if (p.ppsf) completeness++;
              if (p.grossYield) completeness++;
              if (p.paymentPlan) completeness++;
              if (Array.isArray(p.amenities) && p.amenities.length > 0) completeness++;
              const pct = Math.round(completeness / 5 * 100);
              return (
                <div style={{ width:52, height:52, borderRadius:"50%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:`2px solid ${T.gold}`, background:"rgba(212,168,67,0.12)", flexShrink:0 }}>
                  <span style={{ fontSize:13, fontWeight:900, color:T.gold, lineHeight:1 }}>{pct}%</span>
                  <span style={{ fontSize:7, fontWeight:700, color:T.gold, marginTop:1, letterSpacing:0.3 }}>DATA</span>
                </div>
              );
            };

            const ProjectCard = ({ p }) => {
              const score = calcScore(p);
              const inCompare = Array.isArray(projCompare) && projCompare.some(c => c.id === p.id);
              const isDldVerified = String(p.id || "").startsWith("dld-") || p.dldSource;
              return (
                <div className="chart-box" style={{ padding:0, overflow:"hidden", cursor:"pointer", position:"relative" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="rgba(212,168,67,0.4)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor=T.border}>
                  {/* DATA SOURCE BADGE ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â top-right corner */}
                  <div style={{ position:"absolute", top:10, right:10, zIndex:2 }}>
                    {isDldVerified ? (
                      <span style={{ fontSize:9, padding:"3px 8px", borderRadius:5, background:"rgba(20,184,166,0.12)", color:T.teal, fontWeight:700, border:`1px solid rgba(20,184,166,0.3)`, display:"inline-flex", alignItems:"center", gap:4 }}>
                        ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ DLD Verified
                      </span>
                    ) : (
                      <span style={{ fontSize:9, padding:"3px 8px", borderRadius:5, background:"rgba(212,168,67,0.08)", color:T.gold, fontWeight:700, border:`1px solid rgba(212,168,67,0.2)`, display:"inline-flex", alignItems:"center", gap:4 }}>
                        ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚Â  Research
                      </span>
                    )}
                  </div>
                  {/* Watchlist star - top-right below data source badge */}
                  {toggleWatchlist && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleWatchlist(p); }}
                      title={watchlist.some(w => w.id === p.id) ? "Remove from watchlist" : "Add to watchlist"}
                      style={{
                        position:"absolute", top:40, right:12, zIndex:2,
                        width:28, height:28, borderRadius:"50%",
                        background: watchlist.some(w => w.id === p.id) ? "rgba(212,168,67,0.18)" : "rgba(255,255,255,0.04)",
                        border: "1px solid " + (watchlist.some(w => w.id === p.id) ? "rgba(212,168,67,0.5)" : "rgba(255,255,255,0.1)"),
                        cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:14, color: watchlist.some(w => w.id === p.id) ? T.gold : T.textMuted,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(212,168,67,0.25)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = watchlist.some(w => w.id === p.id) ? "rgba(212,168,67,0.18)" : "rgba(255,255,255,0.04)"}
                    >
                      {watchlist.some(w => w.id === p.id) ? "ÃƒÆ’Ã‚Â¢Ãƒâ€¹Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦" : "ÃƒÆ’Ã‚Â¢Ãƒâ€¹Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã‚Â "}
                    </button>
                  )}
                  <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.border}` }} onClick={() => { setSelectedProject(p); setProjDetailTab("identity"); }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                      <div style={{ flex:1, paddingRight:70 /* room for DLD Verified badge */ }}>
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:3 }}>{(p.developer || p.developerName || "Unknown")}{"ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·"}{p.community || p.area || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:15, fontWeight:700, color:T.white, marginBottom:6 }}>{p.project || p.name || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
                          <StatusBadge status={p.status || (p.constructionPct >= 100 ? "Ready" : "Off-Plan")} />
                          {(p.handover || p.expectedHandover) && <span style={{ fontSize:10, color:T.textMuted }}>{p.handover || p.expectedHandover}</span>}
                          {Array.isArray(p.beds) && p.beds.length > 0 && <span style={{ fontSize:10, color:T.textMuted }}>{"ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·"}{p.beds.join(" / ")}</span>}
                          {isValidReraNumber(p.reraNo || p.projectNumber) && <span style={{ fontSize:9, color:T.teal }}>{"ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·"}DLD #{p.reraNo || p.projectNumber}</span>}
                        </div>
                        {/* Factual classification badges only ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â no investment advice */}
                        <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:6 }}>
                          {p.tier === 1 && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(16,185,129,0.12)", color:"#10B981", fontWeight:700 }}>Tier 1 Developer</span>}
                          {p.tier === 2 && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(245,158,11,0.12)", color:"#F59E0B", fontWeight:700 }}>Tier 2 Developer</span>}
                          {p.goldenVisa && p.priceMin >= GOLDEN_VISA_THRESHOLD && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(212,168,67,0.15)", color:T.gold, fontWeight:700 }}>ÃƒÆ’Ã‚Â¢Ãƒâ€¹Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Golden Visa Eligible</span>}
                          {p.branded && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(139,92,246,0.15)", color:"#A78BFA", fontWeight:700 }}>ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚Â  {p.brandPartner || "Branded"}</span>}
                          {p.escrowBank && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:5, background:"rgba(20,184,166,0.08)", color:T.teal, fontWeight:700 }}>Escrow ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ</span>}
                        </div>
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                        {/* Circle badge removed ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â top-right pill shows data source */}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}` }} onClick={() => { setSelectedProject(p); setProjDetailTab("identity"); }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8, marginBottom:10 }}>
                      <div>
                        <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:2 }}>
                          {p.priceMin ? "From" : p.communityMedianPrice ? "Community Median" : "From"}
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color:(p.priceMin || p.communityMedianPrice) ? T.white : T.textMuted }}>
                          {p.priceMin
                            ? "AED " + (p.priceMin/1000000).toFixed(1) + "M"
                            : p.communityMedianPrice
                              ? "AED " + (p.communityMedianPrice/1000000).toFixed(1) + "M"
                              : "Inquire"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:2 }}>
                          {p.ppsf ? "PPSF" : p.communityMedianPPSF ? "Community PPSF" : "PPSF"}
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color:(p.ppsf || p.communityMedianPPSF) ? T.white : T.textMuted }}>
                          {p.ppsf
                            ? "AED " + p.ppsf.toLocaleString()
                            : p.communityMedianPPSF
                              ? "AED " + p.communityMedianPPSF.toLocaleString()
                              : "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}
                        </div>
                        {!p.ppsf && p.communityMedianPPSF && p.communityTxCount && (
                          <div style={{ fontSize:8, color:T.teal, marginTop:1 }}>DLD ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· n={p.communityTxCount}</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:2 }}>
                          {p.grossYield ? "Yield" : p.totalUnits ? "Total Units" : "Yield"}
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color:p.grossYield >= 7 ? T.green : p.grossYield >= 5 ? T.gold : p.totalUnits ? T.white : T.textMuted }}>
                          {p.grossYield
                            ? p.grossYield.toFixed(1) + "%"
                            : p.totalUnits
                              ? p.totalUnits.toLocaleString()
                              : "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6, marginBottom:2 }}>
                          {p.paymentPlan ? "Payment" : p.constructionPct != null ? "Build" : "Status"}
                        </div>
                        <div style={{ fontSize:13, fontWeight:700, color:T.white }}>
                          {p.paymentPlan
                            ? p.paymentPlan
                            : p.constructionPct != null
                              ? p.constructionPct + "%"
                              : (p.status || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â")}
                        </div>
                      </div>
                    </div>
                    {/* Unit mini-breakdown on card (Research records) */}
                    {p.unitBreakdown && typeof p.unitBreakdown === "object" && Object.keys(p.unitBreakdown).length > 0 && (
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8, padding:"8px 10px", background:T.surfaceAlt, borderRadius:8 }}>
                        {Object.entries(p.unitBreakdown||{}).map(([type,count],i) => (
                          <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"4px 8px", background:"rgba(212,168,67,0.06)", borderRadius:6, border:`1px solid rgba(212,168,67,0.15)`, minWidth:64 }}>
                            <span style={{ fontSize:9, fontWeight:700, color:T.gold }}>{type}</span>
                            <span style={{ fontSize:12, color:T.white, fontWeight:600 }}>{count}</span>
                            <span style={{ fontSize:9, color:T.textMuted }}>units</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Community benchmark strip for DLD records (no unit mix but has DLD data) */}
                    {(!p.unitBreakdown || Object.keys(p.unitBreakdown||{}).length === 0) && p.communityMedianPPSF && (
                      <div style={{ display:"flex", gap:6, marginBottom:8, padding:"8px 10px", background:"rgba(20,184,166,0.05)", borderRadius:8, border:`1px solid rgba(20,184,166,0.15)`, alignItems:"center", justifyContent:"space-between" }}>
                        <div>
                          <div style={{ fontSize:9, fontWeight:700, color:T.teal, letterSpacing:0.5 }}>COMMUNITY DLD BENCHMARK</div>
                          <div style={{ fontSize:10, color:T.textMuted, marginTop:2, display:"flex", alignItems:"center", gap:6 }}>
                  <span>{p.community || p.area}</span>
                  {(() => {
                    const cn = getCommunityData(p);
                    if(!cn) return null;
                    const y = parseFloat(cn.grossYield||0);
                    const yColor = y>=7?"#10B981":y>=6?"#84CC16":y>=5?"#D4A843":"#94A3B8";
                    return (
                      <span style={{display:"inline-flex",gap:4,alignItems:"center"}}>
                        {y>0&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:yColor+"18",color:yColor,fontWeight:600}}>{y.toFixed(1)}%</span>}
                        {cn.investmentScore&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(212,168,67,0.12)",color:"#D4A843",fontWeight:600}}>Score {cn.investmentScore}</span>}
                        {cn.hasMetro&&<span style={{fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(16,185,129,0.1)",color:"#10B981",fontWeight:600}}>Metro</span>}
                      </span>
                    );
                  })()}
                </div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:12, color:T.white, fontWeight:700 }}>
                            {Math.round(count/(selectedProject.totalUnits||1)*100)}% of total
                          </div>
                          {p.communityP25PPSF && p.communityP75PPSF && (
                            <div style={{ fontSize:9, color:T.textMuted, marginTop:1 }}>
                              25thÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ75th: {p.communityP25PPSF.toLocaleString()}ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ{p.communityP75PPSF.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {typeof p.distMetro === "number" && p.distMetro > 0 && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:p.distMetro <= 0.8 ? "rgba(16,185,129,0.15)" : T.surfaceAlt, color:p.distMetro <= 0.8 ? T.green : T.textMuted }}>Metro {p.distMetro <= 0.8 ? "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°Ãƒâ€šÃ‚Â¤800m" : p.distMetro + "km"}</span>}
                      {typeof p.distBeach === "number" && p.distBeach > 0 && p.distBeach <= 2 && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:"rgba(20,184,166,0.12)", color:T.teal }}>Beach {p.distBeach < 1 ? (p.distBeach*1000).toFixed(0)+"m" : p.distBeach+"km"}</span>}
                      {typeof p.distDIFC === "number" && p.distDIFC > 0 && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:T.surfaceAlt, color:T.textMuted }}>DIFC {p.distDIFC}km</span>}
                      {p.constructionPct > 0 && p.status !== "Ready" && <span style={{ fontSize:10, padding:"2px 7px", borderRadius:8, background:"rgba(139,92,246,0.12)", color:"#8B5CF6" }}>{p.constructionPct}% built</span>}
                    </div>
                  </div>
                  {Array.isArray(p.amenities) && p.amenities.length > 0 && (
                    <div style={{ padding:"10px 16px", borderBottom:`1px solid ${T.border}`, display:"flex", gap:4, flexWrap:"wrap" }} onClick={() => { setSelectedProject(p); setProjDetailTab("identity"); }}>
                      {p.amenities.slice(0,4).map((a,i) => <span key={i} style={{ fontSize:10, padding:"2px 6px", borderRadius:6, background:T.surfaceAlt, color:T.textMuted }}>{a}</span>)}
                      {(Array.isArray(p.view) ? p.view : []).slice(0,2).map((v,i) => <span key={"v"+i} style={{ fontSize:10, padding:"2px 6px", borderRadius:6, background:"rgba(20,184,166,0.08)", color:T.teal }}>{v}</span>)}
                      {p.amenities.length > 4 && <span style={{ fontSize:10, color:T.textMuted }}>+{p.amenities.length-4}</span>}
                    </div>
                  )}
                  <div style={{ padding:"10px 12px", display:"flex", gap:6, flexWrap:"wrap" }}>
                    <button type="button" onClick={() => handleTabChange("Investment Score")} style={{ padding:"5px 10px", background:"rgba(212,168,67,0.08)", border:`1px solid ${T.border}`, borderRadius:7, color:T.gold, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>ROI ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢</button>
                    <button type="button" onClick={() => handleTabChange("Mortgage")} style={{ padding:"5px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textSecondary, fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Mortgage</button>
                    {p.status === "Off-Plan" && <button type="button" onClick={() => handleTabChange("Launch Calendar")} style={{ padding:"5px 10px", background:"rgba(212,168,67,0.08)", border:`1px solid ${T.gold}`, borderRadius:7, color:T.gold, fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>View Launch ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢</button>}
                    <button type="button" onClick={() => setProjCompare(prev => inCompare ? prev.filter(c=>c.id!==p.id) : prev.length < 3 ? [...prev,p] : prev)} style={{ padding:"5px 10px", background:inCompare?"rgba(16,185,129,0.12)":T.surfaceAlt, border:`1px solid ${inCompare?T.green:T.border}`, borderRadius:7, color:inCompare?T.green:T.textSecondary, fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>{inCompare?"ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Compare":"+ Compare"}</button>
                    <button type="button" onClick={() => handleTabChange("My Leads")} style={{ padding:"5px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textSecondary, fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Add Lead</button>
                    <button type="button" onClick={() => { setSelectedProject(p); setProjDetailTab("identity"); }} style={{ padding:"5px 10px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:7, color:T.textSecondary, fontSize:10, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Details ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢</button>
                  </div>
                </div>
              );
            };

            return (
              <div style={{ animation:"fadeUp 0.4s ease-out forwards" }}>
                {/* Header */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", marginBottom:16, borderBottom:`1px solid ${T.border}`, flexWrap:"wrap", gap:8 }}>
                  <div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>Project Explorer</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>All Dubai property types ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Investment intelligence ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Full project data</div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                  </div>
                </div>

                {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â
                   NEW PRIMARY FILTER BAR ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â 3-Layer Architecture
                   Category ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Type ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Configuration ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Price ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ More Filters
                   ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â */}
                <div style={{
                  display:"flex",
                  flexWrap:"wrap",
                  gap:12,
                  marginBottom: 12,
                  padding:"16px 18px",
                  background:"linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                  border:`1px solid rgba(255,255,255,0.06)`,
                  borderRadius:14,
                  alignItems:"flex-end",
                }}>
                  {/* Property Category */}
                  <div style={{ flex:"1 1 180px", minWidth:160 }}>
                    <div style={{ fontSize:10, color:T.textMuted, marginBottom:6, letterSpacing:0.5, textTransform:"uppercase", fontFamily:"'Outfit',sans-serif", fontWeight:600 }}>Property Category</div>
                    <select
                      value={projCategory}
                      onChange={e => {
                        setProjCategory(e.target.value);
                        setProjMode("All");
                        setProjBeds("All");
                      }}
                      style={{
                        width:"100%", padding:"10px 12px",
                        background:"rgba(255,255,255,0.04)",
                        border:`1px solid ${projCategory !== "All" ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius:8,
                        color: projCategory !== "All" ? T.gold : T.white,
                        fontSize:13, fontWeight: projCategory !== "All" ? 600 : 500,
                        fontFamily:"'Outfit',sans-serif",
                        cursor:"pointer",
                      }}>
                      <option value="All">All Categories</option>
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Land">Land</option>
                    </select>
                  </div>

                  {/* Property Type - depends on Category */}
                  <div style={{ flex:"1 1 180px", minWidth:160 }}>
                    <div style={{ fontSize:10, color:T.textMuted, marginBottom:6, letterSpacing:0.5, textTransform:"uppercase", fontFamily:"'Outfit',sans-serif", fontWeight:600 }}>Property Type</div>
                    <select
                      value={projMode}
                      onChange={e => { setProjMode(e.target.value); setProjBeds("All"); }}
                      disabled={projCategory === "All"}
                      style={{
                        width:"100%", padding:"10px 12px",
                        background:"rgba(255,255,255,0.04)",
                        border:`1px solid ${projMode !== "All" && projCategory !== "All" ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius:8,
                        color: projCategory === "All" ? T.textMuted : (projMode !== "All" ? T.gold : T.white),
                        fontSize:13, fontWeight: projMode !== "All" ? 600 : 500,
                        fontFamily:"'Outfit',sans-serif",
                        cursor: projCategory === "All" ? "not-allowed" : "pointer",
                        opacity: projCategory === "All" ? 0.5 : 1,
                      }}>
                      <option value="All">{projCategory === "All" ? "Select category first" : `All ${projCategory} Types`}</option>
                      {getDisplayTypesForCategory(projCategory).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Configuration ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â HIDDEN when not applicable */}
                  {shouldShowConfiguration(projCategory, projMode) ? (
                    <div style={{ flex:"1 1 140px", minWidth:120 }}>
                      <div style={{ fontSize:10, color:T.textMuted, marginBottom:6, letterSpacing:0.5, textTransform:"uppercase", fontFamily:"'Outfit',sans-serif", fontWeight:600 }}>Configuration</div>
                      <select
                        value={projBeds}
                        onChange={e => setProjBeds(e.target.value)}
                        style={{
                          width:"100%", padding:"10px 12px",
                          background:"rgba(255,255,255,0.04)",
                          border:`1px solid ${projBeds !== "All" ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.08)"}`,
                          borderRadius:8,
                          color: projBeds !== "All" ? T.gold : T.white,
                          fontSize:13, fontWeight: projBeds !== "All" ? 600 : 500,
                          fontFamily:"'Outfit',sans-serif",
                          cursor:"pointer",
                        }}>
                        {getBedOptionsForType(projMode).map(bed => (
                          <option key={bed} value={bed}>{bed === "All" ? "Any Beds" : bed}</option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  {/* Price Range */}
                  <div style={{ flex:"1 1 140px", minWidth:130 }}>
                    <div style={{ fontSize:10, color:T.textMuted, marginBottom:6, letterSpacing:0.5, textTransform:"uppercase", fontFamily:"'Outfit',sans-serif", fontWeight:600 }}>Price Range</div>
                    <select
                      value={projPriceMin + "-" + projPriceMax}
                      onChange={e => {
                        const [mn, mx] = e.target.value.split("-").map(Number);
                        if (typeof setProjPriceMin === "function") setProjPriceMin(mn);
                        if (typeof setProjPriceMax === "function") setProjPriceMax(mx);
                      }}
                      style={{
                        width:"100%", padding:"10px 12px",
                        background:"rgba(255,255,255,0.04)",
                        border:`1px solid ${(projPriceMin > 0 || (projPriceMax > 0 && projPriceMax < 999999999)) ? "rgba(212,168,67,0.4)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius:8,
                        color:T.white,
                        fontSize:13, fontWeight:500,
                        fontFamily:"'Outfit',sans-serif",
                        cursor:"pointer",
                      }}>
                      <option value="0-999999999">Any Price</option>
                      <option value="0-1000000">Under AED 1M</option>
                      <option value="1000000-2000000">AED 1M ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â 2M</option>
                      <option value="2000000-5000000">AED 2M ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â 5M</option>
                      <option value="5000000-10000000">AED 5M ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â 10M</option>
                      <option value="10000000-999999999">AED 10M+</option>
                    </select>
                  </div>

                  {/* More Filters button */}
                  <div style={{ flex:"0 0 150px" }}>
                    <div style={{ fontSize:10, color:"transparent", marginBottom:6 }}>&nbsp;</div>
                    <button
                      type="button"
                      onClick={() => setShowMoreFilters(!showMoreFilters)}
                      style={{
                        width:"100%", padding:"10px 14px",
                        background: showMoreFilters ? "rgba(212,168,67,0.18)" : "rgba(212,168,67,0.08)",
                        border:`1px solid rgba(212,168,67,0.4)`,
                        borderRadius:8,
                        color:T.gold,
                        fontSize:13, fontWeight:600,
                        fontFamily:"'Outfit',sans-serif",
                        cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                      }}>
                      More Filters {showMoreFilters ? "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â´" : "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“Ãƒâ€šÃ‚Â¾"}
                    </button>
                  </div>
                </div>

                {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â
                   MORE FILTERS PANEL ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â slides down when button clicked
                   Two sections: Refine By (gold) + Project Details (teal)
                   ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â */}
                {showMoreFilters && (
                  <div style={{
                    marginBottom: 14,
                    padding: 20,
                    background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
                    border: `1px solid rgba(255,255,255,0.06)`,
                    borderRadius: 14,
                    animation: "slideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}>
                    {/* REFINE BY section (gold) */}
                    <div style={{ marginBottom: 18 }}>
                      <div style={{
                        fontSize: 10, color: T.gold, fontWeight: 700,
                        letterSpacing: 1.2, textTransform: "uppercase",
                        marginBottom: 10, fontFamily: "'Outfit',sans-serif",
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <span style={{ width: 12, height: 2, background: T.gold, borderRadius: 1 }}></span>
                        Refine By
                      </div>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 12,
                      }}>
                        <div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>Developer</div>
                          <div style={{position:"relative"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid "+(projDev!=="All"?"rgba(212,168,67,0.4)":"rgba(255,255,255,0.08)"),borderRadius:8,cursor:"pointer"}}
                              onClick={()=>{setShowDevDrop(v=>!v);setDevSearch("");}}>
                              <span style={{flex:1,fontSize:13,color:projDev!=="All"?T.gold:T.white,fontFamily:"'Outfit',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{projDev==="All"?"All Developers":projDev}</span>
                              {projDev!=="All"&&<button type="button" onClick={e=>{e.stopPropagation();setProjDev("All");setShowDevDrop(false);}} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14,padding:0}}>x</button>}
                              <span style={{color:"#94A3B8",fontSize:10}}>v</span>
                            </div>
                            {showDevDrop&&(
                              <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#1a1f2e",border:"1px solid rgba(212,168,67,0.3)",borderRadius:8,zIndex:100,maxHeight:280,display:"flex",flexDirection:"column",marginTop:2}}>
                                <div style={{padding:"8px 10px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                                  <input autoFocus value={devSearch} onChange={e=>setDevSearch(e.target.value)}
                                    placeholder="Search developer..."
                                    style={{width:"100%",background:"none",border:"none",outline:"none",color:"#fff",fontSize:12,fontFamily:"'Outfit',sans-serif"}}/>
                                </div>
                                <div style={{overflowY:"auto",flex:1}}>
                                  {(devOptions||["All"]).filter(d=>d==="All"||d.toLowerCase().includes(devSearch.toLowerCase())).slice(0,30).map(d=>(
                                    <div key={d} onClick={()=>{setProjDev(d);setShowDevDrop(false);setDevSearch("");}}
                                      style={{padding:"9px 12px",cursor:"pointer",fontSize:12,color:d===projDev?T.gold:"#CBD5E1",background:d===projDev?"rgba(212,168,67,0.08)":"transparent",fontFamily:"'Outfit',sans-serif"}}
                                      onMouseEnter={e=>e.currentTarget.style.background="rgba(212,168,67,0.06)"}
                                      onMouseLeave={e=>e.currentTarget.style.background=d===projDev?"rgba(212,168,67,0.08)":"transparent"}
                                    >{d==="All"?"All Developers":d}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>Community</div>
                          <div style={{position:"relative"}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid "+(projCommunity!=="All"?"rgba(212,168,67,0.4)":"rgba(255,255,255,0.08)"),borderRadius:8,cursor:"pointer"}} onClick={()=>{setShowCommDrop(v=>!v);setCommSearch2("");}}>
                              <span style={{flex:1,fontSize:13,color:projCommunity!=="All"?T.gold:T.white,fontFamily:"'Outfit',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{projCommunity==="All"?"All Communities":projCommunity}</span>
                              {projCommunity!=="All"&&<button type="button" onClick={e=>{e.stopPropagation();setProjCommunity("All");setShowCommDrop(false);}} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14,padding:0}}>x</button>}
                              <span style={{color:"#94A3B8",fontSize:10}}>v</span>
                            </div>
                            {showCommDrop&&(
                              <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#1a1f2e",border:"1px solid rgba(212,168,67,0.3)",borderRadius:8,zIndex:100,maxHeight:280,display:"flex",flexDirection:"column",marginTop:2}}>
                                <div style={{padding:"8px 10px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                                  <input autoFocus value={commSearch2} onChange={e=>setCommSearch2(e.target.value)} placeholder="Search community..." style={{width:"100%",background:"none",border:"none",outline:"none",color:"#fff",fontSize:12,fontFamily:"'Outfit',sans-serif"}}/>
                                </div>
                                <div style={{overflowY:"auto",flex:1}}>
                                  {[{value:"All",label:"All Communities"},...(commOptionsByTier.consumer||[]),...(commOptionsByTier.master||[]),...(commOptionsByTier.sub||[]),...(commOptionsByTier.other||[])].filter(c=>c.value==="All"||c.label.toLowerCase().includes(commSearch2.toLowerCase())).slice(0,40).map(c=>(
                                    <div key={c.value} onClick={()=>{setProjCommunity(c.value);setShowCommDrop(false);setCommSearch2("");}} style={{padding:"9px 12px",cursor:"pointer",fontSize:12,color:c.value===projCommunity?T.gold:"#CBD5E1",background:c.value===projCommunity?"rgba(212,168,67,0.08)":"transparent",fontFamily:"'Outfit',sans-serif"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(212,168,67,0.06)"} onMouseLeave={e=>e.currentTarget.style.background=c.value===projCommunity?"rgba(212,168,67,0.08)":"transparent"}>
                                      {c.label}{c.projectCount>0?` ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${c.projectCount}`:""}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    </div>

                    {/* PROJECT DETAILS section (teal) */}
                    <div style={{ paddingTop: 16, borderTop: `1px solid rgba(255,255,255,0.06)` }}>
                      <div style={{
                        fontSize: 10, color: T.teal, fontWeight: 700,
                        letterSpacing: 1.2, textTransform: "uppercase",
                        marginBottom: 10, fontFamily: "'Outfit',sans-serif",
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        <span style={{ width: 12, height: 2, background: T.teal, borderRadius: 1 }}></span>
                        Project Details
                      </div>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 12,
                      }}>
                        <div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>Project Stage</div>
                          <select value={projLifecycle} onChange={e => setProjLifecycle(e.target.value)} style={{
                            width: "100%", padding: "10px 12px",
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid ${projLifecycle !== "All" ? "rgba(20,184,166,0.4)" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: 8,
                            color: projLifecycle !== "All" ? T.teal : T.white,
                            fontSize: 13, fontWeight: projLifecycle !== "All" ? 600 : 500,
                            fontFamily: "'Outfit',sans-serif", cursor: "pointer",
                          }}>
                            <option value="All">All Stages</option>
                            <option value="announced">Announced / Pre-Launch</option>
                            <option value="under-construction">Under Construction</option>
                            <option value="recently-delivered">Recently Delivered</option>
                            <option value="historical">Historical / Completed</option>
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>Handover Year</div>
                          <select value={projHandover} onChange={e => setProjHandover(e.target.value)} style={{
                            width: "100%", padding: "10px 12px",
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid ${projHandover !== "All" ? "rgba(20,184,166,0.4)" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: 8,
                            color: projHandover !== "All" ? T.teal : T.white,
                            fontSize: 13, fontWeight: projHandover !== "All" ? 600 : 500,
                            fontFamily: "'Outfit',sans-serif", cursor: "pointer",
                          }}>
                            <option value="All">Any Year</option>
                            {Array.from({length: 20}, (_, i) => 2026 + i).map(y => (
                              <option key={y} value={String(y)}>{y}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>Build Progress</div>
                          <select value={projConstruction} onChange={e => setProjConstruction(e.target.value)} style={{
                            width: "100%", padding: "10px 12px",
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid ${projConstruction !== "All" ? "rgba(20,184,166,0.4)" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: 8,
                            color: projConstruction !== "All" ? T.teal : T.white,
                            fontSize: 13, fontWeight: projConstruction !== "All" ? 600 : 500,
                            fontFamily: "'Outfit',sans-serif", cursor: "pointer",
                          }}>
                            <option value="All">Any Progress</option>
                            <option value="0-25">0 - 25%</option>
                            <option value="25-50">25 - 50%</option>
                            <option value="50-75">50 - 75%</option>
                            <option value="75-99">75 - 99%</option>
                            <option value="100">100% Complete</option>
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase", fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>Escrow Bank</div>
                          <select value={projEscrowBank} onChange={e => setProjEscrowBank(e.target.value)} style={{
                            width: "100%", padding: "10px 12px",
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid ${projEscrowBank !== "All" ? "rgba(20,184,166,0.4)" : "rgba(255,255,255,0.08)"}`,
                            borderRadius: 8,
                            color: projEscrowBank !== "All" ? T.teal : T.white,
                            fontSize: 13, fontWeight: projEscrowBank !== "All" ? 600 : 500,
                            fontFamily: "'Outfit',sans-serif", cursor: "pointer",
                          }}>
                            {(escrowOptions || ["All"]).map(b => (
                              <option key={b} value={b}>{b === "All" ? "Any Bank" : b}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â PROPERTY TYPE TABS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â premium pill design ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â */}


                {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â PROJECTS CONTROL BAR ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â clean unified design, no duplicate search ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â */}
                {(() => {
                  const activeFilters = [];
                  /* GLOBAL FILTERS from top bar ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â shown as chips so user sees what's applied */
                  if (globalFilters?.developer && globalFilters.developer !== "all") {
                    const devName = (allDevelopers || []).find(d => String(d.id).toLowerCase() === String(globalFilters.developer).toLowerCase())?.name || globalFilters.developer;
                    activeFilters.push({ key:"gDev", label:devName, global:true });
                  }
                  if (globalFilters?.community && globalFilters.community !== "all") activeFilters.push({ key:"gCom", label:globalFilters.community, global:true });
                  if (globalFilters?.status && globalFilters.status !== "all") activeFilters.push({ key:"gSts", label:globalFilters.status, global:true });
                  if (globalFilters?.beds && globalFilters.beds !== "all") activeFilters.push({ key:"gBed", label:globalFilters.beds, global:true });
                  if (globalFilters?.priceMin > 0 || globalFilters?.priceMax > 0) {
                    const lbl = globalFilters.priceMin > 0 && globalFilters.priceMax > 0
                      ? `AED ${(globalFilters.priceMin/1000000).toFixed(1)}MÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ${(globalFilters.priceMax/1000000).toFixed(1)}M`
                      : globalFilters.priceMin > 0 ? `From AED ${(globalFilters.priceMin/1000000).toFixed(1)}M`
                      : `Up to AED ${(globalFilters.priceMax/1000000).toFixed(1)}M`;
                    activeFilters.push({ key:"gPrice", label:lbl, global:true });
                  }
                  if (projLifecycle !== "All") activeFilters.push({ key:"lfc", label:projLifecycle === "under-construction" ? "Under construction" : projLifecycle === "recently-delivered" ? "Recently delivered" : projLifecycle.charAt(0).toUpperCase()+projLifecycle.slice(1), clear:() => setProjLifecycle("All") });
                  if (projConstruction !== "All") activeFilters.push({ key:"cst", label:projConstruction === "100" ? "Completed" : projConstruction + "%", clear:() => setProjConstruction("All") });
                  if (projEscrowBank !== "All") activeFilters.push({ key:"esc", label:projEscrowBank, clear:() => setProjEscrowBank("All") });
                  if (projHandover !== "All") activeFilters.push({ key:"hnd", label:`Handover ${projHandover}`, clear:() => setProjHandover("All") });
                  if (projGrade !== "All") activeFilters.push({ key:"grd", label:`Grade ${projGrade}`, clear:() => setProjGrade("All") });
                  if (projIntelFilter !== "all") activeFilters.push({ key:"int", label:projIntelFilter === "tier1" ? "Tier 1 only" : projIntelFilter === "gv" ? "Golden Visa" : projIntelFilter === "branded" ? "Branded residences" : projIntelFilter, clear:() => setProjIntelFilter("all") });
                  // NEW FILTER SYSTEM chips
                  if (projCategory !== "All") activeFilters.push({ key:"cat", label:projCategory, clear:() => { setProjCategory("All"); setProjMode("All"); setProjBeds("All"); } });
                  if (projMode !== "All") activeFilters.push({ key:"typ", label:projMode, clear:() => { setProjMode("All"); setProjBeds("All"); } });
                  if (projBeds !== "All") activeFilters.push({ key:"bed", label:projBeds, clear:() => setProjBeds("All") });
                  if (projPriceMin > 0 || (projPriceMax > 0 && projPriceMax < 999999999)) {
                    const toM = n => (n/1000000).toFixed(n >= 10000000 ? 0 : 1) + "M";
                    const priceLabel = projPriceMin > 0 && projPriceMax < 999999999
                      ? `AED ${toM(projPriceMin)}-${toM(projPriceMax)}`
                      : projPriceMin > 0 ? `From AED ${toM(projPriceMin)}`
                      : `Up to AED ${toM(projPriceMax)}`;
                    activeFilters.push({ key:"prc", label:priceLabel, clear:() => { if(setProjPriceMin) setProjPriceMin(0); if(setProjPriceMax) setProjPriceMax(999999999); } });
                  }
                  if (projDev !== "All") activeFilters.push({ key:"dev", label:projDev, clear:() => setProjDev("All") });
                  if (projCommunity !== "All") activeFilters.push({ key:"com", label:projCommunity, clear:() => setProjCommunity("All") });
                  if (projStatus !== "All") activeFilters.push({ key:"sts", label:projStatus, clear:() => setProjStatus("All") });
                  const localActiveCount = activeFilters.filter(f => !f.global).length;
                  const anyActive = activeFilters.length > 0;
                  return (
                    <>
                      {/* CONTROL BAR ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â single row */}
                      <div style={{
                        display:"flex", alignItems:"center", gap:12, flexWrap:"wrap",
                        marginBottom: anyActive ? 10 : 16,
                        padding: "12px 18px",
                        background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                        border: `1px solid rgba(255,255,255,0.08)`,
                        borderRadius: 16,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                      }}>


                        <select value={projSort} onChange={e => setProjSort(e.target.value)} style={selSt} title="Sort order">
                          <option value="score">Relevance</option>
                          <option value="yield">Yield: high to low</option>
                          <option value="price_asc">Price: low to high</option>
                          <option value="price_desc">Price: high to low</option>
                          <option value="alphabetical">Name: AÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œZ</option>
                          <option value="recent">Recently launched</option>
                        </select>

                        <div style={{
                          display:"flex", gap:2,
                          background: "linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                          border: `1px solid rgba(255,255,255,0.1)`,
                          borderRadius: 10, padding: 3,
                        }}>
                          {[
                            { k:"grid", icon:(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>) },
                            { k:"list", icon:(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>) },
                          ].map(v => (
                            <button key={v.k} type="button" onClick={() => setProjView(v.k)}
                              style={{
                                padding:"7px 12px",
                                background: projView===v.k ? "rgba(212,168,67,0.2)" : "transparent",
                                border: "none", borderRadius: 7,
                                color: projView===v.k ? T.gold : T.textMuted,
                                cursor: "pointer",
                                display:"flex", alignItems:"center",
                                transition: "all 0.15s",
                              }}>{v.icon}</button>
                          ))}
                        </div>

                        <span style={{ fontSize:13, color:T.textMuted, marginLeft:"auto", fontWeight:500, fontFamily:"'Outfit',sans-serif" }}>
                          <span style={{ color:T.white, fontWeight:700 }}>{filtered.length.toLocaleString()}</span>
                          <span style={{ opacity:0.6 }}> of {rawProjects.length.toLocaleString()} projects</span>
                        </span>
                      </div>

                      {anyActive && (
                        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16, alignItems:"center" }}>
                          {activeFilters.map(f => (
                            f.global ? (
                              <span key={f.key} title="Applied from top filter bar" style={{
                                display: "inline-flex", alignItems: "center", gap: 6,
                                padding: "6px 14px",
                                background: "linear-gradient(145deg, rgba(20,184,166,0.15) 0%, rgba(20,184,166,0.08) 100%)",
                                border: `1px solid rgba(20,184,166,0.25)`,
                                borderRadius: 20,
                                color: T.teal,
                                fontSize: 12, fontWeight: 600,
                                fontFamily: "'Outfit',sans-serif",
                                cursor: "help",
                                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                              }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                                  <polyline points="18 15 12 9 6 15" />
                                </svg>
                                {f.label}
                              </span>
                            ) : (
                              <span key={f.key} style={{
                                display: "inline-flex", alignItems: "center", gap: 8,
                                padding: "6px 6px 6px 14px",
                                background: "linear-gradient(145deg, rgba(212,168,67,0.18) 0%, rgba(212,168,67,0.10) 100%)",
                                border: `1px solid rgba(212,168,67,0.3)`,
                                borderRadius: 20,
                                color: T.gold,
                                fontSize: 12, fontWeight: 600,
                                fontFamily: "'Outfit',sans-serif",
                                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                              }}>
                                {f.label}
                                <button type="button" onClick={f.clear} style={{
                                  background: "rgba(212,168,67,0.15)", border: "none",
                                  color: T.gold, cursor: "pointer",
                                  width: 18, height: 18, borderRadius: "50%",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  padding: 0, fontSize: 14, lineHeight: 1,
                                }}>ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â</button>
                              </span>
                            )
                          ))}
                          {localActiveCount > 0 && (
                            <button type="button" onClick={() => { setProjHandover("All"); setProjGrade("All"); setProjIntelFilter("all"); setProjLifecycle("All"); setProjEscrowBank("All"); setProjConstruction("All"); setProjCategory("All"); setProjMode("All"); setProjBeds("All"); setProjDev("All"); setProjCommunity("All"); setProjStatus("All"); setProjSearch(""); if(setProjPriceMin) setProjPriceMin(0); if(setProjPriceMax) setProjPriceMax(999999999); }}
                              title="Clear Projects-specific filters"
                              style={{
                                background: "transparent",
                                border: `1px solid rgba(255,255,255,0.1)`,
                                borderRadius: 20,
                                padding: "6px 14px",
                                color: T.textMuted,
                                fontSize: 12, fontWeight: 500,
                                cursor: "pointer",
                                fontFamily: "'Outfit',sans-serif",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={e => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
                              onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
                              Clear project filters
                            </button>
                          )}
                        </div>
                      )}


                    </>
                  );
                })()}

                {/* COMPACT INLINE STATS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â honest labeling per DLD data subset */}
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16, padding:"10px 14px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:10 }}>
                  {(() => {
                    const priced = filtered.filter(p => p.priceMin && isFinite(p.priceMin));
                    const withYield = filtered.filter(p => p.grossYield > 0);
                    const withPpsf = filtered.filter(p => p.ppsf > 0);
                    const withBench = filtered.filter(p => p.communityMedianPPSF);
                    const minPrice = priced.length > 0 ? Math.min(...priced.map(p => p.priceMin)) : null;
                    return [
                      { label:"Total", value:filtered.length.toLocaleString(), sub:"projects", color:T.white },
                      { label:"Priced From", value:minPrice ? `AED ${(minPrice/1000000).toFixed(1)}M` : "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â", sub:priced.length > 0 ? `${priced.length} priced` : "0 priced", color:T.gold },
                      { label:"Avg Yield", value:withYield.length > 0 ? (withYield.reduce((a,p) => a+p.grossYield, 0)/withYield.length).toFixed(1) + "%" : "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â", sub:`n=${withYield.length} disclosed`, color:T.green },
                      { label:"Community PPSF", value:withBench.length > 0 ? "AED " + Math.round(withBench.reduce((a,p) => a+p.communityMedianPPSF, 0)/withBench.length).toLocaleString() : "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â", sub:`DLD ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· n=${withBench.length}`, color:T.teal },
                    ].map((kpi,i) => (
                      <div key={i} style={{ display:"flex", flexDirection:"column", padding:"4px 14px", borderRight:i < 3 ? `1px solid ${T.border}` : "none" }}>
                        <div style={{ display:"flex", alignItems:"baseline", gap:6 }}>
                          <span style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.5, textTransform:"uppercase" }}>{kpi.label}</span>
                          <span style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:800, color:kpi.color }}>{kpi.value}</span>
                        </div>
                        <span style={{ fontSize:9, color:T.textMuted, marginTop:2 }}>{kpi.sub}</span>
                      </div>
                    ));
                  })()}
                </div>

                {/* Compare bar */}
                {Array.isArray(projCompare) && projCompare.length > 0 && (
                  <div style={{ background:"rgba(212,168,67,0.06)", border:`1px solid rgba(212,168,67,0.2)`, borderRadius:10, padding:"10px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:T.gold }}>Comparing {projCompare.length}/3:</span>
                    {projCompare.map((p,i) => (
                      <span key={i} style={{ fontSize:11, padding:"3px 10px", borderRadius:10, background:"rgba(212,168,67,0.1)", color:T.white, display:"flex", alignItems:"center", gap:6 }}>
                        {p.project?.substring(0,20)}
                        <button type="button" onClick={() => setProjCompare(prev => prev.filter(c=>c.id!==p.id))} style={{ background:"none", border:"none", color:T.textMuted, cursor:"pointer", fontSize:12, padding:0 }}>ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â</button>
                      </span>
                    ))}
                    <div style={{ display:"flex", gap:8, marginLeft:"auto" }}>
                      {projCompare.length >= 2 && (
                        <button type="button" onClick={() => setShowCompare(true)}
                          style={{ padding:"7px 16px", background:`linear-gradient(135deg, ${T.gold}, #B8922A)`, border:"none", borderRadius:8, color:"#000", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                          View Comparison ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢
                        </button>
                      )}
                      <button type="button" onClick={() => setProjCompare([])} style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, padding:"5px 10px", color:T.textMuted, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Clear</button>
                    </div>
                  </div>
                )}

                {/* DATA TIER DISCLOSURE ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â honest two-tier data source labeling */}
                <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, background:"rgba(20,184,166,0.04)", border:`1px solid ${T.border}`, marginBottom:14, flexWrap:"wrap" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:12, color:T.teal, fontWeight:800 }}>ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ</span>
                    <span style={{ fontSize:11, color:T.textSecondary }}><strong style={{ color:T.teal }}>DLD-Verified:</strong> Auto-imported from Dubai Land Department registry. Government-backed core data.</span>
                  </div>
                  <div style={{ width:1, height:14, background:T.border, margin:"0 4px" }} />
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:12, color:T.gold, fontWeight:800 }}>ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚Â </span>
                    <span style={{ fontSize:11, color:T.textSecondary }}><strong style={{ color:T.gold }}>Research-Enriched:</strong> Additional details curated from developer portals, Bayut, Property Finder.</span>
                  </div>
                </div>

                {/* Phase 3.7: Smart empty state ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â suggests which filter to remove */}
                {filtered.length === 0 && (
                  <SmartEmptyState
                    rowsAll={rawProjects}
                    filters={{
                      type: projMode,
                      developer: projDev !== "All" ? projDev : "all",
                      community: projCommunity !== "All" ? projCommunity : "all",
                      beds: projBeds !== "All" ? projBeds : "all",
                      status: projStatus !== "All" ? projStatus : "all",
                      priceMin: projPriceMin || 0,
                      priceMax: projPriceMax || 0,
                    }}
                    entityLabel={projMode + " projects"}
                    onRemoveFilter={(key) => {
                      if (key === "developer") setProjDev("All");
                      else if (key === "community") setProjCommunity("All");
                      else if (key === "beds") setProjBeds("All");
                      else if (key === "status") setProjStatus("All");
                      else if (key === "type") { /* keep ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â type is projMode, not a removable filter here */ }
                    }}
                    onClearAll={() => {
                      setProjSearch("");
                      setProjDev("All");
                      setProjCommunity("All");
                      setProjBeds("All");
                      setProjStatus("All");
                      setProjGrade("All");
                      setProjHandover("All");
                      setProjIntelFilter("all");
                      setProjLifecycle("All");
                      setProjEscrowBank("All");
                      setProjConstruction("All");
                    }}
                    matchFn={(p, filters) => {
                      if (p.type !== filters.type) return false;
                      if (filters.developer !== "all" && p.developer !== filters.developer) return false;
                      if (filters.community !== "all" && p.community !== filters.community) return false;
                      if (filters.status !== "all" && p.status !== filters.status) return false;
                      if (filters.beds !== "all" && p.beds && p.beds.length > 0 && !p.beds.includes(filters.beds)) return false;
                      if (filters.priceMin > 0 && p.priceMin < filters.priceMin) return false;
                      if (filters.priceMax > 0 && p.priceMax > filters.priceMax) return false;
                      return true;
                    }}
                    T={T}
                  />
                )}

                {/* Grid */}
                {filtered.length > 0 && projView === "grid" && (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px,1fr))", gap:16, marginBottom:20 }}>
                    {filtered.map((p,i) => <ProjectCard key={p.id||i} p={p} />)}
                  </div>
                )}

                {/* List - upgraded: 9 cols, build % bar, badges, color-coded handover */}
                {filtered.length > 0 && projView === "list" && (
                  <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:20 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"2.2fr 1.3fr 0.9fr 0.9fr 0.8fr 0.9fr 1fr 1fr 0.9fr", padding:"10px 14px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}`, gap:8 }}>
                      {["Project","Developer","From","PPSF","Yield","Plan","Handover","Build %","Score"].map((h,i) => (
                        <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase" }}>{h}</div>
                      ))}
                    </div>
                    {filtered.map((p,i) => {
                      const sc = calcScore(p);
                      const tnum = { fontFeatureSettings: "'tnum'" };
                      const hoStr = String(p.handover || p.expectedHandover || "");
                      const hoYear = parseInt((hoStr.match(/\d{4}/) || [])[0] || "0");
                      const nowYear = new Date().getFullYear();
                      const hoColor = (!hoStr || hoStr.toLowerCase().includes("ready") || p.status === "Ready") ? T.teal
                                     : hoYear && hoYear <= nowYear + 1 ? T.gold
                                     : hoYear && hoYear <= nowYear + 2 ? T.textSecondary
                                     : T.textMuted;
                      const yieldBg = p.grossYield >= 7 ? "rgba(16,185,129,0.08)" : p.grossYield >= 5 ? "rgba(212,168,67,0.06)" : "transparent";
                      const yieldColor = p.grossYield >= 7 ? T.green : p.grossYield >= 5 ? T.gold : T.textSecondary;
                      const buildPct = p.constructionPct != null ? p.constructionPct : null;
                      const buildColor = buildPct >= 100 ? T.green : buildPct >= 75 ? T.gold : buildPct >= 25 ? T.teal : T.textMuted;
                      return (
                        <div key={p.id||i} onClick={() => { setSelectedProject(p); setProjDetailTab("identity"); }}
                          style={{ display:"grid", gridTemplateColumns:"2.2fr 1.3fr 0.9fr 0.9fr 0.8fr 0.9fr 1fr 1fr 0.9fr", padding:"12px 14px", borderBottom:i<filtered.length-1?`1px solid ${T.border}`:"none", cursor:"pointer", alignItems:"center", gap:8, transition:"background 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.background="rgba(212,168,67,0.06)"}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                          <div style={{ minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                              <div style={{ fontSize:13, fontWeight:600, color:T.white, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.project || p.name}</div>
                              {p.verified && <span title="Verified" style={{ fontSize:9, color:T.green, fontWeight:700 }}>{"\u2713"}</span>}
                              {p.dataQuality === "research-verified" && <span title="Research-enriched" style={{ fontSize:9, color:T.gold }}>{"\u25C6"}</span>}
                              {p.tier === 1 && <span title="Tier 1 developer" style={{ fontSize:8, padding:"1px 5px", borderRadius:4, background:"rgba(16,185,129,0.12)", color:T.green, fontWeight:700 }}>T1</span>}
                              {p.goldenVisa && p.priceMin >= GOLDEN_VISA_THRESHOLD && <span title="Golden Visa eligible" style={{ fontSize:9, color:T.gold }}>{"\u2605"}</span>}
                            </div>
                            <div style={{ fontSize:11, color:T.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.community || p.area || "-"}</div>
                          </div>
                          <div style={{ fontSize:12, color:T.textSecondary, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.developer || p.developerName || "-"}</div>
                          <div style={{ fontSize:13, color:T.white, fontWeight:600, ...tnum }}>{p.priceMin ? "AED " + (p.priceMin/1000000).toFixed(1) + "M" : "-"}</div>
                          <div style={{ fontSize:13, color:T.gold, fontWeight:600, ...tnum }}>{p.ppsf ? (p.ppsf).toLocaleString() : "-"}</div>
                          <div style={{ fontSize:13, fontWeight:700, color:yieldColor, background:yieldBg, padding:"3px 8px", borderRadius:6, textAlign:"center", ...tnum }}>{p.grossYield ? p.grossYield.toFixed(1)+"%" : "-"}</div>
                          <div style={{ fontSize:12, color:T.textSecondary, ...tnum }}>{p.paymentPlan || "-"}</div>
                          <div style={{ fontSize:12, color:hoColor, fontWeight:hoColor===T.gold||hoColor===T.teal?700:500 }}>{hoStr || "-"}</div>
                          <div>
                            {buildPct != null ? (
                              <>
                                <div style={{ fontSize:11, color:buildColor, fontWeight:700, marginBottom:3, ...tnum }}>{buildPct}%</div>
                                <div style={{ height:4, background:T.surfaceAlt, borderRadius:2, overflow:"hidden" }}>
                                  <div style={{ width:buildPct+"%", height:"100%", background:buildColor, transition:"width 0.3s" }} />
                                </div>
                              </>
                            ) : (
                              <div style={{ fontSize:11, color:T.textMuted }}>-</div>
                            )}
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                            <span style={{ fontSize:15, fontWeight:700, color:scoreColor(sc), ...tnum }}>{sc}</span>
                            <span style={{ fontSize:9, color:T.textMuted, letterSpacing:0.3 }}> / 100</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Cross-tab nav */}
                <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
                  {[
                    { label:"Dev Portal ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢", tab:"Dev Portal" },
                    { label:"Launch Calendar ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢", tab:"Launch Calendar" },
                    { label:"Yields ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢", tab:"Yields" },
                    { label:"DLD Volumes ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢", tab:"DLD Volumes" },
                  ].map((n,i) => (
                    <button key={i} type="button" onClick={() => handleTabChange(n.tab)}
                      style={{ padding:"6px 14px", background:"rgba(212,168,67,0.06)", border:`1px solid ${T.border}`, borderRadius:8, color:T.gold, fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                      {n.label}
                    </button>
                  ))}
                </div>
                {/* Sources */}
                <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}`, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:10, color:T.textMuted }}>Sources:</span>
                  {["Developer Portals","Bayut","PropertyFinder","DLD RERA Registry","Knight Frank Q1 2025","Chestertons 2026"].map((s,i) => (
                    <span key={i} style={{ fontSize:10, color:T.textMuted, padding:"2px 8px", borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceAlt }}>{s}</span>
                  ))}
                </div>
              </div>
            );
      })()}

      {selectedProject && typeof document !== "undefined" && createPortal(
<div role="dialog" aria-modal="true" style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.97)", zIndex:2000, display:"flex", flexDirection:"column", backdropFilter:"blur(8px)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 24px", borderBottom:`1px solid ${T.border}`, background:T.surface, flexShrink:0 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:3 }}>{selectedProject.developer}{"ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·"}{selectedProject.community}</div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:800, color:T.white }}>{selectedProject.project}</div>
                  {/* Factual classification badges only ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â no investment advice */}
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:6 }}>
                    {selectedProject.tier === 1 && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(16,185,129,0.12)", color:"#10B981", fontWeight:700 }}>Tier 1 Developer</span>}
                    {selectedProject.tier === 2 && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(245,158,11,0.12)", color:"#F59E0B", fontWeight:700 }}>Tier 2 Developer</span>}
                    {selectedProject.goldenVisa && selectedProject.priceMin >= GOLDEN_VISA_THRESHOLD && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(212,168,67,0.15)", color:T.gold, fontWeight:700 }}>ÃƒÆ’Ã‚Â¢Ãƒâ€¹Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Golden Visa Eligible</span>}
                    {selectedProject.branded && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(139,92,246,0.15)", color:"#A78BFA", fontWeight:700 }}>ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬ÂÃƒÂ¢Ã¢â€šÂ¬Ã‚Â  {selectedProject.brandPartner || "Branded Residence"}</span>}
                    {selectedProject.escrowBank && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(20,184,166,0.1)", color:T.teal, fontWeight:700 }}>Escrow Verified</span>}
                    {isValidReraNumber(selectedProject.reraNo || selectedProject.projectNumber) && <span style={{ fontSize:10, padding:"3px 8px", borderRadius:5, background:"rgba(20,184,166,0.08)", color:T.teal, fontWeight:700 }}>DLD #{selectedProject.reraNo || selectedProject.projectNumber}</span>}
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:22, fontWeight:800, color:T.gold, fontFamily:"'Fraunces',serif" }}>{selectedProject.priceMin ? "AED " + (selectedProject.priceMin/1000000).toFixed(1) + "M" : "TBC"}</div>
                    <div style={{ fontSize:11, color:T.textMuted }}>starting price</div>
                  </div>
                  <button type="button" onClick={() => setSelectedProject(null)} style={{ width:36, height:36, borderRadius:"50%", background:T.surfaceAlt, border:`1px solid ${T.border}`, color:T.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontFamily:"'Outfit',sans-serif" }}>ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â</button>
                </div>
              </div>
              <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, background:T.surface, flexShrink:0, overflowX:"auto" }}>
                {[
                  {key:"identity",label:"Identity"},
                  {key:"location",label:"Location"},
                  {key:"scale",label:"Scale & Units"},
                  {key:"product",label:"Product"},
                  {key:"pricing",label:"Pricing Data"},
                  {key:"rental",label:"Rental & Yield"},
                  {key:"developer",label:"Developer & Compliance"},
                  {key:"community",label:"Community Intel"},
                  {key:"report",label:"Full Report"},
                ].map(t => (
                  <button key={t.key} type="button" onClick={() => setProjDetailTab(t.key)}
                    style={{ padding:"12px 16px", background:"none", border:"none", borderBottom:projDetailTab===t.key?`2px solid ${T.gold}`:"2px solid transparent", color:projDetailTab===t.key?T.gold:T.textMuted, fontSize:11, fontWeight:projDetailTab===t.key?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif", whiteSpace:"nowrap", letterSpacing:0.3 }}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
                {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â SECTION 1 ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· PROJECT IDENTITY ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â */}
                {projDetailTab === "identity" && (() => {
                  const seg = describeAssetClass(selectedProject);
                  const mkt = describeMarketStatus(selectedProject);
                  const rera = reraCompliance(selectedProject);
                  return (
                  <div>
                    <div style={{ padding:"18px 20px", background:`linear-gradient(135deg, rgba(212,168,67,0.08), rgba(20,184,166,0.04))`, border:`1px solid ${T.border}`, borderRadius:14, marginBottom:16 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Project Identity ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Per DLD Registry</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:14 }}>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Project Name</div>
                          <div style={{ fontSize:15, fontWeight:700, color:T.white, fontFamily:"'Fraunces',serif" }}>{selectedProject.project || selectedProject.name || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        </div>
                <div>
                  <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Project Developer</div>
                  <div style={{ fontSize:15, fontWeight:700, color:T.white }}>{selectedProject.developerActual || selectedProject.developer || "?"}</div>
                  {selectedProject.developerActual && selectedProject.developer && selectedProject.developerActual !== selectedProject.developer && (
                    <div style={{ fontSize:10, color:T.textMuted, marginTop:3 }}>Master Developer: {selectedProject.developer}</div>
                  )}
                </div>
                <div>
                  <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Community</div>
                  <div style={{ fontSize:15, fontWeight:700, color:T.textSecondary }}>{selectedProject.community || "?"}</div>
                  {selectedProject.masterCommunity && selectedProject.masterCommunity !== selectedProject.community && (
                    <div style={{ fontSize:10, color:T.textMuted, marginTop:3 }}>Master Community: {selectedProject.masterCommunity}</div>
                  )}
                </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Property Type</div>
                          <div style={{ fontSize:15, fontWeight:700, color:T.teal }}>{selectedProject.type || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Market Segment</div>
                          <div style={{ fontSize:15, fontWeight:700, color:seg.color }}>{seg.tier}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Project Stage</div>
                          <div style={{ fontSize:15, fontWeight:700, color:mkt.color }}>{mkt.label}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>RERA Number</div>
                          <div style={{ fontSize:15, fontWeight:700, color:rera.verified ? T.green : T.textMuted }}>{rera.verified ? rera.number : "Pending"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Construction Status</div>
                          <div style={{ fontSize:15, fontWeight:700, color:T.white }}>{selectedProject.constructionPct != null ? (selectedProject.constructionPct + "% complete" + (selectedProject.constructionPctIsEstimate ? " (est.)" : "")) : "Not disclosed"}</div>
                        </div>
                      </div>
                    </div>
                    {selectedProject.notes && (
                      <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:10 }}>Project Description</div>
                        <div style={{ fontSize:13, color:T.textSecondary, lineHeight:1.8 }}>{selectedProject.notes}</div>
                      </div>
                    )}
                    <LegalNote T={T} />
                  </div>
                  );
                })()}

                {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â SECTION 2 ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· LOCATION DATA ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â */}
                {projDetailTab === "location" && (() => {
                  const tags = locationTags(selectedProject);
                  return (
                  <div>
                    <div style={{ padding:"16px 20px", background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, marginBottom:16 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Location Data ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Distances Per DLD Filing</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:12, marginBottom:14 }}>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Emirate</div>
                          <div style={{ fontSize:14, fontWeight:700, color:T.white }}>{selectedProject.emirate || "Dubai"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Area</div>
                          <div style={{ fontSize:14, fontWeight:700, color:T.white }}>{selectedProject.area || selectedProject.community || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Sub-Community</div>
                          <div style={{ fontSize:14, fontWeight:700, color:T.textSecondary }}>{selectedProject.subCommunity || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        </div>
                      </div>
                      {tags.length > 0 && (
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:8, letterSpacing:0.5 }}>LOCATION CHARACTERISTICS</div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                            {tags.map((a,i) => (
                              <span key={i} style={{ fontSize:11, padding:"4px 12px", borderRadius:20, background:`${a.color}15`, color:a.color, fontWeight:700, border:`1px solid ${a.color}30` }}>{a.label}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* SECTION 1: Drive Times - to key Dubai destinations */}
                    <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Drive Times to Key Destinations</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:10 }}>
                        {[
                          { label:"Downtown Dubai", val:selectedProject.distDowntownDubaiMin, range:selectedProject.distDowntownDubaiMinRange, unit:"min" },
                          { label:"Dubai Marina", val:selectedProject.distDubaiMarinaMin, range:selectedProject.distDubaiMarinaMinRange, unit:"min" },
                          { label:"DXB Airport", val:selectedProject.distDubaiAirportMin, range:selectedProject.distDubaiAirportMinRange, unit:"min" },
                          { label:"Mall of Emirates", val:selectedProject.distMallOfEmiratesMin, range:selectedProject.distMallOfEmiratesMinRange, unit:"min" },
                          { label:"Business Bay / DIFC", val:selectedProject.distBusinessBayMin, range:selectedProject.distBusinessBayMinRange, unit:"min" },
                          { label:"Al Maktoum (DWC)", val:selectedProject.distDwcAirportMin, range:selectedProject.distDwcAirportMinRange, unit:"min" },
                        ].map((d,i) => (
                          d.val != null && (
                            <div key={i} style={{ padding:"14px 14px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:6, letterSpacing:0.3, textTransform:"uppercase" }}>{d.label}</div>
                              <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:800, color:T.white }}>
                                {d.val}<span style={{ fontSize:12, color:T.textMuted, marginLeft:3, fontWeight:500 }}>{d.unit}</span>
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>

                    {/* SECTION 2: Inside the Community - what's within walking distance */}
                    <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white }}>Inside Dubai Hills Estate</div>
                        <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, background:"rgba(16,185,129,0.1)", color:T.green, fontWeight:700 }}>WALKING DISTANCE</span>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:10 }}>
                        {selectedProject.communityGolfCourse && (
                          <div style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
                            <div style={{ fontSize:10, color:T.textMuted, marginBottom:3 }}>Golf Course</div>
                            <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Dubai Hills Golf Club</div>
                            <div style={{ fontSize:10, color:T.textMuted }}>18-hole championship course</div>
                          </div>
                        )}
                        {selectedProject.distMallLabel && (
                          <div style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
                            <div style={{ fontSize:10, color:T.textMuted, marginBottom:3 }}>Shopping Mall</div>
                            <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Dubai Hills Mall</div>
                            <div style={{ fontSize:10, color:T.textMuted }}>650+ outlets ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· 2M sqft GLA</div>
                          </div>
                        )}
                        {selectedProject.distSchoolLabel && (
                          <div style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
                            <div style={{ fontSize:10, color:T.textMuted, marginBottom:3 }}>Schools</div>
                            <div style={{ fontSize:13, fontWeight:700, color:T.white }}>GEMS Academies</div>
                            <div style={{ fontSize:10, color:T.textMuted }}>Wellington ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· New Millennium ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· International</div>
                          </div>
                        )}
                        {selectedProject.distHospitalLabel && (
                          <div style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
                            <div style={{ fontSize:10, color:T.textMuted, marginBottom:3 }}>Healthcare</div>
                            <div style={{ fontSize:13, fontWeight:700, color:T.white }}>King's College Hospital London</div>
                            <div style={{ fontSize:10, color:T.textMuted }}>Inside community</div>
                          </div>
                        )}
                        <div style={{ padding:"12px 14px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:3 }}>Parks & Recreation</div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Dubai Hills Park</div>
                          <div style={{ fontSize:10, color:T.textMuted }}>180,000 sqm ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· 54 km bicycle path</div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: Road Network */}
                    {Array.isArray(selectedProject.mainRoads) && selectedProject.mainRoads.length > 0 && (
                      <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:T.white }}>Road Network & Connectivity</div>
                          <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, background:"rgba(212,168,67,0.1)", color:T.gold, fontWeight:700 }}>{selectedProject.mainRoads.length} ROADS</span>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:8 }}>
                          {selectedProject.mainRoads.map((r, i) => (
                            <div key={i} style={{ padding:"11px 13px", background:T.surfaceAlt, borderRadius:8, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
                              {r.code && (
                                <span style={{ fontSize:10, fontFamily:"'Outfit',sans-serif", fontWeight:800, padding:"3px 7px", borderRadius:4, background:"rgba(212,168,67,0.12)", color:T.gold, letterSpacing:0.5, minWidth:38, textAlign:"center" }}>{r.code}</span>
                              )}
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontSize:12, fontWeight:700, color:T.white, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.name}</div>
                                <div style={{ fontSize:9, color:T.textMuted, marginTop:1 }}>{r.role}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize:10, color:T.textMuted, marginTop:10, fontStyle:"italic" }}>
                          Primary access: {selectedProject.primaryRoadAccess || "Al Khail Road (E44)"}
                        </div>
                      </div>
                    )}
                    <LegalNote T={T} />
                  </div>
                  );
                })()}

                {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â SECTION 3 ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· SCALE & UNITS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â */}
                {projDetailTab === "scale" && (() => {
                  const mix = computeUnitMix(selectedProject);
                  return (
                  <div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:12, marginBottom:16 }}>
                      {[
                        { label:"Plot Size", value:selectedProject.plotSize || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â", sub:"sq ft" },
                        { label:"Built-Up Area", value:selectedProject.builtUpArea || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â", sub:"sq ft" },
                        { label:"Total Buildings", value:selectedProject.totalBuildings || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â", sub:"per DLD filing" },
                        { label:"Total Units", value:(selectedProject.totalUnits || 0).toLocaleString(), sub:"registered" },
                        { label:"Total Villas", value:(selectedProject.totalVillas || 0).toLocaleString(), sub:"if applicable" },
                        { label:"Total Land Plots", value:(selectedProject.totalLands || 0).toLocaleString(), sub:"if applicable" },
                      ].map((k,i) => (
                        <div key={i} className="kpi-card">
                          <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>{k.label}</div>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:800, color:T.white, marginBottom:2 }}>{k.value}</div>
                          <div style={{ fontSize:10, color:T.textMuted }}>{k.sub}</div>
                        </div>
                      ))}
                    </div>
                    {mix && mix.length > 0 && (
                      <div className="chart-box" style={{ padding:20, marginBottom:12 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Unit Mix Distribution</div>
                        <div style={{ display:"flex", gap:4, height:28, borderRadius:8, overflow:"hidden", marginBottom:12 }}>
                          {mix.map((u,i) => {
                            const colors = [T.gold, T.teal, T.green, "#8B5CF6", "#F59E0B"];
                            return (
                              <div key={i} style={{ width:`${u.pct}%`, background:colors[i % colors.length], display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700, color:"#000" }}>
                {u.pct >= 8 ? (u.type + " " + u.pct + "%") : ""}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(120px, 1fr))", gap:8 }}>
                          {mix.map((u,i) => (
                            <div key={i} style={{ padding:"8px 10px", background:T.surfaceAlt, borderRadius:8, textAlign:"center" }}>
                              <div style={{ fontSize:10, color:T.gold, fontWeight:700 }}>{u.type}</div>
                              <div style={{ fontSize:13, color:T.white, fontWeight:700 }}>{u.pct}%</div>
                              <div style={{ fontSize:9, color:T.textMuted }}>{u.count} units</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedProject.unitBreakdown && Object.keys(selectedProject.unitBreakdown||{}).length > 0 && (
                      <div className="chart-box" style={{ padding:20, marginBottom:12 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Unit Type ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Price & PPSF (Developer Disclosed)</div>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:10 }}>
                          {Object.entries(selectedProject.unitBreakdown||{}).map(([type,count],i) => (
                            <div key={i} style={{ padding:"14px 16px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
                              <div style={{ fontSize:11, fontWeight:700, color:T.gold, marginBottom:8 }}>{type}</div>
                              <div style={{ fontSize:11, color:T.textMuted }}>From Price</div>
                              <div style={{ fontSize:16, fontWeight:700, color:T.white, fontFamily:"'Fraunces',serif", marginBottom:6 }}>{count} units</div>
                              <div style={{ fontSize:11, color:T.textMuted }}>PPSF</div>
                              <div style={{ fontSize:14, fontWeight:700, color:T.teal }}>{Math.round(count/(selectedProject.totalUnits||1)*100)}% of total</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <LegalNote T={T} />
                  </div>
                  );
                })()}

                {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â SECTION 4 ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· PRODUCT & AMENITIES ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â */}
                {projDetailTab === "product" && (
                  <div>
                    <div style={{ padding:"14px 20px", background:"rgba(20,184,166,0.05)", border:`1px solid ${T.border}`, borderRadius:10, marginBottom:16 }}>
                      <div style={{ fontSize:11, color:T.teal, fontWeight:700, letterSpacing:0.5 }}>PRODUCT SPECIFICATION ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· DEVELOPER DISCLOSED</div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(190px, 1fr))", gap:12, marginBottom:16 }}>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Branded Residence</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:selectedProject.branded ? T.gold : T.textSecondary }}>{selectedProject.branded ? (selectedProject.brandPartner || "Yes") : "No"}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Developer Tier</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:selectedProject.tier === 1 ? T.green : selectedProject.tier === 2 ? "#F59E0B" : T.textSecondary }}>{selectedProject.tier ? "Tier " + selectedProject.tier : "Not classified"}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Golden Visa Eligible</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:(selectedProject.goldenVisa && selectedProject.priceMin >= GOLDEN_VISA_THRESHOLD) ? T.gold : T.textSecondary }}>{(selectedProject.goldenVisa && selectedProject.priceMin >= GOLDEN_VISA_THRESHOLD) ? "Yes" : "No"}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Total Amenities</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:800, color:T.white }}>{(selectedProject.amenities || []).length}</div>
                      </div>
                    </div>
                    {selectedProject.amenities?.length > 0 && (
                      <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 }}>Amenities Listed in Developer Filing</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {selectedProject.amenities.map((a,i) => <span key={i} style={{ fontSize:11, padding:"4px 11px", borderRadius:18, background:T.surfaceAlt, border:`1px solid ${T.border}`, color:T.textSecondary }}>{a}</span>)}
                        </div>
                      </div>
                    )}
                    {selectedProject.view?.length > 0 && (
                      <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                        <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 }}>Views From Units</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {selectedProject.view.map((v,i) => <span key={i} style={{ fontSize:11, padding:"4px 12px", borderRadius:18, background:"rgba(212,168,67,0.1)", border:`1px solid rgba(212,168,67,0.25)`, color:T.gold, fontWeight:700 }}>{v}</span>)}
                        </div>
                      </div>
                    )}
                    <LegalNote T={T} />
                  </div>
                )}

                {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â SECTION 5 ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· PRICING DATA ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â */}
                {projDetailTab === "pricing" && (() => {
                  const bench = communityBenchmarkPPSF(selectedProject);
                  return (
                  <div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:12, marginBottom:16 }}>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Starting Price</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:24, fontWeight:800, color:T.gold }}>{selectedProject.priceMin ? "AED " + (selectedProject.priceMin/1000000).toFixed(2) + "M" : "Not disclosed"}</div>
                        <div style={{ fontSize:10, color:T.textMuted, marginTop:4 }}>Per developer pricing sheet</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Price per Sq.ft</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:24, fontWeight:800, color:T.white }}>{selectedProject.ppsf ? "AED " + selectedProject.ppsf.toLocaleString() : "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        <div style={{ fontSize:10, color:T.textMuted, marginTop:4 }}>PPSF from listings</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Community Benchmark PPSF</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:24, fontWeight:800, color:bench.value ? T.teal : T.textMuted }}>{bench.value ? "AED " + bench.value.toLocaleString() : "Pending"}</div>
                        {bench.p25 && bench.p75 && <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>Range AED {bench.p25.toLocaleString()}ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ{bench.p75.toLocaleString()}</div>}
                        <div style={{ fontSize:10, color:T.textMuted, marginTop:4 }}>{bench.source}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Payment Plan</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.gold }}>{selectedProject.paymentPlan || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        <div style={{ fontSize:10, color:T.textMuted, marginTop:4 }}>During / Post-handover split</div>
                      </div>
                    </div>
                    <div className="chart-box" style={{ padding:20, marginBottom:12 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Payment Plan Waterfall</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Post-Handover Plan</div>
                          <div style={{ fontSize:18, fontWeight:800, color:selectedProject.postHandover ? T.green : T.textSecondary, fontFamily:"'Fraunces',serif" }}>{selectedProject.postHandover ? "Available" : "Not available"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Escrow Bank</div>
                          <div style={{ fontSize:14, fontWeight:700, color:T.teal }}>{selectedProject.escrowBank || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Service Charge</div>
                          <div style={{ fontSize:18, fontWeight:800, color:T.white, fontFamily:"'Fraunces',serif" }}>{selectedProject.serviceCharge ? "AED " + selectedProject.serviceCharge + "/sqft/yr" : "TBC"}</div>
                        </div>
                      </div>
                      {selectedProject.paymentPlan && selectedProject.paymentPlan.includes("/") && !selectedProject.paymentPlan.includes("Cash") && (
                        <div>
                          <div style={{ display:"flex", gap:4, height:32, borderRadius:8, overflow:"hidden", marginBottom:8 }}>
                            <div style={{ width:`${parseInt(selectedProject.paymentPlan.split("/")[0])||60}%`, background:T.gold, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <span style={{ fontSize:11, fontWeight:700, color:"#000" }}>{parseInt(selectedProject.paymentPlan.split("/")[0])||60}% During Construction</span>
                            </div>
                            <div style={{ width:`${parseInt(selectedProject.paymentPlan.split("/")[1])||40}%`, background:T.teal, display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <span style={{ fontSize:11, fontWeight:700, color:"#fff" }}>{parseInt(selectedProject.paymentPlan.split("/")[1])||40}% At Handover</span>
                            </div>
                          </div>
                          <div style={{ fontSize:11, color:T.textMuted, lineHeight:1.7 }}>
                            Worked example ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â AED {((selectedProject.priceMin||0)/1000000).toFixed(1)}M: Pay AED {((selectedProject.priceMin||0)*(parseInt(selectedProject.paymentPlan.split("/")[0])||60)/100/1000000).toFixed(2)}M during construction, AED {((selectedProject.priceMin||0)*(parseInt(selectedProject.paymentPlan.split("/")[1])||40)/100/1000000).toFixed(2)}M at handover.
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ padding:"14px 16px", background:"rgba(212,168,67,0.06)", borderRadius:10, border:`1px solid rgba(212,168,67,0.2)`, marginBottom:12 }}>
                      <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.8 }}>
                        <strong style={{ color:T.gold }}>DLD Compliance Note:</strong> All off-plan payments must be made to the DLD-registered escrow account ({selectedProject.escrowBank || "TBC"}). RERA registration: {selectedProject.reraNo || selectedProject.projectNumber || "verify with developer"}. Per DLD Law No. 8 of 2007, never pay cash directly to developer.
                      </div>
                    </div>
                    <LegalNote T={T} />
                  </div>
                  );
                })()}

                {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â SECTION 6 ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· RENTAL & YIELD DATA ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â */}
                {projDetailTab === "rental" && (() => {
                  const str = strIndicator(selectedProject);
                  return (
                  <div>
                    <div style={{ padding:"14px 20px", background:"rgba(16,185,129,0.05)", border:`1px solid ${T.border}`, borderRadius:10, marginBottom:16 }}>
                      <div style={{ fontSize:11, color:T.green, fontWeight:700, letterSpacing:0.5 }}>RENTAL DATA ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· PER RERA SMART RENTAL INDEX METHODOLOGY</div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:12, marginBottom:16 }}>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Gross Yield</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:800, color:selectedProject.grossYield >= 7 ? T.green : selectedProject.grossYield >= 5 ? T.gold : T.textSecondary }}>{selectedProject.grossYield ? (selectedProject.grossYield.toFixed(1) + "%" + (selectedProject.grossYieldIsEstimate ? " (est.)" : "")) : "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        <div style={{ fontSize:10, color:T.textMuted }}>Annual rent ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â· purchase price</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Net Yield</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:800, color:T.teal }}>{selectedProject.netYield ? selectedProject.netYield.toFixed(1) + "%" : "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        <div style={{ fontSize:10, color:T.textMuted }}>After service charges</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Rental Use Class</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:T.white }}>{str.flag}</div>
                        <div style={{ fontSize:10, color:T.textMuted }}>{str.note}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Holiday Home Registration</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:str.flag === "Hotel Apartment" ? T.green : T.textSecondary }}>{str.flag === "Hotel Apartment" ? "Pre-approved" : "Owner Applies"}</div>
                        <div style={{ fontSize:10, color:T.textMuted }}>Per DET licensing</div>
                      </div>
                    </div>
                    <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:10 }}>RERA Smart Rental Index Reference</div>
                      <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.8 }}>
                        The RERA Smart Rental Index is the official tool for all rent increases in Dubai. Rental yields shown are computed from published DLD transaction data and RERA-indexed rental rates. Actual achieved rent depends on unit finishes, floor, view, and market timing. To verify permissible rent for a specific unit, use the official RERA Calculator at <span style={{ color:T.teal }}>dubailand.gov.ae</span> or the Dubai REST app.
                      </div>
                    </div>
                    <LegalNote T={T} />
                  </div>
                  );
                })()}

                {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â SECTION 7 ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· DEVELOPER & COMPLIANCE ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â */}
                {projDetailTab === "developer" && (() => {
                  const esc = escrowStatus(selectedProject);
                  const rera = reraCompliance(selectedProject);
                  return (
                  <div>
                    <div style={{ padding:"18px 20px", background:`linear-gradient(135deg, rgba(212,168,67,0.08), rgba(20,184,166,0.04))`, border:`1px solid ${T.border}`, borderRadius:14, marginBottom:16 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:T.gold, letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>Developer & Regulatory Compliance</div>
                      <div style={{ fontSize:22, fontWeight:800, color:T.white, fontFamily:"'Fraunces',serif", marginBottom:4 }}>{selectedProject.developer || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                      {selectedProject.tier && <div style={{ fontSize:12, padding:"3px 10px", borderRadius:6, background:selectedProject.tier === 1 ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color:selectedProject.tier === 1 ? T.green : "#F59E0B", fontWeight:700, display:"inline-block" }}>Tier {selectedProject.tier} Developer</div>}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))", gap:12, marginBottom:16 }}>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>RERA Registered</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:rera.verified ? T.green : T.red }}>{rera.verified ? "Verified" : "Not Found"}</div>
                        <div style={{ fontSize:10, color:T.textMuted }}>{rera.verified ? "#" + rera.number : "Check DLD registry"}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Escrow Compliance</div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:800, color:esc.verified ? T.green : "#F59E0B" }}>{esc.label}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>Escrow Bank</div>
                        <div style={{ fontSize:14, fontWeight:700, color:T.teal }}>{selectedProject.escrowBank || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                      </div>
                      <div className="kpi-card">
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>DLD Project Status</div>
                        <div style={{ fontSize:14, fontWeight:700, color:T.white }}>{selectedProject.dldStatus || selectedProject.status || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                      </div>
                    </div>
                    <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Construction & Delivery Data</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(140px, 1fr))", gap:10 }}>
                        <div style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Build Progress</div>
                          <div style={{ fontSize:16, fontWeight:700, color:T.white }}>{selectedProject.constructionPct != null ? selectedProject.constructionPct + "%" : "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        </div>
                        <div style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Expected Handover</div>
                          <div style={{ fontSize:16, fontWeight:700, color:T.gold }}>{selectedProject.handover || selectedProject.expectedHandover || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        </div>
                        <div style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Contracted Handover</div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.textSecondary }}>{selectedProject.contractedHandover || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        </div>
                        <div style={{ padding:"10px 12px", background:T.surfaceAlt, borderRadius:8 }}>
                          <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>Actual Handover</div>
                          <div style={{ fontSize:13, fontWeight:700, color:T.textSecondary }}>{selectedProject.actualHandover || "Pending"}</div>
                        </div>
                      </div>
                    </div>
                    {Array.isArray(selectedProject.developerFlagshipProjects) && selectedProject.developerFlagshipProjects.length > 0 && (
                      <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Flagship Projects by {selectedProject.developer || selectedProject.developerName}</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                          {selectedProject.developerFlagshipProjects.map((fp, idx) => (
                            <span key={idx} style={{ fontSize:11, padding:"5px 12px", borderRadius:16, background:"rgba(212,168,67,0.08)", color:T.gold, fontWeight:600, border:"1px solid rgba(212,168,67,0.2)" }}>{fp}</span>
                          ))}
                        </div>
                      </div>
                    )}
                {/* SOURCES FOOTER - verified data attribution */}
                {Array.isArray(selectedProject.sources) && selectedProject.sources.length > 0 && (
                  <div className="chart-box" style={{ padding:18, marginTop:16, background:"rgba(20,184,166,0.03)", border:`1px solid rgba(20,184,166,0.15)` }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:T.teal, letterSpacing:0.8, textTransform:"uppercase" }}>Verified Sources</div>
                      <span style={{ fontSize:10, padding:"2px 8px", borderRadius:4, background:"rgba(20,184,166,0.12)", color:T.teal, fontWeight:700 }}>
                        {selectedProject.sources.length} sources
                      </span>
                      {selectedProject.dataQualityScore && (
                        <span style={{ fontSize:10, color:T.textMuted, marginLeft:"auto" }}>
                          Data quality: <strong style={{ color:T.green }}>{selectedProject.dataQualityScore}/100</strong>
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:10, lineHeight:1.5 }}>
                      Every data point in this report is traceable to one or more authoritative sources. Click any source below to verify.
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {selectedProject.sources.map((src, idx) => (
                        <a key={idx} href={src.url} target="_blank" rel="noopener noreferrer"
                          title={(src.covers || "") + " (verified " + (src.verifiedAt || "") + ")"}
                          style={{
                            fontSize:10, padding:"5px 10px", borderRadius:6,
                            background: src.tier === "primary" ? "rgba(16,185,129,0.08)" : "rgba(212,168,67,0.06)",
                            color: src.tier === "primary" ? T.green : T.gold,
                            border: src.tier === "primary" ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(212,168,67,0.15)",
                            fontWeight:600, textDecoration:"none", cursor:"pointer",
                            display:"inline-flex", alignItems:"center", gap:4,
                          }}>
                          <span style={{ fontSize:8 }}>{src.tier === "primary" ? "\u25C6" : "\u00B7"}</span>
                          {src.name}
                        </a>
                      ))}
                    </div>
                    {selectedProject.verificationAuditorNote && (
                      <div style={{ fontSize:10, color:T.textMuted, marginTop:10, fontStyle:"italic", lineHeight:1.5, borderTop:`1px solid ${T.border}`, paddingTop:10 }}>
                        {selectedProject.verificationAuditorNote}
                      </div>
                    )}
                  </div>
                )}
                    <button type="button" onClick={() => { setSelectedProject(null); handleTabChange("Developer Health"); }}$ style={{ padding:"10px 20px", background:"rgba(212,168,67,0.1)", border:`1px solid ${T.border}`, borderRadius:8, color:T.gold, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontWeight:600, marginBottom:12 }}>Full Developer Profile ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢</button>
                    <LegalNote T={T} />
                  </div>
                  );
                })()}

                {/* ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â SECTION 8 ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· FULL REPORT & SHARE ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¢Ãƒâ€šÃ‚Â */}
                
              {projDetailTab === "community" && (() => {
                const cn = getCommunityData(selectedProject);
                const fmtD = n => n!=null ? parseFloat(n).toFixed(1)+" km" : "No data";
                const fmtY = n => n ? parseFloat(n).toFixed(1)+"%" : "No data";
                const fmtP = n => n ? "AED "+Math.round(n).toLocaleString() : "No data";
                return (
                  <div style={{padding:"20px 24px"}}>
                    {cn ? (
                      <div>
                        {/* Community Header */}
                        <div style={{background:"rgba(212,168,67,0.06)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:12,padding:"16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div>
                            <div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>COMMUNITY INTELLIGENCE</div>
                            <div style={{fontSize:18,fontWeight:700,color:T.white,fontFamily:"'Fraunces',serif"}}>{cn.community}</div>
                            <div style={{fontSize:11,color:T.textSecondary,marginTop:2}}>
                              {cn.tier==="verified"?"Verified Data":cn.tier==="area-data"?"Area Data":"DLD Registry"}
                              {cn.dldTransactions?" Ãƒâ€šÃ‚Â· "+cn.dldTransactions.toLocaleString()+" DLD transactions":""}
                            </div>
                          </div>
                          <div style={{textAlign:"center"}}>
                            <div style={{width:56,height:56,borderRadius:"50%",background:"rgba(212,168,67,0.12)",border:"2px solid "+T.gold,display:"flex",alignItems:"center",justifyContent:"center"}}>
                              <span style={{fontSize:16,fontWeight:800,color:T.gold,fontFamily:"'Fraunces',serif"}}>{cn.investmentScore||""}</span>
                            </div>
                            <div style={{fontSize:9,color:T.textMuted,marginTop:4}}>SCORE</div>
                          </div>
                        </div>

                        {/* Investment Metrics */}
                        <div style={{fontSize:11,fontWeight:700,color:T.textMuted,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Investment Metrics</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
                          {[
                            {label:"Gross Yield",    value:fmtY(cn.grossYield),     color:"#10B981"},
                            {label:"Net Yield",      value:fmtY(cn.netYield),       color:T.textSecondary},
                            {label:"Avg PPSF",       value:fmtP(cn.avgPpsf),        color:T.gold},
                            {label:"Service Charge", value:cn.serviceCharge?"AED "+cn.serviceCharge+"/sqft":"No data", color:T.textMuted},
                            {label:"Supply Risk",    value:cn.supplyRisk||"Unknown", color:cn.supplyRisk==="Low"?"#10B981":cn.supplyRisk==="High"?"#EF4444":"#F59E0B"},
                            {label:"Liquidity",      value:cn.liquidity||"Unknown",  color:cn.liquidity==="Very High"||cn.liquidity==="High"?"#10B981":"#F59E0B"},
                          ].map((m,i)=>(
                            <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"10px 12px"}}>
                              <div style={{fontSize:9,color:T.textMuted,textTransform:"uppercase",letterSpacing:0.7,marginBottom:3}}>{m.label}</div>
                              <div style={{fontSize:14,fontWeight:700,color:m.color,fontFamily:"'Fraunces',serif"}}>{m.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Nearby Facilities */}
                        <div style={{fontSize:11,fontWeight:700,color:T.textMuted,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Nearby Facilities</div>
                        <div style={{display:"flex",flexDirection:"column",gap:1,marginBottom:16}}>
                          {[
                            {label:"Metro",       name:cn.nearestMetro,       dist:cn.distMetro,    color:"#10B981"},
                            {label:"School",      name:cn.nearestSchool,      dist:cn.distSchool,   color:"#8B5CF6"},
                            {label:"Hospital",    name:cn.nearestHospital,    dist:cn.distHospital, color:"#EF4444"},
                            {label:"Mall",        name:cn.nearestMall,        dist:cn.distMall,     color:T.gold},
                            {label:"Beach",       name:cn.nearestBeach,       dist:cn.distBeach,    color:"#06B6D4"},
                            {label:"Supermarket", name:cn.nearestSupermarket, dist:cn.distSupermarket, color:"#10B981"},
                          ].map((f,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid "+T.border+"20"}}>
                              <div>
                                <span style={{fontSize:10,fontWeight:600,color:T.textMuted,width:80,display:"inline-block"}}>{f.label}</span>
                                <span style={{fontSize:11,color:T.white}}>{f.name||"No data"}</span>
                              </div>
                              <span style={{fontSize:12,fontWeight:700,color:f.dist?f.color:T.textMuted}}>{fmtD(f.dist)}</span>
                            </div>
                          ))}
                        </div>

                        {/* Landmarks */}
                        {cn.landmarks&&(
                          <div style={{marginBottom:16}}>
                            <div style={{fontSize:11,fontWeight:700,color:T.textMuted,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>Key Distances</div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                              {[
                                {key:"dubaiMall",      label:"Dubai Mall"},
                                {key:"dxbAirport",     label:"DXB Airport"},
                                {key:"mallOfEmirates", label:"Mall of Emirates"},
                                {key:"burjKhalifa",    label:"Burj Khalifa"},
                              ].map(lm=>(
                                cn.landmarks[lm.key]&&(
                                  <div key={lm.key} style={{background:"rgba(255,255,255,0.03)",borderRadius:8,padding:"8px 10px",display:"flex",justifyContent:"space-between"}}>
                                    <span style={{fontSize:10,color:T.textMuted}}>{lm.label}</span>
                                    <div style={{textAlign:"right"}}>
                                      <div style={{fontSize:11,fontWeight:700,color:T.gold}}>{cn.landmarks[lm.key].distKm} km</div>
                                      <div style={{fontSize:9,color:T.textMuted}}>{cn.landmarks[lm.key].duration} min</div>
                                    </div>
                                  </div>
                                )
                              ))}
                            </div>
                          </div>
                        )}

                        {/* View Full Community */}
                        <button type="button" onClick={()=>handleTabChange("Neighbourhoods")}
                          style={{width:"100%",padding:"12px",borderRadius:10,border:"1px solid "+T.gold,background:"rgba(212,168,67,0.08)",color:T.gold,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>
                          View Full Community Profile
                        </button>
                      </div>
                    ) : (
                      <div style={{textAlign:"center",padding:"40px 20px"}}>
                        <div style={{fontSize:32,marginBottom:12}}>?</div>
                        <div style={{fontSize:14,fontWeight:600,color:T.white,marginBottom:6}}>No community data</div>
                        <div style={{fontSize:12,color:T.textMuted}}>Community "{selectedProject?.community}" not found in neighbourhood database</div>
                      </div>
                    )}
                  </div>
                );
              })()}
{projDetailTab === "report" && (
                  <div>
                    <div style={{ padding:"14px 20px", background:"rgba(139,92,246,0.05)", border:`1px solid ${T.border}`, borderRadius:10, marginBottom:16 }}>
                      <div style={{ fontSize:11, color:"#A78BFA", fontWeight:700, letterSpacing:0.5 }}>DATA REPORT ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· SHAREABLE SUMMARY</div>
                    </div>
                    <div className="chart-box" style={{ padding:20, marginBottom:16 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:14 }}>Project Summary (Factual Data)</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, fontSize:12, color:T.textSecondary, lineHeight:1.9 }}>
                        <div><strong style={{ color:T.white }}>Project:</strong> {selectedProject.project || selectedProject.name || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        <div><strong style={{ color:T.white }}>Developer:</strong> {selectedProject.developer || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        <div><strong style={{ color:T.white }}>Community:</strong> {selectedProject.community || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        <div><strong style={{ color:T.white }}>Type:</strong> {selectedProject.type || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        <div><strong style={{ color:T.white }}>Starting Price:</strong> {selectedProject.priceMin ? "AED " + (selectedProject.priceMin/1000000).toFixed(2) + "M" : "TBC"}</div>
                        <div><strong style={{ color:T.white }}>PPSF:</strong> AED {(selectedProject.ppsf || 0).toLocaleString()}</div>
                        <div><strong style={{ color:T.white }}>Gross Yield:</strong> {selectedProject.grossYield ? selectedProject.grossYield + "%" : "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        <div><strong style={{ color:T.white }}>Payment Plan:</strong> {selectedProject.paymentPlan || "TBC"}</div>
                        <div><strong style={{ color:T.white }}>Handover:</strong> {selectedProject.handover || "TBC"}</div>
                        <div><strong style={{ color:T.white }}>DLD Project #:</strong> {selectedProject.reraNo || selectedProject.projectNumber || "Pending"}</div>
                        <div><strong style={{ color:T.white }}>Escrow:</strong> {selectedProject.escrowBank || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                        <div><strong style={{ color:T.white }}>Build Progress:</strong> {selectedProject.constructionPct != null ? (selectedProject.constructionPct + "%" + (selectedProject.constructionPctIsEstimate ? " (est.)" : "")) : "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}</div>
                      </div>
                    </div>
                    {(() => {
        const units = Object.entries(selectedProject.unitBreakdown||{}).map(([type,count]) => type + ": " + count + " units").join("\n") || "";
                      const origin = (typeof window !== "undefined" && window.location && window.location.origin) ? window.location.origin : "https://emaar-dashboard.vercel.app";
                      const projectUrl = `${origin}/project/${encodeURIComponent(selectedProject.id || "")}`;
                      const txt = [
                        "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â DXB ANALYTICS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â PROPERTY DATA REPORT",
                        "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â",
                        `ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€¦Ã¢â‚¬â„¢ ${selectedProject.project || selectedProject.name}`,
                        `ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃƒâ€šÃ‚Â¢ Developer: ${selectedProject.developer}`,
                        `ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â Community: ${selectedProject.community}`,
                        `ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚ÂÃƒâ€šÃ‚Â  Type: ${selectedProject.type}`,
                        "",
                        "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Ãƒâ€šÃ‚Â° PRICING",
                        `   Starting: AED ${((selectedProject.priceMin||0)/1000000).toFixed(2)}M`,
                        `   PPSF: AED ${(selectedProject.ppsf||0).toLocaleString()}`,
                        units ? `\nÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â UNIT BREAKDOWN\n${units}` : "",
                        "",
                        "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€¦Ã‚Â  RENTAL DATA",
                        `   Gross Yield: ${selectedProject.grossYield||"ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}%`,
                        `   Payment Plan: ${selectedProject.paymentPlan||"TBC"}`,
                        `   Handover: ${selectedProject.handover||"TBC"}`,
                        "",
                        `ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â RERA: ${selectedProject.reraNo||selectedProject.projectNumber||"TBC"} | Escrow: ${selectedProject.escrowBank||"TBC"}`,
                        "",
                        `ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Full report: ${projectUrl}`,
                        "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€šÃ‚Â",
                        "Data Source: Dubai Land Department (DLD) public records",
                        "Informational only ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â not investment advice",
                        "For regulated advice contact a RERA-licensed consultant",
                      ].filter(line => line !== "").join("\n");
                      const emailSubject = `Property Data Report ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ${selectedProject.project || selectedProject.name}`;
                      const btnStyle = (color) => ({ padding:"10px 18px", background:`rgba(${color},0.1)`, border:`1px solid rgba(${color},0.3)`, borderRadius:8, color:`rgb(${color})`, fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", display:"inline-flex", alignItems:"center", gap:6 });
                      return (
                        <div className="chart-box" style={{ padding:18, marginBottom:12 }}>
                          <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:0.8, textTransform:"uppercase", marginBottom:12 }}>Share This Data Report</div>
                          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                            <button type="button" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,"_blank")} style={btnStyle("37,211,102")}>ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â± WhatsApp</button>
                            <button type="button" onClick={() => window.open(`mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(txt)}`,"_blank")} style={btnStyle("59,130,246")}>ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Email</button>
                            <button type="button" onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(projectUrl);
                                const el = document.activeElement;
                                const original = el && el.textContent;
                                if (el && el.textContent != null) { el.textContent = "ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ Copied!"; setTimeout(() => { if (el && original) el.textContent = original; }, 1500); }
                              } catch {}
                            }} style={btnStyle("212,168,67")}>ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Copy Link</button>
                            <button type="button" onClick={() => { setSelectedProject(null); handleTabChange("Mortgage"); }} style={{ padding:"10px 18px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textSecondary, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Mortgage Calculator</button>
                            <button type="button" onClick={() => { setSelectedProject(null); handleTabChange("My Leads"); }} style={{ padding:"10px 18px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textSecondary, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Add to Leads</button>
                          </div>
                        </div>
                      );
                    })()}
                    <LegalNote T={T} />
                  </div>
                )}
              </div>
            </div>
          
      , document.body)}
    </>
  );
}

export default ProjectsTab;
