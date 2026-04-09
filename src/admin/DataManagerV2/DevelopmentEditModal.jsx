import React, { useState } from "react";
import { C, btnStyles, inputStyle, cardStyle } from "./tokens";

// Shared constants with parent
const COMMUNITIES = [
  "Downtown Dubai", "Dubai Marina", "Business Bay", "Dubai Hills Estate",
  "Dubai Creek Harbour", "Emaar Beachfront", "Palm Jumeirah", "JVC",
  "JVT", "Arabian Ranches 3", "Emaar South", "The Valley", "The Oasis",
  "Expo City Dubai", "MBR City", "Meydan", "Dubai South", "Tilal Al Ghaf",
  "Al Furjan", "DAMAC Hills", "DAMAC Hills 2", "Dubailand", "Mina Rashid",
  "Town Square", "Mudon", "Bluewaters", "City Walk", "Al Barsha",
];
const SALE_STATUS = ["off-plan", "ready", "secondary", "sold-out", "coming-soon"];
const CONSTRUCTION_STATUS = ["pre-launch", "under-construction", "completed", "handover-ready"];
const TENURE = ["freehold", "leasehold", "usufruct", "musataha", "grant"];
const VISIBILITY = ["draft", "published", "archived"];
const DLD_CLASS = ["land", "unit", "villa"];
const ZONING = ["R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8", "R9", "C1", "C2", "C3", "M1", "M2", "SP", "OS"];
const DLD_STAR = [0, 1, 2, 3, 4, 5];
const AMENITY_OPTIONS = [
  "Swimming Pool", "Gym", "Spa", "Sauna", "Steam Room", "Concierge", "Valet Parking",
  "Kids Play Area", "Nursery", "Tennis Court", "Squash Court", "Basketball Court",
  "Running Track", "BBQ Area", "Garden", "Park", "Private Beach", "Marina Access",
  "Retail Outlets", "Restaurants", "Cafe", "Business Centre", "Meeting Rooms",
  "Cinema Room", "Games Room", "Library", "Yoga Studio", "Pet-Friendly", "Security 24/7",
  "Covered Parking", "Electric Car Charging",
];
const VIEW_OPTIONS = [
  "Sea View", "Marina View", "Burj Khalifa View", "Downtown View", "Golf View",
  "Park View", "City View", "Garden View", "Canal View", "Lagoon View",
  "Mountain View", "Desert View", "Boulevard View", "Courtyard View", "Community View",
];
const LIFESTYLE_OPTIONS = [
  "Family", "Investor", "Luxury", "Branded", "Beachfront", "Golf", "Eco",
  "Smart Home", "Wellness", "Heritage", "Urban", "Suburban", "Waterfront",
];

