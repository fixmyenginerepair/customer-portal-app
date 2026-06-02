const admin = require('firebase-admin');
const key = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(key) });
admin.auth().updateUser('48Dvf0J4t2h5XFw64gwOIM73vTh2', { password: 'Admin123!' })
  .then(() => { console.log('Admin password set to Admin123!'); process.exit(0); })
  .catch(e => { console.error(e.message); process.exit(1); });
