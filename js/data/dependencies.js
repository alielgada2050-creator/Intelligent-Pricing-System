/* ================================================================
   العقد الموحد 2026 — محرك التدقيق الفني والتوازن
   Unified Contract 2026 — Technical Balance & Dependency Audit
   ================================================================ */

// Rules: trigger code-prefix => required companion prefixes (material/labor balance)
const DEP_RULES = [
  // Underground cable excavation → reinstatement / asphalt
  { trigger: '301', requires: ['306'], risk: 'critical',
    reasonAr: 'تتطلب الحفريات وإعادة الردم إعادة السفلتة والكشط للحفاظ على المواقع (بند إعادة السفلتة)',
    reasonEn: 'Excavation & backfill requires reinstatement / asphalt removal & re-paving' },
  // LV/MV cable laying → excavation + reinstatement
  { trigger: '304', requires: ['301', '306'], risk: 'critical',
    reasonAr: 'تمديد الكابلات يتطلب حفريات مفتوحة وإعادة ردم ثم إعادة السفلتة',
    reasonEn: 'Cable laying requires open-cut excavation, backfill then reinstatement' },
  // Cable joints / terminations → requires cable laying (they usually exist together; warn if only joints)
  { trigger: '305', requires: ['304'], risk: 'medium',
    reasonAr: 'أعمال الوصلات والنهايات تتطلب وجود أعمال تمديد الكابلات المقابلة لها',
    reasonEn: 'Joints & terminations require corresponding cable-laying items' },
  // Overhead poles installation → earthing + stays
  { trigger: '201', requires: ['207'], risk: 'critical',
    reasonAr: 'تركيب أعمدة الشبكات الهوائية يتطلب أعمال تأريض الشبكات الهوائية',
    reasonEn: 'Overhead pole installation requires overhead-network earthing works' },
  // Overhead conductors → earthing
  { trigger: '204', requires: ['207'], risk: 'medium',
    reasonAr: 'شد الكابلات المجدولة والموصلات الهوائية يتطلب التأريض المطلوب للشبكة الهوائية',
    reasonEn: 'Overhead conductors installation requires network earthing' },
  // Meters → service cable + earthing
  { trigger: '501', requires: ['505', '507'], risk: 'medium',
    reasonAr: 'تركيب العدادات يتطلب كابل الخدمة وأعمال تأريض العدادات',
    reasonEn: 'Meter installation requires service cable & meter earthing' },
  // Equipment foundations → equipment (supply of equipment itself)
  { trigger: '307', requires: ['308'], risk: 'medium',
    reasonAr: 'قواعد المعدات الأرضية تتطلب تركيب المعدات المقابلة لها',
    reasonEn: 'Equipment foundations require the matching equipment installation' },
  // UG equipment earthing → earthing of LV/MV equipment
  { trigger: '308', requires: ['309'], risk: 'medium',
    reasonAr: 'معدات الشبكة الأرضية تتطلب أعمال تأريض المعدات الأرضية',
    reasonEn: 'UG network equipment requires UG earthing works' },
  // Communications pipes → comms cables
  { trigger: '701', requires: ['702'], risk: 'medium',
    reasonAr: 'تمديد مواسير الاتصالات يتطلب تمديد كابلات الاتصالات المقابلة',
    reasonEn: 'Comms ducts require corresponding comms cable installation' },
];

// Efficiency warnings (optional but recommended)
const DEP_WARNINGS = [
  { trigger: '301', requires: ['303'], risk: 'warning',
    reasonAr: 'الأعمال في المناطق الرطبة أو المناسيب المنخفضة تتطلب شفط المياه',
    reasonEn: 'Wet or low-elevation works may require water pumping' },
  { trigger: '302', requires: ['301'], risk: 'warning',
    reasonAr: 'الحفر الأفقي أسفل الطرق يكمل الحفريات المفتوحة للوصول للمسار',
    reasonEn: 'HDD bores complement open-cut excavation to reach the route' },
];

function _hasPrefix(items, prefix) {
  return items.some(i => String(i.code).startsWith(prefix));
}

function _qtyOf(items, prefix) {
  return items.filter(i => String(i.code).startsWith(prefix)).reduce((s, i) => s + (parseFloat(i.qty) || 0), 0);
}

function _codesOf(prefix, limit) {
  const list = PRICE_LIST.filter(i => String(i.code).startsWith(prefix)).map(i => i.code);
  return list.slice(0, limit || 4);
}

function _nameOf(code) {
  const it = getItemByCode(code);
  return it ? it.arDesc : code;
}

