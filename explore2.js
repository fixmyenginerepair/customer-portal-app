const admin = require('firebase-admin');
const key = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

async function explore() {
  // Top-level collections
  const rootCols = await db.listCollections();
  console.log('ROOT collections:', rootCols.map( found nothing — the customer records are stored at a different path than the migration wrote to. Let me map the actual structure:

```powershell
@'
const admin = require('firebase-admin');
const key = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(key) });
const db = admin.firestore();

async function explore() {
  // Top-level collections
  const rootCols = await db.listc => c.id));

  // Documents inside portalData
  const portalDocs = await db.collection('portalData').listDocuments();
  console.log('portalData docs:', portalDocs.map(d => d.id));

  for (const docCollections();
  console.log('ROOT collections:', rootCols.map(c => c.id));

  // Documents inside portalData
  const portalDocs = await db.collection('portalData').listDocuments();
  console.log('portalData docs:', portalDocs.map(d => d.id));

  for (const docRef of portalDocs) {
    const snap = await docRef.get();
    const fields = Object.keys(snap.data() || {});
    console.log(`\nportalData/${docRef.id} fields:`, fields);

    // Subcollections under each doc
    const subs = await docRef.listCollections();
    console.log(`portalData/${docRef.id} subcollections:`, sRef of portalDocs) {
    const snap = await docRef.get();
    const fields = Object.keys(snap.data() || {});
    console.log(`\nportalData/${docRef.id} fields:`, fields);

    // Subcollections under each doc
    const subs = await docRef.listCollections();
    console.log(`portalData/${docRef.id} subcollections:`, subs.map(c => c.id));

    for (const sub of subs) {
      const subDocs = await sub.limit(2).get();
      subDocs.forEach(d => {
        const data = d.data();
        console.log(`  ${sub.path}/${d.id} =>`, JSON.stringify(data).ubs.map(c => c.id));

    for (const sub of subs) {
      const subDocs = await sub.limit(2).get();
      subDocs.forEach(d => {
        const data = d.data();
        console.log(`  ${sub.path}/${d.id} =>`, JSON.stringify(data).slice(0, 120));
      });
    }
  }
  process.exit(0);
}
explore().catch(e => { console.error(e.message); process.exit(1); });
