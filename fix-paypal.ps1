# fix-paypal.ps1 — FIXport: Replace PayPal Generate with plain-paste URL
$f = 'index.html'
$c = Get-Content $f -Raw -Encoding UTF8

# 1. Invoice DETAIL MODAL — use pasted URL directly if it starts with http
$c = $c.Replace(
  "var username=val.includes('@')?val.split('@')[0]:val;var link='https://www.paypal.com/paypalme/'+username+'/'+inv.total.toFixed(2);",
  "var link=val.startsWith('http')?val:('https://www.paypal.com/paypalme/'+val.split('@')[0]+'/'+inv.total.toFixed(2));"
)

# 2. INVOICE FORM — use pasted URL directly if it starts with http
$c = $c.Replace(
  "var username=val.includes('@')?val.split('@')[0]:val;var t=calcTotals();var link='https://www.paypal.com/paypalme/'+username+'/'+t.total.toFixed(2);",
  "var t=calcTotals();var link=val.startsWith('http')?val:('https