/**
 * checkDependencies(items)
 * items: [{code, qty, customPrice?, note?}]
 * returns { missing: [...], warnings: [...] }
 */
function checkDependencies(items) {
  const missing = [];
  const warnings = [];
  const ar = (typeof App !== 'undefined' && App.lang === 'ar');

  if (!items || !items.length) return { missing, warnings };

  DEP_RULES.forEach(rule => {
    if (!_hasPrefix(items, rule.trigger)) return;
    const missingComps = rule.requires.filter(p => !_hasPrefix(items, p));
    if (!missingComps.length) return;

    const trigItems = items.filter(i => String(i.code).startsWith(rule.trigger));
    const triggeredBy = trigItems[0]?.code || rule.trigger;
    const totalQty = _qtyOf(items, rule.trigger);

    missingComps.forEach(p => {
      const codes = _codesOf(p, 4);
      missing.push({
        risk: rule.risk,
        reason: ar ? rule.reasonAr : rule.reasonEn,
        triggeredBy,
        triggeredByName: _nameOf(triggeredBy),
        missingCodes: codes,
        suggestedQty: Math.round(totalQty),
      });
    });
  });

  DEP_WARNINGS.forEach(rule => {
    if (!_hasPrefix(items, rule.trigger)) return;
    const missingComps = rule.requires.filter(p => !_hasPrefix(items, p));
    if (!missingComps.length) return;
    const trigItems = items.filter(i => String(i.code).startsWith(rule.trigger));
    const triggeredBy = trigItems[0]?.code || rule.trigger;
    missingComps.forEach(p => {
      warnings.push({
        reason: ar ? rule.reasonAr : rule.reasonEn,
        triggeredByName: _nameOf(triggeredBy),
        suggestedCodes: _codesOf(p, 4),
      });
    });
  });

  return { missing, warnings };
}

/**
 * autoLinkItems(items)
 * الربط الشامل بين بنود الحفر (301/302/304) والمقايسة:
 *  • الترحيل والمخلفات        → 401000019 (إزالة وترحيل المخلفات)
 *  • التوريد الموحد / الإغلاق → 306010001 (إعادة سفلتة) + 306020003 (بلاط خرساني) + 306020002 (إنترلوك)
 *  • البند المركب             → 301010105 (حفر + ردم)
 *  • احتيام بلاطة خاملة       → 10% من مساحة الإغلاق (ترابي)
 *  • المعدات (ساعات تقديرية)  → حفار / قلابات / هراس / مكبس / ناقلة مياه
 *  • اللوجستيات               → عدد القلابات، ناقلات المياه، السفتي، الأسفلت، الرمل
 * الأبعاد الافتراضية: عرض 1م × عمق 1م (يُستدعى BOQIntel عند توفره).
 */
