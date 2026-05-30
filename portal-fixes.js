// portal-fixes.js — FIXport: Equipment Tab + Site Backup + PayPal plain-paste
document.addEventListener('DOMContentLoaded', function () {

  /* ═══════════════════════════════════════════════════
     FIX 1 — EQUIPMENT TAB IN CUSTOMER PORTAL
  ══════════════════════════════════════════════════ */

  var _origInitCP = window.initCustomerPortal;
  window.initCustomerPortal = function (session) {
    if (_origInitCP) _origInitCP.call(this, session);
    setTimeout(function () {
      var tabBar = document.getElementById('cp-tab-bar-t1');
      if (!tabBar || tabBar.querySelector('[data-ctab="equipment"]')) return;
      var payTab = tabBar.querySelector('[data-ctab="payment"]');
      if (!payTab) return;
      var btn = document.createElement('button');
      btn.className = 'customer-tab';
      btn.setAttribute('data-ctab', 'equipment');
      btn.textContent = '\uD83D\uDEE0\uFE0F Equipment';
      tabBar.insertBefore(btn, payTab);
      btn.addEventListener('click', function () {
        tabBar.querySelectorAll('.customer-tab').forEach(function (t) { t.classList.remove('active'); });
        btn.classList.add('active');
        window.renderCustomerTab('equipment', session);
      });
    }, 0);
  };

  var _origRCT = window.renderCustomerTab;
  window.renderCustomerTab = function (tab, session) {
    if (tab !== 'equipment') { return _origRCT.apply(this, arguments); }
    var el = document.getElementById('cp-content-area-c1');
    if (!el) return;
    var cid = session.customerId;
    var allRes = (typeof resources !== 'undefined') ? resources : [];
    var custEquip = allRes.filter(function (r) {
      return r && Array.isArray(r.customerIds) && r.customerIds.indexOf(cid) !== -1;
    });
    if (custEquip.length === 0) {
      el.innerHTML =
        '<div class="stat-card"><div class="empty-state">' +
        '<p style="font-size:40px;margin:0 0 8px;">\uD83D\uDEE0\uFE0F</p>' +
        '<p style="font-size:16px;font-weight:600;color:var(--text-primary);margin:0 0 4px;">No equipment on file</p>' +
        '<p style="font-size:13px;color:var(--text-muted);margin:0;">Contact us to have your equipment added.</p>' +
        '</div></div>';
      return;
    }
    el.innerHTML =
      '<div style="margin-bottom:16px;">' +
      '<h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin:0 0 4px;">\uD83D\uDEE0\uFE0F Your Equipment</h3>' +
      '<p style="font-size:13px;color:var(--text-muted);margin:0;">Records and manuals linked to your account.</p>' +
      '</div>' +
      custEquip.map(function (r) {
        var catBadge = (typeof resCatBadge === 'function') ? resCatBadge(r.category) : '';
        var pdfBtn = r.fileData
          ? '<button onclick="(typeof openResPdf===\'function\')&&openResPdf(\'' + r.id + '\')" ' +
            'style="background:#1B4D2A;color:white;border:none;border-radius:8px;padding:8px 14px;' +
            'font-size:12px;font-weight:700;cursor:pointer;">\uD83D\uDCC4 View Manual</button>'
          : '<span style="font-size:12px;color:var(--text-muted);">No manual on file</span>';
        return '<div class="stat-card" style="margin-bottom:12px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">' +
          '<div style="font-weight:700;font-size:15px;color:var(--text-primary);">' + (r.title || 'Unnamed') + '</div>' +
          catBadge + '</div>' +
          (r.make || r.model || r.year
            ? '<div style="font-size:13px;color:var(--text-muted);margin-bottom:6px;">' +
              [r.make, r.model, r.year].filter(Boolean).join(' \u00B7 ') + '</div>'
            : '') +
          (r.notes ? '<div style="font-size:13px;color:var(--text-muted);margin-bottom:8px;">' + r.notes + '</div>' : '') +
          pdfBtn + '</div>';
      }).join('');
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') lucide.createIcons();
  };

  /* ═══════════════════════════════════════════════════
     FIX 2 — SITE BACKUP (Export & Import)
  ══════════════════════════════════════════════════ */

  var BACKUP_KEYS = ['customers','invoices','repairs','parts','fme_settings',
                     'resources','appointments','fme_alerts'];

  window.exportSiteData = function () {
    var data = { _exportDate: new Date().toISOString(), _version: '1.0' };
    BACKUP_KEYS.forEach(function (k) {
      try { data[k] = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { data[k] = null; }
    });
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'FIXport-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    if (typeof showToast === 'function') showToast('Backup downloaded!', 'success');
  };

  window.importSiteData = function () {
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json';
    inp.onchange = function (e) {
      var file = e.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        try {
          var data = JSON.parse(ev.target.result);
          if (!data || typeof data !== 'object') throw new Error('Invalid');
          BACKUP_KEYS.forEach(function (k) {
            if (data[k] !== undefined && data[k] !== null)
              localStorage.setItem(k, JSON.stringify(data[k]));
          });
          if (typeof showToast === 'function') showToast('Backup restored! Reloading\u2026', 'success');
          setTimeout(function () { location.reload(); }, 1500);
        } catch (err) {
          if (typeof showToast === 'function') showToast('Invalid backup file.', 'error');
        }
      };
      reader.readAsText(file);
    };
    document.body.appendChild(inp); inp.click(); document.body.removeChild(inp);
  };

  var _origRS = window.renderSettings;
  window.renderSettings = function (el) {
    if (_origRS) _origRS.call(this, el);
    setTimeout(function () {
      if (!el || document.getElementById('fme-backup-panel')) return;
      var panel = document.createElement('div');
      panel.id = 'fme-backup-panel';
      panel.className = 'stat-card';
      panel.style.marginTop = '20px';
      panel.innerHTML =
        '<h3 style="font-size:15px;font-weight:700;color:var(--text-primary);margin:0 0 6px;">\uD83D\uDCBE Site Backup</h3>' +
        '<p style="font-size:13px;color:var(--text-muted);margin:0 0 14px;">' +
        'Export all your data to a safe file, or restore from a previous backup.</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
        '<button onclick="exportSiteData()" style="background:#1B4D2A;color:white;border:none;' +
        'border-radius:10px;padding:11px 20px;font-size:13px;font-weight:700;cursor:pointer;">' +
        '\u2B07\uFE0F Export Backup</button>' +
        '<button onclick="importSiteData()" style="background:#f2f6f2;color:#1B4D2A;' +
        'border:1px solid #d4e6d4;border-radius:10px;padding:11px 20px;font-size:13px;font-weight:700;cursor:pointer;">' +
        '\u2B06\uFE0F Import Backup</button>' +
        '</div>';
      el.appendChild(panel);
    }, 50);
  };

  /* ═══════════════════════════════════════════════════
     FIX 3 — PAYPAL: strip dollar from payment tab button
     (The per-invoice Pay Now button already uses the link as-is)
  ══════════════════════════════════════════════════ */
  // Payment tab "Pay Now" button already uses inv.paypalLink as a plain href (line 752).
  // The only place dollar amount appears in button text is the Payment tab summary.
  // This patch changes "Pay $X.XX Now" → "Pay Now via PayPal" on that tab.
  var _origRCT2 = window.renderCustomerTab;
  window.renderCustomerTab = (function (orig) {
    return function (tab, session) {
      orig.apply(this, arguments);
      if (tab !== 'payment') return;
      // Fix button label — replace "Pay $X.XX Now" text with "Pay Now via PayPal"
      var el = document.getElementById('cp-content-area-c1');
      if (!el) return;
      el.querySelectorAll('a[href]').forEach(function (a) {
        if (/paypal/i.test(a.href) && /Pay .+ Now/i.test(a.textContent)) {
          a.textContent = 'Pay Now via PayPal';
        }
      });
    };
  })(window.renderCustomerTab);

});

