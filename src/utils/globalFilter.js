/**
 * THE GLOBAL FILTER CONTRACT
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * ── THE BUG THIS FIXES ──────────────────────────────────────────────────────
 *
 * The global filter bar is fixed to the top of all 34 tabs and shows a
 * "N filters active" chip. Measured on 2026-07-31:
 *
 *     tabs receiving `globalFilters` ............ 15 of 34
 *     tabs honouring ALL of it .................. 1   (Projects)
 *     tabs honouring only `developer` ........... 3   (Competitors, DeveloperHealth, Financials)
 *     tabs honouring only `community` ........... 2   (PriceHistory, Risk)
 *     tabs receiving it and reading nothing ..... 9
 *     tabs never passed it ...................... 19
 *     tabs honouring `type` ..................... 0
 *
 * So the bar looks global and behaves locally. A user sets
 * "Emaar · 2 BR · Ready" on Projects and it works; they switch to Yields and
 * the bar still reads "3 filters active" while Yields ignores all three. The
 * chip tells the truth about the bar and a lie about the page.
 *
 * The cause is that there was no contract: each tab decided independently
 * whether to honour a control, and nothing made that visible to the user or
 * checkable in code.
 *
 * ── THE CONTRACT ────────────────────────────────────────────────────────────
 *
 * A tab declares a FIELD MAP: for each concept it supports, how its records
 * expose that concept. A key absent from the map means "this tab does not
 * support that filter" — and the bar must then not offer the control while
 * that tab is active, rather than offering one that silently does nothing.
 *
 *     const FIELD_MAP = {
 *       developer: { get: p => [p.developerActual, p.developer, p.developerName] },
 *       community: { get: p => p.community },
 *       status:    { get: p => p.status || projectStatusLabel(p) },
 *       beds:      { get: p => p.beds, compare: "beds" },
 *       price:     { get: p => p.priceMin, onMissing: "include" },
 *     };
 *
 * Three rules this enforces:
 *
 *   1. A control is offered only where it works        -> supportedKeys()
 *   2. An option is offered only if it matches a record -> deriveOptions()
 *   3. Missing data is an explicit decision, not a default -> onMissing
 *
 * @see TAB_STANDARD.md   checks 3, 4 and 7
 * @see FILTER_AUDIT.md   the measurement above
 */

/** Every concept the global bar can express. Order drives the UI. */
export const GLOBAL_FILTER_KEYS = [
  "developer",
  "community",
  "type",
  "beds",
  "status",
  "price",
];

/** The value meaning "no filter". */
export const ANY = "all";

const isBlank = (v) => v === undefined || v === null || v === "" ||
  (Array.isArray(v) && v.filter((x) => !isBlank(x)).length === 0);

/** Case- and punctuation-insensitive comparison key. */
export function norm(v) {
  return String(v ?? "").trim().toLowerCase();
}

/**
 * Bedroom counts are written at least four ways across this codebase and the
 * DLD exports: "2 B/R", "2 BR", "2 bed rooms+hall", "2BR". Collapse them all.
 * Studio has no number and must not collide with "0".
 */
export function normBeds(v) {
  const s = norm(v).replace(/\s+/g, "");
  if (!s) return "";
  if (s.includes("studio")) return "studio";
  if (s.includes("penthouse")) return "penthouse";
  const m = s.match(/(\d+)/);
  return m ? `${m[1]}br` : s;
}

/** Values a record exposes for a concept, always as a clean array. */
function valuesFor(record, spec) {
  if (!spec || typeof spec.get !== "function") return [];
  let v;
  try {
    v = spec.get(record);
  } catch {
    return [];
  }
  const arr = Array.isArray(v) ? v : [v];
  return arr.filter((x) => !isBlank(x));
}

function comparerFor(spec) {
  return spec?.compare === "beds" ? normBeds : norm;
}

/**
 * Which concepts does this tab actually support?
 * The bar renders exactly these and nothing else.
 *
 * @param {object} fieldMap
 * @returns {string[]} keys, in GLOBAL_FILTER_KEYS order
 */
export function supportedKeys(fieldMap) {
  if (!fieldMap) return [];
  return GLOBAL_FILTER_KEYS.filter(
    (k) => fieldMap[k] && typeof fieldMap[k].get === "function"
  );
}

