/* ================================================================
   العقد الموحد 2026 — محلل ملفات PDF وتركيب البنود
   Unified Contract 2026 — PDF Analyzer & Item Matcher
   (Uses pdf.js global: pdfjsLib)
   ================================================================ */

function _pdfToast(msg, type) { if (typeof toast === 'function') toast(msg, type); }

function _loadPdfJs() {
  return new Promise((resolve, reject) => {
    if (typeof pdfjsLib !== 'undefined') return resolve();
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('pdf.js failed to load'));
    document.head.appendChild(s);
  });
}

function _loadTesseract() {
  return new Promise((resolve, reject) => {
    if (typeof Tesseract !== 'undefined') return resolve();
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@4.1.4/dist/tesseract.min.js';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Tesseract OCR failed to load'));
    document.head.appendChild(s);
  });
}

/* OCR support for scanned PDFs: render each page to a canvas and run Tesseract.
   Returns recognized text, or null when OCR could not run (e.g. offline). */
async function _ocrPdf(pdf) {
  let worker = null;
  try {
    await _loadTesseract();
    worker = await Tesseract.createWorker('ara+eng');
    let out = '';
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport }).promise;
      const r = await worker.recognize(canvas);
      out += ((r && r.data && r.data.text) || '') + '\n';
    }
    return out;
  } catch (e) {
    return null;
  } finally {
    if (worker && worker.terminate) { try { await worker.terminate(); } catch (e) {} }
  }
}

async function _extractPdfText(file) {
  if (typeof pdfjsLib === 'undefined') await _loadPdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = '';
  let totalChars = 0;
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const pt = content.items.map(it => it.str).join(' ') + '\n';
    text += pt;
    totalChars += pt.length;
  }
  // Scanned PDFs have (almost) no text layer → render pages and OCR them
  const avg = pdf.numPages ? totalChars / pdf.numPages : 0;
  if (avg < 40) {
    const isAr = (typeof App !== 'undefined') ? App.lang === 'ar' : true;
    const ocr = await _ocrPdf(pdf);
    if (ocr == null) throw new Error(isAr ? 'مكتبة التعرف الضوئي OCR لم تُحمّل — تحقق من اتصال الإنترنت' : 'OCR library failed to load — check your internet connection');
    if (ocr.length > text.length) text = ocr;
  }
  return text;
}

/* Extract the quantity that actually appears on the line (never fabricate one).
   Returns a number or null when no quantity is present. */
function _extractLineQty(line, code) {
  const code9 = String(code || '').replace(/\D/g, '');
  // 1) number followed by a unit token (م، متر، كم، EA، NO، SET، عدد...)
  const unitRe = /(\d+(?:[.,]\d+)?)\s*(?:م|متر|مترا|امتار|كم|كيلومتر|EA|NO|SYS|SET|KIT|عدد|وحده|وحدة)\b/gi;
  const units = [];
  let m;
  while ((m = unitRe.exec(line)) !== null) units.push(parseFloat(m[1].replace(',', '.')));
  if (units.length) return units[units.length - 1];
  // 2) trailing pure number that is not the item code and not another 9-digit code
  const nums = (line.match(/(\d+(?:[.,]\d+)?)/g) || [])
    .map(n => parseFloat(n.replace(',', '.')))
    .filter(n => isFinite(n) && n > 0 && n < 1000000
      && Math.round(n).toString() !== code9
      && !/^\d{9}$/.test(Math.round(n).toString()));
  if (nums.length) return nums[nums.length - 1];
  return null;
}

/* Best-effort matching: try item code tokens first, then keyword scoring.
   IMPORTANT: only quantities that actually exist in the file are returned —
   lines without a quantity are skipped, never defaulted to 1. */
function _matchLines(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const found = [];
  const skipped = [];
  const seen = new Set();

  lines.forEach(line => {
    const codeMatch = line.match(/\b(\d{9})\b/);
    if (codeMatch) {
      const it = getItemByCode(codeMatch[1]);
      if (it && !seen.has(it.code)) {
        const qty = _extractLineQty(line, codeMatch[1]);
        if (qty == null) { skipped.push(line); return; }
        seen.add(it.code);
        found.push({ code: it.code, qty, source: 'pdf' });
        return;
      }
    }
    // keyword fallback — only when a real quantity is present on the line
    const q = normalizeArabic(line).toLowerCase();
    const hit = PRICE_LIST.find(it => it.arNorm && q.includes(it.arNorm.slice(0, 18)));
    if (hit && !seen.has(hit.code)) {
      const qty = _extractLineQty(line, '');
      if (qty == null) { skipped.push(line); return; }
      seen.add(hit.code);
      found.push({ code: hit.code, qty, source: 'pdf' });
    }
  });

  return { items: found, skipped };
}

