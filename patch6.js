const fs = require('fs');
let html = fs.readFileSync('./index.html', 'utf8');
html = html.replace(/\r\n/g, '\n');

const oldBlock = [
  "      return loadPortalData().then(function() {",
  "        var customer = customers.find(function(c) { return c && c.uid === uid; });",
  "        if (!customer) { customer = customers.find(function(c) { return c && (c.email || '').toLowerCase() === email.toLowerCase(); }); }",
  "        if (customer) {",
  "          setSession({ role: 'customer', customerId: customer.id, customerName: customer.name });",
  "          showAppForSession({ role: 'customer', customerId: customer.id, customerName: customer.name });",
  "        } else {",
  "          if (errEl) { errEl.textContent = 'Account not found. Contact the shop.'; errEl.style.display = 'block'; }",
  "          auth.signOut();",
  "        }",
  "      });",
  "    }).catch(function() {",
  "      if (errEl) { errEl.textContent = 'Invalid email or password. Please try again.'; errEl.style.display = 'block'; }",
  "    });"
].join('\n');

const newBlock = [
  "      return db.collection('portalData').doc('customers').get().then(function(doc) {",
  "        var allCustomers = (doc.data() || {}).value || [];",
  "        var customer = allCustomers.find(function(c) { return c && c.uid === uid; });",
  "        if (!customer) { customer = allCustomers.find(function(c) { return c && (c.email || '').toLowerCase() === email.toLowerCase(); }); }",
  "        if (customer) {",
  "          setSession({ role: 'customer', customerId: customer.id, customerName: customer.name });",
  "          showAppForSession({ role: 'customer', customerId: customer.id, customerName: customer.name });",
  "        } else {",
  "          if (errEl) { errEl.textContent = 'Account not found. Contact the shop.'; errEl.style.display = 'block'; }",
  "          auth.signOut();",
  "        }",
  "      });",
  "    }).catch(function(err) {",
  "      var isAuthErr = err && (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email');",
  "      var msg = isAuthErr ? 'Invalid email or password. Please try again.' : 'Login error: ' + (err && err.message ? err.message : String(err));",
  "      if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }",
  "    });"
].join('\n');

if (!html.includes(oldBlock)) { console.error('ERROR: block not found'); process.exit(1); }
html = html.replace(oldBlock, newBlock);
fs.writeFileSync('./index.html', html, 'utf8');
console.log('Patched. loadPortalData replaced with direct Firestore read.');
