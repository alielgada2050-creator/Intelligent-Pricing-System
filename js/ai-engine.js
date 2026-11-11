/* ================================================================
   العقد الموحد 2026 — محرك الذكاء الهندسي (الحصر الذكي + مطابقة العقد)
   Unified Contract 2026 — Engineering AI Engine
   Roles: Quantity Surveyor • Civil • Electrical • Mechanical •
          Infrastructure • GIS • PDF Analysis • Computer Vision •
          BIM • AI Data Engineer
   ================================================================ */

const AIEngine = {

  /* ────────────────────────────────────────────────
     1) SYSTEM PROMPT — full engineering persona
     ──────────────────────────────────────────────── */
  buildSystemPrompt(lang) {
    const ar = (lang === 'ar');
    const cats = CATEGORIES.map(c => c.id + ':' + (ar ? c.labelAr : c.labelEn)).join(', ');
    const sample = PRICE_LIST.slice(0, 60).map(i => `${i.code}|${i.arDesc}|${i.enDesc}|${i.uom}|${i.newPrice}`).join('; ');
    const ROLES = ar
      ? `أنت محرك ذكاء اصطناعي هندسي متقدم يجمع بين: خبير حصر كميات، مهندس مدني، مهندس كهرباء، مهندس ميكانيكي، مهندس بنية تحتية، مختص نظم معلومات جغرافية GIS، خبير تحليل PDF، خبير رؤية حاسوبية، مختص BIM، ومهندس بيانات ذكاء اصطناعي.`
      : `You are an advanced engineering AI engine combining: Quantity Surveyor Expert, Civil Engineer, Electrical Engineer, Mechanical Engineer, Infrastructure Engineer, GIS Specialist, PDF Analysis Expert, Computer Vision Expert, BIM Specialist, and AI Data Engineer.`;

    const PHASES = ar
      ? `طريقة العمل المطلوبة:
المرحلة 1 — تحليل الملفات: استخراج النصوص والجداول والمواصفات وجداول الكميات والملاحظات والرموز، ثم بناء قاعدة بيانات منظمة (رقم المشروع، اسمه، الجهة المالكة، المقاول، الاستشاري، التاريخ، القيمة، البنود، الكميات، الوحدات).
المرحلة 2 — تحليل المخططات: قراءة PDF/CAD/DWG/DXF/IFC/صور المخططات واستخراج الأطوال والمساحات والأحجام (كابلات، مواسير، حفر، أسفلت، أرصفة، بلاط، خرسانة، ردم).
المرحلة 3 — الحصر الذكي: حصر تلقائي لأعمال الكهرباء (كابلات ج.متوسط/منخفض، لوحات، محولات، أعمدة إنارة، غرف، دكتات، غرف تفتيش)، المياه (خطوط، محابس، عدادات، وصلات)، الصرف (خطوط، مناهيل، غرف تفتيش، محطات رفع)، الطرق (حفر، ردم، أساس ترابي/حصوي، أسفلت، أرصفة)، والاتصالات (ألياف بصرية، غرف، دكتات، كوابل).
المرحلة 4 — الرسم الذكي: اكتشاف عناصر الصور والمخططات وتحديد مسارات الخدمات والأعمدة والغرف والمناهيل والمواسير والكابلات، وتلوين كل شبكة بلون مختلف.
المرحلة 5 — إنشاء BOQ تلقائي: رقم البند، الوصف، الوحدة، الكمية، سعر الوحدة، الإجمالي، مع إمكانية التعديل والإضافة والحذف والدمج والتقسيم.
المرحلة 6 — مطابقة العقد الموحد السعودي: مراجعة البنود مع مواصفات الشركة السعودية للطاقة والمواصفات القياسية السعودية، والتنبيه على البنود الناقصة والكميات غير المنطقية والتعارضات.
المرحلة 7 — مقارنة المقايسات: المقارنة بين النسخ وإظهار المضاف والمحذوف والمعدل وفروقات الأسعار والكميات.
المرحلة 8 — التكامل: دعم التصدير إلى Odoo وERPNext وCSV وExcel وPDF وJSON وXML.
المرحلة 9 — النسخ الاحتياطي: إدارة الإصدارات والنسخ الاحتياطية اليومية والأسبوعية.
المرحلة 10 — لوحة التحكم: إجمالي الكميات والتكاليف ونسبة الإنجاز والمخاطر والبنود الناقصة والحرجة مع الرسوم البيانية وخرائط GIS.`
      : `Required workflow:
Phase 1 — File analysis: extract texts, tables, specs, BOQ tables, notes, symbols; build an organized database (project no., name, owner, contractor, consultant, date, value, items, quantities, units).
Phase 2 — Drawing analysis: read PDF/CAD/DWG/DXF/IFC/drawing images and extract lengths, areas, volumes (cables, pipes, excavation, asphalt, sidewalks, tiles, concrete, backfill).
Phase 3 — Smart takeoff: automatic quantity takeoff for electrical (MV/LV cables, panels, transformers, lighting poles, rooms, ducts, manholes), water (lines, valves, meters, connections), sewer (lines, manholes, pump stations), roads (excavation, backfill, earth/aggregate base, asphalt, sidewalks), and telecom (fiber, rooms, ducts, cables).
Phase 4 — Smart drawing: detect elements in images/drawings, identify service routes, poles, rooms, manholes, pipes, cables; color each network differently.
Phase 5 — Automatic BOQ: item no., description, unit, qty, unit price, total; support manual edit, add, delete, merge, split.
Phase 6 — Saudi unified contract matching: review items against Saudi Energy specs and SASO standards; alert on missing items, unreasonable quantities, conflicts.
Phase 7 — BOQ comparison: compare versions and show added, removed, modified items plus price and quantity differences.
Phase 8 — Integration: export to Odoo, ERPNext, CSV, Excel, PDF, JSON, XML.
Phase 9 — Backup: versioning and daily/weekly backups.
Phase 10 — Dashboard: totals, costs, progress, risks, missing & critical items, charts, and GIS maps.`;

    return (ar
      ? `أنت محرك تسعير ومقايسات لشركة الأساس العريض للمقاولات على العقد الموحد الجديد RFx 4000083770 مع الشركة السعودية للطاقة. ${ROLES}\n\n${PHASES}\n\nقواعد أساسية: أجب بلغة السؤال (عربي افتراضياً). عند طلب مقايسة رد بجدول مرتب (الرمز | الوصف | الوحدة | الكمية | السعر الموحد | الإجمالي) وميّز الأعمال عن المواد. قاعدة الربط: كل بند توريد يقابله بند تركيب. مقايسات الطوارئ بنسبة 145%. لكل بند مذكور أرفق رمزه من قائمة الأسعار الموحدة. الأقسام: `
      : `You are the pricing & BOQ engine for Al-Asas Al-Areed Contracting on the Unified Contract RFx 4000083770 with Saudi Energy Company. ${ROLES}\n\n${PHASES}\n\nCore rules: Answer in the user's language (Arabic by default). When asked for a BOQ reply with a tidy table (code | description | unit | qty | unified price | total) and distinguish materials vs works. Linkage rule: every supply item needs a matching installation item. Emergency BOQs use 145%. Always attach official price-list codes. Sections: `)
      + cats
      + (ar ? '. عيّنة من بنود الأسعار الموحدة (رمز|وصف|إنجليزي|وحدة|سعر): ' : '. Sample unified price items (code|desc|english|uom|price): ')
      + sample;
  },

  /* ────────────────────────────────────────────────
     2) SEGMENTATION + QUANTITY EXTRACTION
     ──────────────────────────────────────────────── */
  _split(text) {
    // split on punctuation, then on the conjunctions "مع" ("with"), "و" ("and")
    // and English "and"/"then" — but NOT when و starts a real Arabic word
    // (وصلة/وصلات, وحدات, واحد, وسطية, ...)
    const norm = normalizeArabic(String(text || ''));
    const out = [];
    String(norm).split(/[،,;؛\n\r\t]+/).forEach(part => {
      part.split(/\s+مع(?=\s|[،,;؛\n\r\t]|$)/i).forEach(pp => {
        pp.split(/\s+و(?!\s*(?:صل|حدات|حده|احد|احده|سطي|مد|نش|زاره|جود|صل\/))/i)
          .forEach(a => {
            a.split(/\s+(?:and|then)\b/i).forEach(seg => {
              seg = seg.trim();
              if (seg) out.push(seg);
            });
          });
      });
    });
    return out;
  },

  _extractQty(seg) {
    // 9-digit item codes are codes, never quantities — remove them first
    const s = String(seg || '').replace(/\b\d{9}\b/g, ' ');
    const words = { واحده: 1, واحد: 1, اثنين: 2, اثنتين: 2, اتنين: 2, ثلاث: 3, ثلاثه: 3, اربع: 4, اربعه: 4, خمس: 5, خمسه: 5, سته: 6, ست: 6, سبع: 7, سبعه: 7, ثماني: 8, ثمانيه: 8, تسع: 9, تسعه: 9, عشر: 10, عشره: 10, عشرين: 20, ثلاثين: 30 };
    // cable sizes (e.g. 300مم / 185 mm / 70mm) are sizes, not quantities.
    // NOTE: a single م = meters (a length); only مم / mm is a cable size.
    const sizeNums = [...s.matchAll(/(\d{2,3})\s*(?:مم|mm|م\s*م)/gi)].map(m => parseFloat(m[1]));
    const withoutSizes = s.replace(/(\d{2,3})\s*(?:مم|mm|م\s*م)/gi, ' ');

    // 1) explicit quantity keyword: "كمية 5" / "qty 5" / "عدد 3"
    const kwM = withoutSizes.match(/(?:كميه|كمية|الكميه|الكمية|عدد|qty|quantity|count)\s*[:=]?\s*(\d+(?:[.,]\d+)?)/i);
    if (kwM) return { qty: parseFloat(kwM[1].replace(',', '.')), unit: 'N' };

    // 2) number followed by a length unit (متر/m/km…)
    const lenM = withoutSizes.match(/(\d+(?:[.,]\d+)?)\s*(?:متر|مترا|امتار|م|كم|كيلومتر|m|km|M)(?![0-9٠-٩])/i);
    if (lenM) return { qty: parseFloat(lenM[1].replace(',', '.')), unit: 'L' };

    // 3) number followed by a count noun (joints/terminations/cables/panels…)
    const cntM = withoutSizes.match(/(\d+(?:[.,]\d+)?)\s*(?:وصله|وصلة|وصلات|نهايه|نهاية|نهايات|كيبل|كابل|cable|joint|termination|عمود|pole|لوحه|لوحة|panel|عداد|meter|محول|transformer|خط|مفتاح|switch|قاطع|breaker)\s*(?=$|[\s،,;؛\n\r\t])/i);
    if (cntM) return { qty: parseFloat(cntM[1].replace(',', '.')), unit: 'N' };

    // 4) Arabic number words
    if (!sizeNums.length) {
      for (const w in words) {
        if (s.includes(w)) return { qty: words[w], unit: 'N' };
      }
    }

    // 5) last remaining plausible count (drop sizes, codes, dates, huge values)
    const nums = (withoutSizes.match(/\d+(?:[.,]\d+)?/g) || [])
      .map(n => parseFloat(n.replace(',', '.')))
      .filter(n => !sizeNums.includes(n));
    // joints/terminations: the size follows the noun ("نهاية 300"), count comes first
    // ("2 نهاية 300") or is absent → never let the size leak into the quantity.
    const isJointTerm = /وصله|وصلة|وصلات|نهايه|نهاية|نهايات|joint|termination/i.test(s);
    let plausible = nums.filter(n => isFinite(n) && n <= 100000);
    if (isJointTerm) {
      const counts = plausible.filter(n => n <= 20);
      if (counts.length) return { qty: counts[counts.length - 1], unit: 'N' };
      return null; // size-only (e.g. "نهاية 300") → default qty 1 upstream
    }
    if (plausible.length) return { qty: plausible[plausible.length - 1], unit: 'N' };
    if (nums.length) return { qty: nums[nums.length - 1], unit: 'N' };
    return null;
  },

  /* ────────────────────────────────────────────────
     3) CURATED HIGH-PRECISION RULES
     ──────────────────────────────────────────────── */
  _curated(seg, qn, lastSize) {
    const s = seg.toLowerCase();
    const sizeMatch = s.match(/(4\s*[x*×]\s*)?(\d{2,3})\s*م{0,2}m{0,2}/i) || s.match(/كابل[^0-9]*(\d{2,3})/i);
    const size = sizeMatch ? parseInt(sizeMatch[2] || sizeMatch[1], 10) : null;
    const effSize = size || lastSize || null; // explicit size wins, else last cable size
    const isMV = /متوسط|15ك|15 ك|13\.8|ثلاثي القلب|3\s*[x*×]/.test(s);
    const isLV = /منخفض|رباعي|4\s*[x*×]/.test(s) && !isMV;

    // Surge arresters (موانع تيار / مانعات صواعق)
    if (/(مانعات|مانع|موانع).*(صواعق|تيار)|surge|arrester/i.test(s)) return { code: '205010302', score: 10 };

    // Sub-distribution steel panel (لوحة توزيع فرعية حديدية)
    if (/لوحه\s*توزيع\s*فرعيه|لوحه فرعيه|فرعيه حديده|ميني\s*(?:بلر|بيلر|بيلار)|مني\s*بلر|minipillar/i.test(s)) return { code: '308010101', score: 10 };

    // Open excavation / LV trench (حفر مفتوح)
    if (/حفر\s*مفتوح|حفر\s*مسار\s*كابل|حفر مسار ج منخفض|open excavation/i.test(s)) return { code: '301010101', score: 10 };

    // Cable laying
    if (/كابل|كيبل|cable/i.test(s)) {
      const hasWork = /تمديد|تمديدكابل|تركيب|مد|امداد|امدادكابل|laying|install/i.test(s);
      const hasLen = /متر|م\b|km\b|m\b/i.test(s);
      if (hasWork || hasLen || size) {
        if (isMV) return { code: (size && size > 185) ? '304010202' : '304010201', score: 10, size };
        return { code: (size && size > 185) ? '304010102' : '304010101', score: 10, size };
      }
    }
    // Cable joints (وصلات)
    if (/وصله|وصلة|وصلات|joint/i.test(s)) {
      if (isMV) return { code: (effSize && effSize > 185) ? '305020102' : '305020101', score: 10, size: effSize };
      return { code: (effSize && effSize > 185) ? '305010102' : '305010101', score: 10, size: effSize };
    }
    // Cable terminations (نهايات)
    if (/نهايه|نهاية|نهايات|termination|ترمنال/i.test(s)) {
      if (isMV) return { code: (effSize && effSize > 185) ? '305020402' : '305020401', score: 10, size: effSize };
      return { code: (effSize && effSize > 185) ? '305010302' : '305010301', score: 10, size: effSize };
    }
    // Surge-related disconnects
    if (/فصل وتوصيل/i.test(s) && /متوسط/i.test(s)) return { code: '203030001', score: 6 };

    return null;
  },

  /* ────────────────────────────────────────────────
     4) GENERIC TOKEN SCORER (fallback)
     ──────────────────────────────────────────────── */
  _scoreItem(item, tokens, qn) {
    const ar = (item.arNorm || '').toLowerCase();
    const en = (item.enNorm || '').toLowerCase();
    const grp = (item.group || '').toLowerCase();
    const sec = (item.section || '').toLowerCase();
    const full = ar + ' ' + en + ' ' + grp + ' ' + sec;
    let s = 0;
    let hits = 0;
    tokens.forEach(t => {
      if (t.length < 2) return;
      if (full.includes(t)) { s += 4; hits++; }
      else if (ar.includes(t)) { s += 3; hits++; }
      else if (en.includes(t)) { s += 3; hits++; }
    });
    if (hits === 0) return 0;
    // boost when the whole normalized segment is a substring of desc
    if (qn && qn.length > 6 && (ar.includes(qn) || en.includes(qn))) s += 6;
    return s;
  },

  /* ────────────────────────────────────────────────
     5) VOICE TAKEOFF — context-aware electrical dictation
     Lengths stay with cables; panels, joints and terminations keep their own quantities.
     ──────────────────────────────────────────────── */
  voiceTakeoff(text) {
    const s = normalizeArabic(String(text || '')).toLowerCase().replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
    const found = [];
    const add = (code, qty, kind, size, at) => {
      if (code && getItemByCode(code) && Number(qty) > 0) found.push({ code, qty: Number(qty), score: 12, kind, size: size || null, at: at == null ? -1 : at });
    };
    const codeFor = (kind, size) => {
      const large = Number(size) > 185;
      if (kind === 'cable') return large ? '304010102' : '304010101';
      if (kind === 'joint') return large ? '305010102' : '305010101';
      return large ? '305010302' : '305010301';
    };
    let m;
    const panelRe = /(?:(\d+)\s*)?(?:تركيب\s*)?(?:ميني\s*(?:بلر|بيلر|بيلار)|مني\s*بلر|لوحه\s*(?:توزيع\s*)?فرعيه(?:\s*حديده)?|minipillar)/gi;
    while ((m = panelRe.exec(s))) add('308010101', Number(m[1]) || 1, 'panel', null, m.index);

    const cables = [];
    const addCable = (size, length, at) => {
      if (!(Number(size) > 0 && Number(length) > 0)) return;
      if (cables.some(c => c.size === Number(size) && Math.abs(c.at - at) < 5)) return;
      cables.push({ size: Number(size), at });
      add(codeFor('cable', size), length, 'cable', size, at);
    };
    const before = /(\d+(?:\.\d+)?)\s*(?:متر|م)\s*(?:تمديد\s*)?(?:كيبل|كابل)\s*(?:4\s*[x*×]\s*)?(\d{2,3})\s*(?:مم|mm)?/gi;
    while ((m = before.exec(s))) addCable(m[2], m[1], m.index);
    const after = /(?:تمديد|مد|تركيب)?\s*(?:كيبل|كابل)\s*(?:4\s*[x*×]\s*)?(\d{2,3})\s*(?:مم|mm)?\s*(\d+(?:\.\d+)?)\s*(?:متر|م)(?!\s*م)/gi;
    while ((m = after.exec(s))) addCable(m[1], m[2], m.index);

    const lastSize = at => {
      const previous = cables.filter(c => c.at < at).sort((a, b) => b.at - a.at)[0];
      return previous ? previous.size : null;
    };
    const accessory = (regex, kind) => {
      while ((m = regex.exec(s))) {
        const size = Number(m[2]) || lastSize(m.index);
        if (size) add(codeFor(kind, size), Number(m[1]) || 1, kind, size, m.index);
      }
    };
    accessory(/(?:(\d+)\s*)?(?:وصله|وصلة|وصلات)\s*(?:4\s*[x*×]\s*)?(\d{2,3})?/gi, 'joint');
    accessory(/(?:(\d+)\s*)?(?:نهايه|نهاية|نهايات|ترمنال)\s*(?:4\s*[x*×]\s*)?(\d{2,3})?/gi, 'term');

    const merged = [], map = new Map();
    found.forEach(row => {
      if (map.has(row.code)) map.get(row.code).qty += row.qty;
      else { const copy = { ...row }; map.set(row.code, copy); merged.push(copy); }
    });
    return { items: merged, unresolved: [], totalSegments: found.length, source: 'voice-context' };
  },

  /* ────────────────────────────────────────────────
     6) SMART TAKEOFF — text → BOQ items
     ──────────────────────────────────────────────── */
  smartTakeoff(text, opts) {
    const segments = this._split(text);
    const results = [];
    const unresolved = [];
    let lastSize = null;
    const strictQty = !!(opts && opts.defaultQty === false); // file mode: only real quantities

    segments.forEach(seg => {
      const qn = normalizeArabic(seg).toLowerCase();
      const qtyInfo = this._extractQty(seg);
      const hasQty = !!(qtyInfo && qtyInfo.qty);
      let qty = hasQty ? qtyInfo.qty : (strictQty ? null : 1);
      if (qty == null) { unresolved.push(seg); return; } // no quantity in file → skip

      // 1) exact code mention
      const codeMatch = seg.match(/\b(\d{9})\b/);
      if (codeMatch && getItemByCode(codeMatch[1])) {
        results.push({ code: codeMatch[1], qty, score: 12, matched: seg });
        return;
      }

      // 2) curated rules
      const cur = this._curated(seg, qn, lastSize);
      if (cur && getItemByCode(cur.code)) {
        // joints/terminations: qty = count (e.g. "2 وصلة 300" → 2, not 300)
        if (/^(30501|30502)\d{4}$/.test(cur.code) && cur.size) {
          const nums = (seg.match(/\d{1,3}(?:\.\d+)?/g) || [])
            .map(n => parseFloat(n.replace(',', '.')))
            .filter(n => Math.abs(n - cur.size) > 0.5);
          if (nums.length) qty = nums[nums.length - 1];
        }
        // remember cable size for later joints/terminations without size
        if (/^(30401|30402)\d{4}$/.test(cur.code) && cur.size) lastSize = cur.size;
        results.push({ code: cur.code, qty, score: cur.score, matched: seg });
        return;
      }

      // 3) generic token scoring
      const tokens = qn.split(/\s+/).filter(w => /[\u0600-\u06FFa-z]/.test(w))
        .map(w => w.replace(/[^a-z\u0600-\u06FF]/g, ''))
        .filter(w => w.length >= 2);
      const stop = ['على', 'من', 'في', 'الى', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ذلك', 'مقدار', 'اجمالي', 'كل', 'بأجمالي', 'واحد', 'اثنين', 'ثلاثة', 'اربعه', 'اربع', 'خمسه', 'خمسة', 'كميه', 'كمية', 'عدد'];
      const wt = tokens.filter(t => !stop.includes(t) && !/^\d+$/.test(t));

      let best = null;
      for (const item of PRICE_LIST) {
        const s = this._scoreItem(item, wt, qn);
        if (!best || s > best.score) best = { code: item.code, score: s };
      }
      if (best && best.score >= 6) {
        results.push({ code: best.code, qty, score: best.score, matched: seg });
      } else {
        unresolved.push(seg);
      }
    });

    // merge duplicates (sum qty, keep best score)
    const merged = [];
    const map = new Map();
    results.forEach(r => {
      if (map.has(r.code)) {
        const ex = map.get(r.code);
        ex.qty += r.qty;
        if (r.score > ex.score) ex.score = r.score;
        ex.matched += ' + ' + r.matched;
      } else {
        const copy = { ...r };
        map.set(r.code, copy);
        merged.push(copy);
      }
    });

    return { items: merged, unresolved, totalSegments: segments.length };
  },

  /* ────────────────────────────────────────────────
     6) PROJECT DATABASE EXTRACTION from text
     ──────────────────────────────────────────────── */
  extractProject(text) {
    const t = String(text || '');
    const norm = normalizeArabic(t);
    const db = {
      projectNo: '',
      name: '',
      client: '',
      contractor: '',
      consultant: '',
      date: '',
      value: 0,
      found: []
    };
    const grab = (re, key, idx) => {
      const m = norm.match(re);
      if (m) { db[key] = (m[idx || 1] || '').trim(); db.found.push(key); }
    };
    // NOTE: norm is normalizeArabic() output → ة→ه, ى→ي everywhere below
    grab(/(?:رقم\s+المشروع|مشروع\s+رقم|project\s*(?:no\.?|number|#|:))\s*[:#]?\s*([^\n]{2,40})/i, 'projectNo', 1);
    grab(/(?:اسم\s+المشروع|اسم\s+المشروع:|(?<!رقم\s)المشروع\s*[:：]\s*(?![\d]))\s*[:#]?\s*([^\n]{3,60})/i, 'name', 1);
    grab(/(?:الجهه المالكه|صاحب العمل|العميل|المالك|client)\s*[:#]?\s*([^\n]{3,60})/i, 'client', 1);
    grab(/(?:المقاول|contractor)\s*[:#]?\s*([^\n]{3,60})/i, 'contractor', 1);
    grab(/(?:الاستشاري|الاستشاري الهندسي|consultant)\s*[:#]?\s*([^\n]{3,60})/i, 'consultant', 1);
    grab(/(?:التاريخ|تاريخ المشروع|date)\s*[:#]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i, 'date', 1);
    const valM = norm.match(/(?:قيمه\s+المشروع|القيمه|اجمالي\s+المشروع|قيمه\s+العقد|value|total)\s*[:#]?\s*([\d٠-٩,٫.\s]+)/i);
    if (valM) {
      const cleaned = valM[1]
        .replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
        .replace(/[,\s]/g, '');
      const v = parseFloat(cleaned);
      if (!isNaN(v)) { db.value = v; db.found.push('value'); }
    }
    return db;
  },

  /* ────────────────────────────────────────────────
     7) UNIFIED CONTRACT COMPLIANCE REVIEW
     ──────────────────────────────────────────────── */
  complianceReview(items) {
    const ar = (typeof App !== 'undefined') ? App.lang === 'ar' : true;
    const report = { critical: [], warnings: [], info: [], ok: true };

    if (!items || !items.length) {
      report.critical.push(ar ? 'لا توجد بنود للمراجعة' : 'No items to review');
      report.ok = false;
      return report;
    }

    // reuse dependency engine
    const dep = checkDependencies(items);
    dep.missing.forEach(m => report.critical.push(
      (ar ? 'بند ناقص: ' : 'Missing item: ') + m.triggeredByName + ' → ' + (m.missingCodes || []).join(', ')
    ));
    dep.warnings.forEach(w => report.warnings.push(
      (ar ? 'توصية: ' : 'Recommendation: ') + w.triggeredByName + ' — ' + w.reason
    ));

    // quantity sanity — flag extreme values vs UOM
    items.forEach(it => {
      const p = getItemByCode(it.code);
      const q = parseFloat(it.qty) || 0;
      if (!p) { report.critical.push(ar ? 'رمز غير معروف: ' + it.code : 'Unknown code: ' + it.code); report.ok = false; return; }
      if (p.uom === 'M' && q > 50000) report.warnings.push(ar ? 'كمية كبيرة غير منطقية: ' : 'Unreasonable large qty: ' + it.code + ' = ' + q + ' M');
      if (p.uom === 'EA' && q > 5000) report.warnings.push(ar ? 'كمية كبيرة غير منطقية: ' : 'Unreasonable large qty: ' + it.code + ' = ' + q + ' EA');
      if (q < 0.001) { report.warnings.push(ar ? 'كمية صفرية: ' : 'Zero qty: ' + it.code); report.ok = false; }
    });

    // duplicates
    const seen = new Set();
    items.forEach(it => {
      if (seen.has(it.code)) report.warnings.push(ar ? 'بند مكرر: ' : 'Duplicate item: ' + it.code);
      seen.add(it.code);
    });

    if (!report.critical.length && !report.warnings.length) report.info.push(ar ? 'لا توجد مخالفات — المقايسة متوافقة' : 'No issues — BOQ is compliant');
    return report;
  },

  /* ────────────────────────────────────────────────
     8) READ FILE (Excel / CSV / JSON / text)
        Returns { text, rows } where rows is a grid (array of arrays)
        when the file is tabular, so callers can analyse real quantities.
     ──────────────────────────────────────────────── */
  readFile(file) {
    return new Promise((resolve, reject) => {
      const name = (file.name || '').toLowerCase();
      const ar = (typeof App !== 'undefined') ? App.lang === 'ar' : true;
      const reader = new FileReader();
      if (/\.xlsx?$/i.test(name)) {
        if (typeof XLSX === 'undefined') {
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.19.3/dist/xlsx.full.min.js';
          s.onload = () => { reader.readAsArrayBuffer(file); };
          s.onerror = () => reject(new Error(ar ? 'فشل تحميل مكتبة Excel' : 'Excel library failed to load'));
          document.head.appendChild(s);
        } else {
          reader.readAsArrayBuffer(file);
        }
        reader.onload = () => {
          try {
            const wb = XLSX.read(reader.result, { type: 'array' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            const csvText = rows.map(r => r.join(',')).join('\n');
            resolve({ text: csvText, rows });
          } catch (e) { reject(e); }
        };
      } else if (/\.(csv|txt)$/i.test(name)) {
        reader.readAsText(file, 'utf-8');
        reader.onload = () => {
          const text = String(reader.result || '');
          const rows = text.split(/\r?\n/).filter(l => l.trim())
            .map(l => l.split(/[,;\t]/).map(c => c.trim()));
          resolve({ text, rows });
        };
      } else if (/\.json$/i.test(name)) {
        reader.readAsText(file, 'utf-8');
        reader.onload = () => {
          const text = String(reader.result || '');
          let rows = null;
          try {
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
              rows = data.map(o => {
                if (!o || typeof o !== 'object') return [o];
                return Object.keys(o).map(k => o[k]);
              });
            }
          } catch (e) {}
          resolve({ text, rows });
        };
      } else {
        reader.readAsText(file, 'utf-8');
        reader.onload = () => resolve({ text: String(reader.result || ''), rows: null });
      }
      reader.onerror = () => reject(new Error('read error'));
    });
  },

  /* ────────────────────────────────────────────────
     9) TABULAR TAKEOFF — rows grid → BOQ items
        Preserves real quantities (unlike free-text dictation),
        sums duplicates, matches codes against unified prices.
     ──────────────────────────────────────────────── */
  tabularTakeoff(rows) {
    const out = [];
    const unresolved = [];
    const seen = new Map();
    const CODE_KEYS = ['الرمز', 'رمز', 'الكود', 'code', 'Code', 'CODE', 'item code', 'رقم البند', 'بند'];
    const QTY_KEYS = ['الكمية', 'كمية', 'qty', 'Qty', 'QTY', 'quantity', 'الكميه', 'العدد'];
    const norm = v => String(v == null ? '' : v).trim().replace(/^\s*"|"\s*$/g, '');
    const findCol = (headers, keys) => {
      const h = headers.map(x => norm(x).toLowerCase());
      const idx = keys.map(k => h.indexOf(k.toLowerCase())).filter(i => i >= 0);
      return idx.length ? Math.min(...idx) : -1;
    };
    const isCode = v => /^\d{8,9}$/.test(norm(v)) && !!getItemByCode(norm(v));

    const grid = (rows || []).map(r => Array.isArray(r) ? r : String(r).split(/[,;\t]/));
    const hasHeader = grid.length > 0 && (findCol(grid[0], CODE_KEYS) >= 0 || findCol(grid[0], QTY_KEYS) >= 0);

    let ci = 0, qi = -1, start = 0;
    if (hasHeader) {
      ci = findCol(grid[0], CODE_KEYS);
      qi = findCol(grid[0], QTY_KEYS);
      if (ci < 0) ci = 0;
      start = 1;
    }

    for (let i = start; i < grid.length; i++) {
      const parts = grid[i];
      if (!parts || !parts.length) continue;
      const code = norm(parts[ci]);
      if (!code) continue;
      // If the code cell isn't a valid code, search the row for one
      let codeMatch = getItemByCode(code) ? code : null;
      if (!codeMatch) {
        for (const cell of parts) {
          const c = norm(cell);
          if (isCode(c)) { codeMatch = c; break; }
        }
      }
      if (!codeMatch) { unresolved.push(parts.join(' | ')); continue; }

      // Only a real quantity from the qty column is used — never fabricated.
      let qty = null;
      if (qi >= 0 && qi < parts.length) {
        const raw = String(parts[qi]).replace(/[^0-9.,]/g, '').replace(/,/g, '.');
        const v = parseFloat(raw);
        if (!isNaN(v) && v > 0 && v < 1000000) qty = v;
      }
      if (qty == null) { unresolved.push(parts.join(' | ') + ' — no qty'); continue; }

      if (seen.has(codeMatch)) {
        seen.get(codeMatch).qty += qty;
      } else {
        const it = { code: codeMatch, qty, score: 12, matched: parts.join(' | ') };
        seen.set(codeMatch, it);
        out.push(it);
      }
    }
    return { items: out, unresolved, totalSegments: grid.length - start };
  }
};

window.AIEngine = AIEngine;