function renderPDFAnalyzer(container) {
  const ar = (typeof App !== 'undefined') ? App.lang === 'ar' : true;
  container.innerHTML = `
    <div class="card">
      <div class="card-head" style="background:linear-gradient(90deg,rgba(0,132,61,0.06),transparent);border-bottom:1px solid var(--border);">
        <span>🤖</span>
        <span class="card-title">${ar ? 'محلل ملفات PDF وتحليل المقايسات' : 'PDF Analyzer & BOQ Extraction'}</span>
        <span style="margin-${ar?'right':'left'}:auto;font-size:10.5px;color:var(--text-muted);">${ar ? 'استخراج بيانات المشروع + الجداول + المطابقة مع الأسعار الموحدة' : 'Project data + tables + unified-price matching'}</span>
      </div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:14px;">
        <div id="pdf-drop" style="border:2px dashed var(--border-sec);border-radius:var(--r-md);padding:30px 16px;text-align:center;cursor:pointer;transition:all .2s;background:var(--bg-surface);">
          <div style="font-size:34px;margin-bottom:8px;">📄</div>
          <div style="font-weight:800;color:var(--text-h);font-size:14px;">${ar ? 'اسحب ملف PDF هنا أو انقر للاختيار' : 'Drop a PDF here or click to browse'}</div>
          <div style="font-size:11px;color:var(--text-sub);margin-top:6px;">${ar ? 'يدعم ملفات المقايسات النصية والمسح الضوئي (OCR)' : 'Supports text & scanned (OCR) BOQ PDFs'}</div>
          <input type="file" id="pdf-file-input" accept="application/pdf,.pdf" style="display:none;">
        </div>
        <div id="pdf-progress" style="display:none;text-align:center;font-size:12px;color:var(--text-sub);"></div>
        <div id="pdf-results" style="display:none;"></div>
      </div>
    </div>
  `;

  const drop = container.querySelector('#pdf-drop');
  const input = container.querySelector('#pdf-file-input');
  const prog = container.querySelector('#pdf-progress');
  const res = container.querySelector('#pdf-results');

  drop.addEventListener('click', () => input.click());
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.borderColor = 'var(--sec-primary)'; });
  drop.addEventListener('dragleave', () => { drop.style.borderColor = 'var(--border-sec)'; });
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.style.borderColor = 'var(--border-sec)';
    if (e.dataTransfer.files[0]) _handle(e.dataTransfer.files[0]);
  });
  input.addEventListener('change', () => { if (input.files[0]) _handle(input.files[0]); });

  async function _handle(file) {
    prog.style.display = 'block';
    prog.textContent = ar ? '⏳ جارٍ قراءة الملف واستخراج البنود...' : 'Reading file & extracting items...';
    try {
      const text = await _extractPdfText(file);
      const parsed = _matchLines(text);
      const items = parsed.items;
      const skipped = parsed.skipped || [];
      if (!items.length) throw new Error(ar ? 'لم يتم العثور على بنود بكميات محددة في الملف' : 'No items with explicit quantities found');

      prog.style.display = 'none';
      res.style.display = 'block';

      // 1) Structured project data card
      let projectCard = '';
      if (typeof AIEngine !== 'undefined' && typeof AIEngine.extractProject === 'function') {
        const db = AIEngine.extractProject(text);
        if (db.found.length) {
          const row = (l, v) => `<div style="padding:8px 10px;background:var(--bg-surface);border-radius:var(--r-sm);border:1px solid var(--border);">
            <div style="font-size:9px;color:var(--text-muted);font-weight:700;">${l}</div>
            <div style="font-size:12px;font-weight:700;color:var(--text-h);">${v || '—'}</div></div>`;
          projectCard = `
            <div class="card" style="margin-bottom:10px;border:1px solid rgba(200,168,75,0.2);">
              <div class="card-head" style="background:linear-gradient(90deg,rgba(200,168,75,0.06),transparent);border-bottom:1px solid var(--border);">
                <span>🏗️</span><span class="card-title" style="font-size:12.5px;">${ar ? 'بيانات المشروع المستخلصة' : 'Extracted Project Data'}</span>
              </div>
              <div class="card-body" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:7px;">
                ${row(ar ? 'رقم المشروع' : 'Project No.', db.projectNo)}
                ${row(ar ? 'اسم المشروع' : 'Name', db.name)}
                ${row(ar ? 'الجهة المالكة' : 'Client', db.client)}
                ${row(ar ? 'المقاول' : 'Contractor', db.contractor)}
                ${row(ar ? 'الاستشاري' : 'Consultant', db.consultant)}
                ${row(ar ? 'التاريخ' : 'Date', db.date)}
                ${row(ar ? 'القيمة' : 'Value', db.value ? fmtNum(db.value) + ' ' + (ar ? 'ر.س' : 'SAR') : '—')}
              </div>
            </div>`;
        }
      }

      // 2) Compliance review
      let complianceCard = '';
      if (typeof AIEngine !== 'undefined' && typeof AIEngine.complianceReview === 'function') {
        const rep = AIEngine.complianceReview(items);
        const tag = (t, c) => `<span style="display:inline-block;padding:3px 9px;border-radius:99px;font-size:10px;font-weight:800;${c};">${t}</span>`;
        complianceCard = `
          <div class="card" style="margin-bottom:10px;border:1px solid var(--border-sec);">
            <div class="card-head" style="border-bottom:1px solid var(--border);">
              <span>🛡️</span><span class="card-title" style="font-size:12.5px;">${ar ? 'مطابقة العقد الموحد' : 'Unified Contract Compliance'}</span>
              <span style="margin-${ar?'right':'left'}:auto;display:flex;gap:5px;">
                ${tag(rep.critical.length + ' ' + (ar?'حرج':'critical'), 'background:rgba(229,72,77,0.12);color:#e5484d;')}
                ${tag(rep.warnings.length + ' ' + (ar?'تنبيه':'warn'), 'background:rgba(255,169,0,0.12);color:#ffa900;')}
              </span>
            </div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:5px;max-height:180px;overflow-y:auto;">
              ${rep.critical.map(m=>`<div style="font-size:11px;color:#e5484d;padding:3px 0;border-bottom:1px dashed var(--border);">🔴 ${m}</div>`).join('')}
              ${rep.warnings.map(m=>`<div style="font-size:11px;color:#ffa900;padding:3px 0;border-bottom:1px dashed var(--border);">🟡 ${m}</div>`).join('')}
              ${(!rep.critical.length && !rep.warnings.length) ? `<div style="font-size:11px;color:var(--sec-primary);">✅ ${ar?'لا توجد مخالفات':'No issues found'}</div>` : ''}
            </div>
          </div>`;
      }

      res.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
          <div style="font-weight:800;color:var(--text-h);font-size:13px;">✅ ${ar ? 'تم التعرف على' : 'Recognized'} ${items.length} ${ar ? 'بنداً بكميات محددة' : 'items with explicit qty'}${skipped.length ? ` <span style="font-size:10px;color:var(--sec-gold);font-weight:700;">(${ar ? 'تم تجاهل' : 'skipped'} ${skipped.length} ${ar ? 'سطراً بدون كمية' : 'lines without qty'})</span>` : ''}</div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-gold btn-sm" onclick="App.addAnalyzedItems(${JSON.stringify(items).replace(/"/g, '&quot;')})">${ar ? '➕ إضافة للمقايسة' : '➕ Add to BOQ'}</button>
          </div>
        </div>
        ${projectCard}
        ${complianceCard}
        <div style="display:flex;flex-direction:column;gap:5px;max-height:360px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--r-sm);padding:8px;background:var(--bg-surface);">
          ${items.map(i => {
            const p = getItemByCode(i.code);
            return `<div style="display:flex;justify-content:space-between;gap:10px;font-size:11.5px;padding:5px 8px;border-bottom:1px solid var(--border);">
              <span style="font-family:var(--font-mono);color:var(--sec-gold);">${i.code}</span>
              <span style="flex:1;color:var(--text-main);">${p ? p.arDesc.slice(0, 60) : i.code}</span>
              <span style="color:var(--text-sub);">${i.qty}</span>
            </div>`;
          }).join('')}
        </div>
      `;
      _pdfToast(ar ? `✅ تم استخراج ${items.length} بند من الملف` : `✅ Extracted ${items.length} items`, 'success');
    } catch (err) {
      prog.style.display = 'none';
      _pdfToast(ar ? 'فشل تحليل الملف: ' + err.message : 'PDF analysis failed: ' + err.message, 'error');
    }
  }
}

window.renderPDFAnalyzer = renderPDFAnalyzer;