// ══ PAYPAL PLAIN-PASTE FIX ══
(function() {
  document.addEventListener('click', function(e) {
    var t = e.target;
    // Invoice form: intercept Generate Link button
    if (t && t.id === 'if-gen-paypal') {
      e.stopImmediatePropagation();
      var inp = document.getElementById('if-paypal-p1f2');
      var url = inp ? inp.value.trim() : '';
      if (!url) { if (typeof showToast==='function') showToast('Paste your PayPal invoice URL first.','error'); return; }
      var r = document.getElementById('if-paypal-result');
      if (r) r.innerHTML = '<div style="margin-top:8px;"><a href="'+url+'" target="_blank" style="color:#1B4D2A;word-break:break-all;font-size:13px;">'+url+'</a></div>';
      if (typeof showToast==='function') showToast('PayPal link ready — save the invoice to keep it.','success');
      return;
    }
    // Invoice detail modal: intercept Generate Link button
    if (t && t.id === 'pp-generate') {
      e.stopImmediatePropagation();
      var inp2 = document.getElementById('pp-email-p1m2');
      var url2 = inp2 ? inp2.value.trim() : '';
      if (!url2) { if (typeof showToast==='function') showToast('Paste your PayPal invoice URL first.','error'); return; }
      if (typeof invoices !== 'undefined') {
        var visible = document.body.innerText || '';
        var inv = (invoices||[]).find(function(i){return i&&i.invoiceNumber&&visible.includes(i.invoiceNumber);});
        if (inv) { inv.paypalLink=url2; inv.paypalEmail=url2; if(typeof saveAll==='function') saveAll(); }
      }
      var rEl = document.getElementById('pp-result-r1m2');
      if (rEl) rEl.innerHTML = '<div class="paypal-link-box" style="margin-top:16px;"><a href="'+url2+'" target="_blank">'+url2+'</a></div>';
      if (typeof showToast==='function') showToast('PayPal link saved!','success');
      return;
    }
  }, true);
  // Relabel fields via MutationObserver
  var obs = new MutationObserver(function() {
    var b = document.getElementById('if-gen-paypal');
    if (b && !b.dataset.ppfixed) {
      b.dataset.ppfixed='1'; b.textContent='Save PayPal Link';
      var inp=document.getElementById('if-paypal-p1f2');
      if(inp){inp.placeholder='https://www.paypal.com/invoice/p/#...';}
      var lbl=inp&&inp.closest('div')&&inp.closest('div').querySelector('label');
      if(lbl)lbl.textContent='PayPal Invoice Link (paste from PayPal)';
    }
    var b2=document.getElementById('pp-generate');
    if(b2&&!b2.dataset.ppfixed){b2.dataset.ppfixed='1';b2.textContent='Save Link';}
    var p=document.getElementById('pp-email-p1m2');
    if(p&&!p.dataset.ppfixed){
      p.dataset.ppfixed='1';p.placeholder='https://www.paypal.com/invoice/p/#...';
      var lbl2=p.closest('div')&&p.closest('div').querySelector('label');
      if(lbl2)lbl2.textContent='PayPal Invoice Link (paste from PayPal)';
    }
  });
  obs.observe(document.body,{childList:true,subtree:true});
})();

