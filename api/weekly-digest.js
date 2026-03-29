/**
 * DXB Analytics — Weekly Email Digest
 * Vercel Serverless Function: /api/weekly-digest
 *
 * Triggers:
 *   1. Manually from Admin Panel (GET with Bearer token)
 *   2. Automatically via Vercel Cron (vercel.json) — Monday 04:00 UTC = 08:00 UAE
 *
 * Required env vars in Vercel Dashboard → Settings → Environment Variables:
 *   FIREBASE_PROJECT_ID      → your Firebase project ID (e.g. "emaar-dashboard-xyz")
 *   FIREBASE_API_KEY         → your Firebase web API key
 *   EMAILJS_SERVICE_ID       → service_da7nshv
 *   EMAILJS_TEMPLATE_ID      → template_gl1xqhy
 *   EMAILJS_PUBLIC_KEY       → USkwUhp0csGCVDkdQ
 *   CRON_SECRET              → dxb-cron-2026
 */

const CRON_SECRET = process.env.CRON_SECRET || process.env.CRON_SECRET;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || "service_da7nshv";
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || "template_gl1xqhy";
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || "USkwUhp0csGCVDkdQ";

// ─── Firestore REST helpers ────────────────────────────────────────────────

const FS_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

async function firestoreQuery(collection, filters = []) {
  const url = `${FS_BASE}:runQuery?key=${FIREBASE_API_KEY}`;
  const where = filters.length === 1
    ? {
        fieldFilter: {
          field: { fieldPath: filters[0].field },
          op: filters[0].op,
          value: { stringValue: filters[0].value },
        },
      }
    : {
        compositeFilter: {
          op: "AND",
          filters: filters.map(f => ({
            fieldFilter: {
              field: { fieldPath: f.field },
              op: f.op,
              value: f.intValue ? { integerValue: f.value } : { stringValue: f.value },
            },
          })),
        },
      };

  const body = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: filters.length ? where : undefined,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .filter(d => d.document)
    .map(d => {
      const fields = d.document.fields || {};
      const parsed = {};
      for (const [k, v] of Object.entries(fields)) {
        if (v.stringValue !== undefined) parsed[k] = v.stringValue;
        else if (v.integerValue !== undefined) parsed[k] = Number(v.integerValue);
        else if (v.doubleValue !== undefined) parsed[k] = Number(v.doubleValue);
        else if (v.booleanValue !== undefined) parsed[k] = v.booleanValue;
        else if (v.nullValue !== undefined) parsed[k] = null;
        else parsed[k] = JSON.stringify(v);
      }
      parsed._id = d.document.name.split("/").pop();
      return parsed;
    });
}

async function firestoreGetAll(collection) {
  const url = `${FS_BASE}/${collection}?key=${FIREBASE_API_KEY}&pageSize=500`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.documents) return [];
  return data.documents.map(d => {
    const fields = d.fields || {};
    const parsed = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v.stringValue !== undefined) parsed[k] = v.stringValue;
      else if (v.integerValue !== undefined) parsed[k] = Number(v.integerValue);
      else if (v.doubleValue !== undefined) parsed[k] = Number(v.doubleValue);
      else if (v.booleanValue !== undefined) parsed[k] = v.booleanValue;
      else if (v.nullValue !== undefined) parsed[k] = null;
      else parsed[k] = JSON.stringify(v);
    }
    parsed._id = d.name.split("/").pop();
    return parsed;
  });
}

// ─── EmailJS REST send ─────────────────────────────────────────────────────

async function sendEmail(to_email, to_name, subject, html_content) {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        user_email: to_email,
        user_name: to_name || to_email.split("@")[0],
        project_name: "DXB Analytics — Weekly Digest",
        change_type: subject,
        new_value: html_content,
        old_value: "",
        updated_at: new Date().toLocaleDateString("en-AE", {
          weekday: "long", day: "numeric", month: "long", year: "numeric"
        }),
      },
    }),
  });
  return res.status === 200;
}

// ─── Email HTML builder ────────────────────────────────────────────────────

