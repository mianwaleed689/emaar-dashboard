/**
 * Correct the 2026 point on the Market tab's recovery chart.
 *
 * THE PROBLEM
 *
 * marketMetrics/{marketChart} holds one document per year. The 2026 entry is
 * keyed "2026 YTD" and contains JANUARY 2026 ONLY — 16,919 transactions and
 * AED 32B — while every other point is a full year. Plotted together, 2026
 * appears to collapse to near-zero against 2025's AED 917B, which is a chart
 * that misleads at a glance regardless of the caption.
 *
 * It was written in early 2026 and never advanced. By end of July it described
 * a period seven months gone while being labelled "YTD".
 *
 * THE FIX
 *
 * Replace it with Q1 2026, which is corroborated across sources: AED 252B
 * across 60,303 transactions, +31% value and +6% volume year on year, average
 * AED 1,759/sqft.
 *
 * H1 2026 would be more current, but published H1 totals disagree by scope —
 * 49,401 / 79,281 / 86,005 transactions depending on whether land parcels and
 * whole buildings are counted. Q1 is the figure that can be stated without
 * choosing between them.
 *
 * The label makes the part-year explicit rather than leaving "YTD" to imply
 * something it no longer means.
 *
 * DRY RUN BY DEFAULT.
 *   node scripts/fix-market-chart-2026.js            # show me
 *   node scripts/fix-market-chart-2026.js --write     # apply
 *
 * Touches exactly one document. Nothing is deleted.
 */
const admin = require("firebase-admin");

const WRITE = process.argv.includes("--write");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const UPDATED = {
  year: "Q1 2026",
  transactions: 60303,
  value: 252,
  ppsf: 1759,
  offPlanShare: 72,
  yoyValueChange: 31,
  type: "partial",
  periodLabel: "Q1 2026 — part year, not comparable to the full years beside it",
  note: "AED 252B across 60,303 transactions, +31% value and +6% volume YoY. Average AED 1,759/sqft, +12.5% YoY. Off-plan 72% of residential transactions in Q1 2026.",
  source: "Dubai Land Department, Q1 2026 reporting",
  asOf: "2026-03-31",
  category: "marketChart",
};

async function run() {
  console.log(WRITE ? "MODE: WRITE\n" : "MODE: DRY RUN — nothing will be written\n");

  const snap = await db.collection("marketMetrics").where("category", "==", "marketChart").get();
  const target = snap.docs.find(d => String(d.data().year).startsWith("2026"));

  if (!target) {
    console.log("No 2026 chart document found. Nothing to do.");
    process.exit(0);
  }

  const before = target.data();
  console.log("─── CURRENT ─────────────────────────────────────────────────");
  console.log(`  doc id         ${target.id}`);
  console.log(`  year           ${before.year}`);
  console.log(`  transactions   ${Number(before.transactions).toLocaleString()}`);
  console.log(`  value          AED ${before.value}B`);
  console.log(`  ppsf           ${before.ppsf ?? "—"}`);
  console.log(`  note           ${String(before.note || "").slice(0, 70)}`);

  console.log("\n─── PROPOSED ────────────────────────────────────────────────");
  console.log(`  year           ${UPDATED.year}`);
  console.log(`  transactions   ${UPDATED.transactions.toLocaleString()}   (was ${Number(before.transactions).toLocaleString()})`);
  console.log(`  value          AED ${UPDATED.value}B   (was AED ${before.value}B)`);
  console.log(`  ppsf           ${UPDATED.ppsf}`);
  console.log(`  type           ${UPDATED.type}  — flagged as a part year`);
  console.log(`  source         ${UPDATED.source}`);

  console.log("\n  Effect on the chart: the 2026 point rises from AED 32B to AED 252B,");
  console.log("  which stops it reading as a market collapse, and its label now says");
  console.log("  plainly that it covers one quarter rather than a full year.");

  if (!WRITE) {
    console.log("\nDRY RUN — Firestore was NOT modified.");
    console.log("Re-run with --write to apply.");
    process.exit(0);
  }

  await db.collection("marketMetrics").doc(target.id).set(UPDATED, { merge: true });
  console.log(`\nUpdated marketMetrics/${target.id}`);
  process.exit(0);
}

run().catch(err => { console.error("FAILED:", err.message); process.exit(1); });
