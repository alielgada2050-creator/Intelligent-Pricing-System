/* ================================================================
   العقد الموحد 2026 — محرك التصدير (Excel/PDF/CSV/JSON/Measurement)
   Unified Contract 2026 — Export Engine
   ================================================================ */

function _download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 800);
}

function _sheetName(m) {
  return (m && m.project ? m.project : 'BOQ').slice(0, 28).replace(/[\\/:*?"<>|]/g, '_');
}

/* Emergency is a work-order classification, not a blanket price modifier. */
function _priceOf(i) {
  const p = i.priceItem || (typeof getItemByCode === 'function' ? getItemByCode(i.code) : null) || {};
  const base = i.contractPrice != null ? i.contractPrice : (i.customPrice ?? p.newPrice ?? 0);
  return Math.round(base);
}

/* ─────────── CSV ─────────── */
function exportToCSV(boqData, meta) {
  const isEmerg = !!boqData.isEmergency;
  const rows = [['Code', 'Description AR', 'Description EN', 'UOM', 'Qty', 'Unit Price (SAR)', 'Total (SAR)']];
  (boqData.items || []).forEach(i => {
    const p = i.priceItem || (typeof getItemByCode === 'function' ? getItemByCode(i.code) : null) || {};
    const up = _priceOf(i);
    rows.push([i.code, p.arDesc || '', p.enDesc || '', p.uom || '', i.qty, up, up * i.qty]);
  });
  const csv = rows.map(r => r.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  _download(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }), _sheetName(meta) + '.csv');
}

/* ─────────── JSON ─────────── */
function exportToJSON(boqData, meta) {
  const isEmerg = !!boqData.isEmergency;
  const payload = {
    meta: { rfx: '4000083770', wo: meta.wo, project: meta.project, location: meta.location, date: meta.date, emergency: isEmerg, generatedAt: new Date().toISOString() },
    items: (boqData.items || []).map(i => ({ code: i.code, qty: i.qty, unitPrice: _priceOf(i) })),
  };
  _download(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }), _sheetName(meta) + '.json');
}

