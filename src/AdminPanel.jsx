import React, { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { auth, db, storage, firebaseConfig } from "./firebase";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import emailjs from "@emailjs/browser";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, onSnapshot, query, orderBy, limit, where, addDoc, startAfter } from "firebase/firestore";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { emaarProjects, emaarCommunities, emaarYields, communityROI as defaultCommunityROI, communityIntel as defaultCommunityIntel } from "./data";
import ProjectManager from "./ProjectManager";
import { useI18n, LANGUAGES } from "./i18n";

/* ═══════════════════════════════════════════════════════
   EMAIL CAMPAIGNS TAB
   ═══════════════════════════════════════════════════════ */
function EmailCampaignsTab({ T, db, notify, adminUser, leads, leadsTotal, fetchLeads }) {
  const [campaigns, setCampaigns]       = React.useState([]);
  const [showCreate, setShowCreate]     = React.useState(false);
  const [sending, setSending]           = React.useState(false);
  const [sendProgress, setSendProgress] = React.useState(0);
  const [sendTotal, setSendTotal]       = React.useState(0);
  const [selectedCampaign, setSelectedCampaign] = React.useState(null);
  const [form, setForm] = React.useState({ name: "", subject: "", body: "", targetFilter: "all", targetCommunity: "", targetStatus: "", template: "custom" });

  const TEMPLATES = [
    { id: "followup", label: "Follow-up", subject: "Following up on your interest in {community}", body: "Dear {name},\n\nI wanted to follow up on your interest in {community}.\n\nBest regards,\nThe Address Holding Team" },
    { id: "golden_visa", label: "Golden Visa", subject: "You may qualify for a UAE Golden Visa", body: "Dear {name},\n\nBased on your interest in {community}, you may qualify for a UAE Golden Visa.\n\nBest regards,\nThe Address Holding Team" },
    { id: "market_update", label: "Market Update", subject: "Dubai Property Market Update — {community}", body: "Dear {name},\n\nThe Dubai property market continues to show strong growth in {community}.\n\nBest regards,\nThe Address Holding Team" },
    { id: "new_launch", label: "New Launch", subject: "Exclusive New Launch — {community}", body: "Dear {name},\n\nWe have an exciting new project launch in {community}.\n\nBest regards,\nThe Address Holding Team" },
    { id: "reengagement", label: "Re-engagement", subject: "We miss you — special offer inside", body: "Dear {name},\n\nIt\'s been a while since we connected regarding your property search in {community}.\n\nBest regards,\nThe Address Holding Team" },
  ];

  React.useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(query(collection(db, "campaigns"), orderBy("createdAt", "desc"), limit(50)));
        const list = []; snap.forEach(d => list.push({ id: d.id, ...d.data() })); setCampaigns(list);
      } catch(e) { console.error("Load campaigns:", e); }
    };
    load();
  }, []);

  const getTargetLeads = () => {
    let targets = (leads||[]).filter(l => l.email && l.email.includes("@"));
    if (form.targetFilter === "community" && form.targetCommunity) targets = targets.filter(l => l.community === form.targetCommunity);
    if (form.targetFilter === "status" && form.targetStatus) targets = targets.filter(l => (l.status||"New") === form.targetStatus);
    return targets;
  };

  const communities = [...new Set((leads||[]).filter(l=>l.community).map(l=>l.community))].sort();
  const targetLeads = getTargetLeads();
  const inputStyle = { width:"100%", padding:"10px 14px", background:T.bg, border:"1px solid rgba(212,168,67,0.15)", borderRadius:9, color:"#E2E8F0", fontSize:13, fontFamily:"'Outfit',sans-serif", outline:"none", boxSizing:"border-box" };

  const RESEND_API_KEY = "re_FGZe2ET2_9pDv9iEV2MUTQXg1QHJeV3fs";

  const sendWithResend = async (to, subject, html) => {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "DXB Analytics <onboarding@resend.dev>", to, subject, html }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  const sendCampaign = async () => {
    if (!form.name || !form.subject || !form.body) { notify("Fill in campaign name, subject and message"); return; }
    const targets = getTargetLeads();
    if (targets.length === 0) { notify("No leads match the filter with valid emails"); return; }
    setSending(true); setSendProgress(0); setSendTotal(targets.length);
    const campaignId = `camp_${Date.now()}`;
    const campaignDoc = { name: form.name, subject: form.subject, template: form.template, targetFilter: form.targetFilter, targetCommunity: form.targetCommunity, targetStatus: form.targetStatus, totalTargets: targets.length, sent: 0, failed: 0, status: "sending", createdAt: new Date().toISOString(), sentBy: adminUser?.email || "admin" };
    try { await setDoc(doc(db, "campaigns", campaignId), campaignDoc); } catch(e) {}
    let sent = 0; let failed = 0; const BATCH = 10;
    for (let i = 0; i < targets.length; i += BATCH) {
      const chunk = targets.slice(i, i + BATCH);
      await Promise.allSettled(chunk.map(async lead => {
        try {
          const bodyText = form.body.replace(/\{name\}/g, lead.name||"there").replace(/\{community\}/g, lead.community||"Dubai").replace(/\{project\}/g, lead.project||"your property");
          const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <div style="border-bottom:2px solid #D4A843;padding-bottom:12px;margin-bottom:20px">
              <h2 style="color:#D4A843;margin:0;font-size:20px">DXB Analytics</h2>
              <p style="color:#64748B;margin:4px 0 0;font-size:12px">The Address Holding · Dubai</p>
            </div>
            <div style="color:#1E293B;font-size:14px;line-height:1.7;white-space:pre-wrap">${bodyText}</div>
            <div style="border-top:1px solid #E2E8F0;margin-top:24px;padding-top:16px;color:#94A3B8;font-size:11px">
              DXB Analytics · The Address Holding · Dubai, UAE<br/>
              <a href="mailto:info@theaddressholding.ae" style="color:#D4A843">info@theaddressholding.ae</a>
            </div>
          </div>`;
          await sendWithResend(lead.email, form.subject, html);
          sent++;
        } catch(e) { failed++; }
      }));
      setSendProgress(Math.min(i + BATCH, targets.length));
      await new Promise(r => setTimeout(r, 200));
    }
    try { await setDoc(doc(db, "campaigns", campaignId), { ...campaignDoc, sent, failed, status: "completed", completedAt: new Date().toISOString() }, { merge: true }); } catch(e) {}
    setSending(false); notify(`✅ Campaign sent — ${sent} delivered, ${failed} failed`);
    setShowCreate(false); setForm({ name:"", subject:"", body:"", targetFilter:"all", targetCommunity:"", targetStatus:"", template:"custom" });
    try { const snap = await getDocs(query(collection(db, "campaigns"), orderBy("createdAt", "desc"), limit(50))); const list = []; snap.forEach(d => list.push({ id: d.id, ...d.data() })); setCampaigns(list); } catch(e) {}
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <h2 style={{ fontFamily:"'Fraunces',serif", fontSize:26, fontWeight:800, color:"#FFFFFF", margin:0 }}>Email Campaigns</h2>
          <p style={{ fontSize:13, color:T.textMuted, margin:"4px 0 0" }}>{(leads||[]).filter(l=>l.email).length.toLocaleString()} leads with emails · {(leadsTotal||0).toLocaleString()} total</p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} style={{ padding:"10px 20px", borderRadius:10, border:"none", background:`linear-gradient(135deg, ${T.gold}, #B8912F)`, color:T.bg, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>+ New Campaign</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
        {[["🇦🇫 Afghanistan","+93"],["🇦🇱 Albania","+355"],["🇩🇿 Algeria","+213"],["🇦🇩 Andorra","+376"],["🇦🇴 Angola","+244"],["🇦🇬 Antigua & Barbuda","+1268"],["🇦🇷 Argentina","+54"],["🇦🇲 Armenia","+374"],["🇦🇺 Australia","+61"],["🇦🇹 Austria","+43"],["🇦🇿 Azerbaijan","+994"],["🇧🇸 Bahamas","+1242"],["🇧🇭 Bahrain","+973"],["🇧🇩 Bangladesh","+880"],["🇧🇧 Barbados","+1246"],["🇧🇾 Belarus","+375"],["🇧🇪 Belgium","+32"],["🇧🇿 Belize","+501"],["🇧🇯 Benin","+229"],["🇧🇹 Bhutan","+975"],["🇧🇴 Bolivia","+591"],["🇧🇦 Bosnia & Herzegovina","+387"],["🇧🇼 Botswana","+267"],["🇧🇷 Brazil","+55"],["🇧🇳 Brunei","+673"],["🇧🇬 Bulgaria","+359"],["🇧🇫 Burkina Faso","+226"],["🇧🇮 Burundi","+257"],["🇨🇻 Cabo Verde","+238"],["🇰🇭 Cambodia","+855"],["🇨🇲 Cameroon","+237"],["🇨🇦 Canada","+1"],["🇨🇫 Central African Republic","+236"],["🇹🇩 Chad","+235"],["🇨🇱 Chile","+56"],["🇨🇳 China","+86"],["🇨🇴 Colombia","+57"],["🇰🇲 Comoros","+269"],["🇨🇩 Congo (DRC)","+243"],["🇨🇬 Congo (Republic)","+242"],["🇨🇷 Costa Rica","+506"],["🇭🇷 Croatia","+385"],["🇨🇺 Cuba","+53"],["🇨🇾 Cyprus","+357"],["🇨🇿 Czech Republic","+420"],["🇩🇰 Denmark","+45"],["🇩🇯 Djibouti","+253"],["🇩🇲 Dominica","+1767"],["🇩🇴 Dominican Republic","+1809"],["🇪🇨 Ecuador","+593"],["🇪🇬 Egypt","+20"],["🇸🇻 El Salvador","+503"],["🇬🇶 Equatorial Guinea","+240"],["🇪🇷 Eritrea","+291"],["🇪🇪 Estonia","+372"],["🇸🇿 Eswatini","+268"],["🇪🇹 Ethiopia","+251"],["🇫🇯 Fiji","+679"],["🇫🇮 Finland","+358"],["🇫🇷 France","+33"],["🇬🇦 Gabon","+241"],["🇬🇲 Gambia","+220"],["🇬🇪 Georgia","+995"],["🇩🇪 Germany","+49"],["🇬🇭 Ghana","+233"],["🇬🇷 Greece","+30"],["🇬🇩 Grenada","+1473"],["🇬🇹 Guatemala","+502"],["🇬🇳 Guinea","+224"],["🇬🇼 Guinea-Bissau","+245"],["🇬🇾 Guyana","+592"],["🇭🇹 Haiti","+509"],["🇭🇳 Honduras","+504"],["🇭🇰 Hong Kong","+852"],["🇭🇺 Hungary","+36"],["🇮🇸 Iceland","+354"],["🇮🇳 India","+91"],["🇮🇩 Indonesia","+62"],["🇮🇷 Iran","+98"],["🇮🇶 Iraq","+964"],["🇮🇪 Ireland","+353"],["🇮🇱 Israel","+972"],["🇮🇹 Italy","+39"],["🇨🇮 Ivory Coast","+225"],["🇯🇲 Jamaica","+1876"],["🇯🇵 Japan","+81"],["🇯🇴 Jordan","+962"],["🇰🇿 Kazakhstan","+7"],["🇰🇪 Kenya","+254"],["🇰🇮 Kiribati","+686"],["🇽🇰 Kosovo","+383"],["🇰🇼 Kuwait","+965"],["🇰🇬 Kyrgyzstan","+996"],["🇱🇦 Laos","+856"],["🇱🇻 Latvia","+371"],["🇱🇧 Lebanon","+961"],["🇱🇸 Lesotho","+266"],["🇱🇷 Liberia","+231"],["🇱🇾 Libya","+218"],["🇱🇮 Liechtenstein","+423"],["🇱🇹 Lithuania","+370"],["🇱🇺 Luxembourg","+352"],["🇲🇬 Madagascar","+261"],["🇲🇼 Malawi","+265"],["🇲🇾 Malaysia","+60"],["🇲🇻 Maldives","+960"],["🇲🇱 Mali","+223"],["🇲🇹 Malta","+356"],["🇲🇭 Marshall Islands","+692"],["🇲🇷 Mauritania","+222"],["🇲🇺 Mauritius","+230"],["🇲🇽 Mexico","+52"],["🇫🇲 Micronesia","+691"],["🇲🇩 Moldova","+373"],["🇲🇨 Monaco","+377"],["🇲🇳 Mongolia","+976"],["🇲🇪 Montenegro","+382"],["🇲🇦 Morocco","+212"],["🇲🇿 Mozambique","+258"],["🇲🇲 Myanmar","+95"],["🇳🇦 Namibia","+264"],["🇳🇷 Nauru","+674"],["🇳🇵 Nepal","+977"],["🇳🇱 Netherlands","+31"],["🇳🇿 New Zealand","+64"],["🇳🇮 Nicaragua","+505"],["🇳🇪 Niger","+227"],["🇳🇬 Nigeria","+234"],["🇲🇰 North Macedonia","+389"],["🇰🇵 North Korea","+850"],["🇳🇴 Norway","+47"],["🇴🇲 Oman","+968"],["🇵🇰 Pakistan","+92"],["🇵🇼 Palau","+680"],["🇵🇸 Palestine","+970"],["🇵🇦 Panama","+507"],["🇵🇬 Papua New Guinea","+675"],["🇵🇾 Paraguay","+595"],["🇵🇪 Peru","+51"],["🇵🇭 Philippines","+63"],["🇵🇱 Poland","+48"],["🇵🇹 Portugal","+351"],["🇶🇦 Qatar","+974"],["🇷🇴 Romania","+40"],["🇷🇺 Russia","+7"],["🇷🇼 Rwanda","+250"],["🇰🇳 Saint Kitts & Nevis","+1869"],["🇱🇨 Saint Lucia","+1758"],["🇻🇨 Saint Vincent & Grenadines","+1784"],["🇼🇸 Samoa","+685"],["🇸🇲 San Marino","+378"],["🇸🇹 São Tomé & Príncipe","+239"],["🇸🇦 Saudi Arabia","+966"],["🇸🇳 Senegal","+221"],["🇷🇸 Serbia","+381"],["🇸🇨 Seychelles","+248"],["🇸🇱 Sierra Leone","+232"],["🇸🇬 Singapore","+65"],["🇸🇰 Slovakia","+421"],["🇸🇮 Slovenia","+386"],["🇸🇧 Solomon Islands","+677"],["🇸🇴 Somalia","+252"],["🇿🇦 South Africa","+27"],["🇸🇸 South Sudan","+211"],["🇪🇸 Spain","+34"],["🇱🇰 Sri Lanka","+94"],["🇸🇩 Sudan","+249"],["🇸🇷 Suriname","+597"],["🇸🇪 Sweden","+46"],["🇨🇭 Switzerland","+41"],["🇸🇾 Syria","+963"],["🇹🇼 Taiwan","+886"],["🇹🇯 Tajikistan","+992"],["🇹🇿 Tanzania","+255"],["🇹🇭 Thailand","+66"],["🇹🇱 Timor-Leste","+670"],["🇹🇬 Togo","+228"],["🇹🇴 Tonga","+676"],["🇹🇹 Trinidad & Tobago","+1868"],["🇹🇳 Tunisia","+216"],["🇹🇷 Turkey","+90"],["🇹🇲 Turkmenistan","+993"],["🇹🇻 Tuvalu","+688"],["🇺🇬 Uganda","+256"],["🇺🇦 Ukraine","+380"],["🇦🇪 UAE","+971"],["🇬🇧 United Kingdom","+44"],["🇺🇸 United States","+1"],["🇺🇾 Uruguay","+598"],["🇺🇿 Uzbekistan","+998"],["🇻🇺 Vanuatu","+678"],["🇻🇦 Vatican City","+39066"],["🇻🇪 Venezuela","+58"],["🇻🇳 Vietnam","+84"],["🇾🇪 Yemen","+967"],["🇿🇲 Zambia","+260"],["🇿🇼 Zimbabwe","+263"]].sort((a,b)=>a[0].localeCompare(b[0])).map(([n,c]) => <option key={c+n} value={c}>{n} ({c})</option>)}
            </select>
            <input type="tel" placeholder="50 123 4567" value={addUserForm.phoneNum || ""}
              onChange={e => { const num = e.target.value.replace(/[^\d\s]/g,""); setAddUserForm(p => ({ ...p, phoneNum: num, phone: (p.phoneCode||"+971") + num.replace(/\s/g,"") })); }}
              style={{ flex: 1, padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Access Tier</label>
          <select value={addUserForm.tier || "free"} onChange={e => setAddUserForm(p => ({ ...p, tier: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
            <option value="free">Free</option>
            <option value="pro_trial">Pro Trial</option>
            <option value="pro">Pro · AED 99</option>
            <option value="enterprise">Enterprise · AED 499</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Job Role</label>
          <select value={addUserForm.role || "user"} onChange={e => setAddUserForm(p => ({ ...p, role: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
            <option value="user">— No role —</option>
            <option value="agent">Real Estate Agent</option>
            <option value="sales_manager">Sales Manager</option>
            <option value="broker">Broker</option>
            <option value="property_manager">Property Manager</option>
            <option value="investor">Investor</option>
            <option value="developer">Developer</option>
            <option value="staff">Platform Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Country</label>
          <select value={addUserForm.country || ""} onChange={e => setAddUserForm(p => ({ ...p, country: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: addUserForm.country ? T.white : T.textMuted, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
            <option value="">Select country...</option>
            {[["🇦🇫 Afghanistan","+93"],["🇦🇱 Albania","+355"],["🇩🇿 Algeria","+213"],["🇦🇩 Andorra","+376"],["🇦🇴 Angola","+244"],["🇦🇬 Antigua & Barbuda","+1268"],["🇦🇷 Argentina","+54"],["🇦🇲 Armenia","+374"],["🇦🇺 Australia","+61"],["🇦🇹 Austria","+43"],["🇦🇿 Azerbaijan","+994"],["🇧🇸 Bahamas","+1242"],["🇧🇭 Bahrain","+973"],["🇧🇩 Bangladesh","+880"],["🇧🇧 Barbados","+1246"],["🇧🇾 Belarus","+375"],["🇧🇪 Belgium","+32"],["🇧🇿 Belize","+501"],["🇧🇯 Benin","+229"],["🇧🇹 Bhutan","+975"],["🇧🇴 Bolivia","+591"],["🇧🇦 Bosnia & Herzegovina","+387"],["🇧🇼 Botswana","+267"],["🇧🇷 Brazil","+55"],["🇧🇳 Brunei","+673"],["🇧🇬 Bulgaria","+359"],["🇧🇫 Burkina Faso","+226"],["🇧🇮 Burundi","+257"],["🇨🇻 Cabo Verde","+238"],["🇰🇭 Cambodia","+855"],["🇨🇲 Cameroon","+237"],["🇨🇦 Canada","+1"],["🇨🇫 Central African Republic","+236"],["🇹🇩 Chad","+235"],["🇨🇱 Chile","+56"],["🇨🇳 China","+86"],["🇨🇴 Colombia","+57"],["🇰🇲 Comoros","+269"],["🇨🇩 Congo (DRC)","+243"],["🇨🇬 Congo (Republic)","+242"],["🇨🇷 Costa Rica","+506"],["🇭🇷 Croatia","+385"],["🇨🇺 Cuba","+53"],["🇨🇾 Cyprus","+357"],["🇨🇿 Czech Republic","+420"],["🇩🇰 Denmark","+45"],["🇩🇯 Djibouti","+253"],["🇩🇲 Dominica","+1767"],["🇩🇴 Dominican Republic","+1809"],["🇪🇨 Ecuador","+593"],["🇪🇬 Egypt","+20"],["🇸🇻 El Salvador","+503"],["🇬🇶 Equatorial Guinea","+240"],["🇪🇷 Eritrea","+291"],["🇪🇪 Estonia","+372"],["🇸🇿 Eswatini","+268"],["🇪🇹 Ethiopia","+251"],["🇫🇯 Fiji","+679"],["🇫🇮 Finland","+358"],["🇫🇷 France","+33"],["🇬🇦 Gabon","+241"],["🇬🇲 Gambia","+220"],["🇬🇪 Georgia","+995"],["🇩🇪 Germany","+49"],["🇬🇭 Ghana","+233"],["🇬🇷 Greece","+30"],["🇬🇩 Grenada","+1473"],["🇬🇹 Guatemala","+502"],["🇬🇳 Guinea","+224"],["🇬🇼 Guinea-Bissau","+245"],["🇬🇾 Guyana","+592"],["🇭🇹 Haiti","+509"],["🇭🇳 Honduras","+504"],["🇭🇰 Hong Kong","+852"],["🇭🇺 Hungary","+36"],["🇮🇸 Iceland","+354"],["🇮🇳 India","+91"],["🇮🇩 Indonesia","+62"],["🇮🇷 Iran","+98"],["🇮🇶 Iraq","+964"],["🇮🇪 Ireland","+353"],["🇮🇱 Israel","+972"],["🇮🇹 Italy","+39"],["🇨🇮 Ivory Coast","+225"],["🇯🇲 Jamaica","+1876"],["🇯🇵 Japan","+81"],["🇯🇴 Jordan","+962"],["🇰🇿 Kazakhstan","+7"],["🇰🇪 Kenya","+254"],["🇰🇮 Kiribati","+686"],["🇽🇰 Kosovo","+383"],["🇰🇼 Kuwait","+965"],["🇰🇬 Kyrgyzstan","+996"],["🇱🇦 Laos","+856"],["🇱🇻 Latvia","+371"],["🇱🇧 Lebanon","+961"],["🇱🇸 Lesotho","+266"],["🇱🇷 Liberia","+231"],["🇱🇾 Libya","+218"],["🇱🇮 Liechtenstein","+423"],["🇱🇹 Lithuania","+370"],["🇱🇺 Luxembourg","+352"],["🇲🇬 Madagascar","+261"],["🇲🇼 Malawi","+265"],["🇲🇾 Malaysia","+60"],["🇲🇻 Maldives","+960"],["🇲🇱 Mali","+223"],["🇲🇹 Malta","+356"],["🇲🇭 Marshall Islands","+692"],["🇲🇷 Mauritania","+222"],["🇲🇺 Mauritius","+230"],["🇲🇽 Mexico","+52"],["🇫🇲 Micronesia","+691"],["🇲🇩 Moldova","+373"],["🇲🇨 Monaco","+377"],["🇲🇳 Mongolia","+976"],["🇲🇪 Montenegro","+382"],["🇲🇦 Morocco","+212"],["🇲🇿 Mozambique","+258"],["🇲🇲 Myanmar","+95"],["🇳🇦 Namibia","+264"],["🇳🇷 Nauru","+674"],["🇳🇵 Nepal","+977"],["🇳🇱 Netherlands","+31"],["🇳🇿 New Zealand","+64"],["🇳🇮 Nicaragua","+505"],["🇳🇪 Niger","+227"],["🇳🇬 Nigeria","+234"],["🇲🇰 North Macedonia","+389"],["🇰🇵 North Korea","+850"],["🇳🇴 Norway","+47"],["🇴🇲 Oman","+968"],["🇵🇰 Pakistan","+92"],["🇵🇼 Palau","+680"],["🇵🇸 Palestine","+970"],["🇵🇦 Panama","+507"],["🇵🇬 Papua New Guinea","+675"],["🇵🇾 Paraguay","+595"],["🇵🇪 Peru","+51"],["🇵🇭 Philippines","+63"],["🇵🇱 Poland","+48"],["🇵🇹 Portugal","+351"],["🇶🇦 Qatar","+974"],["🇷🇴 Romania","+40"],["🇷🇺 Russia","+7"],["🇷🇼 Rwanda","+250"],["🇰🇳 Saint Kitts & Nevis","+1869"],["🇱🇨 Saint Lucia","+1758"],["🇻🇨 Saint Vincent & Grenadines","+1784"],["🇼🇸 Samoa","+685"],["🇸🇲 San Marino","+378"],["🇸🇹 São Tomé & Príncipe","+239"],["🇸🇦 Saudi Arabia","+966"],["🇸🇳 Senegal","+221"],["🇷🇸 Serbia","+381"],["🇸🇨 Seychelles","+248"],["🇸🇱 Sierra Leone","+232"],["🇸🇬 Singapore","+65"],["🇸🇰 Slovakia","+421"],["🇸🇮 Slovenia","+386"],["🇸🇧 Solomon Islands","+677"],["🇸🇴 Somalia","+252"],["🇿🇦 South Africa","+27"],["🇸🇸 South Sudan","+211"],["🇪🇸 Spain","+34"],["🇱🇰 Sri Lanka","+94"],["🇸🇩 Sudan","+249"],["🇸🇷 Suriname","+597"],["🇸🇪 Sweden","+46"],["🇨🇭 Switzerland","+41"],["🇸🇾 Syria","+963"],["🇹🇼 Taiwan","+886"],["🇹🇯 Tajikistan","+992"],["🇹🇿 Tanzania","+255"],["🇹🇭 Thailand","+66"],["🇹🇱 Timor-Leste","+670"],["🇹🇬 Togo","+228"],["🇹🇴 Tonga","+676"],["🇹🇹 Trinidad & Tobago","+1868"],["🇹🇳 Tunisia","+216"],["🇹🇷 Turkey","+90"],["🇹🇲 Turkmenistan","+993"],["🇹🇻 Tuvalu","+688"],["🇺🇬 Uganda","+256"],["🇺🇦 Ukraine","+380"],["🇦🇪 UAE","+971"],["🇬🇧 United Kingdom","+44"],["🇺🇸 United States","+1"],["🇺🇾 Uruguay","+598"],["🇺🇿 Uzbekistan","+998"],["🇻🇺 Vanuatu","+678"],["🇻🇦 Vatican City","+39066"],["🇻🇪 Venezuela","+58"],["🇻🇳 Vietnam","+84"],["🇾🇪 Yemen","+967"],["🇿🇲 Zambia","+260"],["🇿🇼 Zimbabwe","+263"]].sort((a,b)=>a[0].localeCompare(b[0])).map(([n,c]) => <option key={c+n} value={c}>{n} ({c})</option>)}
            </select>
            <input type="tel" placeholder="50 123 4567" value={editUserForm.phoneNum || ""}
              onChange={e => { const num = e.target.value.replace(/[^\d\s]/g,""); setEditUserForm(p => ({ ...p, phoneNum: num, phone: (p.phoneCode||"+971") + num.replace(/\s/g,"") })); }}
              style={{ flex: 1, padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Country</label>
          <select value={editUserForm.country || ""} onChange={e => setEditUserForm(p => ({ ...p, country: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: editUserForm.country ? T.white : T.textMuted, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
            <option value="">Select country...</option>
            {["🇦🇪 UAE","🇸🇦 Saudi Arabia","🇶🇦 Qatar","🇰🇼 Kuwait","🇴🇲 Oman","🇧🇭 Bahrain","🇮🇳 India","🇵🇰 Pakistan","🇧🇩 Bangladesh","🇱🇰 Sri Lanka","🇳🇵 Nepal","🇵🇭 Philippines","🇪🇬 Egypt","🇯🇴 Jordan","🇱🇧 Lebanon","🇸🇾 Syria","🇮🇶 Iraq","🇮🇷 Iran","🇬🇧 United Kingdom","🇺🇸 United States","🇦🇺 Australia","🇨🇦 Canada","🇫🇷 France","🇩🇪 Germany","🇷🇺 Russia","🇨🇳 China","🇯🇵 Japan","🇰🇷 Korea","🇳🇬 Nigeria","🇰🇪 Kenya","🇿🇦 South Africa","🇪🇹 Ethiopia","🇹🇿 Tanzania","🇺🇬 Uganda","🇬🇭 Ghana","🇲🇦 Morocco","🇹🇳 Tunisia","🇩🇿 Algeria","🇱🇾 Libya","🇸🇩 Sudan","🇹🇷 Turkey","🇺🇦 Ukraine","🇵🇱 Poland","🇷🇴 Romania","🇳🇱 Netherlands","🇧🇪 Belgium","🇨🇭 Switzerland","🇦🇹 Austria","🇸🇪 Sweden","🇳🇴 Norway","🇩🇰 Denmark","🇫🇮 Finland","🇵🇹 Portugal","🇬🇷 Greece","🇨🇿 Czech","🇭🇺 Hungary","🇲🇾 Malaysia","🇸🇬 Singapore","🇹🇭 Thailand","🇮🇩 Indonesia","🇻🇳 Vietnam","🇧🇷 Brazil","🇦🇷 Argentina","🇨🇴 Colombia","🇲🇽 Mexico","🇨🇱 Chile","🇳🇿 New Zealand","🌍 Other"].sort().map(c => <option key={c} value={c.slice(3)}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Access Tier</label>
          <select value={editUserForm.tier || "free"} onChange={e => setEditUserForm(p => ({ ...p, tier: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
            <option value="free">Free</option>
            <option value="pro_trial">Pro Trial</option>
            <option value="pro">Pro · AED 99</option>
            <option value="enterprise">Enterprise · AED 499</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Job Role</label>
          <select value={editUserForm.role || "user"} onChange={e => setEditUserForm(p => ({ ...p, role: e.target.value }))}
            style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
            <option value="user">— No role —</option>
            <option value="agent">Real Estate Agent</option>
            <option value="sales_manager">Sales Manager</option>
            <option value="broker">Broker</option>
            <option value="property_manager">Property Manager</option>
            <option value="investor">Investor</option>
            <option value="developer">Developer</option>
            <option value="staff">Platform Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Trial End Date</label>
          <input type="date" value={editUserForm.trialEnd ? editUserForm.trialEnd.slice(0,10) : ""} onChange={e => setEditUserForm(p => ({ ...p, trialEnd: e.target.value ? e.target.value + "T00:00:00.000Z" : "" }))}
            style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif" }} />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, display: "block" }}>Admin Notes</label>
          <textarea placeholder="Internal notes..." value={editUserForm.notes || ""} onChange={e => setEditUserForm(p => ({ ...p, notes: e.target.value }))} rows={3}
            style={{ width: "100%", padding: "10px 12px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, color: T.white, fontSize: 13, fontFamily: "'Outfit',sans-serif", resize: "vertical", boxSizing: "border-box" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button type="button" onClick={() => setEditingUser(null)} style={{ flex: 1, padding: "11px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textSecondary, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
        <button type="button" onClick={saveEditUser} disabled={editUserLoading} style={{ flex: 2, padding: "11px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${T.gold}, #B8860B)`, color: T.bg, fontWeight: 700, cursor: editUserLoading ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", opacity: editUserLoading ? 0.6 : 1 }}>
          {editUserLoading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  </div>
)}



        </div>
      </main>

      {/* ─── PROFILE MODAL ─── */}
      {showProfile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowProfile(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, width: "100%", maxWidth: 400, padding: 32, boxShadow: "0 25px 80px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, fontWeight: 800, color: T.gold }}>{i18t("ui", "profile")}</h3>
              <button type="button" onClick={() => setShowProfile(false)} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 20, cursor: "pointer" }}>&times;</button>
            </div>
            {/* Avatar */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${T.gold}, #B8912F)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 28, color: T.bg }}>
                {(adminUser?.displayName || adminUser?.email || "A")[0].toUpperCase()}
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: T.white }}>{adminUser?.displayName || adminUser?.email?.split("@")[0]}</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{adminUser?.email}</div>
                <div style={{ display: "inline-block", marginTop: 8, padding: "4px 12px", borderRadius: 6, background: "rgba(212,168,67,0.12)", border: `1px solid ${T.gold}33`, fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: 0.5 }}>{i18t("sidebar", "admin")}</div>
              </div>
            </div>
            {/* Info rows */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, background: T.surfaceAlt }}>
                <span style={{ fontSize: 12, color: T.textMuted }}>UID</span>
                <span style={{ fontSize: 11, color: T.textSecondary, fontFamily: "monospace" }}>{adminUser?.uid?.slice(0, 16)}...</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, background: T.surfaceAlt }}>
                <span style={{ fontSize: 12, color: T.textMuted }}>{i18t("ui", "email")}</span>
                <span style={{ fontSize: 12, color: T.white }}>{adminUser?.email}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, background: T.surfaceAlt }}>
                <span style={{ fontSize: 12, color: T.textMuted }}>Role</span>
                <span style={{ fontSize: 12, color: T.gold, fontWeight: 600 }}>{i18t("sidebar", "admin")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, background: T.surfaceAlt }}>
                <span style={{ fontSize: 12, color: T.textMuted }}>Total Users</span>
                <span style={{ fontSize: 12, color: T.white, fontWeight: 600 }}>{users.length}</span>
              </div>
            </div>
            {/* Sign Out */}
            <button type="button" onClick={() => { logAudit(db, { action: "admin_logout", uid: adminUser?.uid }).finally(() => { signOut(auth); setShowProfile(false); }); }} style={{ width: "100%", marginTop: 20, padding: "10px 0", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#EF4444", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>{i18t("ui", "signOut")}</button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
         BULK PRICE UPDATE MODAL
         ═══════════════════════════════════════ */}
      {showBulkModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
          <div style={{ width: 420, background: T.surface, borderRadius: 16, border: `1px solid ${T.border}`, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: T.white }}>Bulk Price Update</h3>
                <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>Apply to {bulkSelected.length} selected projects</p>
              </div>
              <button type="button" onClick={() => setShowBulkModal(false)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, cursor: "pointer", fontSize: 18 }}>&times;</button>
            </div>
            
            {/* Content */}
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Change Type</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => setBulkChangeType("percent")}
                    style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${bulkChangeType === "percent" ? T.gold : T.border}`, background: bulkChangeType === "percent" ? `${T.gold}15` : "transparent", color: bulkChangeType === "percent" ? T.gold : T.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                    Percentage (%)
                  </button>
                  <button type="button" onClick={() => setBulkChangeType("fixed")}
                    style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${bulkChangeType === "fixed" ? T.gold : T.border}`, background: bulkChangeType === "fixed" ? `${T.gold}15` : "transparent", color: bulkChangeType === "fixed" ? T.gold : T.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                    Fixed (AED)
                  </button>
                </div>
              </div>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{bulkChangeType === "percent" ? "Price Change (%)" : "Price Change (AED)"}</label>
                <input type="number" value={bulkPriceChange} onChange={e => setBulkPriceChange(parseFloat(e.target.value) || 0)} placeholder={bulkChangeType === "percent" ? "+5 or -5" : "+50000 or -50000"}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surfaceAlt, color: bulkPriceChange >= 0 ? T.green : T.red, fontSize: 18, fontWeight: 700, textAlign: "center", fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }} />
              </div>
              
              <div style={{ padding: 12, borderRadius: 8, background: T.surfaceAlt, border: `1px solid ${T.border}`, marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>PREVIEW</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: T.textSecondary }}>Original: AED 1,000,000</span>
                  <span style={{ color: bulkPriceChange >= 0 ? T.green : T.red }}>{"→"}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: bulkPriceChange >= 0 ? T.green : T.red }}>
                    New: AED {bulkChangeType === "percent" ? (1000000 * (1 + bulkPriceChange / 100)).toLocaleString() : (1000000 + bulkPriceChange).toLocaleString()}
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => { setShowBulkModal(false); setBulkPriceChange(0); setBulkChangeType("percent"); }}
                  style={{ flex: 1, padding: 12, borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.textMuted, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
                <button type="button" onClick={() => handleBulkPriceUpdate({ changeType: bulkChangeType, priceChange: bulkPriceChange })} disabled={bulkLoading || bulkPriceChange === 0}
                  style={{ flex: 2, padding: 12, borderRadius: 8, border: "none", background: bulkPriceChange === 0 ? T.border : T.gold, color: T.surface, fontSize: 14, fontWeight: 700, cursor: bulkLoading || bulkPriceChange === 0 ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {bulkLoading ? "Updating..." : `Apply to ${bulkSelected.length} Projects`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// STABLE_RECOVERY_0945_PPSF_FIXED
// BEAST_UI_UPGRADE_1005_MAR24
// BEAST_BADGE_GLOBAL_1012_MAR24


