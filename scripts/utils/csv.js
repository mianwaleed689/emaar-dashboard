/* ─────────────────────────────────────────────────────────────
   DXB ANALYTICS — MINIMAL CSV PARSER
   scripts/utils/csv.js

   Pure Node.js CSV parser. Zero dependencies. Handles the
   cases that real CSV files throw at us:
   - Quoted fields containing commas
   - Escaped quotes inside quoted fields (doubled: "")
   - Fields containing newlines inside quotes
   - Empty fields
   - Windows (CRLF) and Unix (LF) line endings
   - UTF-8 BOM at start of file (common from Excel exports)

   Not a full RFC 4180 implementation — just the bits we need
   for Dubai Pulse CSVs and similar clean government data.

   Exports:
   - parseCsv(text): string -> Array of objects (first row is header)
   - parseCsvRows(text): string -> Array of arrays (no header processing)
   ───────────────────────────────────────────────────────────── */

"use strict";

/**
 * Parse a CSV string into an array of row arrays.
 * Each row is an array of field strings.
 * @param {string} text
 * @returns {string[][]}
 */
function parseCsvRows(text) {
  if (text === null || text === undefined) return [];
  let input = String(text);

  // Strip UTF-8 BOM if present
  if (input.charCodeAt(0) === 0xFEFF) {
    input = input.slice(1);
  }

  const rows = [];
  let currentRow = [];
  let currentField = "";
  let i = 0;
  let inQuotes = false;

  while (i < input.length) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"') {
        // Doubled quote = literal quote inside field
        if (i + 1 < input.length && input[i + 1] === '"') {
          currentField += '"';
          i += 2;
          continue;
        }
        // Single quote = end of quoted field
        inQuotes = false;
        i++;
        continue;
      }
      currentField += ch;
      i++;
      continue;
    }

    // Not in quotes
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === ",") {
      currentRow.push(currentField);
      currentField = "";
      i++;
      continue;
    }

    if (ch === "\r") {
      // Handle CRLF by skipping the \n that follows
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      i++;
      if (i < input.length && input[i] === "\n") i++;
      continue;
    }

    if (ch === "\n") {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      i++;
      continue;
    }

    currentField += ch;
    i++;
  }

  // Handle file that does not end with a newline
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  // Filter out completely empty trailing rows (common with CRLF-ended files)
  while (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last.length === 1 && last[0] === "") {
      rows.pop();
    } else {
      break;
    }
  }

  return rows;
}

/**
 * Parse a CSV string into an array of objects keyed by header names.
 * The first row is treated as the header. Each subsequent row becomes
 * an object { header1: value1, header2: value2, ... }.
 * @param {string} text
 * @returns {Object[]}
 */
function parseCsv(text) {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim());
  const result = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = c < row.length ? row[c] : "";
    }
    result.push(obj);
  }
  return result;
}

module.exports = { parseCsv, parseCsvRows };