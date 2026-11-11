const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'utils', 'erp-integration.js'), 'utf8');

function createIntegration() {
  const downloads = [];
  const anchor = { click() {}, remove() {} };
  const document = { body: { appendChild() {} }, createElement: () => anchor };
  const url = {
    createObjectURL(blob) { downloads.push(blob); return 'blob:odoo-export'; },
    revokeObjectURL() {}
  };
  const window = {};
  vm.runInNewContext(source, {
    window, document, URL: url, Blob, setTimeout() {},
    getItemByCode: code => code === 'ITEM-1'
      ? { code, arDesc: 'بند تجريبي', uom: 'm', newPrice: 90 }
      : null
  });
  return { api: window.ERPIntegration, downloads };
}

test('preserves explicit zero prices and does not invent a missing reference rate', () => {
  const { api } = createIntegration();
  const rows = api._mappedRows([
    { code: 'ITEM-1', qty: 2, customPrice: 0 },
    { code: 'UNKNOWN', qty: 3 }
  ]);
  assert.equal(rows[0].unitPrice, 0);
  assert.equal(rows[0].total, 0);
  assert.equal(rows[1].unitPrice, null);
  assert.equal(rows[1].total, null);
  assert.equal(rows[1].uom, '');
});

test('Odoo staging export leaves purchase cost blank and does not connect to Odoo', async () => {
  const { api, downloads } = createIntegration();
  api.exportToOdoo('WO-1', [{ code: 'ITEM-1', qty: 2, contractPrice: 77 }]);
  assert.equal(downloads.length, 1);
  const csv = await downloads[0].text();
  assert.match(csv, /"Sale Price","Cost","UoM","Type"/);
  assert.match(csv, /"77","","m","service"/);
  assert.doesNotMatch(csv, /"77","77"/);
});
