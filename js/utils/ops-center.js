/* ════════════════════════════════════════════════════════════════
   Ops Center — مركز التشغيل واللوجستيات (Operations & Logistics)
   لوحة المؤشرات • مركز التنسيق والاعتماد • الموردين والطلبات
   فحص قبل/بعد • المساعد التشغيلي AI Copilot
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var OPS_KEY = 'boqIntel.ops';
  var ROLES = ['مهندس موقع', 'مشرف موقع', 'مدير مشروع', 'مسؤول لوجستيات'];
  var CHECK_ITEMS = [
    'إعادة الأسفلت مطابقة للسماكة',
    'البلاط/الإنترلوك مستوي ومثبت',
    'البلدورة سليمة ومستقيمة',
    'لا مخلفات متبقية',
    'العلامات الأرضية/الدهان بعد الإغلاق',
    'المنسوب النهائي مطابق',
  ];

  function defaultOps() {
    return {
      suppliers: [
        { id: 1, name: 'خلاطة أسفلت — الرياض', type: 'asphalt', contact: '0550000001', materials: 'أسفلت ساخن' },
        { id: 2, name: 'مصنع خرسانة جاهزة', type: 'concrete', contact: '0550000002', materials: 'خرسانة' },
        { id: 3, name: 'مورد رمل ودفان', type: 'sand', contact: '0550000003', materials: 'رمل، دفان، بيز' },
        { id: 4, name: 'مورد Subbase / Road Base', type: 'subbase', contact: '0550000004', materials: 'بيز، Road Base' },
        { id: 5, name: 'تأجير معدات ثقيلة', type: 'equipment', contact: '0550000005', materials: 'حفار، قلاب، هراس' },
      ],
      workPackages: [],
      orders: [],
      inspections: [],
    };
  }

  function getOps() {
    try { var o = JSON.parse(localStorage.getItem(OPS_KEY)); return o || defaultOps(); }
    catch (e) { return defaultOps(); }
  }
  function setOps(o) { try { localStorage.setItem(OPS_KEY, JSON.stringify(o)); } catch (e) {} }

  function today() { return new Date().toLocaleDateString('ar-SA'); }
  function nowStr() { return new Date().toLocaleString('ar-SA'); }
  function fmt(v) {
    v = Math.round((v || 0) * 100) / 100;
    var s = String(v);
    if (s.indexOf('.') >= 0) s = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return s;
  }
  function toast(msg, type) { if (typeof window.toast === 'function') window.toast(msg, type); }

  function getCalcs() { return (typeof BOQIntel !== 'undefined') ? BOQIntel.getLastCalc() : null; }
  function getDailyArr() { return (typeof BOQIntel !== 'undefined') ? BOQIntel.getDaily() : []; }

  /* ── المؤشرات ── */
  function kpis() {
    var d = getDailyArr();
    var sum = { L: 0, excav: 0, waste: 0, sand: 0, asphalt: 0 };
    d.forEach(function (x) {
      sum.L += x.L || 0; sum.excav += x.excav || 0; sum.waste += x.waste || 0;
      sum.sand += x.sand || 0; sum.asphalt += x.asphalt || 0;
    });
    var c = getCalcs();
    var plan = c ? { L: c.c.L, excav: c.c.excav, waste: c.c.waste, sand: c.c.sand, asphalt: c.c.asphaltTons } : { L: 0, excav: 0, waste: 0, sand: 0, asphalt: 0 };
    function pct(a, p) { return p > 0 ? Math.min(999, Math.round(a / p * 100)) : (a > 0 ? 100 : 0); }
    var ops = getOps();
    var done = ops.workPackages.filter(function (w) { return w.status === 'approved' || w.status === 'executing' || w.status === 'done'; }).length;
    var pending = ops.workPackages.length - done;
    var lead = 0, leads = 0;
    ops.orders.forEach(function (o) {
      if (o.arrivedAt && o.issuedAt) {
        var t = (new Date(o.arrivedAt) - new Date(o.issuedAt));
        if (!isNaN(t) && t > 0) { lead += t / 86400000; leads++; }
      }
    });
    return {
      sum: sum, plan: plan, pct: pct, done: done, pending: pending,
      totalWP: ops.workPackages.length, avgLead: leads ? Math.round(lead / leads * 10) / 10 : 0,
      totalOrders: ops.orders.length,
      inspections: ops.inspections.length,
      closure: c ? c.closure : null,
    };
  }

  /* ── حزم العمل والاعتماد ── */
  function createWP() {
    var c = getCalcs();
    if (!c) { toast('احسب الكميات أولاً من تبويب «الحساب الذكي»', 'warning'); return; }
    var ops = getOps();
    ops.workPackages.push({
      id: Date.now(), name: 'حزمة عمل #' + (ops.workPackages.length + 1),
      date: today(), L: c.c.L, W: c.c.W, D: c.c.D, closure: c.closure,
      totals: { excav: c.c.excav, waste: c.c.waste, sand: c.c.sand, concrete: c.c.concreteM3, waterL: c.c.waterL, subbase: c.c.subbase, roadBase: c.c.roadBase, asphalt: c.c.asphaltTons, primeGal: c.c.primeGal, tackGal: c.c.tackGal, barriers: c.c.barriers, trucks: c.fleet.trucks },
      approvals: { quantities: null, materials: null, equipment: null },
      status: 'pending',
    });
    setOps(ops);
    toast('أنشئت حزمة عمل — أتمم الاعتمادات لبدء التنفيذ', 'success');
  }

  function approve(id, item) {
    var ops = getOps();
    var w = ops.workPackages.filter(function (x) { return x.id === id; })[0];
    if (!w) return;
    if (!w.approvals[item]) w.approvals[item] = { role: ROLES[Math.floor(Math.random() * ROLES.length)], by: 'المستخدم', at: nowStr() };
    else delete w.approvals[item];
    if (w.approvals.quantities && w.approvals.materials && w.approvals.equipment) w.status = 'approved';
    else if (w.status === 'approved') w.status = 'pending';
    setOps(ops);
  }

  function wpStatus(id, next) {
    var ops = getOps();
    var w = ops.workPackages.filter(function (x) { return x.id === id; })[0];
    if (!w) return;
    if (next === 'executing' && w.status !== 'approved') { toast('⛔ لا يمكن التنفيذ قبل اكتمال اعتماد الكميات والمواد والمعدات', 'warning'); return; }
    w.status = next;
    setOps(ops);
  }
  function delWP(id) {
    var ops = getOps();
    ops.workPackages = ops.workPackages.filter(function (x) { return x.id !== id; });
    setOps(ops);
  }

  /* ── الموردون والطلبات ── */
  function addOrder(supId, material, qty, unit, eta) {
    var ops = getOps();
    ops.orders.push({ id: Date.now(), supplierId: +supId, material: material, qty: +qty || 0, unit: unit, status: 'issued', issuedAt: nowStr(), eta: eta || '', received: 0 });
    setOps(ops);
    toast('تم إصدار أمر توريد', 'success');
  }
  function nextOrder(id) {
    var ops = getOps();
    var o = ops.orders.filter(function (x) { return x.id === id; })[0];
    if (!o) return;
    var seq = ['issued', 'in-transit', 'delivered', 'received'];
    var i = seq.indexOf(o.status);
    if (i < seq.length - 1) o.status = seq[i + 1];
    if (o.status === 'delivered') o.arrivedAt = nowStr();
    if (o.status === 'received') { o.received = o.qty; o.receivedAt = nowStr(); }
    setOps(ops);
  }
  function delOrder(id) {
    var ops = getOps();
    ops.orders = ops.orders.filter(function (x) { return x.id !== id; });
    setOps(ops);
  }
  function supplierName(ops, id) {
    var s = ops.suppliers.filter(function (x) { return x.id === id; })[0];
    return s ? s.name : '—';
  }
  var ORDER_STATUS = { 'issued': 'أمر صادر', 'in-transit': 'في الطريق', 'delivered': 'تم الوصول', 'received': 'مستلم' };

  /* ── الفحص قبل/بعد ── */
  function addInspection(site, closure, before, after, checks) {
    var ops = getOps();
    var score = Math.round(checks.filter(Boolean).length / CHECK_ITEMS.length * 100);
    ops.inspections.push({ id: Date.now(), date: today(), site: site, closure: closure, before: before || null, after: after || null, checks: checks, score: score });
    setOps(ops);
    toast('سُجل فحص قبل/بعد — المطابقة ' + score + '%', 'success');
  }
  function delInsp(id) {
    var ops = getOps();
    ops.inspections = ops.inspections.filter(function (x) { return x.id !== id; });
    setOps(ops);
  }
  function fileToDataURL(file, cb) {
    if (!file) { cb(null); return; }
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var w = Math.min(420, img.width); var h = Math.round(img.height * w / img.width);
        var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        cv.getContext('2d').drawImage(img, 0, 0, w, h);
        cb(cv.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = function () { cb(null); };
      img.src = fr.result;
    };
    fr.onerror = function () { cb(null); };
    fr.readAsDataURL(file);
  }

  /* ── المساعد التشغيلي ── */
  function answer(q) {
    q = String(q || '').toLowerCase();
    var c = getCalcs();
    var ops = getOps();
    function req(f) { return c ? (c.c[f] || 0) : 0; }
    function flt(f) { return c ? (c.fleet[f] || 0) : 0; }

    if (/سفتي|تأمين|حواجز/.test(q)) return '🔸 السفتي لتأمين الموقع من الطرفين: <b>' + fmt(req('barriers')) + ' حبة</b> (معدل 2.5 حبة/م — مثال 10م → 25).';
    if (/قلاب|رحلات|نقل|ترحيل|مخلفات/.test(q)) return '🔸 ترحيل المخلفات: <b>' + fmt(req('waste')) + ' م³</b> (بعد التمدد ×1.2) — القلابات المطلوبة: <b>' + flt('trucks') + '</b> بسعة ' + fmt(c ? c.c.R.truckCapacity : 12) + ' م³/رحلة.';
    if (/رمل|دفان/.test(q)) return '🔸 الرمل (10 سم تحت الكيبل + 30 سم فوقه): <b>' + fmt(req('sand')) + ' م³</b> • خرسانة حماية الكيبل فوق الرمل: ' + fmt(req('concrete')) + ' م³ — مياه الدك (بيز × 10 ل/م³): ' + fmt(req('waterL')) + ' لتر.';
    if (/اسفلت/.test(q)) return '🔸 الأسفلت الساخن: <b>' + fmt(req('asphaltTons')) + ' طن</b> (سماكة × 2.35 طن/م³). المواد قبل الأسفلت — Prime RC-70: ' + fmt(req('primeGal')) + ' جالون • Tack RC-2: ' + fmt(req('tackGal')) + ' جالون.';
    if (/بيز|subbase|road ?base/.test(q)) return '🔸 البيز Subbase: ' + fmt(req('subbase')) + ' م³ • Road Base: ' + fmt(req('roadBase')) + ' م³.';
    if (/معدات|حفار|هراس|مكبس|قلابات/.test(q)) return '🔸 المعدات التقديرية: حفار ' + fmt(req('excav') / 40) + ' س • هراس ' + fmt(req('area') / 150) + ' س • مكبس اهتزازي ' + fmt(req('area') / 80) + ' س • ناقلة مياه ' + fmt(Math.ceil(req('waterM3') / 8)) + ' رحلة.';
    if (/نقص|ناقص|ينقص/.test(q)) {
      if (!c) return '🔸 احسب الكميات أولاً من تبويب «الحساب الذكي» ثم اسأل عن النواقص.';
      var dem = (typeof BOQIntel !== 'undefined') ? BOQIntel.demand(c.rows, BOQIntel.getStock()) : [];
      var short = dem.filter(function (r) { return r.shortage > 0; });
      if (!short.length) return '✅ لا توجد عجوزات — المتوفر يغطي المطلوب.';
      return '⚠️ العجز المتوقع: ' + short.map(function (r) { return r.name + ' (' + fmt(r.shortage) + ' ' + r.unit + ')'; }).join('، ');
    }
    if (/متوفر|مخزون|مستودع|موجود/.test(q)) {
      if (!c) return '🔸 احسب الكميات أولاً لمراجعة التوفر.';
      var d2 = (typeof BOQIntel !== 'undefined') ? BOQIntel.demand(c.rows, BOQIntel.getStock()) : [];
      var bad = d2.filter(function (r) { return r.shortage > 0; });
      return bad.length ? '⚠️ يوجد عجز في ' + bad.length + ' مادة (' + bad.map(function (r) { return r.name; }).join('، ') + ').' : '✅ كل المواد متوفرة بالمستودع.';
    }
    if (/إغلاق|انترلوك|بلاط|بلدورة/.test(q)) return c ? ('نوع الإغلاق المعتمد: <b>' + c.closure + '</b> — المساحة ' + fmt(c.c.closureArea) + ' م²، البلدورة ' + fmt(c.c.kerbs) + ' م.') : '🔸 احسب الكميات أولاً لتحديد الإغلاق.';
    if (/تأخير|متأخر/.test(q)) {
      var d3 = getDailyArr(); var planL = c ? c.c.L : 0; var doneL = 0;
      d3.forEach(function (x) { doneL += x.L || 0; });
      var p = planL > 0 ? Math.round(doneL / planL * 100) : (doneL > 0 ? 100 : 0);
      return 'المنفذ ' + fmt(doneL) + ' م من ' + fmt(planL) + ' م (' + p + '%) — ' + (p >= 100 ? '✅ لا تأخير' : '⚠️ قد يتأخر الإنجاز، راجع الإنتاج اليومي وسرعة الاعتمادات والتوريد.');
    }
    if (/بدأ|تنفيذ|اعتماد|موافقة/.test(q)) {
      var pend = ops.workPackages.filter(function (w) { return w.status === 'pending'; }).length;
      return pend ? ('⏳ ' + pend + ' حزمة عمل تنتظر الاعتماد — لا يمكن التنفيذ قبل اكتمال اعتماد الكميات والمواد والمعدات.') : (ops.workPackages.length ? '✅ الاعتمادات مكتملة — يمكن بدء التنفيذ.' : '🔸 أنشئ حزمة عمل أولاً (من بطاقة التنسيق).');
    }
    var parts = [];
    if (c) parts.push('حفر ' + fmt(req('excav')) + ' م³', 'ترحيل ' + fmt(req('waste')) + ' م³', 'رمل ' + fmt(req('sand')) + ' م³', 'خرسانة كيبل ' + fmt(req('concrete')) + ' م³', 'أسفلت ' + fmt(req('asphaltTons')) + ' طن', 'سفتي ' + fmt(req('barriers')) + ' حبة');
    parts.push('حزم عمل: ' + ops.workPackages.length, 'موردون: ' + ops.suppliers.length, 'طلبات: ' + ops.orders.length);
    return '📊 الملخص: ' + parts.join(' • ') + '.<br><span style="font-size:11px;color:var(--text-muted);">اسألني عن: القلابات، الرمل/الدفان، الأسفلت، السفتي، النواقص، التوفر، الإغلاق، التأخير، الاعتمادات، تكلفة المعدات…</span>';
  }

  /* ── حاسبة المعدات واللوجستيات (Equipment & Logistics Calculator) ── */
  var EQUIPMENT = [
    { id: 'EX', ar: 'حفار هيدروليكي 20 طن', en: 'Excavator 20t', h: 260, fuel: 18, mov: 1500 },
    { id: 'BL', ar: 'شيول / لودر', en: 'Wheel Loader', h: 180, fuel: 12, mov: 800 },
    { id: 'RL', ar: 'هراس اهتزازي', en: 'Vibratory Roller', h: 150, fuel: 8, mov: 600 },
    { id: 'PC', ar: 'مكبس اهتزازي', en: 'Plate Compactor', h: 45, fuel: 2, mov: 150 },
    { id: 'DT', ar: 'قلاب 12 م³', en: 'Dump Truck 12m³', h: 140, fuel: 11, mov: 400 },
    { id: 'WT', ar: 'ناقلة مياه 8 م³', en: 'Water Truck 8m³', h: 120, fuel: 9, mov: 400 },
    { id: 'GT', ar: 'مولد كهربائي 30 ك.ف.أ', en: 'Generator 30kVA', h: 35, fuel: 3, mov: 100 },
    { id: 'PU', ar: 'بيك أب عمالة', en: 'Crew Pickup', h: 60, fuel: 5, mov: 200 },
    { id: 'CR', ar: 'رافعة شوكية', en: 'Forklift', h: 90, fuel: 6, mov: 350 }
  ];

  function eqDefaultHours() {
    var c = getCalcs();
    if (!c || !c.c || !c.fleet) return {};
    return {
      EX: Math.round(c.c.excav / 40 * 10) / 10,
      DT: Math.round(c.fleet.trucks * 0.5 * 10) / 10,
      RL: Math.round(c.c.area / 150 * 10) / 10,
      PC: Math.round(c.c.area / 80 * 10) / 10,
      WT: Math.round(Math.ceil(c.c.waterM3 / 8) * 0.5 * 10) / 10
    };
  }

  function getEq() {
    var ops = getOps();
    if (!ops.equipment) ops.equipment = {};
    var e = ops.equipment;
    if (!e.hours || typeof e.hours !== 'object') e.hours = eqDefaultHours();
    if (e.siteKm == null) e.siteKm = 25;
    if (e.costKm == null) e.costKm = 8;
    if (e.fuelPrice == null) e.fuelPrice = 0.95;
    if (e.trips == null) e.trips = 0;
    e.mobil = e.mobil !== false;
    setOps(ops);
    return e;
  }

  function eqCalc(cfg) {
    cfg = cfg || getEq();
    var hours = cfg.hours || {};
    var km = +cfg.siteKm || 0;
    var cKm = +cfg.costKm || 0;
    var fP = +cfg.fuelPrice || 0;
    var trips = +cfg.trips || 0;
    var rows = EQUIPMENT.map(function (m) {
      var h = Math.max(0, +hours[m.id] || 0);
      var rent = Math.round(h * m.h);
      var fuelL = h * m.fuel;
      var fuelC = Math.round(fuelL * fP);
      var mov = cfg.mobil && h > 0 ? m.mov : 0;
      return { id: m.id, name: m.ar, en: m.en, h: m.h, hours: Math.round(h * 100) / 100, rent: rent, fuelL: Math.round(fuelL * 10) / 10, fuelC: fuelC, mov: mov };
    });
    var rent = 0, fuel = 0, fuelL = 0, mov = 0;
    rows.forEach(function (r) { rent += r.rent; fuel += r.fuelC; fuelL += r.fuelL; mov += r.mov; });
    var logi = Math.round(trips * km * 2 * cKm);
    return {
      rows: rows, rent: rent, fuel: fuel, fuelL: Math.round(fuelL * 10) / 10, mov: mov,
      logi: logi, grand: rent + fuel + mov + logi,
      km: km, cKm: cKm, trips: trips,
      active: rows.filter(function (r) { return r.hours > 0; }).length
    };
  }

  function csvEsc(v) {
    v = String(v == null ? '' : v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  function downloadCSV(name, content) {
    try {
      if (typeof Blob === 'undefined' || typeof URL === 'undefined') { if (typeof toast === 'function') toast('التصدير غير مدعوم في هذه البيئة', 'warning'); return; }
      var blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
    } catch (e) { if (typeof toast === 'function') toast('تعذّر التصدير', 'warning'); }
  }

  function eqToBOQ() {
    var calc = eqCalc();
    if (!calc.active) { if (typeof toast === 'function') toast('أدخل ساعات تشغيل لمعدة واحدة على الأقل', 'warning'); return; }
    if (typeof App === 'undefined' || !App.state || !App.state.boq || !App.state.boq.items) { if (typeof toast === 'function') toast('افتح مقايسة أولاً قبل إضافة المعدات', 'warning'); return; }
    var n = 0;
    calc.rows.forEach(function (r) {
      if (r.hours <= 0) return;
      App.state.boq.items.push({ code: 'EQ-' + r.id, qty: r.hours, customPrice: r.h, note: '🚜 ' + r.name + ' — تأجير معدات' });
      n++;
    });
    if (typeof App._renderBOQTable === 'function') App._renderBOQTable();
    if (typeof App.runDepsCheck === 'function') App.runDepsCheck();
    if (typeof toast === 'function') toast('أُضيف ' + n + ' بند معدات للمقايسة', 'success');
  }

  function eqExport() {
    var calc = eqCalc();
    var lines = [['#', 'المعدة', 'سعر الساعة', 'الساعات', 'الإيجار', 'وقود (لتر)', 'تكلفة الوقود', 'تنقلات'].map(csvEsc).join(',')];
    calc.rows.forEach(function (r, i) {
      if (r.hours <= 0) return;
      lines.push([i + 1, r.name, r.h, r.hours, r.rent, r.fuelL, r.fuelC, r.mov].map(csvEsc).join(','));
    });
    lines.push('');
    lines.push('اللوجستيات: ' + calc.trips + ' رحلة × ' + calc.km + ' كم (ذهاب/إياب) × ' + calc.cKm + ' ر.س/كم = ' + calc.logi);
    lines.push('إيجار: ' + calc.rent + ' | وقود: ' + calc.fuel + ' | تنقلات: ' + calc.mov + ' | الإجمالي: ' + calc.grand);
    downloadCSV('EquipmentLogistics_' + Date.now() + '.csv', lines.join('\n'));
  }

  /* ════════════════ الواجهة ════════════════ */
  var panelRef = null;

  function render(panel) {
    panelRef = panel;
    var ar = (typeof App !== 'undefined' && App.lang === 'ar');
    var t = function (a, e) { return ar ? a : e; };
    panel.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:16px;animation:pageFade 0.25s ease;">'
      + '<div class="card"><div class="card-head" style="background:linear-gradient(90deg,rgba(212,160,28,0.08),transparent);border-bottom:1px solid var(--border);">'
      + '<span style="font-size:16px;">📊</span><span class="card-title">' + t('لوحة التشغيل واللوجستيات', 'Operations & Logistics Command Center') + '</span>'
      + '<span style="margin-' + (ar ? 'right' : 'left') + ':auto;font-size:10.5px;color:var(--text-muted);">' + t('مؤشرات لحظية • اعتمادات • موردون • فحص قبل/بعد', 'KPIs • Approvals • Suppliers • Before/After') + '</span></div>'
      + '<div class="card-body"><div id="ops-kpis"></div></div></div>'

      + '<div class="card" style="border:1px solid var(--border-sec);"><div class="card-head" style="border-bottom:1px solid var(--border);">'
      + '<span style="font-size:16px;">🤝</span><span class="card-title">' + t('مركز التنسيق والاعتماد (Site Coordination)', 'Site Coordination Hub') + '</span>'
      + '<span style="margin-' + (ar ? 'right' : 'left') + ':auto;">'
      + '<button class="btn btn-primary btn-sm" data-act="new-wp">＋ ' + t('حزمة عمل من آخر حساب', 'New work package') + '</button></span></div>'
      + '<div class="card-body"><div style="font-size:11px;color:var(--text-sub);margin-bottom:8px;">' + t('⛔ لا يُنفَّذ أي عمل قبل اكتمال اعتماد الكميات والمواد والمعدات.', 'No work before quantities/materials/equipment are approved.') + '</div><div id="ops-wps"></div></div></div>'

      + '<div class="card" style="border:1px solid var(--border-sec);"><div class="card-head" style="border-bottom:1px solid var(--border);">'
      + '<span style="font-size:16px;">🏭</span><span class="card-title">' + t('الموردون وتتبع التوريد', 'Suppliers & Order Tracking') + '</span></div>'
      + '<div class="card-body">'
      + '<div id="ops-suppliers"></div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin:10px 0;">'
      + '<select id="ops-order-sup" style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-surface);color:var(--text-h);"></select>'
      + '<input id="ops-order-mat" type="text" placeholder="' + t('المادة', 'Material') + '" style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-surface);color:var(--text-h);">'
      + '<input id="ops-order-qty" type="number" placeholder="' + t('الكمية', 'Qty') + '" style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-surface);color:var(--text-h);">'
      + '<input id="ops-order-unit" type="text" placeholder="' + t('الوحدة', 'Unit') + '" value="م³" style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-surface);color:var(--text-h);">'
      + '<input id="ops-order-eta" type="text" placeholder="' + t('الوصول المتوقع', 'ETA') + '" style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-surface);color:var(--text-h);">'
      + '<button class="btn btn-primary" data-act="add-order">🛒 ' + t('أمر توريد', 'Issue order') + '</button></div>'
      + '<div id="ops-orders"></div></div></div>'

      + '<div class="card" style="border:1px solid var(--border-sec);"><div class="card-head" style="border-bottom:1px solid var(--border);">'
      + '<span style="font-size:16px;">🖼️</span><span class="card-title">' + t('فحص قبل / بعد (Restoration Check)', 'Before & After Inspection') + '</span>'
      + '<span style="margin-' + (ar ? 'right' : 'left') + ':auto;font-size:10.5px;color:var(--text-muted);">' + t('اكتشاف النواقص والعيوب وعدم مطابقة الإغلاق', 'Detect defects & mismatched closures') + '</span></div>'
      + '<div class="card-body">'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:8px;">'
      + '<input id="ops-insp-site" type="text" placeholder="' + t('الموقع / الحزمة', 'Site / package') + '" style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-surface);color:var(--text-h);">'
      + '<input id="ops-insp-closure" type="text" placeholder="' + t('نوع الإغلاق', 'Closure type') + '" value="أسفلت" style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-surface);color:var(--text-h);">'
      + '<label style="font-size:11px;color:var(--text-sub);display:flex;align-items:center;gap:6px;">📷 ' + t('قبل', 'Before') + '<input id="ops-insp-before" type="file" accept="image/*" style="max-width:130px;"></label>'
      + '<label style="font-size:11px;color:var(--text-sub);display:flex;align-items:center;gap:6px;">📷 ' + t('بعد', 'After') + '<input id="ops-insp-after" type="file" accept="image/*" style="max-width:130px;"></label></div>'
      + '<div id="ops-insp-checks" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:6px;font-size:11.5px;margin-bottom:8px;"></div>'
      + '<button class="btn btn-gold btn-sm" data-act="add-insp">✅ ' + t('تسجيل الفحص وحساب المطابقة', 'Record inspection') + '</button>'
      + '<div id="ops-inspections" style="margin-top:10px;"></div></div></div>'

      + '<div class="card" style="border:1px solid var(--border-sec);"><div class="card-head" style="border-bottom:1px solid var(--border);">'
      + '<span style="font-size:16px;">🤖</span><span class="card-title">' + t('المساعد التشغيلي (AI Copilot)', 'AI Operations Copilot') + '</span>'
      + '<span style="margin-' + (ar ? 'right' : 'left') + ':auto;font-size:10.5px;color:var(--text-muted);">' + t('أجيب فوراً على أسئلة التشغيل', 'Instant operational Q&A') + '</span></div>'
      + '<div class="card-body">'
      + '<div id="ops-copilot-chips" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;"></div>'
      + '<div style="display:flex;gap:8px;">'
      + '<input id="ops-copilot-q" type="text" placeholder="' + t('اكتب سؤالك… مثل: كم عدد القلابات المطلوبة؟', 'Ask… e.g. how many trucks needed?') + '" style="flex:1;padding:9px 12px;border:1px solid var(--border);border-radius:9px;background:var(--bg-surface);color:var(--text-h);">'
      + '<button class="btn btn-primary" data-act="copilot-ask">➤</button></div>'
      + '<div id="ops-copilot-out" style="margin-top:8px;padding:10px 12px;background:var(--bg-inset,rgba(0,0,0,.04));border:1px solid var(--border);border-radius:10px;font-size:12.5px;line-height:1.8;min-height:30px;">'
      + t('اسألني عن الكميات والمواد والأسطول والاعتمادات…', 'Ask about quantities, materials, fleet, approvals…') + '</div>'
      + '</div></div></div>'

      + '<div class="card" style="border:1px solid var(--border-sec);"><div class="card-head" style="border-bottom:1px solid var(--border);">'
      + '<span style="font-size:16px;">🚜</span><span class="card-title">' + t('حاسبة المعدات واللوجستيات', 'Equipment & Logistics Calculator') + '</span>'
      + '<span style="margin-' + (ar ? 'right' : 'left') + ':auto;font-size:10.5px;color:var(--text-muted);">' + t('أسعار تأجير • وقود • تنقلات • رحلات نقل المواد', 'Rental rates • Fuel • Mobilization • Material trips') + '</span></div>'
      + '<div class="card-body"><div id="ops-eq"></div></div></div>';

    // supplier select + chips + checks
    var ops = getOps();
    var supSel = panel.querySelector('#ops-order-sup');
    ops.suppliers.forEach(function (s) {
      var o = document.createElement('option');
      o.value = s.id; o.textContent = s.name;
      supSel.appendChild(o);
    });
    var chips = panel.querySelector('#ops-copilot-chips');
    ['كم عدد القلابات المطلوبة؟', 'كم كمية الرمل المطلوبة؟', 'هل المواد متوفرة؟', 'ما الذي ينقص المشروع؟', 'هل الإغلاق مطابق للمقايسة؟', 'ما أسباب التأخير؟', 'ما المطلوب لبدء التنفيذ؟'].forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'btn btn-sm';
      b.textContent = c;
      b.setAttribute('data-act', 'copilot-chip');
      chips.appendChild(b);
    });
    var checksBox = panel.querySelector('#ops-insp-checks');
    CHECK_ITEMS.forEach(function (item, i) {
      var lbl = document.createElement('label');
      lbl.style.display = 'flex'; lbl.style.alignItems = 'center'; lbl.style.gap = '6px';
      lbl.innerHTML = '<input type="checkbox" data-check="' + i + '" checked> ' + item;
      checksBox.appendChild(lbl);
    });

    // file inputs
    var pend = { before: null, after: null };
    panel.querySelector('#ops-insp-before').addEventListener('change', function (e) {
      fileToDataURL(e.target.files[0], function (d) { pend.before = d; toast('تم التقاط صورة «قبل»', 'success'); });
    });
    panel.querySelector('#ops-insp-after').addEventListener('change', function (e) {
      fileToDataURL(e.target.files[0], function (d) { pend.after = d; toast('تم التقاط صورة «بعد»', 'success'); });
    });
    panel.__pend = pend;

    // delegated clicks
    panel.onclick = function (e) {
      var tgt = e.target;
      var el = tgt.closest ? tgt.closest('[data-act]') : null;
      if (!el) return;
      var act = el.getAttribute('data-act');
      if (act === 'copilot-ask' || act === 'copilot-chip') {
        var q = act === 'copilot-chip' ? el.textContent : panel.querySelector('#ops-copilot-q').value;
        panel.querySelector('#ops-copilot-out').innerHTML = '<b>🗨️ ' + q + '</b><br>' + answer(q);
        return;
      }
      if (act === 'new-wp') { createWP(); refresh(); return; }
      if (act === 'approve') { approve(+el.getAttribute('data-id'), el.getAttribute('data-item')); refresh(); return; }
      if (act === 'wp-next') { wpStatus(+el.getAttribute('data-id'), el.getAttribute('data-next')); refresh(); return; }
      if (act === 'del-wp') { delWP(+el.getAttribute('data-id')); refresh(); return; }
      if (act === 'add-order') {
        addOrder(panel.querySelector('#ops-order-sup').value, panel.querySelector('#ops-order-mat').value, panel.querySelector('#ops-order-qty').value, panel.querySelector('#ops-order-unit').value, panel.querySelector('#ops-order-eta').value);
        refresh(); return;
      }
      if (act === 'order-next') { nextOrder(+el.getAttribute('data-id')); refresh(); return; }
      if (act === 'del-order') { delOrder(+el.getAttribute('data-id')); refresh(); return; }
      if (act === 'add-insp') {
        var checks = Array.prototype.map.call(panel.querySelectorAll('input[data-check]'), function (c) { return c.checked; });
        addInspection(panel.querySelector('#ops-insp-site').value || 'موقع غير محدد', panel.querySelector('#ops-insp-closure').value || '—', (panel.__pend || {}).before, (panel.__pend || {}).after, checks);
        refresh(); return;
      }
      if (act === 'del-insp') { delInsp(+el.getAttribute('data-id')); refresh(); return; }
      if (act === 'eq-save') { saveEqFromPanel(); return; }
      if (act === 'eq-export') { eqExport(); return; }
      if (act === 'eq-to-boq') { eqToBOQ(); refresh(); return; }
    };

    refresh();
  }

  function refresh() {
    if (!panelRef) return;
    var p = panelRef;
    fillKPIs(p);
    fillWPs(p);
    fillSuppliers(p);
    fillOrders(p);
    fillInspections(p);
    fillEquip(p);
  }

  function kpiCard(lbl, val, sub, col) {
    return '<div style="flex:1;min-width:120px;background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:10px 12px;border-top:3px solid ' + col + ';">'
      + '<div style="font-size:9.5px;color:var(--text-muted);font-weight:700;">' + lbl + '</div>'
      + '<div style="font-size:17px;font-weight:900;color:var(--text-h);margin:2px 0 1px;">' + val + '</div>'
      + '<div style="font-size:9px;color:var(--text-sub);line-height:1.5;">' + sub + '</div></div>';
  }

  function fillKPIs(p) {
    var box = p.querySelector('#ops-kpis');
    if (!box) return;
    var k = kpis();
    var th = k.plan.excav > 0 ? (k.pct(k.sum.excav, k.plan.excav) + '%') : '—';
    var thL = k.plan.L > 0 ? (k.pct(k.sum.L, k.plan.L) + '%') : '—';
    var tl = k.sum.asphalt + ' طن';
    box.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;gap:8px;">'
      + kpiCard('طول الحفر المنفذ', fmt(k.sum.L) + ' م', 'المخطط ' + fmt(k.plan.L) + ' م — إنجاز ' + thL, 'var(--accent-blue)')
      + kpiCard('حجم الحفر المنفذ', fmt(k.sum.excav) + ' م³', 'النظري ' + fmt(k.plan.excav) + ' م³ — ' + th, 'var(--accent-blue)')
      + kpiCard('ترحيل المخلفات', fmt(k.sum.waste) + ' م³', 'من ' + fmt(k.plan.waste) + ' م³ نظرياً', 'var(--accent-red)')
      + kpiCard('الرمل المنفذ', fmt(k.sum.sand) + ' م³', 'مطلوب ' + fmt(k.plan.sand) + ' م³', 'var(--sec-gold)')
      + kpiCard('الأسفلت المنفذ', tl, 'المنفذ من الإنتاج اليومي', 'var(--accent-gold)')
      + kpiCard('حزم العمل', k.totalWP, 'معتمدة ' + k.done + ' • تنتظر ' + k.pending, 'var(--sec-primary)')
      + kpiCard('طلبات التوريد', k.totalOrders, 'متوسط زمن التوريد ' + fmt(k.avgLead) + ' يوم', 'var(--sec-gold)')
      + kpiCard('فحوصات قبل/بعد', k.inspections, 'لتقييم مطابقة الإغلاق', 'var(--accent-blue)')
      + '</div>';
  }

  function fillWPs(p) {
    var box = p.querySelector('#ops-wps');
    if (!box) return;
    var ops = getOps();
    if (!ops.workPackages.length) {
      box.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:12px;">— ' + (ops.workPackages.length ? '' : 'لا توجد حزم عمل. اضغط «حزمة عمل من آخر حساب»') + ' —</div>';
      return;
    }
    var STATUS = { 'pending': '⏳ تنتظر الاعتماد', 'approved': '✅ معتمدة', 'executing': '🚧 قيد التنفيذ', 'done': '✔️ منجزة' };
    var rows = ops.workPackages.slice().reverse().map(function (w) {
      var t = w.totals;
      var app = ['quantities', 'materials', 'equipment'].map(function (it) {
        var a = w.approvals[it];
        var lbl = it === 'quantities' ? 'الكميات' : it === 'materials' ? 'المواد' : 'المعدات';
        var st = a ? ('✅ ' + a.role + ' • ' + (a.at ? a.at.slice(0, 10) : '')) : '⬜';
        return '<button class="btn btn-sm ' + (a ? 'btn-gold' : '') + '" data-act="approve" data-id="' + w.id + '" data-item="' + it + '" style="margin:2px;">' + lbl + ': ' + st + '</button>';
      }).join('');
      var next = w.status === 'approved' ? '<button class="btn btn-primary btn-sm" data-act="wp-next" data-id="' + w.id + '" data-next="executing">▶ ' + 'ابدأ التنفيذ' + '</button>'
        : w.status === 'executing' ? '<button class="btn btn-sm" data-act="wp-next" data-id="' + w.id + '" data-next="done">✔ ' + 'إنهاء' + '</button>' : '';
      return '<tr>'
        + '<td style="font-size:11.5px;font-weight:800;">' + w.name + '<div style="font-size:10px;color:var(--text-muted);font-weight:400;">' + w.date + ' • ' + w.L + 'م×' + w.W + 'م×' + w.D + 'م • ' + w.closure + '</div></td>'
        + '<td style="font-size:10.5px;color:var(--text-sub);line-height:1.7;">حفر ' + fmt(t.excav) + 'م³ • ترحيل ' + fmt(t.waste) + 'م³<br>رمل ' + fmt(t.sand) + 'م³ • خرسانة كيبل ' + fmt(t.concrete || 0) + 'م³ • أسفلت ' + fmt(t.asphalt) + 'ط • سفتي ' + fmt(t.barriers) + '</td>'
        + '<td style="min-width:250px;">' + app + '</td>'
        + '<td><span style="display:inline-block;padding:2px 10px;border-radius:99px;font-size:10px;font-weight:800;background:var(--bg-surface);border:1px solid var(--border);color:var(--text-h);">' + (STATUS[w.status] || w.status) + '</span><br>' + next + '</td>'
        + '<td><button class="btn btn-danger btn-sm" data-act="del-wp" data-id="' + w.id + '">✕</button></td></tr>';
    }).join('');
    box.innerHTML = '<div class="tbl-wrap"><table class="data-table"><thead><tr>'
      + '<th>' + 'الحزمة' + '</th><th>' + 'الكميات' + '</th><th>' + 'الاعتمادات (الكميات/المواد/المعدات)' + '</th><th>' + 'الحالة' + '</th><th></th></tr></thead><tbody>'
      + rows + '</tbody></table></div>';
  }

  function fillSuppliers(p) {
    var box = p.querySelector('#ops-suppliers');
    if (!box) return;
    var ops = getOps();
    box.innerHTML = '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + ops.suppliers.map(function (s) {
      return '<span style="display:inline-block;padding:4px 10px;border-radius:99px;background:var(--bg-inset,rgba(0,0,0,.04));border:1px solid var(--border);font-size:10.5px;color:var(--text-sub);">🏭 ' + s.name + ' — ' + s.materials + '</span>';
    }).join('') + '</div>';
  }

  function fillOrders(p) {
    var box = p.querySelector('#ops-orders');
    if (!box) return;
    var ops = getOps();
    if (!ops.orders.length) { box.innerHTML = '<div style="padding:10px;text-align:center;color:var(--text-muted);font-size:12px;">لا توجد أوامر توريد</div>'; return; }
    var rows = ops.orders.slice().reverse().map(function (o) {
      return '<tr>'
        + '<td style="font-size:11px;">' + supplierName(ops, o.supplierId) + '</td>'
        + '<td style="font-weight:700;">' + o.material + '</td>'
        + '<td>' + fmt(o.qty) + ' ' + o.unit + '</td>'
        + '<td>' + (ORDER_STATUS[o.status] || o.status) + (o.eta ? '<div style="font-size:9.5px;color:var(--text-muted);">ETA ' + o.eta + '</div>' : '') + '</td>'
        + '<td>' + (o.status !== 'received' ? '<button class="btn btn-sm" data-act="order-next" data-id="' + o.id + '">' + 'تحديث ➤' + '</button>' : '✔ مستلم') + '</td>'
        + '<td><button class="btn btn-danger btn-sm" data-act="del-order" data-id="' + o.id + '">✕</button></td></tr>';
    }).join('');
    box.innerHTML = '<div class="tbl-wrap"><table class="data-table"><thead><tr><th>' + 'المورد' + '</th><th>' + 'المادة' + '</th><th>' + 'الكمية' + '</th><th>' + 'الحالة' + '</th><th></th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function fillInspections(p) {
    var box = p.querySelector('#ops-inspections');
    if (!box) return;
    var ops = getOps();
    if (!ops.inspections.length) { box.innerHTML = ''; return; }
    var rows = ops.inspections.slice().reverse().map(function (x) {
      var col = x.score >= 80 ? 'var(--sec-primary)' : x.score >= 50 ? 'var(--accent-gold)' : 'var(--accent-red)';
      return '<tr>'
        + '<td style="font-size:11px;">' + x.date + ' — ' + x.site + ' <span style="color:var(--text-muted);">(' + x.closure + ')</span></td>'
        + '<td style="font-size:10.5px;color:var(--text-sub);line-height:1.6;">' + CHECK_ITEMS.map(function (c, i) { return (x.checks[i] ? '✅' : '❌') + ' ' + c; }).join('<br>') + '</td>'
        + '<td><span style="display:inline-block;padding:2px 10px;border-radius:99px;font-size:11px;font-weight:800;background:rgba(0,132,61,.1);color:' + col + ';">' + x.score + '%</span></td>'
        + '<td style="font-size:0;">' + (x.before ? '<img src="' + x.before + '" style="width:60px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--border);">' : '') + (x.after ? ' <img src="' + x.after + '" style="width:60px;height:40px;object-fit:cover;border-radius:6px;border:1px solid var(--border);">' : '') + '</td>'
        + '<td><button class="btn btn-danger btn-sm" data-act="del-insp" data-id="' + x.id + '">✕</button></td></tr>';
    }).join('');
    box.innerHTML = '<div class="tbl-wrap"><table class="data-table"><thead><tr><th>' + 'الموقع/التاريخ' + '</th><th>' + 'بنود المطابقة' + '</th><th>' + 'الدرجة' + '</th><th>' + 'الصور' + '</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function fillEquip(p) {
    var box = p.querySelector('#ops-eq');
    if (!box) return;
    var eq = getEq();
    var calc = eqCalc(eq);
    var ar = (typeof App !== 'undefined' && App.lang === 'ar');
    var t = function (a, e) { return ar ? a : e; };
    var rows = EQUIPMENT.map(function (m) {
      var v = eq.hours[m.id] || 0;
      return '<tr>'
        + '<td style="font-weight:700;font-size:11.5px;">' + m.ar + '<div style="font-size:9.5px;color:var(--text-muted);font-weight:400;">' + m.en + '</div></td>'
        + '<td style="font-size:11px;color:var(--text-sub);white-space:nowrap;">' + m.h + ' ' + t('ر.س/س', 'SAR/h') + '</td>'
        + '<td><input id="ops-eq-in-' + m.id + '" type="number" min="0" step="0.5" value="' + v + '" style="width:84px;padding:5px 8px;border:1px solid var(--border);border-radius:7px;background:var(--bg-surface);color:var(--text-h);"></td>'
        + '<td style="font-size:10.5px;color:var(--text-muted);white-space:nowrap;">' + m.fuel + ' ' + t('ل/س', 'L/h') + (m.mov ? ' • ' + t('تنقل', 'mobil.') + ' ' + m.mov : '') + '</td></tr>';
    }).join('');
    box.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">'
      + '<input id="ops-eq-km" type="number" min="0" step="0.5" value="' + eq.siteKm + '" placeholder="' + t('مسافة الموقع (كم)', 'Site distance (km)') + '" style="flex:1;min-width:130px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-surface);color:var(--text-h);">'
      + '<input id="ops-eq-costkm" type="number" min="0" step="0.5" value="' + eq.costKm + '" placeholder="' + t('تكلفة الرحلة (ر.س/كم)', 'Trip cost (SAR/km)') + '" style="flex:1;min-width:130px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-surface);color:var(--text-h);">'
      + '<input id="ops-eq-trips" type="number" min="0" step="1" value="' + eq.trips + '" placeholder="' + t('رحلات نقل المواد', 'Material trips') + '" style="flex:1;min-width:110px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-surface);color:var(--text-h);">'
      + '<input id="ops-eq-fuel" type="number" min="0" step="0.05" value="' + eq.fuelPrice + '" placeholder="' + t('سعر الديزل (ر.س/لتر)', 'Diesel (SAR/L)') + '" style="flex:1;min-width:110px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-surface);color:var(--text-h);">'
      + '<label style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-sub);padding:8px 2px;">' + t('تشغيل التنقلات', 'Mobilization') + ' <input id="ops-eq-mobil" type="checkbox" ' + (eq.mobil ? 'checked' : '') + '></label>'
      + '</div>'
      + '<div class="tbl-wrap" style="margin-bottom:10px;"><table class="data-table"><thead><tr>'
      + '<th>' + t('المعدة', 'Equipment') + '</th><th>' + t('السعر', 'Rate') + '</th><th>' + t('ساعات التشغيل', 'Hours') + '</th><th>' + t('مواصفات', 'Specs') + '</th>'
      + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
      + '<div id="ops-eq-sum" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;">'
      + kpiCard(t('إيجار المعدات', 'Rental'), fmt(calc.rent) + ' ' + t('ر.س', 'SAR'), calc.active + ' ' + t('معدة نشطة', 'active'), 'var(--accent-blue)')
      + kpiCard(t('الوقود', 'Fuel'), fmt(calc.fuel) + ' ' + t('ر.س', 'SAR'), fmt(calc.fuelL) + ' ' + t('لتر', 'L'), 'var(--accent-gold)')
      + kpiCard(t('التنقلات', 'Mobilization'), fmt(calc.mov) + ' ' + t('ر.س', 'SAR'), eq.mobil ? t('مشمولة', 'included') : t('معطّلة', 'off'), 'var(--sec-gold)')
      + kpiCard(t('لوجستيات النقل', 'Logistics'), fmt(calc.logi) + ' ' + t('ر.س', 'SAR'), calc.trips + ' ' + t('رحلة ×', 'trips ×') + ' ' + fmt(calc.km * 2) + ' ' + t('كم', 'km'), 'var(--sec-primary)')
      + kpiCard(t('الإجمالي', 'Grand total'), fmt(calc.grand) + ' ' + t('ر.س', 'SAR'), t('يُضاف بنود معدات للمقايسة', 'added as BOQ equipment items'), 'var(--accent-red)')
      + '</div>'
      + '<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">'
      + '<button class="btn btn-primary btn-sm" data-act="eq-save">💾 ' + t('تحديث وحفظ', 'Save & recalc') + '</button>'
      + '<button class="btn btn-outline btn-sm" data-act="eq-export">📥 ' + t('تصدير CSV', 'Export CSV') + '</button>'
      + '<button class="btn btn-gold btn-sm" data-act="eq-to-boq">➕ ' + t('إضافة للمقايسة', 'Add to BOQ') + '</button>'
      + '</div>';
  }

  function saveEqFromPanel() {
    var p = panelRef;
    if (!p) return;
    var ops = getOps();
    if (!ops.equipment) ops.equipment = {};
    var e = ops.equipment;
    if (!e.hours || typeof e.hours !== 'object') e.hours = {};
    EQUIPMENT.forEach(function (m) {
      var el = p.querySelector('#ops-eq-in-' + m.id);
      e.hours[m.id] = el ? (+el.value || 0) : (e.hours[m.id] || 0);
    });
    var num = function (sel, d) { var el = p.querySelector(sel); return el ? (+el.value || d) : d; };
    e.siteKm = num('#ops-eq-km', 25);
    e.costKm = num('#ops-eq-costkm', 8);
    e.fuelPrice = num('#ops-eq-fuel', 0.95);
    e.trips = num('#ops-eq-trips', 0);
    var mb = p.querySelector('#ops-eq-mobil');
    e.mobil = mb ? mb.checked : true;
    setOps(ops);
    if (typeof toast === 'function') toast('حُفظ حساب المعدات واللوجستيات', 'success');
    fillEquip(p);
  }

  window.OpsCenter = {
    OPS_KEY: OPS_KEY, getOps: getOps, setOps: setOps,
    kpis: kpis, answer: answer, createWP: createWP, approve: approve, wpStatus: wpStatus,
    addOrder: addOrder, nextOrder: nextOrder, addInspection: addInspection,
    EQUIPMENT: EQUIPMENT, eqDefaultHours: eqDefaultHours, getEq: getEq, eqCalc: eqCalc,
    eqToBOQ: eqToBOQ, eqExport: eqExport,
    render: render, refresh: refresh,
  };
})();
