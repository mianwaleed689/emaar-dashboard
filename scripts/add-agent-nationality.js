const fs = require("fs");
let team = fs.readFileSync("src/tabs/TeamTab.jsx", "latin1");

// Add NationalitySelect import
team = team.replace(
  `import PhoneInput from "../components/PhoneInput";`,
  `import PhoneInput from "../components/PhoneInput";
import NationalitySelect from "../components/NationalitySelect";`
);
console.log("import:", team.includes("NationalitySelect") ? "OK" : "FAIL");

// Add nationality to form state
team = team.replace(
  `const [form, setForm] = useState({name:"",email:"",phone:"",password:""});`,
  `const [form, setForm] = useState({name:"",email:"",phone:"",password:"",nationality:""});`
);
console.log("form state:", team.includes("nationality:\"\"") ? "OK" : "FAIL");

// Add nationality field after password field in the create agent form
// Find the info box and add nationality before it
const oldInfoBox = `              <div style={{padding:"10px 12px",background:"rgba(212,168,67,0.06)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:8,fontSize:11,color:T.textMuted,lineHeight:1.6}}>`;
const newInfoBox = `              <div>
                <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>Nationality</div>
                <NationalitySelect value={form.nationality||""} onChange={v=>F("nationality",v)} placeholder="Select nationality" />
              </div>
              <div style={{padding:"10px 12px",background:"rgba(212,168,67,0.06)",border:"1px solid rgba(212,168,67,0.2)",borderRadius:8,fontSize:11,color:T.textMuted,lineHeight:1.6}}>`;

if (team.includes(oldInfoBox)) {
  team = team.replace(oldInfoBox, newInfoBox);
  console.log("nationality field: OK");
} else {
  console.log("nationality field: FAIL");
}

// Also save nationality in createAgent function
team = team.replace(
  `        phone:        form.phone.trim(),`,
  `        phone:        form.phone.trim(),
        nationality:  form.nationality||"",`
);
console.log("createAgent save:", team.includes("nationality:  form.nationality") ? "OK" : "FAIL");

fs.writeFileSync("src/tabs/TeamTab.jsx", team, "utf8");
console.log("Done");