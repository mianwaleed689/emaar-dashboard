// api/scan-launches.js
// Vercel Serverless Function — sits at PROJECT ROOT /api/
// Multi-page, multi-category, multi-source Dubai real estate scanner

const BAYUT_KEY = process.env.BAYUT_RAPIDAPI_KEY || process.env.BAYUT_RAPIDAPI_KEY;

const HEADERS = {
  "x-rapidapi-key": BAYUT_KEY,
  "x-rapidapi-host": "unofficial-bayut-api.p.rapidapi.com",
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const errors = [];
  const projectMap = {};

  const addProject = (p) => {
    const key = (p.projectName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!key || key.length < 3) return;
    if (!projectMap[key]) {
      projectMap[key] = { ...p };
    } else {
      // Keep lowest price, merge data
      if (p.priceFrom > 0 && (projectMap[key].priceFrom === 0 || p.priceFrom < projectMap[key].priceFrom)) {
        projectMap[key].priceFrom = p.priceFrom;
      }
      projectMap[key].listingCount = (projectMap[key].listingCount || 1) + 1;
      // Prefer richer source data
      if (p.handover && p.handover !== "—") projectMap[key].handover = p.handover;
      if (p.payment && p.payment !== "—") projectMap[key].payment = p.payment;
      if (p.construction > 0) projectMap[key].construction = p.construction;
    }
  };

  // ── SOURCE 1: BAYUT SEARCH — Apartments, Villas, Townhouses × 3 pages ────
  const categories = [
    { id: "4",  name: "Apartments" },
    { id: "3",  name: "Villas" },
    { id: "16", name: "Townhouses" },
  ];

  let bayutTotal = 0;
  for (const cat of categories) {
    for (let page = 0; page <= 3; page++) {
      try {
        const url = `https://unofficial-bayut-api.p.rapidapi.com/search?purpose=for-sale&categoryExternalID=${cat.id}&lang=en&sort=date-desc&page=${page}&hitsPerPage=50&completionStatus=off-plan&locationExternalIDs=5002`;
        const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
        if (!r.ok) break;
        const data = await r.json();
        const hits = data?.hits || [];
        if (hits.length === 0) break;

        hits.forEach(h => {
          const name = h.project?.name || h.title?.split("|")[0]?.split("•")[0]?.trim();
          if (!name || name.length < 3) return;
          bayutTotal++;
          addProject({
            projectName: name,
            developer: h.agency?.name || h.project?.developer?.name || "—",
            community: h.location?.[h.location.length - 2]?.name || h.location?.[h.location.length - 1]?.name || "—",
            district: h.location?.[h.location.length - 1]?.externalID || "—",
            priceFrom: h.price || 0,
            type: cat.name,
            beds: h.rooms > 0 ? String(h.rooms) : "Studio+",
            handover: h.project?.completionDetails?.text || "—",
            payment: "—",
            construction: h.project?.percentCompleted || 0,
            branded: !!(h.project?.brand),
            brand: h.project?.brand || "—",
            source: "Bayut.com",
            sourceUrl: `https://www.bayut.com${h.slug || ""}`,
            coverPhoto: h.coverPhoto?.url || "",
            listingCount: 1,
            addedDate: h.date ? new Date(h.date * 1000).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "Recent",
          });
        });

        if (hits.length < 50) break;
        await sleep(150);
      } catch (e) {
        errors.push(`Bayut ${cat.name} p${page}: ${e.message}`);
        break;
      }
    }
  }

  // ── SOURCE 2: BAYUT NEW-PROJECTS endpoint (dedicated, richer data) ────────
  let npTotal = 0;
  for (let page = 0; page <= 2; page++) {
    try {
      const url = `https://unofficial-bayut-api.p.rapidapi.com/new-projects?locationExternalIDs=5002&lang=en&sort=date-desc&page=${page}&hitsPerPage=50`;
      const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
      if (!r.ok) break;
      const data = await r.json();
      const projects = data?.hits || data?.projects || data?.results || [];
      if (projects.length === 0) break;
      npTotal += projects.length;

      projects.forEach(p => {
        const name = p.name || p.title || "";
        if (!name || name.length < 3) return;
        addProject({
          projectName: name,
          developer: p.developer?.name || p.agency?.name || "—",
          community: p.location?.[p.location.length - 2]?.name || "—",
          district: p.location?.[p.location.length - 1]?.externalID || "—",
          priceFrom: p.minPrice || p.price || 0,
          priceTo: p.maxPrice || 0,
          type: p.category?.nameSingular || "Mixed",
          beds: p.minRooms ? `${p.minRooms}${p.maxRooms ? `-${p.maxRooms}` : "+"}` : "1-3",
          handover: p.completionDate || p.completionDetails?.text || "—",
          payment: p.paymentPlan || "—",
          construction: p.percentCompleted || 0,
          branded: !!(p.brand),
          brand: p.brand || "—",
          source: "Bayut New Projects",
          sourceUrl: `https://www.bayut.com${p.slug || "/new-projects/dubai/"}`,
          coverPhoto: p.coverPhoto?.url || "",
          listingCount: p.unitCount || 1,
          addedDate: p.launchDate ? new Date(p.launchDate * 1000).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "Recent",
        });
      });

      if (projects.length < 50) break;
      await sleep(150);
    } catch (e) {
      errors.push(`Bayut NewProjects p${page}: ${e.message}`);
      break;
    }
  }

  // ── SOURCE 3: BAYUT — Per developer search (catch projects not in general search) ──
  const DEVELOPERS = [
    { name: "Emaar",    id: "26", bayutId: "26" },
    { name: "DAMAC",    id: "32", bayutId: "32" },
    { name: "Sobha",    id: "40", bayutId: "40" },
    { name: "Nakheel",  id: "28", bayutId: "28" },
    { name: "Meraas",   id: "45", bayutId: "45" },
    { name: "Binghatti",id: "73", bayutId: "73" },
    { name: "Ellington",id: "67", bayutId: "67" },
    { name: "Azizi",    id: "53", bayutId: "53" },
    { name: "Danube",   id: "56", bayutId: "56" },
    { name: "Aldar",    id: "85", bayutId: "85" },
  ];

  let devTotal = 0;
  for (const dev of DEVELOPERS) {
    try {
      const url = `https://unofficial-bayut-api.p.rapidapi.com/search?purpose=for-sale&categoryExternalID=4&lang=en&sort=date-desc&page=0&hitsPerPage=25&completionStatus=off-plan&developerID=${dev.bayutId}&locationExternalIDs=5002`;
      const r = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(6000) });
      if (!r.ok) continue;
      const data = await r.json();
      const hits = data?.hits || [];
      devTotal += hits.length;

      hits.forEach(h => {
        const name = h.project?.name || h.title?.split("|")[0]?.trim();
        if (!name || name.length < 3) return;
        addProject({
          projectName: name,
          developer: dev.name,
          developerId: dev.name.toLowerCase(),
          community: h.location?.[h.location.length - 2]?.name || "—",
          priceFrom: h.price || 0,
          type: h.category?.nameSingular || "Apartments",
          beds: h.rooms > 0 ? String(h.rooms) : "1-3",
          handover: h.project?.completionDetails?.text || "—",
          construction: h.project?.percentCompleted || 0,
          source: `Bayut (${dev.name})`,
          sourceUrl: `https://www.bayut.com${h.slug || ""}`,
          listingCount: 1,
          addedDate: "Recent",
          payment: "—",
          branded: false,
          brand: "—",
        });
      });
      await sleep(100);
    } catch (e) {
      errors.push(`Bayut ${dev.name}: ${e.message}`);
    }
  }

  // ── SOURCE 4: DUBAI PULSE / DLD — Newly registered projects ─────────────
  let dldTotal = 0;
  try {
    const dldUrl = "https://www.dubaipulse.gov.ae/dataset/3b25a6f5-9077-49d7-8a1e-bc6d5dea88fd/resource/a37511b0-ea36-485d-bccd-2d6cb24507e7/download/transactions.csv";
    const r = await fetch(dldUrl, { headers: { "User-Agent": "DXB-Analytics/1.0" }, signal: AbortSignal.timeout(12000) });
    if (r.ok) {
      const text = await r.text();
      const lines = text.split("\n").slice(1, 8000);
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
        if (!projectName || projectName.length < 3 || price <= 0) return;
        const parsed = new Date(transDate);
        if (isNaN(parsed) || parsed < sixtyDaysAgo) return;
        if (!projectCount[projectName]) { projectCount[projectName] = 0; projectData[projectName] = { area, price, date: transDate, prices: [] }; }
        projectCount[projectName]++;
        projectData[projectName].prices.push(price);
      });

      Object.entries(projectCount).forEach(([name, count]) => {
        if (count >= 1 && count <= 25) {
          dldTotal++;
          const d = projectData[name];
          addProject({
            projectName: name,
            developer: "—",
            community: d.area,
            priceFrom: Math.round(Math.min(...d.prices)),
            type: "Mixed",
            transactionCount: count,
            source: "Dubai Pulse / DLD",
            sourceUrl: "https://www.dubaipulse.gov.ae",
            addedDate: d.date,
            handover: "—",
            payment: "—",
            construction: 5,
            branded: false,
            brand: "—",
            beds: "—",
            listingCount: count,
          });
        }
      });
    }
  } catch (e) {
    errors.push(`Dubai Pulse: ${e.message}`);
  }

  // ── ENRICH + FINALISE ─────────────────────────────────────────────────────
  const devIdMap = {
    emaar: "emaar", damac: "damac", sobha: "sobha", nakheel: "nakheel",
    meraas: "meraas", binghatti: "binghatti", ellington: "ellington",
    azizi: "azizi", danube: "danube", aldar: "aldar", mag: "mag",
    nshama: "nshama", reportage: "reportage", imtiaz: "imtiaz",
    samana: "samana", taraf: "taraf",
  };

  const merged = Object.values(projectMap).map(p => {
    let developerId = p.developerId || "other";
    if (developerId === "other") {
      const dl = (p.developer || "").toLowerCase();
      for (const [k, id] of Object.entries(devIdMap)) {
        if (dl.includes(k)) { developerId = id; break; }
      }
    }
    const price = p.priceFrom || 0;
    const tier = price > 5000000 ? "Ultra-Luxury" : price > 2000000 ? "Premium" : price > 800000 ? "Mid-Premium" : "Mid-Market";
    return { ...p, developerId, tier: p.tier || tier };
  });

  // Sort: Bayut New Projects first, then by price desc
  merged.sort((a, b) => {
    if (a.source === "Bayut New Projects" && b.source !== "Bayut New Projects") return -1;
    if (b.source === "Bayut New Projects" && a.source !== "Bayut New Projects") return 1;
    return (b.priceFrom || 0) - (a.priceFrom || 0);
  });

  return res.status(200).json({
    success: true,
    total: merged.length,
    breakdown: {
      bayutSearch: bayutTotal,
      bayutNewProjects: npTotal,
      bayutPerDeveloper: devTotal,
      dubaiPulse: dldTotal,
    },
    errors,
    projects: merged,
    scannedAt: new Date().toISOString(),
  });
};