export default function DevelopmentEditModal({ initial, developers, onClose, onSave, saving }) {
  const [tab, setTab] = useState("basic");
  const [form, setForm] = useState({
    // Basic
    name: "", arabicName: "", slug: "",
    developerId: "", description: "",
    saleStatus: "off-plan", constructionStatus: "pre-launch",
    constructionPct: 0, visibility: "draft",
    dldClass: "unit",
    // Location
    country: "AE", emirate: "Dubai",
    community: "", subCommunity: "",
    address: "",
    coordinates: { lat: "", lng: "" },
    metroDistanceKm: 0, nearestMetroStation: "",
    beachAccess: false,
    tenure: "freehold", foreignOwnershipAllowed: true,
    zoningCode: "",
    // Regulatory
    reraProjectNumber: "", reraDeveloperNumber: "", trakheesiPermit: "",
    dldRegistered: false,
    escrowAccount: "", escrowBank: "", escrowFundedPct: 0,
    lastReraInspection: "", reraInspectionsPassed: 0, reraInspectionsFailed: 0,
    dldStarRating: 0,
    launchDate: "", eoiDeadline: "",
    contractedHandover: "", expectedHandover: "", actualHandover: "",
    // Media
    coverImageUrl: "",
    images: [],
    floorPlanUrl: "", brochureUrl: "", videoUrl: "", virtualTourUrl: "",
    // Amenities
    tags: [],
    amenities: [],
    views: [],
    lifestyle: [],
    ...initial,
  });

  function update(field, value) { setForm(f => ({ ...f, [field]: value })); }
  function updateCoord(key, value) { setForm(f => ({ ...f, coordinates: { ...f.coordinates, [key]: value } })); }
  function toggleArr(field, value) {
    setForm(f => {
      const arr = f[field] || [];
      return { ...f, [field]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] };
    });
  }

  const tabs = [
    { id: "basic",      label: "Basic Info",   color: C.gold },
    { id: "location",   label: "Location",     color: C.teal },
    { id: "regulatory", label: "Regulatory",   color: C.blue },
    { id: "media",      label: "Media",        color: C.purple },
    { id: "amenities",  label: "Amenities",    color: C.cyan },
  ];

  // Publish readiness checklist
  const publishChecklist = [
    { ok: !!form.name, label: "Name" },
    { ok: !!form.developerId, label: "Developer" },
    { ok: !!form.community, label: "Community" },
    { ok: !!(form.coordinates?.lat && form.coordinates?.lng), label: "Coordinates" },
    { ok: !!form.reraProjectNumber, label: "RERA Project Number" },
    { ok: !!form.coverImageUrl, label: "Cover Image" },
  ];
  const readyToPublish = publishChecklist.every(c => c.ok);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }} onClick={onClose}>
      <div style={{ background: C.s1, border: "1px solid " + C.borderG, borderRadius: 12, maxWidth: 950, width: "100%", maxHeight: "92vh", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 28px 0 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: C.gold, fontFamily: "'Fraunces',serif", fontWeight: 600 }}>
              {initial.id ? "Edit Development" : "New Development"}
              {form.name && <span style={{ marginLeft: 10, fontSize: 13, color: C.w, fontWeight: 400 }}>: {form.name}</span>}
            </h3>
            <div style={{ fontSize: 10, padding: "4px 10px", background: readyToPublish ? C.greenD : C.amberD, color: readyToPublish ? C.green : C.amber, borderRadius: 4, fontWeight: 600 }}>
              {readyToPublish ? "READY TO PUBLISH" : publishChecklist.filter(c => !c.ok).length + " fields missing to publish"}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, borderBottom: "1px solid " + C.border }}>
            {tabs.map(t => (
              <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{
                padding: "10px 16px",
                background: "transparent",
                border: "none",
                borderBottom: tab === t.id ? "2px solid " + t.color : "2px solid transparent",
                color: tab === t.id ? t.color : C.t2,
                fontSize: 12,
                fontWeight: tab === t.id ? 600 : 400,
                fontFamily: C.ff,
                cursor: "pointer",
                marginBottom: -1,
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 28, overflow: "auto", flex: 1 }}>
          {tab === "basic" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input style={inputStyle} value={form.name} onChange={e => update("name", e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Arabic Name</label>
                  <input style={inputStyle} value={form.arabicName} onChange={e => update("arabicName", e.target.value)} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Developer *</label>
                <select style={inputStyle} value={form.developerId} onChange={e => update("developerId", e.target.value)}>
                  <option value="">-- Select developer --</option>
                  {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.description || ""} onChange={e => update("description", e.target.value)} placeholder="Brief description of the development..." />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Sale Status</label>
                  <select style={inputStyle} value={form.saleStatus} onChange={e => update("saleStatus", e.target.value)}>
                    {SALE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Construction</label>
                  <select style={inputStyle} value={form.constructionStatus} onChange={e => update("constructionStatus", e.target.value)}>
                    {CONSTRUCTION_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Completion %</label>
                  <input style={inputStyle} type="number" min="0" max="100" value={form.constructionPct} onChange={e => update("constructionPct", parseInt(e.target.value) || 0)} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Visibility</label>
                  <select style={inputStyle} value={form.visibility} onChange={e => update("visibility", e.target.value)}>
                    {VISIBILITY.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>DLD Class</label>
                  <select style={inputStyle} value={form.dldClass} onChange={e => update("dldClass", e.target.value)}>
                    {DLD_CLASS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {tab === "location" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Community *</label>
                  <select style={inputStyle} value={form.community} onChange={e => update("community", e.target.value)}>
                    <option value="">-- Select community --</option>
                    {COMMUNITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Sub-Community</label>
                  <input style={inputStyle} value={form.subCommunity} onChange={e => update("subCommunity", e.target.value)} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Address</label>
                <input style={inputStyle} value={form.address} onChange={e => update("address", e.target.value)} placeholder="Street address (optional for off-plan)" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Latitude *</label>
                  <input style={inputStyle} type="number" step="0.0001" value={form.coordinates?.lat || ""} onChange={e => updateCoord("lat", parseFloat(e.target.value) || "")} placeholder="25.0" />
                </div>
                <div>
                  <label style={labelStyle}>Longitude *</label>
                  <input style={inputStyle} type="number" step="0.0001" value={form.coordinates?.lng || ""} onChange={e => updateCoord("lng", parseFloat(e.target.value) || "")} placeholder="55.2" />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Metro Distance (km)</label>
                  <input style={inputStyle} type="number" step="0.1" min="0" value={form.metroDistanceKm} onChange={e => update("metroDistanceKm", parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <label style={labelStyle}>Nearest Metro Station</label>
                  <input style={inputStyle} value={form.nearestMetroStation} onChange={e => update("nearestMetroStation", e.target.value)} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Tenure</label>
                  <select style={inputStyle} value={form.tenure} onChange={e => update("tenure", e.target.value)}>
                    {TENURE.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Zoning Code</label>
                  <select style={inputStyle} value={form.zoningCode} onChange={e => update("zoningCode", e.target.value)}>
                    <option value="">-- Select --</option>
                    {ZONING.map(z => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 18 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.t2 }}>
                    <input type="checkbox" checked={!!form.foreignOwnershipAllowed} onChange={e => update("foreignOwnershipAllowed", e.target.checked)} />
                    Foreign ownership allowed
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.t2 }}>
                    <input type="checkbox" checked={!!form.beachAccess} onChange={e => update("beachAccess", e.target.checked)} />
                    Beach access
                  </label>
                </div>
              </div>
            </div>
          )}

          {tab === "regulatory" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>RERA Project # *</label>
                  <input style={inputStyle} value={form.reraProjectNumber} onChange={e => update("reraProjectNumber", e.target.value)} placeholder="1234" />
                </div>
                <div>
                  <label style={labelStyle}>RERA Developer #</label>
                  <input style={inputStyle} value={form.reraDeveloperNumber} onChange={e => update("reraDeveloperNumber", e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Trakheesi Permit</label>
                  <input style={inputStyle} value={form.trakheesiPermit} onChange={e => update("trakheesiPermit", e.target.value)} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 20, padding: "10px 0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.t2 }}>
                  <input type="checkbox" checked={!!form.dldRegistered} onChange={e => update("dldRegistered", e.target.checked)} />
                  DLD Registered
                </label>
                <div style={{ marginLeft: "auto" }}>
                  <label style={{ ...labelStyle, display: "inline-block", marginRight: 8 }}>DLD Stars</label>
                  <select style={{ ...inputStyle, width: 80, display: "inline-block" }} value={form.dldStarRating} onChange={e => update("dldStarRating", parseInt(e.target.value) || 0)}>
                    {DLD_STAR.map(s => <option key={s} value={s}>{s === 0 ? "-" : "★".repeat(s)}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ padding: 14, background: C.s2, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: C.teal, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Escrow</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Escrow Account #</label>
                    <input style={inputStyle} value={form.escrowAccount} onChange={e => update("escrowAccount", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Escrow Bank</label>
                    <input style={inputStyle} value={form.escrowBank} onChange={e => update("escrowBank", e.target.value)} placeholder="Emirates NBD, Mashreq..." />
                  </div>
                  <div>
                    <label style={labelStyle}>Funded %</label>
                    <input style={inputStyle} type="number" min="0" max="100" value={form.escrowFundedPct} onChange={e => update("escrowFundedPct", parseInt(e.target.value) || 0)} />
                  </div>
                </div>
              </div>

              <div style={{ padding: 14, background: C.s2, borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: C.blue, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Timeline</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Launch Date</label>
                    <input style={inputStyle} type="date" value={form.launchDate || ""} onChange={e => update("launchDate", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>EOI Deadline</label>
                    <input style={inputStyle} type="date" value={form.eoiDeadline || ""} onChange={e => update("eoiDeadline", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Contracted Handover</label>
                    <input style={inputStyle} type="date" value={form.contractedHandover || ""} onChange={e => update("contractedHandover", e.target.value)} />
                  </div>
                  <div>
                    <label style={labelStyle}>Expected Handover</label>
                    <input style={inputStyle} type="date" value={form.expectedHandover || ""} onChange={e => update("expectedHandover", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "media" && (
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={labelStyle}>Cover Image URL *</label>
                <input style={inputStyle} value={form.coverImageUrl} onChange={e => update("coverImageUrl", e.target.value)} placeholder="https://..." />
                {form.coverImageUrl && (
                  <div style={{ marginTop: 8 }}>
                    <img src={form.coverImageUrl} alt="" style={{ width: "100%", maxWidth: 400, borderRadius: 8, border: "1px solid " + C.border }} onError={e => e.target.style.display = "none"} />
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Gallery Images (comma-separated URLs)</label>
                <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={(form.images || []).join(", ")} onChange={e => update("images", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} placeholder="https://..., https://..." />
                <div style={{ fontSize: 10, color: C.m, marginTop: 4 }}>{(form.images || []).length} images</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>Floor Plan URL</label>
                  <input style={inputStyle} value={form.floorPlanUrl} onChange={e => update("floorPlanUrl", e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Brochure PDF URL</label>
                  <input style={inputStyle} value={form.brochureUrl} onChange={e => update("brochureUrl", e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Video URL (YouTube/Vimeo)</label>
                  <input style={inputStyle} value={form.videoUrl} onChange={e => update("videoUrl", e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Virtual Tour URL</label>
                  <input style={inputStyle} value={form.virtualTourUrl} onChange={e => update("virtualTourUrl", e.target.value)} placeholder="Matterport, 360..." />
                </div>
              </div>
            </div>
          )}

          {tab === "amenities" && (
            <div style={{ display: "grid", gap: 18 }}>
              <div>
                <label style={{ ...labelStyle, marginBottom: 8 }}>Amenities ({(form.amenities || []).length} selected)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {AMENITY_OPTIONS.map(a => {
                    const on = (form.amenities || []).includes(a);
                    return (
                      <button key={a} type="button" onClick={() => toggleArr("amenities", a)} style={{ padding: "6px 12px", background: on ? C.tealD : C.s2, color: on ? C.teal : C.t2, border: "1px solid " + (on ? C.teal : C.border), borderRadius: 16, fontSize: 11, cursor: "pointer", fontFamily: C.ff }}>
                        {on ? "✓ " : ""}{a}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ ...labelStyle, marginBottom: 8 }}>Views ({(form.views || []).length} selected)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {VIEW_OPTIONS.map(v => {
                    const on = (form.views || []).includes(v);
                    return (
                      <button key={v} type="button" onClick={() => toggleArr("views", v)} style={{ padding: "6px 12px", background: on ? C.blueD : C.s2, color: on ? C.blue : C.t2, border: "1px solid " + (on ? C.blue : C.border), borderRadius: 16, fontSize: 11, cursor: "pointer", fontFamily: C.ff }}>
                        {on ? "✓ " : ""}{v}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ ...labelStyle, marginBottom: 8 }}>Lifestyle Tags ({(form.lifestyle || []).length} selected)</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {LIFESTYLE_OPTIONS.map(l => {
                    const on = (form.lifestyle || []).includes(l);
                    return (
                      <button key={l} type="button" onClick={() => toggleArr("lifestyle", l)} style={{ padding: "6px 12px", background: on ? C.goldD : C.s2, color: on ? C.gold : C.t2, border: "1px solid " + (on ? C.gold : C.border), borderRadius: 16, fontSize: 11, cursor: "pointer", fontFamily: C.ff }}>
                        {on ? "✓ " : ""}{l}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Custom Tags (comma-separated)</label>
                <input style={inputStyle} value={(form.tags || []).join(", ")} onChange={e => update("tags", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} placeholder="trending, new-launch, handover-2026..." />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", padding: "16px 28px", borderTop: "1px solid " + C.border, background: C.s2 }}>
          <div style={{ fontSize: 11, color: C.t2 }}>
            {publishChecklist.filter(c => !c.ok).length > 0 && (
              <span>Missing: {publishChecklist.filter(c => !c.ok).map(c => c.label).join(", ")}</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={btnStyles("ghost", saving)} onClick={onClose} disabled={saving}>Cancel</button>
            <button style={btnStyles("primary", saving)} onClick={() => onSave(form)} disabled={saving}>
              {saving ? "Saving..." : initial.id ? "Save Changes" : "Create Development"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 10,
  color: "#94A3B8",
  marginBottom: 4,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};