/* ─────────── XML ─────────── */
function _xmlEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
function exportToXML(boqData, meta) {
  const isEmerg = !!boqData.isEmergency;
  const items = (boqData.items || []).map(i => {
    const p = i.priceItem || (typeof getItemByCode === 'function' ? getItemByCode(i.code) : null) || {};
    return { code: i.code, arDesc: p.arDesc || '', enDesc: p.enDesc || '', uom: p.uom || '', qty: i.qty, unitPrice: _priceOf(i) };
  });
  const sub = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<boq xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <meta>
    <rfx>4000083770</rfx>
    <contractName>Unified Contract 2026 — Saudi Energy Company</contractName>
    <wo>${_xmlEsc(meta.wo || '')}</wo>
    <project>${_xmlEsc(meta.project || '')}</project>
    <location>${_xmlEsc(meta.location || '')}</location>
    <date>${_xmlEsc(meta.date || '')}</date>
    <emergency>${isEmerg}</emergency>
    <generatedAt>${new Date().toISOString()}</generatedAt>
  </meta>
  <items>
${items.map(i => `    <item code="${_xmlEsc(i.code)}" uom="${_xmlEsc(i.uom)}" qty="${i.qty}" unitPrice="${i.unitPrice}">
      <description ar="${_xmlEsc(i.arDesc)}" en="${_xmlEsc(i.enDesc)}"/>
      <total>${Math.round(i.unitPrice * i.qty)}</total>
    </item>`).join('\n')}
  </items>
  <summary>
    <subtotal>${Math.round(sub)}</subtotal>
    <vat>${Math.round(sub * 0.15)}</vat>
    <grandTotal>${Math.round(sub * 1.15)}</grandTotal>
  </summary>
</boq>`;
  _download(new Blob([xml], { type: 'application/xml;charset=utf-8;' }), _sheetName(meta) + '.xml');
}

/* ─────────── EXCEL ─────────── */
function _loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[data-src="' + src + '"]')) {
      const chk = setInterval(() => {
        if (typeof XLSX !== 'undefined') { clearInterval(chk); resolve(); }
      }, 100);
      setTimeout(() => clearInterval(chk), 8000);
      return;
    }
    const s = document.createElement('script');
    s.src = src; s.dataset.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('فشل تحميل مكتبة Excel'));
    document.head.appendChild(s);
  });
}
function exportToExcel(boqData, meta) {
  if (typeof XLSX === 'undefined') {
    toast('جارٍ تحميل مكتبة Excel...', 'success');
    _loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.19.3/dist/xlsx.full.min.js')
      .then(() => exportToExcel(boqData, meta))
      .catch(e => toast(e.message || 'مكتبة Excel غير متاحة', 'error'));
    return;
  }
  const isEmerg = !!boqData.isEmergency;
  const rows = [[meta.wo || '', meta.project || '', meta.location || '', isEmerg ? 'مقايسة طوارئ — أسعار البنود المرجعية' : '']];
  rows.push(['الرمز', 'الوصف', 'الوحدة', 'الكمية', 'السعر (ر.س)', 'الإجمالي (ر.س)']);
  (boqData.items || []).forEach(i => {
    const p = i.priceItem || (typeof getItemByCode === 'function' ? getItemByCode(i.code) : null) || {};
    const up = _priceOf(i);
    rows.push([i.code, (p.arDesc || '') + '\n' + (p.enDesc || ''), p.uom || '', i.qty, up, up * i.qty]);
  });
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 14 }, { wch: 60 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 16 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
  XLSX.writeFile(wb, _sheetName(meta) + '.xlsx');
}

/* ─────────── MEASUREMENT SHEET ─────────── */
function exportMeasurementSheet(boqData, meta) {
  const rows = [['شيت القياس — مقايسة ' + (meta.project || ''), '', '', '', '', '']];
  rows.push(['الرمز', 'الوصف', 'الحساب الهندسي', 'الوحدة', 'الكمية', 'ملاحظات']);
  (boqData.items || []).forEach(i => {
    const p = i.priceItem || (typeof getItemByCode === 'function' ? getItemByCode(i.code) : null) || {};
    rows.push([i.code, p.arDesc || '', '', p.uom || '', i.qty, i.note || '']);
  });
  const csv = rows.map(r => r.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  _download(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }), _sheetName(meta) + '_measurement.csv');
}

/* ─────────── PDF (print view) ─────────── */
function exportToPDF(boqData, meta) {
  const ar = (typeof App !== 'undefined') ? App.lang === 'ar' : true;
  const isEmerg = !!boqData.isEmergency;
  const items = (boqData.items || []).map(i => {
    const p = i.priceItem || (typeof getItemByCode === 'function' ? getItemByCode(i.code) : null) || {};
    return { ...i, arDesc: p.arDesc, enDesc: p.enDesc, uom: p.uom, unitPrice: _priceOf(i) };
  });
  const sub = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const vat = Math.round(sub * 0.15);

  const win = window.open('', '_blank');
  if (!win) { toast(ar ? 'الرجاء السماح بالنوافذ المنبثقة' : 'Please allow popups', 'error'); return; }
  win.document.write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
  <title>${meta.project || 'BOQ'} — مقايسة</title>
  <style>
    * { box-sizing: border-box; font-family: 'Segoe UI', Tahoma, sans-serif; }
    body { padding: 28px; color: #111; }
    h1 { text-align: center; font-size: 20px; margin: 0 0 4px; }
    .sub { text-align: center; color: #555; font-size: 12px; margin-bottom: 18px; }
    .meta { display: flex; justify-content: space-between; border: 1px solid #ccc; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 12px; flex-wrap: wrap; gap: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #bbb; padding: 6px 8px; text-align: right; }
    th { background: #f0f3f5; }
    .tot { text-align: left; font-weight: 700; }
    .grand { font-size: 15px; font-weight: 900; }
    .sig { display: flex; justify-content: space-between; margin-top: 40px; }
    .sig div { text-align: center; font-size: 11px; }
    @media print { body { padding: 10px; } }
  </style></head><body>
    <h1>مقايسة — ${meta.project || ''}</h1>
    <div class="sub">العقد الموحد 2026 • RFx 4000083770 • الشركة السعودية للطاقة</div>
    <div class="meta">
      <span>أمر العمل: <b>${meta.wo || '—'}</b></span>
      <span>الموقع: <b>${meta.location || '—'}</b></span>
      <span>التاريخ: <b>${meta.date || '—'}</b></span>
    </div>
    <table>
      <thead><tr><th>#</th><th>الرمز</th><th>الوصف</th><th>الوحدة</th><th>الكمية</th><th>السعر (ر.س)</th><th>الإجمالي (ر.س)</th></tr></thead>
      <tbody>
        ${items.map((i, idx) => `<tr>
          <td>${idx + 1}</td><td>${i.code}</td><td>${i.arDesc || ''}</td><td>${i.uom || ''}</td>
          <td>${i.qty}</td><td>${i.unitPrice}</td><td>${i.unitPrice * i.qty}</td></tr>`).join('')}
      </tbody>
    </table>
    <div style="margin-top:14px;font-size:12px;">
      <div class="tot">الإجمالي قبل الضريبة: ${Math.round(sub).toLocaleString()} ر.س</div>
      <div class="tot">ضريبة القيمة المضافة (15%): ${vat.toLocaleString()} ر.س</div>
      <div class="tot grand">الإجمالي شامل الضريبة: ${Math.round(sub + vat).toLocaleString()} ر.س</div>
    </div>
    <div class="sig">
      <div>توقيع المقاول<br><br><br>____________</div>
      <div>توقيع المشرف<br><br><br>____________</div>
      <div>ختم SEC<br><br><br>____________</div>
    </div>
    <script>window.print();</script>
  </body></html>`);
  win.document.close();
}
