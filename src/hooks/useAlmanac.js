import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ALMANAC as SEED } from "../data/marketAlmanac";
import { mergeEntries } from "../utils/almanacSchema";

/**
 * The almanac, merged from two layers.
 *
 * ── WHY TWO LAYERS ──────────────────────────────────────────────────────────
 *
 *   SEED       src/data/marketAlmanac.js — curated, version-controlled,
 *              reviewed in pull requests, and present in the bundle. The
 *              pivotal moments live here and are available even if Firestore
 *              is unreachable.
 *
 *   COMPILED   tabData/almanac — built nightly from the almanacEntries
 *              collection by api/_cron/cron-almanac.js. This is what grows,
 *              because entries can be added through the admin editor without a
 *              deploy, which is what makes filling twenty years of months
 *              practical.
 *
 * Firestore wins on a shared id, so a curated entry can be corrected in the
 * admin without touching code, and an outage degrades to the curated set rather
 * than to an empty page.
 *
 * ── ONE READ ────────────────────────────────────────────────────────────────
 *
 * The compiled document is read with getDoc, not subscribed to. It changes once
 * a night; a live listener would cost more than it could possibly be worth. The
 * almanac could hold several hundred entries and still cost exactly one read
 * per visit — reading almanacEntries directly would cost one per entry, which is
 * the pattern that took this site down.
 */
export function useAlmanac() {
  const [state, setState] = useState({
    entries: SEED,
    loading: true,
    source: "seed",
    rejected: [],
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const snap = await getDoc(doc(db, "tabData", "almanac"));
        if (cancelled) return;

        if (!snap.exists()) {
          /* Nothing compiled yet — the curated seed is the whole almanac. */
          setState({ entries: SEED, loading: false, source: "seed", rejected: [], error: null });
          return;
        }

        const data = snap.data();
        const live = Array.isArray(data.entries) ? data.entries : [];

        setState({
          entries: mergeEntries(SEED, live),
          loading: false,
          source: live.length ? "merged" : "seed",
          rejected: Array.isArray(data.rejected) ? data.rejected : [],
          generatedAt: data.generatedAt ?? null,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        /* A failed read must never blank the page — fall back to the curated
           entries, which are already in the bundle. */
        setState({ entries: SEED, loading: false, source: "seed", rejected: [], error: err });
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return state;
}

export default useAlmanac;
