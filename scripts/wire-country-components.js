const fs = require("fs");

// ── Wire into MyLeadsTab ──────────────────────────────────────
let leads = fs.readFileSync("src/tabs/MyLeadsTab.jsx", "latin1");

// Add imports
const oldLeadsImport = `import Papa from "papaparse";`;
const newLeadsImport = `import Papa from "papaparse";
import PhoneInput from "../components/PhoneInput";
import NationalitySelect from "../components/NationalitySelect";`;

if (leads.includes(oldLeadsImport)) {
  leads = leads.replace(oldLeadsImport, newLeadsImport);
  console.log("MyLeadsTab imports added");
} else {
  console.log("MyLeadsTab import pattern not found");
}

// Replace phone field in Add Lead modal
const oldPhone = `                  <div><Lbl>Phone *</Lbl><Inp value={form.phone} onChange={v=>F("phone",v)} placeholder="+971 50 XXX XXXX" type="tel"/></div>`;
const newPhone = `                  <div><Lbl>Phone *</Lbl><PhoneInput value={form.phone} onChange={v=>F("phone",v)} /></div>`;

if (leads.includes(oldPhone)) {
  leads = leads.replace(oldPhone, newPhone);
  console.log("MyLeadsTab phone field replaced");
} else {
  console.log("MyLeadsTab phone pattern not found");
}

// Replace nationality field in Additional Details section
const oldNat = `                  <div><Lbl>Nationality</Lbl><Sel value={form.nationality} onChange={v=>F("nationality",v)}><option value="">Select...</option>{NATS.map(n=><option key={n} value={n}>{n}</option>)}</Sel></div>`;
const newNat = `                  <div><Lbl>Nationality</Lbl><NationalitySelect value={form.nationality} onChange={v=>F("nationality",v)} /></div>`;

if (leads.includes(oldNat)) {
  leads = leads.replace(oldNat, newNat);
  console.log("MyLeadsTab nationality field replaced");
} else {
  console.log("MyLeadsTab nationality pattern not found");
}

fs.writeFileSync("src/tabs/MyLeadsTab.jsx", leads, "latin1");

// ── Wire into TeamTab ─────────────────────────────────────────
let team = fs.readFileSync("src/tabs/TeamTab.jsx", "latin1");

// Add imports
const oldTeamImport = `import { auth, db } from "../firebase";`;
const newTeamImport = `import { auth, db } from "../firebase";
import PhoneInput from "../components/PhoneInput";`;

if (team.includes(oldTeamImport)) {
  team = team.replace(oldTeamImport, newTeamImport);
  console.log("TeamTab import added");
} else {
  console.log("TeamTab import pattern not found");
}

// Replace phone field in Create Agent modal
const oldTeamPhone = `                {k:"phone",   label:"Phone Number",     placeholder:"+971 50 XXX XXXX",    type:"tel"},`;
// We need to handle the phone field differently since it uses a map
// Replace the whole phone row in the map with a special case
const oldPhoneSection = `              ].map(({k,label,placeholder,type})=>(`);
const newPhoneSection = `              ].map(({k,label,placeholder,type})=>(`);

// Actually replace the phone input inside create agent form
const oldAgentPhone = `                  <input type={type} value={form[k]||""} onChange={e=>F(k,e.target.value)} placeholder={placeholder}
                    style={{...inp}} />`;
const newAgentPhone = `                  {k === "phone"
                    ? <PhoneInput value={form[k]||""} onChange={v=>F(k,v)} />
                    : <input type={type} value={form[k]||""} onChange={e=>F(k,e.target.value)} placeholder={placeholder} style={{...inp}} />
                  }`;

if (team.includes(oldAgentPhone)) {
  team = team.replace(oldAgentPhone, newAgentPhone);
  console.log("TeamTab phone field replaced");
} else {
  console.log("TeamTab phone pattern not found — trying alternate");
  const idx = team.indexOf("style={{...inp}} />");
  if (idx > -1) {
    const line = team.substring(0,idx).split("\n").length;
    console.log("Found at line:", line);
  }
}

fs.writeFileSync("src/tabs/TeamTab.jsx", team, "latin1");
console.log("Done");