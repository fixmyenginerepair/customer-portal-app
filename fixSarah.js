const admin = require('firebase-admin');
const key = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

async function fixSarah() {
  const doc = await db.collection('portalData').doc('customers').get();
  const customers = (doc.data() || {}).value || [];

  var sarah = customers.find(function(c) { return c && c.email === 'sarah@acmecorp.com'; });
  if (!sarah) { console.log('No customer with sarah@acmecorp.com found in Firestore'); process.exit(1); }
  console.log('Found Sarah in Firestore, portalPassword:', sarah.portalPassword);

  // Delete wrong account if it exists
  var wrong = await admin.auth().getUserByEmail('sarah@fix.repair').catch(function() { return null; });
  if (wrong) {
    await admin.auth().deleteUser(wrong.uid);
    console.log('Deleted wrong account sarah@fix.repair uid=' + wrong.uid);
  }

  // Create correct account
  var pw = sarah.portalPassword || 'ChangeMe123!';
  var newUser = await admin.auth().createUser({ email: 'sarah@acmecorp.com', password: pw });
  console.log('Created sarah@acmecorp.com uid=' + newUser.uid + ' pw=' + pw);

  // Stamp UID into Firestore
  var updated = customers.map(function(c) {
    if (c && c.email === 'sarah@acmecorp.com') return Object.assign({}, c, { uid: newUser.uid });
    return c;
  });
  await db.collection('portalData').doc('customers').set({ value: updated });
  console.log('UID stamped into Firestore. Sarah is ready.');
  process.exit(0);
}
fixSarah().catch(function(e) { console.error(e.message); process.exit(1); });
