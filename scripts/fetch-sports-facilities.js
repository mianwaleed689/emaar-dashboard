const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

const GOOGLE_API_KEY = "AIzaSyAqv0r7D5Z1hnf0yrP1Ijxmat6HYTTRZmw";
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Search for ALL types of sports facilities near a location
async function findAllSports(lat, lng) {
  const searches = [
    // Gyms & Fitness
    { keyword: "gym fitness center dubai",        type: "gym" },
    { keyword: "Fitness First dubai",             type: null  },
    { keyword: "Gold's Gym dubai",                type: null  },
    { keyword: "Warehouse Gym dubai",             type: null  },
    // Padel & Tennis
    { keyword: "padel court dubai",               type: null  },
    { keyword: "tennis court club dubai",         type: null  },
    { keyword: "squash court dubai",              type: null  },
    // Swimming & Water
    { keyword: "swimming pool club dubai",        type: null  },
    { keyword: "aquatic center dubai",            type: null  },
    // Golf
    { keyword: "golf course dubai",               type: null  },
    { keyword: "golf club dubai",                 type: null  },
    // Football & Cricket
    { keyword: "football ground pitch dubai",     type: null  },
    { keyword: "cricket ground dubai",            type: null  },
    { keyword: "5 aside football dubai",          type: null  },
    // Sports Clubs & Multiplex
    { keyword: "sports club complex dubai",       type: null  },
    { keyword: "athletics track stadium dubai",   type: null  },
    { keyword: "basketball court dubai",          type: null  },
    { keyword: "volleyball court dubai",          type: null  },
    // Running & Cycling
    { keyword: "running track cycling path dubai",type: null  },
    // Martial Arts & Boxing
    { keyword: "martial arts boxing gym dubai",   type: null  },
    // Yoga & Pilates
    { keyword: "yoga studio pilates dubai",       type: null  },
    // Specific chains
    { keyword: "GymNation dubai",                 type: null  },
    { keyword: "Hayya Sport dubai",               type: null  },
    { keyword: "Hamdan Sports Complex",           type: null  },
  ];

  const found = [];
  const seenNames = new Set();

  for (const s of searches) {
    for (const radius of [1000, 2000, 4000, 8000]) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}${s.type?"&type="+s.type:""}${s.keyword?"&keyword="+encodeURIComponent(s.keyword):""}&language=en&key=${GOOGLE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status !== "OK" || !data.results.length) { await sleep(60); break; }

        const place = data.results.find(p => {
          const n = p.name || "";
          if (n.length < 3 || n.includes("www.")) return false;
          if (seenNames.has(n.toLowerCase())) return false;
          return true;
        });

        if (!place) { await sleep(60); break; }

        // Get distance
        const distUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat},${lng}&destinations=place_id:${place.place_id}&mode=driving&key=${GOOGLE_API_KEY}`;
        const distRes = await fetch(distUrl);
        const distData = await distRes.json();
        
        if (distData.status === "OK" && distData.rows[0]?.elements[0]?.status === "OK") {
          const distKm = Math.round(distData.rows[0].elements[0].distance.value / 100) / 10;
          if (distKm >= 0) {
            seenNames.add(place.name.toLowerCase());
            found.push({
              name:    place.name,
              distKm,
              rating:  place.rating || null,
              keyword: s.keyword,
            });
          }
        }
        await sleep(60);
        break; // Found one for this search — move to next
      } catch(e) {
        await sleep(100);
        break;
      }
    }
  }

  // Sort by distance
  found.sort((a,b) => a.distKm - b.distKm);

  // Return nearest + full list
  return {
    nearest:  found[0] || null,
    allSports: found.slice(0, 10), // top 10 nearest sports facilities
    count:    found.length,
  };
}

async function run() {
  const snap = await db.collection("neighbourhoodScores").get();
  const communities = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  
  console.log("Fetching ALL sports facilities for", communities.length, "communities...");
  console.log("Searching: Gym, Padel, Tennis, Golf, Swimming, Football, Cricket, Basketball,");
  console.log("           Squash, Running Track, Martial Arts, Yoga, Sports Clubs & more\n");

  let done = 0;
  for (let i = 0; i < communities.length; i++) {
    const comm = communities[i];
    if (!comm.lat || !comm.lng) { 
      console.log(`[${i+1}/${communities.length}] ${comm.community}: no coords — skip`); 
      continue; 
    }

    try {
      const sports = await findAllSports(comm.lat, comm.lng);

      await db.collection("neighbourhoodScores").doc(comm.id).update({
        // Nearest sports facility
        nearestSports:        sports.nearest?.name   || null,
        distSports:           sports.nearest?.distKm || null,
        hasSports:            sports.nearest ? sports.nearest.distKm <= 3 : false,
        sportsFacilityRating: sports.nearest?.rating || null,
        // Full list of sports facilities
        sportsNearby:         sports.allSports.map(s => ({
          name:   s.name,
          distKm: s.distKm,
          rating: s.rating,
          type:   s.keyword,
        })),
        sportsFacilityCount:  sports.count,
        updatedAt:            new Date().toISOString(),
      });

      done++;
      console.log(`[${i+1}/${communities.length}] ${comm.community} — ${sports.count} sports facilities found`);
      if (sports.allSports.length > 0) {
        sports.allSports.slice(0, 4).forEach(s => {
          console.log(`   • ${s.name} — ${s.distKm}km${s.rating ? " ★"+s.rating : ""}`);
        });
      }
      
      await sleep(600); // Respect rate limits
    } catch(e) {
      console.log(`[${i+1}] ${comm.community}: ERROR ${e.message}`);
    }
  }

  console.log(`\n=== DONE === ${done}/${communities.length} communities updated with sports data`);
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});