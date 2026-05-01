/* ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨
   DXB ANALYTICS ‚‚Ç¨‚Äù PROJECT & DEVELOPMENT VALIDATION
   src/utils/projectValidation.js

   Pure JavaScript validation for the hybrid two-collection model:
   - `developments` collection (the parent, one per building/community)
   - `projects` collection (the child, one per buyable unit variant)

   Used by:
   - Admin Data Manager form (before save)
   - Migration scripts (before bulk import)
   - Cloud functions (server-side double-check)

   All functions return { valid: boolean, errors: string[] }

   Matches schema spec docs/schema-v1.md (v2) and firestore.rules.
   ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨ */

import { isValidPropertyType, MASTER_CATEGORIES } from "./propertyTypes";

// ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Constants from the schema spec ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨
export const VALID_VISIBILITY = ["draft", "published", "archived"];
export const VALID_TENURE = ["freehold", "leasehold", "usufruct", "musataha", "grant"];
export const VALID_SALE_STATUS = ["off-plan", "ready", "secondary", "sold-out", "coming-soon"];
export const VALID_CONSTRUCTION_STATUS = ["pre-launch", "under-construction", "completed", "handover-ready"];
export const VALID_DLD_CLASS = ["land", "unit", "villa"];
export const VALID_EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];

// Dubai geographic bounds (approximate)
const DUBAI_LAT_MIN = 22.5;
const DUBAI_LAT_MAX = 26.0;
const DUBAI_LNG_MIN = 54.5;
const DUBAI_LNG_MAX = 56.5;

// ‚‚Äù‚Ç¨‚‚Äù‚Ç¨ Field-level helpers ‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨‚‚Äù‚Ç¨

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function isPositiveNumber(v) {
  return typeof v === "number" && v > 0 && !isNaN(v);
}

function isNonNegativeNumber(v) {
  return typeof v === "number" && v >= 0 && !isNaN(v);
}

function isBoolean(v) {
  return typeof v === "boolean";
}

function isValidCoordinates(coords) {
  if (!coords || typeof coords !== "object") return false;
  const { lat, lng } = coords;
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (lat < DUBAI_LAT_MIN || lat > DUBAI_LAT_MAX) return false;
  if (lng < DUBAI_LNG_MIN || lng > DUBAI_LNG_MAX) return false;
  return true;
}

// ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê
// DEVELOPMENT VALIDATORS (v2 ‚‚Ç¨‚Äù the parent collection)
// ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê

/**
 * Validate a development record about to be created (visibility: draft).
 * Less strict ‚‚Ç¨‚Äù just the minimum to save a draft.
 */
