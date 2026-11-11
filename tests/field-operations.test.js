const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'utils', 'field-operations.js'), 'utf8');

function createWorkspace(initialValue) {
  const values = new Map(initialValue ? [['sec_field_operations_v1', initialValue]] : []);
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
  const window = {};
  vm.runInNewContext(source, { window, localStorage, crypto: { randomUUID: () => `id-${Math.random()}` } });
  return { api: window.ExecutionWorkspace, values };
}

const boq = {
  id: 'boq-1',
  meta: { wo: 'WO-1', project: 'Test work order' },
  items: [{ code: 'ITEM-1', qty: 100 }]
};
const common = { date: '2026-11-12', itemCode: 'ITEM-1', site: 'Riyadh', notes: '' };

test('links execution and internal inspections to BOQ quantities without conflating them', () => {
  const { api } = createWorkspace();
  api.create(boq, { ...common, kind: 'execution', executedQty: '24', unit: 'm' }, 'field-user');
  api.create(boq, {
    ...common, kind: 'inspection', inspectedQty: '12', acceptedQty: '10',
    rejectedQty: '1', reworkQty: '1', result: 'partial'
  }, 'reviewer');
  const summary = api.summary(boq);
  assert.equal(summary.executedQty, 24);
  assert.equal(summary.inspectedQty, 12);
  assert.equal(summary.acceptedQty, 10);
  assert.equal(summary.byItem['ITEM-1'].executedQty, 24);
  assert.equal(summary.byItem['ITEM-1'].acceptedQty, 10);
  assert.equal(api.audit(boq.id).length, 2);
});

test('tracks procurement quantities and excludes undocumented SEC material costs', () => {
  const { api } = createWorkspace();
  const input = {
    ...common, kind: 'material', event: 'received', source: 'sec',
    materialCode: 'MAT-1', description: 'Cable', unit: 'm', qty: '50',
    actualCost: '1500', supplier: '', orderRef: '', storageLocation: '', evidenceRef: ''
  };
  assert.throws(() => api.create(boq, input), /مرجع مستند/);
  api.create(boq, { ...input, actualCost: '', evidenceRef: '' });
  api.create(boq, { ...input, event: 'consumed', actualCost: '', evidenceRef: '' });
  const summary = api.summary(boq);
  assert.equal(summary.costs.material, 0);
  assert.equal(Object.values(summary.materials)[0].received, 50);
  assert.equal(Object.values(summary.materials)[0].consumed, 50);
  assert.equal(Object.values(summary.materials)[0].balance, 0);
});

test('requires documentary evidence for actual resource and logistics costs', () => {
  const { api } = createWorkspace();
  const labor = {
    ...common, kind: 'labor', crew: 'TEAM-1', trade: 'Civil', workers: '4',
    regularHours: '8', overtimeHours: '1', outputQty: '20', unit: 'm',
    actualCost: '500', evidenceRef: ''
  };
  assert.throws(() => api.create(boq, labor), /مرجع مستند/);
  const equipment = {
    ...common, kind: 'equipment', asset: 'EX-01', ownership: 'rented',
    operatingHours: '6', downtimeHours: '2', fuelCost: '100',
    maintenanceCost: '', hireCost: '300', transportCost: '',
    outputQty: '20', unit: 'm', breakdownReason: '', evidenceRef: 'INV-1'
  };
  api.create(boq, equipment);
  const waste = {
    ...common, kind: 'waste', wasteType: 'Excavation spoil', qty: '10',
    hauledQty: '12', unit: 'm3', trips: '1', vehicle: 'Truck',
    capacity: '10', destination: 'Approved site', transportCost: '',
    disposalCost: '', evidenceRef: ''
  };
  assert.throws(() => api.create(boq, waste), /تتجاوز/);
  const summary = api.summary(boq);
  assert.equal(summary.costs.equipment, 400);
  assert.equal(summary.uncostedEquipmentLogs, 0);
});

test('summarizes evidenced labor and reports costs that are not known', () => {
  const { api } = createWorkspace();
  api.create(boq, {
    ...common, kind: 'labor', crew: 'TEAM-2', trade: 'Electrical',
    workers: '3', regularHours: '8', overtimeHours: '0',
    outputQty: '18', unit: 'm', actualCost: '', evidenceRef: ''
  });
  const summary = api.summary(boq);
  assert.equal(summary.uncostedLaborLogs, 1);
  assert.equal(summary.costs.labor, 0);
});

test('validates dates, item linkage, and internal inspection totals', () => {
  const { api } = createWorkspace();
  assert.throws(() => api.create(boq, { ...common, date: '2026-02-31', kind: 'execution', executedQty: '1', unit: 'm' }), /التاريخ/);
  assert.throws(() => api.create(boq, { ...common, itemCode: 'UNKNOWN', kind: 'execution', executedQty: '1', unit: 'm' }), /غير موجود/);
  assert.throws(() => api.create(boq, {
    ...common, kind: 'inspection', inspectedQty: '4', acceptedQty: '3',
    rejectedQty: '2', reworkQty: '0', result: 'partial'
  }), /يتجاوز/);
  assert.equal(api.list(boq.id).length, 0);
});

test('voids a record without deleting its original audit snapshot', () => {
  const { api } = createWorkspace();
  const record = api.create(boq, { ...common, kind: 'execution', executedQty: '5', unit: 'm' }, 'supervisor');
  api.archive(boq.id, record.id, 'Duplicate entry', 'reviewer');
  assert.equal(api.list(boq.id).length, 0);
  const audit = api.audit(boq.id);
  assert.equal(audit.length, 2);
  assert.equal(audit[1].oldValue.executedQty, 5);
  assert.equal(audit[1].newValue.voidReason, 'Duplicate entry');
});

test('refuses to write into a malformed operation store', () => {
  const { api } = createWorkspace('{not-json');
  assert.throws(() => api.list(boq.id), error => error.name === 'SyntaxError');
});
