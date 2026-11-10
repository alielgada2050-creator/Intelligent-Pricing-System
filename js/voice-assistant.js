/* ================================================================
   العقد الموحد 2026 — المساعد الصوتي (إضافة بنود / تحديث مستخلص)
   Unified Contract 2026 — Voice Assistant
   Uses Web Speech API (webkitSpeechRecognition where available)
   Languages: Arabic (Saudi ar-SA) / Arabic (Egyptian ar-EG) / English (en-US)
   Professional dictation: full BOQ takeoff + direct codes + quantities
   ================================================================ */

const VoiceAssistant = {
  _recognition: null,
  _listening: false,
  _restartTimer: null,
  LANG_KEY: 'va_lang',

  // Ready example — steel sub-distribution panel + full cable work (matches AIEngine takeoff)
  EXAMPLE: {
    ar: 'تركيب لوحة توزيع فرعية حديدة مع حفر مفتوح 20 متر وتمديد كيبل 300مم 30 متر وعمل 2 وصلة 300 و2 نهاية وتمديد كيبل 185 مم 6 متر و1 نهاية له وتمديد كيبل 70مم 6 متر وعمل نهاية له',
    en: 'Install steel sub-distribution panel with open excavation 20 m and lay 300 mm cable 30 m make 2 joints 300 and 2 terminations and lay 185 mm cable 6 m one termination and lay 70 mm cable 6 m and make one termination'
  },

  LANGS: {
    'ar-SA': { flag: '🇸🇦', labelAr: 'العربية (سعودي)', labelEn: 'Arabic (Saudi)' },
    'ar-EG': { flag: '🇪🇬', labelAr: 'العربية (مصري)', labelEn: 'Arabic (Egyptian)' },
    'en-US': { flag: '🇬🇧', labelAr: 'الإنجليزية', labelEn: 'English (US)' }
  },

  _supported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  },

  getLang() {
    try {
      const saved = localStorage.getItem(this.LANG_KEY);
      if (saved && this.LANGS[saved]) return saved;
    } catch (e) {}
    return (typeof App !== 'undefined' && App.lang === 'en') ? 'en-US' : 'ar-SA';
  },

  setLang(lang) {
    try { localStorage.setItem(this.LANG_KEY, lang); } catch (e) {}
  },

  renderVoiceCard(slotId, mode) {
    const slot = document.getElementById(slotId);
    if (!slot) return;
    const ar = (typeof App !== 'undefined') ? App.lang === 'ar' : true;
    const supported = this._supported();
    const curLang = this.getLang();

    const langBtns = Object.entries(this.LANGS).map(([key, l]) => `
      <button class="btn btn-sm va-lang-btn${key === curLang ? ' active' : ''}" data-lang="${key}" style="font-size:10.5px;padding:4px 9px;border-color:var(--border-sec);${key === curLang ? 'border-color:var(--sec-gold);color:var(--sec-gold);font-weight:800;' : 'color:var(--text-sub);'}">
        ${l.flag} ${ar ? l.labelAr : l.labelEn}
      </button>`).join('');

    slot.innerHTML = `
      <div class="card" style="border:1px solid var(--border-sec);box-shadow:var(--shadow-sm);">
        <div class="card-head" style="background:linear-gradient(90deg,rgba(0,214,138,0.06),transparent);border-bottom:1px solid var(--border);">
          <span>🎙️</span>
          <span class="card-title">${ar ? 'المساعد الصوتي' : 'Voice Assistant'}</span>
          <span style="margin-${ar?'right':'left'}:auto;font-size:10.5px;color:var(--text-muted);">${ar ? 'إملاء كامل • اللهجة السعودية والمصرية • أمثلة جاهزة' : 'Full dictation • Saudi/Egyptian dialect • ready examples'}</span>
        </div>
        <div class="card-body" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <button class="btn btn-gold" id="va-mic" style="width:46px;height:46px;border-radius:99px;font-size:19px;padding:0;display:flex;align-items:center;justify-content:center;flex-shrink:0;" ${supported ? '' : 'disabled'} title="${ar ? 'اضغط وتحدث' : 'Click and speak'}">🎙️</button>
          <div style="flex:1;min-width:200px;">
            <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:5px;" id="va-lang-bar">${langBtns}</div>
            <div id="va-status" style="font-size:11px;color:var(--text-sub);min-height:16px;">${supported ? (ar ? 'جاهز — اختر اللهجة ثم اضغط المايك وتحدث' : 'Ready — pick a language then press the mic and speak') : (ar ? 'المتصفح لا يدعم التعرف الصوتي — استخدم Chrome أو Edge' : 'Speech recognition not supported — use Chrome or Edge')}</div>
            <div id="va-live" style="font-size:12.5px;font-weight:700;color:var(--text-h);min-height:18px;margin-top:2px;"></div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;flex-direction:column;align-items:stretch;">
            <button class="btn btn-outline btn-sm" id="va-example" style="font-size:11px;">⚡ ${ar ? 'مثال جاهز' : 'Run Example'}</button>
            <button class="btn btn-outline btn-sm" id="va-help" style="font-size:11px;">${ar ? 'أمثلة صوتية' : 'Examples'}</button>
          </div>
        </div>
      </div>
    `;

    if (!supported) return;

    const mic = slot.querySelector('#va-mic');
    const status = slot.querySelector('#va-status');
    const live = slot.querySelector('#va-live');
    const help = slot.querySelector('#va-help');
    const example = slot.querySelector('#va-example');
    const langBar = slot.querySelector('#va-lang-bar');

    // Language / dialect switch
    langBar.querySelectorAll('.va-lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setLang(btn.dataset.lang);
        if (this._listening) { try { rec.stop(); } catch (e) {} }
        langBar.querySelectorAll('.va-lang-btn').forEach(b => {
          const on = b === btn;
          b.classList.toggle('active', on);
          b.style.borderColor = on ? 'var(--sec-gold)' : 'var(--border-sec)';
          b.style.color = on ? 'var(--sec-gold)' : 'var(--text-sub)';
          b.style.fontWeight = on ? '800' : '400';
        });
        status.textContent = ar
          ? `✓ اللغة: ${this.LANGS[btn.dataset.lang].labelAr} — اضغط المايك`
          : `✓ Language: ${this.LANGS[btn.dataset.lang].labelEn} — press mic`;
        if (typeof this._recognition !== 'undefined' && this._recognition) {
          this._recognition.lang = btn.dataset.lang;
        }
      });
    });

    const loadExample = () => {
      const l = this.getLang();
      const isEn = l === 'en-US';
      const ex = (mode === 'cert')
        ? (isEn ? 'item 304010101 pct 50 and item 305020401 pct 100' : 'بند 304010101 نسبة 50 و بند 305020401 نسبة 100')
        : (isEn ? this.EXAMPLE.en : this.EXAMPLE.ar);
      if (typeof AIEngine !== 'undefined') {
        const tk = AIEngine.smartTakeoff(ex);
        if (tk.items.length) {
          if (mode === 'cert') {
            if (typeof App._certItems === 'undefined') { toast(ar ? 'اختر مقايسة أولاً' : 'Select a BOQ first', 'warning'); return; }
            tk.items.forEach(it => {
              const t = App._certItems.find(i => i.code === it.code);
              if (t) t.pct = 100;
            });
            App._renderCertItems();
            toast(ar ? `✅ طُبّق المثال على ${tk.items.length} بند` : `✅ Example applied to ${tk.items.length} items`, 'success');
          } else {
            let added = 0;
            const codes = [];
            tk.items.forEach(it => {
              if (!getItemByCode(it.code)) return;
              codes.push(it.code + '×' + (it.qty || 1));
              if (App.state.boq.items.some(x => x.code === it.code)) return;
              App.state.boq.items.push({ code: it.code, qty: it.qty || 1, customPrice: null, note: '🎙️ مساعد صوتي' });
              added++;
            });
            App._renderBOQTable();
            App.runDepsCheck();
            toast(ar
              ? `✅ تم حصر ${tk.items.length} بند: ${codes.join('، ')}`
              : `✅ Takeoff ${tk.items.length} items: ${codes.join(', ')}`,
              added ? 'success' : 'warning', 7000);
          }
          return;
        }
      }
      toast(ar ? '⚡ مثال: «تركيب لوحة توزيع فرعية حديدة مع حفر مفتوح 20 متر» ثم «تمديد كيبل 300مم 30 متر، 2 وصلة 300، 2 نهاية»' : '⚡ Example: "install steel panel with open excavation 20 m" then "lay 300 mm cable 30 m, 2 joints 300, 2 terminations"', 'info', 6000);
    };

    example.addEventListener('click', loadExample);

    help.addEventListener('click', () => {
      toast(mode === 'cert'
        ? (ar ? 'مثال: «بند 304010101 نسبة 50» أو «بند 305020401 نسبة 100»' : 'e.g. "item 304010101 pct 50"')
        : (ar ? 'أمثلة: «لوحة توزيع فرعية حديدة» • «حفر مفتوح 20 متر» • «تمديد كيبل 300مم 30 متر» • «2 وصلة 300» • «2 نهاية 300» • «بند 304010201 كمية 5»' : 'e.g. "steel panel", "open excavation 20 m", "lay 300 mm cable 30 m", "2 joints 300", "2 terminations", "item 304010201 qty 5"'), 'info', 7000);
    });

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = this.getLang();
    rec.interimResults = true;      // live feedback
    rec.maxAlternatives = 5;        // better accuracy
    rec.continuous = false;
    this._recognition = rec;

    let finalText = '';

    const setMicState = (on) => {
      mic.textContent = on ? '🔴' : '🎙️';
      mic.classList.toggle('va-pulse', on);
    };

    rec.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const best = Array.from(res)
          .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
        const t = best ? best.transcript : '';
        if (res.isFinal) final += t + ' ';
        else interim += t;
      }
      if (interim) live.textContent = (ar ? '🗣️ ' : '🗣️ ') + interim + '…';
      if (final.trim()) {
        finalText = (finalText ? finalText + ' ' : '') + final.trim();
        live.textContent = '✓ ' + finalText;
        // When the final utterance is ready, process it
        if (!rec.continuous) {
          setTimeout(() => {
            if (finalText.trim()) this._handle(finalText.trim(), mode, status, live);
            finalText = '';
          }, 250);
        }
      }
    };

    rec.onerror = (e) => {
      const msg = e.error || 'error';
      status.textContent = '❌ ' + msg;
      setMicState(false);
      this._listening = false;
      if (msg === 'not-allowed') {
        status.textContent = ar ? '❌ تم رفض إذن الميكروفون' : '❌ Microphone permission denied';
      } else if (msg === 'no-speech') {
        status.textContent = ar ? 'لم أسمع صوتاً — حاول مجدداً' : 'No speech detected — try again';
      }
      if (this._listening) this._listening = false;
    };

    rec.onend = () => {
      setMicState(false);
      this._listening = false;
      live.textContent = '';
      // Auto-restart while user keeps listening (clicked once)
      if (this._autoListen) {
        try {
          this._listening = true;
          setMicState(true);
          rec.start();
        } catch (err) {}
      }
    };

    mic.addEventListener('click', () => {
      if (this._listening) {
        this._autoListen = false;
        try { rec.stop(); } catch (e) {}
        return;
      }
      try {
        this._listening = true;
        this._autoListen = true;
        setMicState(true);
        status.textContent = ar
          ? `أستمع الآن (${this.LANGS[rec.lang] ? this.LANGS[rec.lang].labelAr : rec.lang})...`
          : `Listening (${this.LANGS[rec.lang] ? this.LANGS[rec.lang].labelEn : rec.lang})...`;
        rec.start();
      } catch (err) { this._listening = false; }
    });
  },

  /* ────────────────────────────────────────────────
     Command processing (Arabic dialects + English)
     ──────────────────────────────────────────────── */
  _handle(text, mode, statusEl, liveEl) {
    const ar = (typeof App !== 'undefined') ? App.lang === 'ar' : true;
    const lang = this.getLang();
    const raw = String(text || '').trim();
    if (!raw) return;

    // Try English-first pattern when English is selected, then Arabic/dual
    const isEn = lang === 'en-US';
    let norm = normalizeArabic(raw);
    // For English, also try raw text for English keyword matching
    const normEn = raw.toLowerCase();

    const pick = (r) => (statusEl ? statusEl.textContent = r : null);

    // 1) Direct item code + optional qty/pct
    const codeMatch = norm.match(/\b(\d{9})\b/) || norm.match(/\b(\d{8})\b/);
    if (codeMatch && getItemByCode(codeMatch[1])) {
      const code = codeMatch[1];
      // Strip the code so qty/pct regexes don't collide with its digits
      const after = norm.replace(code, ' ');
      const qtyMatch = after.match(/(?:كميه|كمية|quantity|qty|عدد|عدد\s*ال|تعديل)?\s*(\d+(?:[.,]\d+)?)/);
      const pctMatch = after.match(/(?:نسبه|نسبة|pct|بالميه|٪|%)?\s*(\d{1,3})\s*(?:٪|%|بالميه)?/);
      if (mode === 'cert') {
        if (typeof App._certItems === 'undefined') { toast(ar ? 'اختر مقايسة أولاً' : 'Select a BOQ first', 'warning'); return; }
        const target = App._certItems.find(i => i.code === code);
        if (!target) { toast(ar ? 'البند غير موجود بالمستخلص' : 'Item not in certificate', 'warning'); return; }
        const pct = pctMatch ? parseFloat(pctMatch[1]) : (qtyMatch ? parseFloat(qtyMatch[1]) : 100);
        target.pct = Math.max(0, Math.min(100, pct));
        App._renderCertItems();
        pick(`${ar ? '✓ نسبة' : '✓ Pct'} ${code}: ${target.pct}%`);
        toast(`${ar ? 'تم تحديث نسبة' : 'Updated pct of'} ${code}: ${target.pct}%`, 'success');
      } else {
        const exists = App.state.boq.items.find(i => i.code === code);
        const qty = qtyMatch ? parseFloat(qtyMatch[1].replace(',', '.')) : 1;
        if (exists) {
          exists.qty = qty;
          pick(`${ar ? '✓ تحديث كمية' : '✓ Qty updated'} ${code} → ${qty}`);
          toast(`${ar ? 'تم تحديث كمية' : 'Updated qty'} ${code} → ${qty}`, 'success');
        } else {
          App.state.boq.items.push({ code, qty, customPrice: null, note: '🎙️ مساعد صوتي' });
          pick(`${ar ? '✓ تمت إضافة' : '✓ Added'} ${getItemByCode(code).arDesc.slice(0, 30)} (${qty})`);
          toast(`${ar ? 'تمت إضافة' : 'Added'} ${getItemByCode(code).arDesc.slice(0, 30)} (${qty})`, 'success');
        }
        App._renderBOQTable();
        App.runDepsCheck();
      }
      return;
    }

    // 2) Full BOQ dictation via AIEngine smart takeoff
    if (typeof AIEngine !== 'undefined') {
      const tk = AIEngine.smartTakeoff(isEn ? raw : norm);
      if (tk.items.length) {
        if (mode === 'cert') {
          if (typeof App._certItems === 'undefined') { toast(ar ? 'اختر مقايسة أولاً' : 'Select a BOQ first', 'warning'); return; }
          tk.items.forEach(it => {
            const t = App._certItems.find(i => i.code === it.code);
            if (t) t.pct = 100;
          });
          App._renderCertItems();
          pick(`${ar ? '✓ تم تحديث' : '✓ Updated'} ${tk.items.length} ${ar ? 'بند' : 'items'}`);
          toast(`${ar ? 'تم تحديث' : 'Updated'} ${tk.items.length} ${ar ? 'بند' : 'items'} ${ar ? 'بالمستخلص' : 'in certificate'}`, 'success');
          return;
        }
        let added = 0;
        tk.items.forEach(it => {
          if (!getItemByCode(it.code)) return;
          if (App.state.boq.items.some(x => x.code === it.code)) return;
          App.state.boq.items.push({ code: it.code, qty: it.qty || 1, customPrice: null, note: '🎙️ مساعد صوتي' });
          added++;
        });
        App._renderBOQTable();
        App.runDepsCheck();
        pick(`${ar ? '✓ تم حصر' : '✓ Takeoff'} ${tk.items.length} ${ar ? 'بند' : 'items'}`);
        if (added) {
          toast(ar ? `🎙️ تمت إضافة ${added} بند بالإملاء الصوتي` : `🎙️ Added ${added} items by dictation`, 'success');
        } else {
          toast(ar ? 'البند موجود مسبقاً — حدّث الكمية برمز مباشر' : 'Items already exist — use a direct code to update qty', 'warning');
        }
        return;
      }
    }

    // 3) Fallback — maybe a "clear / مسح" or help command
    if (/مسح|امسح|حذف الكل|clear all|clear/i.test(norm)) {
      App.clearBOQ();
      pick(ar ? '✓ تم مسح المقايسة' : '✓ BOQ cleared');
      return;
    }

    pick(ar ? 'لم أتعرف — قل رمز البند (9 أرقام) أو وصفاً كاملاً' : 'Not recognized — say a 9-digit code or a full description');
    toast(ar ? 'لم أتعرف على رقم بند صحيح أو وصف معروف' : 'No valid item code or recognizable description', 'warning');
  },
};

window.VoiceAssistant = VoiceAssistant;
