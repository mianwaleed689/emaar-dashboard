// scripts/seedLegalCitations.js
//
// One-time seed script: pushes the LEGAL_CITATIONS_SEED data into the
// `legal_citations/` Firestore collection.
//
// Usage:
//   node scripts/seedLegalCitations.js
//
// Requires:
//   - firebase-admin installed (already in your package.json)
//   - A service account key file at ./serviceAccountKey.json
//     (download from Firebase Console > Project Settings > Service Accounts)
//   - OR set GOOGLE_APPLICATION_CREDENTIALS environment variable
//
// Safe to run multiple times — uses `set()` with merge:true (idempotent).

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the seed data via dynamic import (the seed file uses ES modules)
const seedModule = await import('../src/config/legalCitations.seed.js');
const { LEGAL_CITATIONS_SEED } = seedModule;

// ─── Initialize firebase-admin ──────────────────────────────────────
if (!getApps().length) {
  const keyPath = join(__dirname, '..', 'serviceAccountKey.json');

  if (existsSync(keyPath)) {
    const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
    initializeApp({ credential: cert(serviceAccount) });
    console.log('✓ firebase-admin initialized via serviceAccountKey.json');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp();
    console.log('✓ firebase-admin initialized via GOOGLE_APPLICATION_CREDENTIALS');
  } else {
    console.error('✗ No credentials found.');
    console.error('  Either:');
    console.error('    1. Place serviceAccountKey.json in project root, or');
    console.error('    2. Set GOOGLE_APPLICATION_CREDENTIALS env variable.');
    console.error('  Download key from: Firebase Console > Project Settings > Service Accounts');
    process.exit(1);
  }
}

const db = getFirestore();

// ─── Seed ───────────────────────────────────────────────────────────
async function seed() {
  console.log(`\nSeeding ${LEGAL_CITATIONS_SEED.length} legal citations...\n`);

  const batch = db.batch();
  let count = 0;

  for (const citation of LEGAL_CITATIONS_SEED) {
    const ref = db.collection('legal_citations').doc(citation.id);
    batch.set(
      ref,
      {
        ...citation,
        seededAt: new Date().toISOString(),
        seedVersion: '1.0',
      },
      { merge: true }
    );
    count++;
    console.log(`  + ${citation.id}  (${citation.shortName})`);
  }

  await batch.commit();
  console.log(`\n✓ Successfully seeded ${count} citations to Firestore.\n`);

  // Verify — read back a sample
  const sample = await db.collection('legal_citations').doc('civil-code-1985-art-295').get();
  if (sample.exists) {
    const data = sample.data();
    console.log('Verification — Civil Code Art. 295 (current):');
    console.log(`  effectiveUntil: ${data.effectiveUntil}`);
    console.log(`  replacedById:   ${data.replacedById}`);
  }

  const replacement = await db.collection('legal_citations').doc('civil-code-2025-damages').get();
  if (replacement.exists) {
    const data = replacement.data();
    console.log('\nVerification — Decree 25/2025 replacement:');
    console.log(`  effectiveFrom: ${data.effectiveFrom}`);
  }

  console.log('\nDone.\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n✗ Seed failed:', err);
  process.exit(1);
});