export function validateDevelopmentDraft(record) {
  const errors = [];

  if (!isNonEmptyString(record.name)) {
    errors.push("name is required");
  }
  if (!isNonEmptyString(record.orgId)) {
    errors.push("orgId is required");
  }
  if (record.visibility && !VALID_VISIBILITY.includes(record.visibility)) {
    errors.push(`visibility "${record.visibility}" must be one of: ${VALID_VISIBILITY.join(", ")}`);
  }
  if (record.tenure && !VALID_TENURE.includes(record.tenure)) {
    errors.push(`tenure "${record.tenure}" must be one of: ${VALID_TENURE.join(", ")}`);
  }
  if (record.dldClass && !VALID_DLD_CLASS.includes(record.dldClass)) {
    errors.push(`dldClass "${record.dldClass}" must be one of: ${VALID_DLD_CLASS.join(", ")}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a development record about to be PUBLISHED.
 * Stricter ‚‚Ç¨‚Äù every "mandatory for published" field from spec Section 2A.7 must be present.
 */
export function validateDevelopmentPublish(record) {
  const draftResult = validateDevelopmentDraft(record);
  const errors = [...draftResult.errors];

  if (!isNonEmptyString(record.developerId)) {
    errors.push("developerId is required for published developments");
  }
  if (!isNonEmptyString(record.developerName)) {
    errors.push("developerName is required for published developments");
  }
  if (!isNonEmptyString(record.community)) {
    errors.push("community is required for published developments");
  }
  if (!isValidCoordinates(record.coordinates)) {
    errors.push("coordinates must be a valid {lat, lng} within Dubai bounds");
  }
  if (record.emirate && !VALID_EMIRATES.includes(record.emirate)) {
    errors.push(`emirate "${record.emirate}" must be one of: ${VALID_EMIRATES.join(", ")}`);
  }
  if (record.saleStatus && !VALID_SALE_STATUS.includes(record.saleStatus)) {
    errors.push(`saleStatus "${record.saleStatus}" must be one of: ${VALID_SALE_STATUS.join(", ")}`);
  }
  if (record.constructionStatus && !VALID_CONSTRUCTION_STATUS.includes(record.constructionStatus)) {
    errors.push(`constructionStatus "${record.constructionStatus}" must be one of: ${VALID_CONSTRUCTION_STATUS.join(", ")}`);
  }

  // Off-plan developments have strict regulatory requirements
  if (record.saleStatus === "off-plan") {
    if (!isNonEmptyString(record.reraProjectNumber)) {
      errors.push("reraProjectNumber is required for off-plan published developments (Law 13/2008 / Oqood)");
    }
    if (!isNonEmptyString(record.escrowAccount)) {
      errors.push("escrowAccount is required for off-plan published developments");
    }
    if (!isNonEmptyString(record.escrowBank)) {
      errors.push("escrowBank is required for off-plan published developments");
    }
  }

  return { valid: errors.length === 0, errors };
}

// ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê
// PROJECT VARIANT VALIDATORS (v2 ‚‚Ç¨‚Äù the child collection)
// ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê

/**
 * Validate a project (variant) record about to be created (visibility: draft).
 * v2 CHANGE: developmentId is now required to link the variant to its parent.
 */
export function validateProjectDraft(record) {
  const errors = [];

  if (!isNonEmptyString(record.name)) {
    errors.push("name is required");
  }
  if (!isNonEmptyString(record.developmentId)) {
    errors.push("developmentId is required (v2 hybrid model ‚‚Ç¨‚Äù every project variant must link to a parent development)");
  }
  if (!isNonEmptyString(record.orgId)) {
    errors.push("orgId is required");
  }
  if (!isValidPropertyType(record.type)) {
    errors.push(`type "${record.type}" is not a valid property type`);
  }
  if (record.category && !MASTER_CATEGORIES.includes(record.category)) {
    errors.push(`category "${record.category}" must be one of: ${MASTER_CATEGORIES.join(", ")}`);
  }
  if (record.visibility && !VALID_VISIBILITY.includes(record.visibility)) {
    errors.push(`visibility "${record.visibility}" must be one of: ${VALID_VISIBILITY.join(", ")}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a project variant about to be PUBLISHED.
 * v2: regulatory fields are now on the parent development, not the variant.
 * The variant only needs pricing, size, and type-specific details.
 */
export function validateProjectPublish(record) {
  const draftResult = validateProjectDraft(record);
  const errors = [...draftResult.errors];

  if (!isPositiveNumber(record.priceFromAed)) {
    errors.push("priceFromAed must be a positive number");
  }
  if (record.priceToAed !== undefined && record.priceToAed !== null && !isPositiveNumber(record.priceToAed)) {
    errors.push("priceToAed (if set) must be a positive number");
  }
  if (record.priceToAed && record.priceFromAed && record.priceToAed < record.priceFromAed) {
    errors.push("priceToAed must be >= priceFromAed");
  }
  if (record.sizeSqftMin !== undefined && !isPositiveNumber(record.sizeSqftMin)) {
    errors.push("sizeSqftMin (if set) must be a positive number");
  }
  if (record.sizeSqftMax && record.sizeSqftMin && record.sizeSqftMax < record.sizeSqftMin) {
    errors.push("sizeSqftMax must be >= sizeSqftMin");
  }
  if (record.dldClass && !VALID_DLD_CLASS.includes(record.dldClass)) {
    errors.push(`dldClass "${record.dldClass}" must be one of: ${VALID_DLD_CLASS.join(", ")}`);
  }

  // Residential variants should have a bedroom label
  if (record.category === "residential" && !isNonEmptyString(record.bedroomLabel)) {
    errors.push("bedroomLabel is required for residential project variants (e.g. 'Studio', '2BR', '5BR Villa')");
  }

  return { valid: errors.length === 0, errors };
}

// ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê
// SHARED VALIDATORS (apply to both developments and projects)
// ‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê‚‚Ä¢ê

/**
 * Validate that a record update is not trying to change disclosedAt.
 * Applies to both developments and projects.
 * The Firestore rule enforces this server-side; client-side check is for fast UX feedback.
 */
export function validateDisclosedAtImmutability(oldRecord, newRecord) {
  const errors = [];
  if (oldRecord.disclosedAt && newRecord.disclosedAt !== oldRecord.disclosedAt) {
    errors.push("disclosedAt cannot be modified once set (legal protection per Decree-Law 25/2025)");
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate visibility transitions.
 * - draft ‚Ü‚Äô published: ALLOWED (triggers disclosedAt assignment server-side)
 * - draft ‚Ü‚Äô archived: ALLOWED
 * - published ‚Ü‚Äô archived: ALLOWED
 * - published ‚Ü‚Äô draft: NOT ALLOWED
 * - archived ‚Ü‚Äô published: NOT ALLOWED via client (admin Cloud Function only)
 * - archived ‚Ü‚Äô draft: NOT ALLOWED via client
 * Applies to both developments and projects.
 */
export function validateVisibilityTransition(oldVisibility, newVisibility) {
  const errors = [];
  if (!VALID_VISIBILITY.includes(newVisibility)) {
    errors.push(`Invalid target visibility "${newVisibility}"`);
    return { valid: false, errors };
  }
  const validTransitions = {
    draft: ["draft", "published", "archived"],
    published: ["published", "archived"],
    archived: ["archived"],
  };
  const allowed = validTransitions[oldVisibility] || [];
  if (!allowed.includes(newVisibility)) {
    errors.push(`Cannot transition from "${oldVisibility}" to "${newVisibility}". Allowed: ${allowed.join(", ")}`);
  }
  return { valid: errors.length === 0, errors };
}