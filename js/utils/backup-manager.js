/* ═══════════════════════════════════════════════════════════════════
   BACKUP MANAGER (النسخ الاحتياطي وإدارة الإصدارات) — Phase 9
   - Snapshot the whole Store payload (ps_sec_v3) + boqs + cert caches
   - Local versioning history in localStorage (auto + manual)
   - Export/Import a single .sebk backup file
   ═══════════════════════════════════════════════════════════════════ */
window.BackupManager = (() => {
  const HIST_KEY = 'ps_backup_history_v1';
  const MAX_HISTORY = 12;

  function pad(n) { return String(n).padStart(2, '0'); }
  function ts() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }
  function friendlyTime() {
    const d = new Date();
    return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function gatherState() {
    const state = {};
    try { state.store = JSON.parse(localStorage.getItem('ps_sec_v3') || 'null'); } catch { state.store = null; }
    try { state.ai = JSON.parse(localStorage.getItem('se_ai_config_v1') || 'null'); } catch { state.ai = null; }
    try { state.cert = JSON.parse(localStorage.getItem('cert_session_cache') || 'null'); } catch { state.cert = null; }
    try { state.operations = JSON.parse(localStorage.getItem('sec_field_operations_v1') || 'null'); } catch { state.operations = null; }
    return state;
  }

  function applyState(state) {
    if (state.store) localStorage.setItem('ps_sec_v3', JSON.stringify(state.store));
    if (state.ai) localStorage.setItem('se_ai_config_v1', JSON.stringify(state.ai));
    if (state.cert) localStorage.setItem('cert_session_cache', JSON.stringify(state.cert));
    if (Object.prototype.hasOwnProperty.call(state, 'operations')) {
      if (state.operations) localStorage.setItem('sec_field_operations_v1', JSON.stringify(state.operations));
      else localStorage.removeItem('sec_field_operations_v1');
    }
  }

  // Redact the AI API key so it never leaves the device inside .sebk exports.
  function sanitizeAi(state) {
    const s = state || {};
    if (s.ai && typeof s.ai === 'object') s.ai = Object.assign({}, s.ai, { apiKey: '' });
    return s;
  }

  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch { return []; }
  }
  function saveHistory(list) {
    try { localStorage.setItem(HIST_KEY, JSON.stringify(list)); } catch (e) { console.warn(e); }
  }

  // ── core: create a snapshot ──
  function createSnapshot(label, auto) {
    const snap = {
      id: 'bk_' + Date.now(),
      label: label || (auto ? 'تلقائي' : 'يدوي'),
      auto: !!auto,
      at: new Date().toISOString(),
      state: gatherState(),
    };
    const list = getHistory().filter(h => h.id !== snap.id);
    list.unshift(snap);
    if (list.length > MAX_HISTORY) list.length = MAX_HISTORY;
    saveHistory(list);
    return snap;
  }

  function restoreSnapshot(id) {
    const list = getHistory();
    const snap = list.find(h => h.id === id);
    if (!snap) return false;
    applyState(snap.state);
    return true;
  }

  function deleteSnapshot(id) {
    saveHistory(getHistory().filter(h => h.id !== id));
  }

  // ── size estimate ──
  function snapshotKB(snap) {
    try { return Math.round(JSON.stringify(snap.state).length / 1024); } catch { return 0; }
  }

  // ── file export/import ──
  function exportFile() {
    const snap = createSnapshot('ملف تصدير');
    const payload = {
      app: 'se-unified-contract-2026',
      version: '1.1',
      exportedAt: new Date().toISOString(),
      snapshots: getHistory().map(h => Object.assign({}, h, { state: sanitizeAi(Object.assign({}, h.state)) })),
      liveState: sanitizeAi(Object.assign({}, gatherState())),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'SE_UnifiedContract_Backup_' + ts() + '.sebk';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
    return payload;
  }

  function importFile(file, cb) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || (data.app !== 'se-unified-contract-2026' && !data.liveState && !data.snapshots)) {
          cb(new Error('invalid')); return;
        }
        if (data.liveState) {
          applyState(data.liveState);
          const merged = getHistory();
          (data.snapshots || []).forEach(s => { if (!merged.find(h => h.id === s.id)) merged.push(s); });
          merged.sort((a, b) => new Date(b.at) - new Date(a.at));
          if (merged.length > MAX_HISTORY * 2) merged.length = MAX_HISTORY * 2;
          saveHistory(merged);
        }
        cb(null, data);
      } catch (e) {
        cb(new Error('invalid'));
      }
    };
    reader.onerror = () => cb(new Error('invalid'));
    reader.readAsText(file);
  }

  // ── history card renderer ──
  function renderHistory(container) {
    const ar = (typeof App !== 'undefined') ? App.lang === 'ar' : true;
    const list = getHistory();
    container.innerHTML = `
      <div class="card" style="margin-top:12px;border:1px solid var(--border-sec);">
        <div class="card-head" style="border-bottom:1px solid var(--border);">
          <span>💾</span><span class="card-title">${ar ? 'النسخ الاحتياطي وإدارة الإصدارات' : 'Backup & Versioning'}</span>
        </div>
        <div class="card-body">
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
            <button class="btn btn-gold btn-sm" onclick="BackupManager.runBackup()">🔄 ${ar ? 'نسخة احتياطية الآن' : 'Backup Now'}</button>
            <button class="btn btn-outline btn-sm" onclick="BackupManager.exportFile()">⬇️ ${ar ? 'تنزيل ملف نسخة (.sebk)' : 'Download Backup File'}</button>
            <label class="btn btn-outline btn-sm" style="cursor:pointer;">⬆️ ${ar ? 'استيراد ملف نسخة' : 'Import Backup File'}
              <input type="file" accept=".sebk,.json" style="display:none;" onchange="BackupManager.importFile(this.files[0],function(err){ if(err) toast('${ar ? 'ملف نسخة غير صالح' : 'Invalid backup file'}','error'); else { toast('${ar ? 'تم استيراد النسخة بنجاح' : 'Backup imported'}'); location.reload(); } })">
            </label>
            <button class="btn btn-outline btn-sm" onclick="BackupManager.clearAll()">🗑️ ${ar ? 'مسح السجل' : 'Clear History'}</button>
          </div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:10px;">${ar ? 'يُحفظ السجل محلياً في متصفحك (آخر ' + MAX_HISTORY + ' نسخ). لنسخ كاملة على جهازك: استخدم زر تنزيل ملف النسخة.' : 'History stored locally (last ' + MAX_HISTORY + '). For off-device copies use the download button.'}</div>
          ${list.length === 0
            ? `<div style="color:var(--text-muted);font-size:12.5px;padding:14px;text-align:center;">${ar ? 'لا توجد نسخ احتياطية بعد.' : 'No backups yet.'}</div>`
            : `<div style="display:flex;flex-direction:column;gap:8px;">
              ${list.map(s => `
                <div style="display:flex;align-items:center;gap:10px;justify-content:space-between;border:1px solid var(--border);border-radius:10px;padding:9px 12px;">
                  <div style="display:flex;align-items:center;gap:8px;min-width:0;">
                    <span>${s.auto ? '🤖' : '👤'}</span>
                    <div style="min-width:0;">
                      <div style="font-weight:700;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${s.label}</div>
                      <div style="font-size:10.5px;color:var(--text-muted);">${friendlyTime()} · ${snapshotKB(s)} KB</div>
                    </div>
                  </div>
                  <div style="display:flex;gap:6px;flex-shrink:0;">
                    <button class="btn btn-gold btn-sm" onclick="BackupManager.restore('${s.id}')">↩️ ${ar ? 'استعادة' : 'Restore'}</button>
                    <button class="btn btn-outline btn-sm" onclick="BackupManager.remove('${s.id}')">🗑</button>
                  </div>
                </div>`).join('')}
            </div>`}
        </div>
      </div>`;
  }

  // ── actions with toast feedback ──
  function runBackup() {
    const s = createSnapshot('يدوي');
    const kb = snapshotKB(s);
    toast((typeof App !== 'undefined' && App.lang === 'ar')
      ? 'تم إنشاء النسخة الاحتياطية (' + kb + ' KB)'
      : 'Backup created (' + kb + ' KB)');
    if (window.__renderBackupPanel) window.__renderBackupPanel();
  }
  function restore(id) {
    const ok = restoreSnapshot(id);
    if (!ok) { toast('Snapshot not found', 'error'); return; }
    toast((typeof App !== 'undefined' && App.lang === 'ar') ? 'تمت استعادة النسخة بنجاح' : 'Snapshot restored');
    setTimeout(() => location.reload(), 600);
  }
  function remove(id) {
    deleteSnapshot(id);
    if (window.__renderBackupPanel) window.__renderBackupPanel();
  }
  function clearAll() {
    saveHistory([]);
    if (window.__renderBackupPanel) window.__renderBackupPanel();
    toast('History cleared');
  }

  // ── auto-backup: call once per session, skip duplicates within 24h ──
  function initAuto() {
    const last = Store ? Store.getKey('ps_last_auto_bk') : null;
    const now = Date.now();
    if (!last || (now - last) > 86400000) {
      createSnapshot('تلقائي يومي', true);
      if (Store) Store.setKey('ps_last_auto_bk', now);
    }
  }

  return {
    createSnapshot, restoreSnapshot, deleteSnapshot, getHistory, snapshotKB,
    exportFile, importFile, renderHistory, runBackup, restore, remove, clearAll,
    initAuto, gatherState, applyState,
  };
})();
