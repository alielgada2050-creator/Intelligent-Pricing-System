/* ================================================================
   العقد الموحد 2026 — موازن مقايسة (مواد vs أعمال) ومؤشر الجاهزية
   Unified Contract 2026 — BOQ Budget Balancer & Readiness Score
   ================================================================ */

const BudgetBalancer = {
  // Material-heavy vs labor-heavy category mapping
  MATERIAL_CATS: ['equipment', 'meter', 'civil', 'misc'],
  LABOR_CATS: ['cable', 'excavation', 'composite', 'comms', 'survey', 'labor', 'pct'],

  // readiness scoring weights (same basis as index.html display)
  IDEAL_MATERIAL_PCT: 55,
  IDEAL_LABOR_PCT: 45,

  analyze(items) {
    if (!Array.isArray(items) || !items.length) return null;

    let materialTotal = 0;
    let laborTotal = 0;

    items.forEach(itm => {
      const p = getItemByCode(itm.code);
      const unit = itm.customPrice || p?.newPrice || 0;
      const total = unit * (parseFloat(itm.qty) || 0);
      const cat = p?.cat || 'misc';
      if (this.MATERIAL_CATS.includes(cat)) materialTotal += total;
      else laborTotal += total;
    });

    const grand = materialTotal + laborTotal;
    if (grand <= 0) return null;

    const materialPct = Math.round((materialTotal / grand) * 100);
    const laborPct = Math.round((laborTotal / grand) * 100);

    // Readiness: balance closeness to 55/45 + completeness
    const balancePenalty = Math.abs(materialPct - this.IDEAL_MATERIAL_PCT);
    let readiness = 100 - balancePenalty * 1.8;   // balance contributes up to ~90 pts
    readiness = Math.max(0, Math.min(100, Math.round(readiness)));

    return { materialPct, laborPct, readinessScore: readiness };
  },

  run() {
    const ar = (typeof App !== 'undefined') ? App.lang === 'ar' : true;
    const items = (typeof App !== 'undefined' && App.state) ? App.state.boq.items : [];
    if (!items.length) { toast(ar ? 'أضف بنوداً للمقايسة أولاً' : 'Add BOQ items first', 'warning'); return; }

    const bal = this.analyze(items);
    if (!bal) return;

    const deviation = bal.materialPct - this.IDEAL_MATERIAL_PCT;
    const msg = ar
      ? `⚖️ نسبة المواد ${bal.materialPct}% مقابل الأعمال ${bal.laborPct}% (المثالي 55/45) — ${deviation > 8 ? 'المقايسة مائلة للمواد، راجع بنود الأعمال' : deviation < -8 ? 'المقايسة مائلة للأعمال، راجع بنود المواد' : 'النسبة متوازنة ضمن النطاق المقبول'}`
      : `⚖️ Material ${bal.materialPct}% vs Labor ${bal.laborPct}% (ideal 55/45) — ${deviation > 8 ? 'material-heavy, review labor items' : deviation < -8 ? 'labor-heavy, review material items' : 'balanced within acceptable range'}`;

    toast(msg, deviation > 8 || deviation < -8 ? 'warning' : 'success');
  },
};

window.BudgetBalancer = BudgetBalancer;
