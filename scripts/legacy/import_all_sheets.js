const admin = require('firebase-admin');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

function getAllXlsx(dir) {
  let files = [];
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(getAllXlsx(full));
    } else if (f.endsWith('.xlsx') && !f.startsWith('~')) {
      files.push(full);
    }
  });
  return files;
}

function extractCommunity(filePath) {
  const parts = filePath.split(path.sep);
  return parts[parts.length - 2] || '';
}

function normalizeLead(row, community) {
  const name = String(row['Name'] || row['name'] || row['CLIENT NAME'] || row['Client Name'] || row['OWNER'] || row['Owner'] || '').trim();
  const email = String(row['Email'] || row['email'] || row['EMAIL'] || row['E-mail'] || '').trim().toLowerCase();
  const phone = String(row['Phone'] || row['phone'] || row['PHONE'] || row['Mobile'] || row['mobile'] || row['MOBILE'] || row['Contact'] || '').trim();
  const project = String(row['Project'] || row['project'] || row['PROJECT'] || row['PROJECT NAME'] || '').trim();
  const nationality = String(row['Nationality'] || row['nationality'] || row['NATIONALITY'] || '').trim();
  const budget = String(row['Budget'] || row['budget'] || row['BUDGET'] || '').trim();
  if (!name && !phone && !email) return null;
  return {
    name, email, phone, project, community, nationality, budget,
    status: 'New',
    source: 'DLD Sheets 2022',
    createdAt: new Date().toISOString(),
    tags: [],
    followUpDate: '',
    propertyType: '',
    language: '',
    bedrooms: '',
    planType: '',
    developer: '',
    paymentType: '',
    visaEligibility: '',
    notes: '',
  };
}

async function importAll() {
  const files = getAllXlsx('C:\\Users\\TAD\\emaar-dashboard\\sheets_data');
  console.log(`Found ${files.length} files`);
  let total = 0;
  let skipped = 0;

  for (const file of files) {
    try {
      const wb = XLSX.readFile(file);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const community = extractCommunity(file);
      const leads = rows.map(r => normalizeLead(r, community)).filter(Boolean);
      if (leads.length === 0) { skipped++; continue; }

      const batchSize = 500;
      for (let i = 0; i < leads.length; i += batchSize) {
        const batch = db.batch();
        leads.slice(i, i + batchSize).forEach(lead => {
          batch.set(db.collection('leads').doc(), lead);
        });
        await batch.commit();
        total += Math.min(batchSize, leads.length - i);
      }
      console.log(`Done: ${path.basename(file)} — ${leads.length} leads | Total: ${total}`);
    } catch(e) {
      console.log(`Skipped: ${path.basename(file)} — ${e.message}`);
      skipped++;
    }
  }
  console.log(`Finished! Imported: ${total} | Skipped files: ${skipped}`);
  process.exit(0);
}

importAll().catch(err => { console.error(err); process.exit(1); });
