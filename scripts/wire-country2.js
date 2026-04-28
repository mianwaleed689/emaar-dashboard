const fs = require("fs");

// ── Wire into MyLeadsTab ──────────────────────────────────────
let leads = fs.readFileSync("src/tabs/MyLeadsTab.jsx", "latin1");

const oldLeadsImport = 'import Papa from "papaparse";';
const newLeadsImport = 'import Papa from "papaparse";\nimport PhoneInput from "../components/PhoneInput";\nimport NationalitySelect from "../components/NationalitySelect";';

if (leads.includes(oldLeadsImport)) {
  leads = leads.replace(oldLeadsImport, newLeadsImport);
  console.log("MyLeadsTab imports added");
} else {
  console.log("MyLeadsTab import not found");
}

// Phone field
const oldPhone = '<div><Lbl>Phone *</Lbl><Inp value={form.phone} onChange={v=>F("phone",v)} placeholder="+971 50 XXX XXXX" type="tel"/></div>';
const newPhone = '<div><Lbl>Phone *</Lbl><PhoneInput value={form.phone} onChange={v=>F("phone",v)} /></div>';

if (leads.includes(oldPhone)) {
  leads = leads.replace(oldPhone, newPhone);
  console.log("MyLeadsTab phone replaced");
} else {
  console.log("MyLeadsTab phone not found");
}

// Nationality field
const oldNat = '<div><Lbl>Nationality</Lbl><Sel value={form.nationality} onChange={v=>F("nationality",v)}><option value="">Select...</option>{NATS.map(n=><option key={n} value={n}>{n}</option>)}</Sel></div>';
const newNat = '<div><Lbl>Nationality</Lbl><NationalitySelect value={form.nationality} onChange={v=>F("nationality",v)} /></div>';

if (leads.includes(oldNat)) {
  leads = leads.replace(oldNat, newNat);
  console.log("MyLeadsTab nationality replaced");
} else {
  console.log("MyLeadsTab nationality not found");
}

fs.writeFileSync("src/tabs/MyLeadsTab.jsx", leads, "latin1");

// ── Wire into TeamTab ─────────────────────────────────────────
let team = fs.readFileSync("src/tabs/TeamTab.jsx", "latin1");

const oldTeamImport = 'import { auth, db } from "../firebase";';
const newTeamImport = 'import { auth, db } from "../firebase";\nimport PhoneInput from "../components/PhoneInput";';

if (team.includes(oldTeamImport)) {
  team = team.replace(oldTeamImport, newTeamImport);
  console.log("TeamTab import added");
} else {
  console.log("TeamTab import not found");
}

// Find and replace phone input in create agent form
const oldAgentPhone = 'style={{...inp}} />';
const newAgentPhone = 'style={{...inp}} />\n                  }'
  .replace(
    'style={{...inp}} />\n                  }',
    'style={{...inp}} />'
  );

// Better approach — replace the input render inside the map
const oldRender = '                  <input type={type} value={form[k]||""} onChange={e=>F(k,e.target.value)} placeholder={placeholder}\n                    style={{...inp}} />';
const newRender = '                  {k === "phone"\n                    ? <PhoneInput value={form[k]||""} onChange={v=>F(k,v)} />\n                    : <input type={type} value={form[k]||""} onChange={e=>F(k,e.target.value)} placeholder={placeholder} style={{...inp}} />\n                  }';

if (team.includes(oldRender)) {
  team = team.replace(oldRender, newRender);
  console.log("TeamTab phone replaced");
} else {
  // Try single line version
  const oldRender2 = 'style={{...inp}} />`;
  const idx = team.indexOf("style={{...inp}} />");
  if (idx > -1) {
    const line = team.substring(0,idx).split("\n").length;
    console.log("Found inp at line:", line);
    console.log("Context:", team.substring(idx-100, idx+50));
  } else {
    console.log("TeamTab phone pattern not found");
  }
}

fs.writeFileSync("src/tabs/TeamTab.jsx", team, "latin1");
console.log("Done");