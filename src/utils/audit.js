/**
 * Audit logging — single write point for every admin action.
 *
 * These functions previously lived inside AdminPanel.jsx as module-level
 * declarations. UsersTab, DigestTab, SupportTab and EiborRatesPanel all called
 * them without importing anything, so every one of those calls threw
 * ReferenceError at runtime. Because the call sites sat inside try/catch blocks
 * that swallowed the error, the failure surfaced only as an action that quietly
 * did nothing.
 *
 * Extracted here so there is one implementation, imported wherever it is used.
 */
import { collection, doc, getDocs, setDoc } from "firebase/firestore";
import emailjs from "@emailjs/browser";
import { auth } from "../firebase";

let _cachedIP = null;
let _webhookUrl = null;
let _alertThreshold = 10; // tier changes within 5 minutes before an alert fires

export function setAuditWebhook(url) { _webhookUrl = url; }
export function setAlertThreshold(n) { _alertThreshold = n; }

export async function getAdminIP() {
  if (_cachedIP) return _cachedIP;
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const d = await r.json();
    _cachedIP = d.ip;
    return _cachedIP;
  } catch (e) {
    console.error("getAdminIP:", e);
    return "unknown";
  }
}

/** Record an admin action. Never throws — auditing must not break the action. */
export async function logAudit(db, payload) {
  try {
    const ip = await getAdminIP();
    const changedBy = auth.currentUser?.email || "admin";
    const entry = { ...payload, changedBy, changedAt: new Date().toISOString(), ip };
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await setDoc(doc(db, "auditLog", id), entry);
    // SIEM webhook push (fire-and-forget)
    if (_webhookUrl) {
      try {
        fetch(_webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        });
      } catch (e) { console.error("audit webhook:", e); }
    }
    return entry;
  } catch (e) {
    console.error("logAudit:", e);
  }
}

/** Email an admin when an unusual burst of tier changes is detected. */
export async function checkAlerts(db) {
  try {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const snap = await getDocs(collection(db, "auditLog"));
    const recent = [];
    snap.forEach(d => {
      const data = d.data();
      if (data.changedAt >= fiveMinAgo && ["tier_change", "bulk_tier_change"].includes(data.action)) recent.push(data);
    });
    if (recent.length >= _alertThreshold) {
      const adminEmail = auth.currentUser?.email;
      if (adminEmail) {
        emailjs.send(import.meta.env.VITE_EMAILJS_SERVICE_ID, import.meta.env.VITE_EMAILJS_TEMPLATE_ID, {
          user_email: adminEmail,
          user_name: "DXB Admin",
          message: `SUSPICIOUS ACTIVITY: ${recent.length} tier changes in the last 5 minutes by ${adminEmail}. Please review the Audit Log immediately.`,
        }, import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
      }
    }
  } catch (e) {
    console.error("checkAlerts:", e);
  }
}
