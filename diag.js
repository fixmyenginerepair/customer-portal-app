const admin = require('firebase-admin');
const key = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

async function diagnose() {
  // 1. Firebase Auth
  const authUser = await admin.auth().getUserByEmail('jerry@fix.repair').catch(() => null);
  if (!authUser) { console.log('AUTH: jerry@fix.repair NOT FOUND'); }
  else {
    console.log('AUTH email:   ', authUser.email);
    console.log('AUTH uid:     ', authUser.uid);
  }

  // 2. Firestore customer record
  const snap = await db.collection('portalData/customers/customers')
    .where('email', '==', 'jerry@fix.repair').get();
  if (snap.empty) {
    console.log('FIRESTORE: No customer record found for jerry@fix.repair');
  } else {
    snap.forEach(doc => {
      const d = doc.data();
      console.log('FIRESTORE id:  ', doc.id);
      console.log('FIRESTORE uid: ', d.uid || '*** MISSING ***');
      console.log('FIRESTORE email:', d.email);
      console.log('FIRESTORE pw:   ', d.portalPassword);
    });
  }
  process.exit(0);
}
diagnose().catch(e => { console.error(e.message); process.exit(1); });
