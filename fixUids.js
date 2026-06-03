const admin = require('firebase-admin');
const key = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

async function fixUids() {
  const doc = await db.collection('portalData').doc('customers').get();
  const customers = (doc.data() || {}).value || [];
  console.log('Customers found in portalData/customers.value:', customers.length);

  const updated = await Promise.all(customers.map(async function(c) {
    if (!c.email) return c;
    const authUser = await admin.auth().getUserByEmail(c.email).catch(function() { return null; });
    if (authUser) {
      console.log('  OK  ' + c.email + '  uid=' + authUser.uid);
      return Object.assign({}, c, { uid: authUser.uid });
    }
    console.log('  SKIP ' + c.email + ' (not in Firebase Auth)');
    return c;
  }));

  await db.collection('portalData').doc('customers').set({ value: updated });
  console.log('Done. UIDs written to ' + updated.filter(function(c){ return c.uid; }).length + ' customers.');
  process.exit(0);
}
fixUids().catch(function(e) { console.error(e.message); process.exit(1); });
