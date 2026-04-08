/* ─────────────────────────────────────────────────────────────
   DXB ANALYTICS — PROJECT VALIDATION
   src/utils/projectValidation.js

   Pure JavaScript validation functions for project records.
   Used by:
   - Admin Data Manager form (before save)
   - Migration scripts (before bulk import)
   - Cloud functions (server-side double-check)

   Returns { valid: boolean, errors: string[] }
   - valid: true if the record passes all checks
   - errors: array of human-readable error messages

   Validation matches the schema spec (docs/schema-v1.md) and
   the firestore.rules security rules.
   ───────────────────────────────────────────────────────────── */

import { isValidPropertyType, MASTER_CATEGORIES } from "./propertyTypes";

// ── Constants from the schema spec ────────────────────────────
const VALID_VISIBILITY = ["draft", "published", "archived"];
const VALID_TENURE = ["freehold", "leasehold", "usufruct", "musataha", "grant"];
const VALID_SALE_STATUS = ["off-plan", "ready", "secondary", "sold-out", "coming-soon"];
const VALID_CONSTRUCTION_STATUS = ["pre-launch", "under-construction", "completed", "handover-ready"];
const VALID_DLD_CLASS = ["land", "unit", "villa"];
const VALID_EMIRATES = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];

// Dubai geographic bounds (approximate)
const DUBAI_LAT_MIN = 22.5;
const DUBAI_LAT_MAX = 26.0;
const DUBAI_LNG_MIN = 54.5;
const DUBAI_LNG_MAX = 56.5;

// ── Field-level validators ────────────────────────────────────

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

// ── Main validators ───────────────────────────────────────────

/**
 * Validate a project record about to be created (visibility: draft).
 * Less strict than publish validation — only checks the bare minimum
 * needed to save a draft.
 */
export function validateProjectDraft(record) {
  const errors = [];

  if (!isNonEmptyString(record.name)) {
    errors.push("name is required");
  }
  if (!isNonEmptyString(record.developmentId)) {
    errors.push("developmentId is required");
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
 * Validate a project record about to be PUBLISHED (visibility: published).
 * Stricter — every "mandatory for published" field from Section 2.9 must be present.
 */
export function validateProjectPublish(record) {
  // Run draft checks first
  const draftResult = validateProjectDraft(record);
  const errors = [...draftResult.errors];

  // Now the publish-specific checks
  if (!isNonEmptyString(record.developerId)) {
    errors.push("developerId is required for published records");
  }
  if (!isNonEmptyString(record.developerName)) {
    errors.push("developerName is required for published records");
  }
  if (!isNonEmptyString(record.community)) {
    errors.push("community is required for published records");
  }
  if (!isValidCoordinates(record.coordinates)) {
    errors.push("coordinates must be a valid {lat, lng} within Dubai bounds");
  }
  if (record.emirate && !VALID_EMIRATES.includes(record.emirate)) {
    errors.push(`emirate "${record.emirate}" must be one of: ${VALID_EMIRATES.join(", ")}`);
  }
  if (!isPositiveNumber(record.priceFromAed)) {
    errors.push("priceFromAed must be a positive number");
  }
  if (record.priceToAed && !isPositiveNumber(record.priceToAed)) {
    errors.push("priceToAed (if set) must be a positive number");
  }
  if (record.priceToAed && record.priceFromAed && record.priceToAed < record.priceFromAed) {
    errors.push("priceToAed must be >= priceFromAed");
  }
  if (!isPositiveNumber(record.sizeSqft)) {
    errors.push("sizeSqft must be a positive number");
  }
  if (record.tenure && !VALID_TENURE.includes(record.tenure)) {
    errors.push(`tenure "${record.tenure}" must be one of: ${VALID_TENURE.join(", ")}`);
  }
  if (record.dldClass && !VALID_DLD_CLASS.includes(record.dldClass)) {
    errors.push(`dldClass "${record.dldClass}" must be one of: ${VALID_DLD_CLASS.join(", ")}`);
  }
  if (record.saleStatus && !VALID_SALE_STATUS.includes(record.saleStatus)) {
    errors.push(`saleStatus "${record.saleStatus}" must be one of: ${VALID_SALE_STATUS.join(", ")}`);
  }
  if (record.constructionStatus && !VALID_CONSTRUCTION_STATUS.includes(record.constructionStatus)) {
    errors.push(`constructionStatus "${record.constructionStatus}" must be one of: ${VALID_CONSTRUCTION_STATUS.join(", ")}`);
  }

  // Off-plan records have stricter regulatory requirements
  if (record.saleStatus === "off-plan") {
    if (!isNonEmptyString(record.reraProjectNumber)) {
      errors.push("reraProjectNumber is required for off-plan published records (Law 13/2008 / Oqood)");
    }
    if (!isNonEmptyString(record.escrowAccount)) {
      errors.push("escrowAccount is required for off-plan published records");
    }
    if (!isNonEmptyString(record.escrowBank)) {
      errors.push("escrowBank is required for off-plan published records");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate that a record update is not trying to change disclosedAt.
 * The Firestore rule enforces this server-side, but we check client-side
 * too so the admin form can show the error before the save attempt.
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
 * - draft → published: ALLOWED (and triggers disclosedAt assignment server-side)
 * - draft → archived: ALLOWED
 * - published → archived: ALLOWED
 * - published → draft: NOT ALLOWED (once disclosed, must stay disclosed or be archived)
 * - archived → published: NOT ALLOWED via client (admin Cloud Function only)
 * - archived → draft: NOT ALLOWED via client
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
    archived: ["archived"], // archived is terminal from client side
  };
  const allowed = validTransitions[oldVisibility] || [];
  if (!allowed.includes(newVisibility)) {
    errors.push(`Cannot transition from "${oldVisibility}" to "${newVisibility}". Allowed: ${allowed.join(", ")}`);
  }
  return { valid: errors.length === 0, errors };
}