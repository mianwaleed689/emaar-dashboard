const fs = require("fs");
let team = fs.readFileSync("src/tabs/TeamTab.jsx", "latin1");

// Add import
team = team.replace(
  `import { auth, db } from "../firebase";`,
  `import { auth, db } from "../firebase";
import PhoneInput from "../components/PhoneInput";`
);
console.log("import:", team.includes("PhoneInput") ? "OK" : "FAIL");

// Find the input render line in create agent form and add phone special case
// The map renders inputs — we need to intercept phone field
const oldRender = `{k,label,placeholder,type})=>(
                <div key={k}>
                  <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div>
                  <input type={type} value={form[k]||""} onChange={e=>F(k,e.target.value)} placeholder={placeholder}
                    style={{...inp}} />
                </div>`;

const newRender = `{k,label,placeholder,type})=>(
                <div key={k}>
                  <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div>
                  {k==="phone"
                    ? <PhoneInput value={form[k]||""} onChange={v=>F(k,v)} />
                    : <input type={type} value={form[k]||""} onChange={e=>F(k,e.target.value)} placeholder={placeholder} style={{...inp}} />
                  }
                </div>`;

if (team.includes(oldRender)) {
  team = team.replace(oldRender, newRender);
  console.log("phone field: OK");
} else {
  console.log("phone field: FAIL — searching...");
  const idx = team.indexOf("style={{...inp}} />");
  if (idx > -1) {
    console.log("Found inp at line:", team.substring(0,idx).split("\n").length);
    console.log("Context:", JSON.stringify(team.substring(idx-150, idx+30)));
  }
}

fs.writeFileSync("src/tabs/TeamTab.jsx", team, "utf8");
console.log("TeamTab written");