/**
 * useFilters �€” URL-based global filter state
 * src/hooks/useFilters.js
 *
 * All dashboard filter state lives in the URL query string. Every tab
 * reads from here; the top filter bar writes to here. One source of truth.
 *
 * Usage:
 *
 *   import { useFilters } from "../hooks/useFilters";
 *
 *   function MyTab() {
 *     const { filters, setFilter, resetAll, activeCount } = useFilters();
 *     // filters.developer, filters.type, filters.community, etc.
 *
 *     // Change one filter:
 *     setFilter("developer", "emaar");
 *
 *     // Change several at once:
 *     setFilters({ developer: "emaar", type: "villa" });
 *
 *     // Clear everything:
 *     resetAll();
 *   }
 */

import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

/**
 * Default (unfiltered) values. Keep stable �€” changing these breaks saved
 * bookmarks.
 */
const DEFAULTS = Object.freeze({
  developer:   "all",
  type:        "all",
  subType:     "all",
  community:   "all",
  beds:        "all",
  status:      "all",
  year:        "all",
  priceMin:    0,
  priceMax:    0,
  search:      "",
  sort:        "score-desc",   // default sort: highest score first
});

/**
 * Map from camelCase filter key -> short URL key.
 * Short keys keep URLs readable and bookmarkable.
 */
const KEY_MAP = Object.freeze({
  developer:  "dev",
  type:       "type",
  subType:    "subtype",
  community:  "community",
  beds:       "beds",
  status:     "status",
  year:       "year",
  priceMin:   "pmin",
  priceMax:   "pmax",
  search:     "q",
  sort:       "sort",
});

const REVERSE_KEY_MAP = Object.freeze(
  Object.fromEntries(Object.entries(KEY_MAP).map(([k, v]) => [v, k]))
);

const NUMBER_KEYS = new Set(["priceMin", "priceMax"]);

/** Read a single filter from URLSearchParams with type coercion */
function readFilter(sp, key) {
  const urlKey = KEY_MAP[key];
  const raw = sp.get(urlKey);
  if (raw === null || raw === "") return DEFAULTS[key];
  if (NUMBER_KEYS.has(key)) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : DEFAULTS[key];
  }
  return raw;
}

/** Is this value the default (shouldn't be written to URL)? */
function isDefault(key, value) {
  const def = DEFAULTS[key];
  if (NUMBER_KEYS.has(key)) return Number(value) === def;
  return value === def || value === "" || value === null || value === undefined;
}

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Build filters object from current URL (memoized �€” only re-derives when
  // the query string actually changes)
  const filters = useMemo(() => {
    const out = {};
    for (const key of Object.keys(DEFAULTS)) {
      out[key] = readFilter(searchParams, key);
    }
    return out;
  }, [searchParams]);

  // Count of filters currently in non-default state �€” drives the "N filters
  // active" badge in the top bar.
  const activeCount = useMemo(() => {
    let count = 0;
    for (const key of Object.keys(DEFAULTS)) {
      if (!isDefault(key, filters[key])) count++;
    }
    return count;
  }, [filters]);

  /** Update one filter */
  const setFilter = useCallback(
    (key, value) => {
      if (!(key in DEFAULTS)) {
        console.warn(`useFilters: unknown filter key "${key}"`);
        return;
      }
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const urlKey = KEY_MAP[key];
          if (isDefault(key, value)) {
            next.delete(urlKey);
          } else {
            next.set(urlKey, String(value));
          }
          return next;
        },
        { replace: true } // no browser history entry per keystroke
      );
    },
    [setSearchParams]
  );

  /** Update several filters at once �€” one URL update, one re-render */
  const setFilters = useCallback(
    (patch) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (!(key in DEFAULTS)) continue;
            const urlKey = KEY_MAP[key];
            if (isDefault(key, value)) {
              next.delete(urlKey);
            } else {
              next.set(urlKey, String(value));
            }
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  /** Clear every filter �€” single URL update */
  const resetAll = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const urlKey of Object.values(KEY_MAP)) {
          next.delete(urlKey);
        }
        return next;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  return { filters, setFilter, setFilters, resetAll, activeCount, DEFAULTS };
}