// == PAYPAL SAVE FIX: strip dollar amount before persisting ==
(function(){
  function fixPPLinks(){
    if(typeof invoices==='undefined')return;
    invoices.forEach(function(inv){
      if(!inv)return;
      // If paypalEmail is a full URL the user pasted, use it directly as the link
      if(inv.paypalEmail && /^https?:\/\//.test(inv.paypalEmail)){
        inv.paypalLink = inv.paypalEmail;
        return;
      }
      // If paypalLink has a URL embedded inside a paypalme/ path (e.g. paypalme/https://paypal.com/invoice/p/#.../150.00)
      if(inv.paypalLink && /paypalme\/https?:\/\//.test(inv.paypalLink)){
        var m = inv.paypalLink.match(/paypalme\/(https?:\/\/.+?)(?:\/[\d]+\.[\d]{2})?$/);
        if(m) inv.paypalLink = m[1];
      }
    });
  }
  var _origSave = window.saveAll;
  if(typeof _origSave === 'function'){
    window.saveAll = async function(){ fixPPLinks(); return await _origSave.apply(this, arguments); };
  }
})();

// == REPAIR PROGRESS TRACKER ==
(function(){
  function repairStep(status){
    var s=(status||'').toLowerCase().replace(/[\s_]/g,'-');
    if(['completed','complete','finished','closed','picked-up','delivered'].indexOf(s)!==-1)return 4;
    if(['ready','ready-pickup','waiting','awaiting-pickup','ready-for-pickup'].indexOf(s)!==-1)return 3;
    if(['in-progress','working','diagnosing','repairing','active','in-repair'].indexOf(s)!==-1)return 2;
    return 1;
  }
  function progressBar(status){
    var step=repairStep(status);
    var labels=['Received','In Progress','Ready','Completed'];
    var circles='<div style="display:flex;align-items:center;">';
    labels.forEach(function(lbl,i){
      var n=i+1,done=step>n,active=step===n;
      var bg=done?'#8DC63F':active?'#1B4D2A':'#edf4ed';
      var bc=done||active?'#8DC63F':'#d4e6d4';
      var tc=done||active?'#fff':'#b0c8b0';
      circles+='<div style="width:28px;height:28px;border-radius:50%;background:'+bg+';border:2px solid '+bc+
        ';display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:'+tc+
        ';flex-shrink:0;box-shadow:'+(active?'0 0 0 3px rgba(141,198,63,0.3)':'none')+';">'+(done?'&#10003;':n)+'</div>';
      if(i<labels.length-1)
        circles+='<div style="flex:1;height:3px;background:'+(done?'#8DC63F':'#d4e6d4')+
          ';margin:0 2px;border-radius:2px;"></div>';
    });
    circles+='</div>';
    var lbls='<div style="display:flex;margin-top:6px;">';
    labels.forEach(function(lbl,i){
      var n=i+1,done=step>n,active=step===n;
      var tc=done||active?'#1B4D2A':'#b0c8b0';
      var fw=active?'700':'500';
      lbls+='<div style="flex:1;font-size:9px;font-weight:'+fw+';color:'+tc+
        ';text-align:center;line-height:1.2;">'+lbl+'</div>';
    });
    lbls+='</div>';
    return '<div style="background:#f4fbf4;border-radius:10px;padding:14px 12px 10px;'+
      'margin-bottom:12px;border:1px solid #d4e6d4;">'+circles+lbls+'</div>';
  }
  var _prev=window.renderCustomerTab;
  window.renderCustomerTab=function(tab,session){
    _prev.apply(this,arguments);
    if(tab!=='repairs')return;
    setTimeout(function(){
      var area=document.getElementById('cp-content-area-c1');
      if(!area)return;
      var cards=area.querySelectorAll('.stat-card');
      if(!cards.length)return;
      var cid=session.customerId;
      var repList=(typeof repairs!=='undefined'?repairs:[]).filter(function(r){return r&&r.customerId===cid;});
      repList.forEach(function(rep,idx){
        var card=cards[idx];
        if(!card||card.dataset.ptAdded)return;
        card.dataset.ptAdded='1';
        card.insertAdjacentHTML('afterbegin',progressBar(rep.status));
      });
    },60);
  };
})();

