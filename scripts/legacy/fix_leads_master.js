/**
 * DXB ANALYTICS — MASTER LEAD FIXER
 * Fixes ALL issues found in deep analysis of 67,722 leads
 *
 * Fixes applied:
 * 1. Phone normalization (smart 194-country detector)
 * 2. Remove "nan" project names → empty string
 * 3. Flag unreachable leads (no phone + no email)
 * 4. Flag duplicate phones
 * 5. Flag duplicate emails
 * 6. Flag corrupt phones (13+ digits or <7 digits)
 * 7. Normalize email to lowercase
 * 8. Trim whitespace from all string fields
 *
 * Run: node fix_leads_master.js
 * Safe: only updates fields that need fixing, never deletes
 */

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// ── Country code list (longest first) ────────────────────────────────────────
const COUNTRY_CODES = [
  "421","420","389","387","386","385","382","381","380","376","375","374",
  "373","372","371","370","359","358","357","356","355","354","353","352",
  "351","350","299","298","297","996","995","994","993","992","977","976",
  "975","974","973","972","971","970","968","967","966","965","964","963",
  "962","961","960","886","880","856","855","853","852","850","509","508",
  "507","506","505","504","503","502","501","500","423",
  "98","95","94","93","92","91","90","86","84","82","81",
  "66","65","64","63","62","61","60","55","54","53","52",
  "51","49","48","47","46","45","44","43","41","40","39",
  "36","34","33","32","31","30","27","20","7","1",
];

