// api/eibor.js — Vercel serverless function
// Proxies UAE Central Bank EIBOR data to avoid CORS issues
// Deploy to: /api/eibor → accessible at https://emaar-dashboard.vercel.app/api/eibor

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate"); // cache 1hr

  try {
    const response = await fetch("https://centralbank.ae/umbraco/Surface/Eibor/GetEiborData", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DXBAnalytics/1.0)",
        "Accept": "application/json",
      },
    });

    if (!response.ok) throw new Error("CBUAE fetch failed: " + response.status);

    const data = await response.json();

    if (!data || data.length === 0) throw new Error("Empty EIBOR data");

    // CBUAE returns array, first item is latest
    const latest = data[0];

    // Normalize field names (CBUAE changes these occasionally)
    const eibor = {
      on:  parseFloat(latest.Overnight   || latest.ON  || latest.overnight  || 0),
      "1w": parseFloat(latest.OneWeek    || latest["1W"] || latest.oneWeek  || 0),
      "1m": parseFloat(latest.OneMonth   || latest["1M"] || latest.oneMonth || 0),
      "3m": parseFloat(latest.ThreeMonths|| latest["3M"] || latest.threeMonths || 0),
      "6m": parseFloat(latest.SixMonths  || latest["6M"] || latest.sixMonths || 0),
      "1y": parseFloat(latest.OneYear    || latest["1Y"] || latest.oneYear  || 0),
      asOf: latest.LastUpdate || latest.Date || latest.date || new Date().toISOString().split("T")[0],
      source: "UAE Central Bank (Live)",
    };

    // Validate - if 3m is 0 something went wrong
    if (eibor["3m"] === 0) {
      // Log raw for debugging
      console.error("EIBOR parse failed, raw:", JSON.stringify(latest));
      throw new Error("Could not parse 3M EIBOR from CBUAE response");
    }

    res.status(200).json({ success: true, eibor, raw: latest });
  } catch (error) {
    console.error("EIBOR proxy error:", error.message);

    // Return verified fallback (Feb 27, 2026) so UI never breaks
    res.status(200).json({
      success: false,
      fallback: true,
      error: error.message,
      eibor: {
        on:   3.473,
        "1w": 3.577,
        "1m": 3.635,
        "3m": 3.593,
        "6m": 3.676,
        "1y": 3.674,
        asOf: "27 Feb 2026",
        source: "CBUAE (cached fallback)",
      },
    });
  }
}
