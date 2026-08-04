/**
 * FILE STORAGE — ONE SEAM, TWO IMPLEMENTATIONS.
 *
 * WHY AN ADAPTER RATHER THAN CALLING FIREBASE DIRECTLY
 * ───────────────────────────────────────────────────
 * The document feature is the whole point of the Pipeline: "a deal cannot pass
 * a stage until the paperwork that stage needs is on file" is only true if
 * there is a file. But no Storage bucket exists on this project yet — both
 * dxb-analytics.firebasestorage.app and dxb-analytics.appspot.com answer 404 —
 * and enabling one is a billing decision that belongs to the owner, not to me.
 *
 * So everything above this file is written once, against `put`, `url` and
 * `remove`. Today those land in the browser, which means the entire feature —
 * attaching, opening, replacing, removing, the gate, the audit trail — can be
 * used and tested now. The day a bucket exists, `pickBackend()` chooses the
 * Firebase implementation instead and nothing above changes.
 *
 * WHAT THE LOCAL BACKEND IS AND IS NOT
 * ────────────────────────────────────
 * It is IndexedDB in the browser that uploaded the file. That is genuinely
 * enough to build and demonstrate against, and it is genuinely NOT a place to
 * keep a client's title deed: another person cannot see it, and clearing site
 * data destroys it. Every caller is told which backend it got, and the UI says
 * so plainly rather than letting somebody believe a document is filed when it
 * is sitting in one laptop's browser.
 */

const DB_NAME = "dxb-documents";
const STORE   = "files";

/* ── LOCAL: IndexedDB ─────────────────────────────────────────────────────── */

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const localBackend = {
  id: "local",
  durable: false,
  label: "this browser only",
  async put(path, file) {
    const db = await openDb();
    const buf = await file.arrayBuffer();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ buf, type: file.type, name: file.name }, path);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    return { path, backend: "local" };
  },
  async url(path) {
    const db = await openDb();
    const rec = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const r = tx.objectStore(STORE).get(path);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    if (!rec) return null;
    return URL.createObjectURL(new Blob([rec.buf], { type: rec.type || "application/octet-stream" }));
  },
  async remove(path) {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(path);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  },
};

/* ── FIREBASE STORAGE ─────────────────────────────────────────────────────── */

const firebaseBackend = {
  id: "firebase",
  durable: true,
  label: "the agency's storage",
  async put(path, file) {
    const { storage } = await import("../../firebase");
    const { ref, uploadBytes } = await import("firebase/storage");
    await uploadBytes(ref(storage, path), file, { contentType: file.type });
    return { path, backend: "firebase" };
  },
  async url(path) {
    const { storage } = await import("../../firebase");
    const { ref, getDownloadURL } = await import("firebase/storage");
    return getDownloadURL(ref(storage, path));
  },
  async remove(path) {
    const { storage } = await import("../../firebase");
    const { ref, deleteObject } = await import("firebase/storage");
    await deleteObject(ref(storage, path));
  },
};

/* ── WHICH ONE ────────────────────────────────────────────────────────────── */

let cached = null;

/**
 * Firebase if a bucket answers, the browser otherwise.
 *
 * Asked once and remembered. The check is a real request rather than a config
 * flag, because a bucket name in an env file is not a bucket — this project
 * has had one configured for months and no bucket behind it.
 */
export async function pickBackend() {
  if (cached) return cached;
  try {
    const { firebaseConfig } = await import("../../firebase");
    const bucket = firebaseConfig?.storageBucket;
    if (bucket) {
      const res = await fetch(`https://firebasestorage.googleapis.com/v0/b/${bucket}/o?maxResults=1`);
      /* 200 or 403 both mean the bucket exists — 403 is simply "not yours to
         list anonymously", which is the expected answer for a private bucket.
         404 means there is nothing there at all. */
      if (res.status !== 404) { cached = firebaseBackend; return cached; }
    }
  } catch { /* offline or blocked — fall through to local */ }
  cached = localBackend;
  return cached;
}

/** For the UI, so it can tell somebody where their file actually went. */
export async function storageStatus() {
  const b = await pickBackend();
  return { id: b.id, durable: b.durable, label: b.label };
}

export async function putFile(path, file) { return (await pickBackend()).put(path, file); }
export async function fileUrl(path)       { return (await pickBackend()).url(path); }
export async function removeFile(path)    { return (await pickBackend()).remove(path); }

/** Where a deal's document lives. Tenant first, so a rule can scope on it. */
export function documentPath(orgId, dealId, docKey, fileName) {
  const safe = String(fileName || "file").replace(/[^\w.\-]+/g, "_").slice(-60);
  return `orgs/${orgId}/deals/${dealId}/${docKey}/${Date.now()}_${safe}`;
}
