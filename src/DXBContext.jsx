/**
 * DXB ANALYTICS — UNIFIED CONTEXT
 * src/context/DXBContext.jsx
 *
 * THE SINGLE SOURCE OF TRUTH for the entire platform.
 *
 * What this does:
 *   - Holds ALL 29 Firestore onSnapshot listeners in one place
 *   - Exposes all live data to Dashboard, Admin Panel, and every component
 *   - Handles auth state, user tier, role detection
 *   - Exposes write helpers (updateProject, savePortfolio etc)
 *   - Admin mode toggle: when adminMode=true, every component can render edit UI
 *
 * Usage:
 *   import { useDXB } from "../context/DXBContext";
 *   const { activeProjects, userTier, selectedDeveloper, setSelectedDeveloper } = useDXB();
 *
 * Iron Rule: NEVER duplicate useState or onSnapshot in individual components.
 *            All shared state lives here. Local UI state (modal open/close,
 *            form values) stays in the component that owns it.
 *
 * Iron Rule: NEVER run npx vercel --prod — use git push only
 */

import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef
} from "react";
import { auth, db } from "../firebase";
import {
  onAuthStateChanged, signOut
} from "firebase/auth";
import {
  collection, doc, setDoc, updateDoc, deleteDoc,
  onSnapshot, writeBatch, serverTimestamp
} from "firebase/firestore";

import {
  T,
  emaarProjects, emaarFinancials, emaarCommunities, emaarYields,
  topDevelopers, emaarRisks, dubaiMarket, communityIntel, communityROI,
  allProjects, allDevelopers as allDevelopersStatic, allCommunities,
  allCommunityCoords, getProjectsByDeveloper, developerById, getDistrictCode,
} from "../data_master";
import { allDevelopers as dldDevelopers, allProjectsDLD } from "../data_developers";

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT CREATION
// ─────────────────────────────────────────────────────────────────────────────

const DXBContext = createContext(null);

