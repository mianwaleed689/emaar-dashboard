/**
 * INBOUND LEADS — THE INTAKE STEP THAT DID NOT EXIST.
 * ═════════════════════════════════════════════════════════════════════════════
 *
 * POST /api/leads-inbound?source=meta|propertyfinder|bayut|dubizzle|website
 * GET  /api/leads-inbound            — Meta's webhook verification handshake
 *
 * WHY
 * ───
 * The CRM offered fifteen lead sources and every one of them was typed in by
 * hand. There was no webhook anywhere in api/. An agency paying for Property
 * Finder was re-keying its own enquiries.
 *
 * WHAT THIS DOES, AND WHAT IT REFUSES TO DO
 * ─────────────────────────────────────────
 * It normalises an enquiry into one lead, checks it is not somebody who already
 * enquired this month, routes it to an agent by a stated rule, writes it, and
 * tells that agent. What it will not do is guess: a field it cannot read is left
 * empty and the lead is flagged, because a mis-parsed budget looks exactly like
 * a typed one and an agent will quote it to a client.
 *
 * ON AUTHENTICATION
 * ─────────────────
 * Anything that writes to a database from the open internet needs a shared
 * secret, or a competitor floods your pipeline with junk. Every source except
 * Meta must present INBOUND_LEAD_SECRET. Meta signs its payloads with an app
 * secret instead, which is verified against META_APP_SECRET when that is set.
 *
 * If neither secret is configured the endpoint REFUSES every request rather than
 * running open — a lead intake that anyone on the internet can write to is worse
 * than no lead intake.
 */
const crypto = require("crypto");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

/* The model is ESM and shared with the browser; this file is CommonJS, so it is
   loaded dynamically. Keeping ONE copy of the parsing rules matters more than
   the small awkwardness here — two copies drift, and then the webhook and the
   screen disagree about what a lead says. */
let modelPromise = null;
const model = () => (modelPromise = modelPromise || import("../src/crm/model/intake.js"));

/* Initialised on first request, not at import.
   Doing this at module scope means a missing FIREBASE_PRIVATE_KEY takes the
   whole function down at load time with a stack trace, and the portal sending
   the lead sees an opaque 500. Lazily, a misconfiguration produces a sentence
   that names the missing variable — and the request still returns a retryable
   status so the enquiry is not lost. */
function database() {
  if (!getApps().length) {
    const key = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
    if (!key || !process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error("FIREBASE_PRIVATE_KEY or FIREBASE_CLIENT_EMAIL is not set on this deployment, " +
                      "so inbound leads cannot be written.");
    }
    initializeApp({
      credential: cert({
        projectId:   process.env.FIREBASE_PROJECT_ID || "dxb-analytics",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey:  key,
      }),
    });
  }
  return getFirestore();
}

/** Meta signs each delivery. An unsigned or wrongly signed body is not from Meta. */
function metaSignatureValid(req, rawBody) {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return false;
  const header = req.headers["x-hub-signature-256"] || "";
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  } catch { return false; }
}

