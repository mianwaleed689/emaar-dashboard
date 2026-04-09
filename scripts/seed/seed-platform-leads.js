/**
 * Seed sample platform leads for DXB Internal Sales CRM
 * Run: node scripts/seed/seed-platform-leads.js
 */
const admin = require("firebase-admin");
const path = require("path");

try {
  const serviceAccount = require(path.join(__dirname, "..", "serviceAccountKey.json"));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (e) { console.error("ERROR: serviceAccountKey.json not found"); process.exit(1); }

const db = admin.firestore();
const ts = admin.firestore.FieldValue.serverTimestamp;

const LEADS = [
  {
    companyName: "Nakheel Properties",
    companyType: "Developer",
    contactName: "Ahmed Al Mansoori",
    contactEmail: "ahmed.mansoori@nakheel.com",
    contactPhone: "+971 4 390 3333",
    stage: "paid",
    plan: "Enterprise (AED 799)",
    estimatedArr: 9588,
    mrr: 799,
    assignedTo: "sales@dxbanalytics.com",
    notes: "Signed up as flagship developer customer. Using claim flow to manage 12 active projects.",
  },
  {
    companyName: "Betterhomes Real Estate",
    companyType: "Agency",
    contactName: "Ryan Cruz",
    contactEmail: "ryan@bhomes.com",
    contactPhone: "+971 4 409 0000",
    stage: "paid",
    plan: "Enterprise (AED 799)",
    estimatedArr: 9588,
    mrr: 799,
    assignedTo: "sales@dxbanalytics.com",
    notes: "85 agents onboarded. CSV imported 2,300 historical leads. Using all CRM features.",
  },
  {
    companyName: "Allsopp & Allsopp",
    companyType: "Agency",
    contactName: "Lewis Allsopp",
    contactEmail: "lewis@allsoppandallsopp.com",
    contactPhone: "+971 4 244 0449",
    stage: "trial_started",
    plan: "Pro (AED 299)",
    estimatedArr: 3588,
    mrr: 0,
    trialEndDate: "2026-04-23",
    assignedTo: "sales@dxbanalytics.com",
    notes: "Started 14-day trial. 40 agents testing. Very interested in Bayut integration.",
  },
  {
    companyName: "Haus & Haus",
    companyType: "Agency",
    contactName: "James Perry",
    contactEmail: "james@hausandhaus.com",
    contactPhone: "+971 4 302 5800",
    stage: "demo_scheduled",
    plan: "Pro (AED 299)",
    estimatedArr: 3588,
    mrr: 0,
    trialEndDate: "",
    assignedTo: "sales@dxbanalytics.com",
    notes: "Demo booked for April 12. Wants to see DLD integration and yield calculator before trial.",
  },
  {
    companyName: "LEOS Developments",
    companyType: "Developer",
    contactName: "Hammad Shaikh",
    contactEmail: "hammad@leos.ae",
    contactPhone: "+971 4 451 8000",
    stage: "demo_scheduled",
    plan: "Enterprise (AED 799)",
    estimatedArr: 9588,
    mrr: 0,
    trialEndDate: "",
    assignedTo: "sales@dxbanalytics.com",
    notes: "Mid-size developer with 5 projects. Interested in claim-and-verify flow for project listings.",
  },
  {
    companyName: "Fam Properties",
    companyType: "Agency",
    contactName: "Firas Al Msaddi",
    contactEmail: "firas@famproperties.com",
    contactPhone: "+971 4 457 2200",
    stage: "contacted",
    plan: "Free",
    estimatedArr: 3588,
    mrr: 0,
    assignedTo: "sales@dxbanalytics.com",
    notes: "First email sent. Large agency (120+ agents). Need to follow up this week.",
  },
  {
    companyName: "Samana Developers",
    companyType: "Developer",
    contactName: "Imran Farooq",
    contactEmail: "imran@samanadevelopers.com",
    contactPhone: "+971 4 581 1777",
    stage: "contacted",
    plan: "Free",
    estimatedArr: 9588,
    mrr: 0,
    assignedTo: "sales@dxbanalytics.com",
    notes: "Replied to first outreach. Interested but needs pricing for multi-project edit access.",
  },
  {
    companyName: "Gulf Sotheby's International Realty",
    companyType: "Agency",
    contactName: "George Azar",
    contactEmail: "george@gulfsothebys.com",
    contactPhone: "+971 4 423 9988",
    stage: "prospect",
    plan: "Free",
    estimatedArr: 3588,
    mrr: 0,
    assignedTo: "sales@dxbanalytics.com",
    notes: "Identified from RERA list. Luxury segment focus. Not yet contacted.",
  },
  {
    companyName: "Metropolitan Premium Properties",
    companyType: "Agency",
    contactName: "Jelena Rajic",
    contactEmail: "jelena@metropolitan.realestate",
    contactPhone: "+971 4 453 3640",
    stage: "prospect",
    plan: "Free",
    estimatedArr: 3588,
    mrr: 0,
    assignedTo: "sales@dxbanalytics.com",
    notes: "Identified via LinkedIn. Property management angle. Good fit for Enterprise.",
  },
  {
    companyName: "Aqua Properties",
    companyType: "Agency",
    contactName: "Adel Al Hashimi",
    contactEmail: "adel@aquaproperties.com",
    contactPhone: "+971 4 445 7000",
    stage: "churned",
    plan: "Pro (AED 299)",
    estimatedArr: 0,
    mrr: 0,
    assignedTo: "sales@dxbanalytics.com",
    notes: "Churned after trial. Reason: Already using competitor product with existing 3-year contract.",
  },
];

async function seed() {
  console.log("Seeding " + LEADS.length + " platform leads...\n");
  const now = new Date().toISOString();
  for (const l of LEADS) {
    const id = "lead_" + l.companyName.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 30);
    await db.collection("platformLeads").doc(id).set({
      ...l,
      createdAt: ts(),
      updatedAt: ts(),
      createdBy: "seed-script",
      updatedBy: "seed-script",
      trialEndDate: l.trialEndDate || "",
    });
    await db.collection("platformLeads").doc(id).collection("auditLog").add({
      action: "seed",
      userId: "seed-script",
      timestamp: ts(),
    });
    console.log("  + " + l.companyName + " [" + l.stage + "] - " + l.plan);
  }
  console.log("\nSeeded " + LEADS.length + " leads across 6 stages.");
  console.log("Stage breakdown:");
  const byStage = {};
  LEADS.forEach(l => byStage[l.stage] = (byStage[l.stage] || 0) + 1);
  Object.entries(byStage).forEach(([s, c]) => console.log("  " + s + ": " + c));
  process.exit(0);
}

seed().catch(e => { console.error("Seed failed:", e); process.exit(1); });