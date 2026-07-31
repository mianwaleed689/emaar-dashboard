import React, { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, collection } from "firebase/firestore";
import { auth, db } from "../firebase";
import { PRICING, PRICING_NAMES, PRICING_LABELS, PLAN_FEATURES, SEATS, PUBLIC_PLANS } from "../config/pricing";
import { TRIAL_DURATION_MS, TRIAL_DURATION_DAYS } from "../utils/constants";

const T = {
  bg:          "#04090F",
  surface:     "#0A1628",
  surfaceAlt:  "#0E1D35",
  card:        "#0D1B30",
  gold:        "#D4A843",
  teal:        "#00BFA5",
  green:       "#10B981",
  red:         "#EF4444",
  border:      "rgba(255,255,255,0.06)",
  textPrimary: "#E2E8F0",
  textSecondary:"#94A3B8",
  textMuted:   "#64748B",
  white:       "#FFFFFF",
};

const inp = {
  width:"100%", padding:"11px 14px",
  background:"rgba(255,255,255,0.04)",
  border:"1px solid rgba(212,168,67,0.15)",
  borderRadius:9, color:T.textPrimary,
  fontSize:13, fontFamily:"'Outfit',sans-serif",
  outline:"none", boxSizing:"border-box",
};

/* Plans are built from src/config/pricing.js rather than restated here.
   This file previously hardcoded "AED 299/mo" and "AED 799/mo" alongside its own
   feature lists, which is exactly the duplication config/pricing.js was created
   to end — a price change would have updated the rest of the app and quietly
   left the signup page selling the old numbers. */
const PLAN_COLORS = { pro: T.teal, enterprise: "#8B5CF6" };

const PLANS = PUBLIC_PLANS.map(key => ({
  key,
  label: PRICING_NAMES[key],
  price: PRICING_LABELS[key],
  color: PLAN_COLORS[key] || T.gold,
  features: PLAN_FEATURES[key] || [],
  seats: SEATS[key],
}));

