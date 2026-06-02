const fs = require('fs');
let html = fs.readFileSync('./index.html', 'utf8');
html = html.replace(/\r\n/g, '\n');

// --- HTML: insert after the Sign In button (line 235), before the error div ---
const btnAnchor = 'id="login-cust-btn-b1">Sign In</button>';
if (!html.includes(btnAnchor)) { console.error('ERROR: login-cust-btn-b1 not found'); process.exit(1); }

const fpHtml = [
  '',
  '      <div style="text-align:right;margin:6px 0 2px;">',
  '        <button id="fp-btn-f1" type="button" style="background:none;border:none;color:var(--accent);font-size:13px;cursor:pointer;padding:0;font-family:inherit;opacity:0.85;">Forgot password?</button>',
  '      </div>',
  '      <div id="fp-success-f1" style="display:none;font-size:13px;margin-top:8px;text-align:center;padding:10px 14px;background:rgba(74,222,128,0.12);color:#4ade80;border-radius:8px;"></div>'
].join('\n');

html = html.replace(btnAnchor, btnAnchor + fpHtml);
console.log('HTML patch applied:', html.includes('fp-btn-f1'));

// --- JS: insert forgot password handler before "// Admin login" ---
const fpJs = [
  '  // Forgot password',
  "  var fpBtn = document.getElementById('fp-btn-f1');",
  "  if (fpBtn) fpBtn.addEventListener('click', function() {",
  "    var emailEl = document.getElementById('login-email-e1');",
  "    var email = emailEl ? emailEl.value.trim() : '';",
  "    var errEl = document.getElementById('login-cust-error-e1');",
  "    var okEl  = document.getElementById('fp-success-f1');",
  "    if (errEl) errEl.style.display = 'none';",
  "    if (okEl)  okEl.style.display  = 'none';",
  "    if (!email) {",
  "      if (errEl) { errEl.textContent = 'Enter your email address above first.'; errEl.style.display = 'block'; }",
  "      return;",
  "    }",
  "    auth.sendPasswordResetEmail(email).then(function() {",
  "      if (okEl) { okEl.textContent = 'Reset link sent \u2014 check your inbox.'; okEl.style.display = 'block'; }",
  "    }).catch(function(err) {",
  "      var msg = err.code === 'auth/user-not-found' ? 'No account with that email.' : 'Could not send reset email. Try again.';",
  "      if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }",
  "    });",
  "  });"
].join('\n');

const adminAnchor = '  // Admin login';
if (!html.includes(adminAnchor)) { console.error('ERROR: // Admin login anchor not found'); process.exit(1); }
html = html.replace(adminAnchor, fpJs + '\n\n' + adminAnchor);

fs.writeFileSync('./index.html', html, 'utf8');
console.log('fp link in HTML:         ' + html.includes('fp-btn-f1'));
console.log('fp success div in HTML:  ' + html.includes('fp-success-f1'));
console.log('sendPasswordResetEmail:  ' + html.includes('sendPasswordResetEmail'));
