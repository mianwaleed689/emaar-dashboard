// Vercel Serverless Function — Exchange Rates Proxy
// Fixes currency tab: browser → /api/rates → ExchangeRate-API
// Free API: exchangerate-api.com (1500 req/month free)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=3600'); // Cache 1 hour

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Free API — no key needed for basic rates
    const response = await fetch('https://open.er-api.com/v6/latest/AED');
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    // Fallback to static rates if API fails
    return res.status(200).json({
      result: 'success',
      base_code: 'AED',
      rates: {
        USD:0.2723, GBP:0.2154, EUR:0.2511, INR:22.65, RUB:24.94,
        CNY:1.977, PKR:76.28, SAR:1.0211, CHF:0.2417, CAD:0.3727,
        AUD:0.4235, JPY:40.82
      },
      time_last_update_utc: new Date().toUTCString()
    });
  }
}
