const admin = require("firebase-admin");
const sa = require("../serviceAccountKey.json");
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// Arabic to English developer mapping
const DEV_MAP = {
  "شركة نخيل (ش.م.خ)":                    "Nakheel",
  "قرية جميرا (ش.ذ.م.م)":                  "Jumeirah Village",
  "مجموعة ميدان (ش.ذ.م.م)":                "Meydan Group",
  "اعمار العقارية (ش . م. ع)":              "Emaar Properties",
  "ليوان(ش.ذ.م.م.)":                        "Liwan",
  "دبي للعقارات (ش.ذ.م.م)":                "Dubai Properties",
  "الخليج التجاري (ش.ذ.م.م)":              "Business Bay Developer",
  "مؤسسه مدينه دبى للطيران":               "Dubai Aviation City",
  "دبي لاند ريزيدنسز (ش.ذ.م.م)":           "Dubai Land Residences",
  "مراس العقارية (ش.ذ.م.م)":              "Marsa Real Estate",
  "شركة تيكوم للاستثمارات":                "TECOM Investments",
  "تيكوم للإستثمارات منطقة حرة- ذ.م.م":   "TECOM Investments",
  "دبي للتطوير (ش.م.خ)":                   "Dubai Holding",
  "شركة دبي للعقارات (ش.م.خ)":             "Dubai Properties",
  "سوبر إيكو ريل استيت ديفلوبمنت":         "Super Eco Real Estate",
  "شركة الاتحاد العقارية (ش.م.خ)":         "Union Properties",
  "شركه اعمار للتطوير العقاري (ش.م.خ)":    "Emaar Development",
  "دانوب العقارية":                          "Danube Properties",
  "عزيزي للتطوير العقاري (ش.م.خ)":         "Azizi Developments",
  "بن غاطي للتطوير العقاري":               "Binghatti",
  "شركة نور للتطوير العقاري":              "Noor Real Estate",
};

const BANK_MAP = {
  "بنك دبي التجاري (ش.م.ع)":               "Commercial Bank of Dubai",
  "مصرف عجمان/ ش.م.ع":                     "Ajman Bank",
  "مصرف الامارات الاسلامي مساهمة":         "Emirates Islamic Bank",
  "بنك الإمارات دبي الوطني (ش.م.ع)":       "Emirates NBD Bank",
  "بنك أبوظبي التجاري":                    "Abu Dhabi Commercial Bank",
  "بنك المشرق (شركة مساهمة عامة)":         "Mashreq Bank",
  "بنك دبي الإسلامي (ش.م.ع)":              "Dubai Islamic Bank",
  "بنك أبوظبي الأول":                      "First Abu Dhabi Bank",
  "الهيئه العامه لتنظيم القطاع العقاري":   "RERA",
};

const isArabic = s => /[\u0600-\u06FF]/.test(s||"");

async function run() {
  const snap = await db.collection("projects").get();
  const docs = snap.docs;
  
  let fixed = 0;
  const BATCH_SIZE = 400;

  for(let i=0;i<docs.length;i+=BATCH_SIZE) {
    const batch = db.batch();
    docs.slice(i,i+BATCH_SIZE).forEach(d=>{
      const p = d.data();
      const updates = {};

      // Fix Arabic developer
      if(isArabic(p.developer||"")) {
        updates.developer = DEV_MAP[p.developer] || 
          (p.developer||"").replace(/[\u0600-\u06FF\s()،.\/]+/g,"").trim() || "Unknown Developer";
      }

      // Fix Arabic escrow bank
      if(isArabic(p.escrowBank||"")) {
        updates.escrowBank = BANK_MAP[p.escrowBank] ||
          (p.escrowBank||"").replace(/[\u0600-\u06FF\s()،.\/]+/g,"").trim() || "Local Bank";
      }

      // Fix bad names
      if(!p.name||p.name==="."||p.name.trim()==="") {
        updates.name = (p.masterProject||p.community||"Unknown")+" Project "+p.projectNumber;
      }

      // Fix undefined handoverQuarter
      if(p.handoverQuarter==="undefined"||p.handoverQuarter===undefined) {
        updates.handoverQuarter = null;
      }

      if(Object.keys(updates).length>0) {
        batch.update(d.ref, updates);
        fixed++;
      }
    });
    await batch.commit();
    console.log(`Batch ${Math.floor(i/BATCH_SIZE)+1} done`);
  }

  console.log("Fixed:", fixed, "projects");
  process.exit(0);
}
run().catch(e=>{console.error(e);process.exit(1);});