/**
 * Apply the current filters to an array of projects (client-side).
 * Many tabs will use this helper rather than re-implementing filter logic.
 *
 * Project shape expected (per existing data_master.js):
 *   { developerId, type, community, beds, status, price, priceMin,
 *     priceMax, handover, handoverYear, name }
 */
export function applyFiltersToProjects(projects, filters) {
  if (!Array.isArray(projects)) return [];
  const f = filters || {};
  const search = (f.search || "").toLowerCase().trim();

  return projects.filter((p) => {
    if (!p) return false;

    // Developer
    if (f.developer && f.developer !== "all") {
      const dev = String(p.developerId || p.developer || "").toLowerCase();
      if (dev !== String(f.developer).toLowerCase()) return false;
    }

    // Property type
    if (f.type && f.type !== "all") {
      const t = String(p.type || "").toLowerCase();
      if (t !== String(f.type).toLowerCase()) return false;
    }

    // Community
    if (f.community && f.community !== "all") {
      const c = String(p.community || "").toLowerCase();
      if (c !== String(f.community).toLowerCase()) return false;
    }

    // Status (e.g. "offplan", "ready", "handover_2026")
    if (f.status && f.status !== "all") {
      const s = String(p.status || "").toLowerCase().replace(/[-\s]/g, "_");
      if (s !== String(f.status).toLowerCase().replace(/[-\s]/g, "_")) return false;
    }

    // Beds
    if (f.beds && f.beds !== "all") {
      const beds = Array.isArray(p.beds) ? p.beds : (p.beds ? [p.beds] : []);
      if (!beds.some((b) => String(b).toLowerCase() === String(f.beds).toLowerCase())) {
        return false;
      }
    }

    // Handover year
    if (f.year && f.year !== "all") {
      const hy = p.handoverYear || (p.handover ? new Date(p.handover).getFullYear() : null);
      if (!hy || String(hy) !== String(f.year)) return false;
    }

    // Price range �€” project's priceMin must be >= filter priceMin (if set)
    // AND project's priceMin must be <= filter priceMax (if set)
    const projectPrice = Number(p.priceMin ?? p.price ?? 0);
    if (f.priceMin && Number(f.priceMin) > 0 && projectPrice < Number(f.priceMin)) return false;
    if (f.priceMax && Number(f.priceMax) > 0 && projectPrice > Number(f.priceMax)) return false;

    // Search (fuzzy over name/developer/community)
    if (search) {
      const hay = [p.name, p.project, p.developer, p.community]
        .filter(Boolean).map((x) => String(x).toLowerCase()).join(" | ");
      if (!hay.includes(search)) return false;
    }

    return true;
  });
}

/**
 * Apply filters + sort to projects. Sort option drives ordering.
 */
export function applyFiltersAndSort(projects, filters) {
  const filtered = applyFiltersToProjects(projects, filters);
  const sort = (filters && filters.sort) || DEFAULTS.sort;
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  switch (sort) {
    case "score-desc":
      return [...filtered].sort((a, b) => num(b.investmentScore) - num(a.investmentScore));
    case "score-asc":
      return [...filtered].sort((a, b) => num(a.investmentScore) - num(b.investmentScore));
    case "price-asc":
      return [...filtered].sort((a, b) => num(a.priceMin ?? a.price) - num(b.priceMin ?? b.price));
    case "price-desc":
      return [...filtered].sort((a, b) => num(b.priceMin ?? b.price) - num(a.priceMin ?? a.price));
    case "yield-desc":
      return [...filtered].sort((a, b) => num(b.grossYield ?? b.yield) - num(a.grossYield ?? a.yield));
    case "ppsf-asc":
      return [...filtered].sort((a, b) => num(a.ppsf) - num(b.ppsf));
    case "ppsf-desc":
      return [...filtered].sort((a, b) => num(b.ppsf) - num(a.ppsf));
    case "handover-soon":
      return [...filtered].sort((a, b) => {
        const ya = num(a.handoverYear || new Date(a.handover || 0).getFullYear());
        const yb = num(b.handoverYear || new Date(b.handover || 0).getFullYear());
        return ya - yb;
      });
    case "name-asc":
      return [...filtered].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    default:
      return filtered;
  }
}

export default useFilters;
