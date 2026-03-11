import React from "react";
import { getDoc, doc, setDoc } from "firebase/firestore";
import { db } from "../../../services/firebase/config";
import { T } from "../../../styles/theme";

/**
 * DXBEstimateTab — Automated Valuation Model (AVM) with live Bayut comparables
 *
 * Props:
 *   avmCommunity, setAvmCommunity
 *   avmType,      setAvmType
 *   avmBeds,      setAvmBeds
 *   avmSize,      setAvmSize
 *   avmYear,      setAvmYear
 *   getInvestmentScore
 *   TabSources
 */
const DXBEstimateTab = ({
  avmCommunity, setAvmCommunity,
  avmType,      setAvmType,
  avmBeds,      setAvmBeds,
  avmSize,      setAvmSize,
  avmYear,      setAvmYear,
  getInvestmentScore,
  TabSources,
}) => {
  const avmData = {
    "Dubai Hills Estate":  { apt: { "Studio":{ ppsf:1680,rent:55 }, "1BR":{ ppsf:1820,rent:80 }, "2BR":{ ppsf:2050,rent:125 }, "3BR":{ ppsf:2300,rent:180 } }, villa: { "3BR":{ ppsf:1450,rent:180 }, "4BR":{ ppsf:1550,rent:240 }, "5BR":{ ppsf:1700,rent:320 } }, apprRate:0.18, sc:18 },
    "Dubai Creek Harbour": { apt: { "Studio":{ ppsf:1600,rent:52 }, "1BR":{ ppsf:1750,rent:78 }, "2BR":{ ppsf:1950,rent:118 }, "3BR":{ ppsf:2200,rent:170 } }, villa: null, apprRate:0.22, sc:22 },
    "Emaar Beachfront":    { apt: { "Studio":{ ppsf:2800,rent:95 }, "1BR":{ ppsf:3200,rent:140 }, "2BR":{ ppsf:3600,rent:200 }, "3BR":{ ppsf:4100,rent:290 } }, villa: null, apprRate:0.16, sc:28 },
    "Downtown Dubai":      { apt: { "Studio":{ ppsf:2600,rent:90 }, "1BR":{ ppsf:2900,rent:135 }, "2BR":{ ppsf:3200,rent:190 }, "3BR":{ ppsf:3800,rent:270 } }, villa: null, apprRate:0.12, sc:32 },
    "Arabian Ranches III": { apt: null, villa: { "3BR":{ ppsf:1350,rent:155 }, "4BR":{ ppsf:1450,rent:200 }, "5BR":{ ppsf:1600,rent:260 } }, apprRate:0.15, sc:14 },
    "The Valley":          { apt: null, villa: { "3BR":{ ppsf:1200,rent:140 }, "4BR":{ ppsf:1300,rent:185 }, "5BR":{ ppsf:1450,rent:240 } }, apprRate:0.22, sc:12 },
    "The Oasis":           { apt: null, villa: { "4BR":{ ppsf:2200,rent:260 }, "5BR":{ ppsf:2600,rent:340 }, "6BR":{ ppsf:3200,rent:450 } }, apprRate:0.25, sc:20 },
  };

  const communities     = Object.keys(avmData);
  const communityInfo   = avmData[avmCommunity];
  const typeMap         = avmType === "Apartment" ? communityInfo?.apt : communityInfo?.villa;
  const beds            = typeMap ? Object.keys(typeMap) : [];
  const activeBeds      = beds.includes(avmBeds) ? avmBeds : (beds[0] || "1BR");
  const unitData        = typeMap?.[activeBeds] || { ppsf:2000, rent:100 };

  const currentPpsf   = unitData.ppsf;
  const currentValue  = currentPpsf * avmSize;
  const currentYear   = 2026;
  const yearsHeld     = Math.max(0, currentYear - avmYear);
  const apprRate      = communityInfo?.apprRate || 0.15;
  const purchaseValue = currentValue / Math.pow(1 + apprRate, yearsHeld);
  const capitalGain   = currentValue - purchaseValue;
  const capGainPct    = yearsHeld > 0 ? ((capitalGain / purchaseValue) * 100).toFixed(1) : "0";
  const annualRent    = unitData.rent * 1000;
  const grossYield    = ((annualRent / currentValue) * 100).toFixed(1);
  const sc            = (communityInfo?.sc || 18) * avmSize;
  const mgmt          = annualRent * 0.09;
  const netRent       = annualRent - sc - mgmt;
  const netYield      = ((netRent / currentValue) * 100).toFixed(1);
  const monthlyRent   = Math.round(annualRent / 12);
  const confidence    = currentValue > 5000000 ? "Moderate" : currentValue > 2000000 ? "High" : "Very High";
  const confColor     = confidence === "Very High" ? "#10B981" : confidence === "High" ? T.gold : "#F59E0B";
  const invScore      = getInvestmentScore({ price:currentValue, ppsf:currentPpsf, gross:parseFloat(grossYield), handover:null, paymentPlan:"80/20" });

  /* ── Bayut live listings sub-component ── */
  const BayutListings = ({ community, propType, beds: bedsArg }) => {
    const [bayutListings, setBayutListings] = React.useState(null);
    const [bayutLoading, setBayutLoading]   = React.useState(false);
    const [bayutError, setBayutError]       = React.useState(false);

    const fetchBayutListings = async () => {
      setBayutLoading(true); setBayutError(false);
      try {
        const cacheKey  = "bayut2_" + community.replace(/ /g,"_").toLowerCase() + "_" + propType + "_" + bedsArg;
        try {
          const cacheRef  = doc(db, "bayutCache", cacheKey);
          const cacheSnap = await getDoc(cacheRef);
          if (cacheSnap.exists() && cacheSnap.data().fetchedAt > Date.now() - 86400000) {
            setBayutListings(cacheSnap.data().listings);
            setBayutLoading(false);
            return;
          }
        } catch(cacheErr) {}
        const bedsParam = bedsArg === "Studio" ? "0" : bedsArg.replace("BR","");
        const url = `https://unofficial-bayut-api.p.rapidapi.com/search?locationExternalIDs=5002&purpose=for-sale&categoryExternalID=${propType==="Apartment"?"4":"16"}&lang=en&sort=price-asc&page=0&hitsPerPage=6&rooms=${bedsParam}`;
        const res  = await fetch(url, {
          method:"GET",
          headers: {
            "x-rapidapi-key": "420de140camsh35f3baf70380d11p1e0c92jsn00005ba30591",
            "x-rapidapi-host":"unofficial-bayut-api.p.rapidapi.com"
          }
        });
        const data = await res.json();
        const rawListings = data?.hits || data?.properties || data?.results || data?.data || [];
        const listings = rawListings.slice(0,6).map(h => ({
          id:    h.externalID || h.id || Math.random(),
          price: h.price,
          area:  h.area || h.size,
          ppsf:  (h.area||h.size) > 0 ? Math.round(h.price / (h.area||h.size)) : 0,
          beds:  h.rooms || h.bedrooms,
          baths: h.baths || h.bathrooms,
          location: h.location?.[2]?.name || h.location?.[1]?.name || community,
          url:   `https://www.bayut.com/property/details-${h.externalID||h.id}.html`,
        }));
        if (listings.length === 0) {
          setBayutListings([{ id:"debug", _debug: JSON.stringify(Object.keys(data)) + " | " + JSON.stringify(data).slice(0,200) }]);
          setBayutLoading(false); return;
        }
        setBayutListings(listings);
        try { await setDoc(doc(db, "bayutCache", cacheKey), { listings, fetchedAt:Date.now() }); } catch(e) {}
      } catch(e) { setBayutError(true); }
      setBayutLoading(false);
    };

    return (
      <div style={{ background:"rgba(59,130,246,0.04)", border:"1px solid rgba(59,130,246,0.15)", borderRadius:14, padding:20, marginTop:4 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#60A5FA" }}>🏠 Live Bayut Listings</div>
            <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>Real market comparables · {community} · {propType}</div>
          </div>
          <button type="button" onClick={fetchBayutListings} disabled={bayutLoading}
            style={{ padding:"6px 14px", borderRadius:8, background:bayutLoading?T.surfaceAlt:"rgba(59,130,246,0.15)", border:"1px solid rgba(59,130,246,0.3)", color:bayutLoading?T.textMuted:"#60A5FA", fontSize:11, fontWeight:600, cursor:bayutLoading?"not-allowed":"pointer", fontFamily:"'Outfit',sans-serif" }}>
            {bayutLoading ? "Loading..." : bayutListings ? "Refresh" : "Load Live Listings"}
          </button>
        </div>
        {bayutError && <div style={{ fontSize:12, color:T.textMuted, textAlign:"center", padding:20 }}>Could not load listings. Try again.</div>}
        {bayutListings && bayutListings.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
            {bayutListings.map(l => (
              l._debug ? (
                <div key="debug" style={{ gridColumn:"1/-1", fontSize:11, color:T.textMuted, background:T.surfaceAlt, padding:12, borderRadius:8, wordBreak:"break-all" }}>
                  🔍 Debug: {l._debug}
                </div>
              ) : (
                <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                  style={{ textDecoration:"none", background:T.surface, borderRadius:10, padding:"12px 14px", border:"1px solid "+T.border, display:"block" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="#60A5FA"}
                  onMouseLeave={e => e.currentTarget.style.borderColor=T.border}>
                  <div style={{ fontSize:11, color:T.textMuted, marginBottom:4, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{l.location}</div>
                  <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:T.gold }}>AED {(l.price/1e6).toFixed(2)}M</div>
                  <div style={{ fontSize:10, color:"#60A5FA", marginTop:2 }}>AED {l.ppsf?.toLocaleString()} /sqft</div>
                  <div style={{ fontSize:10, color:T.textMuted, marginTop:4 }}>{l.beds} bed · {l.baths} bath · {Math.round(l.area).toLocaleString()} sqft</div>
                </a>
              )
            ))}
          </div>
        )}
        {!bayutListings && !bayutLoading && !bayutError && (
          <div style={{ fontSize:12, color:T.textMuted, textAlign:"center", padding:"16px 0" }}>Click "Load Live Listings" to fetch real Bayut comparables.</div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Header */}
      <div style={{ background:T.surface, borderRadius:14, border:"1px solid rgba(212,168,67,0.3)", padding:"20px 24px" }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.gold }}>DXB Estimate</div>
        <div style={{ fontSize:12, color:T.textMuted, marginTop:4 }}>Automated Valuation Model · Emaar Portfolio · DLD-calibrated pricing</div>
      </div>

      {/* Inputs */}
      <div style={{ background:T.surface, borderRadius:14, border:"1px solid "+T.border, padding:"20px 24px" }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:T.white, marginBottom:14 }}>Property Details</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:14 }}>
          {/* Community */}
          <div>
            <div style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", marginBottom:6, fontWeight:700, letterSpacing:0.8 }}>Community</div>
            <select value={avmCommunity} onChange={e => setAvmCommunity(e.target.value)} style={{ width:"100%", padding:"9px 12px", background:T.surfaceAlt, border:"1px solid "+T.border, borderRadius:8, color:T.white, fontSize:12, fontFamily:"'Outfit',sans-serif", cursor:"pointer" }}>
              {communities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {/* Type */}
          <div>
            <div style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", marginBottom:6, fontWeight:700, letterSpacing:0.8 }}>Type</div>
            <select value={avmType} onChange={e => { setAvmType(e.target.value); setAvmBeds(""); }} style={{ width:"100%", padding:"9px 12px", background:T.surfaceAlt, border:"1px solid "+T.border, borderRadius:8, color:T.white, fontSize:12, fontFamily:"'Outfit',sans-serif", cursor:"pointer" }}>
              {communityInfo?.apt   && <option value="Apartment">Apartment</option>}
              {communityInfo?.villa && <option value="Villa / Townhouse">Villa / Townhouse</option>}
            </select>
          </div>
          {/* Bedrooms */}
          <div>
            <div style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", marginBottom:6, fontWeight:700, letterSpacing:0.8 }}>Bedrooms</div>
            <select value={activeBeds} onChange={e => setAvmBeds(e.target.value)} style={{ width:"100%", padding:"9px 12px", background:T.surfaceAlt, border:"1px solid "+T.border, borderRadius:8, color:T.white, fontSize:12, fontFamily:"'Outfit',sans-serif", cursor:"pointer" }}>
              {beds.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          {/* Size */}
          <div>
            <div style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", marginBottom:6, fontWeight:700, letterSpacing:0.8 }}>Size (sqft)</div>
            <input type="number" value={avmSize} onChange={e => setAvmSize(Math.max(200, parseInt(e.target.value)||750))} style={{ width:"100%", padding:"9px 12px", background:T.surfaceAlt, border:"1px solid "+T.border, borderRadius:8, color:T.white, fontSize:12, fontFamily:"'Outfit',sans-serif", boxSizing:"border-box" }} />
          </div>
          {/* Purchase Year */}
          <div>
            <div style={{ fontSize:10, color:T.textMuted, textTransform:"uppercase", marginBottom:6, fontWeight:700, letterSpacing:0.8 }}>Purchase Year</div>
            <select value={avmYear} onChange={e => setAvmYear(parseInt(e.target.value))} style={{ width:"100%", padding:"9px 12px", background:T.surfaceAlt, border:"1px solid "+T.border, borderRadius:8, color:T.white, fontSize:12, fontFamily:"'Outfit',sans-serif", cursor:"pointer" }}>
              {[2019,2020,2021,2022,2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Estimate result */}
      <div style={{ background:T.surface, borderRadius:14, border:"1px solid rgba(212,168,67,0.4)", overflow:"hidden" }}>
        <div style={{ background:"linear-gradient(135deg,rgba(212,168,67,0.12),rgba(212,168,67,0.04))", padding:"20px 24px", borderBottom:"1px solid rgba(212,168,67,0.2)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
            <div>
              <div style={{ fontSize:11, color:T.textMuted, textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Estimated Current Value</div>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:36, fontWeight:900, color:T.gold }}>AED {(currentValue/1e6).toFixed(3)}M</div>
              <div style={{ fontSize:12, color:T.textMuted, marginTop:4 }}>AED {currentPpsf.toLocaleString()} /sqft · {avmSize.toLocaleString()} sqft · {avmCommunity}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>CONFIDENCE</div>
              <div style={{ fontSize:14, fontWeight:700, color:confColor, padding:"4px 12px", borderRadius:8, background:confColor+"15" }}>{confidence}</div>
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:11, fontWeight:800, color:invScore.color, padding:"4px 10px", borderRadius:7, background:invScore.color+"15" }}>{invScore.score}/10 ★ {invScore.label}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding:"20px 24px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:12, marginBottom:20 }}>
            {[
              { l:"Price/sqft",     v:"AED " + currentPpsf.toLocaleString(),          c:T.white },
              { l:"Gross Yield",    v:grossYield + "%",                                c:T.gold },
              { l:"Net Yield",      v:netYield + "%",                                  c:"#10B981" },
              { l:"Annual Rent",    v:"AED " + (annualRent/1000).toFixed(0) + "K",    c:"#3B82F6" },
              { l:"Monthly Rent",   v:"AED " + monthlyRent.toLocaleString(),           c:"#3B82F6" },
              { l:"Net Cash Flow",  v:"AED " + (netRent/1000).toFixed(0) + "K/yr",    c:"#8B5CF6" },
            ].map(k => (
              <div key={k.l} style={{ background:T.surfaceAlt, borderRadius:10, padding:"12px 14px", border:"1px solid "+T.border }}>
                <div style={{ fontSize:9, color:T.textMuted, textTransform:"uppercase", marginBottom:5 }}>{k.l}</div>
                <div style={{ fontSize:14, fontWeight:800, color:k.c, fontFamily:"'Fraunces',serif" }}>{k.v}</div>
              </div>
            ))}
          </div>

          {yearsHeld > 0 && (
            <div style={{ background:"rgba(16,185,129,0.06)", borderRadius:12, border:"1px solid rgba(16,185,129,0.2)", padding:"16px 18px" }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:700, color:"#10B981", marginBottom:10 }}>📈 Since {avmYear} — Capital Appreciation</div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10 }}>
                {[
                  { l:"Purchase Price",     v:"AED " + (purchaseValue/1e6).toFixed(3) + "M" },
                  { l:"Current Value",      v:"AED " + (currentValue/1e6).toFixed(3) + "M" },
                  { l:"Capital Gain",       v:"+AED " + (capitalGain/1000).toFixed(0) + "K" },
                  { l:"Total Appreciation", v:"+" + capGainPct + "%" },
                ].map(k => (
                  <div key={k.l} style={{ background:T.surfaceAlt, borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ fontSize:9, color:T.textMuted, marginBottom:4 }}>{k.l}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#10B981" }}>{k.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop:14, padding:"10px 14px", borderRadius:8, background:T.surfaceAlt, fontSize:11, color:T.textMuted, lineHeight:1.7 }}>
            ⚠️ DXB Estimate is an automated model using DLD transaction data, Emaar price lists, and rental index. Estimates may vary ±15% from actual market prices. Always verify with a registered valuer before transacting.
          </div>
        </div>
      </div>

      {/* Live Bayut comparables */}
      <BayutListings community={avmCommunity} propType={avmType} beds={avmBeds} />

      <TabSources sources={[
        { label:"DLD Transactions FY2025",          url:"https://dubailand.gov.ae" },
        { label:"REIDIN Price Index",               url:"https://reidin.com" },
        { label:"Property Monitor" },
        { label:"ValuStrat Dubai Residential" },
        { label:"Bayut Live Listings (RapidAPI)",   url:"https://www.bayut.com" },
      ]} />
    </div>
  );
};

export default DXBEstimateTab;
