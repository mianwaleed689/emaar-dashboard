// Vercel Serverless Function — Yahoo Finance Proxy
// Fixes CORS: browser → /api/stock → Yahoo Finance
// Usage: /api/stock?symbol=EMAAR.DU

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=60'); // Cache 1 min

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { symbol = 'EMAAR.DU', range = '1d', interval = '1d' } = req.query;

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Stock proxy error', message: err.message });
  }
}
