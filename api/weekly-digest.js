// api/weekly-digest.js
// Runs every Monday at 4:00 UTC (8:00 AM UAE time)
// Sends weekly email digest to all Pro users

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Init Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

// ─── EMAIL BUILDER ───────────────────────────────────────────────
function buildEmailHTML({ userName, topYields, handovers, goldenVisa, marketStats }) {
  const now = new Date();
  const weekStr = now.toLocaleDateString("en-AE", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Dubai" });

  const yieldRows = topYields.map((p, i) => `
    <tr style="border-bottom:1px solid #1e2d3d;">
      <td style="padding:10px 12px;color:#94A3B8;font-size:12px;">#${i + 1}</td>
      <td style="padding:10px 12px;">
        <div style="font-weight:700;color:#ffffff;font-size:13px;">${p.name}</div>
        <div style="color:#64748B;font-size:11px;">${p.community}</div>
      </td>
      <td style="padding:10px 12px;text-align:right;">
        <div style="color:#10B981;font-weight:700;font-size:14px;">${p.yield}%</div>
        <div style="color:#64748B;font-size:11px;">gross yield</div>
      </td>
      <td style="padding:10px 12px;text-align:right;">
        <div style="color:#D4A843;font-weight:600;font-size:12px;">AED ${p.price}</div>
      </td>
    </tr>
  `).join("");

  const handoverRows = handovers.map(p => `
    <tr style="border-bottom:1px solid #1e2d3d;">
      <td style="padding:10px 12px;">
        <div style="font-weight:700;color:#ffffff;font-size:13px;">${p.name}</div>
        <div style="color:#64748B;font-size:11px;">${p.community}</div>
      </td>
      <td style="padding:10px 12px;text-align:center;">
        <span style="background:${p.urgency === "red" ? "rgba(239,68,68,0.15)" : p.urgency === "amber" ? "rgba(245,158,11,0.15)" : "rgba(212,168,67,0.15)"};color:${p.urgency === "red" ? "#EF4444" : p.urgency === "amber" ? "#F59E0B" : "#D4A843"};padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;">${p.handover}</span>
      </td>
      <td style="padding:10px 12px;text-align:right;color:#94A3B8;font-size:12px;">${p.daysLeft} days left</td>
    </tr>
  `).join("");

  const gvRows = goldenVisa.map(p => `
    <tr style="border-bottom:1px solid #1e2d3d;">
      <td style="padding:10px 12px;">
        <div style="font-weight:700;color:#ffffff;font-size:13px;">${p.name}</div>
        <div style="color:#64748B;font-size:11px;">${p.community}</div>
      </td>
      <td style="padding:10px 12px;text-align:right;">
        <div style="color:#10B981;font-weight:700;font-size:13px;">AED ${p.price}</div>
        <div style="color:#10B981;font-size:10px;">✓ Eligible</div>
      </td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>DXB Analytics — Weekly Digest</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:20px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0D1821,#111827);border:1px solid rgba(212,168,67,0.3);border-radius:16px;padding:28px 32px;margin-bottom:20px;text-align:center;">
      <div style="font-size:11px;letter-spacing:3px;color:#D4A843;text-transform:uppercase;margin-bottom:8px;">DXB ANALYTICS</div>
      <div style="font-size:26px;font-weight:900;color:#ffffff;margin-bottom:4px;">Weekly Market Digest</div>
      <div style="font-size:13px;color:#64748B;">Week of ${weekStr} · Dubai Real Estate Intelligence</div>
      <div style="margin-top:16px;font-size:14px;color:#CBD5E1;">Good morning, <strong style="color:#D4A843;">${userName}</strong> 👋</div>
    </div>

    <!-- Market Pulse -->
    <div style="background:#0D1821;border:1px solid #1e2d3d;border-radius:14px;padding:22px;margin-bottom:16px;">
      <div style="font-size:11px;letter-spacing:2px;color:#D4A843;text-transform:uppercase;margin-bottom:16px;">📊 Market Pulse</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
        ${marketStats.map(s => `
        <div style="background:#111827;border-radius:10px;padding:14px;text-align:center;border:1px solid #1e2d3d;">
          <div style="font-size:10px;color:#64748B;text-transform:uppercase;margin-bottom:6px;">${s.label}</div>
          <div style="font-size:18px;font-weight:800;color:${s.color || "#D4A843"};">${s.value}</div>
          <div style="font-size:10px;color:#64748B;margin-top:4px;">${s.sub || ""}</div>
        </div>`).join("")}
      </div>
    </div>

    <!-- Top Yields -->
    <div style="background:#0D1821;border:1px solid #1e2d3d;border-radius:14px;padding:22px;margin-bottom:16px;">
      <div style="font-size:11px;letter-spacing:2px;color:#10B981;text-transform:uppercase;margin-bottom:16px;">🏆 Top 5 Yield Opportunities This Week</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid #1e2d3d;">
            <th style="padding:8px 12px;text-align:left;font-size:10px;color:#64748B;font-weight:600;">#</th>
            <th style="padding:8px 12px;text-align:left;font-size:10px;color:#64748B;font-weight:600;">PROJECT</th>
            <th style="padding:8px 12px;text-align:right;font-size:10px;color:#64748B;font-weight:600;">YIELD</th>
            <th style="padding:8px 12px;text-align:right;font-size:10px;color:#64748B;font-weight:600;">PRICE</th>
          </tr>
        </thead>
        <tbody>${yieldRows}</tbody>
      </table>
    </div>

    <!-- Upcoming Handovers -->
    <div style="background:#0D1821;border:1px solid #1e2d3d;border-radius:14px;padding:22px;margin-bottom:16px;">
      <div style="font-size:11px;letter-spacing:2px;color:#F59E0B;text-transform:uppercase;margin-bottom:16px;">⏰ Handovers in the Next 6 Months</div>
      ${handovers.length > 0 ? `
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:1px solid #1e2d3d;">
            <th style="padding:8px 12px;text-align:left;font-size:10px;color:#64748B;font-weight:600;">PROJECT</th>
            <th style="padding:8px 12px;text-align:center;font-size:10px;color:#64748B;font-weight:600;">HANDOVER</th>
            <th style="padding:8px 12px;text-align:right;font-size:10px;color:#64748B;font-weight:600;">TIMELINE</th>
          </tr>
        </thead>
        <tbody>${handoverRows}</tbody>
      </table>` : `<div style="color:#64748B;font-size:13px;text-align:center;padding:16px;">No handovers in the next 6 months</div>`}
    </div>

    <!-- Golden Visa -->
    <div style="background:#0D1821;border:1px solid #1e2d3d;border-radius:14px;padding:22px;margin-bottom:16px;">
      <div style="font-size:11px;letter-spacing:2px;color:#D4A843;text-transform:uppercase;margin-bottom:4px;">🛂 Golden Visa Eligible Projects</div>
      <div style="font-size:11px;color:#64748B;margin-bottom:16px;">${goldenVisa.length} Emaar projects at AED 2M+ — qualifies for 10-year UAE residency</div>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>${gvRows}</tbody>
      </table>
    </div>

    <!-- CTA -->
    <div style="background:linear-gradient(135deg,rgba(212,168,67,0.12),rgba(212,168,67,0.04));border:1px solid rgba(212,168,67,0.3);border-radius:14px;padding:24px;margin-bottom:16px;text-align:center;">
      <div style="font-size:16px;font-weight:700;color:#ffffff;margin-bottom:8px;">Full analytics on the dashboard</div>
      <div style="font-size:13px;color:#94A3B8;margin-bottom:18px;">Yield calculator, flip profit, portfolio tracker, interactive map and more.</div>
      <a href="https://emaar-dashboard.vercel.app" style="display:inline-block;background:linear-gradient(135deg,#D4A843,#B8912F);color:#0a0f1a;padding:12px 32px;border-radius:10px;font-weight:800;font-size:14px;text-decoration:none;letter-spacing:0.5px;">Open Dashboard →</a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:16px;color:#334155;font-size:11px;line-height:1.8;">
      DXB Analytics · Dubai Real Estate Intelligence Platform<br>
      You're receiving this because you're a Pro subscriber.<br>
      <a href="https://emaar-dashboard.vercel.app" style="color:#D4A843;text-decoration:none;">Manage preferences</a>
    </div>

  </div>
</body>
</html>`;
}

// ─── MAIN HANDLER ────────────────────────────────────────────────
export default async function handler(req, res) {
  // Security — only allow Vercel cron or manual trigger with secret
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 1. Fetch all Pro users from Firebase
    const usersSnap = await db.collection("users")
      .where("tier", "in", ["pro", "pro_trial", "enterprise", "admin"])
      .get();

    const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log(`Found ${users.length} Pro users`);

    // 2. Fetch project data
    const projectsSnap = await db.collection("projectData").get();
    const firestoreProjects = {};
    projectsSnap.docs.forEach(d => { firestoreProjects[d.id] = d.data(); });

    // 3. Build digest data
    // Static project data (imported via require since this is Node)
    const staticProjects = [
      { id: "creek_waters", name: "Creek Waters", community: "Dubai Creek Harbour", price: 2100000, yield: 7.2, handover: "Q4 2026" },
      { id: "golf_grand", name: "Golf Grand", community: "Dubai Hills Estate", price: 1530000, yield: 6.8, handover: "Q2 2026" },
      { id: "emaar_beachfront", name: "Marina Shores", community: "Emaar Beachfront", price: 2800000, yield: 6.5, handover: "Q3 2027" },
      { id: "the_valley", name: "The Valley", community: "The Valley", price: 1800000, yield: 7.5, handover: "Q1 2026" },
      { id: "oasis", name: "The Oasis", community: "The Oasis", price: 5200000, yield: 5.8, handover: "Q4 2027" },
      { id: "rashid", name: "Baystar by Vida", community: "Rashid Yachts & Marina", price: 2100000, yield: 7.8, handover: "Q2 2026" },
      { id: "park_lane", name: "Park Lane", community: "Dubai Hills Estate", price: 1750000, yield: 6.9, handover: "Q3 2026" },
    ];

    // Merge with Firestore overrides
    const allProjects = staticProjects.map(p => ({
      ...p,
      ...(firestoreProjects[p.id] || {}),
    }));

    // Top 5 yields
    const topYields = [...allProjects]
      .sort((a, b) => (b.yield || 0) - (a.yield || 0))
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        community: p.community,
        yield: (p.yield || 0).toFixed(1),
        price: p.price ? (p.price / 1e6).toFixed(2) + "M" : "TBC",
      }));

    // Upcoming handovers (next 6 months)
    const now = new Date();
    const sixMonths = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
    const handovers = allProjects
      .filter(p => p.handover)
      .map(p => {
        const [q, y] = (p.handover || "").split(" ");
        const qMonth = { Q1: 2, Q2: 5, Q3: 8, Q4: 11 }[q] || 0;
        const year = parseInt(y) || 2026;
        const date = new Date(year, qMonth, 1);
        const daysLeft = Math.round((date - now) / (1000 * 60 * 60 * 24));
        return { ...p, date, daysLeft, urgency: daysLeft <= 60 ? "red" : daysLeft <= 120 ? "amber" : "gold" };
      })
      .filter(p => p.date >= now && p.date <= sixMonths)
      .sort((a, b) => a.date - b.date)
      .slice(0, 5);

    // Golden Visa eligible
    const goldenVisa = allProjects
      .filter(p => (p.price || 0) >= 2000000)
      .slice(0, 5)
      .map(p => ({
        name: p.name,
        community: p.community,
        price: p.price ? (p.price / 1e6).toFixed(2) + "M" : "2M+",
      }));

    // Market stats
    const marketStats = [
      { label: "Emaar Revenue 2025", value: "AED 49.6B", color: "#D4A843", sub: "+40% YoY" },
      { label: "Net Profit 2025", value: "AED 25.7B", color: "#10B981", sub: "51.8% margin" },
      { label: "Sales Backlog", value: "AED 155B", color: "#3B82F6", sub: "Future revenue" },
    ];

    // 4. Send email to each user via EmailJS REST API
    const results = [];
    for (const user of users) {
      if (!user.email) continue;

      const html = buildEmailHTML({
        userName: user.name || user.displayName || "Investor",
        topYields,
        handovers,
        goldenVisa,
        marketStats,
      });

      try {
        const emailRes = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            accessToken: process.env.EMAILJS_PRIVATE_KEY,
            template_params: {
              to_email: user.email,
              to_name: user.name || "Investor",
              subject: `DXB Analytics — Weekly Digest ${weekStr}`,
              html_content: html,
            },
          }),
        });

        results.push({ email: user.email, status: emailRes.ok ? "sent" : "failed" });
      } catch (e) {
        results.push({ email: user.email, status: "error", error: e.message });
      }
    }

    // 5. Log to Firestore
    await db.collection("digestLog").add({
      sentAt: new Date(),
      userCount: users.length,
      results,
    });

    return res.status(200).json({
      success: true,
      sent: results.filter(r => r.status === "sent").length,
      failed: results.filter(r => r.status !== "sent").length,
      total: results.length,
    });

  } catch (err) {
    console.error("Digest error:", err);
    return res.status(500).json({ error: err.message });
  }
}
