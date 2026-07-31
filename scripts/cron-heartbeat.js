/**
 * CRON HEARTBEAT — makes a silent failure visible.
 *
 * ── WHY ─────────────────────────────────────────────────────────────────────
 *
 * The DLD sync stopped and nobody noticed for 128 days. Not because the failure
 * was subtle, but because nothing recorded that the job had run. A cron that
 * fails silently is indistinguishable from a cron that has nothing to do, and
 * both look exactly like a cron that is working.
 *
 * GitHub emails on a failed workflow. It does not email when a workflow was
 * never triggered, which is the failure that actually happened here — the job
 * did not exist. And an email is not visible in the product, so the admin panel
 * showed a healthy system while the data went stale underneath it.
 *
 * This writes one document per run to cronLogs, with the outcome. It is called
 * as the LAST step of a workflow with `if: always()`, so it records failures as
 * faithfully as successes. Deliberately a separate script rather than an edit to
 * auto-sync.js: the sync logic is untestable without production credentials, and
 * a heartbeat that breaks the job it is monitoring is worse than none.
 *
 *   node scripts/cron-heartbeat.js <job-name> <success|failure|cancelled> [note]
 *
 * Reading the ABSENCE of a recent entry is the point. A job that never fires
 * writes nothing at all, so the admin panel should alert on staleness — "last
 * seen 3 days ago" — not merely on a logged failure.
 */
const admin = require("firebase-admin");

const [, , jobName, status, ...noteParts] = process.argv;

if (!jobName || !status) {
  console.error("usage: node scripts/cron-heartbeat.js <job-name> <status> [note]");
  process.exit(2);
}

const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

async function main() {
  const now = new Date();
  const note = noteParts.join(" ") || null;

  /* One document per job per run. The id sorts chronologically so the most
     recent run for a job is a single ordered query rather than a scan. */
  const id = `${jobName}_${now.toISOString().replace(/[:.]/g, "-")}`;

  await db.collection("cronLogs").doc(id).set({
    job: jobName,
    status,                       // success | failure | cancelled
    ok: status === "success",
    note,
    ranAt: now.toISOString(),
    date: now.toISOString().split("T")[0],
    source: "github-actions",
  });

  console.log(`cronLogs: ${jobName} -> ${status}${note ? " (" + note + ")" : ""}`);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    /* Never fail the workflow because the heartbeat could not be written. The
       job's own result is what matters; a missing heartbeat shows up as
       staleness, which is the signal being relied on anyway. */
    console.error("heartbeat write failed:", err && err.message);
    process.exit(0);
  });