function autoLinkItems(items, opts) {
  opts = opts || {};
  const out = { linked: [], equipment: null, logistics: null, source: null, area: 0, excav: 0, materials: null, surfaceType: opts.surfaceType || 'dirt' };
  if (!items && !(opts.length > 0)) return out;

  const EXC_PREFIXES = ['301', '302', '304'];
  let L = 0, source = null;
  if (items && items.length) {
    items.forEach(i => {
      const c = String(i.code || '');
      if (EXC_PREFIXES.some(p => c.startsWith(p))) {
        const q = parseFloat(i.qty) || 0;
        if (q > 0) { L += q; source = source || c; }
      }
    });
  }
  if (opts.length > 0) L = opts.length;
  if (!(L > 0)) return out;

  const W = opts.width || 1;
  const D = opts.depth || 1;
  const surf = opts.surfaceType || 'dirt';

  let calc = null;
  if (typeof BOQIntel !== 'undefined' && BOQIntel.computeTrench) {
    try { calc = BOQIntel.computeTrench({ length: L, width: W, depth: D }); } catch (e) { calc = null; }
  }
  const excav = calc ? calc.excav : Math.round(L * W * D * 100) / 100;
  const waste = calc ? calc.waste : Math.round(excav * 1.20 * 100) / 100;
  const area = calc ? calc.area : Math.round(L * W * 100) / 100;
  const sand = calc ? calc.sand : Math.round(L * (0.10 + 0.30) * 100) / 100;
  const concrete = calc ? calc.concreteM3 : Math.round(L * 0.20 * 0.30 * 100) / 100;
  const asphaltTons = surf === 'dirt' ? 0 : (calc ? calc.asphaltTons : Math.round(area * 0.05 * 2.35 * 100) / 100);
  const asphaltM3 = surf === 'dirt' ? 0 : Math.round(area * 0.05 * 100) / 100;
  const primeCoatGal = surf === 'dirt' ? 0 : (calc ? calc.primeCoatGal : Math.round(area * 0.35 * 100) / 100);
  const tackCoatGal = surf === 'dirt' ? 0 : (calc ? calc.tackCoatGal : Math.round(area * 0.20 * 100) / 100);
  const subbaseM3 = calc ? (calc.subbase || 0) : Math.round(area * 0.20 * 100) / 100;
  const roadBaseM3 = calc ? (calc.roadBase || 0) : Math.round(area * 0.15 * 100) / 100;
  const waterM3 = calc ? calc.waterM3 : Math.round(excav * 10 / 1000 * 100) / 100;
  const barriers = calc ? calc.barriers : Math.round(L * 2.5);
  const trucks = Math.ceil(waste / 12);
  const inactivePavement = surf === 'tiles' ? Math.round(area * 0.10 * 100) / 100 : 0;
  const interlockArea = surf === 'interlock' ? area : 0;
  const tilesArea = surf === 'tiles' ? area : 0;

  const row = (code, qty, unit, reason) => {
    const p = (typeof getItemByCode === 'function') ? getItemByCode(code) : null;
    return { code: code, qty: Math.round(qty * 100) / 100, uom: p ? p.uom : unit, name: p ? p.arDesc : '', reason: reason };
  };

  const linkedItems = [];
  linkedItems.push(row('401000019', waste, 'م³', 'مخلفات الحفر = L×W×D × 1.20'));
  linkedItems.push(row('301010105', L, 'م', 'طول الحفرية (حفر + ردم)'));
  if (surf === 'asphalt' || surf === 'dirt') {
    linkedItems.push(row('306010001', area, 'م²', 'إعادة سفلتة ≈ ' + asphaltTons + ' طن'));
  }
  if (surf === 'tiles') {
    linkedItems.push(row('306020003', tilesArea, 'م²', 'بلاط أرصفة خرساني'));
    linkedItems.push(row('306020002', inactivePavement, 'م²', 'إنترلوك = 10% بلاطة خاملة'));
  }
  if (surf === 'interlock') {
    linkedItems.push(row('306020003', interlockArea, 'م²', 'إنترلوك أرصفة'));
  }
  out.linked = linkedItems.filter(x => x.qty > 0);

  out.equipment = {
    excavatorH: Math.round(excav / 40 * 100) / 100,
    dumpH: Math.round(trucks * 0.5 * 100) / 100,
    rollerH: surf !== 'dirt' ? Math.round(area / 150 * 100) / 100 : 0,
    compactorH: Math.round(area / 80 * 100) / 100,
    waterTrips: Math.ceil(waterM3 / 8),
  };
  out.logistics = {
    trucks: trucks, waste: waste, sand: sand, concrete: concrete,
    asphaltTons: asphaltTons, asphaltM3: asphaltM3,
    primeCoatGal: primeCoatGal, tackCoatGal: tackCoatGal,
    subbaseM3: subbaseM3, roadBaseM3: roadBaseM3,
    barriers: barriers, waterTrips: out.equipment.waterTrips,
    inactivePavement: inactivePavement,
  };
  out.materials = {
    sand: { qty: Math.round(sand * 100) / 100, unit: 'م³', note: 'رمل دفان (10سم + 30سم)' },
    concrete: { qty: Math.round(concrete * 100) / 100, unit: 'م³', note: 'خرسانة حماية الكابلات' },
    asphalt: { qty: asphaltTons, unit: 'طن', note: 'أسفلت 5سم × 2.35' },
    asphaltM3: { qty: asphaltM3, unit: 'م³', note: 'أسفلت حجمي' },
    primeCoat: { qty: primeCoatGal, unit: 'جالون', note: 'RC-70 أولي' },
    tackCoat: { qty: tackCoatGal, unit: 'جالون', note: 'RC-2 لاصق' },
    subbase: { qty: subbaseM3, unit: 'م³', note: 'أساس فرعية 20سم' },
    roadBase: { qty: roadBaseM3, unit: 'م³', note: 'أساس طريق 15سم' },
    water: { qty: Math.round(waterM3 * 100) / 100, unit: 'م³', note: 'مياه تكثيف' },
    inactivePavement: { qty: inactivePavement, unit: 'م²', note: 'بلاطة خاملة 10%' },
  };
  out.surfaceType = surf;

  return out;
}
