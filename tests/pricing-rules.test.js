const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');

function createExportContext() {
  const downloads = [];
  const anchor = { click() {}, remove() {} };
  const document = { body: { appendChild() {} }, createElement: () => anchor };
  const url = {
    createObjectURL(blob) { downloads.push(blob); return 'blob:boq-export'; },
    revokeObjectURL() {}
  };
  const context = {
    document, URL: url, Blob, setTimeout() {},
    getItemByCode: code => code === '802000001'
      ? { code, arDesc: 'نسبة مئوية إضافية للحالات الطارئة', uom: '%', newPrice: 45 }
      : null
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js', 'utils', 'export.js'), 'utf8'), context);
  return { context, downloads };
}

test('emergency classification does not multiply reference item prices', async () => {
  const { context, downloads } = createExportContext();
  context.exportToJSON(
    { isEmergency: true, items: [{ code: '802000001', qty: 1 }] },
    { wo: 'WO-1', project: 'Test', location: '', date: '' }
  );
  const payload = JSON.parse(await downloads[0].text());
  assert.equal(payload.meta.emergency, true);
  assert.equal(payload.items[0].unitPrice, 45);
});

test('zero custom price is preserved and emergency status has no pricing effect', () => {
  const { context } = createExportContext();
  assert.equal(context._priceOf({ code: '802000001', customPrice: 0 }, true), 0);
  assert.equal(context._priceOf({ code: '802000001' }, true), 45);
  assert.equal(context._priceOf({ code: '802000001' }, false), 45);
});

test('engineering AI prompt preserves the contract baseline and avoids blanket emergency uplift claims', () => {
  const context = { CATEGORIES: [], PRICE_LIST: [] };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js', 'ai-engine.js'), 'utf8'), context);
  const prompt = context.AIEngine.buildSystemPrompt('en');
  assert.match(prompt, /never alter the contract baseline/i);
  assert.match(prompt, /Emergency classification never changes/i);
  assert.doesNotMatch(prompt, /Emergency BOQs use 145%|×\s*1\.45|145%/i);
});
