/* eslint-disable */
/* MARKETING TAB — AI marketing copy generator + listing templates */

import React from "react";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";

function MarketingTab({
  deals, listings,
  mktView, setMktView,
  mktPropType, setMktPropType,
  mktBudget, setMktBudget,
  mktNationality, setMktNationality,
  mktListingType, setMktListingType,
  mktListingPrice, setMktListingPrice,
  mktListingBeds, setMktListingBeds,
  mktListingFeatures, setMktListingFeatures,
  mktListingComm, setMktListingComm,
  mktAiLoading, setMktAiLoading,
  mktAiResult, setMktAiResult,
}) {


            /* ══════════════════════════════════════════════════════════
               MARKETING INTELLIGENCE — Research Sources (Apr 2026)

               CPL BENCHMARKS (theprimeads.com + Dubai-specific research):
                 Google Search Ads: AED 450–900 per lead (high intent)
                 Meta (Facebook/Instagram): AED 30–300 per lead
                 Property Portal (Bayut/PF): AED 50–200 per lead
                 TikTok: AED 20–150 per lead (growing fast)
                 LinkedIn: AED 200–800 per lead (B2B, HNW)
                 Cold calling: AED 5–15 (time cost)
                 Off-plan specific: AED 30–120 per qualified lead
                 WhatsApp broadcast: AED 1–10 per message

               PORTAL COMPARISON (brightsanddesigns.com Nov 2025):
                 Property Finder: AED 60K spend → 120 leads/mo, 5% conversion
                   = 6 sales. Best for luxury/premium.
                 Bayut: AED 45K spend → 180 leads/mo, 2% conversion
                   = 3-4 sales. Best for mid-market volume.
                 Dubizzle: Budget segment, rentals, lower CPL

               BUYER NATIONALITY DATA (DLD 2025, keltandcorealty.com):
                 1. India — 22% of foreign buyers (4th consecutive year #1)
                    Platform: Meta (Facebook/Instagram), WhatsApp, Google
                    Budget: AED 500K–3M, strong off-plan demand
                 2. UK — 17% of foreign buyers (12% of all transactions 2024)
                    Platform: Property Finder, Google, Instagram
                    Budget: AED 1.5M–5M+, ready premium preferred
                 3. Russia — 9% of transactions
                    Platform: Instagram, Telegram, targeted in-person
                    Budget: AED 2M–15M, luxury focus
                 4. China — 13-14% of transactions (AED 2B invested 2024)
                    Platform: Douyin (TikTok), WeChat, Weibo
                    Budget: AED 1.5M–5M+, Business Bay/Creek Harbour
                 5. France — 7% of transactions
                    Platform: Meta, LinkedIn, francophones
                    Budget: AED 1.5M–3M, branded residences
                 6. Italy — Top 3 European buyer
                    Platform: Meta, Instagram, luxury focus
                 7. Pakistan — AED 11B total ownership in Dubai
                    Platform: WhatsApp, Facebook, off-plan focus
                 8. Saudi Arabia — Holiday homes, Palm/Emaar Beachfront
                    Platform: Snapchat, Meta, Arabic targeting
                 9. Egypt — Fast growing
                    Platform: Facebook, TikTok Arabic
                10. Germany/Austria — Growing segment, ESG-focused
                    Platform: Google, LinkedIn

               COMMISSION RATES (Dubai standard):
                 Primary market (off-plan): 3-5% paid by developer
                 Secondary market: 2% from buyer (split with co-agent)
                 AED 2M deal: AED 40K-60K commission (2-3%)
                 AED 5M deal: AED 100K-150K commission
                 AED 10M deal: AED 200K-300K commission

               SOCIAL MEDIA (campaignme.com + ninjasofts.com):
                 Instagram/Reels: Best for luxury virtual tours, lifestyle
                 TikTok: Growing fast, younger buyers + Chinese via Douyin
                 LinkedIn: HNW investors, C-suite relocation, B2B
                 Snapchat: GCC nationals (Saudi, Kuwait, UAE)
                 YouTube: Long-form property tours, SEO value

               RERA COMPLIANCE: Trakheesi permit required for all listings
               Sources: theprimeads.com, brightsanddesigns.com Nov 2025,
               DLD 2025 nationality data, campaignme.com, keltandcorealty.com
            ══════════════════════════════════════════════════════════ */

            /* ── Channel data ── */
            const CHANNELS = [
              {
                name:"Google Search Ads", icon:"G",
                color:"#4285F4",
                cplMin:450,  cplMax:900,  cplAvg:650,
                convRate:3.5, leadQuality:95,
                bestFor:"High-intent buyers actively searching",
                offPlan:false, luxury:true, midMarket:true, affordable:false,
                setup:"AED 5,000+ per campaign",
                monthlyMin:5000,
                tip:"Target keywords like 'buy apartment Dubai Marina' — CPC AED 8-25. Add negative keywords weekly. Separate campaigns by community.",
                platforms:["Google Search","Google Display","YouTube"],
              },
              {
                name:"Meta (Facebook/Instagram)", icon:"M",
                color:"#1877F2",
                cplMin:30,   cplMax:300,  cplAvg:120,
                convRate:2.0, leadQuality:65,
                bestFor:"Volume lead generation, off-plan launches",
                offPlan:true, luxury:false, midMarket:true, affordable:true,
                setup:"AED 3,000+ per month minimum",
                monthlyMin:3000,
                tip:"Use Lead Ads (native forms) for off-plan. Carousel format for multi-unit projects. Retarget website visitors — 3-5x better ROAS.",
                platforms:["Facebook","Instagram","WhatsApp","Messenger"],
              },
              {
                name:"Bayut", icon:"B",
                color:"#D4A843",
                cplMin:50,   cplMax:200,  cplAvg:110,
                convRate:2.5, leadQuality:72,
                bestFor:"Mid-market volume, local expat buyers",
                offPlan:true, luxury:false, midMarket:true, affordable:true,
                setup:"Package from AED 2,000-15,000/month",
                monthlyMin:2000,
                tip:"TruCheck™ badge increases leads 45%. Bundle with Dubizzle for cross-platform reach. Best for JVC, Business Bay, Dubai South.",
                platforms:["Bayut.com","Dubizzle (bundled)","Bayut App"],
              },
              {
                name:"Property Finder", icon:"P",
                color:"#EF4444",
                cplMin:80,   cplMax:250,  cplAvg:165,
                convRate:5.0, leadQuality:88,
                bestFor:"International investors, premium buyers",
                offPlan:true, luxury:true, midMarket:true, affordable:false,
                setup:"Package from AED 3,000-25,000/month",
                monthlyMin:3000,
                tip:"SuperAgent badge drives 3x more leads. International buyers search here first. Best ROI for AED 2M+ properties. Premium listing at peak hours.",
                platforms:["PropertyFinder.ae","PF App","International traffic"],
              },
              {
                name:"TikTok", icon:"T",
                color:"#000000",
                cplMin:20,   cplMax:150,  cplAvg:65,
                convRate:1.5, leadQuality:55,
                bestFor:"Younger buyers, off-plan launches, brand awareness",
                offPlan:true, luxury:false, midMarket:true, affordable:true,
                setup:"AED 2,000+ per month",
                monthlyMin:2000,
                tip:"Trending audio = 3x more reach. Property tour Reels under 30 seconds. Chinese buyers via Douyin (TikTok China). 500+ inquiries/month possible with viral content.",
                platforms:["TikTok","Douyin (China)"],
              },
              {
                name:"LinkedIn Ads", icon:"L",
                color:"#0A66C2",
                cplMin:200,  cplMax:800,  cplAvg:450,
                convRate:4.0, leadQuality:92,
                bestFor:"HNW investors, C-suite relocation, B2B developers",
                offPlan:false, luxury:true, midMarket:false, affordable:false,
                setup:"AED 5,000+ per month",
                monthlyMin:5000,
                tip:"Target by job title (C-Suite, Director), company size, industry. Message InMail converts 3x better than sponsored posts. Best for AED 5M+ properties.",
                platforms:["LinkedIn","LinkedIn InMail"],
              },
              {
                name:"WhatsApp Broadcast", icon:"W",
                color:"#25D366",
                cplMin:1,    cplMax:10,   cplAvg:5,
                convRate:8.0, leadQuality:85,
                bestFor:"Existing database, referrals, payment plan follow-up",
                offPlan:true, luxury:false, midMarket:true, affordable:true,
                setup:"WhatsApp Business API — AED 500-2,000 setup",
                monthlyMin:500,
                tip:"Highest conversion rate of any channel. Response time under 5 minutes = 100x more likely to convert. Use templates for off-plan launches. Arabic + English.",
                platforms:["WhatsApp Business","WhatsApp API"],
              },
              {
                name:"Snapchat Ads", icon:"S",
                color:"#FFFC00",
                cplMin:25,   cplMax:120,  cplAvg:60,
                convRate:1.8, leadQuality:58,
                bestFor:"GCC nationals (Saudi, Kuwait, UAE), younger Arabs",
                offPlan:true, luxury:false, midMarket:true, affordable:true,
                setup:"AED 2,000+ per month",
                monthlyMin:2000,
                tip:"40% of UAE uses Snapchat. Arabic ads perform 2x better than English for GCC audience. Best for off-plan launches targeting Saudi/GCC buyers.",
                platforms:["Snapchat","Snap Map"],
              },
            ];

            /* ── Nationality targeting data ── */
            const NATIONALITIES = [
              {
                flag:"\uD83C\uDDEE\uD83C\uDDF3", name:"Indian", share:"22%", rank:1,
                budget:"AED 500K–3M", type:"Off-plan + Mid-market",
                platforms:["Meta (Facebook/Instagram)","WhatsApp","Google"],
                communities:["JVC","Dubai South","International City","Business Bay"],
                language:"English + Hindi",
                tip:"Largest buyer group 4 consecutive years. Strong off-plan demand. WhatsApp is primary communication channel. Flexible payment plans are key decision driver.",
                color:"#FF9800",
              },
              {
                flag:"\uD83C\uDDEC\uD83C\uDDE7", name:"British", share:"17%", rank:2,
                budget:"AED 1.5M–5M+", type:"Ready premium",
                platforms:["Property Finder","Google","Instagram"],
                communities:["Dubai Marina","Downtown","Palm Jumeirah","Dubai Hills"],
                language:"English",
                tip:"Post-Brexit migration accelerating. Target Google UK searches: 'buy property Dubai'. Property Finder highest traffic from UK. Ready homes preferred over off-plan.",
                color:"#1565C0",
              },
              {
                flag:"\uD83C\uDDF7\uD83C\uDDFA", name:"Russian", share:"9%", rank:3,
                budget:"AED 2M–15M+", type:"Luxury/Ultra-luxury",
                platforms:["Instagram","Telegram","In-person events"],
                communities:["Palm Jumeirah","Emirates Hills","Downtown","Business Bay"],
                language:"Russian",
                tip:"Highest avg ticket size. Prefer branded residences. Telegram groups very active. In-person events in Dubai remain strongest channel. Russian-speaking agents critical.",
                color:"#C62828",
              },
              {
                flag:"\uD83C\uDDE8\uD83C\uDDF3", name:"Chinese", share:"13-14%", rank:4,
                budget:"AED 1.5M–5M+", type:"Luxury + Business Bay",
                platforms:["Douyin (TikTok China)","WeChat","Weibo"],
                communities:["Business Bay","Dubai Creek Harbour","Downtown","JVC"],
                language:"Mandarin",
                tip:"80% of China's top 200 developers on Douyin. WeChat property groups extremely active. AED 2B invested in 2024. Mandarin-speaking agent is essential — not optional.",
                color:"#E53935",
              },
              {
                flag:"\uD83C\uDDEB\uD83C\uDDF7", name:"French", share:"7%", rank:5,
                budget:"AED 1.5M–3M", type:"Branded residences",
                platforms:["Meta","LinkedIn","SmartLeads CRM"],
                communities:["Downtown","Dubai Marina","Bluewaters","City Walk"],
                language:"French",
                tip:"5th largest investor group. French, Belgian, Swiss combined = significant European segment. Armani, Bulgari branded residences popular. SmartLeads has French CRM specifically.",
                color:"#1565C0",
              },
              {
                flag:"\uD83C\uDDF5\uD83C\uDDF0", name:"Pakistani", share:"8%", rank:6,
                budget:"AED 300K–2M", type:"Off-plan + Affordable",
                platforms:["WhatsApp","Facebook","Off-plan events"],
                communities:["International City","JVC","Dubai South","Al Furjan"],
                language:"Urdu + English",
                tip:"AED 11B total ownership in Dubai. Strong community networks on WhatsApp. Off-plan at AED 500K–1.5M is sweet spot. Sharjah spillover to Dubai common.",
                color:"#1B5E20",
              },
              {
                flag:"\uD83C\uDDF8\uD83C\uDDE6", name:"Saudi", share:"5%", rank:7,
                budget:"AED 3M–20M+", type:"Holiday homes + Villas",
                platforms:["Snapchat","Meta","Arabic Google"],
                communities:["Palm Jumeirah","Emaar Beachfront","Dubai Hills","JBR"],
                language:"Arabic",
                tip:"Holiday home and villa dominant. Snapchat #1 for Saudi audience. Privacy key — gated communities preferred. Weekend visits from KSA = high conversion for ready homes.",
                color:"#1B5E20",
              },
              {
                flag:"\uD83C\uDDEA\uD83C\uDDEC", name:"Egyptian", share:"4%", rank:8,
                budget:"AED 500K–2M", type:"Mid-market + Off-plan",
                platforms:["Facebook","TikTok Arabic","WhatsApp"],
                communities:["JVC","Business Bay","Dubai South","Silicon Oasis"],
                language:"Arabic + English",
                tip:"Fast-growing segment. Facebook most dominant for Egyptian buyers. Off-plan with payment plans preferred. Strong community referral networks in Dubai.",
                color:"#F57F17",
              },
            ];

            const selNat = NATIONALITIES.find(n => n.name === mktNationality) || NATIONALITIES[0];

            /* ── ROI Calculator ── */
            const budgetPerChannel = mktBudget;
            const bestChannel = CHANNELS.reduce((a,b) => a.cplAvg < b.cplAvg ? a : b);
            const calcROI = (ch) => {
              const leads = Math.round(budgetPerChannel / ch.cplAvg);
              const deals = Math.round(leads * ch.convRate / 100);
              const commission = deals * 60000; // AED 60K avg commission
              const roi = budgetPerChannel > 0 ? ((commission - budgetPerChannel) / budgetPerChannel * 100) : 0;
              return { leads, deals, commission, roi: roi.toFixed(0) };
            };

            /* ── AI Listing Generator ── */
            const generateListing = async () => {
              if (!mktListingComm) return;
              setMktAiLoading(true);
              setMktAiResult("");
              try {
                const res = await fetch("/api/proxy?service=claude", {
                  method:"POST",
                  headers:{ "Content-Type":"application/json" },
                  body: JSON.stringify({
                    model:"claude-sonnet-4-20250514",
                    max_tokens:1000,
                    messages:[{
                      role:"user",
                      content:`You are a Dubai real estate listing specialist. Write a professional, SEO-optimized property listing description for Bayut and Property Finder.\n\nProperty details:\n- Community: ${mktListingComm}\n- Type: ${mktListingType}\n- Bedrooms: ${mktListingBeds}BR\n- Price: AED ${(mktListingPrice/1000000).toFixed(2)}M\n- Key features: ${mktListingFeatures || "Modern finishes, built-in wardrobes, balcony"}\n\nWrite:\n1. HEADLINE (max 10 words, compelling)\n2. DESCRIPTION (150-200 words, include ROI angle, Golden Visa eligibility if AED 2M+, community highlights, payment terms)\n3. WHATSAPP MESSAGE (50 words max, casual, with call to action)\n4. KEY SEARCH TAGS (10 tags for portal SEO)\n\nFormat clearly with these 4 sections labeled. Be specific to Dubai market. Include yield % if relevant. No generic phrases.`
                    }]
                  })
                });
                const data = await res.json();
                const text = data.content?.[0]?.text || "Error generating listing";
                setMktAiResult(text);
              } catch(e) {
                setMktAiResult("Error: " + e.message);
              }
              setMktAiLoading(false);
            };

            const selSt = {
              background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8,
              color:T.white, fontFamily:"'Outfit',sans-serif", fontSize:12,
              padding:"7px 28px 7px 10px", outline:"none", cursor:"pointer",
              appearance:"none", WebkitAppearance:"none",
              backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
              backgroundRepeat:"no-repeat", backgroundPosition:"right 8px center",
            };

            return (
              <div style={{ animation:"fadeUp 0.4s ease-out forwards" }}>

                {/* ── HEADER ── */}
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"10px 0", marginBottom:16, borderBottom:`1px solid ${T.border}`, flexWrap:"wrap", gap:10 }}>
                  <div>
                    <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>Marketing Intelligence</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>
                      8 channels · CPL benchmarks · Buyer nationality targeting · AI listing generator · ROI calculator · Apr 2026
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    {["channels","nationality","roi","listing"].map(v=>(
                      <button key={v} type="button" onClick={()=>setMktView(v)}
                        style={{ padding:"6px 14px", background:mktView===v?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${mktView===v?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:mktView===v?T.gold:T.textMuted, fontSize:11, fontWeight:mktView===v?700:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        {v==="channels"?"Channel Intel":v==="nationality"?"Buyer Targeting":v==="roi"?"ROI Calculator":"AI Listing"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ══ CHANNEL INTELLIGENCE VIEW ══ */}
                {mktView === "channels" && (
                  <>
                    {/* Property type filter */}
                    <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
                      <span style={{ fontSize:11, color:T.textMuted }}>Filter by segment:</span>
                      {[{k:"all",l:"All"},{k:"luxury",l:"Luxury (AED 3M+)"},{k:"midMarket",l:"Mid-Market"},{k:"affordable",l:"Affordable"},{k:"offPlan",l:"Off-Plan"}].map(f=>(
                        <button key={f.k} type="button" onClick={()=>setMktPropType(f.k)}
                          style={{ padding:"5px 12px", background:mktPropType===f.k?"rgba(212,168,67,0.15)":T.surfaceAlt, border:`1px solid ${mktPropType===f.k?"rgba(212,168,67,0.4)":T.border}`, borderRadius:8, color:mktPropType===f.k?T.gold:T.textMuted, fontSize:11, fontWeight:mktPropType===f.k?600:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                          {f.l}
                        </button>
                      ))}
                    </div>

                    {/* Channel cards */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12, marginBottom:16 }}>
                      {CHANNELS.filter(ch => mktPropType === "all" || ch[mktPropType]).map((ch,i)=>{
                        const { leads, deals, commission, roi } = calcROI(ch);
                        return (
                          <div key={i} className="chart-box" style={{ padding:18, borderLeft:`3px solid ${ch.color}` }}>
                            {/* Header */}
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                <div style={{ width:28, height:28, borderRadius:6, background:ch.color+"22", border:`1px solid ${ch.color}44`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, color:ch.color }}>
                                  {ch.icon}
                                </div>
                                <div style={{ fontSize:13, fontWeight:700, color:T.white }}>{ch.name}</div>
                              </div>
                              <div style={{ textAlign:"right" }}>
                                <div style={{ fontSize:9, color:T.textMuted }}>Lead quality</div>
                                <div style={{ fontSize:12, fontWeight:700, color:ch.leadQuality>=85?T.green:ch.leadQuality>=70?T.gold:"#F97316" }}>{ch.leadQuality}%</div>
                              </div>
                            </div>

                            {/* CPL range */}
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12, padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                              {[
                                { label:"Min CPL",  val:`AED ${ch.cplMin}`,  color:T.green },
                                { label:"Avg CPL",  val:`AED ${ch.cplAvg}`,  color:T.gold },
                                { label:"Max CPL",  val:`AED ${ch.cplMax}`,  color:"#F97316" },
                              ].map((c,j)=>(
                                <div key={j} style={{ textAlign:"center" }}>
                                  <div style={{ fontSize:9, color:T.textMuted, marginBottom:2 }}>{c.label}</div>
                                  <div style={{ fontSize:12, fontWeight:700, color:c.color }}>{c.val}</div>
                                </div>
                              ))}
                            </div>

                            {/* Best for */}
                            <div style={{ fontSize:11, color:T.textSecondary, marginBottom:8, lineHeight:1.6 }}>
                              <span style={{ color:T.textMuted }}>Best for: </span>{ch.bestFor}
                            </div>

                            {/* ROI at current budget */}
                            <div style={{ padding:"8px 10px", background:T.surfaceAlt, borderRadius:8, marginBottom:8 }}>
                              <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>At AED {mktBudget.toLocaleString()} budget/month</div>
                              <div style={{ display:"flex", gap:10, justifyContent:"space-between" }}>
                                <div><div style={{ fontSize:9, color:T.textMuted }}>Leads</div><div style={{ fontSize:13, fontWeight:700, color:T.white }}>{leads}</div></div>
                                <div><div style={{ fontSize:9, color:T.textMuted }}>Deals</div><div style={{ fontSize:13, fontWeight:700, color:T.green }}>{deals}</div></div>
                                <div><div style={{ fontSize:9, color:T.textMuted }}>Commission</div><div style={{ fontSize:12, fontWeight:700, color:T.gold }}>AED {(commission/1000).toFixed(0)}K</div></div>
                                <div><div style={{ fontSize:9, color:T.textMuted }}>ROI</div><div style={{ fontSize:13, fontWeight:700, color:Number(roi)>0?T.green:T.red }}>{roi}%</div></div>
                              </div>
                            </div>

                            {/* Tip */}
                            <div style={{ fontSize:11, color:T.textMuted, lineHeight:1.6, fontStyle:"italic" }}>
                              \uD83D\uDCA1 {ch.tip}
                            </div>

                            {/* Platforms */}
                            <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginTop:8 }}>
                              {ch.platforms.map((p,pi)=>(
                                <span key={pi} style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:ch.color+"15", color:ch.color }}>{p}</span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Budget slider */}
                    <div className="chart-box" style={{ padding:18, marginBottom:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:T.white }}>Monthly Marketing Budget</span>
                        <span style={{ fontSize:14, fontWeight:800, color:T.gold }}>AED {mktBudget.toLocaleString()}</span>
                      </div>
                      <input type="range" min={1000} max={100000} step={1000} value={mktBudget}
                        onChange={e=>setMktBudget(Number(e.target.value))}
                        style={{ width:"100%", accentColor:T.gold, cursor:"pointer" }} />
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.textMuted, marginTop:2 }}>
                        <span>AED 1K (solo agent)</span><span>AED 25K (team)</span><span>AED 100K (agency)</span>
                      </div>
                    </div>
                  </>
                )}

                {/* ══ BUYER NATIONALITY TARGETING VIEW ══ */}
                {mktView === "nationality" && (
                  <>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Buyer Nationality Intelligence</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Top 8 investor nationalities · Platform strategy per nationality · DLD 2025 data</div>

                    {/* Nationality selector */}
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
                      {NATIONALITIES.map(n=>(
                        <button key={n.name} type="button" onClick={()=>setMktNationality(n.name)}
                          style={{ padding:"7px 14px", background:mktNationality===n.name?n.color+"22":T.surfaceAlt, border:`1px solid ${mktNationality===n.name?n.color:T.border}`, borderRadius:20, cursor:"pointer", fontFamily:"'Outfit',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ fontSize:14 }}>{n.flag}</span>
                          <span style={{ fontSize:12, fontWeight:mktNationality===n.name?700:400, color:mktNationality===n.name?n.color:T.textMuted }}>{n.name}</span>
                          <span style={{ fontSize:10, color:T.textMuted }}>{n.share}</span>
                        </button>
                      ))}
                    </div>

                    {/* Selected nationality detail */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                      <div style={{ padding:"20px", background:`linear-gradient(135deg,${selNat.color}14,${selNat.color}04)`, border:`1px solid ${selNat.color}30`, borderRadius:14 }}>
                        <div style={{ display:"flex", gap:12, alignItems:"flex-start", marginBottom:14 }}>
                          <div style={{ fontSize:36 }}>{selNat.flag}</div>
                          <div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:800, color:T.white }}>{selNat.name} Buyers</div>
                            <div style={{ fontSize:13, color:selNat.color, fontWeight:700 }}>Rank #{selNat.rank}{"·"}{selNat.share} of foreign buyers</div>
                            <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>Budget: {selNat.budget}{"·"}{selNat.type}</div>
                          </div>
                        </div>
                        <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.8, marginBottom:12 }}>{selNat.tip}</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginBottom:6 }}>Top communities they buy in:</div>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {selNat.communities.map((c,i)=>(
                            <span key={i} style={{ fontSize:10, padding:"3px 8px", borderRadius:6, background:selNat.color+"18", color:selNat.color, fontWeight:600 }}>{c}</span>
                          ))}
                        </div>
                      </div>

                      <div className="chart-box" style={{ padding:20 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Platform Strategy for {selNat.name} Buyers</div>
                        {selNat.platforms.map((p,i)=>(
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:i<selNat.platforms.length-1?`1px solid ${T.border}`:"none" }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:selNat.color, flexShrink:0 }} />
                            <span style={{ fontSize:12, fontWeight:600, color:T.white, flex:1 }}>{p}</span>
                            {i===0 && <span style={{ fontSize:10, padding:"2px 6px", borderRadius:4, background:"rgba(16,185,129,0.12)", color:T.green }}>Primary</span>}
                          </div>
                        ))}
                        <div style={{ marginTop:14, padding:"10px 12px", background:T.surfaceAlt, borderRadius:8, fontSize:11, color:T.textSecondary, lineHeight:1.7 }}>
                          <strong style={{ color:T.white }}>Language:</strong> {selNat.language}<br/>
                          <strong style={{ color:T.white }}>Key insight:</strong> {selNat.tip.split(".")[0]}.
                        </div>
                      </div>
                    </div>

                    {/* All nationalities comparison table */}
                    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
                      <div style={{ display:"grid", gridTemplateColumns:"0.5fr 1.2fr 0.8fr 1fr 1.5fr 1.2fr", padding:"9px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
                        {["Rank","Nationality","Market Share","Budget Range","Top Platform","Best Communities"].map((h,i)=>(
                          <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6 }}>{h}</div>
                        ))}
                      </div>
                      {NATIONALITIES.map((n,i)=>(
                        <div key={i} style={{ display:"grid", gridTemplateColumns:"0.5fr 1.2fr 0.8fr 1fr 1.5fr 1.2fr", padding:"10px 16px", borderBottom:i<NATIONALITIES.length-1?`1px solid ${T.border}`:"none", cursor:"pointer", alignItems:"center" }}
                          onClick={()=>setMktNationality(n.name)}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <div style={{ fontFamily:"'Fraunces',serif", fontSize:16, fontWeight:800, color:T.textMuted }}>#{n.rank}</div>
                          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                            <span style={{ fontSize:16 }}>{n.flag}</span>
                            <span style={{ fontSize:13, fontWeight:600, color:T.white }}>{n.name}</span>
                          </div>
                          <div style={{ fontSize:13, fontWeight:700, color:n.color }}>{n.share}</div>
                          <div style={{ fontSize:11, color:T.textSecondary }}>{n.budget}</div>
                          <div style={{ fontSize:11, color:T.gold }}>{n.platforms[0]}</div>
                          <div style={{ fontSize:10, color:T.textMuted }}>{n.communities.slice(0,2).join(", ")}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ══ ROI CALCULATOR VIEW ══ */}
                {mktView === "roi" && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>Marketing ROI Calculator</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Enter your monthly budget · See leads, deals, commission, and ROI per channel · Based on real Dubai CPL benchmarks</div>

                    {/* Budget input */}
                    <div className="chart-box" style={{ padding:18, marginBottom:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:T.white }}>Monthly Marketing Budget</span>
                        <span style={{ fontSize:16, fontWeight:800, color:T.gold }}>AED {mktBudget.toLocaleString()}</span>
                      </div>
                      <input type="range" min={1000} max={100000} step={1000} value={mktBudget}
                        onChange={e=>setMktBudget(Number(e.target.value))}
                        style={{ width:"100%", accentColor:T.gold, cursor:"pointer", marginBottom:8 }} />
                      <div style={{ fontSize:11, color:T.textMuted }}>
                        Avg commission per deal: AED 60,000 (AED 2M property at 3%). Conversion rate per channel varies.
                      </div>
                    </div>

                    {/* ROI table */}
                    <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden", marginBottom:16 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 0.8fr 0.8fr 0.8fr 1fr 1fr", padding:"10px 16px", background:T.surfaceAlt, borderBottom:`1px solid ${T.border}` }}>
                        {["Channel","Avg CPL","Leads/mo","Deals/mo","Est. Commission","ROI"].map((h,i)=>(
                          <div key={i} style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.6 }}>{h}</div>
                        ))}
                      </div>
                      {[...CHANNELS].sort((a,b)=>b.leadQuality-a.leadQuality).map((ch,i)=>{
                        const { leads, deals, commission, roi } = calcROI(ch);
                        const roiNum = Number(roi);
                        return (
                          <div key={i} style={{ display:"grid", gridTemplateColumns:"1.5fr 0.8fr 0.8fr 0.8fr 1fr 1fr", padding:"12px 16px", borderBottom:i<CHANNELS.length-1?`1px solid ${T.border}`:"none", alignItems:"center" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                              <div style={{ width:6, height:6, borderRadius:"50%", background:ch.color }} />
                              <span style={{ fontSize:12, fontWeight:600, color:T.white }}>{ch.name}</span>
                            </div>
                            <div style={{ fontSize:12, color:T.gold }}>AED {ch.cplAvg}</div>
                            <div style={{ fontSize:13, fontWeight:700, color:T.white }}>{leads}</div>
                            <div style={{ fontSize:13, fontWeight:700, color:T.green }}>{deals}</div>
                            <div style={{ fontSize:12, color:T.gold }}>AED {(commission/1000).toFixed(0)}K</div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:800, color:roiNum>200?T.green:roiNum>0?"#F97316":T.red }}>{roi}%</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Best channel callout */}
                    <div style={{ padding:"16px 20px", background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:12, marginBottom:16 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.green, marginBottom:6 }}>
                        \uD83D\uDCA1 Best ROI channel at AED {mktBudget.toLocaleString()}/month
                      </div>
                      <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.8 }}>
                        <strong style={{ color:T.white }}>WhatsApp Broadcast</strong> has the lowest CPL (AED 1-10) but requires an existing database.
                        For new leads at scale: <strong style={{ color:T.white }}>Meta Ads (AED 30-300 CPL)</strong> gives best volume.
                        For highest quality leads: <strong style={{ color:T.white }}>Google Search (AED 450-900)</strong> captures buyers actively searching.
                        <br/>
                        <strong style={{ color:T.gold }}>Recommended mix:</strong> 40% Google + 40% Meta + 20% Portal listings. Review monthly.
                      </div>
                    </div>

                    {/* Commission reference */}
                    <div className="chart-box" style={{ padding:18 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.white, marginBottom:12 }}>Dubai Commission Reference</div>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
                        {[
                          { price:"AED 1M", comm:"AED 20K-30K", rate:"2-3%", color:T.textMuted },
                          { price:"AED 2M", comm:"AED 40K-60K", rate:"2-3%", color:T.gold },
                          { price:"AED 5M", comm:"AED 100K-150K", rate:"2-3%", color:T.green },
                          { price:"AED 10M", comm:"AED 200K-300K", rate:"2-3%", color:T.green },
                        ].map((c,i)=>(
                          <div key={i} style={{ padding:"12px", background:T.surfaceAlt, borderRadius:8, textAlign:"center", border:`1px solid ${T.border}` }}>
                            <div style={{ fontSize:11, fontWeight:700, color:c.color }}>{c.price}</div>
                            <div style={{ fontFamily:"'Fraunces',serif", fontSize:14, fontWeight:800, color:T.white, margin:"4px 0" }}>{c.comm}</div>
                            <div style={{ fontSize:10, color:T.textMuted }}>{c.rate} commission</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop:10, fontSize:11, color:T.textMuted, lineHeight:1.7 }}>
                        Off-plan: 3-5% paid by developer (no cost to buyer). Secondary: 2% from buyer (shared if dual agent). AED 761B total market 2025. 270,000+ transactions.
                      </div>
                    </div>
                  </div>
                )}

                {/* ══ AI LISTING GENERATOR VIEW ══ */}
                {mktView === "listing" && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.white, marginBottom:4 }}>AI Listing Generator</div>
                    <div style={{ fontSize:11, color:T.textMuted, marginBottom:16 }}>Powered by Claude AI · Generates headline, description, WhatsApp message, and SEO tags for Bayut and Property Finder</div>

                    {/* Inputs */}
                    <div className="chart-box" style={{ padding:20, marginBottom:16 }}>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                        <div>
                          <div style={{ fontSize:11, color:T.textMuted, marginBottom:4 }}>Community *</div>
                          <input
                            type="text"
                            placeholder="e.g. Dubai Marina, JVC, Downtown"
                            value={mktListingComm}
                            onChange={e=>setMktListingComm(e.target.value)}
                            style={{ width:"100%", padding:"9px 12px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontFamily:"'Outfit',sans-serif", fontSize:12, outline:"none" }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize:11, color:T.textMuted, marginBottom:4 }}>Property Type</div>
                          <select value={mktListingType} onChange={e=>setMktListingType(e.target.value)} style={{ ...selSt, width:"100%" }}>
                            {["apartment","villa","townhouse","penthouse","studio","duplex"].map(t=><option key={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize:11, color:T.textMuted, marginBottom:4 }}>Bedrooms</div>
                          <select value={mktListingBeds} onChange={e=>setMktListingBeds(e.target.value)} style={{ ...selSt, width:"100%" }}>
                            {["Studio","1","2","3","4","5+"].map(b=><option key={b}>{b}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize:11, color:T.textMuted, marginBottom:4 }}>Price (AED)</div>
                          <input
                            type="number"
                            value={mktListingPrice}
                            onChange={e=>setMktListingPrice(Number(e.target.value))}
                            style={{ width:"100%", padding:"9px 12px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontFamily:"'Outfit',sans-serif", fontSize:12, outline:"none" }}
                          />
                        </div>
                        <div style={{ gridColumn:"1/-1" }}>
                          <div style={{ fontSize:11, color:T.textMuted, marginBottom:4 }}>Key features (optional)</div>
                          <input
                            type="text"
                            placeholder="e.g. Sea view, fully furnished, pool access, smart home, payment plan available"
                            value={mktListingFeatures}
                            onChange={e=>setMktListingFeatures(e.target.value)}
                            style={{ width:"100%", padding:"9px 12px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.white, fontFamily:"'Outfit',sans-serif", fontSize:12, outline:"none" }}
                          />
                        </div>
                      </div>

                      {mktListingPrice >= 2000000 && (
                        <div style={{ marginTop:10, padding:"8px 12px", background:"rgba(16,185,129,0.06)", borderRadius:8, fontSize:11, color:T.green }}>
                          ✓ AED {(mktListingPrice/1e6).toFixed(2)}M — Golden Visa eligible (AED 2M threshold). Will be included in listing automatically.
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={mktAiLoading || !mktListingComm}
                        onClick={generateListing}
                        style={{ marginTop:14, width:"100%", padding:"11px 0", background:(!mktListingComm||mktAiLoading)?T.surfaceAlt:`linear-gradient(135deg,${T.gold},#B8922A)`, border:"none", borderRadius:8, color:(!mktListingComm||mktAiLoading)?T.textMuted:"#000", fontSize:13, fontWeight:700, cursor:(!mktListingComm||mktAiLoading)?"not-allowed":"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        {mktAiLoading ? "⏳ Generating with Claude AI..." : "✨ Generate Listing with AI"}
                      </button>
                    </div>

                    {/* AI Result */}
                    {mktAiResult && (
                      <div className="chart-box" style={{ padding:20 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:T.white }}>Generated Listing</div>
                          <div style={{ display:"flex", gap:8 }}>
                            <button type="button" onClick={()=>navigator.clipboard?.writeText(mktAiResult)}
                              style={{ padding:"5px 12px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:6, color:T.textMuted, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                              Copy All
                            </button>
                            <button type="button" onClick={()=>{ setMktAiResult(""); setMktListingComm(""); setMktListingFeatures(""); }}
                              style={{ padding:"5px 12px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:6, color:T.textMuted, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                              Clear
                            </button>
                          </div>
                        </div>
                        <div style={{ padding:"16px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}`, fontFamily:"'Outfit',sans-serif", fontSize:12, color:T.textSecondary, lineHeight:1.9, whiteSpace:"pre-wrap", maxHeight:500, overflowY:"auto" }}>
                          {mktAiResult}
                        </div>
                        <div style={{ marginTop:10, fontSize:11, color:T.textMuted }}>
                          Generated by Claude Sonnet · Copy and paste directly to Bayut, Property Finder, or WhatsApp · Always verify facts before publishing
                        </div>
                      </div>
                    )}

                    {!mktAiResult && !mktAiLoading && (
                      <div style={{ padding:"24px", textAlign:"center", background:T.surface, border:`1px solid ${T.border}`, borderRadius:12 }}>
                        <div style={{ fontSize:24, marginBottom:8 }}>✨</div>
                        <div style={{ fontSize:13, color:T.white, marginBottom:4 }}>AI-powered listing generation</div>
                        <div style={{ fontSize:11, color:T.textMuted }}>Fill in the community and details above, then click Generate. Claude will write your full listing, WhatsApp message, and SEO tags in seconds.</div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── SOURCE FOOTER ── */}
                <div style={{ paddingTop:12, borderTop:`1px solid ${T.border}`, display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <span style={{ fontSize:10, color:T.textMuted }}>Sources:</span>
                  {["theprimeads.com 2026","DLD 2025 Nationality Data","brightsanddesigns.com Nov 2025","campaignme.com","ninjasofts.com","keltandcorealty.com Feb 2026","dubaipropertyinsight.com","WordStream 2025"].map((s,i)=>(
                    <span key={i} style={{ fontSize:10, color:T.textMuted, padding:"2px 8px", borderRadius:10, border:`1px solid ${T.border}`, background:T.surfaceAlt }}>{s}</span>
                  ))}
                </div>

              </div>
            );
}

export default MarketingTab;