// == CUSTOMER APPOINTMENT TAB + CONFIRM BUTTON ==
(function(){

  function apptStatusBadge(s){
    var m={
      pending:['Pending','#fef3c7','#d97706'],
      confirmed:['Confirmed','#dcfce7','#1B4D2A'],
      cancelled:['Cancelled','#fee2e2','#dc2626'],
      completed:['Completed','#f2f6f2','#5a7a5a']
    };
    var x=m[s]||m.pending;
    return '<span style="background:'+x[1]+';color:'+x[2]+';padding:3px 10px;border-radius:20px;'+
      'font-size:11px;font-weight:700;">'+x[0]+'</span>';
  }

  function formatApptDate(d,t){
    if(!d)return'';
    var parts=d.split('-');
    if(parts.length<3)return d;
    var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var str=months[parseInt(parts[1],10)-1]+' '+parseInt(parts[2],10)+', '+parts[0];
    if(t){
      var tp=t.split(':');
      var h=parseInt(tp[0],10),m=tp[1],ampm=h>=12?'PM':'AM';
      h=h%12||12;
      str+=' at '+h+':'+m+' '+ampm;
    }
    return str;
  }

  // Inject Appointments tab into portal tab bar
  var _origInitCP2=window.initCustomerPortal;
  window.initCustomerPortal=function(session){
    if(_origInitCP2)_origInitCP2.call(this,session);
    setTimeout(function(){
      var tabBar=document.getElementById('cp-tab-bar-t1');
      if(!tabBar||tabBar.querySelector('[data-ctab="appointments"]'))return;
      // Insert after repairs tab
      var repairsTab=tabBar.querySelector('[data-ctab="repairs"]');
      var btn=document.createElement('button');
      btn.className='customer-tab';
      btn.setAttribute('data-ctab','appointments');
      btn.innerHTML='&#x1F4C5; Appointments';
      if(repairsTab&&repairsTab.nextSibling){
        tabBar.insertBefore(btn,repairsTab.nextSibling);
      } else {
        tabBar.appendChild(btn);
      }
      btn.addEventListener('click',function(){
        tabBar.querySelectorAll('.customer-tab').forEach(function(t){t.classList.remove('active');});
        btn.classList.add('active');
        window.renderCustomerTab('appointments',session);
      });
    },0);
  };

  // Render appointments tab
  var _origRCT3=window.renderCustomerTab;
  window.renderCustomerTab=function(tab,session){
    if(tab!=='appointments'){return _origRCT3.apply(this,arguments);}
    var el=document.getElementById('cp-content-area-c1');
    if(!el)return;
    var cid=session.customerId;
    var custAppts=(typeof appointments!=='undefined'?appointments:[])
      .filter(function(a){return a&&a.customerId===cid;})
      .sort(function(a,b){return(a.date+a.time)<(b.date+b.time)?-1:1;});

    if(custAppts.length===0){
      el.innerHTML='<div class="stat-card"><div class="empty-state">'+
        '<p style="font-size:40px;margin:0 0 8px;">&#x1F4C5;</p>'+
        '<p style="font-size:16px;font-weight:600;color:var(--text-primary);margin:0 0 4px;">No appointments scheduled</p>'+
        '<p style="font-size:13px;color:var(--text-muted);margin:0;">We\'ll schedule your next appointment soon.</p>'+
        '</div></div>';
      return;
    }

    el.innerHTML=custAppts.map(function(a){
      var isConfirmed=a.status==='confirmed';
      var custConfirmed=a.customerConfirmed;
      var bc=a.status==='confirmed'?'#8DC63F':a.status==='cancelled'?'#dc2626':'#F47920';

      // Confirm button or confirmation status
      var confirmSection='';
      if(a.status==='cancelled'){
        confirmSection='<div style="margin-top:12px;padding:10px 14px;background:#fee2e2;border-radius:8px;'+
          'font-size:13px;color:#dc2626;font-weight:600;">&#x26A0;&#xFE0F; This appointment has been cancelled.</div>';
      } else if(a.status==='completed'){
        confirmSection='<div style="margin-top:12px;padding:10px 14px;background:#f2f6f2;border-radius:8px;'+
          'font-size:13px;color:#5a7a5a;font-weight:600;">&#x2714;&#xFE0F; Appointment completed.</div>';
      } else if(isConfirmed&&!custConfirmed){
        confirmSection='<div style="margin-top:12px;padding:14px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);'+
          'border-radius:10px;border:1px solid #86efac;">'+
          '<p style="font-size:13px;font-weight:700;color:#1B4D2A;margin:0 0 10px;">&#x1F514; Please confirm your appointment</p>'+
          '<button onclick="customerConfirmAppt(\''+a.id+'\',\''+cid+'\',\''+session.customerName+'\')" '+
          'style="background:#1B4D2A;color:white;border:none;border-radius:10px;padding:11px 22px;'+
          'font-size:13px;font-weight:700;cursor:pointer;width:100%;">&#x2713; Confirm My Appointment</button></div>';
      } else if(custConfirmed){
        confirmSection='<div style="margin-top:12px;padding:10px 14px;background:#dcfce7;border-radius:8px;'+
          'display:flex;align-items:center;gap:8px;">'+
          '<span style="font-size:18px;">&#x2705;</span>'+
          '<span style="font-size:13px;font-weight:700;color:#1B4D2A;">You confirmed this appointment</span></div>';
      } else {
        confirmSection='<div style="margin-top:12px;padding:10px 14px;background:#fef3c7;border-radius:8px;'+
          'font-size:13px;color:#d97706;font-weight:600;">&#x23F3; Awaiting confirmation from our team</div>';
      }

      return '<div class="stat-card" style="margin-bottom:14px;border-left:4px solid '+bc+';">'+
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">'+
        '<div style="font-weight:700;font-size:15px;color:var(--text-primary);">'+a.title+'</div>'+
        apptStatusBadge(a.status)+'</div>'+
        '<div style="font-size:13px;color:var(--text-muted);margin-bottom:4px;">&#x1F4C5; '+formatApptDate(a.date,a.time)+'</div>'+
        '<div style="font-size:13px;color:var(--text-muted);margin-bottom:4px;">&#x23F1;&#xFE0F; '+a.duration+' min &nbsp;&#x00B7;&nbsp; '+
        (a.type?a.type.charAt(0).toUpperCase()+a.type.slice(1):'')+'</div>'+
        (a.notes?'<div style="font-size:13px;color:var(--text-muted);margin-bottom:4px;">&#x1F4DD; '+a.notes+'</div>':'')+
        confirmSection+'</div>';
    }).join('');
  };

  // Global confirm handler
  window.customerConfirmAppt=function(apptId,custId,custName){
    var appt=(typeof appointments!=='undefined'?appointments:[]).find(function(a){return a.id===apptId;});
    if(!appt)return;
    appt.customerConfirmed=true;
    if(typeof saveAppointments==='function')saveAppointments();
    if(typeof addAdminAlert==='function')
      addAdminAlert('appointment_confirmed',
        (custName||'Customer')+' confirmed: '+appt.title+' on '+appt.date,
        custId,custName);
    // Refresh the tab
    var session={customerId:custId,customerName:custName};
    window.renderCustomerTab('appointments',session);
    if(typeof showToast==='function')showToast('Appointment confirmed! We\'ll see you then.','success');
  };

})();

