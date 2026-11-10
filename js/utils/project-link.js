// ════════════════════════════════════════════════════════════════
//  Project Link — لوحة الربط الشاملة
//  يربط: المقايسة  ⇄  المواد  ⇄  الدفع (المستخلصات)  ⇄  الترحيل والردم  ⇄  المعدات
//  بملف واحد شامل للمهندس المسؤول (نظرة SPA لتسريع التقريب والاعتماد).
// ════════════════════════════════════════════════════════════════
window.ProjectLink = (function () {
  'use strict';

  var CERTS_KEY = 'boq_certificates';

  function getCerts() {
    try { return JSON.parse(localStorage.getItem(CERTS_KEY) || '[]') || []; }
    catch (e) { return []; }
  }
  function saveCerts(arr) {
    try { localStorage.setItem(CERTS_KEY, JSON.stringify(arr)); } catch (e) {}
  }
  function readStock() {
    if (typeof BOQIntel !== 'undefined' && BOQIntel.getStock) {
      try { return BOQIntel.getStock() || {}; } catch (e) { return {}; }
    }
    return {};
  }
  function readCalc() {
    if (typeof BOQIntel !== 'undefined' && BOQIntel.getLastCalc) {
      try { return BOQIntel.getLastCalc(); } catch (e) { return null; }
    }
    return null;
  }
  function fmt(v) {
    if (typeof fmtNum === 'function') return fmtNum(Math.round(v));
    return String(Math.round(v));
  }
  function num(v) { return parseFloat(v) || 0; }

  /* ── تصنيف بنود المقايسة ── */
  function classify(name) {
    name = String(name || '');
    if (/(ترحيل|ازالة مخلفات|إزالة مخلفات|نقل مخلفات|ترحيل ردم|ازالة|إزالة)/.test(name)) return 'disposal';
    if (/(حفار|بلدوزر|قلاب|قلابة|رصاصة|مدحلة|شيول|لودر|شاحنة|مضخة|رافعة|كرين|ضاغط|هزاز|معدة|معدات)/.test(name)) return 'equipment';
    if (/(اسفلت|بلاط|خرسانة|بلك|بلوك|طوب|اسمنت|رمل|بحص|دفان|ردم|عازل|دهان|جص|جبس|انترلوك|برود|مواسير|كابلات|اسلاك|حصى|بيتون|عزل|سياج|صب|ديكور|بيتون|مزايكو)/.test(name)) return 'material';
    return 'other';
  }

  function snapshot(App, boq) {
    var ar = App.lang === 'ar';
    var value = 0, materialQty = 0, materialValue = 0, disposalQty = 0, eqLines = [], disposalLines = [], materialLines = [], otherLines = [];
    var items = (boq.items || []).map(function (it) {
      var p = (typeof getItemByCode === 'function') ? getItemByCode(it.code) : null;
      var up = num(it.customPrice) || (p ? num(p.newPrice) : 0);
      var total = up * num(it.qty);
      var name = p ? (p.arDesc || p.desc || '') : (it.note || '');
      value += total;
      var cat = classify(name);
      var row = { code: it.code, name: name, qty: num(it.qty), uom: p ? (p.uom || '') : '', up: up, total: total, cat: cat };
      if (cat === 'material') { materialQty += row.qty; materialValue += total; materialLines.push(row); }
      else if (cat === 'disposal') { disposalQty += row.qty; disposalLines.push(row); }
      else if (cat === 'equipment') { eqLines.push(row); }
      else { otherLines.push(row); }
      return row;
    });
    return {
      ar: ar,
      id: boq.id, isEmergency: !!boq.isEmergency,
      meta: boq.meta || {}, items: items,
      value: value, materialQty: materialQty, materialValue: materialValue,
      disposalQty: disposalQty, materialLines: materialLines,
      disposalLines: disposalLines, eqLines: eqLines, otherLines: otherLines
    };
  }

  function topList(lines, n, fmtV) {
    var list = lines.slice().sort(function (a, b) { return b.total - a.total; });
    var shown = list.slice(0, n);
    return shown.map(function (r) {
      return '<div style="display:flex;justify-content:space-between;gap:8px;font-size:11.5px;padding:3px 0;border-bottom:1px dashed var(--border);">'
        + '<span style="color:var(--text-sub);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (r.name || r.code) + '</span>'
        + '<span style="font-weight:600;white-space:nowrap;">' + fmtV(r) + '</span></div>';
    }).join('');
  }

  /* ── الحالة: البوابة الرئيسية ── */
  var _boqId = null;

  function render(area, App) {
    var ar = App.lang === 'ar';
    var boqs = App.state.savedBOQs || [];
    if (!boqs.length) {
      area.innerHTML =
        '<div class="card"><div class="empty-state"><div class="empty-icon">🔗</div>'
        + '<h3>' + (ar ? 'لا توجد مقايسات للربط بعد' : 'No BOQs to link yet') + '</h3>'
        + '<p style="color:var(--text-sub);font-size:12px;max-width:460px;">'
        + (ar ? 'أنشئ مقايسة أولاً ثم عد هنا لترى لوحة الربط الشاملة: المقايسة ⇄ المواد ⇄ المستخلصات ⇄ الترحيل ⇄ المعدات.' : 'Create a BOQ first, then come back to see the unified dashboard: BOQ ⇄ Materials ⇄ Payments ⇄ Disposal ⇄ Equipment.')
        + '</p><br><button class="btn btn-primary" onclick="App.newBOQ()">📋 ' + (ar ? 'إنشاء مقايسة جديدة' : 'Create New BOQ') + '</button></div></div>';
      return;
    }
    var lastId = (App && App._lastBoqId) || (App && App.state && App.state.boq && App.state.boq.id) || null;
    if (lastId && boqs.some(function (b) { return b.id === lastId; })) {
      _boqId = lastId;
    } else if (!_boqId || !boqs.some(function (b) { return b.id === _boqId; })) {
      _boqId = boqs[0].id;
    }
    var opts = boqs.map(function (b) {
      return '<option value="' + b.id + '"' + (b.id === _boqId ? ' selected' : '') + '>'
        + (b.meta.wo || '—') + (b.meta.project ? ' — ' + b.meta.project : '')
        + (b.isEmergency ? ' 🚨 ' + (ar ? 'طوارئ' : 'Emerg') : '') + '</option>';
    }).join('');

    area.innerHTML =
      '<div class="card" style="margin-bottom:16px;"><div class="card-body">'
      + '<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;">'
      + '<div style="font-size:16px;font-weight:800;">🔗 ' + (ar ? 'لوحة الربط الشاملة' : 'Unified Project Link') + '</div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">'
      + '<select class="form-control" id="pl-boq" onchange="ProjectLink.select(this.value)" style="min-width:280px;">' + opts + '</select>'
      + '<button class="btn btn-primary btn-sm" onclick="App.newBOQ()">📋 ' + (ar ? 'مقايسة جديدة' : 'New BOQ') + '</button>'
      + '<button class="btn btn-outline btn-sm" onclick="ProjectLink.refresh()">🔄 ' + (ar ? 'تحديث' : 'Refresh') + '</button>'
      + '<button class="btn btn-gold btn-sm" onclick="ProjectLink.copyReport()">📋 ' + (ar ? 'نسخ التقرير' : 'Copy Report') + '</button>'
      + '</div></div></div></div>'
      + '<div id="pl-dash"></div>';
    draw(App);
  }

  function refresh() { if (window.App) draw(window.App); }

  function select(id) { _boqId = id; refresh(); }

  function currentBoq(App) {
    var boqs = App.state.savedBOQs || [];
    return boqs.find(function (b) { return b.id === _boqId; }) || boqs[boqs.length - 1] || null;
  }

  /* ── رسم لوحة الربط ── */
  function draw(App) {
    var ar = App.lang === 'ar';
    var boq = currentBoq(App);
    var box = document.getElementById('pl-dash');
    if (!box) return;
    if (!boq) { box.innerHTML = ''; return; }
    var s = snapshot(App, boq);
    var certs = getCerts().filter(function (c) { return c.boqId === boq.id; });
    var session = null;
    try {
      var raw = localStorage.getItem('cert_session_cache');
      if (raw) {
        var cs = JSON.parse(raw);
        if (cs && cs.items && cs.items.length) session = cs;
      }
    } catch (e) {}
    var stock = readStock();
    var stockCount = Object.keys(stock).length;
    var calc = readCalc();
    var opsK = (typeof OpsCenter !== 'undefined' && OpsCenter.kpis) ? OpsCenter.kpis() : null;

    var totalC = Math.round(s.value);
    var vatTotal = Math.round(totalC * 0.15);
    var execTotal = 0, paidTotal = 0;
    certs.forEach(function (c) { execTotal += num(c.executed); paidTotal += num(c.due); });
    var contractPct = totalC > 0 ? Math.round((paidTotal / totalC) * 100) : 0;
    var remaining = Math.max(0, totalC - paidTotal);

    var wastePlan = calc ? num(calc.c ? calc.c.waste : calc.waste) : 0;
    var wasteHave = s.disposalQty;
    var wasteTotal = Math.max(wastePlan, wasteHave);
    var trucks = Math.ceil(wasteTotal / 12);
    var sandPlan = calc ? num(calc.c ? calc.c.sand : calc.sand) : 0;
    var sandHave = s.materialLines.reduce(function (a, r) { return a + (/(رمل|دفان)/.test(r.name) ? r.qty : 0); }, 0);
    var sandTotal = Math.max(sandPlan, sandHave);

    var eqH = '';
    if (calc && calc.eq) {
      var eq = calc.eq;
      var parts = [];
      if (num(eq.excavatorH)) parts.push('حفار ' + fmt(eq.excavatorH) + ' س');
      if (num(eq.dumpH)) parts.push('قلابات ' + fmt(eq.dumpH) + ' س');
      if (num(eq.rollerH)) parts.push('رصاصة ' + fmt(eq.rollerH) + ' س');
      if (num(eq.compactorH)) parts.push('هزاز ' + fmt(eq.compactorH) + ' س');
      if (num(eq.waterTrips)) parts.push('سيارة مياه ' + fmt(eq.waterTrips) + ' ' + (ar ? 'نقلة' : 'trips'));
      if (parts.length) eqH = '<div style="font-size:11.5px;color:var(--text-sub);margin-top:6px;">' + parts.join(' · ') + '</div>';
    }

    /* بطاقات */
    var cardBOQ =
      '<div class="card"><div class="card-head"><span>📋</span><span class="card-title">' + (ar ? 'المقايسة' : 'BOQ')
      + '</span>' + (s.isEmergency ? '<span class="badge badge-critical">' + (ar ? 'طوارئ' : 'Emergency') + '</span>' : '') + '</div><div class="card-body">'
      + '<div style="font-size:14px;font-weight:800;">' + (s.meta.project || '—') + '</div>'
      + '<div style="font-size:11.5px;color:var(--text-sub);margin:4px 0 10px;">' + (s.meta.wo || '—') + (s.meta.location ? ' · ' + s.meta.location : '') + (s.meta.date ? ' · ' + s.meta.date : '') + '</div>'
      + metaRow(ar ? 'البنود' : 'Items', s.items.length)
      + metaRow(ar ? 'قيمة الأعمال' : 'Works Value', fmt(totalC) + ' ' + (ar ? 'ر.س' : 'SAR'))
      + metaRow(ar ? 'ض.م 15%' : 'VAT 15%', fmt(vatTotal) + ' ' + (ar ? 'ر.س' : 'SAR'))
      + metaRow(ar ? 'القيمة الإجمالية' : 'Total Value', fmt(totalC + vatTotal) + ' ' + (ar ? 'ر.س' : 'SAR'))
      + progressBar(contractPct, (ar ? 'المنفذ من المستخلصات' : 'Paid via certificates') + ' ' + contractPct + '%')
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px;">'
      + '<button class="btn btn-primary btn-sm" onclick="ProjectLink.openBOQ()">✏️ ' + (ar ? 'فتح المقايسة' : 'Open BOQ') + '</button>'
      + '<button class="btn btn-gold btn-sm" onclick="ProjectLink.openCert()">📜 ' + (ar ? 'مستخلص جديد' : 'New Certificate') + '</button>'
      + '</div></div></div>';

    var cardMat =
      '<div class="card"><div class="card-head"><span>🧱</span><span class="card-title">' + (ar ? 'المواد' : 'Materials') + '</span></div><div class="card-body">'
      + (s.materialLines.length
        ? topList(s.materialLines, 6, function (r) { return fmt(r.qty) + ' ' + (r.uom || '') + ' · ' + fmt(r.total); })
        : '<div style="color:var(--text-muted);font-size:11.5px;">' + (ar ? 'لا بنود مواد ظاهرة (افحص التصنيف تلقائياً في قائمة الأسعار)' : 'No material items detected') + '</div>')
      + metaRow(ar ? 'إجمالي المواد' : 'Materials total', fmt(s.materialValue) + ' ' + (ar ? 'ر.س' : 'SAR'))
      + metaRow(ar ? 'أصناف بالمخزون' : 'Stock entries', stockCount + (ar ? ' صنف' : ' item(s)'))
      + '<div style="font-size:10.5px;color:var(--text-muted);margin-top:6px;">⇄ ' + (ar ? 'يرتبط بـ: مركز العمليات (توريد/أوامر/مخزون)' : 'Linked to: Ops Center (supply/orders/stock)') + '</div>'
      + '<button class="btn btn-outline btn-sm" style="margin-top:8px;" onclick="ProjectLink.openOps()">⚙️ ' + (ar ? 'مركز العمليات' : 'Ops Center') + '</button>'
      + '</div></div>';

    var certRows = certs.length ? certs.map(function (c) {
      return '<div style="display:flex;justify-content:space-between;gap:8px;font-size:11.5px;padding:5px 0;border-bottom:1px dashed var(--border);">'
        + '<span style="color:var(--text-sub);">📜 ' + (c.num || '—') + ' · ' + (c.wo || '—') + '</span>'
        + '<span style="font-weight:700;color:var(--sec-primary);white-space:nowrap;">' + fmt(c.due) + ' ' + (ar ? 'ر.س' : 'SAR') + '</span></div>';
    }).join('') : '<div style="color:var(--text-muted);font-size:11.5px;">' + (ar ? 'لا توجد مستخلصات محفوظة لهذه المقايسة' : 'No saved certificates for this BOQ') + '</div>';

    var cardPay =
      '<div class="card"><div class="card-head"><span>💰</span><span class="card-title">' + (ar ? 'الدفع (المستخلصات)' : 'Payments') + '</span></div><div class="card-body">'
      + certRows
      + metaRow(ar ? 'إجمالي المدفوع' : 'Total paid', fmt(paidTotal) + ' ' + (ar ? 'ر.س' : 'SAR'))
      + metaRow(ar ? 'المتبقي من العقد' : 'Remaining', fmt(remaining) + ' ' + (ar ? 'ر.س' : 'SAR'))
      + (session ? '<div style="font-size:10.5px;color:var(--accent-gold);margin-top:4px;">⚠ ' + (ar ? 'مستخلص قيد الإنشاء (غير محفوظ)' : 'Certificate in progress (unsaved)') + '</div>' : '')
      + '<div style="font-size:10.5px;color:var(--text-muted);margin-top:6px;">⇄ ' + (ar ? 'يرتبط بـ: المقايسة وضغط «مستخلص جديد»' : 'Linked to: BOQ & "New Certificate"') + '</div>'
      + '</div></div>';

    var cardDisp =
      '<div class="card"><div class="card-head"><span>🚛</span><span class="card-title">' + (ar ? 'الترحيل والردم' : 'Disposal & Backfill') + '</span></div><div class="card-body">'
      + metaRow(ar ? 'حجم الترحيل/الردم' : 'Disposal / backfill', fmt(wasteTotal) + ' ' + (ar ? 'م³' : 'm³'))
      + metaRow(ar ? 'شاحنات (12 م³)' : 'Trucks (12 m³)', Math.ceil(trucks))
      + metaRow(ar ? 'رمل / دقان توريد' : 'Sand / fill supply', fmt(sandTotal) + ' ' + (ar ? 'م³' : 'm³'))
      + (calc ? metaRow(ar ? 'مخلفات (خطة التحليل)' : 'Waste (analysis plan)', fmt(wastePlan) + ' ' + (ar ? 'م³' : 'm³')) : '')
      + (opsK ? '<div style="font-size:10.5px;color:var(--text-muted);margin-top:4px;">📈 ' + (ar ? 'منفذ يومياً: ' : 'Executed daily: ') + fmt(opsK.sum ? (opsK.sum.waste || 0) : 0) + ' / ' + fmt(wastePlan || 0) + ' ' + (ar ? 'م³' : 'm³') + '</div>' : '')
      + '<div style="font-size:10.5px;color:var(--text-muted);margin-top:6px;">⇄ ' + (ar ? 'يرتبط بـ: بنود (ترحيل/ردم/دفان) والسجل اليومي' : 'Linked to: disposal items & daily log') + '</div>'
      + '</div></div>';

    var eqRows = s.eqLines.length
      ? topList(s.eqLines, 6, function (r) { return fmt(r.qty) + ' ' + (r.uom || '') + ' · ' + fmt(r.total); })
      : '<div style="color:var(--text-muted);font-size:11.5px;">' + (ar ? 'لا بنود معدات ظاهرة — أضفها في المقايسة' : 'No equipment items — add them in the BOQ') + '</div>';

    var cardEq =
      '<div class="card"><div class="card-head"><span>🚜</span><span class="card-title">' + (ar ? 'المعدات' : 'Equipment') + '</span></div><div class="card-body">'
      + eqRows + eqH
      + '<div style="font-size:10.5px;color:var(--text-muted);margin-top:6px;">⇄ ' + (ar ? 'يرتبط بـ: ساعات التقدير من تحليل الحفريات' : 'Linked to: estimated hours from trench analysis') + '</div>'
      + '</div></div>';

    var cardLink =
      '<div class="card" style="grid-column:1/-1;background:linear-gradient(135deg,rgba(212,160,28,0.06),rgba(0,132,61,0.06));"><div class="card-head"><span>🧭</span><span class="card-title">' + (ar ? 'تحليل الربط' : 'Integration Analysis') + '</span></div><div class="card-body">'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;">'
      + linkTile(ar ? 'قيمة العقد' : 'Contract', fmt(totalC + vatTotal) + ' ' + (ar ? 'ر.س' : 'SAR'))
      + linkTile(ar ? 'مستخلصات' : 'Certificates', fmt(paidTotal) + ' ' + (ar ? 'ر.س' : 'SAR'))
      + linkTile(ar ? 'متبقي' : 'Remaining', fmt(remaining) + ' ' + (ar ? 'ر.س' : 'SAR'))
      + linkTile(ar ? 'مواد مطلوبة' : 'Materials needed', fmt(s.materialQty) + ' ' + (ar ? 'وحدة' : 'u'))
      + linkTile(ar ? 'ترحيل/ردم' : 'Disposal', fmt(wasteTotal) + ' ' + (ar ? 'م³' : 'm³') + ' / ' + Math.ceil(trucks) + ' ' + (ar ? 'شاحنة' : 'trucks'))
      + linkTile(ar ? 'معدات' : 'Equipment', s.eqLines.length + (ar ? ' بند' : ' item(s)'))
      + '</div>'
      + '<div style="margin-top:12px;font-size:11.5px;color:var(--text-sub);line-height:1.7;">'
      + (ar ? '✅ التدفق: المقايسة (البنود والأسعار) ← المستخلصات (نسبة الإنجاز والدفع) ← الترحيل والمواد والمعدات (تنفيذ الموقع). كل بطاقة مربوطة بأداتها لإكمال الدورة من شيت واحد.' : '✅ Flow: BOQ (items & prices) ← Certificates (completion & payment) ← disposal, materials & equipment (site execution). Each card links to its tool to complete the cycle from a single sheet.')
      + '</div></div></div>';

    var opsBlock =
      '<div class="card" style="grid-column:1/-1;"><div class="card-head"><span>⚙️</span><span class="card-title">' + (ar ? 'مركز العمليات المدمج' : 'Embedded Ops Center') + '</span></div><div class="card-body"><div id="pl-ops"></div></div></div>';

    box.innerHTML =
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:14px;">'
      + cardBOQ + cardMat + cardPay + cardDisp + cardEq + cardLink + opsBlock
      + '</div>';

    if (typeof OpsCenter !== 'undefined' && OpsCenter.render) {
      var opsEl = document.getElementById('pl-ops');
      if (opsEl) OpsCenter.render(opsEl);
    }
  }

  function metaRow(k, v) {
    return '<div style="display:flex;justify-content:space-between;gap:8px;font-size:12px;padding:4px 0;border-bottom:1px dashed var(--border);"><span style="color:var(--text-sub);">' + k + '</span><span style="font-weight:700;">' + v + '</span></div>';
  }
  function progressBar(pct, label) {
    return '<div style="margin-top:10px;"><div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--text-muted);margin-bottom:4px;"><span>' + label + '</span></div>'
      + '<div style="background:rgba(0,132,61,0.12);border-radius:99px;height:7px;overflow:hidden;"><div style="height:100%;width:' + Math.min(100, pct) + '%;background:linear-gradient(90deg,var(--sec-primary),var(--accent-gold));border-radius:99px;transition:width 0.4s;"></div></div></div>';
  }
  function linkTile(k, v) {
    return '<div style="background:var(--bg-surface);border:1px solid var(--border-sec);border-radius:var(--r-lg);padding:12px;"><div style="font-size:10.5px;color:var(--text-muted);">' + k + '</div><div style="font-size:15px;font-weight:800;color:var(--text-h);margin-top:2px;">' + v + '</div></div>';
  }

  /* ── إجراءات ── */
  function openBOQ() { if (window.App && _boqId) App.loadBOQ(_boqId); }
  function openCert() { if (window.App && _boqId) { App._pendingCertBoqId = _boqId; App.go('certificate'); } }
  function openOps() {
    var el = document.getElementById('pl-ops');
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (window.App) App.go('ai');
  }
  function copyReport() {
    if (!window.App) return;
    var ar = App.lang === 'ar';
    var boq = currentBoq(App);
    if (!boq) return;
    var s = snapshot(App, boq);
    var certs = getCerts().filter(function (c) { return c.boqId === boq.id; });
    var paid = certs.reduce(function (a, c) { return a + num(c.due); }, 0);
    var calc = readCalc();
    var wasteTotal = calc ? num(calc.c ? calc.c.waste : calc.waste) : s.disposalQty;
    var lines = [];
    lines.push('🔗 ' + (ar ? 'لوحة الربط الشاملة' : 'Unified Project Link') + ' — ' + (s.meta.project || '—'));
    lines.push((ar ? 'أمر العمل' : 'WO') + ': ' + (s.meta.wo || '—'));
    lines.push((ar ? 'قيمة الأعمال' : 'Works') + ': ' + fmt(s.value) + ' / ' + (ar ? 'إجمالي مع ض.م' : 'with VAT') + ': ' + fmt(s.value * 1.15));
    lines.push((ar ? 'المستخلصات المدفوعة' : 'Paid certs') + ': ' + fmt(paid) + ' ' + (ar ? 'ر.س' : 'SAR'));
    lines.push((ar ? 'المواد' : 'Materials') + ': ' + fmt(s.materialValue) + ' ' + (ar ? 'ر.س' : 'SAR') + ' (' + s.materialLines.length + ' ' + (ar ? 'بند' : 'items') + ')');
    lines.push((ar ? 'الترحيل والردم' : 'Disposal') + ': ' + fmt(wasteTotal) + ' ' + (ar ? 'م³' : 'm³') + ' / ' + Math.ceil(wasteTotal / 12) + ' ' + (ar ? 'شاحنة' : 'trucks'));
    lines.push((ar ? 'المعدات' : 'Equipment') + ': ' + s.eqLines.length + ' ' + (ar ? 'بند' : 'items'));
    try {
      var text = lines.join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
      else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
      if (typeof toast === 'function') toast(ar ? 'تم نسخ ملخص الربط' : 'Link summary copied', 'success');
    } catch (e) {}
  }

  /* ── واجهة عامة ── */
  return {
    CERTS_KEY: CERTS_KEY,
    getCerts: getCerts, saveCerts: saveCerts,
    render: render, refresh: refresh, select: select,
    currentBoq: currentBoq, snapshot: snapshot,
    openBOQ: openBOQ, openCert: openCert, openOps: openOps, copyReport: copyReport
  };
})();
