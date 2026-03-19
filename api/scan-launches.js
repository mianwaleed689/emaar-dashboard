// api/scan-launches.js
// Vercel Serverless Function
// Called by Admin Panel → runs on Vercel server → calls all APIs → no CORS
// Deploy: this file goes in /api/ folder in your project root

module.exports = async function handler(req, res) {
  // Allow Admin Panel to call this
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const BAYUT_KEY = process.env.BAYUT_RAPIDAPI_KEY || "420de140camsh35f3baf70380d11p1e0c92jsn00005ba30591";

  const results = {
    bayut: [],
    propertyfinder: [],
    dubaiPulse: [],
    errors: [],
    scannedAt: new Date().toISOString(),
  };

  // ── SOURCE 1: BAYUT — New Projects endpoint ───────────────────────────────
  // This endpoint specifically returns new off-plan project launches
  try {
    const bayutUrl = "https://unofficial-bayut-api.p.rapidapi.com/search?purpose=for-sale&categoryExternalID=4&lang=en&sort=date-desc&page=0&hitsPerPage=50&completionStatus=off-plan&locationExternalIDs=5002"; // 5002 = Dubai
    const bayutRes = await fetch(bayutUrl, {
      headers: {
        "x-rapidapi-key": BAYUT_KEY,
        "x-rapidapi-host": "unofficial-bayut-api.p.rapidapi.com",
      },
    });

    if (bayutRes.ok) {
      const data = await bayutRes.json();
      const hits = data?.hits || [];

      // Group by project name to deduplicate
      const projectMap = {};
      hits.forEach(h => {
        const projectName = h.project?.name || h.title?.replace(/[|•].*/g, "").trim();
        if (!projectName) return;
        if (!projectMap[projectName]) {
          projectMap[projectName] = {
            projectName,
            developer: h.agency?.name || h.developer?.name || "—",
            community: h.location?.[h.location.length - 2]?.name || h.location?.[h.location.length - 1]?.name || "—",
            district: h.location?.[h.location.length - 1]?.externalID || "—",
            priceFrom: h.price || 0,
            type: h.rooms === "0" ? "Apartments" : h.category?.nameSingular || "Apartments",
            beds: h.rooms > 0 ? `${h.rooms}` : "Studio",
            handover: h.project?.handover || "—",
            payment: "—",
            construction: h.project?.percentCompleted || 0,
            branded: !!(h.project?.brand),
            brand: h.project?.brand || "—",
            source: "Bayut.com",
            sourceUrl: `https://www.bayut.com${h.slug || ""}`,
            coverPhoto: h.coverPhoto?.url || "",
            listingCount: 1,
            addedDate: h.date ? new Date(h.date * 1000).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "Recent",
          };
        } else {
          projectMap[projectName].listingCount++;
          // Take the min price
          if (h.price > 0 && (projectMap[projectName].priceFrom === 0 || h.price < projectMap[projectName].priceFrom)) {
            projectMap[projectName].priceFrom = h.price;
          }
        }
      });

      results.bayut = Object.values(projectMap);
    } else {
      results.errors.push(`Bayut API: ${bayutRes.status} ${bayutRes.statusText}`);
    }
  } catch (err) {
    results.errors.push(`Bayut: ${err.message}`);
  }

  // ── SOURCE 2: BAYUT — New Projects dedicated endpoint ────────────────────
  // The Bayut API has a specific /new-projects endpoint with richer data
  try {
    const newProjectsUrl = "https://unofficial-bayut-api.p.rapidapi.com/new-projects?locationExternalIDs=5002&lang=en&sort=date-desc&page=0&hitsPerPage=30";
    const npRes = await fetch(newProjectsUrl, {
      headers: {
        "x-rapidapi-key": BAYUT_KEY,
        "x-rapidapi-host": "unofficial-bayut-api.p.rapidapi.com",
      },
    });

    if (npRes.ok) {
      const data = await npRes.json();
      const projects = data?.hits || data?.projects || data?.results || [];
      
      projects.forEach(p => {
        const existingIdx = results.bayut.findIndex(b => 
          b.projectName.toLowerCase() === (p.name || p.title || "").toLowerCase()
        );
        
        const enriched = {
          projectName: p.name || p.title || "Unknown Project",
          developer: p.developer?.name || p.agency?.name || "—",
          community: p.location?.[p.location.length - 2]?.name || "—",
          district: p.location?.[p.location.length - 1]?.externalID || "—",
          priceFrom: p.minPrice || p.price || 0,
          priceTo: p.maxPrice || 0,
          type: p.category?.nameSingular || "Apartments",
          beds: p.minRooms ? `${p.minRooms}${p.maxRooms ? `-${p.maxRooms}` : "+"}` : "1-3",
          handover: p.completionDate || p.handover || "—",
          payment: p.paymentPlan || "—",
          construction: p.percentCompleted || 0,
          branded: !!(p.brand),
          brand: p.brand || "—",
          tier: p.minPrice > 5000000 ? "Ultra-Luxury" : p.minPrice > 2000000 ? "Premium" : "Mid-Market",
          source: "Bayut New Projects",
          sourceUrl: `https://www.bayut.com${p.slug || "/new-projects/dubai/"}`,
          coverPhoto: p.coverPhoto?.url || p.photo?.url || "",
          listingCount: p.unitCount || 1,
          description: p.description || "",
          amenities: p.amenities?.map(a => a.text)?.join(", ") || "",
          addedDate: p.launchDate || p.createdAt ? new Date((p.launchDate || p.createdAt) * 1000).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "Recent",
        };

        if (existingIdx >= 0) {
          // Merge richer data
          results.bayut[existingIdx] = { ...results.bayut[existingIdx], ...enriched };
        } else {
          results.bayut.push(enriched);
        }
      });
    }
  } catch (err) {
    results.errors.push(`Bayut New Projects: ${err.message}`);
  }

  // ── SOURCE 3: PROPERTY FINDER via RapidAPI ────────────────────────────────
  try {
    const pfUrl = "https://uae-real-estate-api-propertyfinder-ae-data.p.rapidapi.com/new-projects?locationId=2&sort=newest&page=1&limit=30";
    const pfRes = await fetch(pfUrl, {
      headers: {
        "x-rapidapi-key": BAYUT_KEY, // Same RapidAPI key works for many APIs
        "x-rapidapi-host": "uae-real-estate-api-propertyfinder-ae-data.p.rapidapi.com",
      },
    });

    if (pfRes.ok) {
      const data = await pfRes.json();
      const projects = data?.data || data?.projects || data?.results || [];
      
      projects.forEach(p => {
        results.propertyfinder.push({
          projectName: p.name || p.title || "—",
          developer: p.developer?.name || p.developerName || "—",
          community: p.location?.community || p.community || "—",
          priceFrom: p.minPrice || p.startingPrice || 0,
          type: p.propertyType || "Apartments",
          beds: p.bedroomRange || "1-3",
          handover: p.completionDate || "—",
          payment: p.paymentPlan || "—",
          construction: p.completionPercentage || 0,
          source: "PropertyFinder.ae",
          sourceUrl: `https://www.propertyfinder.ae${p.url || "/en/new-projects"}`,
          coverPhoto: p.image || p.coverImage || "",
          addedDate: p.launchDate || "Recent",
        });
      });
    }
  } catch (err) {
    results.errors.push(`PropertyFinder: ${err.message}`);
  }

  // ── SOURCE 4: DUBAI PULSE / DLD — Newly registered projects ─────────────
  // Fetches recently registered off-plan projects from DLD open data
  try {
    const dldUrl = "https://www.dubaipulse.gov.ae/dataset/3b25a6f5-9077-49d7-8a1e-bc6d5dea88fd/resource/a37511b0-ea36-485d-bccd-2d6cb24507e7/download/transactions.csv";
    const dldRes = await fetch(dldUrl, {
      headers: { "User-Agent": "DXB-Analytics/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (dldRes.ok) {
      const text = await dldRes.text();
      const lines = text.split("\n").slice(1, 5000);
      
      // Look for projects with first transactions in last 60 days = new launch
      const projectCount = {};
      const projectData = {};
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      lines.forEach(line => {
        const cols = line.split(",");
        if (cols.length < 12) return;
        const transDate = (cols[0] || "").replace(/"/g, "").trim();
        const projectName = (cols[5] || "").replace(/"/g, "").trim();
        const area = (cols[3] || "").replace(/"/g, "").trim();
        const price = parseFloat((cols[7] || "0").replace(/"/g, ""));
        const type = (cols[11] || "").replace(/"/g, "").trim();
        if (!projectName || projectName.length < 3 || price <= 0) return;

        const parsed = new Date(transDate);
        if (isNaN(parsed) || parsed < sixtyDaysAgo) return;

        if (!projectCount[projectName]) {
          projectCount[projectName] = 0;
          projectData[projectName] = { area, price, type, date: transDate, prices: [] };
        }
        projectCount[projectName]++;
        projectData[projectName].prices.push(price);
      });

      // Projects with 1-20 transactions in last 60 days = likely new launch
      Object.entries(projectCount).forEach(([name, count]) => {
        if (count >= 1 && count <= 20) {
          const d = projectData[name];
          const avgPrice = d.prices.reduce((a, b) => a + b, 0) / d.prices.length;
          results.dubaiPulse.push({
            projectName: name,
            developer: "—",
            community: d.area,
            priceFrom: Math.round(Math.min(...d.prices)),
            avgPrice: Math.round(avgPrice),
            type: d.type || "Mixed",
            transactionCount: count,
            source: "Dubai Pulse / DLD",
            sourceUrl: "https://www.dubaipulse.gov.ae",
            addedDate: d.date,
            handover: "—",
            payment: "—",
            construction: 5,
          });
        }
      });
    }
  } catch (err) {
    results.errors.push(`Dubai Pulse: ${err.message}`);
  }

  // ── MERGE + DEDUPLICATE all sources ──────────────────────────────────────
  const allProjects = [...results.bayut, ...results.propertyfinder, ...results.dubaiPulse];
  const seen = new Set();
  const merged = [];
  
  allProjects.forEach(p => {
    const key = p.projectName.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!seen.has(key) && p.projectName !== "—" && p.projectName.length > 2) {
      seen.add(key);
      // Auto-detect developer ID
      const devMap = {
        "emaar": "emaar", "damac": "damac", "sobha": "sobha",
        "nakheel": "nakheel", "meraas": "meraas", "binghatti": "binghatti",
        "ellington": "ellington", "azizi": "azizi", "danube": "danube",
        "aldar": "aldar", "mag": "mag", "nshama": "nshama",
        "reportage": "reportage", "imtiaz": "imtiaz", "samana": "samana",
        "taraf": "taraf", "dubai south": "dubai_properties",
        "majid al futtaim": "mag", "tiger": "other", "leos": "other",
      };
      let developerId = "other";
      const devLower = (p.developer || "").toLowerCase();
      for (const [key2, id] of Object.entries(devMap)) {
        if (devLower.includes(key2)) { developerId = id; break; }
      }
      
      // Auto-detect tier
      const tier = p.priceFrom > 5000000 ? "Ultra-Luxury" :
                   p.priceFrom > 2000000 ? "Premium" :
                   p.priceFrom > 800000 ? "Mid-Premium" : "Mid-Market";
      
      merged.push({ ...p, developerId, tier: p.tier || tier });
    }
  });

  // Sort newest first
  merged.sort((a, b) => {
    if (a.source === "Dubai Pulse / DLD") return 1;
    if (b.source === "Dubai Pulse / DLD") return -1;
    return 0;
  });

  return res.status(200).json({
    success: true,
    total: merged.length,
    breakdown: {
      bayut: results.bayut.length,
      propertyfinder: results.propertyfinder.length,
      dubaiPulse: results.dubaiPulse.length,
    },
    errors: results.errors,
    projects: merged,
    scannedAt: results.scannedAt,
  });
}