// == ADMIN APPOINTMENTS PAGE ==
(function(){

  function renderAdminAppointments(el){
    if(!el)el=document.getElementById('main-content');
    if(!el)return;

    var allAppts=(typeof appointments!=='undefined'?appointments:[])
      .sort(function(a,b){return(a.date+a.time)<(b.date+b.time)?-1:1;});

    function custName(cid){
      var c=(typeof customers!=='undefined'?customers:[]).find(function(x){return x&&x.id===cid;});
      return c?c.name:'Unknown';
    }

    function sBadge(s){
      var m={pending:['Pending','#fef3c7','#d97706'],confirmed:['Confirmed','#dcfce7','#1B4D2A'],
             cancelled:['Cancelled','#fee2e2','#dc2626'],completed:['Completed','#f2f6f2','#5a7a5a']};
      var x=m[s]||m.pending;
      return '<span style="background:'+x[1]+';color:'+x[2]+';padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">'+x[0]+'</span>';
    }

    function fmtDt(d,t){
      if(!d)return'—';
      var p=d.split('-'),months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var s=months[parseInt(p[1],10)-1]+' '+parseInt(p[2],10)+', '+p[0];
      if(t){var tp=t.split(':'),h=parseInt(tp[0],10),mn=tp[1],ap=h>=12?'PM':'AM';h=h%12||12;s+=' · '+h+':'+mn+' '+ap;}
      return s;
    }

    // Stats
    var total=allAppts.length;
    var pending=allAppts.filter(function(a){return a.status==='pending';}).length;
    var confirmed=allAppts.filter(function(a){return a.status==='confirmed';}).length;
    var today=new Date().toISOString().slice(0,10);
    var todayAppts=allAppts.filter(function(a){return a.date===today;}).length;

    el.innerHTML=
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;">'+
      '<div><h2 style="font-size:20px;font-weight:800;color:#1B4D2A;margin:0;">&#x1F4C5; Appointments</h2>'+
      '<div style="font-size:13px;color:#5a7a5a;">All scheduled appointments</div></div>'+
      '<button onclick="openApptModalAdmin(null,null)" style="background:#8DC63F;color:#1B4D2A;border:none;border-radius:10px;'+
      'padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;">+ New Appointment</button></div>'+

      // Stats row
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px;">'+
      '<div class="stat-card" style="text-align:center;padding:16px;">'+
      '<div style="font-size:26px;font-weight:800;color:#1B4D2A;">'+total+'</div>'+
      '<div style="font-size:11px;font-weight:600;color:#5a7a5a;text-transform:uppercase;">Total</div></div>'+
      '<div class="stat-card" style="text-align:center;padding:16px;">'+
      '<div style="font-size:26px;font-weight:800;color:#F47920;">'+todayAppts+'</div>'+
      '<div style="font-size:11px;font-weight:600;color:#5a7a5a;text-transform:uppercase;">Today</div></div>'+
      '<div class="stat-card" style="text-align:center;padding:16px;">'+
      '<div style="font-size:26px;font-weight:800;color:#8DC63F;">'+confirmed+'</div>'+
      '<div style="font-size:11px;font-weight:600;color:#5a7a5a;text-transform:uppercase;">Confirmed</div></div>'+
      '<div class="stat-card" style="text-align:center;padding:16px;">'+
      '<div style="font-size:26px;font-weight:800;color:#d97706;">'+pending+'</div>'+
      '<div style="font-size:11px;font-weight:600;color:#5a7a5a;text-transform:uppercase;">Pending</div></div>'+
      '</div>'+

      // Appointment list
      (allAppts.length===0?
        '<div style="text-align:center;padding:60px 20px;color:#5a7a5a;">'+
        '<div style="font-size:48px;">&#x1F4C5;</div>'+
        '<p style="font-weight:600;">No appointments yet.</p>'+
        '<p style="font-size:13px;">Click "+ New Appointment" to schedule one.</p></div>':
        allAppts.map(function(a){
          var bc=a.status==='confirmed'?'#8DC63F':a.status==='cancelled'?'#dc2626':a.status==='completed'?'#d4e6d4':'#F47920';
          var isToday=a.date===today;
          return '<div class="stat-card" style="margin-bottom:10px;border-left:4px solid '+bc+';'+
            (isToday?'background:linear-gradient(135deg,#f8fff8,#f0fdf4);':'')+'">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">'+
            '<div style="flex:1;">'+
            '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">'+
            '<span style="font-weight:700;font-size:14px;color:#1B4D2A;">'+a.title+'</span>'+
            (isToday?'<span style="background:#8DC63F;color:#1B4D2A;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;">TODAY</span>':'')+
            sBadge(a.status)+'</div>'+
            '<div style="font-size:13px;color:#5a7a5a;margin-bottom:3px;">&#x1F464; <strong>'+custName(a.customerId)+'</strong></div>'+
            '<div style="font-size:13px;color:#5a7a5a;margin-bottom:3px;">&#x1F4C5; '+fmtDt(a.date,a.time)+' &nbsp;·&nbsp; &#x23F1;&#xFE0F; '+a.duration+' min &nbsp;·&nbsp; '+
            (a.type?a.type.charAt(0).toUpperCase()+a.type.slice(1):'')+'</div>'+
            (a.notes?'<div style="font-size:12px;color:#5a7a5a;">&#x1F4DD; '+a.notes+'</div>':'')+
            '<div style="margin-top:6px;">'+
            (a.customerConfirmed?
              '<span style="font-size:11px;color:#1B4D2A;font-weight:700;background:#dcfce7;padding:3px 10px;border-radius:20px;">&#x2705; Customer confirmed</span>':
              '<span style="font-size:11px;color:#d97706;font-weight:600;">&#x23F3; Awaiting customer confirmation</span>')+
            '</div></div>'+
            '<div style="display:flex;gap:6px;align-items:flex-start;flex-shrink:0;">'+
            '<button onclick="openApptModalAdmin(\''+a.customerId+'\',\''+a.id+'\')" '+
            'style="background:white;border:1px solid #d4e6d4;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;color:#1B4D2A;">Edit</button>'+
            '<button onclick="delApptAdmin(\''+a.id+'\')" '+
            'style="background:#fee2e2;border:none;border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer;color:#dc2626;">&#x2715;</button>'+
            '</div></div></div>';
        }).join('')
      );
    window._drawAdminAppts=function(){renderAdminAppointments(el);};
  }

  window.openApptModalAdmin=function(custId,apptId){
    // If custId provided use existing openApptModal, else show customer picker first
    if(custId){
      if(typeof openApptModal==='function')openApptModal(custId,apptId);
      // After save, refresh admin appts view
      setTimeout(function(){
        var origSave=document.getElementById('am-save');
        if(origSave&&!origSave.dataset.adminHooked){
          origSave.dataset.adminHooked='1';
          origSave.addEventListener('click',function(){
            setTimeout(function(){if(window._drawAdminAppts)window._drawAdminAppts();},200);
          });
        }
      },100);
      return;
    }
    // No custId — show customer picker modal
    var modal=document.getElementById('global-modal');if(!modal)return;
    var custs=(typeof customers!=='undefined'?customers:[]).filter(function(c){return c&&c.name;});
    modal.innerHTML='<div style="background:white;border-radius:20px;padding:28px;max-width:380px;width:100%;'+
      'max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.25);">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">'+
      '<h3 style="font-weight:800;font-size:18px;color:#1B4D2A;margin:0;">Select Customer</h3>'+
      '<button onclick="closeModal()" style="background:#f2f6f2;border:none;border-radius:8px;padding:8px 12px;cursor:pointer;">&#x2715;</button></div>'+
      (custs.length===0?'<p style="color:#5a7a5a;">No customers yet. Add a customer first.</p>':
      custs.map(function(c){
        return '<div onclick="closeModal();openApptModalAdmin(\''+c.id+'\',null);" '+
          'style="padding:12px 14px;border-radius:10px;border:1px solid #d4e6d4;margin-bottom:8px;cursor:pointer;'+
          'display:flex;align-items:center;gap:10px;transition:background 0.15s;" '+
          'onmouseover="this.style.background=\'#f0fdf4\'" onmouseout="this.style.background=\'white\'">'+
          '<span style="font-size:22px;">&#x1F464;</span>'+
          '<div><div style="font-weight:700;font-size:14px;color:#1B4D2A;">'+c.name+'</div>'+
          (c.email?'<div style="font-size:12px;color:#5a7a5a;">'+c.email+'</div>':'')+
          '</div></div>';
      }).join(''))+
      '</div>';
    modal.style.display='flex';
  };

  window.delApptAdmin=function(id){
    if(!confirm('Delete this appointment?'))return;
    if(typeof appointments!=='undefined')
      appointments=appointments.filter(function(a){return a.id!==id;});
    if(typeof saveAppointments==='function')saveAppointments();
    if(window._drawAdminAppts)window._drawAdminAppts();
    if(typeof showToast==='function')showToast('Appointment deleted.','success');
  };

  // Inject into showView
  var _origSV2=window.showView;
  window.showView=function(v){
    if(v==='appointments'){
      var el=document.getElementById('main-content');
      if(el)renderAdminAppointments(el);
      document.querySelectorAll('.nav-item').forEach(function(n){n.classList.toggle('active',n.dataset.view===v);});
      document.querySelectorAll('.mob-nav-btn').forEach(function(n){n.classList.toggle('active',n.dataset.view===v);});
      return;
    }
    if(_origSV2)_origSV2.call(this,v);
  };

  // Inject sidebar nav item after Resources
  document.addEventListener('DOMContentLoaded',function(){
    setTimeout(function(){
      var nav=document.querySelector('.sidebar-nav,#sidebar-nav,nav ul,aside ul');
      if(!nav||nav.querySelector('[data-view="appointments"]'))return;
      var resLi=nav.querySelector('[data-view="resources"]');
      var refLi=resLi||nav.querySelector('[data-view="settings"]');
      if(!refLi)return;
      var li=document.createElement('li');
      li.className=refLi.className;
      li.dataset.view='appointments';
      li.innerHTML='<span style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:10px;cursor:pointer;" '+
        'onclick="showView(\'appointments\')">&#x1F4C5; <span>Appointments</span></span>';
      li.onclick=function(){showView('appointments');};
      nav.insertBefore(li,resLi?resLi.nextSibling:refLi);
    },300);
  });

})();

