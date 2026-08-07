/* eslint-disable */
/* LISTINGS TAB — Property listings CRM */

import React from "react";
import { T } from "../data";
import { colour as C, type as TY, space as S, radius as R, state as ST, surface } from "../design/system";
import { useSystemCSS, useViewport, PageHead, Card as DsCard, Btn, Chip, Dot,
         Input, DataList, Empty, Toolbar } from "../design/ui";
import { SvgIcons } from "../components/Icons";

import TabIntro from "../components/TabIntro";
import TabProvenance from "../components/TabProvenance";
import { tabCopy } from "../data/tabCopy";
import { canAdvertise, listingCompliance, complianceProgress,
         PORTALS as COMPLIANT_PORTALS, POSTED_NOTE } from "../crm/model/listing";
import { viewerFrom, scopeFor, intentFor, visibleRecords } from "../crm/model/org";
function ListingsTab({
  myDepartment, mySeniority, liveNeighbourhoods=[],
  listings, listingsLoading,
  listingForm, setListingForm,
  listingFormLoading, setListingFormLoading,
  showNewListing, setShowNewListing,
  selectedListing, setSelectedListing,
  listingFilter, setListingFilter,
  listingSearch, setListingSearch,
  publishingId, setPublishingId,
  firebaseUser, orgId, orgRole, userName, userRole, teamMembers = [],
}) {
  useSystemCSS();
  const { phone, width } = useViewport();
  const _copy = tabCopy("Listings");


            /* Scope from the model. This is what lets the LISTINGS COORDINATOR
               see every listing in the company from staff level — permits and
               Form A are their whole job — while an agent sees their own. */
            const me     = viewerFrom({ firebaseUser, orgRole, userRole, teamMembers,
                                        department: myDepartment, seniority: mySeniority });
            const scope  = scopeFor(me, "listings");
            const intent = intentFor(me, "listings");
            const isAgent   = scope === "own";
            const isManager = scope === "team" || scope === "org";
            /* isOwner and isDirector used to be declared here from the raw
               orgRole and were never read by anything. They were the only two
               places this file asked for a job title instead of asking the
               access model, and they decided nothing. Removed rather than
               rewritten: scope above already answers every question this tab
               asks. */

            if (scope === "none") return (
              <div style={{ padding:"70px 20px", textAlign:"center" }}>
                <div style={{ fontSize:15, fontWeight:700, color:T.textPrimary, marginBottom:7, fontFamily:"'Fraunces',serif" }}>
                  Listings are not part of your role
                </div>
                <div style={{ fontSize:12, color:T.textMuted, maxWidth:430, margin:"0 auto", lineHeight:1.7 }}>
                  This belongs to the sales floor and the listings desk. If that is wrong,
                  your department is set incorrectly on your record.
                </div>
              </div>
            );

            /* One scoped source of truth. Every count, filter and compliance
               banner below reads `listings`, so shadowing it here scopes the
               whole tab — rather than each figure being scoped separately,
               which is how a "total" ends up counting rows the viewer cannot
               open. */
            const allListings = listings || [];
            listings = visibleRecords(me, "listings", allListings,
                                      { ownerField: "agentId", teamIds: me.teamIds });

            // Status config
            const STATUS_CFG = {
              Available:  { color:ST.positive.fg, bg:"rgba(16,185,129,0.1)"  },
              Reserved:   { color:ST.warning.fg, bg:"rgba(245,158,11,0.1)"  },
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
                  postedTo: [],
                  formA: listingForm.formASignedAt ? { signedAt: listingForm.formASignedAt } : null,
                  permitExpiresAt: listingForm.permitExpiresAt || null,
                  views: 0, leads: 0,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });
                setListingForm({ title:"", type:"Apartment", beds:"1", baths:"1", size:"", price:"", community:"", building:"", unitNo:"", floor:"", description:"", permitNumber:"", permitExpiresAt:"", formASignedAt:"", status:"Available", furnishing:"Unfurnished", offplan:false });
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
            /* RECORDING THAT YOU POSTED IT — NOT PUBLISHING IT.
               This ran as `window.open(portal.url); markPublished(...)`: it
               opened the portal's generic "post a property" page and immediately
               wrote publishedTo with a green tick beside it. Nothing had been
               posted. The agency's own database then claimed the listing was
               live on Property Finder.

               In a business where advertising without a valid permit is a RERA
               violation, a false record of having advertised is the worst thing
               to keep — it is the record you would be judged on.

               Two changes. The wording now says what it is: you posted it, and
               this notes that you did. And it refuses when the listing does not
               meet the advertising rules, because ticking "posted" on a listing
               with no permit records a violation in your own system. */
            const markPosted = async (id, portalKey, portalUrl) => {
              const listing = listings.find(l => l.id === id);
              const already = (listing?.postedTo || listing?.publishedTo || []);
              const adding  = !already.includes(portalKey);

              if (adding) {
                const verdict = canAdvertise(listing, null, null);
                if (!verdict.ok) {
                  window.alert(
                    "This listing cannot be advertised yet.\n\n" +
                    verdict.blocking.map(b => "• " + b.fail).join("\n\n") +
                    "\n\nRecording it as posted would put a violation in your own records."
                  );
                  return;                      // and the portal is NOT opened
                }
                /* The portal opens only once the listing is cleared. This used to
                   happen first and unconditionally, so an agent was sent off to
                   post something that was not allowed to be posted. */
                if (portalUrl) window.open(portalUrl, "_blank", "noopener");
              }

              setPublishingId(id + portalKey);
              try {
                const updated = adding ? [...already, portalKey] : already.filter(p => p !== portalKey);
                await setDoc(doc(db, "listings", id),
                  { postedTo: updated, publishedTo: updated, updatedAt: new Date().toISOString() },
                  { merge: true });
                if (selectedListing?.id === id) {
                  setSelectedListing(l => l ? { ...l, postedTo: updated, publishedTo: updated } : l);
                }
              } catch (e) {
                console.error("[listings] could not record the posting:", e);
                window.alert("That could not be saved. Nothing has been recorded.");
              }
              setPublishingId(null);
            };
            /* Kept so nothing still calling the old name breaks silently. */
            const markPublished = markPosted;

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

            {/* No title here. The heading below is scope-aware — it says "All
                listings" to a manager and only their own to an agent — so this
                one printed a second, less informative "Listings" a hundred
                pixels above it. */}
            {/* The intro used to render ABOVE the page title, so the screen
                opened with a paragraph, then a "What this covers" button, then
                a "Not covered" line, and only then said what page you were on.
                A reader needs the name of the thing before its caveats. It now
                sits under the heading — see below. */}

              {/* ADVERTS RUNNING THAT SHOULD NOT BE.
                  This is the one number on the tab an owner needs before any
                  other: listings their own records say are posted, which do not
                  meet the advertising rules. Nothing surfaced it before, because
                  nothing checked. */}
              {(() => {
                const c = listingCompliance(listings || [], {}, null);
                if (!c.violating && !c.blocked) return null;
                const bad = c.violating > 0;
                return (
                  <div style={{ marginBottom:S.lg }}>
                  <DsCard tone={bad ? "critical" : "warning"}
                    title={bad ? "Adverts running that should not be" : "Listings that cannot be advertised yet"}>
                    <p style={{ ...TY.small, color:C.textMuted, margin:0 }}>
                      {c.headline}{" "}
                      {bad && "Advertising without a valid permit is a RERA violation, and your own records currently show these as posted."}
                    </p>
                    {bad && (
                      <div style={{ marginTop:S.md, display:"flex", flexDirection:"column", gap:S.sm }}>
                        {c.violatingRows.slice(0, 5).map(r => (
                          <div key={r.listing.id} style={{ ...TY.small, color:C.textMuted }}>
                            <b style={{ color:C.text }}>{r.listing.title || r.listing.community || "Untitled listing"}</b>
                            {" — "}{r.verdict.blocking[0].fail}
                          </div>
                        ))}
                      </div>
                    )}
                  </DsCard>
                  </div>
                );
              })()}

              {/* ── Header ──
                  The heading says whose listings these are, and the line under
                  it asks the question this viewer opened the tab to answer.

                  The four KPI cards that used to sit under it are gone. Each
                  was 90px tall with a coloured gradient bar across its top, an
                  icon, and a 24px figure in its own colour — gold, green, teal
                  and purple, none of which meant anything. Four facts, 110px of
                  screen, and the same four facts fit on the title line. */}
              <PageHead
                title={intent?.title || "Listings"}
                count={listings.length
                  ? `${listings.length} on the books · ${available} available · ${published} posted · ${
                      totalValue >= 1e6 ? `AED ${(totalValue/1e6).toFixed(1)}M` : `AED ${totalValue.toLocaleString()}`}`
                  : null}
                question={intent?.question || "Whether each listing may lawfully be advertised yet."}
                action={<Btn variant="primary" onClick={()=>setShowNewListing(true)}
                  title="Record a property you are marketing. You will be asked for the Form A and the Trakheesi permit, because nothing can be advertised without them.">
                  + New listing
                </Btn>}>
                {_copy && <div style={{ marginTop:S.md }}>
                  <TabIntro what={_copy.what} detail={_copy.detail} includes={_copy.includes}
                            excludes={_copy.excludes} warning={_copy.warning}/>
                </div>}
              </PageHead>

              {/* ── Filters ── */}
              <Toolbar>
                <div style={{ display:"flex", gap:2, background:C.panelSunk,
                              border:`1px solid ${C.line}`, borderRadius:R.control, padding:3 }}>
                  {/* Each of these was a bare word. "Reserved" and "Available" mean
                      different things in different agencies, so each one now says
                      which listings it will show. */}
                  {[["all","All","Every listing on your books, whatever its state"],
                    ["Available","Available","On the market and not under offer"],
                    ["Reserved","Reserved","Under offer. Still owned by the seller until it transfers."],
                    ["Sold","Sold","Transferred. Kept for the record."]].map(([v,l,tip])=>(
                    <button key={v} type="button" onClick={()=>setListingFilter(v)} title={tip}
                      className="ds-btn ds-focus"
                      style={{ padding:`0 ${S.base}px`, minHeight:32, borderRadius:6, cursor:"pointer",
                               border:`1px solid ${listingFilter===v?C.accentLine:"transparent"}`,
                               background:listingFilter===v?C.accentSoft:"transparent",
                               color:listingFilter===v?C.accent:C.textMuted,
                               fontFamily:TY.small.fontFamily, fontSize:13,
                               fontWeight:listingFilter===v?700:500, whiteSpace:"nowrap" }}>
                      {l}
                    </button>
                  ))}
                </div>
                <div style={{ flex:"1 1 240px", minWidth:phone?"100%":200 }}>
                  <Input value={listingSearch} onChange={setListingSearch}
                    placeholder="Search by title, community, building, unit…"/>
                </div>
                <span style={{ ...TY.small, color:C.textMuted, marginLeft:"auto" }}>
                  {filtered.length} of {listings.length}
                </span>
              </Toolbar>

              {/* ── Listings Grid ── */}
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
                  {/* "start publishing to portals" repeated the claim this tab
                      does not support. Nothing is published from here. */}
                  <div style={{ fontSize:12, color:T.textMuted, marginBottom:20, lineHeight:1.7, maxWidth:430 }}>
                    {listings.length === 0
                      ? "Record a property and this will tell you whether it may lawfully be advertised yet — Form A signed, Trakheesi permit issued and still valid, broker card current."
                      : "Nothing matches the filters you have set."}
                  </div>
                  {listings.length === 0 && (
                    <button type="button" onClick={()=>setShowNewListing(true)}
                      title="Record a property you are marketing"
                      style={{ padding:"10px 24px", borderRadius:8, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                      Record the first one
                    </button>
                  )}
                </div>
              ) : (
                <DataList
                  rows={filtered}
                  rowKey={(l,i)=>l.id||i}
                  onRowClick={l=>setSelectedListing(l)}
                  maxHeightOffset={330}
                  columns={[
                    { key:"listing", head:"Listing", width:230, phone:"title",
                      cell:l=>{
                        const dup = checkDuplicate(l.unitNo, l.building);
                        return (
                          <span style={{ display:"flex", alignItems:"center", gap:S.sm, minWidth:0 }}>
                            <span style={{ ...TY.smallStrong, color:C.text, overflow:"hidden",
                                           textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {l.title || `${l.beds}BR ${l.type}`}
                            </span>
                            {dup && <Chip tone="critical" title="Another listing has the same unit and building. Either one of them is wrong, or two agents are marketing the same property.">Duplicate</Chip>}
                          </span>
                        );
                      }},
                    { key:"where", head:"Where", width:206, phone:"sub",
                      cell:l=><span style={{ color:C.textMuted }}>
                        {l.community}{l.building ? ` · ${l.building}` : ""}{l.unitNo ? ` · Unit ${l.unitNo}` : ""}</span> },
                    /* THE VERDICT, NOT A GREEN SHIELD.
                       The card showed the permit number behind a green shield,
                       which reads as "compliant" — and a permit that expired
                       last month looked identical to a live one. This is the
                       answer to the only question the tab exists to answer, so
                       it gets its own column and an owner can run an eye down
                       it. */
                    { key:"advertise", head:"May it be advertised", width:250, phone:"meta",
                      cell:l=>{
                        const v = canAdvertise(l, null, null);
                        const tone = v.ok ? (v.warnings.length ? "warning" : "positive") : "critical";
                        const text = v.ok
                          ? (v.warnings.length ? (v.warnings[0].note || "Cleared, but expiring") : "Cleared to advertise")
                          : v.summary;
                        return (
                          <span title={text} style={{ display:"flex", alignItems:"center", gap:S.sm, minWidth:0 }}>
                            <Dot tone={tone}/>
                            <span style={{ color:ST[tone].fg, overflow:"hidden",
                                           textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{text}</span>
                          </span>
                        );
                      }},
                    { key:"status", head:"Status", width:112, phone:"trail",
                      cell:l=><Chip>{l.status||"Available"}</Chip> },
                    { key:"price", head:"Price", width:118, align:"right", phone:"meta",
                      cell:l=><span style={{ ...TY.numeric, fontSize:13, color:l.price>0?C.text:C.textFaint }}>
                        {l.price > 0
                          ? (parseFloat(l.price)>=1e6
                              ? `AED ${(parseFloat(l.price)/1e6).toFixed(2)}M`
                              : `AED ${parseFloat(l.price).toLocaleString()}`)
                          : "Not set"}</span> },
                    { key:"spec", head:"Spec", width:130, phone:"meta",
                      cell:l=><span style={{ color:C.textMuted }}>
                        {[l.beds>0?`${l.beds} BR`:null, l.size>0?`${l.size.toLocaleString()} sqft`:null]
                          .filter(Boolean).join(" · ") || "—"}</span> },
                    /* The four portal buttons used to sit on every card. On a
                       forty-listing screen that is a hundred and sixty buttons
                       competing with the data they sit on. Posting happens in
                       the drawer, where it already did; the row reports the
                       result of it. */
                    { key:"posted", head:"Posted to", width:112, phone:"meta",
                      cell:l=>{ const n=(l.postedTo||l.publishedTo||[]).length;
                        return <span style={{ color:n?C.text:C.textFaint }}>
                          {n ? `${n} of ${PORTALS.length}` : "Nowhere"}</span>; } },
                    { key:"leads", head:"Leads", width:74, align:"right", wide:true, phone:"meta",
                      cell:l=><span style={{ ...TY.numeric, fontSize:13, color:l.leads>0?C.text:C.textFaint }}>
                        {l.leads||0}</span> },
                  ].filter(c=>!c.wide || width>=1500)}
                />
              )}

              {/* ── Listing Detail Drawer ── */}
              {selectedListing && (
                <div style={{ position:"fixed", inset:0, zIndex:1500, display:"flex" }} onClick={e=>{if(e.target===e.currentTarget)setSelectedListing(null);}}>
                  <div style={{ flex:1, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)" }} onClick={()=>setSelectedListing(null)}/>
                  <div style={{ width:460, background:T.bg, borderLeft:`1px solid ${T.border}`, overflowY:"auto", boxShadow:"-20px 0 60px rgba(0,0,0,0.4)" }}>
                    <div style={{ padding:"20px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:17, fontWeight:900, color:T.white }}>{selectedListing.title}</div>
                        <div style={{ fontSize:13, color:T.textMuted, marginTop:2 }}>{selectedListing.community}{"·"}{selectedListing.building} · Unit {selectedListing.unitNo}</div>
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
                        <div style={{ fontSize:13, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>Status</div>
                        <div style={{ display:"flex", gap:6 }}>
                          {Object.entries(STATUS_CFG).map(([s,sc])=>(
                            <button key={s} type="button" onClick={()=>updateListingStatus(selectedListing.id,s)}
                              style={{ flex:1, padding:"7px 0", borderRadius:7, border:`1px solid ${(selectedListing.status||"Available")===s?sc.color:T.border}`, background:(selectedListing.status||"Available")===s?sc.bg:"transparent", color:(selectedListing.status||"Available")===s?sc.color:T.textMuted, fontSize:13, fontWeight:600, cursor:"pointer" }}>
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
                          { label:"Permit No.",   value:selectedListing.permitNumber   },
                          { label:"Price (AED)",  value:selectedListing.price>0?parseFloat(selectedListing.price).toLocaleString():null },
                        ].filter(r=>r.value).map(({label,value})=>(
                          <div key={label} style={{ background:T.surfaceAlt, borderRadius:8, padding:"9px 12px" }}>
                            <div style={{ fontSize:12, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.7, marginBottom:3 }}>{label}</div>
                            <div style={{ fontSize:12, fontWeight:600, color:T.textPrimary }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      {/* Description */}
                      {selectedListing.description && (
                        <div style={{ background:T.surfaceAlt, borderRadius:8, padding:"10px 12px" }}>
                          <div style={{ fontSize:12, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.7, marginBottom:5 }}>Description</div>
                          <div style={{ fontSize:12, color:T.textSecondary, lineHeight:1.6 }}>{selectedListing.description}</div>
                        </div>
                      )}
                      {/* Portal syndication in drawer */}
                      <div>
                        <div style={{ fontSize:13, fontWeight:700, color:T.textMuted, textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>Publish to Portals</div>
                        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                          {PORTALS.map(portal => {
                            const isPublished = (selectedListing.publishedTo||[]).includes(portal.key);
                            return (
                              <div key={portal.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:isPublished?`${portal.color}0a`:T.surfaceAlt, border:`1px solid ${isPublished?portal.color:T.border}`, borderRadius:9 }}>
                                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                  <div style={{ width:8, height:8, borderRadius:"50%", background:portal.color }}/>
                                  <span style={{ fontSize:12, fontWeight:600, color:isPublished?portal.color:T.textPrimary }}>{portal.name}</span>
                                  {isPublished && <span style={{ fontSize:12, color:portal.color }}>Published</span>}
                                </div>
                                <button type="button"
                                  onClick={()=>markPosted(selectedListing.id, portal.key, portal.url)}
                                  title={POSTED_NOTE}
                                  style={{ padding:"5px 12px", borderRadius:6, border:`1px solid ${portal.color}40`, background:isPublished?`${portal.color}15`:"transparent", color:portal.color, fontSize:13, fontWeight:700, cursor:"pointer" }}>
                                  {isPublished ? "Republish" : "Publish →"}
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
                          <div style={{ fontSize:13, color:T.textMuted, marginTop:2 }}>Total Views</div>
                        </div>
                        <div style={{ background:T.surfaceAlt, borderRadius:8, padding:"12px", textAlign:"center" }}>
                          <div style={{ fontSize:24, fontWeight:900, color:T.teal, fontFamily:"'Fraunces',serif" }}>{selectedListing.leads||0}</div>
                          <div style={{ fontSize:13, color:T.textMuted, marginTop:2 }}>Leads Generated</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── New Listing Modal ── */}
              {showNewListing && (
                <div style={{ position:"fixed", inset:0, background:"rgba(4,9,15,0.85)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(8px)" }} onClick={e=>{if(e.target===e.currentTarget)setShowNewListing(false);}}>
                  <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.border}`, width:"95%", maxWidth:600, maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
                    <div style={{ padding:"22px 24px", borderBottom:`1px solid ${T.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:900, color:T.gold }}>New Listing</div>
                        <div style={{ fontSize:13, color:T.textMuted, marginTop:2 }}>All DLD required fields — get your Trakheesi permit before listing</div>
                      </div>
                      <button type="button" onClick={()=>setShowNewListing(false)}
                        style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:8, color:T.textMuted, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                      {/* Type selector */}
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:T.textMuted, marginBottom:8 }}>Property Type</div>
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {["Apartment","Villa","Townhouse","Penthouse","Office","Shop","Warehouse"].map(t=>(
                            <button key={t} type="button" onClick={()=>setListingForm(f=>({...f,type:t}))}
                              style={{ padding:"7px 12px", borderRadius:7, border:`1px solid ${listingForm.type===t?T.gold:T.border}`, background:listingForm.type===t?"rgba(212,168,67,0.1)":"transparent", color:listingForm.type===t?T.gold:T.textMuted, fontSize:13, fontWeight:600, cursor:"pointer" }}>
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Title */}
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Listing Title (auto-generated if empty)</div>
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
                            <div style={{ fontSize:13, fontWeight:600, color:T.textMuted, marginBottom:5 }}>{label}</div>
                            <input type={type||"text"} value={listingForm[key]||""} onChange={e=>setListingForm(f=>({...f,[key]:e.target.value}))}
                              placeholder={placeholder}
                              style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                          </div>
                        ))}
                      </div>
                      {/* Furnishing + Off-plan row */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Furnishing</div>
                          <select value={listingForm.furnishing||"Unfurnished"} onChange={e=>setListingForm(f=>({...f,furnishing:e.target.value}))}
                            style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid rgba(212,168,67,0.15)`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", cursor:"pointer" }}>
                            {["Unfurnished","Semi-Furnished","Fully Furnished"].map(v=><option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Trakheesi permit number</div>
                          <input value={listingForm.permitNumber||""} onChange={e=>setListingForm(f=>({...f,permitNumber:e.target.value}))}
                            placeholder="The number printed on the permit"
                            title="This number has to appear on the advert itself, and the advert has to match the permit."
                            style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid ${listingForm.permitNumber?"rgba(20,184,166,0.3)":"rgba(245,158,11,0.3)"}`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                        </div>
                      </div>

                      {/* THE TWO FIELDS THAT DID NOT EXIST.
                          The tab held a permit NUMBER but no expiry, so a lapsed
                          permit looked exactly like a live one and nothing could
                          warn anybody. And there was nowhere at all to record the
                          Form A — the document without which none of this may be
                          advertised in the first place. */}
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Permit expires on</div>
                          <input type="date" value={listingForm.permitExpiresAt||""}
                            onChange={e=>setListingForm(f=>({...f,permitExpiresAt:e.target.value}))}
                            title="Without this nobody can be warned before the permit lapses, and an advert running on a lapsed permit is a violation from that day."
                            style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid ${T.border}`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                        </div>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Form A signed on</div>
                          <input type="date" value={listingForm.formASignedAt||""}
                            onChange={e=>setListingForm(f=>({...f,formASignedAt:e.target.value}))}
                            title="The owner's written appointment of your agency. Nothing may be advertised without it — no portal, no social media, no billboard."
                            style={{ width:"100%", padding:"10px 14px", background:T.bg, border:`1px solid ${listingForm.formASignedAt?"rgba(20,184,166,0.3)":"rgba(245,158,11,0.3)"}`, borderRadius:9, color:T.textPrimary, fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" }}/>
                        </div>
                      </div>
                      {/* Permit warning */}
                      {!listingForm.permitNumber && (
                        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={ST.warning.fg} strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                          <span style={{ fontSize:13, color:ST.warning.fg }}>DLD requires a Trakheesi permit before publishing to Property Finder, Bayut, or Dubizzle</span>
                        </div>
                      )}
                      {/* Description */}
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:T.textMuted, marginBottom:5 }}>Description</div>
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
            {_copy?.provenance && <TabProvenance {..._copy.provenance}/>}
            </>);
}

export default ListingsTab;
