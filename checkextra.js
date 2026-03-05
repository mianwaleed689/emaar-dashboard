const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
async function check() {
  const snap = await db.collection('projectData').get();
  const baseIds = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47','48'];
  snap.docs.forEach(doc => {
    if (!baseIds.includes(doc.id)) {
      console.log('Extra doc:', doc.id, JSON.stringify(doc.data()).substring(0, 100));
    }
  });
  process.exit(0);
}
check();
