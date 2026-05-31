$file = "C:\Users\jhnwi\FIXport-App\customer-portal-app\index.html"
$c = [System.IO.File]::ReadAllText($file)

$nb = @''
if (!firebase.apps.length) {
  firebase.initializeApp({
    apiKey: "AIzaSyADX44vd3lodHYX1Nsajj10CSxRfbvIK58",
    authDomain: "fixmyenginerepair-1c827.firebaseapp.com",
    projectId: "fixmyenginerepair-1c827",
    storageBucket: "fixmyenginerepair-1c827.firebasestorage.app",
    messagingSenderId: "541950034051",
    appId: "1:541950034051:web:d729437d11d3be36429bb6"
  });
}
var db = firebase.firestore();

var Storage = {
  async get(key, fallback) {
    try {
      var doc = await db.collection('portalData').doc(key).get();
      if (doc.exists) { var v = doc.data().value; if (v !== null && v !== undefined) return v; }
    } catch(e) { console.warn('Firestore get:', e); }
    return (fallback !== undefined) ? fallback : null;
  },
  async set(key, value) {
    try { await db.collection('portalData').doc(key).set({ value: value }); }
    catch(e) { console.warn('Firestore set:', e); }
  }
};
''@

if ($c -notmatch 'firebase-app-compat') {
  $cdn = '<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>' + "`r`n" + '<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>'
  $c = [regex]::Replace($c, '(<script>)', $cdn + "`r`n" + '$1', 1)
  Write-Host "OK  Firebase CDN added"
} else { Write-Host "SKIP CDN already present" }

$c2 = [regex]::Replace($c, '(?sm)var Storage = \{.*?^};', $nb)
if ($c2 -ne $c) { $c = $c2; Write-Host "OK  Firestore Storage applied (A)" }
else {
  $c2 = [regex]::Replace($c, '(?s)var Storage = \{.*?\r\n\};', $nb)
  if ($c2 -ne $c) { $c = $c2; Write-Host "OK  Firestore Storage applied (B)" }
  else { Write-Host "ERR Storage not replaced" }
}

[System.IO.File]::WriteAllText($file, $c, [System.Text.UTF8Encoding]::new($false))

Write-Host ""
Write-Host "=== Results ==="
if ($c -match 'firebase-app-compat\.js')        { Write-Host "OK  Firebase CDN" }       else { Write-Host "ERR Firebase CDN" }
if ($c -match 'firebase\.initializeApp')         { Write-Host "OK  Firebase init" }      else { Write-Host "ERR Firebase init" }
if ($c -match "db\.collection\('portalData'\)")  { Write-Host "OK  Firestore Storage" }  else { Write-Host "ERR Firestore Storage" }
Write-Host ""
Write-Host "Now run:"
Write-Host "  git add index.html"
Write-Host "  git commit -m ""Feat: Firebase Firestore cross-browser data sync"""
Write-Host "  git push"
