(function () {
  'use strict';
  const KEY = 'sec_field_operations_v1';
  const TYPES = new Set(['execution', 'material', 'labor', 'equipment', 'waste', 'inspection']);
  const MATERIAL_EVENTS = new Set(['required', 'ordered', 'received', 'issued', 'consumed', 'returned', 'damaged']);
  const MATERIAL_SOURCES = new Set(['sec', 'contractor', 'mixed', 'recovered']);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readAll() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { schemaVersion: 1, workOrders: {} };
    const data = JSON.parse(raw);
    if (!data || data.schemaVersion !== 1 || !data.workOrders || typeof data.workOrders !== 'object') {
      throw new Error('سجل العمليات غير صالح؛ أوقفنا الكتابة لحماية البيانات.');
    }
    return data;
  }

  function writeAll(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function text(value, label, maxLength) {
    const result = String(value == null ? '' : value).trim();
    if (result.length > maxLength) throw new Error(`${label}: تجاوز الطول المسموح.`);
    return result;
  }

  function requiredText(value, label, maxLength) {
    const result = text(value, label, maxLength);
    if (!result) throw new Error(`${label}: هذا الحقل مطلوب.`);
    return result;
  }

  function number(value, label, options) {
    const settings = options || {};
    if (value == null || String(value).trim() === '') {
      if (settings.optional) return null;
      throw new Error(`${label}: أدخل قيمة رقمية.`);
    }
    const result = Number(value);
    if (!Number.isFinite(result) || result < 0 || (!settings.zero && result === 0)) {
      throw new Error(`${label}: أدخل رقماً ${settings.zero ? 'صفرياً أو أكبر' : 'أكبر من صفر'}.`);
    }
    return result;
  }

  function optionalCost(value) {
    return number(value, 'التكلفة الفعلية', { optional: true });
  }

  function validateEvidence(cost, evidence) {
    if (cost > 0 && !evidence) {
      throw new Error('أدخل مرجع مستند مؤيد للتكلفة الفعلية.');
    }
  }

  function validDate(value) {
    const result = requiredText(value, 'التاريخ', 10);
    const parsed = new Date(`${result}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result) {
      throw new Error('التاريخ غير صالح.');
    }
    return result;
  }

  function recordId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `op_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  function normalize(boq, input) {
    if (!boq || !boq.id) throw new Error('احفظ المقايسة أولاً لربط سجل التنفيذ بأمر العمل.');
    if (!input || !TYPES.has(input.kind)) throw new Error('نوع سجل العمليات غير معروف.');
    const validCodes = new Set((boq.items || []).map(item => String(item.code)));
    const itemCode = text(input.itemCode, 'رقم البند', 80);
    if (itemCode && !validCodes.has(itemCode)) throw new Error('البند المختار غير موجود في المقايسة المرتبطة.');

    const common = {
      date: validDate(input.date),
      itemCode: itemCode || null,
      site: text(input.site, 'الموقع', 160),
      notes: text(input.notes, 'الملاحظات', 1000)
    };

    if (input.kind === 'execution') {
      return Object.assign(common, {
        kind: input.kind,
        executedQty: number(input.executedQty, 'الكمية المنفذة', { zero: false }),
        unit: text(input.unit, 'الوحدة', 30),
        status: 'recorded'
      });
    }

    if (input.kind === 'inspection') {
      const inspectedQty = number(input.inspectedQty, 'الكمية المفحوصة', { zero: false });
      const acceptedQty = number(input.acceptedQty, 'الكمية المقبولة داخلياً', { zero: true });
      const rejectedQty = number(input.rejectedQty, 'الكمية المرفوضة', { zero: true });
      const reworkQty = number(input.reworkQty, 'كمية إعادة العمل', { zero: true });
      const result = requiredText(input.result, 'نتيجة الفحص', 24);
      if (!['pending', 'accepted', 'partial', 'rejected', 'rework'].includes(result)) throw new Error('نتيجة الفحص غير معروفة.');
      if (acceptedQty + rejectedQty + reworkQty > inspectedQty) throw new Error('مجموع المقبول والمرفوض وإعادة العمل يتجاوز الكمية المفحوصة.');
      if (acceptedQty > 0 && !['accepted', 'partial'].includes(result)) throw new Error('لا تسجل كمية مقبولة مع نتيجة فحص غير مقبولة.');
      if (result === 'accepted' && acceptedQty === 0) throw new Error('أدخل كمية القبول الداخلي أو اختر نتيجة فحص أخرى.');
      return Object.assign(common, {
        kind: input.kind, inspectedQty, acceptedQty, rejectedQty, reworkQty, result,
        findings: text(input.findings, 'ملاحظات الفحص', 1000),
        correctiveAction: text(input.correctiveAction, 'الإجراء التصحيحي', 1000),
        reinspectDate: text(input.reinspectDate, 'تاريخ إعادة الفحص', 10),
        evidenceRef: text(input.evidenceRef, 'مرجع مستند الفحص', 160)
      });
    }

    if (input.kind === 'material') {
      const event = requiredText(input.event, 'حركة المادة', 24);
      const source = requiredText(input.source, 'مصدر المادة', 24);
      if (!MATERIAL_EVENTS.has(event) || !MATERIAL_SOURCES.has(source)) throw new Error('حركة المادة أو مصدرها غير معروف.');
      const actualCost = optionalCost(input.actualCost);
      const evidenceRef = text(input.evidenceRef, 'مرجع الفاتورة أو المستند', 160);
      if (actualCost != null && !['received', 'returned'].includes(event)) throw new Error('سجل تكلفة/رصيد المورد مع حركة استلام أو مرتجع فقط.');
      validateEvidence(actualCost || 0, evidenceRef);
      return Object.assign(common, {
        kind: input.kind, event, source,
        materialCode: text(input.materialCode, 'كود المادة', 80),
        description: requiredText(input.description, 'وصف المادة', 180),
        unit: requiredText(input.unit, 'وحدة المادة', 30),
        qty: number(input.qty, 'كمية المادة', { zero: false }),
        supplier: text(input.supplier, 'المورد', 160),
        orderRef: text(input.orderRef, 'رقم طلب/أمر التوريد', 120),
        storageLocation: text(input.storageLocation, 'موقع التخزين', 160),
        actualCost, evidenceRef
      });
    }

    if (input.kind === 'labor') {
      const workers = number(input.workers, 'عدد أفراد الطاقم', { zero: false });
      if (!Number.isInteger(workers)) throw new Error('عدد أفراد الطاقم يجب أن يكون عدداً صحيحاً.');
      const regularHours = number(input.regularHours, 'ساعات العمل', { zero: true });
      const overtimeHours = number(input.overtimeHours, 'الساعات الإضافية', { zero: true });
      if (regularHours + overtimeHours <= 0) throw new Error('أدخل ساعات عمل فعلية للطاقم.');
      const actualCost = optionalCost(input.actualCost);
      const evidenceRef = text(input.evidenceRef, 'مرجع مستند تكلفة العمالة', 160);
      const outputQty = number(input.outputQty, 'الإنتاج', { optional: true });
      const unit = text(input.unit, 'وحدة الإنتاج', 30);
      if (outputQty != null && !unit) throw new Error('أدخل وحدة قياس الإنتاج.');
      validateEvidence(actualCost || 0, evidenceRef);
      return Object.assign(common, {
        kind: input.kind, crew: requiredText(input.crew, 'اسم/رمز الطاقم', 120),
        trade: text(input.trade, 'التخصص', 120), workers, regularHours, overtimeHours,
        outputQty, unit, actualCost, evidenceRef
      });
    }

    if (input.kind === 'equipment') {
      const operatingHours = number(input.operatingHours, 'ساعات التشغيل', { zero: true });
      const downtimeHours = number(input.downtimeHours, 'ساعات التوقف', { zero: true });
      if (operatingHours + downtimeHours <= 0) throw new Error('أدخل ساعات تشغيل أو توقف فعلية.');
      const costParts = ['fuelCost', 'maintenanceCost', 'hireCost', 'transportCost']
        .map(key => number(input[key], 'تكلفة المعدة', { optional: true }) || 0);
      const actualCost = costParts.reduce((total, value) => total + value, 0);
      const evidenceRef = text(input.evidenceRef, 'مرجع مستند تكلفة المعدة', 160);
      const outputQty = number(input.outputQty, 'الإنتاج', { optional: true });
      const unit = text(input.unit, 'وحدة الإنتاج', 30);
      const ownership = requiredText(input.ownership, 'ملكية المعدة', 24);
      if (!['owned', 'rented'].includes(ownership)) throw new Error('نوع ملكية المعدة غير معروف.');
      if (outputQty != null && !unit) throw new Error('أدخل وحدة قياس الإنتاج.');
      validateEvidence(actualCost, evidenceRef);
      return Object.assign(common, {
        kind: input.kind, asset: requiredText(input.asset, 'المعدة', 120),
        ownership,
        operatingHours, downtimeHours, fuelCost: costParts[0], maintenanceCost: costParts[1],
        hireCost: costParts[2], transportCost: costParts[3], actualCost,
        outputQty, unit,
        breakdownReason: text(input.breakdownReason, 'سبب التوقف', 500), evidenceRef
      });
    }

    const qty = number(input.qty, 'كمية المخلفات الناتجة', { zero: false });
    const hauledQty = number(input.hauledQty, 'الكمية المنقولة', { zero: true });
    if (hauledQty > qty) throw new Error('الكمية المنقولة لا يمكن أن تتجاوز كمية المخلفات المسجلة.');
    const trips = number(input.trips, 'عدد الرحلات', { zero: true });
    const transportCost = number(input.transportCost, 'تكلفة النقل', { optional: true }) || 0;
    const disposalCost = number(input.disposalCost, 'تكلفة التخلص', { optional: true }) || 0;
    const actualCost = transportCost + disposalCost;
    const evidenceRef = text(input.evidenceRef, 'مرجع مستند النقل/التخلص', 160);
    validateEvidence(actualCost, evidenceRef);
    return Object.assign(common, {
      kind: input.kind, wasteType: requiredText(input.wasteType, 'نوع المخلفات', 120),
      qty, hauledQty, unit: requiredText(input.unit, 'وحدة المخلفات', 30), trips,
      vehicle: text(input.vehicle, 'وسيلة النقل', 120),
      capacity: number(input.capacity, 'سعة المركبة', { optional: true }),
      destination: text(input.destination, 'موقع التخلص', 180),
      transportCost, disposalCost, actualCost, evidenceRef
    });
  }

  function list(boqId) {
    if (!boqId) return [];
    const all = readAll();
    const workOrder = all.workOrders[boqId];
    return workOrder ? clone(workOrder.records || []).filter(record => !record.voidedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
  }

  function create(boq, input, actor) {
    const normalized = normalize(boq, input);
    const all = readAll();
    const workOrder = all.workOrders[boq.id] || {
      boqId: boq.id,
      workOrderNo: text(boq.meta && boq.meta.wo, 'رقم أمر العمل', 120),
      project: text(boq.meta && boq.meta.project, 'اسم المشروع', 180),
      records: [],
      audit: []
    };
    const at = new Date().toISOString();
    const record = Object.assign({ id: recordId(), createdAt: at, createdBy: text(actor, 'المستخدم', 120) || 'local-user', voidedAt: null, voidReason: '' }, normalized);
    workOrder.records.push(record);
    workOrder.audit.push({ id: recordId(), recordId: record.id, action: 'created', at, actor: record.createdBy, newValue: clone(record) });
    workOrder.workOrderNo = text(boq.meta && boq.meta.wo, 'رقم أمر العمل', 120);
    workOrder.project = text(boq.meta && boq.meta.project, 'اسم المشروع', 180);
    workOrder.updatedAt = at;
    all.workOrders[boq.id] = workOrder;
    writeAll(all);
    return clone(record);
  }

  function archive(boqId, id, reason, actor) {
    const all = readAll();
    const workOrder = all.workOrders[boqId];
    const record = workOrder && workOrder.records.find(item => item.id === id && !item.voidedAt);
    if (!record) throw new Error('السجل غير موجود أو سبق إلغاؤه.');
    const note = requiredText(reason, 'سبب الإلغاء', 300);
    const at = new Date().toISOString();
    const oldValue = clone(record);
    record.voidedAt = at;
    record.voidReason = note;
    workOrder.audit.push({
      id: recordId(), recordId: record.id, action: 'voided', at,
      actor: text(actor, 'المستخدم', 120) || 'local-user',
      oldValue, newValue: clone(record)
    });
    workOrder.updatedAt = at;
    writeAll(all);
  }

  function summary(boq) {
    const records = list(boq && boq.id);
    const result = {
      recordCount: records.length, executionCount: 0, materialCount: 0, laborCount: 0,
      equipmentCount: 0, wasteCount: 0, inspectionCount: 0, executedQty: 0,
      inspectedQty: 0, acceptedQty: 0, rejectedQty: 0, reworkQty: 0,
      costs: { material: 0, labor: 0, equipment: 0, logistics: 0 },
      uncostedMaterialReceipts: 0, uncostedLaborLogs: 0, uncostedEquipmentLogs: 0,
      hauledWasteQty: 0, generatedWasteQty: 0, materials: {}, byItem: {}
    };
    records.forEach(record => {
      if (record.itemCode) result.byItem[record.itemCode] = result.byItem[record.itemCode] || { executedQty: 0, acceptedQty: 0 };
      if (record.kind === 'execution') {
        result.executionCount++;
        result.executedQty += record.executedQty;
        if (record.itemCode) result.byItem[record.itemCode].executedQty += record.executedQty;
      } else if (record.kind === 'inspection') {
        result.inspectionCount++;
        result.inspectedQty += record.inspectedQty;
        result.acceptedQty += record.acceptedQty;
        result.rejectedQty += record.rejectedQty;
        result.reworkQty += record.reworkQty;
        if (record.itemCode) result.byItem[record.itemCode].acceptedQty += record.acceptedQty;
      } else if (record.kind === 'material') {
        result.materialCount++;
        const key = [record.materialCode, record.description, record.unit, record.source].join('|');
        const balance = result.materials[key] || {
          materialCode: record.materialCode, description: record.description, unit: record.unit,
          source: record.source, required: 0, ordered: 0, received: 0, issued: 0,
          consumed: 0, returned: 0, damaged: 0, balance: 0, supplier: record.supplier
        };
        balance[record.event] += record.qty;
        balance.balance = balance.received - balance.consumed - balance.damaged;
        if (record.event === 'received' && record.actualCost != null) result.costs.material += record.actualCost;
        if (record.event === 'received' && record.actualCost == null && ['contractor', 'mixed'].includes(record.source)) result.uncostedMaterialReceipts++;
        if (record.event === 'returned' && record.actualCost != null) result.costs.material -= record.actualCost;
        if (record.supplier) balance.supplier = record.supplier;
        result.materials[key] = balance;
      } else if (record.kind === 'labor') {
        result.laborCount++;
        result.costs.labor += record.actualCost || 0;
        if (record.actualCost == null || (record.actualCost === 0 && record.regularHours + record.overtimeHours > 0)) result.uncostedLaborLogs++;
      } else if (record.kind === 'equipment') {
        result.equipmentCount++;
        result.costs.equipment += record.actualCost;
        if (record.actualCost === 0 && record.operatingHours + record.downtimeHours > 0) result.uncostedEquipmentLogs++;
      } else if (record.kind === 'waste') {
        result.wasteCount++;
        result.generatedWasteQty += record.qty;
        result.hauledWasteQty += record.hauledQty;
        result.costs.logistics += record.actualCost;
      }
    });
    result.unhauledWasteQty = Math.max(0, result.generatedWasteQty - result.hauledWasteQty);
    result.totalRecordedCost = Object.values(result.costs).reduce((sum, amount) => sum + amount, 0);
    return result;
  }

  window.ExecutionWorkspace = {
    storageKey: KEY,
    create,
    list,
    archive,
    summary,
    audit(boqId) {
      const workOrder = readAll().workOrders[boqId];
      return workOrder ? clone(workOrder.audit || []).sort((a, b) => a.at.localeCompare(b.at)) : [];
    }
  };
}());
