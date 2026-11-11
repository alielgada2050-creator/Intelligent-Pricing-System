/* ================================================================
   العقد الموحد 2026 — التكامل مع أنظمة ERP (Odoo / SAP / CSV)
   Unified Contract 2026 — ERP Integration Module
   ================================================================ */

const ERPIntegration = {
  _mappedRows(items) {
    return (items || []).map(itm => {
      const p = itm.priceItem || getItemByCode(itm.code) || {};
      const unit = itm.contractPrice != null ? itm.contractPrice : (itm.customPrice != null ? itm.customPrice : (p.newPrice != null ? p.newPrice : null));
      return {
        code: itm.code,
        name: p.arDesc || '',
        uom: p.uom || '',
        qty: itm.qty,
        unitPrice: unit,
        total: unit == null ? null : Math.round(unit * itm.qty),
      };
    });
  },

  _download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 800);
  },

  /* ─── Odoo product import staging CSV; not a live Odoo connection ─── */
  exportToOdoo(project, items) {
    const rows = [['External ID', 'Name', 'Description', 'Internal Reference', 'Product Category', 'Sale Price', 'Cost', 'UoM', 'Type']];
    this._mappedRows(items).forEach(r => {
      rows.push([
        `sec_boq_${r.code}`,
        r.name.slice(0, 80),
        r.name,
        r.code,
        '',
        r.unitPrice == null ? '' : r.unitPrice,
        '',
        r.uom,
        'service',
      ]);
    });
    const csv = rows.map(row => row.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    this._download(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }), `Odoo_BOQ_${project.replace(/[^\w\- ]+/g, '_')}.csv`);
  },

  /* ─── SAP CSV (classic material master / BOQ upload) ─── */
  exportToSAP(project, items) {
    const rows = [['MATERIAL', 'MATERIAL_DESCRIPTION', 'QTY', 'UOM', 'UNIT_PRICE', 'CURRENCY', 'TOTAL', 'WBSELEMENT']];
    this._mappedRows(items).forEach(r => {
      rows.push([r.code, r.name, r.qty, r.uom, r.unitPrice, 'SAR', r.total, 'WBS-SEC-2026']);
    });
    const csv = rows.map(row => row.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    this._download(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }), `SAP_BOQ_${project.replace(/[^\w\- ]+/g, '_')}.csv`);
  },

  /* ─── Generic BOQ upload CSV ─── */
  exportToGeneric(project, items) {
    const rows = [['code', 'description', 'uom', 'qty', 'unit_price_sar', 'total_sar']];
    this._mappedRows(items).forEach(r => {
      rows.push([r.code, r.name, r.uom, r.qty, r.unitPrice, r.total]);
    });
    const csv = rows.map(row => row.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
    this._download(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }), `BOQ_${project.replace(/[^\w\- ]+/g, '_')}.csv`);
  },
};

window.ERPIntegration = ERPIntegration;
