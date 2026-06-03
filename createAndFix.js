const admin = require('firebase-admin');
const key = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

async function createAndFix() {
  const doc = await db.collection('portalData').doc('customers').get();
  const customers = (doc.data() || {}).value || [];
  console.log('Total customers:', customers.length);

  const updated = await Promise.all(customers.map(async function(c) {
    if (!c.email) return c;

    var authUser = await admin.auth().getUserByEmail(c.email).catch(function() { return null; });

    if (!authUser) {
      var pw = c.portalPassword || c.password || 'ChangeMe123!';
      authUser = await admin.auth().createUser({ email: c.email, password: pw })
        .catch(function(e) { console.log('  ERR ' + c.email + ': ' + e.message); return null; });
      if (authUser) console.log('  CREATED ' + c.email + '  uid=' + authUser.uid);
    } else {
      console.log('  EXISTS  ' + c.email + '  uid=' + authUser.uid);
    }

    if (authUser) return Object.assign({}, c, { uid: authUser.uid });
    return c;
  }));

  await db.collection('portalData').doc('customers').set({ value: updated });
  var stamped = updated.filter(function(c) { return c.uid; }).length;
  console.log('Done. ' + stamped + ' of ' + customers.length + ' customers have UIDs.');
  process.exit(0);
}
createAndFix().catch(function(e) { console.error(e.message); process.exit(1); });
