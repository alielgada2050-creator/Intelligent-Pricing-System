// ════════════════════════════════════════════════════════════════
//  SENews — مركز أخبار شركة الطاقة (Saudi Energy) والمشاريع
//  مشاريع · تقنيات · مستجدات (تحديث أسبوعي) + مركز المشاريع
//  + قوائم الإجراءات والاحترازات (بنية تحتية / أوامر عمل)
// ════════════════════════════════════════════════════════════════
window.SENews = (function () {
  'use strict';

  var KEY = 'se_news_v1';

  var OFFICIAL = 'https://www.se.com.sa/';
  var NEWS_URL = 'https://www.se.com.sa/en/News/CorporateNews';
  var ANNOUNCE_URL = 'https://www.se.com.sa/en/Investors/Column1/Announcements/Company-Announcements';
  var RIPI_URL = 'https://www.ripc.gov.sa/ar';
  var GEMINI_URL = 'https://gemini.google.com/gem/1ZWAMoRV6YmsVOrBaflmFUQKmod6mgZIo?usp=sharing';

  var CATS = {
    projects: { ar: '🏗️ مشاريع', en: '🏗️ Projects' },
    tech: { ar: '💡 تقنيات', en: '💡 Technologies' },
    updates: { ar: '📢 مستجدات', en: '📢 Updates' }
  };

  /* ── مخزون (محتوى مقرر يعمل بدون إنترنت + روابط رسمية) ── */
  function seed() {
    return [
      { id: 's1', cat: 'updates', title: 'إطلاق الهوية الجديدة «Saudi Energy» للشركة السعودية للكهرباء', desc: 'أطلقت الشركة هويتها المؤسسية الجديدة وأعلنت إعادة تسميتها إلى شركة الطاقة السعودية (Saudi Energy) ضمن استراتيجية التحول، مع هوية موحدة لأعمال التوليد والنقل والتوزيع.', date: '2026-02-25', source: 'se.com.sa', link: OFFICIAL },
      { id: 's2', cat: 'projects', title: 'تسهيلات تمويلية 16 مليار ريال لدعم مشاريع الشبكات', desc: 'أعلنت الشركة عن الحصول على اتفاقية تمويل (مرابحة) بقيمة 16 مليار ريال سعودي لتمويل خطط التوسع في شبكات النقل والتوزيع ومشاريع البنية التحتية الكهربائية.', date: '', source: 'se.com.sa', link: ANNOUNCE_URL },
      { id: 's3', cat: 'tech', title: 'تشغيل الشبكات بالتحليل التنبؤي والعدادات الذكية', desc: 'توسع نطاق تقنيات التشغيل الذكي: العدادات الذكية، أتمتة التوزيع، والتحليل التنبؤي لرفع كفاءة الصيانة وتقليل زمن الانقطاعات في شبكات توزيع الطاقة.', date: '', source: 'se.com.sa', link: OFFICIAL },
      { id: 's4', cat: 'projects', title: 'مشاريع البنية التحتية الكهربائية للمخططات الجديدة', desc: 'ربط المخططات السكنية والتجارية الجديدة بشبكة التوزيع يتطلب موافقات تصاميم وحفريات مسارات الكابلات وترحيل المخلفات وفق الاشتراطات، وتُدار أوامر العمل عبر مركز المشاريع.', date: '', source: 'se.com.sa', link: NEWS_URL },
      { id: 's5', cat: 'tech', title: 'المركبات الكهربائية وشحنها: تجهيز الشبكات', desc: 'مستجدات توسعة شبكات الشحن والتجهيزات المرتبطة بتزايد المركبات الكهربائية، ورفع قدرة المحولات والكابلات في المناطق المستهدفة.', date: '', source: 'se.com.sa', link: OFFICIAL },
      { id: 's6', cat: 'updates', title: 'النتائج المالية وبرنامج الشركة', desc: 'نتائج الربع الأول واستمرار النمو التشغيلي مدفوعاً بتحسن الإيرادات والطلب على الطاقة. تابعوا إعلانات الشركة الرسمية للمستجدات.', date: '', source: 'se.com.sa', link: ANNOUNCE_URL }
    ];
  }

  /* ── أخبار مشتريات البنية التحتية (RIPI) ── */
  function ripSeed() {
    return [
      { id: 'r1', cat: 'projects', title: 'مناقصات البنية التحتية: توريد وتنفيذ', desc: 'يطرح مركز مشتريات البنية التحتية مناقصات توريد وتنفيذ لمشاريع الطرق والشبكات والمرافق وفق آليات الشفافية والمنافسة، وتُدار عبر بوابته الرسمية.', date: '', source: 'ripc.gov.sa', link: RIPI_URL },
      { id: 'r2', cat: 'updates', title: 'المركز يسجّل منصة موحدة للمشتريات', desc: 'أتمتة دورة المشتريات من الإعلان عن الفرصة حتى الترسية والمتابعة، مع تصنيف الموردين وتقييم الأداء لرفع كفاءة الإنفاق الرأسمالي.', date: '', source: 'ripc.gov.sa', link: RIPI_URL },
      { id: 'r3', cat: 'projects', title: 'فرص استثمارية لمشاريع البنية التحتية', desc: 'إتاحة فرص استثمارية وتشاركية في مشاريع البنية التحتية الكبرى، مع اشتراطات التأهيل والالتزام بمعايير الكود السعودي للمباني.', date: '', source: 'ripc.gov.sa', link: RIPI_URL },
      { id: 'r4', cat: 'tech', title: 'رقمنة العقود والترسيات الإلكترونية', desc: 'اعتماد التوقيع الإلكتروني والتوثيق الرقمي للعقود والترسيات، وتسريع المدفوعات والمطالبات عبر الربط مع الأنظمة الحكومية.', date: '', source: 'ripc.gov.sa', link: RIPI_URL }
    ];
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }

  function state() {
    var s = load();
    if (!s.items || !s.items.length) s.items = seed();
    if (!s.ripItems || !s.ripItems.length) s.ripItems = ripSeed();
    s.custom = s.custom || [];
    s.project = s.project || [];
    s.safety = s.safety || { checked: [] };
    if (s.safety && !s.safety._total) { var n = 0; SAFETY.forEach(function (g) { n += g.items.length; }); s.safety._total = n; }
    s.lastUpdate = s.lastUpdate || null;
    save(s);
    return s;
  }

  var _area = null, _app = null, _tab = 'energy', _cat = 'all', _src = 'all';
  function ar() { return _app ? (_app.lang === 'ar') : true; }
  function t(a, e) { return ar() ? a : e; }
  function fmtDate(iso) {
    if (!iso) return '—';
    try { return new Date(iso).toLocaleDateString(ar() ? 'ar-SA' : 'en-US'); } catch (e) { return iso; }
  }
  function daysSince(iso) {
    if (!iso) return 999;
    try { return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); } catch (e) { return 999; }
  }

  /* ── الواجهة الرئيسية ── */
  function render(area, App) {
    _area = area; _app = App;
    var s = state();
    var d = daysSince(s.lastUpdate);
    var weekly = d <= 7;
    var sName = ar() ? 'شركة الطاقة السعودية (Saudi Energy)' : 'Saudi Energy Company (SE)';

    area.innerHTML =
      '<div class="card" style="border-color:rgba(0,102,204,0.18);overflow:hidden;margin-top:16px;">'
      + '<div class="card-head" style="background:linear-gradient(135deg,rgba(0,102,204,0.12),rgba(0,214,138,0.05));">'
      + '<span>📡</span><span class="card-title">' + t('مركز أخبار الطاقة والمشاريع', 'Energy & Projects News Center') + '</span>'
      + '<span class="badge ' + (weekly ? 'badge-ok' : 'badge-warning') + '" style="font-size:9px;" id="senews-weekly">' + (weekly ? '✅ ' + t('تحديث أسبوعي', 'Weekly updated') : '⚠️ ' + t('يحتاج تحديثاً أسبوعياً', 'Needs weekly refresh')) + '</span>'
      + '</div>'
      + '<div class="card-body">'
      + '<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-bottom:12px;">'
      + '<div style="font-size:11px;color:var(--text-sub);">' + t('المصدر الرسمي:', 'Official source:') + ' <b style="color:var(--se-blue);">' + sName + '</b> · ' + t('آخر تحديث:', 'Last update:') + ' <b id="senews-last">' + fmtDate(s.lastUpdate) + '</b></div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;">'
      + '<button class="btn btn-primary btn-sm" onclick="SENews.refreshWeekly()">🔄 ' + t('تحديث أسبوعي', 'Weekly Refresh') + '</button>'
      + '<button class="btn btn-gold btn-sm" onclick="SENews.toggleAdd()">➕ ' + t('إضافة خبر', 'Add News') + '</button>'
      + '<button class="btn btn-outline btn-sm" onclick="window.open(\'' + NEWS_URL + '\',\'_blank\')">🌐 ' + t('SE', 'SE') + '</button>'
      + '<button class="btn btn-outline btn-sm" onclick="window.open(\'' + RIPI_URL + '\',\'_blank\')">🏛️ ' + t('مشتريات البنية التحتية', 'Infrastructure Procurement') + '</button>'
      + '<button class="btn btn-outline btn-sm" onclick="window.open(\'' + GEMINI_URL + '\',\'_blank\')">✨ ' + t('مركز المشتريات الذكي', 'Smart Procurement Center') + '</button>'
      + '</div></div>'

      + '<div id="senews-add" style="display:none;background:var(--bg-surface);border:1px dashed var(--border-sec);border-radius:var(--r-lg);padding:12px;margin-bottom:12px;">'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;">'
      + '<input class="form-control" id="senews-title" placeholder="' + t('عنوان الخبر...', 'News title...') + '" style="font-size:12px;">'
      + '<select class="form-control" id="senews-cat" style="font-size:12px;">'
      + '<option value="projects">' + t('مشاريع', 'Projects') + '</option><option value="tech">' + t('تقنيات', 'Technologies') + '</option><option value="updates">' + t('مستجدات', 'Updates') + '</option>'
      + '</select>'
      + '<select class="form-control" id="senews-src" style="font-size:12px;"><option value="se.com.sa">' + t('مصدر SE', 'SE source') + '</option><option value="ripc.gov.sa">' + t('مصدر RIPI', 'RIPI source') + '</option></select>'
      + '<input class="form-control" id="senews-link" placeholder="' + t('رابط المصدر (اختياري)', 'Source link (optional)') + '" style="font-size:12px;">'
      + '</div>'
      + '<textarea class="form-control" id="senews-desc" rows="2" placeholder="' + t('وصف الخبر...', 'Description...') + '" style="font-size:12px;margin-top:8px;"></textarea>'
      + '<div style="margin-top:8px;"><button class="btn btn-primary btn-sm" onclick="SENews.addNews()">💾 ' + t('حفظ', 'Save') + '</button> <button class="btn btn-outline btn-sm" onclick="SENews.toggleAdd()">' + t('إلغاء', 'Cancel') + '</button></div>'
      + '</div>'

      + '<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">'
      + tabBtn('energy', '⚡ ' + t('أخبار الطاقة', 'Energy News'))
      + tabBtn('project', '🏗️ ' + t('مركز المشاريع', 'Project Center'))
      + tabBtn('center', '🏛️ ' + t('مشتريات البنية التحتية', 'Infrastructure Procurement'))
      + tabBtn('safety', '🛡️ ' + t('الإجراءات والاحترازات', 'Procedures & Precautions'))
      + '</div>'
      + '<div id="senews-body"></div>'
      + '</div></div>';

    draw();
  }

  function tabBtn(key, label) {
    return '<button class="btn btn-sm ' + (_tab === key ? 'btn-primary' : 'btn-outline') + '" onclick="SENews.setTab(\'' + key + '\')">' + label + '</button>';
  }

  function draw() {
    var body = document.getElementById('senews-body');
    if (!body) return;
    if (_tab === 'energy') drawEnergy(body);
    else if (_tab === 'project') drawProject(body);
    else if (_tab === 'center') drawCenter(body);
    else drawSafety(body);
  }

  /* ═══ أخبار الطاقة ═══ */
  function drawEnergy(body) {
    var s = state();
    var items = s.items.concat(s.custom, s.ripItems);
    var chips = ['all', 'projects', 'tech', 'updates'].map(function (c) {
      return '<button class="btn btn-sm ' + (_cat === c ? 'btn-gold' : 'btn-outline') + '" onclick="SENews.filterCat(\'' + c + '\')">' + (c === 'all' ? t('الكل', 'All') : CATS[c][ar() ? 'ar' : 'en']) + '</button>';
    }).join('');
    var srcChips = ['all', 'se', 'rip'].map(function (sc) {
      var lbl = sc === 'all' ? t('كل المصادر', 'All sources') : sc === 'se' ? '⚡ SE' : '🏛️ RIPI';
      return '<button class="btn btn-sm ' + (_src === sc ? 'btn-primary' : 'btn-ghost') + '" onclick="SENews.filterSrc(\'' + sc + '\')">' + lbl + '</button>';
    }).join('');
    var list = items.filter(function (i) {
      if (_cat !== 'all' && i.cat !== _cat) return false;
      if (_src === 'se' && i.source && i.source.indexOf('rip') >= 0) return false;
      if (_src === 'rip' && (!i.source || i.source.indexOf('rip') < 0)) return false;
      return true;
    });
    var cards = list.length ? list.map(function (i) {
      return '<div style="background:var(--bg-surface);border:1px solid var(--border-sec);border-radius:var(--r-lg);padding:12px;display:flex;gap:10px;align-items:flex-start;">'
        + '<div style="font-size:18px;line-height:1;">' + (CATS[i.cat] ? (ar() ? CATS[i.cat].ar : CATS[i.cat].en).split(' ')[0] : '📰') + '</div>'
        + '<div style="flex:1;min-width:0;">'
        + '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;">'
        + '<div style="font-size:12.5px;font-weight:800;color:var(--text-h);">' + (i.title || '—') + '</div>'
        + '<div style="font-size:10px;color:var(--text-muted);white-space:nowrap;">' + (i.date || fmtDate(i.added)) + '</div></div>'
        + '<div style="font-size:11px;color:var(--text-sub);line-height:1.55;margin-top:4px;">' + (i.desc || '') + '</div>'
        + '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">'
        + '<span class="badge" style="font-size:8.5px;">' + (CATS[i.cat] ? (ar() ? CATS[i.cat].ar : CATS[i.cat].en) : i.cat) + '</span>'
        + '<span class="badge" style="font-size:8.5px;background:' + (i.source && i.source.indexOf('rip') >= 0 ? 'rgba(200,168,75,0.1);color:var(--sec-gold)' : 'rgba(14,165,233,0.1);color:var(--se-blue)') + ';">' + (i.source && i.source.indexOf('rip') >= 0 ? 'RIPI' : 'SE') + '</span>'
        + (i.link ? '<button class="btn btn-outline btn-sm" style="font-size:10px;padding:2px 8px;" onclick="window.open(\'' + i.link + '\',\'_blank\')">🔗 ' + t('المصدر', 'Source') + '</button>' : '')
        + (i.id && i.id.charAt(0) === 'c' ? '<button class="btn btn-danger btn-sm" style="font-size:10px;padding:2px 8px;" onclick="SENews.delNews(\'' + i.id + '\')">🗑️</button>' : '')
        + '</div></div></div>';
    }).join('') : '<div class="empty-state" style="padding:22px;"><div class="empty-icon">📭</div><p style="font-size:12px;">' + t('لا أخبار في هذا القسم', 'No news in this section') + '</p></div>';
    body.innerHTML = '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;align-items:center;">' + chips + '<span style="opacity:.35;font-size:10px;">|</span>' + srcChips + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;">' + cards + '</div>';
  }

  /* ═══ مركز مشتريات البنية التحتية (RIPI) ═══ */
  function drawCenter(body) {
    var s = state();
    var rip = s.ripItems.concat(s.custom.filter(function (i) { return i.source && i.source.indexOf('rip') >= 0; }));
    var cards = rip.length ? rip.map(function (i) {
      return '<div style="background:var(--bg-surface);border:1px solid var(--border-sec);border-radius:var(--r-lg);padding:12px;display:flex;gap:10px;align-items:flex-start;">'
        + '<div style="font-size:18px;line-height:1;">🏛️</div>'
        + '<div style="flex:1;min-width:0;">'
        + '<div style="font-size:12.5px;font-weight:800;color:var(--text-h);">' + (i.title || '—') + '</div>'
        + '<div style="font-size:11px;color:var(--text-sub);line-height:1.55;margin-top:4px;">' + (i.desc || '') + '</div>'
        + '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;">'
        + '<span class="badge" style="font-size:8.5px;background:rgba(200,168,75,0.1);color:var(--sec-gold);">RIPI</span>'
        + '<button class="btn btn-outline btn-sm" style="font-size:10px;padding:2px 8px;" onclick="window.open(\'' + RIPI_URL + '\',\'_blank\')">🔗 ' + t('المناقصات', 'Tenders') + '</button>'
        + '</div></div></div>';
    }).join('') : '<div class="empty-state" style="padding:22px;"><div class="empty-icon">🏛️</div><p style="font-size:12px;">' + t('لا أخبار مشتريات حالياً', 'No procurement news yet') + '</p></div>';

    body.innerHTML =
      '<div style="background:linear-gradient(135deg,rgba(200,168,75,0.1),rgba(139,92,246,0.08),var(--bg-surface));border:1px solid rgba(200,168,75,0.3);border-radius:var(--r-lg);padding:16px;margin-bottom:12px;display:flex;gap:14px;align-items:center;flex-wrap:wrap;">'
      + '<div style="width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,#C8A84B,#8B5CF6);display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 5px 16px rgba(200,168,75,0.3);">🏛️</div>'
      + '<div style="flex:1;min-width:220px;">'
      + '<div style="font-size:13.5px;font-weight:900;color:var(--text-h);">' + t('مركز مشتريات البنية التحتية', 'Infrastructure Procurement Center') + '</div>'
      + '<div style="font-size:10.5px;color:var(--text-sub);line-height:1.55;margin-top:3px;">' + t('لوحة متكاملة لمتابعة المناقصات والفرص والمشتريات المرتبطة بمشاريع الطاقة والبنية التحتية، مع مساعد ذكي لتحليل الفرص وإعداد العروض وفق الكود السعودي.', 'Integrated panel to track tenders, opportunities & procurement for energy & infrastructure projects, with an AI assistant to analyze opportunities & prepare bids per Saudi code.') + '</div>'
      + '</div>'
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;">'
      + '<button class="btn btn-primary btn-sm" onclick="window.open(\'' + GEMINI_URL + '\',\'_blank\')">✨ ' + t('افتح المركز الذكي (Gemini)', 'Open Smart Center (Gemini)') + '</button>'
      + '<button class="btn btn-gold btn-sm" onclick="window.open(\'' + RIPI_URL + '\',\'_blank\')">🏛️ ' + t('المنصة الرسمية', 'Official Portal') + '</button>'
      + '</div>'
      + '</div>'
      + '<div style="font-size:11px;font-weight:800;color:var(--sec-gold);margin-bottom:8px;">📢 ' + t('مستجدات المشتريات والفرص', 'Procurement news & opportunities') + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;">' + cards + '</div>';
  }

  /* ═══ مركز المشاريع (أوامر عمل / بنية تحتية) ═══ */
  function drawProject(body) {
    var s = state();
    var rows = s.project.slice().reverse();
    var list = rows.length ? rows.map(function (p) {
      var st = p.status || 'draft';
      var badge = st === 'done' ? 'badge-ok' : st === 'executing' ? 'badge-warning' : 'badge-medium';
      var label = st === 'done' ? t('منجز', 'Done') : st === 'executing' ? t('قيد التنفيذ', 'Executing') : st === 'approved' ? t('معتمد', 'Approved') : t('مفتوح', 'Open');
      return '<div style="background:var(--bg-surface);border:1px solid var(--border-sec);border-radius:var(--r-lg);padding:12px;display:flex;gap:10px;align-items:flex-start;">'
        + '<div style="font-size:17px;">🛠️</div>'
        + '<div style="flex:1;min-width:0;">'
        + '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;">'
        + '<div style="font-size:12.5px;font-weight:800;color:var(--text-h);">' + (p.title || t('أمر عمل', 'Work order')) + '</div>'
        + '<span class="badge ' + badge + '" style="font-size:8.5px;">' + label + '</span></div>'
        + (p.wo ? '<div style="font-size:10px;color:var(--se-blue);font-weight:700;margin-top:2px;">WO: ' + p.wo + '</div>' : '')
        + '<div style="font-size:11px;color:var(--text-sub);line-height:1.55;margin-top:4px;">' + (p.desc || '') + '</div>'
        + '<div style="font-size:10px;color:var(--text-muted);margin-top:6px;">📅 ' + (p.date || fmtDate(p.added)) + '</div>'
        + '</div></div>';
    }).join('') : '<div class="empty-state" style="padding:22px;"><div class="empty-icon">🏗️</div><p style="font-size:12px;">' + t('سجّل أوامر العمل والمستجدات للبنية التحتية هنا', 'Log infrastructure work orders & updates here') + '</p></div>';

    body.innerHTML =
      '<div style="background:var(--bg-surface);border:1px solid var(--border-sec);border-radius:var(--r-lg);padding:12px;margin-bottom:12px;">'
      + '<div style="font-size:12px;font-weight:800;margin-bottom:8px;">➕ ' + t('تسجيل تحديث / أمر عمل جديد', 'Log new work order / update') + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;">'
      + '<input class="form-control" id="senews-wo" placeholder="' + t('رقم أمر العمل', 'Work Order No.') + '" style="font-size:12px;">'
      + '<select class="form-control" id="senews-wost" style="font-size:12px;"><option value="open">' + t('مفتوح', 'Open') + '</option><option value="approved">' + t('معتمد', 'Approved') + '</option><option value="executing">' + t('قيد التنفيذ', 'Executing') + '</option><option value="done">' + t('منجز', 'Done') + '</option></select>'
      + '</div>'
      + '<input class="form-control" id="senews-ptitle" placeholder="' + t('عنوان التحديث (مثال: مد كابلات وسطية - مخطط 1234)', 'Update title (e.g. MV cable laying — Scheme 1234)') + '" style="font-size:12px;margin-top:8px;">'
      + '<textarea class="form-control" id="senews-pdesc" rows="2" placeholder="' + t('التفاصيل: الموقع، الحفر، الترنش، الأسفلت، الترحيل...', 'Details: location, excavation, trench, asphalt, disposal...') + '" style="font-size:12px;margin-top:8px;"></textarea>'
      + '<div style="margin-top:8px;"><button class="btn btn-primary btn-sm" onclick="SENews.addWorkOrder()">💾 ' + t('حفظ', 'Save') + '</button></div>'
      + '</div>'
      + '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;">' + list + '</div>';
  }

  /* ═══ الإجراءات والاحترازات ═══ */
  var SAFETY = [
    { g: t('قبل بدء العمل', 'Before work'), items: [
      { k: 'permit', l: t('الحصول على إذن العمل (Work Permit) وتصريح الحفر من الجهة المختصة', 'Obtain Work Permit & excavation permit from the authority') },
      { k: 'utility', l: t('مراجعة مخططات الخدمات الأرضية وتحديد مواقع الكابلات قبل الحفر', 'Review underground utilities drawings & locate cables before digging') },
      { k: 'notify', l: t('إبلاغ غرفة العمليات ومراجعة أوامر العمل القائمة قبل البدء', 'Notify control room & review open work orders before start') },
      { k: 'sign', l: t('تجهيز لافتات وسواتر تحذيرية حول منطقة العمل', 'Prepare warning signs & barriers around the work zone') }
    ]},
    { g: t('السلامة الكهربائية', 'Electrical safety'), items: [
      { k: 'isolate', l: t('فصل التيار والتحقق من انعدام الجهد (صفر) قبل العمل', 'Isolate supply & verify zero voltage before working') },
      { k: 'test', l: t('اختبار الجهد وتركيب التأريض المؤقت قبل لمس الكابلات', 'Test voltage & install temporary earthing before touching cables') },
      { k: 'ppe', l: t('ارتداء معدات الوقاية الشخصية (خوذة، سترة، قفازات عازلة، أحذية)', 'Wear PPE (helmet, vest, insulating gloves, safety shoes)') },
      { k: 'distance', l: t('عدم الحفر الميكانيكي قرب الكابلات دون مسافة الأمان', 'No mechanical digging near cables outside safe distance') }
    ]},
    { g: t('أثناء التنفيذ', 'During execution'), items: [
      { k: 'trench', l: t('تدعيم جوانب الحفريات عند العمق ≥ 1.2م وممرات آمنة للمشاة', 'Support trench walls at depth ≥ 1.2 m & safe pedestrian walkways') },
      { k: 'barriers', l: t('إغلاق الحفريات بأسوار وتحذيرات عاكسة ليلاً', 'Close excavations with barriers & reflective night warnings') },
      { k: 'backfill', l: t('الردم والدفان طبقات مع الدك حسب المواصفات', 'Backfill in compacted layers per specification') },
      { k: 'house', l: t('مراقبة استقرار جوانب الحفر وعدم تراكم المخلفات بالطرق', 'Monitor trench stability & keep roads free of debris') }
    ]},
    { g: t('التسليم والإغلاق', 'Handover & closeout'), items: [
      { k: 'restore', l: t('إعادة السطح (بلاط/أسفلت) وإزالة المخلفات (الترحيل)', 'Restore surface (tiles/asphalt) & remove debris (disposal)') },
      { k: 'report', l: t('رفع تقرير الإنجاز اليومي وتحديث المخططات', 'Submit daily progress report & update drawings') },
      { k: 'inspect', l: t('معاينة نهائية مع مشرف الشركة وإغلاق إذن العمل', 'Final inspection with company supervisor & close the permit') }
    ]}
  ];

  function drawSafety(body) {
    var s = state();
    var checked = s.safety.checked || [];
    var groups = SAFETY.map(function (g) {
      return '<div style="margin-bottom:10px;"><div style="font-size:12px;font-weight:800;color:var(--sec-gold);margin-bottom:6px;">🛡️ ' + g.g + '</div>'
        + g.items.map(function (it) {
          var on = checked.indexOf(it.k) >= 0;
          return '<label style="display:flex;align-items:flex-start;gap:8px;background:var(--bg-surface);border:1px solid var(--border-sec);border-radius:var(--r-md);padding:8px 10px;margin-bottom:6px;cursor:pointer;">'
            + '<input type="checkbox" style="margin-top:2px;accent-color:var(--sec-primary);" ' + (on ? 'checked' : '') + ' onchange="SENews.toggleSafe(\'' + it.k + '\', this.checked)">'
            + '<span style="font-size:11.5px;color:' + (on ? 'var(--sec-primary)' : 'var(--text-sub)') + ';line-height:1.5;' + (on ? 'text-decoration:line-through;text-decoration-color:rgba(0,132,61,0.4);' : '') + '">' + it.l + '</span></label>';
        }).join('') + '</div>';
    }).join('');
    var done = checked.length, total = SAFETY.reduce(function (a, g) { return a + g.items.length; }, 0);
    body.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">'
      + '<div style="flex:1;min-width:180px;"><div style="font-size:11px;color:var(--text-sub);margin-bottom:4px;">' + t('الالتزام بالاحترازات', 'Precautions compliance') + ' — ' + done + ' / ' + total + '</div>'
      + '<div style="background:rgba(0,132,61,0.12);border-radius:99px;height:8px;overflow:hidden;"><div style="height:100%;width:' + Math.round(done / total * 100) + '%;background:linear-gradient(90deg,var(--sec-primary),var(--accent-gold));border-radius:99px;transition:width .3s;"></div></div></div>'
      + '<button class="btn btn-outline btn-sm" onclick="SENews.resetSafety()">↺ ' + t('إعادة تعيين', 'Reset') + '</button>'
      + '</div>' + groups;
  }

  /* ═══ إجراءات ═══ */
  function setTab(k) { _tab = k; _cat = 'all'; _src = 'all'; refresh(); }
  function filterCat(c) { _cat = c; refresh(); }
  function filterSrc(sc) { _src = sc; refresh(); }
  function refresh() {
    var body = document.getElementById('senews-body');
    if (!body) return;
    // update tab buttons
    ['energy', 'project', 'center', 'safety'].forEach(function (k) {
      var b = body.previousElementSibling;
      if (b) b.querySelectorAll('button').forEach(function (btn) {
        if (btn.textContent.indexOf(k === 'energy' ? '⚡' : k === 'project' ? '🏗️' : k === 'center' ? '🏛️' : '🛡️') >= 0) btn.className = 'btn btn-sm ' + (_tab === k ? 'btn-primary' : 'btn-outline');
      });
    });
    draw();
  }

  function toggleAdd() {
    var el = document.getElementById('senews-add');
    if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
  }

  function addNews() {
    var title = (document.getElementById('senews-title') || {}).value;
    var cat = (document.getElementById('senews-cat') || {}).value || 'updates';
    var src = (document.getElementById('senews-src') || {}).value || 'se.com.sa';
    var link = (document.getElementById('senews-link') || {}).value;
    var desc = (document.getElementById('senews-desc') || {}).value;
    if (!title.trim()) { if (typeof toast === 'function') toast(t('أدخل عنوان الخبر', 'Enter a title'), 'warning'); return; }
    var s = state();
    s.custom.unshift({ id: 'c' + Date.now(), cat: cat, title: title.trim(), desc: desc.trim(), link: link.trim() || null, date: new Date().toISOString().slice(0, 10), added: Date.now(), source: src, srcLabel: src === 'ripc.gov.sa' ? 'RIPI' : 'SE' });
    save(s);
    toggleAdd();
    filterCat(_cat);
  }
  function delNews(id) {
    var s = state();
    s.custom = s.custom.filter(function (i) { return i.id !== id; });
    save(s); refresh();
  }
  function addWorkOrder() {
    var wo = (document.getElementById('senews-wo') || {}).value;
    var st = (document.getElementById('senews-wost') || {}).value || 'open';
    var title = (document.getElementById('senews-ptitle') || {}).value;
    var desc = (document.getElementById('senews-pdesc') || {}).value;
    if (!title.trim() && !wo.trim()) { if (typeof toast === 'function') toast(t('أدخل عنواناً أو رقم أمر العمل', 'Enter a title or WO no.'), 'warning'); return; }
    var s = state();
    s.project.push({ id: 'p' + Date.now(), wo: wo.trim() || '', status: st, title: title.trim(), desc: desc.trim(), date: new Date().toISOString().slice(0, 10), added: Date.now() });
    save(s); refresh();
  }
  function toggleSafe(k, on) {
    var s = state();
    s.safety.checked = s.safety.checked || [];
    if (on && s.safety.checked.indexOf(k) < 0) s.safety.checked.push(k);
    if (!on) s.safety.checked = s.safety.checked.filter(function (x) { return x !== k; });
    save(s); refresh();
  }
  function resetSafety() {
    var s = state();
    s.safety.checked = []; save(s); refresh();
  }

  /* ═══ التحديث الأسبوعي ═══ */
  function refreshWeekly() {
    var s = state();
    var doMark = function (reachable) {
      s.lastUpdate = new Date().toISOString();
      save(s);
      var wl = document.getElementById('senews-last');
      if (wl) wl.textContent = fmtDate(s.lastUpdate);
      var wb = document.getElementById('senews-weekly');
      if (wb) { wb.className = 'badge badge-ok'; wb.textContent = '✅ ' + t('تم التحديث الأسبوعي', 'Weekly refresh done'); }
      if (typeof toast === 'function') toast(reachable ? t('تم التحقق من الموقع الرسمي وتحديث التاريخ', 'Official site reachable & date updated') : t('تم تحديث التاريخ أسبوعياً (الجلب المباشر محجوب CORS)', 'Weekly date updated (direct fetch blocked by CORS)'), reachable ? 'success' : 'info');
      refresh();
    };
    var reached = false;
    var urls = [OFFICIAL, NEWS_URL];
    var i = 0;
    (function next() {
      if (i >= urls.length) { doMark(reached); return; }
      var u = urls[i++];
      try {
        fetch(u, { mode: 'no-cors', cache: 'no-store' }).then(function () { reached = true; doMark(reached); }).catch(function () { next(); });
      } catch (e) { next(); }
    })();
  }

  return {
    render: render, refresh: refresh,
    setTab: setTab, filterCat: filterCat, filterSrc: filterSrc, toggleAdd: toggleAdd, addNews: addNews, delNews: delNews,
    addWorkOrder: addWorkOrder, toggleSafe: toggleSafe, resetSafety: resetSafety, refreshWeekly: refreshWeekly
  };
})();
