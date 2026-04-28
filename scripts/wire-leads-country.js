const fs = require("fs");
let leads = fs.readFileSync("src/tabs/MyLeadsTab.jsx", "latin1");

// Add imports after papaparse
leads = leads.replace(
  `import Papa from "papaparse";`,
  `import Papa from "papaparse";
import PhoneInput from "../components/PhoneInput";
import NationalitySelect from "../components/NationalitySelect";`
);
console.log("imports:", leads.includes("PhoneInput") ? "OK" : "FAIL");

// Replace nationality - find it and replace
const natOld = `NATS.map(n=><option key={n} value={n}>{n}</option>)}</Sel></div>`;
const natIdx = leads.indexOf(natOld);
if (natIdx > -1) {
  const blockStart = leads.lastIndexOf("<div>", natIdx);
  const blockEnd = natIdx + natOld.length;
  leads = leads.substring(0, blockStart) +
    `<div><Lbl>Nationality</Lbl><NationalitySelect value={form.nationality} onChange={v=>F("nationality",v)} /></div>` +
    leads.substring(blockEnd);
  console.log("nationality: OK");
} else {
  console.log("nationality: FAIL");
}

// Replace phone - find type="tel" and replace the wrapping div
const telIdx = leads.indexOf(`type="tel"/>`);
if (telIdx > -1) {
  const divStart = leads.lastIndexOf("<div>", telIdx);
  const divEnd = leads.indexOf("</div>", telIdx) + 6;
  leads = leads.substring(0, divStart) +
    `<div><Lbl>Phone *</Lbl><PhoneInput value={form.phone} onChange={v=>F("phone",v)} /></div>` +
    leads.substring(divEnd);
  console.log("phone: OK");
} else {
  console.log("phone: FAIL");
}

fs.writeFileSync("src/tabs/MyLeadsTab.jsx", leads, "utf8");
console.log("MyLeadsTab written");