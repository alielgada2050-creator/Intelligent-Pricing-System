/* ================================================================
   العقد الموحد 2026 — مستورد المقايسات (Excel/CSV + جلسة)
   Unified Contract 2026 — BOQ Importer (Excel/CSV + session)
   ================================================================ */

const BOQImporter = {
  SESSION_KEY: 'boq_session_cache',

  saveSession(items, meta) {
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify({ items, meta, savedAt: new Date().toISOString() }));
    } catch (e) { console.warn(e); }
  },

  restoreSession() {
    try {
      const raw = localStorage.getItem(this.SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !Array.isArray(s.items) || !s.items.length) return null;
      return s;
    } catch (e) { return null; }
  },

  clearSession() {
    try { localStorage.removeItem(this.SESSION_KEY); } catch (e) {}
  },

  renderImportCard(slotId) {
    const slot = document.getElementById(slotId);
    if (!slot) return;
    const ar = (typeof App !== 'undefined') ? App.lang === 'ar' : true;

    slot.innerHTML = `
      <div class="card" style="border:1px solid var(--border-sec);box-shadow:var(--shadow-sm);">
        <div class="card-head" style="background:linear-gradient(90deg,rgba(200,168,75,0.06),transparent);border-bottom:1px solid var(--border);">
          <span>📥</span>
          <span class="card-title">${ar ? 'استيراد المقايسة بجميع الصيغ' : 'Import BOQ (All Formats)'}</span>
          <button class="btn btn-outline btn-sm" onclick="App.importBOQFile()" style="margin-${ar?'right':'left'}:auto;padding:4px 12px;font-size:11.5px;">${ar ? 'اختيار ملف' : 'Choose File'}</button>
          <input type="file" id="boq-file-input" accept=".xlsx,.xls,.csv,.txt,.json,.xml" style="display:none;" onchange="App.importBOQFile(this)">
        </div>
        <div class="card-body" style="font-size:11.5px;color:var(--text-sub);display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <span>${ar ? 'الصيغ المدعومة: Excel (xlsx/xls) • CSV/TXT • JSON • XML' : 'Supported: Excel (xlsx/xls) • CSV/TXT • JSON • XML'}</span>
          <code style="background:var(--bg-surface);padding:3px 8px;border-radius:4px;font-size:10.5px;border:1px solid var(--border);direction:ltr;display:inline-block;">101000001,36,1690</code>
        </div>
      </div>
    `;
  },
};

window.BOQImporter = BOQImporter;
