/* Project profitability & execution control — local-first, no API key required. */
(function () {
  'use strict';
  const KEY = 'sec_project_profitability_v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } };
  const write = data => localStorage.setItem(KEY, JSON.stringify(data));
  const n = value => Math.max(0, Number(value) || 0);
  const uid = () => 'project_' + Date.now();

  function pricing(boq) {
    const p = (boq.meta && boq.meta.pricing) || {};
    return { overhead: p.overhead == null ? 5 : n(p.overhead), profit: p.profit == null ? 10 : n(p.profit), contingency: p.contingency == null ? 3 : n(p.contingency) };
  }
  function revenue(boq) {
    const works = (boq.items || []).reduce((sum, item) => {
      const product = typeof getItemByCode === 'function' ? getItemByCode(item.code) : null;
      const unit = item.contractPrice != null ? item.contractPrice : (item.customPrice != null ? item.customPrice : ((product && product.newPrice) || 0));
      return sum + n(item.qty) * n(unit);
    }, 0);
    const p = pricing(boq);
    const overhead = works * p.overhead / 100;
    const profit = (works + overhead) * p.profit / 100;
    const contingency = (works + overhead + profit) * p.contingency / 100;
    return { works, value: works + overhead + profit + contingency, p };
  }
  function initialBudget(boq) {
    const r = revenue(boq).value;
    const p = pricing(boq);
    const direct = r / (1 + p.profit / 100 + p.contingency / 100);
    return { material: direct * .52, labor: direct * .23, equipment: direct * .12, subcontract: direct * .05, indirect: direct * .08 };
  }
  function find(boq) {
    const all = read();
    const id = boq.id || boq._profitabilityId || uid();
    if (!all[id]) all[id] = { id, boqId: boq.id || null, name: (boq.meta && (boq.meta.project || boq.meta.wo)) || 'مشروع جديد', createdAt: new Date().toISOString(), progress: 0, planned: initialBudget(boq), actual: { material: 0, labor: 0, equipment: 0, subcontract: 0, indirect: 0 }, committed: { material: 0, labor: 0, equipment: 0, subcontract: 0, indirect: 0 }, notes: '' };
    write(all); return all[id];
  }
  function sum(obj) { return Object.values(obj || {}).reduce((a, v) => a + n(v), 0); }
  function executionLedger(boq) {
    if (typeof ExecutionWorkspace === 'undefined') return { material: 0, labor: 0, equipment: 0, logistics: 0 };
    const summary = ExecutionWorkspace.summary(boq);
    return summary.costs;
  }
  function metrics(project, boq) {
    const contract = revenue(boq).value;
    const executionCosts = executionLedger(boq);
    const actualByCategory = {
      material: n(project.actual.material) + n(executionCosts.material),
      labor: n(project.actual.labor) + n(executionCosts.labor),
      equipment: n(project.actual.equipment) + n(executionCosts.equipment),
      subcontract: n(project.actual.subcontract),
      indirect: n(project.actual.indirect)
    };
    const actualManual = sum(project.actual);
    const actualExecution = sum(executionCosts);
    const planned = sum(project.planned); const actual = actualManual + actualExecution; const committed = sum(project.committed);
    const progress = Math.min(100, n(project.progress));
    const earned = contract * progress / 100;
    const costToDate = actual + committed;
    const remainingPlan = Math.max(0, planned - actual);
    const eac = actual + committed + Math.max(0, remainingPlan - committed);
    const forecastProfit = contract - eac;
    const margin = contract ? forecastProfit / contract * 100 : 0;
    return { contract, planned, actual, actualManual, actualExecution, actualByCategory, executionCosts, committed, progress, earned, costToDate, remainingPlan, eac, forecastProfit, margin, variance: planned - eac };
  }
  function alerts(project, boq) {
    const m = metrics(project, boq), results = [];
    const cat = { material:'المواد', labor:'العمالة', equipment:'المعدات', subcontract:'المقاولين الباطن', indirect:'المصاريف غير المباشرة' };
    Object.keys(cat).forEach(k => {
      const exposure = n(m.actualByCategory[k]) + n(project.committed[k]); const plan = n(project.planned[k]);
      if (plan && exposure > plan) results.push({ level:'critical', agent:'حارس التكلفة', text:`تجاوز ${cat[k]} للميزانية بنسبة ${Math.round((exposure / plan - 1) * 100)}%.` });
      else if (plan && exposure > plan * .85) results.push({ level:'warning', agent:'وكيل المشتريات', text:`${cat[k]} استهلكت ${Math.round(exposure / plan * 100)}% من الميزانية؛ راجع أوامر الشراء المتبقية.` });
    });
    if (m.progress > 0 && m.costToDate > m.planned * m.progress / 100 * 1.12) results.push({ level:'critical', agent:'محلل الإنتاجية', text:'التكلفة المنفقة تتجاوز الإنجاز الفعلي بأكثر من 12%؛ راجع الإنتاجية والهدر.' });
    if (m.margin < 5) results.push({ level:'critical', agent:'مستشار العقود', text:'هامش الربح المتوقع أقل من 5%؛ يلزم إيقاف التعهدات غير المعتمدة أو إعداد مطالبة تغيير.' });
    else if (m.margin < 10) results.push({ level:'warning', agent:'مستشار العقود', text:'هامش الربح المتوقع تحت حد الحماية 10%؛ لا تعتمد أي تخفيض سعري دون موافقة الإدارة.' });
    if (!results.length) results.push({ level:'ok', agent:'مجلس الوكلاء', text:'المؤشرات ضمن حدود التحكم. استمر في تسجيل التكاليف والالتزامات أولاً بأول.' });
    return results;
  }
  window.ProjectProfitability = {
    get(boq) { return find(boq); }, metrics, alerts,
    update(boq, section, key, value) { const all = read(), p = find(boq); if (section === 'progress') p.progress = Math.min(100, n(value)); else if (p[section]) p[section][key] = n(value); all[p.id] = p; write(all); return p; },
    reset(boq) { const all = read(), p = find(boq); p.planned = initialBudget(boq); p.actual = { material:0,labor:0,equipment:0,subcontract:0,indirect:0 }; p.committed = { material:0,labor:0,equipment:0,subcontract:0,indirect:0 }; p.progress = 0; all[p.id] = p; write(all); return p; }
  };
}());
