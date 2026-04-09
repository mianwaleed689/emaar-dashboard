const admin = require("firebase-admin");
const path = require("path");
const serviceAccount = require(path.join(__dirname, "..", "serviceAccountKey.json"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
const ts = admin.firestore.FieldValue.serverTimestamp;

const now = new Date();
const addDays = (d) => { const x = new Date(now); x.setDate(x.getDate() + d); return x.toISOString(); };

const LEADS = [
  { companyName: "Nakheel Properties", companyType: "Developer", companySize: "Enterprise (200+)", website: "nakheel.com", contactName: "Ahmed Al Mansoori", contactTitle: "Head of Digital", contactEmail: "ahmed.mansoori@nakheel.com", contactPhone: "+971 4 390 3333", contactLanguage: "Arabic", stage: "paid", plan: "Enterprise (AED 799)", estimatedArr: 9588, mrr: 799, source: "Referral", assignedTo: "sales@dxbanalytics.com", tags: ["flagship", "decision-maker"], notes: "Flagship developer customer. 12 active projects.", totalCalls: 8, totalEmails: 15, totalMeetings: 3 },
  { companyName: "Betterhomes Real Estate", companyType: "Agency", companySize: "Large (51-200)", website: "bhomes.com", contactName: "Ryan Cruz", contactTitle: "CEO", contactEmail: "ryan@bhomes.com", contactPhone: "+971 4 409 0000", contactLanguage: "English", stage: "paid", plan: "Enterprise (AED 799)", estimatedArr: 9588, mrr: 799, source: "Inbound", assignedTo: "sales@dxbanalytics.com", tags: ["priority", "champion"], notes: "85 agents. CSV imported 2,300 historical leads.", totalCalls: 12, totalEmails: 24, totalMeetings: 4 },
  { companyName: "Allsopp & Allsopp", companyType: "Agency", companySize: "Medium (11-50)", website: "allsoppandallsopp.com", contactName: "Lewis Allsopp", contactTitle: "Co-Founder", contactEmail: "lewis@allsoppandallsopp.com", contactPhone: "+971 4 244 0449", contactLanguage: "English", stage: "trial_started", plan: "Pro (AED 299)", estimatedArr: 3588, mrr: 0, trialEndDate: addDays(11).slice(0,10), source: "Referral", assignedTo: "sales@dxbanalytics.com", tags: ["trial", "warm"], notes: "14-day trial. 40 agents testing. Interested in Bayut integration.", nextFollowUpAt: addDays(2).slice(0,16), nextFollowUpNotes: "Check trial onboarding", totalCalls: 3, totalEmails: 8, totalMeetings: 1 },
  { companyName: "Haus & Haus", companyType: "Agency", companySize: "Medium (11-50)", website: "hausandhaus.com", contactName: "James Perry", contactTitle: "Managing Director", contactEmail: "james@hausandhaus.com", contactPhone: "+971 4 302 5800", contactLanguage: "English", stage: "demo_scheduled", plan: "Pro (AED 299)", estimatedArr: 3588, mrr: 0, source: "LinkedIn", assignedTo: "sales@dxbanalytics.com", tags: ["demo", "interested"], notes: "Demo booked for April 12. Wants to see DLD integration.", nextFollowUpAt: addDays(1).slice(0,16), nextFollowUpNotes: "Confirm demo", totalCalls: 2, totalEmails: 5, totalMeetings: 0 },
  { companyName: "LEOS Developments", companyType: "Developer", companySize: "Medium (11-50)", website: "leos.ae", contactName: "Hammad Shaikh", contactTitle: "Sales Director", contactEmail: "hammad@leos.ae", contactPhone: "+971 4 451 8000", contactLanguage: "English", stage: "demo_scheduled", plan: "Enterprise (AED 799)", estimatedArr: 9588, mrr: 0, source: "Outbound", assignedTo: "sales@dxbanalytics.com", tags: ["enterprise", "developer"], notes: "Mid-size developer with 5 projects. Interested in claim-and-verify.", nextFollowUpAt: addDays(1).slice(0,16), totalCalls: 1, totalEmails: 4, totalMeetings: 0 },
  { companyName: "Fam Properties", companyType: "Agency", companySize: "Large (51-200)", website: "famproperties.com", contactName: "Firas Al Msaddi", contactTitle: "Founder & CEO", contactEmail: "firas@famproperties.com", contactPhone: "+971 4 457 2200", contactLanguage: "Arabic", stage: "qualified", plan: "Enterprise (AED 799)", estimatedArr: 9588, mrr: 0, source: "Cold Email", assignedTo: "sales@dxbanalytics.com", tags: ["large-account"], notes: "120+ agents. Decision maker responsive.", nextFollowUpAt: addDays(1).slice(0,16), nextFollowUpNotes: "Send demo invite", totalCalls: 2, totalEmails: 4, totalMeetings: 0 },
  { companyName: "Samana Developers", companyType: "Developer", companySize: "Small (2-10)", website: "samanadevelopers.com", contactName: "Imran Farooq", contactTitle: "Marketing Head", contactEmail: "imran@samanadevelopers.com", contactPhone: "+971 4 581 1777", contactLanguage: "English", stage: "contacted", plan: "Pro (AED 299)", estimatedArr: 3588, mrr: 0, source: "LinkedIn", assignedTo: "sales@dxbanalytics.com", tags: ["follow-up"], notes: "Replied to first outreach. Needs pricing for multi-project.", nextFollowUpAt: addDays(2).slice(0,16), totalCalls: 1, totalEmails: 3, totalMeetings: 0 },
  { companyName: "Gulf Sotheby's International Realty", companyType: "Agency", companySize: "Medium (11-50)", website: "gulfsothebys.com", contactName: "George Azar", contactTitle: "Chairman", contactEmail: "george@gulfsothebys.com", contactPhone: "+971 4 423 9988", contactLanguage: "English", stage: "prospect", plan: "Enterprise (AED 799)", estimatedArr: 9588, mrr: 0, source: "Event", assignedTo: "sales@dxbanalytics.com", tags: ["luxury", "high-value"], notes: "Identified from RERA list. Luxury segment focus.", nextFollowUpAt: addDays(2).slice(0,16), totalCalls: 0, totalEmails: 0, totalMeetings: 0 },
  { companyName: "Metropolitan Premium Properties", companyType: "Agency", companySize: "Large (51-200)", website: "metropolitan.realestate", contactName: "Jelena Rajic", contactTitle: "Operations Manager", contactEmail: "jelena@metropolitan.realestate", contactPhone: "+971 4 453 3640", contactLanguage: "English", stage: "prospect", plan: "Enterprise (AED 799)", estimatedArr: 9588, mrr: 0, source: "LinkedIn", assignedTo: "sales@dxbanalytics.com", tags: ["property-management"], notes: "Property management angle. Good fit for Enterprise.", nextFollowUpAt: addDays(2).slice(0,16), totalCalls: 0, totalEmails: 0, totalMeetings: 0 },
  { companyName: "Aqua Properties", companyType: "Agency", companySize: "Medium (11-50)", website: "aquaproperties.com", contactName: "Adel Al Hashimi", contactTitle: "General Manager", contactEmail: "adel@aquaproperties.com", contactPhone: "+971 4 445 7000", contactLanguage: "Arabic", stage: "churned", plan: "Pro (AED 299)", estimatedArr: 0, mrr: 0, source: "Inbound", assignedTo: "sales@dxbanalytics.com", tags: ["churned", "competitor"], notes: "Churned after trial. Using competitor with 3-year contract.", totalCalls: 4, totalEmails: 9, totalMeetings: 1 },
];

function calculateLeadScore(l) {
  let score = 0;
  const sizeScores = { "Enterprise (200+)": 25, "Large (51-200)": 20, "Medium (11-50)": 15, "Small (2-10)": 10, "Solo": 5 };
  score += sizeScores[l.companySize] || 0;
  if (l.plan?.includes("Enterprise")) score += 20;
  else if (l.plan?.includes("Pro")) score += 10;
  const stageScores = { prospect: 0, contacted: 5, qualified: 15, demo_scheduled: 25, trial_started: 35, negotiating: 40, paid: 0, churned: 0, lost: 0 };
  score += stageScores[l.stage] || 0;
  score += 15; // recent activity
  const sourceScores = { Referral: 15, Inbound: 10, LinkedIn: 8, Event: 5, Partner: 10, Website: 8 };
  score += sourceScores[l.source] || 0;
  const eng = ((l.totalCalls || 0) * 3) + ((l.totalEmails || 0) * 2) + ((l.totalMeetings || 0) * 8);
  score += Math.min(eng, 20);
  return Math.min(Math.round(score), 100);
}

async function seed() {
  console.log("Deleting existing platformLeads...");
  const existing = await db.collection("platformLeads").get();
  for (const d of existing.docs) {
    const logs = await d.ref.collection("auditLog").get();
    for (const log of logs.docs) await log.ref.delete();
    await d.ref.delete();
  }
  console.log("Deleted " + existing.size + " old leads");
  console.log("Seeding " + LEADS.length + " rich leads...");
  const nowIso = new Date().toISOString();
  for (const l of LEADS) {
    const id = "lead_" + l.companyName.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 30);
    await db.collection("platformLeads").doc(id).set({
      ...l,
      leadScore: calculateLeadScore(l),
      lastActivityAt: nowIso,
      stageHistory: [{ stage: l.stage, at: nowIso, by: "seed-script" }],
      notes_log: [{ text: l.notes || "Lead seeded", type: "note", by: "seed-script", at: nowIso }],
      createdAt: ts(),
      updatedAt: ts(),
      stageChangedAt: ts(),
      createdBy: "seed-script",
      updatedBy: "seed-script",
    });
    console.log("  + " + l.companyName + " [" + l.stage + "] score=" + calculateLeadScore(l));
  }
  console.log("Done. " + LEADS.length + " rich leads seeded.");
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });