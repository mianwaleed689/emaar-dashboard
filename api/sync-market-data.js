// api/sync-market-data.js
// Vercel Serverless Function - syncs live PPSF from Bayut for all 49 communities
// Called by Admin Panel Live Data Sync button

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const BAYUT_KEY = process.env.BAYUT_RAPIDAPI_KEY || process.env.BAYUT_RAPIDAPI_KEY;

  const COMMUNITIES = [
    { name: "Downtown Dubai",           locationId: "5269" },
    { name: "Dubai Marina",             locationId: "5247" },
    { name: "Dubai Hills Estate",       locationId: "7982" },
    { name: "Dubai Creek Harbour",      locationId: "7183" },
    { name: "Emaar Beachfront",         locationId: "7978" },
    { name: "Jumeirah Village Circle",  locationId: "7164" },
    { name: "Business Bay",             locationId: "5251" },
    { name: "Palm Jumeirah",            locationId: "5460" },
    { name: "Arabian Ranches III",      locationId: "7110" },
    { name: "The Valley",               locationId: "7957" },
    { name: "Al Furjan",                locationId: "7120" },
    { name: "DAMAC Hills",              locationId: "7185" },
    { name: "DAMAC Hills 2",            locationId: "7198" },
    { name: "DAMAC Lagoons",            locationId: "7975" },
    { name: "Sobha Hartland",           locationId: "7112" },
    { name: "Palm Jebel Ali",           locationId: "8009" },
    { name: "Dubai Islands",            locationId: "8005" },
    { name: "Tilal Al Ghaf",            locationId: "7188" },
    { name: "City Walk",                locationId: "7190" },
    { name: "Dubai Harbour",            locationId: "7968" },
    { name: "Meydan",                   locationId: "7173" },
    { name: "Mohammed Bin Rashid City", locationId: "7166" },
    { name: "Dubai South",              locationId: "7205" },
    { name: "JBR",                      locationId: "5256" },
    { name: "Arjan",                    locationId: "7131" },
    { name: "Jumeirah Lake Towers",     locationId: "5252" },
    { name: "Arabian Ranches",          locationId: "5471" },
    { name: "Dubai Silicon Oasis",      locationId: "7161" },
    { name: "Town Square",              locationId: "7196" },
    { name: "Bluewaters Island",        locationId: "7179" },
  ];

  const results = [];
  const errors = [];

  for (const comm of COMMUNITIES) {
    try {
      const url = `https://unofficial-bayut-api.p.rapidapi.com/search?locationExternalIDs=${comm.locationId}&purpose=for-sale&categoryExternalID=4&lang=en&sort=price-asc&page=0&hitsPerPage=25`;
      const res2 = await fetch(url, {
        headers: {
          "x-rapidapi-key": BAYUT_KEY,
          "x-rapidapi-host": "unofficial-bayut-api.p.rapidapi.com",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!res2.ok) {
        errors.push(`${comm.name}: ${res2.status}`);
        continue;
      }

      const data = await res2.json();
      const hits = data?.hits || [];
      if (hits.length === 0) continue;

      const prices = hits.map(h => h.price).filter(p => p > 0);
      const areas = hits.map(h => h.area).filter(a => a > 0);
      const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
      const avgArea = areas.length > 0 ? Math.round(areas.reduce((a, b) => a + b, 0) / areas.length) : 0;
      const avgPpsf = avgArea > 0 ? Math.round(avgPrice / avgArea) : 0;

      results.push({
        community: comm.name,
        avgPpsf,
        avgPrice,
        avgArea,
        listings: hits.length,
        source: "Bayut.com (live)",
        syncedAt: new Date().toISOString(),
      });
    } catch (err) {
      errors.push(`${comm.name}: ${err.message}`);
    }

    // Small delay to respect rate limits
    await new Promise(r => setTimeout(r, 200));
  }

  return res.status(200).json({
    success: true,
    synced: results.length,
    errors: errors.length,
    errorList: errors,
    data: results,
    syncedAt: new Date().toISOString(),
  });
}
