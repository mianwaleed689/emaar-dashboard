import { auth } from "../firebase";

/**
 * Send a branded transactional email.
 *
 * The Resend API key is NEVER available here — it lives only on the server in
 * api/send-email.js. Anything referenced as import.meta.env.VITE_* is compiled
 * into the public JS bundle, so a key placed in frontend code is readable by
 * anyone who visits the site.
 *
 * Throws on failure (including provider rejections), so callers that count
 * successes don't report "sent" for messages that never left.
 */
export async function sendResend(to, subject, bodyText) {
  const idToken = await auth.currentUser?.getIdToken();
  const res = await fetch("/api/send-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ to, subject, bodyText }),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data?.detail || data?.error || "";
    } catch {
      detail = await res.text().catch(() => "");
    }
    throw new Error(detail || `Email failed (HTTP ${res.status})`);
  }
  return res.json();
}

export default sendResend;
