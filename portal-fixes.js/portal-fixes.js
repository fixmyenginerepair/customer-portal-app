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
