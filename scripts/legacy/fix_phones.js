/**
 * fix_phones.js — DXB Analytics Lead Phone Normalizer
 * Fixes all phone numbers in the leads collection
 *
 * Run: node fix_phones.js
 * Requires: serviceAccountKey.json in project root
 *
 * What it does:
 *  - Strips spaces, dashes, dots, brackets
 *  - Adds +971 to bare UAE numbers (05x, 5x, 971...)
 *  - Adds + to numbers starting with country code digits
 *  - Skips empty / already clean phones
 *  - Writes back in Firestore batches of 400
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ─── Phone Normalizer ────────────────────────────────────────────────────────
function normalizePhone(raw) {
  if (!raw || typeof raw !== "string") return null;

  // Strip everything except digits and leading +
  let p = raw.trim();

  // Remove common separators
  p = p.replace(/[\s\-\.\(\)\/\\]/g, "");

  // If empty after stripping
  if (!p || p.length < 4) return null;

  // Already has + prefix — just clean and return
  if (p.startsWith("+")) {
    // Remove any non-digit after the +
    return "+" + p.slice(1).replace(/\D/g, "");
  }

  // Starts with 00 — replace with +
  if (p.startsWith("00")) {
    return "+" + p.slice(2).replace(/\D/g, "");
  }

  // Pure digits from here
  const digits = p.replace(/\D/g, "");

  // UAE mobile: starts with 05x (local format) → +9715x
  if (/^05[0-9]{8}$/.test(digits)) {
    return "+971" + digits.slice(1); // 0509999999 → +971509999999
  }

  // UAE mobile: starts with 5x (8 digits, no leading 0) → +9715x
  if (/^5[0-9]{8}$/.test(digits)) {
    return "+971" + digits; // 509999999 → +971509999999
  }

  // Already has 971 prefix (without +)
  if (digits.startsWith("971") && digits.length >= 11) {
    return "+" + digits;
  }

  // UAE landline: starts with 04 → +9714xxxxxxx
  if (/^04[0-9]{7}$/.test(digits)) {
    return "+971" + digits.slice(1);
  }

  // UAE landline: starts with 4 (7 digits) → +9714xxxxxxx
  if (/^4[0-9]{7}$/.test(digits)) {
    return "+971" + digits;
  }

  // Long number (11+ digits) with no country code hint — prepend +
  if (digits.length >= 10) {
    return "+" + digits;
  }

  // Short / ambiguous — return cleaned digits with +971 as fallback
  if (digits.length >= 7) {
    return "+971" + digits;
  }

  // Too short to be valid
  return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function fixPhones() {
  console.log("📞 DXB Analytics — Phone Fixer");
  console.log("═══════════════════════════════");

  // Fetch all leads
  console.log("⏳ Fetching all leads from Firestore...");
  const snap = await db.collection("leads").get();
  console.log(`✅ Loaded ${snap.size.toLocaleString()} leads\n`);

  const toUpdate = [];
  let skipped = 0;
  let alreadyClean = 0;
  let noPhone = 0;
  let invalid = 0;

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const raw = data.phone;

    if (!raw || raw.toString().trim() === "") {
      noPhone++;
      return;
    }

    const fixed = normalizePhone(raw.toString());

    if (!fixed) {
      invalid++;
      console.log(`  ⚠️  Cannot fix: "${raw}" (doc: ${docSnap.id})`);
      return;
    }

    // Already correct
    if (fixed === raw.toString().trim()) {
      alreadyClean++;
      return;
    }

    toUpdate.push({ id: docSnap.id, oldPhone: raw, newPhone: fixed });
  });

  console.log(`📊 Summary:`);
  console.log(`   Total leads      : ${snap.size.toLocaleString()}`);
  console.log(`   No phone         : ${noPhone.toLocaleString()}`);
  console.log(`   Already clean    : ${alreadyClean.toLocaleString()}`);
  console.log(`   Invalid (skip)   : ${invalid.toLocaleString()}`);
  console.log(`   To fix           : ${toUpdate.length.toLocaleString()}`);
  console.log("");

  if (toUpdate.length === 0) {
    console.log("✅ Nothing to fix — all phones are already clean!");
    process.exit(0);
  }

  // Preview first 10
  console.log("🔍 Preview (first 10 changes):");
  toUpdate.slice(0, 10).forEach((u) => {
    console.log(`   "${u.oldPhone}" → "${u.newPhone}"`);
  });
  console.log("");

  // Write in batches of 400
  const BATCH_SIZE = 400;
  let done = 0;
  const total = toUpdate.length;

  console.log(`✍️  Writing ${total.toLocaleString()} updates in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const chunk = toUpdate.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    chunk.forEach(({ id, newPhone }) => {
      batch.update(db.collection("leads").doc(id), {
        phone: newPhone,
        phoneFixed: true,
        phoneFixedAt: new Date().toISOString(),
      });
    });

    await batch.commit();
    done += chunk.length;

    const pct = Math.round((done / total) * 100);
    process.stdout.write(`\r   Progress: ${done.toLocaleString()}/${total.toLocaleString()} (${pct}%)`);
  }

  console.log("\n");
  console.log("✅ Phone fix complete!");
  console.log(`   Fixed  : ${total.toLocaleString()} phones`);
  console.log(`   Skipped: ${(noPhone + invalid).toLocaleString()} (no phone or invalid)`);
  console.log("\n🎉 Done. Reload your leads tab to see clean numbers.");

  process.exit(0);
}

fixPhones().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