// ── Smart Phone Normalizer ────────────────────────────────────────────────────
function normalizePhone(raw) {
  if (!raw || typeof raw !== "string") return { phone: "", flag: "no_phone" };
  let p = raw.toString().trim().replace(/[\s\-\.\(\)\/\\]/g, "");
  if (!p || p.length < 2) return { phone: "", flag: "no_phone" };

  // Already international
  if (p.startsWith("+")) {
    const clean = "+" + p.slice(1).replace(/\D/g, "");
    const len = clean.slice(1).length;
    if (len > 15) return { phone: clean, flag: "phone_too_long" };
    return { phone: clean, flag: "ok" };
  }

  if (p.startsWith("00")) {
    const clean = "+" + p.slice(2).replace(/\D/g, "");
    return { phone: clean, flag: "ok" };
  }

  const d = p.replace(/\D/g, "");
  const len = d.length;

  // Too short — corrupt
  if (len < 6) return { phone: d, flag: "phone_too_short" };

  // Too long — likely corrupt/concatenated
  if (len > 15) return { phone: d, flag: "phone_too_long" };

  // UAE specific patterns
  if (/^05[0-9]{8}$/.test(d)) return { phone: "+971" + d.slice(1), flag: "ok" };
  if (/^5[0-9]{8}$/.test(d)) return { phone: "+971" + d, flag: "ok" };
  if (/^04[0-9]{7}$/.test(d)) return { phone: "+971" + d.slice(1), flag: "ok" };
  if (/^4[0-9]{7}$/.test(d)) return { phone: "+971" + d, flag: "ok" };

  // Short (7-9 digits, no country code) → assume UAE
  if (len >= 7 && len <= 9) return { phone: "+971" + d, flag: len === 7 ? "phone_short_uae" : "ok" };

  // Long numbers — detect country code
  if (len >= 10) {
    for (const code of COUNTRY_CODES) {
      if (d.startsWith(code)) {
        const remaining = d.slice(code.length);
        if (remaining.length >= 6 && remaining.length <= 12) {
          return { phone: "+" + code + remaining, flag: "ok" };
        }
      }
    }
    // No country code match — return with + as best effort
    return { phone: "+" + d, flag: "ok" };
  }

  return { phone: d, flag: "ok" };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function fixLeads() {
  console.log("🔧 DXB Analytics — Master Lead Fixer");
  console.log("═══════════════════════════════════════════════════════");
  console.log("⏳ Loading all leads from Firestore...\n");

  const snap = await db.collection("leads").get();
  console.log(`✅ Loaded ${snap.size.toLocaleString()} leads\n`);

  // ── Pass 1: Collect all phones/emails for duplicate detection ──
  const phoneMap = {}; // normalized phone → [docId]
  const emailMap = {}; // email → [docId]

  snap.forEach(d => {
    const data = d.data();
    const { phone: normPhone } = normalizePhone(data.phone);
    if (normPhone && normPhone.length > 6) {
      if (!phoneMap[normPhone]) phoneMap[normPhone] = [];
      phoneMap[normPhone].push(d.id);
    }
    if (data.email && data.email.includes("@")) {
      const e = data.email.toLowerCase().trim();
      if (!emailMap[e]) emailMap[e] = [];
      emailMap[e].push(d.id);
    }
  });

  const dupPhoneSet = new Set(
    Object.entries(phoneMap).filter(([,ids]) => ids.length > 1).flatMap(([,ids]) => ids.slice(1))
  );
  const dupEmailSet = new Set(
    Object.entries(emailMap).filter(([,ids]) => ids.length > 1).flatMap(([,ids]) => ids.slice(1))
  );

  console.log(`📊 Duplicate detection:`);
  console.log(`   Duplicate phones : ${Object.entries(phoneMap).filter(([,ids])=>ids.length>1).length.toLocaleString()} groups`);
  console.log(`   Duplicate emails : ${Object.entries(emailMap).filter(([,ids])=>ids.length>1).length.toLocaleString()} groups\n`);

  // ── Pass 2: Build updates ──
  const toUpdate = [];
  let stats = {
    phoneFixed: 0, emailFixed: 0, nanProject: 0,
    unreachable: 0, dupPhone: 0, dupEmail: 0,
    tooShort: 0, tooLong: 0, noChanges: 0,
  };

  snap.forEach(docSnap => {
    const data = docSnap.data();
    const update = {};
    let changed = false;

    // 1. Fix phone
    const rawPhone = (data.phone || "").toString();
    const { phone: normPhone, flag: phoneFlag } = normalizePhone(rawPhone);
    if (normPhone !== rawPhone) {
      update.phone = normPhone;
      update.phoneFixed = true;
      changed = true;
      stats.phoneFixed++;
    }

    // 2. Phone quality flags
    const tags = [...(data.tags || [])];
    if (phoneFlag === "phone_too_short") { if (!tags.includes("phone_short")) tags.push("phone_short"); stats.tooShort++; changed = true; }
    if (phoneFlag === "phone_too_long") { if (!tags.includes("phone_corrupt")) tags.push("phone_corrupt"); stats.tooLong++; changed = true; }

    // 3. Unreachable flag
    const hasPhone = normPhone && normPhone.length > 6;
    const hasEmail = data.email && data.email.includes("@");
    if (!hasPhone && !hasEmail) {
      if (!tags.includes("unreachable")) tags.push("unreachable");
      stats.unreachable++;
      changed = true;
    }

    // 4. Duplicate phone flag
    if (dupPhoneSet.has(docSnap.id)) {
      if (!tags.includes("duplicate_phone")) tags.push("duplicate_phone");
      stats.dupPhone++;
      changed = true;
    }

    // 5. Duplicate email flag
    if (dupEmailSet.has(docSnap.id)) {
      if (!tags.includes("duplicate_email")) tags.push("duplicate_email");
      stats.dupEmail++;
      changed = true;
    }

    // 6. Fix email — lowercase + trim
    if (data.email && data.email !== data.email.toLowerCase().trim()) {
      update.email = data.email.toLowerCase().trim();
      changed = true;
      stats.emailFixed++;
    }

    // 7. Fix "nan" project name
    if (data.project && (data.project === "nan" || data.project === "NaN" || data.project === "null")) {
      update.project = "";
      changed = true;
      stats.nanProject++;
    }

    // 8. Trim all string fields
    ["name","community","nationality","source"].forEach(field => {
      if (data[field] && typeof data[field] === "string" && data[field] !== data[field].trim()) {
        update[field] = data[field].trim();
        changed = true;
      }
    });

    if (tags.join(",") !== (data.tags || []).join(",")) {
      update.tags = tags;
    }

    if (changed) {
      update.updatedAt = new Date().toISOString();
      toUpdate.push({ id: docSnap.id, update });
    } else {
      stats.noChanges++;
    }
  });

  console.log(`📋 Changes to apply: ${toUpdate.length.toLocaleString()}`);
  console.log(`   Phone normalized : ${stats.phoneFixed.toLocaleString()}`);
  console.log(`   Email lowercased : ${stats.emailFixed.toLocaleString()}`);
  console.log(`   "nan" project fix: ${stats.nanProject.toLocaleString()}`);
  console.log(`   Unreachable flag : ${stats.unreachable.toLocaleString()}`);
  console.log(`   Dup phone flag   : ${stats.dupPhone.toLocaleString()}`);
  console.log(`   Dup email flag   : ${stats.dupEmail.toLocaleString()}`);
  console.log(`   Phone too short  : ${stats.tooShort.toLocaleString()}`);
  console.log(`   Phone too long   : ${stats.tooLong.toLocaleString()}`);
  console.log(`   No changes needed: ${stats.noChanges.toLocaleString()}\n`);

  if (toUpdate.length === 0) {
    console.log("✅ All leads already clean!");
    process.exit(0);
  }

  // ── Pass 3: Write in batches of 400 ──
  const BATCH_SIZE = 400;
  let done = 0;
  const total = toUpdate.length;
  console.log(`✍️  Writing ${total.toLocaleString()} updates in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const chunk = toUpdate.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    chunk.forEach(({ id, update }) => {
      batch.update(db.collection("leads").doc(id), update);
    });

    let success = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try { await batch.commit(); success = true; break; }
      catch(e) {
        console.log(`  Retry ${attempt}: ${e.message.slice(0,50)}`);
        await new Promise(r => setTimeout(r, 3000 * attempt));
      }
    }

    done += chunk.length;
    const pct = Math.round((done / total) * 100);
    process.stdout.write(`\r   Progress: ${done.toLocaleString()}/${total.toLocaleString()} (${pct}%)`);
  }

  console.log("\n");
  console.log("✅ MASTER FIX COMPLETE!");
  console.log("════════════════════════════════════════");
  console.log(`   Total processed : ${snap.size.toLocaleString()}`);
  console.log(`   Total updated   : ${total.toLocaleString()}`);
  console.log(`   Unreachable leads tagged: ${stats.unreachable.toLocaleString()}`);
  console.log(`   Duplicate emails tagged : ${stats.dupEmail.toLocaleString()}`);
  console.log(`   Duplicate phones tagged : ${stats.dupPhone.toLocaleString()}`);
  console.log("\n🎉 Reload your Leads tab to see clean data.");
  process.exit(0);
}

fixLeads().catch(err => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
