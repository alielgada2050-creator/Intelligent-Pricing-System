/* ═══════════════════════════════════════════════════════════════════
   العقد الموحد 2026 — محرك الذكاء الهندسي المتقدم (AI ENGINE 2.0)
   Smart Quantity Surveying & Engineering AI Engine 2.0
   - نظام ألوان المرافق الذكي (Smart Utility Color System)
   - مكتبة الرموز الهندسية (Engineering Symbol Library)
   - تقرير البنود الناقصة (Missing Items Report)
   - محرك المراجعة الهندسية (Engineering Auditor)
   - نظام الثقة الهندسية (Confidence Score)
   - قائمة المواد وتقدير التكاليف (Material List + Cost Estimate)
   - المخرجات النهائية (QS / Review / Missing / Compliance / Cost)
   ═══════════════════════════════════════════════════════════════════ */
window.AIEngine2 = (() => {

  const _ar = () => (typeof App !== 'undefined') ? App.lang === 'ar' : true;

  /* ── ألوان المرافق (Smart Utility Color System) ── */
  const UTILITY_COLORS = {
    mv:        { name: 'جهد متوسط',        en: 'Medium Voltage',     color: '#e5484d', codes: ['3040102', '305020', '204'],  note: '11KV / 13.8KV / 33KV' },
    lv:        { name: 'جهد منخفض',        en: 'Low Voltage',        color: '#1d6ff2', codes: ['3040101', '305010', '3010101'], note: '400V / 230V' },
    lighting:  { name: 'إنارة الشوارع',    en: 'Street Lighting',    color: '#0a7d3b', codes: ['703', '603'], note: 'Lighting Cable/Network' },
    fiber:     { name: 'ألياف بصرية',      en: 'Fiber Optic',        color: '#ff8c00', codes: ['701', '704'], note: 'Telecommunication' },
    water:     { name: 'شبكة مياه',        en: 'Water Network',      color: '#8b5a2b', codes: ['401', '402'], note: 'Water' },
    treated:   { name: 'مياه معالجة',      en: 'Treated Water',      color: '#8b5cf6', codes: ['408'], note: 'Treated Water' },
    gas:       { name: 'خطوط غاز',         en: 'Gas Lines',          color: '#f5c518', codes: ['409'], note: 'Gas' },
  };

  /* ── مكتبة الرموز الهندسية (Whiteboard Symbol Library) ── */
  const SYMBOLS = [
    // كهرباء
    { id: 'rmu',         ar: 'RMU',                en: 'RMU',                emoji: '🔲', cat: 'electric', code: '308010101' },
    { id: 'transformer', ar: 'محول',               en: 'Transformer',        emoji: '⚡', cat: 'electric', code: '308010201' },
    { id: 'substation',  ar: 'محطة فرعية',         en: 'Substation',         emoji: '🏭', cat: 'electric', code: '308010201' },
    { id: 'feeder',      ar: 'مغذي',               en: 'Feeder Pillar',      emoji: '🗄️', cat: 'electric', code: '308010101' },
    { id: 'joint',       ar: 'وصلة كابل',          en: 'Cable Joint',        emoji: '🔗', cat: 'electric', code: '305010101' },
    { id: 'linkbox',     ar: 'صندوق وصل',          en: 'Link Box',           emoji: '📮', cat: 'electric', code: '403000003' },
    { id: 'earthing',    ar: 'تأريض',              en: 'Earthing Pit',       emoji: '⏚', cat: 'electric', code: '207000001' },
    { id: 'pole',        ar: 'عمود إنارة',         en: 'Lighting Pole',      emoji: '💡', cat: 'electric', code: '603000034' },
    { id: 'manhole',     ar: 'غرفة تفتيش',         en: 'Manhole',            emoji: '⭕', cat: 'electric', code: '603000034' },
    { id: 'lv_cable',    ar: 'كابل جهد منخفض',     en: 'LV Cable',           emoji: '🔵', cat: 'electric', code: '304010101' },
    { id: 'mv_cable',    ar: 'كابل جهد متوسط',     en: 'MV Cable',           emoji: '🟣', cat: 'electric', code: '304010201' },
    // مياه
    { id: 'valve',       ar: 'محبس',               en: 'Valve',              emoji: '🚰', cat: 'water',    code: '401000003' },
    { id: 'washout',     ar: 'محبس غسيل',          en: 'Washout',            emoji: '🚿', cat: 'water',    code: '401000003' },
    { id: 'airvalve',    ar: 'محبس هواء',          en: 'Air Valve',          emoji: '🫧', cat: 'water',    code: '401000004' },
    { id: 'chamber',     ar: 'حجرة',               en: 'Chamber',            emoji: '🧱', cat: 'water',    code: '402000001' },
    { id: 'meter',       ar: 'عداد',               en: 'Meter',              emoji: '📟', cat: 'water',    code: '501000003' },
    { id: 'hdpe',        ar: 'مواسير HDPE',        en: 'HDPE Pipe',          emoji: '〰️', cat: 'water',    code: '302010001' },
    { id: 'di',          ar: 'مواسير حديد',        en: 'DI Pipe',            emoji: '▬', cat: 'water',    code: '302010002' },
    // اتصالات
    { id: 'fiber_cab',   ar: 'خزانة ألياف',        en: 'Fiber Cabinet',      emoji: '📡', cat: 'telecom',  code: '704000001' },
    { id: 'fiber_joint', ar: 'وصلة ألياف',         en: 'Fiber Joint',        emoji: '🔆', cat: 'telecom',  code: '704000005' },
    { id: 'odf',         ar: 'ODF',                en: 'ODF',                emoji: '🔀', cat: 'telecom',  code: '704000001' },
    { id: 'duct',        ar: 'قناة كابلات',        en: 'Duct Bank',          emoji: '▦', cat: 'telecom',  code: '701000007' },
  ];

  /* ── البنود الحرجة المتوقع وجودها (Missing Items Report) ── */
  const MISSING_CANDIDATES = [
    { ar: 'شريط تحذير للكابلات المدفونة',          en: 'Warning Tape',            code: null,            group: '304', unit: 'M',   conf: 92, ref: 'مواصفات الشركة — حماية مسار الكابل', reasonAr: 'شائعة في مشاريع الكابلات الأرضية لحماية المسار من الحفريات اللاحقة' },
    { ar: 'بلاط حماية الكابلات',                  en: 'Concrete Protection Slab', code: '301030007',     group: '304', unit: 'M',   conf: 90, ref: 'بند 301030007 — بلاط حماية الكابلات', reasonAr: 'إلزامي عند تمديد الكابلات ج.متوسط في حفريات الربط' },
    { ar: 'علامة/لوحة إرشادية لمسار الكابل',       en: 'Cable Marker',            code: '304040107',     group: '304', unit: 'EA',  conf: 88, ref: 'بند 304040107 — لوحة إرشادية لمسار الكابل', reasonAr: 'مطلوبة للدلالة على مسار الكابل المدفون بعد الردم' },
    { ar: 'صندوق وصل تأريض (Link Box)',           en: 'Link Box',                code: '403000003',     group: '308', unit: 'EA',  conf: 85, ref: 'بند 403000003 — تركيب صندوق وصل تأريض', reasonAr: 'مطلوب مع المحولات واللوحات الأرضية لتأريض المعدات' },
    { ar: 'تأريض الأعمدة',                        en: 'Earthing Pit / Pole Earth', code: '207000001',    group: '603', unit: 'EA',  conf: 87, ref: 'بند 207000001 — تأريض عمود في تربة عادية', reasonAr: 'كل عمود إنارة/هوائي يتطلب تأريضاً مطابقاً للمواصفة' },
    { ar: 'إعادة السفلتة بعد الحفريات',            en: 'Reinstate Asphalt',        code: '306020003',     group: '301', unit: 'M2',  conf: 91, ref: 'بند 306020003 — إعادة سفلتة', reasonAr: 'الحفريات المفتوحة تتطلب إعادة السفلتة والكشط بنفس السماكة' },
    { ar: 'أرصفة إنترلوك',                        en: 'Interlock Tiles / Sidewalk', code: '306020002',    group: '301', unit: 'M2',  conf: 84, ref: 'بند 306020002 — توريد وتركيب بلاط إنترلوك', reasonAr: 'إعادة الرصيف بعد الحفر في المواقع المرصوفة' },
    { ar: 'صندوق لحام داخل غرفة التفتيش',          en: 'Joint Bay / Welding Box',   code: '704000006',    group: '704', unit: 'EA',  conf: 80, ref: 'بند 704000006 — تركيب صندوق لحام', reasonAr: 'أعمال الفايبر تتطلب صناديق لحام داخل الغرف' },
    { ar: 'خرسانة حماية / قواعد',                  en: 'Concrete Protection',       code: '401000018',    group: '603', unit: 'M3',  conf: 78, ref: 'بند 401000018 — توريد وصب خرسانة عادية', reasonAr: 'قواعد المعدات والغرف تتطلب خرسانة عادية' },
    { ar: 'شبكة تحذير (Warning Mesh)',             en: 'Warning Mesh',              code: null,           group: '304', unit: 'M',   conf: 75, ref: 'مواصفات الشركة — شبكة تحذير فوق الكابل', reasonAr: 'تُوضع فوق الكابل قبل الردم كطبقة تحذير بلاستيكية' },
  ];

  /* ════════════════════════════════════════════
     1) تقرير البنود الناقصة (Missing Items Report)
     ════════════════════════════════════════════ */
  function detectMissingItems(items) {
    const ar = _ar();
    const presentGroups = new Set((items || []).map(i => String(i.code || '').slice(0, 3)));
    const missing = [];

    MISSING_CANDIDATES.forEach(c => {
      if (!presentGroups.has(c.group.slice(0, 3))) return;
      const exists = (items || []).some(i => {
        if (c.code && i.code === c.code) return true;
        const p = getItemByCode(i.code);
        return p && p.arDesc && c.ar && p.arDesc.includes(c.ar.slice(0, 12));
      });
      if (exists) return;
      const p = c.code ? getItemByCode(c.code) : null;
      const price = p ? (p.newPrice || 0) : null;
      missing.push({
        ar: c.ar, en: c.en, code: c.code, unit: c.unit,
        confidence: c.conf,
        ref: ar ? c.ref : ('Unified Contract — ' + c.en),
        reasonAr: c.reasonAr,
        price, p,
        group: c.group,
      });
    });
    return missing;
  }

  /* ════════════════════════════════════════════
     2) نظام الثقة الهندسية (Confidence Score)
     ════════════════════════════════════════════ */
  function confidence(scoreOrItem) {
    let raw = 0;
    if (typeof scoreOrItem === 'number') raw = scoreOrItem;
    else if (scoreOrItem && typeof scoreOrItem.score === 'number') raw = scoreOrItem.score;
    else return null;
    const pct = Math.max(0, Math.min(100, Math.round((raw / 12) * 100)));
    const ar = _ar();
    const label = pct >= 90 ? (ar ? 'عالية جداً' : 'Very High')
      : pct >= 75 ? (ar ? 'عالية' : 'High')
      : pct >= 55 ? (ar ? 'متوسطة' : 'Medium')
      : (ar ? 'منخفضة' : 'Low');
    return { pct, label };
  }

  /* ════════════════════════════════════════════
     3) محرك المراجعة الهندسية (Engineering Auditor)
     ════════════════════════════════════════════ */
  function engineeringAudit(items) {
    const ar = _ar();
    const issues = [];
    if (!items || !items.length) {
      issues.push(makeIssue('critical', ar ? 'لا توجد بنود للمراجعة' : 'No items to audit'));
      return { issues, ok: false, score: 0, critical: 1, medium: 0, warnings: 0, total: 0 };
    }

    const byCode = {};
    items.forEach(i => { if (i.code) byCode[i.code] = (byCode[i.code] || 0) + 1; });

    // 1) ازدواجية الرموز
    Object.keys(byCode).forEach(code => {
      if (byCode[code] > 1) issues.push(makeIssue('critical',
        ar ? `ازدواجية: البند ${code} مكرر ${byCode[code]} مرات` : `Duplication: item ${code} repeated ${byCode[code]} times`,
        'dup', code));
    });

    // 2) أخطاء حسابية + كميات
    items.forEach(i => {
      const p = i.priceItem || getItemByCode(i.code);
      const up = (i.contractPrice != null) ? i.contractPrice : (i.customPrice || (p ? p.newPrice : 0) || 0);
      const calc = Math.round((i.qty || 0) * up);
      if (i.total != null && Math.abs(i.total - calc) > 0.01) {
        issues.push(makeIssue('medium',
          ar ? `خطأ حسابي في البند ${i.code}: الإجمالي ${i.total} ≠ ${calc}` : `Calc error ${i.code}: total ${i.total} ≠ ${calc}`,
          'calc', i.code));
      }
      if (!i.qty || i.qty <= 0) issues.push(makeIssue('warning',
        ar ? `الكمية صفر أو مفقودة للبند ${i.code}` : `Zero/missing qty for ${i.code}`,
        'qty', i.code));
    });

    // 3) اختلاف الوحدات
    items.forEach(i => {
      const p = i.priceItem || getItemByCode(i.code);
      if (!p) return;
      if (i.uom && p.uom && i.uom !== p.uom) {
        issues.push(makeIssue('warning',
          ar ? `اختلاف وحدة القياس للبند ${i.code}: ${i.uom} ≠ ${p.uom}` : `Unit mismatch ${i.code}: ${i.uom} ≠ ${p.uom}`,
          'uom', i.code));
      }
    });

    // 4) التوازن والاعتماديات
    if (typeof checkDependencies === 'function') {
      try {
        checkDependencies(items).forEach(d => {
          issues.push(makeIssue(d.level === 'critical' ? 'critical' : 'medium',
            ar ? d.title : d.titleEn, 'dep', d.sampleCode || null));
        });
      } catch (e) {}
    }
    if (typeof runAudit === 'function') {
      try {
        runAudit(items).forEach(a => {
          if (!a.satisfied) issues.push(makeIssue(a.level === 'critical' ? 'critical' : 'medium',
            ar ? a.ar : a.en, 'audit', null));
        });
      } catch (e) {}
    }

    const total = items.reduce((s, i) => {
      const p = i.priceItem || getItemByCode(i.code);
      const up = (i.contractPrice != null) ? i.contractPrice : (i.customPrice || (p ? p.newPrice : 0) || 0);
      return s + (i.qty || 0) * up;
    }, 0);
    const critical = issues.filter(x => x.level === 'critical').length;
    const medium = issues.filter(x => x.level === 'medium').length;
    const warnings = issues.filter(x => x.level === 'warning').length;
    const score = Math.max(0, Math.min(100, Math.round(100 - (critical * 18 + medium * 7 + warnings * 3))));
    return { issues, ok: critical === 0, score, critical, medium, warnings, total };
  }

  function makeIssue(level, msg, type, code) {
    return { level, msg, type, code };
  }

  /* ════════════════════════════════════════════
     4) فجوات العمل من التحليل النصي
     ════════════════════════════════════════════ */
  const WORK_KEYWORDS = [
    { key: 'excavation', ar: 'حفر',          re: /حفر|حفريات|excavation/i },
    { key: 'backfill',   ar: 'ردم',          re: /ردم|دفان|backfill/i },
    { key: 'protection', ar: 'حماية',        re: /حمايه|حماية|protection|بلاط حمايه/i },
    { key: 'testing',    ar: 'اختبار',       re: /اختبار|فحص|testing|commissioning/i },
    { key: 'reasphalt',  ar: 'إعادة سفلتة',  re: /سفلته|اسفلت|asphalt/i },
    { key: 'residewalk', ar: 'إعادة أرصفة',  re: /رصيف|انترلوك|interlock|ارصفه/i },
    { key: 'manhole',    ar: 'غرف تفتيش',    re: /غرف تفتيش|مناهيل|manhole/i },
    { key: 'earthing',   ar: 'تأريض',        re: /تاريض|ارضي|grounding|earthing/i },
    { key: 'concrete',   ar: 'خرسانة',       re: /خرسانه|خرسانة|concrete/i },
    { key: 'cable',      ar: 'كابلات',       re: /كابل|كيبل|كابلات|cable/i },
    { key: 'substation', ar: 'محطات',        re: /محطه|محطة|substation|rmu/i },
  ];

  function detectWorkGaps(text) {
    const ar = _ar();
    const t = String(text || '');
    const found = WORK_KEYWORDS.map(w => ({ ...w, present: w.re.test(t) }));
    const gaps = found.filter(f => f.present).map(f => ({
      ar: f.ar, en: f.key, work: f.key,
      hint: ar ? `تم اكتشاف ذكر «${f.ar}» في الملف — تأكد من وجود بنودها في المقايسة` : `Detected "${f.en}" in file — verify its BOQ items exist`,
    }));
    return { found, gaps };
  }

  /* ════════════════════════════════════════════
     5) قائمة المواد + تقدير التكاليف
     ════════════════════════════════════════════ */
  function materialList(items) {
    const groups = {};
    (items || []).forEach(i => {
      const p = i.priceItem || getItemByCode(i.code);
      if (!p) return;
      const prefix = String(i.code || '').slice(0, 3);
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push({ code: i.code, qty: i.qty || 0, desc: p.arDesc || '', uom: p.uom || '' });
    });
    return Object.keys(groups).map(g => ({
      group: g,
      count: groups[g].length,
      qty: groups[g].reduce((s, x) => s + x.qty, 0),
      items: groups[g],
    }));
  }

  function estimateCosts(items) {
    const totalDirect = (items || []).reduce((s, i) => {
      const p = i.priceItem || getItemByCode(i.code);
      const up = (i.contractPrice != null) ? i.contractPrice : (i.customPrice || (p ? p.newPrice : 0) || 0);
      return s + (i.qty || 0) * up;
    }, 0);
    const materials = totalDirect * 0.55;
    const labor = totalDirect * 0.25;
    const equipment = totalDirect * 0.20;
    const indirect = totalDirect * 0.12;
    const grand = totalDirect + indirect;
    return { totalDirect, materials, labor, equipment, indirect, grand };
  }

  /* ════════════════════════════════════════════
     6) مولدات التقارير
     ════════════════════════════════════════════ */
  function _unitPrice(i) {
    const p = i.priceItem || getItemByCode(i.code);
    if (i.contractPrice != null) return i.contractPrice;
    if (i.customPrice != null) return i.customPrice;
    return (p && p.newPrice) || 0;
  }

  function generateQSReport(items, meta) {
    const rows = (items || []).map(i => {
      const p = i.priceItem || getItemByCode(i.code);
      const up = _unitPrice(i);
      return { code: i.code, desc: p ? p.arDesc : (i.desc || ''), uom: p ? p.uom : (i.uom || ''), qty: i.qty || 0, price: up, total: Math.round((i.qty || 0) * up) };
    });
    const grand = rows.reduce((s, r) => s + r.total, 0);
    return { type: 'qs', title: 'Quantity Survey Report', rows, grand, meta };
  }

  function textReport(report) {
    const ar = _ar();
    if (!report) return '';
    const L = [];
    if (report.type === 'qs') {
      L.push(ar ? 'تقرير الكميات (QS)' : 'Quantity Survey Report');
      L.push('==============================');
      report.rows.forEach(r => L.push(`${r.code} | ${r.desc} | ${r.uom} | ${r.qty} | ${r.price} | ${r.total}`));
      L.push('-----------------------------');
      L.push(ar ? `الإجمالي: ${report.grand}` : `Grand Total: ${report.grand}`);
    } else if (report.type === 'missing') {
      L.push(ar ? 'تقرير البنود الناقصة' : 'Missing Items Report');
      L.push('==============================');
      report.items.forEach(m => {
        L.push(`${m.ar} | ${m.code || '—'} | ${m.unit} | الثقة ${m.confidence}%`);
        if (m.reasonAr) L.push('   ▪ ' + (ar ? m.reasonAr : m.en));
      });
    } else if (report.type === 'audit') {
      L.push(ar ? 'تقرير المراجعة الهندسية' : 'Engineering Review Report');
      L.push('==============================');
      L.push(ar ? `درجة الثقة: ${report.score}% — ${report.issues.length} ملاحظة` : `Confidence: ${report.score}% — ${report.issues.length} issues`);
      report.issues.forEach(i => L.push(`[${i.level}] ${i.msg}`));
    } else if (report.type === 'compliance') {
      L.push(ar ? 'تقرير مطابقة العقد الموحد' : 'Contract Compliance Report');
      L.push('==============================');
      report.findings.forEach(f => L.push(`[${f.level}] ${f.msg}`));
    } else if (report.type === 'cost') {
      L.push(ar ? 'تقدير التكاليف' : 'Cost Estimate');
      L.push('==============================');
      L.push(ar ? `تكلفة مباشرة: ${Math.round(report.totalDirect)}` : `Direct Cost: ${Math.round(report.totalDirect)}`);
      L.push(ar ? `مواد: ${Math.round(report.materials)}` : `Materials: ${Math.round(report.materials)}`);
      L.push(ar ? `عمالة: ${Math.round(report.labor)}` : `Labor: ${Math.round(report.labor)}`);
      L.push(ar ? `معدات: ${Math.round(report.equipment)}` : `Equipment: ${Math.round(report.equipment)}`);
      L.push(ar ? `إجمالي شامل: ${Math.round(report.grand)}` : `Grand Total: ${Math.round(report.grand)}`);
    }
    return L.join('\n');
  }

  /* ════════════════════════════════════════════
     واجهة «التدقيق والتقارير» في مراكز AI
     ════════════════════════════════════════════ */
  function _boqItems() {
    return (typeof App !== 'undefined' && App.state && App.state.boq) ? App.state.boq.items : [];
  }

  function renderAuditReports(container) {
    const ar = _ar();
    const items = _boqItems();
    const audit = engineeringAudit(items);
    const missing = detectMissingItems(items);
    const costs = estimateCosts(items);
    const fmt = (n) => (typeof fmtNum === 'function') ? fmtNum(Math.round(n)) : String(Math.round(n));
    const matList = materialList(items);

    const badge = (lvl) => {
      const c = lvl === 'critical' ? 'rgba(229,72,77,0.15)' : lvl === 'medium' ? 'rgba(255,169,0,0.15)' : 'rgba(0,132,61,0.12)';
      const t = lvl === 'critical' ? (ar ? 'حرج' : 'Critical') : lvl === 'medium' ? (ar ? 'متوسط' : 'Medium') : (ar ? 'تنبيه' : 'Warning');
      const col = lvl === 'critical' ? '#e5484d' : lvl === 'medium' ? '#ffa900' : '#00843d';
      return `<span style="display:inline-block;padding:2px 9px;border-radius:99px;font-size:10px;font-weight:800;background:${c};color:${col};">${t}</span>`;
    };

    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div class="card" style="border:1px solid var(--border-sec);">
          <div class="card-head" style="background:linear-gradient(90deg,rgba(38,132,255,0.08),transparent);border-bottom:1px solid var(--border);">
            <span>🛡️</span><span class="card-title">${ar ? 'التدقيق الهندسي والتقارير' : 'Engineering Audit & Reports'}</span>
            <span style="margin-${ar ? 'right' : 'left'}:auto;font-size:10.5px;color:var(--text-muted);">${ar ? 'المراجعة • النواقص • التكاليف • المخرجات' : 'Review • Missing • Cost • Outputs'}</span>
          </div>
          <div class="card-body">
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
              <div style="flex:1;min-width:140px;background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;">
                <div style="font-size:9.5px;color:var(--text-muted);font-weight:700;">${ar ? 'درجة المراجعة' : 'Audit Score'}</div>
                <div style="font-size:26px;font-weight:900;${audit.score >= 80 ? 'color:var(--sec-primary);' : audit.score >= 50 ? 'color:var(--sec-gold);' : 'color:#e5484d;'}">${audit.score}%</div>
                <div style="font-size:10px;color:var(--text-sub);">${ar ? 'من الثقة الهندسية' : 'engineering confidence'}</div>
              </div>
              <div style="flex:1;min-width:140px;background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;">
                <div style="font-size:9.5px;color:var(--text-muted);font-weight:700;">${ar ? 'البنود الناقصة' : 'Missing Items'}</div>
                <div style="font-size:26px;font-weight:900;color:var(--sec-gold);">${missing.length}</div>
                <div style="font-size:10px;color:var(--text-sub);">${ar ? 'مقترحة للإضافة' : 'suggested additions'}</div>
              </div>
              <div style="flex:1;min-width:140px;background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;">
                <div style="font-size:9.5px;color:var(--text-muted);font-weight:700;">${ar ? 'ملاحظات المراجعة' : 'Audit Issues'}</div>
                <div style="font-size:26px;font-weight:900;color:${audit.critical ? '#e5484d' : 'var(--text-h)'};">${audit.issues.length}</div>
                <div style="font-size:10px;color:var(--text-sub);">${ar ? (audit.critical + ' حرجة') : (audit.critical + ' critical')}</div>
              </div>
              <div style="flex:1;min-width:140px;background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:12px;text-align:center;">
                <div style="font-size:9.5px;color:var(--text-muted);font-weight:700;">${ar ? 'التكلفة المباشرة' : 'Direct Cost'}</div>
                <div style="font-size:20px;font-weight:900;color:var(--accent-gold);">${fmt(costs.totalDirect)} ${ar ? 'ر.س' : 'SAR'}</div>
                <div style="font-size:10px;color:var(--text-sub);">${ar ? 'شامل +12% غير مباشر' : 'incl +12% indirect'}</div>
              </div>
            </div>

            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
              <button class="btn btn-gold btn-sm" onclick="App.exportBOQ('excel')">📊 ${ar ? 'تصدير BOQ Excel' : 'Export BOQ Excel'}</button>
              <button class="btn btn-outline btn-sm" onclick="App.exportBOQ('pdf')">🖨️ ${ar ? 'PDF BOQ' : 'PDF BOQ'}</button>
              <button class="btn btn-outline btn-sm" onclick="AIEngine2.downloadReport('qs')">📋 ${ar ? 'تقرير الكميات' : 'QS Report'}</button>
              <button class="btn btn-outline btn-sm" onclick="AIEngine2.downloadReport('missing')">⚠️ ${ar ? 'تقرير النواقص' : 'Missing Report'}</button>
              <button class="btn btn-outline btn-sm" onclick="AIEngine2.downloadReport('audit')">🛡️ ${ar ? 'تقرير المراجعة' : 'Review Report'}</button>
              <button class="btn btn-outline btn-sm" onclick="AIEngine2.downloadReport('compliance')">✅ ${ar ? 'تقرير المطابقة' : 'Compliance Report'}</button>
              <button class="btn btn-outline btn-sm" onclick="AIEngine2.downloadReport('cost')">💰 ${ar ? 'تقدير التكاليف' : 'Cost Estimate'}</button>
            </div>

            ${missing.length ? `
            <div style="font-size:12.5px;font-weight:800;margin:6px 0 8px;color:var(--sec-gold);">⚠️ ${ar ? 'تقرير البنود الناقصة (Missing Items Report)' : 'Missing Items Report'}</div>
            <div class="tbl-wrap"><table class="data-table"><thead><tr>
              <th>#</th><th>${ar ? 'البند الناقص' : 'Missing Item'}</th><th>${ar ? 'الرمز' : 'Code'}</th><th>${ar ? 'الوحدة' : 'Unit'}</th><th>${ar ? 'السعر المرجعي' : 'Ref. Price'}</th><th>${ar ? 'المرجع الفني' : 'Technical Ref'}</th><th style="width:80px;">${ar ? 'الثقة' : 'Conf.'}</th><th></th>
            </tr></thead><tbody>
            ${missing.map((m, i) => `
              <tr>
                <td style="color:var(--text-muted);font-size:11px;">${i + 1}</td>
                <td class="td-desc"><div style="font-weight:700;font-size:12px;">${m.ar}</div><div style="font-size:10px;color:var(--text-muted);">${m.reasonAr}</div></td>
                <td class="td-code">${m.code || '—'}</td>
                <td>${m.unit}</td>
                <td>${m.price != null ? fmt(m.price) : '—'}</td>
                <td style="font-size:11px;color:var(--text-sub);">${m.ref}</td>
                <td><span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:800;background:rgba(0,132,61,0.12);color:var(--sec-primary);">${m.confidence}%</span></td>
                <td>${m.code ? `<button class="btn btn-gold btn-sm btn-icon" onclick="AIEngine2.addMissingItem('${m.code}', ${m.confidence})" title="${ar ? 'إضافة للمقايسة' : 'Add to BOQ'}">＋</button>` : ''}</td>
              </tr>`).join('')}
            </tbody></table></div>
            ` : `<div style="padding:14px;text-align:center;color:var(--text-muted);font-size:12.5px;">${ar ? '✅ لا توجد بنود ناقصة مقترحة' : 'No missing items suggested'}</div>`}

            ${audit.issues.length ? `
            <div style="font-size:12.5px;font-weight:800;margin:16px 0 8px;color:var(--accent-blue);">🔍 ${ar ? 'نتائج المراجعة الهندسية (Engineering Audit)' : 'Engineering Audit Results'}</div>
            <div class="tbl-wrap"><table class="data-table"><thead><tr>
              <th>#</th><th style="width:80px;">${ar ? 'المستوى' : 'Level'}</th><th>${ar ? 'الملاحظة' : 'Finding'}</th><th>${ar ? 'الرمز' : 'Code'}</th>
            </tr></thead><tbody>
            ${audit.issues.map((x, i) => `<tr><td style="color:var(--text-muted);font-size:11px;">${i + 1}</td><td>${badge(x.level)}</td><td style="font-size:12px;">${x.msg}</td><td class="td-code">${x.code || '—'}</td></tr>`).join('')}
            </tbody></table></div>
            ` : `<div style="padding:14px;text-align:center;color:var(--text-muted);font-size:12.5px;">${ar ? '✅ لا توجد ملاحظات تدقيق' : 'No audit issues'}</div>`}

            <div style="font-size:12.5px;font-weight:800;margin:16px 0 8px;color:var(--accent-gold);">💰 ${ar ? 'تقدير التكاليف (Cost Estimate)' : 'Cost Estimate'}</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;">
              ${[['مواد / Materials', costs.materials], ['عمالة / Labor', costs.labor], ['معدات / Equipment', costs.equipment], ['مباشرة / Direct', costs.totalDirect], ['غير مباشرة / Indirect', costs.indirect], ['الإجمالي / Grand', costs.grand]].map(([l, v]) => `
                <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:10px;padding:10px 12px;">
                  <div style="font-size:10px;color:var(--text-muted);font-weight:700;">${l}</div>
                  <div style="font-size:16px;font-weight:900;color:var(--text-h);">${fmt(v)} ${ar ? 'ر.س' : 'SAR'}</div>
                </div>`).join('')}
            </div>

            ${matList.length ? `
            <div style="font-size:12.5px;font-weight:800;margin:16px 0 8px;color:var(--sec-primary);">📦 ${ar ? 'قائمة المواد (Material List) — حسب أقسام العقد' : 'Material List — by contract section'}</div>
            <div class="tbl-wrap"><table class="data-table"><thead><tr>
              <th>${ar ? 'القطاع' : 'Section'}</th><th>${ar ? 'الرموز' : 'Codes'}</th><th>${ar ? 'عدد البنود' : 'Items'}</th><th>${ar ? 'إجمالي الكميات' : 'Total Qty'}</th><th>${ar ? 'المواد' : 'Materials'}</th>
            </tr></thead><tbody>
            ${matList.map(g => `
              <tr>
                <td class="td-code">${g.group}</td>
                <td style="font-size:10.5px;color:var(--text-sub);max-width:240px;">${g.items.slice(0, 4).map(x => x.code).join(' • ')}${g.items.length > 4 ? ' …' : ''}</td>
                <td>${g.count}</td>
                <td>${fmt(g.qty)}</td>
                <td style="font-size:10.5px;color:var(--text-sub);max-width:260px;">${g.items.slice(0, 2).map(x => x.desc.slice(0, 40)).join(' • ')}</td>
              </tr>`).join('')}
            </tbody></table></div>
            ` : ''}
          </div>
        </div>
      </div>`;
  }

  /* ════════════════════════════════════════════
     تنزيل التقارير + إضافة البند الناقص
     ════════════════════════════════════════════ */
  function _downloadBlob(text, name) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    if (typeof _download === 'function') _download(blob, name);
    else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
    }
  }

  function buildReport(type) {
    const ar = _ar();
    const items = _boqItems();
    const meta = (typeof App !== 'undefined' && App.state && App.state.boq) ? App.state.boq.meta : {};
    switch (type) {
      case 'qs': {
        const r = generateQSReport(items, meta);
        if (typeof exportToCSV === 'function') {
          const csv = '\uFEFF' + 'Code,Description,UOM,Qty,UnitPrice,Total\n' + r.rows.map(x => `${x.code},"${String(x.desc).replace(/"/g, '""')}",${x.uom},${x.qty},${x.price},${x.total}`).join('\n') + '\nGrand Total,,,,' + r.grand;
          _downloadBlob(csv, 'QS_Report_' + (meta.project || 'BOQ') + '.csv');
          return null;
        }
        return r;
      }
      case 'missing': {
        const m = detectMissingItems(items);
        _downloadBlob('\uFEFF' + textReport({ type: 'missing', items: m }), 'Missing_Items_Report.txt');
        return null;
      }
      case 'audit': {
        const r = { type: 'audit', ...engineeringAudit(items) };
        _downloadBlob('\uFEFF' + textReport(r), 'Engineering_Review_Report.txt');
        return null;
      }
      case 'compliance': {
        const comp = (typeof AIEngine !== 'undefined' && AIEngine.complianceReview) ? AIEngine.complianceReview(items) : { critical: [], warnings: [], info: [] };
        const findings = [
          ...comp.critical.map(m => ({ level: 'critical', msg: m })),
          ...comp.warnings.map(m => ({ level: 'medium', msg: m })),
          ...comp.info.map(m => ({ level: 'info', msg: m })),
        ];
        _downloadBlob('\uFEFF' + textReport({ type: 'compliance', findings }), 'Contract_Compliance_Report.txt');
        return null;
      }
      case 'cost': {
        _downloadBlob('\uFEFF' + textReport({ type: 'cost', ...estimateCosts(items) }), 'Cost_Estimate.txt');
        return null;
      }
      default: return null;
    }
  }

  function downloadReport(type) {
    const r = buildReport(type);
    if (r && r.type === 'qs') _downloadBlob('\uFEFF' + textReport(r), 'QS_Report.txt');
    if (typeof toast === 'function') toast(_ar() ? 'تم تنزيل التقرير' : 'Report downloaded', 'success');
  }

  function addMissingItem(code, conf) {
    if (typeof App === 'undefined') return;
    const p = getItemByCode(code);
    if (!p) { toast('Code not found', 'error'); return; }
    if (App.state.boq.items.some(x => x.code === code)) {
      toast(App.lang === 'ar' ? 'البند موجود بالفعل' : 'Item already exists', 'warning');
      return;
    }
    App.state.boq.items.push({ code, qty: 1, customPrice: null, note: '🛡️ AI2 Missing Item (' + conf + '%)' });
    if (typeof App._renderBOQTable === 'function') App._renderBOQTable();
    if (typeof App.runDepsCheck === 'function') App.runDepsCheck();
    toast(App.lang === 'ar' ? `تمت إضافة البند الناقص ${code}` : `Missing item ${code} added`, 'success');
    const slot = document.getElementById('ai-panel-audit');
    if (slot) AIEngine2.renderAuditReports(slot);
  }

  /* ── color of a BOQ code per utility system ── */
  function colorOfCode(code) {
    const c = String(code || '');
    let hit = null;
    Object.keys(UTILITY_COLORS).forEach(k => {
      const u = UTILITY_COLORS[k];
      const match = u.codes.some(prefix => c.startsWith(prefix));
      if (match) hit = u;
    });
    return hit ? hit.color : '#64748b';
  }

  /* ── exports ── */
  return {
    UTILITY_COLORS, SYMBOLS, MISSING_CANDIDATES,
    detectMissingItems, engineeringAudit, confidence, detectWorkGaps,
    materialList, estimateCosts, generateQSReport, textReport,
    renderAuditReports, downloadReport, addMissingItem, buildReport, colorOfCode,
  };
})();
