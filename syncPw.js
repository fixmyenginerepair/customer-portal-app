const admin = require('firebase-admin');
const key = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

async function syncPasswords() {
  const doc = await db.collection('portalData').doc('customers').get();
  const customers = (doc.data() || {}).value || [];
  console.log('Syncing passwords for', customers.length, 'customers...');

  for (var i = 0; i < customers.length; i++) {
    var c = customers[i];
    if (!c.email || !c.portalPassword) { console.log('  SKIP ' + (c.email || 'no-email') + ' (no portalPassword)'); continue; }
    var authUser = await admin.auth().getUserByEmail(c.email).catch(function() { return null; });
    if (!authUser) { console.log('  MISS ' + c.email + ' (not in Auth)'); continue; }
    await admin.auth().updateUser(authUser.uid, { password: c.portalPassword })
      .then(function() { console.log('  OK   ' + c.email + '  pw=' + c.portalPassword); })
      .catch(function(e) { console.log('  ERR  ' + c.email + ': ' + e.message); });
  }
  console.log('Done.');
  process.exit(0);
}
syncPasswords().catch(function(e) { console.error(e.message); process.exit(1); });
