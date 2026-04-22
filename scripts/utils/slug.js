/* ─────────────────────────────────────────────────────────────
   DXB ANALYTICS — SLUG UTILITY
   scripts/utils/slug.js

   Deterministic slug generation for Firestore document IDs.
   Used by the migration framework to produce idempotent writes:
   running the same migration twice produces the same document
   IDs, which means re-runs overwrite the same docs instead of
   creating duplicates.

   Rules:
   - Lowercase
   - ASCII only (transliterate common non-ASCII characters)
   - Spaces and underscores become hyphens
   - Consecutive hyphens collapse to one
   - Leading/trailing hyphens removed
   - Empty input returns empty string (caller must handle)
   ───────────────────────────────────────────────────────────── */

"use strict";

// Map common non-ASCII characters to ASCII equivalents.
// Covers Arabic-to-Latin transliteration for Dubai-specific names,
// plus common European accented characters. Not exhaustive — good
// enough for real estate project names.
const TRANSLIT_MAP = {
  "á": "a", "à": "a", "ä": "a", "â": "a", "ã": "a", "å": "a",
  "é": "e", "è": "e", "ë": "e", "ê": "e",
  "í": "i", "ì": "i", "ï": "i", "î": "i",
  "ó": "o", "ò": "o", "ö": "o", "ô": "o", "õ": "o", "ø": "o",
  "ú": "u", "ù": "u", "ü": "u", "û": "u",
  "ý": "y", "ÿ": "y",
  "ñ": "n", "ç": "c",
  "ß": "ss",
  "æ": "ae", "œ": "oe",
  // Smart quotes and dashes become their ASCII counterparts (then get stripped)
  "\u2018": "'", "\u2019": "'",
  "\u201C": '"', "\u201D": '"',
  "\u2013": "-", "\u2014": "-",
  // Common Dubai transliterations (not exhaustive)
  "ا": "a", "ب": "b", "ت": "t", "ث": "th",
  "ج": "j", "ح": "h", "خ": "kh",
  "د": "d", "ذ": "dh",
  "ر": "r", "ز": "z",
  "س": "s", "ش": "sh",
  "ص": "s", "ض": "d",
  "ط": "t", "ظ": "z",
  "ع": "a", "غ": "gh",
  "ف": "f", "ق": "q",
  "ك": "k", "ل": "l",
  "م": "m", "ن": "n",
  "ه": "h", "و": "w", "ي": "y",
  "ة": "h", "ى": "a",
};

/**
 * Convert an arbitrary string to a URL-friendly slug.
 * @param {string} input
 * @returns {string}
 */
function slugify(input) {
  if (input === null || input === undefined) return "";
  const str = String(input);
  if (str.length === 0) return "";

  // Step 1: transliterate known non-ASCII characters
  let result = "";
  for (const ch of str.toLowerCase()) {
    if (TRANSLIT_MAP[ch] !== undefined) {
      result += TRANSLIT_MAP[ch];
    } else {
      result += ch;
    }
  }

  // Step 2: replace anything that is not a-z, 0-9, or hyphen with a hyphen
  result = result.replace(/[^a-z0-9-]+/g, "-");

  // Step 3: collapse consecutive hyphens into one
  result = result.replace(/-+/g, "-");

  // Step 4: trim leading and trailing hyphens
  result = result.replace(/^-+|-+$/g, "");

  return result;
}

/**
 * Build a deterministic Firestore document ID from a list of components.
 * Empty components are skipped. Used for parent-child linking in the
 * two-collection schema: development ID = slugify(developer, name),
 * variant ID = slugify(developer, name, bedroomLabel).
 * @param {...string} parts
 * @returns {string}
 */
function buildId(...parts) {
  const slugs = parts
    .filter(p => p !== null && p !== undefined && String(p).length > 0)
    .map(p => slugify(p))
    .filter(s => s.length > 0);
  return slugs.join("-");
}

module.exports = { slugify, buildId };