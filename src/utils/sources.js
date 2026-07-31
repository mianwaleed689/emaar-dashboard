/**
 * CITATIONS — a source is a link, not a name
 *
 * ── WHY THIS CHANGED ────────────────────────────────────────────────────────
 *
 * The almanac shipped with sources as plain strings: "Al Jazeera, 25 November
 * 2009 — Dubai World seeks debt moratorium". Accurate, and useless. A reader who
 * wants to verify it has to go and search for it, which most will not do — so in
 * practice the citation asks to be trusted rather than checked.
 *
 * The entire claim this product makes is that a reader can check any figure. A
 * citation they cannot click is that claim made loosely.
 *
 * So a source is now an object with a URL, a publisher and a date, and the UI
 * renders it as a link that opens the actual article.
 *
 * ── BACKWARD COMPATIBILITY ──────────────────────────────────────────────────
 *
 * Plain strings are still accepted, because entries already exist in Firestore
 * with them and because some legitimate sources have no public URL — a paywalled
 * REIDIN report, a printed DLD release. normaliseSource() turns a string into
 * `{ title, url: null }`, and the UI renders those as plain text with a marker
 * saying no public link exists, rather than pretending one does.
 */

/**
 * Accepts a string or an object; returns the object shape.
 * @param {string|object} raw
 * @returns {{title: string, url: string|null, publisher: string|null, date: string|null, paywalled: boolean}}
 */
export function normaliseSource(raw) {
  if (!raw) return null;

  if (typeof raw === "string") {
    return { title: raw.trim(), url: null, publisher: null, date: null, paywalled: false };
  }

  const url = String(raw.url || "").trim();
  return {
    title: String(raw.title || raw.name || url || "Untitled source").trim(),
    url: isSafeHttpUrl(url) ? url : null,
    publisher: raw.publisher ? String(raw.publisher).trim() : null,
    date: raw.date ? String(raw.date).trim() : null,
    paywalled: raw.paywalled === true,
  };
}

/** Only http(s). Guards against a javascript: URL reaching an href. */
export function isSafeHttpUrl(u) {
  if (!u) return false;
  try {
    const parsed = new URL(u);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Hostname for display, e.g. "aljazeera.com". */
export function sourceHost(url) {
  if (!isSafeHttpUrl(url)) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function normaliseSources(list) {
  return (Array.isArray(list) ? list : []).map(normaliseSource).filter(Boolean);
}

/** How many of an entry's sources a reader can actually open. */
export function linkableCount(list) {
  return normaliseSources(list).filter(s => s.url).length;
}
