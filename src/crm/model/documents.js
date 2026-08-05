/**
 * DOCUMENTS — THE PAPERWORK BEHIND THE GATE.
 *
 * WHAT THIS CHANGES
 * ─────────────────
 * Pipeline's promise is that "a deal cannot pass a stage until the paperwork
 * that stage needs is on file". Until now that was a tick: somebody said the
 * NOC existed and the gate opened. A compliance gate you can pass by asserting
 * is worse than none, because it looks like control and is not — the file is
 * still in somebody's WhatsApp and nobody finds out until the trustee
 * appointment.
 *
 * A document record now carries the file: what it is called, how big it is,
 * where it is stored, who attached it and when. `isOnFile` is the question the
 * gate asks, and `strict` decides whether a tick alone still counts.
 *
 * WHY strict IS A SETTING AND NOT SIMPLY TRUE
 * ──────────────────────────────────────────
 * An agency with two years of deals already ticked cannot have every one of
 * them re-blocked overnight because the files were never uploaded. So the
 * agency turns it on when it is ready, and until then a tick still passes but
 * is reported as unevidenced — which is honest, and is the number that
 * persuades somebody to turn it on.
 *
 * WHAT IS REFUSED AT THE DOOR
 * ───────────────────────────
 * Executables and scripts, whatever they are renamed to, and anything above
 * the size limit. A CRM that will accept a .exe as a title deed is a way to
 * pass malware around an agency.
 */

const MB = 1024 * 1024;

export const MAX_FILE_BYTES = 15 * MB;

/* Scans, photographs and PDFs. Deliberately a permit list rather than a ban
   list: a ban list is a guess at every dangerous extension, and it is always
   one short. */
export const ACCEPTED = {
  "application/pdf": "PDF",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/heic": "HEIC",
  "image/heif": "HEIF",
  "image/webp": "WebP",
  "image/tiff": "TIFF",
};

export const ACCEPT_ATTR = Object.keys(ACCEPTED).join(",");

/** Human size, so an error can say what was wrong rather than that it was. */
export function humanSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < MB) return `${Math.round(n / 1024)} KB`;
  return `${(n / MB).toFixed(n < 10 * MB ? 1 : 0)} MB`;
}

/**
 * May this file be attached at all?
 *
 * Returns { ok } or { ok:false, reason } in plain words — the person holding a
 * 40MB photograph of a title deed needs to be told to send a smaller one, not
 * shown "invalid file".
 */
export function checkFile(file) {
  if (!file) return { ok: false, reason: "No file was chosen." };
  const type = (file.type || "").toLowerCase();
  if (!ACCEPTED[type]) {
    return { ok: false,
      reason: `That is a ${type || "file of unknown type"}. Attach a PDF or a photograph — ${Object.values(ACCEPTED).join(", ")}.` };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false,
      reason: `${humanSize(file.size)} is too large. The limit is ${humanSize(MAX_FILE_BYTES)} — photograph the page rather than scanning at full resolution.` };
  }
  if (file.size === 0) return { ok: false, reason: "That file is empty." };
  return { ok: true };
}

/** The record written against a deal when a file is attached. */
export function documentRecord({ file, path, backend, by, now = new Date() }) {
  return {
    receivedAt: now.toISOString(),
    by: by || "",
    file: {
      name: file?.name || "document",
      size: file?.size || 0,
      type: (file?.type || "").toLowerCase(),
      path: path || "",
      backend: backend || "local",
      uploadedAt: now.toISOString(),
    },
  };
}

/** Is this document genuinely on file, rather than merely asserted? */
export function isOnFile(doc) {
  return Boolean(doc && doc.file && doc.file.path);
}

/** Ticked at some point, by anybody, with or without a file behind it. */
export function isTicked(doc) {
  return Boolean(doc && doc.receivedAt);
}

/**
 * What the gate should say about one document.
 *
 *   strict false — a tick passes, and an unevidenced tick is reported
 *   strict true  — only a file passes
 */
export function documentState(doc, { strict = false } = {}) {
  if (isOnFile(doc)) return { state: "filed", passes: true, note: doc.file.name };
  if (isTicked(doc)) {
    return strict
      ? { state: "asserted", passes: false,
          note: "Ticked, but no file was ever attached. Attach it to move on." }
      : { state: "asserted", passes: true,
          note: "Ticked, but no file is attached." };
  }
  return { state: "missing", passes: false, note: "Not received." };
}

/**
 * Every required document for a deal, with its state.
 *
 * `required` is the list the stage needs — journeys.js already knows it, so it
 * is passed in rather than duplicated here. Duplicating it is how the gate and
 * the checklist end up disagreeing.
 */
export function documentAudit(deal = {}, required = [], { strict = false } = {}) {
  const docs = deal.documents || {};
  const rows = required.map(key => {
    const st = documentState(docs[key], { strict });
    return { key, ...st };
  });
  const missing    = rows.filter(r => !r.passes);
  const unevidenced = rows.filter(r => r.state === "asserted");
  return {
    rows,
    complete: missing.length === 0,
    missing: missing.map(r => r.key),
    unevidenced: unevidenced.map(r => r.key),
    /* The sentence an owner needs before deciding to turn strict on: how much
       of what the product says is filed has nothing behind it. */
    evidenceNote: unevidenced.length
      ? `${unevidenced.length} of ${rows.length} ticked with no file attached.`
      : rows.length ? "Every required document has a file." : "Nothing required yet.",
  };
}

/** Across a whole agency — the number that justifies switching strict on. */
export function evidenceCoverage(deals = [], requiredFor = () => []) {
  let ticked = 0, filed = 0;
  for (const d of deals) {
    for (const k of requiredFor(d) || []) {
      /* journeys.requiredDocuments() hands back document definitions, not
         keys. Taking only the string silently counted nothing and printed a
         confident 0%, which is worse than an error — an owner would have read
         "no paperwork is evidenced" off an agency that had evidenced it. */
      const key = typeof k === "string" ? k : k && k.key;
      if (!key) continue;
      const doc = (d.documents || {})[key];
      if (isTicked(doc)) { ticked++; if (isOnFile(doc)) filed++; }
    }
  }
  return {
    ticked, filed,
    unevidenced: ticked - filed,
    pct: ticked ? Math.round((filed / ticked) * 100) : 0,
    ready: ticked > 0 && filed === ticked,
  };
}
