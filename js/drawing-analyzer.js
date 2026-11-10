/* ================================================================
   العقد الموحد 2026 — Digital Field Survey & Sketch System
   Professional drawing analyzer: upload images/PDFs, trace routes,
   auto-calculate quantities, generate BOQ, export reports.
   ================================================================ */

const DrawingAnalyzer = {
  _state: null,

  CATS: {
    lv_cable:   { id:'lv_cable',   ar:'كابل جهد منخفض',   en:'LV Cable',       code:(sz)=> sz && sz>185 ? '304010102' : '304010101', uom:'M',  trace:true,  color:'#0a7d3b', icon:'🔵' },
    mv_cable:   { id:'mv_cable',   ar:'كابل جهد متوسط',   en:'MV Cable',       code:(sz)=> sz && sz>185 ? '304010202' : '304010201', uom:'M',  trace:true,  color:'#8b5cf6', icon:'🔴' },
    hv_cable:   { id:'hv_cable',   ar:'كابل جهد عالي',    en:'HV Cable (33kV)',code:()=> '304010202',                             uom:'M',  trace:true,  color:'#dc2626', icon:'🟣' },
    fiber:      { id:'fiber',      ar:'كابل فايبر',       en:'Fiber Optic',    code:()=> '304010301',                             uom:'M',  trace:true,  color:'#f97316', icon:'🟠' },
    pipe:       { id:'pipe',       ar:'مواسير PVC',       en:'PVC Pipe',       code:()=> '302010001',                             uom:'M',  trace:true,  color:'#1d6ff2', icon:'🔵' },
    road:       { id:'road',       ar:'أسفلت / طريق',     en:'Asphalt / Road', code:()=> '301030006',                             uom:'M2', trace:true,  color:'#7a5c2e', icon:'⬛' },
    excavation: { id:'excavation', ar:'حفر مفتوح',        en:'Open Excavation',code:()=> '301010101',                             uom:'M',  trace:true,  color:'#d97706', icon:'🟤' },
    trench:     { id:'trench',     ar:'حفرية (خندق)',     en:'Trench',         code:()=> '301010105',                             uom:'M',  trace:true,  color:'#b45309', icon:'🟫' },
    street_light:{ id:'street_light',ar:'إنارة شوارع',    en:'Street Light',   code:()=> '603000034',                             uom:'EA', trace:false, color:'#eab308', icon:'💡' },
    pole:       { id:'pole',       ar:'عمود إنارة',       en:'Lighting Pole',  code:()=> '603000034',                             uom:'EA', trace:false, color:'#e5484d', icon:'🔴' },
    manhole:    { id:'manhole',    ar:'غرفة تفتيش',       en:'Manhole',        code:()=> '603000034',                             uom:'EA', trace:false, color:'#111827', icon:'⬛' },
    handhole:   { id:'handhole',   ar:'حفرة يد',          en:'Handhole',       code:()=> '603000034',                             uom:'EA', trace:false, color:'#6b7280', icon:'⬜' },
    cabinet:    { id:'cabinet',    ar:'خزانة / صندوق',    en:'Cabinet/Box',    code:()=> '603000034',                             uom:'EA', trace:false, color:'#0891b2', icon:'🔷' },
    ss:         { id:'ss',         ar:'محطة جهد',         en:'Substation (SS)',code:()=> '603000034',                             uom:'EA', trace:false, color:'#dc2626', icon:'🏭' },
    rmu:        { id:'rmu',        ar:'وحدة توزيع',       en:'RMU',            code:()=> '603000034',                             uom:'EA', trace:false, color:'#7c3aed', icon:'🔌' },
    feeder:     { id:'feeder',     ar:'عمود تغذية',       en:'Feeder Pillar',  code:()=> '603000034',                             uom:'EA', trace:false, color:'#2563eb', icon:'📦' },
  },

  CABLE_COLORS: {
    '4Cx70':    { color:'#93c5fd', label:'4Cx70mm²' },
    '4Cx185':   { color:'#86efac', label:'4Cx185mm²' },
    '4Cx300':   { color:'#d1d5db', label:'4Cx300mm²' },
    '4Cx500':   { color:'#fbbf24', label:'4Cx500mm²' },
    '1Cx800':   { color:'#c084fc', label:'1Cx800mm²' },
  },

  _cat(id) { return this.CATS[id] || null; },

  _ar() { return typeof App !== 'undefined' && App.lang === 'ar'; },

  /* ─── MAIN RENDER ─── */
  renderDrawingAnalyzer(container) {
    const ar = this._ar();
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:16px;animation:pageFade 0.25s ease;">
        <!-- Header -->
        <div class="card" style="border:1px solid var(--border-sec);">
          <div class="card-head" style="background:linear-gradient(90deg,rgba(139,92,246,0.08),transparent);border-bottom:1px solid var(--border);">
            <span style="font-size:16px;">📐</span>
            <span class="card-title">${ar?'الرسم الرقمي الذكي — مسح ميداني وحصر تلقائي':'Digital Field Survey & Sketch System'}</span>
            <span style="margin-${ar?'right':'left'}:auto;font-size:10.5px;color:var(--text-muted);">${ar?'ارفع • عايَر • ارسم • احسب • اصدر':'Upload • calibrate • trace • calculate • export'}</span>
          </div>
        </div>

        <!-- Field Survey Form -->
        <div class="card" style="border:1px solid rgba(37,99,235,0.2);">
          <div class="card-head" style="background:linear-gradient(90deg,rgba(37,99,235,0.06),transparent);border-bottom:1px solid rgba(37,99,235,0.12);">
            <span>📋</span>
            <span class="card-title" style="font-weight:800;font-size:13px;">${ar?'بيانات المسح الميداني — املأ أو اربط بأمر العمل':'Field Survey Data — fill or link to Work Order'}</span>
            <button class="btn btn-sm btn-outline" style="margin-${ar?'right':'left'}:auto;font-size:10px;" onclick="DrawingAnalyzer._fillFromProject()">🔄 ${ar?'ملء تلقائي من المشروع':'Auto-fill from project'}</button>
          </div>
          <div class="card-body">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;">
              ${this._surveyField('wo', 'رقم أمر العمل', 'Work Order #')}
              ${this._surveyField('project', 'رقم/اسم المشروع', 'Project #/Name')}
              ${this._surveyField('contract', 'رقم العقد', 'Contract #')}
              ${this._surveyField('ss', 'رقم المحطة (SS)', 'SS Number')}
              ${this._surveyField('rmu', 'رقم الـ RMU', 'RMU Number')}
              ${this._surveyField('feeder', 'رقم المغذي', 'Feeder #')}
              ${this._surveyField('circuit', 'رقم الدائرة', 'Circuit #')}
              ${this._surveyField('street', 'الشارع', 'Street Name')}
              ${this._surveyField('municipality', 'البلدية', 'Municipality')}
              ${this._surveyField('district', 'الحي', 'District')}
              ${this._surveyField('city', 'المدينة', 'City')}
              ${this._surveyField('contractor', 'المقاول', 'Contractor')}
              ${this._surveyField('consultant', 'الاستشاري', 'Consultant')}
              ${this._surveyField('execYear', 'سنة التنفيذ', 'Year')}
              ${this._surveyField('lat', 'خط العرض GPS', 'Latitude')}
              ${this._surveyField('lng', 'خط الطول GPS', 'Longitude')}
            </div>
          </div>
        </div>

        <!-- Upload Area -->
        <div class="card" style="border:2px dashed rgba(139,92,246,0.3);" id="draw-upload-card">
          <div class="card-body">
            <div id="draw-dropzone" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:140px;gap:10px;cursor:pointer;border-radius:12px;background:rgba(139,92,246,0.03);transition:all 0.2s;"
              ondragover="event.preventDefault();this.style.background='rgba(139,92,246,0.1)';this.style.borderColor='var(--sec-primary)';"
              ondragleave="this.style.background='rgba(139,92,246,0.03)';this.style.borderColor='';"
              ondrop="DrawingAnalyzer._handleDrop(event);this.style.background='rgba(139,92,246,0.03)';this.style.borderColor='';"
              onclick="document.getElementById('draw-file-input').click()">
              <div style="font-size:40px;opacity:0.5;">📄</div>
              <div style="font-size:13px;font-weight:700;color:var(--text-h);">${ar?'اسحب وأفلت المخطط هنا أو انقر للتحميل':'Drag & drop drawing here or click to upload'}</div>
              <div style="font-size:10.5px;color:var(--text-muted);">${ar?'يدعم: JPG • PNG • PDF • صور الكاميرا • ملفات AutoCAD':'Supports: JPG • PNG • PDF • Camera photos • CAD exports'}</div>
              <div style="display:flex;gap:8px;margin-top:6px;">
                <button class="btn btn-primary btn-sm" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border:none;" onclick="event.stopPropagation();document.getElementById('draw-file-input').click()">📂 ${ar?'اختيار ملف':'Choose File'}</button>
                <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();DrawingAnalyzer._pasteFromClipboard()" title="Ctrl+V">📋 ${ar?'لصق من الحافظة':'Paste'}</button>
              </div>
              <input type="file" id="draw-file-input" accept="image/*,.pdf" style="display:none;" onchange="DrawingAnalyzer._handleFiles(this.files)">
            </div>
          </div>
        </div>

        <!-- Drawing Stage (hidden until file loaded) -->
        <div id="draw-stage" style="display:none;">
          <!-- Toolbar -->
          <div class="card" style="border:1px solid var(--border);">
            <div class="card-body" style="padding:10px 14px;">
              <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
                <select id="draw-cat" class="form-control" style="max-width:170px;padding:6px 10px;font-size:11px;" onchange="DrawingAnalyzer.selectCat(this.value)">
                  ${Object.values(this.CATS).map(c => `<option value="${c.id}">${c.icon} ${ar?c.ar:c.en}</option>`).join('')}
                </select>
                <div style="width:1px;height:24px;background:var(--border);margin:0 4px;"></div>
                <button class="btn btn-outline btn-sm" id="draw-mode-scale" onclick="DrawingAnalyzer.setMode('scale')">📏 ${ar?'معايرة':'Calibrate'}</button>
                <button class="btn btn-outline btn-sm" id="draw-mode-trace" onclick="DrawingAnalyzer.setMode('trace')">✏️ ${ar?'رسم مسار':'Trace'}</button>
                <button class="btn btn-outline btn-sm" id="draw-mode-count" onclick="DrawingAnalyzer.setMode('count')">⭕ ${ar?'عدّ':'Count'}</button>
                <div style="width:1px;height:24px;background:var(--border);margin:0 4px;"></div>
                <button class="btn btn-outline btn-sm" onclick="DrawingAnalyzer.undo()">↩️ ${ar?'تراجع':'Undo'}</button>
                <button class="btn btn-danger btn-sm" onclick="DrawingAnalyzer.clearAll()">🗑 ${ar?'مسح':'Clear'}</button>
                <button class="btn btn-gold btn-sm" onclick="DrawingAnalyzer.autoAnalyze()" title="${ar?'اكتشاف تلقائي للمسارات الملونة':'Auto-detect colored routes'}">🤖 ${ar?'تحليل تلقائي':'Auto'}</button>
                <div style="width:1px;height:24px;background:var(--border);margin:0 4px;"></div>
                <button class="btn btn-outline btn-sm" onclick="DrawingAnalyzer.zoomIn()" title="Zoom In">🔍+</button>
                <button class="btn btn-outline btn-sm" onclick="DrawingAnalyzer.zoomOut()" title="Zoom Out">🔍−</button>
                <button class="btn btn-outline btn-sm" onclick="DrawingAnalyzer.fitView()">⊞ ${ar?'ملائمة':'Fit'}</button>
                <span id="draw-mode-status" style="font-size:10.5px;color:var(--sec-primary);font-weight:800;margin-${ar?'right':'left'}:auto;"></span>
              </div>
            </div>
          </div>

          <!-- Canvas Area -->
          <div style="border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden;position:relative;background:repeating-conic-gradient(#1a1a2e 0% 25%, #16213e 0% 50%) 0 0 / 24px 24px;max-height:60vh;margin-top:8px;">
            <canvas id="draw-canvas" style="display:block;cursor:crosshair;max-width:none;"></canvas>
          </div>

          <!-- Scale Panel -->
          <div id="draw-scale-panel" style="display:none;margin-top:8px;background:var(--bg-surface);border:1px dashed var(--sec-gold);border-radius:var(--r-sm);padding:10px 12px;">
            <div style="font-size:11px;font-weight:800;color:var(--text-h);margin-bottom:6px;">📏 ${ar?'معايرة المقياس':'Scale Calibration'}</div>
            <div style="font-size:10.5px;color:var(--text-sub);margin-bottom:8px;">${ar?'ارسم خط بين نقطتين معروفين ثم أدخل الطول الحقيقي:':'Draw line between two known points, enter real length:'}</div>
            <div style="display:flex;gap:8px;align-items:center;">
              <input id="draw-scale-val" type="number" class="form-control" style="max-width:130px;padding:7px 10px;" placeholder="${ar?'الطول (م)':'Length (m)'}">
              <button class="btn btn-primary btn-sm" style="background:linear-gradient(135deg,var(--sec-primary),var(--sec-primary-2));border:none;" onclick="DrawingAnalyzer.applyScale()">✔ ${ar?'تطبيق':'Apply'}</button>
              <span id="draw-scale-hint" style="font-size:10.5px;color:var(--text-muted);"></span>
            </div>
          </div>

          <!-- Live Measurements -->
          <div id="draw-measurements" style="margin-top:10px;"></div>
          <!-- Cost Estimate -->
          <div id="draw-cost" style="margin-top:10px;display:none;"></div>
        </div>

        <!-- Cable Size Legend -->
        <div class="card" style="border:1px solid var(--border);">
          <div class="card-head" style="border-bottom:1px solid var(--border);">
            <span>🎨</span>
            <span class="card-title" style="font-size:12px;">${ar?'نظام ألوان الكابلات والمقاطع':'Cable & Size Color System'}</span>
          </div>
          <div class="card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            <div>
              <div style="font-size:10.5px;font-weight:700;color:var(--text-h);margin-bottom:6px;">🔌 ${ar?'أنواع الكابلات':'Cable Types'}</div>
              <div style="display:flex;flex-direction:column;gap:4px;">
                <div style="display:flex;align-items:center;gap:6px;font-size:10.5px;"><span style="width:16px;height:4px;background:#dc2626;border-radius:2px;display:inline-block;"></span><span style="color:#dc2626;font-weight:700;">MV 33kV</span> ${ar?'جهد عالي':'High Voltage'}</div>
                <div style="display:flex;align-items:center;gap:6px;font-size:10.5px;"><span style="width:16px;height:4px;background:#8b5cf6;border-radius:2px;display:inline-block;"></span><span style="color:#8b5cf6;font-weight:700;">MV 11/13.8kV</span> ${ar?'جهد متوسط':'Medium Voltage'}</div>
                <div style="display:flex;align-items:center;gap:6px;font-size:10.5px;"><span style="width:16px;height:4px;background:#0a7d3b;border-radius:2px;display:inline-block;"></span><span style="color:#0a7d3b;font-weight:700;">LV 400V</span> ${ar?'جهد منخفض':'Low Voltage'}</div>
                <div style="display:flex;align-items:center;gap:6px;font-size:10.5px;"><span style="width:16px;height:4px;background:#1d6ff2;border-radius:2px;display:inline-block;"></span><span style="color:#1d6ff2;font-weight:700;">${ar?'إنارة شوارع':'Street Lighting'}</span></div>
                <div style="display:flex;align-items:center;gap:6px;font-size:10.5px;"><span style="width:16px;height:4px;background:#f97316;border-radius:2px;display:inline-block;"></span><span style="color:#f97316;font-weight:700;">${ar?'فايبر بصرية':'Fiber Optic'}</span></div>
              </div>
            </div>
            <div>
              <div style="font-size:10.5px;font-weight:700;color:var(--text-h);margin-bottom:6px;">📐 ${ar?'مقاطع الكابلات':'Cable Sizes'}</div>
              <div style="display:flex;flex-direction:column;gap:4px;">
                ${Object.values(this.CABLE_COLORS).map(cc => `
                  <div style="display:flex;align-items:center;gap:6px;font-size:10.5px;">
                    <span style="width:16px;height:10px;background:${cc.color};border:1px solid rgba(255,255,255,0.2);border-radius:2px;display:inline-block;"></span>
                    <span style="font-weight:700;">${cc.label}</span>
                  </div>`).join('')}
              </div>
            </div>
          </div>
        </div>

        <!-- Engineering Symbols -->
        <div class="card" style="border:1px solid var(--border);">
          <div class="card-head" style="border-bottom:1px solid var(--border);">
            <span>🧩</span>
            <span class="card-title" style="font-size:12px;">${ar?'مكتبة الرموز الهندسية — انقر رمزاً ثم ضعه على المخطط':'Engineering Symbols — pick & place on drawing'}</span>
          </div>
          <div class="card-body">
            <div style="display:flex;flex-wrap:wrap;gap:5px;" id="draw-symbols-lib">
              ${this._symbolButtons()}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _surveyField(id, arLabel, enLabel) {
    return `<div>
      <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:3px;">${this._ar() ? arLabel : enLabel}</label>
      <input id="draw-survey-${id}" type="text" class="form-control" style="padding:6px 9px;font-size:11.5px;width:100%;"
        placeholder="${this._ar() ? arLabel : enLabel}">
    </div>`;
  },

  _symbolButtons() {
    const ar = this._ar();
    const syms = [
      { id:'sym_ss',       emoji:'🏭', ar:'محطة جهد (SS)',      en:'Substation (SS)', cat:'ss' },
      { id:'sym_rmu',      emoji:'🔌', ar:'وحدة توزيع (RMU)',   en:'RMU',            cat:'rmu' },
      { id:'sym_feeder',   emoji:'📦', ar:'عمود تغذية',         en:'Feeder Pillar',  cat:'feeder' },
      { id:'sym_mh',       emoji:'⬛', ar:'غرفة تفتيش',         en:'Manhole',        cat:'manhole' },
      { id:'sym_hh',       emoji:'⬜', ar:'حفرة يد',            en:'Handhole',       cat:'handhole' },
      { id:'sym_pole',     emoji:'🔴', ar:'عمود إنارة',         en:'Lighting Pole',  cat:'pole' },
      { id:'sym_street',   emoji:'💡', ar:'مصباح شارع',         en:'Street Light',   cat:'street_light' },
      { id:'sym_cabinet',  emoji:'🔷', ar:'خزانة كهرباء',       en:'Cabinet',        cat:'cabinet' },
      { id:'sym_joint',    emoji:'🔗', ar:'غرفة وصلة',          en:'Joint Bay',      cat:'manhole' },
    ];
    return syms.map(s => `<button class="btn btn-outline btn-sm" data-sym="${s.id}" onclick="DrawingAnalyzer.selectSymbol('${s.id}','${s.cat}')" title="${ar?s.ar:s.en}" style="padding:4px 8px;font-size:10.5px;">${s.emoji} ${ar?s.ar:s.en}</button>`).join('');
  },

  _fillFromProject() {
    const ar = this._ar();
    try {
      const meta = (typeof App !== 'undefined' && App.state && App.state.boq && App.state.boq.meta) ? App.state.boq.meta : {};
      const vals = { wo: meta.wo, project: meta.project, location: meta.location, date: meta.date };
      Object.keys(vals).forEach(k => {
        const el = document.getElementById('draw-survey-' + k);
        if (el && vals[k]) el.value = vals[k];
      });
      toast(ar ? 'تم ملء البيانات من المشروع' : 'Filled from project data', 'success');
    } catch(e) {}
  },

  getSurveyData() {
    const d = {};
    ['wo','project','contract','ss','rmu','feeder','circuit','street','municipality','district','city','contractor','consultant','execYear','lat','lng'].forEach(k => {
      const el = document.getElementById('draw-survey-' + k);
      if (el) d[k] = el.value;
    });
    return d;
  },

  /* ─── FILE HANDLING ─── */
  _handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer?.files;
    if (files && files.length) this._handleFiles(files);
  },

  _pasteFromClipboard() {
    const ar = this._ar();
    navigator.clipboard?.read().then(items => {
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            item.getType(type).then(blob => {
              const file = new File([blob], 'pasted-image.png', { type });
              this._handleFiles([file]);
            });
            return;
          }
        }
      }
      toast(ar ? 'لا توجد صورة في الحافظة' : 'No image in clipboard', 'warning');
    }).catch(() => toast(ar ? 'لا يمكن الوصول للحافظة' : 'Clipboard access denied', 'warning'));
  },

  _handleFiles(files) {
    const ar = this._ar();
    if (!files || !files.length) return;
    const file = files[0];

    if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
      this._loadPDF(file);
      return;
    }
    if (!/image\//.test(file.type)) {
      toast(ar ? 'الرجاء اختيار صورة أو PDF' : 'Please choose an image or PDF', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => this._initCanvas(img, file.name);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  _loadPDF(file) {
    const ar = this._ar();
    toast(ar ? 'جاري تحميل PDF...' : 'Loading PDF...', 'info', 3000);

    const reader = new FileReader();
    reader.onload = e => {
      const typedArr = new Uint8Array(e.target.result);

      // Try pdf.js if available
      if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        pdfjsLib.getDocument({ data: typedArr }).promise.then(pdf => {
          pdf.getPage(1).then(page => {
            const vp = page.getViewport({ scale: 2 });
            const cvs = document.createElement('canvas');
            cvs.width = vp.width; cvs.height = vp.height;
            page.render({ canvasContext: cvs.getContext('2d'), viewport: vp }).promise.then(() => {
              const img = new Image();
              img.onload = () => this._initCanvas(img, file.name);
              img.src = cvs.toDataURL('image/png');
            });
          });
        }).catch(() => this._loadPDFFallback(typedArr, file.name));
      } else {
        this._loadPDFFallback(typedArr, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  },

  _loadPDFFallback(arr, name) {
    const ar = this._ar();
    // Minimal: render first page as blob image via browser
    const blob = new Blob([arr], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    // Show link to open PDF manually
    const stage = document.getElementById('draw-stage');
    if (stage) {
      stage.style.display = 'block';
      stage.innerHTML = `
        <div style="padding:20px;text-align:center;">
          <div style="font-size:14px;font-weight:700;color:var(--text-h);margin-bottom:8px;">📄 ${ar?'تم تحميل ملف PDF':'PDF loaded'}: ${name}</div>
          <div style="font-size:12px;color:var(--text-sub);margin-bottom:12px;">${ar?'افتح الملف يدوياً ثم حمّل صورة من المخطط':'Open the file manually then upload a screenshot from the drawing'}</div>
          <a href="${url}" target="_blank" class="btn btn-primary btn-sm" style="text-decoration:none;">📂 ${ar?'فتح PDF':'Open PDF'}</a>
        </div>`;
    }
  },

  _initCanvas(img, fileName) {
    this._resetState();
    const st = this._state;
    st.img = img; st.imgW = img.width; st.imgH = img.height; st.fileName = fileName;
    const stage = document.getElementById('draw-stage');
    if (stage) stage.style.display = 'block';
    const canvas = document.getElementById('draw-canvas');
    if (!canvas) return;
    const maxW = Math.min(960, window.innerWidth - 80);
    const maxH = Math.min(580, window.innerHeight * 0.55);
    const k = Math.min(1, maxW / img.width, maxH / img.height);
    canvas.width = Math.round(img.width * k);
    canvas.height = Math.round(img.height * k);
    st.canvas = canvas; st.ctx = canvas.getContext('2d'); st.k = k;
    this._redraw();
    this._bindCanvas(canvas);
    this._updateStatus();
    const ar = this._ar();
    toast(ar ? '✅ تم تحميل المخطط — عايِر المقياس أولاً' : '✅ Drawing loaded — calibrate scale first', 'success', 5000);
  },

  _resetState() {
    this._state = {
      img: null, imgW: 0, imgH: 0, scale: null,
      mode: 'trace', cat: 'lv_cable',
      current: null,
      strokes: [], counts: [], maxId: 1,
      canvas: null, ctx: null, k: 1,
      zoom: 1, panX: 0, panY: 0, scaleLine: null, fileName: ''
    };
  },

  _bindCanvas(canvas) {
    canvas.addEventListener('mousedown', e => this._onDown(e));
    canvas.addEventListener('mousemove', e => this._onMove(e));
    canvas.addEventListener('mouseup', () => this._onUp());
    canvas.addEventListener('mouseleave', () => this._onUp());
    canvas.addEventListener('wheel', e => { e.preventDefault(); this._onWheel(e); }, { passive: false });
  },

  _pt(e) {
    const st = this._state;
    const r = st.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / st.zoom - st.panX,
      y: (e.clientY - r.top) / st.zoom - st.panY
    };
  },

  /* ─── MODES ─── */
  setMode(m) {
    const st = this._state;
    if (!st) return;
    if (m !== 'count' && st.mode === 'count' && st.current && st.current.n > 0) {
      st.counts.push({ id: st.maxId++, cat: st.current.cat, n: st.current.n, pts: st.current.pts.slice() });
      st.current = null;
      this._renderMeasurements();
    }
    st.mode = m;
    if (m === 'trace') st.current = null;
    if (m === 'count') st.current = null;
    if (m === 'scale') st.scaleLine = null;
    const sp = document.getElementById('draw-scale-panel');
    if (sp) sp.style.display = (m === 'scale') ? 'block' : 'none';
    ['scale','trace','count'].forEach(k => {
      const btn = document.getElementById('draw-mode-' + k);
      if (btn) btn.classList.toggle('active', k === m);
    });
    this._updateStatus();
    this._redraw();
  },

  selectCat(id) { if (this._state) this._state.cat = id; },

  selectSymbol(id, catId) {
    const ar = this._ar();
    const st = this._state;
    if (!st) { toast(ar ? 'حمّل مخططاً أولاً' : 'Load a drawing first', 'warning'); return; }
    st.cat = catId || id;
    this.setMode('count');
    toast(ar ? 'انقر على المخطط لوضع الرمز' : 'Click on drawing to place symbol', 'info', 2000);
  },

  _updateStatus() {
    const st = this._state;
    if (!st) return;
    const ar = this._ar();
    const el = document.getElementById('draw-mode-status');
    if (!el) return;
    const c = this._cat(st.cat);
    if (!c) return;
    const name = ar ? c.ar : c.en;
    if (st.mode === 'scale') el.textContent = ar ? '📏 ارسم خط المعايرة ثم أدخل الطول' : '📏 Draw calibration line, then enter length';
    else if (st.mode === 'trace') el.textContent = (ar ? '✏️ ارسم مسار ' : '✏️ Trace ') + name + (st.scale ? '' : (ar ? ' — عايِر أولاً' : ' — calibrate first'));
    else el.textContent = (ar ? '⭕ انقر لعدّ ' : '⭕ Click to count ') + name;
  },

  /* ─── CANVAS EVENTS ─── */
  _onDown(e) {
    const st = this._state;
    if (!st) return;
    const p = this._pt(e);
    if (st.mode === 'scale') { st.scaleLine = { a: p, b: null }; return; }
    if (st.mode === 'trace') {
      if (!st.scale) { toast(this._ar() ? 'عايِر المقياس أولاً' : 'Calibrate scale first', 'warning'); return; }
      if (!st.current) st.current = { cat: st.cat, pts: [p] };
      else st.current.pts.push(p);
      this._redraw(); return;
    }
    if (st.mode === 'count') {
      if (!st.current) st.current = { cat: st.cat, n: 0, pts: [] };
      st.current.n++;
      st.current.pts.push(p);
      this._redraw(); this._renderMeasurements();
    }
  },

  _onMove(e) {
    const st = this._state;
    if (!st) return;
    const p = this._pt(e);
    if (st.mode === 'scale' && st.scaleLine) { st.scaleLine.b = p; this._redraw(); }
    else if (st.mode === 'trace' && st.current) { st.current.hover = p; this._redraw(); }
  },

  _onUp() {
    const st = this._state;
    if (!st) return;
    if (st.mode === 'scale' && st.scaleLine && st.scaleLine.b) { st.scaleLine.ready = true; this._redraw(); return; }
    if (st.mode === 'trace' && st.current && st.current.hover) {
      st.current.pts.push(st.current.hover);
      st.current.hover = null;
      this._finalizeStroke(st.current);
      st.current = null;
      this._redraw(); this._renderMeasurements();
    }
  },

  _onWheel(e) {
    const st = this._state;
    if (!st) return;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    st.zoom = Math.max(0.2, Math.min(5, st.zoom * delta));
    st.canvas.style.transform = `scale(${st.zoom}) translate(${st.panX}px,${st.panY}px)`;
    st.canvas.style.transformOrigin = '0 0';
  },

  zoomIn() { const st = this._state; if (!st) return; st.zoom = Math.min(5, st.zoom * 1.25); st.canvas.style.transform = `scale(${st.zoom})`; st.canvas.style.transformOrigin = '0 0'; },
  zoomOut() { const st = this._state; if (!st) return; st.zoom = Math.max(0.2, st.zoom * 0.8); st.canvas.style.transform = `scale(${st.zoom})`; st.canvas.style.transformOrigin = '0 0'; },
  fitView() { const st = this._state; if (!st) return; st.zoom = 1; st.panX = 0; st.panY = 0; st.canvas.style.transform = ''; },

  _finalizeStroke(s) {
    const st = this._state;
    if (!s || !s.pts || s.pts.length < 2) return;
    let lenPx = 0;
    for (let i = 1; i < s.pts.length; i++) lenPx += Math.hypot(s.pts[i].x - s.pts[i-1].x, s.pts[i].y - s.pts[i-1].y);
    st.strokes.push({ id: st.maxId++, cat: s.cat, pts: s.pts.slice(), lenPx, lenM: st.scale ? lenPx * st.scale : 0 });
  },

  undo() {
    const st = this._state;
    if (!st) return;
    if (st.current) { st.current = null; this._redraw(); return; }
    if (st.mode === 'scale' && st.scaleLine) { st.scaleLine = null; this._redraw(); return; }
    if (st.strokes.length) { st.strokes.pop(); this._renderMeasurements(); this._redraw(); }
    else if (st.counts.length) { st.counts.pop(); this._renderMeasurements(); this._redraw(); }
  },

  clearAll() {
    const st = this._state;
    if (!st) return;
    st.strokes = []; st.counts = []; st.current = null; st.scaleLine = null;
    const sv = document.getElementById('draw-scale-val'); if (sv) sv.value = '';
    this._renderMeasurements(); this._redraw();
  },

  /* ─── SCALE ─── */
  applyScale() {
    const ar = this._ar();
    const st = this._state;
    if (!st || !st.scaleLine || !st.scaleLine.b) { toast(ar ? 'ارسم خط المعايرة أولاً' : 'Draw calibration line first', 'warning'); return; }
    const a = st.scaleLine.a, b = st.scaleLine.b;
    const lenPx = Math.hypot(b.x - a.x, b.y - a.y);
    const real = parseFloat(document.getElementById('draw-scale-val')?.value);
    if (!lenPx || !(real > 0)) { toast(ar ? 'أدخل طولاً صحيحاً' : 'Enter valid length', 'warning'); return; }
    st.scale = real / lenPx;
    st.scaleLine = null;
    const sp = document.getElementById('draw-scale-panel'); if (sp) sp.style.display = 'none';
    const hint = document.getElementById('draw-scale-hint');
    if (hint) hint.textContent = (ar ? 'المقياس: ' : 'Scale: ') + st.scale.toFixed(4) + ' m/px ✓';
    st.mode = 'trace';
    this.setMode('trace');
    toast(ar ? 'تم تطبيق المقياس — ارسم المسارات الآن' : 'Scale applied — trace routes now', 'success');
  },

  /* ─── AUTO ANALYZE (color detection) ─── */
  autoAnalyze() {
    const ar = this._ar();
    const st = this._state;
    if (!st || !st.canvas) { toast(ar ? 'حمّل مخططاً أولاً' : 'Load a drawing first', 'warning'); return; }

    const det = [
      { id:'lv_cable',   rgb:[10,125,59],   tol:65, kind:'trace' },
      { id:'mv_cable',   rgb:[139,92,246],  tol:65, kind:'trace' },
      { id:'hv_cable',   rgb:[220,38,38],   tol:65, kind:'trace' },
      { id:'fiber',      rgb:[249,115,22],  tol:65, kind:'trace' },
      { id:'pipe',       rgb:[29,111,242],  tol:65, kind:'trace' },
      { id:'road',       rgb:[122,92,46],   tol:55, kind:'trace' },
      { id:'excavation', rgb:[217,119,6],   tol:65, kind:'trace' },
      { id:'pole',       rgb:[229,72,77],   tol:55, kind:'count' },
      { id:'cabinet',    rgb:[8,145,178],   tol:55, kind:'count' },
      { id:'ss',         rgb:[220,38,38],   tol:40, kind:'count' },
      { id:'rmu',        rgb:[124,58,237],  tol:40, kind:'count' },
    ];

    const w = st.canvas.width, h = st.canvas.height;
    let img;
    try { img = st.ctx.getImageData(0, 0, w, h); }
    catch (e) { toast(ar ? 'لا يمكن قراءة المخطط' : 'Cannot read drawing', 'error'); return; }
    const d = img.data;
    const n = w * h;
    const visited = new Uint8Array(n);
    let strokesFound = 0, countsFound = 0;

    det.forEach(detCfg => {
      const [R, G, B] = detCfg.rgb;
      const tol = detCfg.tol;
      const isMatch = (px) => {
        const r = d[px], g = d[px+1], b = d[px+2], a = d[px+3];
        if (a < 128) return false;
        return Math.abs(r - R) <= tol && Math.abs(g - G) <= tol && Math.abs(b - B) <= tol;
      };

      for (let i = 0; i < n; i++) {
        if (visited[i] || !isMatch(i * 4)) continue;
        const queue = new Int32Array(n);
        let qh = 0, qt = 0;
        queue[qt++] = i; visited[i] = 1;
        const xs = [], ys = [];
        while (qh < qt) {
          const p = queue[qh++];
          const px = p % w, py = (p / w) | 0;
          xs.push(px); ys.push(py);
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (!dx && !dy) continue;
              const nx = px + dx, ny = py + dy;
              if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
              const np = ny * w + nx;
              if (visited[np] || !isMatch(np * 4)) continue;
              visited[np] = 1; queue[qt++] = np;
            }
          }
        }
        if (xs.length < 6) continue;
        let minX = w, maxX = 0, minY = h, maxY = 0;
        xs.forEach(v => { if (v < minX) minX = v; if (v > maxX) maxX = v; });
        ys.forEach(v => { if (v < minY) minY = v; if (v > maxY) maxY = v; });
        const bw = maxX - minX + 1, bh = maxY - minY + 1;
        const ratio = Math.min(bw, bh) / Math.max(bw, bh);
        const isLine = ratio < 0.4 && Math.max(bw, bh) >= 14;

        if (detCfg.kind === 'count' || !isLine) {
          st.counts.push({ id: st.maxId++, cat: detCfg.id, n: 1, pts: [{ x: (minX + maxX) / 2, y: (minY + maxY) / 2 }] });
          countsFound++;
        } else {
          let mx = 0, my = 0;
          for (let k = 0; k < xs.length; k++) { mx += xs[k]; my += ys[k]; }
          mx /= xs.length; my /= xs.length;
          let sxx = 0, syy = 0, sxy = 0;
          for (let k = 0; k < xs.length; k++) {
            const dx = xs[k] - mx, dy = ys[k] - my;
            sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
          }
          const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
          const ax = Math.cos(theta), ay = Math.sin(theta);
          const idx = Array.from({ length: xs.length }, (_, k) => k);
          idx.sort((p, q) => (xs[p] - mx) * ax + (ys[p] - my) * ay - ((xs[q] - mx) * ax + (ys[q] - my) * ay));
          const step = Math.max(1, Math.floor(idx.length / 24));
          const pts = [];
          for (let k = 0; k < idx.length; k += step) pts.push({ x: xs[idx[k]], y: ys[idx[k]] });
          if (pts.length >= 2) {
            let lenPx = 0;
            for (let k = 1; k < pts.length; k++) lenPx += Math.hypot(pts[k].x - pts[k-1].x, pts[k].y - pts[k-1].y);
            if (lenPx >= 8) {
              st.strokes.push({ id: st.maxId++, cat: detCfg.id, pts, lenPx, lenM: st.scale ? lenPx * st.scale : 0 });
              strokesFound++;
            }
          }
        }
        if (strokesFound + countsFound > 300) break;
      }
    });

    this._redraw(); this._renderMeasurements();
    if (strokesFound || countsFound) {
      toast(ar ? `✅ تحليل تلقائي: ${strokesFound} مسار + ${countsFound} عنصر` : `✅ Auto: ${strokesFound} routes + ${countsFound} elements`, 'success', 5000);
    } else {
      toast(ar ? 'لم يتم اكتشاف عناصر ملونة مطابقة' : 'No matching colored elements found', 'warning');
    }
  },

  /* ─── DRAWING ─── */
  _redraw() {
    const st = this._state;
    if (!st || !st.ctx) return;
    const ctx = st.ctx;
    ctx.clearRect(0, 0, st.canvas.width, st.canvas.height);
    if (st.img) ctx.drawImage(st.img, 0, 0, st.canvas.width, st.canvas.height);

    // finished traces
    st.strokes.forEach(s => {
      const c = this._cat(s.cat);
      if (!c) return;
      ctx.strokeStyle = c.color; ctx.lineWidth = 3; ctx.globalAlpha = 0.85;
      ctx.beginPath();
      s.pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.stroke(); ctx.globalAlpha = 1;
      // label
      const m = s.pts[Math.floor(s.pts.length / 2)];
      if (m && s.lenM > 0) {
        const label = s.lenM.toFixed(1) + 'm';
        ctx.font = 'bold 11px sans-serif';
        const tw = ctx.measureText(label).width;
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        ctx.fillRect(m.x - tw/2 - 3, m.y - 9, tw + 6, 14);
        ctx.fillStyle = '#000'; ctx.fillText(label, m.x - tw/2, m.y + 2);
      }
    });

    // counts
    st.counts.forEach(c => {
      const cat = this._cat(c.cat);
      if (!cat) return;
      c.pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = cat.color; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      });
    });

    // scale line
    if (st.scaleLine && st.scaleLine.b) {
      ctx.strokeStyle = '#ffa900'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(st.scaleLine.a.x, st.scaleLine.a.y); ctx.lineTo(st.scaleLine.b.x, st.scaleLine.b.y);
      ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ffa900';
      ctx.fillRect(st.scaleLine.a.x - 4, st.scaleLine.a.y - 4, 8, 8);
      ctx.fillRect(st.scaleLine.b.x - 4, st.scaleLine.b.y - 4, 8, 8);
    }

    // current trace
    if (st.current && st.current.pts) {
      const c = this._cat(st.current.cat);
      if (c) {
        ctx.strokeStyle = c.color; ctx.lineWidth = 3;
        ctx.beginPath();
        st.current.pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        if (st.current.hover) ctx.lineTo(st.current.hover.x, st.current.hover.y);
        ctx.stroke();
      }
    }
    // current count
    if (st.current && st.current.pts && st.mode === 'count') {
      const c = this._cat(st.current.cat);
      if (c) {
        st.current.pts.forEach(p => {
          ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = c.color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        });
      }
    }
  },

  /* ─── MEASUREMENTS TABLE ─── */
  _renderMeasurements() {
    const ar = this._ar();
    const st = this._state;
    const el = document.getElementById('draw-measurements');
    if (!el || !st) return;

    const totals = {};
    st.strokes.forEach(s => { totals[s.cat] = (totals[s.cat] || 0) + s.lenM; });
    st.counts.forEach(c => { totals[c.cat] = (totals[s.cat] || 0) + c.n; });
    if (st.mode === 'count' && st.current && st.current.n > 0) totals[st.current.cat] = (totals[st.current.cat] || 0) + st.current.n;

    const rows = Object.keys(totals).map(cat => {
      const c = this._cat(cat);
      if (!c) return null;
      const qty = totals[cat];
      const p = (typeof getItemByCode === 'function') ? getItemByCode(c.code()) : null;
      return { cat, c, qty, p };
    }).filter(Boolean);

    if (!rows.length) { el.innerHTML = ''; const ce = document.getElementById('draw-cost'); if (ce) ce.style.display = 'none'; return; }

    const totalCost = rows.reduce((s, r) => s + (r.p ? r.p.newPrice * Math.round(r.qty * 100) / 100 : 0), 0);

    // auto-takeoff: calculate linked items for traced excavation lengths
    let takeoffHTML = '';
    const excavationTraces = rows.filter(r => r.cat === 'excavation' || r.cat === 'trench');
    if (excavationTraces.length > 0 && typeof autoLinkItems === 'function') {
      const totalExcavLen = excavationTraces.reduce((s, r) => s + r.qty, 0);
      const auto = autoLinkItems(null, { length: totalExcavLen, width: 1, depth: 1, surfaceType: 'dirt' });
      if (auto.linked.length > 0) {
        takeoffHTML = `
          <div style="margin-top:12px;padding:10px 14px;background:rgba(245,158,11,0.04);border:1px dashed rgba(245,158,11,0.3);border-radius:8px;">
            <div style="font-size:11px;font-weight:800;color:#92400e;margin-bottom:6px;">⚡ ${ar ? 'حصر تلقائي من طول الحفر = ' + totalExcavLen.toFixed(1) + ' م' : 'Auto-takeoff from excavation length = ' + totalExcavLen.toFixed(1) + 'm'}</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:6px;">
              ${auto.linked.map(x => `<div style="font-size:10px;color:var(--text-sub);">• <b>${x.code}</b> ${x.name || x.reason} → <b style="color:var(--sec-primary);">${x.qty} ${x.uom}</b></div>`).join('')}
            </div>
            ${auto.equipment ? `
            <div style="margin-top:8px;padding-top:6px;border-top:1px dashed rgba(245,158,11,0.2);">
              <div style="font-size:10px;font-weight:700;color:var(--text-h);margin-bottom:4px;">🚜 ${ar ? 'المعدات واللوجستيات' : 'Equipment & Logistics'}</div>
              <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:10px;color:var(--text-sub);">
                <span>🚜 ${ar ? 'حفار' : 'Excavator'}: ${auto.equipment.excavatorH} ${ar ? 'ساعة' : 'h'}</span>
                <span>🚛 ${ar ? 'قلابات' : 'Trucks'}: ${auto.logistics.trucks}</span>
                <span>🏗 ${ar ? 'كومبرصور' : 'Compactor'}: ${auto.equipment.compactorH} ${ar ? 'ساعة' : 'h'}</span>
                <span>💧 ${ar ? 'مياه' : 'Water'}: ${auto.logistics.waterTrips} ${ar ? 'رحلات' : 'trips'}</span>
              </div>
            </div>` : ''}
            <div style="margin-top:8px;">
              <button class="btn btn-primary btn-sm" style="background:linear-gradient(135deg,#f59e0b,#d97706);border:none;font-size:10px;" onclick="DrawingAnalyzer._addTakeoffToBOQ()">➕ ${ar ? 'إضافة الحصر للمقايسة' : 'Add takeoff to BOQ'}</button>
            </div>
          </div>`;
      }
    }

    el.innerHTML = `
      <div class="card" style="border:1px solid var(--border-sec);">
        <div class="card-head" style="border-bottom:1px solid var(--border);">
          <span>📏</span><span class="card-title">${ar ? 'قياسات المخطط' : 'Drawing Measurements'}</span>
          <span style="margin-${ar?'right':'left'}:auto;display:flex;gap:6px;">
            <button class="btn btn-primary btn-sm" style="background:linear-gradient(135deg,var(--sec-primary),var(--sec-primary-2));border:none;" onclick="DrawingAnalyzer.addAllToBOQ()">➕ ${ar ? 'إضافة للمقايسة' : 'Add to BOQ'}</button>
          </span>
        </div>
        <div class="tbl-wrap"><table class="data-table"><thead><tr>
          <th>${ar ? 'العنصر' : 'Element'}</th><th>${ar ? 'الرمز' : 'Code'}</th><th>${ar ? 'الكمية' : 'Qty'}</th><th>${ar ? 'الوحدة' : 'UOM'}</th><th>${ar ? 'السعر' : 'Price'}</th><th>${ar ? 'الإجمالي' : 'Total'}</th><th></th>
        </tr></thead><tbody>
          ${rows.map((r, i) => `
            <tr>
              <td><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${r.c.color};margin-${ar?'left':'right'}:6px;"></span>${ar ? r.c.ar : r.c.en}</td>
              <td class="td-code">${r.p ? r.p.code : r.c.code()}</td>
              <td><input class="qty-cell-input" type="number" id="draw-qty-${r.cat}" value="${Math.round(r.qty * 100) / 100}" min="0" step="0.01" style="width:80px;"></td>
              <td>${r.c.uom}</td>
              <td>${r.p ? fmtNum(r.p.newPrice) : '—'}</td>
              <td class="td-total">${r.p ? fmtNum(r.p.newPrice * Math.round(r.qty * 100) / 100) : '—'}</td>
              <td><button class="btn btn-danger btn-sm btn-icon" onclick="DrawingAnalyzer.removeCat('${r.cat}')">✕</button></td>
            </tr>`).join('')}
        </tbody></table></div>
        ${takeoffHTML}
      </div>
    `;
  },

  removeCat(cat) {
    const st = this._state;
    if (!st) return;
    st.strokes = st.strokes.filter(s => s.cat !== cat);
    st.counts = st.counts.filter(c => c.cat !== cat);
    if (st.current && st.current.cat === cat) st.current = null;
    this._renderMeasurements(); this._redraw();
  },

  addAllToBOQ() {
    const ar = this._ar();
    const st = this._state;
    if (!st) return;
    const totals = {};
    st.strokes.forEach(s => { totals[s.cat] = (totals[s.cat] || 0) + s.lenM; });
    st.counts.forEach(c => { totals[c.cat] = (totals[c.cat] || 0) + c.n; });
    if (st.mode === 'count' && st.current && st.current.n > 0) totals[st.current.cat] = (totals[st.current.cat] || 0) + st.current.n;

    let added = 0;
    Object.keys(totals).forEach(cat => {
      const c = this._cat(cat);
      if (!c) return;
      const p = (typeof getItemByCode === 'function') ? getItemByCode(c.code()) : null;
      if (!p) return;
      const qtyInput = document.getElementById('draw-qty-' + cat);
      const qty = qtyInput ? parseFloat(qtyInput.value) : totals[cat];
      if (!qty) return;
      if (typeof App !== 'undefined' && App.state.boq.items.some(x => x.code === p.code)) {
        const ex = App.state.boq.items.find(x => x.code === p.code);
        ex.qty = (ex.qty || 0) + qty;
      } else if (typeof App !== 'undefined') {
        App.state.boq.items.push({ code: p.code, qty, customPrice: null, note: '📐 رسم ذكي — ' + (this.getSurveyData().wo || '') });
      }
      added++;
    });
    if (!added) { toast(ar ? 'لا توجد قياسات' : 'No measurements', 'warning'); return; }
    if (typeof App !== 'undefined') { App._renderBOQTable(); App.runDepsCheck(); }
    toast(ar ? `تمت إضافة ${added} بنود من المخطط ✅` : `Added ${added} drawing items ✅`, 'success');
  },

  _addTakeoffToBOQ() {
    const ar = this._ar();
    const st = this._state;
    if (!st || typeof autoLinkItems !== 'function') return;
    const excavationTraces = st.strokes.filter(s => s.cat === 'excavation' || s.cat === 'trench');
    if (!excavationTraces.length) { toast(ar ? 'لا توجد مسارات حفر' : 'No excavation traces', 'warning'); return; }
    const totalLen = excavationTraces.reduce((s, r) => s + r.lenM, 0);
    const auto = autoLinkItems(null, { length: totalLen, width: 1, depth: 1, surfaceType: 'dirt' });
    let n = 0;
    auto.linked.forEach(x => {
      if (typeof App === 'undefined') return;
      if (App.state.boq.items.some(it => String(it.code) === String(x.code))) return;
      App.state.boq.items.push({ code: x.code, qty: x.qty, customPrice: null, note: '📐 حصر من الرسم التلقائي' });
      n++;
    });
    if (typeof App !== 'undefined') { App._mergeBOQDuplicates(); App._renderBOQTable(); App.runDepsCheck(); }
    toast(ar ? `تمت إضافة ${n} بند حصر تلقائي ✅` : `Added ${n} auto-takeoff items ✅`, 'success');
  }
};

window.DrawingAnalyzer = DrawingAnalyzer;