// == APPOINTMENTS NAV INJECTION FIX (retry loop) ==
(function(){
  function injectApptNav(){
    // Try every known sidebar selector
    var nav=document.querySelector('#nav-links-n4v1')||
            document.querySelector('.sidebar-nav')||
            document.querySelector('#sidebar-nav')||
            document.querySelector('nav ul')||
            document.querySelector('aside ul');
    if(!nav)return false;
    if(nav.querySelector('[data-view="appointments"]'))return true;
    var refLi=nav.querySelector('[data-view="resources"]')||
               nav.querySelector('[data-view="alerts"]')||
               nav.querySelector('[data-view="settings"]');
    if(!refLi)return false;
    var li=document.createElement('li');
    li.className=refLi.className;
    li.dataset.view='appointments';
    li.style.cssText=refLi.style.cssText;
    li.innerHTML='<span style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:10px;cursor:pointer;">'+
      '&#x1F4C5; <span>Appointments</span></span>';
    li.addEventListener('click',function(){showView('appointments');});
    var resources=nav.querySelector('[data-view="resources"]');
    if(resources&&resources.nextSibling){
      nav.insertBefore(li,resources.nextSibling);
    } else {
      nav.insertBefore(li,refLi);
    }
    console.log('[FIXport] Appointments nav injected.');
    return true;
  }
  // Try immediately, then retry every 300ms up to 5 seconds
  if(!injectApptNav()){
    var tries=0,iv=setInterval(function(){
      if(injectApptNav()||++tries>16)clearInterval(iv);
    },300);
  }
})();

