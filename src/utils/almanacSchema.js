/**
 * ALMANAC ENTRY SCHEMA AND VALIDATION
 *
 * Shared by the admin editor, the compile script and the client, so a rule
 * cannot be enforced in one place and forgotten in another.
 *
 * ── THE ONE RULE ────────────────────────────────────────────────────────────
 *
 * An entry without a named source does not publish. Not as a draft, not with a
 * caveat, not "temporarily". The almanac's entire value is that a reader can
 * check any claim in it; one unsourced entry costs more credibility than a
 * hundred sourced ones earn.
 *
 * validateEntry() is therefore the gate, and both the admin form and the
 * compiler run it. The compiler refuses to publish anything that fails.
 */

export const MOMENT_TYPES = ["reform", "record", "shock", "recovery", "milestone"];

/** Fields an entry may carry. `id`, `label`, `moment`, `headline`, `sources` are required. */
export const ENTRY_FIELDS = [
  { key: "id",           label: "Period ID",        required: true,  hint: "YYYY or YYYY-MM, e.g. 2009-11" },
  { key: "label",        label: "Display label",    required: true,  hint: "e.g. November 2009" },
  { key: "moment",       label: "Type",             required: true,  hint: "reform · record · shock · recovery · milestone" },
  { key: "headline",     label: "Headline",         required: true,  hint: "One line. What a reader sees before opening." },
  { key: "whatHappened", label: "What happened",    required: false, hint: "The event, in plain language." },
  { key: "effect",       label: "Effect on market", required: false, hint: "What it did, specifically. Numbers belong here." },
  { key: "whoInvested",  label: "Who was buying",   required: false, hint: "Only where documented." },
  { key: "lesson",       label: "What it teaches",  required: false, hint: "Why it matters to someone deciding today." },
];

/** Metric slots. Free text, because published figures carry their own units. */
export const METRIC_FIELDS = [
  { key: "transactions", label: "Transactions" },
  { key: "value",        label: "Value" },
  { key: "medianPpsf",   label: "Median price" },
  { key: "priceChange",  label: "Price change" },
];

const ID_PATTERN = /^\d{4}(-\d{2})?$|^\d{4}\s*[–-]\s*\d{4}$/;

/**
 * Validate an entry.
 * @returns {{ok: boolean, errors: string[], warnings: string[]}}
 */
export function validateEntry(entry) {
  const errors = [];
  const warnings = [];

  if (!entry || typeof entry !== "object") {
    return { ok: false, errors: ["Entry is not an object"], warnings: [] };
  }

  for (const f of ENTRY_FIELDS) {
    if (f.required && !String(entry[f.key] ?? "").trim()) {
      errors.push(`${f.label} is required`);
    }
  }

  if (entry.id && !ID_PATTERN.test(String(entry.id).trim())) {
    errors.push(`Period ID "${entry.id}" must be YYYY, YYYY-MM, or YYYY–YYYY`);
  }

  if (entry.moment && !MOMENT_TYPES.includes(entry.moment)) {
    errors.push(`Type must be one of: ${MOMENT_TYPES.join(", ")}`);
  }

  /* THE RULE. */
  const sources = Array.isArray(entry.sources)
    ? entry.sources.map(s => String(s).trim()).filter(Boolean)
    : [];
  if (!sources.length) {
    errors.push("At least one source is required — an entry without a source cannot publish");
  }
  sources.forEach(s => {
    if (s.length < 8) errors.push(`Source "${s}" is too short to identify anything`);
  });

  /* Warnings do not block publication but are worth surfacing to the author. */
  const hasBody = ["whatHappened", "effect", "lesson"].some(k => String(entry[k] ?? "").trim());
  if (!hasBody) {
    warnings.push("No narrative — a headline alone teaches nothing. Add what happened, its effect, or the lesson.");
  }
  if (!entry.lesson) {
    warnings.push("No lesson. The lesson is the part a reader is actually paying for.");
  }
  if (entry.metrics && Object.values(entry.metrics).every(v => !String(v ?? "").trim())) {
    warnings.push("Metrics object is present but empty — remove it or fill it.");
  }

  return { ok: errors.length === 0, errors, warnings };
}

/** Normalise an entry to the stored shape, dropping empties. */
export function normaliseEntry(raw) {
  const out = { id: String(raw.id || "").trim() };

  for (const f of ENTRY_FIELDS) {
    const v = String(raw[f.key] ?? "").trim();
    if (v) out[f.key] = v;
  }

  const metrics = {};
  for (const m of METRIC_FIELDS) {
    const v = String(raw.metrics?.[m.key] ?? "").trim();
    if (v) metrics[m.key] = v;
  }
  if (Object.keys(metrics).length) out.metrics = metrics;

  out.sources = (Array.isArray(raw.sources) ? raw.sources : [])
    .map(s => String(s).trim())
    .filter(Boolean);

  return out;
}

/**
 * Sort key so 2009-11 orders after 2009 and before 2013-10, and a range like
 * "2014 – 2019" sorts by its start year.
 */
export function sortKey(entry) {
  const id = String(entry.id || "");
  const year = id.slice(0, 4);
  const month = /^\d{4}-(\d{2})$/.test(id) ? id.slice(5, 7) : "00";
  return `${year}-${month}`;
}

/** Merge curated seed entries with Firestore entries; Firestore wins on id. */
export function mergeEntries(seed = [], live = []) {
  const byId = new Map();
  seed.forEach(e => byId.set(e.id, { ...e, origin: "seed" }));
  live.forEach(e => byId.set(e.id, { ...e, origin: "firestore" }));
  return [...byId.values()].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}
