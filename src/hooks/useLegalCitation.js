// src/hooks/useLegalCitation.js
//
// Reads a legal citation from Firestore and returns the version that is
// currently effective. Auto-switches when effectiveFrom/effectiveUntil
// boundaries are crossed (e.g., the Civil Code transition on 2026-06-01).
//
// Usage:
//   const { citation, loading, error } = useLegalCitation('civil-code-1985-art-295');
//
// On 2026-05-31: returns Federal Law 5/1985 Art. 295
// On 2026-06-01: automatically returns the Decree 25/2025 replacement

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getEffectiveCitation } from '../config/legalCitations.seed';

// Module-level cache so multiple components share one Firestore listener
let cachedPool = null;
let cacheLoading = false;
let listeners = [];

function ensureSubscription() {
  if (cachedPool !== null || cacheLoading) return;
  cacheLoading = true;

  const ref = collection(db, 'legal_citations');
  onSnapshot(
    ref,
    (snap) => {
      cachedPool = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      cacheLoading = false;
      listeners.forEach((fn) => fn(cachedPool));
    },
    (err) => {
      console.error('[useLegalCitation] Firestore subscription error:', err);
      cacheLoading = false;
      listeners.forEach((fn) => fn(null, err));
    }
  );
}

export function useLegalCitation(citationId) {
  const [pool, setPool] = useState(cachedPool);
  const [error, setError] = useState(null);

  useEffect(() => {
    ensureSubscription();

    const handler = (newPool, err) => {
      if (err) setError(err);
      else setPool(newPool);
    };
    listeners.push(handler);

    // If cache already populated, sync immediately
    if (cachedPool !== null) setPool(cachedPool);

    return () => {
      listeners = listeners.filter((fn) => fn !== handler);
    };
  }, []);

  // If Firestore returns nothing yet, fall back to the bundled seed.
  // This guarantees the UI shows accurate citations even on first render
  // before the Firestore listener has fired.
  const effective =
    pool && pool.length > 0
      ? getEffectiveCitation(citationId, new Date(), pool)
      : getEffectiveCitation(citationId);

  return {
    citation: effective,
    loading: pool === null && !error,
    error,
  };
}
