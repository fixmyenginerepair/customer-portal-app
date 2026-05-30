// portal-fixes.js â€” FIXport: Equipment Tab + Site Backup + PayPal plain-paste
document.addEventListener('DOMContentLoaded', function () {

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     FIX 1 â€” EQUIPMENT TAB IN CUSTOMER PORTAL
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

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

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     FIX 2 â€” SITE BACKUP (Export & Import)
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

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

  /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
     FIX 3 â€” PAYPAL: strip dollar from payment tab button
     (The per-invoice Pay Now button already uses the link as-is)
  â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
  // Payment tab "Pay Now" button already uses inv.paypalLink as a plain href (line 752).
  // The only place dollar amount appears in button text is the Payment tab summary.
  // This patch changes "Pay $X.XX Now" â†’ "Pay Now via PayPal" on that tab.
  var _origRCT2 = window.renderCustomerTab;
  window.renderCustomerTab = (function (orig) {
    return function (tab, session) {
      orig.apply(this, arguments);
      if (tab !== 'payment') return;
      // Fix button label â€” replace "Pay $X.XX Now" text with "Pay Now via PayPal"
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

// â•â• PAYPAL PLAIN-PASTE FIX â•â•
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
      if (typeof showToast==='function') showToast('PayPal link ready â€” save the invoice to keep it.','success');
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


// == ADMIN APPOINTMENTS: FINAL CLEAN VERSION ==
(function(){

  // Page renderer — defined globally so it can be called anytime
  window.renderAdminAppointments = function(el){
    if(!el) el = document.getElementById('main-content');
    if(!el) return;
    var allAppts = (typeof appointments !== 'undefined' ? appointments : [])
      .sort(function(a,b){ return (a.date+a.time)<(b.date+b.time)?-1:1; });
    function custName(cid){
      var c=(typeof customers!=='undefined'?customers:[]).find(function(x){return x&&x.id===cid;});
      return c?c.name:'Unknown';
    }
    function badge(s){
      var m={pending:['Pending','#fef3c7','#d97706'],confirmed:['Confirmed','#dcfce7','#1B4D2A'],
             cancelled:['Cancelled','#fee2e2','#dc2626'],completed:['Completed','#f2f6f2','#5a7a5a']};
      var x=m[s]||m.pending;
      return '<span style="background:'+x[1]+';color:'+x[2]+';padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">'+x[0]+'</span>';
    }
    function fmtDt(d,t){
      if(!d)return'—';
      var p=d.split('-'),mo=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var s=mo[parseInt(p[1],10)-1]+' '+parseInt(p[2],10)+', '+p[0];
      if(t){var tp=t.split(':'),h=parseInt(tp[0],10),mn=tp[1],ap=h>=12?'PM':'AM';h=h%12||12;s+=' · '+h+':'+mn+' '+ap;}
      return s;
    }
    var today=new Date().toISOString().slice(0,10);
    var total=allAppts.length;
    var todayCt=allAppts.filter(function(a){return a.date===today;}).length;
    var confCt=allAppts.filter(function(a){return a.status==='confirmed';}).length;
    var pendCt=allAppts.filter(function(a){return a.status==='pending';}).length;
    el.innerHTML=
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:10px;">'+
      '<div><h2 style="font-size:20px;font-weight:800;color:#1B4D2A;margin:0;">&#x1F4C5; Appointments</h2>'+
      '<p style="font-size:13px;color:#5a7a5a;margin:2px 0 0;">All scheduled appointments</p></div></div>'+
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:20px;">'+
      ['<b style="color:#1B4D2A">'+total+'</b><br><small>Total</small>',
       '<b style="color:#F47920">'+todayCt+'</b><br><small>Today</small>',
       '<b style="color:#8DC63F">'+confCt+'</b><br><small>Confirmed</small>',
       '<b style="color:#d97706">'+pendCt+'</b><br><small>Pending</small>'].map(function(h){
        return '<div class="stat-card" style="text-align:center;padding:16px;font-size:26px;font-weight:800;">'+h+'</div>';
      }).join('')+'</div>'+
      (total===0?
        '<div class="stat-card" style="text-align:center;padding:60px;"><div style="font-size:48px;">&#x1F4C5;</div>'+
        '<p style="font-weight:600;">No appointments yet.</p>'+
        '<p style="font-size:13px;color:#5a7a5a;">Open a customer record to schedule one.</p></div>' :
        allAppts.map(function(a){
          var bc=a.status==='confirmed'?'#8DC63F':a.status==='cancelled'?'#dc2626':a.status==='completed'?'#5a7a5a':'#F47920';
          var isToday=a.date===today;
          return '<div class="stat-card" style="margin-bottom:10px;border-left:4px solid '+bc+';'+
            (isToday?'background:linear-gradient(135deg,#f8fff8,#f0fdf4);':'')+'">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">'+
            '<div style="flex:1;">'+
            '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">'+
            '<span style="font-weight:700;font-size:14px;color:#1B4D2A;">'+a.title+'</span>'+
            (isToday?'<span style="background:#8DC63F;color:#1B4D2A;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;">TODAY</span>':'')+
            badge(a.status)+'</div>'+
            '<div style="font-size:13px;color:#5a7a5a;margin-bottom:2px;">&#x1F464; <b>'+custName(a.customerId)+'</b></div>'+
            '<div style="font-size:13px;color:#5a7a5a;margin-bottom:2px;">&#x1F4C5; '+fmtDt(a.date,a.time)+(a.duration?' &middot; &#x23F1; '+a.duration+' min':'')+'</div>'+
            (a.notes?'<div style="font-size:12px;color:#5a7a5a;">&#x1F4DD; '+a.notes+'</div>':'')+
            '<div style="margin-top:6px;">'+
            (a.customerConfirmed?'<span style="font-size:11px;color:#1B4D2A;font-weight:700;background:#dcfce7;padding:3px 10px;border-radius:20px;">&#x2705; Customer confirmed</span>':
             '<span style="font-size:11px;color:#d97706;">&#x23F3; Awaiting customer confirmation</span>')+
            '</div></div>'+
            '<div style="display:flex;gap:6px;flex-shrink:0;">'+
            '<button onclick="if(typeof openApptModal===\'function\')openApptModal(\''+a.customerId+'\',\''+a.id+'\')" '+
            'style="background:white;border:1px solid #d4e6d4;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:600;cursor:pointer;color:#1B4D2A;">Edit</button>'+
            '<button onclick="if(!confirm(\'Delete this appointment?\'))return;if(typeof appointments!==\'undefined\')appointments=appointments.filter(function(x){return x.id!==\''+a.id+'\';});if(typeof saveAppointments===\'function\')saveAppointments();window.renderAdminAppointments();" '+
            'style="background:#fee2e2;border:none;border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer;color:#dc2626;">&#x2715;</button>'+
            '</div></div></div>';
        }).join('')
      );
  };

  // Wait until page fully loads so renderView is already defined
  window.addEventListener('load', function(){
    // Patch renderView safely
    var _base = window.renderView;
    window.renderView = function(v){
      if(v==='appointments'){ window.renderAdminAppointments(document.getElementById('main-content')); return; }
      if(_base) _base.call(this, v);
    };

    // Inject nav item
    var nav = document.getElementById('nav-links-n4v1');
    if(nav && !nav.querySelector('[data-view="appointments"]')){
      var ref = nav.querySelector('[data-view="settings"]');
      if(ref){
        var d = document.createElement('div');
        d.className = 'nav-item';
        d.setAttribute('data-view','appointments');
        d.style.cssText = 'display:flex;align-items:center;gap:12px;';
        d.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Appointments';
        d.addEventListener('click', function(){
          currentView = 'appointments';
          document.querySelectorAll('#nav-links-n4v1 .nav-item').forEach(function(i){ i.classList.remove('active'); });
          d.classList.add('active');
          window.renderView('appointments');
        });
        nav.insertBefore(d, ref);
      }
    }
  });

})();