module.exports = async function handler(req, res) {
  /* ── Meta's one-time webhook verification ─────────────────────────────── */
  if (req.method === "GET") {
    const token = process.env.META_VERIFY_TOKEN;
    if (token && req.query["hub.verify_token"] === token) {
      return res.status(200).send(req.query["hub.challenge"]);
    }
    return res.status(403).json({ error: "Verification token did not match." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Send a POST." });
  }

  const source = String(req.query.source || "website").toLowerCase();
  const rawBody = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});

  /* ── Authentication ───────────────────────────────────────────────────── */
  const sharedSecret = process.env.INBOUND_LEAD_SECRET;
  if (source === "meta") {
    if (!metaSignatureValid(req, rawBody)) {
      console.error("[leads-inbound] rejected: Meta signature missing or invalid");
      return res.status(401).json({ error: "Signature check failed." });
    }
  } else {
    if (!sharedSecret) {
      console.error("[leads-inbound] REFUSED — INBOUND_LEAD_SECRET is not set. " +
                    "Running open would let anyone on the internet write leads into a customer's CRM.");
      return res.status(503).json({ error: "Lead intake is not configured." });
    }
    const given = req.headers["x-intake-secret"] || req.query.secret || "";
    if (given !== sharedSecret) {
      return res.status(401).json({ error: "Bad or missing intake secret." });
    }
  }

  /* Which agency this lead belongs to. Without it the lead would land in no
     tenant and be invisible to everyone. */
  const orgId = req.query.orgId || req.body?.orgId;
  if (!orgId) {
    return res.status(400).json({ error: "orgId is required — a lead has to belong to an agency." });
  }

  let db;
  try {
    db = database();
  } catch (err) {
    console.error("[leads-inbound]", err.message);
    return res.status(503).json({ error: err.message });
  }

  try {
    const { normaliseLead, findDuplicate, routeLead } = await model();

    const { lead, needsReview, why, found, missing } =
      normaliseLead(source, req.body || {}, {});
    lead.orgId = orgId;

    /* ── Already enquired? ──────────────────────────────────────────────── */
    const recent = await db.collection("leads")
      .where("orgId", "==", orgId)
      .orderBy("createdAt", "desc")
      .limit(300).get()
      .then(s => s.docs.map(d => ({ id: d.id, ...d.data() })))
      .catch(err => {
        /* Without the duplicate check the lead is still worth having; losing it
           to be tidy would be worse. Say so rather than pretending. */
        console.error("[leads-inbound] duplicate check failed, continuing:", err.message);
        return [];
      });

    const dup = findDuplicate(lead, recent);
    if (dup) {
      await db.collection("leads").doc(dup.id).set({
        updatedAt: new Date().toISOString(),
        notes_log: [...(dup.notes_log || []), {
          text: `Enquired again through ${lead.source}` +
                (lead.property ? ` about ${lead.property}` : "") + ".",
          type: "Note", by: lead.source, at: new Date().toISOString(),
        }],
      }, { merge: true });
      console.log(`[leads-inbound] ${source}: duplicate of ${dup.id}, noted on the existing lead`);
      return res.status(200).json({ ok: true, duplicateOf: dup.id,
        note: "This person already enquired recently. The new enquiry was added to their existing lead " +
              "rather than creating a second one, so two agents do not ring the same buyer." });
    }

    /* ── Who gets it ────────────────────────────────────────────────────── */
    const [agentDocs, listingDocs] = await Promise.all([
      db.collection("users").where("orgId", "==", orgId).get().catch(() => ({ docs: [] })),
      db.collection("listings").where("orgId", "==", orgId).limit(500).get().catch(() => ({ docs: [] })),
    ]);

    const openByAgent = {};
    recent.forEach(l => {
      if (l.assignedTo && !["Closed Deal", "Closed Outside"].includes(l.status)) {
        openByAgent[l.assignedTo] = (openByAgent[l.assignedTo] || 0) + 1;
      }
    });

    const agents = agentDocs.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(u => (u.orgRole || "agent") === "agent")
      .map(u => ({
        id: u.uid || u.id, name: u.name || u.email || "Agent",
        communities: u.communities || [],
        activeLeads: openByAgent[u.uid || u.id] || 0,
        /* An agent whose broker card has lapsed cannot lawfully take this. */
        canBroker: !u.expiries?.brn || new Date(u.expiries.brn).getTime() > Date.now(),
      }));

    const listings = listingDocs.docs.map(d => ({ id: d.id, ...d.data() }));
    const route = routeLead(lead, agents, listings);

    if (route.agentId) {
      const who = agents.find(a => a.id === route.agentId);
      lead.assignedTo = route.agentId;
      lead.assignedToName = who?.name || "";
      lead.assignedAt = new Date().toISOString();
    }
    lead.routingRule = route.rule;
    lead.routingWhy  = route.why;

    const ref = await db.collection("leads").add(lead);

    /* ── Tell the agent ─────────────────────────────────────────────────── */
    if (route.agentId) {
      await db.collection("notifications").add({
        userId: route.agentId,
        type: "lead_assigned",
        title: `New ${lead.source} lead`,
        body: `${lead.name}${lead.community ? ` — ${lead.community}` : ""}` +
              (needsReview ? " (check the details, some could not be read)" : ""),
        read: false,
        createdAt: new Date().toISOString(),
      }).catch(err => console.error("[leads-inbound] could not notify:", err.message));
    }

    console.log(`[leads-inbound] ${source}: lead ${ref.id} → ` +
                `${route.agentId ? route.rule + " (" + lead.assignedToName + ")" : "unassigned"}` +
                `${needsReview ? " — FLAGGED: " + why : ""}`);

    return res.status(200).json({
      ok: true, id: ref.id,
      assignedTo: lead.assignedToName || null,
      routing: route.rule, why: route.why,
      read: found, couldNotRead: missing,
      needsReview, reviewReason: needsReview ? why : null,
    });
  } catch (err) {
    console.error("[leads-inbound] failed:", err);
    /* A 500 tells the portal to retry, which is what we want — losing a real
       enquiry is far more expensive than handling it twice. */
    return res.status(500).json({ error: "Could not record the lead. Please retry." });
  }
};