function buildDigestHTML(userName, topYields, handovers, goldenVisa, stats) {
  const gold = "#D4A843";
  const bg = "#04090F";
  const surface = "#0A1628";
  const border = "#1A2A44";

  const yieldRows = topYields.slice(0, 5).map((p, i) => `
    <tr style="border-bottom:1px solid ${border}">
      <td style="padding:10px 12px;color:#94A3B8;font-size:12px;">${i + 1}</td>
      <td style="padding:10px 12px">
        <div style="font-weight:700;color:#F1F5F9;font-size:13px;">${p.name || "Project"}</div>
        <div style="color:#64748B;font-size:11px;">${p.community || ""}</div>
      </td>
      <td style="padding:10px 12px;text-align:right">
        <div style="color:${gold};font-weight:800;font-size:14px;">${p.gross || p.yield || "—"}%</div>
        <div style="color:#64748B;font-size:10px;">gross yield</div>
      </td>
      <td style="padding:10px 12px;text-align:right;color:#94A3B8;font-size:12px;">
        AED ${p.price ? (p.price / 1e6).toFixed(2) + "M" : "—"}
      </td>
    </tr>
  `).join("");

  const handoverRows = handovers.slice(0, 4).map(p => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid ${border}">
      <div>
        <div style="color:#F1F5F9;font-weight:600;font-size:13px;">${p.name || "Project"}</div>
        <div style="color:#64748B;font-size:11px;">${p.community || ""}</div>
      </div>
      <div style="text-align:right">
        <div style="color:#10B981;font-weight:700;font-size:13px;">${p.handover || "2025"}</div>
        <div style="background:rgba(16,185,129,0.12);border-radius:4px;padding:2px 6px;font-size:10px;color:#10B981;margin-top:3px;">${p.construction || 0}% done</div>
      </div>
    </div>
  `).join("");

  const visaRows = goldenVisa.slice(0, 4).map(p => `
    <div style="background:rgba(212,168,67,0.06);border:1px solid rgba(212,168,67,0.15);border-radius:8px;padding:12px 14px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="color:#F1F5F9;font-weight:600;font-size:13px;">🏅 ${p.name || "Project"}</div>
          <div style="color:#64748B;font-size:11px;">${p.community || ""} · Min AED 2M</div>
        </div>
        <div style="color:${gold};font-weight:800;font-size:13px;">AED ${p.price ? (p.price / 1e6).toFixed(1) + "M" : "—"}</div>
      </div>
    </div>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>DXB Analytics — Weekly Intelligence Digest</title>
</head>
<body style="margin:0;padding:0;background:#0D1117;font-family:'Segoe UI',Arial,sans-serif">
  <div style="max-width:640px;margin:0 auto;padding:20px 16px">

    <!-- Header -->
    <div style="background:${bg};border:1px solid ${border};border-radius:16px;overflow:hidden;margin-bottom:16px">
      <div style="background:linear-gradient(135deg,rgba(212,168,67,0.15),rgba(14,29,53,0.8));padding:28px 28px 22px;border-bottom:1px solid ${border}">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:10px">
          <div style="width:44px;height:44px;background:${gold};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:${bg};flex-shrink:0">D</div>
          <div>
            <div style="font-size:20px;font-weight:800;color:#F1F5F9">DXB Analytics</div>
            <div style="font-size:12px;color:#64748B">Weekly Intelligence Digest</div>
          </div>
        </div>
        <h1 style="margin:0;font-size:15px;color:#94A3B8;font-weight:400">
          Good morning, <strong style="color:#F1F5F9">${userName}</strong> — here's your Dubai real estate intelligence for the week.
        </h1>
        <div style="margin-top:12px;font-size:11px;color:#475569">
          ${new Date().toLocaleDateString("en-AE", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
        </div>
      </div>

      <!-- Market Pulse -->
      <div style="padding:22px 28px;border-bottom:1px solid ${border}">
        <div style="font-size:10px;font-weight:700;color:#64748B;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:14px">📊 Market Pulse</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
          ${stats.map(s => `
          <div style="background:${surface};border:1px solid ${border};border-radius:10px;padding:12px 14px;text-align:center">
            <div style="font-size:10px;color:#64748B;margin-bottom:5px">${s.label}</div>
            <div style="font-size:18px;font-weight:800;color:${s.color || gold}">${s.value}</div>
            ${s.sub ? `<div style="font-size:10px;color:#475569;margin-top:3px">${s.sub}</div>` : ""}
          </div>`).join("")}
        </div>
      </div>

      <!-- Top Yields -->
      ${topYields.length ? `
      <div style="padding:22px 28px;border-bottom:1px solid ${border}">
        <div style="font-size:10px;font-weight:700;color:#64748B;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:14px">🏆 Top 5 Yield Opportunities</div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid ${border}">
              <th style="padding:6px 12px;text-align:left;font-size:10px;color:#475569;font-weight:600">#</th>
              <th style="padding:6px 12px;text-align:left;font-size:10px;color:#475569;font-weight:600">Project</th>
              <th style="padding:6px 12px;text-align:right;font-size:10px;color:#475569;font-weight:600">Yield</th>
              <th style="padding:6px 12px;text-align:right;font-size:10px;color:#475569;font-weight:600">Price</th>
            </tr>
          </thead>
          <tbody>${yieldRows}</tbody>
        </table>
      </div>` : ""}

      <!-- Upcoming Handovers -->
      ${handovers.length ? `
      <div style="padding:22px 28px;border-bottom:1px solid ${border}">
        <div style="font-size:10px;font-weight:700;color:#64748B;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:14px">⏰ Upcoming Handovers</div>
        ${handoverRows}
      </div>` : ""}

      <!-- Golden Visa -->
      ${goldenVisa.length ? `
      <div style="padding:22px 28px;border-bottom:1px solid ${border}">
        <div style="font-size:10px;font-weight:700;color:#64748B;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:14px">🛂 Golden Visa Eligible Projects</div>
        ${visaRows}
      </div>` : ""}

      <!-- CTA -->
      <div style="padding:22px 28px;text-align:center">
        <a href="https://emaar-dashboard.vercel.app" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,${gold},#B8912F);color:${bg};text-decoration:none;border-radius:10px;font-weight:800;font-size:14px">
          Open Full Dashboard →
        </a>
        <p style="margin:16px 0 0;font-size:11px;color:#475569">
          You're receiving this because you're a DXB Analytics Pro member.<br>
          <a href="https://emaar-dashboard.vercel.app" style="color:#64748B">Manage preferences</a>
        </p>
      </div>

    </div>

    <p style="text-align:center;font-size:10px;color:#334155;margin:0;padding-bottom:20px">
      © ${new Date().getFullYear()} DXB Analytics · Dubai, UAE · Data intelligence for real estate professionals
    </p>
  </div>
</body>
</html>`;
}

// ─── Main handler ──────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // ── CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  // ── Auth check
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (token !== CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // ── Env check
  if (!FIREBASE_PROJECT_ID || !FIREBASE_API_KEY) {
    return res.status(500).json({
      error: "Missing FIREBASE_PROJECT_ID or FIREBASE_API_KEY environment variables",
      hint: "Add them in Vercel Dashboard → Settings → Environment Variables",
    });
  }

  const results = { sent: 0, skipped: 0, errors: [], success: false };

  try {
    // ── 1. Get all Pro users
    const allUsers = await firestoreGetAll("users");
    const proUsers = allUsers.filter(u =>
      ["pro", "enterprise", "pro_trial"].includes(u.tier) &&
      u.email &&
      !u.suspended
    );

    if (proUsers.length === 0) {
      return res.status(200).json({ success: true, sent: 0, message: "No pro users found" });
    }

    // ── 2. Get project data for digest content
    const projectOverrides = await firestoreGetAll("projectData");

    // Build top yield opportunities (projects with gross yield data)
    const topYields = projectOverrides
      .filter(p => p.gross && p.gross > 0)
      .sort((a, b) => (b.gross || 0) - (a.gross || 0))
      .slice(0, 5);

    // Upcoming handovers (within next 18 months by year)
    const currentYear = new Date().getFullYear();
    const handovers = projectOverrides
      .filter(p => {
        if (!p.handover) return false;
        const year = parseInt(String(p.handover).match(/\d{4}/)?.[0] || "0");
        return year >= currentYear && year <= currentYear + 1;
      })
      .sort((a, b) => (b.construction || 0) - (a.construction || 0))
      .slice(0, 4);

    // Golden visa eligible (price >= 2M AED)
    const goldenVisa = projectOverrides
      .filter(p => p.price && p.price >= 2000000)
      .sort((a, b) => (a.price || 0) - (b.price || 0))
      .slice(0, 4);

    // Market stats
    const stats = [
      {
        label: "Active Projects",
        value: projectOverrides.length || "48+",
        color: "#3B82F6",
        sub: "Emaar portfolio",
      },
      {
        label: "Avg Gross Yield",
        value: topYields.length
          ? (topYields.reduce((a, p) => a + (p.gross || 0), 0) / topYields.length).toFixed(1) + "%"
          : "7.2%",
        color: "#10B981",
        sub: "Top performers",
      },
      {
        label: "Delivering",
        value: handovers.length + (handovers.length === 1 ? " project" : " projects"),
        color: "#F59E0B",
        sub: "Next 12 months",
      },
    ];

    // ── 3. Send to each Pro user
    for (const user of proUsers) {
      try {
        const name = user.name || user.email.split("@")[0];
        const html = buildDigestHTML(name, topYields, handovers, goldenVisa, stats);
        const subject = `📊 Your Weekly Dubai RE Intelligence — ${new Date().toLocaleDateString("en-AE", { day: "numeric", month: "short" })}`;
        const ok = await sendEmail(user.email, name, subject, html);
        if (ok) {
          results.sent++;
        } else {
          results.skipped++;
          results.errors.push(`Failed for ${user.email}`);
        }
        // Small delay to avoid rate limiting EmailJS
        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        results.skipped++;
        results.errors.push(`${user.email}: ${e.message}`);
      }
    }

    results.success = results.sent > 0;
    return res.status(200).json({
      ...results,
      total_pro_users: proUsers.length,
      digest_date: new Date().toISOString(),
    });

  } catch (e) {
    return res.status(500).json({ success: false, error: e.message, ...results });
  }
}