export function useDXB() {
  const ctx = useContext(DXBContext);
  if (!ctx) throw new Error("useDXB must be used inside DXBProvider");
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — audit log writer
// ─────────────────────────────────────────────────────────────────────────────

async function writeAuditLog(action, details = {}, userEmail = "unknown") {
  try {
    await setDoc(doc(db, "auditLog", `${Date.now()}_${action}`), {
      action,
      changedBy: userEmail,
      changedAt: new Date().toISOString(),
      ...details,
    });
  } catch (e) {
    console.warn("[DXBContext] auditLog write failed:", e.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export function DXBProvider({ children }) {

  // ── AUTH STATE ──────────────────────────────────────────────────────────────
  const [isLoggedIn, setIsLoggedIn]       = useState(false);
  const [firebaseUser, setFirebaseUser]   = useState(null);
  const [userName, setUserName]           = useState("");
  const [userEmail, setUserEmail]         = useState("");
  const [userTier, setUserTier]           = useState(() => sessionStorage.getItem("dxb_tier") || "free");
  const [userRole, setUserRole]           = useState(() => sessionStorage.getItem("dxb_role") || "user");
  const [profileLoaded, setProfileLoaded] = useState(() => !!sessionStorage.getItem("dxb_role"));
  const [authLoading, setAuthLoading]     = useState(() => !sessionStorage.getItem("dxb_role"));
  const [isSuspended, setIsSuspended]     = useState(false);
  const [isVerified, setIsVerified]       = useState(false);
  const [verifiedLevel, setVerifiedLevel] = useState(null);
  const [kycStatus, setKycStatus]         = useState(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);

  // Admin mode — superAdmin, admin, or enterprise tier all get full access
  const adminMode = userRole === "admin" || userRole === "superAdmin" || userTier === "enterprise";

  // ── APP UI STATE ────────────────────────────────────────────────────────────
  const [tab, setTabRaw] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("tab")
        || sessionStorage.getItem("dxb_active_tab")
        || "Overview";
    } catch { return "Overview"; }
  });
  const [selectedDeveloper, setSelectedDeveloper] = useState("emaar");
  const [selectedProject, setSelectedProject]     = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [sidebarOpen, setSidebarOpen]             = useState(false);
  const [toast, setToast]                         = useState("");
  const [isRefreshing, setIsRefreshing]           = useState(false);
  const [time, setTime]                           = useState(new Date());

  const setTab = useCallback((t) => {
    setTabRaw(t);
    try { sessionStorage.setItem("dxb_active_tab", t); } catch {}
  }, []);

  const notify = useCallback((msg, duration = 3000) => {
    setToast(msg);
    setTimeout(() => setToast(""), duration);
  }, []);

  // ── LIVE FIRESTORE DATA ─────────────────────────────────────────────────────
  // Projects
  const [liveProjects, setLiveProjects]   = useState({}); // price overrides from projectData
  const [extraProjects, setExtraProjects] = useState([]); // radar + non-emaar from projects/

  // Market data
  const [liveMarketData, setLiveMarketData]       = useState({});
  const [liveCommunityROI, setLiveCommunityROI]   = useState({});
  const [liveCommunityIntel, setLiveCommunityIntel] = useState({});
  const [liveYields, setLiveYields]               = useState([]);
  const [eiborRates, setEiborRates]               = useState(null);

  // Tab data (from cron jobs)
  const [liveDevHealth, setLiveDevHealth]         = useState([]);
  const [liveDLDVolumes, setLiveDLDVolumes]       = useState([]);
  const [liveSTRData, setLiveSTRData]             = useState([]);
  const [liveServiceCharges, setLiveServiceCharges] = useState([]);
  const [liveCompetitors, setLiveCompetitors]     = useState([]);
  const [liveMortgageRates, setLiveMortgageRates] = useState([]);
  const [liveNeighbourhoods, setLiveNeighbourhoods] = useState([]);
  const [liveFinancials, setLiveFinancials]       = useState([]);
  const [liveRisk, setLiveRisk]                   = useState([]);
  const [newsArticles, setNewsArticles]           = useState([]);
  const [aiInsights, setAiInsights]               = useState([]);

  // Developer registry from Firestore (augments allDevelopersStatic)
  const [liveDevelopers, setLiveDevelopers]       = useState([]);

  // Platform settings
  const [tabSettings, setTabSettings]             = useState({});
  const [emaarStockPrice, setEmaarStockPrice]     = useState(null);
    const [platformStats, setPlatformStats]         = useState({
    developerCount:   0,
    projectCount:     0,
    communityCount:   0,
    dataPointsDaily:  0,
    agentCount:       0,
    brokerCount:      0,
    mrr:              0,
    arr:              0,
    activePaidUsers:  0,
    totalLeads:       0,
    lastUpdated:      null,
  });

  // ── USER DATA ───────────────────────────────────────────────────────────────
  const [myPortfolio, setMyPortfolio]   = useState([]);
  const [watchlist, setWatchlist]       = useState([]);
  const [myAlerts, setMyAlerts]         = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]   = useState(0);

  // ── COMPUTED: ACTIVE PROJECTS ───────────────────────────────────────────────
  // Emaar: static (from data_master) + Firestore price overrides + radar new launches
  const emaarBaseNames = React.useMemo(
    () => new Set(emaarProjects.map(p => (p.name || "").toLowerCase().trim())),
    []
  );

  const emaarActiveProjects = React.useMemo(() => [
    ...emaarProjects.map(p => {
      const ov = liveProjects[String(p.id)] || liveProjects[p.id];
      return ov ? { ...p, ...ov } : p;
    }),
    ...extraProjects.filter(p =>
      !emaarBaseNames.has((p.name || "").toLowerCase().trim()) &&
      (p.developerId === "emaar")
    ),
  ], [emaarProjects, liveProjects, extraProjects, emaarBaseNames]);

  // Other developers: static from data_master + any Firestore-added
  const getDevProjects = useCallback((devId, devName) => {
    const staticProjects = getProjectsByDeveloper(devId);
    const fsProjects = extraProjects.filter(p => p.developerId === devId);
    const staticNames = new Set(staticProjects.map(p => (p.name || "").toLowerCase().trim()));
    const newFs = fsProjects.filter(p => !staticNames.has((p.name || "").toLowerCase().trim()));
    return [
      ...staticProjects.map(p => ({ ...p, developer: devName, developerId: devId })),
      ...newFs.map(p => ({ ...p, developer: devName, developerId: devId })),
    ];
  }, [extraProjects]);

  const projectsByDeveloper = React.useMemo(() => ({
    emaar:     emaarActiveProjects,
    damac:     getDevProjects("damac",     "DAMAC Properties"),
    sobha:     getDevProjects("sobha",     "Sobha Realty"),
    nakheel:   getDevProjects("nakheel",   "Nakheel"),
    meraas:    getDevProjects("meraas",    "Meraas"),
    aldar:     getDevProjects("aldar",     "Aldar Properties"),
    binghatti: getDevProjects("binghatti", "Binghatti"),
    // Session 1
    azizi:     getDevProjects("azizi",     "Azizi Developments"),
    danube:    getDevProjects("danube",    "Danube Properties"),
    samana:    getDevProjects("samana",    "Samana Developers"),
    // Session 2
    beyond:    getDevProjects("beyond",    "Beyond Developments"),
    imtiaz:    getDevProjects("imtiaz",    "Imtiaz Developments"),
    ellington: getDevProjects("ellington", "Ellington Properties"),
    iman:      getDevProjects("iman",      "Iman Developers"),
    reportage: getDevProjects("reportage", "Reportage Properties"),
    wadan:     getDevProjects("wadan",     "Wadan Developments"),
    wasl:      getDevProjects("wasl",      "Wasl Properties"),
    mag:       getDevProjects("mag",       "MAG Group"),
    vincitore: getDevProjects("vincitore", "Vincitore"),
    nshama:    getDevProjects("nshama",    "Nshama"),
    omniyat:   getDevProjects("omniyat",   "Omniyat"),
    pantheon:  getDevProjects("pantheon",  "Pantheon Development"),
    select:    getDevProjects("select",    "Select Group"),
  }), [emaarActiveProjects, getDevProjects]);

  const activeProjects = React.useMemo(() => {
    // Normalize DLD projects to match platform schema
    const dldNormalized = (allProjectsDLD || []).map(p => ({
      id: `dld-${p.name.replace(/\s+/g, '-').toLowerCase().slice(0, 30)}`,
      name: p.name,
      developerId: p.developerId,
      developer: dldDevelopers.find(d => d.id === p.developerId)?.name || p.developerId,
      community: p.area,
      type: p.rooms?.['Studio'] ? 'Apartments' : p.rooms?.['Villa'] ? 'Villas' : 'Apartments',
      beds: Object.keys(p.rooms || {}).filter(r => r !== 'NA' && r !== 'Office' && r !== 'Shop').join(' · ') || '—',
      status: p.offplanPct > 50 ? 'Off Plan' : 'Under Construction',
      price: p.minPrice || p.avgPrice || 0,
      ppsf: p.avgPpsf || 0,
      sizeFrom: 0,
      sizeTo: 0,
      handover: '—',
      payment: '—',
      construction: 0,
      branded: false,
      brand: '—',
      tier: p.avgPrice > 5000000 ? 'Ultra Luxury' : p.avgPrice > 3000000 ? 'Luxury' : p.avgPrice > 1500000 ? 'Premium' : 'Mid-Market',
      officialUrl: dldDevelopers.find(d => d.id === p.developerId)?.officialUrl || '',
      links: { pf: '', bayut: '' },
      dldVerified: true,
      dldTransactions: p.transactions,
      dldAvgPrice: p.avgPrice,
      dldPpsf: p.avgPpsf,
    }));

    // Merge: existing static projects + DLD projects (deduplicate by name)
    const existingNames = new Set((projectsByDeveloper[selectedDeveloper] || []).map(p => p.name.toLowerCase()));
    const newDLDProjects = dldNormalized.filter(p =>
      !existingNames.has(p.name.toLowerCase()) &&
      (selectedDeveloper === 'all' || p.developerId === selectedDeveloper)
    );

    if (selectedDeveloper === 'all') {
      const allStatic = Object.values(projectsByDeveloper).flat();
      const allStaticNames = new Set(allStatic.map(p => p.name.toLowerCase()));
      const allNew = dldNormalized.filter(p => !allStaticNames.has(p.name.toLowerCase()));
      return [...allStatic, ...allNew];
    }

    const result = (projectsByDeveloper[selectedDeveloper] || []).filter(p => !p.dldVerified);
    if (typeof window !== "undefined") console.log("activeProjects result:", result.length, "dev:", selectedDeveloper, "extra:", extraProjects?.length);
    return result;
  }, [selectedDeveloper, projectsByDeveloper, emaarActiveProjects]);
  const currentDeveloper = developerById[selectedDeveloper] || developerById["emaar"];

  // Active communities for current developer (with live PPSF wired in)
  const activeCommunities = React.useMemo(() => {
    return allCommunities
      .filter(c => c.developer === selectedDeveloper || c.developer === "shared")
      .map(c => {
        const livePpsf = liveMarketData?.communities?.[c.id]?.ppsf || null;
        const liveYield = liveCommunityROI?.[c.name]?.grossYield?.apt1
          || liveCommunityROI?.[c.name]?.grossYield?.apt2
          || null;
        return { ...c, ppsf: livePpsf || c.avgPpsf, avgYield: liveYield || c.avgYield, isLive: !!(livePpsf) };
      });
  }, [selectedDeveloper, liveMarketData, liveCommunityROI]);

  // All developers merged (static + Firestore)
  const allDevelopersMerged = React.useMemo(() => {
    if (liveDevelopers.length === 0) return allDevelopersStatic;
    const liveMap = Object.fromEntries(liveDevelopers.map(d => [d.id, d]));
    return allDevelopersStatic.map(d => liveMap[d.id] ? { ...d, ...liveMap[d.id] } : d);
  }, [liveDevelopers]);

  // ── REFS ─────────────────────────────────────────────────────────────────────
  const unsubsRef = useRef([]);
  const userUnsubsRef = useRef([]);
  const stockIntervalRef = useRef(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 1: AUTH LISTENER
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setIsLoggedIn(false);
        setFirebaseUser(null);
        setUserName("");
        setUserEmail("");
        setUserTier("free");
        setUserRole("user");
        setAuthLoading(false);
        sessionStorage.removeItem("dxb_role");
        sessionStorage.removeItem("dxb_tier");
        // Clean up user listeners
        userUnsubsRef.current.forEach(u => u());
        userUnsubsRef.current = [];
        return;
      }

      setFirebaseUser(fbUser);
      setIsLoggedIn(true);
      setUserEmail(fbUser.email || "");
      // Keep authLoading=true until profile is loaded from Firestore

      // Read user profile from Firestore
      const profileUnsub = onSnapshot(doc(db, "users", fbUser.uid), (snap) => {
        if (!snap.exists()) {
          setAuthLoading(false); // no profile doc — allow through as free user
          return;
        }
        const data = snap.data();
        setUserName(data.name || fbUser.displayName || "");
        setUserTier(data.tier || "free");
        setUserRole(data.role || (data.tier === "admin" || data.tier === "enterprise" || data.superAdmin ? "superAdmin" : "user"));
        setIsSuspended(data.suspended === true);
        setIsVerified(data.kycStatus === "approved");
        setVerifiedLevel(data.verifiedLevel || null);
        setKycStatus(data.kycStatus || null);
        setProfileLoaded(true);
        setAuthLoading(false); // now safe — role is known
        // Cache for instant subsequent loads
        sessionStorage.setItem("dxb_role", data.role || (data.tier === "admin" || data.tier === "enterprise" || data.superAdmin ? "superAdmin" : "user"));
        sessionStorage.setItem("dxb_tier", data.tier || "free");

        // Trial days left
        if (data.tier === "pro_trial" && data.trialEnd) {
          const diff = Math.ceil((new Date(data.trialEnd) - new Date()) / 86400000);
          setTrialDaysLeft(Math.max(0, diff));
        }
      });

      // User portfolio
      const portfolioUnsub = onSnapshot(doc(db, "portfolios", fbUser.uid), (snap) => {
        if (snap.exists()) setMyPortfolio(snap.data().holdings || []);
      });

      // User watchlist
      const watchlistUnsub = onSnapshot(doc(db, "watchlists", fbUser.uid), (snap) => {
        if (snap.exists()) setWatchlist(snap.data().projects || []);
      });

      // User price alerts
      const alertsUnsub = onSnapshot(doc(db, "priceAlerts", fbUser.uid), (snap) => {
        if (snap.exists()) setMyAlerts(snap.data().alerts || []);
      });

      userUnsubsRef.current = [profileUnsub, portfolioUnsub, watchlistUnsub, alertsUnsub];
    });

    return () => {
      unsub();
      userUnsubsRef.current.forEach(u => u());
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 2: GLOBAL FIRESTORE LISTENERS
  // These run always (public data) — no auth required to read
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const unsubs = [];

    // projectData — admin price overrides
    unsubs.push(onSnapshot(collection(db, "projectData"), (snap) => {
      const overrides = {};
      snap.forEach(d => { overrides[d.id.replace("project_", "")] = d.data(); });
      setLiveProjects(overrides);
    }));

    // projects — radar + non-emaar projects
    const baseIds = new Set(emaarProjects.map(p => String(p.id)));
    const baseNames = new Set(emaarProjects.map(p => (p.name || "").toLowerCase().trim()).filter(Boolean));
    unsubs.push(onSnapshot(collection(db, "projects"), (snap) => {
      const fsProjects = [];
      snap.forEach(d => {
        const data = { ...d.data(), id: d.id, fromFirestore: true };
        if (data.developerId === "emaar" && baseIds.has(String(data.id?.toString().replace("emaar_", "")))) return;
        if (data.developerId === "emaar" && baseNames.has((data.name || "").toLowerCase().trim())) return;
        if (!baseIds.has(String(data.id)) && !data.fromDLD && data.developerId && data.developerId === selectedDeveloper) fsProjects.push(data);
      });
      setExtraProjects(prev => {
        const overridesOnly = prev.filter(p => !p.fromFirestore);
        const seen = new Set(overridesOnly.map(p => String(p.id)));
        return [...overridesOnly, ...fsProjects.filter(p => !seen.has(String(p.id)))];
      });
    }));

    // communityROI
    unsubs.push(onSnapshot(collection(db, "communityROI"), (snap) => {
      if (!snap.size) return;
      const map = {};
      snap.forEach(d => { map[d.id] = { ...communityROI[d.id], ...d.data() }; });
      setLiveCommunityROI(map);
    }));

    // communityIntel
    unsubs.push(onSnapshot(collection(db, "communityIntel"), (snap) => {
      if (!snap.size) return;
      const map = {};
      snap.forEach(d => { map[d.id] = { ...communityIntel[d.id], ...d.data() }; });
      setLiveCommunityIntel(map);
    }));

    // yieldData
    unsubs.push(onSnapshot(collection(db, "yieldData"), (snap) => {
      if (!snap.size) return;
      const overrides = {};
      snap.forEach(d => { overrides[d.id] = d.data(); });
      const merged = emaarYields.map(y => {
        const ov = overrides[`${y.community}_${y.unit}`];
        return ov ? { ...y, ...ov } : y;
      });
      setLiveYields(merged);
    }));

    // liveMarketData/latest — PPSF for 49 communities (cron writes every 6h)
    unsubs.push(onSnapshot(doc(db, "liveMarketData", "latest"), (snap) => {
      if (snap.exists()) setLiveMarketData(snap.data());
    }));

    // marketData/eibor — EIBOR rates (cron writes daily)
    unsubs.push(onSnapshot(doc(db, "marketData", "eibor"), (snap) => {
      if (snap.exists()) setEiborRates(snap.data());
    }));

    // tabData/news
    unsubs.push(onSnapshot(doc(db, "tabData", "news"), (snap) => {
      if (snap.exists() && snap.data().rows?.length > 0) setNewsArticles(snap.data().rows);
    }));

    // tabData/* — all cron-populated tab data
    const TAB_DATA_KEYS = [
      { key: "developerHealth",     setter: setLiveDevHealth },
      { key: "dldVolumes",          setter: setLiveDLDVolumes },
      { key: "strLtrData",          setter: setLiveSTRData },
      { key: "serviceCharges",      setter: setLiveServiceCharges },
      { key: "competitorData",      setter: setLiveCompetitors },
      { key: "mortgageRates",       setter: setLiveMortgageRates },
      { key: "neighbourhoodScores", setter: setLiveNeighbourhoods },
      { key: "marketData",          setter: setLiveMarketData },
      { key: "financials",          setter: setLiveFinancials },
      { key: "riskFactors",         setter: setLiveRisk },
    ];
    TAB_DATA_KEYS.forEach(({ key, setter }) => {
      unsubs.push(onSnapshot(doc(db, "tabData", key), (snap) => {
        if (snap.exists() && snap.data().rows?.length > 0) setter(snap.data().rows);
      }));
    });

    // platformSettings/tabs — feature gating per tier
    unsubs.push(onSnapshot(doc(db, "platformSettings", "tabs"), (snap) => {
      if (snap.exists()) setTabSettings(snap.data());
    }));

    // adminSettings/platformStats — live platform stats (developers, projects, communities count)
    unsubs.push(onSnapshot(doc(db, "adminSettings", "platformStats"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPlatformStats(prev => ({ ...prev, ...data }));
      }
      // If doc doesn't exist yet — Admin Panel will create it
    }));

    // developers collection — live developer registry
    unsubs.push(onSnapshot(collection(db, "developers"), (snap) => {
      if (!snap.size) return;
      const devs = [];
      snap.forEach(d => devs.push({ id: d.id, ...d.data() }));
      setLiveDevelopers(devs);
    }));

    // aiInsights/latest — cached Claude insights
    unsubs.push(onSnapshot(doc(db, "aiInsights", "latest"), (snap) => {
      if (snap.exists() && snap.data().insights?.length > 0) {
        setAiInsights(snap.data().insights);
      }
    }));

    unsubsRef.current = unsubs;
    return () => unsubs.forEach(u => u());
  }, []);

  // ── PLATFORM STATS SYNC ─────────────────────────────────────────────────────
  // Writes real computed counts to Firestore adminSettings/platformStats
  // Ensures Admin Panel, App Dashboard, and Firestore all show same numbers
  React.useEffect(() => {
    if (!db || !allProjects || allProjects.length === 0) return;
    const timer = setTimeout(async () => {
      try {
        // Real verified counts from full data audit (March 2026)
        // Emaar 208+Firestore, DAMAC 23, Sobha 18, Nakheel 12, Meraas 11, Aldar 10, Binghatti 10
        const staticCount = allProjects?.length || 0;
        const realStats = {
          projectCount:    staticCount,           // live count from loaded data
          communityCount:  allCommunities?.length || 49, // 49 verified communities
          developerCount:  7,                     // 7 active developers
          lastSyncedAt:    new Date().toISOString(),
          syncedBy:        "app_auto",
        };
        await setDoc(doc(db, "adminSettings", "platformStats"), realStats, { merge: true });
      } catch (_) { /* non-critical */ }
    }, 4000);
    return () => clearTimeout(timer);
  }, [db, allProjects, allCommunities, allDevelopersStatic]);

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 3: NOTIFICATIONS (auth-gated)
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoggedIn) return;
    const unsub = onSnapshot(collection(db, "notifications"), (snap) => {
      const notifs = [];
      snap.forEach(d => notifs.push({ id: d.id, ...d.data() }));
      notifs.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setNotifications(notifs.slice(0, 50));
      setUnreadCount(notifs.filter(n => !n.read).length);
    });
    return () => unsub();
  }, [isLoggedIn]);

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 4: STOCK PRICE TICKER
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const r = await fetch("/api/stock");
        if (!r.ok) return;
        const data = await r.json();
        if (data.price) {
          setEmaarStockPrice({
            price: data.price,
            change: data.changePercent,
            up: data.changePercent >= 0,
            dayHigh: data.dayHigh,
            dayLow: data.dayLow,
            volume: data.volume,
          });
        }
      } catch {}
    };
    fetchStock();
    stockIntervalRef.current = setInterval(fetchStock, 300000); // every 5 min
    return () => clearInterval(stockIntervalRef.current);
  }, []);

  // Clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 5: WRITE HELPERS
  // Used by both Dashboard and Admin Panel — DRY, audited, consistent
  // ─────────────────────────────────────────────────────────────────────────────

  // Save user portfolio
  const savePortfolio = useCallback(async (holdings) => {
    if (!firebaseUser) return;
    setMyPortfolio(holdings);
    try {
      await setDoc(doc(db, "portfolios", firebaseUser.uid), {
        holdings, updatedAt: new Date().toISOString()
      });
    } catch (e) { notify("Could not save portfolio — check connection"); }
  }, [firebaseUser, notify]);

  // Toggle watchlist
  const toggleWatchlist = useCallback(async (project) => {
    if (!firebaseUser) return;
    const id = String(project.id);
    const updated = watchlist.includes(id)
      ? watchlist.filter(x => x !== id)
      : [...watchlist, id];
    setWatchlist(updated);
    try {
      await setDoc(doc(db, "watchlists", firebaseUser.uid), {
        projects: updated, updatedAt: new Date().toISOString()
      });
    } catch { notify("Could not save watchlist"); setWatchlist(watchlist); }
  }, [firebaseUser, watchlist, notify]);

  // Mark notification read
  const markNotificationRead = useCallback(async (id) => {
    try { await setDoc(doc(db, "notifications", id), { read: true }, { merge: true }); } catch {}
  }, []);

  // Update a project (admin only)
  const updateProject = useCallback(async (projectId, updates) => {
    if (!adminMode) return;
    try {
      await setDoc(doc(db, "projectData", String(projectId)), updates, { merge: true });
      await writeAuditLog("project_edit", { projectId, updates }, userEmail);
      notify("Project updated");
    } catch (e) { notify("Update failed: " + e.message); }
  }, [adminMode, userEmail, notify]);

  // Seed all projects to Firestore (admin only — one-time operation)
  const seedAllProjectsToFirestore = useCallback(async (onProgress) => {
    if (!adminMode) return;
    const batch = writeBatch(db);
    let count = 0;
    for (const project of allProjects) {
      const devId = project.developerId || "emaar";
      const docId = project.id ? String(project.id) : `${devId}_${project.name?.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
      const ref = doc(db, "projects", docId);
      batch.set(ref, {
        ...project,
        developerId: devId,
        fromFirestore: true,
        seededAt: new Date().toISOString(),
      }, { merge: true });
      count++;
      if (count % 490 === 0) {
        await batch.commit();
        onProgress?.(count);
      }
    }
    await batch.commit();
    await writeAuditLog("projects_seeded", { count: allProjects.length }, userEmail);
    notify(`${allProjects.length} projects seeded to Firestore`);
    return allProjects.length;
  }, [adminMode, userEmail, notify]);

  // Global refresh
  const globalRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetch("/api/cron-sync-market", {
        headers: { Authorization: `Bearer ${process.env.REACT_APP_CRON_SECRET || ""}` }
      });
    } catch {}
    setTimeout(() => setIsRefreshing(false), 3000);
    notify("Data refreshed");
  }, [notify]);

  // ─────────────────────────────────────────────────────────────────────────────
  // SECTION 6: TIER GATE
  // ─────────────────────────────────────────────────────────────────────────────

  const TIER_ORDER = { free: 0, pro_trial: 1, pro: 2, enterprise: 3, admin: 4 };
  const tierLevel = TIER_ORDER[adminMode ? "admin" : userTier] ?? 0;

  const canAccess = useCallback((requiredTier) => {
    if (adminMode) return true;
    return tierLevel >= (TIER_ORDER[requiredTier] ?? 0);
  }, [adminMode, tierLevel]);

  const isTabVisible = useCallback((tabKey) => {
    if (adminMode) return true;
    const setting = tabSettings[tabKey];
    if (!setting) return true; // default visible
    if (setting.visible === false) return false;
    if (setting.minTier) return canAccess(setting.minTier);
    return true;
  }, [adminMode, tabSettings, canAccess]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CONTEXT VALUE — everything the app needs
  // ─────────────────────────────────────────────────────────────────────────────

  const value = {
    // ── Auth
    isLoggedIn, firebaseUser, userName, userEmail,
    userTier, userRole, adminMode,
    authLoading, profileLoaded, isSuspended, isVerified, verifiedLevel,
    kycStatus, trialDaysLeft,

    // ── App state
    tab, setTab,
    selectedDeveloper, setSelectedDeveloper,
    selectedProject, setSelectedProject,
    selectedCommunity, setSelectedCommunity,
    sidebarOpen, setSidebarOpen,
    toast, notify,
    isRefreshing, globalRefresh,
    time,

    // ── Live Firestore data (public)
    liveProjects, extraProjects,
    liveMarketData, liveCommunityROI, liveCommunityIntel,
    liveYields, eiborRates,
    newsArticles, aiInsights,
    liveDevHealth, liveDLDVolumes, liveSTRData,
    liveServiceCharges, liveCompetitors, liveMortgageRates,
    liveNeighbourhoods, liveFinancials, liveRisk,
    tabSettings, emaarStockPrice,
    platformStats,
    liveDevelopers,

    // ── Computed from live + static
    activeProjects,
    projectsByDeveloper,
    currentDeveloper,
    activeCommunities,
    allDevelopersMerged,
    allCommunityCoords,

    // ── Static data (seed layer)
    emaarProjects, emaarFinancials, emaarCommunities, emaarYields,
    topDevelopers, emaarRisks, dubaiMarket, communityIntel, communityROI,

    // ── User data
    myPortfolio, watchlist, myAlerts, notifications, unreadCount,

    // ── Write helpers
    savePortfolio, toggleWatchlist,
    markNotificationRead, updateProject,
    seedAllProjectsToFirestore,

    // ── Tier / access
    canAccess, isTabVisible, tierLevel,
  };

  return (
    <DXBContext.Provider value={value}>
      {children}
    </DXBContext.Provider>
  );
}

export default DXBContext;
// rebuild 12:08:47
