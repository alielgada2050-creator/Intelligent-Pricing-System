/* ════════════════════════════════════════════════════════════════
   BOQ Intel — محرك الحساب الذكي للكميات والمواد (Smart Quantity &
   Material Demand Engine) — إعادة الوضع لما كان عليه
   ════════════════════════════════════════════════════════════════
   معادلات الحساب (حسب الكود السعودي والممارسات الهندسية):
   • الحفر المفتوح  V = L × W × D            (م³)
   • مخلفات الترحيل = V × 1.20 (معامل تمدد)  (م³)
   • القلابات       = ⌈ مخلفات ÷ سعة القلاب ⌉ (سعة افتراضية 12 م³)
    • طبقة الرمل     = L × W × (0.10 تحت الكيبل + 0.30 فوقه) (م³)
    • خرسانة حماية الكيبل = L × 0.20 × 0.30 (م³) — فوق الرمل بعد الدفان
    • مياه الدك      = البيز × 10 لتر/م³ (على الطبقة البيز فقط)
    • البيز Subbase  = L × W × 0.15 (م³)   • Road Base = L × W × 0.15 (م³)
    • الطريق الترابي = دفان رمل + صب بيز (بدون أسفلت)
   • الأسفلت        = L × W × سماكة × 2.35 طن/م³  (طن)
   • Prime Coat (RC-70) = المساحة × 0.40 ل/م²   → جالون
   • Tack Coat (RC-2)   = المساحة × 0.25 ل/م²   → جالون   (1 جالون = 3.785 ل)
   • السفتي         = L × 2.5 حبة/م  (مثال: حفرية 10م → 25 حبة)
   • البلاط/الإنترلوك = L × W (م²)   • البلدورة = 2 × L (م)
   • المعدات         = حفار: حجم/40م³س • هراس: مساحة/150م²س • مكبس: مساحة/80م²س
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var RATES = {
    beddingSandT: 0.10,   // متر — رمل ناعم تحت الكيبل
    coverSandT: 0.30,     // متر — رمل فوق الكيبل
    subbaseWater: 10,     // لتر/م³ — مياه الدك على الطبقة البيز فقط
    subbaseT: 0.15,       // متر — طبقة بيز / Subbase
    roadBaseT: 0.15,      // متر — طبقة Road Base
    concreteW: 0.20,      // متر — عرض خرسانة حماية الكيبل فوق الرمل
    concreteH: 0.30,      // متر — سمك خرسانة حماية الكيبل فوق الرمل
    primeCoatRate: 0.40,  // لتر/م² — عامل أساسي RC-70
    tackCoatRate: 0.25,   // لتر/م² — عامل لاصق RC-2 / MC-2
    asphaltDensity: 2.35, // طن/م³ — خلطة إسفلتية ساخنة
    asphaltT: 0.05,       // متر — سماكة افتراضية 5 سم
    barrierRate: 2.5,     // حبة سفتي لكل متر طولي
    truckCapacity: 12,    // م³ — سعة القلاب
    bulkingFactor: 1.20,  // معامل تمدد مخلفات الحفر
    L_PER_GAL: 3.785,     // لتر في الجالون
    waterTruckCap: 8,     // م³ — سعة ناقلة المياه
  };

  var STOCK_KEY = 'boqIntel.stock';
  var DAILY_KEY = 'boqIntel.daily';

  /* ── حساب الحفرية الكامل ── */
  function computeTrench(o) {
    o = o || {};
    var R = {};
    Object.keys(RATES).forEach(function (k) { R[k] = RATES[k]; });
    if (o.rates) Object.keys(o.rates).forEach(function (k) { R[k] = +o.rates[k] || R[k]; });
    var L = Math.max(0, +o.length || 0);
    var W = Math.max(0, +o.width || 0);
    var D = Math.max(0, +o.depth || 0);
    var area = L * W;
    var excav = L * W * D;
    var waste = excav * R.bulkingFactor;
    var sand = L * W * (R.beddingSandT + R.coverSandT);
    var subbase = area * R.subbaseT;
    var waterL = subbase * R.subbaseWater;   // لتر — مياه الدك على البيز فقط
    var waterM3 = waterL / 1000;
    var concreteM3 = L * R.concreteW * R.concreteH;
    var remainingDepth = Math.max(0, D - (R.beddingSandT + R.coverSandT));
    var roadBase = area * R.roadBaseT;
    var asphaltM3 = area * R.asphaltT;
    var asphaltTons = asphaltM3 * R.asphaltDensity;
    var primeL = area * R.primeCoatRate;
    var primeGal = primeL / R.L_PER_GAL;
    var tackL = area * R.tackCoatRate;
    var tackGal = tackL / R.L_PER_GAL;
    var barriers = Math.round(L * R.barrierRate);
    var trucks = Math.ceil(waste / R.truckCapacity);
    var closureArea = area;
    var kerbs = 2 * L;
    var warning = remainingDepth < (R.subbaseT + R.roadBaseT + R.asphaltT)
      ? 'عمق الحفر لا يكفي لطبقات الإغلاق كاملة — عدّل العمق أو السماكات'
      : '';
    return {
      L: L, W: W, D: D, area: area,
      excav: excav, waste: waste, sand: sand, concreteM3: concreteM3, waterM3: waterM3, waterL: waterL,
      remainingDepth: remainingDepth, subbase: subbase, roadBase: roadBase,
      asphaltM3: asphaltM3, asphaltTons: asphaltTons,
      primeL: primeL, primeGal: primeGal, tackL: tackL, tackGal: tackGal,
      barriers: barriers, trucks: trucks, closureArea: closureArea, kerbs: kerbs,
      warning: warning, R: R,
    };
  }

  /* ── اللوجستيات والأسطول ── */
  function computeFleet(calcs, truckCap, siteKm) {
    var cap = truckCap || RATES.truckCapacity;
    var km = siteKm || 0;
    var trucks = Math.ceil(calcs.waste / cap);
    var tripTimeH = (2 * km / 40) + 0.2; // ذهاب/إياب بسرعة 40 كم/س + تحميل ~12 دقيقة
    var totalH = trucks * tripTimeH;
    var waterTrips = Math.ceil(calcs.waterM3 / RATES.waterTruckCap);
    return { trucks: trucks, cap: cap, tripTimeH: tripTimeH, totalH: totalH, waterTrips: waterTrips };
  }

  /* ── المعدات (ساعات تقديرية) ── */
  function computeEquipment(calcs) {
    return {
      excavatorH: calcs.excav / 40,     // حفار هيدروليكي
      dumpH: calcs.trucks * 0.5,        // قلابات
      rollerH: calcs.area / 150,        // هراس / دكاكة
      compactorH: calcs.area / 80,      // مكبس اهتزازي
      waterTrips: Math.ceil(calcs.waterM3 / RATES.waterTruckCap),
    };
  }

  /* ── قائمة المواد مع الوحدة والمعادلة ── */
  function materialRows(calcs, closure) {
    closure = closure || 'asphalt';
    var R = calcs.R;
    var rows = [];
    function push(key, code, name, qty, unit, formula, ref) {
      rows.push({ key: key, code: code, name: name, qty: qty, unit: unit, formula: formula, ref: ref || '' });
    }
    push('excavation', '301010105', 'حفر وردم مسار كابلات (دفان جديد)', calcs.L, 'م',
      'L = الطول المنفذ', 'بند مركب: حفر + ردم');
    push('waste', '401000019', 'إزالة وترحيل المخلفات', calcs.waste, 'م³',
      'L×W×D × ' + R.bulkingFactor);
    push('sand', '', 'رمل ناعم (تحت 10 سم + فوق 30 سم)', calcs.sand, 'م³',
      'L×W×(0.10+0.30)');
    push('water', '', 'مياه دك البيز (10 ل/م³)', calcs.waterL, 'لتر',
      'بيز × ' + R.subbaseWater + ' ل/م³');
    push('concrete', '', 'خرسانة حماية الكيبل فوق الرمل', calcs.concreteM3, 'م³',
      'L×' + R.concreteW + '×' + R.concreteH);
    push('subbase', '', 'بيز / Subbase', calcs.subbase, 'م³',
      'L×W×' + R.subbaseT + 'م');
    push('roadbase', '', 'Road Base', calcs.roadBase, 'م³',
      'L×W×' + R.roadBaseT + 'م');
    if (closure === 'asphalt') {
      push('asphalt', '', 'خلطة أسفلتية ساخنة', calcs.asphaltTons, 'طن',
        'L×W×' + R.asphaltT + 'م × ' + R.asphaltDensity + ' طن/م³');
      push('prime', '', 'عامل أساسي Prime Coat (RC-70)', calcs.primeGal, 'جالون',
        'المساحة × ' + R.primeCoatRate + ' ل/م² ÷ 3.785');
      push('tack', '', 'عامل لاصق Tack Coat (RC-2 / MC-2)', calcs.tackGal, 'جالون',
        'المساحة × ' + R.tackCoatRate + ' ل/م² ÷ 3.785');
    } else if (closure === 'interlock') {
      push('interlock', '306020002', 'إنترلوك أرصفة', calcs.closureArea, 'م²', 'L×W');
      push('kerbs', '', 'بلدورة', calcs.kerbs, 'م', '2×L');
    } else if (closure === 'tiles') {
      push('tiles', '306020003', 'بلاط أرصفة خرساني', calcs.closureArea, 'م²', 'L×W');
      push('kerbs', '', 'بلدورة', calcs.kerbs, 'م', '2×L');
    } else if (closure === 'dirt') {
      // طريق ترابي = دفان رمل + صب بيز (موجودان ضمن البنود الأساسية)
    }
    push('barriers', '', 'سفتي أمان (1 لكل متر / تأمين من الطرفين)', calcs.barriers, 'حبة',
      'L × ' + R.barrierRate + '  (مثال: 10م → 25 حبة)');
    return rows;
  }

  /* ── إدارة المخزون والطلب ── */
  function getStock() { try { return JSON.parse(localStorage.getItem(STOCK_KEY)) || {}; } catch (e) { return {}; } }
  function setStock(s) { try { localStorage.setItem(STOCK_KEY, JSON.stringify(s)); } catch (e) {} }
  function demand(rows, stock) {
    stock = stock || getStock();
    return rows.map(function (r) {
      var have = +(stock[r.key] || 0) || 0;
      var short = Math.max(0, Math.round((r.qty - have) * 100) / 100);
      var reserve = Math.round(r.qty * 0.10 * 100) / 100; // احتياطي 10%
      return { key: r.key, code: r.code, name: r.name, qty: r.qty, unit: r.unit,
               formula: r.formula, ref: r.ref, have: have, reserve: reserve, shortage: short };
    });
  }

  function csvEscape(v) {
    v = String(v == null ? '' : v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  function buildRequestCSV(demandRows, meta) {
    meta = meta || {};
    var head = ['#', 'المادة/البند', 'رمز العقد', 'الكمية المطلوبة', 'الوحدة', 'احتياطي 10%', 'المتوفر', 'العجز', 'المعطيات', 'المعادلة'];
    var lines = [head.join(',')];
    demandRows.forEach(function (r, i) {
      lines.push([i + 1, r.name, r.code || '—', r.qty, r.unit, r.reserve, r.have, r.shortage, r.ref, r.formula]
        .map(csvEscape).join(','));
    });
    lines.push('');
    lines.push('مشروع: ' + (meta.project || '—'));
    lines.push('التاريخ: ' + (meta.date || ''));
    lines.push('الطول: ' + meta.length + ' م | العرض: ' + meta.width + ' م | العمق: ' + meta.depth + ' م');
    return lines.join('\n');
  }

  function buildPurchaseCSV(demandRows, meta) {
    meta = meta || {};
    var head = ['#', 'المادة/البند', 'رمز العقد', 'كمية الشراء (عجز)', 'الوحدة', 'ملاحظات'];
    var lines = [head.join(',')];
    var n = 0;
    demandRows.forEach(function (r) {
      if (r.shortage <= 0) return;
      n++;
      lines.push([n, r.name, r.code || '—', r.shortage, r.unit, 'طلب توريد — ' + r.formula].map(csvEscape).join(','));
    });
    lines.push('');
    lines.push('أمر توريد / شراء — ' + (meta.project || ''));
    return lines.join('\n');
  }

  /* ════════════ Module 5: Material Analysis (هالك/نقل/تخزين/رفع/بدائل) ════════════ */
  // نِسَب الهالك حسب نوع المادة (تقديرات هندسية — قابلة للتعديل هنا)
  var WASTE = {
    excavation: 0.05, waste: 0.05, sand: 0.05, subbase: 0.05, roadbase: 0.05,
    concrete: 0.02, asphalt: 0.03, prime: 0.05, tack: 0.05,
    interlock: 0.05, tiles: 0.05, kerbs: 0.03, barriers: 0.05, water: 0.02,
    _default: 0.05,
  };
  // كتلة تقريبية لكل وحدة (كجم): م³ → كجم/م³، م² → كجم/م²، م → كجم/م، حبة → كجم/حبة
  var MASS = {
    sand: 1600, water: 1000, concrete: 2400, subbase: 2200, roadbase: 2200,
    waste: 1800, excavation: 1800, asphalt: 1000,
    prime: 900, tack: 900, interlock: 120, tiles: 45, kerbs: 60, barriers: 14,
    _default: 1000,
  };
  var TRUCK = { volM3: 12, loadT: 20, costPerKm: 8, handlingHPerTrip: 0.25 };

  function wastePct(key) { return WASTE[key] != null ? WASTE[key] : WASTE._default; }
  function massPerUnit(key) { return MASS[key] != null ? MASS[key] : MASS._default; }

  function weightOf(r) {
    var q = +r.qty || 0;
    var unit = r.unit || '';
    if (unit === 'طن' || unit === 'ton') return q * 1000;
    if (unit === 'لتر' || unit === 'l' || unit === 'L') return q * 0.9;
    if (unit === 'جالون' || unit === 'gal') return q * 3.785 * 0.9;
    return q * massPerUnit(r.key);
  }

  function transportTrips(r) {
    var q = +r.qty || 0;
    var unit = r.unit || '';
    var trips;
    if (unit === 'م³' || unit === 'm³') trips = Math.ceil(q / TRUCK.volM3);
    else trips = Math.ceil(weightOf(r) / 1000 / TRUCK.loadT);
    return Math.max(0, trips || 0);
  }

  function storageAreaM2(r) {
    var q = +r.qty || 0;
    var unit = r.unit || '';
    if (unit === 'م³') return Math.max(0, Math.ceil(q / 1.5));
    if (unit === 'م²') return Math.max(0, Math.ceil(q * massPerUnit(r.key) / 1000 / 0.15));
    if (unit === 'م') return Math.max(0, Math.ceil(q / 6));
    return Math.max(0, Math.ceil(q * massPerUnit(r.key) / 1000 / 0.5));
  }

  function analyzeMaterials(rows, opts) {
    opts = opts || {};
    var km = Math.max(0, +opts.siteKm || 0);
    var analysis = rows.map(function (r) {
      var pct = wastePct(r.key);
      return {
        key: r.key, code: r.code || '', name: r.name, qty: +r.qty || 0, unit: r.unit || '',
        wastePct: Math.round(pct * 100),
        gross: Math.round((+r.qty || 0) * (1 + pct) * 100) / 100,
        wasteQty: Math.round((+r.qty || 0) * pct * 100) / 100,
        weightT: Math.round(weightOf(r) / 1000 * 1000) / 1000,
        trips: transportTrips(r),
        areaM2: storageAreaM2(r),
      };
    });
    var totalWeightT = analysis.reduce(function (s, a) { return s + a.weightT; }, 0);
    var totalTrips = analysis.reduce(function (s, a) { return s + a.trips; }, 0);
    var totalArea = analysis.reduce(function (s, a) { return s + a.areaM2; }, 0);
    return {
      rows: analysis,
      totalWeightT: Math.round(totalWeightT * 100) / 100,
      totalTrips: totalTrips,
      totalAreaM2: totalArea,
      handlingH: Math.round(totalTrips * TRUCK.handlingHPerTrip * 100) / 100,
      transportCost: Math.round((km ? totalTrips * 2 * km * TRUCK.costPerKm : 0) * 100) / 100,
      km: km,
    };
  }

  function findAlternatives(nameOrCode, excludeCode, limit) {
    limit = limit || 3;
    if (typeof searchItems !== 'function') return [];
    var q = String(nameOrCode == null ? '' : nameOrCode).trim();
    if (!q) return [];
    var out = [];
    var seen = {};
    searchItems(q).slice(0, 15).forEach(function (i) {
      var code = String(i.code);
      if (code === String(excludeCode == null ? '' : excludeCode)) return;
      if (seen[code]) return;
      seen[code] = 1;
      out.push({ code: code, arDesc: i.arDesc || '', group: i.group || '', price: i.newPrice || i.bidPrice || 0, uom: i.uom || '' });
    });
    return out.slice(0, limit);
  }

  function pickAlt(oldCode, newCode) {
    if (typeof App === 'undefined' || !App.state || !App.state.boq) return;
    var n = 0;
    App.state.boq.items.forEach(function (it) {
      if (String(it.code) === String(oldCode)) {
        it.code = newCode;
        it.note = (it.note ? it.note + ' — ' : '') + 'بديل عن ' + oldCode;
        n++;
      }
    });
    if (n) {
      if (typeof App._renderBOQTable === 'function') App._renderBOQTable();
      if (typeof App.runDepsCheck === 'function') App.runDepsCheck();
      if (typeof toast === 'function') toast('تم استبدال ' + n + ' بند بالبديل ' + newCode, 'success');
    } else if (typeof toast === 'function') {
      toast('أضِف البند ' + oldCode + ' للمقايسة أولاً ثم استبدله بالبديل', 'warning');
    }
  }

  function escA(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function dlAnalysis() {
    if (!lastCalc || !lastCalc.an) { if (typeof toast === 'function') toast('احسب الكميات أولاً', 'warning'); return; }
    var an = lastCalc.an;
    var head = ['#', 'المادة', 'رمز العقد', 'الكمية', 'الوحدة', 'هالك%', 'الإجمالي بالهالك', 'الوزن (طن)', 'رحلات النقل', 'مساحة التخزين (م²)'];
    var lines = [head.join(',')];
    an.rows.forEach(function (a, i) {
      lines.push([i + 1, a.name, a.code || '—', a.qty, a.unit, a.wastePct + '%', a.gross, a.weightT, a.trips, a.areaM2].map(csvEscape).join(','));
    });
    lines.push('');
    lines.push('الوزن الإجمالي: ' + an.totalWeightT + ' طن | الرحلات: ' + an.totalTrips + ' | مساحة التخزين: ' + an.totalAreaM2 + ' م² | ساعات التداول: ' + an.handlingH);
    if (an.km) lines.push('تكلفة النقل التقديرية: ' + an.transportCost + ' ر.س (' + an.km + ' كم ذهاب/إياب)');
    downloadText('MaterialAnalysis_' + Date.now() + '.csv', lines.join('\n'), 'text/csv');
  }

  function downloadText(name, content, mime) {
    mime = mime || 'text/plain';
    var blob = new Blob(['\ufeff' + content], { type: mime + ';charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }

  /* ── سجل الإنتاج اليومي ── */
  function getDaily() { try { return JSON.parse(localStorage.getItem(DAILY_KEY)) || []; } catch (e) { return []; } }
  function saveDaily(arr) { try { localStorage.setItem(DAILY_KEY, JSON.stringify(arr)); } catch (e) {} }
  function addDaily(entry) {
    var arr = getDaily();
    entry.id = Date.now();
    arr.push(entry);
    saveDaily(arr);
    return arr;
  }
  function removeDaily(id) {
    var arr = getDaily().filter(function (x) { return x.id !== id; });
    saveDaily(arr);
    return arr;
  }

  /* ════════════ واجهة المستخدم ════════════ */
  var lastCalc = null;
  var lastClosure = 'asphalt';

  function render(panel) {
    var ar = (typeof App !== 'undefined' && App.lang === 'ar');
    var t = function (a, e) { return ar ? a : e; };
    panel.innerHTML = '\n      <div style="display:flex;flex-direction:column;gap:16px;animation:pageFade 0.25s ease;">\n        <div class="card">\n          <div class="card-head" style="background:linear-gradient(90deg,rgba(0,132,61,0.08),transparent);border-bottom:1px solid var(--border);">\n            <span style="font-size:16px;">🚧</span>\n            <span class="card-title">' + t('الحساب الذكي للكميات والمواد', 'Smart Quantity & Material Demand') + '</span>\n            <span style="margin-' + (ar ? 'right' : 'left') + ':auto;font-size:10.5px;color:var(--text-muted);">' + t('حفر → ترحيل → ردم → إغلاق — إعادة الوضع لما كان عليه', 'Excavation → Disposal → Backfill → Restoration') + '</span>\n          </div>\n          <div class="card-body">\n            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;">\n              <label style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--text-sub);">' + t('الطول (م)', 'Length (m)') + '<input id="bi-L" type="number" value="10" min="0" step="0.1" style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-inset,rgba(0,0,0,.04));color:var(--text-h);"></label>\n              <label style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--text-sub);">' + t('العرض (م)', 'Width (m)') + '<input id="bi-W" type="number" value="1" min="0" step="0.1" style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-inset,rgba(0,0,0,.04));color:var(--text-h);"></label>\n              <label style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--text-sub);">' + t('العمق (م)', 'Depth (m)') + '<input id="bi-D" type="number" value="1" min="0" step="0.05" style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-inset,rgba(0,0,0,.04));color:var(--text-h);"></label>\n              <label style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--text-sub);">' + t('سماكة الأسفلت (سم)', 'Asphalt (cm)') + '<input id="bi-AT" type="number" value="5" min="0" step="0.5" style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-inset,rgba(0,0,0,.04));color:var(--text-h);"></label>\n              <label style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--text-sub);">' + t('سعة القلاب (م³)', 'Truck cap (m³)') + '<input id="bi-TC" type="number" value="12" min="1" step="1" style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-inset,rgba(0,0,0,.04));color:var(--text-h);"></label>\n              <label style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--text-sub);">' + t('بعد المقلب (كم)', 'Dump dist (km)') + '<input id="bi-KM" type="number" value="15" min="0" step="1" style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-inset,rgba(0,0,0,.04));color:var(--text-h);"></label>\n              <label style="display:flex;flex-direction:column;gap:4px;font-size:11px;color:var(--text-sub);">' + t('نوع الإغلاق', 'Closure') + '<select id="bi-CL" style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-inset,rgba(0,0,0,.04));color:var(--text-h);">\n                <option value="asphalt">' + t('طريق أسفلت', 'Asphalt road') + '</option>\n                <option value="interlock">' + t('إنترلوك أرصفة', 'Interlock') + '</option>\n                <option value="tiles">' + t('بلاط أرصفة', 'Paving tiles') + '</option>\\n                <option value="dirt">' + t('طريق ترابي (رمل + بيز)', 'Dirt road (sand + subbase)') + '</option>\n              </select></label>\n            </div>\n            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">\n              <button class="btn btn-primary" onclick="BOQIntel.doCalc()">🧮 ' + t('احسب الكميات والمواد', 'Calculate quantities & materials') + '</button>\n              <button class="btn" onclick="BOQIntel.toggleRates()">⚙ ' + t('معادلات متقدمة', 'Advanced rates') + '</button>\n              <button class="btn" onclick="BOQIntel.resetRates()">↺ ' + t('إعادة المعادلات الافتراضية', 'Reset default rates') + '</button>\n              <span style="margin-' + (ar ? 'right' : 'left') + ':auto;font-size:10.5px;color:var(--text-muted);line-height:2;">' + t('القواعد: 10سم رمل تحت الكيبل + 30سم فوقه • أسفلت 2.35 طن/م³ • سفتي: 10م → 25 حبة', 'Rules: 10cm bedding + 30cm cover sand • asphalt 2.35 t/m³ • barriers 10m → 25') + '</span>\n            </div>\n            <div id="bi-rates" style="display:none;margin-top:10px;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;" class="tbl-wrap"></div>\n            <div id="bi-out"></div>\n          </div>\n        </div>\n\n        <div class="card" id="bi-demand-card" style="display:none;border:1px solid var(--border-sec);">\n          <div class="card-head" style="border-bottom:1px solid var(--border);">\n            <span style="font-size:16px;">📦</span>\n            <span class="card-title">' + t('مركز الطلب الذكي للمواد', 'Material Demand Command Center') + '</span>\n            <span style="margin-' + (ar ? 'right' : 'left') + ':auto;font-size:10.5px;color:var(--text-muted);">' + t('المطلوب ← المتوفر (يُعدل) ← العجز', 'Required ← Available (editable) ← Shortage') + '</span>\n          </div>\n          <div class="card-body">\n            <div id="bi-demand"></div>\n            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">\n              <button class="btn btn-gold btn-sm" onclick="BOQIntel.saveStock()">💾 ' + t('حفظ أرصدة المستودع', 'Save warehouse stock') + '</button>\n              <button class="btn btn-primary btn-sm" onclick="BOQIntel.dlRequest()">📄 ' + t('توليد طلب توريد (Material Request)', 'Material Request') + '</button>\n              <button class="btn btn-sm" onclick="BOQIntel.dlPurchase()">🛒 ' + t('توليد أمر شراء (Purchase Order)', 'Purchase Order') + '</button>\n              <button class="btn btn-sm" onclick="BOQIntel.addToBOQ()">＋ ' + t('إضافة للمقايسة (BOQ)', 'Add to BOQ') + '</button>\n            </div>\n          </div>\n        </div>\n\n        <div class="card" id="bi-daily-card" style="display:none;border:1px solid var(--border-sec);">\n          <div class="card-head" style="border-bottom:1px solid var(--border);">\n            <span style="font-size:16px;">📈</span>\n            <span class="card-title">' + t('متابعة الإنتاج اليومي', 'Daily Production Tracking') + '</span>\n          </div>\n          <div class="card-body">\n            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;">\n              <input id="bi-dqty" type="number" placeholder="' + t('الطول المنفذ اليوم (م)', 'Daily length (m)') + '" style="flex:1;min-width:120px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-inset,rgba(0,0,0,.04));color:var(--text-h);">\n              <input id="bi-dnote" type="text" placeholder="' + t('ملاحظة (رقم الوردية/الموقع)', 'Note (shift/site)') + '" style="flex:2;min-width:180px;padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-inset,rgba(0,0,0,.04));color:var(--text-h);">\n              <button class="btn btn-primary btn-sm" onclick="BOQIntel.addDailyRow()">＋ ' + t('تسجيل', 'Record') + '</button>\n            </div>\n            <div id="bi-daily"></div>\n          </div>\n        </div>\n      </div>';

    panel.querySelector('#bi-CL').addEventListener('change', function (e) { lastClosure = e.target.value; });
    panel.querySelector('#bi-AT').addEventListener('change', function () { lastCalc = null; });
    ['bi-L', 'bi-W', 'bi-D', 'bi-TC', 'bi-KM'].forEach(function (id) {
      panel.querySelector('#' + id).addEventListener('change', function () { lastCalc = null; });
    });
    renderDaily(panel);
  }

  function fmt(v) {
    v = Math.round(v * 100) / 100;
    var s = String(v);
    if (s.indexOf('.') >= 0) s = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return s;
  }

  function statCell(lbl, val, sub, col) {
    return '<div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:10px 12px;border-top:3px solid ' + col + ';">' +
      '<div style="font-size:10px;color:var(--text-muted);font-weight:700;">' + lbl + '</div>' +
      '<div style="font-size:17px;font-weight:900;color:var(--text-h);margin:3px 0 1px;">' + val + '</div>' +
      '<div style="font-size:9.5px;color:var(--text-sub);line-height:1.5;">' + sub + '</div></div>';
  }

  function doCalc() {
    var panel = document.getElementById('ai-panel-intel');
    if (!panel) return;
    var L = +panel.querySelector('#bi-L').value || 0;
    var W = +panel.querySelector('#bi-W').value || 0;
    var D = +panel.querySelector('#bi-D').value || 0;
    var at = (+panel.querySelector('#bi-AT').value || 5) / 100;
    var tc = +panel.querySelector('#bi-TC').value || 12;
    var km = +panel.querySelector('#bi-KM').value || 0;
    var clEl = panel.querySelector('#bi-CL');
    var closure = clEl ? clEl.value : (lastClosure || 'asphalt');
    lastClosure = closure;

    if (!(L > 0 && W > 0 && D > 0)) { if (typeof toast === 'function') toast('أدخل الطول والعرض والعمق أولاً', 'warning'); return; }

    var rates = readRateInputs(panel);
    var c = computeTrench({ length: L, width: W, depth: D, rates: rates });
    var fleet = computeFleet(c, tc, km);
    var eq = computeEquipment(c);
    var rows = materialRows(c, closure);
    var dem = demand(rows);
    var meta = { project: 'مشروع أعمال الشبكات', date: new Date().toLocaleDateString('ar-SA'), length: L, width: W, depth: D };
    lastCalc = { c: c, fleet: fleet, eq: eq, rows: rows, dem: dem, meta: meta, closure: closure };

    var ar = (typeof App !== 'undefined' && App.lang === 'ar');
    var T = function (a, e) { return ar ? a : e; };
    var out = document.getElementById('bi-out');
    var warn = c.warning ? '<div class="alert alert-warning" style="margin-bottom:10px;">⚠ ' + c.warning + '</div>' : '';

    out.innerHTML = warn + '\n      <div style="font-size:12.5px;font-weight:800;margin:12px 0 8px;color:var(--accent-blue);">🕳 ' + T('الحفر والترحيل', 'Excavation & Disposal') + '</div>\n      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">\n        ' + statCell(T('حجم الحفر', 'Excavation'), fmt(c.excav) + ' م³', 'L×W×D = ' + fmt(c.L) + '×' + fmt(c.W) + '×' + fmt(c.D), 'var(--accent-blue)') + '\n        ' + statCell(T('مخلفات الترحيل', 'Waste'), fmt(c.waste) + ' م³', '×' + c.R.bulkingFactor + ' ' + T('معامل تمدد', 'bulking'), 'var(--accent-red)') + '\n        ' + statCell(T('عدد القلابات', 'Dump trucks'), fleet.trucks, T('سعة', 'cap') + ' ' + fmt(fleet.cap) + ' م³ / ' + T('رحلة', 'trip') + ' ≈ ' + fmt(fleet.totalH) + ' س', 'var(--sec-gold)') + '\n        ' + statCell(T('تأمين الموقع', 'Site safety'), c.barriers + ' ' + T('حبة سفتي', 'barriers'), 'L×' + c.R.barrierRate + ' (' + T('مثال 10م → 25', '10m → 25') + ')', 'var(--accent-red)') + '\n      </div>\n\n      <div style="font-size:12.5px;font-weight:800;margin:14px 0 8px;color:var(--sec-gold);">🏗 ' + T('الردم والمواد', 'Backfill & Materials') + '</div>\n      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">\n        ' + statCell(T('رمل ناعم', 'Bedding+cover sand'), fmt(c.sand) + ' م³', '(0.10+0.30)×L×W', 'var(--sec-gold)') + '\n        ' + statCell(T('خرسانة حماية الكيبل', 'Cable protection concrete'), fmt(c.concreteM3) + ' م³', 'L×' + fmt(c.R.concreteW) + '×' + fmt(c.R.concreteH), 'var(--sec-gold)') + '\n        ' + statCell(T('مياه الدك', 'Compaction water'), fmt(c.waterL) + ' لتر', 'بيز×' + c.R.subbaseWater + ' ل/م³', 'var(--accent-blue)') + '\n        ' + statCell('Subbase (' + T('بيز', 'Agg.') + ')', fmt(c.subbase) + ' م³', 'L×W×' + fmt(c.R.subbaseT) + 'م', 'var(--sec-primary)') + '\n        ' + statCell('Road Base', fmt(c.roadBase) + ' م³', 'L×W×' + fmt(c.R.roadBaseT) + 'م', 'var(--sec-primary)') + '\n      </div>\n\n      <div style="font-size:12.5px;font-weight:800;margin:14px 0 8px;color:var(--accent-gold);">🛣 ' + T('الإغلاق وإعادة الوضع', 'Closure & Restoration') + '</div>\n      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">\n        ' + (closure === 'asphalt' ? statCell(T('أسفلت ساخن', 'Hot asphalt'), fmt(c.asphaltTons) + ' طن', 'L×W×' + fmt(c.R.asphaltT) + 'م×2.35', 'var(--accent-gold)') +
        statCell('Prime Coat (RC-70)', fmt(c.primeGal) + ' ' + T('جالون', 'gal'), 'مساحة×0.40÷3.785', 'var(--accent-gold)') +
        statCell('Tack Coat (RC-2)', fmt(c.tackGal) + ' ' + T('جالون', 'gal'), 'مساحة×0.25÷3.785', 'var(--accent-gold)')
        : closure === 'dirt'
        ? statCell(T('طريق ترابي', 'Dirt road'), fmt(c.area) + ' م²', T('دفان رمل ثم صب بيز — بدون أسفلت', 'Sand backfill + subbase — no asphalt'), 'var(--accent-gold)')
        : statCell(T('مساحة الإغلاق', 'Closure area'), fmt(c.closureArea) + ' م²', 'L×W (' + (closure === 'interlock' ? T('إنترلوك', 'Interlock') : T('بلاط', 'Tiles')) + ')', 'var(--accent-gold)') +
        statCell(T('بلدورة', 'Kerbs'), fmt(c.kerbs) + ' م', '2×L', 'var(--sec-primary)')) + '\n      </div>\n\n      <div style="font-size:12.5px;font-weight:800;margin:14px 0 8px;color:var(--accent-blue);">🚜 ' + T('تقدير المعدات', 'Equipment estimate') + '</div>\n      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">\n        ' + statCell(T('حفار هيدروليكي', 'Excavator'), fmt(eq.excavatorH) + ' س', T('حجم÷40 م³/س', 'V/40 m³/h'), 'var(--accent-blue)') + '\n        ' + statCell(T('قلابات', 'Dump trucks'), fmt(eq.dumpH) + ' س', T('رحلات×0.5', 'trips×0.5h'), 'var(--sec-gold)') + '\n        ' + statCell(T('هراس / دكاكة', 'Roller'), fmt(eq.rollerH) + ' س', T('مساحة÷150 م²/س', 'area/150'), 'var(--sec-primary)') + '\n        ' + statCell(T('مكبس اهتزازي', 'Plate compactor'), fmt(eq.compactorH) + ' س', T('مساحة÷80 م²/س', 'area/80'), 'var(--sec-primary)') + '\n        ' + statCell(T('ناقلة مياه', 'Water truck'), fleet.waterTrips + ' ' + T('رحلة', 'trips'), T('ماء÷8 م³', 'water/8'), 'var(--accent-red)') + '\n      </div>\n\n      <div style="font-size:12.5px;font-weight:800;margin:14px 0 8px;color:var(--sec-gold);">📋 ' + T('تفصيل المواد', 'Material breakdown') + '</div>\n      <div class="tbl-wrap"><table class="data-table"><thead><tr>\n        <th>#</th><th>' + T('المادة / البند', 'Material / item') + '</th><th>' + T('رمز العقد', 'Code') + '</th><th>' + T('الكمية', 'Qty') + '</th><th>' + T('الوحدة', 'Unit') + '</th><th>' + T('المتوفر', 'Stock') + '</th><th>' + T('العجز', 'Shortage') + '</th><th>' + T('المعادلة', 'Formula') + '</th>\n      </tr></thead><tbody>\n        ' + dem.map(function (r, i) {
      return '<tr><td style="color:var(--text-muted);font-size:11px;">' + (i + 1) + '</td>' +
        '<td style="font-size:12px;font-weight:700;">' + r.name + (r.ref ? '<div style="font-size:9.5px;color:var(--text-muted);font-weight:400;">' + r.ref + '</div>' : '') + '</td>' +
        '<td class="td-code">' + (r.code || '—') + '</td>' +
        '<td style="font-weight:800;">' + fmt(r.qty) + '</td><td>' + r.unit + '</td>' +
        '<td style="color:' + (r.have > 0 ? 'var(--sec-primary)' : 'var(--text-muted)') + ';">' + fmt(r.have) + '</td>' +
        '<td style="color:' + (r.shortage > 0 ? 'var(--accent-red)' : 'var(--sec-primary)') + ';font-weight:800;">' + fmt(r.shortage) + '</td>' +
        '<td style="font-size:10px;color:var(--text-sub);">' + r.formula + '</td></tr>';
    }).join('') + '\n      </tbody></table></div>\n      <div style="font-size:10px;color:var(--text-muted);margin-top:6px;">' + T('⚠ الأرصدة أعلاه قابلة للتعديل من بطاقة "مركز الطلب" أسفل الصفحة.', 'Stock is editable in the Material Demand card below.') + '</div>';

    /* Module 5: تحليل المواد — هالك/نقل/تخزين/رفع/بدائل */
    var an = analyzeMaterials(rows, { siteKm: km });
    lastCalc.an = an;
    out.innerHTML += '\n      <div style="font-size:12.5px;font-weight:800;margin:14px 0 8px;color:var(--accent-blue);">📦 ' + T('تحليل المواد — هالك / نقل / تخزين / رفع', 'Material Analysis — wastage / transport / storage / lifting') + '</div>\n      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">\n        ' + statCell(T('الوزن الإجمالي', 'Total weight'), fmt(an.totalWeightT) + ' ' + T('طن', 't'), T('تقديري حسب الكثافة', 'est. by density'), 'var(--accent-red)') + '\n        ' + statCell(T('رحلات النقل', 'Transport trips'), an.totalTrips, T('12 م³ / 20 طن لكل رحلة', '12 m³ / 20 t per trip'), 'var(--sec-gold)') + '\n        ' + statCell(T('مساحة التخزين', 'Storage area'), fmt(an.totalAreaM2) + ' م²', T('تكديس 1.5م للمواد السائبة', 'bulk stack 1.5m'), 'var(--sec-primary)') + '\n        ' + statCell(T('ساعات الرفع/التداول', 'Handling hours'), fmt(an.handlingH) + ' س', T('0.25 س لكل رحلة', '0.25 h per trip'), 'var(--accent-blue)') + '\n        ' + statCell(T('تكلفة النقل (تقديرية)', 'Transport cost (est.)'), an.km ? fmt(an.transportCost) + ' ' + T('ر.س', 'SAR') : '—', an.km ? (T('ذهاب/إياب', 'round trip') + ' × ' + an.km + ' كم × 8 ر.س/كم') : T('أدخل مسافة الموقع لتقدير التكلفة', 'Enter site distance to estimate'), 'var(--accent-gold)') + '\n      </div>\n      <div class="tbl-wrap"><table class="data-table"><thead><tr>\n        <th>#</th><th>' + T('المادة', 'Material') + '</th><th>' + T('الوحدة', 'Unit') + '</th><th>' + T('الكمية', 'Qty') + '</th><th>' + T('هالك', 'Waste') + '</th><th>' + T('الإجمالي بالهالك', 'Gross') + '</th><th>' + T('الوزن (طن)', 'Weight (t)') + '</th><th>' + T('رحلات', 'Trips') + '</th><th>' + T('تخزين (م²)', 'Storage (m²)') + '</th>\n      </tr></thead><tbody>\n        ' + an.rows.map(function (a, i) {
      return '<tr><td style="color:var(--text-muted);font-size:11px;">' + (i + 1) + '</td>' +
        '<td style="font-size:12px;font-weight:700;">' + a.name + '</td>' +
        '<td>' + a.unit + '</td>' +
        '<td>' + fmt(a.qty) + '</td>' +
        '<td>' + a.wastePct + '%</td>' +
        '<td style="font-weight:800;">' + fmt(a.gross) + '</td>' +
        '<td>' + fmt(a.weightT) + '</td>' +
        '<td>' + a.trips + '</td>' +
        '<td>' + a.areaM2 + '</td></tr>';
    }).join('') + '\n      </tbody></table></div>\n      <div style="font-size:10px;color:var(--text-muted);margin-top:6px;">' + T('نِسَب الهالك حسب نوع المادة (خرسانة 2%، ركام 5%، أسفلت 3%، بلاط 5%...) قابلة للتعديل في boq-intelligence.js.', 'Waste % per material type (concrete 2%, aggregates 5%, asphalt 3%, tiles 5%...) — editable in boq-intelligence.js.') + '</div>';

    var altBlocks = an.rows.filter(function (a) { return a.code; }).map(function (a) {
      var alts = findAlternatives(a.code, a.code, 3);
      if (!alts.length) return '';
      return '<div style="padding:8px 10px;border:1px solid rgba(139,92,246,.2);background:rgba(139,92,246,.05);border-radius:8px;font-size:11px;margin-top:8px;">' +
        '<div style="font-weight:800;margin-bottom:4px;">🔄 ' + T('بدائل', 'Alternatives') + ' — ' + a.code + ' (' + a.name + ')</div>' +
        alts.map(function (x) {
          return '<span class="chip" style="margin:2px 4px 0 0;cursor:pointer;" title="' + escA(x.arDesc) + '" onclick="BOQIntel.pickAlt(\'' + a.code + '\',\'' + x.code + '\')">' + x.code + ' • ' + escA(x.arDesc) + (x.price ? ' • ' + fmt(x.price) + ' ر.س' : '') + '</span>';
        }).join('') + '</div>';
    }).filter(function (s) { return s; }).join('');
    if (altBlocks) out.innerHTML += '<div style="display:flex;flex-direction:column;gap:0;">' + altBlocks + '</div>';

    out.innerHTML += '\n      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">' +
      '<button class="btn btn-outline btn-sm" onclick="BOQIntel.dlAnalysis()">⬇ ' + T('تحليل المواد CSV', 'Material analysis CSV') + '</button>' +
      '<button class="btn btn-outline btn-sm" onclick="BOQIntel.toggleAnalysisRates()">⚙️ ' + T('نِسَب الهالك/النقل', 'Waste & transport rates') + '</button></div>' +
      '<div id="bi-anrates" style="display:none;margin-top:8px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;"></div>';

    var dCard = document.getElementById('bi-demand-card');
    var dPanel = document.getElementById('bi-demand');
    if (dCard && dPanel) {
      dCard.style.display = '';
      renderDemand(dPanel, dem);
    }
    var dayCard = document.getElementById('bi-daily-card');
    if (dayCard) dayCard.style.display = '';
  }

  function readRateInputs(panel) {
    var box = panel.querySelector('#bi-rates');
    if (!box || box.style.display === 'none') return null;
    var rates = {};
    ['beddingSandT', 'coverSandT', 'subbaseWater', 'subbaseT', 'roadBaseT', 'concreteW', 'concreteH', 'primeCoatRate', 'tackCoatRate', 'asphaltT', 'barrierRate', 'bulkingFactor'].forEach(function (k) {
      var el = box.querySelector('[data-rate="' + k + '"]');
      if (el && el.value !== '') rates[k] = +el.value;
    });
    return rates;
  }

  function toggleRates() {
    var box = document.getElementById('bi-rates');
    if (!box) return;
    var shown = box.style.display === 'grid';
    if (!shown) {
      var defs = [
        ['beddingSandT', 'رمل تحت الكيبل (م)', RATES.beddingSandT],
        ['coverSandT', 'رمل فوق الكيبل (م)', RATES.coverSandT],
        ['subbaseWater', 'ماء الدك (لتر/م³ بيز)', RATES.subbaseWater],
        ['subbaseT', 'سماكة البيز (م)', RATES.subbaseT],
        ['roadBaseT', 'سماكة Road Base (م)', RATES.roadBaseT],
        ['concreteW', 'عرض الخرسانة فوق الكيبل (م)', RATES.concreteW],
        ['concreteH', 'سمك الخرسانة فوق الكيبل (م)', RATES.concreteH],
        ['primeCoatRate', 'Prime (ل/م²)', RATES.primeCoatRate],
        ['tackCoatRate', 'Tack (ل/م²)', RATES.tackCoatRate],
        ['asphaltT', 'سماكة الأسفلت (م)', RATES.asphaltT],
        ['barrierRate', 'سفتي حبة/م', RATES.barrierRate],
        ['bulkingFactor', 'معامل التمدد', RATES.bulkingFactor],
      ];
      box.style.display = 'grid';
      box.innerHTML = defs.map(function (d) {
        return '<label style="display:flex;flex-direction:column;gap:2px;font-size:10.5px;color:var(--text-sub);">' + d[1] +
          '<input data-rate="' + d[0] + '" type="number" value="' + d[2] + '" step="0.01" style="padding:6px 8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-surface);color:var(--text-h);"></label>';
      }).join('');
    } else { box.style.display = 'none'; box.innerHTML = ''; }
  }

  function toggleAnalysisRates() {
    var ar = (typeof App !== 'undefined' && App.lang === 'ar');
    var T = function (a, e) { return ar ? a : e; };
    var box = document.getElementById('bi-anrates');
    if (!box) return;
    if (box.style.display === 'grid') { box.style.display = 'none'; box.innerHTML = ''; return; }
    var rows = [];
    Object.keys(WASTE).forEach(function (k) {
      if (k === '_default') return;
      rows.push(['waste_' + k, T('هالك', 'Waste') + ' ' + k, Math.round(WASTE[k] * 100)]);
    });
    rows.push(['costPerKm', 'تكلفة النقل (ر.س/كم)', TRUCK.costPerKm]);
    rows.push(['handlingHPerTrip', 'تداول (س/رحلة)', TRUCK.handlingHPerTrip * 100]);
    box.style.display = 'grid';
    box.innerHTML = rows.map(function (d) {
      var suffix = d[0].indexOf('waste_') === 0 ? '%' : (d[0] === 'handlingHPerTrip' ? ' %' : '');
      return '<label style="display:flex;flex-direction:column;gap:2px;font-size:10.5px;color:var(--text-sub);">' + d[1] +
        '<input data-anrate="' + d[0] + '" type="number" value="' + d[2] + '" step="0.1" style="padding:6px 8px;border:1px solid var(--border);border-radius:8px;background:var(--bg-surface);color:var(--text-h);"></label>';
    }).join('') +
      '<div style="display:flex;align-items:flex-end;"><button class="btn btn-primary btn-sm" onclick="BOQIntel.saveAnalysisRates()">حفظ</button></div>';
    lastCalc = null;
  }

  function saveAnalysisRates() {
    var box = document.getElementById('bi-anrates');
    if (!box) return;
    var wasteK = Object.keys(WASTE).filter(function (k) { return k !== '_default'; });
    box.querySelectorAll('input[data-anrate]').forEach(function (inp) {
      var key = inp.getAttribute('data-anrate');
      var v = +inp.value || 0;
      if (key.indexOf('waste_') === 0) WASTE[key.slice(6)] = v / 100;
      else if (key === 'costPerKm') TRUCK.costPerKm = v;
      else if (key === 'handlingHPerTrip') TRUCK.handlingHPerTrip = v / 100;
    });
    box.style.display = 'none';
    box.innerHTML = '';
    if (typeof toast === 'function') toast('حُفظت نِسَب الهالك والنقل (للجلسة الحالية)', 'success');
  }

  function resetRates() {
    var box = document.getElementById('bi-rates');
    if (box) { box.style.display = 'none'; box.innerHTML = ''; }
    var panel = document.getElementById('ai-panel-intel');
    if (!panel) return;
    ['#bi-L', '#bi-W', '#bi-D', '#bi-TC', '#bi-KM'].forEach(function (s) { var el = panel.querySelector(s); if (el) el.value = ''; });
    var L = panel.querySelector('#bi-L'); if (L) L.value = 10;
    var W = panel.querySelector('#bi-W'); if (W) W.value = 1;
    var D = panel.querySelector('#bi-D'); if (D) D.value = 1;
    var AT = panel.querySelector('#bi-AT'); if (AT) AT.value = 5;
    var TC = panel.querySelector('#bi-TC'); if (TC) TC.value = 12;
    var KM = panel.querySelector('#bi-KM'); if (KM) KM.value = 15;
    var CL = panel.querySelector('#bi-CL'); if (CL) CL.value = 'asphalt';
    lastClosure = 'asphalt';
    lastCalc = null;
  }

  function renderDemand(container, dem) {
    if (!container) return;
    container.innerHTML = '\n      <div class="tbl-wrap"><table class="data-table"><thead><tr>\n        <th>#</th><th>' + 'المادة / البند' + '</th><th>' + 'الرمز' + '</th><th>' + 'المطلوب' + '</th><th>' + 'الوحدة' + '</th><th>' + 'احتياطي 10%' + '</th><th>' + 'متوفر بالمستودع' + '</th><th>' + 'العجز المتوقع' + '</th>\n      </tr></thead><tbody>\n        ' + dem.map(function (r, i) {
      return '<tr><td style="color:var(--text-muted);font-size:11px;">' + (i + 1) + '</td>' +
        '<td style="font-size:12px;font-weight:700;">' + r.name + '</td>' +
        '<td class="td-code">' + (r.code || '—') + '</td>' +
        '<td style="font-weight:800;">' + fmt(r.qty) + '</td><td>' + r.unit + '</td>' +
        '<td>' + fmt(r.reserve) + '</td>' +
        '<td><input data-stock="' + r.key + '" type="number" min="0" step="any" value="' + fmt(r.have) + '" style="width:90px;padding:5px 8px;border:1px solid var(--border);border-radius:7px;background:var(--bg-surface);color:var(--text-h);"></td>' +
        '<td style="color:var(--accent-red);font-weight:800;" data-short="' + r.key + '">' + fmt(r.shortage) + '</td></tr>';
    }).join('') + '\n      </tbody></table></div>\n      <div style="font-size:10px;color:var(--text-muted);margin-top:6px;">' + 'عدّل "متوفر بالمستودع" ثم اضغط "حفظ أرصدة" — يُحدَّث العجز تلقائياً ويُستخدم في طلبات التوريد والشراء.' + '</div>';
    var inputs = container.querySelectorAll('input[data-stock]');
    inputs.forEach(function (inp) {
      inp.addEventListener('change', function () {
        var stock = getStock();
        stock[inp.getAttribute('data-stock')] = +inp.value || 0;
        setStock(stock);
        if (lastCalc) {
          var dem2 = demand(lastCalc.rows, stock);
          lastCalc.dem = dem2;
          container.querySelectorAll('[data-short]').forEach(function (td) {
            var row = dem2.find(function (d) { return d.key === td.getAttribute('data-short'); });
            if (row) td.textContent = fmt(row.shortage);
          });
        }
      });
    });
  }

  function saveStock() {
    var panel = document.getElementById('ai-panel-intel');
    var box = panel ? panel.querySelector('#bi-demand') : null;
    if (!box) return;
    var stock = getStock();
    box.querySelectorAll('input[data-stock]').forEach(function (inp) {
      stock[inp.getAttribute('data-stock')] = +inp.value || 0;
    });
    setStock(stock);
    if (typeof toast === 'function') toast('تم حفظ أرصدة المستودع', 'success');
  }

  function dlRequest() {
    if (!lastCalc) return;
    downloadText('MaterialRequest_' + Date.now() + '.csv', buildRequestCSV(lastCalc.dem, lastCalc.meta), 'text/csv');
  }
  function dlPurchase() {
    if (!lastCalc) return;
    downloadText('PurchaseOrder_' + Date.now() + '.csv', buildPurchaseCSV(lastCalc.dem, lastCalc.meta), 'text/csv');
  }

  function addToBOQ() {
    if (!lastCalc) return;
    if (typeof App === 'undefined') return;
    var added = 0;
    lastCalc.rows.forEach(function (r) {
      if (!r.code) return;
      App.state.boq.items.push({ code: r.code, qty: Math.round(r.qty * 100) / 100, customPrice: null, note: '🚧 BOQ Intel — ' + r.name });
      added++;
    });
    if (added === 0) { if (typeof toast === 'function') toast('لا توجد بنود مرمّزة للعقد في هذه القائمة', 'warning'); return; }
    if (typeof App._renderBOQTable === 'function') App._renderBOQTable();
    if (typeof App.runDepsCheck === 'function') App.runDepsCheck();
    if (typeof toast === 'function') toast('أُضيف ' + added + ' بند للمقايسة', 'success');
  }

  /* ── سجل الإنتاج اليومي ── */
  function addDailyRow() {
    var panel = document.getElementById('ai-panel-intel');
    if (!panel) return;
    var dq = +panel.querySelector('#bi-dqty').value || 0;
    var note = panel.querySelector('#bi-dnote').value || '';
    if (!(dq > 0)) { if (typeof toast === 'function') toast('أدخل الطول المنفذ اليوم', 'warning'); return; }
    var c = lastCalc ? lastCalc.c : null;
    var entry = {
      date: new Date().toLocaleDateString('ar-SA'),
      time: new Date().toLocaleTimeString('ar-SA'),
      L: dq,
      excav: c ? Math.round(c.W * c.D * dq * 100) / 100 : 0,
      waste: c ? Math.round(c.W * c.D * dq * c.R.bulkingFactor * 100) / 100 : 0,
      sand: c ? Math.round(c.W * (c.R.beddingSandT + c.R.coverSandT) * dq * 100) / 100 : 0,
      asphalt: c ? Math.round(c.W * c.R.asphaltT * c.R.asphaltDensity * dq * 100) / 100 : 0,
      note: note,
    };
    addDaily(entry);
    renderDaily(panel);
    if (typeof toast === 'function') toast('تم تسجيل الإنتاج اليومي', 'success');
  }

  function renderDaily(panel) {
    if (!panel) return;
    var box = panel.querySelector('#bi-daily');
    if (!box) return;
    var arr = getDaily().slice().reverse();
    if (!arr.length) { box.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:12px;">لا توجد سجلات بعد</div>'; return; }
    box.innerHTML = '<div class="tbl-wrap"><table class="data-table"><thead><tr>' +
      '<th>#</th><th>التاريخ</th><th>الطول (م)</th><th>حفر (م³)</th><th>ترحيل (م³)</th><th>رمل (م³)</th><th>أسفلت (طن)</th><th>ملاحظة</th><th></th>' +
      '</tr></thead><tbody>' + arr.map(function (e, i) {
        return '<tr><td style="color:var(--text-muted);font-size:11px;">' + (i + 1) + '</td>' +
          '<td style="font-size:11px;">' + e.date + ' ' + e.time + '</td>' +
          '<td>' + fmt(e.L) + '</td><td>' + fmt(e.excav) + '</td><td>' + fmt(e.waste) + '</td><td>' + fmt(e.sand) + '</td><td>' + fmt(e.asphalt) + '</td>' +
          '<td style="font-size:11px;color:var(--text-sub);">' + (e.note || '—') + '</td>' +
          '<td><button class="btn btn-danger btn-sm" onclick="BOQIntel.delDaily(' + e.id + ')">✕</button></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function delDaily(id) {
    removeDaily(id);
    var panel = document.getElementById('ai-panel-intel');
    if (panel) renderDaily(panel);
  }

  window.BOQIntel = {
    RATES: RATES, STOCK_KEY: STOCK_KEY, DAILY_KEY: DAILY_KEY,
    WASTE: WASTE, MASS: MASS, TRUCK: TRUCK,
    computeTrench: computeTrench, computeFleet: computeFleet, computeEquipment: computeEquipment,
    materialRows: materialRows, demand: demand, reserve: function (rows) { return demand(rows); },
    analyzeMaterials: analyzeMaterials, findAlternatives: findAlternatives, pickAlt: pickAlt,
    getLastCalc: function () { return lastCalc; },
    getStock: getStock, setStock: setStock,
    buildRequestCSV: buildRequestCSV, buildPurchaseCSV: buildPurchaseCSV, downloadText: downloadText,
    render: render, doCalc: doCalc, resetRates: resetRates, toggleRates: toggleRates,
    toggleAnalysisRates: toggleAnalysisRates, saveAnalysisRates: saveAnalysisRates, dlAnalysis: dlAnalysis,
    saveStock: saveStock, dlRequest: dlRequest, dlPurchase: dlPurchase, addToBOQ: addToBOQ,
    addDailyRow: addDailyRow, delDaily: delDaily, getDaily: getDaily,
  };
})();
