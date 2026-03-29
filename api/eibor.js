// api/eibor.js — Vercel serverless function
// Scrapes live EIBOR from fcmb.ae (re-publishes CBUAE daily rates)

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

  const FALLBACK = {
    on:   3.473,
    "1w": 3.577,
    "1m": 3.635,
    "3m": 3.593,
    "6m": 3.676,
    "1y": 3.674,
    asOf: "27 Feb 2026",
    source: "CBUAE (cached fallback)",
  };

  const parseRate = (str) => {
    if (!str) return null;
    const n = parseFloat(str.toString().replace(/[^0-9.]/g, ""));
    return isNaN(n) || n === 0 ? null : n;
  };

  // Try source 1: fcmb.ae (publishes CBUAE EIBOR daily)
  try {
    const r = await fetch("https://fcmb.ae/eibor-rate-today", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    const html = await r.text();

    const extract = (pattern) => {
      const regex = new RegExp(pattern + "[^0-9]*([0-9]+\\.[0-9]+)", "i");
      const m = html.match(regex);
      return m ? parseRate(m[1]) : null;
    };

    const dateMatch = html.match(/Value Date[^0-9]*([0-9]{2}-[0-9]{2}-[0-9]{4})/i);
    const asOf = dateMatch ? dateMatch[1] : new Date().toLocaleDateString("en-AE");

    const eibor = {
      on:   extract("Overnight|ON\\b"),
      "1w": extract("One Week|1 Week"),
      "1m": extract("One Month|1 Month"),
      "3m": extract("Three Months|3 Month"),
      "6m": extract("Six Months|6 Month"),
      "1y": extract("Twelve Months|12 Month|One Year"),
      asOf,
      source: "Live · UAE Central Bank via FCMB",
    };

    if (eibor["3m"] && eibor["3m"] > 1 && eibor["3m"] < 15) {
      return res.status(200).json({ success: true, eibor });
    }
    throw new Error("Parse failed");
  } catch (e1) {
    console.error("fcmb.ae failed:", e1.message);
  }

  // Try source 2: mortgagemarket.ae
  try {
    const r = await fetch("https://mortgagemarket.ae/eibor", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "text/html",
      },
    });
    const html = await r.text();

    const extract = (pattern) => {
      const regex = new RegExp(pattern + "[^0-9]*([0-9]+\\.[0-9]+)", "i");
      const m = html.match(regex);
      return m ? parseRate(m[1]) : null;
    };

    const eibor = {
      "1m": extract("1 Month|One Month"),
      "3m": extract("3 Month|Three Month"),
      "6m": extract("6 Month|Six Month"),
      "1y": extract("12 Month|One Year"),
      asOf: new Date().toLocaleDateString("en-AE"),
      source: "Live · CBUAE via MortgageMarket.ae",
    };

    if (eibor["3m"] && eibor["3m"] > 1 && eibor["3m"] < 15) {
      return res.status(200).json({ success: true, eibor });
    }
    throw new Error("Parse failed");
  } catch (e2) {
    console.error("mortgagemarket.ae failed:", e2.message);
  }

  // All sources failed — return verified fallback
  return res.status(200).json({ success: false, fallback: true, eibor: FALLBACK });
}