// == FIX: hook renderView for appointments + fix nav click ==
(function(){
  // Patch renderView (the function admin actually uses)
  var _origRV=window.renderView;
  window.renderView=function(view){
    if(view==='appointments'){
      var el=document.getElementById('main-content');
      if(typeof renderAdminAppointments==='function')renderAdminAppointments(el);
      return;
    }
    if(_origRV)_origRV.call(this,view);
  };

  // Fix the nav item click to use renderView + active state correctly
  function rewireApptNav(){
    var item=document.querySelector('[data-view="appointments"]');
    if(!item||item.dataset.rvwired)return;
    item.dataset.rvwired='1';
    // Remove old listeners by cloning
    var fresh=item.cloneNode(true);
    fresh.dataset.rvwired='1';
    fresh.addEventListener('click',function(){
      document.querySelectorAll('#nav-links-n4v1 .nav-item').forEach(function(n){n.classList.remove('active');});
      fresh.classList.add('active');
      currentView='appointments';
      filterCustomerId=null;
      renderView('appointments');
      if(typeof closeMobileSidebar==='function')closeMobileSidebar();
    });
    item.parentNode.replaceChild(fresh,item);
  }

  var tries=0,iv2=setInterval(function(){
    rewireApptNav();
    if(++tries>20)clearInterval(iv2);
  },300);
})();