export default function AgencySignup() {
  const [step, setStep] = useState(1); // 1=agency details, 2=manager account, 3=plan, 4=success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [accountType, setAccountType] = useState("agency"); // "agency" or "developer"
  const [agencyForm, setAgencyForm] = useState({
    name:"", reraNo:"", tradeLicense:"", phone:"", city:"Dubai", website:"",
  });
  const [managerForm, setManagerForm] = useState({
    name:"", email:"", password:"", confirmPassword:"",
  });
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [createdOrg, setCreatedOrg] = useState(null);

  const STEPS = [
    { n:1, label: accountType === "developer" ? "Developer Details" : "Agency Details" },
    { n:2, label:"Manager Account" },
    { n:3, label:"Select Plan" },
    { n:4, label:"All Done" },
  ];

  // Validate step 1
  const validateStep1 = () => {
    const isAgency = accountType !== "developer";
    const label = isAgency ? "Agency" : "Developer";

    if (!agencyForm.name.trim()) { setError(`${label} name is required`); return false; }

    /* Brokerage in Dubai is licensed: an agency has an ORN/RERA number and a
       trade licence. Requiring at least one is the difference between a signup
       form and a register of real businesses — and this is a paid B2B product
       where you will want to know who is on it.

       ONE of the two, not both: a newly-formed brokerage may have its trade
       licence before its ORN comes through, and blocking those signups would
       cost real customers. */
    if (isAgency && !agencyForm.reraNo.trim() && !agencyForm.tradeLicense.trim()) {
      setError("Enter your RERA/ORN number or your trade licence number — at least one is required");
      return false;
    }

    if (!agencyForm.phone.trim()) { setError("A contact phone number is required"); return false; }

    setError(""); return true;
  };

  // Validate step 2
  const validateStep2 = () => {
    if (!managerForm.name.trim())  { setError("Your name is required"); return false; }
    if (!managerForm.email.trim()) { setError("Email is required"); return false; }
    if (managerForm.password.length < 8) { setError("Password must be at least 8 characters"); return false; }
    if (!/[A-Z]/.test(managerForm.password)) { setError("Password must contain at least one uppercase letter"); return false; }
    if (!/[0-9]/.test(managerForm.password)) { setError("Password must contain at least one number"); return false; }
    if (managerForm.password !== managerForm.confirmPassword) { setError("Passwords do not match"); return false; }
    if (!agreedToTerms) { setError("You must agree to the Terms of Service and Privacy Policy"); return false; }
    setError(""); return true;
  };

  // Final submit  create account + org
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      // Create Firebase auth account first (must be authenticated before Firestore writes)
      const cred = await createUserWithEmailAndPassword(auth, managerForm.email.trim(), managerForm.password);
      await sendEmailVerification(cred.user);
      const uid = cred.user.uid;

      // Generate orgId
      const orgId = "org_" + agencyForm.name.toLowerCase().replace(/[^a-z0-9]/g,"_").slice(0,20) + "_" + Date.now().toString(36);
      const now = new Date().toISOString();

      // Create user doc (manager)
      await setDoc(doc(db, "users", uid), {
        name:      managerForm.name.trim(),
        email:     managerForm.email.trim(),
        role:      accountType === "developer" ? "developer" : "user",
        orgRole:   "manager",
        orgId,
        /* Trial length comes from the shared constant. This route previously
           granted 14 days while the individual signup granted 7 (TRIAL_DURATION_MS)
           and every piece of copy on the site — including the welcome email —
           said 7. Two signup paths were handing out different trials. */
        tier:      "pro_trial",
        trialEnd:  new Date(Date.now() + TRIAL_DURATION_MS).toISOString(),
        trialStart: now,
        createdAt: now,
        signupSource: accountType === "developer" ? "developer_self_serve" : "agency_self_serve",
      });

      // Create organisation doc
      await setDoc(doc(db, "organisations", orgId), {
        orgId,
        name:         agencyForm.name.trim(),
        reraNo:       agencyForm.reraNo.trim()       || null,
        tradeLicense: agencyForm.tradeLicense.trim() || null,
        phone:        agencyForm.phone.trim()        || null,
        city:         agencyForm.city                || "Dubai",
        website:      agencyForm.website.trim()      || null,
        ownerEmail:   managerForm.email.trim(),
        ownerId:      uid,
        plan:         selectedPlan,
        /* What the plan actually entitles them to, written at signup rather than
           inferred later. Without this nothing knows what AED 500 buys, and seat
           limits become a number in someone's head. Read from config/pricing.js
           so the allowance and the price can never disagree. */
        seatsIncluded: SEATS[selectedPlan] ?? 1,
        seatsUsed:     1,          // the manager occupies the first seat
        monthlyPrice:  PRICING[selectedPlan] ?? 0,
        currency:      "AED",
        status:       "pending", // admin approves
        agentCount:   0,
        leadCount:    0,
        createdAt:    now,
        updatedAt:    now,
        type:         accountType === "developer" ? "Developer" : "Agency",
      });

      setCreatedOrg({ orgId, name: agencyForm.name.trim() });
      setStep(4);
    } catch(e) {
      if (e.code === "auth/email-already-in-use") setError("This email is already registered  try logging in");
      else if (e.code === "auth/invalid-email") setError("Invalid email address");
      else setError("Something went wrong: " + e.message);
    }
    setLoading(false);
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3) { handleSubmit(); return; }
    setStep(s => s + 1);
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'Outfit',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;900&family=Fraunces:ital,wght@0,700;0,900;1,700&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #64748B; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ width:"100%", maxWidth:560, animation:"fadeIn 0.3s ease" }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:8 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:"rgba(212,168,67,0.15)", border:"1px solid rgba(212,168,67,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="2" strokeLinecap="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
            </div>
            <span style={{ fontSize:20, fontWeight:900, color:T.gold, fontFamily:"'Fraunces',serif" }}>DXB Analytics</span>
          </div>
          <div style={{ fontSize:14, color:T.textMuted }}>Agency Partner Registration</div>
        </div>

        {/* Step indicator */}
        {step < 4 && (
          <div style={{ display:"flex", alignItems:"center", marginBottom:28 }}>
            {STEPS.slice(0,3).map((s,i) => (
              <React.Fragment key={s.n}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:5 }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:step>=s.n?"rgba(212,168,67,0.15)":"rgba(255,255,255,0.04)", border:`2px solid ${step>=s.n?T.gold:T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:step>=s.n?T.gold:T.textMuted }}>
                    {step>s.n ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.gold} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> : s.n}
                  </div>
                  <span style={{ fontSize:10, color:step>=s.n?T.gold:T.textMuted, fontWeight:600, whiteSpace:"nowrap" }}>{s.label}</span>
                </div>
                {i < 2 && <div style={{ flex:1, height:1, background:step>s.n?"rgba(212,168,67,0.4)":T.border, margin:"0 8px", marginBottom:18 }}/>}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Card */}
        <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.border}`, overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.5)" }}>

          {/*  STEP 1: Agency Details  */}
          {step === 1 && (
            <div style={{ padding:"28px 28px 24px" }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, color:T.white, marginBottom:4 }}>Tell us about your {accountType === "developer" ? "company" : "agency"}</div>
              <div style={{ fontSize:12, color:T.textMuted, marginBottom:18 }}>Your {accountType === "developer" ? "developer" : "agency"} profile  you can update this later</div>
              <div style={{ display:"flex", gap:10, marginBottom:18 }}>
                <button type="button" onClick={()=>setAccountType("agency")} style={{
                  flex:1, padding:"14px 12px",
                  background: accountType === "agency" ? `linear-gradient(135deg, ${T.gold}, #B8922A)` : T.surfaceAlt,
                  color: accountType === "agency" ? "#000" : T.textMuted,
                  border: accountType === "agency" ? "none" : `1px solid ${T.border}`,
                  borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer",
                  fontFamily:`'Outfit',sans-serif`,
                }}>
                  x Real Estate Agency
                  <div style={{ fontSize:10, fontWeight:400, marginTop:3, opacity:0.85 }}>
                    Broker / agent / brokerage firm
                  </div>
                </button>
                <button type="button" onClick={()=>setAccountType("developer")} style={{
                  flex:1, padding:"14px 12px",
                  background: accountType === "developer" ? `linear-gradient(135deg, ${T.gold}, #B8922A)` : T.surfaceAlt,
                  color: accountType === "developer" ? "#000" : T.textMuted,
                  border: accountType === "developer" ? "none" : `1px solid ${T.border}`,
                  borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer",
                  fontFamily:`'Outfit',sans-serif`,
                }}>
                  x️ Developer
                  <div style={{ fontSize:10, fontWeight:400, marginTop:3, opacity:0.85 }}>
                    Build & claim your projects
                  </div>
                </button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {[
                  { key:"name",         label:(accountType === "developer" ? "Company Name *" : "Agency Name *"),      placeholder:(accountType === "developer" ? "Emaar Properties" : "Better Homes Dubai"),    required:true },
                  { key:"reraNo",       label:(accountType === "developer" ? "RERA Developer License" : "RERA Broker Number"), placeholder:(accountType === "developer" ? "RERA #XX" : "BRN-XXXXX")                            },
                  { key:"tradeLicense", label:"Trade License No.",  placeholder:"DED-XXXXXXX"                          },
                  { key:"phone",        label:"Phone Number",       placeholder:"+971 4 XXX XXXX"                      },
                  { key:"website",      label:"Website",            placeholder:"www.youragency.ae"                     },
                ].map(({key,label,placeholder,required}) => (
                  <div key={key}>
                    <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5, letterSpacing:0.3 }}>
                      {label}{required && <span style={{ color:T.gold }}> *</span>}
                    </div>
                    <input value={agencyForm[key]||""} onChange={e=>setAgencyForm(f=>({...f,[key]:e.target.value}))}
                      placeholder={placeholder} style={inp}/>
                  </div>
                ))}
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>City</div>
                  <select value={agencyForm.city} onChange={e=>setAgencyForm(f=>({...f,city:e.target.value}))}
                    style={{ ...inp, cursor:"pointer" }}>
                    {["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah","Fujairah","Umm Al Quwain"].map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/*  STEP 2: Manager Account  */}
          {step === 2 && (
            <div style={{ padding:"28px 28px 24px" }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, color:T.white, marginBottom:4 }}>Create your manager account</div>
              <div style={{ fontSize:12, color:T.textMuted, marginBottom:24 }}>This is the main account for <strong style={{ color:T.gold }}>{agencyForm.name}</strong></div>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {[
                  { key:"name",            label:"Your Full Name *",    placeholder:"Ahmed Al-Mansouri",   required:true },
                  { key:"email",           label:"Work Email *",        placeholder:"ahmed@agency.ae",     required:true },
                  { key:"password",        label:"Password *",          placeholder:"Min 8 chars, 1 uppercase, 1 number",    type:"password", required:true },
                  { key:"confirmPassword", label:"Confirm Password *",  placeholder:"Repeat password",     type:"password", required:true },
                ].map(({key,label,placeholder,type,required}) => (
                  <div key={key}>
                    <div style={{ fontSize:11, fontWeight:600, color:T.textMuted, marginBottom:5 }}>
                      {label}{required && <span style={{ color:T.gold }}> *</span>}
                    </div>
                    <input type={type||"text"} value={managerForm[key]||""} onChange={e=>setManagerForm(f=>({...f,[key]:e.target.value}))}
                      placeholder={placeholder} style={inp}/>
                  </div>
                ))}
              </div>
            </div>
          )}
              <label style={{ display:"flex", alignItems:"flex-start", gap:8, marginTop:14, cursor:"pointer" }}>
                <input type="checkbox" checked={agreedToTerms} onChange={e=>setAgreedToTerms(e.target.checked)} style={{ marginTop:2, cursor:"pointer" }}/>
                <span style={{ fontSize:11, color:T.textMuted, lineHeight:1.5 }}>
                  I agree to the <a href="/terms" target="_blank" style={{ color:T.gold, textDecoration:"none" }}>Terms of Service</a> and <a href="/privacy" target="_blank" style={{ color:T.gold, textDecoration:"none" }}>Privacy Policy</a>
                </span>
              </label>

          {/*  STEP 3: Plan Selection  */}
          {step === 3 && (
            <div style={{ padding:"28px 28px 24px" }}>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:20, fontWeight:900, color:T.white, marginBottom:4 }}>Choose your plan</div>
              <div style={{ fontSize:12, color:T.textMuted, marginBottom:24 }}>Start with a 14-day free trial on Pro or Enterprise  no credit card required</div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {PLANS.map(plan => (
                  <div key={plan.key} onClick={()=>setSelectedPlan(plan.key)}
                    style={{ padding:"16px 18px", borderRadius:12, border:`2px solid ${selectedPlan===plan.key?plan.color:T.border}`, background:selectedPlan===plan.key?`${plan.color}08`:T.surfaceAlt, cursor:"pointer", transition:"all 0.15s" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${plan.color}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          {selectedPlan===plan.key && <div style={{ width:8, height:8, borderRadius:"50%", background:plan.color }}/>}
                        </div>
                        <span style={{ fontSize:14, fontWeight:700, color:selectedPlan===plan.key?plan.color:T.textPrimary }}>{plan.label}</span>
                        {plan.key !== "free" && <span style={{ fontSize:9, padding:"2px 7px", borderRadius:10, background:`${plan.color}18`, color:plan.color, fontWeight:700 }}>14-day trial</span>}
                      </div>
                      <span style={{ fontSize:14, fontWeight:700, color:plan.color }}>{plan.price}</span>
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {plan.features.map((f,i) => (
                        <span key={i} style={{ fontSize:10, color:T.textMuted, display:"flex", alignItems:"center", gap:4 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={plan.color} strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/*  STEP 4: Success  */}
          {step === 4 && (
            <div style={{ padding:"48px 28px", textAlign:"center" }}>
              <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(16,185,129,0.12)", border:"2px solid rgba(16,185,129,0.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontFamily:"'Fraunces',serif", fontSize:22, fontWeight:900, color:T.white, marginBottom:8 }}>
                Welcome to DXB Analytics
              </div>
              <div style={{ fontSize:13, color:T.textMuted, marginBottom:8, lineHeight:1.6 }}>
                <strong style={{ color:T.gold }}>{createdOrg?.name}</strong> has been registered.
              </div>
              <div style={{ fontSize:12, color:T.textMuted, marginBottom:28, padding:"12px 16px", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:9 }}>
                Your account is <strong style={{ color:"#F59E0B" }}>pending approval</strong> by our team. You'll receive an email within 24 hours once activated.
              </div>
              <a href="/dashboard"
                style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"12px 28px", borderRadius:9, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.1)", color:T.gold, fontSize:13, fontWeight:700, textDecoration:"none", fontFamily:"'Outfit',sans-serif" }}>
                Go to Dashboard
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
            </div>
          )}

          {/* Error message */}
          {error && step < 4 && (
            <div style={{ margin:"0 28px", padding:"10px 14px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, fontSize:12, color:T.red, display:"flex", alignItems:"center", gap:8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          {/* Footer buttons */}
          {step < 4 && (
            <div style={{ padding:"16px 28px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <button type="button" onClick={()=>{ if(step>1){setStep(s=>s-1);setError("");} else window.location.href="/"; }}
                style={{ padding:"10px 20px", borderRadius:8, border:`1px solid ${T.border}`, background:"transparent", color:T.textMuted, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
                {step === 1 ? "Back to home" : "Back"}
              </button>
              <button type="button" onClick={nextStep} disabled={loading}
                style={{ padding:"10px 28px", borderRadius:8, border:`1px solid ${T.gold}`, background:"rgba(212,168,67,0.12)", color:T.gold, fontSize:12, fontWeight:700, cursor:"pointer", opacity:loading?0.6:1, display:"flex", alignItems:"center", gap:8, fontFamily:"'Outfit',sans-serif" }}>
                {loading ? (
                  <><div style={{ width:14, height:14, border:`2px solid rgba(212,168,67,0.3)`, borderTopColor:T.gold, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/> Creating account...</>
                ) : step === 3 ? (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> Create Agency Account</>
                ) : (
                  <>Continue <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg></>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Login link */}
        {step < 4 && (
          <div style={{ textAlign:"center", marginTop:20, fontSize:12, color:T.textMuted }}>
            Already have an account?{" "}
            <a href="/dashboard" style={{ color:T.gold, textDecoration:"none", fontWeight:600 }}>Sign in </a>
          </div>
        )}
      </div>
    </div>
  );
}