/** Is this filter value actually asking for something? */
export function isActive(key, filters) {
  if (!filters) return false;
  if (key === "price") {
    return Number(filters.priceMin) > 0 || Number(filters.priceMax) > 0;
  }
  const v = filters[key];
  return !isBlank(v) && norm(v) !== ANY;
}

/** Which filters are active AND honoured by this tab. */
export function activeSupportedKeys(filters, fieldMap) {
  return supportedKeys(fieldMap).filter((k) => isActive(k, filters));
}

/**
 * Active filters this tab CANNOT honour. The bar uses this to tell the user
 * plainly, instead of showing a count that overstates what is applied.
 */
export function ignoredKeys(filters, fieldMap) {
  const supported = new Set(supportedKeys(fieldMap));
  return GLOBAL_FILTER_KEYS.filter((k) => isActive(k, filters) && !supported.has(k));
}

/** Does one record satisfy one concept? */
function matchesKey(record, key, filters, fieldMap) {
  const spec = fieldMap[key];
  if (!spec) return true; // unsupported here — never silently drops rows

  if (key === "price") {
    const min = Number(filters.priceMin) || 0;
    const max = Number(filters.priceMax) || 0;
    const raw = valuesFor(record, spec).map(Number).filter(Number.isFinite);
    if (raw.length === 0) return spec.onMissing === "include";
    return raw.some((n) => (min <= 0 || n >= min) && (max <= 0 || n <= max));
  }

  const want = comparerFor(spec)(filters[key]);
  const have = valuesFor(record, spec).map(comparerFor(spec));
  if (have.length === 0) return spec.onMissing === "include";
  return spec.exact === false
    ? have.some((h) => h === want || h.includes(want) || want.includes(h))
    : have.some((h) => h === want);
}

/**
 * Apply the global bar to a tab's records.
 *
 * Unsupported keys are IGNORED, never used to drop rows — a tab that cannot
 * honour "beds" must show all its rows, not zero. Use ignoredKeys() to tell
 * the user which of their selections this page could not apply.
 *
 * @param {Array} records
 * @param {object} filters   the global filter state (_gf)
 * @param {object} fieldMap  this tab's declaration
 * @returns {Array} the records that match
 */
export function applyGlobalFilters(records, filters, fieldMap) {
  if (!Array.isArray(records)) return [];
  if (!filters || !fieldMap) return records;
  const keys = activeSupportedKeys(filters, fieldMap);
  if (keys.length === 0) return records;
  return records.filter(
    (r) => r && keys.every((k) => matchesKey(r, k, filters, fieldMap))
  );
}

/**
 * Build a control's options FROM THE DATA, with counts.
 *
 * An option is emitted only when at least one record carries it, so a filter
 * can never offer a choice that returns nothing — the defect measured in
 * projectStage.js, where three of four options matched zero records.
 *
 * @param {Array}  records
 * @param {object} spec      a field-map entry, or {get}
 * @param {object} [opts]
 * @param {number} [opts.limit]        cap the list (longest tail dropped)
 * @param {boolean}[opts.withCounts]   append " (123)" to each label
 * @returns {{value:string,label:string,count:number}[]} sorted by count desc
 */
export function deriveOptions(records, spec, opts = {}) {
  const { limit = 0, withCounts = true } = opts;
  if (!Array.isArray(records) || !spec?.get) return [];
  const cmp = comparerFor(spec);
  const counts = new Map(); // comparable key -> {label, count}
  for (const r of records) {
    for (const raw of valuesFor(r, spec)) {
      const key = cmp(raw);
      if (!key) continue;
      const hit = counts.get(key);
      if (hit) hit.count += 1;
      else counts.set(key, { label: String(raw).trim(), count: 1 });
    }
  }
  let out = [...counts.entries()]
    .map(([value, { label, count }]) => ({
      value,
      label: withCounts ? `${label} (${count.toLocaleString()})` : label,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  if (limit > 0 && out.length > limit) out = out.slice(0, limit);
  return out;
}

/**
 * How many records would remain if this option were selected, given the other
 * filters already applied? Lets the UI grey out a choice before it is clicked.
 */
export function countIfSelected(records, filters, fieldMap, key, value) {
  return applyGlobalFilters(records, { ...filters, [key]: value }, fieldMap).length;
}
