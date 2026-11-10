/* ================================================================
   العقد الموحد 2026 — محرك الإنتاجية وتقدير أيام العمل
   Unified Contract 2026 — Productivity & Work-Days Estimation Engine
   ================================================================ */

const ProductivityEngine = {
  /**
   * estimateBOQ(items)
   * items: [{code, qty, contractPrice?, customPrice?}]
   * returns { totalDays, totalLaborCost, items: [{code, qty, costDetails}] }
   */
  estimateBOQ(items) {
    const results = [];
    let totalDays = 0;
    let totalLaborCost = 0;

    (items || []).forEach(itm => {
      const code = String(itm.code || '');
      const prefix = code.slice(0, 3);
      const def = CREW_DEFAULTS[prefix] || CREW_DEFAULTS['101'];
      const qty = parseFloat(itm.qty) || 0;
      const output = def.output > 0 ? def.output : 1;
      const requiredDays = qty / output;
      const laborCost = requiredDays * def.costPerDay;

      results.push({
        code,
        qty,
        costDetails: {
          crewCode: def.crewCode,
          crewNameAr: def.nameAr,
          crewNameEn: def.nameEn,
          outputPerDay: output,
          uom: def.uom,
          requiredDays: Math.round(requiredDays * 10) / 10,
          laborCost: Math.round(laborCost),
        },
      });
      totalDays += requiredDays;
      totalLaborCost += laborCost;
    });

    return {
      totalDays: Math.round(totalDays * 10) / 10,
      totalLaborCost: Math.round(totalLaborCost),
      items: results,
    };
  },
};

window.ProductivityEngine = ProductivityEngine;
