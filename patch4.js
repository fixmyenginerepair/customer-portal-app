const fs = require('fs');
let html = fs.readFileSync('./index.html', 'utf8');
html = html.replace(/\r\n/g, '\n');

const oldLogin = [
  "    auth.signInWithEmailAndPassword(email, pw).then(function(cred) {",
  "      var uid = cred.user.uid;",
  "      var customer = customers.find(function(c) { return c && c.uid === uid; });",
  "      if (customer) {",
  "        setSession({ role: 'customer', customerId: customer.id, customerName: customer.name });",
  "        showAppForSession({ role: 'customer', customerId: customer.id, customerName: customer.name });",
  "      } else {",
  "        if (errEl) { errEl.textContent = 'Account not found. Contact the shop.'; errEl.style.display = 'block'; }",
  "        auth.signOut();",
  "      }",
  "    }).catch(function() {",
  "      if (errEl) { errEl.textContent = 'Invalid email or password. Please try again.'; errEl.style.display = 'block'; }",
  "    });"
].join('\n');

const newLogin = [
  "    auth.signInWithEmailAndPassword(email, pw).then(function(cred) {",
  "      var uid = cred.user.uid;",
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

if (!html.includes(oldLogin)) { console.error('ERROR: login block not found'); process.exit(1); }
html = html.replace(oldLogin, newLogin);
fs.writeFileSync('./index.html', html, 'utf8');
console.log('Patch applied:', html.includes('return loadPortalData()'));
