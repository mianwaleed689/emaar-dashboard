/* eslint-disable */
/* LISTINGS TAB �€” Property listings CRM */

import React from "react";
import { T } from "../data";
import { SvgIcons } from "../components/Icons";

function ListingsTab({ liveNeighbourhoods=[],
  listings, listingsLoading,
  listingForm, setListingForm,
  listingFormLoading, setListingFormLoading,
  showNewListing, setShowNewListing,
  selectedListing, setSelectedListing,
  listingFilter, setListingFilter,
  listingSearch, setListingSearch,
  publishingId, setPublishingId,
  firebaseUser, orgId, orgRole, userName,
}) {

            const isAgent   = orgRole === "agent";
            const isManager = orgRole === "manager";
            if (!isAgent && !isManager) return (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 20px", textAlign:"center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:16 }}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                <div style={{ fontSize:16, fontWeight:700, color:T.textPrimary, marginBottom:6 }}>Listings not available</div>
                <div style={{ fontSize:12, color:T.textMuted }}>Contact your manager to access listing management</div>
              </div>
            );

            // Status config
            const STATUS_CFG = {
              Available:  { color:"#10B981", bg:"rgba(16,185,129,0.1)"  },
              Reserved:   { color:"#F59E0B", bg:"rgba(245,158,11,0.1)"  },
              Sold:       { color:"#3B82F6", bg:"rgba(59,130,246,0.1)"  },
              "Off-market":{ color:T.textMuted, bg:T.surfaceAlt          },
            };

            // Portal config
            const PORTALS = [
              { key:"pf",       name:"Property Finder", color:"#00C08B", url:"https://www.propertyfinder.ae/en/post-property" },
              { key:"bayut",    name:"Bayut",           color:"#FF6B35", url:"https://www.bayut.com/properties-for-sale-in-uae.html" },
              { key:"dubizzle", name:"Dubizzle",        color:"#E8003D", url:"https://www.dubizzle.com/properties/for-sale/" },
            ];

            // Duplicate check
            const checkDuplicate = (unitNo, building) => {
              if (!unitNo || !building) return false;
              return listings.filter(l => l.unitNo === unitNo && l.building === building && l.status !== "Sold").length > 1;
            };

            // Create listing
            const createListing = async () => {
              if (!listingForm.title.trim() && !listingForm.community.trim()) return;
              setListingFormLoading(true);
              try {
                const title = listingForm.title.trim() ||
                  `${listingForm.beds}BR ${listingForm.type} in ${listingForm.community}`;
                await addDoc(collection(db, "listings"), {
                  ...listingForm,
                  title,
                  price:  parseFloat(listingForm.price)  || 0,
                  size:   parseFloat(listingForm.size)   || 0,
                  beds:   parseInt(listingForm.beds)     || 0,
                  baths:  parseInt(listingForm.baths)    || 0,
                  floor:  parseInt(listingForm.floor)    || 0,
                  agentId:   firebaseUser?.uid,
                  agentName: userName || firebaseUser?.email,
                  orgId:     orgId || null,
                  publishedTo: [],
                  views: 0, leads: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setListingForm({ title:"", type:"Apartment", beds:"1", baths:"1", size:"", price:"", community:"", building:"", unitNo:"", floor:"", description:"", permitNo:"", status:"Available", furnishing:"Unfurnished", offplan:false });
                setShowNewListing(false);
              } catch(e) { console.error(e); }
              setListingFormLoading(false);
            };

            // Update listing status
            const updateListingStatus = async (id, status) => {
              try {
                await setDoc(doc(db, "listings", id), { status, updatedAt: new Date().toISOString() }, { merge: true });
                if (selectedListing?.id === id) setSelectedListing(l => l ? {...l, status} : l);
              } catch(e) { console.error(e); }
            };

            // Mark published to portal
            const markPublished = async (id, portalKey) => {
              setPublishingId(id + portalKey);
              try {
                const listing = listings.find(l => l.id === id);
                const published = listing?.publishedTo || [];
                const updated = published.includes(portalKey)
                  ? published.filter(p => p !== portalKey)
                  : [...published, portalKey];
                await setDoc(doc(db, "listings", id), { publishedTo: updated, updatedAt: new Date().toISOString() }, { merge: true });
                if (selectedListing?.id === id) setSelectedListing(l => l ? {...l, publishedTo: updated} : l);
              } catch(e) { console.error(e); }
              setPublishingId(null);
            };

            // Delete listing
            const deleteListing = async (id) => {
              if (!window.confirm("Delete this listing?")) return;
              try {
                await deleteDoc(doc(db, "listings", id));
                if (selectedListing?.id === id) setSelectedListing(null);
              } catch(e) { console.error(e); }
            };

            // Filter
            const filtered = listings.filter(l => {
              if (listingFilter !== "all" && l.status !== listingFilter) return false;
              if (listingSearch.trim()) {
                const q = listingSearch.toLowerCase();
                if (!(l.title||"").toLowerCase().includes(q) &&
                    !(l.community||"").toLowerCase().includes(q) &&
                    !(l.building||"").toLowerCase().includes(q) &&
                    !(l.unitNo||"").toLowerCase().includes(q)) return false;
              }
              return true;
            });

            const totalValue  = listings.reduce((a,l) => a + (parseFloat(l.price)||0), 0);
            const available   = listings.filter(l => l.status === "Available").length;
            const published   = listings.filter(l => (l.publishedTo||[]).length > 0).length;

            return (<>

              {/* �”€�”€ Header �”€�”€ */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
                <div>
                  <h1 style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:T.white, margin:0 }}>Listings</h1>
                  <p style={{ fontSize:12, color:T.textMuted, margin:"4px 0 0" }}>Create · Manage · Publish to portals · Track performance</p>
                </div>
                <button type="button" onClick={()=>setShowNewListing(true)}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", borderRadius:9, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  New Listing
                </button>
              </div>

              {/* �”€�”€ KPI Bar �”€�”€ */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
                {[
                  { label:"Total Listings",  value:listings.length,   color:T.gold,    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> },
                  { label:"Available",       value:available,          color:T.green,   icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
                  { label:"Published",       value:published,          color:T.teal,    icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> },
                  { label:"Portfolio Value", value:`AED ${totalValue>=1e6?(totalValue/1e6).toFixed(1)+"M":totalValue.toLocaleString()}`, color:"#8B5CF6", icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
                ].map((k,i) => (
                  <div key={i} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px", position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${k.color},${k.color}30)` }}/>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8 }}>{k.label}</div>
                      <div style={{ color:k.color, opacity:0.6 }}>{k.icon}</div>
                    </div>
                    <div style={{ fontSize:24, fontWeight:900, color:k.color, fontFamily:"'Fraunces',serif", lineHeight:1 }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* �”€�”€ Filters �”€�”€ */}
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
                <div style={{ display:"flex", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
                  {[["all","All"],["Available","Available"],["Reserved","Reserved"],["Sold","Sold"]].map(([v,l])=>(
                    <button key={v} type="button" onClick={()=>setListingFilter(v)}
                      style={{ padding:"8px 14px", fontSize:11, fontWeight:600, border:"none", background:listingFilter===v?"rgba(212,168,67,0.15)":"transparent", color:listingFilter===v?T.gold:T.textMuted, cursor:"pointer", fontFamily:"'Outfit',sans-serif", borderRight:`1px solid ${T.border}` }}>
                      {l}
                    </button>
                  ))}
                </div>
                <div style={{ position:"relative", flex:"1 1 220px" }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input value={listingSearch} onChange={e=>setListingSearch(e.target.value)} placeholder="Search by title, community, building, unit..."
                    style={{ width:"100%", padding:"8px 12px 8px 33px", background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textPrimary, fontSize:12, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                </div>
                <div style={{ marginLeft:"auto", fontSize:11, color:T.textMuted }}>{filtered.length} of {listings.length}</div>
              </div>

              {/* �”€�”€ Listings Grid �”€�”€ */}
              {listingsLoading ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 0", gap:10 }}>
                  <div style={{ width:20, height:20, border:`2px solid ${T.gold}30`, borderTopColor:T.gold, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
                  <span style={{ fontSize:12, color:T.textMuted }}>Loading listings...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign:"center", padding:"60px 20px" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ marginBottom:12 }}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                  <div style={{ fontSize:14, fontWeight:600, color:T.textPrimary, marginBottom:6 }}>
                    {listings.length === 0 ? "No listings yet" : "No listings match filters"}
                  </div>
                  <div style={{ fontSize:12, color:T.textMuted, marginBottom:20 }}>
                    {listings.length === 0 ? "Create your first listing to start publishing to portals" : "Try adjusting your filters"}
                  </div>
                  {listings.length === 0 && (
                    <button type="button" onClick={()=>setShowNewListing(true)}
                      style={{ padding:"10px 24px", borderRadius:8, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      Create First Listing
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:12 }}>
                  {filtered.map((l, i) => {
                    const sc = STATUS_CFG[l.status||"Available"] || STATUS_CFG.Available;
                    const isDuplicate = checkDuplicate(l.unitNo, l.building);
                    const publishedPortals = l.publishedTo || [];
                    return (
                      <div key={l.id||i}
                        style={{ background:T.card, border:`1px solid ${isDuplicate?"rgba(239,68,68,0.4)":T.border}`, borderRadius:14, overflow:"hidden", transition:"all 0.15s" }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=isDuplicate?"rgba(239,68,68,0.6)":`${T.gold}50`;e.currentTarget.style.boxShadow=`0 8px 32px rgba(0,0,0,0.15)`;}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=isDuplicate?"rgba(239,68,68,0.4)":T.border;e.currentTarget.style.boxShadow="none";}}>

                        {/* Card header */}
                        <div style={{ padding:"14px 16px", borderBottom:`1px solid ${T.border}` }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:13, fontWeight:700, color:T.white, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.title || `${l.beds}BR ${l.type}`}</div>
                              <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>
                                {l.community}{l.building ? ` · ${l.building}` : ""}{l.unitNo ? ` · Unit ${l.unitNo}` : ""}
                              </div>
                            </div>
                            <div style={{ display:"flex", gap:5, flexShrink:0, marginLeft:8 }}>
                              {isDuplicate && (
                                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:4, background:"rgba(239,68,68,0.12)", color:T.red, fontWeight:700 }}>DUPLICATE</span>
                              )}
                              <span style={{ fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:5, background:sc.bg, color:sc.color }}>
                                {l.status||"Available"}
                              </span>
                            </div>
                          </div>

                          {/* Property details row */}
                          <div style={{ display:"flex", gap:12, fontSize:11, color:T.textSecondary }}>
                            {l.beds > 0 && <span>{l.beds} BR</span>}
                            {l.baths > 0 && <span>{l.baths} Bath</span>}
                            {l.size > 0 && <span>{l.size.toLocaleString()} sqft</span>}
                            {l.type && <span style={{ color:T.textMuted }}>{"·"}{l.type}</span>}
                          </div>
                        </div>

                        <div style={{ padding:"12px 16px" }}>
                          {/* Price */}
                          <div style={{ fontSize:18, fontWeight:900, color:T.gold, fontFamily:"'Fraunces',serif", marginBottom:10 }}>
                            {l.price > 0 ? `AED ${parseFloat(l.price)>=1e6?(parseFloat(l.price)/1e6).toFixed(2)+"M":parseFloat(l.price).toLocaleString()}` : "Price TBD"}
                          </div>

                          {/* Trakheesi permit */}
                          {l.permitNo ? (
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, padding:"5px 10px", background:"rgba(20,184,166,0.08)", borderRadius:6 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                              <span style={{ fontSize:10, color:T.teal, fontWeight:600 }}>Permit: {l.permitNo}</span>
                            </div>
                          ) : (
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, padding:"5px 10px", background:"rgba(245,158,11,0.06)", borderRadius:6 }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                              <span style={{ fontSize:10, color:"#F59E0B" }}>No Trakheesi permit</span>
                            </div>
                          )}

                          {/* Portal syndication */}
                          <div style={{ marginBottom:10 }}>
                            <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>Portal Syndication</div>
                            <div style={{ display:"flex", gap:5 }}>
                              {PORTALS.map(portal => {
                                const isPublished = publishedPortals.includes(portal.key);
                                const isLoading   = publishingId === l.id + portal.key;
                                return (
                                  <button key={portal.key} type="button"
                                    onClick={()=>{ window.open(portal.url,"_blank"); markPublished(l.id, portal.key); }}
                                    disabled={isLoading}
                                    style={{ flex:1, padding:"6px 4px", borderRadius:6, border:`1px solid ${isPublished?portal.color:T.border}`, background:isPublished?`${portal.color}15`:"transparent", color:isPublished?portal.color:T.textMuted, fontSize:9, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all 0.12s", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
                                    {isLoading ? (
                                      <div style={{ width:10, height:10, border:`1.5px solid ${portal.color}40`, borderTopColor:portal.color, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
                                    ) : isPublished ? (
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                    ) : (
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                                    )}
                                    <span>{portal.name.split(" ")[0]}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Performance + actions row */}
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <div style={{ display:"flex", gap:12 }}>
                              <div style={{ textAlign:"center" }}>
                                <div style={{ fontSize:14, fontWeight:700, color:T.textPrimary }}>{l.views||0}</div>
                                <div style={{ fontSize:9, color:T.textMuted }}>Views</div>
                              </div>
                              <div style={{ textAlign:"center" }}>
                                <div style={{ fontSize:14, fontWeight:700, color:l.leads>0?T.teal:T.textPrimary }}>{l.leads||0}</div>
                                <div style={{ fontSize:9, color:T.textMuted }}>Leads</div>
                              </div>
                            </div>
                            <div style={{ display:"flex", gap:5 }}>
                              <button type="button" onClick={()=>setSelectedListing(l)}
                                style={{ padding:"6px 12px", borderRadius:6, border:`1px solid rgba(59,130,246,0.3)`, background:"rgba(59,130,246,0.08)", color:"#3B82F6", fontSize:10, fontWeight:600, cursor:"pointer" }}>
                                Edit
                              </button>
                              <button type="button" onClick={()=>deleteListing(l.id)}
                                style={{ padding:"6px 10px", borderRadius:6, border:`1px solid rgba(239,68,68,0.2)`, background:"rgba(239,68,68,0.06)", color:T.red, fontSize:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* �”€�”€ Listing Detail Drawer �”€�”€ */}
              {selectedListing && (
                <div style={{ position:"fixed", inset:0, zIndex:1500, display:"flex" }} onClick={e=>{if(e.target===e.currentTarget)setSelectedListing(null);}}>
                  <div style={{ flex:1, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)" }} onClick={()=>setSelectedListing(null)}/>
                  <div style={{ width:460, background:T.bg, borderLeft:`1px solid ${T.border}`, overflowY:"auto", boxShadow:"-20px 0 60px rgba(0,0,0,0.4)" }}>
                    <div style={{ padding:"20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:900, color:T.white }}>{selectedListing.title}</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>{selectedListing.community}{"·"}{selectedListing.building} · Unit {selectedListing.unitNo}</div>
                      </div>
                      <button type="button" onClick={()=>setSelectedListing(null)}
                        style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${T.border}`, borderRadius:7, color:T.textMuted, cursor:"pointer", padding:"5px 10px", display:"flex", alignItems:"center", gap:4, fontSize:12 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Close
                      </button>
                    </div>
                    <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:12 }}>
                      {/* Status buttons */}
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>Status</div>
                        <div style={{ display:"flex", gap:6 }}>
                          {Object.entries(STATUS_CFG).map(([s,sc])=>(
                            <button key={s} type="button" onClick={()=>updateListingStatus(selectedListing.id,s)}
                              style={{ flex:1, padding:"7px 0", borderRadius:7, border:`1px solid ${(selectedListing.status||"Available")===s?sc.color:T.border}`, background:(selectedListing.status||"Available")===s?sc.bg:"transparent", color:(selectedListing.status||"Available")===s?sc.color:T.textMuted, fontSize:10, fontWeight:600, cursor:"pointer" }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Detail grid */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        {[
                          { label:"Type",        value:selectedListing.type       },
                          { label:"Beds",         value:selectedListing.beds       },
                          { label:"Baths",        value:selectedListing.baths      },
                          { label:"Size (sqft)",  value:selectedListing.size       },
                          { label:"Floor",        value:selectedListing.floor      },
                          { label:"Furnishing",   value:selectedListing.furnishing },
                          { label:"Permit No.",   value:selectedListing.permitNo   },
                          { label:"Price (AED)",  value:selectedListing.price>0?parseFloat(selectedListing.price).toLocaleString():null },
                        ].filter(r=>r.value).map(({label,value})=>(
                          <div key={label} style={{ background:T.surfaceAlt, borderRadius:8, padding:"9px 12px" }}>
                            <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.7, marginBottom:3 }}>{label}</div>
                            <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      {/* Description */}
                      {selectedListing.description && (
                        <div style={{ background:T.surfaceAlt, borderRadius:8, padding:"10px 12px" }}>
                          <div style={{ fontSize:9, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.7, marginBottom:5 }}>Description</div>
                          <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.6 }}>{selectedListing.description}</div>
                        </div>
                      )}
                      {/* Portal syndication in drawer */}
                      <div>
                        <div style={{ fontSize:10, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>Publish to Portals</div>
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                          {PORTALS.map(portal => {
                            const isPublished = (selectedListing.publishedTo||[]).includes(portal.key);
                            return (
                              <div key={portal.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:isPublished?`${portal.color}0a`:T.surfaceAlt, border:`1px solid ${isPublished?portal.color:T.border}`, borderRadius:9 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                  <div style={{ width:8, height:8, borderRadius:"50%", background:portal.color }}/>
                                  <span style={{ fontSize:12, fontWeight:600, color:isPublished?portal.color:T.textPrimary }}>{portal.name}</span>
                                  {isPublished && <span style={{ fontSize:9, color:portal.color }}>Published</span>}
                                </div>
                                <button type="button"
                                  onClick={()=>{ window.open(portal.url,"_blank"); markPublished(selectedListing.id, portal.key); }}
                                  style={{ padding:"5px 12px", borderRadius:6, border:`1px solid ${portal.color}40`, background:isPublished?`${portal.color}15`:"transparent", color:portal.color, fontSize:10, fontWeight:700, cursor:"pointer" }}>
                                  {isPublished ? "Republish" : "Publish �’"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* Performance */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        <div style={{ background:T.surfaceAlt, borderRadius:8, padding:"12px", textAlign:"center" }}>
                          <div style={{ fontSize:24, fontWeight:900, color:T.textPrimary, fontFamily:"'Fraunces',serif" }}>{selectedListing.views||0}</div>
                          <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>Total Views</div>
                        </div>
                        <div style={{ background:T.surfaceAlt, borderRadius:8, padding:"12px", textAlign:"center" }}>
                          <div style={{ fontSize:24, fontWeight:900, color:T.teal, fontFamily:"'Fraunces',serif" }}>{selectedListing.leads||0}</div>
                          <div style={{ fontSize:10, color:T.textMuted, marginTop:2 }}>Leads Generated</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* �”€�”€ New Listing Modal �”€�”€ */}
              {showNewListing && (
                <div style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.85)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }} onClick={e=>{if(e.target===e.currentTarget)setShowNewListing(false);}}>
                  <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.border}`, width:"95%", maxWidth:600, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
                    <div style={{ padding:"22px 24px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:T.gold }}>New Listing</div>
                        <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>All DLD required fields �€” get your Trakheesi permit before listing</div>
                      </div>
                      <button type="button" onClick={()=>setShowNewListing(false)}
                        style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                      {/* Type selector */}
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:8 }}>Property Type</div>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {["Apartment","Villa","Townhouse","Penthouse","Office","Shop","Warehouse"].map(t=>(
                            <button key={t} type="button" onClick={()=>setListingForm(f=>({...f,type:t}))}
                              style={{ padding:"7px 12px", borderRadius:7, border:`1px solid ${listingForm.type===t?T.gold:T.border}`, background:listingForm.type===t?"rgba(212,168,67,0.1)":"transparent", color:listingForm.type===t?T.gold:T.textMuted, fontSize:11, fontWeight:600, cursor:"pointer" }}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Title */}
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Listing Title (auto-generated if empty)</div>
                        <input value={listingForm.title||""} onChange={e=>setListingForm(f=>({...f,title:e.target.value}))}
                          placeholder={`${listingForm.beds}BR ${listingForm.type} in ${listingForm.community||"Community"}`}
                          style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                      </div>
                      {/* 2-col fields */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        {[
                          { key:"community",  label:"Community *",        placeholder:"Dubai Hills Estate"     },
                          { key:"building",   label:"Building / Tower",   placeholder:"Park Heights 1"          },
                          { key:"unitNo",     label:"Unit Number",        placeholder:"1204"                    },
                          { key:"floor",      label:"Floor",              placeholder:"12",      type:"number"  },
                          { key:"size",       label:"Size (sqft)",        placeholder:"1250",    type:"number"  },
                          { key:"price",      label:"Price (AED) *",      placeholder:"2500000", type:"number"  },
                          { key:"beds",       label:"Bedrooms",           placeholder:"2",       type:"number"  },
                          { key:"baths",      label:"Bathrooms",          placeholder:"2",       type:"number"  },
                        ].map(({key,label,placeholder,type})=>(
                          <div key={key}>
                            <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>{label}</div>
                            <input type={type||"text"} value={listingForm[key]||""} onChange={e=>setListingForm(f=>({...f,[key]:e.target.value}))}
                              placeholder={placeholder}
                              style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                          </div>
                        ))}
                      </div>
                      {/* Furnishing + Off-plan row */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Furnishing</div>
                          <select value={listingForm.furnishing||"Unfurnished"} onChange={e=>setListingForm(f=>({...f,furnishing:e.target.value}))}
                            style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", cursor:"pointer" }}>
                            {["Unfurnished","Semi-Furnished","Fully Furnished"].map(v=><option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Trakheesi Permit No.</div>
                          <input value={listingForm.permitNo||""} onChange={e=>setListingForm(f=>({...f,permitNo:e.target.value}))}
                            placeholder="Required for advertising"
                            style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid ${listingForm.permitNo?"rgba(20,184,166,0.3)":"rgba(245,158,11,0.3)"}`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                        </div>
                      </div>
                      {/* Permit warning */}
                      {!listingForm.permitNo && (
                        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          <span style={{ fontSize:11, color:"#F59E0B" }}>DLD requires a Trakheesi permit before publishing to Property Finder, Bayut, or Dubizzle</span>
                        </div>
                      )}
                      {/* Description */}
                      <div>
                        <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Description</div>
                        <textarea value={listingForm.description||""} onChange={e=>setListingForm(f=>({...f,description:e.target.value}))} rows={3}
                          placeholder="Highlight key features, views, amenities, payment plan..."
                          style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
                      </div>
                    </div>
                    <div style={{ padding:"16px 24px", borderTop:`1px solid ${T.border}`, display:"flex", gap:10, justifyContent:"flex-end" }}>
                      <button type="button" onClick={()=>setShowNewListing(false)}
                        style={{ padding:"10px 20px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, fontSize:12, cursor:"pointer" }}>
                        Cancel
                      </button>
                      <button type="button" onClick={createListing} disabled={listingFormLoading||(!listingForm.community&&!listingForm.title)}
                        style={{ padding:"10px 24px", borderRadius:8, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.12)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", opacity:(listingFormLoading||(!listingForm.community&&!listingForm.title))?0.5:1, fontFamily:"'Outfit',sans-serif" }}>
                        {listingFormLoading ? "Creating..." : "Create Listing"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>);
}

export default ListingsTab;
